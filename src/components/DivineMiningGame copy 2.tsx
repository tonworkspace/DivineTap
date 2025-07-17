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

// const GAME_VERSION = '1.1.0'; // Updated version
// const SAVE_KEY = 'divineMiningGame';
// const BACKUP_KEY = 'divineMiningGame_backup';
// // const HIGH_SCORE_KEY = 'divineMiningHighScore';
// const DIVINE_POINTS_KEY = 'divineMiningPoints';
// const TOTAL_EARNED_KEY = 'divineMiningTotalEarned'; // New: Separate key for total earned
// const SESSION_KEY = 'divineMiningSession'; // New: Separate key for session data
// const TUTORIAL_KEY = 'divineMiningTutorial'; // New: Tutorial progress key
// const ACHIEVEMENTS_KEY = 'divineMiningAchievements'; // New: Achievements key
// const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
// const BACKUP_INTERVAL = 300000; // 5 minutes
// const OFFLINE_EFFICIENCY_CAP = 14; // 14 days max offline earnings
// const OFFLINE_EFFICIENCY_BONUS = 0.1; // 10% bonus per day offline (max 140%)

// // Add CardHeader component outside the main component
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

// export const DivineMiningGame: React.FC = () => {
//   const { setPoints, activeBoosts } = useGameContext();
//   const { user } = useAuth();
//   const {
//     showAchievementNotification,
//     showMilestoneNotification,
//     showUpgradeNotification,
//     showSystemNotification,
//     showOfflineRewardsNotification,
//   } = useNotificationSystem();
  
//   // Add missing state variables
//   const [showHelp, setShowHelp] = useState(false);
//   // const [showDebug, setShowDebug] = useState(false);
//   const [, setLastSaveStatus] = useState<'success' | 'error' | 'pending'>('pending');
//   const [, setSaveMessage] = useState('');
//   const [miningResumed, setMiningResumed] = useState(false);
//   const [showOfflineRewards, setShowOfflineRewards] = useState(false);
//   const [offlineRewardNotification, setOfflineRewardNotification] = useState('');
//   const [clickEffect, setClickEffect] = useState<ClickEffect | null>(null);
//   const [showMilestone,] = useState<MilestoneData | null>(null);
//   const [isNewPlayer, setIsNewPlayer] = useState(false);
//   const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  
//   // Upgrade filtering state
//   const [upgradeFilter, setUpgradeFilter] = useState<'all' | 'affordable' | 'recommended' | 'category'>('all');
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');
//   const [currentUpgradePage, setCurrentUpgradePage] = useState(1);
//   const upgradesPerPage = 8;

//   const autoSaveRef = useRef<NodeJS.Timeout>();
//   const backupRef = useRef<NodeJS.Timeout>();
//   const miningIntervalRef = useRef<NodeJS.Timeout>();

//   // Helper function to get user-specific keys
//   const getUserSpecificKey = useCallback((baseKey: string): string => {
//     return user?.id ? `${baseKey}_${user.id}` : baseKey;
//   }, [user?.id]);

//   const migrateLocalToSupabase = useCallback(() => {
//     setIsSavingToDatabase(true);
//     // Simulate sync process
//     setTimeout(() => {
//       setIsSavingToDatabase(false);
//       showSystemNotification('Sync Complete', 'Your save has been synced to the cloud!', 'success');
//     }, 2000);
//   }, [showSystemNotification]);

//   const handleDivinePointsClick = useCallback((event: React.MouseEvent) => {
//     const rect = event.currentTarget.getBoundingClientRect();
//     const x = ((event.clientX - rect.left) / rect.width) * 100;
//     const y = ((event.clientY - rect.top) / rect.height) * 100;
    
//     setClickEffect({ x, y, timestamp: Date.now() });
    
//     // Clear click effect after animation
//     setTimeout(() => setClickEffect(null), 1000);
//   }, []);

//   const formatNumberWithEmoji = useCallback((num: number): string => {
//     if (num >= 1000000000) {
//       return (num / 1000000000).toFixed(1) + 'B 💎';
//     } else if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + 'M 🏆';
//     } else if (num >= 1000) {
//       return (num / 1000).toFixed(1) + 'K ⭐';
//     }
//     return Math.floor(num).toString();
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

//   const getAvailableCategories = useCallback((): string[] => {
//     return ['all', 'mining', 'energy', 'special'];
//   }, []);

//   const getCategoryDisplayName = useCallback((category: string): string => {
//     switch (category) {
//       case 'all': return 'ALL';
//       case 'mining': return 'MINING';
//       case 'energy': return 'ENERGY';
//       case 'special': return 'SPECIAL';
//       default: return category.toUpperCase();
//     }
//   }, []);

//   const getUpgradeCategoryBg = useCallback((category: string): string => {
//     switch (category) {
//       case 'mining': return 'bg-green-900/20';
//       case 'energy': return 'bg-blue-900/20';
//       case 'special': return 'bg-purple-900/20';
//       default: return 'bg-gray-900/20';
//     }
//   }, []);

//   const getUpgradeCategoryColor = useCallback((category: string): string => {
//     switch (category) {
//       case 'mining': return 'text-green-400 border-green-400';
//       case 'energy': return 'text-blue-400 border-blue-400';
//       case 'special': return 'text-purple-400 border-purple-400';
//       default: return 'text-gray-400 border-gray-400';
//     }
//   }, []);

//   const getUpgradeCategory = useCallback((upgrade: Upgrade): string => {
//     if (upgrade.id.includes('mining')) return 'mining';
//     if (upgrade.id.includes('energy')) return 'energy';
//     if (upgrade.id.includes('auto') || upgrade.id.includes('divine')) return 'special';
//     return 'other';
//   }, []);

//   // Check if player is new
//   useEffect(() => {
//     // This will be set up properly once gameState is defined
//     setIsNewPlayer(false);
//   }, []);

//   // Load achievements from localStorage or use defaults
//   const getInitialAchievements = useCallback((): Achievement[] => {
//     const defaultAchievements: Achievement[] = [
//       {
//         id: 'first-mining',
//         name: 'First Mining',
//         description: 'Start mining for the first time',
//         condition: (state) => state.totalPointsEarned > 0,
//         unlocked: false
//       },
//       {
//         id: 'first-upgrade',
//         name: 'First Upgrade',
//         description: 'Purchase your first upgrade',
//         condition: (state) => state.upgradesPurchased >= 1,
//         unlocked: false
//       },
//       {
//         id: 'speed-demon',
//         name: 'Speed Demon',
//         description: 'Reach 10 points per second',
//         condition: (state) => state.pointsPerSecond >= 10,
//         unlocked: false
//       },
//       {
//         id: 'millionaire',
//         name: 'Millionaire',
//         description: 'Earn 1,000,000 total points',
//         condition: (state) => state.totalPointsEarned >= 1000000,
//         unlocked: false
//       },
//       {
//         id: 'upgrade-master',
//         name: 'Upgrade Master',
//         description: 'Purchase 50 upgrades',
//         condition: (state) => state.upgradesPurchased >= 50,
//         unlocked: false
//       }
//     ];

//     try {
//       const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
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
//     const userHighScoreKey = getUserSpecificKey('divineMiningHighScore');
//     const allTimeHighScore = parseInt(localStorage.getItem(userHighScoreKey) || '100', 10);
    
//     // Load divine points from separate localStorage key
//     const savedDivinePoints = parseInt(localStorage.getItem(DIVINE_POINTS_KEY) || '100', 10);
    
//     // Load total earned from separate localStorage key
//     const savedTotalEarned = parseInt(localStorage.getItem(TOTAL_EARNED_KEY) || '0', 10);
    
//     // Load session data from separate localStorage key
//     const savedSessionData = localStorage.getItem(SESSION_KEY);
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
//     const prestigeMultiplier = parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0');
    
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
//       lastOfflineRewardTime: Date.now() // New: Track when offline rewards were last calculated
//     };

//     try {
//       // Try to load main save
//       const saved = localStorage.getItem(SAVE_KEY);
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
//             const energyRegenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
//             const energyBurstUpgrades = upgrades.filter(u => u.id === 'energy-burst');
//             const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//             const burstBonus = energyBurstUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//             const baseRegen = 0.3; // Reduced base regen for better balance
//             const totalRegen = baseRegen + regenBonus + burstBonus;
//             offlineEnergyRegen = totalRegen * (timeDiff / 1000);
            
//             // Add to unclaimed rewards instead of immediately adding to points
//             unclaimedRewards = parsed.unclaimedOfflineRewards || 0;
//             unclaimedRewards += offlineEarnings;
            
//             console.log(`Offline earnings: ${offlineEarnings.toFixed(2)} points (${baseOfflineEarnings.toFixed(2)} base + ${(offlineEfficiencyBonus * 100).toFixed(1)}% bonus) over ${Math.floor(timeDiff / 1000 / 60)} minutes`);
//             console.log(`Offline energy regen: ${offlineEnergyRegen.toFixed(2)} energy`);
//             console.log(`Total unclaimed rewards: ${unclaimedRewards.toFixed(2)} points`);
            
//             // Set mining resumed flag
//             setMiningResumed(true);
            
//             // Show offline rewards notification
//             if (offlineEarnings > 0) {
//               const bonusText = offlineEfficiencyBonus > 0 ? ` (+${(offlineEfficiencyBonus * 100).toFixed(1)}% offline bonus)` : '';
//               setOfflineRewardNotification(`🎁 You have ${Math.floor(unclaimedRewards)} unclaimed offline rewards!${bonusText}`);
//               setShowOfflineRewards(true);
//             }
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
//             lastOfflineRewardTime: now
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
//         const backup = localStorage.getItem(BACKUP_KEY);
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
//     const savedTutorial = localStorage.getItem(TUTORIAL_KEY);
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
//         localStorage.setItem(TUTORIAL_KEY, JSON.stringify(completedState));
//         return completedState;
//       }
      
//       const newState = {
//         ...prev,
//         currentStep: nextStep,
//         highlightElement: prev.steps[nextStep]?.target || null
//       };
//       localStorage.setItem(TUTORIAL_KEY, JSON.stringify(newState));
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
//     localStorage.setItem(TUTORIAL_KEY, JSON.stringify(completedState));
//   }, [tutorialState]);

