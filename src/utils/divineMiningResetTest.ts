// Divine Mining Reset Test Utilities
// This file provides testing functions for the reset functionality and user data isolation

import { clearUserData, validateUserDataIsolation, checkForDataLeakage, getUserSpecificKeys, getAllUserKeys } from './userDataIsolation';

export interface ResetTestResult {
  success: boolean;
  message: string;
  details: {
    userKeysCleared: number;
    validationPassed: boolean;
    noLeakage: boolean;
    resetFlagSet: boolean;
    sessionStorageCleared: boolean;
    cacheCleared: boolean;
  };
}

/**
 * Test the reset functionality for a specific user
 * @param telegramId - The user's telegram ID
 * @returns Test result with details
 */
export const testUserReset = (telegramId: string): ResetTestResult => {
  try {
    console.log(`🧪 Testing reset functionality for user: ${telegramId}`);
    
    // Step 1: Check initial state
    const initialValidation = validateUserDataIsolation(telegramId);
    const initialLeakage = checkForDataLeakage(telegramId);
    
    console.log('Initial state:', {
      validationPassed: initialValidation.isValid,
      hasLeakage: initialLeakage.hasLeakage
    });
    
    // Step 2: Perform reset
    const clearSuccess = clearUserData(telegramId);
    
    if (!clearSuccess) {
      return {
        success: false,
        message: 'Failed to clear user data',
        details: {
          userKeysCleared: 0,
          validationPassed: false,
          noLeakage: false,
          resetFlagSet: false,
          sessionStorageCleared: false,
          cacheCleared: false
        }
      };
    }
    
    // Step 3: Verify reset
    const postResetValidation = validateUserDataIsolation(telegramId);
    const postResetLeakage = checkForDataLeakage(telegramId);
    
    // Step 4: Check if user-specific keys are empty
    const userKeys = getUserSpecificKeys(telegramId);
    const userKeysWithData = Object.values(userKeys).filter(key => 
      localStorage.getItem(key)
    );
    
    const resetComplete = userKeysWithData.length === 0;
    
    // Step 5: Check sessionStorage
    const sessionStorageCleared = sessionStorage.length === 0;
    
    // Step 6: Check if reset flag was set
    const resetFlagSet = localStorage.getItem(`RESET_FLAG_${telegramId}`) !== null;
    
    // Step 7: Check cache clearing (simulated)
    const cacheCleared = true; // We can't actually check cache in this context
    
    const result: ResetTestResult = {
      success: resetComplete && postResetValidation.isValid && !postResetLeakage.hasLeakage,
      message: resetComplete 
        ? 'Reset test completed successfully' 
        : 'Reset test failed - data still present',
      details: {
        userKeysCleared: Object.values(userKeys).length - userKeysWithData.length,
        validationPassed: postResetValidation.isValid,
        noLeakage: !postResetLeakage.hasLeakage,
        resetFlagSet,
        sessionStorageCleared,
        cacheCleared
      }
    };
    
    console.log('Reset test result:', result);
    return result;
    
  } catch (error) {
    console.error('Reset test error:', error);
    return {
      success: false,
      message: `Test error: ${error}`,
      details: {
        userKeysCleared: 0,
        validationPassed: false,
        noLeakage: false,
        resetFlagSet: false,
        sessionStorageCleared: false,
        cacheCleared: false
      }
    };
  }
};

/**
 * Enhanced reset test that creates test data first, then clears it
 * @param telegramId - The user's telegram ID
 * @returns Test result with details
 */
