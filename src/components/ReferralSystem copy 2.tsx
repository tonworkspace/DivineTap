import React, { useState, useCallback } from 'react';
import { GiPerson, GiPresent, GiShare } from 'react-icons/gi';
import { BiLink } from 'react-icons/bi';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import './ReferralSystem.css';

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
    generateTelegramReferralLink,
    loadReferralData,
    processStartParameter,
    isProcessing,
    debugInfo,
    testReferralCode,
    clearReferralHistory
  } = useReferralIntegration();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'rewards' | 'share' | 'analytics'>('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [copied, setCopied] = useState(false);
        const [showDebug, setShowDebug] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [testCode, setTestCode] = useState('');

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

  // Claim referral reward
  const claimReward = useCallback((reward: ReferralReward) => {
    if (referralData.totalReferrals >= reward.requirements) {
      addPoints(reward.rewards.points);
      addGems(reward.rewards.gems);
      
      setRewardMessage(`🎉 ${reward.name} unlocked! +${reward.rewards.points} Points, +${reward.rewards.gems} Gems${reward.rewards.special ? ` • ${reward.rewards.special}` : ''}`);
      setShowRewardModal(true);
    }
  }, [referralData.totalReferrals, addPoints, addGems]);

  // Get current level info
  const getCurrentLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level) || REFERRAL_REWARDS[0];
  }, [referralData.level]);

  // Get next level info
  const getNextLevel = useCallback(() => {
    return REFERRAL_REWARDS.find(r => r.level === referralData.level + 1);
  }, [referralData.level]);

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  return (
    <div className="flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
      {/* Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">REFERRAL SYSTEM</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-cyan-300 font-mono text-xs tracking-wider">
            Invite friends and earn rewards together
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative bg-black/40 backdrop-blur-xl border border-green-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <div className="flex items-center gap-2">
            <GiPerson className="text-green-400 text-sm" />
            <div>
              <div className="text-green-400 font-mono font-bold text-sm tracking-wider">{referralData.totalReferrals}</div>
              <div className="text-green-300 text-xs font-mono uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>

        <div className="relative bg-black/40 backdrop-blur-xl border border-blue-400/30 rounded-xl p-3 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <div className="flex items-center gap-2">
            <GiPresent className="text-blue-400 text-sm" />
            <div>
              <div className="text-blue-400 font-mono font-bold text-sm tracking-wider">{referralData.activeReferrals}</div>
              <div className="text-blue-300 text-xs font-mono uppercase tracking-wider">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1">
        {[
          { id: 'overview', name: 'Overview', icon: GiShare },
          { id: 'referrals', name: 'Referrals', icon: GiPerson },
          { id: 'rewards', name: 'Rewards', icon: GiPresent },
          { id: 'share', name: 'Share', icon: BiLink },
          { id: 'analytics', name: 'Analytics', icon: GiPresent }
        ].map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Icon size={12} />
            {name}
          </button>
        ))}
      </div>

      {/* Debug Section (only in development) */}
      {import.meta.env.DEV && (
        <div className="relative bg-black/40 backdrop-blur-xl border border-orange-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,146,60,0.1)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-orange-400 font-mono font-bold text-sm tracking-wider">DEBUG INFO</div>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-orange-300 text-xs font-mono tracking-wider"
            >
              {showDebug ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {showDebug && (
            <div className="space-y-2 text-xs font-mono tracking-wider">
              <div className="text-orange-300">
                <span className="text-orange-400">Start Param:</span> {retrieveLaunchParams().startParam || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Debug Start Param:</span> {debugInfo.startParam || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Referred By:</span> {debugInfo.referredBy || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Processing Status:</span> {isProcessing ? 'Processing...' : (debugInfo.processed ? 'Processed' : 'Not Processed')}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Error:</span> {debugInfo.error || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Last Attempt:</span> {debugInfo.lastAttempt ? `${debugInfo.lastAttempt.status} - ${debugInfo.lastAttempt.reason || 'N/A'}` : 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Your Code:</span> {referralData.code}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Telegram Link:</span> {generateTelegramReferralLink()}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">User ID:</span> {user?.id || 'None'}
              </div>
              <div className="text-orange-300">
                <span className="text-orange-400">Has Referrals:</span> {referralData.totalReferrals > 0 ? 'Yes' : 'No'}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => processStartParameter()}
                  className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs rounded"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Reprocess'}
                </button>
                <button
                  onClick={() => loadReferralData()}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs rounded"
                >
                  Reload Data
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Referral Code */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center mb-3">
              <div className="text-purple-400 font-mono font-bold text-sm tracking-wider mb-1">YOUR REFERRAL CODE</div>
              <div className="text-2xl font-mono font-bold text-purple-300 tracking-wider mb-2">{referralData.code}</div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
              >
                {copied ? '✓ COPIED' : 'COPY CODE'}
              </button>
            </div>
          </div>

          {/* Current Level */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="text-center">
              <div className="text-2xl mb-2">{currentLevel.icon}</div>
              <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider mb-1">{currentLevel.name}</div>
              <div className="text-yellow-300 font-mono text-xs tracking-wider mb-2">
                Level {currentLevel.level} • {referralData.totalReferrals}/{currentLevel.requirements} referrals
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
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
          <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="text-center">
              <div className="text-green-400 font-mono font-bold text-sm tracking-wider mb-1">TOTAL EARNINGS</div>
              <div className="flex justify-center gap-4">
                <div>
                  <div className="text-green-300 font-mono font-bold text-lg tracking-wider">{referralData.rewards.points.toLocaleString()}</div>
                  <div className="text-green-400 text-xs font-mono uppercase tracking-wider">Points</div>
                </div>
                <div>
                  <div className="text-green-300 font-mono font-bold text-lg tracking-wider">{referralData.rewards.gems}</div>
                  <div className="text-green-400 text-xs font-mono uppercase tracking-wider">Gems</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="space-y-3">
          {/* Referral List Header */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center">
              <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider mb-1">YOUR REFERRALS</div>
              <div className="text-gray-400 font-mono text-xs tracking-wider">
                {referralData.totalReferrals} total • {referralData.activeReferrals} active
              </div>
            </div>
          </div>

          {/* Referral List */}
          <div className="space-y-2">
            {referralData.referrals.length > 0 ? (
              referralData.referrals.map((referral, index) => (
                <div key={referral.id} className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">#{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{referral.username.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-cyan-300 font-mono font-bold text-sm tracking-wider">{referral.username}</div>
                        <div className="text-gray-400 font-mono text-xs tracking-wider">
                          Joined {new Date(referral.joinedAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 font-mono text-xs tracking-wider">
                          {Math.floor((Date.now() - referral.joinedAt) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider">{referral.pointsEarned.toLocaleString()}</div>
                      <div className="text-gray-400 font-mono text-xs tracking-wider">Points Earned</div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${referral.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className={`text-xs font-mono tracking-wider ${referral.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {referral.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar for Points */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 font-mono mb-1">
                      <span>Progress</span>
                      <span>{Math.floor((referral.pointsEarned / 10000) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((referral.pointsEarned / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="relative bg-black/40 backdrop-blur-xl border border-gray-600/30 rounded-xl p-6 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <div className="text-gray-400 font-mono font-bold text-sm tracking-wider mb-2">NO REFERRALS YET</div>
                  <div className="text-gray-500 font-mono text-xs tracking-wider mb-4">
                    Share your referral code to start earning rewards!
                  </div>
                  <button
                    onClick={() => setActiveTab('share')}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
                  >
                    SHARE REFERRAL CODE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-2">
          {REFERRAL_REWARDS.map((reward) => {
            const isUnlocked = referralData.totalReferrals >= reward.requirements;
            const isClaimed = referralData.rewards.special.includes(reward.rewards.special || '');
            
            return (
              <div key={reward.level} className={`relative bg-black/40 backdrop-blur-xl border rounded-xl p-3 transition-all duration-300 ${
                isUnlocked 
                  ? 'border-green-400/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                  : 'border-gray-600/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{reward.icon}</div>
                    <div>
                      <div className={`font-mono font-bold text-sm tracking-wider ${
                        isUnlocked ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {reward.name}
                      </div>
                      <div className="text-gray-400 font-mono text-xs tracking-wider">
                        {reward.requirements} referrals required
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider">
                      +{reward.rewards.points} pts, +{reward.rewards.gems} gems
                    </div>
                    {reward.rewards.special && (
                      <div className="text-purple-400 font-mono text-xs tracking-wider">
                        {reward.rewards.special}
                      </div>
                    )}
                    {isUnlocked && !isClaimed && (
                      <button
                        onClick={() => claimReward(reward)}
                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-green-400"
                      >
                        CLAIM
                      </button>
                    )}
                    {isClaimed && (
                      <div className="text-green-400 text-xs font-mono tracking-wider mt-2">✓ CLAIMED</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'share' && (
        <div className="space-y-3">
          {/* Share Options */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="text-center mb-3">
              <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider mb-2">SHARE YOUR REFERRAL LINK</div>
              <div className="text-cyan-300 font-mono text-xs tracking-wider mb-3">
                {`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`}
              </div>
              <button
                onClick={shareReferral}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-cyan-400"
              >
                {copied ? '✓ LINK COPIED' : 'SHARE LINK'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center">
              <div className="text-purple-400 font-mono font-bold text-sm tracking-wider mb-2">QR CODE</div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
              >
                {showQR ? 'HIDE QR' : 'SHOW QR'}
              </button>
              {showQR && (
                <div className="mt-3 p-4 bg-white rounded-lg">
                  <div className="text-gray-400 font-mono text-xs tracking-wider">
                    QR Code would be generated here
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="text-center">
              <div className="text-green-400 font-mono font-bold text-sm tracking-wider mb-2">SHARE ON SOCIAL</div>
              <div className="flex justify-center gap-2">
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-blue-400"
                >
                  Twitter
                </button>
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`)}&text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-400 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-blue-400"
                >
                  Telegram
                </button>
                <button 
                  onClick={() => {
                    const text = `🚀 Join DivineTap Mining and start earning rewards! Use my referral link: https://t.me/DivineTaps_bot/mine?startapp=${referralData.code}`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-green-400"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-3">
          {/* Analytics Overview */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="text-center mb-3">
              <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider mb-2">📊 REFERRAL ANALYTICS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-green-400 font-bold">{referralData.analytics.totalAttempts}</div>
                  <div className="text-gray-400">Total Attempts</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-blue-400 font-bold">{referralData.analytics.successfulReferrals}</div>
                  <div className="text-gray-400">Successful</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-red-400 font-bold">{referralData.analytics.failedAttempts}</div>
                  <div className="text-gray-400">Failed</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-purple-400 font-bold">{referralData.analytics.conversionRate.toFixed(1)}%</div>
                  <div className="text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Tester */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
            <div className="text-center mb-3">
              <div className="text-purple-400 font-mono font-bold text-sm tracking-wider mb-2">🔧 CODE TESTER</div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Enter referral code to test..."
                  className="w-full px-3 py-2 bg-gray-800/50 text-white rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none font-mono text-sm"
                />
                <button
                  onClick={async () => {
                    if (testCode.trim()) {
                      const result = await testReferralCode(testCode.trim());
                      alert(result.success ? `✅ Valid code! Referrer: ${result.referrer}` : `❌ ${result.error}`);
                    }
                  }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold tracking-wider rounded-lg transition-all duration-300 border border-purple-400"
                >
                  TEST CODE
                </button>
              </div>
            </div>
          </div>

          {/* Referral Attempts History */}
          <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-cyan-400 font-mono font-bold text-sm tracking-wider">📜 ATTEMPT HISTORY</div>
              <button
                onClick={clearReferralHistory}
                className="text-red-400 hover:text-red-300 font-mono text-xs tracking-wider"
              >
                CLEAR
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {referralData.referralAttempts.length > 0 ? (
                referralData.referralAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-gray-800/50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
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
                <div className="text-center text-gray-500 py-4">
                  <div className="text-2xl mb-2">📋</div>
                  <div className="text-sm">No referral attempts yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            
            <h3 className="text-white font-mono font-bold text-xl mb-4 tracking-wider">REWARD UNLOCKED!</h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/30 mb-6">
              <p className="text-cyan-200 text-sm font-mono tracking-wider">{rewardMessage}</p>
            </div>
            
            <button
              onClick={() => setShowRewardModal(false)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              AWESOME! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};