// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useGameContext } from '@/contexts/GameContext';
// import { useNotificationSystem } from './NotificationSystem';
// import { useAuth } from '@/hooks/useAuth';

// interface Upgrade {
//   id: string;
//   name: string;
//   level: number;
//   effect: string;
//   baseCost: number;
//   costMultiplier: number;
//   effectValue: number;
// }

// interface GameState {
//   divinePoints: number;
//   pointsPerSecond: number;
//   totalEarned24h: number;
//   totalEarned7d: number;
//   upgradesPurchased: number;
//   minersActive: number;
//   isMining: boolean;
//   lastSaveTime: number;
//   sessionStartTime: number;
//   totalPointsEarned: number;
//   lastDailyReset: string;
//   lastWeeklyReset: string;
//   version: string;
//   highScore: number;
//   allTimeHighScore: number;
//   currentEnergy: number;
//   maxEnergy: number;
//   lastEnergyRegen: number;
//   offlineEfficiencyBonus: number; // New: Bonus for offline mining
//   lastOfflineTime: number; // New: Track last offline time
//   unclaimedOfflineRewards: number; // New: Track unclaimed offline rewards
//   lastOfflineRewardTime: number; // New: Track when offline rewards were last calculated
  
//   // Progressive Mining System
//   miningLevel: number; // Current mining level (1-100)
//   miningExperience: number; // Experience points for mining
//   miningExperienceToNext: number; // Experience needed for next level
//   miningStreak: number; // Consecutive mining sessions
//   lastMiningSession: number; // Last time mining was active
//   miningMilestones: string[]; // Achieved mining milestones
//   miningMultiplier: number; // Current mining multiplier from levels
//   criticalMiningChance: number; // Chance for critical mining (bonus points)
//   miningMastery: number; // Mastery level (affects efficiency)
//   lastCriticalMining: number; // Last critical mining event
//   miningCombo: number; // Current mining combo multiplier
//   lastComboReset: number; // When combo was last reset
// }

// interface Achievement {
//   id: string;
//   name: string;
//   description: string;
//   condition: (state: GameState) => boolean;
//   unlocked: boolean;
//   unlockedAt?: number;
// }

// // Tutorial System Interfaces
// interface TutorialStep {
//   id: string;
//   title: string;
//   description: string;
//   target: string; // CSS selector or element ID
//   position: 'top' | 'bottom' | 'left' | 'right' | 'center';
//   action?: 'click' | 'hover' | 'wait' | 'info';
//   condition?: (state: GameState) => boolean;
//   completed?: boolean;
//   skipIf?: (state: GameState) => boolean;
// }

// interface TutorialState {
//   isActive: boolean;
//   currentStep: number;
//   steps: TutorialStep[];
//   isCompleted: boolean;
//   showTutorial: boolean;
//   highlightElement: string | null;
// }

// // Add missing interfaces




// // interface CardHeaderProps {
// //   title: string;
// //   isActive?: boolean;
// //   extraContent?: React.ReactNode;
// //   showToggle?: boolean;
// //   toggleState?: boolean;
// //   onToggle?: () => void;
// //   toggleText?: string;
// //   toggleIcon?: string;
// // }

// const GAME_VERSION = '1.1.0'; // Spiritual Awakening Version
// const SAVE_KEY = 'spiritualJourneyGame';
// const BACKUP_KEY = 'spiritualJourneyGame_backup';
// // const HIGH_SCORE_KEY = 'spiritualJourneyHighScore';
// const DIVINE_POINTS_KEY = 'spiritualEssencePoints';
// const TOTAL_EARNED_KEY = 'spiritualJourneyTotalEarned'; // New: Separate key for total earned
// const SESSION_KEY = 'spiritualJourneySession'; // New: Separate key for session data
// const TUTORIAL_KEY = 'spiritualJourneyTutorial'; // New: Tutorial progress key
// const ACHIEVEMENTS_KEY = 'spiritualJourneyAchievements'; // New: Achievements key
// const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
// const BACKUP_INTERVAL = 300000; // 5 minutes
// const OFFLINE_EFFICIENCY_CAP = 14; // 14 days max offline earnings
// const OFFLINE_EFFICIENCY_BONUS = 0.1; // 10% bonus per day offline (max 140%)

// // // Add CardHeader component outside the main component
// // const CardHeader: React.FC<CardHeaderProps> = ({ 
// //   title, 
// //   isActive = false, 
// //   extraContent,
// //   showToggle = false,
// //   toggleState = false,
// //   onToggle,
// //   toggleText = "TOGGLE",
// //   toggleIcon = "⚙️"
// // }) => (
// //   <div className="flex items-center justify-between mb-3">
// //     <div className="flex items-center space-x-2">
// //       <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
// //       <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">{title}</span>
// //     </div>
// //     <div className="flex items-center space-x-2">
// //       {extraContent}
// //       {showToggle && (
// //         <button
// //           onClick={onToggle}
// //           className={`font-mono font-bold px-2 py-1 rounded text-xs transition-all duration-300 border ${
// //             toggleState 
// //               ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400' 
// //               : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border-gray-500 hover:border-cyan-400 hover:text-cyan-300'
// //           }`}
// //         >
// //           {toggleIcon} {toggleText}
// //         </button>
// //       )}
// //     </div>
// //   </div>
// // );

// export const DivineMiningGame: React.FC = () => {
//   const { setPoints, activeBoosts } = useGameContext();
//   const { user } = useAuth();
//   const {
//     showAchievementNotification,
//     showMilestoneNotification,
//     showUpgradeNotification,
//     showSystemNotification,
//     showOfflineRewardsNotification,
//     // testNotificationSystem,
//   } = useNotificationSystem();
  
//   // Add missing state variables
//   // const [showHelp, setShowHelp] = useState(false);
//   // const [showDebug, setShowDebug] = useState(false);
//   const [, setLastSaveStatus] = useState<'success' | 'error' | 'pending'>('pending');
//   const [, setSaveMessage] = useState('');
//   const [, setMiningResumed] = useState(false);
//   const [showOfflineRewards, setShowOfflineRewards] = useState(false);
//   // const [comboResetTime, setComboResetTime] = useState(0);
//   // const [offlineRewardNotification, setOfflineRewardNotification] = useState('');
  
//   // Intelligent notification throttling system
//   const [notificationThrottles, setNotificationThrottles] = useState({
//     lastLevelUp: 0,
//     lastCriticalMining: 0,
//     lastMilestone: 0,
//     lastStreakReset: 0,
//     lastEnergyWarning: 0,
//     lastHighScore: 0
//   });
  
//   // Mining session state for notification suppression
//   const [miningSessionState, setMiningSessionState] = useState({
//     isActive: false,
//     startTime: 0,
//     lastNotificationTime: 0,
//     notificationCount: 0,
//     suppressNotifications: false
//   });
  
//   // Throttle intervals (in milliseconds) - INCREASED for mining sessions
//   const THROTTLE_INTERVALS = {
//     levelUp: 15000,       // 15 seconds between level up notifications (was 5)
//     criticalMining: 10000, // 10 seconds between critical mining notifications (was 3)
//     milestone: 30000,     // 30 seconds between milestone notifications (was 10)
//     streakReset: 45000,   // 45 seconds between streak reset notifications (was 15)
//     energyWarning: 60000, // 60 seconds between energy warnings (was 30)
//     highScore: 30000      // 30 seconds between high score notifications (was 10)
//   };



  
//   // Upgrade filtering state
//   const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'affordable' | 'recommended' | 'category'>('all');
//   const [selectedCategory, ] = useState<string>('all');
//   const [currentUpgradePage, setCurrentUpgradePage] = useState(1);
//   const upgradesPerPage = 12;
//   const [showUpgradeShop, setShowUpgradeShop] = useState(false);

//   const autoSaveRef = useRef<NodeJS.Timeout>();
//   const backupRef = useRef<NodeJS.Timeout>();
//   const miningIntervalRef = useRef<NodeJS.Timeout>();

//   // Helper function to get user-specific keys - ENSURE ALL DATA IS USER-SPECIFIC
//   const getUserSpecificKey = useCallback((baseKey: string): string => {
//     return user?.id ? `${baseKey}_${user.id}` : `${baseKey}_anonymous`;
//   }, [user?.id]);

//   // Get user-specific save keys
//   const getUserSaveKey = useCallback((): string => {
//     return getUserSpecificKey(SAVE_KEY);
//   }, [getUserSpecificKey]);

//   const getUserBackupKey = useCallback((): string => {
//     return getUserSpecificKey(BACKUP_KEY);
//   }, [getUserSpecificKey]);

//   const getUserDivinePointsKey = useCallback((): string => {
//     return getUserSpecificKey(DIVINE_POINTS_KEY);
//   }, [getUserSpecificKey]);

//   const getUserTotalEarnedKey = useCallback((): string => {
//     return getUserSpecificKey(TOTAL_EARNED_KEY);
//   }, [getUserSpecificKey]);

//   const getUserSessionKey = useCallback((): string => {
//     return getUserSpecificKey(SESSION_KEY);
//   }, [getUserSpecificKey]);

//   const getUserTutorialKey = useCallback((): string => {
//     return getUserSpecificKey(TUTORIAL_KEY);
//   }, [getUserSpecificKey]);

//   const getUserAchievementsKey = useCallback((): string => {
//     return getUserSpecificKey(ACHIEVEMENTS_KEY);
//   }, [getUserSpecificKey]);

//   const getUserHighScoreKey = useCallback((): string => {
//     return getUserSpecificKey('divineMiningHighScore');
//   }, [getUserSpecificKey]);

//   const getUserUpgradesKey = useCallback((): string => {
//     return getUserSpecificKey('divineMiningUpgrades');
//   }, [getUserSpecificKey]);

//   const getUserPrestigeKey = useCallback((): string => {
//     return getUserSpecificKey('divineMiningPrestigeMultiplier');
//   }, [getUserSpecificKey]);

//   const getUserPersonalizationKey = useCallback((): string => {
//     return getUserSpecificKey('userPersonalization');
//   }, [getUserSpecificKey]);

//   const getUserLastEventKey = useCallback((): string => {
//     return getUserSpecificKey('lastSpecialEvent');
//   }, [getUserSpecificKey]);

//   // Add user-specific randomization systems
//   interface UserPersonalization {
//     seed: number; // Unique seed for this user
//     upgradeVariations: Record<string, {
//       costMultiplier: number;
//       effectMultiplier: number;
//       unlockChance: number;
//     }>; // Cost/effect variations
//     availableUpgrades: string[]; // Which upgrades are available
//     specialEvents: string[]; // Special events this user can experience
//     personalityTraits: string[]; // User's spiritual personality
//     unlockConditions: Record<string, any>; // Special unlock conditions
//   }

//   // Generate user-specific personalization
//   const generateUserPersonalization = useCallback((userId: string): UserPersonalization => {
//     // Create a deterministic seed from user ID
//     const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
//     const random = (min: number, max: number) => {
//       const x = Math.sin(seed + Date.now()) * 10000;
//       return min + (x - Math.floor(x)) * (max - min);
//     };
    
//     // Generate upgrade variations (±20% cost, ±15% effect)
//     const upgradeVariations: Record<string, {
//       costMultiplier: number;
//       effectMultiplier: number;
//       unlockChance: number;
//     }> = {};
//     const allUpgradeIds = [
//       'meditation-speed', 'spiritual-energy', 'auto-mining', 'divine-awakening',
//       'quantum-consciousness', 'cosmic-awareness', 'stellar-enlightenment', 'galactic-transcendence',
//       'spiritual-efficiency', 'spiritual-capacity', 'spiritual-regen', 'offline-enlightenment',
//       'spiritual-sustain', 'divine-resonance', 'spiritual-overflow', 'spiritual-burst', 'spiritual-mastery'
//     ];
    
//     allUpgradeIds.forEach(id => {
//       upgradeVariations[id] = {
//         costMultiplier: 0.8 + random(0, 0.4), // ±20% cost variation
//         effectMultiplier: 0.85 + random(0, 0.3), // ±15% effect variation
//         unlockChance: random(0, 1) // Some upgrades might be locked initially
//       };
//     });
    
//     // Determine which upgrades are available (80-90% of all upgrades)
//     const availableUpgrades = allUpgradeIds.filter(() => random(0, 1) < 0.85);
    
//     // Special events this user can experience
//     const specialEvents = [
//       'cosmic-storm', 'spiritual-resonance', 'divine-intervention', 'energy-surge',
//       'meditation-mastery', 'enlightenment-burst', 'transcendence-moment'
//     ].filter(() => random(0, 1) < 0.6); // 60% chance for each event
    
//     // Personality traits that affect gameplay
//     const allTraits = [
//       'patient', 'impulsive', 'analytical', 'intuitive', 'disciplined', 'spontaneous',
//       'focused', 'explorative', 'conservative', 'adventurous', 'methodical', 'creative'
//     ];
//     const personalityTraits = allTraits.filter(() => random(0, 1) < 0.4); // 40% chance for each trait
    
//     // Special unlock conditions
//     const unlockConditions: Record<string, any> = {};
//     if (random(0, 1) < 0.3) unlockConditions['divine-resonance'] = { requiresLevel: 10 };
//     if (random(0, 1) < 0.4) unlockConditions['auto-mining'] = { requiresPoints: 100000 };
//     if (random(0, 1) < 0.25) unlockConditions['galactic-transcendence'] = { requiresStreak: 5 };
    
//     return {
//       seed,
//       upgradeVariations,
//       availableUpgrades,
//       specialEvents,
//       personalityTraits,
//       unlockConditions
//     };
//   }, []);

//   // Get or create user personalization
//   const getUserPersonalization = useCallback((): UserPersonalization => {
//     const userKey = getUserPersonalizationKey();
//     const saved = localStorage.getItem(userKey);
    
//     if (saved) {
//       try {
//         return JSON.parse(saved);
//       } catch (error) {
//         console.error('Error loading user personalization:', error);
//       }
//     }
    
//     // Generate new personalization for this user
//     const personalization = generateUserPersonalization(String(user?.id || 'anonymous'));
//     localStorage.setItem(userKey, JSON.stringify(personalization));
//     return personalization;
//   }, [getUserPersonalizationKey, generateUserPersonalization, user?.id]);

//   // Intelligent notification system with aggressive mining suppression
//   const showThrottledNotification = useCallback((
//     type: keyof typeof THROTTLE_INTERVALS,
//     title: string,
//     message: string,
//     notificationType: 'success' | 'error' | 'warning' | 'info' = 'info'
//   ) => {
//     const now = Date.now();
    
//     // AGGRESSIVE SUPPRESSION: If mining is active and we've shown too many notifications recently
//     if (miningSessionState.isActive) {
//       const timeSinceLastNotification = now - miningSessionState.lastNotificationTime;
//       const maxNotificationsPerMinute = 3; // Maximum 3 notifications per minute during mining
      
//       // If we've shown too many notifications recently, suppress this one
//       if (miningSessionState.notificationCount >= maxNotificationsPerMinute && timeSinceLastNotification < 60000) {
//         console.log(`Suppressing notification during mining: ${title}`);
//         return false;
//       }
      
//       // If we've shown notifications recently, increase the throttle
//       if (timeSinceLastNotification < 30000) { // 30 seconds
//         console.log(`Throttling notification during mining: ${title}`);
//         return false;
//       }
//     }
    
//     const lastNotification = notificationThrottles[`last${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof notificationThrottles];
//     const throttleInterval = THROTTLE_INTERVALS[type];
    
//     if (now - lastNotification >= throttleInterval) {
//       showSystemNotification(title, message, notificationType);
//       setNotificationThrottles(prev => ({
//         ...prev,
//         [`last${type.charAt(0).toUpperCase() + type.slice(1)}`]: now
//       }));
      
//       // Update mining session state
//       if (miningSessionState.isActive) {
//         setMiningSessionState(prev => ({
//           ...prev,
//           lastNotificationTime: now,
//           notificationCount: prev.notificationCount + 1
//         }));
//       }
      
//       return true; // Notification was shown
//     }
//     return false; // Notification was throttled
//   }, [notificationThrottles, miningSessionState, showSystemNotification]);

//   // Intelligent milestone notification with aggregation
//   const showIntelligentMilestoneNotification = useCallback((milestone: number) => {
//     const now = Date.now();
//     const lastMilestone = notificationThrottles.lastMilestone;
//     const throttleInterval = THROTTLE_INTERVALS.milestone;
    
//     if (now - lastMilestone >= throttleInterval) {
//       showMilestoneNotification(milestone);
//       setNotificationThrottles(prev => ({
//         ...prev,
//         lastMilestone: now
//       }));
//     }
//   }, [notificationThrottles.lastMilestone, showMilestoneNotification]);

//   // const migrateLocalToSupabase = useCallback(() => {
//   //   // Simulate sync process
//   //   setTimeout(() => {
//   //     showSystemNotification('Sync Complete', 'Your spiritual journey has been synced to the cloud!', 'success');
//   //   }, 2000);
//   // }, [showSystemNotification]);





//   // Utility function to format numbers with commas and abbreviations
//   const formatNumber = useCallback((num: number): string => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + 'M';
//     } else if (num >= 1000) {
//       return (num / 1000).toFixed(1) + 'K';
//     } else {
//       return num.toLocaleString();
//     }
//   }, []);

//   const getFilterDisplayName = useCallback((filter: string): string => {
//     switch (filter) {
//       case 'all': return 'ALL';
//       case 'affordable': return 'AFFORDABLE';
//       case 'recommended': return 'RECOMMENDED';
//       case 'category': return 'CATEGORY';
//       default: return filter.toUpperCase();
//     }
//   }, []);

