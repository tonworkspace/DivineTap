import { supabase } from "./supabaseClient";

export const RANK_REQUIREMENTS = {
  AMBASSADOR: {
    minDirects: 3,
    minStake: 20,
    minTeamVolume: 500,
    weeklyBonus: 15
  },
  TON_WARRIOR: {
    minDirects: 5,
    minStake: 50,
    minTeamVolume: 1000,
    weeklyBonus: 25
  },
  TON_MASTER: {
    minDirects: 10,
    minStake: 100,
    minTeamVolume: 5000,
    weeklyBonus: 100
  },
  CRYPTO_MOGUL: {
    minDirects: 10,
    minStake: 500,
    minTeamVolume: 20000,
    weeklyBonus: 250
  },
  TON_BARON: {
    minDirects: 10,
    minStake: 2000,
    minTeamVolume: 100000,
    weeklyBonus: 1000
  },
  BLOCKCHAIN_TYCOON: {
    minDirects: 10,
    minStake: 5000,
    minTeamVolume: 250000,
    weeklyBonus: 3000
  },
  TON_ELITE: {
    minDirects: 10,
    minStake: 10000,
    minTeamVolume: 500000,
    weeklyBonus: 5000
  },
  TON_BOSS: {
    minDirects: 10,
    minStake: 15000,
    minTeamVolume: 1000000,
    weeklyBonus: 7000
  }
};

type RankType = keyof typeof RANK_REQUIREMENTS;

interface RankedUser {
  id: number;
  rank: RankType;
  team_volume: number;
}

export const rankSystem = {
  async calculateRank(userId: number): Promise<string> {
    const { data: user } = await supabase
      .from('users')
      .select(`
        direct_referrals,
        total_deposit,
        team_volume,
        rank
      `)
      .eq('id', userId)
      .single();

    if (!user) return 'NONE';

    // Check ranks from highest to lowest
    for (const [rank, requirements] of Object.entries(RANK_REQUIREMENTS).reverse()) {
      if (
        user.direct_referrals >= requirements.minDirects &&
        user.total_deposit >= requirements.minStake &&
        user.team_volume >= requirements.minTeamVolume
      ) {
        return rank;
      }
    }

    return 'NONE';
  },

  async processWeeklyBonuses(): Promise<void> {
    try {
      // Get all ranked users
      const { data: rankedUsers } = await supabase
        .from('users')
        .select('id, rank, team_volume')
        .neq('rank', 'NONE');

      if (!rankedUsers) return;

      for (const user of rankedUsers as RankedUser[]) {
        const requirements = RANK_REQUIREMENTS[user.rank];
        
        // Verify minimum team volume is maintained
        if (user.team_volume >= requirements.minTeamVolume) {
          // Create bonus transaction
          await supabase
            .from('rank_bonuses')
            .insert({
              user_id: user.id,
              rank: user.rank,
              amount: requirements.weeklyBonus,
              status: 'pending',
              created_at: new Date().toISOString()
            });
        }
      }
    } catch (error) {
      console.error('Weekly bonus processing failed:', error);
    }
  }
}; 