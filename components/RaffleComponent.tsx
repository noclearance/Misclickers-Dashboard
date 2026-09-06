import React, { useState, useEffect } from 'react';
import { Sparkles, Coins, Flame, Disc, CheckCircle, ShieldAlert, Clock, ArrowUpRight, Trophy, Heart } from 'lucide-react';
import type { DiscordSessionUser, Raffle } from '../types';
import { getRaffles, enterRaffle } from '../services/api';

interface RaffleComponentProps {
  discordUser: DiscordSessionUser | null;
  onConnectClick: () => void;
}

interface ExtendedRaffle extends Raffle {
  potValueGp: string;
  prizeDetail: string;
  countdownSeconds: number;
}

export const RaffleComponent: React.FC<RaffleComponentProps> = ({ discordUser, onConnectClick }) => {
  const [raffles, setRaffles] = useState<ExtendedRaffle[]>([]);
  const [userEntries, setUserEntries] = useState<{ [key: number]: number }>({});
  const [recentEntries, setRecentEntries] = useState<Array<{ id: string; username: string; item: string; tickets: number; time: string }>>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaffles = async () => {
      try {
        const baseRaffles = await getRaffles();
        const enriched: ExtendedRaffle[] = (baseRaffles || []).map(r => ({
          ...r,
          potValueGp: 'TBD GP',
          prizeDetail: 'Clan Raffle Event Prize',
          countdownSeconds: 86400,
        }));
        setRaffles(enriched);
      } catch (err) {
        console.error('Failed to load raffles', err);
      }
    };

    fetchRaffles();
  }, []);

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRaffles(prev => 
        prev.map(r => ({
          ...r,
          countdownSeconds: Math.max(0, r.countdownSeconds - 1)
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'ENDED';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleEnterRaffle = (raffleId: number, itemName: string, cost: number) => {
    if (!discordUser) {
      onConnectClick();
      return;
    }

    // Deduct mock points and add user entry
    setUserEntries(prev => {
      const current = prev[raffleId] || 0;
      return {
        ...prev,
        [raffleId]: current + 1
      };
    });

    // Add record to recent entries feed
    const newLog = {
      id: `ent-${Date.now()}`,
      username: discordUser.username,
      item: itemName,
      tickets: 1,
      time: 'Just now'
    };
    setRecentEntries(prev => [newLog, ...prev.slice(0, 7)]);

    // Trigger success flash
    setSuccessMsg(`Successfully purchased 1 entry for the ${itemName}!`);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  return (
    <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-osrs-gold/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-osrs-dark border border-osrs-gold/20">
            <Sparkles className="w-5.5 h-5.5 text-osrs-gold animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif font-black text-lg tracking-wider text-gray-150 uppercase flex items-center gap-2">
              <span>Clan Grand Raffles</span>
              <span className="text-[10px] font-mono bg-osrs-poison/10 text-osrs-poison px-2 py-0.5 rounded border border-osrs-poison/15 uppercase font-bold">
                PROVABLY FAIR
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter using your accrued clan points. Winning tickets drawn live on Discord.
            </p>
          </div>
        </div>

        {/* Sync Indicator bar */}
        <div>
          {discordUser ? (
            <div className="flex items-center gap-2 bg-osrs-poison/10 border border-osrs-poison/25 py-1.5 px-3 rounded-xl text-xs font-mono text-osrs-poison">
              <CheckCircle className="w-4 h-4 animate-bounce" />
              <span>Synced: <strong className="font-bold">@{discordUser.username}</strong></span>
            </div>
          ) : (
            <button
              onClick={onConnectClick}
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-all shadow"
            >
              <Disc className="w-4 h-4 animate-spin-slow" />
              <span>Sync Discord to Enter</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Alert Banner */}
      {successMsg && (
        <div className="bg-osrs-poison/10 border border-osrs-poison/30 text-osrs-poison text-xs font-mono px-4 py-3 rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Raffles list on left, recent activity feed on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Raffles List (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {raffles.length === 0 ? (
            <div className="bg-osrs-dark/40 border border-dashed border-osrs-gold/20 p-8 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-osrs-gold/10 border border-osrs-gold/20 flex items-center justify-center mx-auto text-osrs-gold">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-serif font-bold text-gray-200 text-sm tracking-wide">No Active Item Raffles</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                All preloaded item raffles have been removed. New clan raffles will appear here when launched via the Venny bot in Discord.
              </p>
            </div>
          ) : (
            raffles.map(raffle => {
              const userCount = userEntries[raffle.id] || 0;
              const totalPool = raffle.totalEntries + userCount;
              const winChance = totalPool > 0 ? ((userCount / totalPool) * 100).toFixed(1) : '0.0';

              return (
                <div 
                  key={raffle.id}
                  className="bg-osrs-dark/40 border border-osrs-gold/10 hover:border-osrs-gold/25 transition-all p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5 group relative overflow-hidden"
                >
                  {/* Visual background item accent shadow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-osrs-gold/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none group-hover:bg-osrs-gold/10 transition-colors"></div>

                  {/* Left side: Item graphics with special border */}
                  <div className="relative w-24 h-24 bg-osrs-panel border border-osrs-gold/30 rounded-xl flex items-center justify-center p-3 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <img 
                      src={raffle.itemImageUrl} 
                      alt={raffle.itemName} 
                      className="w-16 h-16 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-2 bg-osrs-dark border border-osrs-gold/20 text-osrs-gold font-mono font-black text-[9px] px-2 py-0.5 rounded-md shadow-lg">
                      {raffle.ticketCost} PTS
                    </span>
                  </div>

                  {/* Center side: Raffle statistics */}
                  <div className="flex-1 space-y-3 min-w-0 text-center md:text-left">
                    <div>
                      <h4 className="text-base font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                        {raffle.itemName}
                      </h4>
                      <p className="text-[11px] text-gray-400 italic font-sans leading-tight mt-0.5">
                        {raffle.prizeDetail}
                      </p>
                    </div>

                    {/* Core indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-w-sm">
                      <div className="bg-osrs-dark/80 px-2.5 py-1.5 rounded-lg border border-gray-800 text-center space-y-0.5">
                        <span className="text-[8px] font-mono uppercase text-gray-500 block">Total Pool Value</span>
                        <span className="text-xs font-mono font-bold text-osrs-gold">{raffle.potValueGp}</span>
                      </div>
                      <div className="bg-osrs-dark/80 px-2.5 py-1.5 rounded-lg border border-gray-800 text-center space-y-0.5">
                        <span className="text-[8px] font-mono uppercase text-gray-500 block">Total Entries</span>
                        <span className="text-xs font-mono font-bold text-white">{totalPool} tickets</span>
                      </div>
                      <div className="bg-osrs-dark/80 px-2.5 py-1.5 rounded-lg border border-gray-800 text-center space-y-0.5 col-span-2 md:col-span-1">
                        <span className="text-[8px] font-mono uppercase text-gray-500 block">Your Probability</span>
                        <span className="text-xs font-mono font-bold text-osrs-poison">{winChance}% Chance</span>
                      </div>
                    </div>

                    {/* Countdown tracker bar */}
                    <div className="flex items-center justify-center md:justify-start gap-1.5 text-[10px] text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-osrs-gold" />
                      <span>Time Left: <strong className="text-white">{formatCountdown(raffle.countdownSeconds)}</strong></span>
                    </div>
                  </div>

                  {/* Right side: Click Action block */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleEnterRaffle(raffle.id, raffle.itemName, raffle.ticketCost)}
                      className="bg-osrs-gold hover:bg-osrs-goldHover text-osrs-dark font-sans font-black text-xs uppercase px-5 py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(225,176,51,0.25)] active:scale-95 flex items-center gap-1.5"
                    >
                      <Coins className="w-4 h-4 text-osrs-dark animate-spin-slow" />
                      <span>Buy Entry Ticket</span>
                    </button>
                    <span className="text-[9px] font-mono text-gray-500">
                      Your tickets: <strong className="text-osrs-gold">{userCount}</strong>
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Live entry feed log (1 column) */}
        <div className="bg-osrs-dark/40 border border-osrs-gold/10 p-4.5 rounded-2xl flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-osrs-gold/5 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-osrs-gold font-bold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-osrs-gold" />
              <span>Recent Ticket Logs</span>
            </span>
            <span className="text-[8px] font-mono text-gray-500 uppercase">Live stream</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[280px] custom-scrollbar pr-1">
            {recentEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No recent entries
              </div>
            ) : (
              recentEntries.map(entry => (
                <div 
                  key={entry.id}
                  className="bg-osrs-dark/60 p-2.5 rounded-lg border border-gray-850 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px]">🎫</span>
                    <div className="min-w-0">
                      <p className="text-gray-200 font-bold truncate">@{entry.username}</p>
                      <p className="text-[9px] text-gray-500">entered {entry.item}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-osrs-gold">+{entry.tickets} ticket</span>
                    <p className="text-[8px] text-gray-600 leading-none">{entry.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Disclaimer */}
          <div className="text-[9px] font-mono text-gray-500 leading-relaxed text-center bg-osrs-dark/50 p-2 rounded-lg border border-gray-850">
            Raffles are drawn live using Discord's provably fair random dice bot. Winners get items traded in-game.
          </div>
        </div>

      </div>

    </div>
  );
};
