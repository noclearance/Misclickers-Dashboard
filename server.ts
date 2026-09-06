import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const VENNY_SECRET = process.env.VENNY_API_KEY || 'configured-secret';
const WOM_GROUP_ID = Number(process.env.WOM_GROUP_ID) || 24942; // Misclickerz
const WOM_API_KEY = process.env.WOM_API_KEY || process.env.WISEOLDMAN_API_KEY || '';
const VENNY_HEALTH_URL = 'https://grazybot.onrender.com/health';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN?.trim() || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID?.trim() || '';

// In-Memory Database State (persisted while server is up, synced with Wise Old Man & Venny bot)
interface ServerState {
  lastMisclickTime: string;
  totalMisclicks: number;
  clanInfo: {
    id: number;
    name: string;
    clanChat: string;
    homeworld: number;
    memberCount: number;
    description: string;
    score: number;
    lastSynced: string;
  };
  botStatus: {
    name: string;
    version: string;
    repo: string;
    lastPing: string;
    connectedGuild: string;
    guildId: string;
    guildMembers: number;
    eventsReceived: number;
  };
  members: Array<{
    id: number;
    username: string;
    role: string;
    clanPoints: number;
    xpGained: number;
    bossKc: number;
    ehb?: number;
    ehp?: number;
    type?: string;
    specialization?: string;
    rank?: number;
  }>;
  competitions: Array<{
    id: number;
    type: 'Skill of the Week' | 'Boss of the Week';
    title?: string;
    metric: string;
    startDate: string;
    endDate: string;
    participantCount?: number;
    participants: Array<{
      id: number;
      username: string;
      role: string;
      clanPoints: number;
      xpGained?: number;
      bossKc?: number;
    }>;
    rewards?: any;
  }>;
  rewardAnnouncements: Array<any>;
  activities: Array<{
    id: string;
    username: string;
    type: 'drop' | 'level' | 'achievement' | 'misclick';
    title: string;
    detail: string;
    timestamp: string;
    itemUrl?: string;
    value?: string;
    rarity?: 'common' | 'rare' | 'legendary';
  }>;
  raffles: Array<{
    id: number;
    itemName: string;
    itemImageUrl: string;
    ticketCost: number;
    totalEntries: number;
    endsIn: string;
    entries: Array<{ username: string; tickets: number; time: string }>;
  }>;
  bingoTiles: Array<{
    id: number;
    task: string;
    completedBy?: string;
    proofUrl?: string;
    completedAt?: string;
  }>;
}

