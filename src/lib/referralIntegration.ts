import { supabase } from './supabaseClient';

// Referral reward constants
const REFERRAL_REWARDS = {
  HARVEST_BONUS: 0.1, // 10% of referred user's harvest goes to referrer
  WELCOME_BONUS: 1000, // Extra points for new users
};

// Function to handle referral harvest bonuses
export const processReferralHarvestBonus = async (
  harvesterId: number, 
  harvestAmount: number
) => {
  try {
    // Find the referrer for this user
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .select('referrer_id, status')
      .eq('referred_id', harvesterId)
      .eq('status', 'active')
      .single();
      
    if (referralError || !referralData) {
      return { success: false, bonusAmount: 0 };
    }
    
    // Calculate bonus (10% of harvest amount)
    const bonusAmount = Math.floor(harvestAmount * REFERRAL_REWARDS.HARVEST_BONUS);
    
    // Update referrer's croaks balance
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('total_sbt')
      .eq('id', referralData.referrer_id)
      .single();
      
    if (referrerError) throw referrerError;
    
    const newTotalSbt = (referrerData.total_sbt || 0) + bonusAmount;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_sbt: newTotalSbt })
      .eq('id', referralData.referrer_id);
      
    if (updateError) throw updateError;
    
    // Log the referral bonus
    const { error: logError } = await supabase
      .from('earning_history')
      .insert({
        user_id: referralData.referrer_id,
        amount: bonusAmount,
        type: 'referral_harvest_bonus',
        description: `Referral harvest bonus from user ${harvesterId}: ${bonusAmount} croaks`,
        created_at: new Date().toISOString()
      });
      
    if (logError) throw logError;
    
    return { success: true, bonusAmount, referrerId: referralData.referrer_id };
    
  } catch (error) {
    console.error('Error processing referral harvest bonus:', error);
    return { success: false, bonusAmount: 0 };
  }
};

// Function to give welcome bonus to new referred users
export const giveWelcomeBonus = async (userId: number,) => {
  try {
    // Check if user already received welcome bonus
    const { data: existingBonus } = await supabase
      .from('earning_history')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'welcome_bonus')
      .single();
      
    if (existingBonus) {
      return { success: false, message: 'Welcome bonus already given' };
    }
    
    // Add 1000 points to user's frog miner data
    const { data: minerData, error: minerError } = await supabase
      .from('frog_miner_data')
      .select('points, frogs')
      .eq('id', userId)
      .single();
      
    if (minerError && minerError.code !== 'PGRST116') throw minerError;
    
    const currentPoints = minerData?.points || 0;
    const newPoints = currentPoints + REFERRAL_REWARDS.WELCOME_BONUS;
    
    const { error: updateError } = await supabase
      .from('frog_miner_data')
      .upsert({
        id: userId,
        points: newPoints,
        frogs: minerData?.frogs || []
      });
      
    if (updateError) throw updateError;
    
    // Log the welcome bonus
    const { error: logError } = await supabase
      .from('earning_history')
      .insert({
        user_id: userId,
        amount: REFERRAL_REWARDS.WELCOME_BONUS,
        type: 'welcome_bonus',
        description: 'Welcome bonus for joining via referral',
        created_at: new Date().toISOString()
      });
      
    if (logError) throw logError;
    
    return { success: true, bonusAmount: REFERRAL_REWARDS.WELCOME_BONUS };
    
  } catch (error) {
    console.error('Error giving welcome bonus:', error);
    return { success: false, bonusAmount: 0 };
  }
};

// Function to update referral status when user becomes active
export const updateReferralStatus = async (userId: number, isActive: boolean) => {
  try {
    const { error } = await supabase
      .from('referrals')
      .update({ status: isActive ? 'active' : 'inactive' })
      .eq('referred_id', userId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating referral status:', error);
    return { success: false };
  }
}; 