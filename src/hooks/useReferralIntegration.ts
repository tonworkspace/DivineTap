import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabaseClient';
import { giveWelcomeBonus, updateReferralStatus } from '@/lib/referralIntegration';

export const useReferralIntegration = () => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<{
    referrerId: number | null;
    hasReceivedWelcomeBonus: boolean;
    isActive: boolean;
  } | null>(null);

  // Check if user was referred and give welcome bonus
  useEffect(() => {
    const checkAndProcessReferral = async () => {
      if (!user?.id) return;

      try {
        // Check if user has a referrer
        const { data: referral, error: referralError } = await supabase
          .from('referrals')
          .select('referrer_id, status')
          .eq('referred_id', user.id)
          .single();

        if (referralError && referralError.code !== 'PGRST116') {
          throw referralError;
        }

        if (referral) {
          setReferralData({
            referrerId: referral.referrer_id,
            hasReceivedWelcomeBonus: false,
            isActive: referral.status === 'active'
          });

          // Check if user already received welcome bonus
          const { data: existingBonus, error: bonusError } = await supabase
            .from('earning_history')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'welcome_bonus')
            .single();

          if (bonusError && bonusError.code !== 'PGRST116') {
            throw bonusError;
          }

          if (!existingBonus) {
            // Give welcome bonus
            const result = await giveWelcomeBonus(user.id);
            if (result.success) {
              setReferralData(prev => prev ? {
                ...prev,
                hasReceivedWelcomeBonus: true
              } : null);
              console.log('Welcome bonus given:', result.bonusAmount);
            }
          } else {
            setReferralData(prev => prev ? {
              ...prev,
              hasReceivedWelcomeBonus: true
            } : null);
          }
        }
      } catch (error) {
        console.error('Error processing referral:', error);
      }
    };

    checkAndProcessReferral();
  }, [user?.id]);

  // Update referral status when user becomes active
  const markUserAsActive = async () => {
    if (!user?.id || !referralData?.referrerId) return;

    try {
      const result = await updateReferralStatus(user.id, true);
      if (result.success) {
        setReferralData(prev => prev ? {
          ...prev,
          isActive: true
        } : null);
      }
    } catch (error) {
      console.error('Error marking user as active:', error);
    }
  };

  return {
    referralData,
    markUserAsActive,
    hasReferrer: !!referralData?.referrerId,
    isActiveReferral: referralData?.isActive || false
  };
}; 