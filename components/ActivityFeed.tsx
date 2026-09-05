import React, { useState, useEffect } from 'react';
import { 
  Trophy, Coins, Sparkles, MessageSquare, Flame, ShieldAlert, 
  Award, ArrowUpCircle, MousePointerClick, Heart, Compass, 
  RefreshCw, Bot, CheckCircle2, Shield
} from 'lucide-react';
import { getActivityFeed, subscribeToBotEvents } from '../services/api';
import { ActivityFeedSkeleton } from './skeletons/ActivityFeedSkeleton';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';
import type { ClanActivity } from '../types';

interface ActivityFeedProps {
  onAddLog?: (message: string) => void;
  activities?: ClanActivity[];
  loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  onAddLog, 
  activities: initialActivities, 
  loading: initialLoading 
}) => {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // optional
  }

  const [activities, setActivities] = useState<ClanActivity[]>(initialActivities || []);
  const [loading, setLoading] = useState<boolean>(initialLoading !== undefined ? initialLoading : !initialActivities || initialActivities.length === 0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'drop' | 'level' | 'achievement' | 'misclick'>('all');
  const [congratsCounts, setCongratsCounts] = useState<{ [key: string]: number }>({});
  const [cheers, setCheers] = useState<{ [key: string]: { text: string; id: number }[] }>({});

  // Synchronize when parent data updates
  useEffect(() => {
    if (initialActivities && initialActivities.length > 0) {
      setActivities(initialActivities);
      setLoading(false);
    }
  }, [initialActivities]);

  // 1. Fetch real clan activities from backend only if not provided from parent
  const fetchActivities = async () => {
    try {
      const data = await getActivityFeed();
      if (Array.isArray(data) && data.length > 0) {
        setActivities(data);
      }
    } catch (err) {
      console.warn('[ActivityFeed] Could not fetch /api/activity:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialActivities || initialActivities.length === 0) {
      fetchActivities();
    }
  }, []);

  // 2. Listen to real-time events via Server-Sent Events (SSE) from the Venny Bot Hub
  useEffect(() => {
    const unsubscribe = subscribeToBotEvents((event) => {
      if (event.data && typeof event.data === 'object') {
        const item = event.data.activity || event.data;
        if (item.username && item.title) {
          const newAct: ClanActivity = {
            id: item.id || `bot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            username: item.username,
            type: item.type || (event.type === 'drop' ? 'drop' : event.type === 'misclick' ? 'misclick' : 'achievement'),
            title: item.title,
            detail: item.detail || 'Synced via Venny Discord bot',
            timestamp: item.timestamp || 'Just now',
            value: item.value,
            itemUrl: item.itemUrl,
            rarity: item.rarity || 'rare',
          };

          setActivities(prev => [newAct, ...prev.filter(a => a.id !== newAct.id).slice(0, 30)]);
          if (onAddLog) {
            onAddLog(`${newAct.username}: ${newAct.title}`);
          }
        }
      }
    });

    // Also listen to local window events triggered by UI components
    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        const item = e.detail;
        const newAct: ClanActivity = {
          id: `local-${Date.now()}`,
          username: item.player || item.username || 'Clan Member',
          type: item.type || 'misclick',
          title: item.title || 'Logged Misclick Incident',
          detail: item.detail || item.description || 'Misclicked in-game and logged to clan hub!',
          timestamp: 'Just now',
          value: item.value || 'Oof',
          rarity: item.rarity || 'rare'
        };
        setActivities(prev => [newAct, ...prev.slice(0, 30)]);
      }
    };

    window.addEventListener('misclickLogged', handleCustomEvent);
    window.addEventListener('botEventLogged', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('misclickLogged', handleCustomEvent);
      window.removeEventListener('botEventLogged', handleCustomEvent);
    };
  }, [onAddLog]);

  // Congratulate button reaction trigger
  const handleCongrats = (actId: string) => {
    setCongratsCounts(prev => ({
      ...prev,
      [actId]: (prev[actId] || 0) + 1
    }));

    const phrases = [
      'GZ!', '@@@@@@@@@', 'Nice!', 'HUGE DROP!', 'Big level lad!',
      'Gzzz!', 'Woooo!', 'Championship tier!', 'GZ WOOF WOOF', 'Absolute unit'
    ];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    const cheerId = Date.now();
    setCheers(prev => ({
      ...prev,
      [actId]: [...(prev[actId] || []), { text: randomPhrase, id: cheerId }]
    }));

    setTimeout(() => {
      setCheers(prev => ({
        ...prev,
        [actId]: (prev[actId] || []).filter(c => c.id !== cheerId)
      }));
    }, 1500);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchActivities();
  };

  // Filter activities based on tab
  const filteredActivities = activities.filter(act => {
    if (activeTab === 'all') return true;
    return act.type === activeTab;
  });

  if (loading || (globalLoading && (globalLoading.isShimmering || globalLoading.isWidgetLoading('activity')))) {
    return (
      <div className="skeleton-shimmer">
        <ActivityFeedSkeleton />
      </div>
    );
  }

  return (
    <div id="live-activity-feed" className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 shadow-xl space-y-5 cq-feed-container">
      
      {/* Activity Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-osrs-gold/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-osrs-dark border border-osrs-gold/20 shadow-inner">
            <Flame className="w-5 h-5 text-osrs-gold animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-extrabold text-sm tracking-wider text-gray-150 uppercase">
                CLAN ACTIVITY FEED
              </h3>
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                RuneLite & Venny Live
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Live broadcast of boss drops, competition gains, level-ups, and Discord misclicks
            </p>
          </div>
        </div>

        {/* Tab Filters and Refresh */}
        <div className="flex items-center gap-2 flex-wrap cq-feed-tabs">
          <div className="flex items-center gap-1 bg-osrs-dark p-1 rounded-xl border border-gray-850 overflow-x-auto max-w-full">
            {(['all', 'drop', 'level', 'achievement', 'misclick'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-osrs-panelLight border border-osrs-gold/25 text-osrs-gold shadow-glow-gold'
                    : 'text-gray-500 hover:text-gray-300 border-transparent'
                }`}
              >
                {tab === 'all' ? 'All' : tab === 'drop' ? 'Drops' : tab === 'level' ? 'Levels' : tab === 'achievement' ? 'Milestones' : 'Chokes'}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 bg-osrs-dark hover:bg-osrs-panelLight text-gray-400 hover:text-osrs-gold border border-osrs-gold/15 rounded-xl transition-all disabled:opacity-50"
            title="Refresh Activity Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-osrs-gold" />
          <span>Synchronizing live clan events...</span>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-mono text-xs border border-dashed border-gray-800 rounded-xl">
          No activities recorded under this category yet. Events stream live via Discord bot & Wise Old Man.
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredActivities.map((act) => {
            // Icon and styling mapping
            const isDrop = act.type === 'drop';
            const isLevel = act.type === 'level';
            const isMisclick = act.type === 'misclick';
            const isAchievement = act.type === 'achievement';

            const borderClass = 
              act.rarity === 'legendary' 
                ? 'border-amber-500/40 bg-amber-950/15 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                : act.rarity === 'rare'
                ? 'border-purple-500/30 bg-purple-950/10'
                : 'border-osrs-gold/10 bg-osrs-dark/40';

            const badgeBg = 
              isDrop
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : isLevel
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                : isMisclick
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

            const actCheers = cheers[act.id] || [];

            return (
              <div
                key={act.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-osrs-gold/25 relative ${borderClass}`}
              >
                {/* Floating Cheers Popups */}
                {actCheers.map(c => (
                  <span
                    key={c.id}
                    className="absolute -top-3 right-8 bg-osrs-gold text-osrs-dark font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-bounce pointer-events-none z-30"
                  >
                    {c.text}
                  </span>
                ))}

                <div className="flex items-start gap-3 min-w-0">
                  {/* Category icon */}
                  <div className={`p-2 rounded-xl border shrink-0 ${badgeBg}`}>
                    {isDrop && <Coins className="w-4 h-4" />}
                    {isLevel && <ArrowUpCircle className="w-4 h-4" />}
                    {isMisclick && <MousePointerClick className="w-4 h-4" />}
                    {isAchievement && <Trophy className="w-4 h-4" />}
                  </div>

                  {/* Activity Details */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-bold text-xs text-gray-200 hover:text-osrs-gold transition-colors">
                        {act.username}
                      </span>
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${badgeBg}`}>
                        {act.type}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {act.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 font-sans font-medium">
                      {act.title}
                    </p>

                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      {act.detail}
                    </p>
                  </div>
                </div>

                {/* Right Value & React Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                  {act.value && (
                    <span className="text-xs font-mono font-bold text-osrs-gold bg-osrs-dark px-2.5 py-1 rounded-lg border border-osrs-gold/15">
                      {act.value}
                    </span>
                  )}

                  <button
                    onClick={() => handleCongrats(act.id)}
                    className="flex items-center gap-1.5 bg-osrs-panelLight/80 hover:bg-osrs-gold hover:text-osrs-dark text-gray-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-osrs-gold/20 transition-all active:scale-95 shadow-sm"
                    title="Send Congratulations"
                  >
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>GZ</span>
                    {congratsCounts[act.id] ? (
                      <span className="bg-osrs-dark/40 px-1 rounded text-[10px]">
                        +{congratsCounts[act.id]}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-osrs-gold/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 font-mono gap-2">
        <span className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ingesting webhook events via <code className="text-indigo-300">/api/bot/webhook</code></span>
        </span>
        <span>Wise Old Man Group #24942</span>
      </div>
    </div>
  );
};
