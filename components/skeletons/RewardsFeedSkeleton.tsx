import React from 'react';
import { Skeleton } from './Skeleton';

export const RewardsFeedSkeleton: React.FC = () => {
  return (
    <div id="rewards-feed-skeleton" className="space-y-3.5 py-1">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="skeleton-shimmer bg-[#18191e] border border-gray-800 rounded-xl p-4 space-y-3 relative overflow-hidden"
          style={{ borderLeftWidth: '4px', borderLeftColor: '#374151' }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-24 h-5 rounded-full" />
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-16 h-4 rounded" />
            </div>
            <Skeleton className="w-20 h-5 rounded-full" />
          </div>

          {/* Title & Prize Spotlight */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 my-1">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="w-3/4 h-5 rounded" />
              <Skeleton className="w-1/2 h-3.5 rounded" />
            </div>
            <Skeleton className="w-36 h-10 rounded-lg shrink-0" />
          </div>

          {/* Podium 3-Column */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-800/80">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
            <Skeleton className="w-40 h-3.5 rounded" />
            <Skeleton className="w-28 h-6 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