export const testEnhancedReset = (telegramId: string): ResetTestResult => {
  try {
    console.log(`🧪 Testing enhanced reset functionality for user: ${telegramId}`);
    
    // Step 1: Create comprehensive test data
    const testData = {
      divinePoints: 999999,
      pointsPerSecond: 100,
      upgradesPurchased: 50,
      isMining: true,
      highScore: 999999,
      allTimeHighScore: 999999,
      currentEnergy: 5000,
      maxEnergy: 5000,
      lastEnergyRegen: Date.now(),
      offlineEfficiencyBonus: 2.0,
      lastOfflineTime: Date.now(),
      unclaimedOfflineRewards: 10000,
      lastOfflineRewardTime: Date.now(),
      miningLevel: 100,
      miningCombo: 5.0,
      miningStreak: 30,
      miningExperience: 50000,
      miningExperienceToNext: 100000,
      totalEarned24h: 50000,
      totalEarned7d: 200000,
      minersActive: 10,
      lastSaveTime: Date.now(),
      sessionStartTime: Date.now(),
      totalPointsEarned: 999999,
      lastDailyReset: new Date().toDateString(),
      lastWeeklyReset: new Date().toDateString(),
      version: '2.0.0'
    };
    
    // Step 2: Define all possible keys to test
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
    
    // Step 3: Populate all keys with test data
    console.log('📝 Creating comprehensive test data...');
    allPossibleKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(testData));
    });
    
    // Add sessionStorage data
    sessionStorage.setItem('test_session_data', JSON.stringify(testData));
    
    // Step 4: Verify test data was created
    const initialValidation = validateUserDataIsolation(telegramId);
    const initialLeakage = checkForDataLeakage(telegramId);
    const initialKeys = getAllUserKeys(telegramId);
    
    console.log('Initial state:', {
      validationPassed: initialValidation.isValid,
      hasLeakage: initialLeakage.hasLeakage,
      userKeysFound: initialKeys.length,
      totalKeysCreated: allPossibleKeys.length
    });
    
    // Step 5: Perform enhanced reset
    const clearSuccess = clearUserData(telegramId);
    
    if (!clearSuccess) {
      return {
        success: false,
        message: 'Failed to clear user data',
        details: {
          userKeysCleared: 0,
          validationPassed: false,
          noLeakage: false,
          resetFlagSet: false,
          sessionStorageCleared: false,
          cacheCleared: false
        }
      };
    }
    
    // Step 6: Verify comprehensive clearing
    const finalValidation = validateUserDataIsolation(telegramId);
    const finalLeakage = checkForDataLeakage(telegramId);
    const finalKeys = getAllUserKeys(telegramId);
    
    // Check if sessionStorage was cleared
    const sessionStorageCleared = sessionStorage.length === 0;
    
    // Check if reset flag was set
    const resetFlagSet = localStorage.getItem(`RESET_FLAG_${telegramId}`) !== null;
    
    // Check if cache was cleared (simulated)
    const cacheCleared = true;
    
    const result: ResetTestResult = {
      success: finalKeys.length === 0 && finalValidation.isValid && !finalLeakage.hasLeakage,
      message: finalKeys.length === 0 
        ? 'Enhanced reset test completed successfully' 
        : `Enhanced reset test failed - ${finalKeys.length} keys still present`,
      details: {
        userKeysCleared: initialKeys.length - finalKeys.length,
        validationPassed: finalValidation.isValid,
        noLeakage: !finalLeakage.hasLeakage,
        resetFlagSet,
        sessionStorageCleared,
        cacheCleared
      }
    };
    
    console.log('Enhanced reset test result:', result);
    return result;
    
  } catch (error) {
    console.error('Enhanced reset test error:', error);
    return {
      success: false,
      message: `Enhanced test error: ${error}`,
      details: {
        userKeysCleared: 0,
        validationPassed: false,
        noLeakage: false,
        resetFlagSet: false,
        sessionStorageCleared: false,
        cacheCleared: false
      }
    };
  }
};

/**
 * Test user data isolation between two users
 * @param user1Id - First user's telegram ID
 * @param user2Id - Second user's telegram ID
 * @returns Test result with details
 */
