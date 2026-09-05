import React from 'react';
import { Skeleton } from './Skeleton';
import { Trophy, Timer, Flame } from 'lucide-react';

export const CompetitionsSkeleton: React.FC = () => {
  return (
    <section id="competitions-skeleton" className="bg-gradient-to-br from-osrs-panel to-osrs-dark border border-osrs-gold/15 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-osrs-gold/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-osrs-dark border border-osrs-gold/10 text-osrs-gold/40">
            <Trophy className="w-5 h-5 animate-pulse text-osrs-gold/50" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main Competition Box Skeleton */}
      <div className="bg-osrs-dark/60 border border-osrs-gold/10 p-5 rounded-2xl space-y-6 shadow-lg">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-850 pb-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-5 w-44 rounded-lg" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-2.5 w-20 rounded ml-auto" />
            <Skeleton className="h-4 w-24 rounded ml-auto" />
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((podiumIdx) => (
            <div
              key={podiumIdx}
              className="p-4 rounded-xl border border-osrs-gold/10 bg-osrs-dark/80 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-2.5 w-12 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Challenger rows */}
        <div className="space-y-2.5 pt-2 border-t border-gray-850">
          <Skeleton className="h-3 w-40 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[4, 5, 6, 7].map((rowIdx) => (
              <div
                key={rowIdx}
                className="bg-osrs-dark/80 border border-gray-850 p-2.5 rounded-xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-4 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
