// Divine Mining Debug Utilities
// This file contains debug functions to test and verify data persistence

import { validateUserDataIsolation, checkForDataLeakage } from './userDataIsolation';

export interface DebugState {
  divinePoints: number;
  pointsPerSecond: number;
  upgradesPurchased: number;
  isMining: boolean;
  currentEnergy: number;
  maxEnergy: number;
  totalPointsEarned: number;
  highScore: number;
  allTimeHighScore: number;
  lastSaveTime: number;
  version: string;
  hasLoadedSavedData: boolean;
  isInitialLoadComplete: boolean;
}

export interface SaveData {
  localStorage: any;
  supabase: any;
  lastUpdate: string;
  saveTimestamp: number;
}

// Debug function to check current game state
export const debugGameState = (gameState: any, hasLoadedSavedData: boolean, isInitialLoadComplete: boolean): DebugState => {
  return {
    divinePoints: gameState.divinePoints || 0,
    pointsPerSecond: gameState.pointsPerSecond || 0,
    upgradesPurchased: gameState.upgradesPurchased || 0,
    isMining: gameState.isMining || false,
    currentEnergy: gameState.currentEnergy || 0,
    maxEnergy: gameState.maxEnergy || 0,
    totalPointsEarned: gameState.totalPointsEarned || 0,
    highScore: gameState.highScore || 0,
    allTimeHighScore: gameState.allTimeHighScore || 0,
    lastSaveTime: gameState.lastSaveTime || 0,
    version: gameState.version || 'unknown',
    hasLoadedSavedData,
    isInitialLoadComplete
  };
};

// Debug function to check all save data sources
export const debugSaveData = (user: any): SaveData | null => {
  if (!user?.telegram_id) {
    console.log('❌ No user found for debug');
    return null;
  }

  try {
    // Check localStorage
    const localStorageKey = `divine_mining_state_${user.telegram_id}`;
    const localStorageData = localStorage.getItem(localStorageKey);
    const parsedLocalStorage = localStorageData ? JSON.parse(localStorageData) : null;

    // Check other localStorage keys
    const divinePointsKey = 'divineMiningPoints';
    const totalEarnedKey = 'divineMiningTotalEarned';
    const sessionKey = 'divineMiningSession';
    const highScoreKey = `divineMiningHighScore_${user.telegram_id}`;
    const backupKey = 'divineMiningGame_backup';
    const mainSaveKey = 'divineMiningGame';

    const divinePoints = localStorage.getItem(divinePointsKey);
    const totalEarned = localStorage.getItem(totalEarnedKey);
    const session = localStorage.getItem(sessionKey);
    const highScore = localStorage.getItem(highScoreKey);
    const backup = localStorage.getItem(backupKey);
    const mainSave = localStorage.getItem(mainSaveKey);

    return {
      localStorage: {
        divineMiningState: parsedLocalStorage,
        divinePoints: divinePoints ? parseInt(divinePoints, 10) : null,
        totalEarned: totalEarned ? parseInt(totalEarned, 10) : null,
        session: session ? JSON.parse(session) : null,
        highScore: highScore ? parseInt(highScore, 10) : null,
        backup: backup ? JSON.parse(backup) : null,
        mainSave: mainSave ? JSON.parse(mainSave) : null
      },
      supabase: null, // Will be populated by async call
      lastUpdate: parsedLocalStorage?.lastUpdate || null,
      saveTimestamp: parsedLocalStorage?.saveTimestamp || null
    };
  } catch (error) {
    console.error('Error in debugSaveData:', error);
    return null;
  }
};

// Debug function to force save to all systems
export const forceSaveAll = async (gameState: any, upgrades: any[], achievements: any[], user: any, saveToSupabase: () => Promise<void>) => {
  if (!user?.telegram_id) {
    console.log('❌ No user found for force save');
    return false;
  }

  try {
    console.log('🔄 Force saving to all systems...');
    
    // Save to localStorage
    const stateToSave = {
      ...gameState,
      upgrades,
      achievements,
      lastUpdate: new Date().toISOString(),
      saveTimestamp: Date.now()
    };
    
    const localStorageKey = `divine_mining_state_${user.telegram_id}`;
    localStorage.setItem(localStorageKey, JSON.stringify(stateToSave));
    
    // Save to separate keys
    localStorage.setItem('divineMiningPoints', gameState.divinePoints.toString());
    localStorage.setItem('divineMiningTotalEarned', gameState.totalPointsEarned.toString());
    localStorage.setItem(`divineMiningHighScore_${user.telegram_id}`, gameState.allTimeHighScore.toString());
    
    // Save to main save key
    localStorage.setItem('divineMiningGame', JSON.stringify(gameState));
    localStorage.setItem('divineMiningGame_backup', JSON.stringify(gameState));
    
    // Save to Supabase
    await saveToSupabase();
    
    console.log('✅ Force save completed');
    return true;
  } catch (error) {
    console.error('❌ Force save failed:', error);
    return false;
  }
};

