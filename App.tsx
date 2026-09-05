
import React, { useState, useEffect } from 'react';
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
import { ShieldAlert, X, KeyRound } from 'lucide-react';
import type { View } from './types';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [discordUser, setDiscordUser] = useState<{ username: string; avatarUrl: string } | null>(() => {
    try {
      const saved = localStorage.getItem('discord_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState<boolean>(false);
  const [isVennyModalOpen, setIsVennyModalOpen] = useState<boolean>(false);
  const [unauthorizedError, setUnauthorizedError] = useState<UnauthorizedEventDetail | null>(null);

  // Global listener for 401 Unauthorized API responses
  useEffect(() => {
    const unsubscribe = onUnauthorized((detail) => {
      setUnauthorizedError(detail);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthorize = (user: { username: string; avatarUrl: string }) => {
    setDiscordUser(user);
    localStorage.setItem('discord_user', JSON.stringify(user));
  };

  const handleDisconnect = () => {
    setDiscordUser(null);
    localStorage.removeItem('discord_user');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            discordUser={discordUser} 
            onConnectClick={() => setIsDiscordModalOpen(true)}
            onOpenBotModal={() => setIsVennyModalOpen(true)}
            onNavigateToBingo={() => setCurrentView('bingo')}
          />
        );
      case 'leaderboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            <ClanLeaderboard />
          </div>
        );
      case 'raffles':
        return (
          <div className="space-y-6 animate-fadeIn">
            <RaffleComponent 
              discordUser={discordUser} 
              onConnectClick={() => setIsDiscordModalOpen(true)} 
            />
          </div>
        );
      case 'bingo':
        return (
          <div className="animate-fadeIn">
            <BingoBoard />
          </div>
        );
      case 'prices':
        return (
          <div className="animate-fadeIn">
            <PriceChecker />
          </div>
        );
      default:
        return (
          <Dashboard 
            discordUser={discordUser} 
            onConnectClick={() => setIsDiscordModalOpen(true)} 
            onOpenBotModal={() => setIsVennyModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-osrs-dark text-gray-100 font-sans overflow-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        discordUser={discordUser} 
        onConnectClick={() => setIsDiscordModalOpen(true)} 
        onDisconnect={handleDisconnect}
        onOpenBotModal={() => setIsVennyModalOpen(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header 
          clanName="Misclickerz" 
          discordUser={discordUser}
          onConnectClick={() => setIsDiscordModalOpen(true)}
          onDisconnect={handleDisconnect}
          onOpenBotModal={() => setIsVennyModalOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        {/* Global 401 Unauthorized Notification Banner */}
        {unauthorizedError && (
          <div id="global-unauthorized-banner" className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-rose-200 animate-fadeIn z-20">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong className="font-semibold text-rose-100">401 Unauthorized:</strong> {unauthorizedError.message || 'API request rejected. Please verify your VITE_VENNY_API_KEY.'}
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
          {renderContent()}
        </main>
      </div>

      {/* Discord Authorization Modal */}
      <DiscordModal 
        isOpen={isDiscordModalOpen} 
        onClose={() => setIsDiscordModalOpen(false)} 
        onAuthorize={handleAuthorize} 
      />

      {/* Venny Bot Backend Bridge Modal */}
      <VennyBotModal
        isOpen={isVennyModalOpen}
        onClose={() => setIsVennyModalOpen(false)}
      />
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

