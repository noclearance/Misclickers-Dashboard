import React from 'react';
import { Skeleton } from './Skeleton';
import { Grid, Sparkles, Bot } from 'lucide-react';

export const BingoProgressSkeleton: React.FC = () => {
  return (
    <section id="bingo-progress-skeleton" className="bg-osrs-panel border border-osrs-gold/15 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-glow-gold relative overflow-hidden">
      <div className="space-y-3 z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-4 w-28 rounded-full" />
        </div>
        <Skeleton className="h-6 w-52 rounded-lg" />
        <Skeleton className="h-3 w-80 max-w-full rounded" />
      </div>

      {/* Progress Bar Container Skeleton */}
      <div className="w-full md:w-72 bg-osrs-dark border border-osrs-gold/10 p-4 rounded-xl space-y-2.5 z-10 shrink-0">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-2.5 w-16 rounded" />
          <Skeleton className="h-2.5 w-14 rounded" />
          <Skeleton className="h-2.5 w-10 rounded" />
        </div>
      </div>
    </section>
  );
};

export const BingoBoardSkeleton: React.FC = () => {
  return (
    <div id="bingo-board-skeleton" className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      <BingoProgressSkeleton />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-osrs-panel p-1 rounded-xl border border-osrs-gold/10">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-48 rounded" />
      </div>

      {/* 5x5 Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Array.from({ length: 25 }).map((_, idx) => (
          <div
            key={idx}
            className="min-h-32 bg-osrs-panel border border-osrs-gold/10 rounded-2xl p-4 flex flex-col justify-between space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
            <div className="space-y-1.5 my-2">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
            <Skeleton className="h-2.5 w-20 ml-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};
