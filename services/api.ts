import type {
  ClanMember,
  ClanInfo,
  Competition,
  Raffle,
  BingoTile,
  ClanActivity,
  BotSyncStatus,
  BotEventPayload,
  BotRewardAnnouncement,
  OsrsItem,
  DiscordMemberRoleResolution
} from '../types';
import {
  http,
  apiClient,
  getVennyApiKey,
  setVennyApiKey,
  onUnauthorized,
  notifyUnauthorized,
  ApiError,
  UnauthorizedEventDetail,
  HttpDebugLog,
  HttpDebugListener,
  onHttpDebugLog,
  getHttpDebugLogs,
  clearHttpDebugLogs,
  setHttpDebugLogging
} from './httpClient';

// Re-export authentication and interceptor utilities for callers
export {
  http,
  apiClient,
  getVennyApiKey,
  setVennyApiKey,
  onUnauthorized,
  notifyUnauthorized,
  ApiError,
  onHttpDebugLog,
  getHttpDebugLogs,
  clearHttpDebugLogs,
  setHttpDebugLogging
};
export type { UnauthorizedEventDetail, HttpDebugLog, HttpDebugListener };

// Real Wise Old Man Group ID for Misclickerz
export const REAL_WOM_GROUP_ID = 24942;

/**
 * Generic API request wrapper powered by the centralized HTTP client
 */
export async function apiRequest<T>(endpoint: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  
  if (method === 'POST') {
    return http.post<T>(endpoint, options.body, { headers: options.headers });
  }
  if (method === 'PUT') {
    return http.put<T>(endpoint, options.body, { headers: options.headers });
  }
  if (method === 'PATCH') {
    return http.patch<T>(endpoint, options.body, { headers: options.headers });
  }
  if (method === 'DELETE') {
    return http.delete<T>(endpoint, { headers: options.headers });
  }
  
  return http.get<T>(endpoint, { headers: options.headers });
}

// ============================================================================
// 1. Player Rankings & Clan Members
// ============================================================================

/**
 * Fetches all clan members and their player rankings from the Venny bot backend
 */
export async function getPlayerRankings(): Promise<ClanMember[]> {
  return http.get<ClanMember[]>('/api/members');
}

/**
 * Alias for getPlayerRankings
 */
export const getMembers = getPlayerRankings;
export const getClanMembers = getPlayerRankings;

/**
 * Fetches a single player ranking by user ID or username
 */
export async function getPlayerRankingById(id: number): Promise<ClanMember | null> {
  const members = await getPlayerRankings();
  return members.find(m => m.id === id) || null;
}

/**
 * Synchronizes / updates player rankings with the Venny backend (requires authentication)
 */
export async function syncPlayerRankings(
  members: ClanMember[]
): Promise<{ success: boolean; count: number }> {
  return http.post<{ success: boolean; count: number }>('/api/bot/leaderboard/sync', { members });
}

/**
 * Fetches high-level clan information (Wise Old Man metadata, member count, homeworld)
 */
export async function getClanInfo(): Promise<ClanInfo> {
  return http.get<ClanInfo>('/api/clan/info');
}

/**
 * Triggers a live sync of the clan roster and metrics from Wise Old Man Group #24942
 */
export async function syncClanWithWom(): Promise<{
  success: boolean;
  clanInfo: ClanInfo;
  memberCount: number;
  competitions: Competition[];
}> {
  return http.post<{
    success: boolean;
    clanInfo: ClanInfo;
    memberCount: number;
    competitions: Competition[];
  }>('/api/clan/sync');
}

// ============================================================================
// 2. Raffle Statuses & Entries
// ============================================================================

/**
 * Fetches all current active clan raffles and entry statuses
 */
export async function getRaffleStatuses(): Promise<Raffle[]> {
  return http.get<Raffle[]>('/api/raffles');
}

/**
 * Alias for getRaffleStatuses
 */
export const getRaffles = getRaffleStatuses;

/**
 * Fetches a specific raffle by ID
 */
export async function getRaffleById(id: number): Promise<Raffle | null> {
  const raffles = await getRaffleStatuses();
  return raffles.find(r => r.id === id) || null;
}

/**
 * Purchases / submits entries into a clan raffle
 */
export async function enterRaffle(
  raffleId: number,
  username: string,
  tickets: number = 1
): Promise<{ success: boolean; raffle: Raffle }> {
  return http.post<{ success: boolean; raffle: Raffle }>(`/api/raffles/${raffleId}/enter`, {
    username,
    tickets,
  });
}

// ============================================================================
// 3. Bingo Board & Tiles
// ============================================================================

/**
 * Fetches all 25 tiles of the active clan bingo board
 */
export async function getBingoTiles(): Promise<BingoTile[]> {
  return http.get<BingoTile[]>('/api/bingo');
}

/**
 * Alias for getBingoTiles
 */
export const getBingoBoard = getBingoTiles;

/**
 * Fetches a specific bingo tile by ID
 */
