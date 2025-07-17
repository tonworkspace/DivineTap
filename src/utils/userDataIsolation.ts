// User Data Isolation Utilities
// This file ensures complete data isolation between users to prevent data leakage

export interface UserDataKeys {
  // Core game data
  divineMiningGame: string;
  divineMiningGame_backup: string;
  divineMiningPoints: string;
  divineMiningTotalEarned: string;
  divineMiningSession: string;
  divineMiningTutorial: string;
  divineMiningAchievements: string;
  divineMiningUpgrades: string;
  divineMiningHighScore: string;
  
  // Additional user-specific data
  divineMiningPrestigeMultiplier: string;
  divineMiningReferralData: string;
  divineMiningCompletedTasks: string;
  divineMiningStreak: string;
  spiritualEssencePoints: string;
  divineMiningGems: string;
  divineMiningBoosts: string;
  
  // Mining section data
  mining_state: string;
  
  // Other game data
  frog_miner_data: string;
}

// Generate user-specific localStorage keys
export const getUserSpecificKeys = (telegramId: string): UserDataKeys => {
  if (!telegramId) {
    throw new Error('Telegram ID is required for user-specific key generation');
  }
  
  return {
    // Core game data
    divineMiningGame: `divineMiningGame_${telegramId}`,
    divineMiningGame_backup: `divineMiningGame_backup_${telegramId}`,
    divineMiningPoints: `divineMiningPoints_${telegramId}`,
    divineMiningTotalEarned: `divineMiningTotalEarned_${telegramId}`,
    divineMiningSession: `divineMiningSession_${telegramId}`,
    divineMiningTutorial: `divineMiningTutorial_${telegramId}`,
    divineMiningAchievements: `divineMiningAchievements_${telegramId}`,
    divineMiningUpgrades: `divineMiningUpgrades_${telegramId}`,
    divineMiningHighScore: `divineMiningHighScore_${telegramId}`,
    
    // Additional user-specific data
    divineMiningPrestigeMultiplier: `divineMiningPrestigeMultiplier_${telegramId}`,
    divineMiningReferralData: `divineMiningReferralData_${telegramId}`,
    divineMiningCompletedTasks: `divineMiningCompletedTasks_${telegramId}`,
    divineMiningStreak: `divineMiningStreak_${telegramId}`,
    spiritualEssencePoints: `spiritualEssencePoints_${telegramId}`,
    divineMiningGems: `divineMiningGems_${telegramId}`,
    divineMiningBoosts: `divineMiningBoosts_${telegramId}`,
    
    // Mining section data
    mining_state: `mining_state_${telegramId}`,
    
    // Other game data
    frog_miner_data: `frog_miner_data_${telegramId}`,
  };
};

// Check if a key is user-specific
export const isUserSpecificKey = (key: string): boolean => {
  const userSpecificPatterns = [
    /^divineMining.*_\d+$/,
    /^spiritualEssencePoints_\d+$/,
    /^divineMiningGems_\d+$/,
    /^divineMiningBoosts_\d+$/,
    /^mining_state_\d+$/,
    /^frog_miner_data_\d+$/,
  ];
  
  return userSpecificPatterns.some(pattern => pattern.test(key));
};

// Get all user-specific keys for a user
export const getAllUserKeys = (telegramId: string): string[] => {
  const keys = getUserSpecificKeys(telegramId);
  return Object.values(keys);
};

// Clear all data for a specific user
export const clearUserData = (telegramId: string): boolean => {
  try {
    console.log(`🗑️ Clearing all data for user: ${telegramId}`);
    
    const userKeys = getAllUserKeys(telegramId);
    let clearedCount = 0;
    
    userKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    
    console.log(`✅ Cleared ${clearedCount} data entries for user ${telegramId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing data for user ${telegramId}:`, error);
    return false;
  }
};