// Debug function to check for NaN values
export const checkForNaN = (gameState: any, upgrades: any[]): string[] => {
  const issues: string[] = [];
  
  // Check game state
  Object.entries(gameState).forEach(([key, value]) => {
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      issues.push(`GameState.${key}: ${value}`);
    }
  });
  
  // Check upgrades
  upgrades.forEach((upgrade, index) => {
    Object.entries(upgrade).forEach(([key, value]) => {
      if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
        issues.push(`Upgrade[${index}].${key}: ${value}`);
      }
    });
  });
  
  return issues;
};

// Debug function to validate save data
export const validateSaveData = (data: any): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!data) {
    issues.push('No data provided');
    return { isValid: false, issues };
  }
  
  // Check required fields
  const requiredFields = ['divinePoints', 'pointsPerSecond', 'upgradesPurchased', 'isMining'];
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null) {
      issues.push(`Missing required field: ${field}`);
    }
  });
  
  // Check for NaN values
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
      issues.push(`NaN/Infinite value in ${key}: ${value}`);
    }
  });
  
  // Check for reasonable ranges
  if (data.divinePoints < 0) issues.push('divinePoints cannot be negative');
  if (data.pointsPerSecond < 0) issues.push('pointsPerSecond cannot be negative');
  if (data.upgradesPurchased < 0) issues.push('upgradesPurchased cannot be negative');
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Debug function to test save/load cycle
export const testSaveLoadCycle = async (
  gameState: any, 
  upgrades: any[], 
  achievements: any[], 
  user: any, 
  saveToSupabase: () => Promise<void>
): Promise<{ success: boolean; issues: string[] }> => {
  const issues: string[] = [];
  
  try {
    console.log('🧪 Testing save/load cycle...');
    
    // 1. Save current state
    const saveSuccess = await forceSaveAll(gameState, upgrades, achievements, user, saveToSupabase);
    if (!saveSuccess) {
      issues.push('Failed to save data');
      return { success: false, issues };
    }
    
    // 2. Clear current state (simulate reload)
    const originalState = { ...gameState };
    
    // 3. Check if data persists
    const debugData = debugSaveData(user);
    if (!debugData) {
      issues.push('Failed to retrieve saved data');
      return { success: false, issues };
    }
    
    // 4. Validate saved data
    const validation = validateSaveData(debugData.localStorage.divineMiningState);
    if (!validation.isValid) {
      issues.push(...validation.issues);
    }
    
    // 5. Check for data consistency
    if (debugData.localStorage.divineMiningState?.divinePoints !== originalState.divinePoints) {
      issues.push(`Data inconsistency: expected ${originalState.divinePoints}, got ${debugData.localStorage.divineMiningState?.divinePoints}`);
    }
    
    console.log('✅ Save/load cycle test completed');
    return { success: issues.length === 0, issues };
    
  } catch (error) {
    console.error('❌ Save/load cycle test failed:', error);
    issues.push(`Test error: ${error}`);
    return { success: false, issues };
  }
};

