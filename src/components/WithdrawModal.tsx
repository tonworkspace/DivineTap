import { FC, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export const WithdrawModal: FC<WithdrawModalProps> = ({ isOpen, onClose, availableBalance }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState(user?.wallet_address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      setError('');

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        throw new Error('Invalid withdrawal amount');
      }

      if (withdrawAmount > availableBalance) {
        throw new Error('Insufficient balance');
      }

      if (!withdrawalAddress) {
        throw new Error('Please enter a valid withdrawal address');
      }

      // Create withdrawal request
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: withdrawAmount,
          wallet_address: withdrawalAddress,
          status: 'pending'
        });

      if (withdrawError) throw withdrawError;

      // Update user's available balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          available_balance: `available_balance - ${withdrawAmount}`
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1B1E] rounded-xl p-4 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
        
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-sm text-white/60">Available Balance</div>
            <div className="text-lg font-semibold">{availableBalance.toFixed(2)} TON</div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm text-white/60 mb-1 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2"
            />
          </div>

          {/* Wallet Address Input */}
          <div>
            <label className="text-sm text-white/60 mb-1 block">Withdrawal Address</label>
            <input
              type="text"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
              placeholder="Enter TON wallet address"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal; 