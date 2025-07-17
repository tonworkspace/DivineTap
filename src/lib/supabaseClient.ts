import { createClient, SupabaseClient } from '@supabase/supabase-js';

// // Supabase initialization
// const supabaseUrl = "https://hxkmknvxicjqkbkfrguc.supabase.co";
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a21rbnZ4aWNqcWtia2ZyZ3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyODAyNDEsImV4cCI6MjA1MTg1NjI0MX0.hW77UDF-v8Q04latr7TktoUC1b-6Qeo64ZSXBvtEFmg";
// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Supabase initialization
const supabaseUrl = "https://nyffqyafaqewddtgcarv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55ZmZxeWFmYXFld2RkdGdjYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjcxMzUsImV4cCI6MjA2NTc0MzEzNX0.3jq9_WbqAl3yrpkI3m6I1P_TQJ55IC5zC6EGz-Y5kFg";
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


// // // Supabase initialization
// const supabaseUrl = "https://nubyccnpqfffihrnbhsm.supabase.co";
// const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YnljY25wcWZmZmlocm5iaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1ODUxNDQsImV4cCI6MjA1NzE2MTE0NH0.POGLxhWVpOuQ3x7fk6rUYcpVgxcBkgAMzD7NQYignck";

// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


// Database Types
export interface User {
  id: number;
  telegram_id: number;
  wallet_address: string;
  username?: string;
  created_at: string;
  balance: number;
  total_deposit: number;
  total_withdrawn: number;
  team_volume: number;
  rank: string;
  last_active: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  last_claim_time?: number;
  total_earned?: number;
  total_sbt?: number;
  is_active: boolean;
  reinvestment_balance?: number;
  available_balance?: number;
  sbt_last_updated?: string;
  last_rank_bonus?: string;
  stake: number;
  last_sbt_claim?: string;
}

export interface Stake {
  id: number;
  user_id: number;
  amount: number;
  start_date: string;
  end_date?: string;
  daily_rate: number;
  total_earned: number;
  is_active: boolean;
  last_payout: string;
  speed_boost_active: boolean;
}

export interface Deposit {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  created_at: string;
  processed_at?: string;
}

export interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  wallet_amount: number;
  redeposit_amount: number;
  sbt_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  transaction_hash?: string;
}

// Utility function to format amounts in USD
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Define rank requirements and rewards
export const RANK_REQUIREMENTS = {
  NOVICE: {
    title: 'Novice',
    minStake: 0,
    minEarnings: 0,
    color: 'gray',
    weeklyBonus: 0
  },
  AMBASSADOR: {
    title: 'Ambassador',
    minStake: 20,
    minEarnings: 100,
    color: 'green',
    weeklyBonus: 5
  },
  WARRIOR: {
    title: 'TON Warrior',
    minStake: 50,
    minEarnings: 500,
    color: 'blue',
    weeklyBonus: 10
  },
  MASTER: {
    title: 'TON Master',
    minStake: 100,
    minEarnings: 2000,
    color: 'purple',
    weeklyBonus: 20
  },
  MOGUL: {
    title: 'Crypto Mogul',
    minStake: 500,
    minEarnings: 10000,
    color: 'yellow',
    weeklyBonus: 50
  }
};

// Function to calculate user's rank
export const calculateUserRank = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select(`
        total_earned,
        balance
      `)
      .eq('id', userId)
      .single();

    if (!user) return 'NOVICE';

    for (const [rank, requirements] of Object.entries(RANK_REQUIREMENTS).reverse()) {
      if (
        user.balance >= requirements.minStake &&
        user.total_earned >= requirements.minEarnings
      ) {
        return rank;
      }
    }

    return 'NOVICE';
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 'NOVICE';
  }
};

