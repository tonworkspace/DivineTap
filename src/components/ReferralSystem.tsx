import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GiPerson, GiPresent, GiShare } from 'react-icons/gi';
import { BiLink } from 'react-icons/bi';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import './ReferralSystem.css';
import { supabase } from '@/lib/supabaseClient';
import { ReferralPrompt } from '@/components/ReferralPrompt';

interface ReferralReward {
  level: number;
  name: string;
  requirements: number;
  rewards: {
    points: number;
    gems: number;
    special?: string;
  };
  icon: string;
  color: string;
}

interface UplineInfo {
  id: string;
  username: string;
  rank: string;
  totalEarned: number;
  joinedAt: number;
  isActive: boolean;
  level: number; // How many levels up (1 = direct referrer)
}

interface DownlineInfo {
  id: string;
  username: string;
  rank: string;
  totalEarned: number;
  joinedAt: number;
  isActive: boolean;
  level: number; // How many levels down (1 = direct referral)
  directReferrals: number;
}

// Referral reward tiers
const REFERRAL_REWARDS: ReferralReward[] = [
  {
    level: 1,
    name: 'First Friend',
    requirements: 1,
    rewards: { points: 100, gems: 10 },
    icon: '👥',
    color: 'green'
  },
  {
    level: 2,
    name: 'Social Butterfly',
    requirements: 3,
    rewards: { points: 300, gems: 30 },
    icon: '🦋',
    color: 'blue'
  },
  {
    level: 3,
    name: 'Network Builder',
    requirements: 5,
    rewards: { points: 500, gems: 50, special: 'VIP Access' },
    icon: '🌐',
    color: 'purple'
  },
  {
    level: 4,
    name: 'Community Leader',
    requirements: 10,
    rewards: { points: 1000, gems: 100, special: 'Exclusive NFT' },
    icon: '👑',
    color: 'yellow'
  },
  {
    level: 5,
    name: 'Referral Master',
    requirements: 20,
    rewards: { points: 2500, gems: 250, special: 'Legendary Status' },
    icon: '🏆',
    color: 'red'
  }
];

