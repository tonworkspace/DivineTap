// File: src/utils/types.ts

export interface AuthUser {
  id: number;
  username?: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  languageCode: string;
}

export enum TaskType {
  MINING = 'MINING',
  EXPLORATION = 'EXPLORATION',
  CRAFTING = 'CRAFTING',
  QUEST = 'QUEST',
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  ACHIEVEMENT = "ACHIEVEMENT",
  SOCIAL = "SOCIAL"
}

export enum SocialTaskType {
  SHARE = 'SHARE',
  INVITE = 'INVITE',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  FOLLOW = 'FOLLOW',
  POST = 'POST',
  INVITE_FRIEND = "INVITE_FRIEND",
  SHARE_ACHIEVEMENT = "SHARE_ACHIEVEMENT",
  JOIN_COMMUNITY = "JOIN_COMMUNITY",
  PARTICIPATE_EVENT = "PARTICIPATE_EVENT",
  SHARE_POST = "SHARE_POST",
  JOIN_GROUP = "JOIN_GROUP"
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// export interface Task {
//   id: string;
//   minerId: number;
//   type: TaskType;
//   status: TaskStatus;
//   startTime: number;
//   endTime?: number;
//   reward?: number;
//   description: string;
//   progress: number;
//   goal: number;
//   platform?: string;
// }

// export type GameTask = Omit<Task, 'type'> & { type: Exclude<TaskType, TaskType.SOCIAL> };

export interface MiningEquipment {
  id: number;
  name: string;
  level: number;
  efficiency: number;
  durability: number;
  minerId: number;
}

export interface Resource {
  id: number;
  name: string;
  rarity: ResourceRarity;
  quantity: number;
  minerId: number;
}

export enum ResourceRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface Upgrade {
  id: number;
  name: string;
  description: string;
  cost: number;
  effect: UpgradeEffect;
  minerId: number;
}

export interface UpgradeEffect {
  type: 'MINING_SPEED' | 'ENERGY_REGEN' | 'INVENTORY_SIZE' | 'LUCK';
  value: number;
}

export interface LeaderboardEntry {
  minerId: number;
  username: string;
  score: number;
  rank: number;
}

export interface GameSettings {
  energyRegenRate: number;
  maxEnergy: number;
  baseRewardRate: number;
  levelUpCost: (level: number) => number;
}

export interface Referral {
  id: string;
  referrerId: number;
  referredId: number;
  dateReferred: number;
  status: ReferralStatus;
  rewardClaimed: boolean;
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export type IconProps = {
  size?: number;
  className?: string;
}