// Function to update user's rank
export const updateUserRank = async (userId: number) => {
  try {
    const newRank = await calculateUserRank(userId);
    
    const { error } = await supabase
      .from('users')
      .update({ 
        rank: newRank,
        rank_updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Process weekly rank bonus if eligible
    const rankReq = RANK_REQUIREMENTS[newRank as keyof typeof RANK_REQUIREMENTS];
    if (rankReq.weeklyBonus > 0) {
      await processWeeklyRankBonus(userId, rankReq.weeklyBonus);
    }

    return newRank;
  } catch (error) {
    console.error('Error updating rank:', error);
    return null;
  }
};

// Function to process weekly rank bonus
const processWeeklyRankBonus = async (userId: number, bonusAmount: number) => {
  try {
    // Check if user already received bonus this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastBonus } = await supabase
      .from('rank_bonuses')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())
      .single();

    if (lastBonus) return false; // Already received bonus this week

    // Process bonus
    const { error } = await supabase
      .from('rank_bonuses')
      .insert({
        user_id: userId,
        amount: bonusAmount,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update user's earnings
    await supabase
      .from('users')
      .update({
        available_earnings: supabase.rpc('increment', { amount: bonusAmount }),
        total_earned: supabase.rpc('increment', { amount: bonusAmount })
      })
      .eq('id', userId);

    return true;
  } catch (error) {
    console.error('Error processing rank bonus:', error);
    return false;
  }
};

// Database helper functions
export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      rank: 'Novice', // Force 'Novice' rank for new users
      balance: 0,
      total_deposit: 0,
      total_withdrawn: 0,
      team_volume: 0
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  return data;
};

export const getActiveStakes = async (userId: number): Promise<Stake[]> => {
  const { data, error } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching stakes:', error);
    return [];
  }
  return data || [];
};

export const createStake = async (stakeData: Partial<Stake>): Promise<Stake | null> => {
  const { data, error } = await supabase
    .from('stakes')
    .insert([stakeData])
    .select()
    .single();

  if (error) {
    console.error('Error creating stake:', error);
    return null;
  }
  return data;
};

export const createDeposit = async (depositData: Partial<Deposit>): Promise<Deposit | null> => {
  const { data, error } = await supabase
    .from('deposits')
    .insert([depositData])
    .select()
    .single();

  if (error) {
    console.error('Error creating deposit:', error);
    return null;
  }
  return data;
};

export const createWithdrawal = async (withdrawalData: Partial<Withdrawal>): Promise<Withdrawal | null> => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([withdrawalData])
    .select()
    .single();

  if (error) {
    console.error('Error creating withdrawal:', error);
    return null;
  }
  return data;
};

// Update the updateUserBalance function to consider total earnings
export const updateUserBalance = async (userId: number, amount: number, earnedAmount: number): Promise<boolean> => {
  const { data: user } = await supabase
    .from('users')
    .select('total_earned')
    .eq('id', userId)
    .single();

  const totalEarned = (user?.total_earned || 0) + earnedAmount;
  const newRank = calculateUserRank(totalEarned);
  
  const { error } = await supabase
    .from('users')
    .update({ 
      balance: amount,
      total_earned: totalEarned,
      rank: newRank 
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating balance and rank:', error);
    return false;
  }
  return true;
};

// First, execute the stored procedure creation once in your database
export const setupStoredProcedures = async (userId: number) => {
  // First create referral procedure
  const { error: referralError } = await supabase.rpc('process_referral_v2', {
    p_referrer_id: userId,
    p_referred_id: userId
  });

  // Then create team volume procedures
  const { error: volumeError } = await supabase.rpc('update_team_volumes', {
    p_referrer_ids: [userId],
    p_amount: 0
  });

  return !referralError && !volumeError;
};

// Add constants to match bot backend
export const SPEED_BOOST_MULTIPLIER = 2;
export const FAST_START_BONUS_AMOUNT = 1; // 1 TON
export const FAST_START_REQUIRED_REFERRALS = 2;
export const FAST_START_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


// Update STAKING_CONFIG to include weekly rates
export const STAKING_CONFIG = {
  DAILY_RATES: {
    WEEK1: 0.01, // 1% (days 1-7)
    WEEK2: 0.02, // 2% (days 8-14)
    WEEK3: 0.03, // 3% (days 15-21)
    WEEK4: 0.04  // 4% (days 22+)
  },
  MAX_CYCLE_PERCENTAGE: 300,
  MIN_DEPOSIT: 1, // 1 TON
  FEES: {
    DEPOSIT_STK: 0.05, // 5% to STK
    WITHDRAWAL_STK: 0.10, // 10% to STK
    WITHDRAWAL_GLP: 0.10, // 10% to GLP
    WITHDRAWAL_REINVEST: 0.20 // 20% to reinvestment wallet
  }
};

// Add function to calculate current ROI based on stake duration
export const calculateDailyROI = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) {
    return STAKING_CONFIG.DAILY_RATES.WEEK1;
  } else if (daysDiff <= 14) {
    return STAKING_CONFIG.DAILY_RATES.WEEK2;
  } else if (daysDiff <= 21) {
    return STAKING_CONFIG.DAILY_RATES.WEEK3;
  } else {
    return STAKING_CONFIG.DAILY_RATES.WEEK4;
  }
};

