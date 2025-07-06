import React, { useState, useEffect, useCallback } from 'react';
import { GiChest, GiCrystalBall, GiCoins, GiGems, GiLightningArc, GiStairs, GiCrown } from 'react-icons/gi';
import { BiTime, BiCalendar } from 'react-icons/bi';
import { useGameContext } from '@/contexts/GameContext';
import './DailyRewards.css';

interface LootBox {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost: number;
  currency: 'points' | 'gems';
  rewards: Reward[];
  icon: string;
  color: string;
  glowColor: string;
}

interface Reward {
  type: 'points' | 'gems' | 'boost' | 'special';
  amount: number;
  name: string;
  description: string;
  icon: string;
}

interface DailyStreak {
  current: number;
  max: number;
  lastClaim: number;
  rewards: number[];
}

const LOOTBOXES: LootBox[] = [
  {
    id: 'basic',
    name: 'BASIC LOOTBOX',
    rarity: 'common',
    cost: 100,
    currency: 'points',
    icon: '📦',
    color: 'from-gray-400 to-gray-600',
    glowColor: 'shadow-[0_0_20px_rgba(156,163,175,0.5)]',
    rewards: [
      { type: 'points', amount: 50, name: 'Divine Points', description: 'Basic mining points', icon: '🪙' },
      { type: 'points', amount: 100, name: 'Divine Points', description: 'Standard mining points', icon: '🪙' },
      { type: 'points', amount: 150, name: 'Divine Points', description: 'Good mining points', icon: '🪙' },
      { type: 'gems', amount: 5, name: 'Divine Gems', description: 'Rare currency', icon: '💎' },
      { type: 'boost', amount: 1.5, name: 'Mining Boost', description: '1.5x mining for 1 hour', icon: '⚡' }
    ]
  },
  {
    id: 'rare',
    name: 'RARE LOOTBOX',
    rarity: 'rare',
    cost: 50,
    currency: 'gems',
    icon: '🎁',
    color: 'from-blue-400 to-blue-600',
    glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    rewards: [
      { type: 'points', amount: 200, name: 'Divine Points', description: 'Rare mining points', icon: '🪙' },
      { type: 'points', amount: 300, name: 'Divine Points', description: 'Premium mining points', icon: '🪙' },
      { type: 'gems', amount: 10, name: 'Divine Gems', description: 'Rare currency', icon: '💎' },
      { type: 'gems', amount: 15, name: 'Divine Gems', description: 'Premium currency', icon: '💎' },
      { type: 'boost', amount: 2.0, name: 'Mining Boost', description: '2x mining for 2 hours', icon: '⚡' },
      { type: 'special', amount: 1, name: 'Lucky Charm', description: '10% better lootbox odds', icon: '🍀' }
    ]
  },
  {
    id: 'epic',
    name: 'EPIC LOOTBOX',
    rarity: 'epic',
    cost: 100,
    currency: 'gems',
    icon: '🎯',
    color: 'from-purple-400 to-purple-600',
    glowColor: 'shadow-[0_0_20px_rgba(147,51,234,0.5)]',
    rewards: [
      { type: 'points', amount: 500, name: 'Divine Points', description: 'Epic mining points', icon: '🪙' },
      { type: 'points', amount: 750, name: 'Divine Points', description: 'Legendary mining points', icon: '🪙' },
      { type: 'gems', amount: 25, name: 'Divine Gems', description: 'Epic currency', icon: '💎' },
      { type: 'gems', amount: 35, name: 'Divine Gems', description: 'Legendary currency', icon: '💎' },
      { type: 'boost', amount: 3.0, name: 'Mining Boost', description: '3x mining for 3 hours', icon: '⚡' },
      { type: 'special', amount: 1, name: 'Time Warp', description: 'Skip 1 hour of mining time', icon: '⏰' },
      { type: 'special', amount: 1, name: 'Divine Blessing', description: 'All rewards +50% for 1 hour', icon: '✨' }
    ]
  },
  {
    id: 'legendary',
    name: 'LEGENDARY LOOTBOX',
    rarity: 'legendary',
    cost: 200,
    currency: 'gems',
    icon: '👑',
    color: 'from-yellow-400 to-yellow-600',
    glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
    rewards: [
      { type: 'points', amount: 1000, name: 'Divine Points', description: 'Legendary mining points', icon: '🪙' },
      { type: 'points', amount: 1500, name: 'Divine Points', description: 'Mythical mining points', icon: '🪙' },
      { type: 'gems', amount: 50, name: 'Divine Gems', description: 'Legendary currency', icon: '💎' },
      { type: 'gems', amount: 75, name: 'Divine Gems', description: 'Mythical currency', icon: '💎' },
      { type: 'boost', amount: 5.0, name: 'Mining Boost', description: '5x mining for 5 hours', icon: '⚡' },
      { type: 'special', amount: 1, name: 'Divine Ascension', description: 'Permanent +10% mining speed', icon: '🌟' },
      { type: 'special', amount: 1, name: 'Cosmic Luck', description: 'Guaranteed epic+ rewards for 24h', icon: '🌌' }
    ]
  }
];

