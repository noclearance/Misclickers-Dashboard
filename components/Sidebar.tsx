import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Grid, Coins, Trophy, Sparkles, Shield, MousePointerClick, AlertTriangle, Disc, LogOut, X, Bot } from 'lucide-react';
import type { DiscordSessionUser, HubMode, View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  discordUser: DiscordSessionUser | null;
  hubMode: HubMode;
  onConnectClick: () => void;
  onDisconnect: () => void;
  onOpenBotModal?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  discordUser, 
  hubMode,
  onConnectClick, 
  onDisconnect,
  onOpenBotModal,
  isOpen = false,
  onClose
}) => {
  const menuItems: Array<{ id: View; label: string; icon: React.ElementType; badge?: string; badgeColor?: string }> = [
    { id: 'dashboard', label: 'Headquarters', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Clan Highscores', icon: Trophy, badge: 'Ranks', badgeColor: 'bg-osrs-rune/15 text-osrs-rune border-osrs-rune/30' },
    { id: 'raffles', label: 'Grand Raffles', icon: Sparkles, badge: 'Events', badgeColor: 'bg-osrs-rune/10 text-osrs-rune border-osrs-rune/25' },
    { id: 'bingo', label: 'Active Bingo', icon: Grid },
    { id: 'prices', label: 'GE Price Checker', icon: Coins },
  ];

  // Misclick timer state
  const [secondsSinceMisclick, setSecondsSinceMisclick] = useState<number>(10432); // Mock initial value (~2h 53m)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceMisclick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (totalSecs: number) => {
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const handleManualMisclickReset = () => {
    setSecondsSinceMisclick(0);
    // Dispatches custom event to notify other components (like Dashboard log feed) if they are listening
    window.dispatchEvent(new CustomEvent('misclickLogged', { detail: { time: new Date() } }));
  };

  const handleSelectView = (view: View) => {
    setCurrentView(view);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element (responsive fixed on mobile/tablet, static on lg) */}
      <aside 
        id="sidebar-container" 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-osrs-panel border-r border-white/10 flex flex-col h-full shrink-0 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        
        {/* Visual Identity Logo Head */}
        <div id="sidebar-header" className="px-4 py-3.5 border-b border-osrs-gold/10 flex items-center justify-between gap-3 relative bg-osrs-dark/40">
          <div className="flex items-center gap-3 min-w-0">
            {/* Crest Emblem */}
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-osrs-gold/15 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src="/src/assets/images/mislick_crest_1783924581674.jpg" 
                alt="Misclickerz Crest" 
                className="w-11 h-11 rounded-full border-2 border-osrs-gold/40 group-hover:border-osrs-gold/70 transition-colors shadow-md object-cover relative z-10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 bg-osrs-crimson text-white p-0.5 rounded-full border border-osrs-panel z-20 shadow">
                <MousePointerClick className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-serif font-black text-sm sm:text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold via-yellow-200 to-amber-500 osrs-shadow leading-tight truncate">
                MISCLICKERZ
              </h1>
              <span className="text-[9px] uppercase font-mono tracking-widest text-osrs-gold/70 block mt-0.5">
                Clan Hub & Bot
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg bg-osrs-dark text-gray-400 hover:text-white border border-osrs-gold/15 shrink-0"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Links */}
        <nav id="sidebar-nav" className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[9px] uppercase font-mono tracking-wider text-gray-500 font-bold">
              Clan Navigation
            </span>
            <span className="text-[9px] font-mono text-gray-500">5 Modules</span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                id={`nav-item-${item.id}`}
                key={item.id}
                onClick={() => handleSelectView(item.id)}
                className={`nav-shell-item w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide group outline-none border ${
                  isActive
                    ? 'nav-shell-item-active'
                    : 'nav-shell-item-inactive hover:text-gray-200 hover:bg-osrs-panelLight/50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`nav-shell-icon w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-osrs-gold' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="font-sans truncate">{item.label}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor || 'bg-osrs-dark text-gray-400 border-gray-700'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-osrs-gold"></span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Venny Bot Bridge Link */}
          {hubMode === 'staff' && onOpenBotModal && (
            <button
              onClick={() => {
                onOpenBotModal();
                if (onClose) onClose();
              }}
              className="venny-chrome w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group outline-none border hover:text-white hover:border-osrs-magic/70 mt-2 shadow-md"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Bot className="w-4 h-4 shrink-0 text-osrs-magic group-hover:scale-110 transition-transform" />
                <span className="font-sans truncate font-bold">Venny Bot Bridge</span>
              </div>
              <span className="venny-chrome-subtle text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-osrs-rune"></span>
                REST API
              </span>
            </button>
          )}
        </nav>

        {/* Misclick Tracker Widget */}
        <div className="px-3 pb-2.5">
          <div className="bg-osrs-dark/80 border border-osrs-crimson/20 rounded-2xl p-2.5 space-y-2 relative overflow-hidden animate-crimson-glow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-osrs-crimson/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between text-osrs-crimson text-[10px] font-mono uppercase tracking-wider font-bold">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-osrs-crimson animate-bounce" />
                <span>Misclick Ticker</span>
              </div>
              <span className="text-[8px] bg-osrs-crimson/15 px-1.5 py-0.5 rounded border border-osrs-crimson/30">Live</span>
            </div>
            
            <div>
              <div className="text-[9px] text-gray-500 font-mono">Time Since Last Incident:</div>
              <div className="text-xs font-mono font-extrabold text-gray-200 tracking-tight mt-0.5 select-all">
                {formatDuration(secondsSinceMisclick)}
              </div>
            </div>

            <button
              onClick={handleManualMisclickReset}
              className="w-full bg-osrs-crimson hover:bg-red-600 active:scale-95 text-white font-sans text-[10px] uppercase tracking-wider font-extrabold py-1.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5"
            >
              <MousePointerClick className="w-3 h-3" />
              I Just Misclicked!
            </button>
          </div>
        </div>

        {/* Sync State Footer */}
        <div id="sidebar-footer" className="p-3 border-t border-osrs-gold/10 bg-osrs-dark/40">
          <div className="space-y-2.5">
            
            {discordUser ? (
              <div className="bg-[#2b2d31]/30 border border-[#5865F2]/20 p-2.5 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src={discordUser.avatarUrl} 
                    alt={discordUser.username} 
                    className="w-7 h-7 rounded-full border border-[#5865F2] shrink-0" 
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-white font-black truncate">
                      @{discordUser.username}
                    </div>
                    <span className="text-[8px] text-[#5865F2] font-mono block leading-none font-semibold">Connected</span>
                  </div>
                </div>
                <button 
                  onClick={onDisconnect}
                  className="text-gray-500 hover:text-red-400 p-1"
                  title="Disconnect Link"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectClick}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-[10px] font-mono font-bold uppercase py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Disc className="w-3.5 h-3.5 animate-pulse" />
                Sync Discord Acc
              </button>
            )}

            <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
              <span>RuneLite Bridge:</span>
              <span className={`flex items-center gap-1 font-bold ${
                hubMode === 'staff' ? 'text-osrs-rune' : 'text-gray-400'
              }`}>
                <span className={`w-1 h-1 rounded-full ${
                  hubMode === 'staff' ? 'bg-osrs-rune' : 'bg-gray-500'
                }`}></span>
                {hubMode === 'guest' ? 'Disconnected' : hubMode === 'member' ? 'Unknown' : 'Manage in Hub'}
              </span>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
};
