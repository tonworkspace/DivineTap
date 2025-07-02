import { useEffect, useState, useMemo } from 'react';
import { supabase, gmpSystem } from '@/lib/supabaseClient';
import useAuth from '@/hooks/useAuth';
import { FaTrophy, FaInfoCircle } from 'react-icons/fa';
import { getTONPrice } from '@/lib/api';
import { Tooltip } from '@/components/ui/tooltip';

interface GMPEntry {
  position: number | undefined;  // Allow undefined for position
  username: string;
  pool_share: number;
  expected_reward: number;
  total_sbt: number;
  isGap?: boolean;
}

interface PoolStats {
  totalPool: number;
  totalParticipants: number;
  lastDistribution: string;
  totalUsers?: number;
}

interface UserEntry {
  username: string;
  total_sbt: number;
  id: string;
  isGap?: boolean;
  position?: number;
}

const GMPLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GMPEntry[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalPool: 0,
    totalParticipants: 0,
    lastDistribution: '',
    totalUsers: 0
  });
  const [userStats, setUserStats] = useState({
    position: '-',
    shares: 0,
    reward: 0,
    totalShares: 0,
    poolSize: 0
  });
  const [, setTonPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const refreshIntervalTime = 60 * 1000; // 1 minute refresh interval

  // Add caching mechanism
  const cacheKey = useMemo(() => `gmp_data_${user?.id}`, [user?.id]);
  const cacheDuration = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const fetchGMPData = async () => {
      try {
        setLastRefreshed(new Date());
        
        // Check cache first
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheDuration) {
            setEntries(data.entries);
            setUserStats(data.userStats);
            setTonPrice(data.tonPrice);
            setPoolStats(data.poolStats);
            setIsLoading(false);
            return;
          }
        }

        // Get TON price, pool stats, and total users count in parallel
        const [price, poolStatsData, { count }] = await Promise.all([
          getTONPrice(),
          gmpSystem.getPoolStats(),
          supabase.from('users').select('*', { count: 'exact', head: true })
        ]);

        setTonPrice(price);

        // Updated validation to match the actual data structure
        const poolStats = Array.isArray(poolStatsData) ? poolStatsData[0] : poolStatsData;
        
        // Make sure we're getting the count correctly
        console.log('Total users count:', count);
        
        setPoolStats({
          totalPool: poolStats.pool_size || 0,
          totalParticipants: poolStats.active_users || 0,
          lastDistribution: poolStats.last_distribution || '',
          totalUsers: count || 0  // Ensure we're using the count value
        });

        // Fetch all users with pagination to get up to 1000 entries
        let allUsers: UserEntry[] = [];
        let page = 0;
        const pageSize = 500; // Fetch in larger chunks to reduce API calls
        let hasMore = true;

        while (hasMore && allUsers.length < 1000) {
          const { data, error } = await supabase
            .from('users')
            .select('username, total_sbt, id')
            .gt('total_sbt', 0)
            .order('total_sbt', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) {
            throw error;
          }

          if (data && data.length > 0) {
            allUsers = [...allUsers, ...data];
            page++;
          } else {
            hasMore = false;
          }

          // Safety check to prevent infinite loops
          if (page > 10) {
            hasMore = false;
          }
        }

        // Limit to 1000 entries
        allUsers = allUsers.slice(0, 1000);

        let userRank = null;
        
        // If user exists but not in top entries, add them to the list
        if (user?.username) {
          const userInList = allUsers.some(u => u.username === user.username);
          if (!userInList) {
            const { data: userData } = await supabase
              .from('users')
              .select('username, total_sbt, id')
              .eq('username', user.username)
              .single();
              
            if (userData) {
              const { data: rankData } = await supabase.rpc('get_user_rank', { p_username: user.username });
              userRank = rankData as number;

              allUsers.push({
                ...userData,
                position: userRank,
                isGap: true
              });
              // Sort again to maintain order
              allUsers.sort((a, b) => (b.total_sbt || 0) - (a.total_sbt || 0));
            }
          }
        }

        // Calculate total SBT and user stats
        const totalSBT = allUsers.reduce((sum, user) => sum + (Number(user.total_sbt) || 0), 0);

        // Format leaderboard entries
        const formattedEntries = allUsers.map((entry, index) => {
          const userSBT = Number(entry.total_sbt) || 0;
          const reward = totalSBT > 0 ? (userSBT / totalSBT) * poolStats.pool_size : 0;

          return {
            position: entry.isGap ? entry.position : index + 1,
            username: entry.username || 'Anonymous',  // Default to 'Anonymous' if no username
            pool_share: userSBT,
            total_sbt: userSBT,
            expected_reward: reward,
            isGap: entry.isGap
          };
        });

        setEntries(formattedEntries);

        // Set user stats if user exists and maintain previous stats if not found
        if (user?.id) {
          const userEntry = formattedEntries.find(e => e.username === user.username);
          const updatedUserStats = {
            position: userEntry?.position?.toString() || '-',
            shares: userEntry?.total_sbt || 0,
            reward: userEntry?.expected_reward || 0,
            totalShares: totalSBT,
            poolSize: poolStats.pool_size || 0
          };
          
          setUserStats(updatedUserStats);
          
          // Cache the results with the updated user stats
          localStorage.setItem(cacheKey, JSON.stringify({
            data: {
              entries: formattedEntries,
              userStats: updatedUserStats,  // Use the updated stats here, not the old state
              tonPrice: price,
              poolStats: {
                totalPool: poolStats.pool_size || 0,
                totalParticipants: poolStats.active_users || 0,
                lastDistribution: poolStats.last_distribution || '',
                totalUsers: count || 0
              }
            },
            timestamp: Date.now()
          }));
        } else {
          // Cache the results without user stats
          localStorage.setItem(cacheKey, JSON.stringify({
            data: {
              entries: formattedEntries,
              userStats: userStats,  // Use current state for non-logged in users
              tonPrice: price,
              poolStats: {
                totalPool: poolStats.pool_size || 0,
                totalParticipants: poolStats.active_users || 0,
                lastDistribution: poolStats.last_distribution || '',
                totalUsers: count || 0
              }
            },
            timestamp: Date.now()
          }));
        }

      } catch (error) {
        console.error('Error fetching GMP data:', error);
        setError('Failed to load GMP data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGMPData();

    // Set up auto-refresh interval
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      refreshInterval = setInterval(fetchGMPData, refreshIntervalTime);
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [user, cacheKey, autoRefresh]);

  // Function to manually refresh data
  const handleManualRefresh = () => {
    setIsLoading(true);
    // This will trigger the useEffect to run again
    setLastRefreshed(new Date());
  };

  // Add error boundary
  if (!user?.id) {
    return (
      <div className="bg-black/20 rounded-xl p-2.5 flex flex-col h-full">
        {/* Connection Required Skeleton */}
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="p-custom sm:p-4 flex flex-col h-full max-h-[calc(100vh-80px)] backdrop-blur-sm">
        {/* User Stats Section Skeleton - Enhanced */}
        <div className="mb-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-3 border border-white/10 shadow-md shadow-blue-900/10 relative overflow-hidden">
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 w-full h-full">
            <div className="shimmer-effect"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
              </div>
              <div>
                <div className="h-4 w-28 bg-white/10 rounded mb-1"></div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-20 bg-white/10 rounded"></div>
                  <span className="text-gray-500">•</span>
                  <div className="h-3 w-24 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-24 bg-white/10 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gradient-to-r from-green-400/20 to-green-300/10 rounded"></div>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-20 bg-white/10 rounded mb-1"></div>
                  <div className="h-4 w-16 bg-gradient-to-r from-purple-400/20 to-purple-300/10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section Skeleton - Enhanced */}
        <div className="bg-black/40 rounded-xl overflow-hidden flex-1 flex flex-col border border-white/10 min-h-[400px] sm:min-h-[600px] shadow-lg shadow-blue-900/20 relative">
          {/* Table Header Skeleton - Enhanced */}
          <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 px-2 sm:px-4 py-2 sm:py-2.5 border-b border-white/10 relative overflow-hidden">
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 w-full h-full">
              <div className="shimmer-effect"></div>
            </div>
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-yellow-300/50 to-yellow-600/50 p-1.5 rounded-lg">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4"></div>
                </div>
                <div className="h-4 w-36 bg-white/10 rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 bg-blue-900/30 rounded-full"></div>
                <div className="h-5 w-28 bg-black/30 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Column Headers Skeleton - Enhanced */}
          <div className="bg-black/60 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-white/5">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-2 sm:col-span-1 h-3 w-4 bg-white/10 rounded"></div>
              <div className="col-span-6 sm:col-span-7 h-3 w-24 bg-white/10 rounded"></div>
              <div className="col-span-4 flex justify-end">
                <div className="h-3 w-16 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>

          {/* Table Body Skeleton - Enhanced with staggered animation */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 relative">
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none"></div>
            
            {[...Array(15)].map((_, index) => (
              <div 
                key={index}
                className={`grid grid-cols-12 px-2 sm:px-4 py-2 sm:py-2.5 ${
                  index % 2 === 0 ? 'bg-white/[0.03]' : ''
                } relative overflow-hidden`}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  opacity: 1 - (index * 0.05) // Fade out rows as they go down
                }}
              >
                {/* Conditional shimmer effect */}
                {index < 5 && (
                  <div className="absolute inset-0 w-full h-full">
                    <div className="shimmer-effect" style={{ animationDelay: `${index * 0.1}s` }}></div>
                  </div>
                )}
                
                <div className="col-span-2 sm:col-span-1 relative z-10">
                  {index < 3 ? (
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-500/30 to-amber-600/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-yellow-500/40 rounded-full"></div>
                    </div>
                  ) : (
                    <div className="h-3 w-4 bg-white/10 rounded"></div>
                  )}
                </div>
                <div className="col-span-6 sm:col-span-7 flex items-center gap-2 relative z-10">
                  <div className="h-3.5 w-28 bg-white/10 rounded"></div>
                  {index === 4 && (
                    <div className="h-4 w-12 bg-gradient-to-r from-blue-500/30 to-blue-400/20 rounded-full"></div>
                  )}
                </div>
                <div className="col-span-4 flex justify-end relative z-10">
                  <div className="h-3.5 w-20 bg-white/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Skeleton - Enhanced */}
          <div className="bg-black/70 px-2 sm:px-4 py-1.5 sm:py-2 border-t border-white/5 flex justify-between items-center relative overflow-hidden">
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 w-full h-full">
              <div className="shimmer-effect"></div>
            </div>
            
            <div className="h-2.5 w-28 bg-white/10 rounded relative z-10"></div>
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
              <div className="h-2.5 w-36 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Add the shimmer effect CSS */}
        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          .shimmer-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.05) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-white';
    }
  };

  return (
    <div className="p-custom sm:p-4 flex flex-col h-full max-h-[calc(100vh-80px)] backdrop-blur-sm">
      {/* User Stats Section - Enhanced with total users */}
      {user?.id && (
        <div className="mb-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-3 border border-white/10 shadow-md shadow-blue-900/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user.username?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{user.username}</h3>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Rank:</span>
                    <span className="text-xs font-semibold text-blue-400">#{userStats.position}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Pool Share:</span>
                    <span className="text-xs font-semibold text-blue-400">{userStats.totalShares > 0 
                      ? ((userStats.shares / userStats.totalShares) * 100).toFixed(2) 
                      : '0.00'}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                <span>Globals Users: </span>
                <span className="font-semibold text-green-400">{poolStats.totalUsers?.toLocaleString() || '0'}</span>
              </div>
              <div className="bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                <span>Active Stakers: </span>
                <span className="font-semibold text-purple-400">{poolStats.totalParticipants?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Section - Enhanced design */}
      <div className="bg-black/40 rounded-xl overflow-hidden flex-1 flex flex-col border border-white/10 min-h-[400px] sm:min-h-[600px] shadow-lg shadow-blue-900/20">
        {/* Table Header with Info - Enhanced gradient */}
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 px-2 sm:px-4 py-2 sm:py-2.5 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 p-1.5 rounded-lg shadow-inner shadow-yellow-200/20">
                <FaTrophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-100" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">Global Leaderboard</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="text-[9px] sm:text-[10px] text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 transition-colors border border-blue-500/30"
              >
                <svg 
                  className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <div 
                className={`text-[9px] sm:text-[10px] ${autoRefresh ? 'text-green-400' : 'text-gray-400'} bg-black/30 hover:bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors border border-white/10`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Column Headers */}
        <div className="bg-black/60 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-white/5">
          <div className="grid grid-cols-12 items-center text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            <div className="col-span-2 sm:col-span-1">#</div>
            <div className="col-span-6 sm:col-span-7">Player</div>
            <div className="col-span-4 text-right flex items-center justify-end gap-1">
              STKN
              <Tooltip content="Higher STKN balance = better rewards">
                <FaInfoCircle className="text-blue-400/60 w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Enhanced Table Body - Better styling for rows */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {entries.map((entry, index) => {
            const showGapIndicator = index > 0 && entry.isGap;
            const isCurrentUser = user?.username === entry.username;
            
            return (
              <div key={`${entry.username}-${entry.position}`}>
                {showGapIndicator && (
                  <div className="px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10px] text-blue-400/70 text-center bg-blue-900/20 border-y border-blue-500/20">
                    • • • Skipped Rankings • • •
                  </div>
                )}
                <div 
                  className={`group grid grid-cols-12 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-y border-white/10'
                      : 'hover:bg-white/5'
                  } ${index % 2 === 0 ? 'bg-white/[0.03]' : ''} transition-colors duration-200`}
                >
                  <div className={`col-span-2 sm:col-span-1 flex items-center ${getPositionColor(entry.position || 0)}`}>
                    {entry.position && entry.position <= 3 ? (
                      <div className="relative">
                        <span className="text-base sm:text-lg">{['👑', '🥈', '🥉'][entry.position - 1]}</span>
                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping opacity-75" />
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{entry.position || '-'}</span>
                    )}
                  </div>
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-1 sm:gap-2">
                    <span className={`truncate font-medium ${isCurrentUser ? 'text-blue-400' : 'group-hover:text-blue-400'} transition-colors`}>
                      {entry.username}
                    </span>
                    {isCurrentUser && (
                      <span className="hidden sm:inline-block flex-shrink-0 text-[10px] bg-blue-500/30 border border-blue-500/50 px-1.5 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="col-span-4 text-right pr-1">
                    <span className={`font-medium ${isCurrentUser ? 'text-blue-300' : 'text-gray-300'}`}>
                      {entry.total_sbt?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Footer Info - Better styling */}
        <div className="bg-black/70 px-2 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] text-gray-500 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="hidden sm:inline">Displaying up to 1000 players</span>
            <span className="sm:hidden">Top 500</span>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="hidden sm:inline">
                Last updated: {lastRefreshed.toLocaleTimeString()} 
                {autoRefresh && ` • Auto-refresh: ${Math.floor(refreshIntervalTime/1000)}s`}
              </span>
              <span className="sm:hidden">
                {lastRefreshed.toLocaleTimeString()}
                {autoRefresh && ` • ${Math.floor(refreshIntervalTime/1000)}s`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function(): number {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default GMPLeaderboard;