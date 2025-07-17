import { supabase } from './supabaseClient';

// Database migration and setup utilities for Divine Mining Auth

export interface DatabaseMigration {
  name: string;
  version: string;
  description: string;
  execute: () => Promise<void>;
}

// Migration to add Divine Mining specific columns to users table
export const divineMiningUserMigration: DatabaseMigration = {
  name: 'divine_mining_user_columns',
  version: '1.0.0',
  description: 'Add Divine Mining specific columns to users table',
  execute: async () => {
    try {
      // Add Divine Mining specific columns to users table
      const migrations = [
        // Game data columns
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS divine_points NUMERIC DEFAULT 100`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_level INTEGER DEFAULT 1`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_experience NUMERIC DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS energy NUMERIC DEFAULT 100`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS max_energy NUMERIC DEFAULT 100`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS energy_regen_rate NUMERIC DEFAULT 0.3`,
        
        // Game state columns
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_mining BOOLEAN DEFAULT false`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS mining_started_at TIMESTAMP WITH TIME ZONE`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_save_time BIGINT DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS game_version TEXT DEFAULT '1.0.0'`,
        
        // Upgrade and progression columns
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_levels JSONB DEFAULT '{}'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS owned_skins TEXT[] DEFAULT '{default}'`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS active_skin TEXT DEFAULT 'default'`,
        
        // Premium features
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE`,
        
        // Social features (if not already present)
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS team_volume NUMERIC DEFAULT 0`
      ];

      for (const migration of migrations) {
        const { error } = await supabase.rpc('exec_sql', { sql: migration });
        if (error) {
          console.warn(`Migration warning (may already exist): ${error.message}`);
        }
      }

      console.log('Divine Mining user columns migration completed');
    } catch (error) {
      console.error('Error in divine mining user migration:', error);
      throw error;
    }
  }
};

// Migration to create game data table
export const gameDataTableMigration: DatabaseMigration = {
  name: 'game_data_table',
  version: '1.0.0',
  description: 'Create game_data table for storing detailed game state',
  execute: async () => {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS game_data (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          game_state JSONB NOT NULL DEFAULT '{}',
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_game_data_user_id ON game_data(user_id);
        CREATE INDEX IF NOT EXISTS idx_game_data_last_updated ON game_data(last_updated);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.warn('Game data table migration warning:', error.message);
      }

      console.log('Game data table migration completed');
    } catch (error) {
      console.error('Error in game data table migration:', error);
      throw error;
    }
  }
};

// Migration to create achievements table
export const achievementsTableMigration: DatabaseMigration = {
  name: 'achievements_table',
  version: '1.0.0',
  description: 'Create achievements table for tracking user achievements',
  execute: async () => {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_achievements (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          achievement_id TEXT NOT NULL,
          unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          progress NUMERIC DEFAULT 0,
          UNIQUE(user_id, achievement_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.warn('Achievements table migration warning:', error.message);
      }

      console.log('Achievements table migration completed');
    } catch (error) {
      console.error('Error in achievements table migration:', error);
      throw error;
    }
  }
};

// Migration to create daily rewards table
export const dailyRewardsTableMigration: DatabaseMigration = {
  name: 'daily_rewards_table',
  version: '1.0.0',
  description: 'Create daily rewards table for tracking daily reward claims',
  execute: async () => {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS daily_rewards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          day_number INTEGER NOT NULL,
          claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          reward_amount NUMERIC NOT NULL,
          reward_type TEXT NOT NULL DEFAULT 'points',
          UNIQUE(user_id, day_number)
        );
        
        CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
        CREATE INDEX IF NOT EXISTS idx_daily_rewards_claimed_at ON daily_rewards(claimed_at);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.warn('Daily rewards table migration warning:', error.message);
      }

      console.log('Daily rewards table migration completed');
    } catch (error) {
      console.error('Error in daily rewards table migration:', error);
      throw error;
    }
  }
};

// Migration to create referral tracking table
export const referralTrackingMigration: DatabaseMigration = {
  name: 'referral_tracking',
  version: '1.0.0',
  description: 'Create referral tracking table for detailed referral analytics',
  execute: async () => {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS referral_tracking (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true,
          total_earned NUMERIC DEFAULT 0,
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(referred_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer_id ON referral_tracking(referrer_id);
        CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred_id ON referral_tracking(referred_id);
        CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred_at ON referral_tracking(referred_at);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.warn('Referral tracking migration warning:', error.message);
      }

      console.log('Referral tracking migration completed');
    } catch (error) {
      console.error('Error in referral tracking migration:', error);
      throw error;
    }
  }
};

// All migrations
export const allMigrations: DatabaseMigration[] = [
  divineMiningUserMigration,
  gameDataTableMigration,
  achievementsTableMigration,
  dailyRewardsTableMigration,
  referralTrackingMigration
];

// Run all migrations
export const runMigrations = async (): Promise<void> => {
  console.log('Starting database migrations...');
  
  for (const migration of allMigrations) {
    try {
      console.log(`Running migration: ${migration.name} - ${migration.description}`);
      await migration.execute();
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      // Continue with other migrations even if one fails
    }
  }
  
  console.log('Database migrations completed');
};

// Database utility functions

// Save game data for a user
export const saveGameData = async (userId: number, gameState: any): Promise<void> => {
  try {
    const { error } = await supabase
      .from('game_data')
      .upsert({
        user_id: userId,
        game_state: gameState,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving game data:', error);
    throw error;
  }
};

// Load game data for a user
export const loadGameData = async (userId: number): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('game_data')
      .select('game_state')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No game data found
      }
      throw error;
    }

    return data?.game_state || null;
  } catch (error) {
    console.error('Error loading game data:', error);
    throw error;
  }
};

// Track achievement unlock
export const unlockAchievement = async (userId: number, achievementId: string, progress: number = 100): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        progress: progress,
        unlocked_at: new Date().toISOString()
      }, { onConflict: 'user_id,achievement_id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
};

// Get user achievements
export const getUserAchievements = async (userId: number): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (error) throw error;

    return data?.map(item => item.achievement_id) || [];
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
};

// Track daily reward claim
export const claimDailyReward = async (
  userId: number, 
  dayNumber: number, 
  rewardAmount: number, 
  rewardType: string = 'points'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('daily_rewards')
      .insert({
        user_id: userId,
        day_number: dayNumber,
        reward_amount: rewardAmount,
        reward_type: rewardType,
        claimed_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error claiming daily reward:', error);
    throw error;
  }
};

// Get user's daily reward history
export const getDailyRewardHistory = async (userId: number): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting daily reward history:', error);
    return [];
  }
};

// Track referral
export const trackReferral = async (referrerId: number, referredId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('referral_tracking')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        referred_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking referral:', error);
    throw error;
  }
};

// Get user's referral statistics
export const getReferralStats = async (userId: number): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;

    const activeReferrals = data?.filter(ref => ref.is_active) || [];
    const totalEarned = activeReferrals.reduce((sum, ref) => sum + (ref.total_earned || 0), 0);

    return {
      totalReferrals: data?.length || 0,
      activeReferrals: activeReferrals.length,
      totalEarned: totalEarned,
      referrals: data || []
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarned: 0,
      referrals: []
    };
  }
};

export default {
  runMigrations,
  saveGameData,
  loadGameData,
  unlockAchievement,
  getUserAchievements,
  claimDailyReward,
  getDailyRewardHistory,
  trackReferral,
  getReferralStats
}; 