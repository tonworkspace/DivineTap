import { supabase } from "./supabaseClient";

interface ReferralConfig {
  MAX_LEVEL: number;
  REWARDS: { [key: number]: number };
  VOLUME_TRACKING_DEPTH: number; // Infinity for team volume
}

export const REFERRAL_CONFIG: ReferralConfig = {
  MAX_LEVEL: 5,
  REWARDS: {
    1: 0.10, // 10% for level 1
    2: 0.05, // 5% for level 2
    3: 0.03, // 3% for level 3
    4: 0.02, // 2% for level 4
    5: 0.01  // 1% for level 5
  },
  VOLUME_TRACKING_DEPTH: Infinity
};

export const referralSystem = {
  async createReferralChain(userId: number, referrerId: number): Promise<boolean> {
    try {
      // Get upline chain
      const { data: upline } = await supabase
        .from('referral_chain')
        .select('*')
        .eq('user_id', referrerId)
        .order('level', { ascending: true });

      // Create referral relationships
      const relationships = [
        {
          user_id: userId,
          referrer_id: referrerId,
          level: 1
        }
      ];

      // Add upper levels up to max
      if (upline) {
        upline.forEach((ref, index) => {
          if (index + 2 <= REFERRAL_CONFIG.MAX_LEVEL) {
            relationships.push({
              user_id: userId,
              referrer_id: ref.referrer_id,
              level: index + 2
            });
          }
        });
      }

      // Insert all relationships
      await supabase
        .from('referral_chain')
        .insert(relationships);

      return true;
    } catch (error) {
      console.error('Referral chain creation failed:', error);
      return false;
    }
  },

  async processReferralRewards(userId: number, amount: number): Promise<void> {
    try {
      const { data: referrers } = await supabase
        .from('referral_chain')
        .select('referrer_id, level')
        .eq('user_id', userId)
        .lte('level', REFERRAL_CONFIG.MAX_LEVEL);

      if (!referrers?.length) return;

      // Process all rewards in a single transaction
      await supabase.rpc('process_referral_rewards', {
        p_referrers: referrers,
        p_amount: amount,
        p_config: REFERRAL_CONFIG.REWARDS
      });

    } catch (error) {
      console.error('Referral reward processing failed:', error);
    }
  },

  async updateTeamVolume(userId: number, amount: number): Promise<void> {
    try {
      // Get entire upline (no level limit for team volume)
      const { data: upline } = await supabase
        .from('referral_chain')
        .select('referrer_id')
        .eq('user_id', userId);

      if (!upline) return;

      // Update team volume for all upline members
      const updates = upline.map(ref => 
        supabase.rpc('increment_team_volume', { user_id: ref.referrer_id, increment_by: amount })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Team volume update failed:', error);
    }
  }
}; 