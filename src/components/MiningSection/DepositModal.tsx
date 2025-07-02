import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import useAuth from '@/hooks/useAuth';
// import { initUtils } from '@/utils/telegramUtils';
import { miningSystem } from '@/lib/supabaseClient';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUserData } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  // const [showConfirmation, setShowConfirmation] = useState(false);

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    const maxAmount = user?.total_sbt || 0;
    setAmount(((maxAmount * percentage) / 100).toString());
  };

  const calculateEstimatedRewards = (depositAmount: number) => {
    const dailyRate = 0.01; // 1% daily
    const dailyReward = depositAmount * dailyRate;
    const monthlyReward = dailyReward * 30;
    return {
      daily: dailyReward.toFixed(2),
      monthly: monthlyReward.toFixed(2),
    };
  };

  const handleStartMining = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const depositAmount = Math.floor(parseFloat(amount));
    
    if (depositAmount < 100) {
      toast.error('Minimum deposit is 100 SBT');
      return;
    }

    if (depositAmount > (user?.total_sbt || 0)) {
      toast.error('Insufficient SBT balance');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { success, error } = await miningSystem.startMining(user.id, depositAmount);
      
      if (!success) {
        throw new Error(error || 'Failed to start mining');
      }
      
      toast.success('Mining started successfully!');
      if (updateUserData) {
        updateUserData({
          total_sbt: (user.total_sbt || 0) - depositAmount,
          mining_power: depositAmount
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error starting mining:', error);
      toast.error(error.message || 'Failed to start mining');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const estimatedRewards = amount ? calculateEstimatedRewards(parseFloat(amount)) : { daily: '0', monthly: '0' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-gradient-to-b from-[#1A1B1E] to-[#141517] rounded-2xl w-full max-w-md overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Start Mining</h2>
              <p className="text-sm text-white/60">Deposit SBT to begin earning rewards</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Balance Display */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/60">Available Balance</span>
              <span className="text-sm font-medium text-white">{user?.total_sbt || 0} SBT</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm text-white/60">Deposit Amount</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">SBT</span>
            </div>
            
            {/* Percentage buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handlePercentageClick(percent)}
                  className="py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Rewards */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm text-white/60 mb-3">Estimated Rewards</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/40 mb-1">Daily</div>
                <div className="text-lg font-semibold text-green-400">+{estimatedRewards.daily} SBT</div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Monthly</div>
                <div className="text-lg font-semibold text-green-400">+{estimatedRewards.monthly} SBT</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartMining}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (user?.total_sbt || 0)}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > (user?.total_sbt || 0)
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Mining
              </>
            )}
          </button>

          {/* Info Section */}
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-white/60">
                <p>Mining rewards are distributed daily. The more SBT you stake, the higher your rewards.</p>
                <p className="mt-1">Minimum deposit: 100 SBT</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 