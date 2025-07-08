import React, { useState, useEffect } from 'react';
import { GiCrown, GiTrophy, GiMedal, GiCoins, GiGems, GiLightningArc } from 'react-icons/gi';
import { BiTime, BiTrendingUp, BiStar } from 'react-icons/bi';
import { useGameContext } from '@/contexts/GameContext';
import './GMPLeaderboard.css';

interface Player {
  id: string;
  name: string;
  points: number;
  gems: number;
  rank: number;
  level: number;
  miningRate: number;
  totalEarned: number;
  streak: number;
  lastActive: number;
  avatar: string;
  achievements: string[];
  isOnline: boolean;
}

interface LeaderboardData {
  topPlayers: Player[];
  recentActivity: Player[];
  weeklyWinners: Player[];
  monthlyWinners: Player[];
  totalPlayers: number;
  lastUpdated: number;
}

// Mock data for demonstration
const generateMockPlayers = (): Player[] => {
  const names = [
    'CyberPunk_2077', 'NeonDreamer', 'DigitalPhantom', 'QuantumMiner', 'CryptoWizard',
    'ByteMaster', 'PixelHunter', 'DataVampire', 'CodeNinja', 'MatrixRunner',
    'VirtualSage', 'TechNomad', 'DigitalShaman', 'CyberWarrior', 'NetRunner',
    'DataMiner', 'QuantumLeap', 'NeonKnight', 'DigitalDragon', 'CryptoKing'
  ];

  return names.map((name, index) => ({
    id: `player_${index}`,
    name,
    points: Math.floor(Math.random() * 1000000) + 10000,
    gems: Math.floor(Math.random() * 5000) + 100,
    rank: index + 1,
    level: Math.floor(Math.random() * 100) + 1,
    miningRate: Math.floor(Math.random() * 100) + 1,
    totalEarned: Math.floor(Math.random() * 5000000) + 100000,
    streak: Math.floor(Math.random() * 30) + 1,
    lastActive: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    achievements: ['First Mining', 'Speed Demon', 'Millionaire'].slice(0, Math.floor(Math.random() * 3) + 1),
    isOnline: Math.random() > 0.7
  })).sort((a, b) => b.points - a.points);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <GiCrown className="text-yellow-400" />;
    case 2: return <GiTrophy className="text-gray-300" />;
    case 3: return <GiMedal className="text-orange-400" />;
    default: return <BiStar className="text-cyan-400" />;
  }
};

// const getRankColor = (rank: number) => {
//   switch (rank) {
//     case 1: return 'from-yellow-400 to-yellow-600';
//     case 2: return 'from-gray-300 to-gray-500';
//     case 3: return 'from-orange-400 to-orange-600';
//     case 4:
//     case 5: return 'from-purple-400 to-purple-600';
//     default: return 'from-cyan-400 to-cyan-600';
//   }
// };

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// const formatTimeAgo = (timestamp: number): string => {
//   const now = Date.now();
//   const diff = now - timestamp;
//   const minutes = Math.floor(diff / (1000 * 60));
//   const hours = Math.floor(diff / (1000 * 60 * 60));
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));

//   if (days > 0) return `${days}d ago`;
//   if (hours > 0) return `${hours}h ago`;
//   if (minutes > 0) return `${minutes}m ago`;
//   return 'Just now';
// };