export const ReferralSystem: React.FC = () => {
  const { addPoints, addGems } = useGameContext();
  const { user } = useAuth();
  const { 
    referralData,
    loadReferralData,
    debugInfo,
    clearReferralHistory,
    testReferralCode
  } = useReferralIntegration();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards' | 'share' | 'analytics' | 'network'>('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Enhanced network visualization
  const [uplineData, setUplineData] = useState<UplineInfo[]>([]);
  const [downlineData, setDownlineData] = useState<DownlineInfo[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalNetworkSize: 0,
    totalNetworkEarnings: 0,
    networkLevels: 0,
    yourPosition: 0
  });
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  
  // Enhanced localStorage management with error handling
  const getUserSpecificKey = useCallback((baseKey: string, userId?: string) => {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  }, []);

  const safeGetFromStorage = useCallback((key: string, defaultValue: any = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }, []);

  const safeSetToStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Enhanced claimedRewards state management
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    return safeGetFromStorage(claimedKey, []);
  });

  // Save claimed rewards to localStorage whenever it changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const claimedKey = getUserSpecificKey('referral_claimed_rewards', userId);
    safeSetToStorage(claimedKey, claimedRewards);
  }, [claimedRewards, user?.id, getUserSpecificKey, safeSetToStorage]);

  // Enhanced data loading effect
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!user?.id || !mounted) return;
      
      try {
        console.log('🔄 Loading referral data for user:', user.id);
        
        // Force reload referral data
        await loadReferralData();
        
        if (mounted) {
          setDataLoaded(true);
          console.log('✅ Referral data loaded successfully');
        }
      } catch (error) {
        console.error('❌ Error loading referral data:', error);
        if (mounted) {
          setDataLoaded(true); // Set to true even on error to prevent infinite loading
        }
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, loadReferralData]);

  // Enhanced claim reward function with better error handling
  const claimReward = useCallback(async (reward: ReferralReward) => {
    if (isClaimingReward) {
      console.log('⚠️ Already claiming a reward, please wait...');
      return;
    }

    setIsClaimingReward(true);
    
    try {
      const rewardKey = `${reward.level}_${reward.requirements}`;
      
      console.log('🎯 Attempting to claim reward:', {
        reward: reward.name,
        rewardKey,
        totalReferrals: referralData.totalReferrals,
        requirements: reward.requirements,
        alreadyClaimed: claimedRewards.includes(rewardKey)
      });
      
      // Check if reward was already claimed
      if (claimedRewards.includes(rewardKey)) {
        setRewardMessage('🚫 This reward has already been claimed!');
        setShowRewardModal(true);
        return;
      }
      
      // Enhanced requirement check with debug info
      if (referralData.totalReferrals < reward.requirements) {
        const needed = reward.requirements - referralData.totalReferrals;
        console.log('❌ Insufficient referrals:', {
          current: referralData.totalReferrals,
          required: reward.requirements,
          needed
        });
        
        setRewardMessage(`🚫 You need ${needed} more referral${needed > 1 ? 's' : ''} to claim this reward!\n\nCurrent: ${referralData.totalReferrals}/${reward.requirements}`);
        setShowRewardModal(true);
        return;
      }
      
      console.log('✅ Reward requirements met, processing claim...');
      
      // Validate GameContext functions
      if (!addPoints || !addGems) {
        console.error('❌ GameContext functions not available');
        setRewardMessage('🚫 Error: Reward system not available. Please refresh the page.');
        setShowRewardModal(true);
        return;
      }
      
      // Award the rewards
      console.log('💰 Adding rewards:', {
        points: reward.rewards.points,
        gems: reward.rewards.gems
      });
      
      addPoints(reward.rewards.points);
      addGems(reward.rewards.gems, `referral_level_${reward.level}`);
      
      // Mark as claimed
      setClaimedRewards(prev => {
        const newClaimed = [...prev, rewardKey];
        console.log('✅ Reward claimed successfully:', newClaimed);
        return newClaimed;
      });
      
      // Show success message
      const successMessage = `🎉 ${reward.name} unlocked!\n\n+${reward.rewards.points} Points\n+${reward.rewards.gems} Gems${reward.rewards.special ? `\n• ${reward.rewards.special}` : ''}`;
      setRewardMessage(successMessage);
      setShowRewardModal(true);
      
      // Dispatch success event
      window.dispatchEvent(new CustomEvent('referralRewardClaimed', {
        detail: { reward, rewardKey }
      }));
      
    } catch (error) {
      console.error('❌ Error claiming reward:', error);
      setRewardMessage('🚫 Error claiming reward. Please try again.');
      setShowRewardModal(true);
    } finally {
      setIsClaimingReward(false);
    }
  }, [referralData.totalReferrals, addPoints, addGems, claimedRewards, isClaimingReward]);

  // Load upline and downline data
  const loadNetworkData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load upline (who referred you and their referrers)
      const uplineResponse = await supabase
        .from('users')
        .select(`
          id,
          username,
          rank,
          total_earned,
          created_at,
          is_active,
          referrer_id,
          referrer:users!referrer_id(
            id,
            username,
            rank,
            total_earned,
            created_at,
            is_active,
            referrer_id
          )
        `)
        .eq('id', user.id)
        .single();

    let uplineArray: UplineInfo[] = [];
    if (uplineResponse.data?.referrer_id) {
      let currentUser = uplineResponse.data;
      let level = 1;

      while (currentUser.referrer && level <= 5) { // Limit to 5 levels
        const referrerData = Array.isArray(currentUser.referrer) ? currentUser.referrer[0] : currentUser.referrer;
        uplineArray.push({
          id: referrerData.id.toString(),
          username: referrerData.username,
          rank: referrerData.rank || 'Novice',
          totalEarned: referrerData.total_earned || 0,
          joinedAt: new Date(referrerData.created_at).getTime(),
          isActive: referrerData.is_active,
          level
        });

        // Break the loop since we can't go deeper with current query structure
        break;
      }
    }

    // Load downline (your referrals and their referrals)
    const downlineResponse = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referred_id(
          id,
          username,
          rank,
          total_earned,
          created_at,
          is_active,
          direct_referrals
        )
      `)
      .eq('referrer_id', user.id);

    let downlineArray: DownlineInfo[] = [];
    if (downlineResponse.data) {
      downlineArray = downlineResponse.data.map(ref => ({
        id: ref.referred.id.toString(),
        username: ref.referred.username,
        rank: ref.referred.rank || 'Novice',
        totalEarned: ref.referred.total_earned || 0,
        joinedAt: new Date(ref.referred.created_at).getTime(),
        isActive: ref.referred.is_active,
        level: 1,
        directReferrals: ref.referred.direct_referrals || 0
      }));
    }

    // Update all states at once
    setUplineData(uplineArray);
    setDownlineData(downlineArray);

    // Calculate network stats
    const totalNetworkSize = downlineArray.length;
    const totalNetworkEarnings = downlineArray.reduce((sum, member) => sum + member.totalEarned, 0);
    const networkLevels = Math.max(...downlineArray.map(m => m.level), 0);

    setNetworkStats({
      totalNetworkSize,
      totalNetworkEarnings,
      networkLevels,
      yourPosition: uplineArray.length + 1
    });

  } catch (error) {
    console.error('Error loading network data:', error);
  }
}, [user?.id]); // Remove uplineData dependency

// Update the useEffect to depend on user and dataLoaded
useEffect(() => {
  if (dataLoaded && user?.id) {
    loadNetworkData();
  }
}, [user?.id, dataLoaded, loadNetworkData]);

  // Copy referral code
  const copyReferralCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [referralData.code]);

  // Share referral link
  const shareReferral = useCallback(() => {
    const referralLink = `https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join DivineTap Mining!',
        text: 'Start mining divine points and earn rewards!',
        url: referralLink
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralData.code]);

  // Get current level info
  const getCurrentLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level) || REFERRAL_REWARDS[0];
  }, [referralData.level]);

  // Get next level info
  const getNextLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level + 1);
  }, [referralData.level]);

  // Debug function to refresh data
  const refreshData = useCallback(async () => {
    setDataLoaded(false);
    try {
      await loadReferralData();
      setDataLoaded(true);
      console.log('🔄 Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setDataLoaded(true);
    }
  }, [loadReferralData]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: GiShare },
    { id: 'network', name: 'Network', icon: GiPerson }, // New tab
    { id: 'referrals', name: 'Referrals', icon: GiPerson },
    { id: 'rewards', name: 'Rewards', icon: GiPresent },
    { id: 'share', name: 'Share', icon: BiLink }
  ];

  const handleManualReferralEntry = useCallback(() => {
    setShowManualEntry(true);
  }, []);

  const handleReferralPromptClose = useCallback(() => {
    setShowManualEntry(false);
    if (user?.id) {
      localStorage.setItem(`referral_prompted_${user.id}`, 'true');
    }
  }, [user?.id]);

  const handleReferralPromptSuccess = useCallback((referrerInfo: any) => {
    console.log('✅ Successfully joined network:', referrerInfo);
    // You can add additional success handling here
    // Maybe show a success notification
    setShowManualEntry(false);
    // Refresh data
    loadReferralData();
    loadNetworkData();
  }, [loadReferralData, loadNetworkData]);

  return (
    <div className="flex-1 p-custom space-y-1 overflow-y-auto game-scrollbar">
      {/* Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-xs">REFERRAL SYSTEM</span>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-cyan-300 font-mono text-xs tracking-wider">
            Invite friends and earn rewards together
          </p>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 gap-1">
        <div className="relative bg-black/40 backdrop-blur-xl border border-green-400/30 rounded-xl p-2 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-1.5">
            <GiPerson className="text-green-400 text-xs" />
            <div>
              <div className="text-green-400 font-mono font-bold text-sm tracking-wider">
                {dataLoaded ? referralData.totalReferrals : '...'}
              </div>
              <div className="text-green-300 text-xs font-mono uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>

        <div className="relative bg-black/40 backdrop-blur-xl border border-blue-400/30 rounded-xl p-2 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="flex items-center gap-1.5">
            <GiPresent className="text-blue-400 text-xs" />
            <div>
              <div className="text-blue-400 font-mono font-bold text-sm tracking-wider">
                {dataLoaded ? referralData.activeReferrals : '...'}
              </div>
              <div className="text-blue-300 text-xs font-mono uppercase tracking-wider">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="flex gap-0.5">
        {tabs.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Icon size={10} />
            <span className="hidden sm:inline">{name}</span>
          </button>
        ))}
      </div>

      {/* Enhanced Debug Section */}
      {import.meta.env.DEV && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(251,146,60,0.1)]">
          <div className="flex items-center justify-between mb-1">
            <div className="text-orange-400 font-mono font-bold text-xs tracking-wider">DEBUG INFO</div>
            <div className="flex gap-1">
              <button
                onClick={refreshData}
                className="text-green-400 hover:text-green-300 font-mono text-xs tracking-wider"
              >
                REFRESH
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-orange-300 text-xs font-mono tracking-wider"
              >
                {showDebug ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
          {showDebug && (
            <div className="space-y-1 text-xs font-mono tracking-wider">
              <div className="text-orange-300">
                <span className="text-orange-400">Data Loaded:</span> {dataLoaded ? 'Yes' : 'No'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Total Referrals:</span> {referralData.totalReferrals}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Active Referrals:</span> {referralData.activeReferrals}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Referral Code:</span> {referralData.code}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">User ID:</span> {user?.id || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Claimed Rewards:</span> {claimedRewards.join(', ') || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">GameContext:</span> Available
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Start Parameter:</span> {debugInfo.startParam || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Referral Status:</span> {debugInfo.processed ? 'Processed' : 'Pending'}
              </div>
              {debugInfo.referredBy && (
                <div className="text-green-300">
                  <span className="text-green-400">Referred By:</span> {debugInfo.referredBy}
                </div>
              )}
              {debugInfo.error && (
                <div className="text-red-300">
                  <span className="text-red-400">Error:</span> {debugInfo.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {!dataLoaded && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
          <div className="text-center">
            <div className="text-2xl mb-2 animate-spin">⏳</div>
            <div className="text-gray-400 font-mono font-bold text-xs tracking-wider">LOADING REFERRAL DATA...</div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {dataLoaded && activeTab === 'overview' && (
        <div className="space-y-2">
          {/* Referral Code */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center mb-2">
              <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">YOUR REFERRAL CODE</div>
              <div className="text-lg font-mono font-bold text-purple-300 tracking-wider mb-1">{referralData.code}</div>
              <button
                onClick={copyReferralCode}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
              >
                {copied ? '✓ COPIED' : 'COPY CODE'}
              </button>
            </div>
          </div>

          {/* Current Level */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="text-center">
              <div className="text-lg mb-1">{currentLevel.icon}</div>
              <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider mb-1">{currentLevel.name}</div>
              <div className="text-yellow-300 font-mono text-xs tracking-wider mb-1">
                Level {currentLevel.level} • {referralData.totalReferrals}/{currentLevel.requirements} referrals
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                <div 
                  className="h-1.5 bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((referralData.totalReferrals / currentLevel.requirements) * 100, 100)}%` }}
                ></div>
              </div>
              
              {nextLevel && (
                <div className="text-gray-400 font-mono text-xs tracking-wider">
                  Next: {nextLevel.name} ({nextLevel.requirements - referralData.totalReferrals} more)
                </div>
              )}
            </div>
          </div>

          {/* Total Earnings */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="text-center">
              <div className="text-green-400 font-mono font-bold text-xs tracking-wider mb-1">TOTAL EARNINGS</div>
              <div className="flex justify-center gap-3">
                <div>
                  <div className="text-green-300 font-mono font-bold text-sm tracking-wider">{referralData.rewards.points.toLocaleString()}</div>
                  <div className="text-green-400 text-xs font-mono uppercase tracking-wider">Points</div>
                </div>
                <div>
                  <div className="text-green-300 font-mono font-bold text-sm tracking-wider">{referralData.rewards.gems}</div>
                  <div className="text-green-400 text-xs font-mono uppercase tracking-wider">Gems</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Manual Entry Button if user has no referrer */}
          {!referralData.referrals.length && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,146,60,0.1)]">
              <div className="text-center">
                <div className="text-orange-400 font-mono font-bold text-xs tracking-wider mb-2">🔗 JOIN A NETWORK</div>
                <p className="text-orange-300 font-mono text-xs tracking-wider mb-3">
                  Have a referral code? Join someone's network to earn bonus rewards!
                </p>
                <button
                  onClick={handleManualReferralEntry}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-orange-400"
                >
                  ENTER REFERRAL CODE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {dataLoaded && activeTab === 'network' && (
        <div className="space-y-2">
          {/* Network Overview */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center mb-3">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-2">🌐 YOUR NETWORK</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-green-400 font-bold">{networkStats.totalNetworkSize}</div>
                  <div className="text-gray-400">Total Members</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-blue-400 font-bold">{networkStats.totalNetworkEarnings.toLocaleString()}</div>
                  <div className="text-gray-400">Network Earnings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upline Section */}
          {uplineData.length > 0 && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
              <div className="text-center mb-2">
                <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-2">👆 YOUR UPLINE</div>
                <div className="text-purple-300 font-mono text-xs tracking-wider">
                  People who referred you
                </div>
              </div>
              
              <div className="space-y-2">
                {uplineData.map((member) => (
                  <div key={member.id} className="relative bg-gray-800/50 rounded-lg p-2 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{member.level}</span>
                        </div>
                        <div>
                          <div className="text-purple-300 font-mono font-bold text-xs">{member.username}</div>
                          <div className="text-gray-400 font-mono text-xs">{member.rank}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-400 font-mono font-bold text-xs">{member.totalEarned.toLocaleString()}</div>
                        <div className="text-gray-400 font-mono text-xs">Total Earned</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-xs font-mono">{member.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Downline Section */}
          {downlineData.length > 0 ? (
            <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <div className="text-center mb-2">
                <div className="text-green-400 font-mono font-bold text-xs tracking-wider mb-2">�� YOUR DOWNLINE</div>
                <div className="text-green-300 font-mono text-xs tracking-wider">
                  People you referred
                </div>
              </div>
              
              <div className="space-y-2">
                {downlineData.map((member, index) => (
                  <div key={member.id} className="relative bg-gray-800/50 rounded-lg p-2 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-green-300 font-mono font-bold text-xs">{member.username}</div>
                          <div className="text-gray-400 font-mono text-xs">{member.rank}</div>
                          <div className="text-gray-500 font-mono text-xs">
                            {Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24))} days ago
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-mono font-bold text-xs">{member.totalEarned.toLocaleString()}</div>
                        <div className="text-gray-400 font-mono text-xs">Total Earned</div>
                        <div className="text-gray-500 font-mono text-xs">{member.directReferrals} referrals</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-xs font-mono">{member.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-gray-400 font-mono font-bold text-xs tracking-wider mb-2">NO REFERRALS YET</div>
                <div className="text-gray-500 font-mono text-xs tracking-wider mb-3">
                  Start building your network by sharing your referral code!
                </div>
                <button
                  onClick={() => setActiveTab('share')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
                >
                  SHARE YOUR CODE
                </button>
              </div>
            </div>
          )}

          {/* Network Tree Visualization */}
          {(uplineData.length > 0 || downlineData.length > 0) && (
            <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="text-center mb-2">
                <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-2">🌳 NETWORK TREE</div>
              </div>
              
              <div className="space-y-2">
                {/* Upline visualization */}
                {uplineData.map((member, index) => (
                  <div key={`up-${member.id}`} className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-1">
                        <span className="text-white text-xs font-bold">{member.level}</span>
                      </div>
                      <div className="text-purple-300 font-mono text-xs">{member.username}</div>
                    </div>
                    {index < uplineData.length - 1 && (
                      <div className="w-px h-4 bg-purple-400/50 mx-auto"></div>
                    )}
                  </div>
                ))}
                
                {/* Current user */}
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mb-1 border-2 border-cyan-300">
                      <span className="text-white text-sm font-bold">YOU</span>
                    </div>
                    <div className="text-cyan-300 font-mono text-xs">{user?.username}</div>
                  </div>
                </div>
                
                {/* Downline visualization */}
                {downlineData.slice(0, 5).map((member, index) => (
                  <div key={`down-${member.id}`} className="flex items-center justify-center">
                    {index === 0 && (
                      <div className="w-px h-4 bg-green-400/50 mx-auto"></div>
                    )}
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-1">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="text-green-300 font-mono text-xs">{member.username}</div>
                    </div>
                  </div>
                ))}
                
                {downlineData.length > 5 && (
                  <div className="text-center text-gray-400 font-mono text-xs">
                    +{downlineData.length - 5} more members
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {dataLoaded && activeTab === 'referrals' && (
        <div className="space-y-2">
          {/* Referral List Header */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">YOUR REFERRALS</div>
              <div className="text-gray-400 font-mono text-xs tracking-wider">
                {referralData.totalReferrals} total • {referralData.activeReferrals} active
              </div>
            </div>
          </div>

          {/* Referral List */}
          <div className="space-y-1">
            {referralData.referrals.length > 0 ? (
              referralData.referrals.map((referral, index) => (
                <div key={referral.id} className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                  {/* Rank Badge */}
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">#{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pr-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{referral.username.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-cyan-300 font-mono font-bold text-xs tracking-wider">{referral.username}</div>
                        <div className="text-gray-400 font-mono text-xs tracking-wider">
                          {new Date(referral.joinedAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 font-mono text-xs tracking-wider">
                          {Math.floor((Date.now() - referral.joinedAt) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider">{referral.pointsEarned.toLocaleString()}</div>
                      <div className="text-gray-400 font-mono text-xs tracking-wider">Points</div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${referral.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className={`text-xs font-mono tracking-wider ${referral.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {referral.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar for Points */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
                      <span>Progress</span>
                      <span>{Math.floor((referral.pointsEarned / 10000) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((referral.pointsEarned / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-xl p-4 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-gray-400 font-mono font-bold text-xs tracking-wider mb-1">NO REFERRALS YET</div>
                  <div className="text-gray-500 font-mono text-xs tracking-wider mb-2">
                    Share your referral code to start earning rewards!
                  </div>
                  <button
                    onClick={() => setActiveTab('share')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
                  >
                    SHARE REFERRAL CODE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {dataLoaded && activeTab === 'rewards' && (
        <div className="space-y-1">
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">REWARD STATUS</div>
              <div className="text-cyan-300 font-mono text-xs tracking-wider">
                Total Referrals: {referralData.totalReferrals} | Claimed: {claimedRewards.length}
              </div>
            </div>
          </div>

          {REFERRAL_REWARDS.map((reward) => {
            const isUnlocked = referralData.totalReferrals >= reward.requirements;
            const isClaimed = claimedRewards.includes(`${reward.level}_${reward.requirements}`);
            const canClaim = isUnlocked && !isClaimed && !isClaimingReward;
            
            return (
              <div key={reward.level} className={`relative bg-black/40 backdrop-blur-xl border rounded-xl p-2 transition-all duration-300 ${
                isUnlocked 
                  ? 'border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                  : 'border-gray-600/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">{reward.icon}</div>
                    <div>
                      <div className={`font-mono font-bold text-xs tracking-wider ${
                        isUnlocked ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {reward.name}
                      </div>
                      <div className="text-gray-400 font-mono text-xs tracking-wider">
                        {reward.requirements} referrals required
                      </div>
                      <div className="text-gray-500 font-mono text-xs tracking-wider">
                        Progress: {Math.min(referralData.totalReferrals, reward.requirements)}/{reward.requirements}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider">
                      +{reward.rewards.points} pts, +{reward.rewards.gems} gems
                    </div>
                    {reward.rewards.special && (
                      <div className="text-purple-400 font-mono text-xs tracking-wider">
                        {reward.rewards.special}
                      </div>
                    )}
                    {canClaim && (
                      <button
                        onClick={() => claimReward(reward)}
                        disabled={isClaimingReward}
                        className="mt-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaimingReward ? 'CLAIMING...' : 'CLAIM'}
                      </button>
                    )}
                    {isClaimed && (
                      <div className="text-green-400 text-xs font-mono tracking-wider mt-1">✓ CLAIMED</div>
                    )}
                    {!isUnlocked && (
                      <div className="text-gray-500 text-xs font-mono tracking-wider mt-1">
                        Need {reward.requirements - referralData.totalReferrals} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dataLoaded && activeTab === 'share' && (
        <div className="space-y-2">
          {/* Share Options */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center mb-2">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider mb-1">SHARE YOUR REFERRAL LINK</div>
              <div className="text-cyan-300 font-mono text-xs tracking-wider mb-2 break-all">
                {`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`}
              </div>
              <button
                onClick={shareReferral}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
              >
                {copied ? '✓ LINK COPIED' : 'SHARE LINK'}
              </button>
            </div>
          </div>

         <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center">
              <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">QR CODE</div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
              >
                {showQR ? 'HIDE QR' : 'SHOW QR'}
              </button>
                          {showQR && (
              <div className="mt-2 p-3 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`)}`}
                  alt="Referral QR Code"
                  className="w-48 h-48 mx-auto"
                />
                <div className="text-gray-600 font-mono text-xs tracking-wider mt-2">
                  Scan to join with referral code: {referralData.code}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="text-center">
              <div className="text-green-400 font-mono font-bold text-xs tracking-wider mb-1">SHARE ON SOCIAL</div>
              <div className="flex justify-center gap-1">
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-blue-400"
                >
                  Twitter
                </button>
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`)}&text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-2 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-blue-400"
                >
                  Telegram
                </button>
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-green-400"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dataLoaded && activeTab === 'analytics' && (
        <div className="space-y-2">
          {/* Analytics Overview */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="text-center mb-2">
              <div className="text-yellow-400 font-mono font-bold text-xs tracking-wider mb-1">📊 REFERRAL ANALYTICS</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-1.5">
                  <div className="text-green-400 font-bold">{referralData.analytics.totalAttempts}</div>
                  <div className="text-gray-400">Total Attempts</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-1.5">
                  <div className="text-blue-400 font-bold">{referralData.analytics.successfulReferrals}</div>
                  <div className="text-gray-400">Successful</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-1.5">
                  <div className="text-red-400 font-bold">{referralData.analytics.failedAttempts}</div>
                  <div className="text-gray-400">Failed</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-1.5">
                  <div className="text-purple-400 font-bold">{referralData.analytics.conversionRate.toFixed(1)}%</div>
                  <div className="text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Tester */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center mb-2">
              <div className="text-purple-400 font-mono font-bold text-xs tracking-wider mb-1">🔧 CODE TESTER</div>
              <div className="space-y-1">
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Enter referral code to test..."
                  className="w-full px-2 py-1.5 bg-gray-800/50 text-white rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none font-mono text-xs"
                />
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      if (testCode.trim()) {
                        const result = await testReferralCode(testCode.trim());
                        alert(result.success ? `✅ Valid code! Referrer: ${result.referrer}` : `❌ ${result.error}`);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
                  >
                    TEST CODE
                  </button>
                  <button
                    onClick={async () => {
                      // Simulate start parameter processing
                      const launchParams = { startParam: testCode.trim() };
                      if (launchParams.startParam) {
                        console.log('🧪 Simulating start parameter:', launchParams.startParam);
                        alert(`🧪 Simulating referral link: https://t.me/DivineTaps_bot/mine?startapp=${launchParams.startParam}`);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-blue-400"
                  >
                    SIMULATE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Attempts History */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-2 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-cyan-400 font-mono font-bold text-xs tracking-wider">📜 ATTEMPT HISTORY</div>
              <button
                onClick={clearReferralHistory}
                className="text-red-400 hover:text-red-300 font-mono text-xs tracking-wider"
              >
                CLEAR
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {referralData.referralAttempts.length > 0 ? (
                referralData.referralAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-gray-800/50 rounded-lg p-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          attempt.status === 'success' ? 'bg-green-400' :
                          attempt.status === 'failed' ? 'bg-red-400' :
                          attempt.status === 'invalid' ? 'bg-yellow-400' :
                          attempt.status === 'duplicate' ? 'bg-blue-400' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="text-xs font-mono text-gray-300">{attempt.code}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {new Date(attempt.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {attempt.reason && (
                      <div className="text-xs text-gray-500 mt-1">{attempt.reason}</div>
                    )}
                    {attempt.referrer_username && (
                      <div className="text-xs text-green-400 mt-1">By: {attempt.referrer_username}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-3">
                  <div className="text-lg mb-1">📋</div>
                  <div className="text-xs">No referral attempts yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-4 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-3xl mb-3 animate-bounce">
              {rewardMessage.includes('🚫') ? '❌' : '🎉'}
            </div>
            
            <h3 className="text-white font-mono font-bold text-lg mb-3 tracking-wider">
              {rewardMessage.includes('🚫') ? 'REWARD UNAVAILABLE' : 'REWARD UNLOCKED!'}
            </h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-3 border border-cyan-400/30 mb-4">
              <p className="text-cyan-200 text-xs font-mono tracking-wider whitespace-pre-line">
                {rewardMessage}
              </p>
            </div>
            
            <button
              onClick={() => setShowRewardModal(false)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-2 px-4 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              {rewardMessage.includes('🚫') ? 'UNDERSTOOD' : 'AWESOME! ✨'}
            </button>
          </div>
        </div>
      )}

      {/* Add Manual Entry Modal */}
      {showManualEntry && (
        <ReferralPrompt 
          onClose={handleReferralPromptClose}
          onSuccess={handleReferralPromptSuccess}
        />
      )}
    </div>
  );
};