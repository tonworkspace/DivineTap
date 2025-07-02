import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '@/hooks/useAuth'
import { initUtils } from '@/utils/telegramUtils'

// Update the interface to match your table structure
interface ReferralWithUsers {
  id: number;
  referrer_id: number;
  referred_id: number;
  status: 'active' | 'inactive';
  created_at: string;
  level: number;
  referrer: {
    username: string;
    telegram_id: number;
  };
  referred: {
    username: string;
    telegram_id: number;
    total_earned: number;
    total_deposit: number;
    rank: string;
  };
}

interface ReferralSummary {
  total_referrals: number;
  total_users: number;
  active_referrals: number;
  inactive_referrals: number;
  conversion_rate: number;
}

type ReferrerDataFromDB = {
  referrer_id: number;
  referrer: {
    username: string;
    total_earned: number;
    total_deposit: number;
    rank: string;
  } | null;
  status: string;
}

interface ReferrerStat {
  referrer_id: number;
  username: string;
  referral_count: number;
  active_referrals: number;
  total_earned: number;
  total_deposit: number;
  rank: string;
}

// Add this after the other interface definitions
interface StakingRewards {
  minReferrals: number;
  tokens: number;
}

// // Add these new types at the top with other interfaces
// type SortField = 'active_referrals' | 'referral_count' | 'total_earned' | 'total_deposit';
// type SortDirection = 'asc' | 'desc';

