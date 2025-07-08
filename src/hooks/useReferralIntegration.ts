import { useState, useEffect, useCallback } from 'react';

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
      const savedData = localStorage.getItem('divineMiningReferralData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setReferralData(data);
        setReferralCode(data.code || '');
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  }, []);

  // Save referral data to localStorage
  const saveReferralData = useCallback((data: ReferralData) => {
    try {
      localStorage.setItem('divineMiningReferralData', JSON.stringify(data));
      setReferralData(data);
    } catch (error) {
      console.error('Error saving referral data:', error);
    }
  }, []);

  // Check if user was referred by someone
  const checkReferral = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && refCode !== referralCode) {
      // User was referred by someone
      const referrerData = localStorage.getItem(`referral_${refCode}`);
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
          
          localStorage.setItem(`referral_${refCode}`, JSON.stringify(updatedReferrer));
          
          // Store that this user was referred
          localStorage.setItem('referredBy', refCode);
          
          console.log(`User referred by: ${refCode}`);
        } catch (error) {
          console.error('Error processing referral:', error);
        }
      }
    }
  }, [referralCode]);

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

  // Initialize referral system
  useEffect(() => {
    loadReferralData();
    checkReferral();
  }, [loadReferralData, checkReferral]);

  return {
    referralCode,
    referralData,
    generateReferralCode,
    claimReferralReward,
    trackReferralActivity,
    getReferralStats,
    saveReferralData
  };
}; 