// Validate user data isolation
export const validateUserDataIsolation = (telegramId: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  try {
    // Check if any non-user-specific keys contain data
    const allKeys = Object.keys(localStorage);
    const userKeys = getAllUserKeys(telegramId);
    
    // Check for non-user-specific divine mining keys
    const nonUserSpecificKeys = allKeys.filter(key => 
      key.startsWith('divineMining') && 
      !isUserSpecificKey(key) &&
      localStorage.getItem(key)
    );
    
    if (nonUserSpecificKeys.length > 0) {
      issues.push(`Found non-user-specific keys with data: ${nonUserSpecificKeys.join(', ')}`);
    }
    
    // Check if user-specific keys exist and contain data
    const userKeysWithData = userKeys.filter(key => localStorage.getItem(key));
    
    if (userKeysWithData.length === 0) {
      issues.push('No user-specific data found');
    } else {
      console.log(`✅ Found ${userKeysWithData.length} user-specific data entries`);
    }
    
    // Validate data integrity
    userKeysWithData.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data); // Test if data is valid JSON
        }
      } catch (error) {
        issues.push(`Invalid JSON in key ${key}: ${error}`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
    
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    return { isValid: false, issues };
  }
};

// Migrate old non-user-specific data to user-specific keys
export const migrateToUserSpecificKeys = (telegramId: string): { success: boolean; migrated: number; errors: string[] } => {
  const errors: string[] = [];
  let migratedCount = 0;
  
  try {
    console.log(`🔄 Migrating data to user-specific keys for user: ${telegramId}`);
    
    const migrationMap = {
      'divineMiningGame': `divineMiningGame_${telegramId}`,
      'divineMiningGame_backup': `divineMiningGame_backup_${telegramId}`,
      'divineMiningPoints': `divineMiningPoints_${telegramId}`,
      'divineMiningTotalEarned': `divineMiningTotalEarned_${telegramId}`,
      'divineMiningSession': `divineMiningSession_${telegramId}`,
      'divineMiningTutorial': `divineMiningTutorial_${telegramId}`,
      'divineMiningAchievements': `divineMiningAchievements_${telegramId}`,
      'divineMiningUpgrades': `divineMiningUpgrades_${telegramId}`,
      'divineMiningHighScore': `divineMiningHighScore_${telegramId}`,
      'divineMiningPrestigeMultiplier': `divineMiningPrestigeMultiplier_${telegramId}`,
    };
    
    Object.entries(migrationMap).forEach(([oldKey, newKey]) => {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        try {
          // Check if user-specific key already exists
          const existingData = localStorage.getItem(newKey);
          if (!existingData) {
            // Migrate data
            localStorage.setItem(newKey, oldData);
            localStorage.removeItem(oldKey);
            migratedCount++;
            console.log(`✅ Migrated ${oldKey} -> ${newKey}`);
          } else {
            console.log(`⏭️ Skipped ${oldKey} - ${newKey} already exists`);
          }
        } catch (error) {
          errors.push(`Failed to migrate ${oldKey}: ${error}`);
        }
      }
    });
    
    console.log(`✅ Migration completed: ${migratedCount} items migrated`);
    return { success: errors.length === 0, migrated: migratedCount, errors };
    
  } catch (error) {
    errors.push(`Migration error: ${error}`);
    return { success: false, migrated: migratedCount, errors };
  }
};

// Get data summary for a user
export const getUserDataSummary = (telegramId: string): { key: string; size: number; hasData: boolean }[] => {
  const userKeys = getAllUserKeys(telegramId);
  
  return userKeys.map(key => {
    const data = localStorage.getItem(key);
    return {
      key,
      size: data ? data.length : 0,
      hasData: !!data
    };
  });
};

