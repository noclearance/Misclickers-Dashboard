import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ClanLeaderboard } from './components/ClanLeaderboard';
import { RaffleComponent } from './components/RaffleComponent';
import { BingoBoard } from './components/BingoBoard';
import { PriceChecker } from './components/PriceChecker';
import { DiscordModal } from './components/DiscordModal';
import { VennyBotModal } from './components/VennyBotModal';
import { GlobalLoadingProvider } from './context/GlobalLoadingProvider';
import { onUnauthorized, UnauthorizedEventDetail } from './services/httpClient';
import { fetchAuthMe, logoutAuthSession } from './services/api';
import { ShieldAlert, X, KeyRound } from 'lucide-react';
import type { DiscordSessionUser, View } from './types';
import { useHubMode } from './hooks/useHubMode';

const AUTH_ERROR_KEYS = new Set([
  'denied',
  'not_in_guild',
  'missing_env',
  'redirect_mismatch',
  'state',
  'token',
  'unknown',
]);

function readAuthQuery(): { ok: boolean; error: string | null } {
  try {
    const params = new URLSearchParams(window.location.search);
    const errorRaw = params.get('auth_error');
    const ok = params.get('auth') === 'ok';
    const error = errorRaw && AUTH_ERROR_KEYS.has(errorRaw) ? errorRaw : errorRaw ? 'unknown' : null;
    return { ok, error };
  } catch {
    return { ok: false, error: null };
  }
}

function clearAuthQuery(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('auth') && !url.searchParams.has('auth_error')) return;
    url.searchParams.delete('auth');
    url.searchParams.delete('auth_error');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch {
    // ignore
  }
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [discordUser, setDiscordUser] = useState<DiscordSessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState<boolean>(false);
  const [isVennyModalOpen, setIsVennyModalOpen] = useState<boolean>(false);
  const [unauthorizedError, setUnauthorizedError] = useState<UnauthorizedEventDetail | null>(null);
  const { mode: hubMode, isStaff } = useHubMode(discordUser);

  const refreshSession = useCallback(async () => {
    try {
      const me = await fetchAuthMe();
      if (me.authenticated && me.user) {
        setDiscordUser({
          id: me.user.id,
          username: me.user.username,
          avatarUrl: me.user.avatarUrl,
          roleIds: me.user.roleIds || [],
        });
        localStorage.removeItem('discord_user');
      } else {
        setDiscordUser(null);
      }
    } catch {
      setDiscordUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    const { ok, error } = readAuthQuery();
    if (error) {
      setAuthError(error);
      setIsDiscordModalOpen(true);
    }
    if (ok || error) {
      clearAuthQuery();
    }
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const unsubscribe = onUnauthorized((detail) => {
      setUnauthorizedError(detail);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isStaff) {
      setIsVennyModalOpen(false);
    }
  }, [isStaff]);

  const openLogin = () => {
    setIsDiscordModalOpen(true);
  };

  const handleDisconnect = async () => {
    try {
      await logoutAuthSession();
    } catch {
      // still clear local UI state
    }
    setDiscordUser(null);
    localStorage.removeItem('discord_user');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            discordUser={discordUser}
            mode={hubMode}
            onConnectClick={openLogin}
            onOpenBotModal={isStaff ? () => setIsVennyModalOpen(true) : undefined}
            onNavigateToBingo={() => setCurrentView('bingo')}
          />
        );
      case 'leaderboard':
        return (
          <div className="space-y-6">
            <ClanLeaderboard />
          </div>
        );
      case 'raffles':
        return (
          <div className="space-y-6">
            <RaffleComponent
              discordUser={discordUser}
              onConnectClick={openLogin}
            />
          </div>
        );
      case 'bingo':
        return (
          <div>
            <BingoBoard mode={hubMode} />
          </div>
        );
      case 'prices':
        return (
          <div>
            <PriceChecker />
          </div>
        );
      default:
        return (
          <Dashboard
            discordUser={discordUser}
            mode={hubMode}
            onConnectClick={openLogin}
            onOpenBotModal={isStaff ? () => setIsVennyModalOpen(true) : undefined}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-osrs-dark text-gray-100 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        discordUser={discordUser}
        hubMode={hubMode}
        onConnectClick={openLogin}
        onDisconnect={handleDisconnect}
        onOpenBotModal={isStaff ? () => setIsVennyModalOpen(true) : undefined}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          clanName="Misclickerz"
          discordUser={discordUser}
          hubMode={hubMode}
          onConnectClick={openLogin}
          onDisconnect={handleDisconnect}
          onOpenBotModal={isStaff ? () => setIsVennyModalOpen(true) : undefined}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        {unauthorizedError && isStaff && (
          <div id="global-unauthorized-banner" className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-200 animate-fadeIn z-20">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="font-semibold text-rose-100">401 Unauthorized:</strong>{' '}
                {unauthorizedError.message || 'API request rejected. Please verify your VITE_VENNY_API_KEY.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVennyModalOpen(true)}
                className="flex items-center gap-1 bg-rose-800/60 hover:bg-rose-700/80 text-rose-100 px-2.5 py-1 rounded text-[11px] font-medium transition-colors border border-rose-500/30"
              >
                <KeyRound className="w-3 h-3" />
                <span>Configure Key</span>
              </button>
              <button
                onClick={() => setUnauthorizedError(null)}
                className="text-rose-400 hover:text-rose-200 p-1 transition-colors"
                aria-label="Dismiss unauthorized warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-osrs-dark p-3.5 sm:p-6 lg:p-8 custom-scrollbar">
          <div key={currentView} className="motion-module-enter">
            {!authReady ? (
              <div className="text-xs text-gray-500 font-mono py-8 text-center">Checking Discord session…</div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>

      <DiscordModal
        isOpen={isDiscordModalOpen}
        onClose={() => {
          setIsDiscordModalOpen(false);
          setAuthError(null);
        }}
        authError={authError}
      />

      {isStaff && (
        <VennyBotModal
          isOpen={isVennyModalOpen}
          onClose={() => setIsVennyModalOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GlobalLoadingProvider minShimmerDuration={400}>
      <AppContent />
    </GlobalLoadingProvider>
  );
};

export default App;
