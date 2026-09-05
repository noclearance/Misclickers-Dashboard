import React from 'react';
import { Skeleton } from './Skeleton';

export const LeaderboardTableSkeleton: React.FC = () => {
  return (
    <div id="leaderboard-table-skeleton" className="space-y-3 p-4">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-osrs-gold/10">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>

      {/* Rows */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 bg-osrs-dark/30 border border-osrs-gold/5 rounded-xl gap-3"
        >
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20 rounded hidden sm:block" />
          <Skeleton className="h-4 w-24 rounded ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
};