// Update calculateDailyRewards function for more realistic earnings
export const calculateDailyRewards = async (stakeId: number): Promise<number> => {
  const { data: stake } = await supabase
    .from('stakes')
    .select('*, users!inner(*)')
    .eq('id', stakeId)
    .single();

  if (!stake || !stake.is_active) return 0;

  // Check for duplicate payout within last 24 hours
  const lastPayout = new Date(stake.last_payout);
  const now = new Date();
  const hoursSinceLastPayout = (now.getTime() - lastPayout.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastPayout < 24) {
    console.log('Already paid out in last 24 hours');
    return 0;
  }

  // Dynamic ROI based on stake amount and duration
  let baseRate = 0.01; // 1% base daily rate
  
  // Adjust rate based on stake amount (higher stakes get slightly lower rates)
  if (stake.amount >= 10000) baseRate *= 0.8;  // 0.8% for 10k+
  else if (stake.amount >= 5000) baseRate *= 0.85; // 0.85% for 5k+
  else if (stake.amount >= 1000) baseRate *= 0.9;  // 0.9% for 1k+
  
  // Calculate days since stake start
  const startDate = new Date(stake.start_date);
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Gradually decrease rate over time
  const durationMultiplier = Math.max(0.7, 1 - (daysSinceStart / 200)); // Minimum 70% of base rate
  let dailyRate = baseRate * durationMultiplier;

  // Apply rank bonus if applicable
  const rankBonus = getRankBonus(stake.users.rank);
  dailyRate *= (1 + rankBonus);

  // Calculate daily earning with all multipliers
  let dailyEarning = stake.amount * dailyRate;
  
  // Apply speed boost if active
  if (stake.speed_boost_active) {
    dailyEarning *= 1.5; // 50% boost
  }

  // Apply maximum daily earning cap based on stake size
  const maxDailyEarning = Math.min(
    stake.amount * 0.03, // Max 3% per day
    EARNING_LIMITS.daily_roi_max
  );
  
  const cappedEarning = Math.min(dailyEarning, maxDailyEarning);

  // Update stake record
  const { error } = await supabase
    .from('stakes')
    .update({
      total_earned: stake.total_earned + cappedEarning,
      last_payout: now.toISOString(),
      daily_rate: dailyRate,
      cycle_progress: Math.min(((stake.total_earned + cappedEarning) / stake.amount) * 100, 300)
    })
    .eq('id', stakeId);

  if (error) {
    console.error('Error updating stake rewards:', error);
    return 0;
  }

  // Log the earning event
  await supabase.from('earning_history').insert({
    stake_id: stakeId,
    user_id: stake.user_id,
    amount: cappedEarning,
    type: 'daily_roi',
    roi_rate: dailyRate * 100,
    base_rate: baseRate * 100,
    rank_bonus: rankBonus,
    duration_multiplier: durationMultiplier,
    created_at: now.toISOString()
  });

  return cappedEarning;
};

// Add helper function for rank bonuses
const getRankBonus = (rank: string): number => {
  switch (rank) {
    case 'MASTER': return 0.1; // +10%
    case 'CRYPTOMOGUL': return 0.15; // +15%
    case 'TONBARON': return 0.2; // +20%
    case 'TYCOON': return 0.25; // +25%
    case 'TON ELITE': return 0.3; // +30%
    case 'FINAL BOSS': return 0.35; // +35%
    default: return 0;
  }
};

// Add Speed Boost functions
export const checkAndApplySpeedBoost = async (userId: number) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('current_deposit, speed_boost_active')
      .eq('id', userId)
      .single();

    if (!user) return false;

    if (user.speed_boost_active) {
      return {
        success: true,
        boosted_amount: user.current_deposit * SPEED_BOOST_MULTIPLIER,
        message: '🚀 Speed boost active: Earning 2x rewards!'
      };
    }

    return {
      success: false,
      boosted_amount: user.current_deposit,
      message: 'Speed boost not active'
    };
  } catch (error) {
    console.error('Error checking speed boost:', error);
    return false;
  }
};

export const getRewardHistory = async (userId: number) => {
  const { data, error } = await supabase
    .from('reward_history')
    .select(`
      *,
      stake:stakes (
        amount,
        daily_rate
      )
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to load reward history:', error);
    throw error;
  }

  return data;
};

export const getGlobalPoolRankings = async (period: string = 'daily') => {
  const { data, error } = await supabase
    .from('global_pool_rankings')
    .select(`
      *,
      user:users (
        username,
        wallet_address
      )
    `)
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching pool data:', error);
    throw error;
  }

  return data;
};

export const getReferralsByPlayer = async (userId: number) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referred_id(username)
      `)
      .eq('referrer_id', userId);

    if (error) throw error;

    return data?.map(referral => ({
      referred_id: referral.referred_id,
      referred_username: referral.referred?.username || 'Anonymous User'
    })) || [];

  } catch (error) {
    console.error('Error fetching referrals:', error);
    throw error;
  }
};

