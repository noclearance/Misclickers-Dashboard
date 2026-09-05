import React, { useState, useEffect } from 'react';
import { Clock, Disc, LogOut, Menu, X, Bot } from 'lucide-react';
import type { View } from '../types';

interface HeaderProps {
  clanName: string;
  discordUser: { username: string; avatarUrl: string } | null;
  onConnectClick: () => void;
  onDisconnect: () => void;
  onOpenBotModal?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  currentView?: View;
  onSelectView?: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({
  clanName,
  discordUser,
  onConnectClick,
  onDisconnect,
  onOpenBotModal,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  currentView = 'dashboard',
  onSelectView,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const world = 677;

  const viewLabelMap: Record<View, string> = {
    dashboard: 'Headquarters',
    leaderboard: 'Highscores',
    raffles: 'Raffles',
    bingo: 'Bingo',
    prices: 'Prices',
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header id="app-header" className="bg-osrs-panel border-b border-osrs-gold/10 px-4 sm:px-6 py-3.5 flex flex-col gap-2.5 select-none shrink-0 z-30">
      <div className="flex items-center justify-between gap-3">
        <div id="header-clan" className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-osrs-dark border border-osrs-gold/20 text-osrs-gold hover:bg-osrs-panelLight transition-all active:scale-95 shadow"
              aria-label="Toggle navigation menu"
              title="Open Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <img
              src="/src/assets/images/mislick_crest_1783924581674.jpg"
              alt="The Mislickerz Crest"
              className="w-8 h-8 rounded-full border border-osrs-gold/30 shadow-sm object-cover hidden sm:block"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold to-yellow-200 tracking-wider">
                  {clanName.toUpperCase()}
                </h2>
                <span className="hidden sm:inline-block text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-osrs-gold/10 border border-osrs-gold/20 text-osrs-gold">
                  OFFICIAL HUB
                </span>
              </div>
              <p className="hidden md:block text-xs text-gray-400 mt-0.5">Discord & RuneLite Live Integration</p>
            </div>
          </div>
        </div>

        <div id="header-controls" className="flex items-center gap-2 sm:gap-3">
          {onOpenBotModal && (
            <button
              onClick={onOpenBotModal}
              className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-indigo-900/35 to-purple-900/30 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
              title="View Venny Discord Bot sync status, API endpoints, and webhook tester"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-[11px] hidden md:inline">Venny Bot</span>
            </button>
          )}

          <div id="header-status-cluster" className="hidden sm:flex items-center rounded-xl border border-osrs-gold/15 bg-osrs-dark/80 overflow-hidden shadow-inner">
            <div className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 border-r border-osrs-gold/15">
              <span className="w-1.5 h-1.5 rounded-full bg-osrs-poison animate-pulse"></span>
              <span className="text-[10px] sm:text-[11px] text-osrs-poison font-mono font-bold uppercase tracking-wide">Online</span>
            </div>
            <div className="px-2.5 sm:px-3 py-1.5 border-r border-osrs-gold/15">
              <span className="text-[10px] sm:text-[11px] text-osrs-gold font-mono font-bold tracking-wide">W{world}</span>
            </div>
            <div id="osrs-game-clock" className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-osrs-gold shrink-0" />
              <span className="text-[10px] sm:text-[11px] text-gray-200 font-mono font-semibold tracking-wide whitespace-nowrap">
                {utcTime || '00:00:00'} UTC
              </span>
            </div>
          </div>

          <div id="header-discord-identity">
            {discordUser ? (
              <div className="flex items-center gap-2 bg-[#5865F2]/10 border border-[#5865F2]/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all hover:bg-[#5865F2]/15">
                <img
                  src={discordUser.avatarUrl}
                  alt={discordUser.username}
                  className="w-5 h-5 rounded-full border border-[#5865F2] shrink-0"
                />
                <div className="max-w-[70px] sm:max-w-[120px]">
                  <p className="text-[10px] text-white font-bold truncate leading-tight">@{discordUser.username}</p>
                  <span className="text-[8px] text-[#9ca8ff] font-mono block leading-none font-semibold uppercase tracking-wide">
                    Discord
                  </span>
                </div>
                <button
                  onClick={onDisconnect}
                  className="text-gray-400 hover:text-red-400 transition-colors p-0.5 ml-0.5"
                  title="Disconnect Discord Link"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectClick}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shadow-[0_4px_12px_rgba(88,101,242,0.2)] active:scale-95 shrink-0"
              >
                <Disc className="w-4 h-4 text-white" />
                <span className="font-sans hidden sm:inline">Connect Discord</span>
                <span className="font-sans sm:hidden text-[11px]">Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {onSelectView && (
        <div className="hidden lg:flex items-center justify-end text-[10px] font-mono text-gray-500">
          <span className="uppercase tracking-widest">
            Sidebar nav · Current view: <span className="text-gray-300">{viewLabelMap[currentView]}</span>
          </span>
        </div>
      )}
    </header>
  );
};