//   // const resetTutorial = useCallback(() => {
//   //   const resetState = {
//   //     isActive: false,
//   //     currentStep: 0,
//   //     steps: tutorialSteps,
//   //     isCompleted: false,
//   //     showTutorial: false,
//   //     highlightElement: null
//   //   };
//   //   setTutorialState(resetState);
//   //   localStorage.removeItem(TUTORIAL_KEY);
//   // }, []);

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
//     localStorage.setItem(DIVINE_POINTS_KEY, gameState.divinePoints.toString());

//     // Check for new high score
//     if (gameState.divinePoints > gameState.highScore) {
//       const newHighScore = gameState.divinePoints;
//       setGameState(prev => ({
//         ...prev,
//         highScore: newHighScore,
//         allTimeHighScore: Math.max(prev.allTimeHighScore, newHighScore)
//       }));
      
//       // Save high score to localStorage immediately using user-specific key
//       const userHighScoreKey = getUserSpecificKey('divineMiningHighScore');
//       localStorage.setItem(userHighScoreKey, newHighScore.toString());
      
//       // Show high score notification only when NOT mining (to avoid spam)
//       if (!gameState.isMining) {
//       if (newHighScore > gameState.allTimeHighScore) {
//         showSystemNotification(
//           '🎉 NEW ALL-TIME HIGH SCORE!',
//           `${newHighScore.toLocaleString()} points`,
//           'success'
//         );
//       } else {
//         showSystemNotification(
//           '🏆 New High Score!',
//           `${newHighScore.toLocaleString()} points`,
//           'success'
//         );
//         }
//       }
//     }
//   }, [gameState.divinePoints, setPoints, gameState.highScore, gameState.allTimeHighScore, getUserSpecificKey]);

//   // Apply active boosts to mining rate (enhanced version moved after upgrades)
//   const getBoostedMiningRate = useCallback(() => {
//     const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
//     const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
//     return gameState.pointsPerSecond * totalMultiplier;
//   }, [gameState.pointsPerSecond, activeBoosts]);

//   // // Calculate offline mining rate with boosts and efficiency bonus
//   // const getOfflineMiningRate = useCallback(() => {
//   //   const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
//   //   const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
//   //   const baseRate = gameState.pointsPerSecond * totalMultiplier;
    
//   //   // Apply offline efficiency bonus
//   //   const offlineBonus = gameState.offlineEfficiencyBonus || 0;
//   //   return baseRate * (1 + offlineBonus);
//   // }, [gameState.pointsPerSecond, gameState.offlineEfficiencyBonus, activeBoosts]);



//   // Load upgrades from localStorage or use defaults
//   const getInitialUpgrades = (): Upgrade[] => {
//     try {
//       const savedUpgrades = localStorage.getItem('divineMiningUpgrades');
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
    
//     // Enhanced default upgrades for better progression
//     return [
//       {
//         id: 'mining-speed',
//         name: 'MINING SPEED',
//         level: 0,
//         effect: '+0.5/sec',
//         baseCost: 25,
//         costMultiplier: 1.12,
//         effectValue: 0.5
//       },
//       {
//         id: 'mining-capacity',
//         name: 'MINING CAPACITY',
//         level: 0,
//         effect: '+50 capacity',
//         baseCost: 75,
//         costMultiplier: 1.15,
//         effectValue: 50
//       },
//       {
//         id: 'auto-miner',
//         name: 'AUTO MINER',
//         level: 0,
//         effect: '+1.0/sec',
//         baseCost: 200,
//         costMultiplier: 1.18,
//         effectValue: 1.0
//       },
//       {
//         id: 'divine-boost',
//         name: 'DIVINE BOOST',
//         level: 0,
//         effect: '+2.0/sec',
//         baseCost: 750,
//         costMultiplier: 1.22,
//         effectValue: 2.0
//       },
//       {
//         id: 'quantum-miner',
//         name: 'QUANTUM MINER',
//         level: 0,
//         effect: '+5.0/sec',
//         baseCost: 3000,
//         costMultiplier: 1.25,
//         effectValue: 5.0
//       },
//       {
//         id: 'cosmic-miner',
//         name: 'COSMIC MINER',
//         level: 0,
//         effect: '+10.0/sec',
//         baseCost: 10000,
//         costMultiplier: 1.3,
//         effectValue: 10.0
//       },
//       {
//         id: 'stellar-miner',
//         name: 'STELLAR MINER',
//         level: 0,
//         effect: '+25.0/sec',
//         baseCost: 50000,
//         costMultiplier: 1.35,
//         effectValue: 25.0
//       },
//       {
//         id: 'galactic-miner',
//         name: 'GALACTIC MINER',
//         level: 0,
//         effect: '+100.0/sec',
//         baseCost: 250000,
//         costMultiplier: 1.4,
//         effectValue: 100.0
//       },
//       {
//         id: 'energy-efficiency',
//         name: 'ENERGY EFFICIENCY',
//         level: 0,
//         effect: '-10% energy cost',
//         baseCost: 50000,
//         costMultiplier: 1.5,
//         effectValue: -0.1
//       },
//       {
//         id: 'energy-capacity',
//         name: 'ENERGY CAPACITY',
//         level: 0,
//         effect: '+2000 max energy',
//         baseCost: 75000,
//         costMultiplier: 1.6,
//         effectValue: 2000
//       },
//       {
//         id: 'energy-regen',
//         name: 'ENERGY REGEN',
//         level: 0,
//         effect: '+1.0 energy/sec',
//         baseCost: 100000,
//         costMultiplier: 1.7,
//         effectValue: 1.0
//       },
//       {
//         id: 'offline-efficiency',
//         name: 'OFFLINE EFFICIENCY',
//         level: 0,
//         effect: '+5% offline bonus',
//         baseCost: 150000,
//         costMultiplier: 1.8,
//         effectValue: 0.05
//       },
//       {
//         id: 'auto-mining',
//         name: 'AUTO MINING',
//         level: 0,
//         effect: 'Auto-start mining',
//         baseCost: 500000,
//         costMultiplier: 2.0,
//         effectValue: 1
//       },
//       {
//         id: 'energy-sustain',
//         name: 'ENERGY SUSTAIN',
//         level: 0,
//         effect: '-20% energy cost',
//         baseCost: 200000,
//         costMultiplier: 1.9,
//         effectValue: -0.2
//       },
//       {
//         id: 'divine-resonance',
//         name: 'DIVINE RESONANCE',
//         level: 0,
//         effect: '+50% boost effectiveness',
//         baseCost: 1000000,
//         costMultiplier: 2.5,
//         effectValue: 0.5
//       },
//       {
//         id: 'energy-overflow',
//         name: 'ENERGY OVERFLOW',
//         level: 0,
//         effect: '+5000 max energy',
//         baseCost: 2000000,
//         costMultiplier: 3.0,
//         effectValue: 5000
//       },
//       {
//         id: 'energy-burst',
//         name: 'ENERGY BURST',
//         level: 0,
//         effect: '+2.0 energy/sec',
//         baseCost: 3000000,
//         costMultiplier: 3.5,
//         effectValue: 2.0
//       },
//       {
//         id: 'energy-mastery',
//         name: 'ENERGY MASTERY',
//         level: 0,
//         effect: '-30% energy cost',
//         baseCost: 5000000,
//         costMultiplier: 4.0,
//         effectValue: -0.3
//       }
//     ];
//   };

//   const [upgrades, setUpgrades] = useState<Upgrade[]>(getInitialUpgrades);

//   // Add missing upgrade functions after upgrades are defined
//   const isUpgradeMaxed = useCallback((upgrade: Upgrade): boolean => {
//     // Define max levels for different upgrades
//     const maxLevels: Record<string, number> = {
//       'mining-speed': 100,
//       'energy-efficiency': 50,
//       'auto-mining': 1,
//       'divine-resonance': 5,
//     };
    
//     const maxLevel = maxLevels[upgrade.id] || 50;
//     return upgrade.level >= maxLevel;
//   }, []);

//   const getUpgradeEfficiency = useCallback((upgrade: Upgrade): number => {
//     const cost = getUpgradeCost(upgrade);
//     return upgrade.effectValue / cost * 1000; // Points per 1000 cost
//   }, []);

//   // This will be defined later after canAffordUpgrade is available
//   const canPurchaseUpgrade = useCallback((upgrade: Upgrade): boolean => {
//     const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
//     return !isUpgradeMaxed(upgrade) && gameState.divinePoints >= cost;
//   }, [isUpgradeMaxed, gameState.divinePoints]);

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

//   // // Calculate potential offline earnings
//   // const getPotentialOfflineEarnings = useCallback((hoursOffline: number = 24) => {
//   //   const secondsOffline = hoursOffline * 60 * 60;
//   //   const baseEarnings = getOfflineMiningRate() * secondsOffline;
    
//   //   // Calculate efficiency bonus for the time period
//   //   const daysOffline = hoursOffline / 24;
//   //   const efficiencyBonus = Math.min(daysOffline * OFFLINE_EFFICIENCY_BONUS, 1.4);
    
//   //   return {
//   //     baseEarnings,
//   //     efficiencyBonus,
//   //     totalEarnings: baseEarnings * (1 + efficiencyBonus),
//   //     energyRegen: (0.5 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0)) * secondsOffline
//   //   };
//   // }, [getOfflineMiningRate, upgrades]);

//   // Enhanced mining rate calculation with divine resonance
//   const getEnhancedMiningRate = useCallback(() => {
//     const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
//     const baseMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
    
//     // Apply divine resonance upgrade to boost effectiveness
//     const divineResonanceUpgrades = upgrades.filter(u => u.id === 'divine-resonance');
//     const resonanceBonus = divineResonanceUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//     const enhancedMultiplier = baseMultiplier * (1 + resonanceBonus);
    
//     return gameState.pointsPerSecond * enhancedMultiplier;
//   }, [gameState.pointsPerSecond, activeBoosts, upgrades]);

//   // Sync game state with loaded upgrades on initialization - IMPROVED VERSION
//   useEffect(() => {
//     const totalUpgradeEffect = upgrades.reduce((sum, upgrade) => sum + (upgrade.effectValue * upgrade.level), 0);
//     const totalUpgradesPurchased = upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
    
//     setGameState(prev => {
//       const newPointsPerSecond = 1.0 + totalUpgradeEffect;
//       const newUpgradesPurchased = totalUpgradesPurchased;
      
