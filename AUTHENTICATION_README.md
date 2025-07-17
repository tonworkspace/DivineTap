# Divine Mining Authentication System

A comprehensive authentication system built specifically for the Divine Mining Telegram Mini App, featuring user management, game data persistence, daily rewards, achievements, and social features.

## 🚀 Features

### Core Authentication
- **Telegram Integration**: Seamless authentication using Telegram's WebApp API
- **User Management**: Automatic user creation and profile management
- **Session Management**: Persistent sessions with automatic refresh
- **Real-time Updates**: Live synchronization of user data

### Game Integration
- **Divine Points**: In-game currency management
- **Mining Levels**: Experience and level progression system
- **Energy System**: Energy management with regeneration
- **Upgrade Tracking**: Persistent upgrade levels and effects
- **Achievement System**: Unlockable achievements with rewards

### Social Features
- **Referral System**: User referral tracking and rewards
- **Team Management**: Team volume and referral statistics
- **Premium Features**: Premium membership support

### Daily Rewards
- **Login Streaks**: Consecutive login bonuses
- **Daily Rewards**: Configurable daily reward system
- **Streak Bonuses**: Increasing rewards for consistent play

## 📦 Installation

### 1. Database Setup

The authentication system requires several database tables. Run the setup script to create them:

```typescript
import { setupDivineAuth } from '@/setupAuth';

// Run this once during app initialization
await setupDivineAuth();
```

### 2. App Integration

Wrap your app with the `AuthProvider`:

```tsx
// App.tsx
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}
```

## 🔧 Usage

### Basic Authentication

```tsx
import { useAuth, useUser, useAuthStatus } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useUser();
  const { isAuthenticated, isLoading, error } = useAuthStatus();
  const { login, logout, refreshUser } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Divine Points: {user?.divine_points}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Game Data Integration

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useGameUser } from '@/contexts/AuthContext';

function GameComponent() {
  const { updateUser, syncGameData } = useAuth();
  const gameUser = useGameUser();

  const handleMining = async () => {
    // Update game state
    await updateUser({
      is_mining: true,
      mining_started_at: new Date().toISOString(),
      divine_points: gameUser.divinePoints + 10
    });

    // Sync detailed game data
    await syncGameData({
      divinePoints: gameUser.divinePoints + 10,
      currentEnergy: gameUser.energy - 1,
      isMining: true,
      version: '1.0.0'
    });
  };

  return (
    <div>
      <p>Points: {gameUser.divinePoints}</p>
      <p>Energy: {gameUser.energy}/{gameUser.maxEnergy}</p>
      <button onClick={handleMining}>Start Mining</button>
    </div>
  );
}
```

### Daily Rewards

```tsx
import { useAuth } from '@/contexts/AuthContext';

function DailyRewardComponent() {
  const { claimDailyReward } = useAuth();

  const handleClaim = async () => {
    const result = await claimDailyReward();
    
    if (result.success) {
      console.log(`Claimed ${result.reward} points!`);
    } else {
      console.log(result.message);
    }
  };

  return (
    <button onClick={handleClaim}>
      Claim Daily Reward
    </button>
  );
}
```

### Referral System

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ReferralComponent() {
  const { getReferralCode, processReferral } = useAuth();
  const referralCode = getReferralCode();

  const handleReferral = async (code: string) => {
    const success = await processReferral(code);
    if (success) {
      console.log('Referral processed successfully!');
    }
  };

  return (
    <div>
      <p>Your referral code: {referralCode}</p>
      <button onClick={() => handleReferral('DIVINE123')}>
        Use Referral Code
      </button>
    </div>
  );
}
```

## 📊 Database Schema

### Users Table
The main users table includes all game-related fields:

```sql
-- Core user fields
id, telegram_id, username, first_name, last_name, photo_url, language_code
created_at, last_active, is_active

-- Game data
divine_points, total_earned, mining_level, mining_experience
energy, max_energy, energy_regen_rate
login_streak, last_login_date, last_daily_reward

-- Game state
is_mining, mining_started_at, last_save_time, game_version

-- Progression
upgrade_levels (JSONB), achievements (TEXT[]), owned_skins (TEXT[]), active_skin

-- Social features
referrer_id, referrer_username, referrals_count, team_volume