//   // const getAvailableCategories = useCallback((): string[] => {
//   //   return ['all', 'meditation', 'spiritual', 'special', 'transcendence'];
//   // }, []);

//   // const getCategoryDisplayName = useCallback((category: string): string => {
//   //   switch (category) {
//   //     case 'all': return 'ALL';
//   //     case 'meditation': return 'MEDITATION';
//   //     case 'spiritual': return 'SPIRITUAL';
//   //     case 'special': return 'SPECIAL';
//   //     case 'transcendence': return 'TRANSCENDENCE';
//   //     default: return category.toUpperCase();
//   //   }
//   // }, []);

//   const getUpgradeCategory = useCallback((upgrade: Upgrade): string => {
//     if (upgrade.id.includes('meditation') || upgrade.id.includes('consciousness') || upgrade.id.includes('enlightenment')) return 'meditation';
//     if (upgrade.id.includes('spiritual') || upgrade.id.includes('energy')) return 'spiritual';
//     if (upgrade.id === 'auto-mining') return 'special';
//     if (upgrade.id.includes('auto') || upgrade.id.includes('divine') || upgrade.id.includes('transcendence')) return 'transcendence';
//     return 'other';
//   }, []);



//   // Load achievements from localStorage or use defaults
//   const getInitialAchievements = useCallback((): Achievement[] => {
//     const defaultAchievements: Achievement[] = [
//       {
//         id: 'first-meditation',
//         name: 'First Meditation',
//         description: 'Begin your spiritual journey with your first meditation',
//         condition: (state) => state.totalPointsEarned > 0,
//         unlocked: false
//       },
//       {
//         id: 'first-awakening',
//         name: 'First Awakening',
//         description: 'Experience your first spiritual awakening',
//         condition: (state) => state.upgradesPurchased >= 1,
//         unlocked: false
//       },
//       {
//         id: 'enlightened-speed',
//         name: 'Enlightened Speed',
//         description: 'Achieve 10 essence points per second through deep meditation',
//         condition: (state) => state.pointsPerSecond >= 10,
//         unlocked: false
//       },
//       {
//         id: 'spiritual-master',
//         name: 'Spiritual Master',
//         description: 'Accumulate 1,000,000 essence points through your journey',
//         condition: (state) => state.totalPointsEarned >= 1000000,
//         unlocked: false
//       },
//       {
//         id: 'awakening-master',
//         name: 'Awakening Master',
//         description: 'Achieve 50 spiritual awakenings',
//         condition: (state) => state.upgradesPurchased >= 50,
//         unlocked: false
//       },
//       {
//         id: 'mining-novice',
//         name: 'Mining Novice',
//         description: 'Reach mining level 5',
//         condition: (state) => state.miningLevel >= 5,
//         unlocked: false
//       },
//       {
//         id: 'mining-adept',
//         name: 'Mining Adept',
//         description: 'Reach mining level 25',
//         condition: (state) => state.miningLevel >= 25,
//         unlocked: false
//       },
//       {
//         id: 'mining-master',
//         name: 'Mining Master',
//         description: 'Reach mining level 50',
//         condition: (state) => state.miningLevel >= 50,
//         unlocked: false
//       },
//       {
//         id: 'critical-miner',
//         name: 'Critical Miner',
//         description: 'Achieve a critical mining hit',
//         condition: (state) => state.lastCriticalMining > 0,
//         unlocked: false
//       },
//       {
//         id: 'streak-master',
//         name: 'Streak Master',
//         description: 'Maintain a mining streak of 10',
//         condition: (state) => state.miningStreak >= 10,
//         unlocked: false
//       }
//     ];

//     try {
//       const userAchievementsKey = getUserAchievementsKey();
//       const savedAchievements = localStorage.getItem(userAchievementsKey);
      
//       if (savedAchievements) {
//         const parsed = JSON.parse(savedAchievements);
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           console.log('Loaded achievements from localStorage:', parsed);
          
//           // Merge with default achievements to ensure all achievements exist
//           const mergedAchievements = defaultAchievements.map(defaultAchievement => {
//             const savedAchievement = parsed.find(a => a.id === defaultAchievement.id);
//             return savedAchievement ? { ...defaultAchievement, ...savedAchievement } : defaultAchievement;
//           });
          
//           return mergedAchievements;
//         }
//       }
//     } catch (error) {
//       console.error('Error loading achievements from localStorage:', error);
//     }
    
//     console.log('Using default achievements');
//     return defaultAchievements;
//   }, [getUserSpecificKey]);

//   // Add achievements state
//   const [achievements, setAchievements] = useState<Achievement[]>(getInitialAchievements);

//   // Add missing functions
//   const getInitialState = useCallback((): GameState => {
//     // Load all-time high score from localStorage using user-specific key
//     const userHighScoreKey = getUserHighScoreKey();
//     const allTimeHighScore = parseInt(localStorage.getItem(userHighScoreKey) || '100', 10);
    
//     // Load divine points from separate localStorage key
//     const savedDivinePoints = parseInt(localStorage.getItem(getUserDivinePointsKey()) || '100', 10);
    
//     // Load total earned from separate localStorage key
//     const savedTotalEarned = parseInt(localStorage.getItem(getUserTotalEarnedKey()) || '0', 10);
    
//     // Load session data from separate localStorage key
//     const savedSessionData = localStorage.getItem(getUserSessionKey());
//     let sessionStartTime = Date.now();
//     let lastDailyReset = new Date().toDateString();
//     let lastWeeklyReset = new Date().toDateString();
    
//     if (savedSessionData) {
//       try {
//         const session = JSON.parse(savedSessionData);
//         sessionStartTime = session.sessionStartTime || Date.now();
//         lastDailyReset = session.lastDailyReset || new Date().toDateString();
//         lastWeeklyReset = session.lastWeeklyReset || new Date().toDateString();
//         console.log('Loaded session data:', session);
//       } catch (error) {
//         console.error('Error loading session data:', error);
//       }
//     }
    
//     // Load prestige multiplier
//     const prestigeMultiplier = parseFloat(localStorage.getItem(getUserPrestigeKey()) || '1.0');
    
//     const defaultState: GameState = {
//       divinePoints: Math.max(100, savedDivinePoints),
//       pointsPerSecond: 1.0 * prestigeMultiplier,
//       totalEarned24h: 0,
//       totalEarned7d: 0,
//       upgradesPurchased: 0,
//       minersActive: 1,
//       isMining: false,
//       lastSaveTime: Date.now(),
//       sessionStartTime: sessionStartTime,
//       totalPointsEarned: Math.max(0, savedTotalEarned),
//       lastDailyReset: lastDailyReset,
//       lastWeeklyReset: lastWeeklyReset,
//       version: GAME_VERSION,
//       highScore: Math.max(100, allTimeHighScore),
//       allTimeHighScore: allTimeHighScore,
//       currentEnergy: 1000,
//       maxEnergy: 1000,
//       lastEnergyRegen: Date.now(),
//       offlineEfficiencyBonus: 0, // New: Bonus for offline mining
//       lastOfflineTime: Date.now(), // New: Track last offline time
//       unclaimedOfflineRewards: 0, // New: Track unclaimed offline rewards
//       lastOfflineRewardTime: Date.now(), // New: Track when offline rewards were last calculated
//       // Progressive Mining System
//       miningLevel: 1,
//       miningExperience: 0,
//       miningExperienceToNext: 100, // Will be calculated properly
//       miningStreak: 0,
//       lastMiningSession: Date.now(),
//       miningMilestones: [],
//       miningMultiplier: 1.0,
//       criticalMiningChance: 0.02, // 2% base chance
//       miningMastery: 1,
//       lastCriticalMining: 0,
//       miningCombo: 1.0,
//       lastComboReset: Date.now()
//     };

//     try {
//       // Try to load main save
//       const saved = localStorage.getItem(getUserSaveKey());
//       console.log('Raw saved data:', saved);
      
//       if (saved) {
//         const parsed = JSON.parse(saved);
//         console.log('Parsed saved data:', parsed);
        
//         // Validate the saved data
//         if (validateGameState(parsed)) {
//           const now = Date.now();
//           const timeDiff = now - parsed.lastSaveTime;
          
//           console.log('Loading saved game state:', {
//             divinePoints: parsed.divinePoints,
//             pointsPerSecond: parsed.pointsPerSecond,
//             isMining: parsed.isMining,
//             lastSaveTime: new Date(parsed.lastSaveTime).toLocaleString()
//           });
          
//           // Calculate offline earnings (if mining was active and reasonable time passed)
//           let offlineEarnings = 0;
//           let offlineEnergyRegen = 0;
//           let offlineEfficiencyBonus = 0;
//           let unclaimedRewards = 0;
          
//           if (parsed.isMining && timeDiff > 0 && timeDiff < OFFLINE_EFFICIENCY_CAP * 24 * 60 * 60 * 1000) { // Max 14 days
//             // Calculate base offline earnings
//             const baseOfflineEarnings = parsed.pointsPerSecond * (timeDiff / 1000);
            
//             // Calculate offline efficiency bonus (10% per day, max 140%)
//             const daysOffline = Math.min(timeDiff / (24 * 60 * 60 * 1000), OFFLINE_EFFICIENCY_CAP);
//             offlineEfficiencyBonus = Math.min(daysOffline * OFFLINE_EFFICIENCY_BONUS, 1.4);
            
//             // Apply efficiency bonus to offline earnings
//             offlineEarnings = baseOfflineEarnings * (1 + offlineEfficiencyBonus);
            
//             // Calculate energy regeneration during offline time
//             // Note: We'll calculate this after upgrades are loaded
//             const baseRegen = 0.3; // Reduced base regen for better balance
//             offlineEnergyRegen = baseRegen * (timeDiff / 1000);
            
//             // Add to unclaimed rewards instead of immediately adding to points
//             unclaimedRewards = parsed.unclaimedOfflineRewards || 0;
//             unclaimedRewards += offlineEarnings;
            
//             console.log(`Offline earnings: ${offlineEarnings.toFixed(2)} points (${baseOfflineEarnings.toFixed(2)} base + ${(offlineEfficiencyBonus * 100).toFixed(1)}% bonus) over ${Math.floor(timeDiff / 1000 / 60)} minutes`);
//             console.log(`Offline energy regen: ${offlineEnergyRegen.toFixed(2)} energy`);
//             console.log(`Total unclaimed rewards: ${unclaimedRewards.toFixed(2)} points`);
            
//             // Set mining resumed flag
//             setMiningResumed(true);
//           }
          
//           const loadedState = {
//             ...parsed,
//             divinePoints: parsed.divinePoints, // Don't add offline earnings immediately
//             lastSaveTime: now,
//             sessionStartTime: parsed.sessionStartTime || sessionStartTime,
//             totalPointsEarned: Math.max(parsed.totalPointsEarned || 0, savedTotalEarned), // Don't add offline earnings to total yet
//             version: GAME_VERSION,
//             highScore: Math.max(parsed.highScore || 100, allTimeHighScore),
//             allTimeHighScore: Math.max(parsed.allTimeHighScore || 100, allTimeHighScore),
//             currentEnergy: Math.min(parsed.maxEnergy || 1000, parsed.currentEnergy + offlineEnergyRegen),
//             offlineEfficiencyBonus: parsed.offlineEfficiencyBonus || 0,
//             lastOfflineTime: parsed.lastOfflineTime || now,
//             lastDailyReset: parsed.lastDailyReset || lastDailyReset,
//             lastWeeklyReset: parsed.lastWeeklyReset || lastWeeklyReset,
//             unclaimedOfflineRewards: unclaimedRewards,
//             lastOfflineRewardTime: now,
//             // Progressive Mining System - with defaults for backward compatibility
//             miningLevel: parsed.miningLevel || 1,
//             miningExperience: parsed.miningExperience || 0,
//             miningExperienceToNext: parsed.miningExperienceToNext || 100,
//             miningStreak: parsed.miningStreak || 0,
//             lastMiningSession: parsed.lastMiningSession || now,
//             miningMilestones: parsed.miningMilestones || [],
//             miningMultiplier: parsed.miningMultiplier || 1.0,
//             criticalMiningChance: parsed.criticalMiningChance || 0.05,
//             miningMastery: parsed.miningMastery || 1,
//             lastCriticalMining: parsed.lastCriticalMining || 0,
//             miningCombo: parsed.miningCombo || 1.0,
//             lastComboReset: parsed.lastComboReset || now
//           };
          
//           console.log('Final loaded state:', {
//             divinePoints: loadedState.divinePoints,
//             pointsPerSecond: loadedState.pointsPerSecond,
//             isMining: loadedState.isMining,
//             highScore: loadedState.highScore,
//             allTimeHighScore: loadedState.allTimeHighScore
//           });
          
//           // Mark that we've loaded saved data
//           setHasLoadedSavedData(true);
          
//           return loadedState;
//         } else {
//           console.warn('Invalid saved game state, trying backup...');
//           console.log('Validation failed for:', parsed);
//           throw new Error('Invalid saved state');
//         }
//       } else {
//         console.log('No saved data found in localStorage');
//       }
//     } catch (error) {
//       console.error('Error loading main save:', error);
      
//       // Try to load backup
//       try {
//         const backup = localStorage.getItem(getUserBackupKey());
//         console.log('Backup data:', backup);
        
//         if (backup) {
//           const parsedBackup = JSON.parse(backup);
//           if (validateGameState(parsedBackup)) {
//             console.log('Recovered from backup');
//             setSaveMessage('Game recovered from backup');
//             return {
//               ...parsedBackup,
//               lastSaveTime: Date.now(),
//               version: GAME_VERSION,
//               highScore: Math.max(parsedBackup.highScore || 100, allTimeHighScore),
//               allTimeHighScore: Math.max(parsedBackup.allTimeHighScore || 100, allTimeHighScore)
//             };
//           }
//         }
//       } catch (backupError) {
//         console.error('Error loading backup:', backupError);
//       }
      
//       console.log('No valid save data found, starting fresh game');
//       setSaveMessage('Starting fresh game');
//     }
    
//     return defaultState;
//   }, [getUserSpecificKey]);

//   // Game state validation - IMPROVED VERSION
//   const validateGameState = (state: any): state is GameState => {
//     if (!state || typeof state !== 'object') return false;
    
//     const requiredFields = [
//       'divinePoints', 'pointsPerSecond', 'totalEarned24h', 'totalEarned7d',
//       'upgradesPurchased', 'minersActive', 'isMining', 'lastSaveTime',
//       'sessionStartTime', 'totalPointsEarned'
//     ];
    
//     // Check required fields exist and are numbers
//     for (const field of requiredFields) {
//       if (state[field] === undefined || state[field] === null) {
//         console.warn(`Missing field: ${field}`);
//         return false;
//       }
//       if (typeof state[field] !== 'number') {
//         console.warn(`Invalid field type: ${field} should be number, got ${typeof state[field]}`);
//         return false;
//       }
//     }
    
//     if (typeof state.isMining !== 'boolean') {
//       console.warn('isMining should be boolean');
//       return false;
//     }
    
//     // More lenient validation - allow reasonable ranges
//     if (state.divinePoints < 0) {
//       console.warn('divinePoints cannot be negative');
//       return false;
//     }
    
//     if (state.pointsPerSecond < 0) {
//       console.warn('pointsPerSecond cannot be negative');
//       return false;
//     }
    
//     // Allow negative values for earned stats (they might be reset)
//     if (state.totalEarned24h < 0) state.totalEarned24h = 0;
//     if (state.totalEarned7d < 0) state.totalEarned7d = 0;
//     if (state.totalPointsEarned < 0) state.totalPointsEarned = 0;
//     if (state.upgradesPurchased < 0) state.upgradesPurchased = 0;
//     if (state.minersActive < 0) state.minersActive = 1;
    
//     console.log('Game state validation passed');
//     return true;
//   };

//   const [gameState, setGameState] = useState<GameState>(getInitialState);
//   const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  
//   // Tutorial System State
//   const [tutorialState, setTutorialState] = useState<TutorialState>(() => {
//     const savedTutorial = localStorage.getItem(getUserTutorialKey());
//     if (savedTutorial) {
//       try {
//         return JSON.parse(savedTutorial);
//       } catch (error) {
//         console.error('Error loading tutorial state:', error);
//       }
//     }
    
//     return {
//       isActive: false,
//       currentStep: 0,
//       steps: [],
//       isCompleted: false,
//       showTutorial: false,
//       highlightElement: null
//     };
//   });