//       console.log('Upgrade sync check:', {
//         currentPPS: prev.pointsPerSecond,
//         newPPS: newPointsPerSecond,
//         currentUpgrades: prev.upgradesPurchased,
//         newUpgrades: newUpgradesPurchased,
//         currentPoints: prev.divinePoints,
//         hasLoadedSavedData: hasLoadedSavedData,
//         isFreshStart: prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0
//       });
      
//       // IMPROVED LOGIC: Only sync upgrades if:
//       // 1. We haven't loaded saved data AND this looks like a fresh start
//       // 2. OR if upgrade levels have actually changed from what's saved
//       const isFreshStart = prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0;
//       const upgradesChanged = prev.upgradesPurchased !== newUpgradesPurchased;
//       const shouldPreserveSavedData = hasLoadedSavedData && prev.divinePoints > 100;
      
//       if ((isFreshStart && !shouldPreserveSavedData) || (upgradesChanged && !shouldPreserveSavedData)) {
//         console.log(`Syncing game state: ${isFreshStart ? 'Fresh start' : 'Upgrades changed'}`);
//         console.log(`PPS ${prev.pointsPerSecond} -> ${newPointsPerSecond}, Upgrades ${prev.upgradesPurchased} -> ${newUpgradesPurchased}`);
//         return {
//           ...prev,
//           pointsPerSecond: newPointsPerSecond,
//           upgradesPurchased: newUpgradesPurchased
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
//   }, [hasLoadedSavedData, gameState.divinePoints]); // Run when hasLoadedSavedData changes

//   // Enhanced save function with error handling and backup
//   const saveGameState = useCallback((state: GameState, isBackup = false) => {
//     try {
//       const saveData = {
//         ...state,
//         lastSaveTime: Date.now()
//       };
      
//       const key = isBackup ? BACKUP_KEY : SAVE_KEY;
//       const saveString = JSON.stringify(saveData);
      
//       console.log(`Saving to ${key}:`, {
//         divinePoints: saveData.divinePoints,
//         pointsPerSecond: saveData.pointsPerSecond,
//         isMining: saveData.isMining,
//         highScore: saveData.highScore,
//         allTimeHighScore: saveData.allTimeHighScore
//       });
      
//       localStorage.setItem(key, saveString);
      
//       // Also save high score and divine points separately for redundancy
//       if (!isBackup) {
//         const userHighScoreKey = getUserSpecificKey('divineMiningHighScore');
//         const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
//         localStorage.setItem(userHighScoreKey, saveData.allTimeHighScore.toString());
//         localStorage.setItem(DIVINE_POINTS_KEY, saveData.divinePoints.toString());
//         localStorage.setItem(TOTAL_EARNED_KEY, saveData.totalPointsEarned.toString());
//         localStorage.setItem(userAchievementsKey, JSON.stringify(achievements));
        
//         // Save session data separately
//         const sessionData = {
//           sessionStartTime: saveData.sessionStartTime,
//           lastDailyReset: saveData.lastDailyReset,
//           lastWeeklyReset: saveData.lastWeeklyReset,
//           lastSaveTime: saveData.lastSaveTime,
//           version: saveData.version
//         };
//         localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
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
//   }, [getUserSpecificKey]);

//   // Auto-save effect
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
    
//     const success = saveGameState(saveState);
//     if (success) {
//       // Create backup every 5 minutes
//       if (Date.now() - (gameState.lastSaveTime || 0) > BACKUP_INTERVAL) {
//         saveGameState(saveState, true);
//       }
//     }
//   }, [gameState, saveGameState]);

//   // Auto-save timer
//   useEffect(() => {
//     autoSaveRef.current = setInterval(() => {
//       setGameState(prev => ({ ...prev })); // Trigger save
//     }, AUTO_SAVE_INTERVAL);

//     return () => {
//       if (autoSaveRef.current) {
//         clearInterval(autoSaveRef.current);
//       }
//     };
//   }, []);

//   // Backup timer
//   useEffect(() => {
//     backupRef.current = setInterval(() => {
//       const saveData = {
//         ...gameState,
//         lastSaveTime: Date.now()
//       };
//       saveGameState(saveData, true);
//     }, BACKUP_INTERVAL);

//     return () => {
//       if (backupRef.current) {
//         clearInterval(backupRef.current);
//       }
//     };
//   }, [gameState, saveGameState]);

  

//   // Enhanced achievement checking with new notification system
//   useEffect(() => {
//     const newUnlockedAchievements = achievements.filter(achievement => 
//       !achievement.unlocked && achievement.condition(gameState)
//     );
    
//     if (newUnlockedAchievements.length > 0) {
//       newUnlockedAchievements.forEach(achievement => {
//         showAchievementNotification(achievement);
//       });
      
//       setAchievements(prev => prev.map(achievement => ({
//         ...achievement,
//         unlocked: achievement.unlocked || achievement.condition(gameState),
//         unlockedAt: achievement.unlockedAt || (achievement.condition(gameState) ? Date.now() : undefined)
//       })));
//     }
//   }, [gameState, achievements, showAchievementNotification]);

//   // Save achievements to localStorage whenever they change
//   useEffect(() => {
//     try {
//       const userAchievementsKey = getUserSpecificKey(ACHIEVEMENTS_KEY);
//       localStorage.setItem(userAchievementsKey, JSON.stringify(achievements));
//       console.log('Achievements saved to localStorage:', achievements);
//     } catch (error) {
//       console.error('Error saving achievements to localStorage:', error);
//     }
//   }, [achievements, getUserSpecificKey]);

//   // Enhanced milestone checking with new notification system
//   useEffect(() => {
//     const milestones = [1000, 10000, 100000, 1000000, 10000000, 100000000];
//     const currentPoints = gameState.divinePoints;
    
//     milestones.forEach(milestone => {
//       if (currentPoints >= milestone && currentPoints < milestone + 100) {
//         showMilestoneNotification(milestone, currentPoints);
//       }
//     });
//   }, [gameState.divinePoints, showMilestoneNotification]);

//   // Enhanced energy warning system - REMOVED ANNOYING NOTIFICATIONS
//   // useEffect(() => {
//   //   // Removed energy warning notifications - they were too frequent and annoying
//   //   // User can see the energy bar and mining will stop automatically when energy runs out
//   // }, [gameState.isMining, gameState.currentEnergy, getEnhancedMiningRate, upgrades, showEnergyWarningNotification]);

//   // Claim offline rewards function (moved before showOfflineRewardsNotification)
//   const claimOfflineRewards = useCallback(() => {
//     if (gameState.unclaimedOfflineRewards > 0) {
//       setGameState(prev => {
//         const newState = {
//           ...prev,
//           divinePoints: prev.divinePoints + prev.unclaimedOfflineRewards,
//           totalPointsEarned: prev.totalPointsEarned + prev.unclaimedOfflineRewards,
//           unclaimedOfflineRewards: 0,
//           lastOfflineRewardTime: Date.now()
//         };
        
//         console.log(`Offline rewards claimed: +${prev.unclaimedOfflineRewards} points`);
//         showSystemNotification('Offline Rewards Claimed!', `🎉 Claimed ${Math.floor(prev.unclaimedOfflineRewards)} offline rewards!`, 'success');
        
//         return newState;
//       });
      
//       setShowOfflineRewards(false);
//       setOfflineRewardNotification('');
//     }
//   }, [gameState.unclaimedOfflineRewards, showSystemNotification]);



//   // Enhanced offline rewards notification
//   useEffect(() => {
//     if (gameState.unclaimedOfflineRewards > 0 && !showOfflineRewards) {
//       showOfflineRewardsNotification(gameState.unclaimedOfflineRewards, gameState.offlineEfficiencyBonus, claimOfflineRewards);
//     }
//   }, [gameState.unclaimedOfflineRewards, gameState.offlineEfficiencyBonus, showOfflineRewards, showOfflineRewardsNotification, claimOfflineRewards]);

//   // Enhanced purchase upgrade with validation
//   const purchaseUpgrade = useCallback((upgradeId: string) => {
//     const upgrade = upgrades.find(u => u.id === upgradeId);
//     if (!upgrade) {
//       console.error('Upgrade not found:', upgradeId);
//       return;
//     }

//     const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
    
//     if (gameState.divinePoints >= cost) {
//       setGameState(prev => {
//         let newState = {
//           ...prev,
//           divinePoints: prev.divinePoints - cost,
//           upgradesPurchased: prev.upgradesPurchased + 1
//         };
        
//         // Handle special upgrades
//         if (upgradeId === 'energy-capacity') {
//           newState = {
//             ...newState,
//             maxEnergy: prev.maxEnergy + upgrade.effectValue,
//             currentEnergy: Math.min(prev.currentEnergy, prev.maxEnergy + upgrade.effectValue)
//           };
//         } else if (upgradeId === 'energy-overflow') {
//           newState = {
//             ...newState,
//             maxEnergy: prev.maxEnergy + upgrade.effectValue,
//             currentEnergy: Math.min(prev.currentEnergy, prev.maxEnergy + upgrade.effectValue)
//           };
//         } else if (upgradeId.startsWith('mining-') || upgradeId === 'auto-miner' || upgradeId === 'divine-boost' || 
//                    upgradeId === 'quantum-miner' || upgradeId === 'cosmic-miner' || upgradeId === 'stellar-miner' || 
//                    upgradeId === 'galactic-miner') {
//           newState = {
//             ...newState,
//             pointsPerSecond: prev.pointsPerSecond + upgrade.effectValue
//           };
//         }
        
//         return newState;
//       });

//       setUpgrades(prev => {
//         const updatedUpgrades = prev.map(u => 
//           u.id === upgradeId 
//             ? { ...u, level: u.level + 1 }
//             : u
//         );
        
//         // Save upgrades to localStorage immediately
//         try {
//           localStorage.setItem('divineMiningUpgrades', JSON.stringify(updatedUpgrades));
//           console.log('Upgrades saved to localStorage');
          
//           // Show upgrade notification
//           showUpgradeNotification(upgrade.name, cost);
//         } catch (error) {
//           console.error('Error saving upgrades:', error);
//           showSystemNotification('Upgrade Error', 'Failed to save upgrade!', 'error');
//         }
        
//         return updatedUpgrades;
//       });
      
//       console.log(`Purchased upgrade: ${upgrade.name} for ${cost} points`);
//     } else {
//       showSystemNotification('Insufficient Points', 'Not enough points for this upgrade!', 'warning');
//     }
//   }, [upgrades, gameState.divinePoints, showUpgradeNotification, showSystemNotification]);

