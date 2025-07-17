// Test script to check if the leaderboard database functions are working
const { createClient } = require('@supabase/supabase-js');

// Supabase initialization
const supabaseUrl = "https://nyffqyafaqewddtgcarv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55ZmZxeWFmYXFld2RkdGdjYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjcxMzUsImV4cCI6MjA2NTc0MzEzNX0.3jq9_WbqAl3yrpkI3m6I1P_TQJ55IC5zC6EGz-Y5kFg";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaderboardFunctions() {
  console.log('Testing leaderboard functions...');
  
  try {
    // Test 1: Check if user_game_data table exists and has data
    console.log('\n1. Checking user_game_data table...');
    const { data: tableData, error: tableError } = await supabase
      .from('user_game_data')
      .select('*')
      .limit(5);
    
    if (tableError) {
      console.error('Error accessing user_game_data table:', tableError);
      return;
    }
    
    console.log('user_game_data table data:', tableData);
    console.log('Number of records:', tableData?.length || 0);
    
    // Test 2: Check if users table exists and has data
    console.log('\n2. Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Error accessing users table:', usersError);
      return;
    }
    
    console.log('users table data:', usersData);
    console.log('Number of users:', usersData?.length || 0);
    
    // Test 3: Test the leaderboard query
    console.log('\n3. Testing leaderboard query...');
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('user_game_data')
      .select(`
        user_id,
        game_data,
        last_updated,
        users (
          id,
          telegram_id,
          username,
          first_name,
          last_name,
          created_at,
          last_active
        )
      `)
      .not('game_data->divine_points', 'is', null)
      .order('game_data->divine_points', { ascending: false })
      .limit(10);
    
    if (leaderboardError) {
      console.error('Error in leaderboard query:', leaderboardError);
      return;
    }
    
    console.log('Leaderboard query result:', leaderboardData);
    console.log('Number of leaderboard entries:', leaderboardData?.length || 0);
    
    // Test 4: Check if there are any divine points in the data
    if (leaderboardData && leaderboardData.length > 0) {
      console.log('\n4. Checking divine points data...');
      leaderboardData.forEach((entry, index) => {
        const divinePoints = entry.game_data?.divine_points;
        const userData = Array.isArray(entry.users) ? entry.users[0] : entry.users;
        console.log(`Entry ${index + 1}:`, {
          userId: entry.user_id,
          divinePoints: divinePoints,
          username: userData?.username || 'No username',
          lastUpdated: entry.last_updated
        });
      });
    } else {
      console.log('\n4. No leaderboard data found - this might be the issue!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLeaderboardFunctions(); 