//   // Tutorial Steps Definition
//   const tutorialSteps: TutorialStep[] = [
//     {
//       id: 'welcome',
//       title: 'Welcome to Divine Mining!',
//       description: 'This tutorial will guide you through the basics of mining divine points. Let\'s start by understanding your main resource.',
//       target: '.divine-points-display',
//       position: 'center',
//       action: 'info'
//     },
//     {
//       id: 'divine-points',
//       title: 'Divine Points',
//       description: 'These are your main currency. You earn them by mining, and spend them on upgrades. Watch the number increase as you mine!',
//       target: '.divine-points-display',
//       position: 'bottom',
//       action: 'info'
//     },
//     {
//       id: 'mining-station',
//       title: 'Mining Station',
//       description: 'This is where the magic happens! Click "ACTIVATE MINING" to start earning points. The glowing core shows mining status.',
//       target: '.mining-station',
//       position: 'bottom',
//       action: 'click'
//     },
//     {
//       id: 'energy-system',
//       title: 'Energy System',
//       description: 'Mining consumes energy (red bar). When energy runs out, mining stops. Energy regenerates over time (blue text).',
//       target: '.energy-status',
//       position: 'top',
//       action: 'info'
//     },
//     {
//       id: 'first-mine',
//       title: 'Start Mining!',
//       description: 'Click the "ACTIVATE MINING" button to start earning points. Watch your divine points increase!',
//       target: '.mining-button',
//       position: 'bottom',
//       action: 'click',
//       condition: (state) => !state.isMining
//     },
//     {
//       id: 'mining-active',
//       title: 'Mining Active!',
//       description: 'Great! You\'re now mining. Notice how your points increase and energy decreases. The core glows when active.',
//       target: '.mining-station',
//       position: 'bottom',
//       action: 'info',
//       condition: (state) => state.isMining
//     },
//     {
//       id: 'upgrades-intro',
//       title: 'Upgrades',
//       description: 'Upgrades make you more efficient. They increase mining speed, energy capacity, and unlock new features.',
//       target: '.upgrades-section',
//       position: 'top',
//       action: 'info'
//     },
//     {
//       id: 'first-upgrade',
//       title: 'Buy Your First Upgrade',
//       description: 'Try buying "MINING SPEED" upgrade. It will increase how many points you earn per second!',
//       target: '.upgrade-mining-speed',
//       position: 'right',
//       action: 'click',
//       condition: (state) => state.divinePoints >= 25
//     },
//     {
//       id: 'upgrade-effect',
//       title: 'Upgrade Effect',
//       description: 'Notice how your mining rate increased! Upgrades stack, so buy more to become even more powerful.',
//       target: '.divine-points-display',
//       position: 'bottom',
//       action: 'info',
//       condition: (state) => state.upgradesPurchased > 0
//     },
//     {
//       id: 'energy-upgrades',
//       title: 'Energy Management',
//       description: 'Energy upgrades are crucial! They reduce energy costs and increase regeneration. Invest in them early.',
//       target: '.upgrade-energy-efficiency',
//       position: 'right',
//       action: 'info'
//     },
//     {
//       id: 'auto-mining',
//       title: 'Auto-Mining',
//       description: 'Auto-mining automatically starts mining when you have enough energy. It\'s a game-changer!',
//       target: '.upgrade-auto-mining',
//       position: 'right',
//       action: 'info'
//     },
//     {
//       id: 'offline-rewards',
//       title: 'Offline Rewards',
//       description: 'You earn points even when the game is closed! Longer offline time = bigger bonuses (up to 140%).',
//       target: '.offline-predictions',
//       position: 'top',
//       action: 'info',
//       condition: (state) => state.isMining
//     },
//     {
//       id: 'achievements',
//       title: 'Achievements',
//       description: 'Complete milestones to unlock achievements. They provide bonuses and track your progress.',
//       target: '.achievements-section',
//       position: 'top',
//       action: 'info',
//       condition: (state) => state.totalPointsEarned > 0
//     },
//     {
//       id: 'statistics',
//       title: 'Statistics',
//       description: 'Track your progress here. Session time, total earned, and efficiency stats help you optimize your strategy.',
//       target: '.statistics-section',
//       position: 'top',
//       action: 'info'
//     },
//     {
//       id: 'help-system',
//       title: 'Help & Tips',
//       description: 'Click "SHOW HELP" anytime for detailed game mechanics and pro tips. The debug menu has advanced features.',
//       target: '.help-button',
//       position: 'left',
//       action: 'info'
//     },
//     {
//       id: 'tutorial-complete',
//       title: 'Tutorial Complete!',
//       description: 'You\'re ready to become a Divine Mining master! Remember: balance mining speed with energy efficiency for optimal results.',
//       target: '.divine-points-display',
//       position: 'center',
//       action: 'info'
//     }
//   ];

//   // Tutorial System Functions
//   const startTutorial = useCallback(() => {
//     console.log('Starting tutorial with steps:', tutorialSteps.length);
//     setTutorialState(prev => ({
//       ...prev,
//       isActive: true,
//       currentStep: 0,
//       steps: tutorialSteps,
//       showTutorial: true,
//       highlightElement: tutorialSteps[0]?.target || null
//     }));
//   }, []);

//   const nextTutorialStep = useCallback(() => {
//     setTutorialState(prev => {
//       const nextStep = prev.currentStep + 1;
//       if (nextStep >= prev.steps.length) {
//         // Tutorial complete
//         const completedState = {
//           ...prev,
//           isActive: false,
//           isCompleted: true,
//           showTutorial: false,
//           highlightElement: null
//         };
//         localStorage.setItem(getUserTutorialKey(), JSON.stringify(completedState));
//         return completedState;
//       }
      
//       const newState = {
//         ...prev,
//         currentStep: nextStep,
//         highlightElement: prev.steps[nextStep]?.target || null
//       };
//       localStorage.setItem(getUserTutorialKey(), JSON.stringify(newState));
//       return newState;
//     });
//   }, []);

//   const skipTutorial = useCallback(() => {
//     const completedState = {
//       ...tutorialState,
//       isActive: false,
//       isCompleted: true,
//       showTutorial: false,
//       highlightElement: null
//     };
//     setTutorialState(completedState);
//     localStorage.setItem(getUserTutorialKey(), JSON.stringify(completedState));
//   }, [tutorialState]);



//   // Check if tutorial should be shown
//   useEffect(() => {
//     const shouldShowTutorial = !tutorialState.isCompleted && 
//                               gameState.divinePoints <= 100 && 
//                               gameState.upgradesPurchased === 0;
    
//     console.log('Tutorial check:', {
//       isCompleted: tutorialState.isCompleted,
//       divinePoints: gameState.divinePoints,
//       upgradesPurchased: gameState.upgradesPurchased,
//       shouldShowTutorial,
//       isActive: tutorialState.isActive
//     });
    
//     if (shouldShowTutorial && !tutorialState.isActive) {
//       // Auto-start tutorial for new players
//       console.log('Auto-starting tutorial...');
//       setTimeout(() => {
//         startTutorial();
//       }, 2000); // Wait 2 seconds for game to load
//     }
//   }, [gameState.divinePoints, gameState.upgradesPurchased, tutorialState.isCompleted, tutorialState.isActive, startTutorial]);

//   // Tutorial step validation
//   useEffect(() => {
//     if (!tutorialState.isActive || !tutorialState.steps[tutorialState.currentStep]) return;

//     const currentStep = tutorialState.steps[tutorialState.currentStep];
    
//     // Check if step should be skipped
//     if (currentStep.skipIf && currentStep.skipIf(gameState)) {
//       nextTutorialStep();
//       return;
//     }
    
//     // Check if step condition is met and auto-advance for info steps
//     if (currentStep.condition && currentStep.condition(gameState)) {
//       // Auto-advance after a short delay for info steps
//       if (currentStep.action === 'info') {
//         const timer = setTimeout(() => {
//           nextTutorialStep();
//         }, 3000);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [tutorialState.currentStep, tutorialState.isActive, gameState, nextTutorialStep]);

//   // Tutorial Overlay Component
//   const TutorialOverlay = () => {
//     if (!tutorialState.showTutorial || !tutorialState.steps[tutorialState.currentStep]) {
//       console.log('Tutorial overlay not showing:', {
//         showTutorial: tutorialState.showTutorial,
//         currentStep: tutorialState.currentStep,
//         stepsLength: tutorialState.steps.length
//       });
//       return null;
//     }

//     const currentStep = tutorialState.steps[tutorialState.currentStep];
//     const targetElement = document.querySelector(currentStep.target);

//     if (!targetElement) {
//       console.log('Target element not found:', currentStep.target);
//       return null;
//     }

//     console.log('Tutorial overlay rendering for step:', currentStep.id, 'target:', currentStep.target);

//     const rect = targetElement.getBoundingClientRect();
//     const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//     const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

//     const getTooltipPosition = () => {
//       const baseTop = rect.top + scrollTop;
//       const baseLeft = rect.left + scrollLeft;
//       const elementWidth = rect.width;
//       const elementHeight = rect.height;

//       switch (currentStep.position) {
//         case 'top':
//           return {
//             top: baseTop - 120,
//             left: baseLeft + elementWidth / 2 - 150,
//             transform: 'translateY(-10px)'
//           };
//         case 'bottom':
//           return {
//             top: baseTop + elementHeight + 10,
//             left: baseLeft + elementWidth / 2 - 150,
//             transform: 'translateY(10px)'
//           };
//         case 'left':
//           return {
//             top: baseTop + elementHeight / 2 - 60,
//             left: baseLeft - 320,
//             transform: 'translateX(-10px)'
//           };
//         case 'right':
//           return {
//             top: baseTop + elementHeight / 2 - 60,
//             left: baseLeft + elementWidth + 10,
//             transform: 'translateX(10px)'
//           };
//         case 'center':
//         default:
//           return {
//             top: baseTop + elementHeight / 2 - 60,
//             left: baseLeft + elementWidth / 2 - 150,
//             transform: 'translateY(0)'
//           };
//       }
//     };

//     const position = getTooltipPosition();

//     return (
//       <>
//         {/* Backdrop */}
//         <div className="fixed inset-0 bg-black/50 z-40" onClick={nextTutorialStep} />
        
//         {/* Highlight */}
//         <div 
//           className="fixed z-50 pointer-events-none"
//           style={{
//             top: rect.top + scrollTop - 5,
//             left: rect.left + scrollLeft - 5,
//             width: rect.width + 10,
//             height: rect.height + 10,
//             border: '3px solid #00ffff',
//             borderRadius: '8px',
//             boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
//             animation: 'tutorial-pulse 2s ease-in-out infinite'
//           }}
//         />
        
//         {/* Tooltip */}
//         <div 
//           className="fixed z-50 bg-black/90 backdrop-blur-xl border border-cyan-400 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.3)] max-w-sm"
//           style={position}
//         >
//           <div className="text-cyan-400 font-mono font-bold text-sm mb-2">
//             {currentStep.title}
//           </div>
//           <div className="text-gray-300 font-mono text-xs mb-3">
//             {currentStep.description}
//           </div>
//           <div className="flex justify-between items-center">
//             <div className="text-cyan-500 font-mono text-xs">
//               Step {tutorialState.currentStep + 1} of {tutorialState.steps.length}
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={skipTutorial}
//                 className="text-xs text-gray-400 hover:text-red-400 font-mono px-2 py-1 rounded border border-gray-600 hover:border-red-400 transition-colors"
//               >
//                 Skip
//               </button>
//               <button
//                 onClick={nextTutorialStep}
//                 className="text-xs text-cyan-400 hover:text-cyan-300 font-mono px-3 py-1 rounded border border-cyan-400 hover:border-cyan-300 transition-colors"
//               >
//                 {tutorialState.currentStep === tutorialState.steps.length - 1 ? 'Finish' : 'Next'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </>
//     );
//   };

//   // Tutorial CSS Animation
//   useEffect(() => {
//     const style = document.createElement('style');
//     style.textContent = `
//       @keyframes tutorial-pulse {
//         0%, 100% {
//           box-shadow: 0 0 20px rgba(0, 255, 255, 0.6);
//           border-color: #00ffff;
//         }
//         50% {
//           box-shadow: 0 0 30px rgba(0, 255, 255, 0.9);
//           border-color: #00ccff;
//         }
//       }
//     `;
//     document.head.appendChild(style);
//     return () => {
//       if (document.head.contains(style)) {
//         document.head.removeChild(style);
//       }
//     };
//   }, []);
  
//   // Sync mining game points with shared context - SINGLE SOURCE OF TRUTH
//   useEffect(() => {
//     // Update the shared context with our points
//     setPoints(gameState.divinePoints);

//     // Save divine points to localStorage immediately whenever they change
//     localStorage.setItem(getUserDivinePointsKey(), gameState.divinePoints.toString());

//     // Check for new high score
//     if (gameState.divinePoints > gameState.highScore) {
//       const newHighScore = gameState.divinePoints;
//       setGameState(prev => ({
//         ...prev,
//         highScore: newHighScore,
//         allTimeHighScore: Math.max(prev.allTimeHighScore, newHighScore)
//       }));
      
//       // Save high score to localStorage immediately using user-specific key
//       const userHighScoreKey = getUserHighScoreKey();
//       localStorage.setItem(userHighScoreKey, newHighScore.toString());
      
//       // Show high score notification with throttling
//       if (newHighScore > gameState.allTimeHighScore) {
//         showThrottledNotification(
//           'highScore',
//           '🎉 NEW ALL-TIME HIGH SCORE!',
//           `${newHighScore.toLocaleString()} points`,
//           'success'
//         );
//       } else {
//         showThrottledNotification(
//           'highScore',
//           '🏆 New High Score!',
//           `${newHighScore.toLocaleString()} points`,
//           'success'
//         );
//       }
//     }
//   }, [gameState.divinePoints, setPoints, gameState.highScore, gameState.allTimeHighScore, getUserSpecificKey]);

//   // Apply active boosts to mining rate (enhanced version moved after upgrades)
//   const getBoostedMiningRate = useCallback(() => {
//     const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
//     const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
//     return gameState.pointsPerSecond * totalMultiplier;
//   }, [gameState.pointsPerSecond, activeBoosts]);





//   // Load upgrades from localStorage or use defaults
//   const getInitialUpgrades = useCallback((): Upgrade[] => {
//     try {
//       const userUpgradesKey = getUserUpgradesKey();
//       const savedUpgrades = localStorage.getItem(userUpgradesKey);
//       if (savedUpgrades) {
//         const parsed = JSON.parse(savedUpgrades);
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           console.log('Loaded upgrades from localStorage:', parsed);
//           return parsed;
//         }
//       }
//     } catch (error) {
//       console.error('Error loading upgrades from localStorage:', error);
//     }
    
//     // Get user personalization for unique experience
//     const personalization = getUserPersonalization();
    
//     // Base upgrade definitions
//     const baseUpgrades = [
//       {
//         id: 'meditation-speed',
//         name: 'MEDITATION SPEED',
//         level: 0,
//         effect: '+0.5 essence/sec',
//         baseCost: 25,
//         costMultiplier: 1.12,
//         effectValue: 0.5
//       },
//       {
//         id: 'spiritual-energy',
//         name: 'SPIRITUAL ENERGY',
//         level: 0,
//         effect: '+50 spiritual energy',
//         baseCost: 75,
//         costMultiplier: 1.15,
//         effectValue: 50
//       },
//       {
//         id: 'auto-mining',
//         name: 'AUTO MINING',
//         level: 0,
//         effect: 'Auto-start mining when energy available',
//         baseCost: 500000,
//         costMultiplier: 2.0,
//         effectValue: 1
//       },
//       {
//         id: 'divine-awakening',
//         name: 'DIVINE AWAKENING',
//         level: 0,
//         effect: '+2.0 essence/sec',
//         baseCost: 750,
//         costMultiplier: 1.22,
//         effectValue: 2.0
//       },
//       {
//         id: 'quantum-consciousness',
//         name: 'QUANTUM CONSCIOUSNESS',
//         level: 0,
//         effect: '+5.0 essence/sec',
//         baseCost: 3000,
//         costMultiplier: 1.25,
//         effectValue: 5.0
//       },
//       {
//         id: 'cosmic-awareness',
//         name: 'COSMIC AWARENESS',
//         level: 0,
//         effect: '+10.0 essence/sec',
//         baseCost: 10000,
//         costMultiplier: 1.3,
//         effectValue: 10.0
//       },
//       {
//         id: 'stellar-enlightenment',
//         name: 'STELLAR ENLIGHTENMENT',
//         level: 0,
//         effect: '+25.0 essence/sec',
//         baseCost: 50000,
//         costMultiplier: 1.35,
//         effectValue: 25.0
//       },
//       {
//         id: 'galactic-transcendence',
//         name: 'GALACTIC TRANSCENDENCE',
//         level: 0,
//         effect: '+100.0 essence/sec',
//         baseCost: 250000,
//         costMultiplier: 1.4,
//         effectValue: 100.0
//       },
//       {
//         id: 'spiritual-efficiency',
//         name: 'SPIRITUAL EFFICIENCY',
//         level: 0,
//         effect: '-10% spiritual energy cost',
//         baseCost: 50000,
//         costMultiplier: 1.5,
//         effectValue: -0.1
//       },
//       {
//         id: 'spiritual-capacity',
//         name: 'SPIRITUAL CAPACITY',
//         level: 0,
//         effect: '+2000 max spiritual energy',
//         baseCost: 75000,
//         costMultiplier: 1.6,
//         effectValue: 2000
//       },
//       {
//         id: 'spiritual-regen',
//         name: 'SPIRITUAL REGENERATION',
//         level: 0,
//         effect: '+1.0 spiritual energy/sec',
//         baseCost: 100000,
//         costMultiplier: 1.7,
//         effectValue: 1.0
//       },
//       {
//         id: 'offline-enlightenment',
//         name: 'OFFLINE ENLIGHTENMENT',
//         level: 0,
//         effect: '+5% offline spiritual growth',
//         baseCost: 150000,
//         costMultiplier: 1.8,
//         effectValue: 0.05
//       },
//       {
//         id: 'spiritual-sustain',
//         name: 'SPIRITUAL SUSTAIN',
//         level: 0,
//         effect: '-20% spiritual energy cost',
//         baseCost: 200000,
//         costMultiplier: 1.9,
//         effectValue: -0.2
//       },
//       {
//         id: 'divine-resonance',
//         name: 'DIVINE RESONANCE',
//         level: 0,
//         effect: '+50% spiritual boost effectiveness',
//         baseCost: 1000000,
//         costMultiplier: 2.5,
//         effectValue: 0.5
//       },
//       {
//         id: 'spiritual-overflow',
//         name: 'SPIRITUAL OVERFLOW',
//         level: 0,
//         effect: '+5000 max spiritual energy',
//         baseCost: 2000000,
//         costMultiplier: 3.0,
//         effectValue: 5000
//       },
//       {
//         id: 'spiritual-burst',
//         name: 'SPIRITUAL BURST',
//         level: 0,
//         effect: '+2.0 spiritual energy/sec',
//         baseCost: 3000000,
//         costMultiplier: 3.5,
//         effectValue: 2.0
//       },
//       {
//         id: 'spiritual-mastery',
//         name: 'SPIRITUAL MASTERY',
//         level: 0,
//         effect: '-30% spiritual energy cost',
//         baseCost: 5000000,
//         costMultiplier: 4.0,
//         effectValue: -0.3
//       }
//     ];
    
