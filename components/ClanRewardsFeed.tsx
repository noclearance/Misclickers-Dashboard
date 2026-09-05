import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, Bot, Radio, Coins, Award, Sparkles, CheckCircle2, 
  ExternalLink, MessageSquare, Flame, Shield, ArrowUpRight, 
  Filter, RefreshCw, Clock, Crown, Gift, Zap, AlertCircle
} from 'lucide-react';
import { http } from '../services/httpClient';
import { getRewardAnnouncements, subscribeToBotEvents } from '../services/api';
import type { BotRewardAnnouncement } from '../types';
import { RewardsFeedSkeleton } from './skeletons/RewardsFeedSkeleton';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';

interface ClanRewardsFeedProps {
  onOpenRewardModal?: (reward?: BotRewardAnnouncement) => void;
  onOpenBotModal?: () => void;
  rewards?: BotRewardAnnouncement[];
  loading?: boolean;
}

export const ClanRewardsFeed: React.FC<ClanRewardsFeedProps> = ({
  onOpenRewardModal,
  onOpenBotModal,
  rewards: initialRewards,
  loading: initialLoading,
}) => {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // optional
  }

  const [announcements, setAnnouncements] = useState<BotRewardAnnouncement[]>(initialRewards || []);
  const [loading, setLoading] = useState<boolean>(initialLoading !== undefined ? initialLoading : !initialRewards || initialRewards.length === 0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sotw_botw' | 'gold_credits' | 'milestones'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Synchronize when parent prop updates
  useEffect(() => {
    if (initialRewards && initialRewards.length > 0) {
      setAnnouncements(initialRewards);
      setLoading(false);
    }
  }, [initialRewards]);

  // Primary fetch from '/api/rewards' backend endpoint
  const fetchRewards = useCallback(async () => {
    try {
      setFetchError(null);
      // Directly querying /api/rewards to ensure dynamic server-authoritative state
      const data = await http.get<BotRewardAnnouncement[]>('/api/rewards');
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (err: any) {
      console.warn('[ClanRewardsFeed] Error fetching /api/rewards:', err);
      setFetchError(err.message || 'Unable to sync rewards from Venny Bot');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialRewards || initialRewards.length === 0) {
      fetchRewards();
    }

    // Subscribe to live Server-Sent Events (SSE) from the Venny Discord Bot
    const unsubscribe = subscribeToBotEvents((event) => {
      if (event.type === 'reward_announced' && event.data?.reward) {
        const newRew: BotRewardAnnouncement = event.data.reward;
        setAnnouncements((prev) => {
          const exists = prev.some((r) => r.id === newRew.id);
          if (exists) return prev.map((r) => (r.id === newRew.id ? newRew : r));
          return [newRew, ...prev];
        });
      } else if (event.type === 'reward_claimed' && event.data?.reward) {
        const updatedRew: BotRewardAnnouncement = event.data.reward;
        setAnnouncements((prev) => prev.map((r) => (r.id === updatedRew.id ? updatedRew : r)));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchRewards, initialRewards]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchRewards();
  };

  // Filtered announcements based on user selection
  const filteredAnnouncements = announcements.filter((item) => {
    if (activeFilter === 'sotw_botw') {
      return item.eventType === 'Skill of the Week' || item.eventType === 'Boss of the Week';
    }
    if (activeFilter === 'gold_credits') {
      const p = (item.prizePool || '').toLowerCase();
      const first = (item.firstPlace?.gp || '').toLowerCase();
      const itemRew = (item.firstPlace?.itemReward || '').toLowerCase();
      return (
        p.includes('12m') ||
        p.includes('12,000,000') ||
        p.includes('gold') ||
        p.includes('gp') ||
        p.includes('guild') ||
        p.includes('credit') ||
        first.includes('12m') ||
        first.includes('12,000,000') ||
        itemRew.includes('credit') ||
        (item.firstPlace?.points || 0) > 0
      );
    }
    if (activeFilter === 'milestones') {
      return item.eventType === 'Clan Milestone' || item.eventType === 'Bingo' || item.eventType === 'Raffle';
    }
    return true;
  });

  // Calculate statistics for filter counters
  const sotwCount = announcements.filter(
    (a) => a.eventType === 'Skill of the Week' || a.eventType === 'Boss of the Week'
  ).length;

  const goldCreditCount = announcements.filter((a) => {
    const text = `${a.prizePool} ${a.firstPlace?.gp || ''} ${a.firstPlace?.itemReward || ''}`.toLowerCase();
    return text.includes('12m') || text.includes('12,000,000') || text.includes('gold') || text.includes('credit');
  }).length;

  return (
    <div
      id="clan-rewards-feed"
      className="bg-[#121316] border border-osrs-border rounded-xl p-5 shadow-2xl relative overflow-hidden space-y-4 cq-rewards-container"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4 cq-reward-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 font-serif">
              Clan Rewards & Winner Broadcasts
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Live Discord bot broadcasts from <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded font-mono">/api/rewards</code> for active SOTW/BOTW winner data, 12M Gold Rewards, and Guild Credits.
          </p>
        </div>

        {/* Live Bot Stream Status & Refresh Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[11px] text-[#8ea1e1] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live /api/rewards</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-osrs-panel border border-gray-700 hover:border-osrs-gold text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1"
            title="Refresh announcements from /api/rewards"
            aria-label="Refresh announcements"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-osrs-gold' : ''}`} />
          </button>

          {onOpenBotModal && (
            <button
              onClick={onOpenBotModal}
              className="px-2.5 py-1 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] hover:text-white border border-[#5865F2]/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Venny Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0a0c] p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-osrs-gold text-black font-bold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>All Broadcasts</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {announcements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('sotw_botw')}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'sotw_botw'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>SOTW / BOTW</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {sotwCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('gold_credits')}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'gold_credits'
                ? 'bg-yellow-500 text-black font-bold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Coins className="w-3 h-3" />
            <span>12M Gold & Guild Credits</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {goldCreditCount}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('milestones')}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'milestones'
                ? 'bg-emerald-500 text-black font-bold shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Milestones & Bingo</span>
          </button>
        </div>

        {onOpenRewardModal && (
          <button
            onClick={() => onOpenRewardModal()}
            className="text-xs text-osrs-gold hover:text-white font-semibold flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md bg-osrs-panel border border-osrs-gold/30 hover:border-osrs-gold"
          >
            <span>+ Broadcast New Reward</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{fetchError}</span>
          <button
            onClick={fetchRewards}
            className="ml-auto underline hover:text-rose-100 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State using skeleton-shimmer */}
      {loading || (globalLoading && (globalLoading.isShimmering || globalLoading.isWidgetLoading('rewards'))) ? (
        <div className="skeleton-shimmer space-y-3.5">
          <RewardsFeedSkeleton />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-10 bg-[#0e0f12] rounded-xl border border-gray-800 text-gray-400 space-y-2">
          <Trophy className="w-8 h-8 mx-auto text-gray-600" />
          <p className="text-sm font-medium">No automated announcements in this filter category.</p>
          <p className="text-xs text-gray-500">
            Use the Discord Bot command <code className="text-osrs-gold bg-black/40 px-1 py-0.5 rounded font-mono">/announce_reward</code> to broadcast new SOTW/BOTW winners with 12M Gold rewards.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAnnouncements.map((item) => {
            const isSotw = item.eventType === 'Skill of the Week';
            const isBotw = item.eventType === 'Boss of the Week';
            const isBingo = item.eventType === 'Bingo';

            return (
              <div
                key={item.id}
                className="bg-[#18191e] border border-gray-800 hover:border-osrs-gold/40 rounded-xl p-4 transition-all hover:shadow-lg relative overflow-hidden group"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: item.discordEmbedColor || (isSotw ? '#3b82f6' : isBotw ? '#f59e0b' : '#10b981'),
                }}
              >
                {/* Header row with Bot name & Discord channel */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#5865F2]/20 border border-[#5865F2]/40 px-2 py-0.5 rounded-full font-mono">
                      <Bot className="w-3 h-3 text-[#5865F2]" />
                      <span>{item.announcedBy || 'Venny Discord Bot'}</span>
                    </span>
                    <span className="text-[11px] text-[#8ea1e1] font-mono flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {item.discordChannel || '#clan-announcements'}
                    </span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {item.timestamp}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isSotw 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : isBotw 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {item.eventType}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active Bounty
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-300 bg-gray-800 border border-gray-700 px-2.5 py-0.5 rounded-full font-mono">
                        <CheckCircle2 className="w-3 h-3 text-osrs-gold" />
                        Settled: {item.claimedBy || 'Winner Awarded'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Announcement Title & Main Prize Spotlight */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 my-2.5">
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5 font-serif">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono flex items-center gap-2 flex-wrap">
                      <span>Event: <strong className="text-gray-200">{item.competitionTitle}</strong></span>
                      {item.metric && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span>Metric: <strong className="text-osrs-gold">{item.metric}</strong></span>
                        </>
                      )}
                      {item.sponsor && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span>Sponsor: <strong className="text-amber-400/90">{item.sponsor}</strong></span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Prize pool spotlight */}
                  <div className="bg-[#0e0f12] border border-osrs-gold/30 rounded-xl px-4 py-2 text-right shrink-0 shadow-inner">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">Total Prize Pool</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-osrs-gold flex items-center gap-1.5 justify-end">
                      <Coins className="w-4 h-4 text-osrs-gold animate-bounce" />
                      {item.prizePool}
                    </span>
                  </div>
                </div>

                {/* Podium Summary Cards with 12M Gold & Guild Credits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 mt-2 border-t border-gray-800/80 text-xs cq-reward-podium">
                  {/* 1st Place Champion */}
                  <div className="bg-gradient-to-b from-amber-950/20 to-black/40 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          <Crown className="w-3.5 h-3.5 text-osrs-gold fill-osrs-gold" />
                          <span>1st</span>
                        </span>
                        <span className="text-gray-200 font-bold truncate">
                          {item.firstPlace?.roleReward || item.firstPlace?.title || 'Champion'}
                        </span>
                      </div>
                      {item.firstPlace?.itemReward && (
                        <span className="text-[10px] text-amber-300/80 block truncate font-mono">
                          {item.firstPlace.itemReward}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-osrs-gold font-black text-sm block">
                        {item.firstPlace?.gp || '12,000,000 GP'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        +{item.firstPlace?.points || 2500} Guild Credits
                      </span>
                    </div>
                  </div>

                  {/* 2nd Place Runner-Up */}
                  {item.secondPlace ? (
                    <div className="bg-black/30 border border-gray-700/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-300 font-bold">🥈 2nd</span>
                          <span className="text-gray-300 font-medium truncate">
                            {item.secondPlace.roleReward || item.secondPlace.title || 'Runner-Up'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-gray-200 font-bold block">{item.secondPlace.gp}</span>
                        <span className="text-[10px] text-osrs-gold">+{item.secondPlace.points} Guild Credits</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-dashed border-gray-800 rounded-xl p-2.5 flex items-center justify-center text-gray-500 font-mono text-[11px]">
                      <span>Runner-Up Pool Open</span>
                    </div>
                  )}

                  {/* 3rd Place Contender */}
                  {item.thirdPlace ? (
                    <div className="bg-black/30 border border-amber-800/30 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-600 font-bold">🥉 3rd</span>
                          <span className="text-gray-400 font-medium truncate">
                            {item.thirdPlace.roleReward || item.thirdPlace.title || 'Contender'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-gray-300 font-bold block">{item.thirdPlace.gp}</span>
                        <span className="text-[10px] text-osrs-gold">+{item.thirdPlace.points} Guild Credits</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-dashed border-gray-800 rounded-xl p-2.5 flex items-center justify-center text-gray-500 font-mono text-[11px]">
                      <span>Contender Pool Open</span>
                    </div>
                  )}
                </div>

                {/* Footer action bar */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-800/60 text-xs">
                  <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5865F2]"></span>
                    <span>Synced in real-time from Discord Bot webhook</span>
                  </div>

                  {onOpenRewardModal && (
                    <button
                      onClick={() => onOpenRewardModal(item)}
                      className="text-[11px] font-bold text-osrs-gold hover:text-white bg-[#23252b] hover:bg-[#2c2f38] px-3 py-1.5 rounded-lg border border-gray-700 hover:border-osrs-gold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>View Embed & Payout</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-osrs-gold" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