// Check for data leakage between users
export const checkForDataLeakage = (currentTelegramId: string): { hasLeakage: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  try {
    const allKeys = Object.keys(localStorage);
    const currentUserKeys = getAllUserKeys(currentTelegramId);
    
    // Check for other users' data
    const otherUserKeys = allKeys.filter(key => 
      isUserSpecificKey(key) && 
      !currentUserKeys.includes(key) &&
      localStorage.getItem(key)
    );
    
    if (otherUserKeys.length > 0) {
      issues.push(`Found data from other users: ${otherUserKeys.length} keys`);
      issues.push(`Other user keys: ${otherUserKeys.slice(0, 5).join(', ')}${otherUserKeys.length > 5 ? '...' : ''}`);
    }
    
    // Check for non-user-specific divine mining data
    const nonUserSpecificData = allKeys.filter(key => 
      key.startsWith('divineMining') && 
      !isUserSpecificKey(key) &&
      localStorage.getItem(key)
    );
    
    if (nonUserSpecificData.length > 0) {
      issues.push(`Found non-user-specific divine mining data: ${nonUserSpecificData.join(', ')}`);
    }
    
    return {
      hasLeakage: issues.length > 0,
      issues
    };
    
  } catch (error) {
    issues.push(`Leakage check error: ${error}`);
    return { hasLeakage: true, issues };
  }
};

// Secure data access with user validation
export const secureGetItem = (key: string, telegramId: string): string | null => {
  if (!telegramId) {
    console.warn('No telegram ID provided for secure data access');
    return null;
  }
  
  // Ensure key is user-specific
  if (!isUserSpecificKey(key)) {
    console.warn(`Attempting to access non-user-specific key: ${key}`);
    return null;
  }
  
  // Validate key belongs to current user
  const userKeys = getAllUserKeys(telegramId);
  if (!userKeys.includes(key)) {
    console.warn(`Attempting to access key not belonging to user: ${key}`);
    return null;
  }
  
  return localStorage.getItem(key);
};

// Secure data storage with user validation
export const secureSetItem = (key: string, value: string, telegramId: string): boolean => {
  if (!telegramId) {
    console.warn('No telegram ID provided for secure data storage');
    return false;
  }
  
  // Ensure key is user-specific
  if (!isUserSpecificKey(key)) {
    console.warn(`Attempting to store data in non-user-specific key: ${key}`);
    return false;
  }
  
  // Validate key belongs to current user
  const userKeys = getAllUserKeys(telegramId);
  if (!userKeys.includes(key)) {
    console.warn(`Attempting to store data in key not belonging to user: ${key}`);
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error storing data in ${key}:`, error);
    return false;
  }
};

// Debug function to show all user data
export const debugUserData = (telegramId: string): string => {
  const summary = getUserDataSummary(telegramId);
  const validation = validateUserDataIsolation(telegramId);
  const leakage = checkForDataLeakage(telegramId);
  
  const report = `
=== USER DATA ISOLATION DEBUG REPORT ===
User: ${telegramId}
Timestamp: ${new Date().toISOString()}

DATA SUMMARY:
${summary.map(item => 
  `${item.key}: ${item.hasData ? `✅ ${item.size} bytes` : '❌ No data'}`
).join('\n')}

VALIDATION:
- Is Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}
${validation.issues.length > 0 ? `- Issues:\n${validation.issues.map(issue => `  • ${issue}`).join('\n')}` : ''}

LEAKAGE CHECK:
- Has Leakage: ${leakage.hasLeakage ? '❌ Yes' : '✅ No'}
${leakage.issues.length > 0 ? `- Issues:\n${leakage.issues.map(issue => `  • ${issue}`).join('\n')}` : ''}

=== END REPORT ===
  `;
  
  return report;
};

// Export all functions
export default {
  getUserSpecificKeys,
  isUserSpecificKey,
  getAllUserKeys,
  clearUserData,
  validateUserDataIsolation,
  migrateToUserSpecificKeys,
  getUserDataSummary,
  checkForDataLeakage,
  secureGetItem,
  secureSetItem,
  debugUserData
}; 