//   // Enhanced number formatting
//   const formatNumber = useCallback((num: number): string => {
//     if (num >= 1000000000) {
//       return (num / 1000000000).toFixed(1) + 'B';
//     } else if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + 'M';
//     } else if (num >= 1000) {
//       return (num / 1000).toFixed(1) + 'K';
//     }
//     return Math.floor(num).toString();
//   }, []);

//   const getUpgradeCost = useCallback((upgrade: Upgrade): number => {
//     return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
//   }, []);

//   // const canAffordUpgrade = useCallback((upgrade: Upgrade): boolean => {
//   //   return gameState.divinePoints >= getUpgradeCost(upgrade);
//   // }, [gameState.divinePoints, getUpgradeCost]);

//   const getSessionDuration = useCallback((): string => {
//     const duration = Date.now() - gameState.sessionStartTime;
//     const hours = Math.floor(duration / (1000 * 60 * 60));
//     const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
//     return `${hours}h ${minutes}m`;
//   }, [gameState.sessionStartTime]);

//   // // Enhanced reset game with confirmation and backup
//   // const resetGame = useCallback(() => {
//   //   if (window.confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
//   //     if (window.confirm('Final warning: This will delete all your progress. Continue?')) {
//   //       localStorage.removeItem(SAVE_KEY);
//   //       localStorage.removeItem(BACKUP_KEY);
//   //       localStorage.removeItem('divineMiningUpgrades');
//   //       localStorage.removeItem(HIGH_SCORE_KEY);
//   //       localStorage.removeItem(DIVINE_POINTS_KEY);
//   //       localStorage.removeItem(TOTAL_EARNED_KEY);
//   //       localStorage.removeItem(SESSION_KEY);
//   //       localStorage.removeItem('divineMiningPrestigeMultiplier');
//   //       window.location.reload();
//   //     }
//   //   }
//   // }, []);

//   // // Prestige system - reset for bonus multiplier
//   // const prestige = useCallback(() => {
//   //   const prestigeThreshold = 1000000; // 1 million points to prestige
//   //   if (gameState.divinePoints >= prestigeThreshold) {
//   //     const prestigeBonus = Math.floor(gameState.divinePoints / prestigeThreshold);
//   //     const newMultiplier = 1 + (prestigeBonus * 0.1); // 10% bonus per prestige level
      
//   //     if (window.confirm(`Prestige for ${prestigeBonus}x multiplier? You'll lose all points but gain permanent mining speed bonus!`)) {
//   //       // Reset game state but keep high scores and add prestige bonus
//   //       const newState: GameState = {
//   //         divinePoints: 100,
//   //         pointsPerSecond: 1.0 * newMultiplier,
//   //         totalEarned24h: 0,
//   //         totalEarned7d: 0,
//   //         upgradesPurchased: 0,
//   //         minersActive: 1,
//   //         isMining: false,
//   //         lastSaveTime: Date.now(),
//   //         sessionStartTime: Date.now(),
//   //         totalPointsEarned: gameState.totalPointsEarned, // Keep total earned
//   //         lastDailyReset: new Date().toDateString(),
//   //         lastWeeklyReset: new Date().toDateString(),
//   //         version: GAME_VERSION,
//   //         highScore: gameState.highScore, // Keep high score
//   //         allTimeHighScore: gameState.allTimeHighScore, // Keep all-time high score
//   //         currentEnergy: 5000,
//   //         maxEnergy: 5000,
//   //         lastEnergyRegen: Date.now(),
//   //         offlineEfficiencyBonus: 0, // New: Bonus for offline mining
//   //         lastOfflineTime: Date.now(), // New: Track last offline time
//   //         unclaimedOfflineRewards: 0, // New: Track unclaimed offline rewards
//   //         lastOfflineRewardTime: Date.now() // New: Track when offline rewards were last calculated
//   //       };
        
//   //       setGameState(newState);
//   //       setUpgrades(getInitialUpgrades()); // Reset upgrades
//   //       localStorage.removeItem('divineMiningUpgrades');
        
//   //       // Save prestige multiplier
//   //       localStorage.setItem('divineMiningPrestigeMultiplier', newMultiplier.toString());
        
//   //       setSaveMessage(`🎉 Prestiged! +${((newMultiplier - 1) * 100).toFixed(1)}% permanent mining speed bonus!`);
//   //       setTimeout(() => setSaveMessage(''), 5000);
//   //     }
//   //   } else {
//   //     setSaveMessage(`Need ${(prestigeThreshold - gameState.divinePoints).toLocaleString()} more points to prestige!`);
//   //     setTimeout(() => setSaveMessage(''), 3000);
//   //   }
//   // }, [gameState]);

// //   // Export save data
// //   const exportSave = useCallback(() => {
// //     const saveData = {
// //       gameState: {
// //         ...gameState,
// //         lastSaveTime: Date.now()
// //       },
// //       upgrades: upgrades,
// //       exportDate: new Date().toISOString()
// //     };
    
// //     const dataStr = JSON.stringify(saveData, null, 2);
// //     const dataBlob = new Blob([dataStr], { type: 'application/json' });
// //     const url = URL.createObjectURL(dataBlob);
    
// //     const link = document.createElement('a');
// //     link.href = url;
// //     link.download = `divine-mining-save-${new Date().toISOString().split('T')[0]}.json`;
// //     link.click();
    
// //     URL.revokeObjectURL(url);
// //   }, [gameState, upgrades]);
// // // 
//   // // Import save data
//   // const importSave = useCallback(() => {
//   //   const input = document.createElement('input');
//   //   input.type = 'file';
//   //   input.accept = '.json';
    
//   //   input.onchange = (e) => {
//   //     const file = (e.target as HTMLInputElement).files?.[0];
//   //     if (!file) return;
      
//   //     const reader = new FileReader();
//   //     reader.onload = (e) => {
//   //       try {
//   //         const importedData = JSON.parse(e.target?.result as string);
          
//   //         // Handle both old format (just gameState) and new format (gameState + upgrades)
//   //         let gameStateData, upgradesData;
          
//   //         if (importedData.gameState && importedData.upgrades) {
//   //           // New format
//   //           gameStateData = importedData.gameState;
//   //           upgradesData = importedData.upgrades;
//   //         } else {
//   //           // Old format - just gameState
//   //           gameStateData = importedData;
//   //           upgradesData = null;
//   //         }
          
//   //         if (validateGameState(gameStateData)) {
//   //           setGameState({
//   //             ...gameStateData,
//   //             lastSaveTime: Date.now(),
//   //             version: GAME_VERSION
//   //           });
            
//   //           // Import upgrades if available
//   //           if (upgradesData && Array.isArray(upgradesData)) {
//   //             setUpgrades(upgradesData);
//   //             localStorage.setItem('divineMiningUpgrades', JSON.stringify(upgradesData));
//   //           }
            
//   //           setSaveMessage('Save imported successfully!');
//   //         } else {
//   //           setSaveMessage('Invalid save file!');
//   //         }
//   //       } catch (error) {
//   //         console.error('Error importing save:', error);
//   //         setSaveMessage('Error importing save file!');
//   //       }
//   //     };
//   //     reader.readAsText(file);
//   //   };
    
//   //   input.click();
//   // }, []);

//   // // Manual save function for debugging
//   // const manualSave = useCallback(() => {
//   //   const saveState = {
//   //     ...gameState,
//   //     lastSaveTime: Date.now()
//   //   };
    
//   //   console.log('Manual save triggered:', saveState);
//   //   const success = saveGameState(saveState);
    
//   //   if (success) {
//   //     setSaveMessage('Manual save successful!');
//   //     setTimeout(() => setSaveMessage(''), 2000);
//   //   } else {
//   //     setSaveMessage('Manual save failed!');
//   //     setTimeout(() => setSaveMessage(''), 3000);
//   //   }
//   // }, [gameState, saveGameState]);

//   // // Force save current state immediately
//   // const forceSave = useCallback(() => {
//   //   const saveState = {
//   //     ...gameState,
//   //     lastSaveTime: Date.now()
//   //   };
    
//   //   console.log('Force save triggered:', {
//   //     divinePoints: saveState.divinePoints,
//   //     pointsPerSecond: saveState.pointsPerSecond,
//   //     isMining: saveState.isMining,
//   //     highScore: saveState.highScore,
//   //     allTimeHighScore: saveState.allTimeHighScore
//   //   });
    
//   //   try {
//   //     localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
//   //     localStorage.setItem(BACKUP_KEY, JSON.stringify(saveState));
//   //     localStorage.setItem(HIGH_SCORE_KEY, saveState.allTimeHighScore.toString());
//   //     localStorage.setItem(DIVINE_POINTS_KEY, saveState.divinePoints.toString());
//   //     setLastSaveStatus('success');
//   //     setSaveMessage('Force save completed!');
//   //     setTimeout(() => setSaveMessage(''), 2000);
//   //     console.log('Force save successful');
//   //   } catch (error) {
//   //     console.error('Force save failed:', error);
//   //     setLastSaveStatus('error');
//   //     setSaveMessage('Force save failed!');
//   //     setTimeout(() => setSaveMessage(''), 3000);
//   //   }
//   // }, [gameState]);

//   // const unlockedAchievements = achievements.filter(a => a.unlocked);



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
      
//       // Immediately save when mining state changes
//       console.log(`Mining ${newState.isMining ? 'STARTED' : 'STOPPED'}:`, {
//         divinePoints: newState.divinePoints,
//         pointsPerSecond: newState.pointsPerSecond,
//         isMining: newState.isMining,
//         currentEnergy: newState.currentEnergy
//       });
      
//       // Save immediately
//       setTimeout(() => {
//         const saveState = {
//           ...newState,
//           lastSaveTime: Date.now()
//         };
//         saveGameState(saveState);
//       }, 100);
      
//       return newState;
//     });
    
//     // Clear mining resumed flag when user manually toggles
//     setMiningResumed(false);
//   }, [saveGameState, showSystemNotification]);

//   // Mining interval effect - ACTUALLY HANDLES THE MINING PROCESS
//   useEffect(() => {
//     if (!gameState.isMining) {
//       // Clear any existing mining interval
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//       }
//       return;
//     }

//     // Start mining interval
//     miningIntervalRef.current = setInterval(() => {
//       setGameState(prev => {
//         // Check if we have enough energy to continue mining
//         const boostedRate = getEnhancedMiningRate();
//         const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
//         const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
//         const energyMasteryUpgrades = upgrades.filter(u => u.id === 'energy-mastery');
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
        
