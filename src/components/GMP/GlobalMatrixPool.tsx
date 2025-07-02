import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Award, TrendingUp } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface PoolEntry {
  id: string;
  username: string;
  avatar_url: string;
  shares: number;
  expected_reward: number;
  created_at: string;
}

interface PoolStats {
  total_reward: number;
  total_shares: number;
  total_participants: number;
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
};

// Reuse your existing Progress component
const Progress = ({ value = 0 }: { value?: number }) => (
  <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-gray-800/50 rounded-xl"/>
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-800/50 rounded-xl"/>
      ))}
    </div>
    <div className="h-[400px] bg-gray-800/50 rounded-xl"/>
  </div>
);

// Modify PlayerStats for GMP
const UserPoolStats = React.memo(({ userShares, userRank, expectedReward }: { 
  userShares: number;
  userRank: number;
  expectedReward: number;
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
      <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-gray-400 text-sm">Your Rank</div>
            <div className="text-white text-2xl font-bold mt-1">
              #{userRank > 0 ? userRank.toLocaleString() : '--'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Your Shares</div>
            <div className="text-white text-2xl font-bold mt-1">
              {userShares.toLocaleString()} 📊
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Progress value={(userShares / expectedReward) * 100} />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Expected Reward</span>
            <span className="text-white font-medium">${expectedReward.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Modify LeaderboardRow for GMP
const PoolEntryRow = React.memo(({ entry, index, isCurrentUser, topShares }: { 
  entry: PoolEntry;
  index: number;
  isCurrentUser: boolean;
  topShares: number;
}) => {
  const percentageOfTop = ((entry.shares / topShares) * 100).toFixed(1);
  
  return (
    <div className={`
      relative group px-4 py-3 
      ${isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-gray-800/50'}
      ${index === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : ''}
      border-b border-gray-700/50 transition-all duration-200
    `}>
      <div className="flex items-center gap-4">
        <div className="w-12 flex-shrink-0 text-center">
          {index < 3 ? (
            <span className="text-lg">{['🥇', '🥈', '🥉'][index]}</span>
          ) : (
            <span className="text-gray-400 font-medium">#{index + 1}</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={entry.avatar_url || 'https://xelene.me/telegram.gif'}
            alt={entry.username}
            className="w-10 h-10 rounded-full border-2 border-gray-700/50"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate">
              {entry.username}
            </div>
            <div className="text-sm text-gray-400">
              {entry.shares.toLocaleString()} shares
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-medium text-white">
            ${entry.expected_reward.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">
            {percentageOfTop}% of top
          </div>
        </div>
      </div>
    </div>
  );
});

const GlobalMatrixPool: React.FC = () => {
  const { user } = useAuth();
  const [poolEntries, setPoolEntries] = useState<PoolEntry[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [userShares, setUserShares] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchPoolData = useCallback(async () => {
    try {
      const [entriesResponse, statsResponse] = await Promise.all([
        supabase
          .from('global_pool_rankings')
          .select('*')
          .order('shares', { ascending: false })
          .limit(100),
        supabase
          .from('global_pool_stats')
          .select('*')
          .limit(1)
      ]);

      if (entriesResponse.error) throw entriesResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      if (entriesResponse.data) {
        setPoolEntries(entriesResponse.data);
        if (user?.id) {
          const userPos = entriesResponse.data.findIndex(entry => entry.id === user.id) + 1;
          const userEntry = entriesResponse.data.find(entry => entry.id === user.id);
          setUserPosition(userPos || null);
          setUserShares(userEntry?.shares || 0);
        }
      }

      if (statsResponse.data && statsResponse.data.length > 0) {
        setPoolStats(statsResponse.data[0]);
      } else {
        setPoolStats({
          total_reward: 0,
          total_shares: 0,
          total_participants: 0
        });
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching pool data:', err);
      setError('Failed to load pool data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPoolData();
    const interval = setInterval(fetchPoolData, 120000);
    return () => clearInterval(interval);
  }, [fetchPoolData]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl">
          {error}
        </div>
        <button 
          onClick={fetchPoolData}
          className="mt-4 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 p-custom space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Global Matrix Pool</h1>
        <p className="text-gray-400">Earn rewards based on your share in the global pool</p>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          <UserPoolStats 
            userShares={userShares}
            userRank={userPosition || 0}
            expectedReward={poolStats?.total_reward || 0}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">Participants</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {poolStats?.total_participants.toLocaleString() || '0'}
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Award className="w-5 h-5" />
                <span className="font-medium">Total Reward</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${poolStats?.total_reward.toLocaleString() || '0'}
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Total Shares</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {poolStats?.total_shares.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Leaderboard</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4" />
                {formatTimeAgo(lastUpdate.getTime())}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {poolEntries.map((entry, index) => (
                <PoolEntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  isCurrentUser={entry.id.toString() === user?.id?.toString()}
                  topShares={poolEntries[0]?.shares || 1}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalMatrixPool; 