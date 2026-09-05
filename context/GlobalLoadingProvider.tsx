import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type TransitionPhase = 'shimmer' | 'unison_sync' | 'ready';

export interface GlobalLoadingContextType {
  /** True if global loading or initial fetch is in progress */
  isLoading: boolean;
  /** True if skeleton-shimmer animation is actively displayed */
  isShimmering: boolean;
  /** Current unison transition phase ('shimmer' | 'unison_sync' | 'ready') */
  transitionPhase: TransitionPhase;
  /** Overall percentage progress (0 to 100) */
  loadingProgress: number;
  /** Map of active loading states per dashboard widget */
  widgetLoadingStates: Record<string, boolean>;
  /** Check if a specific widget is currently loading or in shimmer phase */
  isWidgetLoading: (widgetId: string) => boolean;
  /** Update loading state for a specific widget */
  setWidgetLoading: (widgetId: string, loading: boolean) => void;
  /** Update loading state for multiple widgets atomically */
  setWidgetsLoading: (widgetIds: string[], loading: boolean) => void;
  /** Manually trigger global loading state */
  setGlobalLoading: (loading: boolean) => void;
  /** Coordinate an asynchronous action with a synchronized shimmer transition in unison */
  startSynchronizedReload: (action?: () => Promise<void>) => Promise<void>;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export interface GlobalLoadingProviderProps {
  children: React.ReactNode;
  /** Minimum time in ms to show skeleton shimmer to prevent jarring flicker (default: 450ms) */
  minShimmerDuration?: number;
}

const INITIAL_WIDGET_STATES: Record<string, boolean> = {
  stats: true,
  members: true,
  competitions: true,
  bingo: true,
  rewards: true,
  activity: true,
  raffles: true,
  incidents: true,
  leaderboard: true,
};

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({
  children,
  minShimmerDuration = 400,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isShimmering, setIsShimmering] = useState<boolean>(true);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('shimmer');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [widgetLoadingStates, setWidgetLoadingStates] = useState<Record<string, boolean>>(INITIAL_WIDGET_STATES);

  const loadingStartTimeRef = useRef<number>(Date.now());
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger smooth unison transition once all states resolve
  const triggerUnisonCompletion = useCallback(() => {
    const elapsed = Date.now() - loadingStartTimeRef.current;
    const remainingTime = Math.max(0, minShimmerDuration - elapsed);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setTransitionPhase('unison_sync');
      setIsLoading(false);
      setLoadingProgress(100);

      syncTimeoutRef.current = setTimeout(() => {
        setIsShimmering(false);
        setTransitionPhase('ready');
      }, 150);
    }, remainingTime);
  }, [minShimmerDuration]);

  // Update a specific widget's state
  const setWidgetLoading = useCallback((widgetId: string, widgetIsLoading: boolean) => {
    setWidgetLoadingStates((prev) => {
      if (prev[widgetId] === widgetIsLoading) return prev;
      const next = { ...prev, [widgetId]: widgetIsLoading };
      const allDone = Object.values(next).every((v) => v === false);
      const loadedCount = Object.values(next).filter((v) => !v).length;
      const progress = Math.round((loadedCount / Object.keys(next).length) * 100);
      
      // Update progress asynchronously
      setTimeout(() => setLoadingProgress(progress), 0);

      if (allDone) {
        triggerUnisonCompletion();
      }
      return next;
    });
  }, [triggerUnisonCompletion]);

  // Update multiple widgets atomically
  const setWidgetsLoading = useCallback((widgetIds: string[], widgetIsLoading: boolean) => {
    setWidgetLoadingStates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of widgetIds) {
        if (next[id] !== widgetIsLoading) {
          next[id] = widgetIsLoading;
          changed = true;
        }
      }
      if (!changed) return prev;

      const allDone = Object.values(next).every((v) => v === false);
      const loadedCount = Object.values(next).filter((v) => !v).length;
      const progress = Math.round((loadedCount / Object.keys(next).length) * 100);
      
      setTimeout(() => setLoadingProgress(progress), 0);

      if (allDone) {
        triggerUnisonCompletion();
      }
      return next;
    });
  }, [triggerUnisonCompletion]);

  // Check if a specific widget is currently loading or in shimmer phase
  const isWidgetLoading = useCallback((widgetId: string): boolean => {
    if (isLoading || isShimmering) return true;
    return Boolean(widgetLoadingStates[widgetId]);
  }, [isLoading, isShimmering, widgetLoadingStates]);

  // Set global loading
  const setGlobalLoading = useCallback((loading: boolean) => {
    if (loading) {
      loadingStartTimeRef.current = Date.now();
      setIsLoading(true);
      setIsShimmering(true);
      setTransitionPhase('shimmer');
      setLoadingProgress(0);
      setWidgetLoadingStates({ ...INITIAL_WIDGET_STATES });
    } else {
      triggerUnisonCompletion();
    }
  }, [triggerUnisonCompletion]);

  // Start synchronized reload across all dashboard widgets
  const startSynchronizedReload = useCallback(async (action?: () => Promise<void>) => {
    loadingStartTimeRef.current = Date.now();
    setIsLoading(true);
    setIsShimmering(true);
    setTransitionPhase('shimmer');
    setLoadingProgress(10);
    setWidgetLoadingStates({ ...INITIAL_WIDGET_STATES });

    try {
      if (action) {
        await action();
      }
    } finally {
      triggerUnisonCompletion();
    }
  }, [triggerUnisonCompletion]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo<GlobalLoadingContextType>(() => ({
    isLoading,
    isShimmering,
    transitionPhase,
    loadingProgress,
    widgetLoadingStates,
    isWidgetLoading,
    setWidgetLoading,
    setWidgetsLoading,
    setGlobalLoading,
    startSynchronizedReload,
  }), [
    isLoading,
    isShimmering,
    transitionPhase,
    loadingProgress,
    widgetLoadingStates,
    isWidgetLoading,
    setWidgetLoading,
    setWidgetsLoading,
    setGlobalLoading,
    startSynchronizedReload,
  ]);

  return (
    <GlobalLoadingContext.Provider value={contextValue}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

/**
 * Hook to access the GlobalLoadingProvider state
 */
export const useGlobalLoading = (): GlobalLoadingContextType => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};

/**
 * Reusable wrapper component that applies synchronized shimmer transitions
 */
export const ShimmerTransitionWrapper: React.FC<{
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, skeleton, children, className = '' }) => {
  const { isShimmering, transitionPhase } = useGlobalLoading();
  const showSkeleton = isLoading || isShimmering;

  return (
    <div className={`transition-all duration-300 ease-in-out ${className}`}>
      {showSkeleton ? (
        <div className="animate-fade-in">{skeleton}</div>
      ) : (
        <div
          className={`animate-fade-in ${
            transitionPhase === 'unison_sync' ? 'opacity-90 scale-[0.998]' : 'opacity-100 scale-100'
          } transition-all duration-300 ease-out`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
