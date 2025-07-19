import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import { useNotificationSystem } from './NotificationSystem';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { migrateToUserSpecificKeys, validateUserDataIsolation, checkForDataLeakage, clearUserData } from '@/utils/userDataIsolation';

interface Upgrade {
  id: string;
  name: string;
  level: number;
  effect: string;
  baseCost: number;
  costMultiplier: number;
  effectValue: number;
  category?: 'chakra' | 'mastery' | 'meditation' | 'cosmic' | 'elemental';
  description?: string;
  requires?: {
    upgrade: string;
    level: number;
  };
  // New educational fields
  detailedDescription?: string;
  benefits?: string[];
  tips?: string[];
  unlockProgress?: number; // 0-100 percentage
  maxLevel: number; // Maximum level for 100% unlock
  unlockReward?: string; // Special reward at 100%
}

interface GameState {
  divinePoints: number;
  pointsPerSecond: number;
  totalEarned24h: number;
  totalEarned7d: number;
  upgradesPurchased: number;
  minersActive: number;
  isMining: boolean;
  lastSaveTime: number;
  sessionStartTime: number;
  totalPointsEarned: number;
  lastDailyReset: string;
  lastWeeklyReset: string;
  version: string;
  highScore: number;
  allTimeHighScore: number;
  currentEnergy: number;
  maxEnergy: number;
  lastEnergyRegen: number;
  offlineEfficiencyBonus: number; // New: Bonus for offline mining
  lastOfflineTime: number; // New: Track last offline time
  unclaimedOfflineRewards: number; // New: Track unclaimed offline rewards
  lastOfflineRewardTime: number; // New: Track when offline rewards were last calculated
  
  // Add missing properties
  miningLevel: number;
  miningCombo: number;
  miningStreak: number;
  miningExperience: number;
  miningExperienceToNext: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
}

// Tutorial System Interfaces
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'wait' | 'info';
  condition?: (state: GameState) => boolean;
  completed?: boolean;
  skipIf?: (state: GameState) => boolean;
}

interface TutorialState {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  isCompleted: boolean;
  showTutorial: boolean;
  highlightElement: string | null;
}

// // Add missing interfaces
// interface ClickEffect {
//   x: number;
//   y: number;
//   timestamp: number;
// }

// interface MilestoneData {
//   value: number;
//   timestamp: number;
// }

// interface CardHeaderProps {
//   title: string;
//   isActive?: boolean;
//   extraContent?: React.ReactNode;
//   showToggle?: boolean;
//   toggleState?: boolean;
//   onToggle?: () => void;
//   toggleText?: string;
//   toggleIcon?: string;
// }

const GAME_VERSION = '1.1.0'; // Updated version
// All keys will be made user-specific using getUserSpecificKey()
const SAVE_KEY = 'divineMiningGame';
const BACKUP_KEY = 'divineMiningGame_backup';
const DIVINE_POINTS_KEY = 'divineMiningPoints';
const TOTAL_EARNED_KEY = 'divineMiningTotalEarned';
const SESSION_KEY = 'divineMiningSession';
const TUTORIAL_KEY = 'divineMiningTutorial';
const ACHIEVEMENTS_KEY = 'divineMiningAchievements';
const UPGRADES_KEY = 'divineMiningUpgrades';
const HIGH_SCORE_KEY = 'divineMiningHighScore';
const OFFLINE_EFFICIENCY_CAP = 14; // 14 days max offline earnings
const OFFLINE_EFFICIENCY_BONUS = 0.1; // 10% bonus per day offline (max 140%)

// Add getCurrentTier function with enhanced information
const getCurrentTier = (level: number) => {
  if (level >= 50) {
    return { 
      name: 'MASTER', 
      symbol: '🌟', 
      color: 'yellow',
      description: 'Transcendent wisdom and divine mastery',
      benefits: ['+200% mining efficiency', '+150% energy regeneration', 'Exclusive cosmic upgrades', 'Divine resonance bonus'],
      nextTier: null
    };
  } else if (level >= 30) {
    return { 
      name: 'EXPERT', 
      symbol: '💎', 
      color: 'purple',
      description: 'Advanced spiritual techniques and deep understanding',
      benefits: ['+100% mining efficiency', '+75% energy regeneration', 'Quantum upgrades unlocked', 'Enhanced auto-mining'],
      nextTier: { name: 'MASTER', level: 50, symbol: '🌟' }
    };
  } else if (level >= 15) {
    return { 
      name: 'ADEPT', 
      symbol: '🔮', 
      color: 'blue',
      description: 'Intermediate spiritual practices and growing awareness',
      benefits: ['+50% mining efficiency', '+40% energy regeneration', 'Advanced upgrades unlocked', 'Improved energy management'],
      nextTier: { name: 'EXPERT', level: 30, symbol: '💎' }
    };
  } else {
    return { 
      name: 'NOVICE', 
      symbol: '🌱', 
      color: 'green',
      description: 'Beginning the spiritual journey of divine mining',
      benefits: ['+25% mining efficiency', '+20% energy regeneration', 'Basic upgrades available', 'Energy conservation'],
      nextTier: { name: 'ADEPT', level: 15, symbol: '🔮' }
    };
  }
};

// Add CardHeader component outside the main component
// const CardHeader: React.FC<CardHeaderProps> = ({ 
//   title, 
//   isActive = false, 
//   extraContent,
//   showToggle = false,
//   toggleState = false,
//   onToggle,
//   toggleText = "TOGGLE",
//   toggleIcon = "⚙️"
// }) => (
//   <div className="flex items-center justify-between mb-3">
//     <div className="flex items-center space-x-2">
//       <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
//       <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">{title}</span>
//     </div>
//     <div className="flex items-center space-x-2">
//       {extraContent}
//       {showToggle && (
//         <button
//           onClick={onToggle}
//           className={`font-mono font-bold px-2 py-1 rounded text-xs transition-all duration-300 border ${
//             toggleState 
//               ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400' 
//               : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border-gray-500 hover:border-cyan-400 hover:text-cyan-300'
//           }`}
//         >
//           {toggleIcon} {toggleText}
//         </button>
//       )}
//     </div>
//   </div>
// );