//         // Calculate points earned this cycle
//         const pointsEarned = boostedRate * 0.5; // 500ms cycle
        
//         // Update game state
//         const newState = {
//           ...prev,
//           divinePoints: prev.divinePoints + pointsEarned,
//           totalPointsEarned: prev.totalPointsEarned + pointsEarned,
//           currentEnergy: prev.currentEnergy - energyCost,
//           totalEarned24h: prev.totalEarned24h + pointsEarned,
//           totalEarned7d: prev.totalEarned7d + pointsEarned
//         };
        
//         console.log('Mining cycle:', {
//           pointsEarned: pointsEarned.toFixed(2),
//           energyCost: energyCost.toFixed(2),
//           newEnergy: newState.currentEnergy.toFixed(2),
//           boostedRate: boostedRate.toFixed(2)
//         });
        
//         return newState;
//       });
//     }, 500); // Run every 500ms for smooth mining

//     // Cleanup function
//     return () => {
//       if (miningIntervalRef.current) {
//         clearInterval(miningIntervalRef.current);
//         miningIntervalRef.current = undefined;
//       }
//     };
//   }, [gameState.isMining, getEnhancedMiningRate, upgrades, saveGameState]);

//   // Energy regeneration effect
//   useEffect(() => {
//     if (gameState.currentEnergy >= gameState.maxEnergy) {
//       return; // No need to regenerate if at max
//     }

//     const energyRegenInterval = setInterval(() => {
//       setGameState(prev => {
//         const energyRegenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
//         const energyBurstUpgrades = upgrades.filter(u => u.id === 'energy-burst');
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
//     const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
//     const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
//     const energyMasteryUpgrades = upgrades.filter(u => u.id === 'energy-mastery');
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

//   return (
//     <div className="flex-1 pb-20 space-y-2 overflow-y-auto game-scrollbar">
//       {/* Divine Points Display - ENHANCED VERSION */}
//       <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)] divine-points-display overflow-hidden game-card-frame">
//         {/* Sync Local Button Only */}
//         <div className="absolute top-2 right-2 z-50">
//           <button
//             onClick={migrateLocalToSupabase}
//             className="px-3 py-1 text-xs font-mono rounded bg-cyan-700 text-white border border-cyan-400 hover:bg-cyan-600 transition-all shadow"
//             title="Sync local save to cloud"
//           >
//             ☁️ Sync Local
//           </button>
//         </div>
//          {/* Futuristic Corner Accents */}
//          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400 corner-accent"></div>
        
//         {/* Floating Particles Background */}
//         {gameState.isMining && (
//           <div className="absolute inset-0 overflow-hidden pointer-events-none">
//             {[...Array(12)].map((_, i) => (
//               <div
//                 key={`floating-particle-${i}`}
//                 className="absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-ping"
//                 style={{
//                   left: `${Math.random() * 100}%`,
//                   top: `${Math.random() * 100}%`,
//                   animationDuration: `${2 + Math.random() * 3}s`,
//                   animationDelay: `${Math.random() * 2}s`,
//                   animationIterationCount: 'infinite'
//                 }}
//               />
//             ))}
//             {[...Array(6)].map((_, i) => (
//               <div
//                 key={`sparkle-${i}`}
//                 className="absolute w-0.5 h-0.5 bg-yellow-400 rounded-full animate-pulse"
//                 style={{
//                   left: `${20 + Math.random() * 60}%`,
//                   top: `${20 + Math.random() * 60}%`,
//                   animationDuration: `${1 + Math.random() * 2}s`,
//                   animationDelay: `${Math.random() * 1}s`
//                 }}
//               />
//             ))}
//           </div>
//         )}
        
//         {/* Dynamic Background Glow */}
//         <div 
//           className={`absolute inset-0 rounded-xl transition-all duration-1000 ${
//             gameState.isMining 
//               ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 animate-pulse' 
//               : 'bg-gradient-to-br from-gray-500/5 to-gray-600/5'
//           }`}
//         />
        
//         {/* Click Effect */}
//         {clickEffect && (
//           <div 
//             className="absolute pointer-events-none z-10"
//             style={{
//               left: `${clickEffect.x}%`,
//               top: `${clickEffect.y}%`,
//               transform: 'translate(-50%, -50%)'
//             }}
//           >
//             <div className="text-cyan-400 font-mono font-bold text-sm animate-bounce">
//               +{getBoostedMiningRate().toFixed(1)}
//             </div>
//           </div>
//         )}
        
//         {/* Milestone Celebration */}
//         {showMilestone && (
//           <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
//             <div className="text-center animate-milestone-sparkle">
//               <div className="text-6xl mb-2">
//                 {showMilestone.value >= 1000000 ? '💎' : 
//                  showMilestone.value >= 100000 ? '🏆' : 
//                  showMilestone.value >= 10000 ? '⭐' : '✨'}
//               </div>
//               <div className="text-2xl font-mono font-bold text-cyan-300 mb-1">
//                 MILESTONE!
//               </div>
//               <div className="text-lg font-mono text-cyan-400">
//                 {formatNumber(showMilestone.value)} Points
//               </div>
//             </div>
//           </div>
//         )}
        
//         <div className="relative text-center">
//           {/* Card Header */}
//           <CardHeader 
//             title="DIVINE POINTS" 
//             isActive={gameState.isMining}
//             extraContent={gameState.isMining && (
//               <div className="text-xs text-green-400 font-mono animate-pulse">
//                 ⚡ ACTIVE
//               </div>
//             )}
//           />
          
//           {/* Main Points Display with Enhanced Styling */}
//           <div className="relative mb-2">
//             {/* Glowing Background for Large Numbers */}
//             <div className={`absolute inset-0 rounded-lg transition-all duration-500 ${
//               gameState.divinePoints > 1000000 
//                 ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse' 
//                 : gameState.divinePoints > 100000 
//                 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 animate-pulse' 
//                 : gameState.divinePoints > 10000 
//                 ? 'bg-gradient-to-r from-green-500/20 to-cyan-500/20' 
//                 : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
//             }`} />
            
//             <div 
//               className={`relative text-4xl font-mono font-bold tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer group ${
//                 gameState.divinePoints > 1000000 
//                   ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]' 
//                   : gameState.divinePoints > 100000 
//                   ? 'text-yellow-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
//                   : gameState.divinePoints > 10000 
//                   ? 'text-green-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
//                   : 'text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]'
//               } animate-number-update`} 
//               key={gameState.divinePoints}
//               title={`${gameState.divinePoints.toLocaleString()} Divine Points - Click for fun effects! 🎉`}
//               onClick={handleDivinePointsClick}
//             >
//               {formatNumberWithEmoji(gameState.divinePoints)}
              
//               {/* Click indicator */}
//               <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                 Click for effects! 🎉
//               </div>
//             </div>
            
//             {/* Milestone Indicators */}
//             {gameState.divinePoints >= 1000000 && (
//               <div className="absolute -top-2 -right-2 text-xs text-purple-400 animate-bounce">
//                 💎
//               </div>
//             )}
//             {gameState.divinePoints >= 100000 && gameState.divinePoints < 1000000 && (
//               <div className="absolute -top-2 -right-2 text-xs text-yellow-400 animate-bounce">
//                 🏆
//               </div>
//             )}
//             {gameState.divinePoints >= 10000 && gameState.divinePoints < 100000 && (
//               <div className="absolute -top-2 -right-2 text-xs text-green-400 animate-bounce">
//                 ⭐
//               </div>
//             )}
//           </div>
          
//           {/* Enhanced Mining Rate Display */}
//           <div className="text-xs font-mono tracking-wide mb-2">
//             <div className="flex items-center justify-center space-x-3">
//               <span className={`transition-all duration-300 ${
//                 gameState.isMining ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'
//               }`}>
//                 +{getBoostedMiningRate().toFixed(1)}/sec
//               </span>
//               <span className="text-gray-500">•</span>
//               <span className="text-blue-400">
//                 +{(getBoostedMiningRate() * 60).toFixed(0)}/min
//               </span>
//               <span className="text-gray-500">•</span>
//               <span className="text-green-400">
//                 +{(getBoostedMiningRate() * 3600).toFixed(0)}/hour
//               </span>
//             </div>
            
//             {/* Boost Indicators */}
//             <div className="flex items-center justify-center space-x-2 mt-1">
//               {activeBoosts.length > 0 && (
//                 <span className="text-yellow-400 animate-pulse">
//                   ⚡ +{activeBoosts.filter(b => b.type === 'mining').reduce((sum, b) => sum + b.multiplier, 0)}x boost
//                 </span>
//               )}
//               {parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0') > 1.0 && (
//                 <span className="text-purple-400 animate-pulse">
//                   👑 +{((parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0') - 1) * 100).toFixed(1)}% prestige
//                 </span>
//               )}
//             </div>
//           </div>
          
//           {/* Session Info with Enhanced Styling */}
//           <div className="text-xs text-gray-400 mt-2 mb-3">
//             <div className="flex items-center justify-center space-x-4">
//               <span className="flex items-center space-x-1">
//                 <span className="text-blue-400">⏱️</span>
//                 <span>{getSessionDuration()}</span>
//               </span>
//               <span className="text-gray-500">•</span>
//               <span className="flex items-center space-x-1">
//                 <span className="text-green-400">💰</span>
//                 <span>{formatNumber(gameState.totalPointsEarned)}</span>
//               </span>
//               {isSavingToDatabase && (
//                 <>
//                   <span className="text-gray-500">•</span>
//                   <span className="flex items-center space-x-1">
//                     <span className="text-yellow-400">💾</span>
//                     <span className="text-yellow-400">Saving...</span>
//                   </span>
//                 </>
//               )}
//               {isNewPlayer && (
//                 <>
//                   <span className="text-gray-500">•</span>
//                   <span className="flex items-center space-x-1">
//                     <span className="text-yellow-400">🆕</span>
//                     <span className="text-yellow-400">NEW PLAYER</span>
//                   </span>
//                 </>
//               )}
//             </div>
//           </div>
          