// Add error tracking and recovery system
export const errorRecovery = {
  async retryTransaction(fn: () => Promise<any>, maxRetries = 3) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  },

  async monitorUserActivity(userId: string) {
    return supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        timestamp: new Date().toISOString(),
        action_type: 'system_check',
        status: 'monitoring'
      });
  }
};

export const updateUserSBT = async (userId: number, amount: number, type: 'deposit' | 'referral' | 'stake') => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        total_sbt: supabase.rpc('increment_sbt', { user_id: userId, amount: amount })
      })
      .eq('id', userId)
      .select('total_sbt')
      .single();

    if (error) throw error;

    // Log SBT earning
    await supabase.from('sbt_history').insert({
      user_id: userId,
      amount: amount,
      type: type,
      timestamp: new Date().toISOString()
    });

    return user?.total_sbt;
  } catch (error) {
    console.error('Error updating SBT:', error);
    return null;
  }
};

export const logEarningEvent = async (
  userId: number,
  type: 'roi' | 'referral' | 'bonus',
  amount: number,
  metadata: any
) => {
  await supabase.from('earning_logs').insert({
    user_id: userId,
    type,
    amount,
    metadata,
    timestamp: new Date().toISOString()
  });
};

export const EARNING_LIMITS = {
  daily_roi_max: 1000,
  referral_commission_max: 500,
  speed_boost_duration: 24 * 60 * 60 * 1000, // 24 hours
  minimum_withdrawal: 1
};

export const reconcileEarnings = async (userId: number) => {
  const { data: earnings } = await supabase
    .from('earning_logs')
    .select('amount')
    .eq('user_id', userId);

  const calculatedTotal = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const { data: user } = await supabase
    .from('users')
    .select('total_earned')
    .eq('id', userId)
    .single();

  if (user && Math.abs(calculatedTotal - user.total_earned) > 0.000001) {
    // Log discrepancy and correct
    await supabase.from('earning_discrepancies').insert({
      user_id: userId,
      calculated: calculatedTotal,
      recorded: user.total_earned,
      timestamp: new Date().toISOString()
    });
  }
};

export const processEarnings = async (
  userId: number, 
  stakeId: number, 
  amount: number,
  type: 'roi' | 'referral' | 'bonus' = 'roi'
) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Get current stake info
    const { data: stake } = await supabase
      .from('stakes')
      .select('amount, total_earned')
      .eq('id', stakeId)
      .single();

    if (!stake) return false;

    // Calculate new cycle progress
    const newTotalEarned = stake.total_earned + amount;
    const cycleProgress = (newTotalEarned / stake.amount) * 100;

    // Check if cycle completion (300%) is reached
    if (cycleProgress >= 300) {
      // Handle cycle completion
      await handleCycleCompletion(userId, stakeId, stake.amount);
      return true;
    }

    // Process normal earnings
    const { error } = await supabase.rpc('process_earnings', {
      p_amount: amount,
      p_stake_id: stakeId,
      p_timestamp: timestamp,
      p_user_id: userId,
      p_type: type
    });

    if (error) throw error;

    // Update cycle progress
    await supabase
      .from('stakes')
      .update({ 
        cycle_progress: cycleProgress,
        total_earned: newTotalEarned
      })
      .eq('id', stakeId);

    // Log the earning event
    await logEarningEvent(userId, type, amount, {
      stakeId,
      timestamp,
      cycleProgress
    });

    return true;
  } catch (error) {
    console.error('Error processing earnings:', error);
    return false;
  }
};

// Add new function to handle cycle completion
const handleCycleCompletion = async (userId: number, stakeId: number, stakeAmount: number) => {
  try {
    // Deactivate current stake
    await supabase
      .from('stakes')
      .update({ 
        is_active: false, 
        cycle_completed: true,
        cycle_completed_at: new Date().toISOString()
      })
      .eq('id', stakeId);

    // Calculate distribution
    const reinvestAmount = stakeAmount * 0.2; // 20% to reinvestment
    const glpAmount = stakeAmount * 0.1; // 10% to GLP
    const stkAmount = stakeAmount * 0.1; // 10% to STK

    // Process distributions
    await Promise.all([
      // Add to reinvestment balance
      supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: reinvestAmount
      }),
      // Add to GLP pool
      supabase.rpc('increment_glp_pool', {
        p_amount: glpAmount
      }),
      // Add STK tokens
      supabase.rpc('increment_sbt', {
        user_id: userId,
        amount: stkAmount
      })
    ]);

    // Log cycle completion
    await supabase.from('cycle_completions').insert({
      user_id: userId,
      stake_id: stakeId,
      stake_amount: stakeAmount,
      reinvest_amount: reinvestAmount,
      glp_amount: glpAmount,
      stk_amount: stkAmount,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling cycle completion:', error);
    throw error;
  }
};

