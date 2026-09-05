import React, { useState } from 'react';
import { 
  Trophy, Swords, Sparkles, Search, User, Shield, Timer, 
  Coins, ShieldAlert, Skull, Flame, Plus, RefreshCw, MessageSquare, 
  MousePointerClick, CheckCircle, Bot, Zap, ExternalLink, 
  Crown, Grid, ChevronRight 
} from 'lucide-react';
import type { BotRewardAnnouncement } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';
import { ActivityFeed } from './ActivityFeed';
import { RaffleComponent } from './RaffleComponent';
import { ClanLeaderboard } from './ClanLeaderboard';
import { RewardAnnouncementBanner } from './RewardAnnouncementBanner';
import { ClanRewardsFeed } from './ClanRewardsFeed';
import { DiscordRewardEmbedModal } from './DiscordRewardEmbedModal';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';
import { CompetitionsSkeleton } from './skeletons/CompetitionsSkeleton';
import { BingoProgressSkeleton } from './skeletons/BingoProgressSkeleton';
import { ClanLeadersSkeleton } from './skeletons/ClanLeadersSkeleton';
import { StatsCardsSkeleton } from './skeletons/StatsCardsSkeleton';

interface DashboardProps {
  discordUser: { username: string; avatarUrl: string } | null;
  onConnectClick: () => void;
  onOpenBotModal?: () => void;
  onNavigateToBingo?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  discordUser, 
  onConnectClick, 
  onOpenBotModal,
  onNavigateToBingo 
}) => {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // optional
  }

  const {
    data,
    loading,
    loadingState,
    error,
    refreshData,
    notifications,
    addNotification,
    dismissNotification,
    syncWithWom,
    logCustomIncident,
    setRewards
  } = useDashboardData();

  const { members, competitions, bingoTiles, rewards, activities, incidents } = data;

  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [selectedReward, setSelectedReward] = useState<BotRewardAnnouncement | null>(null);

  // Filters & Interactivity State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'clanPoints' | 'xpGained' | 'bossKc'>('clanPoints');

  // Misclick Logger Form State
  const [newIncidentMember, setNewIncidentMember] = useState<string>('');
  const [newIncidentType, setNewIncidentType] = useState<string>('Prayer Flicker Failure');
  const [newIncidentDesc, setNewIncidentDesc] = useState<string>('');
  const [newIncidentDanger, setNewIncidentDanger] = useState<'mild' | 'moderate' | 'catastrophic'>('mild');

  // Form submit to log custom incident to live backend
  const handleLogCustomIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await logCustomIncident(newIncidentMember, newIncidentType, newIncidentDesc, newIncidentDanger);
    if (success) {
      setNewIncidentDesc('');
    }
  };

  // Filter & order members
  const filteredMembers = [...members]
    .filter(m => m.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      return valB - valA;
    });

  if (loading || loadingState.initial || (globalLoading && globalLoading.isShimmering && members.length === 0)) {
    return <DashboardSkeleton />;
  }

  // Calculate sum metrics directly from live data
  const totalXpGained = members.reduce((sum, m) => sum + (m.xpGained || 0), 0);
  const totalBossKc = members.reduce((sum, m) => sum + (m.bossKc || 0), 0);
  const topXpLeader = [...members].sort((a, b) => (b.xpGained || 0) - (a.xpGained || 0))[0]?.username || (members[0]?.username ?? 'N/A');
  const topBossLeader = [...members].sort((a, b) => (b.bossKc || 0) - (a.bossKc || 0))[0]?.username || (members[1]?.username ?? members[0]?.username ?? 'N/A');

  // Bingo campaign calculation
  const completedBingoCount = bingoTiles.filter(t => t.completedBy).length;
  const totalBingoTiles = bingoTiles.length > 0 ? bingoTiles.length : 25;
  const bingoPercent = totalBingoTiles > 0 ? Math.round((completedBingoCount / totalBingoTiles) * 100) : 0;
  const topBingoRaiders = Array.from(
    new Set(bingoTiles.filter(t => t.completedBy).map(t => t.completedBy as string))
  ).slice(0, 3);

  // Active competition info
  const primaryComp = competitions.length > 0 ? competitions[0] : null;
  const activeCompTitle = primaryComp ? primaryComp.metric.toUpperCase() : 'NO ACTIVE SOTW';

  return (
    <div id="dashboard-view" className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      
      {/* Toast Alert Hub */}
      {notifications.length > 0 && (
        <div id="dashboard-toasts" className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
          {notifications.map((note, index) => (
            <div
              key={index}
              className="bg-osrs-panelLight/95 border border-osrs-gold/20 text-osrs-gold text-xs py-3 px-4 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-osrs-gold shrink-0" />
                <span>{note}</span>
              </div>
              <button 
                onClick={() => dismissNotification(index)} 
                className="text-gray-400 hover:text-osrs-gold font-bold ml-2.5 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>Some dashboard data could not be fetched: {error}</span>
          </div>
          <button
            onClick={() => refreshData()}
            className="flex items-center gap-1 text-[11px] font-bold text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 px-3 py-1 rounded-lg transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Main Top Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-osrs-panel to-osrs-dark border border-osrs-gold/15 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-glow-gold">
        <div className="absolute top-0 right-0 w-80 h-80 bg-osrs-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start gap-2 text-osrs-gold text-xs font-mono font-bold uppercase tracking-widest">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>Wise Old Man Group #24942 • World 677</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold via-yellow-100 to-amber-500 tracking-wide">
            MISCLICKERSS HEADQUARTERS
          </h2>
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
            Live synchronization for clan highscores, active Skill/Boss of the Week competitions, community raffles, and Venny bot event integration.
          </p>
        </div>
        <div className="shrink-0 z-10 flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-osrs-panelLight/80 border border-osrs-gold/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[200px]">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Active Competition</span>
            <span className="text-base sm:text-lg font-serif font-bold text-osrs-gold mt-1 text-center truncate max-w-[220px]">
              {activeCompTitle}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-osrs-poison mt-2 bg-osrs-poison/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-osrs-poison animate-ping"></span>
              Wise Old Man Synced
            </div>
          </div>

          <button
            onClick={syncWithWom}
            disabled={loadingState.syncingWom}
            className="p-3.5 bg-osrs-panel border border-osrs-gold/20 hover:border-osrs-gold/50 rounded-2xl text-osrs-gold hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Force Sync with Wise Old Man"
          >
            <RefreshCw className={`w-5 h-5 ${loadingState.syncingWom ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Core Counters Panel */}
      {loadingState.syncingWom ? (
        <StatsCardsSkeleton />
      ) : (
        <section id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-osrs-panel border border-osrs-gold/10 hover:border-osrs-gold/25 p-5 rounded-2xl shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">Clan Roster</span>
              <User className="w-4 h-4 text-osrs-gold group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-100">{members.length} Members</p>
            <div className="mt-1 text-[10px] text-gray-500 font-mono">WOM Group #24942</div>
          </div>

          <div className="bg-osrs-panel border border-osrs-gold/10 hover:border-osrs-gold/25 p-5 rounded-2xl shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">Total Clan XP</span>
              <Trophy className="w-4 h-4 text-osrs-gold group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-100">{(totalXpGained / 1_000_000).toFixed(1)}M XP</p>
            <div className="mt-1 text-[10px] text-gray-500 font-mono">Leader: {topXpLeader}</div>
          </div>

          <div className="bg-osrs-panel border border-osrs-gold/10 hover:border-osrs-gold/25 p-5 rounded-2xl shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">Aggregated Boss Kills</span>
              <Swords className="w-4 h-4 text-osrs-gold group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-100">{totalBossKc.toLocaleString()} KC</p>
            <div className="mt-1 text-[10px] text-gray-500 font-mono">Top Boss Hunter: {topBossLeader}</div>
          </div>

          <div className="bg-osrs-panel border border-osrs-gold/10 hover:border-osrs-gold/25 p-5 rounded-2xl shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-bold">Total Misclicks Registered</span>
              <ShieldAlert className="w-4 h-4 text-osrs-crimson group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-display font-extrabold text-osrs-crimson">{incidents.length} incidents</p>
            <div className="mt-1 text-[10px] text-gray-500 font-mono">Real-time Venny Ticker</div>
          </div>
        </section>
      )}

      {/* Featured Discord Bot Reward Announcement Broadcast Banner */}
      {rewards.length > 0 && (
        <RewardAnnouncementBanner 
          rewards={rewards}
          onOpenRewardModal={(rew) => {
            setSelectedReward(rew || rewards[0]);
            setIsRewardModalOpen(true);
          }}
          onOpenBotModal={onOpenBotModal}
        />
      )}

      {/* Main Structural split layout with CSS Container Query */}
      <div id="main-content-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-8 cq-dashboard-main">
        
        {/* Left Side: Incidents Logger, Competitions, Raffles (8 Columns) */}
        <div className="lg:col-span-8 space-y-8 min-w-0">

          {/* Discord Connection Promo / Synced Welcome Banner */}
          {!discordUser ? (
            <div className="bg-[#5865F2]/10 border border-[#5865F2]/25 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-[#5865F2]/15 text-[#5865F2] shrink-0">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Connect your Discord account</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Verify your identity within the clan dashboard to automatically sync game achievements and log personal chokes.
                  </p>
                </div>
              </div>
              <button 
                onClick={onConnectClick}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap shadow shrink-0 active:scale-95"
              >
                Sync Profile Now
              </button>
            </div>
          ) : (
            <div className="bg-osrs-poison/10 border border-osrs-poison/25 rounded-2xl p-4.5 flex items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <img src={discordUser.avatarUrl} className="w-10 h-10 rounded-full border border-osrs-poison/30 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
                    <span>Verified Clan Raider</span>
                    <CheckCircle className="w-4 h-4 text-osrs-poison animate-pulse" />
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Currently synced as <span className="text-osrs-gold font-mono font-bold">@{discordUser.username}</span>. Your OSRS activity streams are verified.
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-osrs-poison bg-osrs-poison/10 px-2.5 py-1 rounded-md border border-osrs-poison/20">
                ACTIVE
              </span>
            </div>
          )}

          {/* Venny Discord Bot Integration Hub Card */}
          {onOpenBotModal && (
            <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-stone-900 border border-indigo-500/30 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow border border-indigo-400/40">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white font-serif">Venny Discord Bot Bridge</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      Synced
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    REST API endpoints active on <code className="text-indigo-300 font-mono text-[11px]">/api/bot/webhook</code> for live RuneLite & Discord /misclick triggers.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenBotModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Manage Bot Sync</span>
              </button>
            </div>
          )}

          {/* Central Live Activity Feed Component */}
          <ActivityFeed 
            activities={data.activities}
            loading={loadingState.activity}
            onAddLog={(msg) => addNotification(`Event: ${msg}`)} 
          />
          
          {/* Interactive Incident Logger & Feed */}
          <section className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Incident Section Header */}
            <div className="p-5 border-b border-osrs-gold/10 bg-osrs-panelLight/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skull className="w-5 h-5 text-osrs-crimson animate-pulse" />
                <div>
                  <h3 className="font-serif font-extrabold text-gray-150 text-sm tracking-wider">MISCLICK HALL OF SHAME</h3>
                  <p className="text-[10px] text-gray-500 font-mono">Live synchronization feed of failed prayer clicks, incorrect teleport tabs, and dead chokes</p>
                </div>
              </div>
            </div>

            {/* Content: split into Logger form & Log list */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-osrs-gold/10">
              
              {/* Report form (5 cols) */}
              <form onSubmit={handleLogCustomIncident} className="md:col-span-5 p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-osrs-gold text-[10px] font-mono uppercase tracking-widest font-bold">
                  <Plus className="w-3.5 h-3.5 text-osrs-gold" />
                  <span>Report A Choke</span>
                </div>

                {/* Member selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Failed Member</label>
                  <select
                    value={newIncidentMember}
                    onChange={(e) => setNewIncidentMember(e.target.value)}
                    className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/40 rounded-xl px-3 py-2 text-xs text-gray-150 outline-none transition-all font-sans"
                  >
                    <option value="">-- Choose Member --</option>
                    {discordUser && (
                      <option value={discordUser.username}>Me (@{discordUser.username})</option>
                    )}
                    {members.map(m => (
                      <option key={m.id} value={m.username}>{m.username}</option>
                    ))}
                  </select>
                </div>

                {/* Fail classification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Incident Type</label>
                  <select
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value)}
                    className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/40 rounded-xl px-3 py-2 text-xs text-gray-150 outline-none transition-all font-sans"
                  >
                    <option value="Prayer Flicker Failure">Prayer Flicker Failure</option>
                    <option value="Accidental Teleport">Accidental Teleport</option>
                    <option value="Early Food Eating">Early Food Eating</option>
                    <option value="Wrong Boss Gear">Wrong Boss Gear</option>
                    <option value="Staged Death">Staged Death (Wiped Raid)</option>
                  </select>
                </div>

                {/* Danger classification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Calamity Level</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['mild', 'moderate', 'catastrophic'] as const).map(lvl => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setNewIncidentDanger(lvl)}
                        className={`py-1 rounded text-[9px] uppercase font-mono border transition-all ${
                          newIncidentDanger === lvl
                            ? lvl === 'mild' 
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/35 font-bold shadow'
                              : lvl === 'moderate'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/35 font-bold shadow'
                              : 'bg-red-500/10 text-red-400 border-red-500/35 font-bold shadow'
                            : 'bg-osrs-dark text-gray-500 border-transparent hover:text-gray-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Description</label>
                  <textarea
                    placeholder="Brief details of what was clicked..."
                    value={newIncidentDesc}
                    onChange={(e) => setNewIncidentDesc(e.target.value)}
                    className="w-full h-16 bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/40 rounded-xl px-3 py-2 text-xs text-gray-150 outline-none transition-all font-sans resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-osrs-gold hover:bg-osrs-goldHover active:scale-98 text-osrs-dark font-sans text-xs uppercase font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Incident
                </button>
              </form>

              {/* Incidents feed logs (7 cols) */}
              <div className="md:col-span-7 p-5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-osrs-gold text-[10px] font-mono uppercase tracking-widest font-bold mb-3">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Real-time Log Streams</span>
                </div>

                <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                  {incidents.map((inc) => {
                    const pillColor = 
                      inc.dangerLevel === 'mild' 
                        ? 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400'
                        : inc.dangerLevel === 'moderate'
                        ? 'bg-orange-500/15 border-orange-500/25 text-orange-400'
                        : 'bg-red-500/15 border-red-500/25 text-red-400 animate-pulse';

                    return (
                      <div 
                        key={inc.id}
                        className="bg-osrs-dark/40 border border-osrs-gold/5 p-3 rounded-xl flex items-start gap-2.5 hover:border-osrs-gold/10 transition-colors"
                      >
                        <div className="p-1 rounded-lg bg-osrs-panel shrink-0 border border-gray-800">
                          <MousePointerClick className="w-3.5 h-3.5 text-osrs-gold" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-200 font-sans truncate">{inc.username}</span>
                            <span className="text-[8px] text-gray-500 font-mono">{inc.timestamp}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-osrs-gold font-sans">{inc.incidentType}</span>
                            <span className={`text-[8px] font-mono uppercase px-1.5 rounded border ${pillColor}`}>
                              {inc.dangerLevel}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{inc.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </section>

          {/* Automated Discord Bot Clan Rewards & Winner Announcements Feed */}
          <ClanRewardsFeed 
            rewards={rewards}
            loading={loadingState.rewards}
            onOpenRewardModal={(rew) => {
              if (rew) setSelectedReward(rew);
              else if (rewards.length > 0) setSelectedReward(rewards[0]);
              setIsRewardModalOpen(true);
            }}
            onOpenBotModal={onOpenBotModal}
          />

          {/* SOTW / BOTW Competitions Grid - Featured Event Rankings */}
          {loadingState.syncingWom ? (
            <CompetitionsSkeleton />
          ) : (
            <section id="ongoing-competitions" className="bg-gradient-to-br from-osrs-panel to-osrs-dark border border-osrs-gold/20 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-osrs-gold/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-osrs-gold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <Trophy className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-black text-base tracking-wider text-gray-100 uppercase">
                        ONGOING CLAN EVENT RANKINGS
                      </h3>
                      <span className="text-[9px] font-mono font-bold uppercase bg-osrs-gold/15 text-osrs-gold border border-osrs-gold/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Skill of the Week</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Live Wise Old Man event standings • Automatic XP tracking & rank progression
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-osrs-dark/80 px-3 py-1.5 rounded-xl border border-osrs-gold/20 text-osrs-gold">
                    <Timer className="w-4 h-4 text-osrs-gold animate-spin-slow" />
                    <span className="text-xs font-mono font-bold">Active Sprint</span>
                  </div>
                  <a
                    href={`https://wiseoldman.net/groups/24942/competitions`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-osrs-panelLight hover:bg-osrs-gold hover:text-osrs-dark text-gray-300 text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-osrs-gold/20 transition-all shadow"
                  >
                    <span>WOM Event</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {competitions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-mono text-xs border border-dashed border-gray-800 rounded-xl">
                  No active sprint competitions logged right now. Hit manual sync to refresh from Wise Old Man.
                </div>
              ) : (
                <div className="space-y-6">
                  {competitions.map((comp) => {
                    const isSkill = comp.type === 'Skill of the Week';
                    const top3 = comp.participants.slice(0, 3);
                    const remaining = comp.participants.slice(3);
                    const maxLeaderVal = isSkill 
                      ? (comp.participants[0]?.xpGained || 1) 
                      : (comp.participants[0]?.bossKc || 1);

                    return (
                      <div 
                        key={comp.id}
                        className="bg-osrs-dark/60 border border-osrs-gold/15 p-5 rounded-2xl space-y-6 hover:border-osrs-gold/30 transition-all shadow-lg"
                      >
                        {/* Competition Title Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-855 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${
                                isSkill 
                                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' 
                                  : 'bg-red-500/15 border-red-500/30 text-red-400'
                              }`}>
                                {comp.type}
                              </span>
                              <span className="text-xs font-mono text-gray-400">
                                {comp.participantCount || comp.participants.length} Contenders
                              </span>
                            </div>
                            <h4 className="text-base sm:text-lg font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-osrs-gold via-yellow-100 to-amber-400 mt-1">
                              {comp.metric || comp.title}
                            </h4>
                          </div>

                          <div className="text-right font-mono text-xs">
                            <span className="text-gray-500 block text-[10px]">Leader Advantage</span>
                            <span className="text-osrs-gold font-bold">
                              {isSkill 
                                ? `+${((comp.participants[0]?.xpGained || 0) / 1_000_000).toFixed(2)}M XP`
                                : `${comp.participants[0]?.bossKc || 0} KC`}
                            </span>
                          </div>
                        </div>

                        {/* Official Discord Bot Reward & Prize Bounty Showcase */}
                        {comp.rewards && (
                          <div className="bg-gradient-to-r from-[#17181c] via-[#1a1c23] to-[#17181c] border border-osrs-gold/30 rounded-xl p-4 space-y-3 relative overflow-hidden shadow-inner">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-osrs-gold" />
                                <span className="text-xs font-bold text-gray-200">
                                  Official Prize Pool: <strong className="text-osrs-gold font-mono font-extrabold text-sm">{comp.rewards.totalPrizePool}</strong>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#5865F2] bg-[#5865F2]/15 px-2 py-0.5 rounded border border-[#5865F2]/30">
                                  <MessageSquare className="w-3 h-3" />
                                  {comp.rewards.discordChannel || '#clan-announcements'}
                                </span>
                                <button
                                  onClick={() => {
                                    const matchingRew = rewards.find(r => r.competitionId === comp.id);
                                    if (matchingRew) {
                                      setSelectedReward(matchingRew);
                                      setIsRewardModalOpen(true);
                                    } else if (comp.rewards) {
                                      setSelectedReward({
                                        id: `rew-${comp.id}`,
                                        competitionId: comp.id,
                                        competitionTitle: comp.title || comp.metric || 'Clan Sprint',
                                        eventType: isSkill ? 'Skill of the Week' : 'Boss of the Week',
                                        title: `🏆 ${comp.title || comp.metric} Official Prize Bounty`,
                                        prizePool: comp.rewards.totalPrizePool,
                                        firstPlace: comp.rewards.firstPlace,
                                        secondPlace: comp.rewards.secondPlace,
                                        thirdPlace: comp.rewards.thirdPlace,
                                        sponsor: comp.rewards.sponsor,
                                        discordChannel: comp.rewards.discordChannel || '#clan-announcements',
                                        announcedBy: 'Venny Discord Bot',
                                        timestamp: 'Live Active',
                                        active: true,
                                        discordEmbedColor: isSkill ? '#3b82f6' : '#f59e0b'
                                      });
                                      setIsRewardModalOpen(true);
                                    }
                                  }}
                                  className="text-[11px] font-bold text-osrs-gold hover:text-white bg-osrs-panel border border-osrs-gold/20 hover:border-osrs-gold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <Trophy className="w-3 h-3 text-osrs-gold" />
                                  <span>View Embed</span>
                                </button>
                              </div>
                            </div>

                            {/* Reward Tier Pills */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="bg-black/40 border border-amber-500/30 p-2 rounded-lg flex items-center justify-between">
                                <span className="text-amber-400 font-bold flex items-center gap-1">🥇 1st</span>
                                <div className="text-right">
                                  <span className="text-white font-mono font-bold block">{comp.rewards.firstPlace.gp}</span>
                                  <span className="text-[10px] text-osrs-gold font-mono">+{comp.rewards.firstPlace.points} pts</span>
                                </div>
                              </div>

                              {comp.rewards.secondPlace && (
                                <div className="bg-black/40 border border-gray-700/50 p-2 rounded-lg flex items-center justify-between">
                                  <span className="text-gray-300 font-bold flex items-center gap-1">🥈 2nd</span>
                                  <div className="text-right">
                                    <span className="text-white font-mono font-bold block">{comp.rewards.secondPlace.gp}</span>
                                    <span className="text-[10px] text-osrs-gold font-mono">+{comp.rewards.secondPlace.points} pts</span>
                                  </div>
                                </div>
                              )}

                              {comp.rewards.thirdPlace && (
                                <div className="bg-black/40 border border-amber-800/40 p-2 rounded-lg flex items-center justify-between">
                                  <span className="text-amber-600 font-bold flex items-center gap-1">🥉 3rd</span>
                                  <div className="text-right">
                                    <span className="text-white font-mono font-bold block">{comp.rewards.thirdPlace.gp}</span>
                                    <span className="text-[10px] text-osrs-gold font-mono">+{comp.rewards.thirdPlace.points} pts</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Top 3 Podium Highlights */}
                        {top3.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            {top3.map((p, idx) => {
                              const val = isSkill ? (p.xpGained || 0) : (p.bossKc || 0);
                              const displayVal = isSkill ? `${(val / 1_000_000).toFixed(2)}M XP` : `${val} KC`;

                              const medalBorder = 
                                idx === 0
                                  ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-osrs-panel shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                  : idx === 1
                                  ? 'border-slate-400/40 bg-gradient-to-b from-slate-900/40 to-osrs-panel'
                                  : 'border-amber-700/40 bg-gradient-to-b from-stone-900/40 to-osrs-panel';

                              const medalBadge = 
                                idx === 0
                                  ? 'bg-osrs-gold text-osrs-dark font-black'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900 font-black'
                                  : 'bg-amber-600 text-stone-950 font-black';

                              return (
                                <div
                                  key={p.id}
                                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 relative overflow-hidden ${medalBorder}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shadow ${medalBadge}`}>
                                        #{idx + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-100 font-sans truncate flex items-center gap-1">
                                          <span>{p.username}</span>
                                          {idx === 0 && <Crown className="w-3.5 h-3.5 text-osrs-gold fill-osrs-gold" />}
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono block truncate">
                                          {p.role || 'Clan Raider'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between items-baseline font-mono text-xs">
                                      <span className="text-[10px] text-gray-400">Gained:</span>
                                      <span className="text-osrs-gold font-bold text-sm">{displayVal}</span>
                                    </div>
                                    <div className="w-full bg-osrs-dark h-2 rounded-full overflow-hidden border border-gray-800">
                                      <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                                        style={{ width: `${Math.round((val / maxLeaderVal) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Full Participant Progression List */}
                        {remaining.length > 0 && (
                          <div className="space-y-2.5 pt-2 border-t border-gray-800">
                            <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider block">
                              Challenger Leaderboard Standings
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {remaining.map((p, idx) => {
                                const rank = idx + 4;
                                const val = isSkill ? (p.xpGained || 0) : (p.bossKc || 0);
                                const displayVal = isSkill ? `${(val / 1_000_000).toFixed(2)}M XP` : `${val} KC`;
                                const barPct = Math.max(5, Math.round((val / maxLeaderVal) * 100));

                                return (
                                  <div 
                                    key={p.id} 
                                    className="bg-osrs-dark/80 border border-gray-850 p-2.5 rounded-xl space-y-1 hover:border-osrs-gold/20 transition-all"
                                  >
                                    <div className="flex items-center justify-between text-xs font-mono">
                                      <span className="flex items-center gap-1.5 text-gray-300 min-w-0">
                                        <span className="text-[10px] font-bold text-gray-500">#{rank}</span>
                                        <span className="truncate font-sans font-medium">{p.username}</span>
                                      </span>
                                      <span className="text-osrs-gold font-semibold shrink-0">{displayVal}</span>
                                    </div>
                                    
                                    <div className="w-full bg-osrs-panel h-1.5 rounded-full overflow-hidden border border-gray-850">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all"
                                        style={{ width: `${barPct}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Clan Bingo Campaign Live Progress Card */}
          {loadingState.syncingWom ? (
            <BingoProgressSkeleton />
          ) : (
            <section id="dashboard-bingo-progress" className="bg-gradient-to-br from-osrs-panel to-osrs-dark border border-osrs-gold/20 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-osrs-gold/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-osrs-gold shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <Grid className="w-5 h-5 text-osrs-gold animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-black text-base tracking-wider text-gray-100 uppercase">
                        SUMMER CLAN BINGO 2026
                      </h3>
                      <span className="text-[9px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>Venny Bot Live</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Live clan board progression • Instant tile completions verified via Discord bot
                    </p>
                  </div>
                </div>

                {onNavigateToBingo && (
                  <button
                    onClick={onNavigateToBingo}
                    className="flex items-center gap-1.5 bg-osrs-gold hover:bg-osrs-goldHover text-osrs-dark font-sans text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <span>Open Bingo Board</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Progress bar and metrics */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-osrs-dark/70 border border-osrs-gold/10 p-4 rounded-xl">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex justify-between items-baseline text-xs font-mono">
                    <span className="text-gray-400">Board Completion:</span>
                    <span className="text-osrs-gold font-bold text-sm">
                      {completedBingoCount} / {totalBingoTiles} Tiles ({bingoPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-osrs-panel h-2.5 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, bingoPercent)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <span>{totalBingoTiles - completedBingoCount} Remaining</span>
                    <span>25-Tile Clan Matrix</span>
                  </div>
                </div>

                <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-gray-850 pt-3 md:pt-0 md:pl-4 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-gray-400 block">Top Contributors</span>
                  {topBingoRaiders.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {topBingoRaiders.map((raider, idx) => (
                        <span key={idx} className="text-[10px] font-mono bg-osrs-panel border border-osrs-gold/20 text-osrs-gold px-2 py-0.5 rounded-md">
                          @{raider}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500">No tiles claimed yet</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Active Raffles */}
          <RaffleComponent discordUser={discordUser} onConnectClick={onConnectClick} />

        </div>

        {/* Right Side: Clan Leaderboards & Search (4 Columns) */}
        <div className="lg:col-span-4">
          {loadingState.syncingWom ? (
            <ClanLeadersSkeleton />
          ) : (
            <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 flex flex-col h-[760px] shadow-xl">
              
              {/* Header & Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-osrs-gold" />
                  <h3 className="font-serif font-extrabold text-sm tracking-wider text-gray-150">CLAN LEADERS</h3>
                </div>

                {/* Quick search input */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search raider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/45 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 outline-none transition-all placeholder-gray-550 font-mono"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                </div>

                {/* Metric Mode buttons */}
                <div className="grid grid-cols-3 gap-1 bg-osrs-dark p-1 rounded-xl border border-gray-850">
                  <button
                    onClick={() => setSortBy('clanPoints')}
                    className={`py-1.5 rounded-lg text-[9px] uppercase font-mono transition-all font-bold ${
                      sortBy === 'clanPoints' 
                        ? 'bg-osrs-panelLight border border-osrs-gold/25 text-osrs-gold shadow-glow-gold' 
                        : 'text-gray-500 hover:text-gray-300 border-transparent'
                    }`}
                  >
                    Points
                  </button>
                  <button
                    onClick={() => setSortBy('xpGained')}
                    className={`py-1.5 rounded-lg text-[9px] uppercase font-mono transition-all font-bold ${
                      sortBy === 'xpGained' 
                        ? 'bg-osrs-panelLight border border-osrs-gold/25 text-osrs-gold shadow-glow-gold' 
                        : 'text-gray-500 hover:text-gray-300 border-transparent'
                    }`}
                  >
                    XP Race
                  </button>
                  <button
                    onClick={() => setSortBy('bossKc')}
                    className={`py-1.5 rounded-lg text-[9px] uppercase font-mono transition-all font-bold ${
                      sortBy === 'bossKc' 
                        ? 'bg-osrs-panelLight border border-osrs-gold/25 text-osrs-gold shadow-glow-gold' 
                        : 'text-gray-500 hover:text-gray-300 border-transparent'
                    }`}
                  >
                    Boss KC
                  </button>
                </div>
              </div>

              {/* Members Scroll list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 text-xs font-mono">
                    No raiders matched query.
                  </div>
                ) : (
                  filteredMembers.map((member, idx) => {
                    // Formatting values
                    const metricLabel = 
                      sortBy === 'clanPoints' 
                        ? `${member.clanPoints.toLocaleString()} pts`
                        : sortBy === 'xpGained'
                        ? `${((member.xpGained || 0) / 1_000_000).toFixed(1)}M XP`
                        : `${(member.bossKc || 0).toLocaleString()} KC`;

                    const placeBg = 
                      idx === 0 
                        ? 'bg-osrs-gold/15 border-osrs-gold/30 text-osrs-gold'
                        : idx === 1 
                        ? 'bg-slate-400/15 border-slate-400/30 text-slate-300'
                        : idx === 2
                        ? 'bg-amber-700/15 border-amber-700/30 text-amber-500'
                        : 'bg-osrs-dark/80 border-gray-850 text-gray-400';

                    // Comical custom rank tags based on score/points
                    const getCustomRank = (pts: number) => {
                      if (pts >= 11000) return 'Grandmaster Mislicker';
                      if (pts >= 9000) return 'Expert Tile Clipper';
                      if (pts >= 7000) return 'Brew Chugging Hero';
                      if (pts >= 5000) return 'Slayer Choke Rookie';
                      return 'Tile Skipper';
                    };

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-osrs-dark/35 border border-osrs-gold/5 hover:border-osrs-gold/15 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Rank Position medal */}
                          <div className={`w-6.5 h-6.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${placeBg}`}>
                            {idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5 font-sans">
                              <span className="truncate">{member.username}</span>
                              {member.role === 'Leader' && (
                                <Shield className="w-3.5 h-3.5 text-osrs-gold shrink-0 animate-pulse" title="Clan Leader" />
                              )}
                              {member.role === 'Admin' && (
                                <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" title="Admin" />
                              )}
                            </div>
                            <div className="text-[8px] text-osrs-gold/60 font-mono uppercase tracking-wider font-bold truncate">
                              {getCustomRank(member.clanPoints)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <span className="font-mono text-xs font-black text-osrs-gold tracking-tight">
                            {metricLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Full-width interactive Clan Leaderboard */}
      <div className="mt-8">
        <ClanLeaderboard />
      </div>

      {/* Discord Bot Official Reward Announcement & Embed Modal */}
      <DiscordRewardEmbedModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        selectedReward={selectedReward}
        allRewards={rewards}
        onRewardAnnounced={(newRew) => {
          setRewards(prev => [newRew, ...prev]);
        }}
      />

    </div>
  );
};