const ReferralSystem = () => {
  const [, setReferrals] = useState<ReferralWithUsers[]>([]);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary>({
    total_referrals: 0,
    total_users: 0,
    active_referrals: 0,
    inactive_referrals: 0,
    conversion_rate: 0
  });
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [, setTotalCount] = useState<number>(0);
  const [, setAllReferrerStats] = useState<ReferrerStat[]>([]);
  const [userReferralCount, setUserReferralCount] = useState<number>(0);
  const [userActiveReferrals, setUserActiveReferrals] = useState<number>(0);

  // Add pagination state
  const [pageSize,] = useState<number>(50);
  const [, setIsLoadingMore] = useState<boolean>(false);

  // Add a new state for user's referrals
  const [userReferrals, setUserReferrals] = useState<ReferralWithUsers[]>([]);
  const [isLoadingUserReferrals, setIsLoadingUserReferrals] = useState<boolean>(false);

  // Add a state to control visibility (optional)
  const [] = useState<boolean>(false);

  // Add state for active tab
  const [activeTab, setActiveTab] = useState<'my-referrals' | 'statistics'>('my-referrals');

  // Add this constant for staking rewards tiers
  const stakingRewardsTiers: StakingRewards[] = [
    { minReferrals: 1, tokens: 100 },
    { minReferrals: 5, tokens: 500 },
    { minReferrals: 10, tokens: 1000 },
    { minReferrals: 25, tokens: 2500 },
    { minReferrals: 50, tokens: 5000 },
    { minReferrals: 100, tokens: 10000 },
  ];

  // Add this helper function to calculate staking tokens
  const calculateStakingTokens = (activeReferrals: number): number => {
    const tier = stakingRewardsTiers
      .slice()
      .reverse()
      .find(t => activeReferrals >= t.minReferrals);
    return tier?.tokens || 0;
  };

  // // Add these new state variables in the component
  // const [sortField, setSortField] = useState<SortField>('active_referrals');
  // const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  // const [searchTerm, setSearchTerm] = useState('');

  // // Add this sorting function in the component
  // const getSortedReferrers = () => {
  //   return allReferrerStats
  //     .filter(referrer => 
  //       referrer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       referrer.referrer_id.toString().includes(searchTerm)
  //     )
  //     .sort((a, b) => {
  //       const multiplier = sortDirection === 'desc' ? -1 : 1;
  //       return multiplier * (a[sortField] - b[sortField]);
  //     })
  //     .slice(0, 10);
  // };

  useEffect(() => {
    if (user?.id) {
      console.log("User ID detected:", user.id);
      console.log("User object:", user);
      setReferralLink(`https://t.me/Tonstak3it_bot?start=${user.telegram_id}`);
    } else {
      console.log("No user ID available in first useEffect");
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Starting loadData function");
        // First get the total count of all referrals
        const { count: totalReferralsCount, error: countError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        
        // Get active referrals count
        const { count: activeCount, error: activeError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
          
        if (activeError) throw activeError;
        
        // Get unique referrers count
        const { data: uniqueReferrers, error: referrersError } = await supabase
          .from('referrals')
          .select('referrer_id')
          .limit(100000); // Set a high limit to get all records
          
        if (referrersError) throw referrersError;
        
        const uniqueReferrerCount = new Set(uniqueReferrers?.map(r => r.referrer_id)).size;
        
        // Calculate summary
        const totalCount = totalReferralsCount || 0;
        const activeReferrals = activeCount || 0;
        const inactiveReferrals = totalCount - activeReferrals;
        
        const summary = {
          total_referrals: totalCount,
          total_users: uniqueReferrerCount,
          active_referrals: activeReferrals,
          inactive_referrals: inactiveReferrals,
          conversion_rate: totalCount ? 
            Math.round((activeReferrals / totalCount) * 100) : 0
        };
        
        setReferralSummary(summary);
        setTotalCount(totalCount);

        // Get current user's referral count if user exists
        if (user?.id) {
          console.log("Attempting to get user referrals in loadData for user ID:", user.id);
          const { data: userReferrals, error: userRefError } = await supabase
            .from('referrals')
            .select('id, status')
            .eq('referrer_id', user.id);
            
          if (userRefError) {
            console.error("Error fetching user referrals in loadData:", userRefError);
          }
          
          if (!userRefError && userReferrals) {
            console.log("User referrals found in loadData:", userReferrals.length);
            setUserReferralCount(userReferrals.length);
            setUserActiveReferrals(userReferrals.filter(r => r.status === 'active').length);
          } else {
            console.log("No user referrals found in loadData");
          }
        } else {
          console.log("No user ID available in loadData");
        }

        // Get referrer stats with counts
        const { data: referrerStatsData } = await supabase
          .from('referrals')
          .select(`
            referrer_id,
            referrer:users!referrer_id(
              username,
              total_earned,
              total_deposit,
              rank
            ),
            status
          `) as { data: ReferrerDataFromDB[] | null, error: any };

        if (!referrerStatsData) return { data: [] };
        const counts = referrerStatsData.reduce((acc: { [key: string]: any }, curr) => {
          const id = curr.referrer_id;
          if (!acc[id]) {
            acc[id] = {
              referrer_id: id,
              username: curr.referrer?.username,
              referral_count: 0,
              active_referrals: 0,
              total_earned: curr.referrer?.total_earned || 0,
              total_deposit: curr.referrer?.total_deposit || 0,
              rank: curr.referrer?.rank || 'Novice'
            };
          }
          acc[id].referral_count++;
          if (curr.status === 'active') {
            acc[id].active_referrals++;
          }
          return acc;
        }, {});
        
        const referrerStats = Object.values(counts);
        setAllReferrerStats(referrerStats);

        // Then get the first page of data
        await loadReferralsPage(1);
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load referrals');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('referrals_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'referrals'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  // Add a function to load a specific page of referrals
  const loadReferralsPage = async (page: number) => {
    setIsLoadingMore(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:users!referrer_id(username, telegram_id),
          referred:users!referred_id(
            username,
            telegram_id,
            total_earned,
            total_deposit,
            rank
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      if (page === 1) {
        setReferrals(data || []);
      } else {
        setReferrals(prev => [...prev, ...(data || [])]);
      }
          } catch (err) {
      console.error('Error loading referrals page:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };


  // Add this function to load user referrals
  const loadUserReferrals = async () => {
    if (!user?.id) {
      console.log("No user ID available in loadUserReferrals");
      return;
    }
    
    console.log("Loading referrals in loadUserReferrals for user ID:", user.id);
    setIsLoadingUserReferrals(true);
    try {
      // First check if we're using the correct ID field
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, telegram_id')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error("Error fetching user in loadUserReferrals:", userError);
        throw userError;
      }
      
      console.log("Found user in loadUserReferrals:", userData);
      
      // Now fetch the referrals using the confirmed user ID
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:users!referred_id(
            username,
            telegram_id,
            total_earned,
            total_deposit,
            rank,
            is_active
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching referrals in loadUserReferrals:", error);
        throw error;
      }
      
      console.log("Fetched referrals in loadUserReferrals:", data?.length || 0);
      setUserReferrals(data || []);
      
      // Update the referral counts here as well
      if (data) {
        console.log("Setting user referral count to:", data.length);
        console.log("Setting active referrals to:", data.filter(r => r.status === 'active').length);
        setUserReferralCount(data.length);
        setUserActiveReferrals(data.filter(r => r.status === 'active').length);
      } else {
        console.log("No referrals data found");
      }
    } catch (err) {
      console.error('Error in loadUserReferrals:', err);
    } finally {
      setIsLoadingUserReferrals(false);
    }
  };

  // Call this function when the component loads
  useEffect(() => {
    if (user?.id) {
      console.log("Calling loadUserReferrals from useEffect for user ID:", user.id);
      loadUserReferrals();
    } else {
      console.log("No user ID available in loadUserReferrals useEffect");
    }
  }, [user?.id]);

  // Add a useEffect to log state changes
  useEffect(() => {
    console.log("userReferralCount changed:", userReferralCount);
    console.log("userActiveReferrals changed:", userActiveReferrals);
  }, [userReferralCount, userActiveReferrals]);

  // Add the handleInviteFriend function
  const handleInviteFriend = useCallback(() => {
    const utils = initUtils();
    
    if (user && user.id) {
      const inviteLink = `https://t.me/Tonstak3it_bot?start=${user.id}`;
      const shareText = `Stake TON, earn rewards, and build your referral network with TonStake! 💎 Join me in this exciting Telegram mini app and start earning passive income now! 🚀 Click the link and let's stake together!`;
      const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
      utils.openTelegramLink(fullUrl);
    } else {
      console.error('User ID is missing. Cannot generate referral link.');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="referral-system-con px-4 pb-24 transition-all duration-300">
      {/* Referral Link Card */}
      <div className="mt-4 bg-[#151516] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Your Referral Link</h3>
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="w-full bg-[#1A1B1E] rounded-xl px-4 py-3 text-white/80 text-sm border border-white/10 focus:outline-none"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              // You might want to add a toast/notification here
            }}
            className="w-full px-4 py-3 bg-[#4c9ce2] text-white rounded-xl text-lg font-medium transition-colors duration-200"
          >
            Copy Link
          </button>
          <button
            onClick={handleInviteFriend}
            className="w-full px-4 py-3 bg-[#4c9ce2] text-white rounded-xl text-lg font-medium transition-colors duration-200"
          >
            Invite Link
          </button>
          <p className="text-sm text-white/60 text-center">Share this link to invite friends and earn rewards!</p>
        </div>
      </div>

      {/* User Referral Stats */}
      {user?.id && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
            <h3 className="text-sm text-white/60 mb-1">Active Referrals</h3>
            <p className="text-2xl font-semibold text-white">{userActiveReferrals}</p>
            <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
              <div 
                className="bg-[#4c9ce2] h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, userActiveReferrals * 5)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
            <h3 className="text-sm text-white/60 mb-1">Tokens Earned</h3>
            <p className="text-2xl font-semibold text-white">
              {calculateStakingTokens(userActiveReferrals).toLocaleString()} STK
            </p>
          </div>
        </div>
      )}

      {/* Next Tier Card */}
      <div className="mt-4 bg-[#151516] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Next Reward Tier</h3>
        {(() => {
          const nextTier = stakingRewardsTiers.find(t => t.minReferrals > userActiveReferrals);
          const remaining = nextTier ? nextTier.minReferrals - userActiveReferrals : 0;
          return nextTier ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-[#4c9ce2]">
                  {nextTier.tokens.toLocaleString()} STK
                </p>
                <p className="text-sm text-white/60 mt-1">
                  Need {remaining} more active referrals
                </p>
              </div>
              <div className="bg-[#1A1B1E] rounded-full p-3">
                <svg className="w-8 h-8 text-[#4c9ce2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-[#4c9ce2]">Max Tier!</p>
                <p className="text-sm text-white/60 mt-1">
                  You've reached the highest tier
                </p>
              </div>
              <div className="bg-[#1A1B1E] rounded-full p-3">
                <svg className="w-8 h-8 text-[#4c9ce2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex space-x-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('my-referrals')}
            className={`pb-2 px-1 text-lg font-medium ${
              activeTab === 'my-referrals'
                ? 'text-[#4c9ce2] border-b-2 border-[#4c9ce2]'
                : 'text-white/60'
            }`}
          >
            My Referrals
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`pb-2 px-1 text-lg font-medium ${
              activeTab === 'statistics'
                ? 'text-[#4c9ce2] border-b-2 border-[#4c9ce2]'
                : 'text-white/60'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-referrals' && (
        <div className="mt-6">
          {isLoadingUserReferrals ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4c9ce2]"></div>
            </div>
          ) : userReferrals.length > 0 ? (
            <div className="space-y-4">
              {userReferrals.map((referral) => (
                <div key={referral.id} className="bg-[#151516] rounded-2xl p-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-white">
                        {referral.referred?.username || `ID: ${referral.referred_id}`}
                      </h3>
                      <p className="text-sm text-white/60">
                        Joined {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-white/60">Earned</p>
                      <p className="text-sm font-medium text-white">{referral.referred?.total_earned?.toFixed(2) || '0'} TON</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Deposit</p>
                      <p className="text-sm font-medium text-white">{referral.referred?.total_deposit?.toFixed(2) || '0'} TON</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Rank</p>
                      <p className="text-sm font-medium text-white">{referral.referred?.rank || 'Novice'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#151516] w-full rounded-2xl p-8 flex flex-col items-center mt-4">
              <svg className="w-24 h-24 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-xl text-[#8e8e93] text-center">
                There is nothing else.<br />
                Invite to get more rewards.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
              <h3 className="text-sm text-white/60 mb-1">Total Network</h3>
              <p className="text-2xl font-semibold text-white">{referralSummary.total_referrals.toLocaleString()}</p>
            </div>
            
            <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
              <h3 className="text-sm text-white/60 mb-1">Total Referrers</h3>
              <p className="text-2xl font-semibold text-white">{referralSummary.total_users.toLocaleString()}</p>
            </div>
            
            <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
              <h3 className="text-sm text-white/60 mb-1">Active Network</h3>
              <p className="text-2xl font-semibold text-white">{referralSummary.active_referrals.toLocaleString()}</p>
            </div>
            
            <div className="bg-[#151516] rounded-2xl p-4 shadow-lg">
              <h3 className="text-sm text-white/60 mb-1">Conversion Rate</h3>
              <p className="text-2xl font-semibold text-white">{referralSummary.conversion_rate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Invite Button */}
      <div className="fixed bottom-[80px] left-0 right-0 py-4 flex justify-center">
        <div className="w-full max-w-md px-4">
          <button 
            onClick={handleInviteFriend}
            className="w-full bg-[#4c9ce2] text-white py-4 rounded-xl text-lg font-medium"
          >
            Invite
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;