//     // Apply user personalization to create unique upgrades
//     const personalizedUpgrades = baseUpgrades
//       .filter(upgrade => personalization.availableUpgrades.includes(upgrade.id))
//       .map(upgrade => {
//         const variation = personalization.upgradeVariations[upgrade.id];
//         if (!variation) return upgrade;
        
//         // Apply cost and effect variations
//         const personalizedCost = Math.floor(upgrade.baseCost * variation.costMultiplier);
//         const personalizedEffect = upgrade.effectValue * variation.effectMultiplier;
        
//         // Update effect description based on new value
//         let personalizedEffectDesc = upgrade.effect;
//         if (upgrade.id.includes('essence/sec')) {
//           personalizedEffectDesc = `+${personalizedEffect.toFixed(1)} essence/sec`;
//         } else if (upgrade.id.includes('energy')) {
//           if (upgrade.id.includes('max')) {
//             personalizedEffectDesc = `+${Math.floor(personalizedEffect)} max spiritual energy`;
//           } else if (upgrade.id.includes('sec')) {
//             personalizedEffectDesc = `+${personalizedEffect.toFixed(1)} spiritual energy/sec`;
//           } else {
//             personalizedEffectDesc = `+${Math.floor(personalizedEffect)} spiritual energy`;
//           }
//         } else if (upgrade.id.includes('cost')) {
//           const percentage = Math.abs(personalizedEffect * 100);
//           personalizedEffectDesc = `-${percentage.toFixed(0)}% spiritual energy cost`;
//         } else if (upgrade.id.includes('growth')) {
//           const percentage = personalizedEffect * 100;
//           personalizedEffectDesc = `+${percentage.toFixed(1)}% offline spiritual growth`;
//         } else if (upgrade.id.includes('effectiveness')) {
//           const percentage = personalizedEffect * 100;
//           personalizedEffectDesc = `+${percentage.toFixed(0)}% spiritual boost effectiveness`;
//         }
        
//         return {
//           ...upgrade,
//           baseCost: personalizedCost,
//           effectValue: personalizedEffect,
//           effect: personalizedEffectDesc,
//           // Add personality-based modifiers
//           personalityBonus: personalization.personalityTraits.includes('patient') && upgrade.id.includes('efficiency') ? 1.1 : 1,
//           personalityPenalty: personalization.personalityTraits.includes('impulsive') && upgrade.id.includes('cost') ? 1.2 : 1
//         };
//       });
    
//     console.log('Generated personalized upgrades for user:', {
//       availableCount: personalizedUpgrades.length,
//       totalCount: baseUpgrades.length,
//       personalityTraits: personalization.personalityTraits,
//       specialEvents: personalization.specialEvents
//     });
    
//     return personalizedUpgrades;
//   }, [getUserSpecificKey]);

//   const [upgrades, setUpgrades] = useState<Upgrade[]>(getInitialUpgrades());

//   // Add missing upgrade functions after upgrades are defined
//   const isUpgradeMaxed = useCallback((upgrade: Upgrade): boolean => {
//     // Define max levels for different upgrades - Professional tier system
//     const maxLevels: Record<string, number> = {
//       // Mining/Meditation Upgrades - Core progression
//       'meditation-speed': 50,
//       'divine-awakening': 40,
//       'quantum-consciousness': 30,
//       'cosmic-awareness': 25,
//       'stellar-enlightenment': 20,
//       'galactic-transcendence': 15,
      
//       // Energy Upgrades - Efficiency focused
//       'spiritual-energy': 30,
//       'spiritual-capacity': 25,
//       'spiritual-regen': 20,
//       'spiritual-burst': 15,
//       'spiritual-overflow': 10,
      
//       // Efficiency Upgrades - Cost reduction
//       'spiritual-efficiency': 20,
//       'spiritual-sustain': 15,
//       'spiritual-mastery': 10,
      
//       // Special Upgrades - Limited but powerful
//       'offline-enlightenment': 10,
//       'auto-mining': 1,
//       'divine-resonance': 5,
//     };
    
//     const maxLevel = maxLevels[upgrade.id] || 25; // Default max level
//     return upgrade.level >= maxLevel;
//   }, []);

//   const getUpgradeCost = useCallback((upgrade: Upgrade): number => {
//     return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
//   }, []);

//   const getUpgradeEfficiency = useCallback((upgrade: Upgrade): number => {
//     const cost = getUpgradeCost(upgrade);
//     return upgrade.effectValue / cost * 1000; // Points per 1000 cost
//   }, [getUpgradeCost]);

//   const purchaseUpgrade = useCallback((upgradeId: string) => {
//     const upgrade = upgrades.find(u => u.id === upgradeId);
//     if (!upgrade) return;
    
//     const cost = getUpgradeCost(upgrade);
//     if (gameState.divinePoints < cost) return;
    
//     setUpgrades(prev => prev.map(u => 
//       u.id === upgradeId ? { ...u, level: u.level + 1 } : u
//     ));
    
//     setGameState(prev => ({
//       ...prev,
//       divinePoints: prev.divinePoints - cost,
//       upgradesPurchased: prev.upgradesPurchased + 1
//     }));
    
//     showUpgradeNotification(upgrade.name, cost);
//   }, [upgrades, getUpgradeCost, gameState.divinePoints, showUpgradeNotification]);

//   const getSessionDuration = useCallback((): string => {
//     const duration = Date.now() - gameState.sessionStartTime;
//     const hours = Math.floor(duration / (1000 * 60 * 60));
//     const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((duration % (1000 * 60)) / 1000);
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//   }, [gameState.sessionStartTime]);

//   const claimOfflineRewards = useCallback(() => {
//     if (gameState.unclaimedOfflineRewards <= 0) return;
    
//     setGameState(prev => ({
//       ...prev,
//       divinePoints: prev.divinePoints + prev.unclaimedOfflineRewards,
//       totalPointsEarned: prev.totalPointsEarned + prev.unclaimedOfflineRewards,
//       unclaimedOfflineRewards: 0
//     }));
    
//     showOfflineRewardsNotification(gameState.unclaimedOfflineRewards, gameState.offlineEfficiencyBonus, () => {});
//     setShowOfflineRewards(false);
//   }, [gameState.unclaimedOfflineRewards, gameState.offlineEfficiencyBonus, showOfflineRewardsNotification]);



//   const getFilteredUpgrades = useCallback((): Upgrade[] => {
//     let filtered = [...upgrades];
    
//     switch (upgradeFilter) {
//       case 'affordable':
//         filtered = filtered.filter(upgrade => {
//           const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
//           return gameState.divinePoints >= cost;
//         });
//         break;
//       case 'recommended':
//         filtered = filtered.filter(upgrade => 
//           getUpgradeEfficiency(upgrade) > 0.1 && !isUpgradeMaxed(upgrade)
//         );
//         break;
//       case 'category':
//         if (selectedCategory !== 'all') {
//           filtered = filtered.filter(upgrade => {
//             const category = getUpgradeCategory(upgrade);
//             return category === selectedCategory;
//           });
//         }
//         break;
//     }
    
//     return filtered;
//   }, [upgrades, upgradeFilter, selectedCategory, getUpgradeEfficiency, isUpgradeMaxed, gameState.divinePoints]);

//   const getTotalPages = useCallback((): number => {
//     return Math.ceil(getFilteredUpgrades().length / upgradesPerPage);
//   }, [getFilteredUpgrades]);

//   const getPaginatedUpgrades = useCallback((): Upgrade[] => {
//     const filtered = getFilteredUpgrades();
//     const startIndex = (currentUpgradePage - 1) * upgradesPerPage;
//     const endIndex = startIndex + upgradesPerPage;
//     return filtered.slice(startIndex, endIndex);
//   }, [getFilteredUpgrades, currentUpgradePage]);



//   // Fixed Progressive Mining System - Levels 1-20
//   const calculateExperienceToNext = useCallback((level: number): number => {
//     if (level >= 20) return 50000; // Cap at reasonable amount
//     return Math.floor(100 * Math.pow(1.3, level - 1)); // Much more reasonable scaling
//   }, []);

//   const calculateMiningMultiplier = useCallback((level: number): number => {
//     if (level >= 20) return 2.0;
//     return 1 + (level - 1) * 0.05; // +5% per level
//   }, []);

//   const calculateCriticalChance = useCallback((level: number): number => {
//     if (level >= 20) return 0.25;
//     return 0.02 + (level - 1) * 0.01; // 2% base + 1% per level
//   }, []);

//   const calculateMasteryBonus = useCallback((level: number): number => {
//     if (level >= 20) return 1.4;
//     return 1 + (level - 1) * 0.02; // +2% per level
//   }, []);

//   const checkLevelUp = useCallback((currentLevel: number, currentExp: number): { newLevel: number; newExp: number; leveledUp: boolean; bonusReward?: number } => {
//     const expToNext = calculateExperienceToNext(currentLevel);
//     if (currentExp >= expToNext) {
//       const newLevel = currentLevel + 1;
//       const newExp = currentExp - expToNext;
      
//       // Calculate bonus reward for leveling up
//       const bonusReward = Math.floor(50 * Math.pow(1.1, newLevel - 1));
      
//       return { newLevel, newExp, leveledUp: true, bonusReward };
//     }
//     return { newLevel: currentLevel, newExp: currentExp, leveledUp: false };
//   }, [calculateExperienceToNext]);

//   const checkMilestones = useCallback((level: number, milestones: string[]): { newMilestones: string[]; milestoneRewards: number } => {
//     const milestoneData = [
//       { level: 2, reward: 500, name: 'First Awakening', description: 'The first step on your spiritual path' },
//       { level: 5, reward: 2000, name: 'Seeker Mastery', description: 'You have mastered the basics of spiritual practice' },
//       { level: 7, reward: 5000, name: 'Inner Peace', description: 'You have found inner tranquility' },
//       { level: 10, reward: 15000, name: 'Disciple Mastery', description: 'You have become a true spiritual disciple' },
//       { level: 12, reward: 30000, name: 'Wisdom Seeker', description: 'You are seeking deeper spiritual wisdom' },
//       { level: 15, reward: 75000, name: 'Sage Mastery', description: 'You have achieved sage-like wisdom' },
//       { level: 17, reward: 150000, name: 'Enlightenment Near', description: 'You are close to true enlightenment' },
//       { level: 20, reward: 500000, name: 'Divine Transcendence', description: 'You have achieved spiritual transcendence' }
//     ];
//     const newMilestones = milestoneData.filter(m => level >= m.level && !milestones.includes(`level-${m.level}`)).map(m => `level-${m.level}`);
//     const milestoneRewards = milestoneData.filter(m => level >= m.level && !milestones.includes(`level-${m.level}`)).reduce((sum, m) => sum + m.reward, 0);
//     return { newMilestones, milestoneRewards };
//   }, []);

//   const checkCriticalMining = useCallback((chance: number): boolean => {
//     return Math.random() < chance;
//   }, []);

//   const updateMiningStreak = useCallback((lastSession: number): number => {
//     const now = Date.now();
//     const timeDiff = now - lastSession;
//     const maxStreakBreak = 5 * 60 * 1000; // 5 minutes
    
//     if (timeDiff <= maxStreakBreak) {
//       return 1; // Continue streak (increment by 1)
//     } else {
//       return -1; // Reset streak (decrement by 1 to reset to 0)
//     }
//   }, []);

//   const calculateComboMultiplier = useCallback((streak: number): number => {
//     // Enhanced combo system with better scaling
//     if (streak <= 5) {
//       return 1 + (streak * 0.08); // 8% per streak early
//     } else if (streak <= 15) {
//       return 1 + 0.4 + (streak - 5) * 0.06; // 6% per streak mid
//     } else if (streak <= 30) {
//       return 1 + 1.0 + (streak - 15) * 0.04; // 4% per streak late
//     } else {
//       return Math.min(4.0, 1 + 1.6 + (streak - 30) * 0.02); // 2% per streak expert, max 4x
//     }
//   }, []);

//   const calculatePrestigeBonus = useCallback((level: number): number => {
//     if (level >= 20) return 1.12;
//     return 1 + Math.floor((level - 1) / 5) * 0.03; // +3% every 5 levels
//   }, []);

//   const getCurrentTier = useCallback((level: number): { name: string; color: string; maxLevel: number; progress: number; description: string; symbol: string } => {
//     const tiers = [
//       { 
//         name: 'Seeker', 
//         color: 'green', 
//         maxLevel: 5, 
//         description: 'Beginning the spiritual journey',
//         symbol: '🕯️'
//       },
//       { 
//         name: 'Disciple', 
//         color: 'blue', 
//         maxLevel: 10, 
//         description: 'Deepening spiritual practice',
//         symbol: '🧘'
//       },
//       { 
//         name: 'Sage', 
//         color: 'purple', 
//         maxLevel: 15, 
//         description: 'Mastering inner wisdom',
//         symbol: '🌟'
//       },
//       { 
//         name: 'Enlightened', 
//         color: 'yellow', 
//         maxLevel: 20, 
//         description: 'Achieving spiritual transcendence',
//         symbol: '☸️'
//       }
//     ];
    
//     const tier = tiers.find(t => level <= t.maxLevel) || tiers[3];
//     const prevMax = tier === tiers[0] ? 0 : tiers[tiers.indexOf(tier) - 1].maxLevel;
//     const progress = ((level - prevMax) / (tier.maxLevel - prevMax)) * 100;
    
//     return { ...tier, progress };
//   }, []);

//   const getEnhancedMiningRate = useCallback(() => {
//     const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
//     const baseMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
    
//     // Apply divine resonance upgrade to boost effectiveness
//     const divineResonanceUpgrades = upgrades.filter(u => u.id === 'divine-resonance');
//     const resonanceBonus = divineResonanceUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const enhancedMultiplier = baseMultiplier * (1 + resonanceBonus);
    
//     // Apply enhanced progressive mining bonuses
//     const progressiveMultiplier = gameState.miningMultiplier * gameState.miningCombo;
//     const masteryBonus = calculateMasteryBonus(gameState.miningLevel);
//     const prestigeBonus = calculatePrestigeBonus(gameState.miningLevel);
    
//     return gameState.pointsPerSecond * enhancedMultiplier * progressiveMultiplier * masteryBonus * prestigeBonus;
//   }, [gameState.pointsPerSecond, gameState.miningMultiplier, gameState.miningCombo, gameState.miningLevel, activeBoosts, upgrades, calculateMasteryBonus, calculatePrestigeBonus]);

//   // Sync game state with loaded upgrades on initialization - IMPROVED VERSION
//   useEffect(() => {
//     const totalUpgradeEffect = upgrades.reduce((sum, upgrade) => {
//       // Only count mining/meditation upgrades for points per second
//       if (upgrade.id === 'meditation-speed' || upgrade.id === 'divine-awakening' ||
//           upgrade.id === 'quantum-consciousness' || upgrade.id === 'cosmic-awareness' || 
//           upgrade.id === 'stellar-enlightenment' || upgrade.id === 'galactic-transcendence') {
//         return sum + (upgrade.effectValue * upgrade.level);
//       }
//       return sum;
//     }, 0);
//     const totalUpgradesPurchased = upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
    
//     // Calculate energy upgrades
//     const energyCapacityUpgrades = upgrades.filter(u => u.id === 'spiritual-capacity' || u.id === 'spiritual-overflow');
//     const totalEnergyCapacity = energyCapacityUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const baseEnergyCapacity = 1000;
//     const newMaxEnergy = baseEnergyCapacity + totalEnergyCapacity;
    
//     setGameState(prev => {
//       const newPointsPerSecond = 1.0 + totalUpgradeEffect;
//       const newUpgradesPurchased = totalUpgradesPurchased;
      
//       console.log('Upgrade sync check:', {
//         currentPPS: prev.pointsPerSecond,
//         newPPS: newPointsPerSecond,
//         currentUpgrades: prev.upgradesPurchased,
//         newUpgrades: newUpgradesPurchased,
//         currentMaxEnergy: prev.maxEnergy,
//         newMaxEnergy: newMaxEnergy,
//         currentPoints: prev.divinePoints,
//         hasLoadedSavedData: hasLoadedSavedData,
//         isFreshStart: prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0
//       });
      
//       // IMPROVED LOGIC: Only sync upgrades if:
//       // 1. We haven't loaded saved data AND this looks like a fresh start
//       // 2. OR if upgrade levels have actually changed from what's saved
//       const isFreshStart = prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0;
//       const upgradesChanged = prev.upgradesPurchased !== newUpgradesPurchased;
//       const energyChanged = prev.maxEnergy !== newMaxEnergy;
//       const shouldPreserveSavedData = hasLoadedSavedData && prev.divinePoints > 100;
      