//           {/* Enhanced Active Boosts Display */}
//           {activeBoosts.length > 0 && (
//             <div className="mt-3 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
//               <div className="text-xs text-yellow-400 font-mono font-bold mb-2 flex items-center justify-center space-x-1">
//                 <span>⚡</span>
//                 <span>ACTIVE BOOSTS</span>
//                 <span>⚡</span>
//               </div>
//               <div className="flex flex-wrap gap-2 justify-center">
//                 {activeBoosts.map((boost, index) => (
//                   <div 
//                     key={index} 
//                     className="text-xs text-yellow-300 bg-yellow-500/30 px-3 py-1 rounded-full border border-yellow-400/50 animate-pulse hover:scale-105 transition-all duration-200 cursor-default"
//                     title={`${boost.multiplier}x mining boost for ${Math.ceil((boost.expires - Date.now()) / (60 * 60 * 1000))} more hours`}
//                   >
//                     {boost.multiplier}x mining ({Math.ceil((boost.expires - Date.now()) / (60 * 60 * 1000))}h)
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
          
//           {/* Progress Bar for Next Milestone */}
//           <div className="mt-3">
//             {(() => {
//               const milestones = [1000, 10000, 100000, 1000000, 10000000, 100000000];
//               const currentMilestone = milestones.find(m => gameState.divinePoints < m) || 1000000000;
//               const previousMilestone = milestones.filter(m => m < currentMilestone).pop() || 0;
//               const progress = ((gameState.divinePoints - previousMilestone) / (currentMilestone - previousMilestone)) * 100;
              
//               return (
//                 <div className="text-center">
//                   <div className="text-xs text-gray-400 font-mono mb-1">
//                     Progress to {formatNumber(currentMilestone)}: {progress.toFixed(1)}%
//                   </div>
//                   <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
//                     <div 
//                       className={`h-1.5 rounded-full transition-all duration-500 ${
//                         currentMilestone >= 1000000 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
//                         currentMilestone >= 100000 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
//                         currentMilestone >= 10000 ? 'bg-gradient-to-r from-green-500 to-cyan-500' :
//                         'bg-gradient-to-r from-blue-500 to-cyan-500'
//                       }`}
//                       style={{ width: `${Math.min(100, progress)}%` }}
//                     />
//                   </div>
//                   <div className="text-xs text-gray-500 font-mono">
//                     {formatNumber(gameState.divinePoints)} / {formatNumber(currentMilestone)}
//                   </div>
//                 </div>
//               );
//             })()}
//           </div>
//         </div>
//       </div>

//       {/* Offline Rewards Notification */}
//       {showOfflineRewards && gameState.unclaimedOfflineRewards > 0 && (
//         <div className="relative bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.2)] animate-pulse game-card-frame">
//           {/* Futuristic Corner Accents */}
//           <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-purple-400 corner-accent"></div>
//           <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-purple-400 corner-accent"></div>
//           <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-purple-400 corner-accent"></div>
//           <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-purple-400 corner-accent"></div>
          
//           <div className="text-center">
//             <div className="flex items-center justify-center space-x-2 mb-3">
//               <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
//               <span className="text-purple-400 font-mono font-bold tracking-wider text-sm">🎁 OFFLINE REWARDS AVAILABLE</span>
//             </div>
            
//             <div className="text-2xl font-mono font-bold text-purple-300 mb-2 tracking-wider">
//               {formatNumber(gameState.unclaimedOfflineRewards)} Points
//             </div>
            
//             <div className="text-xs text-purple-400 font-mono mb-3">
//               {offlineRewardNotification}
//             </div>
            
//             <button 
//               onClick={claimOfflineRewards}
//               className="font-mono font-bold px-6 py-3 rounded-lg transition-all duration-300 border tracking-wider game-button bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border-purple-400 hover:scale-105"
//             >
//               🎉 CLAIM REWARDS
//             </button>
            
//             <div className="text-xs text-purple-500 font-mono mt-2">
//               Rewards earned while you were away!
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Mining Station - COMPACT SINGLE CARD */}
//       <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)] mining-station overflow-hidden game-card-frame">
//          {/* Futuristic Corner Accents */}
//          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400 corner-accent"></div>
        
        
//         {/* Dynamic Background Glow */}
//         <div 
//           className={`absolute inset-0 rounded-xl transition-all duration-1000 ${
//             gameState.isMining 
//               ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 animate-pulse' 
//               : 'bg-gradient-to-br from-gray-500/5 to-gray-600/5'
//           }`}
//         />
        
//         {/* Floating Particles */}
//         {gameState.isMining && (
//           <div className="absolute inset-0 overflow-hidden pointer-events-none">
//             {[...Array(8)].map((_, i) => (
//               <div
//                 key={`particle-${i}`}
//                 className="absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-ping"
//                 style={{
//                   left: `${Math.random() * 100}%`,
//                   top: `${Math.random() * 100}%`,
//                   animationDuration: `${2 + Math.random() * 3}s`,
//                   animationDelay: `${Math.random() * 2}s`
//                 }}
//               />
//             ))}
//           </div>
//         )}
        
//         <div className="relative">
//           {/* Card Header */}
//           <CardHeader 
//             title="MINING STATION" 
//             isActive={gameState.isMining}
//             extraContent={
//               <div className="flex items-center space-x-2">
//                 {gameState.isMining && (
//                   <div className="text-xs text-green-400 font-mono animate-pulse flex items-center space-x-1">
//                     <span>⚡</span>
//                     <span>{miningResumed ? 'RESUMED' : 'ACTIVE'}</span>
//                   </div>
//                 )}
//                 {(() => {
//                   const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
//                   const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
//                   return hasAutoMining ? (
//                     <div className="text-xs text-purple-400 font-mono animate-pulse flex items-center space-x-1">
//                       <span>🤖</span>
//                       <span>AUTO</span>
//                     </div>
//                   ) : null;
//                 })()}
//               </div>
//             }
//           />
          
//           {/* Main Content Grid */}
//           <div className="grid grid-cols-3 gap-4 items-center">
//             {/* Mining Core */}
//             <div className="flex flex-col items-center">
//               <div className="relative w-16 h-16 group cursor-pointer mb-2" onClick={toggleMining}>
//                 {/* Core */}
//                 <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full transition-all duration-500 ${
//                   gameState.isMining ? 'mining-station-active animate-pulse' : 'opacity-60'
//                 }`}>
//                   <div className={`absolute inset-2 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full transition-all duration-500 ${
//                     gameState.isMining ? 'animate-spin' : ''
//                   }`} style={{ animationDuration: '3s' }}>
//                     <div className={`absolute inset-1 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full transition-all duration-300 ${
//                       gameState.isMining ? 'animate-pulse' : ''
//                     }`} />
//                   </div>
//                 </div>
                
//                 {/* Orbital Rings */}
//                 {gameState.isMining && (
//                   <>
//                     <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-spin" style={{ animationDuration: '4s' }} />
//                     <div className="absolute inset-1 rounded-full border border-blue-400/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
//                   </>
//                 )}
                
//                 {/* Hover Effect */}
//                 <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/0 to-blue-500/0 group-hover:from-cyan-400/10 group-hover:to-blue-500/10 transition-all duration-300" />
//               </div>
              
//               {/* Mining Button */}
//               <button 
//                 onClick={toggleMining}
//                 disabled={!gameState.isMining && gameState.currentEnergy < 1}
//                 className={`font-mono font-bold px-4 py-2 rounded-lg transition-all duration-300 border text-xs tracking-wider ${
//                   gameState.isMining 
//                     ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-red-400' 
//                     : gameState.currentEnergy < 1
//                     ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-gray-400'
//                     : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400'
//                 }`}
//               >
//                 {gameState.isMining ? '⏹️ STOP' : gameState.currentEnergy < 1 ? '⚠️ NO ENERGY' : '▶️ START'}
//               </button>
//             </div>
            
//             {/* Energy Status */}
//             <div className="flex flex-col items-center">
//               {/* Energy Bar */}
//               <div className="relative w-full mb-2">
//                 <div className="w-full bg-gray-800 rounded-full h-2 border border-gray-600 overflow-hidden">
//                   <div 
//                     className={`h-2 rounded-full transition-all duration-500 ${
//                       gameState.currentEnergy < 100 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
//                       gameState.currentEnergy < 500 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
//                       gameState.isMining ? 'bg-gradient-to-r from-red-400 to-red-300' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
//                     } ${gameState.isMining ? 'animate-pulse' : ''}`}
//                     style={{ width: `${(gameState.currentEnergy / gameState.maxEnergy) * 100}%` }}
//                   />
//                 </div>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <span className="text-xs font-mono font-bold text-white drop-shadow-lg">
//                     {Math.round((gameState.currentEnergy / gameState.maxEnergy) * 100)}%
//                   </span>
//                 </div>
//               </div>
              
//               {/* Energy Info */}
//               <div className="text-center">
//                 <div className="text-xs text-gray-400 font-mono">ENERGY</div>
//                 <div className="text-sm font-mono font-bold text-cyan-300">
//                   {gameState.currentEnergy.toLocaleString()}/{gameState.maxEnergy.toLocaleString()}
//                 </div>
//               </div>
              
//               {/* Energy Flow */}
//               <div className="text-center mt-2">
//                 {gameState.currentEnergy < gameState.maxEnergy && (
//                   <div className="text-xs text-blue-400 font-mono animate-pulse">
//                     +{(0.3 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0) + upgrades.filter(u => u.id === 'energy-burst').reduce((sum, u) => sum + (u.effectValue * u.level), 0)).toFixed(1)}/sec
//                   </div>
//                 )}
//                 {gameState.isMining && (
//                   <div className="text-xs text-red-400 font-mono">
//                     -{(() => {
//                       const boostedRate = getEnhancedMiningRate();
//                       const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
//                       const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
//                       const energyMasteryUpgrades = upgrades.filter(u => u.id === 'energy-mastery');
//                       const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                       const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                       const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                       const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
//                       const baseEnergyCost = 0.8;
//                       const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, boostedRate / gameState.pointsPerSecond));
//                       const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
//                       return (energyCost * 2).toFixed(1);
//                     })()}/sec
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Mining Stats */}
//             <div className="flex flex-col items-center">
//               <div className="text-center mb-2">
//                 <div className="text-xs text-gray-400 font-mono">MINING RATE</div>
//                 <div className="text-sm font-mono font-bold text-green-300">
//                   {formatNumber(getBoostedMiningRate())}/sec
//                 </div>
//               </div>
              
//               {/* Efficiency */}
//               {(() => {
//                 const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
//                 const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
//                 const energyMasteryUpgrades = upgrades.filter(u => u.id === 'energy-mastery');
//                 const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
                
