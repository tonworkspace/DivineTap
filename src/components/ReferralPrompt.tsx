import React, { useState, useCallback } from 'react';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import { GiPresent } from 'react-icons/gi';
import { BiLink, BiX } from 'react-icons/bi';

interface ReferralPromptProps {
  onClose: () => void;
  onSuccess: (referrerInfo: any) => void;
}

export const ReferralPrompt: React.FC<ReferralPromptProps> = ({ onClose, onSuccess }) => {
  const { testReferralCode, processReferralCodeManually } = useReferralIntegration();
  const [referralCode, setReferralCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmitReferralCode = useCallback(async () => {
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Test the referral code first
      const testResult = await testReferralCode(referralCode.trim());
      
      if (!testResult.success) {
        setError(testResult.error || 'Invalid referral code');
        return;
      }

      // If valid, process it using the manual processing function
      const processResult = await processReferralCodeManually(referralCode.trim());
      
      if (processResult.success) {
        setSuccess(`✅ Successfully joined ${processResult.referrer}'s network!`);
        onSuccess({
          referrer: processResult.referrer,
          code: referralCode.trim()
        });
        
        // Close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(processResult.error || 'Failed to process referral code');
      }
    } catch (error) {
      console.error('Error processing referral:', error);
      setError('An error occurred while processing your referral code');
    } finally {
      setIsProcessing(false);
    }
  }, [referralCode, testReferralCode, processReferralCodeManually, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-md mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl transition-colors duration-300"
        >
          <BiX />
        </button>

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>

        {/* Header */}
        <div className="text-4xl mb-4">🤝</div>
        <h3 className="text-white font-mono font-bold text-lg mb-3 tracking-wider">
          JOIN THE NETWORK
        </h3>

        {/* Description */}
        <div className="bg-cyan-500/10 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/20 mb-6">
          <p className="text-cyan-200 text-sm font-mono tracking-wider mb-2">
            Were you invited by a friend? Enter their referral code to join their network and earn bonus rewards!
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-300">
            <GiPresent />
            <span>Bonus rewards for both of you!</span>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-cyan-400 font-mono font-bold text-sm mb-2 tracking-wider">
            REFERRAL CODE
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="DIVINE123456ABCD"
            className="w-full bg-black/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white font-mono text-sm tracking-wider placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
            disabled={isProcessing}
          />
          {error && (
            <div className="mt-2 text-red-400 font-mono text-xs tracking-wider">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="mt-2 text-green-400 font-mono text-xs tracking-wider">
              {success}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleSubmitReferralCode}
            disabled={isProcessing || !referralCode.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin">⏳</div>
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <BiLink />
                <span>JOIN NETWORK</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-gray-600 to-gray-500 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-gray-500 hover:to-gray-400 transition-all duration-300 flex items-center gap-2"
          >
            <BiX />
            <span>SKIP</span>
          </button>
        </div>

        {/* Bottom info */}
        <div className="mt-4 text-xs text-gray-400 font-mono tracking-wider">
          You can always join a network later in the Friends tab
        </div>
      </div>
    </div>
  );
}; 