//       if ((isFreshStart && !shouldPreserveSavedData) || (upgradesChanged && !shouldPreserveSavedData) || (energyChanged && !shouldPreserveSavedData)) {
//         console.log(`Syncing game state: ${isFreshStart ? 'Fresh start' : 'Upgrades changed'}`);
//         console.log(`PPS ${prev.pointsPerSecond} -> ${newPointsPerSecond}, Upgrades ${prev.upgradesPurchased} -> ${newUpgradesPurchased}, Energy ${prev.maxEnergy} -> ${newMaxEnergy}`);
//         return {
//           ...prev,
//           pointsPerSecond: newPointsPerSecond,
//           upgradesPurchased: newUpgradesPurchased,
//           maxEnergy: newMaxEnergy,
//           currentEnergy: Math.min(prev.currentEnergy, newMaxEnergy) // Ensure current energy doesn't exceed new max
//         };
//       } else {
//         console.log('Skipping upgrade sync - preserving saved state');
//         return prev;
//       }
//     });
//   }, [upgrades, hasLoadedSavedData]); // Run when upgrades change

//   // Set loaded flag when we have valid saved data
//   useEffect(() => {
//     if (gameState.divinePoints > 100 && !hasLoadedSavedData) {
//       console.log('Detected valid saved data, setting loaded flag');
//       setHasLoadedSavedData(true);
//     }
//   }, [gameState.divinePoints, hasLoadedSavedData]);

//   // Initialize progression system properly
//   useEffect(() => {
//     // Ensure experience requirements are calculated correctly
//     if (gameState.miningExperienceToNext !== calculateExperienceToNext(gameState.miningLevel)) {
//       setGameState(prev => ({
//         ...prev,
//         miningExperienceToNext: calculateExperienceToNext(prev.miningLevel),
//         miningMultiplier: calculateMiningMultiplier(prev.miningLevel),
//         criticalMiningChance: calculateCriticalChance(prev.miningLevel)
//       }));
//       console.log('Progression system initialized:', {
//         level: gameState.miningLevel,
//         expToNext: calculateExperienceToNext(gameState.miningLevel),
//         multiplier: calculateMiningMultiplier(gameState.miningLevel),
//         criticalChance: calculateCriticalChance(gameState.miningLevel)
//       });
//     }
//   }, [gameState.miningLevel, calculateExperienceToNext, calculateMiningMultiplier, calculateCriticalChance]);

//   // Comprehensive system validation function
//   const validateSystemIntegration = useCallback(() => {
//     const issues: string[] = [];
    
//     // Check progressive mining system
//     if (gameState.miningLevel < 1 || gameState.miningLevel > 20) issues.push('Mining level should be between 1 and 20');
//     if (gameState.miningExperience < 0) issues.push('Mining experience should be >= 0');
//     if (gameState.miningExperienceToNext <= 0) issues.push('Experience to next should be > 0');
//     if (gameState.miningMultiplier < 1 || gameState.miningMultiplier > 2) issues.push('Mining multiplier should be between 1x and 2x');
//     if (gameState.criticalMiningChance < 0 || gameState.criticalMiningChance > 0.25) {
//       issues.push('Critical chance should be between 0 and 25%');
//     }
//     if (gameState.miningCombo < 1 || gameState.miningCombo > 4) {
//       issues.push('Mining combo should be between 1x and 4x');
//     }
//     if (gameState.miningStreak < 0) issues.push('Mining streak should be >= 0');
    
//     // Check energy system
//     if (gameState.currentEnergy < 0) issues.push('Current energy should be >= 0');
//     if (gameState.maxEnergy <= 0) issues.push('Max energy should be > 0');
//     if (gameState.currentEnergy > gameState.maxEnergy) {
//       issues.push('Current energy should not exceed max energy');
//     }
    
//     // Check points system
//     if (gameState.divinePoints < 0) issues.push('Divine points should be >= 0');
//     if (gameState.pointsPerSecond < 0) issues.push('Points per second should be >= 0');
    
//     // Check upgrade system
//     const totalUpgradeEffect = upgrades.reduce((sum, upgrade) => {
//       if (upgrade.id === 'meditation-speed' || upgrade.id === 'divine-awakening' ||
//           upgrade.id === 'quantum-consciousness' || upgrade.id === 'cosmic-awareness' || 
//           upgrade.id === 'stellar-enlightenment' || upgrade.id === 'galactic-transcendence') {
//         return sum + (upgrade.effectValue * upgrade.level);
//       }
//       return sum;
//     }, 0);
    
//     const expectedPPS = 1.0 + totalUpgradeEffect;
//     if (Math.abs(gameState.pointsPerSecond - expectedPPS) > 0.01) {
//       issues.push(`Points per second mismatch: expected ${expectedPPS}, got ${gameState.pointsPerSecond}`);
//     }
    
//     // Check enhanced mining rate calculation
//     const enhancedRate = getEnhancedMiningRate();
//     if (enhancedRate < gameState.pointsPerSecond) {
//       issues.push('Enhanced mining rate should be >= base points per second');
//     }
    
//     // Test progressive mining system calculations
//     console.log('🔍 Testing Progressive Mining System...');
//     for (let level = 1; level <= 20; level++) {
//       const expRequired = calculateExperienceToNext(level);
//       const multiplier = calculateMiningMultiplier(level);
//       const criticalChance = calculateCriticalChance(level);
//       const masteryBonus = calculateMasteryBonus(level);
//       const prestigeBonus = calculatePrestigeBonus(level);
      
//       console.log(`Level ${level}: ${expRequired.toLocaleString()} XP, ${(multiplier * 100).toFixed(0)}% multiplier, ${(criticalChance * 100).toFixed(1)}% critical, ${(masteryBonus * 100).toFixed(0)}% mastery, ${(prestigeBonus * 100).toFixed(0)}% prestige`);
      
//       // Validate calculations with new ranges
//       if (expRequired < 100 || expRequired > 50000) {
//         issues.push(`Level ${level}: Experience requirement ${expRequired} is outside valid range (100 - 50,000)`);
//       }
//       if (multiplier < 1 || multiplier > 2) {
//         issues.push(`Level ${level}: Multiplier ${multiplier} is outside valid range (1x - 2x)`);
//       }
//       if (criticalChance < 0.02 || criticalChance > 0.25) {
//         issues.push(`Level ${level}: Critical chance ${criticalChance} is outside valid range (2% - 25%)`);
//       }
//     }
    
//     if (issues.length > 0) {
//       console.warn('System integration issues detected:', issues);
//       return false;
//     }
    
//     console.log('✅ All systems integrated and working correctly');
//     return true;
//   }, [gameState, upgrades, getEnhancedMiningRate, calculateExperienceToNext, calculateMiningMultiplier, calculateCriticalChance, calculateMasteryBonus, calculatePrestigeBonus]);

//   // Immediate save on mount to ensure current state is preserved
//   useEffect(() => {
//     // Only save if we have valid saved data loaded, not if we're starting fresh
//     if (hasLoadedSavedData && gameState.divinePoints > 100) {
//       console.log('Component mounted, saving current state:', {
//         divinePoints: gameState.divinePoints,
//         pointsPerSecond: gameState.pointsPerSecond,
//         isMining: gameState.isMining
//       });
      
//       const saveState = {
//         ...gameState,
//         lastSaveTime: Date.now()
//       };
      
//       // Force save immediately
//       try {
//         localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
//         localStorage.setItem(BACKUP_KEY, JSON.stringify(saveState));
//         console.log('Initial state saved on mount');
//       } catch (error) {
//         console.error('Error saving initial state:', error);
//       }
//     } else {
//       console.log('Skipping initial save - fresh start or no valid saved data');
//     }
    
//     // Run initial system validation (silent - no notifications)
//     setTimeout(() => {
//       console.log('🔍 Running initial system integration test...');
//       const isValid = validateSystemIntegration();
//       if (isValid) {
//         console.log('🎉 DivineTap is fully operational! All systems integrated and working perfectly.');
//       } else {
//         console.warn('⚠️ System integration issues detected. Check console for details.');
//       }
//     }, 2000);
//   }, [hasLoadedSavedData, gameState.divinePoints, validateSystemIntegration]); // Run when hasLoadedSavedData changes

//   // Enhanced save function with error handling and backup
//   const saveGameState = useCallback((state: GameState, isBackup = false) => {
//     try {
//       const saveData = {
//         ...state,
//         lastSaveTime: Date.now()
//       };
      
//       const key = isBackup ? getUserBackupKey() : getUserSaveKey();
//       const saveString = JSON.stringify(saveData);
      
//       console.log(`Saving to ${key}:`, {
//         divinePoints: saveData.divinePoints,
//         pointsPerSecond: saveData.pointsPerSecond,
//         isMining: saveData.isMining,
//         highScore: saveData.highScore,
//         allTimeHighScore: saveData.allTimeHighScore,
//         miningLevel: saveData.miningLevel,
//         currentEnergy: saveData.currentEnergy
//       });
      
//       localStorage.setItem(key, saveString);
      
//       // Also save high score and divine points separately for redundancy
//       if (!isBackup) {
//         const userHighScoreKey = getUserHighScoreKey();
//         const userAchievementsKey = getUserAchievementsKey();
//         const userUpgradesKey = getUserUpgradesKey();
//         const userPersonalizationKey = getUserPersonalizationKey();
        
//         localStorage.setItem(userHighScoreKey, saveData.allTimeHighScore.toString());
//         localStorage.setItem(getUserDivinePointsKey(), saveData.divinePoints.toString());
//         localStorage.setItem(getUserTotalEarnedKey(), saveData.totalPointsEarned.toString());
//         localStorage.setItem(userAchievementsKey, JSON.stringify(achievements));
//         localStorage.setItem(userUpgradesKey, JSON.stringify(upgrades));
        
//         // Save session data separately with enhanced mining persistence
//         const sessionData = {
//           sessionStartTime: saveData.sessionStartTime,
//           lastDailyReset: saveData.lastDailyReset,
//           lastWeeklyReset: saveData.lastWeeklyReset,
//           lastSaveTime: saveData.lastSaveTime,
//           version: saveData.version,
//           isMining: saveData.isMining,
//           lastMiningSession: saveData.lastMiningSession,
//           miningStreak: saveData.miningStreak,
//           currentEnergy: saveData.currentEnergy,
//           maxEnergy: saveData.maxEnergy,
//           miningLevel: saveData.miningLevel,
//           miningExperience: saveData.miningExperience,
//           miningMultiplier: saveData.miningMultiplier,
//           criticalMiningChance: saveData.criticalMiningChance,
//           miningCombo: saveData.miningCombo
//         };
//         localStorage.setItem(getUserSessionKey(), JSON.stringify(sessionData));
        
//         // Save personalization data
//         const personalization = getUserPersonalization();
//         localStorage.setItem(userPersonalizationKey, JSON.stringify(personalization));
        
//         // Save mining state specifically for persistence
//         const miningState = {
//           isMining: saveData.isMining,
//           lastMiningSession: saveData.lastMiningSession,
//           miningStreak: saveData.miningStreak,
//           currentEnergy: saveData.currentEnergy,
//           miningLevel: saveData.miningLevel,
//           miningExperience: saveData.miningExperience,
//           miningMultiplier: saveData.miningMultiplier,
//           criticalMiningChance: saveData.criticalMiningChance,
//           miningCombo: saveData.miningCombo,
//           lastSaveTime: saveData.lastSaveTime
//         };
//         localStorage.setItem(getUserSpecificKey('miningState'), JSON.stringify(miningState));
//       }
      
//       // Verify the save was written correctly
//       const verifySave = localStorage.getItem(key);
//       if (verifySave !== saveString) {
//         console.error('Save verification failed!');
//         throw new Error('Save verification failed');
//       }
      
//       if (!isBackup) {
//         setLastSaveStatus('success');
//         setSaveMessage(`Saved at ${new Date().toLocaleTimeString()}`);
        
//         // Clear success message after 3 seconds
//         setTimeout(() => setSaveMessage(''), 3000);
//       }
      
//       console.log(`Save to ${key} successful`);
//       return true;
//     } catch (error) {
//       console.error('Error saving game state:', error);
//       if (!isBackup) {
//         setLastSaveStatus('error');
//         setSaveMessage('Save failed!');
        
//         // Clear error message after 5 seconds
//         setTimeout(() => setSaveMessage(''), 5000);
//       }
//       return false;
//     }
//   }, [getUserSpecificKey, getUserBackupKey, getUserSaveKey, getUserHighScoreKey, getUserAchievementsKey, getUserUpgradesKey, getUserPersonalizationKey, getUserDivinePointsKey, getUserTotalEarnedKey, getUserSessionKey, achievements, upgrades, getUserPersonalization]);

//   // Progressive save system - save on every significant change
//   const progressiveSave = useCallback((reason: string) => {
//     const saveState = {
//       ...gameState,
//       lastSaveTime: Date.now()
//     };
    
//     console.log(`🔄 Progressive save triggered: ${reason}`, {
//       divinePoints: saveState.divinePoints,
//       isMining: saveState.isMining,
//       miningLevel: saveState.miningLevel,
//       currentEnergy: saveState.currentEnergy
//     });
    
//     // Immediate save for critical changes
//     if (reason.includes('mining') || reason.includes('level') || reason.includes('upgrade')) {
//       saveGameState(saveState);
//     } else {
//       // Debounced save for less critical changes
//       setTimeout(() => saveGameState(saveState), 1000);
//     }
//   }, [gameState, saveGameState]);

//   // Real-time save triggers for immediate persistence
//   const immediateSave = useCallback(() => {
//     const saveState = {
//       ...gameState,
//       lastSaveTime: Date.now()
//     };
    
//     console.log('⚡ Immediate save triggered');
//     saveGameState(saveState);
//   }, [gameState, saveGameState]);

//   // Enhanced mining persistence - ensure mining continues across sessions
//   const restoreMiningSession = useCallback(() => {
//     try {
//       const miningStateKey = getUserSpecificKey('miningState');
//       const savedMiningState = localStorage.getItem(miningStateKey);
      
//       if (savedMiningState) {
//         const miningState = JSON.parse(savedMiningState);
//         const now = Date.now();
//         const timeSinceLastSave = now - (miningState.lastSaveTime || now);
        
//         // Only restore if the save is recent (within last 5 minutes)
//         if (timeSinceLastSave < 5 * 60 * 1000 && miningState.isMining && miningState.currentEnergy > 0) {
//           console.log('🔄 Restoring mining session from save:', {
//             isMining: miningState.isMining,
//             currentEnergy: miningState.currentEnergy,
//             miningLevel: miningState.miningLevel,
//             timeSinceLastSave: Math.floor(timeSinceLastSave / 1000) + 's'
//           });
          
//           setGameState(prev => ({
//             ...prev,
//             isMining: miningState.isMining,
//             lastMiningSession: miningState.lastMiningSession || now,
//             miningStreak: miningState.miningStreak || 0,
//             currentEnergy: Math.min(prev.maxEnergy, miningState.currentEnergy || prev.currentEnergy),
//             miningLevel: miningState.miningLevel || prev.miningLevel,
//             miningExperience: miningState.miningExperience || prev.miningExperience,
//             miningMultiplier: miningState.miningMultiplier || prev.miningMultiplier,
//             criticalMiningChance: miningState.criticalMiningChance || prev.criticalMiningChance,
//             miningCombo: miningState.miningCombo || prev.miningCombo
//           }));
          
//           showSystemNotification(
//             '🔄 Mining Session Restored',
//             'Your spiritual meditation has been resumed from where you left off.',
//             'success'
//           );
          
//           return true;
//         }
//       }
//     } catch (error) {
//       console.error('Error restoring mining session:', error);
//     }
    
//     return false;
//   }, [getUserSpecificKey, showSystemNotification]);

//   // Enhanced auto-save effect with progressive saving
//   useEffect(() => {
//     const saveState = {
//       ...gameState,
//       lastSaveTime: Date.now()
//     };
    
//     console.log('Auto-saving game state:', {
//       divinePoints: saveState.divinePoints,
//       pointsPerSecond: saveState.pointsPerSecond,
//       isMining: saveState.isMining,
//       saveTime: new Date(saveState.lastSaveTime).toLocaleString()
//     });
    
//     // Validate system integration periodically
//     if (Date.now() % 30000 < 1000) { // Every ~30 seconds
//       validateSystemIntegration();
//     }
    
//     const success = saveGameState(saveState);
//     if (success) {
//       // Create backup every 5 minutes
//       if (Date.now() - (gameState.lastSaveTime || 0) > BACKUP_INTERVAL) {
//         saveGameState(saveState, true);
//       }
//     }
//   }, [gameState, saveGameState, validateSystemIntegration]);

//   // Progressive save triggers for specific events
//   useEffect(() => {
//     progressiveSave('divinePoints changed');
//   }, [gameState.divinePoints, progressiveSave]);

//   useEffect(() => {
//     progressiveSave('mining state changed');
//   }, [gameState.isMining, progressiveSave]);

//   useEffect(() => {
//     progressiveSave('mining level changed');
//   }, [gameState.miningLevel, progressiveSave]);

//   useEffect(() => {
//     progressiveSave('energy changed');
//   }, [gameState.currentEnergy, progressiveSave]);

//   useEffect(() => {
//     progressiveSave('upgrades changed');
//   }, [gameState.upgradesPurchased, progressiveSave]);

//   // Enhanced mining persistence - ensure mining continues across sessions
//   useEffect(() => {
//     // Check if mining was active when last saved
//     if (gameState.isMining && gameState.currentEnergy > 0) {
//       console.log('🔄 Mining session detected - ensuring persistence');
      
