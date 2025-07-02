import { FC, useState } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { NFTMinter } from '@/components/NFTMinter';

interface WhitelistWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WhitelistWalletModal: FC<WhitelistWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMinted, setHasMinted] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!hasMinted) {
        throw new Error('Please mint the NFT first');
      }

      // Validate TON wallet address format
      if (!walletAddress.match(/^[0-9A-Za-z]{48}$/)) {
        throw new Error('Invalid TON wallet address format');
      }

      // Update user's wallet address in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          wallet_address: walletAddress,
          has_nft: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to whitelist wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintSuccess = async () => {
    setHasMinted(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1A1B1E] rounded-xl p-4 w-full max-w-md mx-4 border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Whitelist Wallet</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Step 1: Mint NFT */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                1
              </span>
              <h4 className="text-white font-medium">Mint Foundation Sigil</h4>
            </div>
            <NFTMinter 
              onStatusChange={(status, minted) => {
                if (status === 'success' && minted) {
                  handleMintSuccess();
                }
              }}
            />
          </div>

          {/* Step 2: Enter Wallet */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                2
              </span>
              <h4 className="text-white font-medium">Enter Wallet Address</h4>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your TON wallet address"
                    className="w-full px-3 py-2 bg-black/20 border border-white/5 rounded-lg text-white 
                      placeholder-white/40 focus:outline-none focus:border-blue-500"
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !walletAddress || !hasMinted}
                  className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200
                    ${isLoading || !walletAddress || !hasMinted
                      ? 'bg-blue-500/50 text-white/50 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    'Whitelist Wallet'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 