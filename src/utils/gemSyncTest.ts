// Gem Synchronization Test Utility
// This utility tests that gems are properly synchronized across all game components

// Helper function to get user-specific localStorage key
const getUserSpecificKey = (baseKey: string, userId?: string) => {
  if (!userId) return baseKey;
  return `${baseKey}_${userId}`;
};

export interface GemSyncTestResult {
  passed: boolean;
  issues: string[];
  results: {
    gameContextGems: number;
    localStorageGems: number;
    headerDisplayGems: number;
    leaderboardGems: number;
    taskCenterGems: number;
  };
}

export const testGemSynchronization = (userId?: string): GemSyncTestResult => {
  const issues: string[] = [];
  
  // Test 1: Check localStorage gem value
  const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
  const localStorageValue = localStorage.getItem(userGemsKey);
  const localStorageGems = localStorageValue ? parseInt(localStorageValue, 10) : 0;
  
  // Test 2: Check GameContext (we'll simulate this since we can't access React context here)
  // This would be checked by the actual components using the context
  
  // Test 3: Check if all components should have consistent values
  // We'll return the values for manual verification
  
  if (isNaN(localStorageGems)) {
    issues.push('localStorage gem value is NaN');
  }
  
  if (localStorageGems < 0) {
    issues.push('localStorage gem value is negative');
  }
  
  // Test 4: Check if gem value is reasonable (not extremely high which might indicate a bug)
  if (localStorageGems > 1000000) {
    issues.push('localStorage gem value is suspiciously high (>1M)');
  }
  
  const results = {
    gameContextGems: -1, // This would be populated by the calling component
    localStorageGems: localStorageGems,
    headerDisplayGems: -1, // This would be populated by the header component
    leaderboardGems: -1, // This would be populated by the leaderboard component
    taskCenterGems: -1, // This would be populated by the task center component
  };
  
  return {
    passed: issues.length === 0,
    issues,
    results
  };
};

// Test gem addition across all components
export const testGemAddition = (userId?: string, amountToAdd: number = 10): void => {
  const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
  
  // Get current gems
  const currentGems = parseInt(localStorage.getItem(userGemsKey) || '0', 10);
  
  // Add gems directly to localStorage (simulating gem addition)
  const newGems = currentGems + amountToAdd;
  localStorage.setItem(userGemsKey, newGems.toString());
  
  // Dispatch global gem update event
  window.dispatchEvent(new CustomEvent('gemsUpdated', { 
    detail: { gems: newGems, amount: amountToAdd } 
  }));
  
  console.log('🧪 Test: Added', amountToAdd, 'gems. New total:', newGems);
};

// Test gem synchronization after tab switch
export const testTabSwitchSync = (userId?: string): void => {
  const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
  
  // Simulate external gem change (like from another tab)
  const currentGems = parseInt(localStorage.getItem(userGemsKey) || '0', 10);
  const testGems = currentGems + 25;
  
  // Change localStorage directly (simulating another tab)
  localStorage.setItem(userGemsKey, testGems.toString());
  
  // Dispatch storage event (simulating cross-tab communication)
  window.dispatchEvent(new StorageEvent('storage', {
    key: userGemsKey,
    newValue: testGems.toString(),
    oldValue: currentGems.toString()
  }));
  
  console.log('🧪 Test: Simulated external gem change. New total:', testGems);
};

// Debug function to log all gem-related localStorage keys
export const debugGemStorage = (userId?: string): void => {
  const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
  
  console.log('🐛 Debug: Gem storage analysis');
  console.log('User ID:', userId);
  console.log('Gem key:', userGemsKey);
  console.log('Gem value:', localStorage.getItem(userGemsKey));
  
  // Check for any gem-related keys
  const allKeys = Object.keys(localStorage);
  const gemKeys = allKeys.filter(key => key.includes('gem') || key.includes('Gem'));
  
  console.log('All gem-related keys:', gemKeys);
  gemKeys.forEach(key => {
    console.log(`  ${key}: ${localStorage.getItem(key)}`);
  });
};

// Function to reset gems for testing
export const resetGemsForTesting = (userId?: string, amount: number = 10): void => {
  const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
  
  localStorage.setItem(userGemsKey, amount.toString());
  
  // Dispatch global gem update event
  window.dispatchEvent(new CustomEvent('gemsUpdated', { 
    detail: { gems: amount, amount: 0 } 
  }));
  
  console.log('🧪 Test: Reset gems to', amount);
};

// Make functions available globally for testing in console
declare global {
  interface Window {
    testGemSync: typeof testGemSynchronization;
    testGemAdd: typeof testGemAddition;
    testTabSync: typeof testTabSwitchSync;
    debugGems: typeof debugGemStorage;
    resetGems: typeof resetGemsForTesting;
  }
}

// Attach to window for console testing
if (typeof window !== 'undefined') {
  window.testGemSync = testGemSynchronization;
  window.testGemAdd = testGemAddition;
  window.testTabSync = testTabSwitchSync;
  window.debugGems = debugGemStorage;
  window.resetGems = resetGemsForTesting;
} 