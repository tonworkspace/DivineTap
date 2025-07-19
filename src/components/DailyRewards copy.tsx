import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GiCoins, GiGems, GiCrown, GiShield } from 'react-icons/gi';
import { useGameContext } from '@/contexts/GameContext';
import { useNotificationSystem } from './NotificationSystem';
import { useAuth } from '@/hooks/useAuth';
import './DailyRewards.css';

interface DailyStreak {
  current: number;
  max: number;
  lastClaim: number;
  totalClaimed: number;
  consecutiveDays: number;
  totalDays: number;
  streakProtection: number;
  vipLevel: number;
  achievements: string[];
  lastMissedDay: number;
  bonusMultiplier: number;
  specialRewards: string[];
}

interface RewardTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  requirements: {
    streak: number;
    vipLevel?: number;
  };
  rewards: {
    points: number;
    gems: number;
    bonus: string;
    special?: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: {
    points: number;
    gems: number;
    bonus: string;
  };
  condition: (streak: DailyStreak) => boolean;
}

// Advanced reward tiers
const REWARD_TIERS: RewardTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    color: 'orange',
    requirements: { streak: 1 },
    rewards: { points: 25, gems: 2, bonus: 'None' }
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '🥈',
    color: 'gray',
    requirements: { streak: 3 },
    rewards: { points: 50, gems: 5, bonus: '+10% mining for 1h' }
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '🥇',
    color: 'yellow',
    requirements: { streak: 5 },
    rewards: { points: 100, gems: 10, bonus: '+25% energy regen for 2h' }
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: '💎',
    color: 'cyan',
    requirements: { streak: 7 },
    rewards: { points: 200, gems: 20, bonus: '+50% points for 1h' }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: '💠',
    color: 'purple',
    requirements: { streak: 14 },
    rewards: { points: 500, gems: 50, bonus: '+100% mining for 30m' }
  },
  {
    id: 'legendary',
    name: 'Legendary',
    icon: '👑',
    color: 'pink',
    requirements: { streak: 30 },
    rewards: { points: 1000, gems: 100, bonus: 'All bonuses for 2h', special: 'Legendary Boost' }
  },
  {
    id: 'mythic',
    name: 'Mythic',
    icon: '🌟',
    color: 'red',
    requirements: { streak: 100, vipLevel: 5 },
    rewards: { points: 5000, gems: 500, bonus: 'Permanent +10% mining', special: 'Mythic Status' }
  }
];

// Achievement system
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-week',
    name: 'Week Warrior',
    description: 'Complete a 7-day streak',
    icon: '📅',
    reward: { points: 100, gems: 10, bonus: '+5% permanent mining' },
    condition: (streak) => streak.current >= 7
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Complete a 30-day streak',
    icon: '🗓️',
    reward: { points: 500, gems: 50, bonus: '+10% permanent mining' },
    condition: (streak) => streak.current >= 30
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete a 100-day streak',
    icon: '🏆',
    reward: { points: 2000, gems: 200, bonus: '+25% permanent mining' },
    condition: (streak) => streak.current >= 100
  },
  {
    id: 'streak-protector',
    name: 'Streak Protector',
    description: 'Use streak protection 5 times',
    icon: '🛡️',
    reward: { points: 300, gems: 30, bonus: 'Extra protection slot' },
    condition: (streak) => streak.streakProtection >= 5
  },
  {
    id: 'vip-elite',
    name: 'VIP Elite',
    description: 'Reach VIP level 5',
    icon: '👑',
    reward: { points: 1000, gems: 100, bonus: 'VIP exclusive rewards' },
    condition: (streak) => streak.vipLevel >= 5
  }
];

// Streak milestones for bonus rewards
const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