-- Premium features
is_premium, premium_expires_at
```

### Additional Tables
- `game_data`: Detailed game state storage
- `user_achievements`: Achievement tracking
- `daily_rewards`: Daily reward claim history
- `referral_tracking`: Detailed referral analytics

## 🎮 Game Data Integration

### Syncing Game State

The authentication system provides seamless integration with your existing Divine Mining game:

```tsx
// In your DivineMiningGame component
import { useAuth } from '@/contexts/AuthContext';

export const DivineMiningGame: React.FC = () => {
  const { user, updateUser, syncGameData } = useAuth();
  
  // Sync game state with authentication system
  useEffect(() => {
    if (user && gameState) {
      syncGameData({
        divinePoints: gameState.divinePoints,
        currentEnergy: gameState.currentEnergy,
        maxEnergy: gameState.maxEnergy,
        isMining: gameState.isMining,
        miningLevel: gameState.miningLevel,
        version: gameState.version
      });
    }
  }, [gameState, user]);

  // Update user data when game state changes
  const handleMiningToggle = async () => {
    await updateUser({
      is_mining: !user?.is_mining,
      mining_started_at: !user?.is_mining ? new Date().toISOString() : null
    });
  };

  return (
    // Your existing game UI
  );
};
```

### Migration from Existing System

To migrate from your existing authentication system:

1. **Update imports**: Replace `useAuth` from `@/hooks/useAuth` with `useAuth` from `@/contexts/AuthContext`
2. **Wrap with provider**: Add `AuthProvider` to your app
3. **Update data access**: Use the new user structure with `divine_points`, `mining_level`, etc.
4. **Sync game data**: Use `syncGameData` to persist game state

## 🔒 Security Features

- **Telegram Validation**: All authentication is validated through Telegram's WebApp API
- **Database Security**: Row-level security and proper access controls
- **Data Validation**: Input validation and sanitization
- **Session Management**: Secure session handling with automatic cleanup

## 📈 Performance Optimizations

- **Debounced Updates**: User data updates are debounced to prevent excessive API calls
- **Real-time Sync**: Efficient real-time synchronization using Supabase subscriptions
- **Caching**: Smart caching of user data and game state
- **Lazy Loading**: Components only load when needed

## 🛠️ Configuration

### Environment Variables

Ensure your `.env` file includes:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Customization

You can customize various aspects of the authentication system:

```typescript
// Custom daily reward configuration
import { dailyRewards } from '@/lib/gameData';

// Custom achievement definitions
import { achievements } from '@/lib/gameData';

// Custom level progression
import { getLevel, getNextLevel } from '@/lib/gameData';
```

## 🧪 Testing

The authentication system includes comprehensive error handling and logging:

```typescript
// Check authentication status
const { isAuthenticated, isLoading, error } = useAuthStatus();

// Handle errors gracefully
if (error) {
  console.error('Auth error:', error);
  // Show user-friendly error message
}
```

## 📱 Telegram Mini App Integration

The system is specifically designed for Telegram Mini Apps:

- **Automatic Login**: Users are automatically authenticated when opening the app
- **Profile Data**: Access to user's Telegram profile information
- **Referral Links**: Support for Telegram's start parameter system
- **WebApp API**: Full integration with Telegram's WebApp features

## 🚀 Getting Started

1. **Run Setup**: Execute the setup script to create database tables
2. **Add Provider**: Wrap your app with `AuthProvider`
3. **Update Components**: Replace existing auth hooks with new ones
4. **Test Integration**: Verify authentication and game data sync
5. **Deploy**: Deploy your updated app

## 📞 Support

For issues or questions about the authentication system:

1. Check the console for error messages
2. Verify database migrations completed successfully
3. Ensure all environment variables are set correctly
4. Test with a fresh Telegram user account

## 🔄 Migration Guide

### From useGameAuth.tsx

Replace:
```tsx
import { useAuth } from '@/hooks/useGameAuth';
```

With:
```tsx
import { useAuth } from '@/contexts/AuthContext';
```

### From useAuth.ts

Replace:
```tsx
import { useAuth } from '@/hooks/useAuth';
```

With:
```tsx
import { useAuth } from '@/contexts/AuthContext';
```

The new system provides enhanced features while maintaining compatibility with existing game logic. 