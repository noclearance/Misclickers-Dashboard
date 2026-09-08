import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Search,
  Shield,
  RefreshCw,
  Award,
  Sparkles,
  User,
  ExternalLink,
  Crown,
  Users,
  Globe,
  Info
} from 'lucide-react';
import type { ClanInfo, ClanMember } from '../types';
import { getClanInfo, getClanMembers, REAL_WOM_GROUP_ID, syncClanFromWom } from '../services/api';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';
import { LeaderboardTableSkeleton } from './skeletons/LeaderboardTableSkeleton';

type MetricKey = 'clanPoints' | 'xpGained' | 'bossKc' | 'ehb' | 'ehp';
type MetricCategory = 'all' | 'points' | 'xp' | 'boss' | 'efficiency';

interface MetricDef {
  id: MetricKey;
  label: string;
  icon: string;
  category: Exclude<MetricCategory, 'all'>;
}

const METRICS: MetricDef[] = [
  { id: 'clanPoints', label: 'Clan Points', icon: '🏆', category: 'points' },
  { id: 'xpGained', label: 'Total XP', icon: '⚡', category: 'xp' },
  { id: 'bossKc', label: 'Boss KC', icon: '💀', category: 'boss' },
  { id: 'ehb', label: 'EHB', icon: '📈', category: 'efficiency' },
  { id: 'ehp', label: 'EHP', icon: '🧠', category: 'efficiency' }
];

const roleBadgeClass = (role: string): string => {
  const normalized = role.toLowerCase();
  if (normalized.includes('owner')) {
    return 'bg-osrs-gold/10 border-osrs-gold/30 text-osrs-gold';
  }
  if (normalized.includes('deputy') || normalized.includes('commander') || normalized.includes('captain')) {
    return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
  }
  return 'bg-osrs-dark/50 border-gray-800 text-gray-300';
};

const getMetricValue = (member: ClanMember, metricId: MetricKey): number => {
  switch (metricId) {
    case 'clanPoints':
      return member.clanPoints || 0;
    case 'xpGained':
      return member.xpGained || 0;
    case 'bossKc':
      return member.bossKc || 0;
    case 'ehb':
      return member.ehb || 0;
    case 'ehp':
      return member.ehp || 0;
    default:
      return 0;
  }
};

const getMetricValueString = (member: ClanMember, metricId: MetricKey): string => {
  const value = getMetricValue(member, metricId);
  if (metricId === 'xpGained') return `${(value / 1_000_000).toFixed(2)}M XP`;
  if (metricId === 'clanPoints') return `${value.toLocaleString()} PTS`;
  if (metricId === 'ehb' || metricId === 'ehp') return value.toFixed(2);
  return `${value.toLocaleString()} KC`;
};