// Debug function to export current state
export const exportGameState = (gameState: any, upgrades: any[], achievements: any[]): string => {
  const exportData = {
    gameState,
    upgrades,
    achievements,
    exportTimestamp: new Date().toISOString(),
    version: gameState.version || 'unknown'
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Debug function to import game state
export const importGameState = (importString: string): { success: boolean; data?: any; error?: string } => {
  try {
    const importData = JSON.parse(importString);
    
    // Validate import data
    if (!importData.gameState || !importData.upgrades) {
      return { success: false, error: 'Invalid import data structure' };
    }
    
    const validation = validateSaveData(importData.gameState);
    if (!validation.isValid) {
      return { success: false, error: `Invalid game state: ${validation.issues.join(', ')}` };
    }
    
    return { success: true, data: importData };
  } catch (error) {
    return { success: false, error: `Import failed: ${error}` };
  }
};

// Debug function to clear all save data
export const clearAllSaveData = (user: any): boolean => {
  if (!user?.telegram_id) {
    console.log('❌ No user found for clear');
    return false;
  }

  try {
    console.log('🗑️ Clearing all save data...');
    
    const keysToRemove = [
      `divine_mining_state_${user.telegram_id}`,
      'divineMiningPoints',
      'divineMiningTotalEarned',
      'divineMiningSession',
      `divineMiningHighScore_${user.telegram_id}`,
      'divineMiningGame',
      'divineMiningGame_backup',
      'divineMiningUpgrades',
      'divineMiningAchievements',
      'divineMiningTutorial'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ All save data cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear save data:', error);
    return false;
  }
};

// Debug function to simulate the 10k to 4k reversion issue
export const simulateDataReversion = async (
  gameState: any, 
  upgrades: any[], 
  achievements: any[], 
  user: any, 
  saveToSupabase: () => Promise<void>
): Promise<{ success: boolean; issues: string[] }> => {
  const issues: string[] = [];
  
  try {
    console.log('🎭 Simulating data reversion scenario...');
    
    // 1. Set high points (simulate 10k+ points)
    const highPointsState = {
      ...gameState,
      divinePoints: 15000,
      totalPointsEarned: 20000,
      pointsPerSecond: 5.0,
      upgradesPurchased: 10
    };
    
    // 2. Save high points state
    await forceSaveAll(highPointsState, upgrades, achievements, user, saveToSupabase);
    
    // 3. Simulate reload by clearing state
    console.log('🔄 Simulating page reload...');
    
    // 4. Check if data persists correctly
    const debugData = debugSaveData(user);
    if (!debugData?.localStorage?.divineMiningState) {
      issues.push('No saved data found after save');
      return { success: false, issues };
    }
    
    const savedPoints = debugData.localStorage.divineMiningState.divinePoints;
    if (savedPoints !== 15000) {
      issues.push(`Data reversion detected: expected 15000, got ${savedPoints}`);
    }
    
    // 5. Check all save sources
    const allSources = [
      { name: 'divineMiningState', value: debugData.localStorage.divineMiningState?.divinePoints },
      { name: 'divinePoints', value: debugData.localStorage.divinePoints },
      { name: 'mainSave', value: debugData.localStorage.mainSave?.divinePoints },
      { name: 'backup', value: debugData.localStorage.backup?.divinePoints }
    ];
    
    allSources.forEach(source => {
      if (source.value !== 15000) {
        issues.push(`${source.name} mismatch: expected 15000, got ${source.value}`);
      }
    });
    
    console.log('✅ Data reversion simulation completed');
    return { success: issues.length === 0, issues };
    
  } catch (error) {
    console.error('❌ Data reversion simulation failed:', error);
    issues.push(`Simulation error: ${error}`);
    return { success: false, issues };
  }
};

// Debug function to get comprehensive status report
export const getStatusReport = (
  gameState: any, 
  upgrades: any[], 
  // achievements: any[], 
  user: any, 
  hasLoadedSavedData: boolean, 
  isInitialLoadComplete: boolean
): string => {
  const debugState = debugGameState(gameState, hasLoadedSavedData, isInitialLoadComplete);
  const saveData = debugSaveData(user);
  const nanIssues = checkForNaN(gameState, upgrades);
  const validation = saveData?.localStorage?.divineMiningState ? 
    validateSaveData(saveData.localStorage.divineMiningState) : 
    { isValid: false, issues: ['No save data found'] };
  
  // Add user data isolation check
  let isolationReport = '';
  if (user?.telegram_id) {
    const telegramId = String(user.telegram_id);
    const isolationValidation = validateUserDataIsolation(telegramId);
    const leakageCheck = checkForDataLeakage(telegramId);
    
    isolationReport = `
USER DATA ISOLATION:
- Data Isolation Valid: ${isolationValidation.isValid ? '✅ Yes' : '❌ No'}
- Data Leakage Detected: ${leakageCheck.hasLeakage ? '❌ Yes' : '✅ No'}
${isolationValidation.issues.length > 0 ? `- Isolation Issues:\n${isolationValidation.issues.map(issue => `  • ${issue}`).join('\n')}` : ''}
${leakageCheck.issues.length > 0 ? `- Leakage Issues:\n${leakageCheck.issues.map(issue => `  • ${issue}`).join('\n')}` : ''}
`;
  }
  
  const report = `
=== DIVINE MINING STATUS REPORT ===
Timestamp: ${new Date().toISOString()}

GAME STATE:
- Divine Points: ${debugState.divinePoints.toLocaleString()}
- Points/Second: ${debugState.pointsPerSecond}
- Upgrades Purchased: ${debugState.upgradesPurchased}
- Mining Active: ${debugState.isMining}
- Energy: ${debugState.currentEnergy}/${debugState.maxEnergy}
- Total Earned: ${debugState.totalPointsEarned.toLocaleString()}
- High Score: ${debugState.highScore.toLocaleString()}
- All-Time High: ${debugState.allTimeHighScore.toLocaleString()}

LOAD STATUS:
- Has Loaded Saved Data: ${hasLoadedSavedData}
- Initial Load Complete: ${isInitialLoadComplete}
- Last Save Time: ${new Date(debugState.lastSaveTime).toLocaleString()}
- Game Version: ${debugState.version}

SAVE DATA STATUS:
- localStorage divineMiningState: ${saveData?.localStorage?.divineMiningState ? '✅ Found' : '❌ Missing'}
- localStorage divinePoints: ${saveData?.localStorage?.divinePoints ? '✅ Found' : '❌ Missing'}
- localStorage mainSave: ${saveData?.localStorage?.mainSave ? '✅ Found' : '❌ Missing'}
- localStorage backup: ${saveData?.localStorage?.backup ? '✅ Found' : '❌ Missing'}

VALIDATION:
- Save Data Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}
- NaN Issues: ${nanIssues.length > 0 ? `❌ ${nanIssues.join(', ')}` : '✅ None'}

${validation.issues.length > 0 ? `VALIDATION ISSUES:\n${validation.issues.map(issue => `- ${issue}`).join('\n')}` : ''}
${nanIssues.length > 0 ? `NaN ISSUES:\n${nanIssues.map(issue => `- ${issue}`).join('\n')}` : ''}
${isolationReport}

=== END REPORT ===
  `;
  
  return report;
}; 