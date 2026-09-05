import React, { useState, useEffect } from 'react';
import { 
  Trophy, Search, Shield, RefreshCw, Award, Swords, Skull, ChevronDown, 
  Sparkles, User, ExternalLink, Activity, Crown, Zap, Flame, Gem, 
  Crosshair, ShieldCheck, Star, Filter, Info, Users, Globe
} from 'lucide-react';
import type { ClanMember, ClanInfo } from '../types';
import { getClanMembers, getClanInfo, syncClanFromWom, REAL_WOM_GROUP_ID } from '../services/api';
import { LeaderboardTableSkeleton } from './skeletons/LeaderboardTableSkeleton';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';

export type ClanRoleBadge = 'Raider' | 'PvMer' | 'Skiller' | 'Grandmaster' | 'Pet Hunter';

export interface PlayerAchievement {
  id: string;
  name: string;
  badgeType: ClanRoleBadge;
  description: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowClass: string;
}

interface ExtendedMember extends ClanMember {
  // Boss KCs & skills for highscores simulation
  vorkathKc: number;
  zulrahKc: number;
  coxKc: number;
  tobKc: number;
  toaKc: number;
  graardorKc: number;
  runecraftingXp: number;
  slayerXp: number;
  strengthXp: number;
  specialization: ClanRoleBadge;
  achievements: string[];
}

// Role badge visual styles definition
export const ROLE_CONFIGS: Record<ClanRoleBadge, {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  glow: string;
  description: string;
}> = {
  Raider: {
    label: 'Raider',
    icon: Swords,
    bg: 'bg-cyan-500/15 hover:bg-cyan-500/25',
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    glow: 'shadow-[0_0_8px_rgba(6,182,212,0.35)]',
    description: 'Master of CoX, ToB, and ToA high-tier raiding'
  },
  PvMer: {
    label: 'PvMer',
    icon: Skull,
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    glow: 'shadow-[0_0_8px_rgba(244,63,94,0.35)]',
    description: 'High-killcount slayer of Vorkath, Zulrah, and Graardor'
  },
  Skiller: {
    label: 'Skiller',
    icon: Zap,
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.35)]',
    description: 'Dedicated 99 grinder with millions in total skill experience'
  },
  Grandmaster: {
    label: 'Grandmaster',
    icon: Crown,
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.35)]',
    description: 'Clan veteran and top clan point contributor'
  },
  'Pet Hunter': {
    label: 'Pet Hunter',
    icon: Gem,
    bg: 'bg-purple-500/15 hover:bg-purple-500/25',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_8px_rgba(168,85,247,0.35)]',
    description: 'Rare drop and follower collector across Gielinor'
  }
};

// Boss & metric definitions
interface MetricDef {
  id: string;
  label: string;
  icon: string;
  category: 'points' | 'xp' | 'boss';
}

const METRICS: MetricDef[] = [
  { id: 'clanPoints', label: 'Clan Points', icon: '🏆', category: 'points' },
  { id: 'xpGained', label: 'Total XP Gained', icon: '⚡', category: 'xp' },
  { id: 'bossKc', label: 'Total Boss KC', icon: '💀', category: 'boss' },
  { id: 'vorkathKc', label: 'Vorkath', icon: '🐉', category: 'boss' },
  { id: 'zulrahKc', label: 'Zulrah', icon: '🐍', category: 'boss' },
  { id: 'coxKc', label: 'Chambers of Xeric', icon: '🏰', category: 'boss' },
  { id: 'tobKc', label: 'Theatre of Blood', icon: '🩸', category: 'boss' },
  { id: 'toaKc', label: 'Tombs of Amascut', icon: '🏜️', category: 'boss' },
  { id: 'graardorKc', label: 'General Graardor', icon: '👹', category: 'boss' },
];

