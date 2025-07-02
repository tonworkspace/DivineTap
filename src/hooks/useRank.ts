import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { rankSystem } from '@/lib/rankSystem';
import { RANK_REQUIREMENTS } from '@/lib/rankSystem';

export const useRank = (userId: number) => {
  const [currentRank, setCurrentRank] = useState<string>('NONE');
  const [rankProgress] = useState({
    directReferrals: 0,
    teamVolume: 0,
    totalStake: 0
  });

  useEffect(() => {
    if (!userId) return;

    const checkRank = async () => {
      const newRank = await rankSystem.calculateRank(userId);
      setCurrentRank(newRank);
    };

    // Subscribe to user changes
    const subscription = supabase
      .channel(`public:users:id=eq.${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${userId}`
      }, checkRank)
      .subscribe();

    checkRank();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  return { currentRank, rankProgress, RANK_REQUIREMENTS };
}; 