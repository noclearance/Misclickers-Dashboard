import React, { useState } from 'react';
import {
  Trophy, Coins, Sparkles, MessageSquare, ExternalLink,
  X, Check, Send, ShieldCheck, Flame, Award, Gift, Radio, Share2
} from 'lucide-react';
import type { BotRewardAnnouncement, RewardTier } from '../types';
import { announceRewardApi, claimRewardApi } from '../services/api';

interface DiscordRewardEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReward?: BotRewardAnnouncement | null;
  allRewards?: BotRewardAnnouncement[];
  onRewardAnnounced?: (reward: BotRewardAnnouncement) => void;
}

export const DiscordRewardEmbedModal: React.FC<DiscordRewardEmbedModalProps> = ({
  isOpen,
  onClose,
  selectedReward,
  allRewards = [],
  onRewardAnnounced,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [activeRewardId, setActiveRewardId] = useState<string>(
    selectedReward?.id || allRewards[0]?.id || 'rew-botw-1'
  );
  
  // Create / announce form state
  const [formEventType, setFormEventType] = useState<'Boss of the Week' | 'Skill of the Week' | 'Bingo' | 'Raffle' | 'Clan Milestone'>('Skill of the Week');
  const [formCompTitle, setFormCompTitle] = useState('Fishing Sprint - Skill of the Week');
  const [formPrizePool, setFormPrizePool] = useState('12,000,000 Gold Coins + Guild Credits');
  const [formFirstGp, setFormFirstGp] = useState('12,000,000 Gold Coins (12M GP)');
  const [formFirstPoints, setFormFirstPoints] = useState(2500);
  const [formFirstRole, setFormFirstRole] = useState('👑 SOTW Champion');
  const [formFirstItem, setFormFirstItem] = useState('SOTW Champion Role & Clan Trophy');
  const [formSecondGp, setFormSecondGp] = useState('Guild Credits Reward');
  const [formSecondPoints, setFormSecondPoints] = useState(1200);
  const [formThirdGp, setFormThirdGp] = useState('Guild Credits Reward');
  const [formThirdPoints, setFormThirdPoints] = useState(600);
  const [formSponsor, setFormSponsor] = useState('Clan Vault & Leadership (Inwarth)');
  const [formChannel, setFormChannel] = useState('#announcements');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Claim modal state
  const [claimUsername, setClaimUsername] = useState('Inwarth');
  const [isClaiming, setIsClaiming] = useState(false);

  // Reactions state for discord interactivity
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    '🎉': 34,
    '💰': 28,
    '⚔️': 19,
    '🦀': 14
  });
  const [userReacted, setUserReacted] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const currentReward = 
    allRewards.find(r => r.id === activeRewardId) || 
    selectedReward || 
    allRewards[0];
  const formatRewardChannel = (channel?: string) =>
    channel === '#events' ? '#events (Bingo & events)' : (channel || '#announcements');

  const handleToggleReaction = (emoji: string) => {
    setUserReacted(prev => {
      const active = !prev[emoji];
      setReactions(rPrev => ({
        ...rPrev,
        [emoji]: (rPrev[emoji] || 0) + (active ? 1 : -1)
      }));
      return { ...prev, [emoji]: active };
    });
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const payload: Partial<BotRewardAnnouncement> = {
        competitionTitle: formCompTitle,
        eventType: formEventType,
        title: `🏆 ${formEventType} Official Prize Pool Announcement`,
        prizePool: formPrizePool,
        firstPlace: {
          gp: formFirstGp,
          points: Number(formFirstPoints),
          roleReward: formFirstRole,
          itemReward: formFirstItem,
          title: '1st Place Champion'
        },
        secondPlace: {
          gp: formSecondGp,
          points: Number(formSecondPoints),
          roleReward: '🥈 Runner-Up',
          title: '2nd Place'
        },
        thirdPlace: {
          gp: formThirdGp,
          points: Number(formThirdPoints),
          roleReward: '🥉 Contender',
          title: '3rd Place'
        },
        sponsor: formSponsor,
        discordChannel: formChannel,
        discordEmbedColor: formEventType === 'Boss of the Week' ? '#f59e0b' : formEventType === 'Skill of the Week' ? '#3b82f6' : '#10b981'
      };

      const res: any = await announceRewardApi(payload);
      if (res?.reward) {
        onRewardAnnounced?.(res.reward);
        setActiveRewardId(res.reward.id);
        setActiveTab('view');
        setSubmitFeedback('Reward announced! Real-time SSE alert dispatched to all clan members.');
      }
    } catch (err: any) {
      setSubmitFeedback(`Error announcing reward: ${err.message || 'Failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimReward = async () => {
    if (!currentReward) return;
    setIsClaiming(true);
    try {
      await claimRewardApi(currentReward.id, claimUsername);
      currentReward.claimedBy = claimUsername;
      currentReward.active = false;
      setSubmitFeedback(`Payout settled! Marked as claimed by ${claimUsername}.`);
    } catch (err: any) {
      setSubmitFeedback(`Claim failed: ${err.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div id="discord-reward-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        id="discord-reward-modal-container"
        className="bg-[#1e1f22] text-[#dbdee1] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#313338] relative flex flex-col max-h-[92vh]"
      >
        {/* Discord Header Bar */}
        <div className="bg-[#141517] px-6 py-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-lg border border-indigo-400/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-1.5">
                  <span>Discord Bot Reward Announcement Hub</span>
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/40">
                  <ShieldCheck className="w-3 h-3" />
                  Bot Verified
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Official BOTW, SOTW & Bingo prize broadcasts announced by <span className="text-[#5865F2] font-semibold">@Venny</span> in Discord
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-[#2b2d31] hover:bg-[#35373c] p-2 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Channel Sub-Bar */}
        <div className="bg-[#18191c] px-6 py-2.5 border-b border-[#2b2d31] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'view'
                  ? 'bg-[#5865F2] text-white shadow-md'
                  : 'bg-[#2b2d31] text-gray-300 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Live Discord Embed
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-[#5865F2] text-white shadow-md'
                  : 'bg-[#2b2d31] text-gray-300 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Broadcast New Reward
            </button>
          </div>

          <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
            <span className="text-gray-500">Channel:</span>
            <span className="text-indigo-400 font-semibold bg-[#2b2d31] px-2 py-0.5 rounded">
              {formatRewardChannel(currentReward?.discordChannel)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#2b2d31]">
          {submitFeedback && (
            <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl flex items-center justify-between">
              <span>{submitFeedback}</span>
              <button onClick={() => setSubmitFeedback(null)} className="text-emerald-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: VIEW DISCORD EMBED */}
          {activeTab === 'view' && (
            <div className="space-y-5">
              {/* Reward Selector Pills if multiple */}
              {allRewards.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {allRewards.map(rew => (
                    <button
                      key={rew.id}
                      onClick={() => setActiveRewardId(rew.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                        activeRewardId === rew.id
                          ? 'bg-osrs-panel border border-osrs-gold text-osrs-gold shadow-md'
                          : 'bg-[#1e1f22] border border-transparent text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rew.discordEmbedColor || '#f59e0b' }} />
                      <span className="truncate max-w-[200px]">{rew.competitionTitle}</span>
                      <span className="font-mono text-[10px] text-gray-500">({rew.prizePool.split('+')[0].trim()})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* AUTHENTIC DISCORD MESSAGE CONTAINER */}
              <div className="bg-[#313338] rounded-xl p-4 sm:p-5 border border-[#383a40] space-y-3 shadow-xl">
                {/* Discord Message Author Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ring-2 ring-indigo-400/40">
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                        {currentReward?.announcedBy || 'Venny Discord Bot'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#5865F2] text-white uppercase tracking-wider">
                        BOT
                      </span>
                      <span className="text-xs text-[#949ba4] font-mono">
                        {currentReward?.timestamp || 'Today at 12:00 PM'}
                      </span>
                    </div>

                    <div className="text-xs text-[#dbdee1] mt-1 space-y-1">
                      <p>
                        <span className="text-[#5865F2] font-semibold bg-[#5865F2]/10 px-1 py-0.5 rounded">@everyone</span>
                        {' '}📢 <strong className="text-white">REWARD ANNOUNCEMENT:</strong> The prize bounty for <span className="text-osrs-gold font-bold">{currentReward?.competitionTitle}</span> has been locked and verified in the clan vault!
                      </p>
                    </div>
                  </div>
                </div>

                {/* DISCORD EMBED BLOCK */}
                <div 
                  className="ml-0 sm:ml-12 rounded-lg bg-[#2b2d31] p-4 border-l-4 shadow-inner space-y-3 relative overflow-hidden"
                  style={{ borderLeftColor: currentReward?.discordEmbedColor || '#f59e0b' }}
                >
                  {/* Decorative background glow */}
                  <div 
                    className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ backgroundColor: currentReward?.discordEmbedColor || '#f59e0b' }}
                  />

                  {/* Embed Author */}
                  <div className="flex items-center justify-between text-xs text-[#949ba4]">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-osrs-gold" />
                      <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
                        Misclickerz • Official Event Bounty
                      </span>
                    </div>
                    {currentReward?.active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Prize Bounty
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Claimed by {currentReward?.claimedBy}
                      </span>
                    )}
                  </div>

                  {/* Embed Title */}
                  <h4 className="text-base font-bold text-white font-serif flex items-center gap-2">
                    <span>{currentReward?.title}</span>
                  </h4>

                  {/* Prize Pool Highlight Hero */}
                  <div className="bg-[#1e1f22] p-3.5 rounded-xl border border-osrs-gold/20 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold">
                        Guaranteed Prize Pool
                      </div>
                      <div className="text-lg sm:text-xl font-display font-extrabold text-osrs-gold flex items-center gap-2">
                        <Coins className="w-5 h-5 text-osrs-gold" />
                        <span>{currentReward?.prizePool}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-gray-400 block text-[10px]">Sponsor / Vault</span>
                      <span className="text-gray-200 font-semibold">{currentReward?.sponsor || 'Clan Vault'}</span>
                    </div>
                  </div>

                  {/* Embed Fields: 1st, 2nd, 3rd Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    {/* 1st Place */}
                    <div className="bg-[#1e1f22] p-3 rounded-lg border border-amber-500/30 space-y-1 relative">
                      <div className="flex items-center justify-between text-amber-400 font-bold">
                        <span className="flex items-center gap-1">🥇 1st Place</span>
                        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">Champion</span>
                      </div>
                      <p className="text-sm font-bold text-white font-mono">{currentReward?.firstPlace?.gp}</p>
                      <p className="text-[11px] text-osrs-gold font-semibold">+{currentReward?.firstPlace?.points} Clan Pts</p>
                      {currentReward?.firstPlace?.roleReward && (
                        <p className="text-[10px] text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate">
                          {currentReward?.firstPlace.roleReward}
                        </p>
                      )}
                      {currentReward?.firstPlace?.itemReward && (
                        <p className="text-[10px] text-emerald-300 font-mono truncate">
                          🎁 {currentReward.firstPlace.itemReward}
                        </p>
                      )}
                    </div>

                    {/* 2nd Place */}
                    <div className="bg-[#1e1f22] p-3 rounded-lg border border-gray-600/30 space-y-1">
                      <div className="flex items-center justify-between text-gray-300 font-bold">
                        <span className="flex items-center gap-1">🥈 2nd Place</span>
                        <span className="text-[10px] bg-gray-600/30 px-1.5 py-0.5 rounded text-gray-300">Runner-Up</span>
                      </div>
                      <p className="text-sm font-bold text-white font-mono">{currentReward?.secondPlace?.gp || '25M GP'}</p>
                      <p className="text-[11px] text-osrs-gold font-semibold">+{currentReward?.secondPlace?.points || 1200} Clan Pts</p>
                      {currentReward?.secondPlace?.roleReward && (
                        <p className="text-[10px] text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate">
                          {currentReward.secondPlace.roleReward}
                        </p>
                      )}
                    </div>

                    {/* 3rd Place */}
                    <div className="bg-[#1e1f22] p-3 rounded-lg border border-amber-700/30 space-y-1">
                      <div className="flex items-center justify-between text-amber-600 font-bold">
                        <span className="flex items-center gap-1">🥉 3rd Place</span>
                        <span className="text-[10px] bg-amber-700/20 px-1.5 py-0.5 rounded text-amber-400">Contender</span>
                      </div>
                      <p className="text-sm font-bold text-white font-mono">{currentReward?.thirdPlace?.gp || '10M GP'}</p>
                      <p className="text-[11px] text-osrs-gold font-semibold">+{currentReward?.thirdPlace?.points || 500} Clan Pts</p>
                      {currentReward?.thirdPlace?.roleReward && (
                        <p className="text-[10px] text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate">
                          {currentReward.thirdPlace.roleReward}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Embed Footer */}
                  <div className="pt-2 border-t border-gray-700/40 flex items-center justify-between text-[11px] text-[#949ba4]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Payout backed by Misclickerz Treasury • Automated Discord Role Assignment
                    </span>
                    <span className="font-mono">{currentReward?.eventType}</span>
                  </div>
                </div>

                {/* Discord Reactions Toolbar */}
                <div className="ml-0 sm:ml-12 flex flex-wrap items-center gap-2 pt-1">
                  {Object.entries(reactions).map(([emoji, count]) => {
                    const isSelected = userReacted[emoji];
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(emoji)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-[#5865F2]/20 border-[#5865F2] text-[#5865F2]'
                            : 'bg-[#2b2d31] border-[#383a40] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="font-mono text-[11px]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settlement / Winner Claim Action */}
              <div className="bg-[#1e1f22] p-4 rounded-xl border border-gray-700/60 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h5 className="font-bold text-white text-xs">Event Winner Settlement</h5>
                  <p className="text-xs text-gray-400">
                    Once the competition concludes in Wise Old Man, payout confirmation is sent through Venny.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={claimUsername}
                    onChange={(e) => setClaimUsername(e.target.value)}
                    placeholder="Winner RSN"
                    className="bg-[#2b2d31] border border-gray-700 text-white text-xs px-3 py-2 rounded-lg font-mono focus:border-osrs-gold outline-none"
                  />
                  <button
                    onClick={handleClaimReward}
                    disabled={isClaiming || !currentReward?.active}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      currentReward?.active
                        ? 'bg-osrs-gold text-osrs-dark hover:bg-yellow-500 shadow-md'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {isClaiming ? 'Settling...' : currentReward?.active ? 'Confirm Payout' : 'Paid Out'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BROADCAST NEW REWARD FORM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                  Broadcast Live Reward Announcement via Venny
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  Publishing this announcement simulates the Discord bot’s <code className="text-osrs-gold font-mono">/announce_reward</code> command, updating the web dashboard, SSE event stream, and clan prize pool cards immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Event Category</label>
                  <select
                    value={formEventType}
                    onChange={(e) => setFormEventType(e.target.value as any)}
                    className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-osrs-gold outline-none"
                  >
                    <option value="Boss of the Week">Boss of the Week (BOTW)</option>
                    <option value="Skill of the Week">Skill of the Week (SOTW)</option>
                    <option value="Bingo">Clan Bingo Board</option>
                    <option value="Raffle">Clan Raffle</option>
                    <option value="Clan Milestone">Clan Milestone Bounty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Competition Title</label>
                  <input
                    type="text"
                    value={formCompTitle}
                    onChange={(e) => setFormCompTitle(e.target.value)}
                    required
                    className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-osrs-gold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Total Prize Pool Tag</label>
                  <input
                    type="text"
                    value={formPrizePool}
                    onChange={(e) => setFormPrizePool(e.target.value)}
                    placeholder="e.g. 150,000,000 GP + 5,000 Pts"
                    required
                    className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-osrs-gold font-mono font-bold focus:border-osrs-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Discord Broadcast Channel</label>
                  <input
                    type="text"
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-mono focus:border-osrs-gold outline-none"
                  />
                </div>
              </div>

              {/* Tier breakdown */}
              <div className="bg-[#1e1f22] p-4 rounded-xl border border-gray-700/50 space-y-3">
                <h5 className="text-xs font-bold text-osrs-gold uppercase tracking-wider">Reward Tiers Breakdown</h5>
                
                {/* 1st Place */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">1st GP Payout</label>
                    <input
                      type="text"
                      value={formFirstGp}
                      onChange={(e) => setFormFirstGp(e.target.value)}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">1st Clan Points</label>
                    <input
                      type="number"
                      value={formFirstPoints}
                      onChange={(e) => setFormFirstPoints(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">1st Discord Role</label>
                    <input
                      type="text"
                      value={formFirstRole}
                      onChange={(e) => setFormFirstRole(e.target.value)}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">1st Bonus Item/Bonds</label>
                    <input
                      type="text"
                      value={formFirstItem}
                      onChange={(e) => setFormFirstItem(e.target.value)}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs"
                    />
                  </div>
                </div>

                {/* 2nd & 3rd Place */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">2nd GP Payout</label>
                    <input
                      type="text"
                      value={formSecondGp}
                      onChange={(e) => setFormSecondGp(e.target.value)}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">2nd Clan Points</label>
                    <input
                      type="number"
                      value={formSecondPoints}
                      onChange={(e) => setFormSecondPoints(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">3rd GP Payout</label>
                    <input
                      type="text"
                      value={formThirdGp}
                      onChange={(e) => setFormThirdGp(e.target.value)}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">3rd Clan Points</label>
                    <input
                      type="number"
                      value={formThirdPoints}
                      onChange={(e) => setFormThirdPoints(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-gray-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Vault Sponsor / Donors</label>
                <input
                  type="text"
                  value={formSponsor}
                  onChange={(e) => setFormSponsor(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-osrs-gold outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white bg-[#1e1f22]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#5865F2] hover:bg-indigo-600 text-white shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Broadcasting...' : 'Publish Discord Announcement'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