export const gmpSystem = {
  getPoolStats: async () => {
    const { data, error } = await supabase.rpc('get_gmp_stats', {
      withdrawal_fee_percent: 10,
      distribution_percent: 35
    });
    
    if (error) throw error;
    return data;
  },

  getUserPoolShare: async (userId: number) => {
    const { data, error } = await supabase.rpc('calculate_user_glp_share', {
      p_user_id: userId,
      p_team_volume_percent: 2, // Only 2% of team withdrawal volume counts
      p_reset_interval_days: 7  // Reset every 7 days
    });

    if (error) throw error;
    return data;
  }
};

// Add cycle tracking
export const checkAndHandleCycle = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = stake.total_earned / stake.amount * 100;
    if (totalReturn >= 300) {
      // Handle cycle completion
      await supabase.rpc('complete_stake_cycle', { 
        p_stake_id: stake.id,
        p_user_id: userId 
      });
    }
  }
};

// Add these constants for withdrawal fees
const WITHDRAWAL_FEES = {
  GLP: 0.10,  // 10% to Global Leadership Pool
  STK: 0.10,  // 10% to Reputation Points ($STK)
  REINVEST: 0.20  // 20% to re-investment wallet
};

// Add this function to handle withdrawal fee distribution
export const processWithdrawalFees = async (userId: number, amount: number) => {
  try {
    const glpAmount = amount * WITHDRAWAL_FEES.GLP;
    const stkAmount = amount * WITHDRAWAL_FEES.STK;
    const reinvestAmount = amount * WITHDRAWAL_FEES.REINVEST;
    const userAmount = amount - glpAmount - stkAmount - reinvestAmount;

    // Update GLP pool
    await supabase.rpc('increment_glp_pool', {
      p_amount: glpAmount
    });

    // Add STK (Reputation Points) to user
    await supabase.rpc('increment_sbt', {
      user_id: userId,
      amount: stkAmount
    });

    // Add to user's reinvestment wallet
    await supabase.rpc('increment_reinvestment_balance', {
      user_id: userId,
      amount: reinvestAmount
    });

    return {
      success: true,
      userAmount,
      fees: {
        glp: glpAmount,
        stk: stkAmount,
        reinvest: reinvestAmount
      }
    };
  } catch (error) {
    console.error('Error processing withdrawal fees:', error);
    return { success: false };
  }
};

