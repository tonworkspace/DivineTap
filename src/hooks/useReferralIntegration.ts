import { useState, useEffect, useCallback } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface ReferralData {
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  rewards: {
    points: number;
    gems: number;
    special: string[];
  };
  referrals: ReferralUser[];
  level: number;
  nextLevelReward: string;
  // Enhanced features
  referralAttempts: ReferralAttempt[];
  analytics: ReferralAnalytics;
}

interface ReferralAttempt {
  id: string;
  timestamp: number;
  code: string;
  status: 'success' | 'failed' | 'invalid' | 'duplicate' | 'self_referral';
  reason?: string;
  referrer_username?: string;
}

interface ReferralAnalytics {
  totalAttempts: number;
  successfulReferrals: number;
  failedAttempts: number;
  conversionRate: number;
  topReferralSources: Array<{username: string, count: number}>;
  referralsByDay: Array<{date: string, count: number}>;
}

interface ReferralUser {
  id: string;
  username: string;
  joinedAt: number;
  isActive: boolean;
  pointsEarned: number;
  avatar: string;
  telegram_id?: number;
  rank?: string;
  total_earned?: number;
}

interface DatabaseReferral {
  id: number;
  referrer_id: number;
  referred_id: number;
  created_at: string;
  referred: {
    id: number;
    username: string;
    telegram_id: number;
    total_earned: number;
    rank: string;
    is_active: boolean;
    created_at: string;
  };
}

