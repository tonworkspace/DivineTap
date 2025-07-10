import { useState, useEffect, useCallback } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { useAuth } from '@/hooks/useAuth';

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
  referrals: any[];
  level: number;
  nextLevelReward: string;
}

export const useReferralIntegration = () => {
  const { user } = useAuth();
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string, userId?: string) => {
    if (!userId) return baseKey; // Fallback for non-authenticated users
    return `${baseKey}_${userId}`;
  };
  
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralData, setReferralData] = useState<ReferralData>({
    code: '',
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
    rewards: { points: 0, gems: 0, special: [] },
    referrals: [],
    level: 1,
    nextLevelReward: ''
  });

  // Generate a unique referral code
  const generateReferralCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    const code = `${result}${timestamp.slice(-4)}`;
    
    setReferralCode(code);
    return code;
  }, []);

  // Load referral data from localStorage
  const loadReferralData = useCallback(() => {
    try {
      const userId = user?.id ? user.id.toString() : undefined;
      const userReferralDataKey = getUserSpecificKey('divineMiningReferralData', userId);
      const savedData = localStorage.getItem(userReferralDataKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        setReferralData(data);
        setReferralCode(data.code || '');
      }
    } catch (error) {
      console.error('Error loading referral data for user:', user?.id, error);
    }
  }, [user?.id]);

  // Save referral data to localStorage
  const saveReferralData = useCallback((data: ReferralData) => {
    try {
      const userId = user?.id ? user.id.toString() : undefined;
      const userReferralDataKey = getUserSpecificKey('divineMiningReferralData', userId);
      localStorage.setItem(userReferralDataKey, JSON.stringify(data));
      setReferralData(data);
    } catch (error) {
      console.error('Error saving referral data for user:', user?.id, error);
    }
  }, [user?.id]);

  // Process Telegram start parameter for referral tracking
  const processStartParameter = useCallback(() => {
    try {
      const launchParams = retrieveLaunchParams();
      const startParam = launchParams.startParam;
      
      console.log('Processing start parameter:', startParam);
      
      // Check if start parameter exists and is not empty
      if (startParam && startParam.length > 0) {
        // Validate start parameter format (alphanumeric, underscore, hyphen, max 512 chars)
        const startParamRegex = /^[\w-]{1,512}$/;
        if (startParamRegex.test(startParam)) {
          // Check if this user was already referred by this code
          const alreadyReferred = localStorage.getItem('referredBy');
          if (alreadyReferred === startParam) {
            console.log('User already referred by this code:', startParam);
            return;
          }
          
          // User was referred by someone
          const referrerData = localStorage.getItem(`referral_${startParam}`);
          if (referrerData) {
            try {
              const referrer = JSON.parse(referrerData);
              // Update referrer's data
              const updatedReferrer = {
                ...referrer,
                totalReferrals: referrer.totalReferrals + 1,
                activeReferrals: referrer.activeReferrals + 1,
                referrals: [
                  ...referrer.referrals,
                  {
                    id: Date.now().toString(),
                    username: `User_${Date.now().toString(36)}`,
                    joinedAt: Date.now(),
                    isActive: true,
                    pointsEarned: 0,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
                  }
                ]
              };
              
              localStorage.setItem(`referral_${startParam}`, JSON.stringify(updatedReferrer));
              
              // Store that this user was referred
              localStorage.setItem('referredBy', startParam);
              
              console.log(`User referred by: ${startParam}`);
              
              // You could also trigger a notification or reward here
              // For example, give the referrer some bonus points
              if (updatedReferrer.rewards) {
                updatedReferrer.rewards.points += 50; // Bonus for successful referral
                localStorage.setItem(`referral_${startParam}`, JSON.stringify(updatedReferrer));
              }
            } catch (error) {
              console.error('Error processing referral:', error);
            }
          } else {
            // Referrer data doesn't exist, but still mark as referred
            localStorage.setItem('referredBy', startParam);
            console.log(`User referred by: ${startParam} (referrer data not found)`);
          }
        } else {
          console.log('Invalid start parameter format:', startParam);
        }
      }
    } catch (error) {
      console.error('Error processing start parameter:', error);
    }
  }, []);

  // Check if user was referred by someone using Telegram start parameter
  const checkReferral = useCallback(() => {
    processStartParameter();
  }, [processStartParameter]);

  // Claim referral reward
  const claimReferralReward = useCallback((rewardLevel: number) => {
    const currentData = { ...referralData };
    
    // Check if reward can be claimed
    if (currentData.totalReferrals >= rewardLevel) {
      // Calculate rewards based on level
      const basePoints = rewardLevel * 100;
      const baseGems = rewardLevel * 10;
      
      currentData.rewards.points += basePoints;
      currentData.rewards.gems += baseGems;
      
      // Add special reward for higher levels
      if (rewardLevel >= 3) {
        currentData.rewards.special.push(`Level ${rewardLevel} Reward`);
      }
      
      saveReferralData(currentData);
      
      return {
        success: true,
        points: basePoints,
        gems: baseGems,
        special: rewardLevel >= 3 ? `Level ${rewardLevel} Reward` : null
      };
    }
    
    return { success: false };
  }, [referralData, saveReferralData]);

  // Track referral activity
  const trackReferralActivity = useCallback((referralId: string, activity: string) => {
    const currentData = { ...referralData };
    const referral = currentData.referrals.find(r => r.id === referralId);
    
    if (referral) {
      // Update referral activity
      referral.lastActivity = Date.now();
      referral.activities = referral.activities || [];
      referral.activities.push({
        type: activity,
        timestamp: Date.now()
      });
      
      saveReferralData(currentData);
    }
  }, [referralData, saveReferralData]);

  // Get referral statistics
  const getReferralStats = useCallback(() => {
    const currentData = { ...referralData };
    
    return {
      totalReferrals: currentData.totalReferrals,
      activeReferrals: currentData.activeReferrals,
      totalEarned: currentData.totalEarned,
      level: currentData.level,
      nextLevelRequirement: Math.max(1, currentData.level * 5),
      completionPercentage: (currentData.totalReferrals / Math.max(1, currentData.level * 5)) * 100
    };
  }, [referralData]);

  // Generate Telegram referral link
  const generateTelegramReferralLink = useCallback((code?: string) => {
    const codeToUse = code || referralCode;
    return `https://t.me/DivineTaps_bot/mine?startapp=${codeToUse}`;
  }, [referralCode]);

  // Initialize referral system
  useEffect(() => {
    loadReferralData();
    checkReferral();
  }, [loadReferralData, checkReferral]);

  return {
    referralCode,
    referralData,
    generateReferralCode,
    generateTelegramReferralLink,
    claimReferralReward,
    trackReferralActivity,
    getReferralStats,
    saveReferralData,
    processStartParameter
  };
}; 