export async function getBingoTileById(id: number): Promise<BingoTile | null> {
  const tiles = await getBingoTiles();
  return tiles.find(t => t.id === id) || null;
}

/**
 * Marks a bingo tile as completed by a clan member with optional proof link
 */
export async function completeBingoTile(
  tileId: number,
  username: string,
  proofUrl?: string
): Promise<{ success: boolean; tile: BingoTile }> {
  return http.post<{ success: boolean; tile: BingoTile }>(`/api/bingo/${tileId}/complete`, {
    username,
    proofUrl,
  });
}

/**
 * Resets a bingo tile completion state
 */
export async function resetBingoTile(
  tileId: number
): Promise<{ success: boolean; tile: BingoTile }> {
  return http.post<{ success: boolean; tile: BingoTile }>(`/api/bingo/${tileId}/reset`);
}

// ============================================================================
// 4. Competitions (Skill / Boss of the Week) & Reward Announcements
// ============================================================================

/**
 * Fetches active clan competitions (e.g. SOTW, BOTW)
 */
export async function getCompetitions(): Promise<Competition[]> {
  return http.get<Competition[]>('/api/competitions');
}

/**
 * Fetches all official Discord Bot reward announcements and prize pools
 */
export async function getRewardAnnouncements(): Promise<BotRewardAnnouncement[]> {
  return http.get<BotRewardAnnouncement[]>('/api/rewards');
}

export const getRewards = getRewardAnnouncements;

/**
 * Dispatches an official reward announcement (from Discord Bot or Clan Admin)
 */
export async function announceReward(payload: Partial<BotRewardAnnouncement>): Promise<{
  success: boolean;
  reward: BotRewardAnnouncement;
}> {
  return http.post<{ success: boolean; reward: BotRewardAnnouncement }>('/api/rewards/announce', payload);
}

/**
 * Claims / settles an announced reward payout for a clan member
 */
export async function claimReward(
  rewardId: string,
  username: string
): Promise<{ success: boolean; reward: BotRewardAnnouncement }> {
  return http.post<{ success: boolean; reward: BotRewardAnnouncement }>(`/api/rewards/${rewardId}/claim`, {
    username
  });
}

// ============================================================================
// 5. Venny Discord Bot & Live Activity Feed
// ============================================================================

/**
 * Fetches the connection status and live webhook endpoints for Venny Discord Bot
 */
export async function getBotStatus(): Promise<BotSyncStatus> {
  return http.get<BotSyncStatus>('/api/bot/status');
}

export const getBotSyncStatus = getBotStatus;

/**
 * Logs a new misclick event and resets the clan misclick ticker
 */
export async function logMisclick(
  username: string = 'Clan Member',
  detail: string = 'Logged via Venny bot'
): Promise<{
  success: boolean;
  lastMisclick: string;
  totalMisclicks: number;
  message: string;
}> {
  return http.post<{
    success: boolean;
    lastMisclick: string;
    totalMisclicks: number;
    message: string;
  }>('/api/bot/misclick', { username, detail });
}

/**
 * Logs a valuable PvM loot drop or pet receipt to the live clan ticker
 */
export async function logLootDrop(payload: {
  username: string;
  itemName: string;
  value?: string;
  source?: string;
  itemUrl?: string;
  rarity?: 'common' | 'rare' | 'legendary';
}): Promise<{ success: boolean; activity: ClanActivity }> {
  return http.post<{ success: boolean; activity: ClanActivity }>('/api/bot/drop', payload);
}

/**
 * Ingests a generic webhook event from the Venny Discord Bot
 */
export async function sendBotWebhook(payload: BotEventPayload): Promise<any> {
  return http.post<any>('/api/bot/webhook', payload);
}

/**
 * Dispatches a simulated or test bot webhook payload to /api/bot/events
 */
export async function sendTestBotWebhook(event: string, data: any, username: string = 'Venny Bot'): Promise<any> {
  return http.post<any>('/api/bot/events', { event, data, username });
}

export const syncClanFromWom = syncClanWithWom;
export const searchGePrice = getItemPrice;
export const submitMisclickApi = logMisclick;
export const announceRewardApi = announceReward;
export const claimRewardApi = claimReward;

/**
 * Fetches the recent clan activity feed (drops, level-ups, misclicks, raffle entries)
 */
export async function getActivityFeed(): Promise<ClanActivity[]> {
  return http.get<ClanActivity[]>('/api/activity');
}

/**
 * Health check endpoint
 */
export async function getHealthCheck(): Promise<{ status: string; time: string; clan: string }> {
  return http.get<{ status: string; time: string; clan: string }>('/api/health');
}

// ============================================================================
// 6. Discord Identity / Role Resolution
// ============================================================================

export async function resolveDiscordMemberRoles(userId: string): Promise<DiscordMemberRoleResolution> {
  return http.get<DiscordMemberRoleResolution>(`/api/discord/member/${encodeURIComponent(userId)}`);
}

// ============================================================================
// 7. OSRS Grand Exchange Pricing
// ============================================================================

/**
 * Fetches current real-time OSRS Grand Exchange item price
 */
