# Divine Mining Game - Migration Guide

This guide helps you implement the new Divine Mining game schema in your existing application.

## Step 1: Database Setup

1. **Run the schema** in your Supabase database:
   ```sql
   -- Execute the entire divine_mining_schema.sql file
   ```

2. **Verify tables were created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE '%user_%';
   ```

## Step 2: Application Integration

### Update your React components to use the new schema:

#### 1. Save Game Data Function
```typescript
// In your game component
const saveGameData = async (gameState: GameState) => {
  const { error } = await supabase
    .from('user_game_data')
    .upsert({
      user_id: user.id,
      game_data: gameState,
      last_updated: new Date().toISOString()
    });
    
  if (error) console.error('Error saving game data:', error);
};
```

#### 2. Load Game Data Function
```typescript
const loadGameData = async () => {
  const { data, error } = await supabase
    .from('user_game_data')
    .select('game_data, last_updated')
    .eq('user_id', user.id)
    .single();
    
  if (data) {
    setGameState(data.game_data);
  }
};
```

#### 3. Track Upgrades
```typescript
const purchaseUpgrade = async (upgrade: Upgrade) => {
  // Insert/update upgrade record
  const { error } = await supabase
    .from('user_upgrades')
    .upsert({
      user_id: user.id,
      upgrade_id: upgrade.id,
      upgrade_name: upgrade.name,
      level: upgrade.level + 1,
      total_cost: calculateTotalCost(upgrade),
      effect_value: upgrade.effectValue,
      last_upgraded: new Date().toISOString()
    });
    
  if (!error) {
    // Update game state
    setGameState(prev => ({
      ...prev,
      divinePoints: prev.divinePoints - cost,
      upgradesPurchased: prev.upgradesPurchased + 1
    }));
  }
};
```

#### 4. Achievement System
```typescript
const checkAchievements = async (gameState: GameState) => {
  const achievements = [
    {
      id: 'first-mining',
      name: 'First Mining',
      description: 'Start mining for the first time',
      condition: (state) => state.totalPointsEarned > 0
    },
    // ... more achievements
  ];
  
  for (const achievement of achievements) {
    if (achievement.condition(gameState)) {
      await supabase
        .from('user_achievements')
        .upsert({
          user_id: user.id,
          achievement_id: achievement.id,
          achievement_name: achievement.name,
          description: achievement.description,
          unlocked: true,
          unlocked_at: new Date().toISOString()
        });
    }
  }
};
```

#### 5. Mining Session Tracking
```typescript
const startMiningSession = async () => {
  const { data, error } = await supabase
    .from('mining_sessions')
    .insert({
      user_id: user.id,
      session_start: new Date().toISOString(),
      is_active: true
    })
    .select()
    .single();
    
  if (data) {
    setCurrentSessionId(data.id);
  }
};

const endMiningSession = async (sessionId: string, pointsEarned: number) => {
  await supabase
    .from('mining_sessions')
    .update({
      session_end: new Date().toISOString(),
      points_earned: pointsEarned,
      is_active: false
    })
    .eq('id', sessionId);
};
```

## Step 3: Leaderboard Implementation

### Create a leaderboard component:
```typescript
const LeaderboardComponent = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('divine_points_leaderboard')
        .select('*')
        .limit(100);
        
      if (data) setLeaderboard(data);
    };
    
    fetchLeaderboard();
  }, []);
  
  return (
    <div className="leaderboard">
      {leaderboard.map(player => (
        <div key={player.user_id} className="player-rank">
          <span>#{player.rank}</span>
          <span>{player.username}</span>
          <span>{player.divine_points} points</span>
        </div>
      ))}
    </div>
  );
};
```

## Step 4: Offline Rewards System

```typescript
const processOfflineRewards = async () => {
  const lastActive = localStorage.getItem('lastActiveTime');
  const now = Date.now();
  const offlineSeconds = Math.floor((now - lastActive) / 1000);
  
  if (offlineSeconds > 60) { // More than 1 minute offline
    const baseEarnings = gameState.pointsPerSecond * offlineSeconds;
    const efficiencyBonus = Math.min(offlineSeconds / 86400 * 0.1, 1.4); // 10% per day, max 140%
    
    const { data, error } = await supabase
      .rpc('process_offline_rewards', {
        p_user_id: user.id,
        p_offline_duration_seconds: offlineSeconds,
        p_base_earnings: baseEarnings,
        p_efficiency_bonus: efficiencyBonus
      });
      
    if (data) {
      setShowOfflineRewards(true);
      setOfflineRewardAmount(data.total_earnings);
    }
  }
};
```

## Step 5: Real-time Updates

Set up real-time subscriptions for live updates:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('divine_points_leaderboard')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_game_data'
    }, (payload) => {
      // Update leaderboard in real-time
      refreshLeaderboard();
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
```

## Step 6: Performance Optimization

### Set up periodic tasks:
```typescript
// Refresh leaderboard every 5 minutes
setInterval(async () => {
  await supabase.rpc('refresh_divine_points_leaderboard');
}, 5 * 60 * 1000);

// Auto-save game state every 30 seconds
setInterval(async () => {
  if (gameState.divinePoints > 0) {
    await saveGameData(gameState);
  }
}, 30000);
```

## Step 7: Migration from localStorage

If you have existing localStorage data, create a migration function:

```typescript
const migrateFromLocalStorage = async () => {
  const existingData = localStorage.getItem('divineMiningGame');
  if (existingData) {
    const gameState = JSON.parse(existingData);
    
    // Save to database
    await saveGameData(gameState);
    
    // Clear localStorage
    localStorage.removeItem('divineMiningGame');
    
    console.log('Migration complete!');
  }
};
```

## Step 8: Testing

1. **Test game state persistence** across sessions
2. **Verify leaderboard updates** in real-time
3. **Check offline rewards** calculation
4. **Test achievement unlocks**
5. **Verify upgrade tracking**

## Step 9: Monitoring

Set up monitoring queries:
```sql
-- Check active players
SELECT COUNT(*) FROM user_game_data WHERE is_mining = true;

-- Check average session time
SELECT AVG(EXTRACT(EPOCH FROM (session_end - session_start))) as avg_session_seconds
FROM mining_sessions 
WHERE session_end IS NOT NULL;

-- Check top performers
SELECT username, divine_points FROM divine_points_leaderboard LIMIT 10;
```

## Production Considerations

1. **Backup your database** before running migrations
2. **Test thoroughly** in staging environment
3. **Monitor performance** after deployment
4. **Set up alerts** for database issues
5. **Plan for scaling** as user base grows

## Support

If you encounter any issues during migration:
1. Check the PostgreSQL logs
2. Verify all foreign key constraints
3. Ensure proper indexing for performance
4. Test with a small subset of users first

The schema is designed to be robust and scalable, supporting thousands of concurrent players while maintaining excellent performance through optimized indexing and materialized views. 