//                 return (
//                   <div className="text-center">
//                     <div className="text-xs text-gray-400 font-mono">EFFICIENCY</div>
//                     <div className="text-sm font-mono font-bold text-green-300">
//                       {(totalEfficiencyBonus * 100).toFixed(1)}%
//                     </div>
//                   </div>
//                 );
//               })()}
//             </div>
//           </div>
          
//           {/* Warnings and Status */}
//           <div className="mt-4 space-y-2">
//             {/* New Player Welcome */}
//             {isNewPlayer && (
//               <div className="text-center p-3 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/50 rounded-lg animate-pulse">
//                 <div className="text-sm text-yellow-300 font-mono font-bold mb-1 flex items-center justify-center space-x-1">
//                   <span>🎉</span>
//                   <span>WELCOME TO DIVINE MINING!</span>
//                   <span>🎉</span>
//                 </div>
//                 <div className="text-xs text-yellow-400 font-mono">
//                   Click START to begin your mining journey! Your progress is automatically saved.
//                 </div>
//               </div>
//             )}
            
//             {/* Low Energy Warning */}
//             {gameState.currentEnergy < 100 && gameState.isMining && (
//               <div className="text-center p-2 bg-red-900/40 border border-red-500/50 rounded-lg animate-pulse">
//                 <div className="text-xs text-red-400 font-mono font-bold flex items-center justify-center space-x-1">
//                   <span>⚠️</span>
//                   <span>LOW ENERGY WARNING!</span>
//                   <span>⚠️</span>
//                 </div>
//               </div>
//             )}
            
//             {/* Auto-mining Status */}
//             {(() => {
//               const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
//               const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
              
//               if (!hasAutoMining) return null;
              
//               if (!gameState.isMining) {
//                 const boostedRate = getEnhancedMiningRate();
//                 const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
//                 const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
//                 const energyMasteryUpgrades = upgrades.filter(u => u.id === 'energy-mastery');
//                 const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const masteryBonus = energyMasteryUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const totalEfficiencyBonus = Math.max(-0.95, efficiencyBonus + sustainBonus + masteryBonus);
                
//                 const baseEnergyCost = 0.8;
//                 const miningSpeedMultiplier = Math.min(2.0, Math.max(0.5, boostedRate / gameState.pointsPerSecond));
//                 const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus));
//                 const minimumEnergyRequired = energyCost * 2 * 5;
                
//                 const energyRegen = 0.3 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0) + upgrades.filter(u => u.id === 'energy-burst').reduce((sum, u) => sum + (u.effectValue * u.level), 0);
//                 const energyNeeded = minimumEnergyRequired - gameState.currentEnergy;
//                 const timeToRestart = energyNeeded / energyRegen;
                
//                 if (timeToRestart > 0) {
//                   return (
//                     <div className="text-center p-2 bg-purple-900/30 border border-purple-500/30 rounded-lg animate-pulse">
//                       <div className="text-xs text-purple-400 font-mono font-bold mb-1 flex items-center justify-center space-x-1">
//                         <span>🤖</span>
//                         <span>AUTO-RESTART IN {timeToRestart < 60 ? `${timeToRestart.toFixed(0)}s` : `${(timeToRestart / 60).toFixed(1)}m`}</span>
//                       </div>
//                     </div>
//                   );
//                 }
//               }
              
//               return (
//                 <div className="text-center p-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
//                   <div className="text-xs text-purple-400 font-mono font-bold flex items-center justify-center space-x-1">
//                     <span>🤖</span>
//                     <span>AUTO-MINING ACTIVE</span>
//                   </div>
//                 </div>
//               );
//             })()}
//           </div>
//         </div>
//       </div>

//       {/* Upgrades Section - UNIFIED CARD */}  
//       <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)] upgrades-section game-card-frame">
//         {/* Futuristic Corner Accents */}
//         <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400 corner-accent"></div>
//         <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400 corner-accent"></div>
        
//         {/* Enhanced Upgrades Grid with Categories */}
//         <div className="space-y-4">
         
//           {/* Unified Upgrades Card */}
//           <div className="">
//             {/* Card Header */}
//             <CardHeader 
//               title="UPGRADES & CONTROLS" 
//               showToggle={true}
//               toggleState={showHelp}
//               onToggle={() => setShowHelp(!showHelp)}
//               toggleText="HELP"
//               toggleIcon="❓"
//             />

//             {/* Collapsible Help Section */}
//             {showHelp && (
//               <div className="mb-4 p-4 bg-gray-800/50 border border-cyan-500/30 rounded-lg max-h-96 overflow-y-auto">
//                 <div className="text-cyan-300 font-mono font-bold text-lg mb-4 text-center">🎮 DIVINE MINING GAME - COMPLETE GUIDE</div>
                
//                 {/* Getting Started */}
//                 <div className="mb-4">
//                   <div className="text-yellow-300 font-mono font-bold text-sm mb-2">🚀 GETTING STARTED</div>
//                   <div className="text-gray-400 font-mono text-xs space-y-1">
//                     <div>• Click "START MINING" to begin earning Divine Points</div>
//                     <div>• Your mining rate starts at 1 point per second</div>
//                     <div>• Energy is consumed while mining and regenerates over time</div>
//                     <div>• Purchase upgrades to increase efficiency and speed</div>
//                     <div>• Progress is automatically saved every 30 seconds</div>
//                   </div>
//                 </div>

//                 {/* Core Mechanics */}
//                 <div className="mb-4">
//                   <div className="text-green-300 font-mono font-bold text-sm mb-2">⚡ CORE MECHANICS</div>
//                   <div className="text-gray-400 font-mono text-xs space-y-1">
//                     <div className="text-green-400 font-semibold">Mining System:</div>
//                     <div>• Mining consumes energy at a rate based on your mining speed</div>
//                     <div>• Higher mining rates consume more energy per second</div>
//                     <div>• Energy regenerates at 0.3/s base rate (can be upgraded)</div>
//                     <div>• Mining stops automatically when energy reaches zero</div>
                    
//                     <div className="text-green-400 font-semibold mt-2">Energy Management:</div>
//                     <div>• Monitor your energy bar to avoid running out</div>
//                     <div>• Low energy warnings appear when energy drops below 100</div>
//                     <div>• Energy efficiency upgrades reduce consumption costs</div>
//                     <div>• Energy capacity upgrades increase maximum energy</div>
//                   </div>
//                 </div>

//                 {/* Upgrade System */}
//                 <div className="mb-4">
//                   <div className="text-blue-300 font-mono font-bold text-sm mb-2">🔧 UPGRADE SYSTEM</div>
//                   <div className="text-gray-400 font-mono text-xs space-y-1">
//                     <div className="text-blue-400 font-semibold">Mining Speed Upgrades:</div>
//                     <div>• Increase your base mining rate per second</div>
//                     <div>• Each level provides a 50% increase in mining speed</div>
//                     <div>• Higher levels cost exponentially more points</div>
                    
//                     <div className="text-blue-400 font-semibold mt-2">Energy Efficiency Upgrades:</div>
//                     <div>• Energy Efficiency: Reduces energy consumption by 10% per level</div>
//                     <div>• Energy Sustain: Additional 20% cost reduction per level</div>
//                     <div>• Energy Mastery: Massive 30% cost reduction per level</div>
//                     <div>• Maximum efficiency reduction is capped at 95%</div>
                    
//                     <div className="text-blue-400 font-semibold mt-2">Energy Regeneration Upgrades:</div>
//                     <div>• Energy Regen: Increases regeneration rate by 0.1/s per level</div>
//                     <div>• Energy Burst: Dramatic regeneration boost of 0.5/s per level</div>
//                     <div>• Energy Overflow: Increases maximum energy capacity</div>
                    
//                     <div className="text-blue-400 font-semibold mt-2">Advanced Upgrades:</div>
//                     <div>• Auto-Mining: Automatically restarts mining when energy is available</div>
//                     <div>• Divine Resonance: Makes all boosts 50% more effective</div>
//                     <div>• Offline Efficiency: Provides bonuses for offline time</div>
//                   </div>
//                 </div>

//                 {/* Advanced Strategies */}
//                 <div className="mb-4">
//                   <div className="text-purple-300 font-mono font-bold text-sm mb-2">🎯 ADVANCED STRATEGIES</div>
//                   <div className="text-gray-400 font-mono text-xs space-y-1">
//                     <div className="text-purple-400 font-semibold">Early Game (0-10,000 points):</div>
//                     <div>• Focus on Mining Speed upgrades first</div>
//                     <div>• Purchase Energy Efficiency upgrades to reduce costs</div>
//                     <div>• Balance mining speed with energy sustainability</div>
//                     <div>• Don't let energy run completely empty</div>
                    
//                     <div className="text-purple-400 font-semibold mt-2">Mid Game (10,000-1,000,000 points):</div>
//                     <div>• Invest heavily in Energy Sustain and Energy Mastery</div>
//                     <div>• Purchase Auto-Mining for hands-free operation</div>
//                     <div>• Energy Burst upgrades for rapid regeneration</div>
//                     <div>• Plan offline periods to maximize efficiency bonuses</div>
                    
//                     <div className="text-purple-400 font-semibold mt-2">Late Game (1,000,000+ points):</div>
//                     <div>• Energy Overflow for massive capacity increases</div>
//                     <div>• Divine Resonance for maximum boost effectiveness</div>
//                     <div>• Offline Efficiency for strategic breaks</div>
//                     <div>• Optimize for maximum points per second</div>
//                   </div>
//                 </div>

//                 {/* Version Info */}
//                 <div className="text-center pt-3 border-t border-cyan-500/20">
//                   <div className="text-xs text-gray-500 font-mono">
//                     Divine Mining Game v{gameState.version} | Complete Professional Guide
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Recommended Upgrades Section */}
           
//             {/* Smart Filtering Controls */}
//             <div className="mb-4 space-y-3">
//               {/* Filter Tabs */}
//               <div className="flex flex-wrap gap-2 justify-center">
//                 {(['all', 'affordable', 'recommended', 'category'] as const).map((filter) => (
//                   <button
//                     key={filter}
//                     onClick={() => setUpgradeFilter(filter)}
//                     className={`font-mono font-bold px-3 py-2 rounded-lg text-xs transition-all duration-300 border-2 ${
//                       upgradeFilter === filter
//                         ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg'
//                         : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border-gray-500 hover:border-cyan-400 hover:text-cyan-300'
//                     }`}
//                   >
//                     {getFilterDisplayName(filter)}
//                   </button>
//                 ))}
//               </div>

