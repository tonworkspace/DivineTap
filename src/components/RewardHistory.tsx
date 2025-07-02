import { useState, useEffect } from 'react';
import { getRewardHistory } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
// The only RewardHistory declaration in your codebase
export interface RewardHistory {
    id: number;
    user_id: number;
    stake_id: number;
    amount: number;
    reward_type: 'daily' | 'referral' | 'rank' | 'pool';
    timestamp: string;
    created_at: string;
    processed_at: string | null;
    status: 'pending' | 'processed' | 'failed';
    stake?: {
      amount: number;
      daily_rate: number;
    };
  } 

export const RewardHistory = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRewards = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const data = await getRewardHistory(user.id);
        setRewards(data);
      } catch (err) {
        setError('Failed to load rewards');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRewards();
  }, [user?.id]);

  if (isLoading) return <div>Loading rewards...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rewards.length) return <div>No rewards yet</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reward History</h2>
      <div className="space-y-2">
        {rewards.map((reward) => (
          <div 
            key={reward.id} 
            className="p-4 border rounded-lg"
          >
            <div className="flex justify-between">
              <span className="font-medium">
                {reward.reward_type.charAt(0).toUpperCase() + 
                 reward.reward_type.slice(1)} Reward
              </span>
              <span className="text-green-600">
                +{reward.amount} TON
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(reward.created_at).toLocaleDateString()}
            </div>
            {reward.stake && (
              <div className="text-sm text-gray-600">
                Stake: {reward.stake.amount} TON ({reward.stake.daily_rate}% daily)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 