export async function getItemPrice(itemName: string): Promise<OsrsItem | null> {
  const normalized = itemName.toLowerCase().trim();
  
  // Real-time query to OSRS Wiki Prices API with fallback
  try {
    const url = `https://prices.runescape.wiki/api/v1/osrs/mapping`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Misclickerz-WebHub/1.0' }
    });
    if (res.ok) {
      const items: Array<{ id: number; name: string; high?: number; low?: number }> = await res.json();
      const match = items.find(i => i.name.toLowerCase() === normalized || i.name.toLowerCase().includes(normalized));
      if (match) {
        // Fetch current instant prices
        const priceRes = await fetch(`https://prices.runescape.wiki/api/v1/osrs/latest?id=${match.id}`, {
          headers: { 'User-Agent': 'Misclickerz-WebHub/1.0' }
        });
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          const itemPrice = priceData.data?.[match.id];
          return {
            id: match.id,
            name: match.name,
            high: itemPrice?.high || 0,
            low: itemPrice?.low || 0,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[GE Prices] Live lookup fallback:', err);
  }

  // Fallback static items
  const fallbackPrices: Record<string, OsrsItem> = {
    'twisted bow': { id: 20997, name: 'Twisted Bow', high: 1680000000, low: 1675000000 },
    'dragon claws': { id: 13652, name: 'Dragon claws', high: 82000000, low: 81500000 },
    'armadyl godsword': { id: 11802, name: 'Armadyl godsword', high: 31000000, low: 30800000 },
    'bandos chestplate': { id: 11832, name: 'Bandos chestplate', high: 28500000, low: 28200000 },
    'elysian spirit shield': { id: 12817, name: 'Elysian spirit shield', high: 845000000, low: 840000000 },
    'tumeken\'s shadow': { id: 27275, name: 'Tumeken\'s shadow (uncharged)', high: 1290000000, low: 1282000000 },
    'osmumten\'s fang': { id: 26219, name: 'Osmumten\'s fang', high: 14500000, low: 14300000 },
  };

  return fallbackPrices[normalized] || null;
}

// ============================================================================
// 8. Real-Time Server-Sent Events (SSE) Listener
// ============================================================================

/**
 * Subscribes to real-time events broadcast by the Venny Bot Hub server.
 * Returns an unsubscribe callback function.
 */
export function subscribeToBotEvents(
  onEvent: (event: { type: string; data: any }) => void
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const eventSource = new EventSource('/api/bot/events/stream');

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent({ type: 'message', data });
    } catch {
      onEvent({ type: 'message', data: e.data });
    }
  };

  eventSource.addEventListener('misclick', (e: any) => {
    try {
      onEvent({ type: 'misclick', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'misclick', data: e.data });
    }
  });

  eventSource.addEventListener('drop', (e: any) => {
    try {
      onEvent({ type: 'drop', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'drop', data: e.data });
    }
  });

  eventSource.addEventListener('raffle_entry', (e: any) => {
    try {
      onEvent({ type: 'raffle_entry', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'raffle_entry', data: e.data });
    }
  });

  eventSource.addEventListener('bingo_tile', (e: any) => {
    try {
      onEvent({ type: 'bingo_tile', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'bingo_tile', data: e.data });
    }
  });

  eventSource.addEventListener('leaderboard_synced', (e: any) => {
    try {
      onEvent({ type: 'leaderboard_synced', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'leaderboard_synced', data: e.data });
    }
  });

  eventSource.addEventListener('reward_announced', (e: any) => {
    try {
      onEvent({ type: 'reward_announced', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'reward_announced', data: e.data });
    }
  });

  eventSource.addEventListener('reward_claimed', (e: any) => {
    try {
      onEvent({ type: 'reward_claimed', data: JSON.parse(e.data) });
    } catch {
      onEvent({ type: 'reward_claimed', data: e.data });
    }
  });

  return () => {
    eventSource.close();
  };
}

/**
 * Default export containing all Venny API service methods
 */
const VennyApi = {
  client: apiClient,
  http,
  getVennyApiKey,
  setVennyApiKey,
  onUnauthorized,
  notifyUnauthorized,
  // Player rankings
  getPlayerRankings,
  getMembers,
  getPlayerRankingById,
  syncPlayerRankings,
  getClanInfo,
  syncClanWithWom,
  // Raffles
  getRaffleStatuses,
  getRaffles,
  getRaffleById,
  enterRaffle,
  // Bingo
  getBingoTiles,
  getBingoBoard,
  getBingoTileById,
  completeBingoTile,
  // Competitions & Rewards
  getCompetitions,
  getRewardAnnouncements,
  getRewards,
  announceReward,
  claimReward,
  // Bot & Live Activity
  getBotStatus,
  resolveDiscordMemberRoles,
  logMisclick,
  logLootDrop,
  sendBotWebhook,
  getActivityFeed,
  getHealthCheck,
  // Grand Exchange
  getItemPrice,
  // Realtime
  subscribeToBotEvents,
};

export default VennyApi;
