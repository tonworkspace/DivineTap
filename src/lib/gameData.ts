// Game Data Types and Functions for Divine Mining

export interface Task {
  id: string;
  description: string;
  reward: number;
  completed: boolean;
  status: 'active' | 'completed' | 'locked';
  requiredLevel: number;
  platform?: string;
  link?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  progress?: number;
  cooldownEndTime: number;
  isNew: boolean;
  updated_at: string;
}

export interface LevelInfo {
  level: number;
  experienceRequired: number;
  bonusMultiplier: number;
  unlockFeatures: string[];
}

// Level progression system
const LEVEL_DATA: LevelInfo[] = [
  { level: 1, experienceRequired: 0, bonusMultiplier: 1.0, unlockFeatures: ['Basic Mining'] },
  { level: 2, experienceRequired: 1000, bonusMultiplier: 1.1, unlockFeatures: ['Energy Upgrades'] },
  { level: 3, experienceRequired: 2500, bonusMultiplier: 1.2, unlockFeatures: ['Auto Mining'] },
  { level: 4, experienceRequired: 5000, bonusMultiplier: 1.3, unlockFeatures: ['Advanced Upgrades'] },
  { level: 5, experienceRequired: 10000, bonusMultiplier: 1.4, unlockFeatures: ['Special Events'] },
  { level: 6, experienceRequired: 20000, bonusMultiplier: 1.5, unlockFeatures: ['Premium Features'] },
  { level: 7, experienceRequired: 40000, bonusMultiplier: 1.6, unlockFeatures: ['Elite Mining'] },
  { level: 8, experienceRequired: 75000, bonusMultiplier: 1.7, unlockFeatures: ['Master Tools'] },
  { level: 9, experienceRequired: 125000, bonusMultiplier: 1.8, unlockFeatures: ['Divine Powers'] },
  { level: 10, experienceRequired: 200000, bonusMultiplier: 2.0, unlockFeatures: ['Cosmic Mining'] },
  { level: 15, experienceRequired: 500000, bonusMultiplier: 2.5, unlockFeatures: ['Quantum Mining'] },
  { level: 20, experienceRequired: 1000000, bonusMultiplier: 3.0, unlockFeatures: ['Stellar Mining'] },
  { level: 25, experienceRequired: 2500000, bonusMultiplier: 3.5, unlockFeatures: ['Galactic Mining'] },
  { level: 30, experienceRequired: 5000000, bonusMultiplier: 4.0, unlockFeatures: ['Universal Mining'] },
  { level: 40, experienceRequired: 10000000, bonusMultiplier: 5.0, unlockFeatures: ['Multiverse Mining'] },
  { level: 50, experienceRequired: 25000000, bonusMultiplier: 6.0, unlockFeatures: ['Omniverse Mining'] },
  { level: 75, experienceRequired: 75000000, bonusMultiplier: 8.0, unlockFeatures: ['Reality Mining'] },
  { level: 100, experienceRequired: 150000000, bonusMultiplier: 10.0, unlockFeatures: ['Divine Ascension'] }
];

export const getLevel = (experience: number): LevelInfo => {
  // Find the highest level the player has achieved
  for (let i = LEVEL_DATA.length - 1; i >= 0; i--) {
    if (experience >= LEVEL_DATA[i].experienceRequired) {
      return LEVEL_DATA[i];
    }
  }
  return LEVEL_DATA[0]; // Default to level 1
};

export const getNextLevel = (currentLevel: number): LevelInfo | null => {
  const nextLevelData = LEVEL_DATA.find(level => level.level === currentLevel + 1);
  return nextLevelData || null;
};

export const getExperienceToNextLevel = (currentExperience: number): number => {
  const currentLevel = getLevel(currentExperience);
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) {
    return 0; // Max level reached
  }
  
  return nextLevel.experienceRequired - currentExperience;
};

