import React from 'react';
import { Skeleton } from './Skeleton';

export const StatsCardsSkeleton: React.FC = () => {
  return (
    <section id="stats-grid-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="bg-osrs-panel border border-osrs-gold/10 p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-md" />
          </div>
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-2.5 w-28 rounded-md" />
        </div>
      ))}
    </section>
  );
};
