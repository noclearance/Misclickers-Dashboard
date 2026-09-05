import React, { useState } from 'react';
import { 
  Trophy, Coins, Sparkles, MessageSquare, ExternalLink, 
  Flame, Award, ShieldCheck, ChevronRight, Bell, Gift, Radio
} from 'lucide-react';
import type { BotRewardAnnouncement } from '../types';

interface RewardAnnouncementBannerProps {
  rewards: BotRewardAnnouncement[];
  onOpenRewardModal: (reward?: BotRewardAnnouncement) => void;
  onOpenBotModal?: () => void;
}

export const RewardAnnouncementBanner: React.FC<RewardAnnouncementBannerProps> = ({
  rewards,
  onOpenRewardModal,
  onOpenBotModal,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const formatRewardChannel = (channel?: string) =>
    channel === '#events' ? '#events (Bingo & events)' : (channel || '#announcements');

  if (!rewards || rewards.length === 0) {
    return null;
  }

  const current = rewards[activeIdx] || rewards[0];

  return (
    <section 
      id="discord-reward-announcement-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1a14] via-[#1c1924] to-[#161b26] border-2 border-osrs-gold/40 shadow-2xl p-5 sm:p-6 group transition-all duration-300 hover:border-osrs-gold/60"
    >
      {/* Background Decorative Gold Radiant Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-osrs-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-osrs-gold/15 transition-all" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side: Bot Announcement Tag & Title */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5865F2]/20 text-[#7289da] border border-[#5865F2]/40 shadow-sm animate-pulse">
              <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>Venny Discord Bot Reward Broadcast</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-osrs-gold bg-osrs-gold/10 px-2.5 py-0.5 rounded-full border border-osrs-gold/30">
              <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
              Live in {formatRewardChannel(current.discordChannel)}
            </span>

            {rewards.length > 1 && (
              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-gray-800 text-[11px]">
                {rewards.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeIdx === i ? 'bg-osrs-gold scale-125' : 'bg-gray-600 hover:bg-gray-400'
                    }`}
                    title={r.competitionTitle}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-white flex items-center gap-2.5 tracking-tight">
              <span className="text-osrs-gold drop-shadow-sm">🏆 {current.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
              Programmed Discord announcements spotlight all clan bounties for <span className="text-white font-semibold">{current.competitionTitle}</span>. Never let your hard work or drops go unnoticed!
            </p>
          </div>

          {/* Quick Prize Tier Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="bg-black/50 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <span className="text-sm">🥇</span>
              <div>
                <span className="text-[10px] text-gray-400 font-mono block leading-none">1st Place</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{current.firstPlace.gp}</span>
              </div>
              {current.firstPlace.roleReward && (
                <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-1.5 py-0.5 rounded ml-1 border border-indigo-500/30 hidden sm:inline">
                  {current.firstPlace.roleReward}
                </span>
              )}
            </div>

            {current.secondPlace && (
              <div className="bg-black/50 border border-gray-600/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
                <span className="text-sm">🥈</span>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block leading-none">2nd Place</span>
                  <span className="text-xs font-bold text-gray-200 font-mono">{current.secondPlace.gp}</span>
                </div>
              </div>
            )}

            {current.thirdPlace && (
              <div className="bg-black/50 border border-amber-700/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
                <span className="text-sm">🥉</span>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block leading-none">3rd Place</span>
                  <span className="text-xs font-bold text-amber-600 font-mono">{current.thirdPlace.gp}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Guaranteed Total Prize Pool Spotlight & CTAs */}
        <div className="w-full lg:w-auto bg-[#141518]/90 border border-osrs-gold/30 rounded-2xl p-4 sm:p-5 flex flex-col items-center sm:items-end justify-center gap-3 shrink-0 shadow-xl backdrop-blur-md">
          <div className="text-center sm:text-right">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold block">
              Guaranteed Event Bounty
            </span>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-osrs-gold flex items-center justify-center sm:justify-end gap-2 drop-shadow-md">
              <Coins className="w-6 h-6 text-osrs-gold animate-bounce" />
              <span>{current.prizePool}</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Sponsor: <strong className="text-gray-200">{current.sponsor || 'Misclickerz Treasury'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onOpenRewardModal(current)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-osrs-gold to-yellow-500 hover:from-yellow-500 hover:to-osrs-gold text-osrs-dark font-bold text-xs shadow-lg hover:shadow-osrs-gold/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Trophy className="w-4 h-4 text-osrs-dark" />
              <span>View Discord Embed</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {onOpenBotModal && (
              <button
                onClick={onOpenBotModal}
                className="px-3.5 py-2.5 rounded-xl bg-[#2b2d31] hover:bg-[#383a40] text-gray-300 hover:text-white text-xs font-semibold border border-gray-700/60 flex items-center justify-center gap-1.5 transition-colors"
                title="Open Discord Bot Integration Hub"
              >
                <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                <span className="hidden sm:inline">Bot Hub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