const DAILY_REWARDS = [
  { day: 1, points: 50, gems: 5, icon: '🪙' },
  { day: 2, points: 75, gems: 8, icon: '💎' },
  { day: 3, points: 100, gems: 10, icon: '⚡' },
  { day: 4, points: 150, gems: 15, icon: '🌟' },
  { day: 5, points: 200, gems: 20, icon: '👑' },
  { day: 6, points: 300, gems: 25, icon: '🌌' },
  { day: 7, points: 500, gems: 50, icon: '🎉' }
];

export const DailyRewards: React.FC = () => {
  const { points: userPoints, gems: userGems, addPoints, addGems, activeBoosts, addBoost } = useGameContext();
  const [currentTab, setCurrentTab] = useState<'daily' | 'lootboxes' | 'streaks'>('daily');
  const [dailyStreak, setDailyStreak] = useState<DailyStreak>(() => {
    const saved = localStorage.getItem('divineMiningStreak');
    return saved ? JSON.parse(saved) : {
      current: 0,
      max: 0,
      lastClaim: 0,
      rewards: [50, 75, 100, 150, 200, 300, 500]
    };
  });
  const [openingLootbox, setOpeningLootbox] = useState<string | null>(null);
  const [lootboxResult, setLootboxResult] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Load streak data from localStorage
  useEffect(() => {
    const savedStreak = localStorage.getItem('divineMiningStreak');
    if (savedStreak) setDailyStreak(JSON.parse(savedStreak));
  }, []);

  // Save streak data to localStorage
  useEffect(() => {
    localStorage.setItem('divineMiningStreak', JSON.stringify(dailyStreak));
  }, [dailyStreak]);

  // Check if daily reward can be claimed
  const canClaimDaily = useCallback(() => {
    const now = Date.now();
    const lastClaim = dailyStreak.lastClaim;
    const oneDay = 24 * 60 * 60 * 1000;
    
    return now - lastClaim >= oneDay;
  }, [dailyStreak.lastClaim]);

  // Claim daily reward
  const claimDailyReward = useCallback(() => {
    if (!canClaimDaily()) return;

    const now = Date.now();
    const newStreak = dailyStreak.current + 1;
    const reward = DAILY_REWARDS[Math.min(newStreak - 1, 6)];
    
    addPoints(reward.points);
    addGems(reward.gems);
    setDailyStreak(prev => ({
      ...prev,
      current: newStreak,
      max: Math.max(prev.max, newStreak),
      lastClaim: now
    }));

    // Show reward notification
    setLootboxResult({
      type: 'points',
      amount: reward.points,
      name: `Day ${newStreak} Reward`,
      description: `+${reward.points} Points & +${reward.gems} Gems`,
      icon: reward.icon
    });
    setShowResult(true);
  }, [canClaimDaily, dailyStreak, addPoints, addGems]);

  // Open lootbox
  const openLootbox = useCallback((lootbox: LootBox) => {
    if (openingLootbox) return;
    
    // Check if user can afford it
    const cost = lootbox.cost;
    const currency = lootbox.currency;
    
    if (currency === 'points' && userPoints < cost) return;
    if (currency === 'gems' && userGems < cost) return;

    setOpeningLootbox(lootbox.id);
    
    // Deduct cost
    if (currency === 'points') {
      addPoints(-cost);
    } else {
      addGems(-cost);
    }

    // Simulate opening animation
    setTimeout(() => {
      // Select random reward
      const reward = lootbox.rewards[Math.floor(Math.random() * lootbox.rewards.length)];
      
      // Apply reward
      if (reward.type === 'points') {
        addPoints(reward.amount);
      } else if (reward.type === 'gems') {
        addGems(reward.amount);
      } else if (reward.type === 'boost') {
        addBoost({
          type: 'mining',
          multiplier: reward.amount,
          expires: Date.now() + (reward.amount * 60 * 60 * 1000) // hours to ms
        });
      }

      setLootboxResult(reward);
      setShowResult(true);
      setOpeningLootbox(null);
    }, 2000);
  }, [openingLootbox, userPoints, userGems, addPoints, addGems, addBoost]);

  // Close result modal
  const closeResult = useCallback(() => {
    setShowResult(false);
    setLootboxResult(null);
  }, []);

  // Clean up expired boosts is handled by GameContext

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          ⚡ DAILY REWARDS ⚡
        </h1>
        <p className="text-cyan-300 font-mono text-sm">
          Claim your rewards and open legendary lootboxes!
        </p>
      </div>

      {/* Currency Display */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-lg px-4 py-2">
          <GiCoins className="text-yellow-400 text-xl" />
          <span className="text-yellow-400 font-bold">{userPoints}</span>
          <span className="text-gray-400 text-sm">Points</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-lg px-4 py-2">
          <GiGems className="text-purple-400 text-xl" />
          <span className="text-purple-400 font-bold">{userGems}</span>
          <span className="text-gray-400 text-sm">Gems</span>
        </div>
      </div>

      {/* Active Boosts */}
      {activeBoosts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2 text-center">ACTIVE BOOSTS</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {activeBoosts.map((boost, index) => (
              <div key={index} className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-2 py-1">
                <GiLightningArc className="text-yellow-400 text-sm" />
                <span className="text-yellow-400 text-xs font-bold">{boost.multiplier}x</span>
                <span className="text-gray-400 text-xs">
                  {Math.ceil((boost.expires - Date.now()) / (60 * 60 * 1000))}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'daily', name: 'Daily Rewards', icon: BiCalendar },
          { id: 'lootboxes', name: 'Lootboxes', icon: GiChest },
          { id: 'streaks', name: 'Streaks', icon: GiStairs }
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

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">
        {currentTab === 'daily' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {DAILY_REWARDS.map((reward, index) => {
              const isClaimed = index < dailyStreak.current;
              const canClaim = index === dailyStreak.current && canClaimDaily();
              const isLocked = index > dailyStreak.current;

              return (
                <div
                  key={index}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isClaimed
                      ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400'
                      : canClaim
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-400 cursor-pointer hover:scale-105'
                      : 'bg-black/40 border-gray-600'
                  }`}
                  onClick={canClaim ? claimDailyReward : undefined}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{reward.icon}</div>
                    <div className="text-sm font-bold text-cyan-300 mb-1">DAY {reward.day}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      +{reward.points} Points<br />
                      +{reward.gems} Gems
                    </div>
                    {isClaimed && (
                      <div className="text-green-400 text-xs">✓ CLAIMED</div>
                    )}
                    {canClaim && (
                      <div className="text-cyan-400 text-xs animate-pulse">CLICK TO CLAIM</div>
                    )}
                    {isLocked && (
                      <div className="text-gray-500 text-xs">LOCKED</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentTab === 'lootboxes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LOOTBOXES.map((lootbox) => {
              const canAfford = lootbox.currency === 'points' 
                ? userPoints >= lootbox.cost 
                : userGems >= lootbox.cost;
              const isOpening = openingLootbox === lootbox.id;

              return (
                <div
                  key={lootbox.id}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                    canAfford && !isOpening
                      ? `bg-gradient-to-br ${lootbox.color} border-cyan-400 cursor-pointer hover:scale-105 ${lootbox.glowColor}`
                      : 'bg-black/40 border-gray-600'
                  } ${isOpening ? 'animate-pulse' : ''}`}
                  onClick={canAfford && !isOpening ? () => openLootbox(lootbox) : undefined}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">{lootbox.icon}</div>
                    <div className="text-lg font-bold text-white mb-2">{lootbox.name}</div>
                    <div className="text-sm text-gray-300 mb-3">
                      {lootbox.rarity.toUpperCase()}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {lootbox.currency === 'points' ? (
                        <GiCoins className="text-yellow-400" />
                      ) : (
                        <GiGems className="text-purple-400" />
                      )}
                      <span className="text-white font-bold">{lootbox.cost}</span>
                    </div>
                    {isOpening ? (
                      <div className="text-cyan-400 text-sm animate-pulse">OPENING...</div>
                    ) : canAfford ? (
                      <div className="text-cyan-400 text-sm">CLICK TO OPEN</div>
                    ) : (
                      <div className="text-red-400 text-sm">NOT ENOUGH {lootbox.currency.toUpperCase()}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentTab === 'streaks' && (
          <div className="text-center space-y-6">
            <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">STREAK STATISTICS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-cyan-400">{dailyStreak.current}</div>
                  <div className="text-gray-300 text-sm">Current Streak</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-400">{dailyStreak.max}</div>
                  <div className="text-gray-300 text-sm">Best Streak</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-400">
                    {canClaimDaily() ? 'READY' : 'WAIT'}
                  </div>
                  <div className="text-gray-300 text-sm">Next Claim</div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">STREAK REWARDS</h3>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {[7, 14, 30, 60, 100, 365, 1000].map((days) => (
                  <div key={days} className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-lg font-bold text-cyan-400">{days}</div>
                    <div className="text-xs text-gray-400">Days</div>
                    <div className="text-xs text-yellow-400 mt-1">
                      +{days * 10} Points
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lootbox Result Modal */}
      {showResult && lootboxResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400 rounded-xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4 animate-bounce">{lootboxResult.icon}</div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-2">{lootboxResult.name}</h3>
            <p className="text-gray-300 mb-4">{lootboxResult.description}</p>
            <button
              onClick={closeResult}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:scale-105 transition-transform"
            >
              CLAIM REWARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 