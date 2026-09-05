
export interface ClanMember {
  id: number;
  username: string;
  role: string;
  clanPoints: number;
  xpGained?: number;
  bossKc?: number;
  ehb?: number;
  ehp?: number;
  type?: string;
  specialization?: string;
  rank?: number;
}

export interface ClanInfo {
  id: number;
  name: string;
  clanChat: string;
  homeworld: number;
  memberCount: number;
  description: string;
  score: number;
  updatedAt?: string;
}

export interface RewardTier {
  gp: string;
  points: number;
  roleReward?: string;
  itemReward?: string;
  title?: string;
}

export interface CompetitionReward {
  firstPlace: RewardTier;
  secondPlace?: RewardTier;
  thirdPlace?: RewardTier;
  participationBonus?: string;
  totalPrizePool: string;
  announcedInDiscord: boolean;
  discordChannel: string;
  discordMessageId?: string;
  announcedAt: string;
  sponsor?: string;
}

export interface BotRewardAnnouncement {
  id: string;
  competitionId?: number;
  competitionTitle: string;
  eventType: 'Skill of the Week' | 'Boss of the Week' | 'Bingo' | 'Raffle' | 'Clan Milestone';
  metric?: string;
  title: string;
  prizePool: string;
  firstPlace: RewardTier;
  secondPlace?: RewardTier;
  thirdPlace?: RewardTier;
  sponsor?: string;
  discordChannel: string;
  announcedBy: string;
  timestamp: string;
  active: boolean;
  claimedBy?: string;
  proofMessageUrl?: string;
  discordEmbedColor?: string;
}

export interface Competition {
  id: number;
  type: 'Skill of the Week' | 'Boss of the Week';
  metric: string; // e.g., 'Zulrah' or 'Woodcutting'
  title?: string;
  startDate: string;
  endDate: string;
  participantCount?: number;
  participants: ClanMember[];
  rewards?: CompetitionReward;
}

export interface Raffle {
  id: number;
  itemName: string;
  itemImageUrl: string;
  ticketCost: number; // in clan points
  totalEntries: number;
  endsIn: string; // e.g., "2 days"
}

export interface BingoTile {
  id: number;
  task: string;
  completedBy?: string; // Username of member who completed it
}

export interface OsrsItem {
    id: number;
    name: string;
    high: number;
    low: number;
}

export interface ClanActivity {
  id: string;
  username: string;
  type: 'drop' | 'level' | 'achievement' | 'misclick';
  title: string;
  detail: string;
  timestamp: string;
  itemUrl?: string;
  value?: string;
  rarity?: 'common' | 'rare' | 'legendary';
}

export interface BotSyncStatus {
  status: 'connected' | 'idle' | 'unconfigured';
  bridgeStatus?: 'online' | 'degraded' | 'offline';
  bridgeStatusLabel?: 'Online' | 'Degraded' | 'Offline';
  bridgeStatusDetail?: string;
  bridgeCheckedAt?: string;
  bridgeHealthSource?: string;
  botName: string;
  guildName: string;
  guildId?: string;
  guildMemberCount: number;
  lastSync: string;
  eventCount: number;
  apiKeyConfigured: boolean;
  endpoints: {
    webhook: string;
    misclick: string;
    drop: string;
    leaderboard: string;
    raffles: string;
  };
}

export interface BotEventPayload {
  event: 'misclick' | 'drop' | 'level' | 'bingo_tile' | 'raffle_entry' | 'points_sync' | 'reward_announced' | 'ping';
  username?: string;
  data?: Record<string, any>;
  timestamp?: string;
}

export type View = 'dashboard' | 'leaderboard' | 'raffles' | 'bingo' | 'prices';