//               {/* Category Selector (only show when category filter is active) */}
//               {upgradeFilter === 'category' && (
//                 <div className="flex flex-wrap gap-2 justify-center">
//                   {getAvailableCategories().map((category) => (
//                     <button
//                       key={category}
//                       onClick={() => setSelectedCategory(category)}
//                       className={`font-mono font-bold px-3 py-2 rounded-lg text-xs transition-all duration-300 border-2 ${
//                         selectedCategory === category
//                           ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg'
//                           : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border-gray-500 hover:border-purple-400 hover:text-purple-300'
//                       }`}
//                     >
//                       {getCategoryDisplayName(category)}
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* Results Summary */}
//               <div className="text-center">
//                 <div className="text-xs text-gray-400 font-mono">
//                   Showing {getPaginatedUpgrades().length} of {getFilteredUpgrades().length} upgrades 
//                   {getTotalPages() > 1 && ` (Page ${currentUpgradePage} of ${getTotalPages()})`}
//                 </div>
//               </div>
//             </div>

//             {/* Paginated Upgrades Grid */}
//             <div className="space-y-4">
//               {/* Upgrades Grid */}
//               <div className="grid grid-cols-2 gap-4">
//                 {getPaginatedUpgrades().map((upgrade) => (
//                   <div key={upgrade.id} className={`${getUpgradeCategoryBg(getUpgradeCategory(upgrade))} rounded-xl p-4 upgrade-${upgrade.id} hover:bg-gray-700/50 transition-all duration-300 border-2 ${getUpgradeCategoryColor(getUpgradeCategory(upgrade)).split(' ')[1]} hover:scale-105 hover:shadow-lg relative overflow-hidden group`}>
//                     {/* Upgrade Icon */}
//                     <div className="text-center mb-3">
//                       <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 ${getUpgradeCategoryColor(getUpgradeCategory(upgrade)).split(' ')[0]} bg-gray-800/50 border-2 ${getUpgradeCategoryColor(getUpgradeCategory(upgrade)).split(' ')[1]}`}>
//                         {upgrade.id.includes('mining') ? '⛏️' :
//                          upgrade.id.includes('energy') ? '⚡' :
//                          upgrade.id.includes('auto') ? '🤖' :
//                          upgrade.id.includes('divine') ? '✨' :
//                          upgrade.id.includes('cosmic') ? '🌌' :
//                          upgrade.id.includes('stellar') ? '⭐' :
//                          upgrade.id.includes('galactic') ? '🌠' :
//                          upgrade.id.includes('offline') ? '💤' :
//                          upgrade.id.includes('resonance') ? '🎵' :
//                          upgrade.id.includes('mastery') ? '👑' :
//                          upgrade.id.includes('overflow') ? '💧' :
//                          upgrade.id.includes('burst') ? '💥' :
//                          upgrade.id.includes('sustain') ? '🛡️' :
//                          upgrade.id.includes('efficiency') ? '🔧' :
//                          upgrade.id.includes('regen') ? '🔄' :
//                          upgrade.id.includes('capacity') ? '📦' : '🔮'}
//                       </div>
//                     </div>

//                     {/* Upgrade Name */}
//                     <div className={`font-mono font-bold text-sm tracking-wide text-center mb-2 ${getUpgradeCategoryColor(getUpgradeCategory(upgrade)).split(' ')[0]} line-clamp-2`}>
//                       {upgrade.name}
//                     </div>

//                     {/* Level Badge */}
//                     <div className="text-center mb-3">
//                       <div className={`inline-block px-2 py-1 rounded-full text-xs font-mono font-bold ${
//                         isUpgradeMaxed(upgrade) ? 'bg-purple-600 text-white animate-pulse' :
//                         upgrade.level === 0 ? 'bg-gray-600 text-gray-300' :
//                         upgrade.level < 5 ? 'bg-green-600 text-white' :
//                         upgrade.level < 10 ? 'bg-blue-600 text-white' :
//                         upgrade.level < 20 ? 'bg-purple-600 text-white' :
//                         'bg-red-600 text-white'
//                       }`}>
//                         {isUpgradeMaxed(upgrade) ? 'MAX' : `LVL ${upgrade.level}`}
//                       </div>
//                     </div>

//                     {/* Effect */}
//                     <div className="text-gray-400 font-mono text-xs text-center mb-3 line-clamp-2">
//                       {upgrade.effect}
//                     </div>

//                     {/* Cost */}
//                     <div className="text-gray-500 font-mono text-xs text-center mb-3">
//                       <div className="flex items-center justify-center space-x-1">
//                         <span className="text-yellow-400">💰</span>
//                         <span>{formatNumber(getUpgradeCost(upgrade))} DP</span>
//                       </div>
//                     </div>

//                     {/* Efficiency indicator */}
//                     <div className="text-gray-600 font-mono text-xs text-center mb-4">
//                       <div className="flex items-center justify-center space-x-1">
//                         <span className="text-blue-400">⚖️</span>
//                         <span>{formatNumber(getUpgradeEfficiency(upgrade))}</span>
//                       </div>
//                     </div>

//                     {/* Upgrade Button */}
//                     <div className="text-center">
//                       <button 
//                         onClick={() => purchaseUpgrade(upgrade.id)}
//                         disabled={!canPurchaseUpgrade(upgrade)}
//                         className={`font-mono font-bold px-4 py-2 rounded-lg text-xs transition-all duration-300 border-2 w-full ${
//                           isUpgradeMaxed(upgrade)
//                             ? 'upgrade-maxed cursor-not-allowed bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-lg'
//                             : canPurchaseUpgrade(upgrade)
//                             ? 'upgrade-available hover:scale-105 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-green-400 shadow-lg hover:shadow-xl'
//                             : 'upgrade-unavailable cursor-not-allowed bg-gradient-to-r from-gray-600 to-gray-500 text-gray-400 border-gray-400'
//                         }`}
//                       >
//                         {isUpgradeMaxed(upgrade) ? '🏆 MAXED' : canPurchaseUpgrade(upgrade) ? '⚡ UPGRADE' : '🔒 LOCKED'}
//                       </button>
//                     </div>

//                     {/* Category Indicator */}
//                     <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 ${getUpgradeCategoryColor(getUpgradeCategory(upgrade)).split(' ')[1]} ${
//                       getUpgradeCategory(upgrade) === 'mining' ? 'bg-green-400' :
//                       getUpgradeCategory(upgrade) === 'energy' ? 'bg-blue-400' :
//                       getUpgradeCategory(upgrade) === 'special' ? 'bg-purple-400' :
//                       'bg-cyan-400'
//                     }`}></div>

//                     {/* Hover Effect Overlay */}
//                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
//                   </div>
//                 ))}
//               </div>

//               {/* Pagination Controls */}
//               {getTotalPages() > 1 && (
//                 <div className="flex items-center justify-center space-x-2 mt-4">
//                   {/* Previous Page */}
//                   <button
//                     onClick={() => setCurrentUpgradePage(prev => Math.max(1, prev - 1))}
//                     disabled={currentUpgradePage === 1}
//                     className={`font-mono font-bold px-3 py-2 rounded-lg text-xs transition-all duration-300 border-2 ${
//                       currentUpgradePage === 1
//                         ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-gray-400'
//                         : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400 hover:scale-105'
//                     }`}
//                   >
//                     ◀ PREV
//                   </button>

//                   {/* Page Numbers */}
//                   <div className="flex items-center space-x-1">
//                     {(() => {
//                       const totalPages = getTotalPages();
//                       const currentPage = currentUpgradePage;
//                       const pagesToShow = 5;
//                       const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
//                       const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
                      
//                       const pages = [];
                      
//                       // First page
//                       if (startPage > 1) {
//                         pages.push(
//                           <button
//                             key={1}
//                             onClick={() => setCurrentUpgradePage(1)}
//                             className="font-mono font-bold px-2 py-1 rounded text-xs bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border border-gray-500 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
//                           >
//                             1
//                           </button>
//                         );
//                         if (startPage > 2) {
//                           pages.push(
//                             <span key="ellipsis1" className="text-gray-500 font-mono text-xs px-1">
//                               ...
//                             </span>
//                           );
//                         }
//                       }
                      
//                       // Middle pages
//                       for (let i = startPage; i <= endPage; i++) {
//                         pages.push(
//                           <button
//                             key={i}
//                             onClick={() => setCurrentUpgradePage(i)}
//                             className={`font-mono font-bold px-2 py-1 rounded text-xs transition-all duration-300 border ${
//                               i === currentPage
//                                 ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg'
//                                 : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border-gray-500 hover:border-cyan-400 hover:text-cyan-300'
//                             }`}
//                           >
//                             {i}
//                           </button>
//                         );
//                       }
                      
//                       // Last page
//                       if (endPage < totalPages) {
//                         if (endPage < totalPages - 1) {
//                           pages.push(
//                             <span key="ellipsis2" className="text-gray-500 font-mono text-xs px-1">
//                               ...
//                             </span>
//                           );
//                         }
//                         pages.push(
//                           <button
//                             key={totalPages}
//                             onClick={() => setCurrentUpgradePage(totalPages)}
//                             className="font-mono font-bold px-2 py-1 rounded text-xs bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 border border-gray-500 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
//                           >
//                             {totalPages}
//                           </button>
//                         );
//                       }
                      
//                       return pages;
//                     })()}
//                   </div>

//                   {/* Next Page */}
//                   <button
//                     onClick={() => setCurrentUpgradePage(prev => Math.min(getTotalPages(), prev + 1))}
//                     disabled={currentUpgradePage === getTotalPages()}
//                     className={`font-mono font-bold px-3 py-2 rounded-lg text-xs transition-all duration-300 border-2 ${
//                       currentUpgradePage === getTotalPages()
//                         ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-gray-400'
//                         : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400 hover:scale-105'
//                     }`}
//                   >
//                     NEXT ▶
//                   </button>
//                 </div>
//               )}

//               {/* Empty State */}
//               {getPaginatedUpgrades().length === 0 && (
//                 <div className="text-center py-8">
//                   <div className="text-4xl mb-4">🔍</div>
//                   <div className="text-gray-400 font-mono font-bold text-lg mb-2">No Upgrades Found</div>
//                   <div className="text-gray-500 font-mono text-sm">
//                     Try changing your filter or check back later for new upgrades!
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//       <TutorialOverlay />
//     </div>
//   );
// }; 

