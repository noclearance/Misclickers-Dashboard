import React from 'react';
import { Skeleton } from './Skeleton';
import { Flame } from 'lucide-react';

export const ActivityFeedSkeleton: React.FC = () => {
  return (
    <div id="activity-feed-skeleton" className="bg-osrs-panel border border-osrs-gold/15 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-osrs-gold/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-osrs-dark border border-osrs-gold/15 shadow-inner">
            <Flame className="w-5 h-5 text-osrs-gold/40 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3.5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-56 rounded" />
          </div>
        </div>

        {/* Tab Filters Placeholder */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-osrs-dark p-1 rounded-xl border border-gray-850">
            {[1, 2, 3, 4, 5].map((tab) => (
              <Skeleton key={tab} className="h-6 w-12 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>

      {/* Activity Item Rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="p-3.5 rounded-xl border border-osrs-gold/10 bg-osrs-dark/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-48 rounded" />
                <Skeleton className="h-2.5 w-64 max-w-full rounded" />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-850">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div className="pt-2 border-t border-osrs-gold/10 flex items-center justify-between">
        <Skeleton className="h-3 w-44 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
    </div>
  );
};