//       // Verify mining is actually running
//       if (!miningIntervalRef.current) {
//         console.log('⚠️ Mining interval not running, restarting...');
//         // The mining interval effect will handle restarting
//       }
//     }
//   }, [gameState.isMining, gameState.currentEnergy]);

//   // Restore mining session on component mount
//   useEffect(() => {
//     if (hasLoadedSavedData) {
//       setTimeout(() => {
//         const restored = restoreMiningSession();
//         if (restored) {
//           console.log('✅ Mining session successfully restored');
//         }
//       }, 1000); // Wait 1 second after initial load
//     }
//   }, [hasLoadedSavedData, restoreMiningSession]);

//   // Enhanced mining interval effect - ACTUALLY HANDLES THE MINING PROCESS
//   useEffect(() => {
//     if (!gameState.isMining) {
//       // Clear any existing mining interval
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//         console.log('⏹️ Mining interval stopped');
//       }
//       return;
//     }

//     // Start mining interval
//     console.log('▶️ Starting mining interval');
//     miningIntervalRef.current = setInterval(() => {
//       setGameState(prev => {
//         // Check if we have enough energy to continue mining
//         const boostedRate = getEnhancedMiningRate();
//         const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'spiritual-efficiency');
//         const energySustainUpgrades = upgrades.filter(u => u.id === 'spiritual-sustain');
//         const energyMasteryUpgrades = upgrades.filter(u => u.id === 'spiritual-mastery');
//         const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
        
//         const baseEnergyCost = 0.8;
//         const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, boostedRate / prev.pointsPerSecond));
//         const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
        
//         // Check if we have enough energy for this mining cycle
//         if (prev.currentEnergy < energyCost) {
//           console.log('Mining stopped: Not enough energy', {
//             currentEnergy: prev.currentEnergy,
//             energyCost: energyCost,
//             boostedRate: boostedRate
//           });
          
//           // Stop mining due to insufficient energy
//           return {
//             ...prev,
//             isMining: false
//           };
//         }
        
//         // Progressive Mining System Integration
//         let pointsEarned = boostedRate * 0.5; // 500ms cycle
//         let expGained = Math.floor(pointsEarned * 0.5); // 50% of points earned as XP (much faster leveling)
//         let criticalBonus = 0;
        
//         // Check for critical mining
//         if (checkCriticalMining(prev.criticalMiningChance)) {
//           criticalBonus = pointsEarned * 2; // Double points on critical
//           pointsEarned += criticalBonus;
//           expGained += Math.floor(criticalBonus * 0.5); // Also 50% of critical bonus as XP
//         }
        
//         // Update experience and check for level up
//         const newExp = prev.miningExperience + expGained;
//         const levelUpResult = checkLevelUp(prev.miningLevel, newExp);
        
//         // Check for new milestones
//         const milestoneResult = checkMilestones(levelUpResult.newLevel, prev.miningMilestones);
        
//         // Update streak
//         const streakIncrement = updateMiningStreak(prev.lastMiningSession);
//         const newStreak = Math.max(0, prev.miningStreak + streakIncrement); // Ensure streak doesn't go negative
        
//         // Check if streak was reset
//         const streakReset = streakIncrement === -1 && prev.miningStreak > 0;
        
//         // Calculate combo multiplier
//         const newCombo = calculateComboMultiplier(newStreak);
        
//         // Calculate new mining multiplier if leveled up
//         const newMiningMultiplier = levelUpResult.leveledUp 
//           ? calculateMiningMultiplier(levelUpResult.newLevel)
//           : prev.miningMultiplier;
        
//         // Calculate new critical chance if leveled up
//         const newCriticalChance = levelUpResult.leveledUp
//           ? calculateCriticalChance(levelUpResult.newLevel)
//           : prev.criticalMiningChance;
        
//         // Calculate total points earned including bonuses
//         let totalPointsEarned = pointsEarned;
//         if (levelUpResult.bonusReward) {
//           totalPointsEarned += levelUpResult.bonusReward;
//         }
//         if (milestoneResult.milestoneRewards > 0) {
//           totalPointsEarned += milestoneResult.milestoneRewards;
//         }
        
//         // Update game state
//         const newState = {
//           ...prev,
//           divinePoints: prev.divinePoints + totalPointsEarned,
//           totalPointsEarned: prev.totalPointsEarned + totalPointsEarned,
//           currentEnergy: prev.currentEnergy - energyCost,
//           totalEarned24h: prev.totalEarned24h + pointsEarned,
//           totalEarned7d: prev.totalEarned7d + pointsEarned,
//           // Progressive Mining Updates
//           miningLevel: levelUpResult.newLevel,
//           miningExperience: levelUpResult.newExp,
//           miningExperienceToNext: levelUpResult.leveledUp ? calculateExperienceToNext(levelUpResult.newLevel) : prev.miningExperienceToNext,
//           miningStreak: newStreak,
//           lastMiningSession: Date.now(),
//           miningMilestones: [...prev.miningMilestones, ...milestoneResult.newMilestones],
//           miningMultiplier: newMiningMultiplier,
//           criticalMiningChance: newCriticalChance,
//           miningCombo: newCombo,
//           lastCriticalMining: criticalBonus > 0 ? Date.now() : prev.lastCriticalMining
//         };
        
//         // Progressive save on mining progress
//         if (totalPointsEarned > 0 || levelUpResult.leveledUp || milestoneResult.newMilestones.length > 0) {
//           setTimeout(() => progressiveSave('mining progress'), 100);
//         }
        
//         // Debug logging for progression system
//         if (expGained > 0 || levelUpResult.leveledUp) {
//           console.log('Progression Debug:', {
//             level: newState.miningLevel,
//             exp: newState.miningExperience,
//             expToNext: newState.miningExperienceToNext,
//             expGained: expGained,
//             leveledUp: levelUpResult.leveledUp,
//             multiplier: newState.miningMultiplier,
//             streak: newState.miningStreak,
//             combo: newState.miningCombo
//           });
//         }
        
//         console.log('Mining cycle:', {
//           pointsEarned: pointsEarned.toFixed(2),
//           energyCost: energyCost.toFixed(2),
//           newEnergy: newState.currentEnergy.toFixed(2),
//           boostedRate: boostedRate.toFixed(2),
//           level: newState.miningLevel,
//           exp: newState.miningExperience,
//           critical: criticalBonus > 0,
//           combo: newState.miningCombo
//         });
        
//         // Show intelligent notifications for special events (throttled)
//         if (levelUpResult.leveledUp) {
//           const bonusText = levelUpResult.bonusReward ? ` +${levelUpResult.bonusReward} spiritual essence!` : '';
//           showThrottledNotification(
//             'levelUp',
//             '🌟 SPIRITUAL AWAKENING!',
//             `You have reached level ${levelUpResult.newLevel}! Your spiritual wisdom has increased by ${((newMiningMultiplier - prev.miningMultiplier) * 100).toFixed(1)}%${bonusText}`,
//             'success'
//           );
//         }
        
//         if (criticalBonus > 0) {
//           showThrottledNotification(
//             'criticalMining',
//             '✨ DIVINE INSIGHT!', 
//             'You have experienced a moment of profound spiritual clarity! Double essence earned!',
//             'success'
//           );
//         }
        
//         if (milestoneResult.newMilestones.length > 0) {
//           milestoneResult.newMilestones.forEach(milestone => {
//             const level = milestone.replace('level-', '');
//             const milestoneData = [
//               { level: 2, name: 'First Awakening', color: 'green', reward: 500 },
//               { level: 5, name: 'Seeker Mastery', color: 'green', reward: 2000 },
//               { level: 7, name: 'Inner Peace', color: 'blue', reward: 5000 },
//               { level: 10, name: 'Disciple Mastery', color: 'blue', reward: 15000 },
//               { level: 12, name: 'Wisdom Seeker', color: 'purple', reward: 30000 },
//               { level: 15, name: 'Sage Mastery', color: 'purple', reward: 75000 },
//               { level: 17, name: 'Enlightenment Near', color: 'yellow', reward: 150000 },
//               { level: 20, name: 'Divine Transcendence', color: 'yellow', reward: 500000 }
//             ];
//             const milestoneInfo = milestoneData.find(m => m.level === parseInt(level));
            
//             if (milestoneInfo) {
//               showThrottledNotification(
//                 'milestone',
//                 `🏆 ${milestoneInfo.name}!`,
//                 `You have achieved a major spiritual milestone! +${milestoneInfo.reward} essence as a blessing!`,
//                 'success'
//               );
//             } else {
//               showIntelligentMilestoneNotification(parseInt(level));
//             }
//           });
//         }
        
//         if (streakReset) {
//           showThrottledNotification(
//             'streakReset',
//             '💔 DISCIPLINE BROKEN',
//             'Your spiritual discipline has been interrupted. Return to meditation to rebuild your focus!',
//             'warning'
//           );
//         }
        
//         return newState;
//       });
//     }, 500); // Run every 500ms for smooth mining

//     // Cleanup function
//     return () => {
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//         console.log('⏹️ Mining interval cleaned up');
//       }
//     };
//   }, [gameState.isMining, getEnhancedMiningRate, upgrades, saveGameState, checkCriticalMining, checkLevelUp, checkMilestones, updateMiningStreak, calculateComboMultiplier, calculateMiningMultiplier, calculateCriticalChance, calculateExperienceToNext, showSystemNotification, showMilestoneNotification, progressiveSave]);

//   // Enhanced mining interval effect - ACTUALLY HANDLES THE MINING PROCESS
//   useEffect(() => {
//     if (!gameState.isMining) {
//       // Clear any existing mining interval
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//         console.log('⏹️ Mining interval stopped');
//       }
//       return;
//     }

//     // Start mining interval
//     console.log('▶️ Starting mining interval');
//     miningIntervalRef.current = setInterval(() => {
//       setGameState(prev => {
//         // Check if we have enough energy to continue mining
//         const boostedRate = getEnhancedMiningRate();
//         const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'spiritual-efficiency');
//         const energySustainUpgrades = upgrades.filter(u => u.id === 'spiritual-sustain');
//         const energyMasteryUpgrades = upgrades.filter(u => u.id === 'spiritual-mastery');
//         const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
        
//         const baseEnergyCost = 0.8;
//         const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, boostedRate / prev.pointsPerSecond));
//         const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
        
//         // Check if we have enough energy for this mining cycle
//         if (prev.currentEnergy < energyCost) {
//           console.log('Mining stopped: Not enough energy', {
//             currentEnergy: prev.currentEnergy,
//             energyCost: energyCost,
//             boostedRate: boostedRate
//           });
          
//           // Stop mining due to insufficient energy
//           return {
//             ...prev,
//             isMining: false
//           };
//         }
        
//         // Progressive Mining System Integration
//         let pointsEarned = boostedRate * 0.5; // 500ms cycle
//         let expGained = Math.floor(pointsEarned * 0.5); // 50% of points earned as XP (much faster leveling)
//         let criticalBonus = 0;
        
//         // Check for critical mining
//         if (checkCriticalMining(prev.criticalMiningChance)) {
//           criticalBonus = pointsEarned * 2; // Double points on critical
//           pointsEarned += criticalBonus;
//           expGained += Math.floor(criticalBonus * 0.5); // Also 50% of critical bonus as XP
//         }
        
//         // Update experience and check for level up
//         const newExp = prev.miningExperience + expGained;
//         const levelUpResult = checkLevelUp(prev.miningLevel, newExp);
        
//         // Check for new milestones
//         const milestoneResult = checkMilestones(levelUpResult.newLevel, prev.miningMilestones);
        
//         // Update streak
//         const streakIncrement = updateMiningStreak(prev.lastMiningSession);
//         const newStreak = Math.max(0, prev.miningStreak + streakIncrement); // Ensure streak doesn't go negative
        
//         // Check if streak was reset
//         const streakReset = streakIncrement === -1 && prev.miningStreak > 0;
        
//         // Calculate combo multiplier
//         const newCombo = calculateComboMultiplier(newStreak);
        
//         // Calculate new mining multiplier if leveled up
//         const newMiningMultiplier = levelUpResult.leveledUp 
//           ? calculateMiningMultiplier(levelUpResult.newLevel)
//           : prev.miningMultiplier;
        
//         // Calculate new critical chance if leveled up
//         const newCriticalChance = levelUpResult.leveledUp
//           ? calculateCriticalChance(levelUpResult.newLevel)
//           : prev.criticalMiningChance;
        
//         // Calculate total points earned including bonuses
//         let totalPointsEarned = pointsEarned;
//         if (levelUpResult.bonusReward) {
//           totalPointsEarned += levelUpResult.bonusReward;
//         }
//         if (milestoneResult.milestoneRewards > 0) {
//           totalPointsEarned += milestoneResult.milestoneRewards;
//         }
        
//         // Update game state
//         const newState = {
//           ...prev,
//           divinePoints: prev.divinePoints + totalPointsEarned,
//           totalPointsEarned: prev.totalPointsEarned + totalPointsEarned,
//           currentEnergy: prev.currentEnergy - energyCost,
//           totalEarned24h: prev.totalEarned24h + pointsEarned,
//           totalEarned7d: prev.totalEarned7d + pointsEarned,
//           // Progressive Mining Updates
//           miningLevel: levelUpResult.newLevel,
//           miningExperience: levelUpResult.newExp,
//           miningExperienceToNext: levelUpResult.leveledUp ? calculateExperienceToNext(levelUpResult.newLevel) : prev.miningExperienceToNext,
//           miningStreak: newStreak,
//           lastMiningSession: Date.now(),
//           miningMilestones: [...prev.miningMilestones, ...milestoneResult.newMilestones],
//           miningMultiplier: newMiningMultiplier,
//           criticalMiningChance: newCriticalChance,
//           miningCombo: newCombo,
//           lastCriticalMining: criticalBonus > 0 ? Date.now() : prev.lastCriticalMining
//         };
        
//         // Progressive save on mining progress
//         if (totalPointsEarned > 0 || levelUpResult.leveledUp || milestoneResult.newMilestones.length > 0) {
//           setTimeout(() => progressiveSave('mining progress'), 100);
//         }
        
//         // Debug logging for progression system
//         if (expGained > 0 || levelUpResult.leveledUp) {
//           console.log('Progression Debug:', {
//             level: newState.miningLevel,
//             exp: newState.miningExperience,
//             expToNext: newState.miningExperienceToNext,
//             expGained: expGained,
//             leveledUp: levelUpResult.leveledUp,
//             multiplier: newState.miningMultiplier,
//             streak: newState.miningStreak,
//             combo: newState.miningCombo
//           });
//         }
        
//         console.log('Mining cycle:', {
//           pointsEarned: pointsEarned.toFixed(2),
//           energyCost: energyCost.toFixed(2),
//           newEnergy: newState.currentEnergy.toFixed(2),
//           boostedRate: boostedRate.toFixed(2),
//           level: newState.miningLevel,
//           exp: newState.miningExperience,
//           critical: criticalBonus > 0,
//           combo: newState.miningCombo
//         });
        
//         // Show intelligent notifications for special events (throttled)
//         if (levelUpResult.leveledUp) {
//           const bonusText = levelUpResult.bonusReward ? ` +${levelUpResult.bonusReward} spiritual essence!` : '';
//           showThrottledNotification(
//             'levelUp',
//             '🌟 SPIRITUAL AWAKENING!',
//             `You have reached level ${levelUpResult.newLevel}! Your spiritual wisdom has increased by ${((newMiningMultiplier - prev.miningMultiplier) * 100).toFixed(1)}%${bonusText}`,
//             'success'
//           );
//         }
        
//         if (criticalBonus > 0) {
//           showThrottledNotification(
//             'criticalMining',
//             '✨ DIVINE INSIGHT!', 
//             'You have experienced a moment of profound spiritual clarity! Double essence earned!',
//             'success'
//           );
//         }
        
//         if (milestoneResult.newMilestones.length > 0) {
//           milestoneResult.newMilestones.forEach(milestone => {
//             const level = milestone.replace('level-', '');
//             const milestoneData = [
//               { level: 2, name: 'First Awakening', color: 'green', reward: 500 },
//               { level: 5, name: 'Seeker Mastery', color: 'green', reward: 2000 },
//               { level: 7, name: 'Inner Peace', color: 'blue', reward: 5000 },
//               { level: 10, name: 'Disciple Mastery', color: 'blue', reward: 15000 },
//               { level: 12, name: 'Wisdom Seeker', color: 'purple', reward: 30000 },
//               { level: 15, name: 'Sage Mastery', color: 'purple', reward: 75000 },
//               { level: 17, name: 'Enlightenment Near', color: 'yellow', reward: 150000 },
//               { level: 20, name: 'Divine Transcendence', color: 'yellow', reward: 500000 }
//             ];
//             const milestoneInfo = milestoneData.find(m => m.level === parseInt(level));
            
//             if (milestoneInfo) {
//               showThrottledNotification(
//                 'milestone',
//                 `🏆 ${milestoneInfo.name}!`,
//                 `You have achieved a major spiritual milestone! +${milestoneInfo.reward} essence as a blessing!`,
//                 'success'
//               );
//             } else {
//               showIntelligentMilestoneNotification(parseInt(level));
//             }
//           });
//         }
        
//         if (streakReset) {
//           showThrottledNotification(
//             'streakReset',
//             '💔 DISCIPLINE BROKEN',
//             'Your spiritual discipline has been interrupted. Return to meditation to rebuild your focus!',
//             'warning'
//           );
//         }
        
//         return newState;
//       });
//     }, 500); // Run every 500ms for smooth mining

