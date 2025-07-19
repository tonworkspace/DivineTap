import { useState, useEffect, useCallback, useMemo } from 'react';
import { initData, useSignal } from '@telegram-apps/sdk-react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/lib/supabaseClient';

export interface AuthUser extends User {
  total_earned?: number;
  login_streak: number;
  last_login_date: string;
  has_nft?: boolean;
  referrer_username?: string;
  referrer_rank?: string;
  total_sbt?: number;
  claimed_milestones?: number[];
  photoUrl?: string;
  team_volume: number;
  expected_rank_bonus?: number;
  available_earnings?: number;
  direct_referrals: number;
  referrer?: {
    username: string;
    rank: string;
  };
  stake_date?: string;
  current_stake_date?: string;
  whitelisted_wallet?: string;
  last_deposit_time: string | null;
  last_deposit_date?: string;
  last_daily_reward?: string;
  mining_power?: number; // Add this line
}

// Update validation constants
const EARNINGS_VALIDATION = {
  MAX_DAILY_EARNING: 1000, // Maximum TON per day
  MAX_TOTAL_EARNING: 1000000, // Maximum total TON
  SYNC_INTERVAL: 300000, // Increase to 5 minutes (300000ms)
  RATE_LIMIT_WINDOW: 3600000, // 1 hour window (3600000ms)
  MAX_SYNCS_PER_WINDOW: 12, // Max 12 syncs per hour
};

// Add sync tracking
let lastSyncTime = 0;
let syncCount = 0;
let lastSyncReset = Date.now();

