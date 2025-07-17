# Divine Mining Game - Reset Functionality Testing Guide

## Overview

This guide explains how to test the enhanced reset functionality in the Divine Mining Game to ensure it properly factory resets all game data.

## 🔧 How to Test Reset Functionality

### **Method 1: Using the Reset Button (Recommended)**

1. **Open the Divine Mining Game** in your browser
2. **Hold Ctrl+Shift** to reveal the reset button
3. **Click "🗑️ RESET GAME DATA"** button
4. **Confirm the reset** in the modal dialog
5. **Wait for completion** (shows "🔄 RESETTING..." status)
6. **Page will automatically reload** with fresh start
7. **Verify reset** - you should start with 100 divine points

### **Method 2: Using the Debug Button**

1. **Hold Ctrl+Shift** to reveal the reset button
2. **Click "🔍 DEBUG RESET"** button (appears below reset button)
3. **Check browser console** for debug information
4. **Review the debug output** to see current game state

### **Method 3: Using Browser Console (Advanced)**

Open browser console (F12) and run these commands:

```javascript
// Test basic reset functionality
const telegramId = 'YOUR_TELEGRAM_ID'; // Replace with your actual ID
testUserReset(telegramId);

// Test enhanced reset with comprehensive data clearing
testEnhancedReset(telegramId);

// Test user data isolation
testUserIsolation('USER1_ID', 'USER2_ID');

// Run all tests at once
runComprehensiveResetTests(telegramId);
```

## 🧪 What the Tests Verify

### **Basic Reset Test**
- ✅ All user-specific localStorage keys cleared
- ✅ SessionStorage cleared
- ✅ Reset flag properly set
- ✅ No data leakage between users

### **Enhanced Reset Test**
- ✅ 100+ possible game data keys cleared
- ✅ Pattern-based clearing (any key with 'divine', 'mining', 'game', 'user')
- ✅ Browser cache cleared
- ✅ Supabase database data cleared
- ✅ Fresh initial state saved

### **User Isolation Test**
- ✅ Users cannot access each other's data
- ✅ No cross-contamination between users
- ✅ User-specific keys properly isolated

## 🔍 Debug Information

When you click the debug button, you'll see:

```
🔍 Debugging user data for: [YOUR_TELEGRAM_ID]
📊 localStorage analysis:
- Total keys: [NUMBER]
- User-specific keys: [NUMBER]
- Game-related keys: [NUMBER]
- User keys found: [LIST_OF_KEYS]
- Game keys found: [LIST_OF_KEYS]
- SessionStorage items: [NUMBER]
🎮 Current game state:
- Divine points: [NUMBER]
- Mining level: [NUMBER]
- Upgrades purchased: [NUMBER]
- Total earned: [NUMBER]
```

## 🚨 Troubleshooting

### **Reset Button Not Visible**
- Make sure you're holding **Ctrl+Shift** simultaneously
- Check if you're logged in with a valid Telegram ID
- Try refreshing the page

### **Reset Not Working**
1. **Check browser console** for error messages
2. **Verify user authentication** - you need a valid telegram_id
3. **Check Supabase connection** - reset tries to clear database data
4. **Clear browser cache manually** if needed

### **Old Data Still Appears After Reset**
1. **Check for reset flag** in console output
2. **Verify URL parameters** - reset should add `?reset=timestamp`
3. **Check localStorage** - all game keys should be cleared
4. **Try hard refresh** (Ctrl+F5) after reset

### **Data Leakage Between Users**
1. **Run isolation tests** using console commands
2. **Check for non-user-specific keys** in debug output
3. **Verify migration completed** successfully
4. **Clear all localStorage** and retry

## 📊 Expected Reset Results

After a successful reset, you should have:

- **Divine Points**: 100 (starting amount)
- **Mining Rate**: 1.0/sec (base rate)
- **Energy**: 1000/1000 (full energy)
- **Level**: 1 (starting level)
- **Upgrades**: 0 (all reset to 0)
- **Achievements**: 0 (all reset)
- **Statistics**: 0 (all reset)
- **Tutorial**: Reset (can be started again)

## 🛡️ Safety Features

The reset functionality includes several safety measures:

- **Confirmation Modal**: Prevents accidental resets
- **Comprehensive Clearing**: Removes ALL possible data sources
- **Reset Flag System**: Prevents loading old data after reset
- **URL Parameter Handling**: Ensures clean state after reload
- **Error Handling**: Graceful failure with user notifications

## 🔧 Advanced Testing

For developers or advanced users:

```javascript
// Import test utilities
import { testEnhancedReset, testUserIsolation } from './src/utils/divineMiningResetTest';

// Test enhanced reset for current user
const telegramId = 'YOUR_TELEGRAM_ID';
const result = testEnhancedReset(telegramId);
console.log('Enhanced Reset Test Result:', result);

// Test user data isolation between two users
const isolationResult = testUserIsolation('USER1_ID', 'USER2_ID');
console.log('User Isolation Test Result:', isolationResult);
```

## 📝 Test Checklist

Before considering the reset functionality "working":

- [ ] Reset button appears when holding Ctrl+Shift
- [ ] Reset confirmation modal shows correct information
- [ ] Reset process completes without errors
- [ ] Page reloads automatically after reset
- [ ] Game starts with 100 divine points
- [ ] All upgrades are reset to 0
- [ ] All achievements are reset
- [ ] Tutorial can be started again
- [ ] No old data persists after reset
- [ ] Debug button shows correct information
- [ ] Console tests pass successfully

## 🆘 Getting Help

If you encounter issues with the reset functionality:

1. **Check the browser console** for error messages
2. **Run the debug tests** using console commands
3. **Verify your Telegram ID** is properly set
4. **Check network connectivity** (for Supabase operations)
5. **Try in a different browser** to rule out browser-specific issues

The reset functionality is designed to be comprehensive and reliable, but if you continue to have issues, the debug information will help identify the specific problem. 