import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ClanMember, 
  Competition, 
  Raffle, 
  BingoTile, 
  BotRewardAnnouncement, 
  ClanActivity 
} from '../types';
import { 
  getClanMembers, 
  getCompetitions, 
  getRaffles, 
  getBingoTiles, 
  getRewardAnnouncements, 
  getActivityFeed, 
  syncClanFromWom, 
  subscribeToBotEvents, 
  logMisclick, 
  enterRaffle 
} from '../services/api';
import { useGlobalLoading } from '../context/GlobalLoadingProvider';

export interface MisclickIncident {
  id: number;
  username: string;
  incidentType: string;
  description: string;
  timestamp: string;
  dangerLevel: 'mild' | 'moderate' | 'catastrophic';
}

export interface DashboardData {
  members: ClanMember[];
  competitions: Competition[];
  raffles: Raffle[];
  bingoTiles: BingoTile[];
  rewards: BotRewardAnnouncement[];
  activities: ClanActivity[];
  incidents: MisclickIncident[];
}

export interface DashboardLoadingState {
  initial: boolean;
  syncingWom: boolean;
  members: boolean;
  competitions: boolean;
  raffles: boolean;
  bingo: boolean;
  rewards: boolean;
  activity: boolean;
}

export interface DashboardErrors {
  general: string | null;
  members: string | null;
  competitions: string | null;
  raffles: string | null;
  bingo: string | null;
  rewards: string | null;
  activity: string | null;
}

export interface UnifiedDashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  loadingState: DashboardLoadingState;
  errors: DashboardErrors;
}

export interface UseDashboardDataResult extends UnifiedDashboardState {
  // Direct access aliases for convenience
  notifications: string[];
  userRaffleEntries: { [key: number]: number };
  dismissNotification: (index: number) => void;
  addNotification: (msg: string) => void;
  refreshData: () => Promise<void>;
  syncWithWom: () => Promise<boolean>;
  logCustomIncident: (username: string, incidentType: string, description: string, dangerLevel: 'mild' | 'moderate' | 'catastrophic') => Promise<boolean>;
  purchaseRaffleTicket: (raffleId: number, itemName: string, username?: string) => Promise<boolean>;
  setRewards: React.Dispatch<React.SetStateAction<BotRewardAnnouncement[]>>;
  setIncidents: React.Dispatch<React.SetStateAction<MisclickIncident[]>>;
}