export const DailyRewards: React.FC = () => {
  const { points: userPoints, gems: userGems, addPoints, addGems, addBoost } = useGameContext();
  const { showAchievementNotification, showMilestoneNotification } = useNotificationSystem();
  const { user } = useAuth();
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string, userId?: string) => {
    if (!userId) return baseKey; // Fallback for non-authenticated users
    return `${baseKey}_${userId}`;
  };
  
  const [dailyStreak, setDailyStreak] = useState<DailyStreak>(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    const saved = localStorage.getItem(userStreakKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all new fields exist for backward compatibility
        return {
          current: parsed.current || 0,
          max: parsed.max || 0,
          lastClaim: parsed.lastClaim || 0,
          totalClaimed: parsed.totalClaimed || 0,
          consecutiveDays: parsed.consecutiveDays || 0,
          totalDays: parsed.totalDays || 0,
          streakProtection: parsed.streakProtection || 3,
          vipLevel: parsed.vipLevel || 1,
          achievements: parsed.achievements || [],
          lastMissedDay: parsed.lastMissedDay || 0,
          bonusMultiplier: parsed.bonusMultiplier || 1.0,
          specialRewards: parsed.specialRewards || []
        };
      } catch (error) {
        console.error('Error parsing saved streak data for user:', userId, error);
      }
    }
    return {
      current: 0,
      max: 0,
      lastClaim: 0,
      totalClaimed: 0,
      consecutiveDays: 0,
      totalDays: 0,
      streakProtection: 3,
      vipLevel: 1,
      achievements: [],
      lastMissedDay: 0,
      bonusMultiplier: 1.0,
      specialRewards: []
    };
  });
  
  const [showResult, setShowResult] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showVIP, setShowVIP] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Helper function to get start of day (midnight) for a given date
  const getStartOfDay = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  // Helper function to get current day start
  const getCurrentDayStart = useCallback(() => {
    return getStartOfDay(Date.now());
  }, [getStartOfDay]);

  // Helper function to get last claim day start
  const getLastClaimDayStart = useCallback(() => {
    return getStartOfDay(dailyStreak.lastClaim);
  }, [dailyStreak.lastClaim, getStartOfDay]);

  // Check if daily reward can be claimed (based on calendar days)
  const canClaimDaily = useCallback(() => {
    const currentDayStart = getCurrentDayStart();
    const lastClaimDayStart = getLastClaimDayStart();
    
    // Can claim if we haven't claimed today yet
    return currentDayStart > lastClaimDayStart;
  }, [getCurrentDayStart, getLastClaimDayStart]);

  // Get time until next claim (until midnight)
  const getTimeUntilClaim = useCallback(() => {
    if (canClaimDaily()) return 'Ready';
    
    const now = Date.now();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow.getTime() - now;
    
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [canClaimDaily]);

  // Load and save streak data
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    const savedStreak = localStorage.getItem(userStreakKey);
    if (savedStreak) setDailyStreak(JSON.parse(savedStreak));
  }, [user?.id]);

  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userStreakKey = getUserSpecificKey('divineMiningStreak', userId);
    localStorage.setItem(userStreakKey, JSON.stringify(dailyStreak));
  }, [dailyStreak, user?.id]);



  // Real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (!canClaimDaily()) {
        setCountdown(getTimeUntilClaim());
      } else {
        setCountdown('Ready');
        // Show notification when ready to claim (only once)
        if (!showResult) {
          // You can add a notification here if you want to alert the user
          console.log('🎉 Daily reward is ready to claim!');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [canClaimDaily, showResult, getTimeUntilClaim]);

  // Get current reward tier
  const getCurrentRewardTier = useCallback(() => {
    return REWARD_TIERS.find(tier => 
      dailyStreak.current >= tier.requirements.streak && 
      dailyStreak.vipLevel >= (tier.requirements.vipLevel || 1)
    ) || REWARD_TIERS[0];
  }, [dailyStreak.current, dailyStreak.vipLevel]);

  // // Get next reward tier
  // const getNextRewardTier = useCallback(() => {
  //   const currentTier = getCurrentRewardTier();
  //   const currentIndex = REWARD_TIERS.findIndex(tier => tier.id === currentTier.id);
  //   return REWARD_TIERS[currentIndex + 1] || null;
  // }, [getCurrentRewardTier]);

  // Calculate bonus multiplier
  const getBonusMultiplier = useCallback(() => {
    let multiplier = dailyStreak.bonusMultiplier;
    
    // VIP bonus
    multiplier += (dailyStreak.vipLevel - 1) * 0.1;
    
    // Streak milestone bonus
    const milestone = STREAK_MILESTONES.find(m => dailyStreak.current >= m);
    if (milestone) {
      multiplier += 0.05 * (STREAK_MILESTONES.indexOf(milestone) + 1);
    }
    
    return multiplier;
  }, [dailyStreak.bonusMultiplier, dailyStreak.vipLevel, dailyStreak.current]);

  // Check for new achievements
  const checkAchievements = useCallback(() => {
    const achievements = dailyStreak.achievements || [];
    const newAchievements = ACHIEVEMENTS.filter(achievement => 
      !achievements.includes(achievement.id) && 
      achievement.condition(dailyStreak)
    );
    
    if (newAchievements.length > 0) {
      newAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
        addPoints(achievement.reward.points);
        addGems(achievement.reward.gems);
      });
      
      setDailyStreak(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), ...newAchievements.map(a => a.id)]
      }));
    }
  }, [dailyStreak, showAchievementNotification, addPoints, addGems]);

  // Check for missed days and handle streak breaks
  const checkMissedDays = useCallback(() => {
    const currentDayStart = getCurrentDayStart();
    const lastClaimDayStart = getLastClaimDayStart();
    
    // Calculate days difference
    const daysDiff = Math.floor((currentDayStart - lastClaimDayStart) / (24 * 60 * 60 * 1000));
    
    // If more than 1 day has passed since last claim, streak is broken
    if (daysDiff > 1 && dailyStreak.current > 0) {
      // Use streak protection if available
      if (dailyStreak.streakProtection > 0) {
        setDailyStreak(prev => ({
          ...prev,
          streakProtection: prev.streakProtection - 1,
          lastMissedDay: currentDayStart
        }));
        console.log('🛡️ Streak protection used automatically!');
      } else {
        // Reset streak
        setDailyStreak(prev => ({
          ...prev,
          current: 0,
          lastMissedDay: currentDayStart
        }));
        console.log('💔 Streak broken! You missed a day.');
      }
    }
  }, [getCurrentDayStart, getLastClaimDayStart, dailyStreak.current, dailyStreak.streakProtection]);

  // Check for missed days when component loads
  useEffect(() => {
    if (dailyStreak.lastClaim > 0) {
      checkMissedDays();
    }
  }, [checkMissedDays]);

  // Check for streak milestones
  const checkStreakMilestones = useCallback(() => {
    const milestone = STREAK_MILESTONES.find(m => dailyStreak.current === m);
    if (milestone) {
      showMilestoneNotification(milestone);
      const bonusPoints = milestone * 10;
      addPoints(bonusPoints);
      addGems(milestone);
    }
  }, [dailyStreak.current, showMilestoneNotification, addPoints, addGems]);

  // Claim daily reward
  const claimDailyReward = useCallback(() => {
    if (!canClaimDaily()) return;

    const currentDayStart = getCurrentDayStart();
    const newStreak = dailyStreak.current + 1;
    const currentTier = getCurrentRewardTier();
    const bonusMultiplier = getBonusMultiplier();
    
    // Calculate rewards with bonus multiplier
    const basePoints = currentTier.rewards.points;
    const baseGems = currentTier.rewards.gems;
    const finalPoints = Math.floor(basePoints * bonusMultiplier);
    const finalGems = Math.floor(baseGems * bonusMultiplier);
    
    addPoints(finalPoints);
    addGems(finalGems, `daily_reward_day_${newStreak}`);
    
    // Apply bonus if available
    if (currentTier.rewards.bonus !== 'None') {
      const bonus = currentTier.rewards.bonus;
      if (bonus.includes('mining')) {
        const multiplier = bonus.includes('+10%') ? 1.1 : 
                          bonus.includes('+25%') ? 1.25 :
                          bonus.includes('+50%') ? 1.5 : 
                          bonus.includes('+100%') ? 2.0 : 1.0;
        const duration = bonus.includes('30m') ? 30 : 
                        bonus.includes('1h') ? 60 : 
                        bonus.includes('2h') ? 120 : 60;
        
        addBoost({
          type: 'mining',
          multiplier: multiplier,
          expires: Date.now() + (duration * 60 * 1000)
        });
      }
    }
    
    // Apply special rewards
    if (currentTier.rewards.special) {
      setDailyStreak(prev => ({
        ...prev,
        specialRewards: [...prev.specialRewards, currentTier.rewards.special!]
      }));
    }
    
    setDailyStreak(prev => ({
      ...prev,
      current: newStreak,
      max: Math.max(prev.max, newStreak),
      lastClaim: currentDayStart,
      totalClaimed: prev.totalClaimed + finalPoints + finalGems,
      consecutiveDays: prev.consecutiveDays + 1,
      totalDays: prev.totalDays + 1
    }));

    // Check for achievements and milestones
    setTimeout(() => {
      checkAchievements();
      checkStreakMilestones();
    }, 100);

    const bonusText = bonusMultiplier > 1.0 ? ` (${(bonusMultiplier * 100).toFixed(0)}% bonus)` : '';
    setRewardMessage(`+${finalPoints} Points, +${finalGems} Gems${bonusText}${currentTier.rewards.bonus !== 'None' ? ` • ${currentTier.rewards.bonus}` : ''}`);
    setShowResult(true);
  }, [canClaimDaily, dailyStreak, getCurrentRewardTier, getBonusMultiplier, addPoints, addGems, addBoost, checkAchievements, checkStreakMilestones]);

  // Use streak protection
  const useStreakProtection = useCallback(() => {
    if (dailyStreak.streakProtection > 0) {
      setDailyStreak(prev => ({
        ...prev,
        streakProtection: prev.streakProtection - 1,
        lastMissedDay: 0
      }));
      setRewardMessage('🛡️ Streak protection activated! Your streak is safe.');
      setShowResult(true);
    }
  }, [dailyStreak.streakProtection]);

  // Upgrade VIP level
  const upgradeVIP = useCallback(() => {
    const cost = dailyStreak.vipLevel * 1000; // 1000 gems per level
    if (userGems >= cost) {
      addGems(-cost);
      setDailyStreak(prev => ({
        ...prev,
        vipLevel: prev.vipLevel + 1,
        streakProtection: prev.streakProtection + 2
      }));
      setRewardMessage(`👑 VIP Level ${dailyStreak.vipLevel + 1} unlocked! +2 streak protection`);
      setShowResult(true);
    }
  }, [dailyStreak.vipLevel, userGems, addGems]);

  // Close result modal
  const closeResult = useCallback(() => {
    setShowResult(false);
    setRewardMessage('');
  }, []);

  // Get unlocked achievements
  const unlockedAchievements = useMemo(() => {
    const achievements = dailyStreak.achievements || [];
    return ACHIEVEMENTS.filter(achievement => 
      achievements.includes(achievement.id)
    );
  }, [dailyStreak.achievements]);

  // // Get available achievements
  // const availableAchievements = useMemo(() => {
  //   const achievements = dailyStreak.achievements || [];
  //   return ACHIEVEMENTS.filter(achievement => 
  //     !achievements.includes(achievement.id) && 
  //     achievement.condition(dailyStreak)
  //   );
  // }, [dailyStreak]);

  const currentTier = getCurrentRewardTier();
  // const nextTier = getNextRewardTier();
  const bonusMultiplier = getBonusMultiplier();

  return (
    <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
      {/* Advanced Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">DAILY REWARDS</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-2xl font-mono font-bold text-cyan-300 tracking-wider">
              DAY {dailyStreak.current + 1}
            </div>
            <div className={`text-lg ${currentTier.color === 'yellow' ? 'text-yellow-400' : 
                                          currentTier.color === 'cyan' ? 'text-cyan-400' :
                                          currentTier.color === 'purple' ? 'text-purple-400' :
                                          currentTier.color === 'pink' ? 'text-pink-400' :
                                          currentTier.color === 'red' ? 'text-red-400' :
                                          currentTier.color === 'gray' ? 'text-gray-400' :
                                          'text-orange-400'}`}>
              {currentTier.icon}
            </div>
          </div>
          
          {/* Calendar Day Display */}
          <div className="text-xs text-gray-400 font-mono tracking-wide mb-2">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <div className="text-xs text-cyan-400 font-mono tracking-wide mb-2">
            {canClaimDaily() ? '✨ READY TO CLAIM' : `⏰ NEXT: ${countdown}`}
          </div>
          
          {/* Real-time Countdown Timer */}
          {/* {!canClaimDaily() && (
            <div className="bg-black/60 backdrop-blur-xl rounded-lg p-3 border border-cyan-400/30">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <GiHourglass className="text-cyan-400 text-sm animate-pulse" />
                  <span className="text-cyan-300 font-mono font-bold text-sm tracking-wider">NEXT CLAIM</span>
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-200 tracking-wider mb-1">
                  {countdown}
                </div>
                <div className="text-xs text-cyan-400 font-mono">
                  {(() => {
                    const now = Date.now();
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    
                    const timeLeft = tomorrow.getTime() - now;
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
                    
                    if (hours > 0) {
                      return `${hours}h ${minutes}m ${seconds}s remaining`;
                    } else if (minutes > 0) {
                      return `${minutes}m ${seconds}s remaining`;
                    } else {
                      return `${seconds}s remaining`;
                    }
                  })()}
                </div>
              </div>
            </div>
          )} */}
          
          {/* VIP Level Display */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <GiCrown className="text-yellow-400 text-sm" />
            <span className="text-yellow-400 font-mono text-xs">VIP {dailyStreak.vipLevel}</span>
            <span className="text-gray-400 text-xs">•</span>
            <GiShield className="text-green-400 text-sm" />
            <span className="text-green-400 font-mono text-xs">{dailyStreak.streakProtection} Protection</span>
          </div>
        </div>
      </div>

      {/* Advanced Currency Display */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-yellow-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <GiCoins className="text-white text-sm" />
            </div>
            <div>
              <div className="text-yellow-400 font-mono font-bold text-lg tracking-wider">{userPoints.toLocaleString()}</div>
              <div className="text-yellow-300 text-xs font-mono uppercase tracking-wider">Points</div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <GiGems className="text-white text-sm" />
            </div>
            <div>
              <div className="text-purple-400 font-mono font-bold text-lg tracking-wider">{userGems}</div>
              <div className="text-purple-300 text-xs font-mono uppercase tracking-wider">Gems</div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Daily Reward Card */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        {/* Current Tier Display */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-3 animate-bounce">
            {currentTier.icon}
          </div>
          
          <div className="text-lg font-mono font-bold text-white mb-2 tracking-wider">
            {currentTier.name} Tier
          </div>
          
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-xl rounded-lg px-3 py-2 border border-yellow-400/50">
              <GiCoins className="text-yellow-400 text-sm" />
              <span className="text-white font-mono font-bold text-sm tracking-wider">
                +{Math.floor(currentTier.rewards.points * bonusMultiplier)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-purple-500/20 backdrop-blur-xl rounded-lg px-3 py-2 border border-purple-400/50">
              <GiGems className="text-purple-400 text-sm" />
              <span className="text-white font-mono font-bold text-sm tracking-wider">
                +{Math.floor(currentTier.rewards.gems * bonusMultiplier)}
              </span>
            </div>
          </div>
          
          {currentTier.rewards.bonus !== 'None' && (
            <div className="bg-blue-500/20 backdrop-blur-xl text-blue-300 text-xs px-4 py-2 rounded-lg border border-blue-400/50 mb-4">
              ⚡ {currentTier.rewards.bonus}
            </div>
          )}
          
          {currentTier.rewards.special && (
            <div className="bg-pink-500/20 backdrop-blur-xl text-pink-300 text-xs px-4 py-2 rounded-lg border border-pink-400/50 mb-4">
              🌟 {currentTier.rewards.special}
            </div>
          )}
          
          {bonusMultiplier > 1.0 && (
            <div className="bg-green-500/20 backdrop-blur-xl text-green-300 text-xs px-4 py-2 rounded-lg border border-green-400/50 mb-4">
              🚀 +{((bonusMultiplier - 1) * 100).toFixed(0)}% Bonus Multiplier
            </div>
          )}
        </div>

        {/* Time Status */}
        {!canClaimDaily() && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-lg p-3 border border-orange-400/30 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-300 font-mono font-bold text-sm tracking-wider">WAITING FOR NEXT CLAIM</span>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-mono font-bold text-orange-200 tracking-wider mb-1">
                {countdown}
              </div>
              <div className="text-xs text-orange-400 font-mono">
                {(() => {
                  const now = Date.now();
                  const tomorrow = new Date(now);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  
                  const timeLeft = tomorrow.getTime() - now;
                  const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                  
                  if (hours > 0) {
                    return `${hours} hours and ${minutes} minutes until next claim`;
                  } else if (minutes > 0) {
                    return `${minutes} minutes until next claim`;
                  } else {
                    return 'Less than a minute until next claim';
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={claimDailyReward}
            disabled={!canClaimDaily()}
            className={`w-full py-3 rounded-lg font-mono font-bold text-sm tracking-wider transition-all duration-300 border ${
              canClaimDaily()
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] border-cyan-400 hover:scale-105'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
            }`}
          >
            {canClaimDaily() ? '🎉 CLAIM REWARD' : '⏰ COME BACK TOMORROW'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 py-2 rounded-lg font-mono font-bold text-xs tracking-wider bg-purple-600 hover:bg-purple-500 text-white transition-all duration-300 border border-purple-400"
            >
              👁️ PREVIEW
            </button>
            
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="flex-1 py-2 rounded-lg font-mono font-bold text-xs tracking-wider bg-yellow-600 hover:bg-yellow-500 text-white transition-all duration-300 border border-yellow-400"
            >
              🏆 ACHIEVEMENTS ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </button>
            
            <button
              onClick={() => setShowVIP(!showVIP)}
              className="flex-1 py-2 rounded-lg font-mono font-bold text-xs tracking-wider bg-pink-600 hover:bg-pink-500 text-white transition-all duration-300 border border-pink-400"
            >
              👑 VIP
            </button>
          </div>
          
          {dailyStreak.streakProtection > 0 && (
            <button
              onClick={useStreakProtection}
              className="w-full py-2 rounded-lg font-mono font-bold text-xs tracking-wider bg-green-600 hover:bg-green-500 text-white transition-all duration-300 border border-green-400"
            >
              🛡️ USE STREAK PROTECTION ({dailyStreak.streakProtection} left)
            </button>
          )}
        </div>

        {/* Advanced Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-green-500/10 backdrop-blur-xl rounded-lg border border-green-400/30">
              <div className="text-white font-mono font-bold text-lg tracking-wider">{dailyStreak.current}</div>
              <div className="text-green-300 text-xs font-mono uppercase tracking-wider">Current</div>
            </div>
            
            <div className="text-center p-2 bg-purple-500/10 backdrop-blur-xl rounded-lg border border-purple-400/30">
              <div className="text-white font-mono font-bold text-lg tracking-wider">{dailyStreak.max}</div>
              <div className="text-purple-300 text-xs font-mono uppercase tracking-wider">Best</div>
            </div>
            
            <div className="text-center p-2 bg-yellow-500/10 backdrop-blur-xl rounded-lg border border-yellow-400/30">
              <div className="text-white font-mono font-bold text-lg tracking-wider">{dailyStreak.consecutiveDays}</div>
              <div className="text-yellow-300 text-xs font-mono uppercase tracking-wider">Consecutive</div>
            </div>
            
            <div className="text-center p-2 bg-blue-500/10 backdrop-blur-xl rounded-lg border border-blue-400/30">
              <div className="text-white font-mono font-bold text-lg tracking-wider">{dailyStreak.totalDays}</div>
              <div className="text-blue-300 text-xs font-mono uppercase tracking-wider">Total Days</div>
            </div>
          </div>
          
          <div className="text-center p-2 bg-cyan-500/10 backdrop-blur-xl rounded-lg border border-cyan-400/30">
            <div className="text-white font-mono font-bold text-lg tracking-wider">{dailyStreak.totalClaimed.toLocaleString()}</div>
            <div className="text-cyan-300 text-xs font-mono uppercase tracking-wider">Total Claimed</div>
          </div>
        </div>
      </div>

      {/* Reward Preview */}
      {showPreview && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.1)]">
          <div className="text-center mb-4">
            <div className="text-purple-400 font-mono font-bold text-sm tracking-wider mb-2">REWARD PREVIEW</div>
            <div className="grid grid-cols-1 gap-2">
              {REWARD_TIERS.map((tier) => (
                <div key={tier.id} className={`p-2 rounded-lg border ${
                  tier.id === currentTier.id 
                    ? 'bg-purple-500/20 border-purple-400/50' 
                    : 'bg-gray-800/50 border-gray-600/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tier.icon}</span>
                      <span className="text-white font-mono text-sm">{tier.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-mono text-xs">+{tier.rewards.points} pts</div>
                      <div className="text-white font-mono text-xs">+{tier.rewards.gems} gems</div>
                    </div>
                  </div>
                  {tier.requirements.streak > dailyStreak.current && (
                    <div className="text-gray-400 font-mono text-xs mt-1">
                      Requires {tier.requirements.streak} day streak
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Panel */}
      {showAchievements && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
          <div className="text-center mb-4">
            <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider mb-2">ACHIEVEMENTS</div>
            <div className="grid grid-cols-1 gap-2">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = (dailyStreak.achievements || []).includes(achievement.id);
                return (
                  <div key={achievement.id} className={`p-2 rounded-lg border ${
                    isUnlocked 
                      ? 'bg-yellow-500/20 border-yellow-400/50' 
                      : 'bg-gray-800/50 border-gray-600/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <div>
                          <div className="text-white font-mono text-sm">{achievement.name}</div>
                          <div className="text-gray-400 font-mono text-xs">{achievement.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isUnlocked ? (
                          <div className="text-green-400 text-sm">✓</div>
                        ) : (
                          <div className="text-gray-500 text-sm">🔒</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIP Panel */}
      {showVIP && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-pink-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
          <div className="text-center mb-4">
            <div className="text-pink-400 font-mono font-bold text-sm tracking-wider mb-2">VIP SYSTEM</div>
            <div className="mb-4">
              <div className="text-white font-mono text-lg">VIP Level {dailyStreak.vipLevel}</div>
              <div className="text-gray-400 font-mono text-xs">+{((dailyStreak.vipLevel - 1) * 10).toFixed(0)}% bonus rewards</div>
            </div>
            
            <button
              onClick={upgradeVIP}
              disabled={userGems < dailyStreak.vipLevel * 1000}
              className={`w-full py-2 rounded-lg font-mono font-bold text-sm tracking-wider transition-all duration-300 border ${
                userGems >= dailyStreak.vipLevel * 1000
                  ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-400'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
              }`}
            >
              Upgrade to VIP {dailyStreak.vipLevel + 1} ({dailyStreak.vipLevel * 1000} gems)
            </button>
            
            <div className="mt-4 text-left">
              <div className="text-pink-300 font-mono text-xs mb-2">VIP Benefits:</div>
              <div className="text-gray-400 font-mono text-xs space-y-1">
                <div>• +10% bonus rewards per VIP level</div>
                <div>• +2 streak protection per level</div>
                <div>• Access to exclusive reward tiers</div>
                <div>• Special achievement rewards</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Result Modal */}
      {showResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            
            <h3 className="text-white font-mono font-bold text-xl mb-4 tracking-wider">REWARD CLAIMED!</h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/30 mb-6">
              <p className="text-cyan-200 text-sm font-mono tracking-wider">{rewardMessage}</p>
            </div>
            
            <button
              onClick={closeResult}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              AWESOME! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 