export const useReferralIntegration = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralData, setReferralData] = useState<ReferralData>({
    code: '',
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
    rewards: { points: 0, gems: 0, special: [] },
    referrals: [],
    level: 1,
    nextLevelReward: '',
    referralAttempts: [],
    analytics: {
      totalAttempts: 0,
      successfulReferrals: 0,
      failedAttempts: 0,
      conversionRate: 0,
      topReferralSources: [],
      referralsByDay: []
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    startParam: string | null;
    referredBy: string | null;
    processed: boolean;
    error: string | null;
    lastAttempt?: ReferralAttempt;
  }>({
    startParam: null,
    referredBy: null,
    processed: false,
    error: null
  });

  // Enhanced referral attempt tracking
  const trackReferralAttempt = useCallback(async (
    code: string, 
    status: ReferralAttempt['status'], 
    reason?: string,
    referrer_username?: string
  ) => {
    const attempt: ReferralAttempt = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      code,
      status,
      reason,
      referrer_username
    };

    // Save to localStorage for persistence
    const userId = user?.id ? user.id.toString() : 'unknown';
    const attemptsKey = `referral_attempts_${userId}`;
    const existingAttempts = localStorage.getItem(attemptsKey);
    const attempts = existingAttempts ? JSON.parse(existingAttempts) : [];
    attempts.push(attempt);
    
    // Keep only last 50 attempts
    if (attempts.length > 50) {
      attempts.splice(0, attempts.length - 50);
    }
    
    localStorage.setItem(attemptsKey, JSON.stringify(attempts));

    // Update debug info
    setDebugInfo(prev => ({ ...prev, lastAttempt: attempt }));

    // Also save to database for analytics (if tables exist)
    if (user?.id) {
      try {
        // Using a generic table insert that may or may not exist
        await supabase.from('referral_attempts').insert({
          user_id: user.id,
          referral_code: code,
          status,
          reason,
          referrer_username,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.debug('Referral attempt logging failed (table may not exist):', error);
      }
    }

    return attempt;
  }, [user?.id]);

  // Enhanced code validation
  const validateReferralCode = useCallback((code: string): { isValid: boolean; error?: string } => {
    if (!code || code.length === 0) {
      return { isValid: false, error: 'Referral code is required' };
    }

    // Check format
    const startParamRegex = /^DIVINE\d{6}[A-Z0-9]{4}$/i;
    if (!startParamRegex.test(code)) {
      return { isValid: false, error: 'Invalid referral code format' };
    }

    // Extract referrer ID
    const referrerIdMatch = code.match(/DIVINE(\d{6})/i);
    if (!referrerIdMatch) {
      return { isValid: false, error: 'Could not extract referrer ID' };
    }

    const referrerId = parseInt(referrerIdMatch[1]);
    
    // Check self-referral
    if (referrerId === user?.id) {
      return { isValid: false, error: 'Cannot refer yourself' };
    }

    return { isValid: true };
  }, [user?.id]);

  // Test referral code validity
  const testReferralCode = useCallback(async (code: string) => {
    const validation = validateReferralCode(code);
    
    if (!validation.isValid) {
      await trackReferralAttempt(code, 'invalid', validation.error);
      return { success: false, error: validation.error };
    }

    // Check if referrer exists
    const referrerIdMatch = code.match(/DIVINE(\d{6})/i);
    const referrerId = parseInt(referrerIdMatch![1]);

    try {
      const { data: referrer, error } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .eq('id', referrerId)
        .single();

      if (error || !referrer) {
        await trackReferralAttempt(code, 'failed', 'Referrer not found');
        return { success: false, error: 'Referrer not found' };
      }

      await trackReferralAttempt(code, 'success', 'Code is valid', referrer.username);
      return { success: true, referrer: referrer.username };
    } catch (error) {
      await trackReferralAttempt(code, 'failed', 'Database error');
      return { success: false, error: 'Failed to validate code' };
    }
  }, [validateReferralCode, trackReferralAttempt]);

  // Generate a static referral code based on user ID (never changes)
  const generateReferralCode = useCallback((userId: number) => {
    if (!userId) return '';
    
    // Create a static code based on user ID only - no timestamp
    // This ensures the code is always the same for each user
    const baseCode = `DIVINE${userId.toString().padStart(6, '0')}`;
    
    // Create a deterministic suffix based on user ID for uniqueness
    // This will always be the same for the same user
    const userIdHash = userId.toString();
    const suffix = userIdHash.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xFFFF;
    }, 0);
    
    const code = `${baseCode}${suffix.toString(36).toUpperCase().padStart(4, '0')}`;
    
    return code;
  }, []);

  // Load or create referral code from database
  const loadReferralCode = useCallback(async () => {
    if (!user?.id) return '';

    try {
      // First, try to get existing referral code from database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching referral code:', fetchError);
        return '';
      }

      // If user already has a referral code, use it
      if (userData.referral_code) {
        setReferralCode(userData.referral_code);
        return userData.referral_code;
      }

      // If no referral code exists, generate one and save it
      const newCode = generateReferralCode(user.id);
      
      // Save the new code to the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving referral code:', updateError);
        // Still use the generated code even if saving fails
      }

      setReferralCode(newCode);
      return newCode;

    } catch (error) {
      console.error('Error loading referral code:', error);
      // Fallback to generating code without saving
      const fallbackCode = generateReferralCode(user.id);
      setReferralCode(fallbackCode);
      return fallbackCode;
    }
  }, [user?.id, generateReferralCode]);

  // Load referral data from database
  const loadReferralData = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Loading referral data for user:', user.id);
      
      // Get user's referrals from database
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:users!referred_id(
            id,
            username,
            telegram_id,
            total_earned,
            rank,
            is_active,
            created_at
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error loading referrals:', referralsError);
        return;
      }

      console.log('Loaded referrals:', referrals?.length || 0);

      // Get referral earnings
      const { data: earnings, error: earningsError } = await supabase
        .from('referral_earnings')
        .select('amount')
        .eq('user_id', user.id);

      if (earningsError) {
        console.error('Error loading referral earnings:', earningsError);
      }

      const totalEarned = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalReferrals = referrals?.length || 0;
      const activeReferrals = referrals?.filter(r => r.referred?.is_active).length || 0;

      // Convert database referrals to display format
      const referralUsers: ReferralUser[] = (referrals as DatabaseReferral[])?.map(r => ({
        id: r.referred.id.toString(),
        username: r.referred.username || `User_${r.referred.telegram_id}`,
        joinedAt: new Date(r.created_at).getTime(),
        isActive: r.referred.is_active,
        pointsEarned: Math.floor(Number(r.referred.total_earned) * 100), // Convert to points
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.referred.username}`,
        telegram_id: r.referred.telegram_id,
        rank: r.referred.rank,
        total_earned: Number(r.referred.total_earned)
      })) || [];

      // Calculate level based on referrals
      const level = Math.floor(totalReferrals / 5) + 1;

      setReferralData(prev => ({
        ...prev,
        code: referralCode || prev.code, // Use existing code if referralCode is not set yet
        totalReferrals,
        activeReferrals,
        totalEarned,
        rewards: { 
          points: Math.floor(totalEarned * 100), 
          gems: Math.floor(totalEarned * 10), 
          special: [] 
        },
        referrals: referralUsers,
        level,
        nextLevelReward: `Level ${level + 1} Reward`
      }));

    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  }, [user?.id, referralCode]);

  // Process Telegram start parameter for referral tracking
  const processStartParameter = useCallback(async () => {
    if (!user?.id || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const launchParams = retrieveLaunchParams();
      const startParam = launchParams.startParam;
      
      console.log('Processing start parameter:', startParam);
      
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        startParam: startParam ?? null,
        processed: false,
        error: null
      }));
      
      // Check if start parameter exists and is valid
      if (!startParam || startParam.length === 0) {
        console.log('No start parameter found');
        setDebugInfo(prev => ({ ...prev, processed: true }));
        return;
      }
      
      // Enhanced validation
      const validation = validateReferralCode(startParam);
      if (!validation.isValid) {
        console.log('Invalid start parameter:', validation.error);
        await trackReferralAttempt(startParam, 'invalid', validation.error);
        setDebugInfo(prev => ({ ...prev, error: validation.error || 'Invalid code', processed: true }));
        return;
      }
      
      // Extract referrer ID from start parameter
      const referrerIdMatch = startParam.match(/DIVINE(\d{6})/i);
      const referrerId = parseInt(referrerIdMatch![1]);
      
      // Check if user already has a referrer
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('referrer_id')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error checking existing user:', userError);
        await trackReferralAttempt(startParam, 'failed', 'Database error');
        setDebugInfo(prev => ({ ...prev, error: 'Database error', processed: true }));
        return;
      }
      
      if (existingUser?.referrer_id) {
        console.log('User already has a referrer:', existingUser.referrer_id);
        await trackReferralAttempt(startParam, 'duplicate', 'Already has referrer');
        setDebugInfo(prev => ({ ...prev, error: 'Already has referrer', processed: true }));
        return;
      }
      
      // Check if referrer exists
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .eq('id', referrerId)
        .single();
      
      if (referrerError || !referrer) {
        console.log('Referrer not found:', referrerId);
        await trackReferralAttempt(startParam, 'failed', 'Referrer not found');
        setDebugInfo(prev => ({ ...prev, error: 'Referrer not found', processed: true }));
        return;
      }
      
      console.log('Valid referrer found:', referrer.username);
      
      // Create referral relationship
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: user.id
        });
      
      if (referralError) {
        console.error('Error creating referral:', referralError);
        setDebugInfo(prev => ({ ...prev, error: 'Failed to create referral', processed: true }));
        return;
      }
      
      // Update user's referrer_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ referrer_id: referrerId })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating user referrer:', updateError);
        setDebugInfo(prev => ({ ...prev, error: 'Failed to update user', processed: true }));
        return;
      }
      
      // Update referrer's direct_referrals count
      const { error: countError } = await supabase
        .rpc('increment_direct_referrals', { user_id: referrerId });
      
      if (countError) {
        console.error('Error updating referrer count:', countError);
      }
      
      // Give welcome bonus to new user
      const welcomeBonus = 1000;
      const { error: bonusError } = await supabase
        .from('referral_earnings')
        .insert({
          user_id: user.id,
          referral_id: user.id,
          amount: welcomeBonus,
          level: 0
        });
      
      if (bonusError) {
        console.error('Error giving welcome bonus:', bonusError);
      }
      
      // Give referral bonus to referrer
      const referralBonus = 500;
      const { error: referrerBonusError } = await supabase
        .from('referral_earnings')
        .insert({
          user_id: referrerId,
          referral_id: user.id,
          amount: referralBonus,
          level: 1
        });
      
      if (referrerBonusError) {
        console.error('Error giving referrer bonus:', referrerBonusError);
      }
      
      console.log('Referral processed successfully!');
      await trackReferralAttempt(startParam, 'success', 'Referral processed successfully', referrer.username);
      setDebugInfo(prev => ({ 
        ...prev, 
        referredBy: referrer.username, 
        processed: true 
      }));
      
      // Reload referral data
      await loadReferralData();
      
    } catch (error) {
      console.error('Error processing start parameter:', error);
      await trackReferralAttempt(
        retrieveLaunchParams().startParam || 'unknown', 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        processed: true 
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, isProcessing, loadReferralData, validateReferralCode, trackReferralAttempt]);

  // Check if user was referred by someone using Telegram start parameter
  const checkReferral = useCallback(() => {
    if (user?.id && !isProcessing) {
      processStartParameter();
    }
  }, [user?.id, processStartParameter, isProcessing]);

  // Generate Telegram referral link
  const generateTelegramReferralLink = useCallback((code?: string) => {
    const codeToUse = code || referralCode;
    if (!codeToUse) return '';
    return `https://t.me/DivineTaps_bot/mine?startapp=${codeToUse}`;
  }, [referralCode]);

  // Get referral statistics
  const getReferralStats = useCallback(() => {
    return {
      totalReferrals: referralData.totalReferrals,
      activeReferrals: referralData.activeReferrals,
      totalEarned: referralData.totalEarned,
      level: referralData.level,
      nextLevelRequirement: Math.max(1, referralData.level * 5),
      completionPercentage: (referralData.totalReferrals / Math.max(1, referralData.level * 5)) * 100
    };
  }, [referralData]);



  // Initialize referral system
  useEffect(() => {
    if (user?.id) {
      // Load referral code from database (or generate if needed)
      loadReferralCode();
      
      // Load existing referral data
      loadReferralData();
      
              // Load referral attempts inline
        if (user?.id) {
          const userId = user.id.toString();
          const attemptsKey = `referral_attempts_${userId}`;
          const existingAttempts = localStorage.getItem(attemptsKey);
          
          if (existingAttempts) {
            try {
              const attempts = JSON.parse(existingAttempts);
              setReferralData(prev => ({
                ...prev,
                referralAttempts: attempts.slice(-20) // Show last 20 attempts
              }));
            } catch (error) {
              console.error('Error loading referral attempts from localStorage:', error);
            }
          }
        }
      
      // Process start parameter - Enhanced to always check but prevent duplicate processing
      const processReferralOnce = async () => {
        try {
          const launchParams = retrieveLaunchParams();
          const startParam = launchParams.startParam;
          
          if (!startParam) {
            console.log('No start parameter found - user opened app directly');
            return;
          }
          
          // Check if we've already processed this specific referral code for this user
          const hasProcessedThisCode = localStorage.getItem(`referral_processed_${user.id}_${startParam}`);
          
          if (hasProcessedThisCode) {
            console.log('This referral code has already been processed for this user');
            return;
          }
          
          // Check if user already has a referrer
          const { data: existingUser } = await supabase
            .from('users')
            .select('referrer_id')
            .eq('id', user.id)
            .single();
          
          if (existingUser?.referrer_id) {
            console.log('User already has a referrer, storing attempt for analytics');
            await trackReferralAttempt(startParam, 'duplicate', 'User already has a referrer');
            localStorage.setItem(`referral_processed_${user.id}_${startParam}`, 'true');
            return;
          }
          
          // Process the referral
          console.log('Processing referral for new user:', startParam);
          await processStartParameter();
          
          // Mark this specific code as processed for this user
          localStorage.setItem(`referral_processed_${user.id}_${startParam}`, 'true');
          
          // Show success notification to user
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('referralProcessed', {
              detail: { 
                startParam,
                success: true,
                message: 'Welcome! You\'ve successfully joined through a referral link!'
              }
            }));
          }
          
        } catch (error) {
          console.error('Error in referral processing:', error);
          
          // Show error notification to user
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('referralProcessed', {
              detail: { 
                success: false,
                message: 'There was an issue processing your referral. Please try again.'
              }
            }));
          }
        }
      };
      
      // Always try to process referral, but with proper duplicate prevention
      processReferralOnce();
    }
  }, [user?.id, loadReferralCode, loadReferralData, processStartParameter, trackReferralAttempt]);

  // Create database stored procedure for incrementing referrals
  useEffect(() => {
    const createStoredProcedure = async () => {
      const { error } = await supabase.rpc('create_increment_referrals_function');
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating stored procedure:', error);
      }
    };
    
    createStoredProcedure();
  }, []);

  // Load referral attempts from localStorage
  const loadReferralAttempts = useCallback(() => {
    if (!user?.id) return;

    const userId = user.id.toString();
    const attemptsKey = `referral_attempts_${userId}`;
    const existingAttempts = localStorage.getItem(attemptsKey);
    
    if (existingAttempts) {
      try {
        const attempts = JSON.parse(existingAttempts);
        setReferralData(prev => ({
          ...prev,
          referralAttempts: attempts.slice(-20) // Show last 20 attempts
        }));
      } catch (error) {
        console.error('Error loading referral attempts from localStorage:', error);
      }
    }
  }, [user?.id]);

  // Clear referral history
  const clearReferralHistory = useCallback(() => {
    if (!user?.id) return;
    
    const userId = user.id.toString();
    const attemptsKey = `referral_attempts_${userId}`;
    localStorage.removeItem(attemptsKey);
    
    setReferralData(prev => ({
      ...prev,
      referralAttempts: []
    }));
  }, [user?.id]);

  // Add this method to the hook to force refresh referral data
  const forceRefreshReferralData = useCallback(async () => {
    console.log('🔄 Force refreshing referral data...');
    
    // Clear any cached data
    setReferralData(prev => ({
      ...prev,
      totalReferrals: 0,
      activeReferrals: 0,
      referrals: []
    }));
    
    // Reload from database
    await loadReferralData();
  }, [loadReferralData]);

  // Process referral code manually (for the ReferralPrompt)
  const processReferralCodeManually = useCallback(async (referralCode: string) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    try {
      // Validate the code
      const validation = validateReferralCode(referralCode);
      if (!validation.isValid) {
        await trackReferralAttempt(referralCode, 'invalid', validation.error);
        return { success: false, error: validation.error };
      }
      
      // Extract referrer ID
      const referrerIdMatch = referralCode.match(/DIVINE(\d{6})/i);
      if (!referrerIdMatch) {
        await trackReferralAttempt(referralCode, 'invalid', 'Invalid code format');
        return { success: false, error: 'Invalid code format' };
      }
      
      const referrerId = parseInt(referrerIdMatch[1]);
      
      // Check if user already has a referrer
      const { data: existingUser } = await supabase
        .from('users')
        .select('referrer_id')
        .eq('id', user.id)
        .single();
      
      if (existingUser?.referrer_id) {
        await trackReferralAttempt(referralCode, 'duplicate', 'User already has a referrer');
        return { success: false, error: 'You already have a referrer' };
      }
      
      // Check if referrer exists
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, username, telegram_id')
        .eq('id', referrerId)
        .single();
      
      if (referrerError || !referrer) {
        await trackReferralAttempt(referralCode, 'failed', 'Referrer not found');
        return { success: false, error: 'Referrer not found' };
      }
      
      // Prevent self-referral
      if (referrer.id === user.id) {
        await trackReferralAttempt(referralCode, 'invalid', 'Cannot refer yourself');
        return { success: false, error: 'Cannot refer yourself' };
      }
      
      // Create referral relationship
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: user.id,
          status: 'active'
        });
      
      if (referralError) {
        console.error('Error creating referral:', referralError);
        await trackReferralAttempt(referralCode, 'failed', 'Failed to create referral relationship');
        return { success: false, error: 'Failed to create referral relationship' };
      }
      
      // Update user's referrer_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ referrer_id: referrerId })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating user referrer:', updateError);
        await trackReferralAttempt(referralCode, 'failed', 'Failed to update user referrer');
        return { success: false, error: 'Failed to update user referrer' };
      }
      
      // Update referrer's direct_referrals count
      try {
        const { error: countError } = await supabase
          .rpc('increment_direct_referrals', { user_id: referrerId });
        
        if (countError) {
          console.error('Error updating referrer count:', countError);
          // Don't fail the whole process for this
        }
      } catch (error) {
        console.error('Error incrementing referrer count:', error);
        // Don't fail the whole process for this
      }
      
      // Track the successful attempt
      await trackReferralAttempt(referralCode, 'success', 'Manual entry successful', referrer.username);
      
      // Reload data
      await loadReferralData();
      
      return { success: true, referrer: referrer.username };
    } catch (error) {
      console.error('Error processing referral code manually:', error);
      await trackReferralAttempt(referralCode, 'failed', 'System error');
      return { success: false, error: 'An error occurred while processing the referral code' };
    }
  }, [user?.id, validateReferralCode, trackReferralAttempt, loadReferralData]);

  return {
    referralCode,
    referralData,
    generateReferralCode,
    generateTelegramReferralLink,
    getReferralStats,
    loadReferralData,
    loadReferralCode,
    processStartParameter,
    checkReferral,
    isProcessing,
    debugInfo,
    // Enhanced features
    testReferralCode,
    validateReferralCode,
    trackReferralAttempt,
    clearReferralHistory,
    loadReferralAttempts,
    forceRefreshReferralData,
    processReferralCodeManually
  };
}; 