import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '@/contexts/GameContext';

interface Upgrade {
  id: string;
  name: string;
  level: number;
  effect: string;
  baseCost: number;
  costMultiplier: number;
  effectValue: number;
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
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
}

const GAME_VERSION = '1.1.0'; // Updated version
const SAVE_KEY = 'divineMiningGame';
const BACKUP_KEY = 'divineMiningGame_backup';
const HIGH_SCORE_KEY = 'divineMiningHighScore';
const DIVINE_POINTS_KEY = 'divineMiningPoints';
const TOTAL_EARNED_KEY = 'divineMiningTotalEarned'; // New: Separate key for total earned
const SESSION_KEY = 'divineMiningSession'; // New: Separate key for session data
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const BACKUP_INTERVAL = 300000; // 5 minutes
const OFFLINE_EFFICIENCY_CAP = 14; // 14 days max offline earnings
const OFFLINE_EFFICIENCY_BONUS = 0.1; // 10% bonus per day offline (max 140%)

export const DivineMiningGame: React.FC = () => {
  const { setPoints, addPoints, gems: userGems, activeBoosts } = useGameContext();
  const [showHelp, setShowHelp] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [saveMessage, setSaveMessage] = useState('');
  const [miningResumed, setMiningResumed] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const backupRef = useRef<NodeJS.Timeout>();
  const miningIntervalRef = useRef<NodeJS.Timeout>();

  const [achievements, setAchievements] = useState<Achievement[]>([
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
    },
    {
      id: 'persistent-miner',
      name: 'Persistent Miner',
      description: 'Mine for 24 hours total',
      condition: (state) => {
        const sessionDuration = Date.now() - state.sessionStartTime;
        return sessionDuration >= 24 * 60 * 60 * 1000;
      },
      unlocked: false
    },
    {
      id: 'high-scorer',
      name: 'High Scorer',
      description: 'Reach 10,000 points',
      condition: (state) => state.divinePoints >= 10000,
      unlocked: false
    },
    {
      id: 'legendary-miner',
      name: 'Legendary Miner',
      description: 'Reach 100,000 points',
      condition: (state) => state.divinePoints >= 100000,
      unlocked: false
    },
    {
      id: 'cosmic-explorer',
      name: 'Cosmic Explorer',
      description: 'Reach 1,000,000 points',
      condition: (state) => state.divinePoints >= 1000000,
      unlocked: false
    },
    {
      id: 'stellar-legend',
      name: 'Stellar Legend',
      description: 'Reach 10,000,000 points',
      condition: (state) => state.divinePoints >= 10000000,
      unlocked: false
    },
    {
      id: 'galactic-master',
      name: 'Galactic Master',
      description: 'Reach 100,000,000 points',
      condition: (state) => state.divinePoints >= 100000000,
      unlocked: false
    },
    {
      id: 'speed-master',
      name: 'Speed Master',
      description: 'Reach 100 points per second',
      condition: (state) => state.pointsPerSecond >= 100,
      unlocked: false
    },
    {
      id: 'upgrade-legend',
      name: 'Upgrade Legend',
      description: 'Purchase 100 upgrades',
      condition: (state) => state.upgradesPurchased >= 100,
      unlocked: false
    },
    {
      id: 'energy-master',
      name: 'Energy Master',
      description: 'Reach 10,000 max energy',
      condition: (state) => state.maxEnergy >= 10000,
      unlocked: false
    },
    {
      id: 'efficiency-expert',
      name: 'Efficiency Expert',
      description: 'Reduce energy cost by 50%',
      condition: (state) => {
        const efficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
        const totalEfficiency = efficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
        return totalEfficiency <= -0.5;
      },
      unlocked: false
    },
    {
      id: 'regen-master',
      name: 'Regeneration Master',
      description: 'Reach 5 energy per second regeneration',
      condition: (state) => {
        const regenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
        const totalRegen = regenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
        return (1 + totalRegen) >= 5;
      },
      unlocked: false
    },
    {
      id: 'offline-master',
      name: 'Offline Master',
      description: 'Earn 1,000,000 points while offline',
      condition: (state) => state.totalPointsEarned >= 1000000 && state.offlineEfficiencyBonus > 0,
      unlocked: false
    },
    {
      id: 'energy-sustainer',
      name: 'Energy Sustainer',
      description: 'Reduce energy cost by 80%',
      condition: (state) => {
        const efficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
        const sustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
        const totalEfficiency = efficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
        const totalSustain = sustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
        return (totalEfficiency + totalSustain) <= -0.8;
      },
      unlocked: false
    },
    {
      id: 'divine-resonator',
      name: 'Divine Resonator',
      description: 'Max out Divine Resonance upgrade',
      condition: (state) => {
        const resonanceUpgrades = upgrades.filter(u => u.id === 'divine-resonance');
        return resonanceUpgrades.some(u => u.level >= 5);
      },
      unlocked: false
    }
  ]);

  // Enhanced initial state loading with validation and recovery
  const getInitialState = useCallback((): GameState => {
    // Load all-time high score from localStorage
    const allTimeHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '100', 10);
    
    // Load divine points from separate localStorage key
    const savedDivinePoints = parseInt(localStorage.getItem(DIVINE_POINTS_KEY) || '100', 10);
    
    // Load total earned from separate localStorage key
    const savedTotalEarned = parseInt(localStorage.getItem(TOTAL_EARNED_KEY) || '0', 10);
    
    // Load session data from separate localStorage key
    const savedSessionData = localStorage.getItem(SESSION_KEY);
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
    
    // Load prestige multiplier
    const prestigeMultiplier = parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0');
    
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
      lastOfflineTime: Date.now() // New: Track last offline time
    };

    try {
      // Try to load main save
      const saved = localStorage.getItem(SAVE_KEY);
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
            const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
            const baseRegen = 0.5; // Base regen per second
            const totalRegen = baseRegen + regenBonus;
            offlineEnergyRegen = totalRegen * (timeDiff / 1000);
            
            console.log(`Offline earnings: ${offlineEarnings.toFixed(2)} points (${baseOfflineEarnings.toFixed(2)} base + ${(offlineEfficiencyBonus * 100).toFixed(1)}% bonus) over ${Math.floor(timeDiff / 1000 / 60)} minutes`);
            console.log(`Offline energy regen: ${offlineEnergyRegen.toFixed(2)} energy`);
            
            // Set mining resumed flag
            setMiningResumed(true);
            
            // Show offline earnings notification
            setTimeout(() => {
              const bonusText = offlineEfficiencyBonus > 0 ? ` (+${(offlineEfficiencyBonus * 100).toFixed(1)}% offline bonus)` : '';
              setSaveMessage(`Welcome back! You earned ${Math.floor(offlineEarnings)} points while away!${bonusText}`);
              setTimeout(() => setSaveMessage(''), 5000);
            }, 1000);
          }
          
          const loadedState = {
            ...parsed,
            divinePoints: parsed.divinePoints + offlineEarnings,
            lastSaveTime: now,
            sessionStartTime: parsed.sessionStartTime || sessionStartTime,
            totalPointsEarned: Math.max(parsed.totalPointsEarned || 0, savedTotalEarned) + offlineEarnings,
            version: GAME_VERSION,
            highScore: Math.max(parsed.highScore || 100, allTimeHighScore),
            allTimeHighScore: Math.max(parsed.allTimeHighScore || 100, allTimeHighScore),
            currentEnergy: Math.min(parsed.maxEnergy || 1000, parsed.currentEnergy + offlineEnergyRegen),
            offlineEfficiencyBonus: parsed.offlineEfficiencyBonus || 0,
            lastOfflineTime: parsed.lastOfflineTime || now,
            lastDailyReset: parsed.lastDailyReset || lastDailyReset,
            lastWeeklyReset: parsed.lastWeeklyReset || lastWeeklyReset
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
      
      // Try to load backup
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
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
  }, []);

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
  
  // Sync mining game points with shared context - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    // Update the shared context with our points
    setPoints(gameState.divinePoints);

    // Save divine points to localStorage immediately whenever they change
    localStorage.setItem(DIVINE_POINTS_KEY, gameState.divinePoints.toString());

    // Check for new high score
    if (gameState.divinePoints > gameState.highScore) {
      const newHighScore = gameState.divinePoints;
      setGameState(prev => ({
        ...prev,
        highScore: newHighScore,
        allTimeHighScore: Math.max(prev.allTimeHighScore, newHighScore)
      }));
      
      // Save high score to localStorage immediately
      localStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
      
      // Show high score notification
      if (newHighScore > gameState.allTimeHighScore) {
        setSaveMessage(`🎉 NEW ALL-TIME HIGH SCORE: ${newHighScore.toLocaleString()}!`);
        setTimeout(() => setSaveMessage(''), 5000);
      } else {
        setSaveMessage(`🏆 New High Score: ${newHighScore.toLocaleString()}!`);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
  }, [gameState.divinePoints, setPoints, gameState.highScore, gameState.allTimeHighScore]);

  // Apply active boosts to mining rate (enhanced version moved after upgrades)
  const getBoostedMiningRate = useCallback(() => {
    const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
    const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
    return gameState.pointsPerSecond * totalMultiplier;
  }, [gameState.pointsPerSecond, activeBoosts]);

  // Calculate offline mining rate with boosts and efficiency bonus
  const getOfflineMiningRate = useCallback(() => {
    const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
    const totalMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
    const baseRate = gameState.pointsPerSecond * totalMultiplier;
    
    // Apply offline efficiency bonus
    const offlineBonus = gameState.offlineEfficiencyBonus || 0;
    return baseRate * (1 + offlineBonus);
  }, [gameState.pointsPerSecond, gameState.offlineEfficiencyBonus, activeBoosts]);



  // Load upgrades from localStorage or use defaults
  const getInitialUpgrades = (): Upgrade[] => {
    try {
      const savedUpgrades = localStorage.getItem('divineMiningUpgrades');
      if (savedUpgrades) {
        const parsed = JSON.parse(savedUpgrades);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('Loaded upgrades from localStorage:', parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading upgrades from localStorage:', error);
    }
    
    // Enhanced default upgrades for better progression
    return [
      {
        id: 'mining-speed',
        name: 'MINING SPEED',
        level: 0,
        effect: '+0.5/sec',
        baseCost: 25,
        costMultiplier: 1.12,
        effectValue: 0.5
      },
      {
        id: 'mining-capacity',
        name: 'MINING CAPACITY',
        level: 0,
        effect: '+50 capacity',
        baseCost: 75,
        costMultiplier: 1.15,
        effectValue: 50
      },
      {
        id: 'auto-miner',
        name: 'AUTO MINER',
        level: 0,
        effect: '+1.0/sec',
        baseCost: 200,
        costMultiplier: 1.18,
        effectValue: 1.0
      },
      {
        id: 'divine-boost',
        name: 'DIVINE BOOST',
        level: 0,
        effect: '+2.0/sec',
        baseCost: 750,
        costMultiplier: 1.22,
        effectValue: 2.0
      },
      {
        id: 'quantum-miner',
        name: 'QUANTUM MINER',
        level: 0,
        effect: '+5.0/sec',
        baseCost: 3000,
        costMultiplier: 1.25,
        effectValue: 5.0
      },
      {
        id: 'cosmic-miner',
        name: 'COSMIC MINER',
        level: 0,
        effect: '+10.0/sec',
        baseCost: 10000,
        costMultiplier: 1.3,
        effectValue: 10.0
      },
      {
        id: 'stellar-miner',
        name: 'STELLAR MINER',
        level: 0,
        effect: '+25.0/sec',
        baseCost: 50000,
        costMultiplier: 1.35,
        effectValue: 25.0
      },
      {
        id: 'galactic-miner',
        name: 'GALACTIC MINER',
        level: 0,
        effect: '+100.0/sec',
        baseCost: 250000,
        costMultiplier: 1.4,
        effectValue: 100.0
      },
      {
        id: 'energy-efficiency',
        name: 'ENERGY EFFICIENCY',
        level: 0,
        effect: '-10% energy cost',
        baseCost: 50000,
        costMultiplier: 1.5,
        effectValue: -0.1
      },
      {
        id: 'energy-capacity',
        name: 'ENERGY CAPACITY',
        level: 0,
        effect: '+2000 max energy',
        baseCost: 75000,
        costMultiplier: 1.6,
        effectValue: 2000
      },
      {
        id: 'energy-regen',
        name: 'ENERGY REGEN',
        level: 0,
        effect: '+1.0 energy/sec',
        baseCost: 100000,
        costMultiplier: 1.7,
        effectValue: 1.0
      },
      {
        id: 'offline-efficiency',
        name: 'OFFLINE EFFICIENCY',
        level: 0,
        effect: '+5% offline bonus',
        baseCost: 150000,
        costMultiplier: 1.8,
        effectValue: 0.05
      },
      {
        id: 'auto-mining',
        name: 'AUTO MINING',
        level: 0,
        effect: 'Auto-start mining',
        baseCost: 500000,
        costMultiplier: 2.0,
        effectValue: 1
      },
      {
        id: 'energy-sustain',
        name: 'ENERGY SUSTAIN',
        level: 0,
        effect: '-20% energy cost',
        baseCost: 200000,
        costMultiplier: 1.9,
        effectValue: -0.2
      },
      {
        id: 'divine-resonance',
        name: 'DIVINE RESONANCE',
        level: 0,
        effect: '+50% boost effectiveness',
        baseCost: 1000000,
        costMultiplier: 2.5,
        effectValue: 0.5
      }
    ];
  };

  const [upgrades, setUpgrades] = useState<Upgrade[]>(getInitialUpgrades);

  // Calculate potential offline earnings
  const getPotentialOfflineEarnings = useCallback((hoursOffline: number = 24) => {
    const secondsOffline = hoursOffline * 60 * 60;
    const baseEarnings = getOfflineMiningRate() * secondsOffline;
    
    // Calculate efficiency bonus for the time period
    const daysOffline = hoursOffline / 24;
    const efficiencyBonus = Math.min(daysOffline * OFFLINE_EFFICIENCY_BONUS, 1.4);
    
    return {
      baseEarnings,
      efficiencyBonus,
      totalEarnings: baseEarnings * (1 + efficiencyBonus),
      energyRegen: (0.5 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0)) * secondsOffline
    };
  }, [getOfflineMiningRate, upgrades]);

  // Enhanced mining rate calculation with divine resonance
  const getEnhancedMiningRate = useCallback(() => {
    const miningBoosts = activeBoosts.filter(boost => boost.type === 'mining');
    const baseMultiplier = miningBoosts.reduce((sum, boost) => sum + boost.multiplier, 1);
    
    // Apply divine resonance upgrade to boost effectiveness
    const divineResonanceUpgrades = upgrades.filter(u => u.id === 'divine-resonance');
    const resonanceBonus = divineResonanceUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
    const enhancedMultiplier = baseMultiplier * (1 + resonanceBonus);
    
    return gameState.pointsPerSecond * enhancedMultiplier;
  }, [gameState.pointsPerSecond, activeBoosts, upgrades]);

  // Sync game state with loaded upgrades on initialization - IMPROVED VERSION
  useEffect(() => {
    const totalUpgradeEffect = upgrades.reduce((sum, upgrade) => sum + (upgrade.effectValue * upgrade.level), 0);
    const totalUpgradesPurchased = upgrades.reduce((sum, upgrade) => sum + upgrade.level, 0);
    
    setGameState(prev => {
      const newPointsPerSecond = 1.0 + totalUpgradeEffect;
      const newUpgradesPurchased = totalUpgradesPurchased;
      
      console.log('Upgrade sync check:', {
        currentPPS: prev.pointsPerSecond,
        newPPS: newPointsPerSecond,
        currentUpgrades: prev.upgradesPurchased,
        newUpgrades: newUpgradesPurchased,
        currentPoints: prev.divinePoints,
        hasLoadedSavedData: hasLoadedSavedData,
        isFreshStart: prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0
      });
      
      // IMPROVED LOGIC: Only sync upgrades if:
      // 1. We haven't loaded saved data AND this looks like a fresh start
      // 2. OR if upgrade levels have actually changed from what's saved
      const isFreshStart = prev.divinePoints === 100 && prev.pointsPerSecond === 1.0 && prev.upgradesPurchased === 0;
      const upgradesChanged = prev.upgradesPurchased !== newUpgradesPurchased;
      const shouldPreserveSavedData = hasLoadedSavedData && prev.divinePoints > 100;
      
      if ((isFreshStart && !shouldPreserveSavedData) || (upgradesChanged && !shouldPreserveSavedData)) {
        console.log(`Syncing game state: ${isFreshStart ? 'Fresh start' : 'Upgrades changed'}`);
        console.log(`PPS ${prev.pointsPerSecond} -> ${newPointsPerSecond}, Upgrades ${prev.upgradesPurchased} -> ${newUpgradesPurchased}`);
        return {
          ...prev,
          pointsPerSecond: newPointsPerSecond,
          upgradesPurchased: newUpgradesPurchased
        };
      } else {
        console.log('Skipping upgrade sync - preserving saved state');
        return prev;
      }
    });
  }, [upgrades, hasLoadedSavedData]); // Run when upgrades change

  // Set loaded flag when we have valid saved data
  useEffect(() => {
    if (gameState.divinePoints > 100 && !hasLoadedSavedData) {
      console.log('Detected valid saved data, setting loaded flag');
      setHasLoadedSavedData(true);
    }
  }, [gameState.divinePoints, hasLoadedSavedData]);

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

  // Enhanced save function with error handling and backup
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
      
      // Also save high score and divine points separately for redundancy
      if (!isBackup) {
        localStorage.setItem(HIGH_SCORE_KEY, saveData.allTimeHighScore.toString());
        localStorage.setItem(DIVINE_POINTS_KEY, saveData.divinePoints.toString());
        localStorage.setItem(TOTAL_EARNED_KEY, saveData.totalPointsEarned.toString());
        
        // Save session data separately
        const sessionData = {
          sessionStartTime: saveData.sessionStartTime,
          lastDailyReset: saveData.lastDailyReset,
          lastWeeklyReset: saveData.lastWeeklyReset,
          lastSaveTime: saveData.lastSaveTime,
          version: saveData.version
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
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
  }, []);

  // Auto-save effect
  useEffect(() => {
    const saveState = {
      ...gameState,
      lastSaveTime: Date.now()
    };
    
    console.log('Auto-saving game state:', {
      divinePoints: saveState.divinePoints,
      pointsPerSecond: saveState.pointsPerSecond,
      isMining: saveState.isMining,
      saveTime: new Date(saveState.lastSaveTime).toLocaleString()
    });
    
    const success = saveGameState(saveState);
    if (success) {
      // Create backup every 5 minutes
      if (Date.now() - (gameState.lastSaveTime || 0) > BACKUP_INTERVAL) {
        saveGameState(saveState, true);
      }
    }
  }, [gameState, saveGameState]);

  // Auto-save timer
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      setGameState(prev => ({ ...prev })); // Trigger save
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  // Backup timer
  useEffect(() => {
    backupRef.current = setInterval(() => {
      const saveData = {
        ...gameState,
        lastSaveTime: Date.now()
      };
      saveGameState(saveData, true);
    }, BACKUP_INTERVAL);

    return () => {
      if (backupRef.current) {
        clearInterval(backupRef.current);
      }
    };
  }, [gameState, saveGameState]);

  // Check achievements with enhanced logic
  useEffect(() => {
    const newUnlockedAchievements = achievements.filter(achievement => 
      !achievement.unlocked && achievement.condition(gameState)
    );
    
    if (newUnlockedAchievements.length > 0) {
      newUnlockedAchievements.forEach(achievement => {
        // Show achievement notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 achievement-notification text-white px-6 py-3 rounded-lg shadow-lg z-50 font-mono text-sm animate-achievement-bounce';
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <span class="text-2xl">🏆</span>
            <div>
              <div class="font-bold">${achievement.name}</div>
              <div class="text-xs opacity-90">${achievement.description}</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 4000);
      });
      
      setAchievements(prev => prev.map(achievement => ({
        ...achievement,
        unlocked: achievement.unlocked || achievement.condition(gameState),
        unlockedAt: achievement.unlockedAt || (achievement.condition(gameState) ? Date.now() : undefined)
      })));
    }
  }, [gameState, achievements]);

  // Check for milestone notifications
  useEffect(() => {
    const milestones = [1000, 10000, 100000, 1000000, 10000000, 100000000];
    const currentPoints = gameState.divinePoints;
    
    milestones.forEach(milestone => {
      if (currentPoints >= milestone && currentPoints < milestone + 100) {
        // Show milestone notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 milestone-notification text-white px-6 py-3 rounded-lg shadow-lg z-50 font-mono text-sm animate-achievement-bounce';
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <span class="text-2xl">⭐</span>
            <div>
              <div class="font-bold">MILESTONE REACHED!</div>
              <div class="text-xs opacity-90">${milestone.toLocaleString()} Points</div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
      }
    });
  }, [gameState.divinePoints]);

  // Energy regeneration effect
  useEffect(() => {
    const energyRegenInterval = setInterval(() => {
      setGameState(prev => {
        const now = Date.now();
        const timeDiff = now - prev.lastEnergyRegen;
        
        // Calculate energy regeneration with upgrades
        const energyRegenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
        const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
        const baseRegen = 0.5; // Reduced base regen to balance increased consumption
        const totalRegen = baseRegen + regenBonus;
        
        const energyToRegen = totalRegen * (timeDiff / 1000) * 0.5; // Half regen per 500ms interval
        
        if (energyToRegen > 0 && prev.currentEnergy < prev.maxEnergy) {
          const newEnergy = Math.min(prev.maxEnergy, prev.currentEnergy + energyToRegen);
          return {
            ...prev,
            currentEnergy: newEnergy,
            lastEnergyRegen: now
          };
        }
        
        return prev;
      });
    }, 500); // More frequent energy regeneration

    return () => clearInterval(energyRegenInterval);
  }, [upgrades]);

  // Enhanced mining effect with energy consumption
  useEffect(() => {
    if (!gameState.isMining) {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
        miningIntervalRef.current = undefined;
      }
      return;
    }

    miningIntervalRef.current = setInterval(() => {
      const boostedRate = getEnhancedMiningRate();
      
      // Calculate energy cost with all efficiency upgrades and mining speed scaling
      const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
      const energySustainUpgrades = upgrades.filter(u => u.id === 'energy-sustain');
      const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
      const sustainBonus = energySustainUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
      const totalEfficiencyBonus = efficiencyBonus + sustainBonus;
      
      const baseEnergyCost = 1; // Per 500ms interval (2 per second total)
      const miningSpeedMultiplier = Math.max(1, boostedRate / gameState.pointsPerSecond); // Scale with mining speed
      const energyCost = Math.max(0.1, baseEnergyCost * miningSpeedMultiplier * (1 + totalEfficiencyBonus)); // totalEfficiencyBonus is already negative, so this reduces cost
      
      setGameState(prev => {
        // Check if we have enough energy
        if (prev.currentEnergy < energyCost) {
          // Stop mining if out of energy
          console.log(`Mining stopped: Not enough energy (${prev.currentEnergy} < ${energyCost})`);
          
          // Show notification
          setSaveMessage(`⚠️ Mining stopped: Not enough energy! (${prev.currentEnergy.toFixed(1)} < ${energyCost.toFixed(1)})`);
          setTimeout(() => setSaveMessage(''), 4000);
          
          return {
            ...prev,
            isMining: false
          };
        }
        
        const newState = {
          ...prev,
          divinePoints: prev.divinePoints + (boostedRate * 0.5), // Half points per 500ms interval
          totalEarned24h: prev.totalEarned24h + (boostedRate * 0.5),
          totalEarned7d: prev.totalEarned7d + (boostedRate * 0.5),
          totalPointsEarned: prev.totalPointsEarned + (boostedRate * 0.5),
          currentEnergy: prev.currentEnergy - energyCost
        };
        
        // Log energy consumption every 5 seconds for debugging
        if (Math.floor(Date.now() / 1000) % 5 === 0) {
          console.log(`Mining: +${boostedRate.toFixed(2)} points, -${energyCost.toFixed(2)} energy (${newState.currentEnergy.toFixed(1)}/${newState.maxEnergy})`);
        }
        
        // Save every 5 points during mining to ensure persistence
        if (Math.floor(newState.divinePoints) % 5 === 0) {
          setTimeout(() => {
            const saveState = {
              ...newState,
              lastSaveTime: Date.now()
            };
            saveGameState(saveState);
          }, 100);
        }
        
        return newState;
      });
    }, 500); // More frequent updates for smoother energy consumption

    return () => {
      if (miningIntervalRef.current) {
        clearInterval(miningIntervalRef.current);
      }
    };
  }, [gameState.isMining, gameState.pointsPerSecond, gameState.currentEnergy, saveGameState, getBoostedMiningRate, upgrades]);

  // Save on component unmount and window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Window unloading, saving final state:', {
        divinePoints: gameState.divinePoints,
        pointsPerSecond: gameState.pointsPerSecond,
        isMining: gameState.isMining
      });
      
      const finalState = {
        ...gameState,
        lastSaveTime: Date.now()
      };
      
      // Force save on window unload
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(finalState));
        localStorage.setItem(BACKUP_KEY, JSON.stringify(finalState));
        localStorage.setItem(HIGH_SCORE_KEY, finalState.allTimeHighScore.toString());
        localStorage.setItem(DIVINE_POINTS_KEY, finalState.divinePoints.toString());
        localStorage.setItem(TOTAL_EARNED_KEY, finalState.totalPointsEarned.toString());
        
        // Save session data separately
        const sessionData = {
          sessionStartTime: finalState.sessionStartTime,
          lastDailyReset: finalState.lastDailyReset,
          lastWeeklyReset: finalState.lastWeeklyReset,
          lastSaveTime: finalState.lastSaveTime,
          version: finalState.version
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        console.log('Final state saved on window unload');
      } catch (error) {
        console.error('Error saving final state on window unload:', error);
      }
    };

    // Add event listener for window unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also save on component unmount
      console.log('Component unmounting, saving final state:', {
        divinePoints: gameState.divinePoints,
        pointsPerSecond: gameState.pointsPerSecond,
        isMining: gameState.isMining
      });
      
      const finalState = {
        ...gameState,
        lastSaveTime: Date.now()
      };
      
      // Force save on unmount
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(finalState));
        localStorage.setItem(BACKUP_KEY, JSON.stringify(finalState));
        localStorage.setItem(HIGH_SCORE_KEY, finalState.allTimeHighScore.toString());
        localStorage.setItem(DIVINE_POINTS_KEY, finalState.divinePoints.toString());
        localStorage.setItem(TOTAL_EARNED_KEY, finalState.totalPointsEarned.toString());
        
        // Save session data separately
        const sessionData = {
          sessionStartTime: finalState.sessionStartTime,
          lastDailyReset: finalState.lastDailyReset,
          lastWeeklyReset: finalState.lastWeeklyReset,
          lastSaveTime: finalState.lastSaveTime,
          version: finalState.version
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        console.log('Final state saved on unmount');
      } catch (error) {
        console.error('Error saving final state on unmount:', error);
      }
    };
  }, [gameState]);

  // Enhanced daily/weekly reset logic
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastDaily = gameState.lastDailyReset;
      
      // Reset daily stats if it's a new day
      if (today !== lastDaily) {
        setGameState(prev => ({
          ...prev,
          totalEarned24h: 0,
          lastDailyReset: today
        }));
        console.log('Daily stats reset');
      }
      
      // Reset weekly stats if it's been 7 days
      const lastWeekly = new Date(gameState.lastWeeklyReset);
      const daysDiff = Math.floor((now.getTime() - lastWeekly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 7) {
        setGameState(prev => ({
          ...prev,
          totalEarned7d: 0,
          lastWeeklyReset: today
        }));
        console.log('Weekly stats reset');
      }
    };

    const interval = setInterval(checkDailyReset, 60000); // Check every minute
    checkDailyReset(); // Check immediately

    return () => clearInterval(interval);
  }, [gameState.lastDailyReset, gameState.lastWeeklyReset]);

  // Verify save integrity on mount and periodically
  useEffect(() => {
    const verifySave = () => {
      try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (validateGameState(parsed)) {
            console.log('Save verification passed:', {
              divinePoints: parsed.divinePoints,
              pointsPerSecond: parsed.pointsPerSecond,
              isMining: parsed.isMining
            });
          } else {
            console.warn('Save verification failed - invalid state');
          }
        } else {
          console.log('No save data to verify');
        }
      } catch (error) {
        console.error('Save verification error:', error);
      }
    };
    
    // Verify on mount
    verifySave();
    
    // Verify every 30 seconds
    const interval = setInterval(verifySave, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced toggle mining with energy validation and auto-mining
  const toggleMining = useCallback(() => {
    setGameState(prev => {
      // If trying to start mining, check energy
      if (!prev.isMining && prev.currentEnergy < 1) {
        setSaveMessage('Not enough energy to mine! Wait for energy to regenerate.');
        setTimeout(() => setSaveMessage(''), 3000);
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
      
      // Save immediately
      setTimeout(() => {
        const saveState = {
          ...newState,
          lastSaveTime: Date.now()
        };
        saveGameState(saveState);
      }, 100);
      
      return newState;
    });
    
    // Clear mining resumed flag when user manually toggles
    setMiningResumed(false);
  }, [saveGameState]);

  // Auto-mining effect
  useEffect(() => {
    const autoMiningUpgrades = upgrades.filter(u => u.id === 'auto-mining');
    const hasAutoMining = autoMiningUpgrades.some(u => u.level > 0);
    
    if (hasAutoMining && !gameState.isMining && gameState.currentEnergy >= 1) {
      // Auto-start mining if we have energy and auto-mining upgrade
      console.log('Auto-mining activated');
      setGameState(prev => ({
        ...prev,
        isMining: true
      }));
    }
  }, [gameState.currentEnergy, gameState.isMining, upgrades]);

  // Enhanced purchase upgrade with validation
  const purchaseUpgrade = useCallback((upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      return;
    }

    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
    
    if (gameState.divinePoints >= cost) {
      setGameState(prev => {
        let newState = {
          ...prev,
          divinePoints: prev.divinePoints - cost,
          upgradesPurchased: prev.upgradesPurchased + 1
        };
        
        // Handle special upgrades
        if (upgradeId === 'energy-capacity') {
          newState = {
            ...newState,
            maxEnergy: prev.maxEnergy + upgrade.effectValue,
            currentEnergy: Math.min(prev.currentEnergy, prev.maxEnergy + upgrade.effectValue) // Don't exceed new max
          };
        } else if (upgradeId.startsWith('mining-') || upgradeId === 'auto-miner' || upgradeId === 'divine-boost' || 
                   upgradeId === 'quantum-miner' || upgradeId === 'cosmic-miner' || upgradeId === 'stellar-miner' || 
                   upgradeId === 'galactic-miner') {
          newState = {
            ...newState,
            pointsPerSecond: prev.pointsPerSecond + upgrade.effectValue
          };
        }
        
        return newState;
      });

      setUpgrades(prev => {
        const updatedUpgrades = prev.map(u => 
          u.id === upgradeId 
            ? { ...u, level: u.level + 1 }
            : u
        );
        
        // Save upgrades to localStorage immediately
        try {
          localStorage.setItem('divineMiningUpgrades', JSON.stringify(updatedUpgrades));
          console.log('Upgrades saved to localStorage');
          
          // Show save confirmation
          setLastSaveStatus('success');
          setSaveMessage(`Upgrade purchased and saved!`);
          setTimeout(() => setSaveMessage(''), 2000);
        } catch (error) {
          console.error('Error saving upgrades:', error);
          setLastSaveStatus('error');
          setSaveMessage('Failed to save upgrade!');
          setTimeout(() => setSaveMessage(''), 3000);
        }
        
        return updatedUpgrades;
      });
      
      console.log(`Purchased upgrade: ${upgrade.name} for ${cost} points`);
    } else {
      console.warn('Not enough points for upgrade');
    }
  }, [upgrades, gameState.divinePoints]);

  // Enhanced number formatting
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
  }, []);

  const getUpgradeCost = useCallback((upgrade: Upgrade): number => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }, []);

  const canAffordUpgrade = useCallback((upgrade: Upgrade): boolean => {
    return gameState.divinePoints >= getUpgradeCost(upgrade);
  }, [gameState.divinePoints, getUpgradeCost]);

  const getSessionDuration = useCallback((): string => {
    const duration = Date.now() - gameState.sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [gameState.sessionStartTime]);

  // Enhanced reset game with confirmation and backup
  const resetGame = useCallback(() => {
    if (window.confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
      if (window.confirm('Final warning: This will delete all your progress. Continue?')) {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        localStorage.removeItem('divineMiningUpgrades');
        localStorage.removeItem(HIGH_SCORE_KEY);
        localStorage.removeItem(DIVINE_POINTS_KEY);
        localStorage.removeItem(TOTAL_EARNED_KEY);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('divineMiningPrestigeMultiplier');
        window.location.reload();
      }
    }
  }, []);

  // Prestige system - reset for bonus multiplier
  const prestige = useCallback(() => {
    const prestigeThreshold = 1000000; // 1 million points to prestige
    if (gameState.divinePoints >= prestigeThreshold) {
      const prestigeBonus = Math.floor(gameState.divinePoints / prestigeThreshold);
      const newMultiplier = 1 + (prestigeBonus * 0.1); // 10% bonus per prestige level
      
      if (window.confirm(`Prestige for ${prestigeBonus}x multiplier? You'll lose all points but gain permanent mining speed bonus!`)) {
        // Reset game state but keep high scores and add prestige bonus
        const newState: GameState = {
          divinePoints: 100,
          pointsPerSecond: 1.0 * newMultiplier,
          totalEarned24h: 0,
          totalEarned7d: 0,
          upgradesPurchased: 0,
          minersActive: 1,
          isMining: false,
          lastSaveTime: Date.now(),
          sessionStartTime: Date.now(),
          totalPointsEarned: gameState.totalPointsEarned, // Keep total earned
          lastDailyReset: new Date().toDateString(),
          lastWeeklyReset: new Date().toDateString(),
          version: GAME_VERSION,
          highScore: gameState.highScore, // Keep high score
          allTimeHighScore: gameState.allTimeHighScore, // Keep all-time high score
          currentEnergy: 5000,
          maxEnergy: 5000,
          lastEnergyRegen: Date.now(),
          offlineEfficiencyBonus: 0, // New: Bonus for offline mining
          lastOfflineTime: Date.now() // New: Track last offline time
        };
        
        setGameState(newState);
        setUpgrades(getInitialUpgrades()); // Reset upgrades
        localStorage.removeItem('divineMiningUpgrades');
        
        // Save prestige multiplier
        localStorage.setItem('divineMiningPrestigeMultiplier', newMultiplier.toString());
        
        setSaveMessage(`🎉 Prestiged! +${((newMultiplier - 1) * 100).toFixed(1)}% permanent mining speed bonus!`);
        setTimeout(() => setSaveMessage(''), 5000);
      }
    } else {
      setSaveMessage(`Need ${(prestigeThreshold - gameState.divinePoints).toLocaleString()} more points to prestige!`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [gameState]);

  // Export save data
  const exportSave = useCallback(() => {
    const saveData = {
      gameState: {
        ...gameState,
        lastSaveTime: Date.now()
      },
      upgrades: upgrades,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(saveData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `divine-mining-save-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [gameState, upgrades]);

  // Import save data
  const importSave = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // Handle both old format (just gameState) and new format (gameState + upgrades)
          let gameStateData, upgradesData;
          
          if (importedData.gameState && importedData.upgrades) {
            // New format
            gameStateData = importedData.gameState;
            upgradesData = importedData.upgrades;
          } else {
            // Old format - just gameState
            gameStateData = importedData;
            upgradesData = null;
          }
          
          if (validateGameState(gameStateData)) {
            setGameState({
              ...gameStateData,
              lastSaveTime: Date.now(),
              version: GAME_VERSION
            });
            
            // Import upgrades if available
            if (upgradesData && Array.isArray(upgradesData)) {
              setUpgrades(upgradesData);
              localStorage.setItem('divineMiningUpgrades', JSON.stringify(upgradesData));
            }
            
            setSaveMessage('Save imported successfully!');
          } else {
            setSaveMessage('Invalid save file!');
          }
        } catch (error) {
          console.error('Error importing save:', error);
          setSaveMessage('Error importing save file!');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, []);

  // Debug function to check localStorage state
  const debugLocalStorage = useCallback(() => {
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('Main save:', localStorage.getItem(SAVE_KEY));
    console.log('Backup save:', localStorage.getItem(BACKUP_KEY));
    console.log('Upgrades:', localStorage.getItem('divineMiningUpgrades'));
    
    try {
      const mainSave = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      const backupSave = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
      const upgrades = JSON.parse(localStorage.getItem('divineMiningUpgrades') || 'null');
      
      console.log('Parsed main save:', mainSave);
      console.log('Parsed backup save:', backupSave);
      console.log('Parsed upgrades:', upgrades);
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
    }
  }, []);

  // Manual save function for debugging
  const manualSave = useCallback(() => {
    const saveState = {
      ...gameState,
      lastSaveTime: Date.now()
    };
    
    console.log('Manual save triggered:', saveState);
    const success = saveGameState(saveState);
    
    if (success) {
      setSaveMessage('Manual save successful!');
      setTimeout(() => setSaveMessage(''), 2000);
    } else {
      setSaveMessage('Manual save failed!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [gameState, saveGameState]);

  // Force save current state immediately
  const forceSave = useCallback(() => {
    const saveState = {
      ...gameState,
      lastSaveTime: Date.now()
    };
    
    console.log('Force save triggered:', {
      divinePoints: saveState.divinePoints,
      pointsPerSecond: saveState.pointsPerSecond,
      isMining: saveState.isMining,
      highScore: saveState.highScore,
      allTimeHighScore: saveState.allTimeHighScore
    });
    
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
      localStorage.setItem(BACKUP_KEY, JSON.stringify(saveState));
      localStorage.setItem(HIGH_SCORE_KEY, saveState.allTimeHighScore.toString());
      localStorage.setItem(DIVINE_POINTS_KEY, saveState.divinePoints.toString());
      setLastSaveStatus('success');
      setSaveMessage('Force save completed!');
      setTimeout(() => setSaveMessage(''), 2000);
      console.log('Force save successful');
    } catch (error) {
      console.error('Force save failed:', error);
      setLastSaveStatus('error');
      setSaveMessage('Force save failed!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [gameState]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <div className="flex-1 p-4 space-y-2 overflow-y-auto game-scrollbar">
      {/* Save Status Indicator */}
      {/* <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-lg text-xs font-mono ${
          lastSaveStatus === 'success' ? 'bg-green-500/80 text-white' :
          lastSaveStatus === 'error' ? 'bg-red-500/80 text-white' :
          'bg-yellow-500/80 text-black'
        }`}>
          {lastSaveStatus === 'success' ? '✓ SAVED' :
           lastSaveStatus === 'error' ? '✗ ERROR' :
           '⏳ SAVING...'}
        </div>
        {saveMessage && (
          <div className="mt-1 px-2 py-1 bg-black/80 text-white text-xs rounded">
            {saveMessage}
          </div>
        )}
      </div> */}

      {/* Divine Points Display */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${gameState.isMining ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">DIVINE POINTS</span>
          </div>
          <div className="text-3xl font-mono font-bold text-cyan-300 mb-1 tracking-wider animate-number-update" key={gameState.divinePoints}>
            {formatNumber(gameState.divinePoints)}
          </div>
          <div className="text-xs text-cyan-400 font-mono tracking-wide">
            +{getBoostedMiningRate().toFixed(1)}/sec • +{(getBoostedMiningRate() * 60).toFixed(0)}/min • +{(getBoostedMiningRate() * 3600).toFixed(0)}/hour
            {activeBoosts.length > 0 && (
              <span className="text-yellow-400 ml-2">
                (+{activeBoosts.filter(b => b.type === 'mining').reduce((sum, b) => sum + b.multiplier, 0)}x boost)
              </span>
            )}
            {parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0') > 1.0 && (
              <span className="text-purple-400 ml-2">
                (Prestige: +{((parseFloat(localStorage.getItem('divineMiningPrestigeMultiplier') || '1.0') - 1) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Session: {getSessionDuration()} • Total Earned: {formatNumber(gameState.totalPointsEarned)}
          </div>
          {activeBoosts.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="text-xs text-yellow-400 font-mono font-bold mb-1">ACTIVE BOOSTS:</div>
              <div className="flex flex-wrap gap-1">
                {activeBoosts.map((boost, index) => (
                  <div key={index} className="text-xs text-yellow-300 bg-yellow-500/30 px-2 py-1 rounded">
                    {boost.multiplier}x mining ({Math.ceil((boost.expires - Date.now()) / (60 * 60 * 1000))}h)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mining Station */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${gameState.isMining ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider">MINING STATION</span>
            {gameState.isMining && (
              <div className="text-xs text-green-400 font-mono animate-pulse">
                {miningResumed ? 'RESUMED' : 'ACTIVE'}
              </div>
            )}
          </div>
          
          {/* Mining Animation */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full ${gameState.isMining ? 'mining-station-active animate-pulse' : 'opacity-50'}`}>
              <div className={`absolute inset-2 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full ${gameState.isMining ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }}>
                <div className="absolute inset-1 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            {/* Mining Particles */}
            {gameState.isMining && [...Array(8)].map((_, i) => (
              <div
                key={`mining-particle-${i}`}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateX(30px)`,
                  animationDuration: `${1 + i * 0.2}s`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          
          <button 
            onClick={toggleMining}
            disabled={!gameState.isMining && gameState.currentEnergy < 1}
            className={`font-mono font-bold px-6 py-3 rounded-lg transition-all duration-300 border tracking-wider game-button ${
              gameState.isMining 
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-400'
                : gameState.currentEnergy < 1
                ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-400 cursor-not-allowed border-gray-400'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] border-cyan-400'
            }`}
          >
            {gameState.isMining ? 'STOP MINING' : gameState.currentEnergy < 1 ? 'NO ENERGY' : 'ACTIVATE MINING'}
          </button>
          
          {/* Energy Status */}
          <div className="mt-3 text-center">
            {/* Energy Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  gameState.currentEnergy < 100 ? 'bg-red-500' : 
                  gameState.currentEnergy < 500 ? 'bg-yellow-500' : 
                  gameState.isMining ? 'bg-red-400' : 'bg-blue-500'
                } ${gameState.isMining ? 'animate-pulse' : ''}`}
                style={{ width: `${(gameState.currentEnergy / gameState.maxEnergy) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-gray-400 font-mono">
              Energy: {gameState.currentEnergy.toLocaleString()}/{gameState.maxEnergy.toLocaleString()}
            </div>
            {gameState.currentEnergy < gameState.maxEnergy && (
              <div className="text-xs text-blue-400 font-mono animate-pulse">
                Regenerating: +{(1 + upgrades.filter(u => u.id === 'energy-regen').reduce((sum, u) => sum + (u.effectValue * u.level), 0)).toFixed(1)}/sec
              </div>
            )}
            {gameState.isMining && (
              <div className="text-xs text-red-400 font-mono">
                Consuming: -{Math.max(0.1, 1 * (1 + upgrades.filter(u => u.id === 'energy-efficiency').reduce((sum, u) => sum + (u.effectValue * u.level), 0))).toFixed(1)}/sec
              </div>
            )}
            {gameState.currentEnergy < 100 && gameState.isMining && (
              <div className="text-xs text-red-500 font-mono animate-pulse font-bold">
                ⚠️ LOW ENERGY WARNING!
              </div>
            )}
            
            {/* Offline Earnings Prediction */}
            {gameState.isMining && (
              <div className="mt-3 p-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-purple-400 font-mono font-bold mb-1">OFFLINE PREDICTIONS:</div>
                <div className="text-xs text-purple-300 space-y-1">
                  <div>1h: {formatNumber(getPotentialOfflineEarnings(1).totalEarnings)} points</div>
                  <div>8h: {formatNumber(getPotentialOfflineEarnings(8).totalEarnings)} points</div>
                  <div>24h: {formatNumber(getPotentialOfflineEarnings(24).totalEarnings)} points</div>
                  <div className="text-purple-400">
                    +{formatNumber(getPotentialOfflineEarnings(24).energyRegen)} energy
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrades Section */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 font-mono font-bold tracking-wider">UPGRADES</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono tracking-wide game-button"
              >
                {showHelp ? 'HIDE HELP' : 'SHOW HELP'}
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono tracking-wide game-button"
              >
                {showDebug ? 'HIDE DEBUG' : 'DEBUG'}
              </button>
              <button
                onClick={prestige}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono tracking-wide game-button"
              >
                PRESTIGE
              </button>
              <button
                onClick={resetGame}
                className="text-xs text-red-400 hover:text-red-300 font-mono tracking-wide game-button"
              >
                RESET
              </button>
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="mb-4 p-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg">
            <div className="text-cyan-300 font-mono font-bold text-sm mb-2">HOW TO PLAY:</div>
            <div className="text-gray-400 font-mono text-xs space-y-1">
              <div>• Click "ACTIVATE MINING" to start earning points</div>
              <div>• Purchase upgrades to increase your mining speed</div>
              <div>• Your progress is automatically saved every 30 seconds</div>
              <div>• You earn points even when the game is closed</div>
              <div>• Unlock achievements by reaching milestones</div>
              <div>• Use Export/Import to backup your progress</div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-cyan-500/20">
              <div className="text-yellow-300 font-mono font-bold text-sm mb-2">🚀 PRO TIPS:</div>
              <div className="text-gray-400 font-mono text-xs space-y-1">
                <div className="text-yellow-400 font-semibold">📈 Offline Strategy:</div>
                <div>• Plan offline periods to maximize efficiency bonuses</div>
                <div>• Longer offline time = bigger bonus (up to 140%)</div>
                <div>• Energy regenerates while offline</div>
                
                <div className="text-yellow-400 font-semibold mt-2">⚡ Energy Management:</div>
                <div>• Invest in Energy Efficiency upgrades early</div>
                <div>• Energy Sustain reduces costs by 20% per level</div>
                <div>• Auto-mining starts automatically when energy is available</div>
                
                <div className="text-yellow-400 font-semibold mt-2">🎯 Upgrade Priority:</div>
                <div>• Mining Speed → Energy Efficiency → Divine Resonance</div>
                <div>• Divine Resonance multiplies boost effectiveness</div>
                <div>• Offline Efficiency rewards strategic breaks</div>
                
                <div className="text-yellow-400 font-semibold mt-2">🛡️ Data Safety:</div>
                <div>• Export save data regularly using debug menu</div>
                <div>• App creates backups every 5 minutes</div>
                <div>• Multiple save slots prevent data loss</div>
                
                <div className="text-yellow-400 font-semibold mt-2">💎 Boost Strategy:</div>
                <div>• Use boosts during active mining sessions</div>
                <div>• Divine Resonance makes boosts 50% more effective</div>
                <div>• Combine upgrades for maximum synergy</div>
              </div>
            </div>
          </div>
        )}

        {showDebug && (
          <div className="mb-4 p-3 bg-purple-800/50 border border-purple-500/30 rounded-lg">
            <div className="text-purple-300 font-mono font-bold text-sm mb-2">DEBUG INFO:</div>
            <div className="text-gray-400 font-mono text-xs space-y-1">
              <div>Version: {gameState.version}</div>
              <div>Last Save: {new Date(gameState.lastSaveTime).toLocaleString()}</div>
              <div>Session Start: {new Date(gameState.sessionStartTime).toLocaleString()}</div>
              <div>Daily Reset: {gameState.lastDailyReset}</div>
              <div>Weekly Reset: {gameState.lastWeeklyReset}</div>
              <div>Mining Status: {gameState.isMining ? 'ACTIVE' : 'INACTIVE'}</div>
              <div>Mining Resumed: {miningResumed ? 'YES' : 'NO'}</div>
              <div>Mining Rate: {gameState.pointsPerSecond}/sec</div>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={exportSave}
                  className="text-xs bg-blue-500 px-2 py-1 rounded"
                >
                  EXPORT
                </button>
                <button
                  onClick={importSave}
                  className="text-xs bg-green-500 px-2 py-1 rounded"
                >
                  IMPORT
                </button>
                <button
                  onClick={debugLocalStorage}
                  className="text-xs bg-purple-500 px-2 py-1 rounded"
                >
                  DEBUG LS
                </button>
                <button
                  onClick={manualSave}
                  className="text-xs bg-orange-500 px-2 py-1 rounded"
                >
                  SAVE NOW
                </button>
                <button
                  onClick={forceSave}
                  className="text-xs bg-red-500 px-2 py-1 rounded"
                >
                  FORCE SAVE
                </button>
                <button
                  onClick={() => {
                    console.log('=== MANUAL DIVINE POINTS SAVE ===');
                    localStorage.setItem(DIVINE_POINTS_KEY, gameState.divinePoints.toString());
                    console.log('Divine points saved:', gameState.divinePoints);
                    setSaveMessage(`Divine points saved: ${gameState.divinePoints.toLocaleString()}`);
                    setTimeout(() => setSaveMessage(''), 3000);
                  }}
                  className="text-xs bg-blue-500 px-2 py-1 rounded"
                >
                  SAVE POINTS
                </button>
                <button
                  onClick={() => {
                    console.log('=== MANUAL TOTAL EARNED SAVE ===');
                    localStorage.setItem(TOTAL_EARNED_KEY, gameState.totalPointsEarned.toString());
                    console.log('Total earned saved:', gameState.totalPointsEarned);
                    setSaveMessage(`Total earned saved: ${gameState.totalPointsEarned.toLocaleString()}`);
                    setTimeout(() => setSaveMessage(''), 3000);
                  }}
                  className="text-xs bg-green-500 px-2 py-1 rounded"
                >
                  SAVE TOTAL
                </button>
                <button
                  onClick={() => {
                    console.log('=== MANUAL SESSION SAVE ===');
                    const sessionData = {
                      sessionStartTime: gameState.sessionStartTime,
                      lastDailyReset: gameState.lastDailyReset,
                      lastWeeklyReset: gameState.lastWeeklyReset,
                      lastSaveTime: gameState.lastSaveTime,
                      version: gameState.version
                    };
                    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                    console.log('Session data saved:', sessionData);
                    setSaveMessage(`Session data saved! Duration: ${getSessionDuration()}`);
                    setTimeout(() => setSaveMessage(''), 3000);
                  }}
                  className="text-xs bg-purple-500 px-2 py-1 rounded"
                >
                  SAVE SESSION
                </button>
                <button
                  onClick={() => {
                    console.log('=== MANUAL LOAD ATTEMPT ===');
                    
                    // Try to load from main save first
                    const saved = localStorage.getItem(SAVE_KEY);
                    if (saved) {
                      try {
                        const parsed = JSON.parse(saved);
                        if (validateGameState(parsed)) {
                          console.log('Manual load from main save successful:', parsed);
                          setGameState(prev => ({
                            ...parsed,
                            lastSaveTime: Date.now()
                          }));
                          setSaveMessage('Manual load successful!');
                          setTimeout(() => setSaveMessage(''), 3000);
                          return;
                        }
                      } catch (error) {
                        console.error('Manual load from main save error:', error);
                      }
                    }
                    
                    // Fallback: load divine points from separate key
                    const savedPoints = localStorage.getItem(DIVINE_POINTS_KEY);
                    if (savedPoints) {
                      const points = parseInt(savedPoints, 10);
                      if (!isNaN(points) && points >= 100) {
                        console.log('Manual load from divine points key successful:', points);
                        setGameState(prev => ({
                          ...prev,
                          divinePoints: points,
                          lastSaveTime: Date.now()
                        }));
                        setSaveMessage(`Manual load successful! Points: ${points.toLocaleString()}`);
                        setTimeout(() => setSaveMessage(''), 3000);
                        return;
                      }
                    }
                    
                    // Fallback: load total earned from separate key
                    const savedTotal = localStorage.getItem(TOTAL_EARNED_KEY);
                    if (savedTotal) {
                      const total = parseInt(savedTotal, 10);
                      if (!isNaN(total) && total >= 0) {
                        console.log('Manual load from total earned key successful:', total);
                        setGameState(prev => ({
                          ...prev,
                          totalPointsEarned: total,
                          lastSaveTime: Date.now()
                        }));
                        setSaveMessage(`Manual load successful! Total earned: ${total.toLocaleString()}`);
                        setTimeout(() => setSaveMessage(''), 3000);
                        return;
                      }
                    }
                    
                    console.log('No valid saved data to load');
                    setSaveMessage('No valid saved data found');
                    setTimeout(() => setSaveMessage(''), 3000);
                  }}
                  className="text-xs bg-green-500 px-2 py-1 rounded"
                >
                  MANUAL LOAD
                </button>
                <button
                  onClick={() => {
                    console.log('=== SAVE STATUS ===');
                    console.log('Current points:', gameState.divinePoints);
                    console.log('Save status:', lastSaveStatus);
                    console.log('Save message:', saveMessage);
                    console.log('Last save time:', new Date(gameState.lastSaveTime).toLocaleString());
                  }}
                  className="text-xs bg-blue-500 px-2 py-1 rounded"
                >
                  SAVE STATUS
                </button>
                <button
                  onClick={() => {
                    console.log('=== LOCALSTORAGE INSPECTION ===');
                    console.log('SAVE_KEY:', localStorage.getItem(SAVE_KEY));
                    console.log('BACKUP_KEY:', localStorage.getItem(BACKUP_KEY));
                    console.log('HIGH_SCORE_KEY:', localStorage.getItem(HIGH_SCORE_KEY));
                    console.log('DIVINE_POINTS_KEY:', localStorage.getItem(DIVINE_POINTS_KEY));
                    console.log('TOTAL_EARNED_KEY:', localStorage.getItem(TOTAL_EARNED_KEY));
                    console.log('SESSION_KEY:', localStorage.getItem(SESSION_KEY));
                    console.log('Upgrades:', localStorage.getItem('divineMiningUpgrades'));
                    console.log('Prestige Multiplier:', localStorage.getItem('divineMiningPrestigeMultiplier'));
                    console.log('All localStorage keys:', Object.keys(localStorage));
                    console.log('Current game state:', gameState);
                    console.log('Has loaded saved data:', hasLoadedSavedData);
                    
                    // Try to parse saved data
                    try {
                      const saved = localStorage.getItem(SAVE_KEY);
                      if (saved) {
                        const parsed = JSON.parse(saved);
                        console.log('Parsed save data:', parsed);
                        console.log('Validation result:', validateGameState(parsed));
                      }
                      
                      const sessionData = localStorage.getItem(SESSION_KEY);
                      if (sessionData) {
                        const parsedSession = JSON.parse(sessionData);
                        console.log('Parsed session data:', parsedSession);
                      }
                    } catch (error) {
                      console.error('Error parsing saved data:', error);
                    }
                  }}
                  className="text-xs bg-purple-500 px-2 py-1 rounded"
                >
                  INSPECT
                </button>
                <button
                  onClick={() => {
                    console.log('=== ENERGY DEBUG ===');
                    console.log('Current Energy:', gameState.currentEnergy);
                    console.log('Max Energy:', gameState.maxEnergy);
                    console.log('Is Mining:', gameState.isMining);
                    
                    // Calculate energy cost
                    const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
                    const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
                    const baseEnergyCost = 1;
                    const energyCost = Math.max(0.1, baseEnergyCost * (1 + efficiencyBonus));
                    
                    console.log('Energy Efficiency Upgrades:', energyEfficiencyUpgrades);
                    console.log('Efficiency Bonus:', efficiencyBonus);
                    console.log('Base Energy Cost:', baseEnergyCost);
                    console.log('Final Energy Cost:', energyCost);
                    console.log('Can Mine:', gameState.currentEnergy >= energyCost);
                    
                    // Calculate energy regen
                    const energyRegenUpgrades = upgrades.filter(u => u.id === 'energy-regen');
                    const regenBonus = energyRegenUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
                    const baseRegen = 1;
                    const totalRegen = baseRegen + regenBonus;
                    
                    console.log('Energy Regen Upgrades:', energyRegenUpgrades);
                    console.log('Regen Bonus:', regenBonus);
                    console.log('Total Regen:', totalRegen);
                  }}
                  className="text-xs bg-green-500 px-2 py-1 rounded"
                >
                  ENERGY DEBUG
                </button>
                <button
                  onClick={() => {
                    // Manually consume energy for testing
                    const energyCost = 100;
                    setGameState(prev => {
                      if (prev.currentEnergy >= energyCost) {
                        console.log(`Manual energy consumption: -${energyCost} energy`);
                        setSaveMessage(`Manual energy consumption: -${energyCost} energy`);
                        setTimeout(() => setSaveMessage(''), 2000);
                        return {
                          ...prev,
                          currentEnergy: prev.currentEnergy - energyCost
                        };
                      } else {
                        console.log(`Cannot consume energy: Not enough (${prev.currentEnergy} < ${energyCost})`);
                        setSaveMessage(`Cannot consume energy: Not enough (${prev.currentEnergy} < ${energyCost})`);
                        setTimeout(() => setSaveMessage(''), 2000);
                        return prev;
                      }
                    });
                  }}
                  className="text-xs bg-red-500 px-2 py-1 rounded"
                >
                  CONSUME 100 ENERGY
                </button>
                <button
                  onClick={() => {
                    // Manually restore energy for testing
                    const energyRestore = 1000;
                    setGameState(prev => {
                      const newEnergy = Math.min(prev.maxEnergy, prev.currentEnergy + energyRestore);
                      console.log(`Manual energy restore: +${energyRestore} energy (${prev.currentEnergy} -> ${newEnergy})`);
                      setSaveMessage(`Manual energy restore: +${energyRestore} energy`);
                      setTimeout(() => setSaveMessage(''), 2000);
                      return {
                        ...prev,
                        currentEnergy: newEnergy
                      };
                    });
                  }}
                  className="text-xs bg-blue-500 px-2 py-1 rounded"
                >
                  RESTORE 1000 ENERGY
                </button>
                <button
                  onClick={() => {
                    console.log('=== ENERGY CONSUMPTION TEST ===');
                    
                    // Calculate current energy consumption
                    const boostedRate = getBoostedMiningRate();
                    const energyEfficiencyUpgrades = upgrades.filter(u => u.id === 'energy-efficiency');
                    const efficiencyBonus = energyEfficiencyUpgrades.reduce((sum, u) => sum + (u.effectValue * u.level), 0);
                    const baseEnergyCost = 1;
                    const miningSpeedMultiplier = Math.max(1, boostedRate / gameState.pointsPerSecond);
                    const energyCost = Math.max(0.25, baseEnergyCost * miningSpeedMultiplier * (1 + efficiencyBonus));
                    
                    console.log('Current mining rate:', boostedRate);
                    console.log('Mining speed multiplier:', miningSpeedMultiplier);
                    console.log('Energy cost per 500ms:', energyCost);
                    console.log('Energy cost per second:', energyCost * 2);
                    console.log('Current energy:', gameState.currentEnergy);
                    console.log('Time to empty:', gameState.currentEnergy / (energyCost * 2), 'seconds');
                    
                    setSaveMessage(`Energy consumption: ${(energyCost * 2).toFixed(2)}/sec (${(gameState.currentEnergy / (energyCost * 2)).toFixed(1)}s remaining)`);
                    setTimeout(() => setSaveMessage(''), 4000);
                  }}
                  className="text-xs bg-yellow-500 px-2 py-1 rounded"
                >
                  ENERGY CONSUMPTION TEST
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {upgrades.map((upgrade) => (
            <div key={upgrade.id} className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-cyan-300 font-mono font-bold text-sm tracking-wide">{upgrade.name}</div>
                  <div className="text-gray-400 font-mono text-xs">Level {upgrade.level} • {upgrade.effect}</div>
                  <div className="text-gray-500 font-mono text-xs">Cost: {formatNumber(getUpgradeCost(upgrade))} DP</div>
                </div>
                <button 
                  onClick={() => purchaseUpgrade(upgrade.id)}
                  disabled={!canAffordUpgrade(upgrade)}
                  className={`font-mono font-bold px-4 py-2 rounded text-xs transition-all duration-300 border game-button ${
                    canAffordUpgrade(upgrade)
                      ? 'upgrade-available hover:scale-105'
                      : 'upgrade-unavailable cursor-not-allowed'
                  }`}
                >
                  {canAffordUpgrade(upgrade) ? 'UPGRADE' : 'TOO EXPENSIVE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
          {/* Futuristic Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-mono font-bold tracking-wider">ACHIEVEMENTS ({unlockedAchievements.length}/{achievements.length})</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {unlockedAchievements.map((achievement) => (
              <div key={achievement.id} className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-2">
                <div className="text-yellow-300 font-mono font-bold text-sm">🏆 {achievement.name}</div>
                <div className="text-yellow-400 font-mono text-xs">{achievement.description}</div>
                {achievement.unlockedAt && (
                  <div className="text-yellow-500 font-mono text-xs mt-1">
                    Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        {/* Futuristic Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider">STATISTICS</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 game-grid-2">
          <div className="text-center stats-card">
            <div className="text-cyan-300 font-mono font-bold text-lg">{formatNumber(gameState.totalEarned24h)}</div>
            <div className="text-gray-400 font-mono text-xs">24h Total</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-cyan-300 font-mono font-bold text-lg">{formatNumber(gameState.totalEarned7d)}</div>
            <div className="text-gray-400 font-mono text-xs">7d Total</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-cyan-300 font-mono font-bold text-lg">{gameState.upgradesPurchased}</div>
            <div className="text-gray-400 font-mono text-xs">Upgrades</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-cyan-300 font-mono font-bold text-lg">{gameState.minersActive}</div>
            <div className="text-gray-400 font-mono text-xs">Miners Active</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-green-300 font-mono font-bold text-lg">{formatNumber(gameState.highScore)}</div>
            <div className="text-gray-400 font-mono text-xs">Session High</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-yellow-300 font-mono font-bold text-lg">{formatNumber(gameState.allTimeHighScore)}</div>
            <div className="text-gray-400 font-mono text-xs">All-Time High</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-purple-300 font-mono font-bold text-lg">+{(gameState.offlineEfficiencyBonus * 100).toFixed(1)}%</div>
            <div className="text-gray-400 font-mono text-xs">Offline Bonus</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-green-300 font-mono font-bold text-lg">{formatNumber(getEnhancedMiningRate())}</div>
            <div className="text-gray-400 font-mono text-xs">Enhanced Rate</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-blue-300 font-mono font-bold text-lg">{formatNumber(gameState.totalPointsEarned)}</div>
            <div className="text-gray-400 font-mono text-xs">Total Earned</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-purple-300 font-mono font-bold text-lg">{getSessionDuration()}</div>
            <div className="text-gray-400 font-mono text-xs">Session Time</div>
          </div>
          <div className="text-center stats-card">
            <div className="text-orange-300 font-mono font-bold text-lg">{gameState.lastDailyReset}</div>
            <div className="text-gray-400 font-mono text-xs">Daily Reset</div>
          </div>
        </div>
      </div>
    </div>

  );
}; 