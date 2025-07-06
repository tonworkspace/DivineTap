import React, { useState, useEffect } from 'react';
import { GiCrown, GiTrophy, GiMedal, GiCoins, GiGems, GiLightningArc } from 'react-icons/gi';
import { BiTime, BiTrendingUp, BiTrendingDown, BiStar } from 'react-icons/bi';
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

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'from-yellow-400 to-yellow-600';
    case 2: return 'from-gray-300 to-gray-500';
    case 3: return 'from-orange-400 to-orange-600';
    case 4:
    case 5: return 'from-purple-400 to-purple-600';
    default: return 'from-cyan-400 to-cyan-600';
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

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
  const [showAchievements, setShowAchievements] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="text-cyan-400 font-mono text-lg animate-pulse">
            LOADING LEADERBOARD...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            🏆 GLOBAL RANKINGS 🏆
          </h1>
          <button
            onClick={refreshLeaderboard}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isRefreshing 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
            }`}
          >
            <div className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}>
              {isRefreshing ? '⟳' : '↻'}
            </div>
          </button>
        </div>
        <p className="text-cyan-300 font-mono text-sm">
          Compete with the best miners in the cyberpunk realm
        </p>
      </div>

      {/* User Stats Card */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">YOU</span>
              </div>
              <div>
                <div className="text-cyan-300 font-bold">Your Ranking</div>
                <div className="text-2xl font-bold text-cyan-400">#{userRank}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-cyan-300 text-sm">Total Players</div>
              <div className="text-xl font-bold text-cyan-400">{formatNumber(leaderboardData.totalPlayers)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-yellow-400 font-bold">{formatNumber(userPoints)}</div>
              <div className="text-gray-400 text-xs">Points</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-bold">{formatNumber(userGems)}</div>
              <div className="text-gray-400 text-xs">Gems</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold">Online</div>
              <div className="text-gray-400 text-xs">Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'global', name: 'Global', icon: GiCrown },
          { id: 'weekly', name: 'Weekly', icon: BiTrendingUp },
          { id: 'monthly', name: 'Monthly', icon: BiTime },
          { id: 'recent', name: 'Recent', icon: GiLightningArc }
        ].map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold transition-all duration-300 ${
              currentTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Icon size={16} />
            {name}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 mb-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <div className="col-span-1 text-center">
              <span className="text-cyan-400 font-bold text-sm">RANK</span>
            </div>
            <div className="col-span-3">
              <span className="text-cyan-400 font-bold text-sm">PLAYER</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-cyan-400 font-bold text-sm">POINTS</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-cyan-400 font-bold text-sm">GEMS</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-cyan-400 font-bold text-sm">MINING RATE</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-cyan-400 font-bold text-sm">STATUS</span>
            </div>
          </div>

          {/* Player Rows */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getCurrentTabData().map((player, index) => (
              <div
                key={player.id}
                className={`grid grid-cols-12 gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-cyan-500/10 ${
                  player.id === 'current_user' 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400' 
                    : 'bg-gray-800/30 border border-gray-700/30'
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className={`flex items-center gap-1 ${player.rank <= 3 ? 'text-2xl' : 'text-lg'}`}>
                    {getRankIcon(player.rank)}
                    <span className="font-bold text-cyan-300">#{player.rank}</span>
                  </div>
                </div>

                {/* Player Info */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{player.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-bold text-cyan-300 text-sm">{player.name}</div>
                    <div className="text-xs text-gray-400">Level {player.level}</div>
                    {player.achievements.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {player.achievements.slice(0, 2).map((achievement, idx) => (
                          <div
                            key={idx}
                            className="w-2 h-2 bg-yellow-400 rounded-full cursor-help"
                            title={achievement}
                          />
                        ))}
                        {player.achievements.length > 2 && (
                          <div className="text-xs text-gray-500">+{player.achievements.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <GiCoins className="text-yellow-400" />
                    <span className="font-bold text-yellow-400">{formatNumber(player.points)}</span>
                  </div>
                </div>

                {/* Gems */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <GiGems className="text-purple-400" />
                    <span className="font-bold text-purple-400">{formatNumber(player.gems)}</span>
                  </div>
                </div>

                {/* Mining Rate */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <GiLightningArc className="text-green-400" />
                    <span className="font-bold text-green-400">{player.miningRate}/s</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className={`text-xs font-bold ${player.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {player.isOnline ? 'ONLINE' : formatTimeAgo(player.lastActive)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{formatNumber(leaderboardData.totalPlayers)}</div>
            <div className="text-gray-400 text-sm">Total Players</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {formatNumber(getCurrentTabData().reduce((sum, p) => sum + p.points, 0))}
            </div>
            <div className="text-gray-400 text-sm">Total Points</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {new Date(leaderboardData.lastUpdated).toLocaleTimeString()}
            </div>
            <div className="text-gray-400 text-sm">Last Updated</div>
          </div>
        </div>
      </div>
    </div>
  );
};