export const ClanLeaderboard: React.FC = () => {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // optional fallback
  }

  const [members, setMembers] = useState<ExtendedMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('clanPoints');
  const [activeTab, setActiveTab] = useState<'all' | 'points' | 'xp' | 'boss'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<ExtendedMember | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);

  // Load and enrich mock members with specialized roles and achievements
  const fetchEnrichedMembers = async () => {
    setLoading(true);
    try {
      const [basicMembers, fetchedClanInfo] = await Promise.all([
        getClanMembers(),
        getClanInfo()
      ]);
      setClanInfo(fetchedClanInfo);
      
      // Seed extended fields consistently based on id / name
      const enriched: ExtendedMember[] = basicMembers.map((m, index) => {
        const seed = m.id * 17;
        const vorkath = Math.floor((m.bossKc || 0) * 0.35 + (seed % 40));
        const zulrah = Math.floor((m.bossKc || 0) * 0.25 + (seed % 30));
        const cox = Math.floor((m.bossKc || 0) * 0.15 + (seed % 20));
        const tob = Math.floor((m.bossKc || 0) * 0.08 + (seed % 10));
        const toa = Math.floor((m.bossKc || 0) * 0.12 + (seed % 15));
        const graardor = Math.floor((m.bossKc || 0) * 0.05 + (seed % 25));
        const runecrafting = Math.floor((m.xpGained || 0) * 0.12 + (seed * 10000) % 2000000);
        const slayer = Math.floor((m.xpGained || 0) * 0.18 + (seed * 15000) % 3000000);
        const strength = Math.floor((m.xpGained || 0) * 0.3 + (seed * 25000) % 5000000);

        // Determine specialization role based on stats
        let specialization: ClanRoleBadge = 'PvMer';
        const totalRaids = cox + tob + toa;
        if (m.clanPoints >= 10000 || m.role === 'Owner' || m.role === 'Deputy Owner') {
          specialization = 'Grandmaster';
        } else if (totalRaids >= 30 || (m.ehb || 0) > 100) {
          specialization = (m.ehb || 0) > 200 ? 'PvMer' : 'Raider';
        } else if ((m.xpGained || 0) > 100000000 || (m.ehp || 0) > 400) {
          specialization = 'Skiller';
        } else if (index % 4 === 0) {
          specialization = 'Pet Hunter';
        } else {
          specialization = 'PvMer';
        }

        // Generate unlocked achievement badges
        const achievements: string[] = [];
        if (m.clanPoints >= 8000) achievements.push('Grandmaster Contributor');
        if (totalRaids >= 25 || (m.ehb || 0) >= 50) achievements.push('Grand Raid Vanguard');
        if ((m.bossKc || 0) >= 300 || (m.ehb || 0) >= 100) achievements.push('Boss Slayer Elite');
        if ((m.xpGained || 0) >= 100000000) achievements.push('Maxed Skill Grind');
        if (vorkath >= 100) achievements.push('Dragonbane Hunter');
        if (tob >= 15) achievements.push('Sanguine Theatre Victor');
        if (achievements.length === 0) achievements.push('Clan Recruit Initiate');

        return {
          ...m,
          vorkathKc: vorkath,
          zulrahKc: zulrah,
          coxKc: cox,
          tobKc: tob,
          toaKc: toa,
          graardorKc: graardor,
          runecraftingXp: runecrafting,
          slayerXp: slayer,
          strengthXp: strength,
          specialization,
          achievements,
        };
      });

      setMembers(enriched);
    } catch (err) {
      console.error('Failed to load clan members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrichedMembers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncClanFromWom();
      await fetchEnrichedMembers();
    } catch (e) {
      console.warn('Sync WOM error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter metrics based on category tab
  const filteredMetrics = METRICS.filter(m => activeTab === 'all' || m.category === activeTab);

  // Sorting members based on selected metric
  const getSortedMembers = () => {
    return [...members].sort((a, b) => {
      const valA = (a as any)[selectedMetric] || 0;
      const valB = (b as any)[selectedMetric] || 0;
      return valB - valA;
    });
  };

  const sortedMembers = getSortedMembers();

  // Filter by search query AND role specialization filter
  const displayedMembers = sortedMembers.filter(m => {
    const matchesSearch = 
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || m.specialization === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getCustomRankTitle = (pts: number) => {
    if (pts >= 11000) return 'Grandmaster Mislicker';
    if (pts >= 9000) return 'Expert Tile Clipper';
    if (pts >= 7000) return 'Brew Chugging Hero';
    if (pts >= 5000) return 'Slayer Choke Rookie';
    return 'Tile Skipper';
  };

  const getMetricValueString = (member: ExtendedMember, metricId: string) => {
    const val = (member as any)[metricId] || 0;
    if (metricId === 'xpGained') {
      return `${(val / 1_000_000).toFixed(2)}M XP`;
    }
    if (metricId.endsWith('Xp')) {
      return `${val.toLocaleString()} XP`;
    }
    if (metricId === 'clanPoints') {
      return `${val.toLocaleString()} PTS`;
    }
    return `${val.toLocaleString()} KC`;
  };

  const activeMetricLabel = METRICS.find(m => m.id === selectedMetric)?.label || 'Value';
  const activeMetricIcon = METRICS.find(m => m.id === selectedMetric)?.icon || '🏆';

  return (
    <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col min-h-[640px]">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-osrs-gold/10 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-osrs-dark border border-osrs-gold/20 shadow-inner">
            <Trophy className="w-5.5 h-5.5 text-osrs-gold animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-black text-lg tracking-wider text-gray-150 uppercase">
                {clanInfo?.name || 'Misclickerss'} Highscores
              </h3>
              <a
                href={`https://wiseoldman.net/groups/${REAL_WOM_GROUP_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono font-bold tracking-widest text-osrs-gold bg-osrs-gold/10 hover:bg-osrs-gold/20 px-2 py-0.5 rounded border border-osrs-gold/25 flex items-center gap-1 transition-all"
                title="View on Wise Old Man"
              >
                <span>WOM #{clanInfo?.id || REAL_WOM_GROUP_ID}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live roster & skill/boss efficiency stats synced directly from Wise Old Man Group #{REAL_WOM_GROUP_ID}.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-osrs-dark hover:bg-osrs-panelLight border border-osrs-gold/20 rounded-xl text-xs font-mono text-osrs-gold font-bold uppercase transition-all duration-300 disabled:opacity-50 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Wise Old Man'}</span>
          </button>
        </div>
      </div>

      {/* Wise Old Man Clan Overview Quick Stats Bar */}
      {clanInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 p-3 rounded-xl bg-osrs-dark/80 border border-osrs-gold/15">
          <div className="flex items-center gap-2.5 px-2">
            <Users className="w-4 h-4 text-osrs-gold shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Total Members</div>
              <div className="text-xs font-bold text-white font-mono">{clanInfo.memberCount} Players</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-2">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Homeworld</div>
              <div className="text-xs font-bold text-cyan-300 font-mono">World {clanInfo.homeworld}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">Clan Chat</div>
              <div className="text-xs font-bold text-amber-300 font-mono">{clanInfo.clanChat}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-2">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">WOM Score</div>
              <div className="text-xs font-bold text-emerald-300 font-mono">{clanInfo.score} Points</div>
            </div>
          </div>
        </div>
      )}

      {/* Role & Achievement Legend Filter Bar */}
      <div className="bg-osrs-dark/70 border border-osrs-gold/10 rounded-xl p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <Filter className="w-3.5 h-3.5 text-osrs-gold" />
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Role Badges:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
              roleFilter === 'all'
                ? 'bg-osrs-gold text-osrs-dark border-osrs-gold shadow-glow-gold'
                : 'bg-osrs-dark/50 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            All Roles ({members.length})
          </button>
          
          {(Object.keys(ROLE_CONFIGS) as ClanRoleBadge[]).map(roleKey => {
            const config = ROLE_CONFIGS[roleKey];
            const Icon = config.icon;
            const isSelected = roleFilter === roleKey;
            const count = members.filter(m => m.specialization === roleKey).length;
            
            return (
              <button
                key={roleKey}
                onClick={() => setRoleFilter(isSelected ? 'all' : roleKey)}
                title={config.description}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border ${
                  isSelected 
                    ? `${config.bg} ${config.text} ${config.border} ${config.glow} font-bold ring-1 ring-white/20`
                    : `bg-osrs-dark/40 ${config.text} ${config.border} opacity-80 hover:opacity-100`
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{config.label}</span>
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Categories & Sub-selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Left Column: Metric Selectors */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Main Category Tabs */}
          <div className="bg-osrs-dark p-1 rounded-xl border border-osrs-gold/10 grid grid-cols-4 gap-1 text-[9px] font-mono">
            {[
              { id: 'all', label: 'All' },
              { id: 'points', label: 'Pts' },
              { id: 'xp', label: 'XP' },
              { id: 'boss', label: 'Boss' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  // Auto-switch selected metric to the first of the new category to prevent glitches
                  const catMetrics = METRICS.filter(m => tab.id === 'all' || m.category === tab.id);
                  if (catMetrics.length > 0 && !catMetrics.some(cm => cm.id === selectedMetric)) {
                    setSelectedMetric(catMetrics[0].id);
                  }
                }}
                className={`py-1.5 px-1 rounded-lg font-bold text-center transition-all ${
                  activeTab === tab.id
                    ? 'bg-osrs-panelLight text-osrs-gold border border-osrs-gold/15 shadow-inner'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Metric list block */}
          <div className="bg-osrs-dark/40 border border-osrs-gold/10 rounded-xl p-2.5 max-h-[280px] lg:max-h-[360px] overflow-y-auto space-y-1 custom-scrollbar">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 font-bold px-2 block mb-1">Select Metric</span>
            {filteredMetrics.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all flex items-center justify-between ${
                  selectedMetric === m.id
                    ? 'bg-osrs-gold/10 text-osrs-gold border border-osrs-gold/20 font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-osrs-dark/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </span>
                {selectedMetric === m.id && <Sparkles className="w-3 h-3 text-osrs-gold animate-pulse shrink-0 ml-1" />}
              </button>
            ))}
          </div>

          {/* Quick Stats Search */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Search member, role, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/35 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-200 outline-none transition-all placeholder-gray-500 font-sans"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          </div>

        </div>

        {/* Right Columns: Main Highscores Table */}
        <div className="lg:col-span-3 bg-osrs-dark/30 border border-osrs-gold/10 rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Metric Status Header */}
          <div className="bg-osrs-dark/80 px-4 py-3.5 border-b border-osrs-gold/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeMetricIcon}</span>
              <span className="text-gray-400">Leaderboard:</span>
              <span className="text-osrs-gold font-bold uppercase">{activeMetricLabel}</span>
            </div>
            <span className="text-[10px] text-gray-500">{displayedMembers.length} Raiders logged</span>
          </div>

          {/* Main Highscores rows */}
          <div className="flex-1 overflow-x-auto">
            {loading || (globalLoading && (globalLoading.isShimmering || globalLoading.isWidgetLoading('leaderboard'))) ? (
              <div className="skeleton-shimmer">
                <LeaderboardTableSkeleton />
              </div>
            ) : displayedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
                <span className="text-xs font-mono text-gray-500">No clan member found matching your criteria</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-osrs-gold/10 bg-osrs-dark/50 text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4 text-center w-12">Rank</th>
                    <th className="py-3 px-4">Player & Role Badges</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Clan Staff</th>
                    <th className="py-3 px-4 hidden md:table-cell">Rank Title</th>
                    <th className="py-3 px-4 text-right pr-6">{activeMetricLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {displayedMembers.map((member) => {
                    // Compute absolute ranking index
                    const absoluteRank = sortedMembers.findIndex(sm => sm.id === member.id) + 1;
                    
                    // Role badge visual config
                    const roleConfig = ROLE_CONFIGS[member.specialization] || ROLE_CONFIGS.PvMer;
                    const RoleIcon = roleConfig.icon;

                    // Style first three positions with legendary glows and gradients
                    let rankBg = 'bg-osrs-dark/40';
                    let rankBorder = 'border-gray-800/60';
                    let rankText = 'text-gray-400';
                    let rowStyle = "hover:bg-osrs-panelLight/40 transition-all cursor-pointer group border-l-4 border-l-transparent";
                    let rankIcon = null;

                    if (absoluteRank === 1) {
                      rowStyle = "bg-gradient-to-r from-osrs-gold/15 via-osrs-gold/5 to-transparent hover:from-osrs-gold/20 border-l-4 border-l-osrs-gold transition-all cursor-pointer group shadow-glow-gold relative overflow-hidden";
                      rankBg = 'bg-gradient-to-b from-osrs-gold to-yellow-600 text-osrs-dark font-black';
                      rankBorder = 'border-osrs-gold shadow-[0_0_12px_rgba(225,176,51,0.5)]';
                      rankText = 'text-osrs-dark';
                      rankIcon = <Trophy className="w-4 h-4 text-osrs-gold shrink-0 animate-bounce" />;
                    } else if (absoluteRank === 2) {
                      rowStyle = "bg-gradient-to-r from-osrs-rune/15 via-osrs-rune/5 to-transparent hover:from-osrs-rune/20 border-l-4 border-l-osrs-rune transition-all cursor-pointer group shadow-glow-rune relative overflow-hidden";
                      rankBg = 'bg-gradient-to-b from-osrs-rune to-blue-600 text-white font-bold';
                      rankBorder = 'border-osrs-rune shadow-[0_0_10px_rgba(74,153,232,0.4)]';
                      rankText = 'text-white';
                      rankIcon = <Award className="w-4 h-4 text-osrs-rune shrink-0 animate-pulse" />;
                    } else if (absoluteRank === 3) {
                      rowStyle = "bg-gradient-to-r from-osrs-crimson/15 via-osrs-crimson/5 to-transparent hover:from-osrs-crimson/20 border-l-4 border-l-osrs-crimson transition-all cursor-pointer group shadow-glow-crimson relative overflow-hidden";
                      rankBg = 'bg-gradient-to-b from-osrs-crimson to-red-600 text-white font-bold';
                      rankBorder = 'border-osrs-crimson shadow-[0_0_10px_rgba(232,69,69,0.4)]';
                      rankText = 'text-white';
                      rankIcon = <Sparkles className="w-4 h-4 text-osrs-crimson shrink-0" />;
                    }

                    return (
                      <tr 
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={rowStyle}
                      >
                        {/* Rank Badge Column */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-[10px] font-mono ${rankBg} ${rankBorder} ${rankText}`}>
                            {absoluteRank}
                          </span>
                        </td>

                        {/* Name & Role Badges Column */}
                        <td className="py-3.5 px-4 font-sans text-gray-200">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold group-hover:text-osrs-gold transition-colors">{member.username}</span>
                            {rankIcon}

                            {/* Small generated role badge icon next to player name */}
                            <span 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border} ${roleConfig.glow} transition-transform group-hover:scale-105`}
                              title={`${roleConfig.label}: ${roleConfig.description}`}
                            >
                              <RoleIcon className="w-3 h-3 shrink-0" />
                              <span>{roleConfig.label}</span>
                            </span>

                            {/* Achievement Mini Tag if member has Infernal / Raid mastery */}
                            {member.coxKc + member.tobKc >= 30 && (
                              <span 
                                className="inline-flex items-center p-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                                title="Raids Veteran (CoX/ToB Clears)"
                              >
                                <Star className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Clan Staff Column */}
                        <td className="py-3.5 px-4 hidden sm:table-cell">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            member.role === 'Leader'
                              ? 'bg-osrs-gold/10 border-osrs-gold/30 text-osrs-gold font-bold'
                              : member.role === 'Admin'
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                              : 'bg-osrs-dark/50 border-gray-800 text-gray-400'
                          }`}>
                            {member.role === 'Leader' && <Shield className="w-3 h-3 text-osrs-gold" />}
                            {member.role === 'Admin' && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                            <span>{member.role}</span>
                          </span>
                        </td>

                        {/* Rank Title Column */}
                        <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[10px] text-gray-400">
                          {getCustomRankTitle(member.clanPoints)}
                        </td>

                        {/* Value Column */}
                        <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-xs text-osrs-gold">
                          {getMetricValueString(member, selectedMetric)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

      {/* Member detailed stats & Unlocked Achievements popup modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-osrs-panel border border-osrs-gold max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative p-6 space-y-5">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-osrs-gold/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-osrs-dark rounded-xl border border-osrs-gold/30 flex items-center justify-center text-xl shadow-inner">
                  {(() => {
                    const RoleIcon = ROLE_CONFIGS[selectedMember.specialization]?.icon || Skull;
                    return <RoleIcon className="w-6 h-6 text-osrs-gold animate-pulse" />;
                  })()}
                </div>
                <div>
                  <h4 className="text-base font-serif font-black text-gray-150 flex items-center gap-2">
                    <span>{selectedMember.username}</span>
                    <span className="text-[9px] font-mono bg-osrs-gold/10 px-1.5 py-0.5 rounded text-osrs-gold border border-osrs-gold/20">
                      {selectedMember.role}
                    </span>
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const config = ROLE_CONFIGS[selectedMember.specialization];
                      const Icon = config?.icon || Swords;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${config.bg} ${config.text} ${config.border}`}>
                          <Icon className="w-3 h-3" />
                          <span>{config.label} Specialization</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-white transition-colors bg-osrs-dark/80 p-1.5 rounded-lg border border-osrs-gold/15"
              >
                ✕
              </button>
            </div>

            {/* Unlocked Achievements & Badges showcase */}
            <div className="bg-osrs-dark/60 border border-osrs-gold/10 rounded-xl p-3.5 space-y-2">
              <span className="text-[9px] font-mono uppercase text-gray-400 font-bold block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-osrs-gold" />
                <span>Unlocked Achievements & Badges</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.achievements.map((ach, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono bg-osrs-panel border border-osrs-gold/20 text-gray-200 shadow-sm"
                  >
                    <Star className="w-3 h-3 text-osrs-gold" />
                    <span>{ach}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Total XP</span>
                <span className="text-xs font-mono font-bold text-white">
                  {((selectedMember.xpGained || 0) / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Clan Points</span>
                <span className="text-xs font-mono font-bold text-osrs-gold">
                  {selectedMember.clanPoints.toLocaleString()}
                </span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Total Boss KC</span>
                <span className="text-xs font-mono font-bold text-osrs-crimson">
                  {selectedMember.bossKc?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Boss Killcounts details */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-mono uppercase text-gray-500 font-bold block">Boss Killcounts</span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">Vorkath</span>
                  <span className="text-gray-250 font-bold">{selectedMember.vorkathKc} KC</span>
                </div>
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">Zulrah</span>
                  <span className="text-gray-250 font-bold">{selectedMember.zulrahKc} KC</span>
                </div>
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">Graardor</span>
                  <span className="text-gray-250 font-bold">{selectedMember.graardorKc} KC</span>
                </div>
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">CoX</span>
                  <span className="text-gray-250 font-bold">{selectedMember.coxKc} KC</span>
                </div>
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">ToB</span>
                  <span className="text-gray-250 font-bold">{selectedMember.tobKc} KC</span>
                </div>
                <div className="bg-osrs-dark/30 p-2 rounded-lg border border-gray-800">
                  <span className="text-gray-500 block text-[9px] uppercase">ToA</span>
                  <span className="text-gray-250 font-bold">{selectedMember.toaKc} KC</span>
                </div>
              </div>
            </div>

            {/* Close action */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="w-full bg-osrs-gold hover:bg-osrs-goldHover active:scale-95 text-osrs-dark text-xs uppercase font-extrabold font-sans py-2.5 rounded-xl transition-all"
              >
                Close Profile View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