export const GMPLeaderboard: React.FC = () => {
  const { points: userPoints, gems: userGems } = useGameContext();
  const [currentTab, setCurrentTab] = useState<'global' | 'weekly' | 'monthly' | 'recent'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    topPlayers: [],
    recentActivity: [],
    weeklyWinners: [],
    monthlyWinners: [],
    totalPlayers: 0,
    lastUpdated: Date.now()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  // const [showAchievements, setShowAchievements] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [miningStatus, setMiningStatus] = useState<{isMining: boolean, pointsPerSecond: number, currentEnergy: number, maxEnergy: number}>({
    isMining: false, 
    pointsPerSecond: 0, 
    currentEnergy: 0, 
    maxEnergy: 0
  });

  // Sync with DivineMiningGame status
  useEffect(() => {
    const syncMiningStatus = () => {
      try {
        const savedGameState = localStorage.getItem('divineMiningGame');
        if (savedGameState) {
          const gameState = JSON.parse(savedGameState);
          setMiningStatus({
            isMining: gameState.isMining || false,
            pointsPerSecond: gameState.pointsPerSecond || 0,
            currentEnergy: gameState.currentEnergy || 0,
            maxEnergy: gameState.maxEnergy || 0
          });
        }
      } catch (error) {
        console.error('Error syncing mining status:', error);
      }
    };

    syncMiningStatus();
    const interval = setInterval(syncMiningStatus, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate loading data
    const loadLeaderboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockPlayers = generateMockPlayers();
      const userPlayer: Player = {
        id: 'current_user',
        name: 'You',
        points: userPoints,
        gems: userGems,
        rank: Math.floor(Math.random() * 50) + 1,
        level: Math.floor(Math.random() * 50) + 1,
        miningRate: Math.floor(Math.random() * 50) + 1,
        totalEarned: userPoints * 10,
        streak: Math.floor(Math.random() * 10) + 1,
        lastActive: Date.now(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
        achievements: ['First Mining'],
        isOnline: true
      };

      setUserRank(userPlayer.rank);
      
      setLeaderboardData({
        topPlayers: mockPlayers.slice(0, 20),
        recentActivity: mockPlayers.slice(0, 10).sort(() => Math.random() - 0.5),
        weeklyWinners: mockPlayers.slice(0, 5),
        monthlyWinners: mockPlayers.slice(0, 5),
        totalPlayers: 15420,
        lastUpdated: Date.now()
      });
      
      setIsLoading(false);
    };

    loadLeaderboardData();
  }, [userPoints, userGems]);

  const getCurrentTabData = () => {
    switch (currentTab) {
      case 'global': return leaderboardData.topPlayers;
      case 'weekly': return leaderboardData.weeklyWinners;
      case 'monthly': return leaderboardData.monthlyWinners;
      case 'recent': return leaderboardData.recentActivity;
      default: return leaderboardData.topPlayers;
    }
  };

  const refreshLeaderboard = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockPlayers = generateMockPlayers();
    setLeaderboardData(prev => ({
      ...prev,
      topPlayers: mockPlayers.slice(0, 20),
      recentActivity: mockPlayers.slice(0, 10).sort(() => Math.random() - 0.5),
      weeklyWinners: mockPlayers.slice(0, 5),
      monthlyWinners: mockPlayers.slice(0, 5),
      lastUpdated: Date.now()
    }));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="text-cyan-400 font-mono text-sm animate-pulse tracking-wider">
            LOADING LEADERBOARD...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
      {/* Compact Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">GLOBAL RANKINGS</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <button
            onClick={refreshLeaderboard}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isRefreshing 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
            }`}
          >
            <div className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}>
              {isRefreshing ? '⟳' : '↻'}
            </div>
          </button>
        </div>
        
        {/* Compact Mining Status */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <div className={`w-2 h-2 rounded-full ${miningStatus.isMining ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-cyan-300 font-mono text-xs tracking-wider">
            {miningStatus.isMining ? 'MINING ACTIVE' : 'MINING INACTIVE'}
          </span>
          {miningStatus.isMining && (
            <span className="text-green-400 font-mono text-xs">
              +{miningStatus.pointsPerSecond.toFixed(1)}/sec
            </span>
          )}
          <span className="text-blue-400 font-mono text-xs">
            ⚡ {miningStatus.currentEnergy.toFixed(0)}/{miningStatus.maxEnergy.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Compact User Stats */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">YOU</span>
            </div>
            <div>
              <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider">#{userRank}</div>
              <div className="text-cyan-300 text-xs font-mono uppercase tracking-wider">Rank</div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-yellow-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <GiCoins className="text-white text-xs" />
            </div>
            <div>
              <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider">{formatNumber(userPoints)}</div>
              <div className="text-yellow-300 text-xs font-mono uppercase tracking-wider">Points</div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <GiGems className="text-white text-xs" />
            </div>
            <div>
              <div className="text-purple-400 font-mono font-bold text-sm tracking-wider">{formatNumber(userGems)}</div>
              <div className="text-purple-300 text-xs font-mono uppercase tracking-wider">Gems</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Navigation Tabs */}
      <div className="flex gap-1 mb-3">
        {[
          { id: 'global', name: 'Global', icon: GiCrown },
          { id: 'weekly', name: 'Weekly', icon: BiTrendingUp },
          { id: 'monthly', name: 'Monthly', icon: BiTime },
          { id: 'recent', name: 'Recent', icon: GiLightningArc }
        ].map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              currentTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Icon size={12} />
            {name}
          </button>
        ))}
      </div>

      {/* Compact Leaderboard */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        {/* Simple Header */}
        <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <div className="col-span-1 text-center">
            <span className="text-cyan-400 font-mono font-bold text-xs tracking-wider">RANK</span>
          </div>
          <div className="col-span-2">
            <span className="text-cyan-400 font-mono font-bold text-xs tracking-wider">PLAYER</span>
          </div>
          <div className="col-span-1 text-center">
            <span className="text-cyan-400 font-mono font-bold text-xs tracking-wider">POINTS</span>
          </div>
        </div>

          {/* Simple Player Rows */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {getCurrentTabData().map((player) => (
              <div
                key={player.id}
                className={`grid grid-cols-4 gap-2 p-2 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 ${
                  player.id === 'current_user' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400' 
                    : 'bg-gray-800/30 border border-gray-700/30'
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {getRankIcon(player.rank)}
                    <span className="font-mono font-bold text-cyan-300 text-xs">#{player.rank}</span>
                  </div>
                </div>

                {/* Player Info */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-cyan-300 text-xs tracking-wider">{player.name}</div>
                    <div className="text-xs text-gray-400">Lv.{player.level}</div>
                  </div>
                </div>

                {/* Points */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <GiCoins className="text-yellow-400 text-xs" />
                    <span className="font-mono font-bold text-yellow-400 text-xs">{formatNumber(player.points)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact Stats Footer */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg p-2 text-center">
            <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider">{formatNumber(leaderboardData.totalPlayers)}</div>
            <div className="text-gray-400 text-xs font-mono uppercase tracking-wider">Players</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg p-2 text-center">
            <div className="text-purple-400 font-mono font-bold text-sm tracking-wider">
              {formatNumber(getCurrentTabData().reduce((sum, p) => sum + p.points, 0))}
            </div>
            <div className="text-gray-400 text-xs font-mono uppercase tracking-wider">Points</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-2 text-center">
            <div className="text-green-400 font-mono font-bold text-sm tracking-wider">
              {new Date(leaderboardData.lastUpdated).toLocaleTimeString()}
            </div>
            <div className="text-gray-400 text-xs font-mono uppercase tracking-wider">Updated</div>
          </div>
        </div>
    </div>
  );
};