//     // Cleanup function
//     return () => {
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//         console.log('⏹️ Mining interval cleaned up');
//       }
//     };
//   }, [gameState.isMining, getEnhancedMiningRate, upgrades, saveGameState, checkCriticalMining, checkLevelUp, checkMilestones, updateMiningStreak, calculateComboMultiplier, calculateMiningMultiplier, calculateCriticalChance, calculateExperienceToNext, showSystemNotification, showMilestoneNotification, progressiveSave]);

//   // Enhanced toggle mining with energy validation and auto-mining
//   const toggleMining = useCallback(() => {
//     setGameState(prev => {
//       // If trying to start mining, check energy
//       if (!prev.isMining && prev.currentEnergy < 1) {
//         // Silently prevent mining without notification - user can see energy bar
//         return prev;
//       }
      
//       const newState = {
//         ...prev,
//         isMining: !prev.isMining
//       };
      
//       // Manage mining session state for notification suppression
//       if (newState.isMining && !miningSessionState.isActive) {
//         // Starting mining session
//         setMiningSessionState({
//           isActive: true,
//           startTime: Date.now(),
//           lastNotificationTime: 0,
//           notificationCount: 0,
//           suppressNotifications: false
//         });
//         console.log('🔄 Mining session started - notification suppression active');
//       } else if (!newState.isMining && miningSessionState.isActive) {
//         // Ending mining session - show summary of suppressed notifications
//         const sessionDuration = Math.floor((Date.now() - miningSessionState.startTime) / 1000);
//         const suppressedCount = miningSessionState.notificationCount;
        
//         if (suppressedCount > 0) {
//           setTimeout(() => {
//             showSystemNotification(
//               '📊 Mining Session Summary',
//               `Mined for ${Math.floor(sessionDuration / 60)}m ${sessionDuration % 60}s • ${suppressedCount} events occurred`,
//               'info'
//             );
//           }, 1000);
//         }
        
//         setMiningSessionState({
//           isActive: false,
//           startTime: 0,
//           lastNotificationTime: 0,
//           notificationCount: 0,
//           suppressNotifications: false
//         });
//         console.log('⏹️ Mining session ended - notification suppression disabled');
//       }
      
//       // Immediately save when mining state changes
//       console.log(`Mining ${newState.isMining ? 'STARTED' : 'STOPPED'}:`, {
//         divinePoints: newState.divinePoints,
//         pointsPerSecond: newState.pointsPerSecond,
//         isMining: newState.isMining,
//         currentEnergy: newState.currentEnergy
//       });
      
//       // Progressive save immediately
//       setTimeout(() => {
//         progressiveSave('mining state toggle');
//       }, 100);
      
//       return newState;
//     });
    
//     // Clear mining resumed flag when user manually toggles
//     setMiningResumed(false);
//   }, [progressiveSave, showSystemNotification, miningSessionState.isActive]);

//   // Energy regeneration effect
//   useEffect(() => {
//     if (gameState.currentEnergy >= gameState.maxEnergy) {
//       return; // No need to regenerate if at max
//     }

//     const energyRegenInterval = setInterval(() => {
//       setGameState(prev => {
//         const energyRegenUpgrades = upgrades.filter(u => u.id === 'spiritual-regen');
//         const energyBurstUpgrades = upgrades.filter(u => u.id === 'spiritual-burst');
//         const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const burstBonus = energyBurstUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//         const baseRegen = 0.3;
//         const totalRegen = baseRegen + regenBonus + burstBonus;
        
//         const newEnergy = Math.min(prev.maxEnergy, prev.currentEnergy + totalRegen);
        
//         return {
//           ...prev,
//           currentEnergy: newEnergy,
//           lastEnergyRegen: Date.now()
//         };
//       });
//     }, 1000); // Regenerate energy every second

//     return () => clearInterval(energyRegenInterval);
//   }, [gameState.currentEnergy, gameState.maxEnergy, upgrades]);

//   // Auto-mining effect
//   useEffect(() => {
//     const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
//     const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
    
//     if (!hasAutoMining || gameState.isMining) {
//       return; // No auto-mining or already mining
//     }
    
//     // Check if we have enough energy to start auto-mining
//     const boostedRate = getEnhancedMiningRate();
//     const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'spiritual-efficiency');
//     const energySustainUpgrades = upgrades.filter(u => u.id === 'spiritual-sustain');
//     const energyMasteryUpgrades = upgrades.filter(u => u.id === 'spiritual-mastery');
//     const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
    
//     const baseEnergyCost = 0.8;
//     const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, boostedRate / gameState.pointsPerSecond));
//     const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
//     const minimumEnergyRequired = energyCost * 2 * 5; // 5 seconds worth
    
//     if (gameState.currentEnergy >= minimumEnergyRequired) {
//       console.log('Auto-mining started: Sufficient energy available');
//       setGameState(prev => ({
//         ...prev,
//         isMining: true
//       }));
//     }
//   }, [gameState.currentEnergy, gameState.isMining, upgrades, getEnhancedMiningRate]);

//   // Add personalization state
//   const [userPersonalization] = useState<UserPersonalization>(getUserPersonalization());

//   // Add special events system
//   const triggerSpecialEvent = useCallback(() => {
//     const personalization = getUserPersonalization();
//     const now = Date.now();
    
//     // Check if enough time has passed since last event (5-15 minutes)
//     const lastEventTime = localStorage.getItem(getUserLastEventKey()) || '0';
//     const timeSinceLastEvent = now - parseInt(lastEventTime);
//     const minEventInterval = 5 * 60 * 1000; // 5 minutes
//     const maxEventInterval = 15 * 60 * 1000; // 15 minutes
    
//     if (timeSinceLastEvent < minEventInterval) return;
    
//     // Random chance for special event (higher chance if user has been mining)
//     const miningTime = gameState.isMining ? 1 : 0.3;
//     const eventChance = 0.1 * miningTime; // 10% chance when mining, 3% when not
    
//     if (Math.random() < eventChance) {
//       const availableEvents = personalization.specialEvents;
//       if (availableEvents.length === 0) return;
      
//       const eventType = availableEvents[Math.floor(Math.random() * availableEvents.length)];
      
//       // Apply event effects
//       switch (eventType) {
//         case 'cosmic-storm':
//           setGameState(prev => ({
//             ...prev,
//             divinePoints: prev.divinePoints + Math.floor(prev.pointsPerSecond * 60), // 1 minute worth
//             currentEnergy: Math.min(prev.maxEnergy, prev.currentEnergy + 500)
//           }));
//           showSystemNotification('🌪️ COSMIC STORM', 'A cosmic storm has blessed you with extra essence and energy!', 'success');
//           break;
          
//         case 'spiritual-resonance':
//           setGameState(prev => ({
//             ...prev,
//             miningMultiplier: prev.miningMultiplier * 1.5, // 50% boost for 2 minutes
//             criticalMiningChance: Math.min(0.5, prev.criticalMiningChance * 2)
//           }));
//           showSystemNotification('🎵 SPIRITUAL RESONANCE', 'You resonate with the universe! Mining efficiency and critical chance increased!', 'success');
//           setTimeout(() => {
//             setGameState(prev => ({
//               ...prev,
//               miningMultiplier: prev.miningMultiplier / 1.5,
//               criticalMiningChance: prev.criticalMiningChance / 2
//             }));
//           }, 120000); // 2 minutes
//           break;
          
//         case 'divine-intervention':
//           const bonusPoints = Math.floor(gameState.totalPointsEarned * 0.1); // 10% of total earned
//           setGameState(prev => ({
//             ...prev,
//             divinePoints: prev.divinePoints + bonusPoints
//           }));
//           showSystemNotification('👼 DIVINE INTERVENTION', `The divine has blessed you with ${formatNumber(bonusPoints)} essence!`, 'success');
//           break;
          
//         case 'energy-surge':
//           setGameState(prev => ({
//             ...prev,
//             currentEnergy: prev.maxEnergy,
//             maxEnergy: prev.maxEnergy + 1000
//           }));
//           showSystemNotification('⚡ ENERGY SURGE', 'Your spiritual energy has surged! Max energy increased!', 'success');
//           break;
          
//         case 'meditation-mastery':
//           setGameState(prev => ({
//             ...prev,
//             miningExperience: prev.miningExperience + Math.floor(prev.miningExperienceToNext * 0.5) // 50% of exp to next level
//           }));
//           showSystemNotification('🧘 MEDITATION MASTERY', 'You have achieved a moment of perfect meditation! Experience gained!', 'success');
//           break;
          
//         case 'enlightenment-burst':
//           const enlightenmentBonus = Math.floor(gameState.pointsPerSecond * 30); // 30 seconds worth
//           setGameState(prev => ({
//             ...prev,
//             divinePoints: prev.divinePoints + enlightenmentBonus,
//             totalPointsEarned: prev.totalPointsEarned + enlightenmentBonus
//           }));
//           showSystemNotification('🌟 ENLIGHTENMENT BURST', `A burst of enlightenment has granted you ${formatNumber(enlightenmentBonus)} essence!`, 'success');
//           break;
          
//         case 'transcendence-moment':
//           setGameState(prev => ({
//             ...prev,
//             miningLevel: Math.min(20, prev.miningLevel + 1),
//             miningExperience: 0,
//             miningExperienceToNext: calculateExperienceToNext(Math.min(20, prev.miningLevel + 1))
//           }));
//           showSystemNotification('☸️ TRANSCENDENCE MOMENT', 'You have transcended to a higher level of consciousness!', 'success');
//           break;
//       }
      
//       // Save event time
//       localStorage.setItem(getUserLastEventKey(), now.toString());
//     }
//   }, [gameState, getUserPersonalization, getUserSpecificKey, showSystemNotification, formatNumber, calculateExperienceToNext]);

//   // Personality-based gameplay mechanics
//   const applyPersonalityEffects = useCallback(() => {
//     const personalization = getUserPersonalization();
    
//     // Apply personality-based bonuses/penalties
//     personalization.personalityTraits.forEach(trait => {
//       switch (trait) {
//         case 'patient':
//           // Patient users get better offline rewards
//           if (gameState.offlineEfficiencyBonus < 1.4) {
//             setGameState(prev => ({
//               ...prev,
//               offlineEfficiencyBonus: Math.min(1.4, prev.offlineEfficiencyBonus + 0.05)
//             }));
//           }
//           break;
          
//         case 'impulsive':
//           // Impulsive users get random bonuses but also penalties
//           if (Math.random() < 0.1) { // 10% chance every check
//             const bonus = Math.random() < 0.5 ? 1.2 : 0.8; // 20% bonus or penalty
//             setGameState(prev => ({
//               ...prev,
//               pointsPerSecond: prev.pointsPerSecond * bonus
//             }));
//             showSystemNotification(
//               bonus > 1 ? '🎲 IMPULSIVE BONUS' : '🎲 IMPULSIVE PENALTY',
//               bonus > 1 ? 'Your impulsiveness has paid off!' : 'Your impulsiveness has consequences...',
//               bonus > 1 ? 'success' : 'warning'
//             );
//           }
//           break;
          
//         case 'analytical':
//           // Analytical users get better upgrade efficiency
//           // This is handled in the upgrade purchase logic
//           break;
          
//         case 'intuitive':
//           // Intuitive users get better critical mining chances
//           if (gameState.criticalMiningChance < 0.25) {
//             setGameState(prev => ({
//               ...prev,
//               criticalMiningChance: Math.min(0.25, prev.criticalMiningChance + 0.005)
//             }));
//           }
//           break;
          
//         case 'disciplined':
//           // Disciplined users maintain streaks better
//           if (gameState.miningStreak > 0) {
//             setGameState(prev => ({
//               ...prev,
//               miningStreak: prev.miningStreak + 1
//             }));
//           }
//           break;
          
//         case 'spontaneous':
//           // Spontaneous users get random events more often
//           if (Math.random() < 0.15) { // 15% chance vs normal 10%
//             triggerSpecialEvent();
//           }
//           break;
//       }
//     });
//   }, [gameState, getUserPersonalization, showSystemNotification, triggerSpecialEvent]);

//   // Check for special unlock conditions
//   const checkSpecialUnlocks = useCallback(() => {
//     const personalization = getUserPersonalization();
    
//     Object.entries(personalization.unlockConditions).forEach(([upgradeId, condition]) => {
//       const upgrade = upgrades.find(u => u.id === upgradeId);
//       if (!upgrade || upgrade.level > 0) return; // Already unlocked
      
//       let shouldUnlock = false;
      
//       if (condition.requiresLevel && gameState.miningLevel >= condition.requiresLevel) {
//         shouldUnlock = true;
//       } else if (condition.requiresPoints && gameState.divinePoints >= condition.requiresPoints) {
//         shouldUnlock = true;
//       } else if (condition.requiresStreak && gameState.miningStreak >= condition.requiresStreak) {
//         shouldUnlock = true;
//       }
      
//       if (shouldUnlock) {
//         showSystemNotification(
//           '🔓 SPECIAL UNLOCK',
//           `${upgrade.name} has been unlocked through your spiritual journey!`,
//           'success'
//         );
//       }
//     });
//   }, [gameState, upgrades, getUserPersonalization, showSystemNotification]);

//   // Add personalization effects to game loop
//   useEffect(() => {
//     // Check for special events every 30 seconds
//     const eventInterval = setInterval(() => {
//       triggerSpecialEvent();
//     }, 30000);
    
//     return () => clearInterval(eventInterval);
//   }, [triggerSpecialEvent]);

//   useEffect(() => {
//     // Apply personality effects every 60 seconds
//     const personalityInterval = setInterval(() => {
//       applyPersonalityEffects();
//     }, 60000);
    
//     return () => clearInterval(personalityInterval);
//   }, [applyPersonalityEffects]);

//   useEffect(() => {
//     // Check for special unlocks every 10 seconds
//     const unlockInterval = setInterval(() => {
//       checkSpecialUnlocks();
//     }, 10000);
    
//     return () => clearInterval(unlockInterval);
//   }, [checkSpecialUnlocks]);

//   // Add personalization info display with data isolation status
//   const PersonalizationInfo = () => {
//     const personalization = getUserPersonalization();
//     const isDataIsolated = verifyUserDataIsolation();
    
//     return (
//       <div className="relative z-10 mt-3 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3">
//         <div className="text-center">
//           <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-2">
//             🌟 YOUR SPIRITUAL PATH
//           </div>
//           <div className="text-xs font-mono text-purple-300 mb-2">
//             Traits: {personalization.personalityTraits.slice(0, 3).join(', ')}
//             {personalization.personalityTraits.length > 3 && '...'}
//           </div>
//           <div className="text-xs font-mono text-purple-300 mb-2">
//             Special Events: {personalization.specialEvents.length} available
//           </div>
//           <div className={`text-xs font-mono ${isDataIsolated ? 'text-green-400' : 'text-red-400'}`}>
//             {isDataIsolated ? '🔒 Data Isolated' : '⚠️ Shared Data Detected'}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Data isolation verification system
//   const verifyUserDataIsolation = useCallback(() => {
//     const currentUserId = String(user?.id || 'anonymous');
//     const allKeys = [
//       getUserSaveKey(),
//       getUserBackupKey(),
//       getUserDivinePointsKey(),
//       getUserTotalEarnedKey(),
//       getUserSessionKey(),
//       getUserTutorialKey(),
//       getUserAchievementsKey(),
//       getUserHighScoreKey(),
//       getUserUpgradesKey(),
//       getUserPrestigeKey(),
//       getUserPersonalizationKey(),
//       getUserLastEventKey()
//     ];
    
//     console.log('🔒 User Data Isolation Verification:', {
//       userId: currentUserId,
//       totalKeys: allKeys.length,
//       keys: allKeys,
//       allContainUserId: allKeys.every(key => key.includes(currentUserId))
//     });
    
//     // Verify no shared data exists
//     const sharedKeys = [
//       SAVE_KEY,
//       BACKUP_KEY,
//       DIVINE_POINTS_KEY,
//       TOTAL_EARNED_KEY,
//       SESSION_KEY,
//       TUTORIAL_KEY,
//       ACHIEVEMENTS_KEY
//     ];
    
//     const hasSharedData = sharedKeys.some(key => {
//       const data = localStorage.getItem(key);
//       return data && !key.includes(String(currentUserId));
//     });
    
//     if (hasSharedData) {
//       console.warn('⚠️ Shared data detected! Some data is not user-specific.');
//     } else {
//       console.log('✅ All data is properly user-isolated');
//     }
    
//     return !hasSharedData;
//   }, [user?.id, getUserSaveKey, getUserBackupKey, getUserDivinePointsKey, getUserTotalEarnedKey, getUserSessionKey, getUserTutorialKey, getUserAchievementsKey, getUserHighScoreKey, getUserUpgradesKey, getUserPrestigeKey, getUserPersonalizationKey, getUserLastEventKey]);

//   // Run verification on mount
//   useEffect(() => {
//     setTimeout(() => {
//       verifyUserDataIsolation();
//     }, 2000); // Wait for user data to load
//   }, [verifyUserDataIsolation]);

//   // Data migration system - migrate shared data to user-specific keys
//   const migrateSharedDataToUserSpecific = useCallback(() => {
//     const currentUserId = String(user?.id || 'anonymous');
//     console.log('🔄 Starting data migration for user:', currentUserId);
    