export const getLevelProgress = (currentExperience: number): number => {
  const currentLevel = getLevel(currentExperience);
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) {
    return 100; // Max level reached
  }
  
  const experienceInCurrentLevel = currentExperience - currentLevel.experienceRequired;
  const experienceNeededForNextLevel = nextLevel.experienceRequired - currentLevel.experienceRequired;
  
  return Math.min(100, (experienceInCurrentLevel / experienceNeededForNextLevel) * 100);
};

// Default upgrade items
export const upgradeItems = [
  {
    id: 'mining-speed',
    name: 'Mining Speed',
    description: 'Increase mining rate by 10%',
    baseCost: 100,
    costMultiplier: 1.15,
    effect: 'mining_speed',
    effectValue: 0.1,
    maxLevel: 50
  },
  {
    id: 'energy-efficiency',
    name: 'Energy Efficiency',
    description: 'Reduce energy consumption by 5%',
    baseCost: 200,
    costMultiplier: 1.2,
    effect: 'energy_efficiency',
    effectValue: 0.05,
    maxLevel: 30
  },
  {
    id: 'energy-capacity',
    name: 'Energy Capacity',
    description: 'Increase maximum energy by 50',
    baseCost: 500,
    costMultiplier: 1.25,
    effect: 'energy_capacity',
    effectValue: 50,
    maxLevel: 20
  },
  {
    id: 'auto-mining',
    name: 'Auto Mining',
    description: 'Automatically start mining when energy is available',
    baseCost: 1000,
    costMultiplier: 1.5,
    effect: 'auto_mining',
    effectValue: 1,
    maxLevel: 1
  },
  {
    id: 'offline-earnings',
    name: 'Offline Earnings',
    description: 'Earn 5% of normal rate while offline',
    baseCost: 2500,
    costMultiplier: 1.3,
    effect: 'offline_earnings',
    effectValue: 0.05,
    maxLevel: 10
  }
];

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (gameState: any) => boolean;
  reward: number;
  icon: string;
  category: 'mining' | 'upgrades' | 'social' | 'special';
}

export const achievements: Achievement[] = [
  {
    id: 'first-mine',
    name: 'First Steps',
    description: 'Start mining for the first time',
    condition: (state) => state.totalPointsEarned > 0,
    reward: 100,
    icon: '⛏️',
    category: 'mining'
  },
  {
    id: 'first-upgrade',
    name: 'Enhancement',
    description: 'Purchase your first upgrade',
    condition: (state) => state.upgradesPurchased >= 1,
    reward: 250,
    icon: '⚡',
    category: 'upgrades'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Reach 10 points per second',
    condition: (state) => state.pointsPerSecond >= 10,
    reward: 500,
    icon: '🏃',
    category: 'mining'
  },
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Earn 1,000,000 total points',
    condition: (state) => state.totalPointsEarned >= 1000000,
    reward: 10000,
    icon: '💰',
    category: 'mining'
  },
  {
    id: 'upgrade-master',
    name: 'Upgrade Master',
    description: 'Purchase 50 upgrades',
    condition: (state) => state.upgradesPurchased >= 50,
    reward: 5000,
    icon: '🔧',
    category: 'upgrades'
  },
  {
    id: 'energy-saver',
    name: 'Energy Saver',
    description: 'Reduce energy consumption by 50%',
    condition: (state) => state.energyEfficiency >= 0.5,
    reward: 2000,
    icon: '🔋',
    category: 'upgrades'
  },
  {
    id: 'offline-king',
    name: 'Offline King',
    description: 'Earn 50% of normal rate while offline',
    condition: (state) => state.offlineEfficiency >= 0.5,
    reward: 3000,
    icon: '🌙',
    category: 'special'
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Refer 10 players',
    condition: (state) => state.referrals >= 10,
    reward: 1500,
    icon: '🦋',
    category: 'social'
  }
];

// Daily rewards configuration
export interface DailyReward {
  day: number;
  reward: number;
  type: 'points' | 'energy' | 'upgrade' | 'special';
  description: string;
  icon: string;
}