export function useDashboardData(): UseDashboardDataResult {
  let globalLoading: ReturnType<typeof useGlobalLoading> | null = null;
  try {
    globalLoading = useGlobalLoading();
  } catch {
    // Context may be optional in standalone testing
  }

  const globalLoadingRef = useRef(globalLoading);
  globalLoadingRef.current = globalLoading;

  const [data, setData] = useState<DashboardData>({
    members: [],
    competitions: [],
    raffles: [],
    bingoTiles: [],
    rewards: [],
    activities: [],
    incidents: [],
  });

  const [loadingState, setLoadingState] = useState<DashboardLoadingState>({
    initial: true,
    syncingWom: false,
    members: true,
    competitions: true,
    raffles: true,
    bingo: true,
    rewards: true,
    activity: true,
  });

  const [errors, setErrors] = useState<DashboardErrors>({
    general: null,
    members: null,
    competitions: null,
    raffles: null,
    bingo: null,
    rewards: null,
    activity: null,
  });

  const [notifications, setNotifications] = useState<string[]>([]);
  const [userRaffleEntries, setUserRaffleEntries] = useState<{ [key: number]: number }>({});

  const membersRef = useRef(data.members);
  membersRef.current = data.members;

  const addNotification = useCallback((msg: string) => {
    setNotifications(prev => [msg, ...prev.slice(0, 2)]);
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const parseMisclickActivities = (activities: ClanActivity[]): MisclickIncident[] => {
    return (activities || [])
      .filter(a => a.type === 'misclick')
      .map((a, idx) => ({
        id: Number(a.id.replace(/\D/g, '')) || (Date.now() - idx * 1000),
        username: a.username,
        incidentType: a.title || 'Misclick Incident',
        description: a.detail || 'Logged to clan ticker via Venny bot',
        timestamp: a.timestamp || 'Recent',
        dangerLevel: (a.rarity === 'legendary' ? 'catastrophic' : a.rarity === 'rare' ? 'moderate' : 'mild') as 'mild' | 'moderate' | 'catastrophic'
      }));
  };

  const refreshData = useCallback(async () => {
    if (globalLoadingRef.current) {
      globalLoadingRef.current.setGlobalLoading(true);
    }

    setLoadingState(prev => ({
      ...prev,
      members: true,
      competitions: true,
      raffles: true,
      bingo: true,
      rewards: true,
      activity: true,
    }));
    setErrors({
      general: null,
      members: null,
      competitions: null,
      raffles: null,
      bingo: null,
      rewards: null,
      activity: null,
    });

    try {
      const results = await Promise.allSettled([
        getClanMembers(),
        getCompetitions(),
        getRaffles(),
        getBingoTiles(),
        getRewardAnnouncements(),
        getActivityFeed(),
      ]);

      const [
        membersRes,
        competitionsRes,
        rafflesRes,
        bingoRes,
        rewardsRes,
        activityRes
      ] = results;

      const fetchedMembers = membersRes.status === 'fulfilled' ? membersRes.value : [];
      const fetchedCompetitions = competitionsRes.status === 'fulfilled' ? competitionsRes.value : [];
      const fetchedRaffles = rafflesRes.status === 'fulfilled' ? rafflesRes.value : [];
      const fetchedBingo = bingoRes.status === 'fulfilled' ? bingoRes.value : [];
      const fetchedRewards = rewardsRes.status === 'fulfilled' ? rewardsRes.value : [];
      const fetchedActivities = activityRes.status === 'fulfilled' ? activityRes.value : [];

      const newErrors: DashboardErrors = {
        general: null,
        members: membersRes.status === 'rejected' ? (membersRes.reason?.message || 'Failed to load members') : null,
        competitions: competitionsRes.status === 'rejected' ? (competitionsRes.reason?.message || 'Failed to load competitions') : null,
        raffles: rafflesRes.status === 'rejected' ? (rafflesRes.reason?.message || 'Failed to load raffles') : null,
        bingo: bingoRes.status === 'rejected' ? (bingoRes.reason?.message || 'Failed to load bingo') : null,
        rewards: rewardsRes.status === 'rejected' ? (rewardsRes.reason?.message || 'Failed to load rewards') : null,
        activity: activityRes.status === 'rejected' ? (activityRes.reason?.message || 'Failed to load activity feed') : null,
      };

      const parsedIncidents = parseMisclickActivities(fetchedActivities);

      setData({
        members: fetchedMembers,
        competitions: fetchedCompetitions,
        raffles: fetchedRaffles,
        bingoTiles: fetchedBingo,
        rewards: fetchedRewards,
        activities: fetchedActivities,
        incidents: parsedIncidents,
      });

      setErrors(newErrors);

      setLoadingState({
        initial: false,
        syncingWom: false,
        members: false,
        competitions: false,
        raffles: false,
        bingo: false,
        rewards: false,
        activity: false,
      });

      if (globalLoadingRef.current) {
        globalLoadingRef.current.setWidgetsLoading([
          'members', 'competitions', 'raffles', 'bingo', 
          'rewards', 'activity', 'stats', 'leaderboard', 'incidents'
        ], false);
      }
    } catch (err: any) {
      console.error('Error fetching clan dashboard data:', err);
      setErrors(prev => ({ ...prev, general: err?.message || 'Unexpected error fetching dashboard data' }));
      setLoadingState({
        initial: false,
        syncingWom: false,
        members: false,
        competitions: false,
        raffles: false,
        bingo: false,
        rewards: false,
        activity: false,
      });

      if (globalLoadingRef.current) {
        globalLoadingRef.current.setGlobalLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time SSE listener for Discord bot events (rewards, misclicks, raffles, bingo)
  useEffect(() => {
    const unsubscribe = subscribeToBotEvents((event) => {
      if (event.type === 'reward_announced' && event.data?.reward) {
        const newRew: BotRewardAnnouncement = event.data.reward;
        setData(prev => {
          const exists = prev.rewards.some(r => r.id === newRew.id);
          const nextRewards = exists 
            ? prev.rewards.map(r => r.id === newRew.id ? newRew : r)
            : [newRew, ...prev.rewards];
          return { ...prev, rewards: nextRewards };
        });
        addNotification(`📢 Discord Bot Reward Broadcast: ${newRew.title} (${newRew.prizePool})`);
      } else if (event.type === 'reward_claimed' && event.data?.reward) {
        const updatedRew: BotRewardAnnouncement = event.data.reward;
        setData(prev => ({
          ...prev,
          rewards: prev.rewards.map(r => r.id === updatedRew.id ? updatedRew : r)
        }));
        addNotification(`🎉 Prize Claimed: ${updatedRew.claimedBy} settled reward for ${updatedRew.competitionTitle}`);
      } else if (event.type === 'misclick' && event.data) {
        const incidentData = event.data;
        const fresh: MisclickIncident = {
          id: Date.now(),
          username: incidentData.username || incidentData.player || 'Clan Member',
          incidentType: incidentData.title || 'Misclick Event',
          description: incidentData.detail || incidentData.description || 'Reset clan misclick timer',
          timestamp: 'Just now',
          dangerLevel: incidentData.dangerLevel || 'moderate'
        };
        setData(prev => ({
          ...prev,
          incidents: [fresh, ...prev.incidents.slice(0, 30)]
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addNotification]);

  // Sync with sidebar misclick event trigger
  useEffect(() => {
    const handleSidebarMisclick = async () => {
      const memberList = membersRef.current;
      const randomMember = memberList.length > 0 
        ? memberList[Math.floor(Math.random() * memberList.length)].username 
        : 'Clan Member';

      try {
        const res = await logMisclick(randomMember, 'Prayer Flicker Failure: Missed critical switch');
        const freshIncident: MisclickIncident = {
          id: Date.now(),
          username: randomMember,
          incidentType: 'Prayer Flicker Failure',
          description: res.message || 'Reset clan misclick timer',
          timestamp: 'Just now',
          dangerLevel: 'moderate'
        };

        setData(prev => ({
          ...prev,
          incidents: [freshIncident, ...prev.incidents]
        }));
        addNotification(`Misclick logged for ${randomMember}!`);
      } catch (err) {
        console.warn('Could not post misclick to backend:', err);
      }
    };

    window.addEventListener('misclickLogged', handleSidebarMisclick);
    return () => {
      window.removeEventListener('misclickLogged', handleSidebarMisclick);
    };
  }, [addNotification]);

  // Sync clan from Wise Old Man
  const syncWithWom = async (): Promise<boolean> => {
    setLoadingState(prev => ({ ...prev, syncingWom: true }));
    let success = false;

    const performSync = async () => {
      try {
        await syncClanFromWom();
        await refreshData();
        addNotification('Wise Old Man clan roster & competitions successfully synced!');
        success = true;
      } catch (e) {
        console.warn('WOM sync failed:', e);
        addNotification('Failed to reach Wise Old Man API.');
        success = false;
      } finally {
        setLoadingState(prev => ({ ...prev, syncingWom: false }));
      }
    };

    if (globalLoadingRef.current) {
      await globalLoadingRef.current.startSynchronizedReload(performSync);
    } else {
      await performSync();
    }

    return success;
  };

  // Submit custom misclick incident
  const logCustomIncident = async (
    username: string,
    incidentType: string,
    description: string,
    dangerLevel: 'mild' | 'moderate' | 'catastrophic'
  ): Promise<boolean> => {
    if (!username) {
      addNotification('Select a clan member to log!');
      return false;
    }

    const desc = description.trim() || `Accidentally triggered a ${incidentType} at the home world.`;

    try {
      await logMisclick(username, `${incidentType}: ${desc}`);
    } catch (err) {
      console.warn('Error sending misclick to live backend:', err);
    }

    const freshIncident: MisclickIncident = {
      id: Date.now(),
      username,
      incidentType,
      description: desc,
      timestamp: 'Just now',
      dangerLevel
    };

    setData(prev => ({
      ...prev,
      incidents: [freshIncident, ...prev.incidents]
    }));
    addNotification(`Logged new incident for ${username}!`);
    return true;
  };

  // Purchase raffle ticket
  const purchaseRaffleTicket = async (
    raffleId: number,
    itemName: string,
    username: string = 'Clan Member'
  ): Promise<boolean> => {
    try {
      await enterRaffle(raffleId, username, 1);
      setUserRaffleEntries(prev => ({
        ...prev,
        [raffleId]: (prev[raffleId] || 0) + 1
      }));
      addNotification(`Purchased 1 ticket for ${itemName}!`);
      return true;
    } catch (err) {
      console.error('Error entering raffle:', err);
      return false;
    }
  };

  const setRewards = (updater: React.SetStateAction<BotRewardAnnouncement[]>) => {
    setData(prev => ({
      ...prev,
      rewards: typeof updater === 'function' ? updater(prev.rewards) : updater
    }));
  };

  const setIncidents = (updater: React.SetStateAction<MisclickIncident[]>) => {
    setData(prev => ({
      ...prev,
      incidents: typeof updater === 'function' ? updater(prev.incidents) : updater
    }));
  };

  const loading = loadingState.initial || (loadingState.members && loadingState.competitions && loadingState.bingo);
  const error = errors.general || errors.members || errors.bingo || errors.rewards || errors.activity || null;

  return {
    data,
    loading,
    error,
    loadingState,
    errors,
    notifications,
    userRaffleEntries,
    dismissNotification,
    addNotification,
    refreshData,
    syncWithWom,
    logCustomIncident,
    purchaseRaffleTicket,
    setRewards,
    setIncidents,
  };
}