// Update the existing withdrawal function
export const processWithdrawal = async (userId: number, amount: number): Promise<boolean> => {
  try {
    // Validate minimum withdrawal
    if (amount < EARNING_LIMITS.minimum_withdrawal) {
      console.error('Withdrawal amount below minimum');
      return false;
    }

    // Get user's current earnings
    const { data: user } = await supabase
      .from('users')
      .select('available_earnings')
      .eq('id', userId)
      .single();

    if (!user || user.available_earnings < amount) {
      console.error('Insufficient available earnings');
      return false;
    }

    // Process fees and get final user amount
    const feeResult = await processWithdrawalFees(userId, amount);
    if (!feeResult.success) return false;

    // Begin transaction
    const { error } = await supabase.rpc('process_withdrawal', {
      p_user_id: userId,
      p_amount: amount,
      p_user_amount: feeResult.userAmount,
      p_glp_amount: feeResult?.fees?.glp ?? 0,
      p_stk_amount: feeResult?.fees?.stk ?? 0,
      p_reinvest_amount: feeResult?.fees?.reinvest ?? 0
    });

    if (error) throw error;

    // Log the withdrawal
    await supabase.from('withdrawals').insert({
      user_id: userId,
      amount: amount,
      user_amount: feeResult.userAmount,
      glp_fee: feeResult?.fees?.glp ?? 0,
      stk_fee: feeResult?.fees?.stk ?? 0,
      reinvest_amount: feeResult?.fees?.reinvest ?? 0,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return false;
  }
};

// Add this function to handle 300% cycle completion
export const checkCycleCompletion = async (userId: number) => {
  const { data: stakes } = await supabase
    .from('stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  for (const stake of stakes || []) {
    const totalReturn = (stake.total_earned / stake.amount) * 100;
    if (totalReturn >= 300) {
      // Deactivate stake and notify user
      await supabase
        .from('stakes')
        .update({ is_active: false, cycle_completed: true })
        .eq('id', stake.id);
        
      // Add to reinvestment balance
      await supabase.rpc('increment_reinvestment_balance', {
        user_id: userId,
        amount: stake.amount * 0.2 // 20% to reinvestment
      });
    }
  }
};

export const distributeGLPRewards = async () => {
  try {
    const { data: poolData } = await supabase
      .from('global_pool')
      .select('amount')
      .single();
    
    if (!poolData?.amount || poolData.amount === 0) {
      console.log('No rewards to distribute');
      return;
    }

    // Get qualified participants based on stake and earnings
    const { data: participants } = await supabase
      .from('users')
      .select(`
        id,
        team_volume,
        withdrawal_volume:withdrawals(sum)
      `)
      .gte('balance', 100); // Minimum 100 TON staked

    if (!participants?.length) {
      console.log('No qualified participants');
      return;
    }

    // Calculate points for each participant
    const participantPoints = participants.map(p => ({
      user_id: p.id,
      team_volume: p.team_volume,
      points: calculateGLPPoints(
        p.team_volume, 
        p.withdrawal_volume?.[0]?.sum || 0
      )
    }));

    // Calculate total points
    const totalPoints = participantPoints.reduce((sum, p) => sum + p.points, 0);
    
    // Distribute rewards
    const distributions = participantPoints.map(p => ({
      user_id: p.user_id,
      amount: (p.points / totalPoints) * poolData.amount,
      points: p.points,
      distribution_date: new Date().toISOString()
    }));

    // Process distributions in a transaction
    const { error } = await supabase.rpc('process_glp_distribution', {
      p_distributions: distributions,
      p_pool_amount: poolData.amount
    });

    if (error) throw error;

    // Log distribution
    await supabase.from('glp_distribution_history').insert(
      distributions.map(d => ({
        ...d,
        total_pool_amount: poolData.amount,
        total_participants: participants.length
      }))
    );

    return {
      success: true,
      distributed_amount: poolData.amount,
      participant_count: participants.length
    };

  } catch (error) {
    console.error('Error distributing GLP rewards:', error);
    return {
      success: false,
      error: 'Failed to distribute GLP rewards'
    };
  }
};

// Helper function to calculate GLP points
const calculateGLPPoints = (
  teamVolume: number,
  withdrawalVolume: number
): number => {
  // Points from team volume (1 point per 1000 TON)
  const volumePoints = Math.floor(teamVolume / 1000);
  
  // Points from withdrawal volume (2% consideration)
  const withdrawalPoints = Math.floor((withdrawalVolume * 0.02) / 100);
  
  // Bonus points for high team volume
  let bonusPoints = 0;
  if (teamVolume >= 10000) bonusPoints += 20;
  if (teamVolume >= 50000) bonusPoints += 50;
  if (teamVolume >= 100000) bonusPoints += 100;
  
  return volumePoints + withdrawalPoints + bonusPoints;
};

// Add mining-related functions
export const miningSystem = {
  startMining: async (userId: number, amount: number) => {
    try {
      // Check if user has enough balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!user || user.total_sbt < amount) {
        return { success: false, error: 'Insufficient SBT balance' };
      }

      // Check for existing active mining
      const { data: existingMining, error: checkError } = await supabase
        .from('mining_deposits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: checkError.message };
      }

      if (existingMining) {
        return { success: false, error: 'You already have an active mining deposit' };
      }

      // Start mining transaction
      const { error: depositError } = await supabase
        .from('mining_deposits')
        .insert({
          user_id: userId,
          amount: amount,
          status: 'active',
          started_at: new Date().toISOString()
        });

      if (depositError) {
        return { success: false, error: depositError.message };
      }

      // Update user's balance and mining power
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          total_sbt: user.total_sbt - amount,
          mining_power: amount
        })
        .eq('id', userId);

      if (updateError) {
        // Rollback mining deposit if user update fails
        await supabase
          .from('mining_deposits')
          .delete()
          .eq('user_id', userId)
          .eq('status', 'active');
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Mining error:', error);
      return { success: false, error: error.message || 'Failed to start mining' };
    }
  },

  getMiningStats: async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('mining_deposits')
        .select(`
          *,
          user:users!inner(
            total_sbt,
            mining_power
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching mining stats:', error);
      return null;
    }
  },

  calculateRewards: (amount: number, timeElapsed: number) => {
    const dailyRate = 0.01; // 1% daily
    const daysElapsed = timeElapsed / (24 * 60 * 60 * 1000);
    return Math.floor(amount * dailyRate * daysElapsed);
  }
};

export const getDivinePointsLeaderboard = async (limit: number = 100) => {
  try {
    console.log('Fetching divine points leaderboard...');
    console.log('Using limit:', limit);
    
    const { data, error } = await supabase
      .from('user_game_data')
      .select(`
        user_id,
        game_data,
        last_updated,
        users (
          id,
          telegram_id,
          username,
          first_name,
          last_name,
          created_at,
          last_active
        )
      `)
      // Removed the .not('game_data->divine_points', 'is', null) filter
      .order('game_data->divinePoints', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Raw database response:', data);
    console.log('Raw database response length:', data?.length);
    console.log('First entry:', data?.[0]);
    console.log('First entry users:', data?.[0]?.users);

    const mappedData = data?.map((entry, index) => {
      // Handle different possible user data structures
      const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      
      // Generate a better username fallback
      let username = userData?.username;
      if (!username || username.trim() === '') {
        // Try to use first name + last name
        if (userData?.first_name && userData?.last_name) {
          username = `${userData.first_name} ${userData.last_name}`;
        } else if (userData?.first_name) {
          username = userData.first_name;
        } else if (userData?.last_name) {
          username = userData.last_name;
        } else {
          // Generate a cool mining-themed username
          const miningNames = [
            'DivineMiner', 'CosmicHarvester', 'QuantumDigger', 'CrystalSeeker', 
            'MysticProspector', 'EtherealMiner', 'AstralDigger', 'CelestialHarvester',
            'SpiritualMiner', 'TranscendentDigger', 'EnlightenedProspector', 'SacredMiner'
          ];
          const randomIndex = (userData?.telegram_id || entry.user_id) % miningNames.length;
          const suffix = userData?.telegram_id ? String(userData.telegram_id).slice(-3) : String(entry.user_id).slice(-3);
          username = `${miningNames[randomIndex]}_${suffix}`;
        }
      }
      
      const mappedEntry = {
        rank: index + 1,
        userId: entry.user_id,
        telegramId: userData?.telegram_id || 0,
        username: username,
        firstName: userData?.first_name,
        lastName: userData?.last_name,
        divinePoints: Number(entry.game_data?.divinePoints) || 0,
        totalPointsEarned: Number(entry.game_data?.totalPointsEarned) || 0,
        pointsPerSecond: Number(entry.game_data?.pointsPerSecond) || 0,
        highScore: Number(entry.game_data?.highScore) || 0,
        allTimeHighScore: Number(entry.game_data?.allTimeHighScore) || 0,
        upgradesPurchased: Number(entry.game_data?.upgradesPurchased) || 0,
        lastActive: userData?.last_active || new Date().toISOString(),
        joinedAt: userData?.created_at || new Date().toISOString(),
        lastUpdated: entry.last_updated
      };
      
      console.log(`Mapped entry ${index + 1}:`, mappedEntry);
      return mappedEntry;
    }) || [];
    
    console.log('Final mapped leaderboard data:', mappedData);
    console.log('Final mapped data length:', mappedData.length);
    
    return mappedData;
  } catch (error) {
    console.error('Error fetching divine points leaderboard:', error);
    return [];
  }
};

export const getDivinePointsLeaderboardByPeriod = async (
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  limit: number = 100
) => {
  try {
    let query = supabase
      .from('user_game_data')
      .select(`
        user_id,
        game_data,
        last_updated,
        users (
          id,
          telegram_id,
          username,
          first_name,
          last_name,
          created_at,
          last_active
        )
      `)
      .not('game_data->divinePoints', 'is', null);

    // Add time filter based on period
    const now = new Date();
    switch (period) {
      case 'daily':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        query = query.gte('last_updated', yesterday.toISOString());
        break;
      case 'weekly':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('last_updated', lastWeek.toISOString());
        break;
      case 'monthly':
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('last_updated', lastMonth.toISOString());
        break;
      // 'all_time' doesn't need additional filtering
    }

    const { data, error } = await query
      .order('game_data->divinePoints', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map((entry, index) => {
      // Handle different possible user data structures
      const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      
      // Generate a better username fallback
      let username = userData?.username;
      if (!username || username.trim() === '') {
        // Try to use first name + last name
        if (userData?.first_name && userData?.last_name) {
          username = `${userData.first_name} ${userData.last_name}`;
        } else if (userData?.first_name) {
          username = userData.first_name;
        } else if (userData?.last_name) {
          username = userData.last_name;
        } else {
          // Generate a cool mining-themed username
          const miningNames = [
            'DivineMiner', 'CosmicHarvester', 'QuantumDigger', 'CrystalSeeker', 
            'MysticProspector', 'EtherealMiner', 'AstralDigger', 'CelestialHarvester',
            'SpiritualMiner', 'TranscendentDigger', 'EnlightenedProspector', 'SacredMiner'
          ];
          const randomIndex = (userData?.telegram_id || entry.user_id) % miningNames.length;
          const suffix = userData?.telegram_id ? String(userData.telegram_id).slice(-3) : String(entry.user_id).slice(-3);
          username = `${miningNames[randomIndex]}_${suffix}`;
        }
      }
      
      return {
        rank: index + 1,
        userId: entry.user_id,
        telegramId: userData?.telegram_id || 0,
        username: username,
        firstName: userData?.first_name,
        lastName: userData?.last_name,
        divinePoints: Number(entry.game_data?.divinePoints) || 0,
        totalPointsEarned: Number(entry.game_data?.totalPointsEarned) || 0,
        pointsPerSecond: Number(entry.game_data?.pointsPerSecond) || 0,
        highScore: Number(entry.game_data?.highScore) || 0,
        allTimeHighScore: Number(entry.game_data?.allTimeHighScore) || 0,
        upgradesPurchased: Number(entry.game_data?.upgradesPurchased) || 0,
        lastActive: userData?.last_active || new Date().toISOString(),
        joinedAt: userData?.created_at || new Date().toISOString(),
        lastUpdated: entry.last_updated,
        period
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching divine points leaderboard by period:', error);
    return [];
  }
};

export const getUserDivinePointsRank = async (userId: number) => {
  try {
    // First get the user's divine points
    const { data: userData, error: userError } = await supabase
      .from('user_game_data')
      .select('game_data->divinePoints')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return null;
    }

    const userDivinePoints = userData.divinePoints || 0;

    // Count how many users have more divine points
    const { count, error: countError } = await supabase
      .from('user_game_data')
      .select('*', { count: 'exact', head: true })
      .gt('game_data->divinePoints', userDivinePoints);

    if (countError) throw countError;

    return (count || 0) + 1; // Rank is count + 1
  } catch (error) {
    console.error('Error getting user divine points rank:', error);
    return null;
  }
};

// Function to update generic usernames to better ones
export const updateGenericUsernames = async () => {
  try {
    // Get all users with generic usernames
    const { data: users, error } = await supabase
      .from('users')
      .select('id, telegram_id, username, first_name, last_name')
      .or('username.like.user_%,username.like.User%');

    if (error) throw error;

    if (!users || users.length === 0) {
      console.log('No generic usernames found to update');
      return;
    }

    console.log(`Found ${users.length} users with generic usernames`);

    // Update each user with a better username
    for (const user of users) {
      let newUsername = user.username;

      // Try to use first name + last name
      if (user.first_name && user.last_name) {
        newUsername = `${user.first_name} ${user.last_name}`;
      } else if (user.first_name) {
        newUsername = user.first_name;
      } else if (user.last_name) {
        newUsername = user.last_name;
      } else {
        // Generate a cool mining-themed username
        const miningNames = [
          'DivineMiner', 'CosmicHarvester', 'QuantumDigger', 'CrystalSeeker', 
          'MysticProspector', 'EtherealMiner', 'AstralDigger', 'CelestialHarvester',
          'SpiritualMiner', 'TranscendentDigger', 'EnlightenedProspector', 'SacredMiner'
        ];
        const randomIndex = user.telegram_id % miningNames.length;
        const suffix = String(user.telegram_id).slice(-3);
        newUsername = `${miningNames[randomIndex]}_${suffix}`;
      }

      // Update the user's username
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Failed to update username for user ${user.id}:`, updateError);
      } else {
        console.log(`Updated user ${user.id} username from "${user.username}" to "${newUsername}"`);
      }
    }

    console.log('Username update process completed');
  } catch (error) {
    console.error('Error updating generic usernames:', error);
  }
};

export const getDivinePointsStats = async () => {
  try {
    console.log('Fetching divine points stats...');
    
    const { data, error } = await supabase
      .from('user_game_data')
      .select('game_data->divinePoints, game_data->totalPointsEarned');

    if (error) {
      console.error('Supabase error in getDivinePointsStats:', error);
      throw error;
    }

    console.log('Raw stats data:', data);
    console.log('Raw stats data length:', data?.length);

    if (!data || data.length === 0) {
      console.log('No data found in user_game_data table');
      return {
        totalPlayers: 0,
        totalDivinePoints: 0,
        averageDivinePoints: 0,
        maxDivinePoints: 0,
        totalPointsEarned: 0
      };
    }

    const divinePoints = data.map(entry => Number(entry.divinePoints) || 0);
    const totalPointsEarned = data.map(entry => Number(entry.totalPointsEarned) || 0);

    const stats = {
      totalPlayers: data.length,
      totalDivinePoints: divinePoints.reduce((sum, points) => sum + points, 0),
      averageDivinePoints: divinePoints.reduce((sum, points) => sum + points, 0) / data.length,
      maxDivinePoints: Math.max(...divinePoints),
      totalPointsEarned: totalPointsEarned.reduce((sum, points) => sum + points, 0)
    };

    console.log('Calculated stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting divine points stats:', error);
    return {
      totalPlayers: 0,
      totalDivinePoints: 0,
      averageDivinePoints: 0,
      maxDivinePoints: 0,
      totalPointsEarned: 0
    };
  }
};
