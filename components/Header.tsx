import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Award, Radio, Disc, LogOut, User, Menu, X, LayoutDashboard, Trophy, Sparkles, Grid, Coins, Bot } from 'lucide-react';
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
  onSelectView
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [world, setWorld] = useState<number>(345);

  const quickNavTabs: Array<{ id: View; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'HQ', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Highscores', icon: Trophy },
    { id: 'raffles', label: 'Raffles', icon: Sparkles },
    { id: 'bingo', label: 'Bingo', icon: Grid },
    { id: 'prices', label: 'Prices', icon: Coins },
  ];

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
    <header id="app-header" className="bg-osrs-panel border-b border-osrs-gold/15 px-4 sm:px-6 py-3.5 flex flex-col gap-3 select-none shrink-0 z-30">
      
      {/* Top Row: Mobile Toggle + Clan identity + Controls */}
      <div className="flex items-center justify-between gap-3">
        
        {/* Left Side: Mobile Menu Button & Clan Branding */}
        <div id="header-clan" className="flex items-center gap-3">
          
          {/* Mobile hamburger menu toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-osrs-dark border border-osrs-gold/25 text-osrs-gold hover:bg-osrs-panelLight transition-all active:scale-95 shadow"
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

        {/* Stats, Time, and Discord Auth Widget */}
        <div id="header-controls" className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Venny Bot Bridge Trigger Button */}
          {onOpenBotModal && (
            <button
              onClick={onOpenBotModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
              title="View Venny Discord Bot sync status, API endpoints, and webhook tester"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-[11px] hidden md:inline">Venny Bot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          )}

          {/* Game Server Status */}
          <div className="hidden xl:flex items-center gap-2 bg-osrs-dark/50 border border-osrs-gold/10 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-osrs-poison animate-pulse" />
            <span className="text-gray-400">Home World:</span>
            <button 
              onClick={() => setWorld(prev => prev === 345 ? 420 : prev === 420 ? 302 : 345)}
              className="text-osrs-gold hover:text-yellow-200 transition-colors font-bold outline-none"
              title="Click to switch home world"
            >
              W{world}
            </button>
          </div>

          {/* Live Game Time */}
          <div id="osrs-game-clock" className="flex items-center gap-1.5 sm:gap-2 bg-osrs-dark/80 border border-osrs-gold/15 py-1.5 px-2.5 sm:px-3.5 rounded-xl shadow-inner">
            <Clock className="w-3.5 h-3.5 text-osrs-gold animate-pulse shrink-0" />
            <span className="text-xs text-osrs-gold font-mono font-bold tracking-wider whitespace-nowrap">
              {utcTime || '00:00:00'} UTC
            </span>
          </div>

          {/* Connect Discord Button / Identity Pill */}
          <div id="header-discord-identity">
            {discordUser ? (
              <div className="flex items-center gap-2 bg-[#5865F2]/10 border border-[#5865F2]/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all hover:bg-[#5865F2]/15">
                <img 
                  src={discordUser.avatarUrl} 
                  alt={discordUser.username} 
                  className="w-5 h-5 rounded-full border border-[#5865F2] shrink-0" 
                />
                <div className="max-w-[70px] sm:max-w-[120px]">
                  <p className="text-[10px] text-white font-bold truncate leading-tight">
                    @{discordUser.username}
                  </p>
                  <span className="text-[8px] text-[#5865F2] font-mono block leading-none font-semibold">Synced</span>
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
                <Disc className="w-4 h-4 text-white animate-pulse" />
                <span className="font-sans hidden sm:inline">Connect Discord</span>
                <span className="font-sans sm:hidden text-[11px]">Sync</span>
              </button>
            )}
          </div>

        </div>
      </div>


      {/* Quick Navigation Tabs Bar (Visible on all screens for fast 1-click view changing) */}
      {onSelectView && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 custom-scrollbar">
          <span className="text-[9px] uppercase font-mono tracking-wider text-gray-500 font-bold hidden sm:inline-block pr-1">
            Go to:
          </span>
          {quickNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all outline-none border ${
                  isActive
                    ? 'bg-osrs-panelLight border-osrs-gold/40 text-osrs-gold shadow-glow-gold'
                    : 'bg-osrs-dark/50 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-osrs-panelLight/40 hover:border-osrs-gold/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-osrs-gold' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

    </header>
  );
};