export const DivineMiningGame: React.FC = () => {
  const { setPoints, activeBoosts, gems } = useGameContext();
  const { user } = useAuth();
  const {
    // showAchievementNotification,
    // showMilestoneNotification,
    showUpgradeNotification,
    showSystemNotification,
    // showOfflineRewardsNotification,
  } = useNotificationSystem();
  
  // Add missing state variables
  // const [showHelp, setShowHelp] = useState(false);
  // const [showDebug, setShowDebug] = useState(false);
  const [, setLastSaveStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [, setSaveMessage] = useState('');
  // const [miningResumed, setMiningResumed] = useState(false);
  const [showOfflineRewards, setShowOfflineRewards] = useState(false);
  // const [offlineRewardNotification, setOfflineRewardNotification] = useState('');
  // const [clickEffect, setClickEffect] = useState<ClickEffect | null>(null);
  // const [showMilestone,] = useState<MilestoneData | null>(null);
  // const [isNewPlayer, setIsNewPlayer] = useState(false);
  // const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  
  // // Add comprehensive loading states
  // const [isLoading, setIsLoading] = useState(true);
  // const [loadingProgress, setLoadingProgress] = useState(0);
  // const [loadingStep, setLoadingStep] = useState('');
  // const [loadingError, setLoadingError] = useState<string | null>(null);
  // const [isRetrying, setIsRetrying] = useState(false);
  
  // Add reset confirmation state
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetButton, setShowResetButton] = useState(false);
  
  // Add tier info modal state
  const [showTierInfo, setShowTierInfo] = useState(false);
  
  // Upgrade filtering state
  const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'affordable' | 'recommended' | 'chakra' | 'mastery' | 'meditation' | 'cosmic' | 'elemental'>('all');
  // const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentUpgradePage, setCurrentUpgradePage] = useState(1);
  const upgradesPerPage = 8;
  
  // Add purchasing state
  const [purchasingUpgrade, setPurchasingUpgrade] = useState<string | null>(null);

  const miningIntervalRef = useRef<NodeJS.Timeout>();

  // Helper function to get user-specific keys with complete isolation
  const getUserSpecificKey = useCallback((baseKey: string): string => {
    if (!user?.telegram_id) {
      console.warn('No user telegram_id available for key generation');
      return baseKey;
    }
    return `${baseKey}_${user.telegram_id}`;
  }, [user?.telegram_id]);

  // Add reset functionality with comprehensive clearing
  const resetUserData = useCallback(async () => {
    if (!user?.telegram_id) {
      showSystemNotification('Reset Error', 'No user found for reset!', 'error');
      return;
    }

    setIsResetting(true);
    
    try {
      console.log('🔄 Starting comprehensive user data reset...');
      
      const telegramId = String(user.telegram_id);
      
      // Step 1: Clear all user-specific data from localStorage
      console.log('Step 1: Clearing localStorage data...');
      const clearSuccess = clearUserData(telegramId);
      
      if (!clearSuccess) {
        console.warn('⚠️ clearUserData returned false, but continuing with manual clearing...');
      }
      
      // Step 2: Manual aggressive clearing of ALL possible keys
      console.log('Step 2: Manual aggressive clearing...');
      const allPossibleKeys = [
        // User-specific keys
        `divineMiningGame_${telegramId}`,
        `divineMiningGame_backup_${telegramId}`,
        `divineMiningPoints_${telegramId}`,
        `divineMiningTotalEarned_${telegramId}`,
        `divineMiningSession_${telegramId}`,
        `divineMiningTutorial_${telegramId}`,
        `divineMiningAchievements_${telegramId}`,
        `divineMiningUpgrades_${telegramId}`,
        `divineMiningHighScore_${telegramId}`,
        `divineMiningPrestigeMultiplier_${telegramId}`,
        `spiritualEssencePoints_${telegramId}`,
        `divineMiningGems_${telegramId}`,
        `divineMiningBoosts_${telegramId}`,
        `divineMiningStreak_${telegramId}`,
        `divineMiningReferralData_${telegramId}`,
        `divineMiningCompletedTasks_${telegramId}`,
        `mining_state_${telegramId}`,
        `frog_miner_data_${telegramId}`,
        
        // Non-user-specific keys (legacy)
        'divineMiningGame',
        'divineMiningGame_backup',
        'divineMiningPoints',
        'divineMiningTotalEarned',
        'divineMiningSession',
        'divineMiningTutorial',
        'divineMiningAchievements',
        'divineMiningUpgrades',
        'divineMiningHighScore',
        'divineMiningPrestigeMultiplier',
        'spiritualEssencePoints',
        'divineMiningGems',
        'divineMiningBoosts',
        'divineMiningStreak',
        'divineMiningReferralData',
        'divineMiningCompletedTasks',
        'mining_state',
        'frog_miner_data',
        
        // Additional potential keys
        'divine_mining_state',
        'divine_mining_data',
        'game_state',
        'user_game_data',
        'mining_game_data',
        'divine_points',
        'user_points',
        'game_points',
        'mining_points',
        'user_upgrades',
        'game_upgrades',
        'mining_upgrades',
        'user_achievements',
        'game_achievements',
        'mining_achievements',
        'user_session',
        'game_session',
        'mining_session',
        'user_tutorial',
        'game_tutorial',
        'mining_tutorial',
        'user_high_score',
        'game_high_score',
        'mining_high_score',
        'user_gems',
        'game_gems',
        'mining_gems',
        'user_boosts',
        'game_boosts',
        'mining_boosts',
        'user_streak',
        'game_streak',
        'mining_streak',
        'user_referrals',
        'game_referrals',
        'mining_referrals',
        'user_tasks',
        'game_tasks',
        'mining_tasks',
        'user_prestige',
        'game_prestige',
        'mining_prestige',
        'user_energy',
        'game_energy',
        'mining_energy',
        'user_level',
        'game_level',
        'mining_level',
        'user_experience',
        'game_experience',
        'mining_experience',
        'user_combo',
        'game_combo',
        'mining_combo',
        'user_offline_rewards',
        'game_offline_rewards',
        'mining_offline_rewards',
        'user_offline_time',
        'game_offline_time',
        'mining_offline_time',
        'user_efficiency_bonus',
        'game_efficiency_bonus',
        'mining_efficiency_bonus',
        'user_energy_regen',
        'game_energy_regen',
        'mining_energy_regen',
        'user_max_energy',
        'game_max_energy',
        'mining_max_energy',
        'user_current_energy',
        'game_current_energy',
        'mining_current_energy',
        'user_miners_active',
        'game_miners_active',
        'mining_miners_active',
        'user_total_earned_24h',
        'game_total_earned_24h',
        'mining_total_earned_24h',
        'user_total_earned_7d',
        'game_total_earned_7d',
        'mining_total_earned_7d',
        'user_total_points_earned',
        'game_total_points_earned',
        'mining_total_points_earned',
        'user_upgrades_purchased',
        'game_upgrades_purchased',
        'mining_upgrades_purchased',
        'user_last_save_time',
        'game_last_save_time',
        'mining_last_save_time',
        'user_session_start_time',
        'game_session_start_time',
        'mining_session_start_time',
        'user_last_daily_reset',
        'game_last_daily_reset',
        'mining_last_daily_reset',
        'user_last_weekly_reset',
        'game_last_weekly_reset',
        'mining_last_weekly_reset',
        'user_version',
        'game_version',
        'mining_version',
        'user_all_time_high_score',
        'game_all_time_high_score',
        'mining_all_time_high_score',
        'user_mining_experience_to_next',
        'game_mining_experience_to_next',
        'mining_mining_experience_to_next'
      ];
      
      // Clear ALL possible keys
      let clearedKeys = 0;
      allPossibleKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedKeys++;
          console.log(`🗑️ Cleared key: ${key}`);
        }
      });
      
      // Step 3: Pattern-based clearing
      console.log('Step 3: Pattern-based clearing...');
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes(telegramId) || 
            key.includes('divine') || 
            key.includes('mining') || 
            key.includes('game') || 
            key.includes('user') ||
            key.includes('frog') ||
            key.includes('spiritual')) {
          localStorage.removeItem(key);
          clearedKeys++;
          console.log(`🗑️ Cleared matching key: ${key}`);
        }
      });
      
      console.log(`✅ Cleared ${clearedKeys} total keys from localStorage`);
      
      // Step 4: Clear sessionStorage
      console.log('Step 4: Clearing sessionStorage...');
      sessionStorage.clear();
      console.log('🗑️ Cleared all sessionStorage');
      
      // Step 5: Clear browser cache
      console.log('Step 5: Clearing browser cache...');
      if (window.caches) {
        try {
          const cacheNames = await caches.keys();
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
            console.log(`🗑️ Cleared cache: ${cacheName}`);
          });
        } catch (cacheError) {
          console.warn('⚠️ Cache clearing failed:', cacheError);
        }
      }
      
      // Step 6: Clear Supabase data
      console.log('Step 6: Clearing Supabase data...');
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', user.telegram_id)
          .single();

        if (!userError && userData) {
          console.log('🗑️ Clearing all Supabase data for user:', userData.id);
          
          // Clear all possible Supabase tables
          const tablesToClear = [
            'user_game_data',
            'user_achievements',
            'user_upgrades',
            'user_statistics',
            'user_referrals',
            'user_daily_rewards',
            'user_tasks',
            'user_boosts'
          ];
          
          for (const table of tablesToClear) {
            try {
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userData.id);
              
              if (deleteError && deleteError.code !== 'PGRST116') {
                console.warn(`Failed to clear ${table}:`, deleteError);
              } else {
                console.log(`✅ Cleared ${table}`);
              }
            } catch (error) {
              console.log(`ℹ️ ${table} table not found or already empty`);
            }
          }
          
          console.log('✅ All Supabase data cleared for user:', userData.id);
        } else {
          console.warn('⚠️ User not found in Supabase, skipping database clear');
        }
      } catch (supabaseError) {
        console.warn('Supabase clear error (non-critical):', supabaseError);
      }
      
      // Step 7: Reset game state to initial values
      console.log('Step 7: Resetting game state...');
      const initialState: GameState = {
        divinePoints: 100,
        pointsPerSecond: 1.0,
        totalEarned24h: 0,
        totalEarned7d: 0,
        upgradesPurchased: 0,
        minersActive: 1,
        isMining: false,
        lastSaveTime: Date.now(),
        sessionStartTime: Date.now(),
        totalPointsEarned: 0,
        lastDailyReset: new Date().toDateString(),
        lastWeeklyReset: new Date().toDateString(),
        version: GAME_VERSION,
        highScore: 100,
        allTimeHighScore: 100,
        currentEnergy: 1000,
        maxEnergy: 1000,
        lastEnergyRegen: Date.now(),
        offlineEfficiencyBonus: 0,
        lastOfflineTime: Date.now(),
        unclaimedOfflineRewards: 0,
        lastOfflineRewardTime: Date.now(),
        miningLevel: 1,
        miningCombo: 1.0,
        miningStreak: 0,
        miningExperience: 0,
        miningExperienceToNext: 1000
      };
      
      // Reset upgrades to initial state
      const initialUpgrades = getInitialUpgrades();
      
      // Reset achievements to initial state
      const initialAchievements = getInitialAchievements();
      
      // Update all state
      setGameState(initialState);
      setUpgrades(initialUpgrades);
      setAchievements(initialAchievements);
      setHasLoadedSavedData(false);
      setIsInitialLoadComplete(false);
      
      // Reset tutorial state
      const resetTutorialState: TutorialState = {
        isActive: false,
        currentStep: 0,
        steps: tutorialSteps,
        isCompleted: false,
        showTutorial: false,
        highlightElement: null
      };
      setTutorialState(resetTutorialState);
      
      // Reset UI state
      setShowUpgradeShop(false);
      setShowOfflineRewards(false);
      setCurrentUpgradePage(1);
      setUpgradeFilter('all');
      
      // Step 8: Save initial state to localStorage with ALL user-specific keys
      console.log('Step 8: Saving initial state...');
      const userSaveKey = getUserSpecificKey(SAVE_KEY);
      const userBackupKey = getUserSpecificKey(BACKUP_KEY);
      const userDivinePointsKey = getUserSpecificKey(DIVINE_POINTS_KEY);
      const userTotalEarnedKey = getUserSpecificKey(TOTAL_EARNED_KEY);
      const userSessionKey = getUserSpecificKey(SESSION_KEY);
      const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
      const userUpgradesKey = getUserSpecificKey(UPGRADES_KEY);
      const userHighScoreKey = getUserSpecificKey(HIGH_SCORE_KEY);
      const userTutorialKey = getUserSpecificKey(TUTORIAL_KEY);
      
      // Save main game data
      localStorage.setItem(userSaveKey, JSON.stringify(initialState));
      localStorage.setItem(userBackupKey, JSON.stringify(initialState));
      localStorage.setItem(userDivinePointsKey, '100');
      localStorage.setItem(userTotalEarnedKey, '0');
      localStorage.setItem(userHighScoreKey, '100');
      localStorage.setItem(userAchievementsKey, JSON.stringify(initialAchievements));
      localStorage.setItem(userUpgradesKey, JSON.stringify(initialUpgrades));
      localStorage.setItem(userTutorialKey, JSON.stringify(resetTutorialState));
      
      // Save session data
      const sessionData = {
        sessionStartTime: Date.now(),
        lastDailyReset: new Date().toDateString(),
        lastWeeklyReset: new Date().toDateString(),
        lastSaveTime: Date.now(),
        version: GAME_VERSION
      };
      localStorage.setItem(userSessionKey, JSON.stringify(sessionData));
      
      // Reset GameContext data (shared context)
      setPoints(100);
      
      // Reset additional GameContext data
      const userGemsKey = `divineMiningGems_${telegramId}`;
      const userBoostsKey = `divineMiningBoosts_${telegramId}`;
      const userStreakKey = `divineMiningStreak_${telegramId}`;
      const userReferralKey = `divineMiningReferralData_${telegramId}`;
      const userTasksKey = `divineMiningCompletedTasks_${telegramId}`;
      const userPrestigeKey = `divineMiningPrestigeMultiplier_${telegramId}`;
      
      // Save initial values for GameContext
      localStorage.setItem(userGemsKey, '10'); // Default gems
      localStorage.setItem(userBoostsKey, '[]'); // Empty boosts array
      localStorage.setItem(userStreakKey, JSON.stringify({
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
      }));
      localStorage.setItem(userReferralKey, JSON.stringify({
        code: '',
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
        rewards: { points: 0, gems: 0, special: [] },
        referrals: [],
        level: 1,
        nextLevelReward: ''
      }));
      localStorage.setItem(userTasksKey, '[]'); // Empty completed tasks
      localStorage.setItem(userPrestigeKey, '1.0'); // Default prestige multiplier
      
      // Clear any mining intervals
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
        miningIntervalRef.current = undefined;
      }
      
      // Step 9: Save initial state to Supabase to ensure clean start
      console.log('Step 9: Saving initial state to Supabase...');
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', user.telegram_id)
          .single();

        if (!userError && userData) {
          const initialSupabaseState = {
            user_id: userData.id,
            game_data: {
              divinePoints: 100,
              pointsPerSecond: 1.0,
              totalEarned24h: 0,
              totalEarned7d: 0,
              upgradesPurchased: 0,
              minersActive: 1,
              isMining: false,
              lastSaveTime: Date.now(),
              sessionStartTime: Date.now(),
              totalPointsEarned: 0,
              lastDailyReset: new Date().toDateString(),
              lastWeeklyReset: new Date().toDateString(),
              version: GAME_VERSION,
              highScore: 100,
              allTimeHighScore: 100,
              currentEnergy: 1000,
              maxEnergy: 1000,
              lastEnergyRegen: Date.now(),
              offlineEfficiencyBonus: 0,
              lastOfflineTime: Date.now(),
              unclaimedOfflineRewards: 0,
              lastOfflineRewardTime: Date.now(),
              miningLevel: 1,
              miningCombo: 1.0,
              miningStreak: 0,
              miningExperience: 0,
              miningExperienceToNext: 1000,
              upgrades: initialUpgrades,
              achievements: initialAchievements
            },
            last_updated: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('user_game_data')
            .upsert(initialSupabaseState, {
              onConflict: 'user_id'
            });

          if (insertError) {
            console.warn('Failed to save initial state to Supabase:', insertError);
          } else {
            console.log('✅ Initial state saved to Supabase for fresh start');
          }
        }
      } catch (supabaseError) {
        console.warn('Supabase initial state save error (non-critical):', supabaseError);
      }
      
      // Step 10: Set reset flag and force reload
      console.log('Step 10: Setting reset flag and preparing reload...');
      localStorage.setItem(`RESET_FLAG_${telegramId}`, Date.now().toString());
      
      // Show success notification
      showSystemNotification(
        'Reset Complete!', 
        'All your data has been reset to initial state. Page will reload in 2 seconds...', 
        'success'
      );
      
      console.log('✅ Comprehensive user data reset completed successfully');
      
      // Force a hard reload to ensure all components are reset
      setTimeout(() => {
        // Clear the reset flag before reloading
        localStorage.removeItem(`RESET_FLAG_${telegramId}`);
        // Force a hard reload without cache
        window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Reset failed:', error);
      showSystemNotification(
        'Reset Failed', 
        'Failed to reset data. Please try again or contact support.', 
        'error'
      );
    } finally {
      setIsResetting(false);
      setShowResetConfirmation(false);
    }
  }, [user?.telegram_id, showSystemNotification, setPoints, getUserSpecificKey]);

  // const migrateLocalToSupabase = useCallback(() => {
  //   setIsSavingToDatabase(true);
  //   // Simulate sync process
  //   setTimeout(() => {
  //     setIsSavingToDatabase(false);
  //     showSystemNotification('Sync Complete', 'Your save has been synced to the cloud!', 'success');
  //   }, 2000);
  // }, [showSystemNotification]);

  // const handleDivinePointsClick = useCallback((event: React.MouseEvent) => {
  //   const rect = event.currentTarget.getBoundingClientRect();
  //   const x = ((event.clientX - rect.left) / rect.width) * 100;
  //   const y = ((event.clientY - rect.top) / rect.height) * 100;
    
  //   setClickEffect({ x, y, timestamp: Date.now() });
    
  //   // Clear click effect after animation
  //   setTimeout(() => setClickEffect(null), 1000);
  // }, []);

  // const formatNumberWithEmoji = useCallback((num: number): string => {
  //   if (num >= 1000000000) {
  //     return (num / 1000000000).toFixed(1) + 'B 💎';
  //   } else if (num >= 1000000) {
  //     return (num / 1000000).toFixed(1) + 'M 🏆';
  //   } else if (num >= 1000) {
  //     return (num / 1000).toFixed(1) + 'K ⭐';
  //   }
  //   return Math.floor(num).toString();
  // }, []);

  const getFilterDisplayName = useCallback((filter: string): string => {
    switch (filter) {
      case 'all': return 'ALL';
      case 'affordable': return 'AFFORDABLE';
      case 'recommended': return 'RECOMMENDED';
      case 'chakra': return '🌱 CHAKRA';
      case 'mastery': return '🧘 MASTERY';
      case 'meditation': return '🧘‍♀️ MEDITATION';
      case 'cosmic': return '🌟 COSMIC';
      case 'elemental': return '⚡ ELEMENTAL';
      default: return filter.toUpperCase();
    }
  }, []);

  // Add missing helper functions for upgrade categories
  const getUpgradeCategoryName = useCallback((category: string): string => {
    switch (category) {
      case 'chakra': return '🌱 CHAKRA';
      case 'mastery': return '🧘 MASTERY';
      case 'meditation': return '🧘‍♀️ MEDITATION';
      case 'cosmic': return '🌟 COSMIC';
      case 'elemental': return '⚡ ELEMENTAL';
      default: return category.toUpperCase();
    }
  }, []);

  const getUpgradeCategoryColor = useCallback((category: string): string => {
    switch (category) {
      case 'chakra': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'mastery': return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
      case 'meditation': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'cosmic': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'elemental': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  }, []);



  // const getAvailableCategories = useCallback((): string[] => {
  //   return ['all', 'mining', 'energy', 'special'];
  // }, []);

  // const getCategoryDisplayName = useCallback((category: string): string => {
  //   switch (category) {
  //     case 'all': return 'ALL';
  //     case 'mining': return 'MINING';
  //     case 'energy': return 'ENERGY';
  //     case 'special': return 'SPECIAL';
  //     default: return category.toUpperCase();
  //   }
  // }, []);

  // const getUpgradeCategoryBg = useCallback((category: string): string => {
  //   switch (category) {
  //     case 'mining': return 'bg-green-900/20';
  //     case 'energy': return 'bg-blue-900/20';
  //     case 'special': return 'bg-purple-900/20';
  //     default: return 'bg-gray-900/20';
  //   }
  // }, []);

  // const getUpgradeCategoryColor = useCallback((category: string): string => {
  //   switch (category) {
  //     case 'mining': return 'text-green-400 border-green-400';
  //     case 'energy': return 'text-blue-400 border-blue-400';
  //     case 'special': return 'text-purple-400 border-purple-400';
  //     default: return 'text-gray-400 border-gray-400';
  //   }
  // }, []);

  // const getUpgradeCategory = useCallback((upgrade: Upgrade): string => {
  //   if (upgrade.id.includes('mining')) return 'mining';
  //   if (upgrade.id.includes('energy')) return 'energy';
  //   if (upgrade.id.includes('auto') || upgrade.id.includes('divine')) return 'special';
  //   return 'other';
  // }, []);

  // // Check if player is new
  // useEffect(() => {
  //   // This will be set up properly once gameState is defined
  //   setIsNewPlayer(false);
  // }, []);

  // Load achievements from localStorage or use defaults (user-specific)
  const getInitialAchievements = useCallback((): Achievement[] => {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first-mining',
        name: 'First Mining',
        description: 'Start mining for the first time',
        condition: (state) => state.totalPointsEarned > 0,
        unlocked: false
      },
      {
        id: 'first-upgrade',
        name: 'First Upgrade',
        description: 'Purchase your first upgrade',
        condition: (state) => state.upgradesPurchased >= 1,
        unlocked: false
      },
      {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Reach 10 points per second',
        condition: (state) => state.pointsPerSecond >= 10,
        unlocked: false
      },
      {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Earn 1,000,000 total points',
        condition: (state) => state.totalPointsEarned >= 1000000,
        unlocked: false
      },
      {
        id: 'upgrade-master',
        name: 'Upgrade Master',
        description: 'Purchase 50 upgrades',
        condition: (state) => state.upgradesPurchased >= 50,
        unlocked: false
      }
    ];

    try {
      const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
      const savedAchievements = localStorage.getItem(userAchievementsKey);
      
      if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('Loaded achievements from localStorage:', parsed);
          
          // Merge with default achievements to ensure all achievements exist
          const mergedAchievements = defaultAchievements.map(defaultAchievement => {
            const savedAchievement = parsed.find(a => a.id === defaultAchievement.id);
            return savedAchievement ? { ...defaultAchievement, ...savedAchievement } : defaultAchievement;
          });
          
          return mergedAchievements;
        }
      }
    } catch (error) {
      console.error('Error loading achievements from localStorage:', error);
    }
    
    console.log('Using default achievements');
    return defaultAchievements;
  }, [getUserSpecificKey]);

  // Add achievements state
  const [achievements, setAchievements] = useState<Achievement[]>(getInitialAchievements);

  // Add missing functions
  const getInitialState = useCallback((): GameState => {
    // Check for reset flag - if present, return fresh state
    if (user?.telegram_id) {
      const telegramId = String(user.telegram_id);
      const resetFlag = localStorage.getItem(`RESET_FLAG_${telegramId}`);
      const urlParams = new URLSearchParams(window.location.search);
      const resetParam = urlParams.get('reset');
      
      if (resetFlag || resetParam) {
        console.log('🔄 Reset detected in getInitialState, returning fresh state');
        return {
          divinePoints: 100,
          pointsPerSecond: 1.0,
          totalEarned24h: 0,
          totalEarned7d: 0,
          upgradesPurchased: 0,
          minersActive: 1,
          isMining: false,
          lastSaveTime: Date.now(),
          sessionStartTime: Date.now(),
          totalPointsEarned: 0,
          lastDailyReset: new Date().toDateString(),
          lastWeeklyReset: new Date().toDateString(),
          version: GAME_VERSION,
          highScore: 100,
          allTimeHighScore: 100,
          currentEnergy: 1000,
          maxEnergy: 1000,
          lastEnergyRegen: Date.now(),
          offlineEfficiencyBonus: 0,
          lastOfflineTime: Date.now(),
          unclaimedOfflineRewards: 0,
          lastOfflineRewardTime: Date.now(),
          miningLevel: 1,
          miningCombo: 1.0,
          miningStreak: 0,
          miningExperience: 0,
          miningExperienceToNext: 1000
        };
      }
    }
    
    // Load all-time high score from localStorage using user-specific key
    const userHighScoreKey = getUserSpecificKey(HIGH_SCORE_KEY);
    const allTimeHighScore = parseInt(localStorage.getItem(userHighScoreKey) || '100', 10);
    
    // Load divine points from separate localStorage key (user-specific)
    const userDivinePointsKey = getUserSpecificKey(DIVINE_POINTS_KEY);
    const savedDivinePoints = parseInt(localStorage.getItem(userDivinePointsKey) || '100', 10);
    
    // Load total earned from separate localStorage key (user-specific)
    const userTotalEarnedKey = getUserSpecificKey(TOTAL_EARNED_KEY);
    const savedTotalEarned = parseInt(localStorage.getItem(userTotalEarnedKey) || '0', 10);
    
    // Load session data from separate localStorage key (user-specific)
    const userSessionKey = getUserSpecificKey(SESSION_KEY);
    const savedSessionData = localStorage.getItem(userSessionKey);
    let sessionStartTime = Date.now();
    let lastDailyReset = new Date().toDateString();
    let lastWeeklyReset = new Date().toDateString();
    
    if (savedSessionData) {
      try {
        const session = JSON.parse(savedSessionData);
        sessionStartTime = session.sessionStartTime || Date.now();
        lastDailyReset = session.lastDailyReset || new Date().toDateString();
        lastWeeklyReset = session.lastWeeklyReset || new Date().toDateString();
        console.log('Loaded session data:', session);
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    }
    
    // Load prestige multiplier (user-specific)
    const userPrestigeKey = getUserSpecificKey('divineMiningPrestigeMultiplier');
    const prestigeMultiplier = parseFloat(localStorage.getItem(userPrestigeKey) || '1.0');
    
    const defaultState: GameState = {
      divinePoints: Math.max(100, savedDivinePoints),
      pointsPerSecond: 1.0 * prestigeMultiplier,
      totalEarned24h: 0,
      totalEarned7d: 0,
      upgradesPurchased: 0,
      minersActive: 1,
      isMining: false,
      lastSaveTime: Date.now(),
      sessionStartTime: sessionStartTime,
      totalPointsEarned: Math.max(0, savedTotalEarned),
      lastDailyReset: lastDailyReset,
      lastWeeklyReset: lastWeeklyReset,
      version: GAME_VERSION,
      highScore: Math.max(100, allTimeHighScore),
      allTimeHighScore: allTimeHighScore,
      currentEnergy: 1000,
      maxEnergy: 1000,
      lastEnergyRegen: Date.now(),
      offlineEfficiencyBonus: 0, // New: Bonus for offline mining
      lastOfflineTime: Date.now(), // New: Track last offline time
      unclaimedOfflineRewards: 0, // New: Track unclaimed offline rewards
      lastOfflineRewardTime: Date.now(), // New: Track when offline rewards were last calculated
      miningLevel: 1,
      miningCombo: 1.0,
      miningStreak: 0,
      miningExperience: 0,
      miningExperienceToNext: 1000
    };

    try {
      // Try to load main save (user-specific)
      const userSaveKey = getUserSpecificKey(SAVE_KEY);
      const saved = localStorage.getItem(userSaveKey);
      console.log('Raw saved data:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Parsed saved data:', parsed);
        
        // Validate the saved data
        if (validateGameState(parsed)) {
          const now = Date.now();
          const timeDiff = now - parsed.lastSaveTime;
          
          console.log('Loading saved game state:', {
            divinePoints: parsed.divinePoints,
            pointsPerSecond: parsed.pointsPerSecond,
            isMining: parsed.isMining,
            lastSaveTime: new Date(parsed.lastSaveTime).toLocaleString()
          });
          
          // Calculate offline earnings (if mining was active and reasonable time passed)
          let offlineEarnings = 0;
          let offlineEnergyRegen = 0;
          let offlineEfficiencyBonus = 0;
          let unclaimedRewards = 0;
          
          if (parsed.isMining && timeDiff > 0 && timeDiff < OFFLINE_EFFICIENCY_CAP * 24 * 60 * 60 * 1000) { // Max 14 days
            // Calculate base offline earnings
            const baseOfflineEarnings = parsed.pointsPerSecond * (timeDiff / 1000);
            
            // Calculate offline efficiency bonus (10% per day, max 140%)
            const daysOffline = Math.min(timeDiff / (24 * 60 * 60 * 1000), OFFLINE_EFFICIENCY_CAP);
            offlineEfficiencyBonus = Math.min(daysOffline * OFFLINE_EFFICIENCY_BONUS, 1.4);
            
            // Apply efficiency bonus to offline earnings
            offlineEarnings = baseOfflineEarnings * (1 + offlineEfficiencyBonus);
            
            // Calculate energy regeneration during offline time
            const energyRegenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
            const energyBurstUpgrades = upgrades.filter(u => u.id === 'energy-burst');
            const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
            const burstBonus = energyBurstUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
            const baseRegen = 0.3; // Reduced base regen for better balance
            const totalRegen = baseRegen + regenBonus + burstBonus;
            offlineEnergyRegen = totalRegen * (timeDiff / 1000);
            
            // Add to unclaimed rewards instead of immediately adding to points
            unclaimedRewards = parsed.unclaimedOfflineRewards || 0;
            unclaimedRewards += offlineEarnings;
            
            console.log(`Offline earnings: ${offlineEarnings.toFixed(2)} points (${baseOfflineEarnings.toFixed(2)} base + ${(offlineEfficiencyBonus * 100).toFixed(1)}% bonus) over ${Math.floor(timeDiff / 1000 / 60)} minutes`);
            console.log(`Offline energy regen: ${offlineEnergyRegen.toFixed(2)} energy`);
            console.log(`Total unclaimed rewards: ${unclaimedRewards.toFixed(2)} points`);
            
            // Set mining resumed flag
            // setMiningResumed(true);
            
            // Show offline rewards notification
            if (offlineEarnings > 0) {
              // const bonusText = offlineEfficiencyBonus > 0 ? ` (+${(offlineEfficiencyBonus * 100).toFixed(1)}% offline bonus)` : '';
              // setOfflineRewardNotification(`🎁 You have ${Math.floor(unclaimedRewards)} unclaimed offline rewards!${bonusText}`);
              setShowOfflineRewards(true);
            }
          }
          
          const loadedState = {
            ...parsed,
            divinePoints: parsed.divinePoints, // Don't add offline earnings immediately
            lastSaveTime: now,
            sessionStartTime: parsed.sessionStartTime || sessionStartTime,
            totalPointsEarned: Math.max(parsed.totalPointsEarned || 0, savedTotalEarned), // Don't add offline earnings to total yet
            version: GAME_VERSION,
            highScore: Math.max(parsed.highScore || 100, allTimeHighScore),
            allTimeHighScore: Math.max(parsed.allTimeHighScore || 100, allTimeHighScore),
            currentEnergy: Math.min(parsed.maxEnergy || 1000, parsed.currentEnergy + offlineEnergyRegen),
            offlineEfficiencyBonus: parsed.offlineEfficiencyBonus || 0,
            lastOfflineTime: parsed.lastOfflineTime || now,
            lastDailyReset: parsed.lastDailyReset || lastDailyReset,
            lastWeeklyReset: parsed.lastWeeklyReset || lastWeeklyReset,
            unclaimedOfflineRewards: unclaimedRewards,
            lastOfflineRewardTime: now,
            miningLevel: parsed.miningLevel || 1,
            miningCombo: parsed.miningCombo || 1.0,
            miningStreak: parsed.miningStreak || 0,
            miningExperience: parsed.miningExperience || 0,
            miningExperienceToNext: parsed.miningExperienceToNext || 1000
          };
          
          console.log('Final loaded state:', {
            divinePoints: loadedState.divinePoints,
            pointsPerSecond: loadedState.pointsPerSecond,
            isMining: loadedState.isMining,
            highScore: loadedState.highScore,
            allTimeHighScore: loadedState.allTimeHighScore
          });
          
          // Mark that we've loaded saved data
          setHasLoadedSavedData(true);
          
          return loadedState;
        } else {
          console.warn('Invalid saved game state, trying backup...');
          console.log('Validation failed for:', parsed);
          throw new Error('Invalid saved state');
        }
      } else {
        console.log('No saved data found in localStorage');
      }
    } catch (error) {
      console.error('Error loading main save:', error);
      
      // Try to load backup (user-specific)
      try {
        const userBackupKey = getUserSpecificKey(BACKUP_KEY);
        const backup = localStorage.getItem(userBackupKey);
        console.log('Backup data:', backup);
        
        if (backup) {
          const parsedBackup = JSON.parse(backup);
          if (validateGameState(parsedBackup)) {
            console.log('Recovered from backup');
            setSaveMessage('Game recovered from backup');
            return {
              ...parsedBackup,
              lastSaveTime: Date.now(),
              version: GAME_VERSION,
              highScore: Math.max(parsedBackup.highScore || 100, allTimeHighScore),
              allTimeHighScore: Math.max(parsedBackup.allTimeHighScore || 100, allTimeHighScore)
            };
          }
        }
      } catch (backupError) {
        console.error('Error loading backup:', backupError);
      }
      
      console.log('No valid save data found, starting fresh game');
      setSaveMessage('Starting fresh game');
    }
    
    return defaultState;
  }, [getUserSpecificKey]);

  // Game state validation - IMPROVED VERSION
  const validateGameState = (state: any): state is GameState => {
    if (!state || typeof state !== 'object') return false;
    
    const requiredFields = [
      'divinePoints', 'pointsPerSecond', 'totalEarned24h', 'totalEarned7d',
      'upgradesPurchased', 'minersActive', 'isMining', 'lastSaveTime',
      'sessionStartTime', 'totalPointsEarned'
    ];
    
    // Check required fields exist and are numbers
    for (const field of requiredFields) {
      if (state[field] === undefined || state[field] === null) {
        console.warn(`Missing field: ${field}`);
        return false;
      }
      if (typeof state[field] !== 'number') {
        console.warn(`Invalid field type: ${field} should be number, got ${typeof state[field]}`);
        return false;
      }
    }
    
    if (typeof state.isMining !== 'boolean') {
      console.warn('isMining should be boolean');
      return false;
    }
    
    // More lenient validation - allow reasonable ranges
    if (state.divinePoints < 0) {
      console.warn('divinePoints cannot be negative');
      return false;
    }
    
    if (state.pointsPerSecond < 0) {
      console.warn('pointsPerSecond cannot be negative');
      return false;
    }
    
    // Allow negative values for earned stats (they might be reset)
    if (state.totalEarned24h < 0) state.totalEarned24h = 0;
    if (state.totalEarned7d < 0) state.totalEarned7d = 0;
    if (state.totalPointsEarned < 0) state.totalPointsEarned = 0;
    if (state.upgradesPurchased < 0) state.upgradesPurchased = 0;
    if (state.minersActive < 0) state.minersActive = 1;
    
    console.log('Game state validation passed');
    return true;
  };

  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  
  // Add debug function to show user-specific data
  const debugUserData = useCallback(() => {
    if (!user?.telegram_id) {
      console.log('❌ No user found for debug');
      return;
    }

    const telegramId = String(user.telegram_id);
    console.log('=== USER DATA DEBUG ===');
    console.log('User ID:', telegramId);
    console.log('Current Game State:', {
      divinePoints: gameState.divinePoints,
      pointsPerSecond: gameState.pointsPerSecond,
      upgradesPurchased: gameState.upgradesPurchased,
      isMining: gameState.isMining,
      highScore: gameState.highScore,
      allTimeHighScore: gameState.allTimeHighScore
    });

    // Check user-specific keys
    const userKeys = [
      getUserSpecificKey(SAVE_KEY),
      getUserSpecificKey(BACKUP_KEY),
      getUserSpecificKey(DIVINE_POINTS_KEY),
      getUserSpecificKey(TOTAL_EARNED_KEY),
      getUserSpecificKey(SESSION_KEY),
      getUserSpecificKey(ACHIEVEMENTS_KEY),
      getUserSpecificKey(UPGRADES_KEY),
      getUserSpecificKey(HIGH_SCORE_KEY),
      getUserSpecificKey(TUTORIAL_KEY)
    ];

    console.log('User-Specific Keys:');
    userKeys.forEach(key => {
      const data = localStorage.getItem(key);
      console.log(`${key}: ${data ? '✅ Has data' : '❌ No data'}`);
    });

    // Check for non-user-specific keys
    const allKeys = Object.keys(localStorage);
    const nonUserSpecificKeys = allKeys.filter(key => 
      key.startsWith('divineMining') && 
      !key.includes(`_${telegramId}`) &&
      localStorage.getItem(key)
    );

    if (nonUserSpecificKeys.length > 0) {
      console.warn('⚠️ Found non-user-specific keys:', nonUserSpecificKeys);
    } else {
      console.log('✅ No non-user-specific keys found');
    }

    console.log('=== END DEBUG ===');
  }, [user?.telegram_id, gameState, getUserSpecificKey]);
  
  // Tutorial System State (user-specific)
  const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
    const userTutorialKey = getUserSpecificKey(TUTORIAL_KEY);
    const savedTutorial = localStorage.getItem(userTutorialKey);
    if (savedTutorial) {
      try {
        return JSON.parse(savedTutorial);
      } catch (error) {
        console.error('Error loading tutorial state:', error);
      }
    }
    
    return {
      isActive: false,
      currentStep: 0,
      steps: [],
      isCompleted: false,
      showTutorial: false,
      highlightElement: null
    };
  });

  // Add function to clear corrupted data
  const clearCorruptedData = useCallback(() => {
    if (!user?.telegram_id) return;
    
    console.log('🧹 Clearing potentially corrupted data...');
    
    // Clear all user-specific keys that might be corrupted
    const userKeys = [
      getUserSpecificKey(SAVE_KEY),
      getUserSpecificKey(BACKUP_KEY),
      getUserSpecificKey(DIVINE_POINTS_KEY),
      getUserSpecificKey(TOTAL_EARNED_KEY),
      getUserSpecificKey(SESSION_KEY),
      getUserSpecificKey(ACHIEVEMENTS_KEY),
      getUserSpecificKey(UPGRADES_KEY),
      getUserSpecificKey(HIGH_SCORE_KEY),
      getUserSpecificKey(TUTORIAL_KEY)
    ];
    
    let clearedCount = 0;
    userKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          // Try to parse the data to see if it's valid JSON
          JSON.parse(data);
          console.log(`✅ ${key}: Valid data`);
        }
      } catch (error) {
        console.warn(`🗑️ Clearing corrupted data in ${key}:`, error);
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} corrupted data entries`);
      showSystemNotification(
        'Data Cleanup', 
        `Cleared ${clearedCount} corrupted data entries. Game will start fresh.`, 
        'info'
      );
    } else {
      console.log('✅ No corrupted data found');
    }
  }, [user?.telegram_id, getUserSpecificKey, showSystemNotification]);

  // Add effect to ensure user data isolation on mount
  useEffect(() => {
    if (user?.telegram_id && isInitialLoadComplete) {
      // Clear any corrupted data first
      clearCorruptedData();
      
      // Debug user data isolation
      debugUserData();
      
      // Validate user data isolation
      const validation = validateUserDataIsolation(String(user.telegram_id));
      if (!validation.isValid) {
        console.warn('⚠️ User data isolation validation failed:', validation.issues);
      }
      
      // Check for data leakage
      const leakage = checkForDataLeakage(String(user.telegram_id));
      if (leakage.hasLeakage) {
        console.warn('⚠️ Data leakage detected:', leakage.issues);
      }
    }
  }, [user?.telegram_id, isInitialLoadComplete, debugUserData, clearCorruptedData]);

  // Tutorial Steps Definition
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Divine Mining!',
      description: 'This tutorial will guide you through the basics of mining divine points. Let\'s start by understanding your main resource.',
      target: '.divine-points-display',
      position: 'center',
      action: 'info'
    },
    {
      id: 'divine-points',
      title: 'Divine Points',
      description: 'These are your main currency. You earn them by mining, and spend them on upgrades. Watch the number increase as you mine!',
      target: '.divine-points-display',
      position: 'bottom',
      action: 'info'
    },
    {
      id: 'mining-station',
      title: 'Mining Station',
      description: 'This is where the magic happens! Click "ACTIVATE MINING" to start earning points. The glowing core shows mining status.',
      target: '.mining-station',
      position: 'bottom',
      action: 'click'
    },
    {
      id: 'energy-system',
      title: 'Energy System',
      description: 'Mining consumes energy (red bar). When energy runs out, mining stops. Energy regenerates over time (blue text).',
      target: '.energy-status',
      position: 'top',
      action: 'info'
    },
    {
      id: 'first-mine',
      title: 'Start Mining!',
      description: 'Click the "ACTIVATE MINING" button to start earning points. Watch your divine points increase!',
      target: '.mining-button',
      position: 'bottom',
      action: 'click',
      condition: (state) => !state.isMining
    },
    {
      id: 'mining-active',
      title: 'Mining Active!',
      description: 'Great! You\'re now mining. Notice how your points increase and energy decreases. The core glows when active.',
      target: '.mining-station',
      position: 'bottom',
      action: 'info',
      condition: (state) => state.isMining
    },
    {
      id: 'upgrades-intro',
      title: 'Upgrades',
      description: 'Upgrades make you more efficient. They increase mining speed, energy capacity, and unlock new features.',
      target: '.upgrades-section',
      position: 'top',
      action: 'info'
    },
    {
      id: 'first-upgrade',
      title: 'Buy Your First Upgrade',
      description: 'Try buying "MINING SPEED" upgrade. It will increase how many points you earn per second!',
      target: '.upgrade-mining-speed',
      position: 'right',
      action: 'click',
      condition: (state) => state.divinePoints >= 25
    },
    {
      id: 'upgrade-effect',
      title: 'Upgrade Effect',
      description: 'Notice how your mining rate increased! Upgrades stack, so buy more to become even more powerful.',
      target: '.divine-points-display',
      position: 'bottom',
      action: 'info',
      condition: (state) => state.upgradesPurchased > 0
    },
    {
      id: 'energy-upgrades',
      title: 'Energy Management',
      description: 'Energy upgrades are crucial! They reduce energy costs and increase regeneration. Invest in them early.',
      target: '.upgrade-energy-efficiency',
      position: 'right',
      action: 'info'
    },
    {
      id: 'auto-mining',
      title: 'Auto-Mining',
      description: 'Auto-mining automatically starts mining when you have enough energy. It\'s a game-changer!',
      target: '.upgrade-auto-mining',
      position: 'right',
      action: 'info'
    },
    {
      id: 'offline-rewards',
      title: 'Offline Rewards',
      description: 'You earn points even when the game is closed! Longer offline time = bigger bonuses (up to 140%).',
      target: '.offline-predictions',
      position: 'top',
      action: 'info',
      condition: (state) => state.isMining
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Complete milestones to unlock achievements. They provide bonuses and track your progress.',
      target: '.achievements-section',
      position: 'top',
      action: 'info',
      condition: (state) => state.totalPointsEarned > 0
    },
    {
      id: 'statistics',
      title: 'Statistics',
      description: 'Track your progress here. Session time, total earned, and efficiency stats help you optimize your strategy.',
      target: '.statistics-section',
      position: 'top',
      action: 'info'
    },
    {
      id: 'help-system',
      title: 'Help & Tips',
      description: 'Click "SHOW HELP" anytime for detailed game mechanics and pro tips. The debug menu has advanced features.',
      target: '.help-button',
      position: 'left',
      action: 'info'
    },
    {
      id: 'tutorial-complete',
      title: 'Tutorial Complete!',
      description: 'You\'re ready to become a Divine Mining master! Remember: balance mining speed with energy efficiency for optimal results.',
      target: '.divine-points-display',
      position: 'center',
      action: 'info'
    }
  ];

  // Tutorial System Functions
  const startTutorial = useCallback(() => {
    console.log('Starting tutorial with steps:', tutorialSteps.length);
    setTutorialState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      steps: tutorialSteps,
      showTutorial: true,
      highlightElement: tutorialSteps[0]?.target || null
    }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setTutorialState(prev => {
      const nextStep = prev.currentStep + 1;
      if (nextStep >= prev.steps.length) {
        // Tutorial complete
        const completedState = {
          ...prev,
          isActive: false,
          isCompleted: true,
          showTutorial: false,
          highlightElement: null
        };
        localStorage.setItem(TUTORIAL_KEY, JSON.stringify(completedState));
        return completedState;
      }
      
      const newState = {
        ...prev,
        currentStep: nextStep,
        highlightElement: prev.steps[nextStep]?.target || null
      };
      const userTutorialKey = getUserSpecificKey(TUTORIAL_KEY);
      localStorage.setItem(userTutorialKey, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const skipTutorial = useCallback(() => {
    const completedState = {
      ...tutorialState,
      isActive: false,
      isCompleted: true,
      showTutorial: false,
      highlightElement: null
    };
    setTutorialState(completedState);
    const userTutorialKey = getUserSpecificKey(TUTORIAL_KEY);
    localStorage.setItem(userTutorialKey, JSON.stringify(completedState));
  }, [tutorialState, getUserSpecificKey]);

  // const resetTutorial = useCallback(() => {
  //   const resetState = {
  //     isActive: false,
  //     currentStep: 0,
  //     steps: tutorialSteps,
  //     isCompleted: false,
  //     showTutorial: false,
  //     highlightElement: null
  //   };
  //   setTutorialState(resetState);
  //   localStorage.removeItem(TUTORIAL_KEY);
  // }, []);

  // Check if tutorial should be shown
  useEffect(() => {
    const shouldShowTutorial = !tutorialState.isCompleted && 
                              gameState.divinePoints <= 100 && 
                              gameState.upgradesPurchased === 0;
    
    console.log('Tutorial check:', {
      isCompleted: tutorialState.isCompleted,
      divinePoints: gameState.divinePoints,
      upgradesPurchased: gameState.upgradesPurchased,
      shouldShowTutorial,
      isActive: tutorialState.isActive
    });
    
    if (shouldShowTutorial && !tutorialState.isActive) {
      // Auto-start tutorial for new players
      console.log('Auto-starting tutorial...');
      setTimeout(() => {
        startTutorial();
      }, 2000); // Wait 2 seconds for game to load
    }
  }, [gameState.divinePoints, gameState.upgradesPurchased, tutorialState.isCompleted, tutorialState.isActive, startTutorial]);

  // Tutorial step validation
  useEffect(() => {
    if (!tutorialState.isActive || !tutorialState.steps[tutorialState.currentStep]) return;

    const currentStep = tutorialState.steps[tutorialState.currentStep];
    
    // Check if step should be skipped
    if (currentStep.skipIf && currentStep.skipIf(gameState)) {
      nextTutorialStep();
      return;
    }
    
    // Check if step condition is met and auto-advance for info steps
    if (currentStep.condition && currentStep.condition(gameState)) {
      // Auto-advance after a short delay for info steps
      if (currentStep.action === 'info') {
        const timer = setTimeout(() => {
          nextTutorialStep();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [tutorialState.currentStep, tutorialState.isActive, gameState, nextTutorialStep]);

  // Tutorial Overlay Component
  const TutorialOverlay = () => {
    if (!tutorialState.showTutorial || !tutorialState.steps[tutorialState.currentStep]) {
      console.log('Tutorial overlay not showing:', {
        showTutorial: tutorialState.showTutorial,
        currentStep: tutorialState.currentStep,
        stepsLength: tutorialState.steps.length
      });
      return null;
    }

    const currentStep = tutorialState.steps[tutorialState.currentStep];
    const targetElement = document.querySelector(currentStep.target);

    if (!targetElement) {
      console.log('Target element not found:', currentStep.target);
      return null;
    }

    console.log('Tutorial overlay rendering for step:', currentStep.id, 'target:', currentStep.target);

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const getTooltipPosition = () => {
      const baseTop = rect.top + scrollTop;
      const baseLeft = rect.left + scrollLeft;
      const elementWidth = rect.width;
      const elementHeight = rect.height;

      switch (currentStep.position) {
        case 'top':
          return {
            top: baseTop - 120,
            left: baseLeft + elementWidth / 2 - 150,
            transform: 'translateY(-10px)'
          };
        case 'bottom':
          return {
            top: baseTop + elementHeight + 10,
            left: baseLeft + elementWidth / 2 - 150,
            transform: 'translateY(10px)'
          };
        case 'left':
          return {
            top: baseTop + elementHeight / 2 - 60,
            left: baseLeft - 320,
            transform: 'translateX(-10px)'
          };
        case 'right':
          return {
            top: baseTop + elementHeight / 2 - 60,
            left: baseLeft + elementWidth + 10,
            transform: 'translateX(10px)'
          };
        case 'center':
        default:
          return {
            top: baseTop + elementHeight / 2 - 60,
            left: baseLeft + elementWidth / 2 - 150,
            transform: 'translateY(0)'
          };
      }
    };

    const position = getTooltipPosition();

    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-40" onClick={nextTutorialStep} />
        
        {/* Highlight */}
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: rect.top + scrollTop - 5,
            left: rect.left + scrollLeft - 5,
            width: rect.width + 10,
            height: rect.height + 10,
            border: '3px solid #00ffff',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
            animation: 'tutorial-pulse 2s ease-in-out infinite'
          }}
        />
        
        {/* Tooltip */}
        <div 
          className="fixed z-50 bg-black/90 backdrop-blur-xl border border-cyan-400 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.3)] max-w-sm"
          style={position}
        >
          <div className="text-cyan-400 font-mono font-bold text-sm mb-2">
            {currentStep.title}
          </div>
          <div className="text-gray-300 font-mono text-xs mb-3">
            {currentStep.description}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-cyan-500 font-mono text-xs">
              Step {tutorialState.currentStep + 1} of {tutorialState.steps.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={skipTutorial}
                className="text-xs text-gray-400 hover:text-red-400 font-mono px-2 py-1 rounded border border-gray-600 hover:border-red-400 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={nextTutorialStep}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono px-3 py-1 rounded border border-cyan-400 hover:border-cyan-300 transition-colors"
              >
                {tutorialState.currentStep === tutorialState.steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Tutorial CSS Animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tutorial-pulse {
        0%, 100% {
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
          border-color: #00ffff;
        }
        50% {
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.9);
          border-color: #00ccff;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  // Sync mining game points with shared context - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    // Update the shared context with our points
    setPoints(gameState.divinePoints);

    // Save divine points to localStorage immediately whenever they change (user-specific)
    const userDivinePointsKey = getUserSpecificKey(DIVINE_POINTS_KEY);
    localStorage.setItem(userDivinePointsKey, gameState.divinePoints.toString());

    // Check for new high score
    if (gameState.divinePoints > gameState.highScore) {
      const newHighScore = gameState.divinePoints;
      setGameState(prev => ({
        ...prev,
        highScore: newHighScore,
        allTimeHighScore: Math.max(prev.allTimeHighScore, newHighScore)
      }));
      
      // Save high score to localStorage immediately using user-specific key
      const userHighScoreKey = getUserSpecificKey(HIGH_SCORE_KEY);
      localStorage.setItem(userHighScoreKey, newHighScore.toString());
      
      // Show high score notification only when NOT mining (to avoid spam)
      if (!gameState.isMining) {
      if (newHighScore > gameState.allTimeHighScore) {
        showSystemNotification(
          '🎉 NEW ALL-TIME HIGH SCORE!',
          `${newHighScore.toLocaleString()} points`,
          'success'
        );
      } else {
        showSystemNotification(
          '🏆 New High Score!',
          `${newHighScore.toLocaleString()} points`,
          'success'
        );
        }
      }
    }
  }, [gameState.divinePoints, setPoints, gameState.highScore, gameState.allTimeHighScore, getUserSpecificKey]);

  // Listen for global gem updates to ensure perfect synchronization
  useEffect(() => {
    const handleGemUpdate = (event: CustomEvent) => {
      const { gems: newGems } = event.detail;
      console.log('🔄 DivineMiningGame received gem update:', newGems);
      // The gems are already updated in GameContext, this is just for logging/debugging
    };

    // Listen for global gem update events
    window.addEventListener('gemsUpdated', handleGemUpdate as EventListener);

    return () => {
      window.removeEventListener('gemsUpdated', handleGemUpdate as EventListener);
    };
  }, []);

  // Enhanced referral notification system
  useEffect(() => {
    const handleReferralProcessed = (event: CustomEvent) => {
      const { success, message, startParam } = event.detail;
      
      if (success) {
        // Show success notification
        showSystemNotification(
          '🎉 Welcome to DivineTap!',
          message,
          'success'
        );
        
        // Give welcome bonus
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            divinePoints: prev.divinePoints + 1000
          }));
          
          showSystemNotification(
            '💎 Welcome Bonus!',
            '+1000 Divine Points for joining through referral!',
            'success'
          );
        }, 2000);
        
        console.log('✅ Referral processed successfully:', startParam);
      } else {
        // Show error notification
        showSystemNotification(
          '⚠️ Referral Notice',
          message,
          'warning'
        );
        
        console.log('❌ Referral processing failed:', message);
      }
    };
    
    // Listen for referral processing events
    window.addEventListener('referralProcessed', handleReferralProcessed as EventListener);
    
    return () => {
      window.removeEventListener('referralProcessed', handleReferralProcessed as EventListener);
    };
  }, [showSystemNotification]);

  // Log gem value for debugging synchronization
  useEffect(() => {
    console.log('💎 DivineMiningGame sees gem value:', gems);
  }, [gems]);

  // Apply active boosts to mining rate (enhanced version moved after upgrades)
  const getBoostedMiningRate = useCallback(() => {
    const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
    const totalMultiplier = miningBoosts.reduce((sum, boost) => {
      const multiplier = Number(boost.multiplier);
      return sum + (isNaN(multiplier) ? 1 : multiplier);
    }, 1);
    const baseRate = Number(gameState.pointsPerSecond);
    return (isNaN(baseRate) ? 1.0 : baseRate) * totalMultiplier;
  }, [gameState.pointsPerSecond, activeBoosts]);

  // // Calculate offline mining rate with boosts and efficiency bonus
  // const getOfflineMiningRate = useCallback(() => {
  //   const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
  //   const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
  //   const baseRate = gameState.pointsPerSecond * totalMultiplier;
    
  //   // Apply offline efficiency bonus
  //   const offlineBonus = gameState.offlineEfficiencyBonus || 0;
  //   return baseRate * (1 + offlineBonus);
  // }, [gameState.pointsPerSecond, gameState.offlineEfficiencyBonus, activeBoosts]);



  // Load upgrades from localStorage or use defaults (user-specific)
  const getInitialUpgrades = (): Upgrade[] => {
    try {
      const userUpgradesKey = getUserSpecificKey(UPGRADES_KEY);
      const savedUpgrades = localStorage.getItem(userUpgradesKey);
      if (savedUpgrades) {
        const parsed = JSON.parse(savedUpgrades);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate and fix upgrade data
          const validatedUpgrades = parsed.map(upgrade => {
            // Ensure all required fields exist
            const validatedUpgrade = {
              id: upgrade.id || 'unknown',
              name: upgrade.name || 'Unknown Upgrade',
              level: Math.max(0, Math.min(upgrade.level || 0, upgrade.maxLevel || 50)),
              effect: upgrade.effect || '+0 effect',
              baseCost: Math.max(1, upgrade.baseCost || 25),
              costMultiplier: Math.max(1.01, upgrade.costMultiplier || 1.12),
              effectValue: upgrade.effectValue || 0,
              category: upgrade.category || 'chakra',
              description: upgrade.description || 'An upgrade',
              requires: upgrade.requires || undefined,
              detailedDescription: upgrade.detailedDescription || upgrade.description || 'An upgrade',
              benefits: upgrade.benefits || ['No benefits listed'],
              tips: upgrade.tips || ['No tips available'],
              unlockProgress: Math.max(0, Math.min(100, upgrade.unlockProgress || 0)),
              maxLevel: Math.max(1, upgrade.maxLevel || 50),
              unlockReward: upgrade.unlockReward || 'No reward'
            };
            
            // Log any fixes made
            if (upgrade.level !== validatedUpgrade.level || upgrade.baseCost !== validatedUpgrade.baseCost || upgrade.costMultiplier !== validatedUpgrade.costMultiplier) {
              console.log(`Fixed upgrade data for ${upgrade.name}:`, {
                original: { level: upgrade.level, baseCost: upgrade.baseCost, costMultiplier: upgrade.costMultiplier },
                fixed: { level: validatedUpgrade.level, baseCost: validatedUpgrade.baseCost, costMultiplier: validatedUpgrade.costMultiplier }
              });
            }
            
            return validatedUpgrade;
          });
          
          console.log('Loaded and validated upgrades from localStorage:', validatedUpgrades);
          return validatedUpgrades;
        }
      }
    } catch (error) {
      console.error('Error loading upgrades from localStorage:', error);
    }
    
    // Spiritual progression upgrades - unlocking different parts of the soul
    return [
      // 🌱 ROOT CHAKRA - Foundation & Grounding
      {
        id: 'root-chakra',
        name: '🌱 ROOT CHAKRA',
        level: 0,
        effect: '+0.5 wisdom/sec (Grounding)',
        baseCost: 25,
        costMultiplier: 1.12,
        effectValue: 0.5,
        category: 'chakra',
        description: 'Unlock your foundation - stability and security',
        maxLevel: 20,
        unlockReward: 'Unlock the ability to use cosmic upgrades',
        benefits: ['+200% mining efficiency', '+150% energy regeneration', 'Exclusive cosmic upgrades', 'Divine resonance bonus'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade unlocks the ability to use cosmic upgrades, which are powerful and unique. As you progress through the tiers, you\'ll gain access to more advanced features and bonuses. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'earth-connection',
        name: '🌍 EARTH CONNECTION',
        level: 0,
        effect: '+50 spiritual capacity',
        baseCost: 75,
        costMultiplier: 1.15,
        effectValue: 50,
        category: 'chakra',
        description: 'Deepen your connection to Mother Earth',
        maxLevel: 10,
        unlockReward: 'Unlock the ability to use solar plexus upgrades',
        benefits: ['+50% spiritual capacity', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade deepens your connection to Mother Earth, increasing your spiritual capacity and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 🧘 SACRAL CHAKRA - Creativity & Flow
      {
        id: 'sacral-chakra',
        name: '🧘 SACRAL CHAKRA',
        level: 0,
        effect: '+1.0 wisdom/sec (Creativity)',
        baseCost: 200,
        costMultiplier: 1.18,
        effectValue: 1.0,
        category: 'chakra',
        description: 'Awaken your creative energy and emotional flow',
        requires: { upgrade: 'root-chakra', level: 3 },
        maxLevel: 15,
        unlockReward: 'Unlock the ability to use heart chakra upgrades',
        benefits: ['+100% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade awakens your creative energy and emotional flow, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'flow-state',
        name: '🌊 FLOW STATE',
        level: 0,
        effect: 'Auto-meditation when ready',
        baseCost: 500000,
        costMultiplier: 2.0,
        effectValue: 1,
        category: 'chakra',
        description: 'Enter automatic meditation when conditions are perfect',
        requires: { upgrade: 'sacral-chakra', level: 5 },
        maxLevel: 1,
        unlockReward: 'Unlock the ability to use energy mastery upgrades',
        benefits: ['Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade allows you to enter automatic meditation when your energy levels are high, providing a consistent boost to your mining rate. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 💪 SOLAR PLEXUS - Willpower & Confidence
      {
        id: 'solar-plexus',
        name: '💪 SOLAR PLEXUS',
        level: 0,
        effect: '+2.0 wisdom/sec (Willpower)',
        baseCost: 750,
        costMultiplier: 1.22,
        effectValue: 2.0,
        category: 'chakra',
        description: 'Strengthen your personal power and confidence',
        requires: { upgrade: 'sacral-chakra', level: 3 },
        maxLevel: 12,
        unlockReward: 'Unlock the ability to use air element upgrades',
        benefits: ['+200% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade strengthens your personal power and confidence, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'inner-strength',
        name: '⚡ INNER STRENGTH',
        level: 0,
        effect: '-10% energy cost',
        baseCost: 50000,
        costMultiplier: 1.5,
        effectValue: -0.1,
        category: 'chakra',
        description: 'Harness your inner power for greater efficiency',
        requires: { upgrade: 'solar-plexus', level: 3 },
        maxLevel: 8,
        unlockReward: 'Unlock the ability to use energy mastery upgrades',
        benefits: ['-10% energy cost', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade harnesses your inner power, reducing energy costs and increasing your energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 💚 HEART CHAKRA - Love & Compassion
      {
        id: 'heart-chakra',
        name: '💚 HEART CHAKRA',
        level: 0,
        effect: '+5.0 wisdom/sec (Love)',
        baseCost: 3000,
        costMultiplier: 1.25,
        effectValue: 5.0,
        category: 'chakra',
        description: 'Open your heart to universal love and compassion',
        requires: { upgrade: 'solar-plexus', level: 5 },
        maxLevel: 10,
        unlockReward: 'Unlock the ability to use cosmic consciousness upgrades',
        benefits: ['+500% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade opens your heart to universal love and compassion, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'compassion-resonance',
        name: '💝 COMPASSION RESONANCE',
        level: 0,
        effect: '+50% boost effectiveness',
        baseCost: 1000000,
        costMultiplier: 2.5,
        effectValue: 0.5,
        category: 'chakra',
        description: 'Your love amplifies all spiritual practices',
        requires: { upgrade: 'heart-chakra', level: 5 },
        maxLevel: 5,
        unlockReward: 'Unlock the ability to use throat chakra upgrades',
        benefits: ['+50% boost effectiveness', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade amplifies the effectiveness of your boosts, increasing your energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 🗣️ THROAT CHAKRA - Communication & Truth
      {
        id: 'throat-chakra',
        name: '🗣️ THROAT CHAKRA',
        level: 0,
        effect: '+10.0 wisdom/sec (Truth)',
        baseCost: 10000,
        costMultiplier: 1.3,
        effectValue: 10.0,
        category: 'chakra',
        description: 'Speak your truth and manifest through vibration',
        requires: { upgrade: 'heart-chakra', level: 5 },
        maxLevel: 8,
        unlockReward: 'Unlock the ability to use vibrational harmony upgrades',
        benefits: ['+100% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade allows you to speak your truth and manifest through vibration, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'vibrational-harmony',
        name: '🎵 VIBRATIONAL HARMONY',
        level: 0,
        effect: '+2000 max energy',
        baseCost: 75000,
        costMultiplier: 1.6,
        effectValue: 2000,
        category: 'chakra',
        description: 'Your voice resonates with cosmic frequencies',
        requires: { upgrade: 'throat-chakra', level: 3 },
        maxLevel: 6,
        unlockReward: 'Unlock the ability to use third eye upgrades',
        benefits: ['+2000 max energy', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade increases your max energy and your energy regeneration, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 👁️ THIRD EYE - Intuition & Insight
      {
        id: 'third-eye',
        name: '👁️ THIRD EYE',
        level: 0,
        effect: '+25.0 wisdom/sec (Insight)',
        baseCost: 50000,
        costMultiplier: 1.35,
        effectValue: 25.0,
        category: 'chakra',
        description: 'Open your inner eye to see beyond the veil',
        requires: { upgrade: 'throat-chakra', level: 5 },
        maxLevel: 6,
        unlockReward: 'Unlock the ability to use psychic awareness upgrades',
        benefits: ['+25% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade opens your inner eye, increasing your intuition and insight, and boosting your mining rate. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'psychic-awareness',
        name: '🔮 PSYCHIC AWARENESS',
        level: 0,
        effect: '+1.0 energy/sec',
        baseCost: 100000,
        costMultiplier: 1.7,
        effectValue: 1.0,
        category: 'chakra',
        description: 'Your intuition guides your spiritual journey',
        requires: { upgrade: 'third-eye', level: 3 },
        maxLevel: 10,
        unlockReward: 'Unlock the ability to use crown chakra upgrades',
        benefits: ['+100% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade increases your wisdom and energy regeneration, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 👑 CROWN CHAKRA - Enlightenment & Unity
      {
        id: 'crown-chakra',
        name: '👑 CROWN CHAKRA',
        level: 0,
        effect: '+100.0 wisdom/sec (Enlightenment)',
        baseCost: 250000,
        costMultiplier: 1.4,
        effectValue: 100.0,
        category: 'chakra',
        description: 'Connect to divine consciousness and universal wisdom',
        requires: { upgrade: 'third-eye', level: 7 },
        maxLevel: 5,
        unlockReward: 'Unlock the ability to use cosmic consciousness upgrades',
        benefits: ['+5% offline bonus', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade connects you to divine consciousness and universal wisdom, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'cosmic-consciousness',
        name: '🌟 COSMIC CONSCIOUSNESS',
        level: 0,
        effect: '+5% offline bonus',
        baseCost: 150000,
        costMultiplier: 1.8,
        effectValue: 0.05,
        category: 'chakra',
        description: 'Your consciousness transcends time and space',
        maxLevel: 3,
        unlockReward: 'Unlock the ability to use cosmic upgrades',
        benefits: ['+5% offline bonus', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade transcends time and space, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 🧘‍♀️ ADVANCED PRACTICES - Mastery
      {
        id: 'energy-mastery',
        name: '🧘‍♀️ ENERGY MASTERY',
        level: 0,
        effect: '-30% energy cost',
        baseCost: 5000000,
        costMultiplier: 4.0,
        effectValue: -0.3,
        category: 'mastery',
        description: 'Master the flow of spiritual energy',
        maxLevel: 3,
        unlockReward: 'Unlock the ability to use energy mastery upgrades',
        benefits: ['-30% energy cost', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade masters the flow of spiritual energy, reducing energy costs and increasing your energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'divine-resonance',
        name: '✨ DIVINE RESONANCE',
        level: 0,
        effect: '+2.0 energy/sec',
        baseCost: 3000000,
        costMultiplier: 3.5,
        effectValue: 2.0,
        category: 'mastery',
        description: 'Resonate with the divine frequency',
        maxLevel: 5,
        unlockReward: 'Unlock the ability to use divine resonance upgrades',
        benefits: ['+200% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade resonates with the divine frequency, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'transcendence',
        name: '🚀 TRANSCENDENCE',
        level: 0,
        effect: '+5000 max energy',
        baseCost: 2000000,
        costMultiplier: 3.0,
        effectValue: 5000,
        category: 'mastery',
        description: 'Transcend physical limitations',
        maxLevel: 1,
        unlockReward: 'Unlock the ability to use transcendence upgrades',
        benefits: ['+5000 max energy', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade transcends physical limitations, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 🧘‍♀️ MEDITATION PRACTICES - Inner Peace & Focus
      {
        id: 'mindful-breathing',
        name: '🫁 MINDFUL BREATHING',
        level: 0,
        effect: '+0.3 energy/sec',
        baseCost: 150,
        costMultiplier: 1.14,
        effectValue: 0.3,
        category: 'meditation',
        description: 'Master the art of conscious breathing',
        maxLevel: 15,
        unlockReward: 'Unlock the ability to use mindful breathing upgrades',
        benefits: ['+30% energy/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade masters the art of conscious breathing, increasing your energy regeneration and boosting your mining rate. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'zen-focus',
        name: '🎯 ZEN FOCUS',
        level: 0,
        effect: '+1.5 wisdom/sec',
        baseCost: 400,
        costMultiplier: 1.16,
        effectValue: 1.5,
        category: 'meditation',
        description: 'Achieve perfect mental clarity',
        maxLevel: 10,
        unlockReward: 'Unlock the ability to use zen focus upgrades',
        benefits: ['+150% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade improves your mental clarity, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'aura-purification',
        name: '✨ AURA PURIFICATION',
        level: 0,
        effect: '-15% energy cost',
        baseCost: 25000,
        costMultiplier: 1.4,
        effectValue: -0.15,
        category: 'meditation',
        description: 'Purify your spiritual aura',
        maxLevel: 8,
        unlockReward: 'Unlock the ability to use aura purification upgrades',
        benefits: ['-15% energy cost', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade purifies your spiritual aura, reducing energy costs and increasing your energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'kundalini-awakening',
        name: '🐍 KUNDALINI AWAKENING',
        level: 0,
        effect: '+50.0 wisdom/sec',
        baseCost: 1000000,
        costMultiplier: 2.0,
        effectValue: 50.0,
        category: 'meditation',
        description: 'Awaken your serpent power',
        maxLevel: 3,
        unlockReward: 'Unlock the ability to use kundalini awakening upgrades',
        benefits: ['+500% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade awakens your serpent power, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // 🌟 COSMIC POWERS - Beyond Physical Reality
      {
        id: 'quantum-leap',
        name: '⚛️ QUANTUM LEAP',
        level: 0,
        effect: '+1000% wisdom/sec',
        baseCost: 10000000,
        costMultiplier: 5.0,
        effectValue: 1000.0,
        category: 'cosmic',
        description: 'Transcend quantum limitations',
        maxLevel: 1,
        unlockReward: 'Unlock the ability to use quantum leap upgrades',
        benefits: ['+1000% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade transcends quantum limitations, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'time-dilation',
        name: '⏰ TIME DILATION',
        level: 0,
        effect: '+10% offline bonus',
        baseCost: 500000,
        costMultiplier: 2.5,
        effectValue: 0.1,
        category: 'cosmic',
        description: 'Bend the fabric of time',
        maxLevel: 5,
        unlockReward: 'Unlock the ability to use time dilation upgrades',
        benefits: ['+10% offline bonus', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade bends the fabric of time, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'space-bending',
        name: '🌌 SPACE BENDING',
        level: 0,
        effect: '+3000 max energy',
        baseCost: 750000,
        costMultiplier: 2.2,
        effectValue: 3000,
        category: 'cosmic',
        description: 'Manipulate spatial dimensions',
        maxLevel: 3,
        unlockReward: 'Unlock the ability to use space bending upgrades',
        benefits: ['+3000 max energy', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade manipulates spatial dimensions, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'reality-shift',
        name: '🌀 REALITY SHIFT',
        level: 0,
        effect: '+500% all bonuses',
        baseCost: 5000000,
        costMultiplier: 10.0,
        effectValue: 5.0,
        category: 'cosmic',
        description: 'Shift to a higher reality',
        maxLevel: 1,
        unlockReward: 'Unlock the ability to use reality shift upgrades',
        benefits: ['+500% all bonuses', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade shifts to a higher reality, allowing you to mine for longer periods. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      
      // ⚡ ELEMENTAL MASTERY - Natural Forces
      {
        id: 'fire-element',
        name: '🔥 FIRE ELEMENT',
        level: 0,
        effect: '+3.0 wisdom/sec',
        baseCost: 600,
        costMultiplier: 1.2,
        effectValue: 3.0,
        category: 'elemental',
        description: 'Harness the power of fire',
        maxLevel: 12,
        unlockReward: 'Unlock the ability to use fire element upgrades',
        benefits: ['+300% wisdom/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade harnesses the power of fire, increasing your wisdom and energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'water-element',
        name: '💧 WATER ELEMENT',
        level: 0,
        effect: '+2.0 energy/sec',
        baseCost: 800,
        costMultiplier: 1.18,
        effectValue: 2.0,
        category: 'elemental',
        description: 'Flow like water',
        maxLevel: 10,
        unlockReward: 'Unlock the ability to use water element upgrades',
        benefits: ['+200% energy/sec', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade allows you to flow like water, increasing your energy regeneration. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'earth-element',
        name: '🌍 EARTH ELEMENT',
        level: 0,
        effect: '+1000 max energy',
        baseCost: 1200,
        costMultiplier: 1.25,
        effectValue: 1000,
        category: 'elemental',
        description: 'Stand firm like a mountain',
        maxLevel: 8,
        unlockReward: 'Unlock the ability to use earth element upgrades',
        benefits: ['+1000 max energy', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade allows you to stand firm like a mountain, increasing your max energy. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      },
      {
        id: 'air-element',
        name: '💨 AIR ELEMENT',
        level: 0,
        effect: '-20% energy cost',
        baseCost: 2000,
        costMultiplier: 1.3,
        effectValue: -0.2,
        category: 'elemental',
        description: 'Move freely like the wind',
        maxLevel: 6,
        unlockReward: 'Unlock the ability to use air element upgrades',
        benefits: ['-20% energy cost', 'Increased energy regeneration', 'Enhanced auto-mining'],
        tips: ['Higher tiers provide better bonuses and upgrades', 'Focus on energy efficiency for longer sessions', 'Auto-mining improves with tier level'],
        unlockProgress: 0,
        detailedDescription: 'This upgrade allows you to move freely like the wind, reducing energy costs. Higher tiers provide better bonuses and upgrades, and auto-mining improves with tier level. Focus on energy efficiency for longer sessions to maximize your earnings.'
      }
    ];
  };

  const [upgrades, setUpgrades] = useState<Upgrade[]>(getInitialUpgrades);

  // Add isUpgradeAvailable function after upgrades state is defined
  const isUpgradeAvailable = useCallback((upgrade: Upgrade): boolean => {
    if (!upgrade.requires) return true;
    
    const requiredUpgrade = upgrades.find(u => u.id === upgrade.requires!.upgrade);
    if (!requiredUpgrade) return false;
    
    return requiredUpgrade.level >= upgrade.requires!.level;
  }, [upgrades]);

  // Add getUpgradeCost function early to prevent linter errors
  const getUpgradeCost = useCallback((upgrade: Upgrade): number => {
    const baseCost = Number(upgrade.baseCost);
    const costMultiplier = Number(upgrade.costMultiplier);
    const level = Number(upgrade.level);
    
    const validBaseCost = isNaN(baseCost) ? 25 : baseCost;
    const validCostMultiplier = isNaN(costMultiplier) ? 1.12 : costMultiplier;
    const validLevel = isNaN(level) ? 0 : level;
    
    return Math.floor(validBaseCost * Math.pow(validCostMultiplier, validLevel));
  }, []);

  // Add missing upgrade functions after upgrades are defined
  const isUpgradeMaxed = useCallback((upgrade: Upgrade): boolean => {
    // Use the maxLevel property from the upgrade definition
    const maxLevel = upgrade.maxLevel || 50;
    return upgrade.level >= maxLevel;
  }, []);

  const getUpgradeEfficiency = useCallback((upgrade: Upgrade): number => {
    const cost = getUpgradeCost(upgrade);
    const effectValue = Number(upgrade.effectValue);
    const validEffectValue = isNaN(effectValue) ? 0 : effectValue;
    const validCost = isNaN(cost) ? 1 : cost;
    return validEffectValue / validCost * 1000; // Points per 1000 cost
  }, []);


  const getFilteredUpgrades = useCallback((): Upgrade[] => {
    let filtered = [...upgrades];
    
    switch (upgradeFilter) {
      case 'affordable':
        filtered = filtered.filter(upgrade => {
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
          return gameState.divinePoints >= cost;
        });
        break;
      case 'recommended':
        filtered = filtered.filter(upgrade => 
          getUpgradeEfficiency(upgrade) > 0.1 && !isUpgradeMaxed(upgrade)
        );
        break;
      // case 'category':
      //   if (selectedCategory !== 'all') {
      //     filtered = filtered.filter(upgrade => {
      //       const category = getUpgradeCategory(upgrade);
      //       return category === selectedCategory;
      //     });
      //   }
        break;
    }
    
    return filtered;
  }, [upgrades, upgradeFilter, getUpgradeEfficiency, isUpgradeMaxed, gameState.divinePoints]);

  const getTotalPages = useCallback((): number => {
    return Math.ceil(getFilteredUpgrades().length / upgradesPerPage);
  }, [getFilteredUpgrades]);

  const getPaginatedUpgrades = useCallback((): Upgrade[] => {
    const filtered = getFilteredUpgrades();
    const startIndex = (currentUpgradePage - 1) * upgradesPerPage;
    const endIndex = startIndex + upgradesPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredUpgrades, currentUpgradePage]);

  // // Calculate potential offline earnings
  // const getPotentialOfflineEarnings = useCallback((hoursOffline: number = 24) => {
  //   const secondsOffline = hoursOffline * 60 * 60;
  //   const baseEarnings = getOfflineMiningRate() * secondsOffline;
    
  //   // Calculate efficiency bonus for the time period
  //   const daysOffline = hoursOffline / 24;
  //   const efficiencyBonus = Math.min(daysOffline * OFFLINE_EFFICIENCY_BONUS, 1.4);
    
  //   return {
  //     baseEarnings,
  //     efficiencyBonus,
  //     totalEarnings: baseEarnings * (1 + efficiencyBonus),
  //     energyRegen: (0.5 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0)) * secondsOffline
  //   };
  // }, [getOfflineMiningRate, upgrades]);

  // Enhanced mining rate calculation with divine resonance
  const getEnhancedMiningRate = useCallback(() => {
    const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
    const baseMultiplier = miningBoosts.reduce((sum, boost) => {
      const multiplier = Number(boost.multiplier);
      return sum + (isNaN(multiplier) ? 1 : multiplier);
    }, 1);
    
    // Apply divine resonance upgrade to boost effectiveness
    const divineResonanceUpgrades = upgrades.filter(u => u.id === 'divine-resonance');
    const resonanceBonus = divineResonanceUpgrades.reduce((sum, u) => {
      const effectValue = Number(u.effectValue);
      const level = Number(u.level);
      return sum + ((isNaN(effectValue) ? 0 : effectValue) * (isNaN(level) ? 0 : level));
    }, 0);
    const enhancedMultiplier = baseMultiplier * (1 + (isNaN(resonanceBonus) ? 0 : resonanceBonus));
    
    const baseRate = Number(gameState.pointsPerSecond);
    return (isNaN(baseRate) ? 1.0 : baseRate) * enhancedMultiplier;
  }, [gameState.pointsPerSecond, activeBoosts, upgrades]);

  // Calculate energy regeneration rate including upgrades
  const getEnergyRegenerationRate = useCallback(() => {
    const baseRegenRate = 0.5; // Base energy regeneration per second
    
    // Add energy regeneration upgrades
    const energyRegenUpgrades = upgrades.filter(u => 
      ['psychic-awareness', 'divine-resonance', 'mindful-breathing', 'water-element'].includes(u.id)
    );
    
    const regenBonus = energyRegenUpgrades.reduce((sum, u) => {
      const effectValue = Number(u.effectValue);
      const level = Number(u.level);
      return sum + ((isNaN(effectValue) ? 0 : effectValue) * (isNaN(level) ? 0 : level));
    }, 0);
    
    return baseRegenRate + regenBonus;
  }, [upgrades]);

  // Calculate energy efficiency bonus from upgrades
  const getEnergyEfficiencyBonus = useCallback(() => {
    const efficiencyUpgrades = upgrades.filter(u => 
      ['inner-strength', 'aura-purification', 'energy-mastery', 'air-element'].includes(u.id)
    );
    
    const efficiencyBonus = efficiencyUpgrades.reduce((sum, u) => {
      const effectValue = Number(u.effectValue);
      const level = Number(u.level);
      return sum + ((isNaN(effectValue) ? 0 : effectValue) * (isNaN(level) ? 0 : level));
    }, 0);
    
    return Math.max(-0.95, efficiencyBonus); // Cap at -95% to prevent negative energy costs
  }, [upgrades]);

  // Sync game state with loaded upgrades on initialization - IMPROVED VERSION
  useEffect(() => {
    // Calculate total effect from all upgrades, properly categorized
    const totalPointsPerSecondEffect = upgrades.reduce((sum, upgrade) => {
      const effectValue = Number(upgrade.effectValue);
      const level = Number(upgrade.level);
      const validEffectValue = isNaN(effectValue) ? 0 : effectValue;
      const validLevel = isNaN(level) ? 0 : level;
      
      // Only count upgrades that affect points per second (most upgrades)
      const isPPSUpgrade = !['energy-capacity', 'energy-overflow', 'vibrational-harmony', 'transcendence', 
                            'space-bending', 'earth-element', 'inner-strength', 'aura-purification', 
                            'energy-mastery', 'air-element', 'psychic-awareness', 'divine-resonance', 
                            'mindful-breathing', 'water-element', 'cosmic-consciousness', 'time-dilation', 
                            'reality-shift'].includes(upgrade.id);
      
      return sum + (isPPSUpgrade ? validEffectValue * validLevel : 0);
    }, 0);
    
    const totalOfflineBonusEffect = upgrades.reduce((sum, upgrade) => {
      const effectValue = Number(upgrade.effectValue);
      const level = Number(upgrade.level);
      const validEffectValue = isNaN(effectValue) ? 0 : effectValue;
      const validLevel = isNaN(level) ? 0 : level;
      
      // Only count offline bonus upgrades
      const isOfflineUpgrade = ['cosmic-consciousness', 'time-dilation'].includes(upgrade.id);
      
      return sum + (isOfflineUpgrade ? validEffectValue * validLevel : 0);
    }, 0);
    
    const totalUpgradesPurchased = upgrades.reduce((sum, upgrade) => {
      const level = Number(upgrade.level);
      return sum + (isNaN(level) ? 0 : level);
    }, 0);
    
    setGameState(prev => {
      const newPointsPerSecond = 1.0 + totalPointsPerSecondEffect;
      const newOfflineBonus = totalOfflineBonusEffect;
      const newUpgradesPurchased = totalUpgradesPurchased;
      
      console.log('Upgrade sync check:', {
        currentPPS: prev.pointsPerSecond,
        newPPS: newPointsPerSecond,
        currentOfflineBonus: prev.offlineEfficiencyBonus,
        newOfflineBonus: newOfflineBonus,
        currentUpgrades: prev.upgradesPurchased,
        newUpgrades: newUpgradesPurchased,
        currentPoints: prev.divinePoints,
        hasLoadedSavedData: hasLoadedSavedData,
        isFreshStart: prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0
      });
      
      // CRITICAL FIX: Only sync upgrades if this is a fresh start
      // Never overwrite saved data with upgrade calculations
      const isFreshStart = prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0;
      const hasValidSavedData = prev.divinePoints > 100 && prev.pointsPerSecond > 1.0;
      
      if (isFreshStart && !hasValidSavedData) {
        console.log('🔄 Fresh start detected, applying upgrade calculations');
        console.log(`PPS ${prev.pointsPerSecond} -> ${newPointsPerSecond}, Offline Bonus ${prev.offlineEfficiencyBonus} -> ${newOfflineBonus}, Upgrades ${prev.upgradesPurchased} -> ${newUpgradesPurchased}`);
        return {
          ...prev,
          pointsPerSecond: newPointsPerSecond,
          offlineEfficiencyBonus: newOfflineBonus,
          upgradesPurchased: newUpgradesPurchased
        };
      } else {
        console.log('⏭️ Skipping upgrade sync - preserving saved state');
        return prev;
      }
    });
  }, [upgrades, hasLoadedSavedData]); // Run when upgrades change

  // Set loaded flag when we have valid saved data
  useEffect(() => {
    if (gameState.divinePoints > 100 && !hasLoadedSavedData) {
      console.log('✅ Detected valid saved data, setting loaded flag');
      setHasLoadedSavedData(true);
    }
  }, [gameState.divinePoints, hasLoadedSavedData]);

  // Auto-detect and fix loading issues
  useEffect(() => {
    if (isInitialLoadComplete && !isLoading) {
      // Check for common loading issues
      const issues = [];
      
      if (upgrades.length === 0) {
        issues.push('No upgrades loaded');
      }
      
      if (gameState.pointsPerSecond <= 1.0 && upgrades.some(u => u.level > 0)) {
        issues.push('Upgrade effects not applied to PPS');
      }
      
      if (issues.length > 0) {
        console.warn('⚠️ Auto-detected loading issues:', issues);
        showSystemNotification(
          'Loading Issues Detected', 
          `Issues found: ${issues.join(', ')}. Use the RELOAD UPGRADES button to fix.`, 
          'warning'
        );
      } else {
        console.log('✅ Auto-check: All systems appear to be loading correctly');
      }
    }
  }, [isInitialLoadComplete, isLoading, upgrades, gameState.pointsPerSecond, showSystemNotification]);

  // CRITICAL FIX: Prevent data reversion by ensuring saved data is preserved
  useEffect(() => {
    // Only run this effect after we've loaded saved data
    if (!hasLoadedSavedData) return;
    
    // If we have valid saved data, ensure it's not overwritten
    if (gameState.divinePoints > 100) {
      console.log('🔒 Preserving saved data:', {
        divinePoints: gameState.divinePoints,
        pointsPerSecond: gameState.pointsPerSecond,
        upgradesPurchased: gameState.upgradesPurchased
      });
      
      // Force save to ensure data persistence
      setTimeout(() => {
        saveDivineMiningState();
      }, 1000);
    }
  }, [hasLoadedSavedData, gameState.divinePoints]);

  // Immediate save on mount to ensure current state is preserved
  useEffect(() => {
    // Only save if we have valid saved data loaded, not if we're starting fresh
    if (hasLoadedSavedData && gameState.divinePoints > 100) {
      console.log('Component mounted, saving current state:', {
        divinePoints: gameState.divinePoints,
        pointsPerSecond: gameState.pointsPerSecond,
        isMining: gameState.isMining
      });
      
      const saveState = {
        ...gameState,
        lastSaveTime: Date.now()
      };
      
      // Force save immediately
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
        localStorage.setItem(BACKUP_KEY, JSON.stringify(saveState));
        console.log('Initial state saved on mount');
      } catch (error) {
        console.error('Error saving initial state:', error);
      }
    } else {
      console.log('Skipping initial save - fresh start or no valid saved data');
    }
  }, [hasLoadedSavedData, gameState.divinePoints]); // Run when hasLoadedSavedData changes

  // Add new state variables for dual-save system
  // const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const SYNC_INTERVAL = 30000; // 30 seconds

  // Add function to load from localStorage (enhanced version)
  const loadFromLocalStorage = () => {
    if (!user?.telegram_id) return null;

    const savedState = localStorage.getItem(`divine_mining_state_${user.telegram_id}`);
    if (!savedState) return null;

    try {
      const parsedState = JSON.parse(savedState);
      
      // Validate and sanitize the parsed state to prevent NaN values
      const sanitizeNumber = (value: any, defaultValue: number): number => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };
      
      // Load all game state from localStorage with validation
      setGameState(prev => ({
        ...prev,
        divinePoints: sanitizeNumber(parsedState.divinePoints, prev.divinePoints),
        pointsPerSecond: sanitizeNumber(parsedState.pointsPerSecond, prev.pointsPerSecond),
        totalEarned24h: sanitizeNumber(parsedState.totalEarned24h, prev.totalEarned24h),
        totalEarned7d: sanitizeNumber(parsedState.totalEarned7d, prev.totalEarned7d),
        upgradesPurchased: sanitizeNumber(parsedState.upgradesPurchased, prev.upgradesPurchased),
        minersActive: sanitizeNumber(parsedState.minersActive, prev.minersActive),
        isMining: Boolean(parsedState.isMining),
        lastSaveTime: sanitizeNumber(parsedState.lastSaveTime, prev.lastSaveTime),
        sessionStartTime: sanitizeNumber(parsedState.sessionStartTime, prev.sessionStartTime),
        totalPointsEarned: sanitizeNumber(parsedState.totalPointsEarned, prev.totalPointsEarned),
        lastDailyReset: parsedState.lastDailyReset || prev.lastDailyReset,
        lastWeeklyReset: parsedState.lastWeeklyReset || prev.lastWeeklyReset,
        version: parsedState.version || prev.version,
        highScore: sanitizeNumber(parsedState.highScore, prev.highScore),
        allTimeHighScore: sanitizeNumber(parsedState.allTimeHighScore, prev.allTimeHighScore),
        currentEnergy: sanitizeNumber(parsedState.currentEnergy, prev.currentEnergy),
        maxEnergy: sanitizeNumber(parsedState.maxEnergy, prev.maxEnergy),
        lastEnergyRegen: sanitizeNumber(parsedState.lastEnergyRegen, prev.lastEnergyRegen),
        offlineEfficiencyBonus: sanitizeNumber(parsedState.offlineEfficiencyBonus, prev.offlineEfficiencyBonus),
        lastOfflineTime: sanitizeNumber(parsedState.lastOfflineTime, prev.lastOfflineTime),
        unclaimedOfflineRewards: sanitizeNumber(parsedState.unclaimedOfflineRewards, prev.unclaimedOfflineRewards),
        lastOfflineRewardTime: sanitizeNumber(parsedState.lastOfflineRewardTime, prev.lastOfflineRewardTime),
        miningLevel: sanitizeNumber(parsedState.miningLevel, prev.miningLevel),
        miningCombo: sanitizeNumber(parsedState.miningCombo, prev.miningCombo),
        miningStreak: sanitizeNumber(parsedState.miningStreak, prev.miningStreak),
        miningExperience: sanitizeNumber(parsedState.miningExperience, prev.miningExperience),
        miningExperienceToNext: sanitizeNumber(parsedState.miningExperienceToNext, prev.miningExperienceToNext)
      }));

      // Load upgrades from localStorage with validation
      if (parsedState.upgrades && Array.isArray(parsedState.upgrades)) {
        const validatedUpgrades = parsedState.upgrades.map((upgrade: any) => {
          // Ensure all required fields exist
          const validatedUpgrade = {
            id: upgrade.id || 'unknown',
            name: upgrade.name || 'Unknown Upgrade',
            level: Math.max(0, Math.min(sanitizeNumber(upgrade.level, 0), upgrade.maxLevel || 50)),
            effect: upgrade.effect || '+0 effect',
            baseCost: Math.max(1, sanitizeNumber(upgrade.baseCost, 25)),
            costMultiplier: Math.max(1.01, sanitizeNumber(upgrade.costMultiplier, 1.12)),
            effectValue: sanitizeNumber(upgrade.effectValue, 0),
            category: upgrade.category || 'chakra',
            description: upgrade.description || 'An upgrade',
            requires: upgrade.requires || undefined,
            detailedDescription: upgrade.detailedDescription || upgrade.description || 'An upgrade',
            benefits: upgrade.benefits || ['No benefits listed'],
            tips: upgrade.tips || ['No tips available'],
            unlockProgress: Math.max(0, Math.min(100, upgrade.unlockProgress || 0)),
            maxLevel: Math.max(1, upgrade.maxLevel || 50),
            unlockReward: upgrade.unlockReward || 'No reward'
          };
          
          return validatedUpgrade;
        });
        
        console.log('Loaded and validated upgrades from localStorage:', validatedUpgrades);
        setUpgrades(validatedUpgrades);
      } else {
        console.log('No upgrades found in localStorage, using default upgrades');
        setUpgrades(getInitialUpgrades());
      }

      // Load achievements from localStorage
      if (parsedState.achievements && Array.isArray(parsedState.achievements)) {
        setAchievements(parsedState.achievements);
      }

      console.log('Loaded state from localStorage:', parsedState);
      return parsedState;
    } catch (error) {
      console.error('Error parsing localStorage divine mining state:', error);
      return null;
    }
  };

  // Add function to save to localStorage (enhanced version)
  const saveToLocalStorage = () => {
    if (!user?.telegram_id) return;

    try {
      const stateToSave = {
        ...gameState,
        upgrades,
        achievements,
        lastUpdate: new Date().toISOString(),
        saveTimestamp: Date.now() // Add explicit timestamp for conflict resolution
      };
      localStorage.setItem(`divine_mining_state_${user.telegram_id}`, JSON.stringify(stateToSave));
      console.log('💾 Saved to localStorage:', {
        divinePoints: stateToSave.divinePoints,
        timestamp: stateToSave.lastUpdate
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Add function to save to Supabase (updated to use existing table)
  const saveToSupabase = async () => {
    if (!user?.telegram_id) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', user.telegram_id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user for divine mining save:', userError);
        return;
      }

      const stateToSave = {
        user_id: userData.id,
        game_data: {
          divinePoints: gameState.divinePoints,
          pointsPerSecond: gameState.pointsPerSecond,
          totalEarned24h: gameState.totalEarned24h,
          totalEarned7d: gameState.totalEarned7d,
          upgradesPurchased: gameState.upgradesPurchased,
          minersActive: gameState.minersActive,
          isMining: gameState.isMining,
          lastSaveTime: gameState.lastSaveTime,
          sessionStartTime: gameState.sessionStartTime,
          totalPointsEarned: gameState.totalPointsEarned,
          lastDailyReset: gameState.lastDailyReset,
          lastWeeklyReset: gameState.lastWeeklyReset,
          version: gameState.version,
          highScore: gameState.highScore,
          allTimeHighScore: gameState.allTimeHighScore,
          currentEnergy: gameState.currentEnergy,
          maxEnergy: gameState.maxEnergy,
          lastEnergyRegen: gameState.lastEnergyRegen,
          offlineEfficiencyBonus: gameState.offlineEfficiencyBonus,
          lastOfflineTime: gameState.lastOfflineTime,
          unclaimedOfflineRewards: gameState.unclaimedOfflineRewards,
          lastOfflineRewardTime: gameState.lastOfflineRewardTime,
          miningLevel: gameState.miningLevel,
          miningCombo: gameState.miningCombo,
          miningStreak: gameState.miningStreak,
          miningExperience: gameState.miningExperience,
          miningExperienceToNext: gameState.miningExperienceToNext,
          upgrades: upgrades,
          achievements: achievements
        },
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_game_data')
        .upsert(stateToSave, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      // setLastSyncTime(Date.now());
      console.log('Divine mining state saved to Supabase');
    } catch (error) {
      console.error('Error saving divine mining state to Supabase:', error);
    }
  };

  // Add function to load from Supabase (updated to use existing table)
  const loadFromSupabase = async () => {
    if (!user?.telegram_id) return null;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', user.telegram_id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user for divine mining load:', userError);
        return null;
      }

      const { data, error } = await supabase
        .from('user_game_data')
        .select('game_data, last_updated')
        .eq('user_id', userData.id)
        .single();

      if (error?.code === 'PGRST116') {
        console.log('No divine mining state found in Supabase');
        return null;
      }
      if (error) throw error;
      if (!data || !data.game_data) return null;

      const gameData = data.game_data;

      // Validate and sanitize the game data to prevent NaN values
      const sanitizeNumber = (value: any, defaultValue: number): number => {
        const num = Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };

      // Calculate offline progress
      const offlineTime = Date.now() - new Date(data.last_updated).getTime();
      const offlinePoints = calculateOfflineProgress(offlineTime, gameData);

      // Calculate energy regeneration during offline time
      const energyRegenAmount = calculateOfflineEnergyRegen(
        offlineTime,
        sanitizeNumber(gameData.currentEnergy, 1000),
        sanitizeNumber(gameData.maxEnergy, 1000),
        sanitizeNumber(gameData.pointsPerSecond, 1.0),
        sanitizeNumber(gameData.miningLevel, 1)
      );

      // Update state with persisted values
      const updatedEnergy = Math.min(
        sanitizeNumber(gameData.currentEnergy, 1000) + energyRegenAmount,
        sanitizeNumber(gameData.maxEnergy, 1000)
      );

      setGameState(prev => ({
        ...prev,
        divinePoints: sanitizeNumber(gameData.divinePoints, prev.divinePoints) + offlinePoints,
        pointsPerSecond: sanitizeNumber(gameData.pointsPerSecond, prev.pointsPerSecond),
        totalEarned24h: sanitizeNumber(gameData.totalEarned24h, prev.totalEarned24h),
        totalEarned7d: sanitizeNumber(gameData.totalEarned7d, prev.totalEarned7d),
        upgradesPurchased: sanitizeNumber(gameData.upgradesPurchased, prev.upgradesPurchased),
        minersActive: sanitizeNumber(gameData.minersActive, prev.minersActive),
        isMining: Boolean(gameData.isMining),
        lastSaveTime: sanitizeNumber(gameData.lastSaveTime, prev.lastSaveTime),
        sessionStartTime: sanitizeNumber(gameData.sessionStartTime, prev.sessionStartTime),
        totalPointsEarned: sanitizeNumber(gameData.totalPointsEarned, prev.totalPointsEarned) + offlinePoints,
        lastDailyReset: gameData.lastDailyReset || prev.lastDailyReset,
        lastWeeklyReset: gameData.lastWeeklyReset || prev.lastWeeklyReset,
        version: gameData.version || prev.version,
        highScore: Math.max(sanitizeNumber(gameData.highScore, prev.highScore), prev.highScore),
        allTimeHighScore: Math.max(sanitizeNumber(gameData.allTimeHighScore, prev.allTimeHighScore), prev.allTimeHighScore),
        currentEnergy: updatedEnergy,
        maxEnergy: sanitizeNumber(gameData.maxEnergy, prev.maxEnergy),
        lastEnergyRegen: sanitizeNumber(gameData.lastEnergyRegen, prev.lastEnergyRegen),
        offlineEfficiencyBonus: sanitizeNumber(gameData.offlineEfficiencyBonus, prev.offlineEfficiencyBonus),
        lastOfflineTime: sanitizeNumber(gameData.lastOfflineTime, prev.lastOfflineTime),
        unclaimedOfflineRewards: sanitizeNumber(gameData.unclaimedOfflineRewards, prev.unclaimedOfflineRewards),
        lastOfflineRewardTime: sanitizeNumber(gameData.lastOfflineRewardTime, prev.lastOfflineRewardTime),
        miningLevel: sanitizeNumber(gameData.miningLevel, prev.miningLevel),
        miningCombo: sanitizeNumber(gameData.miningCombo, prev.miningCombo),
        miningStreak: sanitizeNumber(gameData.miningStreak, prev.miningStreak),
        miningExperience: sanitizeNumber(gameData.miningExperience, prev.miningExperience),
        miningExperienceToNext: sanitizeNumber(gameData.miningExperienceToNext, prev.miningExperienceToNext)
      }));

      // Load upgrades and achievements from Supabase with validation
      if (gameData.upgrades && Array.isArray(gameData.upgrades)) {
        const validatedUpgrades = gameData.upgrades.map((upgrade: any) => {
          // Ensure all required fields exist
          const validatedUpgrade = {
            id: upgrade.id || 'unknown',
            name: upgrade.name || 'Unknown Upgrade',
            level: Math.max(0, Math.min(upgrade.level || 0, upgrade.maxLevel || 50)),
            effect: upgrade.effect || '+0 effect',
            baseCost: Math.max(1, upgrade.baseCost || 25),
            costMultiplier: Math.max(1.01, upgrade.costMultiplier || 1.12),
            effectValue: upgrade.effectValue || 0,
            category: upgrade.category || 'chakra',
            description: upgrade.description || 'An upgrade',
            requires: upgrade.requires || undefined,
            detailedDescription: upgrade.detailedDescription || upgrade.description || 'An upgrade',
            benefits: upgrade.benefits || ['No benefits listed'],
            tips: upgrade.tips || ['No tips available'],
            unlockProgress: Math.max(0, Math.min(100, upgrade.unlockProgress || 0)),
            maxLevel: Math.max(1, upgrade.maxLevel || 50),
            unlockReward: upgrade.unlockReward || 'No reward'
          };
          
          return validatedUpgrade;
        });
        
        console.log('Loaded and validated upgrades from Supabase:', validatedUpgrades);
        setUpgrades(validatedUpgrades);
      } else {
        console.log('No upgrades found in Supabase, using default upgrades');
        setUpgrades(getInitialUpgrades());
      }
      
      if (gameData.achievements && Array.isArray(gameData.achievements)) {
        setAchievements(gameData.achievements);
      }

      // Save merged state to localStorage
      saveToLocalStorage();

      if (offlinePoints > 0 || energyRegenAmount > 0) {
        showSystemNotification(
          'Welcome Back!',
          `Earned ${formatNumber(offlinePoints)} points and regenerated ${formatNumber(energyRegenAmount)} energy while away!`,
          'success'
        );
      }

      console.log('Loaded divine mining state from Supabase:', gameData);
      return data; // Return the Supabase data for conflict resolution
    } catch (error) {
      console.error('Error loading divine mining state from Supabase:', error);
      return null;
    }
  };

  // Add helper function to calculate offline progress
  const calculateOfflineProgress = (offlineTime: number, data: any): number => {
    if (!data.is_mining) return 0;
    
    const sanitizeNumber = (value: any, defaultValue: number): number => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };
    
    const offlineHours = Math.max(0, offlineTime / (1000 * 60 * 60));
    const basePointsPerHour = sanitizeNumber(data.points_per_second, 1.0) * 3600;
    const multiplier = sanitizeNumber(data.mining_level, 1) ? 1 + (sanitizeNumber(data.mining_level, 1) * 0.1) : 1;
    
    return Math.floor(basePointsPerHour * offlineHours * multiplier);
  };

  // Add helper function to calculate offline energy regeneration
  const calculateOfflineEnergyRegen = (
    offlineTime: number,
    currentEnergy: number,
    maxEnergy: number,
    regenRate: number,
    miningLevel: number
  ): number => {
    const sanitizeNumber = (value: any, defaultValue: number): number => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };
    
    const validCurrentEnergy = sanitizeNumber(currentEnergy, 1000);
    const validMaxEnergy = sanitizeNumber(maxEnergy, 1000);
    const validRegenRate = sanitizeNumber(regenRate, 0.3);
    const validMiningLevel = sanitizeNumber(miningLevel, 1);
    
    const premiumMultiplier = validMiningLevel > 10 ? 1.5 : 1;
    const regenPerSecond = validRegenRate * premiumMultiplier;
    const totalRegenPossible = Math.max(0, offlineTime / 1000) * regenPerSecond;
    
    const energyDeficit = Math.max(0, validMaxEnergy - validCurrentEnergy);
    return Math.min(totalRegenPossible, energyDeficit);
  };

  // Update the save function to handle both localStorage and Supabase
  const saveDivineMiningState = async () => {
    // Save to localStorage first (fast)
    saveToLocalStorage();
    
    // Then save to Supabase (async)
    await saveToSupabase();
  };

  // Update load function to handle both localStorage and Supabase with proper priority
  const loadDivineMiningState = async () => {
    console.log('🔄 Starting dual-save system load...');
    
    // Load from localStorage first (fast)
    const localState = loadFromLocalStorage();
    
    // Then load from Supabase (async) with proper conflict resolution
    const supabaseState = await loadFromSupabase();
    
    // Resolve conflicts: Supabase data takes priority if it's newer
    if (localState && supabaseState) {
      const localTimestamp = localState.lastUpdate ? new Date(localState.lastUpdate).getTime() : 0;
      const supabaseTimestamp = supabaseState.last_updated ? new Date(supabaseState.last_updated).getTime() : 0;
      
      if (supabaseTimestamp > localTimestamp) {
        console.log('📊 Supabase data is newer, using Supabase state');
        // Supabase data is already applied in loadFromSupabase
      } else {
        console.log('📊 localStorage data is newer, keeping localStorage state');
        // localStorage data is already applied in loadFromLocalStorage
      }
    } else if (localState) {
      console.log('📊 Only localStorage data available');
    } else if (supabaseState) {
      console.log('📊 Only Supabase data available');
    } else {
      console.log('📊 No saved data found, starting fresh');
    }
    
    console.log('✅ Dual-save system load completed');
  };

  // Add effect for auto-saving to localStorage
  useEffect(() => {
    if (gameState.isMining) {
      const saveInterval = setInterval(saveToLocalStorage, 5000); // Save every 5 seconds while mining
      return () => clearInterval(saveInterval);
    }
  }, [gameState.isMining, gameState.divinePoints, gameState.currentEnergy, upgrades, achievements]);

  // Add effect for periodic Supabase sync
  useEffect(() => {
    if (gameState.isMining) {
      const syncInterval = setInterval(saveToSupabase, SYNC_INTERVAL);
      return () => clearInterval(syncInterval);
    }
  }, [gameState.isMining]);

  // Add effect to load state on mount
  useEffect(() => {
    if (user && !isInitialLoadComplete) {
      console.log('🚀 Starting initial data load...');
      setLoadingMessage('Starting data load...');
      
      // Check for reset flag - if present, skip loading old data
      if (user.telegram_id) {
        const telegramId = String(user.telegram_id);
        const resetFlag = localStorage.getItem(`RESET_FLAG_${telegramId}`);
        
        if (resetFlag) {
          console.log('🔄 Reset flag detected, skipping old data load for fresh start');
          localStorage.removeItem(`RESET_FLAG_${telegramId}`);
          setIsInitialLoadComplete(true);
          setIsLoading(false);
          return;
        }
        
        // Check URL for reset parameter
        const urlParams = new URLSearchParams(window.location.search);
        const resetParam = urlParams.get('reset');
        if (resetParam) {
          console.log('🔄 Reset parameter detected in URL, ensuring fresh start');
          // Clean up the URL
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
          setIsInitialLoadComplete(true);
          setIsLoading(false);
          return;
        }
      }
      
      // First, migrate any old data to user-specific keys
      if (user.telegram_id) {
        const telegramId = String(user.telegram_id);
        console.log('🔄 Checking for data migration...');
        setLoadingMessage('Checking data migration...');
        const migrationResult = migrateToUserSpecificKeys(telegramId);
        if (migrationResult.migrated > 0) {
          console.log(`✅ Migrated ${migrationResult.migrated} data items to user-specific keys`);
        }
        
        // Validate data isolation
        setLoadingMessage('Validating data isolation...');
        const validation = validateUserDataIsolation(telegramId);
        if (!validation.isValid) {
          console.warn('⚠️ Data isolation validation failed:', validation.issues);
        }
        
        // Check for data leakage
        const leakage = checkForDataLeakage(telegramId);
        if (leakage.hasLeakage) {
          console.warn('⚠️ Data leakage detected:', leakage.issues);
        }
      }
      
      setLoadingMessage('Loading game data...');
      loadDivineMiningState().then(() => {
        setIsInitialLoadComplete(true);
        setIsLoading(false);
        setLoadingMessage('');
        console.log('✅ Initial data load completed');
      }).catch((error) => {
        console.error('❌ Error during initial load:', error);
        setIsLoading(false);
        setLoadingMessage('Load failed - starting fresh');
        setIsInitialLoadComplete(true);
      });
    }
  }, [user, isInitialLoadComplete]);

  // CRITICAL FIX: Prevent data reversion by blocking state changes during initial load
  useEffect(() => {
    if (!isInitialLoadComplete) {
      console.log('⏳ Initial load in progress, blocking state changes');
      return;
    }
    
    // Only allow state changes after initial load is complete
    if (gameState.divinePoints > 100 && hasLoadedSavedData) {
      console.log('🔒 Data protection active - preventing reversion');
    }
  }, [isInitialLoadComplete, gameState.divinePoints, hasLoadedSavedData]);

  // Update the existing saveGameState function to use the new dual-save system
  const saveGameState = useCallback((state: GameState, isBackup = false) => {
    try {
      const saveData = {
        ...state,
        lastSaveTime: Date.now()
      };
      
      const key = isBackup ? BACKUP_KEY : SAVE_KEY;
      const saveString = JSON.stringify(saveData);
      
      console.log(`Saving to ${key}:`, {
        divinePoints: saveData.divinePoints,
        pointsPerSecond: saveData.pointsPerSecond,
        isMining: saveData.isMining,
        highScore: saveData.highScore,
        allTimeHighScore: saveData.allTimeHighScore
      });
      
      localStorage.setItem(key, saveString);
      
      // Also save high score and divine points separately for redundancy (user-specific)
      if (!isBackup) {
        const userHighScoreKey = getUserSpecificKey(HIGH_SCORE_KEY);
        const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
        const userDivinePointsKey = getUserSpecificKey(DIVINE_POINTS_KEY);
        const userTotalEarnedKey = getUserSpecificKey(TOTAL_EARNED_KEY);
        const userSessionKey = getUserSpecificKey(SESSION_KEY);
        
        localStorage.setItem(userHighScoreKey, saveData.allTimeHighScore.toString());
        localStorage.setItem(userDivinePointsKey, saveData.divinePoints.toString());
        localStorage.setItem(userTotalEarnedKey, saveData.totalPointsEarned.toString());
        localStorage.setItem(userAchievementsKey, JSON.stringify(achievements));
        
        // Save session data separately (user-specific)
        const sessionData = {
          sessionStartTime: saveData.sessionStartTime,
          lastDailyReset: saveData.lastDailyReset,
          lastWeeklyReset: saveData.lastWeeklyReset,
          lastSaveTime: saveData.lastSaveTime,
          version: saveData.version
        };
        localStorage.setItem(userSessionKey, JSON.stringify(sessionData));
        
        // Save to Supabase as well (async)
        saveToSupabase();
      }
      
      // Verify the save was written correctly
      const verifySave = localStorage.getItem(key);
      if (verifySave !== saveString) {
        console.error('Save verification failed!');
        throw new Error('Save verification failed');
      }
      
      if (!isBackup) {
        setLastSaveStatus('success');
        setSaveMessage(`Saved at ${new Date().toLocaleTimeString()}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      }
      
      console.log(`Save to ${key} successful`);
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      if (!isBackup) {
        setLastSaveStatus('error');
        setSaveMessage('Save failed!');
        
        // Clear error message after 5 seconds
        setTimeout(() => setSaveMessage(''), 5000);
      }
      return false;
    }
  }, [getUserSpecificKey, achievements]);

  // Update purchase upgrade function to save to both localStorage and Supabase
  const purchaseUpgrade = useCallback((upgradeId: string) => {
    setPurchasingUpgrade(upgradeId); // Set loading state
    
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      setPurchasingUpgrade(null); // Clear loading state
      return;
    }

    // Validate upgrade can be purchased
    if (!isUpgradeAvailable(upgrade)) {
      console.error('Upgrade not available:', upgradeId);
      setPurchasingUpgrade(null);
      showSystemNotification('Upgrade Locked', 'This upgrade requires previous upgrades to be purchased first!', 'warning');
      return;
    }

    if (isUpgradeMaxed(upgrade)) {
      console.error('Upgrade already maxed:', upgradeId);
      setPurchasingUpgrade(null);
      showSystemNotification('Upgrade Maxed', 'This upgrade has reached its maximum level!', 'info');
      return;
    }

    const baseCost = Number(upgrade.baseCost);
    const costMultiplier = Number(upgrade.costMultiplier);
    const level = Number(upgrade.level);
    
    const validBaseCost = isNaN(baseCost) ? 25 : baseCost;
    const validCostMultiplier = isNaN(costMultiplier) ? 1.12 : costMultiplier;
    const validLevel = isNaN(level) ? 0 : level;
    
    const cost = Math.floor(validBaseCost * Math.pow(validCostMultiplier, validLevel));
    
    const divinePoints = Number(gameState.divinePoints);
    const validDivinePoints = isNaN(divinePoints) ? 100 : divinePoints;
    
    if (validDivinePoints >= cost) {
      // Calculate the effect this upgrade will provide
      const effectValue = Number(upgrade.effectValue);
      const validEffectValue = isNaN(effectValue) ? 0 : effectValue;
      
      setGameState(prev => {
        let newState = {
          ...prev,
          divinePoints: prev.divinePoints - cost,
          upgradesPurchased: prev.upgradesPurchased + 1
        };
        
        // Handle different types of upgrades with proper effect application
        if (upgradeId === 'energy-capacity' || upgradeId === 'energy-overflow' || upgradeId === 'vibrational-harmony' || upgradeId === 'transcendence' || upgradeId === 'space-bending' || upgradeId === 'earth-element') {
          // Energy capacity upgrades
          newState = {
            ...newState,
            maxEnergy: prev.maxEnergy + validEffectValue,
            currentEnergy: Math.min(prev.currentEnergy, prev.maxEnergy + validEffectValue)
          };
        } else if (upgradeId === 'inner-strength' || upgradeId === 'aura-purification' || upgradeId === 'energy-mastery' || upgradeId === 'air-element') {
          // Energy efficiency upgrades (negative effect values)
          // These are handled in the mining calculation, no immediate state change needed
          console.log(`Applied energy efficiency upgrade: ${upgrade.name} with effect ${validEffectValue}`);
        } else if (upgradeId === 'psychic-awareness' || upgradeId === 'divine-resonance' || upgradeId === 'mindful-breathing' || upgradeId === 'water-element') {
          // Energy regeneration upgrades
          // These are handled in the energy regeneration calculation, no immediate state change needed
          console.log(`Applied energy regeneration upgrade: ${upgrade.name} with effect ${validEffectValue}`);
        } else if (upgradeId === 'cosmic-consciousness' || upgradeId === 'time-dilation') {
          // Offline bonus upgrades
          newState = {
            ...newState,
            offlineEfficiencyBonus: prev.offlineEfficiencyBonus + validEffectValue
          };
        } else if (upgradeId === 'reality-shift') {
          // Global bonus upgrades
          // This affects all bonuses, handled in calculations
          console.log(`Applied global bonus upgrade: ${upgrade.name} with effect ${validEffectValue}`);
        } else {
          // Default: Points per second upgrades (most upgrades fall here)
          newState = {
            ...newState,
            pointsPerSecond: prev.pointsPerSecond + validEffectValue
          };
        }
        
        console.log(`Upgrade applied: ${upgrade.name}`, {
          effectValue: validEffectValue,
          newPPS: newState.pointsPerSecond,
          newMaxEnergy: newState.maxEnergy,
          newOfflineBonus: newState.offlineEfficiencyBonus
        });
        
        return newState;
      });

      setUpgrades(prev => {
        const updatedUpgrades = prev.map(u => 
          u.id === upgradeId 
            ? { ...u, level: u.level + 1 }
            : u
        );
        
        // Save upgrades to localStorage immediately (user-specific)
        try {
          const userUpgradesKey = getUserSpecificKey(UPGRADES_KEY);
          localStorage.setItem(userUpgradesKey, JSON.stringify(updatedUpgrades));
          console.log('Upgrades saved to localStorage');
          
          // Show upgrade notification
          showUpgradeNotification(upgrade.name, cost);
        } catch (error) {
          console.error('Error saving upgrades:', error);
          showSystemNotification('Upgrade Error', 'Failed to save upgrade!', 'error');
        }
        
        return updatedUpgrades;
      });
      
      // Save state to both localStorage and Supabase
      setTimeout(() => {
        saveDivineMiningState();
        setPurchasingUpgrade(null); // Clear loading state after save
        
        // Dispatch custom event for TaskCenter to detect upgrade purchase
        const upgradeEvent = new CustomEvent('upgradePurchased', {
          detail: {
            upgradeId: upgradeId,
            upgradeName: upgrade.name,
            level: upgrade.level + 1,
            cost: cost,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(upgradeEvent);
        console.log('🎉 Dispatched upgrade purchase event for TaskCenter');
      }, 100);
      
      console.log(`Purchased upgrade: ${upgrade.name} for ${cost} points`);
    } else {
      setPurchasingUpgrade(null); // Clear loading state on insufficient points
      showSystemNotification('Insufficient Points', 'Not enough points for this upgrade!', 'warning');
    }
  }, [upgrades, gameState.divinePoints, isUpgradeAvailable, isUpgradeMaxed, showUpgradeNotification, showSystemNotification, saveDivineMiningState]);

  // Update toggle mining function to save to both systems
  const toggleMining = useCallback(() => {
    setGameState(prev => {
      // If trying to start mining, check energy
      if (!prev.isMining && prev.currentEnergy < 1) {
        // Silently prevent mining without notification - user can see energy bar
        return prev;
      }
      
      const newState = {
        ...prev,
        isMining: !prev.isMining
      };
      
      // Immediately save when mining state changes
      console.log(`Mining ${newState.isMining ? 'STARTED' : 'STOPPED'}:`, {
        divinePoints: newState.divinePoints,
        pointsPerSecond: newState.pointsPerSecond,
        isMining: newState.isMining,
        currentEnergy: newState.currentEnergy
      });
      
      // Save immediately to both systems
      setTimeout(() => {
        saveDivineMiningState();
      }, 100);
      
      return newState;
    });
    
    // Clear mining resumed flag when user manually toggles
  }, [showSystemNotification, saveDivineMiningState]);

  // Mining interval effect - ACTUALLY HANDLES THE MINING PROCESS
  useEffect(() => {
    if (!gameState.isMining) {
      // Clear any existing mining interval
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
        miningIntervalRef.current = undefined;
      }
      return;
    }

    // Start mining interval
    miningIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        // Check if we have enough energy to continue mining
        const boostedRate = getEnhancedMiningRate();
        const totalEfficiencyBonus = getEnergyEfficiencyBonus();
        
        const baseEnergyCost = 0.8;
        const baseRate = Number(prev.pointsPerSecond);
        const validBoostedRate = isNaN(boostedRate) ? 1.0 : boostedRate;
        const validBaseRate = isNaN(baseRate) ? 1.0 : baseRate;
        const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, validBoostedRate / validBaseRate));
        const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
        
        // Check if we have enough energy for this mining cycle
        if (prev.currentEnergy < energyCost) {
          console.log('Mining stopped: Not enough energy', {
            currentEnergy: prev.currentEnergy,
            energyCost: energyCost,
            boostedRate: boostedRate
          });
          
          // Stop mining due to insufficient energy
          return {
            ...prev,
            isMining: false
          };
        }
        
        // Calculate points earned this cycle
        const pointsEarned = boostedRate * 0.5; // 500ms cycle
        
        // Update game state
        const newState = {
          ...prev,
          divinePoints: prev.divinePoints + pointsEarned,
          totalPointsEarned: prev.totalPointsEarned + pointsEarned,
          currentEnergy: prev.currentEnergy - energyCost,
          totalEarned24h: prev.totalEarned24h + pointsEarned,
          totalEarned7d: prev.totalEarned7d + pointsEarned
        };
        
        console.log('Mining cycle:', {
          pointsEarned: pointsEarned.toFixed(2),
          energyCost: energyCost.toFixed(2),
          newEnergy: newState.currentEnergy.toFixed(2),
          boostedRate: boostedRate.toFixed(2)
        });
        
        return newState;
      });
    }, 500); // Run every 500ms for smooth mining

    // Cleanup function
    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
        miningIntervalRef.current = undefined;
      }
    };
  }, [gameState.isMining, getEnhancedMiningRate, upgrades, saveGameState]);

  // Energy regeneration effect
  useEffect(() => {
    if (gameState.currentEnergy >= gameState.maxEnergy) {
      return; // No need to regenerate if at max
    }

    const energyRegenInterval = setInterval(() => {
      setGameState(prev => {
        const energyRegen = getEnergyRegenerationRate();
        
        const currentEnergy = Number(prev.currentEnergy);
        const maxEnergy = Number(prev.maxEnergy);
        const validCurrentEnergy = isNaN(currentEnergy) ? 1000 : currentEnergy;
        const validMaxEnergy = isNaN(maxEnergy) ? 1000 : maxEnergy;
        const newEnergy = Math.min(validMaxEnergy, validCurrentEnergy + energyRegen);
        
        return {
          ...prev,
          currentEnergy: newEnergy,
          lastEnergyRegen: Date.now()
        };
      });
    }, 1000); // Regenerate energy every second

    return () => clearInterval(energyRegenInterval);
  }, [gameState.currentEnergy, gameState.maxEnergy, getEnergyRegenerationRate]);

  // Auto-mining effect
  useEffect(() => {
    const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
    const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
    
    if (!hasAutoMining || gameState.isMining) {
      return; // No auto-mining or already mining
    }
    
    // Check if we have enough energy to start auto-mining
    const boostedRate = getEnhancedMiningRate();
    const totalEfficiencyBonus = getEnergyEfficiencyBonus();
    
    const baseEnergyCost = 0.8;
    const baseRate = Number(gameState.pointsPerSecond);
    const validBoostedRate = isNaN(boostedRate) ? 1.0 : boostedRate;
    const validBaseRate = isNaN(baseRate) ? 1.0 : baseRate;
    const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, validBoostedRate / validBaseRate));
    const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
    const minimumEnergyRequired = energyCost * 2 * 5; // 5 seconds worth
    
    const currentEnergy = Number(gameState.currentEnergy);
    const validCurrentEnergy = isNaN(currentEnergy) ? 1000 : currentEnergy;
    
    if (validCurrentEnergy >= minimumEnergyRequired) {
      console.log('Auto-mining started: Sufficient energy available');
      setGameState(prev => ({
        ...prev,
        isMining: true
      }));
    }
  }, [gameState.currentEnergy, gameState.isMining, getEnhancedMiningRate, getEnergyEfficiencyBonus]);

  // Enhanced number formatting
  const formatNumber = useCallback((num: number): string => {
    if (isNaN(num) || !isFinite(num)) return '0';
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
  }, []);

  const getSessionDuration = useCallback((): string => {
    const duration = Date.now() - gameState.sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [gameState.sessionStartTime]);

  // Claim offline rewards function
  const claimOfflineRewards = useCallback(() => {
    if (gameState.unclaimedOfflineRewards > 0) {
      setGameState(prev => {
        const newState = {
          ...prev,
          divinePoints: prev.divinePoints + prev.unclaimedOfflineRewards,
          totalPointsEarned: prev.totalPointsEarned + prev.unclaimedOfflineRewards,
          unclaimedOfflineRewards: 0,
          lastOfflineRewardTime: Date.now()
        };
        
        console.log(`Offline rewards claimed: +${prev.unclaimedOfflineRewards} points`);
        showSystemNotification('Offline Rewards Claimed!', `🎉 Claimed ${Math.floor(prev.unclaimedOfflineRewards)} offline rewards!`, 'success');
        
        return newState;
      });
      
      setShowOfflineRewards(false);
      // setOfflineRewardNotification('');
    }
  }, [gameState.unclaimedOfflineRewards, showSystemNotification]);

  // // Add test reset function for debugging
  // const testReset = useCallback(() => {
  //   console.log('🧪 Testing reset functionality...');
  //   debugUserData();
  //   clearCorruptedData();
    
  //   // Show test notification
  //   showSystemNotification(
  //     'Reset Test', 
  //     'Testing reset functionality. Check console for debug info.', 
  //     'info'
  //   );
  // }, [debugUserData, clearCorruptedData, showSystemNotification]);

  // Add function to close upgrade shop and reset state
  const closeUpgradeShop = useCallback(() => {
    setShowUpgradeShop(false);
    setCurrentUpgradePage(1);
    setUpgradeFilter('all');
  }, []);

  // Function to force reload upgrades
  const forceReloadUpgrades = useCallback(() => {
    console.log('🔄 Force reloading upgrades...');
    setLoadingMessage('Reloading upgrades...');
    
    // Clear current upgrades
    setUpgrades([]);
    
    // Reload from localStorage first
    const userUpgradesKey = getUserSpecificKey(UPGRADES_KEY);
    const savedUpgrades = localStorage.getItem(userUpgradesKey);
    
    if (savedUpgrades) {
      try {
        const parsed = JSON.parse(savedUpgrades);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validatedUpgrades = parsed.map(upgrade => ({
            id: upgrade.id || 'unknown',
            name: upgrade.name || 'Unknown Upgrade',
            level: Math.max(0, Math.min(upgrade.level || 0, upgrade.maxLevel || 50)),
            effect: upgrade.effect || '+0 effect',
            baseCost: Math.max(1, upgrade.baseCost || 25),
            costMultiplier: Math.max(1.01, upgrade.costMultiplier || 1.12),
            effectValue: upgrade.effectValue || 0,
            category: upgrade.category || 'chakra',
            description: upgrade.description || 'An upgrade',
            requires: upgrade.requires || undefined,
            detailedDescription: upgrade.detailedDescription || upgrade.description || 'An upgrade',
            benefits: upgrade.benefits || ['No benefits listed'],
            tips: upgrade.tips || ['No tips available'],
            unlockProgress: Math.max(0, Math.min(100, upgrade.unlockProgress || 0)),
            maxLevel: Math.max(1, upgrade.maxLevel || 50),
            unlockReward: upgrade.unlockReward || 'No reward'
          }));
          
          setUpgrades(validatedUpgrades);
          console.log('✅ Upgrades reloaded from localStorage:', validatedUpgrades);
          showSystemNotification('Upgrades Reloaded', 'Successfully reloaded upgrades from localStorage', 'success');
        } else {
          throw new Error('Invalid upgrade data format');
        }
      } catch (error) {
        console.error('Error reloading upgrades from localStorage:', error);
        // Fall back to default upgrades
        const defaultUpgrades = getInitialUpgrades();
        setUpgrades(defaultUpgrades);
        console.log('✅ Loaded default upgrades as fallback:', defaultUpgrades);
        showSystemNotification('Default Upgrades Loaded', 'Loaded default upgrades due to data corruption', 'warning');
      }
    } else {
      // No saved upgrades, load defaults
      const defaultUpgrades = getInitialUpgrades();
      setUpgrades(defaultUpgrades);
      console.log('✅ Loaded default upgrades (no saved data):', defaultUpgrades);
      showSystemNotification('Default Upgrades Loaded', 'No saved upgrades found, loaded defaults', 'info');
    }
    
    setLoadingMessage('');
  }, [getUserSpecificKey, getInitialUpgrades, showSystemNotification]);

  // Debug function to verify upgrade system
  const debugUpgradeSystem = useCallback(() => {
    console.log('🔍 Upgrade System Debug Report:');
    console.log('Current Game State:', {
      divinePoints: gameState.divinePoints,
      pointsPerSecond: gameState.pointsPerSecond,
      upgradesPurchased: gameState.upgradesPurchased,
      currentEnergy: gameState.currentEnergy,
      maxEnergy: gameState.maxEnergy,
      offlineEfficiencyBonus: gameState.offlineEfficiencyBonus
    });
    
    console.log('Upgrade Calculations:', {
      energyRegenRate: getEnergyRegenerationRate(),
      energyEfficiencyBonus: getEnergyEfficiencyBonus(),
      enhancedMiningRate: getEnhancedMiningRate(),
      totalUpgrades: upgrades.length,
      availableUpgrades: getFilteredUpgrades().filter(u => isUpgradeAvailable(u) && !isUpgradeMaxed(u)).length,
      maxedUpgrades: upgrades.filter(u => isUpgradeMaxed(u)).length
    });
    
    console.log('Upgrade Details:', upgrades.map(u => ({
      id: u.id,
      name: u.name,
      level: u.level,
      maxLevel: u.maxLevel,
      effectValue: u.effectValue,
      isAvailable: isUpgradeAvailable(u),
      isMaxed: isUpgradeMaxed(u),
      cost: getUpgradeCost(u)
    })));
    
    // Check for common loading issues
    const issues = [];
    if (upgrades.length === 0) issues.push('No upgrades loaded');
    if (gameState.pointsPerSecond <= 1.0) issues.push('No upgrade effects applied to PPS');
    if (gameState.offlineEfficiencyBonus <= 0) issues.push('No offline bonus upgrades detected');
    
    if (issues.length > 0) {
      console.warn('⚠️ Potential loading issues detected:', issues);
      showSystemNotification('Loading Issues Found', `Issues: ${issues.join(', ')}`, 'warning');
    } else {
      console.log('✅ All upgrade systems appear to be working correctly');
      showSystemNotification('System Healthy', 'All upgrade systems working correctly', 'success');
    }
    
    showSystemNotification('Debug Complete', 'Check console for upgrade system analysis', 'info');
  }, [gameState, upgrades, getEnergyRegenerationRate, getEnergyEfficiencyBonus, getEnhancedMiningRate, isUpgradeAvailable, isUpgradeMaxed, getUpgradeCost, getFilteredUpgrades, showSystemNotification]);

  // Add keyboard shortcut for reset button visibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        setShowResetButton(true);
      }
      
      // Close upgrade shop with Escape key
      if (event.key === 'Escape' && showUpgradeShop) {
        closeUpgradeShop();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey) {
        setShowResetButton(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [showUpgradeShop, closeUpgradeShop]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 overflow-y-auto game-scrollbar">
      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <div className="text-cyan-400 font-mono font-bold text-lg tracking-wider">
                LOADING DIVINE MINING
              </div>
              <div className="text-gray-300 font-mono text-sm">
                {loadingMessage}
              </div>
              <div className="text-gray-500 font-mono text-xs">
                Please wait while we initialize your spiritual journey...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Centered Divine Mining Card */}
      <div className="relative w-full max-w-xl overflow-hidden game-card-frame">
        {/* Compact Header */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${gameState.isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <div className="text-base font-mono font-bold text-cyan-400 tracking-wider">SPIRITUAL AWAKENING</div>
              <div className="text-xs font-mono text-cyan-300">
                {gameState.isMining ? 'ENLIGHTENMENT ACTIVE' : 'PREPARING FOR MEDITATION'}
              </div>
            </div>
          </div>
          
          {/* Compact Tier Badge */}
          {(() => {
            const currentTier = getCurrentTier(gameState.miningLevel);
            const tierColors = {
              green: 'text-green-400 bg-green-900/30 border-green-500/30 hover:bg-green-800/40 hover:border-green-400/50',
              blue: 'text-blue-400 bg-blue-900/30 border-blue-500/30 hover:bg-blue-800/40 hover:border-blue-400/50',
              purple: 'text-purple-400 bg-purple-900/30 border-purple-500/30 hover:bg-purple-800/40 hover:border-purple-400/50',
              yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30 hover:bg-yellow-800/40 hover:border-yellow-400/50'
            };
            return (
              <button
                onClick={() => setShowTierInfo(true)}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border flex items-center space-x-1.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${tierColors[currentTier.color as keyof typeof tierColors]}`}
                title="Click for tier information"
              >
                <span className="text-sm">{currentTier.symbol}</span>
                <span>{currentTier.name}</span>
              </button>
            );
          })()}
        </div>

        {/* Compact Main Points Display */}
        <div className="relative z-10 text-center mb-6">
          <div className={`text-6xl font-mono font-bold tracking-wider mb-1 transition-all duration-300 ${
            gameState.divinePoints > 1000000 
              ? 'text-purple-300 drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]' 
              : gameState.divinePoints > 100000 
              ? 'text-yellow-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
              : gameState.divinePoints > 10000 
              ? 'text-green-300 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
              : 'text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]'
          }`}>
            {formatNumber(gameState.divinePoints)}
          </div>
          <div className="text-sm font-mono text-cyan-400 tracking-wider mb-1">SPIRITUAL ESSENCE</div>
          <div className="text-sm font-mono text-cyan-300">
            +{getBoostedMiningRate().toFixed(1)} wisdom/sec
            {gameState.miningCombo > 1.1 && (
              <span className="ml-2 text-yellow-400 font-bold text-base">
                {gameState.miningCombo.toFixed(1)}x focus
              </span>
            )}
          </div>
        </div>

        {/* Compact Mining Button */}
        <div className="relative z-10 flex justify-center items-center mb-8">
          <button 
            onClick={toggleMining}
            disabled={!gameState.isMining && gameState.currentEnergy < 1}
            className={`
              relative w-48 h-48 rounded-full transition-all duration-300 font-mono font-bold
              ${gameState.isMining 
                ? 'bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] border-4 border-red-400 hover:shadow-[0_0_50px_rgba(239,68,68,0.8)]' 
                : gameState.currentEnergy < 1
                ? 'bg-gradient-to-br from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-4 border-gray-400'
                : 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_40px_rgba(0,255,255,0.6)] border-4 border-cyan-400 hover:shadow-[0_0_50px_rgba(0,255,255,0.8)]'
              }
              ${gameState.isMining ? 'animate-pulse' : ''}
              hover:scale-105 active:scale-95
            `}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-5xl mb-2">
                {gameState.isMining ? '⏸️' : gameState.currentEnergy < 1 ? '⚠️' : '▶️'}
              </div>
              <div className="text-lg font-mono font-bold tracking-wider">
                {gameState.isMining ? 'PAUSE' : 'MEDITATE'}
              </div>
              {gameState.miningStreak > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-sm font-mono font-bold px-2 py-1 rounded-full border border-yellow-300 shadow-lg">
                  {gameState.miningStreak}
                </div>
              )}
            </div>
          </button>
        </div>

        

        {/* Large Stats Grid */}
        {/* <div className="relative z-10 grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 text-center hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-xl font-mono font-bold text-cyan-300 mb-1">
              {formatNumber(getBoostedMiningRate())}
            </div>
            <div className="text-sm font-mono text-cyan-400">RATE</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center hover:border-green-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-xl font-mono font-bold text-green-300 mb-1">
              {gameState.upgradesPurchased}
            </div>
            <div className="text-sm font-mono text-green-400">UPGRADES</div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-xl font-mono font-bold text-purple-300 mb-1">
              {gameState.miningLevel}
            </div>
            <div className="text-sm font-mono text-purple-400">LEVEL</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-center hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
            <div className="text-xl font-mono font-bold text-yellow-300 mb-1">
              {Math.round(gameState.currentEnergy)}
            </div>
            <div className="text-sm font-mono text-yellow-400">ENERGY</div>
          </div>
        </div> */}

        {/* Compact Progress Bars */}
        <div className="relative z-10 space-y-3 mb-6">
          {/* Experience Progress */}
          {/* <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-indigo-400 font-medium">Experience</span>
              <span className="text-indigo-300 font-medium">
                {gameState.miningExperience.toLocaleString()}/{gameState.miningExperienceToNext.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-600/30">
              <div 
                className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${(gameState.miningExperience / gameState.miningExperienceToNext) * 100}%` }}
              />
            </div>
          </div> */}

          {/* Energy Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-cyan-400 font-medium">Spiritual Energy</span>
              <span className="text-cyan-300 font-medium">
                {Math.round(gameState.currentEnergy)}/{gameState.maxEnergy}
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2 border border-gray-600/30 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 shadow-sm ${
                  gameState.currentEnergy < 100 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                  gameState.currentEnergy < 500 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
                  gameState.isMining ? 'bg-gradient-to-r from-red-400 to-red-300' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                } ${gameState.isMining ? 'animate-pulse' : ''}`}
                style={{ width: `${(gameState.currentEnergy / gameState.maxEnergy) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Compact Upgrade Store Button */}
        <div className="relative z-10 mb-4">
          <button
            onClick={() => setShowUpgradeShop(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 font-mono font-bold border hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] group"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-sm tracking-wider">🕉️ ENHANCEMENTS</span>
              {gameState.upgradesPurchased > 0 && (
                <div className="text-xs px-2 py-1 rounded border border-cyan-400/30 bg-cyan-400/10">
                  {gameState.upgradesPurchased}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs font-mono text-cyan-400">
                {formatNumber(gameState.divinePoints)} ESSENCE
              </div>
              <div className="text-cyan-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Compact Status */}
        <div className="relative z-10 flex justify-between items-center text-xs font-mono text-gray-400 bg-gray-900/20 rounded-lg p-3 border border-gray-600/30">
          <div>
            <span className="text-cyan-400 font-bold">SESSION:</span> {getSessionDuration()}
          </div>
          <div>
            <span className="text-cyan-400 font-bold">TOTAL:</span> {formatNumber(gameState.totalPointsEarned)}
          </div>
        </div>

        {/* Hidden Reset Button - Only visible when holding Ctrl+Shift */}
        <div className="relative z-10">
          <button
            onClick={() => setShowResetConfirmation(true)}
            disabled={isResetting}
            className={`w-full flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 font-mono font-bold border ${
              showResetButton 
                ? 'opacity-100 bg-gradient-to-r from-red-900/50 to-red-800/50 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                : 'opacity-30 hover:opacity-60 bg-gradient-to-r from-gray-800/30 to-gray-700/30 border-gray-600/30 text-gray-400 hover:text-gray-300'
            } group disabled:opacity-50 disabled:cursor-not-allowed text-xs`}
            title={showResetButton ? "Click to reset game data" : "Hold Ctrl+Shift to reveal reset button"}
          >
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                showResetButton ? 'bg-red-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="tracking-wider">
                {isResetting ? '🔄 RESETTING...' : showResetButton ? '🗑️ RESET GAME DATA' : '⚙️ ADVANCED'}
              </span>
            </div>
          </button>
        </div>

       
        {/* Compact Offline Rewards */}
        {showOfflineRewards && gameState.unclaimedOfflineRewards > 0 && (
          <div className="relative z-10 mt-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-3 animate-pulse hover:scale-[1.01] transition-all duration-300">
            <div className="text-center">
              <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">
                🎁 OFFLINE REWARDS
              </div>
              <div className="text-lg font-mono font-bold text-purple-300 mb-2 tracking-wider">
                {formatNumber(gameState.unclaimedOfflineRewards)}
              </div>
              <button 
                onClick={claimOfflineRewards}
                className="font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all duration-300 border tracking-wider bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-purple-400 hover:scale-105 active:scale-95 shadow-sm"
              >
                CLAIM
              </button>
            </div>
          </div>
        )}

        {/* Compact Status Messages */}
        {gameState.currentEnergy < 100 && gameState.isMining && (
          <div className="relative z-10 mt-3 bg-gradient-to-r from-red-900/40 to-red-800/40 backdrop-blur-sm border border-red-500/50 rounded-lg p-2 animate-pulse">
            <div className="text-center text-red-400 font-mono font-bold text-xs tracking-wider">
              ⚠️ LOW ENERGY
            </div>
          </div>
        )}

        {(() => {
          const flowStateUpgrades = upgrades.filter(u => u.id === 'flow-state');
          const hasAutoMining = flowStateUpgrades.some(u => u.level > 0);
          
          if (hasAutoMining) {
            return (
              <div className="relative z-10 mt-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/50 rounded-lg p-2">
                <div className="text-center text-blue-400 font-mono font-bold text-xs tracking-wider">
                  🌊 FLOW STATE {gameState.isMining ? 'ACTIVE' : 'ENABLED'}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Full-Screen Upgrade Shop Modal */}
      {showUpgradeShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => {
          // Close modal when clicking outside
          if (e.target === e.currentTarget) {
            closeUpgradeShop();
          }
        }}>
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <div>
                  <h2 className="text-lg font-mono font-bold text-cyan-300 tracking-wider">🕉️ SPIRITUAL ENHANCEMENTS</h2>
                  <p className="text-xs font-mono text-cyan-400">Awaken new abilities and deepen your journey</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {formatNumber(gameState.divinePoints)}
                  </div>
                  <div className="text-xs font-mono text-cyan-400">SPIRITUAL ESSENCE</div>
                </div>
                <button
                  onClick={closeUpgradeShop}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-300 hover:scale-110"
                  title="Close shop"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Filter Tabs */}
              <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                {['all', 'affordable', 'recommended', 'chakra', 'mastery', 'meditation', 'cosmic', 'elemental'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setUpgradeFilter(filter as typeof upgradeFilter);
                      setCurrentUpgradePage(1); // Reset to first page when changing filter
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 whitespace-nowrap hover:scale-105 ${
                      upgradeFilter === filter
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-cyan-400 hover:text-cyan-300'
                    }`}
                  >
                    {getFilterDisplayName(filter)}
                  </button>
                ))}
              </div>

              {/* Upgrades Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {getPaginatedUpgrades().length > 0 ? (
                  getPaginatedUpgrades().map((upgrade) => {
                    const cost = getUpgradeCost(upgrade);
                    const canAfford = gameState.divinePoints >= cost;
                    const isMaxed = isUpgradeMaxed(upgrade);
                    const isAvailable = isUpgradeAvailable(upgrade);

                    return (
                      <div
                        key={upgrade.id}
                        className={`relative bg-gradient-to-r backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${
                          !isAvailable
                            ? 'border-gray-500/30 bg-gradient-to-r from-gray-800/20 to-gray-700/20 opacity-50'
                            : isMaxed 
                            ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20' 
                            : canAfford 
                            ? 'border-green-500/50 hover:border-green-400 from-gray-800/40 to-gray-900/40' 
                            : 'border-gray-600/50 from-gray-800/40 to-gray-900/40'
                        }`}
                      >
                        <div className="flex flex-col h-full">
                          {/* Category Badge */}
                          {upgrade.category && (
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${getUpgradeCategoryColor(upgrade.category)}`}>
                                {getUpgradeCategoryName(upgrade.category)}
                              </span>
                              {upgrade.level > 0 && (
                                <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full border border-cyan-500/30">
                                  LV.{upgrade.level}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Upgrade Name */}
                          <h3 className="text-sm font-mono font-bold text-gray-200 tracking-wider mb-2">
                            {upgrade.name}
                          </h3>
                          
                          {/* Effect */}
                          <div className="text-xs font-mono text-gray-400 mb-2">
                            {upgrade.effect}
                          </div>
                          
                          {/* Description */}
                          {upgrade.description && (
                            <div className="text-xs font-mono text-gray-500 mb-3 flex-1 italic">
                              {upgrade.description}
                            </div>
                          )}
                          
                          {/* Requirements */}
                          {upgrade.requires && !isAvailable && (
                            <div className="text-xs font-mono text-red-400 mb-2">
                              Requires: {upgrade.requires.upgrade.replace('-', ' ').toUpperCase()} LV.{upgrade.requires.level}
                            </div>
                          )}
                          
                          {/* Cost and Buy Button */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-mono text-gray-300">
                              Cost: <span className={canAfford ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {formatNumber(cost)}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (canAfford && !isMaxed && isAvailable && !purchasingUpgrade) {
                                  purchaseUpgrade(upgrade.id);
                                }
                              }}
                              disabled={!canAfford || isMaxed || !isAvailable || purchasingUpgrade === upgrade.id}
                              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 ${
                                purchasingUpgrade === upgrade.id
                                  ? 'bg-gradient-to-r from-blue-600/50 to-blue-500/50 text-blue-300 border border-blue-500/50 cursor-not-allowed animate-pulse'
                                  : !isAvailable
                                  ? 'bg-gradient-to-r from-gray-600/50 to-gray-500/50 text-gray-400 border border-gray-500/50 cursor-not-allowed'
                                  : isMaxed
                                  ? 'bg-gradient-to-r from-yellow-600/50 to-yellow-500/50 text-yellow-300 border border-yellow-500/50 cursor-not-allowed'
                                  : canAfford
                                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-400 shadow-sm'
                                  : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                              }`}
                              title={
                                purchasingUpgrade === upgrade.id
                                  ? 'Purchasing...'
                                  : !isAvailable 
                                  ? 'Requires previous upgrades' 
                                  : isMaxed 
                                  ? 'Maximum level reached' 
                                  : canAfford 
                                  ? 'Click to purchase' 
                                  : 'Not enough spiritual essence'
                              }
                            >
                              {purchasingUpgrade === upgrade.id ? '⏳' : !isAvailable ? '🔒' : isMaxed ? 'MAX' : canAfford ? 'BUY' : '💰'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-400 font-mono text-sm mb-2">
                      {upgradeFilter === 'affordable' 
                        ? 'No affordable upgrades available' 
                        : upgradeFilter === 'recommended' 
                        ? 'No recommended upgrades available' 
                        : upgradeFilter === 'chakra' 
                        ? 'No chakra upgrades available' 
                        : upgradeFilter === 'mastery' 
                        ? 'No mastery upgrades available' 
                        : upgradeFilter === 'meditation' 
                        ? 'No meditation upgrades available' 
                        : upgradeFilter === 'cosmic' 
                        ? 'No cosmic upgrades available' 
                        : upgradeFilter === 'elemental' 
                        ? 'No elemental upgrades available' 
                        : 'No upgrades available'
                      }
                    </div>
                    <div className="text-gray-500 font-mono text-xs">
                      Try a different filter or earn more spiritual essence
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {getTotalPages() > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                  <button
                    onClick={() => setCurrentUpgradePage(Math.max(1, currentUpgradePage - 1))}
                    disabled={currentUpgradePage === 1}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
                      currentUpgradePage === 1
                        ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                        : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/50 hover:border-cyan-400/50'
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  <div className="text-xs font-mono text-gray-400">
                    Page {currentUpgradePage} of {getTotalPages()}
                  </div>
                  
                  <button
                    onClick={() => setCurrentUpgradePage(Math.min(getTotalPages(), currentUpgradePage + 1))}
                    disabled={currentUpgradePage === getTotalPages()}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
                      currentUpgradePage === getTotalPages()
                        ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
                        : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/50 hover:border-cyan-400/50'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Stats Summary */}
              <div className="mt-4 pt-3 border-t border-gray-600/30">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="text-center">
                    <div className="text-cyan-400 font-bold">TOTAL UPGRADES</div>
                    <div className="text-cyan-300">{gameState.upgradesPurchased}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-bold">AVAILABLE</div>
                    <div className="text-purple-300">{getFilteredUpgrades().filter(u => isUpgradeAvailable(u) && !isUpgradeMaxed(u)).length}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-600/20">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div className="text-center">
                      <div className="text-green-400 font-bold">PPS BONUS</div>
                      <div className="text-green-300">+{((gameState.pointsPerSecond - 1.0) * 100).toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">ENERGY REGEN</div>
                      <div className="text-blue-300">+{getEnergyRegenerationRate().toFixed(1)}/s</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold">OFFLINE BONUS</div>
                      <div className="text-yellow-300">+{(gameState.offlineEfficiencyBonus * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
                {/* Debug Buttons */}
                <div className="mt-3 pt-2 border-t border-gray-600/20 text-center space-y-2">
                  <button
                    onClick={debugUpgradeSystem}
                    className="px-3 py-1 rounded text-xs font-mono bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50 hover:text-gray-200 transition-all duration-300"
                    title="Debug upgrade system and check console for detailed analysis"
                  >
                    🔍 DEBUG UPGRADES
                  </button>
                  <button
                    onClick={forceReloadUpgrades}
                    className="px-3 py-1 rounded text-xs font-mono bg-blue-700/50 text-blue-300 border border-blue-600 hover:bg-blue-600/50 hover:text-blue-200 transition-all duration-300"
                    title="Force reload upgrades from localStorage"
                  >
                    🔄 RELOAD UPGRADES
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-red-500/20 bg-gradient-to-r from-red-900/20 to-red-800/20">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                <div>
                  <h2 className="text-lg font-mono font-bold text-red-300 tracking-wider">⚠️ RESET CONFIRMATION</h2>
                  <p className="text-xs font-mono text-red-400">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h3 className="text-xl font-mono font-bold text-red-300 mb-2 tracking-wider">
                  RESET GAME DATA
                </h3>
                <p className="text-sm font-mono text-gray-400 leading-relaxed">
                  This will permanently delete all your progress including:
                </p>
                <div className="mt-4 space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>All divine points ({formatNumber(gameState.divinePoints)})</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>All upgrades ({gameState.upgradesPurchased} purchased)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>All achievements and progress</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>Mining level and experience</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>All game statistics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>Daily streaks and rewards</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>Referral data and progress</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>Completed tasks and gems</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>Active boosts and multipliers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm font-mono text-gray-300">
                    <span className="text-red-400">•</span>
                    <span>All localStorage and database data</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  disabled={isResetting}
                  className="flex-1 px-6 py-3 rounded-lg text-sm font-mono font-bold tracking-wider transition-all duration-300 bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 border border-gray-600 hover:border-gray-500 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CANCEL
                </button>
                <button
                  onClick={resetUserData}
                  disabled={isResetting}
                  className="flex-1 px-6 py-3 rounded-lg text-sm font-mono font-bold tracking-wider transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border border-red-400 shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? '🔄 RESETTING...' : '🗑️ CONFIRM RESET'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Information Modal */}
      {showTierInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-sm" onClick={() => setShowTierInfo(false)}>
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <div>
                  <h2 className="text-base font-mono font-bold text-cyan-300 tracking-wider">🌟 TIERS</h2>
                  <p className="text-xs font-mono text-cyan-400">Spiritual journey</p>
                </div>
              </div>
              <button
                onClick={() => setShowTierInfo(false)}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-300 hover:scale-110"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const currentTier = getCurrentTier(gameState.miningLevel);
                const tierColors = {
                  green: 'text-green-400 bg-green-900/20 border-green-500/30',
                  blue: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
                  purple: 'text-purple-400 bg-purple-900/20 border-purple-500/30',
                  yellow: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
                };
                
                return (
                  <div className="space-y-4">
                    {/* Current Tier */}
                    <div className={`p-3 rounded-lg border ${tierColors[currentTier.color as keyof typeof tierColors]}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">{currentTier.symbol}</span>
                        <div>
                          <h3 className="text-sm font-mono font-bold tracking-wider">{currentTier.name}</h3>
                          <p className="text-xs font-mono opacity-80">Level {gameState.miningLevel}</p>
                        </div>
                      </div>
                      <p className="text-xs font-mono mb-2">{currentTier.description}</p>
                      
                      {/* Benefits */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-mono font-bold tracking-wider opacity-80">BENEFITS:</h4>
                        {currentTier.benefits.slice(0, 3).map((benefit, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs font-mono">
                            <span className="text-xs">•</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                        {currentTier.benefits.length > 3 && (
                          <div className="text-xs font-mono text-gray-400 italic">
                            +{currentTier.benefits.length - 3} more benefits
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress to Next Tier */}
                    {currentTier.nextTier && (
                      <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-mono font-bold tracking-wider text-gray-300">NEXT:</h4>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{currentTier.nextTier.symbol}</span>
                            <span className="text-xs font-mono font-bold text-gray-300">{currentTier.nextTier.name}</span>
                          </div>
                        </div>
                        
                        <div className="mb-1">
                          <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                            <span>{gameState.miningLevel}/{currentTier.nextTier.level}</span>
                            <span>{Math.round((gameState.miningLevel / currentTier.nextTier.level) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-1.5 border border-gray-600/30 overflow-hidden">
                            <div 
                              className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((gameState.miningLevel / currentTier.nextTier.level) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        <p className="text-xs font-mono text-gray-400">
                          {currentTier.nextTier.level - gameState.miningLevel} levels to {currentTier.nextTier.name}
                        </p>
                      </div>
                    )}

                    {/* All Tiers Overview */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold tracking-wider text-gray-300">ALL TIERS:</h4>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { name: 'NOVICE', symbol: '🌱', color: 'green', level: 1 },
                          { name: 'ADEPT', symbol: '🔮', color: 'blue', level: 15 },
                          { name: 'EXPERT', symbol: '💎', color: 'purple', level: 30 },
                          { name: 'MASTER', symbol: '🌟', color: 'yellow', level: 50 }
                        ].map((tier) => {
                          const isCurrent = tier.name === currentTier.name;
                          const isUnlocked = gameState.miningLevel >= tier.level;
                          const tierColorClasses = {
                            green: isCurrent ? 'text-green-400 bg-green-900/30 border-green-400/50' : isUnlocked ? 'text-green-300 bg-green-900/20 border-green-500/30' : 'text-gray-500 bg-gray-800/20 border-gray-600/30',
                            blue: isCurrent ? 'text-blue-400 bg-blue-900/30 border-blue-400/50' : isUnlocked ? 'text-blue-300 bg-blue-900/20 border-blue-500/30' : 'text-gray-500 bg-gray-800/20 border-gray-600/30',
                            purple: isCurrent ? 'text-purple-400 bg-purple-900/30 border-purple-400/50' : isUnlocked ? 'text-purple-300 bg-purple-900/20 border-purple-500/30' : 'text-gray-500 bg-gray-800/20 border-gray-600/30',
                            yellow: isCurrent ? 'text-yellow-400 bg-yellow-900/30 border-yellow-400/50' : isUnlocked ? 'text-yellow-300 bg-yellow-900/20 border-yellow-500/30' : 'text-gray-500 bg-gray-800/20 border-gray-600/30'
                          };
                          
                          return (
                            <div
                              key={tier.name}
                              className={`p-2 rounded-lg border text-center transition-all duration-300 ${tierColorClasses[tier.color as keyof typeof tierColorClasses]}`}
                            >
                              <div className="text-sm mb-1">{tier.symbol}</div>
                              <div className="text-xs font-mono font-bold tracking-wider">{tier.name}</div>
                              <div className="text-xs opacity-70">{tier.level}</div>
                              {isCurrent && (
                                <div className="text-xs text-cyan-400 font-bold">NOW</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Compact Tips */}
                    <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-3">
                      <h4 className="text-xs font-mono font-bold tracking-wider text-cyan-300 mb-2">💡 TIPS:</h4>
                      <div className="space-y-1 text-xs font-mono text-gray-300">
                        <div>• Higher tiers = better bonuses & upgrades</div>
                        <div>• Focus on energy efficiency for longer sessions</div>
                        <div>• Auto-mining improves with tier level</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <TutorialOverlay />
    </div>
  );
};