//     const migrationMap = [
//       { oldKey: SAVE_KEY, newKey: getUserSaveKey() },
//       { oldKey: BACKUP_KEY, newKey: getUserBackupKey() },
//       { oldKey: DIVINE_POINTS_KEY, newKey: getUserDivinePointsKey() },
//       { oldKey: TOTAL_EARNED_KEY, newKey: getUserTotalEarnedKey() },
//       { oldKey: SESSION_KEY, newKey: getUserSessionKey() },
//       { oldKey: TUTORIAL_KEY, newKey: getUserTutorialKey() },
//       { oldKey: ACHIEVEMENTS_KEY, newKey: getUserAchievementsKey() },
//       { oldKey: 'divineMiningHighScore', newKey: getUserHighScoreKey() },
//       { oldKey: 'divineMiningUpgrades', newKey: getUserUpgradesKey() },
//       { oldKey: 'divineMiningPrestigeMultiplier', newKey: getUserPrestigeKey() },
//       { oldKey: 'userPersonalization', newKey: getUserPersonalizationKey() },
//       { oldKey: 'lastSpecialEvent', newKey: getUserLastEventKey() }
//     ];
    
//     let migratedCount = 0;
    
//     migrationMap.forEach(({ oldKey, newKey }) => {
//       const oldData = localStorage.getItem(oldKey);
//       const newData = localStorage.getItem(newKey);
      
//       // Only migrate if old data exists and new data doesn't
//       if (oldData && !newData) {
//         try {
//           localStorage.setItem(newKey, oldData);
//           localStorage.removeItem(oldKey); // Remove old shared data
//           migratedCount++;
//           console.log(`✅ Migrated: ${oldKey} → ${newKey}`);
//         } catch (error) {
//           console.error(`❌ Failed to migrate ${oldKey}:`, error);
//         }
//       }
//     });
    
//     if (migratedCount > 0) {
//       console.log(`🎉 Migration complete! Migrated ${migratedCount} data items for user ${currentUserId}`);
//       showSystemNotification(
//         'Data Migration Complete',
//         `Your spiritual journey data has been secured with ${migratedCount} items migrated to your personal account.`,
//         'success'
//       );
//     } else {
//       console.log('✅ No migration needed - all data is already user-specific');
//     }
    
//     return migratedCount;
//   }, [user?.id, getUserSaveKey, getUserBackupKey, getUserDivinePointsKey, getUserTotalEarnedKey, getUserSessionKey, getUserTutorialKey, getUserAchievementsKey, getUserHighScoreKey, getUserUpgradesKey, getUserPrestigeKey, getUserPersonalizationKey, getUserLastEventKey, showSystemNotification]);

//   // Run migration on mount if needed
//   useEffect(() => {
//     setTimeout(() => {
//       const isIsolated = verifyUserDataIsolation();
//       if (!isIsolated) {
//         console.log('🔄 Data isolation check failed, running migration...');
//         migrateSharedDataToUserSpecific();
//       }
//     }, 3000); // Wait for user data to load
//   }, [verifyUserDataIsolation, migrateSharedDataToUserSpecific]);



//   return (
//     <div className="flex-1 flex flex-col items-center justify-center space-y-4 overflow-y-auto game-scrollbar">
//       {/* Compact Centered Divine Mining Card */}
//       <div className="relative w-full max-w-xl overflow-hidden game-card-frame">
//         {/* Compact Header */}
//         <div className="relative z-10 flex items-center justify-between mb-4">
//           <div className="flex items-center space-x-3">
//             <div className={`w-3 h-3 rounded-full ${gameState.isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
//             <div>
//               <div className="text-base font-mono font-bold text-cyan-400 tracking-wider">SPIRITUAL AWAKENING</div>
//               <div className="text-xs font-mono text-cyan-300">
//                 {gameState.isMining ? 'ENLIGHTENMENT ACTIVE' : 'PREPARING FOR MEDITATION'}
//               </div>
//             </div>
//           </div>
          
//           {/* Compact Tier Badge */}
//           {(() => {
//             const currentTier = getCurrentTier(gameState.miningLevel);
//             const tierColors = {
//               green: 'text-green-400 bg-green-900/30 border-green-500/30',
//               blue: 'text-blue-400 bg-blue-900/30 border-blue-500/30',
//               purple: 'text-purple-400 bg-purple-900/30 border-purple-500/30',
//               yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30'
//             };
//             return (
//               <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border flex items-center space-x-1.5 ${tierColors[currentTier.color as keyof typeof tierColors]}`}>
//                 <span className="text-sm">{currentTier.symbol}</span>
//                 <span>{currentTier.name}</span>
//               </div>
//             );
//           })()}
//         </div>

//         {/* Compact Main Points Display */}
//         <div className="relative z-10 text-center mb-6">
//           <div className={`text-4xl font-mono font-bold tracking-wider mb-1 transition-all duration-300 ${
//             gameState.divinePoints > 1000000 
//               ? 'text-purple-300 drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]' 
//               : gameState.divinePoints > 100000 
//               ? 'text-yellow-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
//               : gameState.divinePoints > 10000 
//               ? 'text-green-300 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
//               : 'text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]'
//           }`}>
//             {formatNumber(gameState.divinePoints)}
//           </div>
//           <div className="text-sm font-mono text-cyan-400 tracking-wider mb-1">SPIRITUAL ESSENCE</div>
//           <div className="text-sm font-mono text-cyan-300">
//             +{getBoostedMiningRate().toFixed(1)} wisdom/sec
//             {gameState.miningCombo > 1.1 && (
//               <span className="ml-2 text-yellow-400 font-bold text-base">
//                 {gameState.miningCombo.toFixed(1)}x focus
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Compact Mining Button */}
//         <div className="relative z-10 flex justify-center mb-6">
//           <button 
//             onClick={toggleMining}
//             disabled={!gameState.isMining && gameState.currentEnergy < 1}
//             className={`
//               relative w-32 h-32 rounded-full transition-all duration-300 font-mono font-bold
//               ${gameState.isMining 
//                 ? 'bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] border-3 border-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.7)]' 
//                 : gameState.currentEnergy < 1
//                 ? 'bg-gradient-to-br from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-3 border-gray-400'
//                 : 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(0,255,255,0.5)] border-3 border-cyan-400 hover:shadow-[0_0_40px_rgba(0,255,255,0.7)]'
//               }
//               ${gameState.isMining ? 'animate-pulse' : ''}
//               hover:scale-105 active:scale-95
//             `}
//           >
//             <div className="flex flex-col items-center justify-center h-full">
//               <div className="text-3xl mb-1">
//                 {gameState.isMining ? '⏸️' : gameState.currentEnergy < 1 ? '⚠️' : '▶️'}
//               </div>
//               <div className="text-sm font-mono font-bold tracking-wider">
//                 {gameState.isMining ? 'PAUSE' : 'MEDITATE'}
//               </div>
//               {gameState.miningStreak > 0 && (
//                 <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-mono font-bold px-1.5 py-0.5 rounded-full border border-yellow-300 shadow-md">
//                   {gameState.miningStreak}
//                 </div>
//               )}
//             </div>
//           </button>
//         </div>

        

//         {/* Large Stats Grid */}
//         {/* <div className="relative z-10 grid grid-cols-4 gap-4 mb-8">
//           <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 text-center hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
//             <div className="text-xl font-mono font-bold text-cyan-300 mb-1">
//               {formatNumber(getBoostedMiningRate())}
//             </div>
//             <div className="text-sm font-mono text-cyan-400">RATE</div>
//           </div>
//           <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center hover:border-green-400/50 transition-all duration-300 hover:scale-105">
//             <div className="text-xl font-mono font-bold text-green-300 mb-1">
//               {gameState.upgradesPurchased}
//             </div>
//             <div className="text-sm font-mono text-green-400">UPGRADES</div>
//           </div>
//           <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
//             <div className="text-xl font-mono font-bold text-purple-300 mb-1">
//               {gameState.miningLevel}
//             </div>
//             <div className="text-sm font-mono text-purple-400">LEVEL</div>
//           </div>
//           <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-center hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
//             <div className="text-xl font-mono font-bold text-yellow-300 mb-1">
//               {Math.round(gameState.currentEnergy)}
//             </div>
//             <div className="text-sm font-mono text-yellow-400">ENERGY</div>
//           </div>
//         </div> */}

//         {/* Compact Progress Bars */}
//         <div className="relative z-10 space-y-3 mb-6">
//           {/* Experience Progress */}
//           {/* <div>
//             <div className="flex justify-between text-xs font-mono mb-1">
//               <span className="text-indigo-400 font-medium">Experience</span>
//               <span className="text-indigo-300 font-medium">
//                 {gameState.miningExperience.toLocaleString()}/{gameState.miningExperienceToNext.toLocaleString()}
//               </span>
//             </div>
//             <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-600/30">
//               <div 
//                 className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
//                 style={{ width: `${(gameState.miningExperience / gameState.miningExperienceToNext) * 100}%` }}
//               />
//             </div>
//           </div> */}

//           {/* Energy Bar */}
//           <div>
//             <div className="flex justify-between text-xs font-mono mb-1">
//               <span className="text-cyan-400 font-medium">Spiritual Energy</span>
//               <span className="text-cyan-300 font-medium">
//                 {Math.round(gameState.currentEnergy)}/{gameState.maxEnergy}
//               </span>
//             </div>
//             <div className="w-full bg-gray-700/50 rounded-full h-2 border border-gray-600/30 overflow-hidden">
//               <div 
//                 className={`h-2 rounded-full transition-all duration-500 shadow-sm ${
//                   gameState.currentEnergy < 100 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
//                   gameState.currentEnergy < 500 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
//                   gameState.isMining ? 'bg-gradient-to-r from-red-400 to-red-300' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
//                 } ${gameState.isMining ? 'animate-pulse' : ''}`}
//                 style={{ width: `${(gameState.currentEnergy / gameState.maxEnergy) * 100}%` }}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Compact Upgrade Store Button */}
//         <div className="relative z-10 mb-4">
//           <button
//             onClick={() => setShowUpgradeShop(true)}
//             className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 font-mono font-bold border hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] group"
//           >
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
//               <span className="text-sm tracking-wider">🕉️ ENHANCEMENTS</span>
//               {gameState.upgradesPurchased > 0 && (
//                 <div className="text-xs px-2 py-1 rounded border border-cyan-400/30 bg-cyan-400/10">
//                   {gameState.upgradesPurchased}
//                 </div>
//               )}
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="text-xs font-mono text-cyan-400">
//                 {formatNumber(gameState.divinePoints)} ESSENCE
//               </div>
//               <div className="text-cyan-300">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M7 10l5 5 5-5z"/>
//                 </svg>
//               </div>
//             </div>
//           </button>
//         </div>

//         {/* Compact Status */}
//         <div className="relative z-10 flex justify-between items-center text-xs font-mono text-gray-400 bg-gray-900/20 rounded-lg p-3 border border-gray-600/30">
//           <div>
//             <span className="text-cyan-400 font-bold">SESSION:</span> {getSessionDuration()}
//           </div>
//           <div>
//             <span className="text-cyan-400 font-bold">TOTAL:</span> {formatNumber(gameState.totalPointsEarned)}
//           </div>
//         </div>

//         {/* Compact Offline Rewards */}
//         {showOfflineRewards && gameState.unclaimedOfflineRewards > 0 && (
//           <div className="relative z-10 mt-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-3 animate-pulse hover:scale-[1.01] transition-all duration-300">
//             <div className="text-center">
//               <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">
//                 🎁 OFFLINE REWARDS
//               </div>
//               <div className="text-lg font-mono font-bold text-purple-300 mb-2 tracking-wider">
//                 {formatNumber(gameState.unclaimedOfflineRewards)}
//               </div>
//               <button 
//                 onClick={claimOfflineRewards}
//                 className="font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all duration-300 border tracking-wider bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-purple-400 hover:scale-105 active:scale-95 shadow-sm"
//               >
//                 CLAIM
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Compact Status Messages */}
//         {gameState.currentEnergy < 100 && gameState.isMining && (
//           <div className="relative z-10 mt-3 bg-gradient-to-r from-red-900/40 to-red-800/40 backdrop-blur-sm border border-red-500/50 rounded-lg p-2 animate-pulse">
//             <div className="text-center text-red-400 font-mono font-bold text-xs tracking-wider">
//               ⚠️ LOW ENERGY
//             </div>
//           </div>
//         )}

//         {(() => {
//           const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
//           const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
          
//           if (hasAutoMining) {
//             return (
//               <div className="relative z-10 mt-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-sm border border-blue-500/50 rounded-lg p-2">
//                 <div className="text-center text-blue-400 font-mono font-bold text-xs tracking-wider">
//                   🤖 AUTO-MINING {gameState.isMining ? 'ACTIVE' : 'ENABLED'}
//                 </div>
//               </div>
//             );
//           }
//           return null;
//         })()}
//       </div>

//       {/* Full-Screen Upgrade Shop Modal */}
//       {showUpgradeShop && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
//           <div className="relative w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_40px_rgba(0,255,255,0.3)] overflow-hidden">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
//               <div className="flex items-center space-x-2">
//                 <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
//                 <div>
//                   <h2 className="text-lg font-mono font-bold text-cyan-300 tracking-wider">🕉️ SPIRITUAL ENHANCEMENTS</h2>
//                   <p className="text-xs font-mono text-cyan-400">Awaken new abilities and deepen your journey</p>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <div className="text-right">
//                   <div className="text-sm font-mono font-bold text-cyan-300">
//                     {formatNumber(gameState.divinePoints)}
//                   </div>
//                   <div className="text-xs font-mono text-cyan-400">SPIRITUAL ESSENCE</div>
//                 </div>
//                 <button
//                   onClick={() => setShowUpgradeShop(false)}
//                   className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-800/50 hover:border-red-400/50 transition-all duration-300 hover:scale-110"
//                 >
//                   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             {/* Modal Content */}
//             <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
//               {/* Filter Tabs */}
//               <div className="flex space-x-2 mb-4 overflow-x-auto">
//                 {['all', 'affordable', 'recommended'].map((filter) => (
//                   <button
//                     key={filter}
//                     onClick={() => setUpgradeFilter(filter as typeof upgradeFilter)}
//                     className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 whitespace-nowrap hover:scale-105 ${
//                       upgradeFilter === filter
//                         ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]'
//                         : 'bg-gray-800/50 text-gray-400 border border-gray-600 hover:border-cyan-400 hover:text-cyan-300'
//                     }`}
//                   >
//                     {getFilterDisplayName(filter)}
//                   </button>
//                 ))}
//               </div>

//               {/* Upgrades Grid */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//                 {getPaginatedUpgrades().map((upgrade) => {
//                   const cost = getUpgradeCost(upgrade);
//                   const canAfford = gameState.divinePoints >= cost;
//                   const isMaxed = isUpgradeMaxed(upgrade);

//                   return (
//                     <div
//                       key={upgrade.id}
//                       className={`relative bg-gradient-to-r backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] ${
//                         isMaxed 
//                           ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20' 
//                           : canAfford 
//                           ? 'border-green-500/50 hover:border-green-400 from-gray-800/40 to-gray-900/40' 
//                           : 'border-gray-600/50 from-gray-800/40 to-gray-900/40'
//                       }`}
//                     >
//                       <div className="flex flex-col h-full">
//                         <div className="flex items-center justify-between mb-2">
//                           <h3 className="text-sm font-mono font-bold text-gray-200 tracking-wider">
//                             {upgrade.name}
//                           </h3>
//                           {upgrade.level > 0 && (
//                             <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full border border-cyan-500/30">
//                               LV.{upgrade.level}
//                             </span>
//                           )}
//                         </div>
//                         <div className="text-xs font-mono text-gray-400 mb-3 flex-1">
//                           {upgrade.effect}
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <div className="text-xs font-mono text-gray-300">
//                             Cost: <span className={canAfford ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
//                               {formatNumber(cost)}
//                             </span>
//                           </div>
//                           <button
//                             onClick={() => {
//                               if (canAfford && !isMaxed) {
//                                 purchaseUpgrade(upgrade.id);
//                               }
//                             }}
//                             disabled={!canAfford || isMaxed}
//                             className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 ${
//                               isMaxed
//                                 ? 'bg-gradient-to-r from-yellow-600/50 to-yellow-500/50 text-yellow-300 border border-yellow-500/50 cursor-not-allowed'
//                                 : canAfford
//                                 ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border border-green-400 shadow-sm'
//                                 : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-500 border border-gray-600 cursor-not-allowed'
//                             }`}
//                           >
//                             {isMaxed ? 'MAX' : canAfford ? 'BUY' : '💰'}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Pagination Controls */}
//               {getTotalPages() > 1 && (
//                 <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
//                   <button
//                     onClick={() => setCurrentUpgradePage(Math.max(1, currentUpgradePage - 1))}
//                     disabled={currentUpgradePage === 1}
//                     className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
//                       currentUpgradePage === 1
//                         ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
//                         : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/50 hover:border-cyan-400/50'
//                     }`}
//                   >
//                     ← Previous
//                   </button>
                  
//                   <div className="text-xs font-mono text-gray-400">
//                     Page {currentUpgradePage} of {getTotalPages()}
//                   </div>
                  
//                   <button
//                     onClick={() => setCurrentUpgradePage(Math.min(getTotalPages(), currentUpgradePage + 1))}
//                     disabled={currentUpgradePage === getTotalPages()}
//                     className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
//                       currentUpgradePage === getTotalPages()
//                         ? 'bg-gray-700/50 text-gray-500 border border-gray-600 cursor-not-allowed'
//                         : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/50 hover:border-cyan-400/50'
//                     }`}
//                   >
//                     Next →
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <TutorialOverlay />
//       <PersonalizationInfo />
//     </div>
//   );
// };