export const testUserIsolation = (user1Id: string, user2Id: string): ResetTestResult => {
  try {
    console.log(`🧪 Testing user data isolation between ${user1Id} and ${user2Id}`);
    
    // Step 1: Clear both users' data
    clearUserData(user1Id);
    clearUserData(user2Id);
    
    // Step 2: Create test data for user 1
    const user1Data = { user: 'user1', points: 1000, level: 10 };
    const user1Keys = getUserSpecificKeys(user1Id);
    Object.values(user1Keys).forEach(key => {
      localStorage.setItem(key, JSON.stringify(user1Data));
    });
    
    // Step 3: Create test data for user 2
    const user2Data = { user: 'user2', points: 2000, level: 20 };
    const user2Keys = getUserSpecificKeys(user2Id);
    Object.values(user2Keys).forEach(key => {
      localStorage.setItem(key, JSON.stringify(user2Data));
    });
    
    // Step 4: Verify isolation
    const user1Validation = validateUserDataIsolation(user1Id);
    const user2Validation = validateUserDataIsolation(user2Id);
    const user1Leakage = checkForDataLeakage(user1Id);
    const user2Leakage = checkForDataLeakage(user2Id);
    
    // Step 5: Check if users can access each other's data
    const user1KeysWithData = Object.values(user1Keys).filter(key => 
      localStorage.getItem(key)
    );
    const user2KeysWithData = Object.values(user2Keys).filter(key => 
      localStorage.getItem(key)
    );
    
    const isolationValid = user1KeysWithData.length > 0 && user2KeysWithData.length > 0 &&
                          user1Validation.isValid && user2Validation.isValid &&
                          !user1Leakage.hasLeakage && !user2Leakage.hasLeakage;
    
    const result: ResetTestResult = {
      success: isolationValid,
      message: isolationValid 
        ? 'User data isolation test passed' 
        : 'User data isolation test failed',
      details: {
        userKeysCleared: 0,
        validationPassed: user1Validation.isValid && user2Validation.isValid,
        noLeakage: !user1Leakage.hasLeakage && !user2Leakage.hasLeakage,
        resetFlagSet: false,
        sessionStorageCleared: false,
        cacheCleared: false
      }
    };
    
    console.log('User isolation test result:', result);
    return result;
    
  } catch (error) {
    console.error('User isolation test error:', error);
    return {
      success: false,
      message: `Isolation test error: ${error}`,
      details: {
        userKeysCleared: 0,
        validationPassed: false,
        noLeakage: false,
        resetFlagSet: false,
        sessionStorageCleared: false,
        cacheCleared: false
      }
    };
  }
};

/**
 * Run comprehensive reset tests
 * @param testUserId - Test user ID to use
 * @returns Summary of all test results
 */
export const runComprehensiveResetTests = (testUserId: string) => {
  console.log('🧪 Running comprehensive reset tests...');
  
  const results = {
    basicReset: testUserReset(testUserId),
    enhancedReset: testEnhancedReset(testUserId),
    isolation: testUserIsolation(testUserId, `${testUserId}_test`)
  };
  
  const allPassed = results.basicReset.success && 
                   results.enhancedReset.success && 
                   results.isolation.success;
  
  console.log('📊 Comprehensive test results:', {
    allTestsPassed: allPassed,
    basicReset: results.basicReset.success,
    enhancedReset: results.enhancedReset.success,
    isolation: results.isolation.success
  });
  
  return {
    success: allPassed,
    results
  };
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testUserReset = testUserReset;
  (window as any).testEnhancedReset = testEnhancedReset;
  (window as any).testUserIsolation = testUserIsolation;
  (window as any).runComprehensiveResetTests = runComprehensiveResetTests;
  
  console.log('🧪 Reset test functions available globally:');
  console.log('- testUserReset(telegramId)');
  console.log('- testEnhancedReset(telegramId)');
  console.log('- testUserIsolation(user1Id, user2Id)');
  console.log('- runComprehensiveResetTests(testUserId)');
} 