export const dailyRewards: DailyReward[] = [
  { day: 1, reward: 100, type: 'points', description: 'Welcome Bonus', icon: '🎁' },
  { day: 2, reward: 200, type: 'points', description: 'Day 2 Bonus', icon: '🎁' },
  { day: 3, reward: 300, type: 'points', description: 'Day 3 Bonus', icon: '🎁' },
  { day: 4, reward: 500, type: 'points', description: 'Day 4 Bonus', icon: '🎁' },
  { day: 5, reward: 750, type: 'points', description: 'Day 5 Bonus', icon: '🎁' },
  { day: 6, reward: 1000, type: 'points', description: 'Day 6 Bonus', icon: '🎁' },
  { day: 7, reward: 2000, type: 'points', description: 'Weekly Bonus!', icon: '🏆' },
  { day: 8, reward: 250, type: 'points', description: 'Day 8 Bonus', icon: '🎁' },
  { day: 9, reward: 350, type: 'points', description: 'Day 9 Bonus', icon: '🎁' },
  { day: 10, reward: 500, type: 'points', description: 'Day 10 Bonus', icon: '🎁' },
  { day: 11, reward: 750, type: 'points', description: 'Day 11 Bonus', icon: '🎁' },
  { day: 12, reward: 1000, type: 'points', description: 'Day 12 Bonus', icon: '🎁' },
  { day: 13, reward: 1500, type: 'points', description: 'Day 13 Bonus', icon: '🎁' },
  { day: 14, reward: 3000, type: 'points', description: 'Bi-weekly Bonus!', icon: '🏆' },
  { day: 15, reward: 400, type: 'points', description: 'Day 15 Bonus', icon: '🎁' },
  { day: 16, reward: 600, type: 'points', description: 'Day 16 Bonus', icon: '🎁' },
  { day: 17, reward: 800, type: 'points', description: 'Day 17 Bonus', icon: '🎁' },
  { day: 18, reward: 1000, type: 'points', description: 'Day 18 Bonus', icon: '🎁' },
  { day: 19, reward: 1250, type: 'points', description: 'Day 19 Bonus', icon: '🎁' },
  { day: 20, reward: 1500, type: 'points', description: 'Day 20 Bonus', icon: '🎁' },
  { day: 21, reward: 5000, type: 'points', description: 'Monthly Bonus!', icon: '🏆' },
  { day: 22, reward: 500, type: 'points', description: 'Day 22 Bonus', icon: '🎁' },
  { day: 23, reward: 750, type: 'points', description: 'Day 23 Bonus', icon: '🎁' },
  { day: 24, reward: 1000, type: 'points', description: 'Day 24 Bonus', icon: '🎁' },
  { day: 25, reward: 1250, type: 'points', description: 'Day 25 Bonus', icon: '🎁' },
  { day: 26, reward: 1500, type: 'points', description: 'Day 26 Bonus', icon: '🎁' },
  { day: 27, reward: 1750, type: 'points', description: 'Day 27 Bonus', icon: '🎁' },
  { day: 28, reward: 7500, type: 'points', description: 'Monthly Bonus!', icon: '🏆' },
  { day: 29, reward: 600, type: 'points', description: 'Day 29 Bonus', icon: '🎁' },
  { day: 30, reward: 10000, type: 'points', description: 'Monthly Bonus!', icon: '🏆' }
];

// Helper function to get daily reward
export const getDailyReward = (day: number): DailyReward | null => {
  return dailyRewards.find(reward => reward.day === day) || null;
};

// Helper function to calculate login streak bonus
export const calculateLoginStreakBonus = (streak: number): number => {
  if (streak <= 0) return 0;
  if (streak <= 7) return streak * 10; // 10 points per day for first week
  if (streak <= 30) return 70 + (streak - 7) * 15; // 15 points per day for first month
  return 415 + (streak - 30) * 20; // 20 points per day after first month
}; 