export const ClanLeaderboard: React.FC = () => {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // Optional for standalone rendering contexts.
  }

  const [members, setMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('clanPoints');
  const [activeTab, setActiveTab] = useState<MetricCategory>('all');
  const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const [basicMembers, fetchedClanInfo] = await Promise.all([getClanMembers(), getClanInfo()]);
      setMembers(basicMembers);
      setClanInfo(fetchedClanInfo);
    } catch (err) {
      console.error('Failed to load clan members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncClanFromWom();
      await fetchMembers();
    } catch (err) {
      console.warn('Sync WOM error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredMetrics = METRICS.filter((metric) => activeTab === 'all' || metric.category === activeTab);

  const sortedMembers = [...members].sort((a, b) => {
    const aVal = getMetricValue(a, selectedMetric);
    const bVal = getMetricValue(b, selectedMetric);
    return bVal - aVal;
  });

  const displayedMembers = sortedMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.username.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      (member.type || '').toLowerCase().includes(query)
    );
  });

  const activeMetric = METRICS.find((metric) => metric.id === selectedMetric);

  return (
    <div className="motion-module-enter bg-osrs-panel border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col min-h-[640px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-osrs-gold/10 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-osrs-dark border border-osrs-gold/20 shadow-inner">
            <Trophy className="w-5.5 h-5.5 text-osrs-gold animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-black text-lg tracking-wider text-gray-150 uppercase">
                {clanInfo?.name || 'Misclickerz'} Highscores
              </h3>
              <a
                href={`https://wiseoldman.net/groups/${REAL_WOM_GROUP_ID}`}
                target="_blank"
                rel="noreferrer"
                className="theme-link-info text-[10px] font-mono font-bold tracking-widest bg-osrs-rune/10 hover:bg-osrs-rune/20 px-2 py-0.5 rounded border border-osrs-rune/30 flex items-center gap-1 transition-all"
                title="View on Wise Old Man"
              >
                <span>WOM #{clanInfo?.id || REAL_WOM_GROUP_ID}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live roster and metrics synced directly from Wise Old Man Group #{REAL_WOM_GROUP_ID}.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-osrs-dark hover:bg-osrs-panelLight border border-osrs-gold/20 rounded-xl text-xs font-mono text-osrs-gold font-bold uppercase transition-all duration-300 disabled:opacity-50 shadow self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Wise Old Man'}</span>
        </button>
      </div>

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
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono text-gray-400">WOM Score</div>
              <div className="text-xs font-bold text-emerald-300 font-mono">{clanInfo.score} Points</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-osrs-dark p-1 rounded-xl border border-osrs-gold/10 grid grid-cols-5 gap-1 text-[9px] font-mono">
            {[
              { id: 'all', label: 'All' },
              { id: 'points', label: 'Pts' },
              { id: 'xp', label: 'XP' },
              { id: 'boss', label: 'Boss' },
              { id: 'efficiency', label: 'Eff' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const nextTab = tab.id as MetricCategory;
                  setActiveTab(nextTab);
                  const candidateMetrics = METRICS.filter((metric) => nextTab === 'all' || metric.category === nextTab);
                  if (candidateMetrics.length > 0 && !candidateMetrics.some((metric) => metric.id === selectedMetric)) {
                    setSelectedMetric(candidateMetrics[0].id);
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

          <div className="bg-osrs-dark/40 border border-osrs-gold/10 rounded-xl p-2.5 max-h-[320px] overflow-y-auto space-y-1 custom-scrollbar">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 font-bold px-2 block mb-1">Select Metric</span>
            {filteredMetrics.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all flex items-center justify-between ${
                  selectedMetric === metric.id
                    ? 'bg-osrs-gold/10 text-osrs-gold border border-osrs-gold/20 font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-osrs-dark/50 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{metric.icon}</span>
                  <span className="truncate">{metric.label}</span>
                </span>
                {selectedMetric === metric.id && <Sparkles className="w-3 h-3 text-osrs-gold animate-pulse shrink-0 ml-1" />}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search member, role, or account type..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-osrs-dark border border-osrs-gold/15 focus:border-osrs-gold/35 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-200 outline-none transition-all placeholder-gray-500 font-sans"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div className="lg:col-span-3 bg-osrs-dark/30 border border-osrs-gold/10 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-osrs-dark/80 px-4 py-3.5 border-b border-osrs-gold/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-base">{activeMetric?.icon || '🏆'}</span>
              <span className="text-gray-400">Leaderboard:</span>
              <span className="text-osrs-gold font-bold uppercase">{activeMetric?.label || 'Metric'}</span>
            </div>
            <span className="text-[10px] text-gray-500">{displayedMembers.length} members shown</span>
          </div>

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
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 hidden sm:table-cell">WOM Role</th>
                    <th className="py-3 px-4 hidden md:table-cell">Account Type</th>
                    <th className="py-3 px-4 text-right pr-6">{activeMetric?.label || 'Metric'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {displayedMembers.map((member) => {
                    const absoluteRank = sortedMembers.findIndex((sortedMember) => sortedMember.id === member.id) + 1;

                    let rowStyle = 'hover:bg-osrs-panelLight/40 transition-all cursor-pointer group border-l-4 border-l-transparent';
                    let rankBg = 'bg-osrs-dark/40';
                    let rankBorder = 'border-gray-800/60';
                    let rankText = 'text-gray-400';
                    let valueText = 'text-gray-200';
                    let rankIcon: React.ReactNode = null;

                    if (absoluteRank === 1) {
                      rowStyle = 'bg-gradient-to-r from-osrs-gold/15 via-osrs-gold/5 to-transparent hover:from-osrs-gold/20 border-l-4 border-l-osrs-gold transition-all cursor-pointer group shadow-glow-gold relative overflow-hidden';
                      rankBg = 'bg-gradient-to-b from-osrs-gold to-yellow-600 text-osrs-dark font-black';
                      rankBorder = 'border-osrs-gold shadow-[0_0_12px_rgba(225,176,51,0.5)]';
                      rankText = 'text-osrs-dark';
                      valueText = 'text-osrs-gold';
                      rankIcon = <Trophy className="w-4 h-4 text-osrs-gold shrink-0 animate-bounce" />;
                    } else if (absoluteRank === 2) {
                      rowStyle = 'bg-gradient-to-r from-osrs-rune/15 via-osrs-rune/5 to-transparent hover:from-osrs-rune/20 border-l-4 border-l-osrs-rune transition-all cursor-pointer group shadow-glow-rune relative overflow-hidden';
                      rankBg = 'bg-gradient-to-b from-osrs-rune to-blue-600 text-white font-bold';
                      rankBorder = 'border-osrs-rune shadow-[0_0_10px_rgba(74,153,232,0.4)]';
                      rankText = 'text-white';
                      valueText = 'text-osrs-rune';
                      rankIcon = <Award className="w-4 h-4 text-osrs-rune shrink-0 animate-pulse" />;
                    } else if (absoluteRank === 3) {
                      rowStyle = 'bg-gradient-to-r from-osrs-crimson/15 via-osrs-crimson/5 to-transparent hover:from-osrs-crimson/20 border-l-4 border-l-osrs-crimson transition-all cursor-pointer group shadow-glow-crimson relative overflow-hidden';
                      rankBg = 'bg-gradient-to-b from-osrs-crimson to-red-600 text-white font-bold';
                      rankBorder = 'border-osrs-crimson shadow-[0_0_10px_rgba(232,69,69,0.4)]';
                      rankText = 'text-white';
                      valueText = 'text-osrs-crimson';
                      rankIcon = <Sparkles className="w-4 h-4 text-osrs-crimson shrink-0" />;
                    }

                    return (
                      <tr key={member.id} onClick={() => setSelectedMember(member)} className={rowStyle}>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-[10px] font-mono ${rankBg} ${rankBorder} ${rankText}`}>
                            {absoluteRank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-sans text-gray-200">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold group-hover:text-osrs-gold transition-colors">{member.username}</span>
                            {rankIcon}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 hidden sm:table-cell">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${roleBadgeClass(member.role)}`}>
                            {(member.role.toLowerCase().includes('owner') || member.role.toLowerCase().includes('deputy')) && (
                              <Shield className="w-3 h-3 shrink-0" />
                            )}
                            <span>{member.role || 'Member'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                          {member.type || 'main'}
                        </td>

                        <td className={`py-3.5 px-4 text-right pr-6 font-mono font-black text-xs ${valueText}`}>
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

      {selectedMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-osrs-panel border border-osrs-gold max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl relative p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-osrs-gold/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-osrs-dark rounded-xl border border-osrs-gold/30 flex items-center justify-center text-xl shadow-inner">
                  <User className="w-6 h-6 text-osrs-gold animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-black text-gray-150">{selectedMember.username}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${roleBadgeClass(selectedMember.role)}`}>
                      {selectedMember.role || 'Member'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-osrs-dark/50 border-gray-800 text-gray-400 uppercase">
                      {selectedMember.type || 'main'}
                    </span>
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Clan Points</span>
                <span className="text-xs font-mono font-bold text-osrs-gold">{(selectedMember.clanPoints || 0).toLocaleString()}</span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Total XP</span>
                <span className="text-xs font-mono font-bold text-white">{((selectedMember.xpGained || 0) / 1_000_000).toFixed(2)}M</span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">Boss KC</span>
                <span className="text-xs font-mono font-bold text-osrs-crimson">{(selectedMember.bossKc || 0).toLocaleString()}</span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">EHB</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{(selectedMember.ehb || 0).toFixed(2)}</span>
              </div>
              <div className="bg-osrs-dark/50 border border-osrs-gold/5 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-gray-500 uppercase block">EHP</span>
                <span className="text-xs font-mono font-bold text-emerald-300">{(selectedMember.ehp || 0).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full bg-osrs-gold hover:bg-osrs-goldHover active:scale-95 text-osrs-dark text-xs uppercase font-extrabold font-sans py-2.5 rounded-xl transition-all"
            >
              Close Profile View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
