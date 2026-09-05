import React from 'react';
import { Skeleton } from './Skeleton';
import { Trophy } from 'lucide-react';

export const ClanLeadersSkeleton: React.FC = () => {
  return (
    <div id="clan-leaders-skeleton" className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 flex flex-col h-[760px] shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="space-y-4 mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-osrs-gold/40 animate-pulse" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>

        {/* Search input placeholder */}
        <Skeleton className="h-9 w-full rounded-xl" />

        {/* Metric tabs placeholder */}
        <div className="grid grid-cols-3 gap-1 bg-osrs-dark p-1 rounded-xl border border-gray-850">
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
        </div>
      </div>

      {/* Member rows placeholder */}
      <div className="flex-1 overflow-hidden space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-osrs-dark/35 border border-osrs-gold/5 rounded-xl"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-2 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 rounded ml-3 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
