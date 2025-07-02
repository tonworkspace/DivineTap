import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import useAuth from '@/hooks/useAuth'
import { initUtils } from '@/utils/telegramUtils'
import toast from 'react-hot-toast'
import { GiFrog, GiBasket, GiTrophy, GiShare } from 'react-icons/gi'
// import { Tooltip, InfoTooltip, SuccessTooltip } from '@/components/ui/tooltip'

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


// // Add these new types at the top with other interfaces
// type SortField = 'active_referrals' | 'referral_count' | 'total_earned' | 'total_deposit';
// type SortDirection = 'asc' | 'desc';

// Add these constants for accumulation rates (tokens per day)
const ACCUMULATION_RATES = [
  { minReferrals: 1, tokensPerDay: 10 },
  { minReferrals: 5, tokensPerDay: 50 },
  { minReferrals: 15, tokensPerDay: 150 },
  { minReferrals: 30, tokensPerDay: 300 },
  { minReferrals: 50, tokensPerDay: 500 },
  { minReferrals: 100, tokensPerDay: 1000 },
];

// Calculate accumulation rate based on active referrals
const calculateAccumulationRate = (activeReferrals: number): number => {
  const qualifiedTier = ACCUMULATION_RATES
    .filter(tier => activeReferrals >= tier.minReferrals)
    .pop();
    
  return qualifiedTier ? qualifiedTier.tokensPerDay : 0;
};

// Calculate accumulated tokens since last claim
const calculateAccumulatedTokens = (lastClaimDate: Date | null, accumulationRate: number): number => {
  if (!lastClaimDate) return accumulationRate; // First time claim gets one day's worth
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastClaimDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24); // Convert ms to days
  
  return Math.floor(diffDays * accumulationRate);
};

// Add these constants for level capacities
const LEVEL_CAPACITIES: {[key: number]: number} = {
  1: 50,  // Level 1 can hold max 50 referrals
  2: 40,  // Level 2 can hold max 40 referrals
  3: 30,  // You can adjust these values as needed
  4: 20,
  5: 10
};

// Add this function to determine which level a referral belongs to
const determineReferralLevel = (index: number): number => {
  if (index < LEVEL_CAPACITIES[1]) return 1;
  if (index < LEVEL_CAPACITIES[1] + LEVEL_CAPACITIES[2]) return 2;
  if (index < LEVEL_CAPACITIES[1] + LEVEL_CAPACITIES[2] + LEVEL_CAPACITIES[3]) return 3;
  if (index < LEVEL_CAPACITIES[1] + LEVEL_CAPACITIES[2] + LEVEL_CAPACITIES[3] + LEVEL_CAPACITIES[4]) return 4;
  return 5;
};

// Add these new constants for better integration
const REFERRAL_REWARDS = {
  // Daily token accumulation based on active referrals
  DAILY_RATES: [
    { minReferrals: 1, tokensPerDay: 10 },
    { minReferrals: 5, tokensPerDay: 50 },
    { minReferrals: 15, tokensPerDay: 150 },
    { minReferrals: 30, tokensPerDay: 300 },
    { minReferrals: 50, tokensPerDay: 500 },
    { minReferrals: 100, tokensPerDay: 1000 },
  ],
  
  // Bonus croaks for referrer when referred user harvests
  HARVEST_BONUS: 0.1, // 10% of referred user's harvest goes to referrer
  
  // Bonus points for referred user (first-time bonus)
  WELCOME_BONUS: 1000, // Extra points for new users
  
  // Level-up bonuses for referrer
  LEVEL_BONUSES: {
    1: 500,   // Level 1: 500 croaks
    2: 1000,  // Level 2: 1000 croaks
    3: 2000,  // Level 3: 2000 croaks
    4: 5000,  // Level 4: 5000 croaks
    5: 10000, // Level 5: 10000 croaks
  }
};