// Update the sync function with better rate limiting
const syncEarnings = async (userId: number, earnings: number): Promise<boolean> => {
  try {
    const now = Date.now();

    // Reset sync count if window has passed
    if (now - lastSyncReset >= EARNINGS_VALIDATION.RATE_LIMIT_WINDOW) {
      syncCount = 0;
      lastSyncReset = now;
    }

    // Check rate limits
    if (
      now - lastSyncTime < EARNINGS_VALIDATION.SYNC_INTERVAL ||
      syncCount >= EARNINGS_VALIDATION.MAX_SYNCS_PER_WINDOW
    ) {
      console.debug('Rate limit reached, skipping sync');
      return false;
    }

    // Update sync tracking
    lastSyncTime = now;
    syncCount++;

    // Get current stake info for validation
    const { data: currentStake } = await supabase
      .from('stakes')
      .select('amount, daily_rate, last_payout')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!currentStake) return false;

    // Calculate maximum possible earnings since last payout
    const timeSinceLastPayout = (now - new Date(currentStake.last_payout).getTime()) / 1000;
    const maxPossibleEarning = (currentStake.amount * currentStake.daily_rate * timeSinceLastPayout) / 86400;

    // Validate earnings amount
    const validatedEarnings = Math.min(
      earnings,
      maxPossibleEarning,
      EARNINGS_VALIDATION.MAX_DAILY_EARNING
    );

    // Update earnings with validated amount
    const { error } = await supabase
      .from('users')
      .update({ 
        total_earned: validatedEarnings,
        last_sync: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;

  } catch (error) {
    console.error('Sync error:', error);
    return false;
  }
};

// Simplify validation function to only use DB data
const validateAndSyncData = async (userId: number) => {
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('total_earned, last_sync, stake:stakes(amount, daily_rate)')
      .eq('id', userId)
      .single();

    if (!dbUser) return 0;

    // Calculate maximum possible earnings based on stake
    const stakeAmount = dbUser.stake?.[0]?.amount || 0;
    const dailyRate = dbUser.stake?.[0]?.daily_rate || 0;
    const maxDailyEarning = stakeAmount * dailyRate;

    const timeSinceLastSync = (new Date().getTime() - new Date(dbUser.last_sync).getTime()) / (1000 * 60 * 60 * 24);
    const maxPossibleEarning = timeSinceLastSync * maxDailyEarning;

    // Use DB value plus maximum possible earnings since last sync
    const validatedEarnings = Math.min(
      dbUser.total_earned + maxPossibleEarning,
      EARNINGS_VALIDATION.MAX_TOTAL_EARNING
    );

    await syncEarnings(userId, validatedEarnings);
    return validatedEarnings;
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const telegramData = useSignal(initData.state);

  // Add sync interval state
  const [, setSyncInterval] = useState<NodeJS.Timeout | null>(null);

  const initializeAuth = useCallback(async () => {
    // Skip if already initialized and user exists
    if (hasInitialized && user) {
      return;
    }

    if (!telegramData?.user) {
      setError('Please open this app in Telegram');
      setIsLoading(false);
      return;
    }

    try {
      const telegramUser = telegramData.user;
      const telegramId = String(telegramUser.id);

      // First attempt to get existing user with total_sbt
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select(`
          *,
          referrer:users(
            username,
            rank
          )
        `)
        .eq('telegram_id', telegramId)
        .single();

      // Better error handling for existing user
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User doesn't exist, proceed with creation
          
          // Generate referral code for new user
          const generateUserReferralCode = (userId: number) => {
            const baseCode = `DIVINE${userId.toString().padStart(6, '0')}`;
            const userIdHash = userId.toString();
            const suffix = userIdHash.split('').reduce((acc, char) => {
              return ((acc << 5) - acc + char.charCodeAt(0)) & 0xFFFF;
            }, 0);
            return `${baseCode}${suffix.toString(36).toUpperCase().padStart(4, '0')}`;
          };
          
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              telegram_id: telegramId,
              username: telegramUser.username || (telegramUser.firstName ? `${telegramUser.firstName}${telegramUser.lastName ? ` ${telegramUser.lastName}` : ''}` : `Miner_${String(telegramId).slice(-4)}`),
              first_name: telegramUser.firstName || null,
              last_name: telegramUser.lastName || null,
              language_code: telegramUser.languageCode || null,
              wallet_address: null,
              balance: 0,
              total_deposit: 0,
              total_withdrawn: 0,
              total_earned: 0,
              total_sbt: 0, // Initialize STK balance
              team_volume: 0,
              direct_referrals: 0,
              rank: 'Novice',
              last_active: new Date().toISOString(),
              login_streak: 0,
              last_login_date: new Date().toISOString(),
              is_active: true,
              last_deposit_time: null,
              last_deposit_date: null
            }])
            .select()
            .maybeSingle();
          
          // After user creation, update with referral code
          if (newUser && !createError) {
            const referralCode = generateUserReferralCode(newUser.id);
            await supabase
              .from('users')
              .update({ referral_code: referralCode })
              .eq('id', newUser.id);
            
            // Add referral code to the user object
            newUser.referral_code = referralCode;
          }

          if (createError) {
            if (createError.code === '23505') { // Unique constraint violation
              // Try fetching the user one more time in case of race condition
              const { data: retryUser, error: retryError } = await supabase
                .from('users')
                .select(`
                  *,
                  referrer:users(
                    username,
                    rank
                  )
                `)
                .eq('telegram_id', telegramId)
                .single();

              if (retryError) {
                throw new Error('Failed to fetch or create user account');
              }
              existingUser = retryUser;
            } else {
              throw new Error(`Failed to create new user: ${createError.message}`);
            }
          } else {
            existingUser = newUser;
          }
        } else {
          throw new Error('Failed to fetch user data');
        }
      }

      // Update last active timestamp and login date
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_active: new Date().toISOString(),
          last_login_date: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      if (updateError) {
        console.error('Failed to update user timestamps:', updateError);
      }

      // Set user state with complete data including total_sbt
      setUser({
        ...existingUser,
        total_sbt: existingUser.total_sbt || 0, // Ensure total_sbt is included
        login_streak: existingUser.login_streak || 0,
        last_login_date: existingUser.last_login_date || new Date().toISOString()
      });

      // Mark as initialized
      setHasInitialized(true);

    } catch (err) {
      console.error('Authentication failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [telegramData, hasInitialized, user]);

  useEffect(() => {
    // Only initialize if not already done
    if (!hasInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, hasInitialized]);

  // Real-time subscription to user changes
  useEffect(() => {
    if (!user?.telegram_id) return;

    const subscription = supabase
      .channel(`public:users:telegram_id=eq.${user.telegram_id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `telegram_id=eq.${user.telegram_id}`
      }, async (payload) => {
        if (payload.new) {
          // Fetch fresh user data with referrer info
          const { data } = await supabase
            .from('users')
            .select(`
              *,
              referrer:users!users_referrer_id_fkey (
                username,
                rank
              )
            `)
            .eq('telegram_id', user.telegram_id)
            .single();

          if (data) {
            const authUser: AuthUser = {
              ...data,
              referrer_username: data.referrer?.username,
              referrer_rank: data.referrer?.rank,
              login_streak: data.login_streak || 0,
              last_login_date: data.last_login_date
            };
            setUser(authUser);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.telegram_id]);

  const updateUserData = useCallback(async (updatedData: Partial<AuthUser>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setDebounceTimer(setTimeout(async () => {
      try {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update(updatedData)
          .eq('telegram_id', user?.telegram_id)
          .select()
          .single();

        if (error) throw error;

        // Only update specific changed fields
        setUser(prev => ({
          ...prev,
          ...updatedUser,
          lastUpdate: new Date().toISOString()
        }));

      } catch (error) {
        console.error('Update failed:', error);
      }
    }, 500)); // 500ms debounce
  }, [user?.telegram_id, debounceTimer]);

  const logout = useCallback(() => {
    console.log('Logging out user:', user?.telegram_id);
    setUser(null);
  }, [user]);

  // Update sync interval
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(async () => {
        const success = await syncEarnings(user.id, currentEarnings);
        if (!success) {
          // Reset to last valid state
          const validatedEarnings = await validateAndSyncData(user.id);
          if (validatedEarnings !== null) {
            setCurrentEarnings(validatedEarnings);
          }
        }
      }, 5 * 60 * 1000);

      setSyncInterval(interval);
      return () => clearInterval(interval);
    }
  }, [user?.id, currentEarnings]);

  // Update validation constants
  const EARNINGS_VALIDATION = {
    MAX_DAILY_EARNING: 1000, // Maximum TON per day
    MAX_TOTAL_EARNING: 1000000, // Maximum total TON
    SYNC_INTERVAL: 300000, // Increase to 5 minutes (300000ms)
    RATE_LIMIT_WINDOW: 3600000, // 1 hour window (3600000ms)
    MAX_SYNCS_PER_WINDOW: 12, // Max 12 syncs per hour
  };

  // Update the useEffect to handle earnings updates more efficiently
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let syncTimeout: NodeJS.Timeout | null = null;

    const handleEarningsUpdate = async () => {
      if (!isMounted) return;

      try {
        const success = await syncEarnings(user.id, currentEarnings);
        
        if (!success && isMounted) {
          // If sync fails, validate and reset to last known good state
          const { data: lastValidState } = await supabase
            .from('users')
            .select('total_earned')
            .eq('id', user.id)
            .single();

          if (lastValidState && isMounted) {
            setCurrentEarnings(lastValidState.total_earned);
          }
        }
      } catch (error) {
        console.error('Error updating earnings:', error);
      }

      // Schedule next sync if component is still mounted
      if (isMounted) {
        syncTimeout = setTimeout(
          handleEarningsUpdate, 
          EARNINGS_VALIDATION.SYNC_INTERVAL
        );
      }
    };

    // Initial sync
    handleEarningsUpdate();

    // Cleanup
    return () => {
      isMounted = false;
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [user?.id, currentEarnings]);

  // Add a function to refresh STK balance
  const refreshSTKBalance = useCallback(async () => {
    if (!user?.telegram_id) return;

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('telegram_id', user.telegram_id)
        .single();

      if (error) throw error;

      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          total_sbt: updatedUser.total_sbt || 0
        };
      });

    } catch (error) {
      console.error('Failed to refresh STK balance:', error);
    }
  }, [user?.telegram_id]);

  return useMemo(() => ({
    user,
    isLoading,
    error,
    updateUserData,
    logout,
    telegramUser: telegramData?.user,
    currentEarnings,
    setCurrentEarnings,
    refreshSTKBalance
  }), [user, isLoading, error, updateUserData, logout, telegramData, currentEarnings, refreshSTKBalance]);
};

// function getPreviousDay(date: string): string {
//   const d = new Date(date);
//   d.setDate(d.getDate() - 1);
//   return d.toISOString().split('T')[0];
// }

export default useAuth;