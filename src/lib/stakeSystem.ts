import { supabase } from './supabaseClient';

export const STAKE_CONFIG = {
  MIN_STAKE: 1,
  STK_DEPOSIT_RATE: 0.1,
  STK_WITHDRAWAL_RATE: 0.1,
  GLP_RATE: 0.1,
  REINVESTMENT_RATE: 0.2
};

export const stakeSystem = {
  async createStake(userId: number, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('create_stake', {
        p_user_id: userId,
        p_amount: amount
      });
      return !error;
    } catch (error) {
      console.error('Stake creation failed:', error);
      return false;
    }
  },

  async processWithdrawal(userId: number, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('process_withdrawal', {
        p_user_id: userId,
        p_amount: amount
      });
      return !error;
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return false;
    }
  }
}; 