// Add this function to calculate referral bonuses
const calculateReferralBonuses = (activeReferrals: number, level: number) => {
  const dailyRate = REFERRAL_REWARDS.DAILY_RATES
    .filter(tier => activeReferrals >= tier.minReferrals)
    .pop()?.tokensPerDay || 0;
    
  const levelBonus = REFERRAL_REWARDS.LEVEL_BONUSES[level as keyof typeof REFERRAL_REWARDS.LEVEL_BONUSES] || 0;
  
  return { dailyRate, levelBonus };
};

const ReferralSystem = () => {
  const [, setReferrals] = useState<ReferralWithUsers[]>([]);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary>({
    total_referrals: 0,
    total_users: 0,
    active_referrals: 0,
    inactive_referrals: 0,
    conversion_rate: 0
  });
  const { user, updateUserData } = useAuth();
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

  // Add this to your component state
  const [stakingRewardsTiers] = useState([
    { minReferrals: 1, tokens: 100 },
    { minReferrals: 5, tokens: 500 },
    { minReferrals: 15, tokens: 1500 },
    { minReferrals: 30, tokens: 3000 },
    { minReferrals: 50, tokens: 5000 },
    { minReferrals: 100, tokens: 10000 },
  ]);

  // Add these states for claiming functionality
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaimedDate, setLastClaimedDate] = useState<Date | null>(null);
  const [claimableTokens, setClaimableTokens] = useState(0);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  // Add these new state variables
  const [accumulationRate, setAccumulationRate] = useState<number>(0);

  // Add this state in your component
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);

  // Add this state to track the selected level
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  // Add these new state variables
  const [levelReferrals, setLevelReferrals] = useState<ReferralWithUsers[]>([]);
  const [isLoadingLevelReferrals, setIsLoadingLevelReferrals] = useState<boolean>(false);

  // Add new state for better integration
  const [referralBonuses, setReferralBonuses] = useState({
    dailyRate: 0,
    levelBonus: 0,
    totalEarned: 0
  });

  // // Add state for harvest bonuses
  // const [recentHarvestBonuses, setRecentHarvestBonuses] = useState<Array<{
  //   amount: number;
  //   timestamp: Date;
  //   referredUser: string;
  // }>>([]);

  // // Add this helper function to calculate staking tokens
  // const calculateStakingTokens = (activeReferrals: number): number => {
  //   // Find the highest tier the user qualifies for
  //   const qualifiedTier = stakingRewardsTiers
  //     .filter(tier => activeReferrals >= tier.minReferrals)
  //     .pop();
      
  //   return qualifiedTier ? qualifiedTier.tokens : 0;
  // };

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
      setReferralLink(`https://t.me/CroakKingdom_bot?start=${user.telegram_id}`);
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
      
      // Assign levels to referrals based on their index
      const referralsWithLevels = data?.map((referral, index) => ({
        ...referral,
        level: determineReferralLevel(index)
      })) || [];
      
      setUserReferrals(referralsWithLevels);
      
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
      toast.error('Failed to load referrals. Please try again.');
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
      const inviteLink = `https://t.me/CroakKingdom_bot?start=${user.telegram_id}`;
      const shareText = `Stake TON, earn rewards, and build your referral network with TonStake! 💎 Join me in this exciting Telegram mini app and start earning passive income now! 🚀 Click the link and let's stake together!`;
      const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
      utils.openTelegramLink(fullUrl);
    } else {
      console.error('User ID is missing. Cannot generate referral link.');
      toast.error('Unable to generate referral link. Please try again.');
    }
  }, [user]);

  // Fetch accumulated tokens and last claim date
  const fetchAccumulatedTokens = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get user's last claim date and current referral count
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('last_sbt_claim, total_sbt')
        .eq('id', user.id)
        .single();
        
      if (userError && userError.code !== 'PGRST116') throw userError;
      
      // Set last claim date if it exists
      const lastClaim = userData?.last_sbt_claim ? new Date(userData.last_sbt_claim) : null;
      setLastClaimedDate(lastClaim);
      
      // Calculate accumulation rate based on active referrals
      const rate = calculateAccumulationRate(userActiveReferrals);
      setAccumulationRate(rate);
      
      // Calculate accumulated tokens since last claim
      const accumulated = calculateAccumulatedTokens(lastClaim, rate);
      setClaimableTokens(accumulated);
      
    } catch (error) {
      console.error('Error fetching accumulated tokens:', error);
    }
  }, [user?.id, userActiveReferrals]);
  
  // Update accumulated tokens periodically
  useEffect(() => {
    if (!user?.id) return;
    
    // Initial fetch
    fetchAccumulatedTokens();
    
    // Set up interval to update accumulation (every minute)
    const intervalId = setInterval(() => {
      if (lastClaimedDate && accumulationRate > 0) {
        const accumulated = calculateAccumulatedTokens(lastClaimedDate, accumulationRate);
        setClaimableTokens(accumulated);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [user?.id, fetchAccumulatedTokens, lastClaimedDate, accumulationRate]);
  
  // Add this effect to calculate referral bonuses
  useEffect(() => {
    if (userActiveReferrals > 0) {
      const bonuses = calculateReferralBonuses(userActiveReferrals, selectedLevel);
      setReferralBonuses(prev => ({
        ...prev,
        dailyRate: bonuses.dailyRate,
        levelBonus: bonuses.levelBonus
      }));
    }
  }, [userActiveReferrals, selectedLevel]);

  // Add this effect to fetch total referral earnings
  useEffect(() => {
    const fetchReferralEarnings = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('earning_history')
          .select('amount')
          .eq('user_id', user.id)
          .in('type', ['referral_sbt', 'referral_harvest_bonus', 'level_bonus']);
          
        if (error) throw error;
        
        const totalEarned = data?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
        setReferralBonuses(prev => ({ ...prev, totalEarned }));
      } catch (error) {
        console.error('Error fetching referral earnings:', error);
      }
    };
    
    fetchReferralEarnings();
  }, [user?.id]);

  // Enhanced claim function with better integration
  const handleClaimTokens = async () => {
    if (claimableTokens <= 0) return;
    
    setIsClaiming(true);
    try {
      // Get the current user's SBT balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('total_sbt')
        .eq('id', user?.id)
        .single();
      
      if (userError) throw userError;
      
      // Calculate the new total SBT balance
      const currentSBT = userData.total_sbt || 0;
      const newSBTBalance = currentSBT + claimableTokens;
      
      // Update the user's SBT balance and last claim date
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          total_sbt: newSBTBalance,
          last_sbt_claim: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      // Log the transaction
      const { error: logError } = await supabase
        .from('earning_history')
        .insert({
          user_id: user?.id,
          amount: claimableTokens,
          type: 'referral_sbt',
          description: `Referral tokens claimed: ${claimableTokens} croaks`,
          created_at: new Date().toISOString()
        });
        
      if (logError) throw logError;
      
      // Update state
      const now = new Date();
      setLastClaimedDate(now);
      setClaimableTokens(0);
      setShowClaimSuccess(true);
      
      // Update user data
      if (updateUserData) {
        updateUserData({ total_sbt: newSBTBalance });
      }
      
      // Show success message with details
      toast.success(`Successfully claimed ${claimableTokens} croaks!`);
      
      setTimeout(() => setShowClaimSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error claiming tokens:', error);
      toast.error('Failed to claim tokens. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };
  
  // Calculate claimable tokens on component mount and when active referrals change
  useEffect(() => {
    if (!user?.id) return;
    
    const calculateClaimableTokens = () => {
      // Use the accumulation system instead of staking tokens
      const rate = calculateAccumulationRate(userActiveReferrals);
      const accumulated = calculateAccumulatedTokens(lastClaimedDate, rate);
      setClaimableTokens(accumulated);
    };
    
    calculateClaimableTokens();
  }, [user?.id, userActiveReferrals, lastClaimedDate]);

  // Add or update the copy link function
  const handleCopyLink = useCallback(() => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          setShowCopySnackbar(true);
          toast.success('Referral link copied to clipboard!');
          setTimeout(() => setShowCopySnackbar(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast.error('Failed to copy link. Please try again.');
        });
    }
  }, [referralLink]);

  // Add this useEffect to fetch referrals for the selected level
  useEffect(() => {
    const fetchLevelReferrals = async () => {
      if (!user?.id) return;
      
      setIsLoadingLevelReferrals(true);
      try {
        // Filter the userReferrals array to get only referrals for the selected level
        const filteredReferrals = userReferrals.filter(referral => referral.level === selectedLevel);
        setLevelReferrals(filteredReferrals);
      } catch (error) {
        console.error(`Error fetching level ${selectedLevel} referrals:`, error);
      } finally {
        setIsLoadingLevelReferrals(false);
      }
    };
    
    fetchLevelReferrals();
  }, [selectedLevel, user?.id, userReferrals]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="flex flex-col items-center space-y-4 max-w-sm w-full">
          {/* Compact Loading Animation */}
          <div className="relative">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <GiFrog size={40} className="text-green-600 animate-bounce" />
              </div>
              
              {/* Fewer orbiting particles */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateX(30px)`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center space-y-1">
            <div className="text-xs text-green-500 font-medium">LOADING REFERRAL SYSTEM</div>
            <div className="text-xs text-green-700 font-medium">
              🐸 Hopping into your network...
            </div>
            <div className="text-xs text-gray-500 animate-pulse">
              Gathering your referral data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
      <div className="w-full max-w-md space-y-6">
        {/* Success notification */}
        {showClaimSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center animate-bounce">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tokens claimed successfully!
          </div>
        )}
        
        {/* Enhanced Stats Cards */}
        {user?.id && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-green-700 font-bold mb-1">Active Referrals</h3>
                  <p className="text-2xl font-bold text-green-800">{userActiveReferrals}</p>
                  <p className="text-xs text-green-600">Level {selectedLevel}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <GiFrog size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-2 w-full bg-white/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full shadow transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, userActiveReferrals * 5)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-yellow-700 font-bold mb-1">Daily Earnings</h3>
                  <p className="text-xl font-bold text-yellow-800">
                    {referralBonuses.dailyRate} CROAKS/day
                  </p>
                  <p className="text-xs text-yellow-600">+{referralBonuses.levelBonus} level bonus</p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                  <GiBasket size={24} className="text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Claim Tokens Card */}
        <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
              <GiBasket size={24} className="text-yellow-600" />
              Claim Referral Rewards
            </h3>
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
              <GiTrophy size={16} className="text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white/50 rounded-xl p-4 mb-4 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="text-yellow-700 font-medium">Available to claim:</span>
              <span className="text-2xl font-bold text-yellow-800">{claimableTokens.toLocaleString()} CROAKS</span>
            </div>
            {lastClaimedDate && (
              <div className="mt-2 text-xs text-yellow-600">
                Last claimed: {lastClaimedDate.toLocaleDateString()} at {lastClaimedDate.toLocaleTimeString()}
              </div>
            )}
            <div className="mt-1 text-xs text-yellow-600">
              Earning {referralBonuses.dailyRate} croaks per day from {userActiveReferrals} active referrals
            </div>
            {referralBonuses.totalEarned > 0 && (
              <div className="mt-1 text-xs text-green-600">
                Total earned: {referralBonuses.totalEarned.toLocaleString()} croaks
              </div>
            )}
          </div>
          
          <button
            onClick={handleClaimTokens}
            disabled={isClaiming || claimableTokens <= 0}
            className={`w-full px-4 py-3 rounded-xl text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg ${
              claimableTokens > 0 && !isClaiming
                ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 hover:from-yellow-400 hover:to-yellow-500 text-yellow-900 border-2 border-yellow-400'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
            }`}
          >
            {isClaiming ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-600 mr-2"></div>
                Claiming...
              </div>
            ) : claimableTokens > 0 ? (
              'Claim Rewards'
            ) : (
              'No Rewards to Claim'
            )}
          </button>
          
          <p className="text-sm text-yellow-600 text-center mt-3">
            Earn more by inviting friends and helping them succeed in the game!
          </p>
        </div>
        
        {/* Referral Link Card - Similar to Catch Frog in FrogsMiner */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
              <GiShare size={24} className="text-blue-600" />
              Your Referral Link
            </h3>
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
              <GiFrog size={16} className="text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="w-full bg-white/80 rounded-xl px-4 py-3 text-blue-800 text-sm border-2 border-blue-200 focus:outline-none focus:border-blue-400"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-200 hover:bg-blue-300 rounded-lg text-blue-800 font-bold transition-colors"
                aria-label="Copy referral link"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
              
              <button
                onClick={handleInviteFriend}
                className="flex-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white rounded-lg text-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-green-400"
              >
                Invite Friend
              </button>
            </div>
            
            <p className="text-sm text-blue-600 text-center">Share this link to invite friends and earn rewards!</p>
          </div>
        </div>

        {/* Next Tier Card - Similar to Frog Collection in FrogsMiner */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
              <GiTrophy size={24} className="text-purple-600" />
              Next Reward Tier
            </h3>
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
              <GiFrog size={16} className="text-purple-600" />
            </div>
          </div>
          
          {(() => {
            const nextTier = stakingRewardsTiers.find(t => t.minReferrals > userActiveReferrals);
            const remaining = nextTier ? nextTier.minReferrals - userActiveReferrals : 0;
            return nextTier ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-800">
                    {nextTier.tokens.toLocaleString()} Croaks
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Need {remaining} more active referrals
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-200 to-pink-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-800">Max Tier!</p>
                  <p className="text-sm text-purple-600 mt-1">
                    You've reached the highest tier
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-200 to-pink-200 rounded-full p-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tabs - Similar to FrogsMiner styling */}
        <div className="bg-white/50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
          <div className="flex space-x-4 border-b-2 border-green-200 mb-4">
            <button
              onClick={() => setActiveTab('my-referrals')}
              className={`pb-2 px-4 text-lg font-bold transition-all duration-200 transform hover:scale-105 rounded-t-lg ${
                activeTab === 'my-referrals'
                  ? 'text-green-800 bg-green-100 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              My Referrals
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`pb-2 px-4 text-lg font-bold transition-all duration-200 transform hover:scale-105 rounded-t-lg ${
                activeTab === 'statistics'
                  ? 'text-green-800 bg-green-100 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              Statistics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'my-referrals' && (
            <div className="space-y-4">
              {isLoadingUserReferrals ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : userReferrals.length > 0 ? (
                <div className="space-y-4">
                  {/* Referral Levels Summary - Similar to Frog Collection */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
                    <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                      <GiFrog size={20} className="text-green-600" />
                      Referral Network
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(level => {
                        const count = userReferrals.filter(r => r.level === level).length;
                        const maxCapacity = LEVEL_CAPACITIES[level];
                        const isUnlocked = count > 0;
                        const fillPercentage = Math.min(100, (count / maxCapacity) * 100);
                        
                        return (
                          <div key={level} className="bg-white/50 rounded-lg p-3 text-center border border-green-200">
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 transform hover:scale-110 transition-transform ${
                              isUnlocked 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {level}
                            </div>
                            <p className="text-xs text-green-600 font-medium">Level {level}</p>
                            <p className="text-lg font-bold text-green-800">{count}</p>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-1 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${fillPercentage}%` }}
                              ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {isUnlocked ? `${count}/${maxCapacity}` : `Max: ${maxCapacity}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Level Tabs - Similar to Pagination in FrogsMiner */}
                  <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
                    {[1, 2, 3, 4, 5].map(level => {
                      const levelCount = userReferrals.filter(r => r.level === level).length;
                      const isUnlocked = levelCount > 0 || (level === 1 && userReferrals.length > 0);
                      
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            if (isUnlocked) {
                              setSelectedLevel(level);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-2 transform hover:scale-105 transition-all duration-200 ${
                            level === selectedLevel
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
                              : isUnlocked 
                                ? 'bg-white/80 text-green-700 hover:bg-green-100 border border-green-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Level {level}
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {levelCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Referral List - Similar to Frog Cards in FrogsMiner */}
                  <div>
                    <h3 className="text-lg font-bold text-green-800 mb-3">Level {selectedLevel} Referrals</h3>
                    {isLoadingLevelReferrals ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    ) : levelReferrals.length > 0 ? (
                      <div className="space-y-3">
                        {levelReferrals.map((referral, index) => (
                          <div 
                            key={referral.id} 
                            className={`bg-gradient-to-br ${
                              index % 3 === 0 ? 'from-blue-50 to-green-50' : 
                              index % 3 === 1 ? 'from-green-50 to-blue-50' : 
                              'from-purple-50 to-pink-50'
                            } rounded-2xl p-4 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <div>
                                <h3 className="font-bold text-green-800">
                                  {referral.referred?.username || `ID: ${referral.referred_id}`}
                                </h3>
                                <p className="text-sm text-green-600">
                                  Joined {new Date(referral.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                referral.status === 'active' 
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-red-400 to-orange-400 text-white'
                              }`}>
                                {referral.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white/50 rounded-lg p-2 border border-green-200">
                                <p className="text-xs text-green-600 font-medium">Earned</p>
                                <p className="text-sm font-bold text-green-800">{referral.referred?.total_earned?.toFixed(2) || '0'} TON</p>
                              </div>
                              <div className="bg-white/50 rounded-lg p-2 border border-green-200">
                                <p className="text-xs text-green-600 font-medium">Deposit</p>
                                <p className="text-sm font-bold text-green-800">{referral.referred?.total_deposit?.toFixed(2) || '0'} TON</p>
                              </div>
                              <div className="bg-white/50 rounded-lg p-2 border border-green-200">
                                <p className="text-xs text-green-600 font-medium">Rank</p>
                                <p className="text-sm font-bold text-green-800">{referral.referred?.rank || 'Novice'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-lg text-center">
                        <GiFrog size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600">
                          No level {selectedLevel} referrals yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 shadow-lg text-center">
                  <GiFrog size={64} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">
                    There is nothing else.<br />
                    Invite to get more rewards.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 border-2 border-blue-200 shadow-lg">
                  <h3 className="text-sm text-blue-700 font-bold mb-1">Total Network</h3>
                  <p className="text-2xl font-bold text-blue-800">{referralSummary.total_referrals.toLocaleString()}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
                  <h3 className="text-sm text-green-700 font-bold mb-1">Conversion Rate</h3>
                  <p className="text-2xl font-bold text-green-800">{referralSummary.conversion_rate}%</p>
                </div>
              </div>
              
              {/* Reward Tiers Card - Similar to Frog Collection */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200 shadow-lg">
                <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <GiTrophy size={20} className="text-purple-600" />
                  Reward Tiers
                </h3>
                <div className="space-y-3">
                  {stakingRewardsTiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-purple-200">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          userActiveReferrals >= tier.minReferrals 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {userActiveReferrals >= tier.minReferrals ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <span className="text-purple-700 font-medium">{tier.minReferrals} Referrals</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        userActiveReferrals >= tier.minReferrals 
                          ? 'text-green-600' 
                          : 'text-purple-600'
                      }`}>
                        {tier.tokens.toLocaleString()} Croaks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy Link Snackbar */}
        {showCopySnackbar && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-bounce">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Referral link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralSystem;