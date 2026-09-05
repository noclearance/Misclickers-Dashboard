import React from 'react';
import { Skeleton } from './Skeleton';
import { StatsCardsSkeleton } from './StatsCardsSkeleton';
import { CompetitionsSkeleton } from './CompetitionsSkeleton';
import { ActivityFeedSkeleton } from './ActivityFeedSkeleton';
import { BingoProgressSkeleton } from './BingoProgressSkeleton';
import { ClanLeadersSkeleton } from './ClanLeadersSkeleton';
import { LeaderboardTableSkeleton } from './LeaderboardTableSkeleton';
import { Flame, Trophy } from 'lucide-react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div id="dashboard-skeleton-view" className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-r from-osrs-panel to-osrs-dark border border-osrs-gold/15 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-glow-gold">
        <div className="space-y-3 text-center md:text-left z-10 flex-1 min-w-0">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Flame className="w-4 h-4 text-osrs-gold/40 animate-pulse" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
          <Skeleton className="h-3 w-96 max-w-full rounded" />
        </div>

        <div className="shrink-0 z-10 flex flex-col sm:flex-row items-center gap-3">
          <div className="bg-osrs-panelLight/80 border border-osrs-gold/20 px-6 py-4 rounded-2xl flex flex-col items-center min-w-[200px] space-y-2">
            <Skeleton className="h-2.5 w-28 rounded" />
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </section>

      {/* Core Counters Panel Skeleton */}
      <StatsCardsSkeleton />

      {/* Main Structural split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Activity Feed, Incident Logger, Competitions, Bingo Summary, Raffles (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Discord/Bot Status Banner Skeleton */}
          <div className="bg-osrs-panel border border-osrs-gold/10 rounded-2xl p-4.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-44 rounded" />
                <Skeleton className="h-2.5 w-72 max-w-full rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-28 rounded-xl shrink-0" />
          </div>

          {/* Activity Feed Skeleton */}
          <ActivityFeedSkeleton />

          {/* Incident Logger Skeleton Placeholder */}
          <section className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-osrs-gold/10 bg-osrs-panelLight/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-5 h-5 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-44 rounded" />
                  <Skeleton className="h-2.5 w-64 rounded" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-osrs-gold/10">
              <div className="md:col-span-5 p-5 space-y-3">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
              <div className="md:col-span-7 p-5 space-y-3">
                <Skeleton className="h-3 w-32 rounded" />
                {[1, 2, 3].map((inc) => (
                  <div key={inc} className="p-3 rounded-xl border border-osrs-gold/5 bg-osrs-dark/40 flex items-start gap-2.5">
                    <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3 w-32 rounded" />
                      <Skeleton className="h-2.5 w-48 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ongoing Competitions Skeleton */}
          <CompetitionsSkeleton />

          {/* Clan Rewards & Bot Announcements Skeleton */}
          <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-osrs-gold/10 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 bg-osrs-dark/50 border border-osrs-gold/10 rounded-xl space-y-2.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Skeleton className="h-8 rounded-lg" />
                    <Skeleton className="h-8 rounded-lg" />
                    <Skeleton className="h-8 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bingo Campaign Progress Card Skeleton */}
          <BingoProgressSkeleton />
        </div>

        {/* Right Side: Clan Leaders & Search Skeleton (4 Columns) */}
        <div className="lg:col-span-4">
          <ClanLeadersSkeleton />
        </div>
      </div>

      {/* Full Leaderboard Highscores Table Skeleton */}
      <div className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-osrs-gold/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-osrs-gold/40 animate-pulse" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-xl" />
        </div>
        <LeaderboardTableSkeleton />
      </div>
    </div>
  );
};