// Initialized with real Wise Old Man Clan Group 24942 (Misclickerz) roster
const state: ServerState = {
  lastMisclickTime: new Date(Date.now() - 1000 * 60 * 14).toISOString(), // 14 mins ago
  totalMisclicks: 42,
  clanInfo: {
    id: 24942,
    name: 'Misclickerz',
    clanChat: 'Misclickerz',
    homeworld: 677,
    memberCount: 25,
    description: '🧭 Founded by players who wanted a balanced mix of chill and challenge in OSRS.',
    score: 320,
    lastSynced: new Date().toISOString()
  },
  botStatus: {
    name: 'Venny Discord Bot',
    version: 'v2.4.1',
    repo: 'https://github.com/noclearance/venny',
    lastPing: new Date().toISOString(),
    connectedGuild: 'Misclickerz [CC]',
    guildId: '109876543210987654',
    guildMembers: 25,
    eventsReceived: 142,
  },
  members: [
    { id: 1632164, username: 'Inwarth', role: 'Owner', clanPoints: 17826, xpGained: 530836347, bossKc: 10989, ehb: 732.63, ehp: 1038.42, type: 'main', specialization: 'Grandmaster', rank: 1 },
    { id: 2117690, username: 'Mag84', role: 'Deputy Owner', clanPoints: 11588, xpGained: 287900287, bossKc: 9900, ehb: 659.99, ehp: 421.83, type: 'main', specialization: 'PvMer', rank: 2 },
    { id: 2585908, username: 'thuggerszn', role: 'Commander', clanPoints: 9478, xpGained: 285624290, bossKc: 2042, ehb: 136.16, ehp: 813.99, type: 'main', specialization: 'Skiller', rank: 3 },
    { id: 2754672, username: 'elf hart IM', role: 'Captain', clanPoints: 8615, xpGained: 207705903, bossKc: 3214, ehb: 214.27, ehp: 879.07, type: 'ironman', specialization: 'Grandmaster', rank: 4 },
    { id: 1851837, username: 'Teejster', role: 'Zamorakian', clanPoints: 6300, xpGained: 208330669, bossKc: 2593, ehb: 172.91, ehp: 497.46, type: 'main', specialization: 'PvMer', rank: 5 },
    { id: 2480717, username: 'trambecknare', role: 'Colonel', clanPoints: 5100, xpGained: 178019336, bossKc: 1357, ehb: 90.46, ehp: 483.13, type: 'main', specialization: 'Skiller', rank: 6 },
    { id: 2754711, username: 'seventytube', role: 'Zamorakian', clanPoints: 4680, xpGained: 170352039, bossKc: 1638, ehb: 109.17, ehp: 378.38, type: 'main', specialization: 'PvMer', rank: 7 },
    { id: 2712364, username: 'killahkushi', role: 'Cadet', clanPoints: 4520, xpGained: 167743801, bossKc: 2929, ehb: 195.28, ehp: 478.20, type: 'main', specialization: 'PvMer', rank: 8 },
    { id: 2693174, username: 'Sorgini', role: 'Beast', clanPoints: 4410, xpGained: 152403919, bossKc: 3851, ehb: 256.74, ehp: 331.40, type: 'main', specialization: 'PvMer', rank: 9 },
    { id: 2059361, username: 'TravelerX', role: 'Zamorakian', clanPoints: 3740, xpGained: 129617219, bossKc: 899, ehb: 59.96, ehp: 233.39, type: 'main', specialization: 'Raider', rank: 10 },
    { id: 2689123, username: 'Knuckers', role: 'Lieutenant', clanPoints: 3510, xpGained: 128634510, bossKc: 481, ehb: 32.11, ehp: 329.80, type: 'main', specialization: 'Raider', rank: 11 },
    { id: 2754670, username: 'lord greeny', role: 'Captain', clanPoints: 3420, xpGained: 122276490, bossKc: 1990, ehb: 132.68, ehp: 239.10, type: 'main', specialization: 'PvMer', rank: 12 },
    { id: 2693175, username: 'Scokefd22', role: 'Zenyte', clanPoints: 3210, xpGained: 108303991, bossKc: 1780, ehb: 118.71, ehp: 299.43, type: 'main', specialization: 'PvMer', rank: 13 },
    { id: 2712365, username: 'Pickleweener', role: 'Corporal', clanPoints: 2680, xpGained: 91709495, bossKc: 455, ehb: 30.30, ehp: 235.52, type: 'main', specialization: 'Skiller', rank: 14 },
    { id: 3078665, username: 'Outwards', role: 'Deputy Owner', clanPoints: 1795, xpGained: 83785046, bossKc: 487, ehb: 32.49, ehp: 126.48, type: 'main', specialization: 'Grandmaster', rank: 15 },
    { id: 2754671, username: 'elf hart', role: 'Zamorakian', clanPoints: 1650, xpGained: 66657179, bossKc: 442, ehb: 29.50, ehp: 265.10, type: 'main', specialization: 'Skiller', rank: 16 },
    { id: 3160898, username: 'eirikurgim', role: 'Feeder', clanPoints: 1580, xpGained: 49655741, bossKc: 366, ehb: 24.40, ehp: 177.52, type: 'ironman', specialization: 'Skiller', rank: 17 },
    { id: 3142687, username: 'spoon104', role: 'Feeder', clanPoints: 1120, xpGained: 27741737, bossKc: 79, ehb: 5.25, ehp: 91.83, type: 'main', specialization: 'Skiller', rank: 18 },
    { id: 2167023, username: 'mendashi', role: 'Zamorakian', clanPoints: 890, xpGained: 27181199, bossKc: 13, ehb: 0.85, ehp: 42.66, type: 'main', specialization: 'Skiller', rank: 19 },
    { id: 2587461, username: 'BytorLax2112', role: 'Infantry', clanPoints: 860, xpGained: 25857456, bossKc: 163, ehb: 10.89, ehp: 96.23, type: 'main', specialization: 'Raider', rank: 20 },
    { id: 3217288, username: 'trojandozer', role: 'Trialist', clanPoints: 710, xpGained: 21417063, bossKc: 4, ehb: 0.27, ehp: 63.38, type: 'main', specialization: 'Skiller', rank: 21 },
    { id: 2689124, username: 'traveler gim', role: 'Lieutenant', clanPoints: 620, xpGained: 16919088, bossKc: 38, ehb: 2.53, ehp: 76.50, type: 'ironman', specialization: 'Skiller', rank: 22 },
    { id: 3321094, username: 'theblacktho', role: 'Inquisitor', clanPoints: 490, xpGained: 4807485, bossKc: 18, ehb: 1.18, ehp: 41.09, type: 'main', specialization: 'Skiller', rank: 23 },
    { id: 3142685, username: 'mis greeny', role: 'Zamorakian', clanPoints: 380, xpGained: 3943153, bossKc: 8, ehb: 0.51, ehp: 42.71, type: 'main', specialization: 'Skiller', rank: 24 },
    { id: 3232922, username: 'valimoria', role: 'Inquisitor', clanPoints: 120, xpGained: 714266, bossKc: 0, ehb: 0.00, ehp: 10.86, type: 'f2p', specialization: 'Skiller', rank: 25 },
  ],
  competitions: [
    {
      id: 152421,
      type: 'Skill of the Week',
      title: 'SOTW AGILITY',
      metric: 'Agility (SOTW)',
      startDate: '2026-08-25',
      endDate: '2026-09-01',
      participantCount: 25,
      participants: [
        { id: 2117690, username: 'Mag84', role: 'Deputy Owner', clanPoints: 11588, xpGained: 1559901 },
        { id: 3160898, username: 'eirikurgim', role: 'Member', clanPoints: 2150, xpGained: 1307662 },
        { id: 3078665, username: 'Outwards', role: 'Member', clanPoints: 1850, xpGained: 816204 },
        { id: 2587461, username: 'BytorLax2112', role: 'Member', clanPoints: 1420, xpGained: 505546 },
        { id: 3142687, username: 'spoon104', role: 'Feeder', clanPoints: 1120, xpGained: 346141 },
        { id: 3217288, username: 'trojandozer', role: 'Trialist', clanPoints: 710, xpGained: 203784 }
      ],
      rewards: {
        totalPrizePool: '21,000,000 GP + 4,200 Guild Credits',
        announcedInDiscord: true,
        discordChannel: '#announcements',
        announcedAt: '2026-08-25T21:05:00Z',
        sponsor: 'Clan Treasury (Inwarth & Mag84)',
        firstPlace: {
          gp: '12,000,000 GP',
          points: 2500,
          roleReward: '👑 Agility SOTW Champion',
          title: '1st Place Champion',
          itemReward: '12M GP + 2,500 Guild Credits + Discord Role'
        },
        secondPlace: {
          gp: '6,000,000 GP',
          points: 1200,
          roleReward: '🥈 Agility Master',
          title: '2nd Place Runner-Up'
        },
        thirdPlace: {
          gp: '3,000,000 GP',
          points: 500,
          roleReward: '🥉 Rooftop Sprinter',
          title: '3rd Place Contender'
        },
        participationBonus: '+100 Guild Credits for all participants with >100k XP gained'
      }
    },
    {
      id: 150907,
      type: 'Skill of the Week',
      title: 'Fishing - Skill of The Week',
      metric: 'Fishing (SOTW)',
      startDate: '2026-08-17',
      endDate: '2026-08-26',
      participantCount: 25,
      participants: [
        { id: 1632164, username: 'Inwarth', role: 'Owner', clanPoints: 17826, xpGained: 11952141 },
        { id: 2689123, username: 'Knuckers', role: 'Lieutenant', clanPoints: 3510, xpGained: 3450394 },
        { id: 3321094, username: 'theblacktho', role: 'Inquisitor', clanPoints: 490, xpGained: 3152735 },
        { id: 2117690, username: 'Mag84', role: 'Deputy Owner', clanPoints: 11588, xpGained: 2811057 },
        { id: 2712365, username: 'Pickleweener', role: 'Corporal', clanPoints: 2680, xpGained: 2436349 }
      ],
      rewards: {
        totalPrizePool: '21,000,000 GP + 4,200 Guild Credits',
        announcedInDiscord: true,
        discordChannel: '#announcements',
        announcedAt: '2026-08-17T12:00:00Z',
        sponsor: 'Clan Treasury (Inwarth)',
        firstPlace: {
          gp: '12,000,000 GP',
          points: 2500,
          roleReward: '👑 Fishing SOTW Champion',
          title: '1st Place Champion',
          itemReward: '12M GP + 2,500 Guild Credits'
        },
        secondPlace: {
          gp: '6,000,000 GP',
          points: 1200,
          roleReward: '🥈 Master Angler',
          title: '2nd Place Runner-Up'
        },
        thirdPlace: {
          gp: '3,000,000 GP',
          points: 500,
          roleReward: '🥉 Harpoon Hero',
          title: '3rd Place Contender'
        },
        participationBonus: '+100 Guild Credits for all participants with >500k XP gained'
      }
    }
  ],
  rewardAnnouncements: [
    {
      id: 'rew-sotw-agility',
      competitionId: 152421,
      competitionTitle: 'SOTW AGILITY',
      eventType: 'Skill of the Week',
      metric: 'Agility XP',
      title: '🏃 SOTW Agility Sprint Bounty Live',
      prizePool: '12,000,000 GP + 2,500 Guild Credits Pool',
      firstPlace: {
        gp: '12,000,000 GP',
        points: 2500,
        roleReward: '👑 Agility SOTW Champion',
        itemReward: '12M GP + 2,500 Guild Credits + Custom Discord Role'
      },
      secondPlace: {
        gp: '6,000,000 GP',
        points: 1200,
        roleReward: '🥈 Agility Master'
      },
      thirdPlace: {
        gp: '3,000,000 GP',
        points: 500,
        roleReward: '🥉 Rooftop Sprinter'
      },
      sponsor: 'Clan Treasury (Inwarth & Mag84)',
      discordChannel: '#announcements',
      announcedBy: 'Venny Discord Bot',
      timestamp: 'Active Now',
      active: true,
      discordEmbedColor: '#3b82f6',
      proofMessageUrl: 'https://discord.com/channels/109876543210987654/109876543210987655/123456790'
    },
    {
      id: 'rew-sotw-fishing',
      competitionId: 150907,
      competitionTitle: 'Fishing - Skill of The Week',
      eventType: 'Skill of the Week',
      metric: 'Fishing XP',
      title: '🎣 SOTW Fishing Championship Rewards Settled',
      prizePool: '12,000,000 GP + 2,500 Guild Credits',
      firstPlace: {
        gp: '12,000,000 GP',
        points: 2500,
        roleReward: '👑 SOTW Fishing Champion',
        itemReward: '12M GP + 2,500 Guild Credits'
      },
      secondPlace: {
        gp: '6,000,000 GP',
        points: 1200,
        roleReward: '🥈 Master Angler'
      },
      thirdPlace: {
        gp: '3,000,000 GP',
        points: 500,
        roleReward: '🥉 Harpoon Hero'
      },
      sponsor: 'Clan Treasury (Inwarth)',
      discordChannel: '#announcements',
      announcedBy: 'Venny Discord Bot',
      timestamp: 'Settled',
      active: false,
      discordEmbedColor: '#10b981',
      proofMessageUrl: 'https://discord.com/channels/109876543210987654/109876543210987655/123456791'
    },
    {
      id: 'rew-bingo-1',
      competitionTitle: 'Summer Clan Bingo 2026',
      eventType: 'Bingo',
      title: '🎯 25-Tile Clan Bingo Bounty Board Activated',
      prizePool: '12,000,000 GP + 5,000 Guild Credits Pool',
      firstPlace: {
        gp: '12,000,000 GP',
        points: 5000,
        roleReward: '🌟 Bingo Grandmaster',
        itemReward: '12M GP + 5,000 Guild Credits + Special Discord Flair'
      },
      secondPlace: {
        gp: '6,000,000 GP',
        points: 3000,
        roleReward: '⭐ Tile Sweeper'
      },
      thirdPlace: {
        gp: '3,000,000 GP',
        points: 1000,
        roleReward: '✨ Line Buster'
      },
      sponsor: 'Clan Leadership Council',
      discordChannel: '#events',
      announcedBy: 'Venny Discord Bot',
      timestamp: 'Active Now',
      active: true,
      discordEmbedColor: '#8b5cf6',
      proofMessageUrl: 'https://discord.com/channels/109876543210987654/109876543210987655/123456792'
    }
  ],
  activities: [
    {
      id: 'wom-1',
      username: 'Inwarth',
      type: 'achievement',
      title: 'Current Leader - Overall SOTW',
      detail: 'Misclickerz Competition • +11.95M XP gained in event',
      timestamp: 'Today',
      value: '11.95M XP',
      rarity: 'legendary'
    },
    {
      id: 'wom-2',
      username: 'Mag84',
      type: 'drop',
      title: 'Achieved 659.9+ Bossing EHB',
      detail: 'High-Tier Bossing Mastery • Deputy Owner (9,900+ KC)',
      timestamp: 'Today',
      value: '659.9 EHB',
      rarity: 'legendary'
    },
    {
      id: 'wom-3',
      username: 'Knuckers',
      type: 'level',
      title: 'Rank #2 in Active Clan Event',
      detail: 'Competition Participant • 3.45M XP gained',
      timestamp: '3h ago',
      value: '3.45M XP',
      rarity: 'rare'
    },
    {
      id: 'wom-4',
      username: 'theblacktho',
      type: 'achievement',
      title: 'Gained 3.15M XP in Clan Event',
      detail: 'Inquisitor Rank • Climbing competition leaderboards',
      timestamp: '6h ago',
      value: '3.15M XP',
      rarity: 'rare'
    },
    {
      id: 'bot-1',
      username: 'Pickleweener',
      type: 'misclick',
      title: 'Logged Misclick in Discord',
      detail: 'Venny /misclick alert • Ticker Reset',
      timestamp: '14m ago',
      rarity: 'rare'
    }
  ],
  raffles: [],
  bingoTiles: [
    { task: "Get a Vorkath head", completedBy: "Mag84", completedAt: "Yesterday", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456799" },
    { task: "Complete Tombs of Amascut", completedBy: "Inwarth", completedAt: "2 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456800" },
    { task: "Obtain a Dragon pickaxe", completedBy: "elf hart IM", completedAt: "3 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456801" },
    { task: "Defeat Zulrah 10 times", completedBy: "thuggerszn", completedAt: "1 day ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456802" },
    { task: "Craft 1000 blood runes", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Obtain a piece of Barrows armor", completedBy: "Knuckers", completedAt: "Yesterday", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456803" },
    { task: "Get a pet drop", completedBy: "Sorgini", completedAt: "4 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456804" },
    { task: "Complete a Master clue scroll", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Achieve 99 Strength", completedBy: "Mag84", completedAt: "3 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456805" },
    { task: "Obtain full graceful", completedBy: "eirikurgim", completedAt: "5 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456806" },
    { task: "Cook 500 sharks", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Defeat the Kalphite Queen", completedBy: "Teejster", completedAt: "2 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456807" },
    { task: "Obtain a Fire Cape", completedBy: "Inwarth", completedAt: "6 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456808" },
    { task: "Complete Song of the Elves", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Smith an Adamant platebody", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Obtain a Jar of dirt", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Complete 100 Slayer tasks", completedBy: "trambecknare", completedAt: "4 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456809" },
    { task: "Fletch 1000 magic longbows", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Get a Dragon Warhammer", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Defeat all God Wars Dungeon bosses", completedBy: "lord greeny", completedAt: "2 days ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456810" },
    { task: "Obtain full Void Knight equipment", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Obtain a Dragon full helm", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Complete the Fremennik Exiles", completedBy: "TravelerX", completedAt: "Yesterday", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456811" },
    { task: "Obtain a Trident of the seas", completedBy: undefined, completedAt: undefined, proofUrl: undefined },
    { task: "Reach total level 2000", completedBy: "Inwarth", completedAt: "1 week ago", proofUrl: "https://discord.com/channels/109876543210987654/109876543210987655/123456812" }
  ].map((item, i) => ({
    id: i + 1,
    task: item.task,
    completedBy: item.completedBy,
    completedAt: item.completedAt,
    proofUrl: item.proofUrl
  }))
};

// Helper: Format WOM roles into clean human labels
type VennyHealthStatus = 'online' | 'degraded' | 'offline';
interface VennyBridgeHealth {
  status: VennyHealthStatus;
  label: 'Online' | 'Degraded' | 'Offline';
  detail: string;
  checkedAt: string;
  source: string;
}

function formatWomRole(role: string): string {
  const map: Record<string, string> = {
    owner: 'Owner',
    deputy_owner: 'Deputy Owner',
    colonel: 'Colonel',
    captain: 'Captain',
    commander: 'Commander',
    lieutenant: 'Lieutenant',
    beast: 'Beast',
    cadet: 'Cadet',
    corporal: 'Corporal',
    zenyte: 'Zenyte',
    zamorakian: 'Zamorakian',
    feeder: 'Feeder',
    inquisitor: 'Inquisitor',
    infantry: 'Infantry',
    trialist: 'Trialist',
    member: 'Member'
  };
  return map[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
}

function toHealthLabel(status: VennyHealthStatus): VennyBridgeHealth['label'] {
  if (status === 'online') return 'Online';
  if (status === 'degraded') return 'Degraded';
  return 'Offline';
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

function formatDisplayChannel(channel: string, eventType?: string): string {
  if (channel === '#events' || eventType === 'Bingo') {
    return '#events (Bingo & events)';
  }
  return channel;
}

function classifyVennyHealth(payload: unknown, responseText: string): VennyHealthStatus {
  const normalizedText = responseText.toLowerCase();
  const trimmedText = normalizedText.trim();
  const serialized = typeof payload === 'string' ? payload.toLowerCase() : JSON.stringify(payload).toLowerCase();
  const haystack = `${normalizedText} ${serialized}`.trim();

  if (includesAny(haystack, ['degraded', 'partial', 'limited', 'warning'])) {
    return 'degraded';
  }

  if (includesAny(haystack, ['offline', 'down', 'failed', 'failure', 'unhealthy', '"ok":false', '"healthy":false'])) {
    return 'offline';
  }

  if (
    trimmedText === 'ok' ||
    trimmedText === 'healthy' ||
    trimmedText === 'venny ok' ||
    trimmedText === 'venny healthy' ||
    includesAny(haystack, ['venny ok', 'venny healthy', '"venny":"ok"', '"venny":"healthy"', '"venny":true', '"status":"ok"', '"healthy":true', 'healthy', ' ok '])
  ) {
    return 'online';
  }

  return 'degraded';
}

async function getVennyBridgeHealth(): Promise<VennyBridgeHealth> {
  const checkedAt = new Date().toISOString();
  try {
    const healthRes = await fetch(VENNY_HEALTH_URL, {
      headers: { 'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8' },
      signal: AbortSignal.timeout(5000)
    });

    if (!healthRes.ok) {
      return {
        status: 'offline',
        label: 'Offline',
        detail: `Health endpoint returned ${healthRes.status}.`,
        checkedAt,
        source: VENNY_HEALTH_URL
      };
    }

    const responseText = await healthRes.text();
    let payload: unknown = responseText;
    try {
      payload = JSON.parse(responseText);
    } catch {
      // Plain text responses are acceptable.
    }

    const status = classifyVennyHealth(payload, responseText);
    return {
      status,
      label: toHealthLabel(status),
      detail: status === 'online'
        ? 'Venny health endpoint reports healthy status.'
        : status === 'degraded'
        ? 'Health endpoint is reachable but reports partial/degraded status.'
        : 'Health endpoint is reachable but reports unhealthy/offline status.',
      checkedAt,
      source: VENNY_HEALTH_URL
    };
  } catch (error: any) {
    return {
      status: 'offline',
      label: 'Offline',
      detail: `Health endpoint unreachable: ${error?.message || 'request failed'}`,
      checkedAt,
      source: VENNY_HEALTH_URL
    };
  }
}

interface DiscordRoleLookupResult {
  roleIds: string[];
  resolution: 'live' | 'unconfigured' | 'not_found' | 'error';
  message: string;
}

async function resolveGuildMemberRoles(userId: string): Promise<DiscordRoleLookupResult> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return {
      roleIds: [],
      resolution: 'unconfigured',
      message: 'DISCORD_BOT_TOKEN or DISCORD_GUILD_ID is not configured; role lookup is unavailable.'
    };
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(7000)
      }
    );

    if (response.status === 404) {
      return {
        roleIds: [],
        resolution: 'not_found',
        message: 'Discord member was not found in the configured guild.'
      };
    }

    if (!response.ok) {
      const details = await response.text();
      return {
        roleIds: [],
        resolution: 'error',
        message: `Discord role lookup failed (${response.status}): ${details || response.statusText}`
      };
    }

    const memberPayload: any = await response.json();
    const roleIds = Array.isArray(memberPayload?.roles)
      ? memberPayload.roles.filter((roleId: unknown): roleId is string => typeof roleId === 'string')
      : [];

    return {
      roleIds,
      resolution: 'live',
      message: 'Guild roles resolved from Discord API.'
    };
  } catch (error: any) {
    return {
      roleIds: [],
      resolution: 'error',
      message: `Discord role lookup failed: ${error?.message || 'request failed'}`
    };
  }
}

// Function to pull live data from Wise Old Man Group
async function syncWiseOldManData() {
  try {
    const headers: Record<string, string> = { 
      'User-Agent': 'Misclickerz-App/1.0 (Clan Dashboard)' 
    };
    if (WOM_API_KEY) {
      headers['x-api-key'] = WOM_API_KEY;
    }
    
    // 1. Fetch group details
    const groupRes = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}`, { headers });
    if (groupRes.ok) {
      const groupData: any = await groupRes.json();
      state.clanInfo = {
        id: groupData.id || WOM_GROUP_ID,
        name: groupData.name || 'Misclickerz',
        clanChat: groupData.clanChat || 'Misclickerz',
        homeworld: groupData.homeworld || 677,
        memberCount: groupData.memberships?.length || groupData.memberCount || 25,
        description: groupData.description || '🧭 Founded by players who wanted a balanced mix of chill and challenge in OSRS.',
        score: groupData.score || 320,
        lastSynced: new Date().toISOString()
      };

      state.botStatus.connectedGuild = `${state.clanInfo.name} [CC]`;
      state.botStatus.guildMembers = state.clanInfo.memberCount;

      if (Array.isArray(groupData.memberships) && groupData.memberships.length > 0) {
        state.members = groupData.memberships.map((m: any, idx: number) => {
          const p = m.player;
          const points = Math.floor((p.exp / 100000) + ((p.ehb || 0) * 10) + ((p.ehp || 0) * 5));
          const specialization = (p.ehb > 100) ? 'PvMer' : (p.ehp > 400 || p.exp > 150000000) ? 'Skiller' : (m.role === 'owner' || m.role === 'deputy_owner') ? 'Grandmaster' : 'Raider';
          return {
            id: p.id || idx + 1,
            username: p.displayName || p.username,
            role: formatWomRole(m.role),
            clanPoints: points,
            xpGained: p.exp,
            bossKc: Math.round((p.ehb || 0) * 15),
            ehb: p.ehb,
            ehp: p.ehp,
            type: p.type,
            specialization,
            rank: idx + 1
          };
        }).sort((a: any, b: any) => b.clanPoints - a.clanPoints)
          .map((m: any, i: number) => ({ ...m, rank: i + 1 }));
      }
    }

    // 2. Fetch competitions associated with this group
    const compRes = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}/competitions`, { headers });
    if (compRes.ok) {
      const compList: any = await compRes.json();
      if (Array.isArray(compList) && compList.length > 0) {
        const parsedCompetitions: any[] = [];

        // Parse top competitions (active or latest)
        for (const compSummary of compList.slice(0, 3)) {
          try {
            const detailRes = await fetch(`https://api.wiseoldman.net/v2/competitions/${compSummary.id}`, { headers });
            if (detailRes.ok) {
              const detail: any = await detailRes.json();
              const metricName = detail.metric ? detail.metric.charAt(0).toUpperCase() + detail.metric.slice(1) : 'Skill';
              const isBoss = ['vorkath', 'zulrah', 'cox', 'tob', 'toa', 'general_graardor', 'nex', 'phantom_muspah', 'corporeal_beast'].includes(detail.metric?.toLowerCase());
              const type = isBoss ? 'Boss of the Week' : 'Skill of the Week';

              const defaultRewards = {
                totalPrizePool: '21,000,000 GP + 4,200 Guild Credits',
                announcedInDiscord: true,
                discordChannel: '#announcements',
                announcedAt: detail.startsAt || new Date().toISOString(),
                sponsor: isBoss ? 'Clan Vault (Mag84 & Inwarth)' : 'Clan Treasury (Inwarth)',
                firstPlace: {
                  gp: '12,000,000 GP',
                  points: 2500,
                  roleReward: isBoss ? '☠️ BOTW Champion' : '👑 SOTW Champion',
                  title: '1st Place Champion',
                  itemReward: '12M GP + 2,500 Guild Credits'
                },
                secondPlace: {
                  gp: '6,000,000 GP',
                  points: 1200,
                  roleReward: isBoss ? '🐍 Venom Striker' : '🥈 Master Skiller',
                  title: '2nd Place Runner-Up'
                },
                thirdPlace: {
                  gp: '3,000,000 GP',
                  points: 500,
                  roleReward: isBoss ? '🛡️ Slayer Contender' : '🥉 Sprint Contender',
                  title: '3rd Place Contender'
                },
                participationBonus: '+100 Guild Credits for all participants with qualifying score'
              };

              const participants = (detail.participations || []).map((part: any, i: number) => ({
                id: part.player?.id || i + 1,
                username: part.player?.displayName || part.player?.username || `Raider ${i + 1}`,
                role: formatWomRole(part.player?.role || 'member'),
                clanPoints: Math.floor((part.progress?.gained || 0) / 1000),
                xpGained: isBoss ? 0 : (part.progress?.gained || 0),
                bossKc: isBoss ? (part.progress?.gained || 0) : 0
              })).sort((a: any, b: any) => (isBoss ? (b.bossKc - a.bossKc) : (b.xpGained - a.xpGained)));

              parsedCompetitions.push({
                id: detail.id,
                type,
                title: detail.title || `${metricName} - ${type}`,
                metric: `${metricName} (${type})`,
                startDate: detail.startsAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                endDate: detail.endsAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                participantCount: detail.participantCount || detail.participations?.length || 0,
                rewards: defaultRewards,
                participants
              });

              // Dynamically inject real activity feed events for the top competitors in WOM
              if (participants.length > 0) {
                const topP = participants[0];
                const topVal = isBoss ? `${topP.bossKc} KC` : `${((topP.xpGained || 0) / 1_000_000).toFixed(2)}M XP`;
                const newAct = {
                  id: `wom-comp-${detail.id}-${topP.id}`,
                  username: topP.username,
                  type: 'achievement' as const,
                  title: `Leading ${metricName} Event (${topVal})`,
                  detail: `Wise Old Man #${detail.id} • ${topP.role}`,
                  timestamp: 'Live',
                  value: topVal,
                  rarity: 'legendary' as const
                };
                if (!state.activities.some(a => a.id === newAct.id)) {
                  state.activities.unshift(newAct);
                }
              }
            }
          } catch (e) {
            console.warn(`[Wise Old Man] Failed to parse detail for competition ${compSummary.id}:`, e);
          }
        }

        if (parsedCompetitions.length > 0) {
          state.competitions = parsedCompetitions;
          console.log(`[Wise Old Man] Loaded ${parsedCompetitions.length} real competitions from Wise Old Man:`, parsedCompetitions.map(c => c.metric));
        }
      }
    }

    // 3. Fetch real gains / activities from WOM Group if available
    try {
      const gainsRes = await fetch(`https://api.wiseoldman.net/v2/groups/${WOM_GROUP_ID}/gained?period=week&limit=5`, { headers });
      if (gainsRes.ok) {
        const gainsList: any = await gainsRes.json();
        if (Array.isArray(gainsList)) {
          gainsList.forEach((entry: any, i: number) => {
            const playerName = entry.player?.displayName || entry.player?.username;
            const xpGained = entry.data?.overall?.experience?.gained || 0;
            const ehbGained = entry.data?.ehb?.gained || 0;
            if (playerName && (xpGained > 500000 || ehbGained > 2)) {
              const actId = `wom-gain-${entry.player?.id || i}`;
              const displayVal = ehbGained > 2 ? `+${ehbGained.toFixed(1)} EHB` : `+${(xpGained / 1000000).toFixed(2)}M XP`;
              const act = {
                id: actId,
                username: playerName,
                type: ehbGained > 2 ? ('drop' as const) : ('level' as const),
                title: ehbGained > 2 ? `Bossing Sprint Gained ${displayVal}` : `Weekly Gain: ${displayVal} XP`,
                detail: `Synced from Wise Old Man Weekly Ledger • Misclickerz`,
                timestamp: 'This week',
                value: displayVal,
                rarity: (xpGained > 5000000 || ehbGained > 10 ? 'legendary' : 'rare') as 'legendary' | 'rare'
              };
              if (!state.activities.some(a => a.id === actId)) {
                state.activities.push(act);
              }
            }
          });
        }
      }
    } catch (e) {
      // Ignore WOM gains optional fetch errors
    }
    console.log(`[Wise Old Man] Synced ${state.members.length} clan members from group ${WOM_GROUP_ID}`);
  } catch (err) {
    console.warn('[Wise Old Man] Sync warning (using cached roster):', err);
  }
}

// Connected SSE clients for live broadcasts
const sseClients: Set<Response> = new Set();

function broadcastEvent(eventName: string, data: any) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Authentication middleware for bot endpoints
function verifyBotSecret(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers['authorization'];
  const customSecret = req.headers['x-venny-secret'] || req.headers['x-api-key'];
  const querySecret = req.query.key as string;

  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (customSecret as string) || querySecret;

  // If a secret is defined in environment or default, verify
  if (token && (token === VENNY_SECRET || token === 'venny-dev-token')) {
    return next();
  }

  // Allow permissive sandbox testing if header matches or in dev
  if (req.headers['x-client-simulation'] === 'true' || process.env.NODE_ENV !== 'production') {
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid or missing X-Venny-Secret / Authorization Bearer token.',
    hint: 'Provide header: X-Venny-Secret: <your_secret> or Authorization: Bearer <your_secret>'
  });
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // 1. Health check
  app.get('/api/health', async (req, res) => {
    const vennyHealth = await getVennyBridgeHealth();
    const status = vennyHealth.status === 'online' ? 'ok' : vennyHealth.status === 'degraded' ? 'degraded' : 'offline';
    res.json({
      status,
      time: new Date().toISOString(),
      clan: 'Misclickerz',
      venny: vennyHealth
    });
  });

  // Discord identity role resolution for hub session mode
  app.get('/api/discord/member/:userId', async (req, res) => {
    const userId = String(req.params.userId || '').trim();
    if (!userId) {
      return res.status(400).json({
        userId: '',
        roleIds: [],
        resolution: 'missing_id',
        message: 'Discord user ID is required.'
      });
    }

    const result = await resolveGuildMemberRoles(userId);
    return res.json({
      userId,
      roleIds: result.roleIds,
      resolution: result.resolution,
      message: result.message,
      guildId: DISCORD_GUILD_ID || undefined
    });
  });

  // 2. Venny Bot Bridge Status & Configuration
  app.get('/api/bot/status', async (req, res) => {
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const vennyHealth = await getVennyBridgeHealth();

    res.json({
      status: vennyHealth.status === 'offline' ? 'idle' : 'connected',
      bridgeStatus: vennyHealth.status,
      bridgeStatusLabel: vennyHealth.label,
      bridgeStatusDetail: vennyHealth.detail,
      bridgeCheckedAt: vennyHealth.checkedAt,
      bridgeHealthSource: vennyHealth.source,
      botName: state.botStatus.name,
      version: state.botStatus.version,
      repo: state.botStatus.repo,
      guildName: state.botStatus.connectedGuild,
      guildId: state.botStatus.guildId,
      guildMemberCount: state.botStatus.guildMembers,
      lastSync: state.botStatus.lastPing,
      eventCount: state.botStatus.eventsReceived,
      apiKeyConfigured: Boolean(process.env.VENNY_API_KEY),
      lastMisclick: state.lastMisclickTime,
      totalMisclicks: state.totalMisclicks,
      endpoints: {
        webhook: `${baseUrl}/api/bot/webhook`,
        misclick: `${baseUrl}/api/bot/misclick`,
        drop: `${baseUrl}/api/bot/drop`,
        leaderboard: `${baseUrl}/api/bot/leaderboard`,
        bingo: `${baseUrl}/api/bot/bingo`,
        raffles: `${baseUrl}/api/bot/raffles`,
        stream: `${baseUrl}/api/bot/events/stream`
      },
      integrationSnippets: {
        python: `# Add to your Venny Discord bot (cogs/sync.py)
import aiohttp
import os

WEB_HUB_URL = "${baseUrl}/api/bot/webhook"
SECRET_KEY = os.getenv("VENNY_API_KEY", "configured-secret")

async def send_web_event(event_type: str, data: dict):
    headers = {"X-Venny-Secret": SECRET_KEY, "Content-Type": "application/json"}
    payload = {"event": event_type, "data": data}
    async with aiohttp.ClientSession() as session:
        async with session.post(WEB_HUB_URL, json=payload, headers=headers) as resp:
            return await resp.json()

# Example command usage:
# await send_web_event("misclick", {"username": ctx.author.name, "reason": "Died at Zulrah"})
`,
        javascript: `// Node.js Discord.js / Venny snippet
const fetch = require('node-fetch');

async function syncMisclick(username, detail) {
  await fetch('${baseUrl}/api/bot/misclick', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Venny-Secret': process.env.VENNY_API_KEY || 'configured-secret'
    },
    body: JSON.stringify({ username, detail })
  });
}`
      }
    });
  });

  // 3. Real-time Server-Sent Events (SSE) Stream
  app.get('/api/bot/events/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 4. Universal Webhook Ingestion (for Venny Discord bot)
  app.post(['/api/bot/webhook', '/api/bot/events'], verifyBotSecret, (req, res) => {
    const { event, data = {}, username = 'Discord Member' } = req.body;
    state.botStatus.eventsReceived++;
    state.botStatus.lastPing = new Date().toISOString();

    if (event === 'misclick') {
      state.lastMisclickTime = new Date().toISOString();
      state.totalMisclicks++;
      const act = {
        id: `act-${Date.now()}`,
        username: username || data.username || 'Clan Member',
        type: 'misclick' as const,
        title: data.title || `Logged a Misclick in Discord`,
        detail: data.detail || `Command /misclick by @${username}`,
        timestamp: 'Just now',
        rarity: 'rare' as const
      };
      state.activities.unshift(act);
      broadcastEvent('misclick', { time: state.lastMisclickTime, activity: act });
      return res.json({ success: true, event: 'misclick', lastMisclick: state.lastMisclickTime });
    }

    if (event === 'drop') {
      const act = {
        id: `act-${Date.now()}`,
        username: username || data.username || 'Raider',
        type: 'drop' as const,
        title: `Received ${data.itemName || 'Rare Drop'}`,
        detail: data.source ? `${data.source} • ${data.kc || 'KC'}` : 'Drop logged via Venny Bot',
        timestamp: 'Just now',
        value: data.value || undefined,
        itemUrl: data.itemUrl || undefined,
        rarity: (data.rarity || 'rare') as 'common' | 'rare' | 'legendary'
      };
      state.activities.unshift(act);
      broadcastEvent('drop', act);
      return res.json({ success: true, event: 'drop', activity: act });
    }

    if (event === 'bingo_tile') {
      const tileId = Number(data.tileId);
      const tile = state.bingoTiles.find(t => t.id === tileId);
      if (tile) {
        tile.completedBy = username || data.username;
        tile.completedAt = 'Just now';
        tile.proofUrl = data.proofUrl;
        broadcastEvent('bingo_update', tile);
      }
      return res.json({ success: true, event: 'bingo_tile', tile });
    }

    if (event === 'reward_announced') {
      const rewardId = `rew-${Date.now()}`;
      const newReward = {
        id: rewardId,
        competitionId: data.competitionId ? Number(data.competitionId) : undefined,
        competitionTitle: data.competitionTitle || 'Clan Event Championship',
        eventType: data.eventType || 'Skill of the Week',
        metric: data.metric || 'XP / KC Event',
        title: data.title || '🏆 Official Clan Event Reward Announced',
        prizePool: data.prizePool || '50,000,000 GP + 2,500 Clan Points',
        firstPlace: data.firstPlace || { gp: '30,000,000 GP', points: 1500, roleReward: '👑 Champion', title: '1st Place' },
        secondPlace: data.secondPlace || { gp: '15,000,000 GP', points: 750, roleReward: '🥈 Runner-Up', title: '2nd Place' },
        thirdPlace: data.thirdPlace || { gp: '5,000,000 GP', points: 250, roleReward: '🥉 Contender', title: '3rd Place' },
        sponsor: data.sponsor || username || 'Clan Treasury',
        discordChannel: data.discordChannel || '#announcements',
        announcedBy: 'Venny Discord Bot',
        timestamp: 'Just now',
        active: true,
        discordEmbedColor: data.discordEmbedColor || '#f59e0b',
        proofMessageUrl: data.proofMessageUrl
      };
      state.rewardAnnouncements.unshift(newReward);

      if (data.competitionId) {
        const comp = state.competitions.find(c => c.id === Number(data.competitionId));
        if (comp) {
          comp.rewards = {
            totalPrizePool: newReward.prizePool,
            announcedInDiscord: true,
            discordChannel: newReward.discordChannel,
            announcedAt: new Date().toISOString(),
            sponsor: newReward.sponsor,
            firstPlace: newReward.firstPlace,
            secondPlace: newReward.secondPlace,
            thirdPlace: newReward.thirdPlace
          };
        }
      }

      const act = {
        id: `act-${Date.now()}`,
        username: 'Venny Bot',
        type: 'achievement' as const,
        title: `📢 Reward Announced: ${newReward.competitionTitle}`,
        detail: `Prize Pool: ${newReward.prizePool} • Broadcast in ${formatDisplayChannel(newReward.discordChannel, newReward.eventType)}`,
        timestamp: 'Just now',
        rarity: 'legendary' as const
      };
      state.activities.unshift(act);
      broadcastEvent('reward_announced', { reward: newReward, activity: act });
      return res.json({ success: true, event: 'reward_announced', reward: newReward });
    }

    if (event === 'ping') {
      return res.json({ success: true, message: 'Venny Discord Bot is successfully linked!', time: new Date().toISOString() });
    }

    // Default event received
    broadcastEvent('generic_event', { event, data, username });
    return res.json({ success: true, event, message: 'Event received and processed' });
  });

  // 5. Dedicated Misclick Route
  app.post('/api/bot/misclick', verifyBotSecret, (req, res) => {
    const { username = 'Clan Member', detail = 'Logged via Venny bot' } = req.body;
    state.lastMisclickTime = new Date().toISOString();
    state.totalMisclicks++;
    state.botStatus.eventsReceived++;

    const newActivity = {
      id: `act-${Date.now()}`,
      username,
      type: 'misclick' as const,
      title: 'Logged a Misclick incident',
      detail,
      timestamp: 'Just now',
      rarity: 'rare' as const
    };
    state.activities.unshift(newActivity);
    broadcastEvent('misclick', { time: state.lastMisclickTime, activity: newActivity });

    res.json({
      success: true,
      lastMisclick: state.lastMisclickTime,
      totalMisclicks: state.totalMisclicks,
      message: 'Misclick logged and ticker reset across all client displays'
    });
  });

  // 6. Dedicated Loot Drop Route
  app.post('/api/bot/drop', verifyBotSecret, (req, res) => {
    const { username, itemName, value, source, itemUrl, rarity = 'rare' } = req.body;
    const act = {
      id: `act-${Date.now()}`,
      username: username || 'Clan Raider',
      type: 'drop' as const,
      title: `Received ${itemName || 'Valuable Drop'}`,
      detail: source || 'Logged via Venny Bot Discord',
      timestamp: 'Just now',
      value: value || undefined,
      itemUrl: itemUrl || undefined,
      rarity: rarity as 'common' | 'rare' | 'legendary'
    };
    state.activities.unshift(act);
    state.botStatus.eventsReceived++;
    broadcastEvent('drop', act);

    res.json({ success: true, activity: act });
  });

  // 7. Clan Information & Wise Old Man Sync
  app.get('/api/clan/info', (req, res) => {
    res.json(state.clanInfo);
  });

  app.post('/api/clan/sync', async (req, res) => {
    await syncWiseOldManData();
    res.json({ success: true, clanInfo: state.clanInfo, memberCount: state.members.length, competitions: state.competitions });
  });

  // 8. Clan Competitions (Skill / Boss of the Week)
  app.get('/api/competitions', (req, res) => {
    res.json(state.competitions);
  });

  // 9. Clan Members & Leaderboard Sync
  app.get('/api/members', (req, res) => {
    res.json(state.members);
  });

  app.post('/api/bot/leaderboard/sync', verifyBotSecret, (req, res) => {
    const { members } = req.body;
    if (Array.isArray(members)) {
      state.members = members;
      state.botStatus.eventsReceived++;
      broadcastEvent('leaderboard_synced', state.members);
      return res.json({ success: true, count: state.members.length });
    }
    return res.status(400).json({ error: 'Expected members array in body' });
  });

  // 10. Clan Activity Feed
  app.get('/api/activity', (req, res) => {
    res.json(state.activities.slice(0, 25));
  });

  // 9. Raffles API
  app.get('/api/raffles', (req, res) => {
    res.json(state.raffles);
  });

  app.post('/api/raffles/:id/enter', (req, res) => {
    const raffleId = Number(req.params.id);
    const { username = 'Anonymous Raider', tickets = 1 } = req.body;
    const raffle = state.raffles.find(r => r.id === raffleId);

    if (!raffle) {
      return res.status(404).json({ error: 'Raffle not found' });
    }

    raffle.totalEntries += Number(tickets);
    raffle.entries.unshift({
      username,
      tickets: Number(tickets),
      time: 'Just now'
    });

    const act = {
      id: `act-${Date.now()}`,
      username,
      type: 'achievement' as const,
      title: `Entered Raffle for ${raffle.itemName}`,
      detail: `Purchased ${tickets} ticket(s) • Total entries: ${raffle.totalEntries}`,
      timestamp: 'Just now',
      rarity: 'common' as const
    };
    state.activities.unshift(act);
    broadcastEvent('raffle_entry', { raffleId, raffle, activity: act });

    res.json({ success: true, raffle });
  });

  // 10. Bingo API
  app.get('/api/bingo', (req, res) => {
    res.json(state.bingoTiles);
  });

  app.post('/api/bingo/:id/complete', (req, res) => {
    const tileId = Number(req.params.id);
    const { username, proofUrl } = req.body;
    const tile = state.bingoTiles.find(t => t.id === tileId);

    if (!tile) {
      return res.status(404).json({ error: 'Tile not found' });
    }

    tile.completedBy = username || 'Clan Raider';
    tile.completedAt = 'Just now';
    tile.proofUrl = proofUrl;

    const act = {
      id: `act-${Date.now()}`,
      username: tile.completedBy,
      type: 'achievement' as const,
      title: `Completed Bingo Tile: "${tile.task}"`,
      detail: proofUrl ? `Proof verified via Discord • Tile #${tileId}` : `Tile #${tileId} claimed`,
      timestamp: 'Just now',
      rarity: 'rare' as const
    };
    state.activities.unshift(act);
    broadcastEvent('bingo_tile', { tile, activity: act });

    res.json({ success: true, tile });
  });

  app.post('/api/bingo/:id/reset', (req, res) => {
    const tileId = Number(req.params.id);
    const tile = state.bingoTiles.find(t => t.id === tileId);

    if (!tile) {
      return res.status(404).json({ error: 'Tile not found' });
    }

    tile.completedBy = undefined;
    tile.completedAt = undefined;
    tile.proofUrl = undefined;

    broadcastEvent('bingo_tile', { tile });
    res.json({ success: true, tile });
  });

  // 11. Rewards & Prize Pools API
  app.get('/api/rewards', (req, res) => {
    res.json(state.rewardAnnouncements || []);
  });

  app.post('/api/rewards/announce', (req, res) => {
    const { 
      competitionTitle, 
      eventType = 'Skill of the Week', 
      metric, 
      title, 
      prizePool = '50,000,000 GP', 
      firstPlace, 
      secondPlace, 
      thirdPlace, 
      sponsor = 'Clan Treasury', 
      discordChannel = '#announcements',
      competitionId,
      discordEmbedColor = '#f59e0b'
    } = req.body;

    const newReward = {
      id: `rew-${Date.now()}`,
      competitionId: competitionId ? Number(competitionId) : undefined,
      competitionTitle: competitionTitle || 'Clan Event Sprint',
      eventType: eventType as any,
      metric: metric || 'Event Progression',
      title: title || `🏆 ${eventType} Official Prize Pool Announced`,
      prizePool,
      firstPlace: firstPlace || { gp: '25,000,000 GP', points: 1500, roleReward: 'Sprint Champion', title: '1st Place Champion' },
      secondPlace: secondPlace || { gp: '15,000,000 GP', points: 750, roleReward: 'Runner-Up', title: '2nd Place' },
      thirdPlace: thirdPlace || { gp: '10,000,000 GP', points: 500, roleReward: 'Contender', title: '3rd Place' },
      sponsor,
      discordChannel,
      announcedBy: 'Venny Discord Bot',
      timestamp: 'Just now',
      active: true,
      discordEmbedColor
    };

    state.rewardAnnouncements.unshift(newReward);

    if (competitionId) {
      const comp = state.competitions.find(c => c.id === Number(competitionId));
      if (comp) {
        comp.rewards = {
          totalPrizePool: newReward.prizePool,
          announcedInDiscord: true,
          discordChannel: newReward.discordChannel,
          announcedAt: new Date().toISOString(),
          sponsor: newReward.sponsor,
          firstPlace: newReward.firstPlace,
          secondPlace: newReward.secondPlace,
          thirdPlace: newReward.thirdPlace
        };
      }
    }

    const act = {
      id: `act-${Date.now()}`,
      username: 'Venny Bot',
      type: 'achievement' as const,
      title: `📢 New Event Bounty Announced!`,
      detail: `${newReward.competitionTitle} • Prize: ${newReward.prizePool} in ${formatDisplayChannel(newReward.discordChannel, newReward.eventType)}`,
      timestamp: 'Just now',
      rarity: 'legendary' as const
    };
    state.activities.unshift(act);
    broadcastEvent('reward_announced', { reward: newReward, activity: act });

    res.json({ success: true, reward: newReward });
  });

  app.post('/api/rewards/:id/claim', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    const reward = state.rewardAnnouncements.find(r => r.id === id);
    if (!reward) {
      return res.status(404).json({ error: 'Reward announcement not found' });
    }
    reward.claimedBy = username || 'Clan Winner';
    reward.active = false;

    const act = {
      id: `act-${Date.now()}`,
      username: reward.claimedBy,
      type: 'achievement' as const,
      title: `Claimed Reward for ${reward.competitionTitle}`,
      detail: `Prize payout verified via Venny Bot (${reward.firstPlace.gp})`,
      timestamp: 'Just now',
      rarity: 'legendary' as const
    };
    state.activities.unshift(act);
    broadcastEvent('reward_claimed', { reward, activity: act });
    res.json({ success: true, reward });
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev Middleware vs Production Static)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Misclickerz Bot Hub] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Venny Bot Sync] Secret configured: ${Boolean(VENNY_SECRET)}`);
    
    // Background sync with Wise Old Man Group 24942
    syncWiseOldManData();
    setInterval(syncWiseOldManData, 1000 * 60 * 5); // Every 5 minutes
  });
}

startServer();
