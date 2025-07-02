import { FC, useState, useRef } from 'react';
import { Button, Snackbar } from '@telegram-apps/telegram-ui';
import { NFTMinter } from './NFTMinter';
import { supabase } from '@/lib/supabaseClient';

interface WithdrawalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  onWalletSubmit?: (address: string) => void;
}

export const WithdrawalInfoModal: FC<WithdrawalInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  userId,
  onWalletSubmit 
}) => {
  const [isMinted, setIsMinted] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAddress, setSubmittedAddress] = useState('');
  
  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');
  const snackbarTimeoutRef = useRef<NodeJS.Timeout>();

  const showSnackbar = (message: string, description: string = '', duration: number = 5000) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }

    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);

    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, duration);
  };

  const handleMintSuccess = async () => {
    setIsMinted(true);
    
    showSnackbar(
      'NFT Minted Successfully', 
      'Your TON Fortune Stakers NFT has been minted successfully!'
    );
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = walletAddress.trim();
    
    if (!trimmedAddress) {
      setWalletError('Wallet address is required');
      return;
    }
    
    setWalletError('');
    setIsSubmitting(true);
    
    try {
      if (userId) {
        const { error } = await supabase
          .from('users')
          .update({ whitelisted_wallet: trimmedAddress })
          .eq('id', userId);
          
        if (error) throw error;
      }
      
      if (onWalletSubmit) {
        onWalletSubmit(trimmedAddress);
      }
      
      setSubmittedAddress(trimmedAddress);
      setIsSubmitted(true);
      setWalletAddress('');
      
      showSnackbar(
        'Wallet Address Added Successfully!', 
        `Your wallet address ${trimmedAddress.slice(0, 6)}...${trimmedAddress.slice(-4)} has been submitted.`
      );
    } catch (error) {
      console.error('Error submitting wallet address:', error);
      setWalletError('Failed to submit wallet address. Please try again.');
      showSnackbar('Submission Failed', 'There was an error submitting your wallet address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gradient-to-br from-[#0A0A0F] to-[#11131A] rounded-xl p-6 w-full max-w-md mx-4 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-blue-400 leading-tight">
              Whitelist for Weekly TON Distributions
            </h3>
            <p className="text-sm text-blue-300/80 mt-2">
              Mint your TON Fortune Stakers NFT to join the whitelist and receive weekly TON distributions.
            </p>
          </div>
          <button onClick={onClose} className="text-blue-300/60 hover:text-blue-300 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isMinted && <NFTMinter onMintSuccess={handleMintSuccess} />}

        {isMinted && (
          <div className="space-y-4 mt-4">
            {isSubmitted ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h4 className="text-green-400 text-center font-medium mb-2">Wallet Address Added Successfully!</h4>
              <p className="text-white/60 text-sm text-center mb-3">Your submitted wallet address:</p>
              <div className="bg-black/30 rounded-lg p-3 break-all text-center">
                <span className="text-blue-400 text-sm font-mono">{submittedAddress}</span>
              </div>
              <Button
                onClick={onClose}
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleWalletSubmit} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Submit Your TON Wallet Address</h4>
              <p className="text-xs text-white/60 mb-3">Enter your TON wallet address to receive weekly distributions</p>
              <div className="flex flex-col space-y-3">
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="EQ..."
                  className="bg-black/30 border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {walletError && (
                  <p className="text-red-400 text-xs">{walletError}</p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting || !walletAddress.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Wallet Address'}
                </Button>
              </div>
            </form>
          )}
            
            {/* Important Notes */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Important Notes</h4>
              <ul className="text-sm text-white/60 space-y-1">
                <li>• Auto redeposit helps maintain your earning potential</li>
                <li>• STK points increase your platform status</li>
                <li>• Global pool contributes to community rewards</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Snackbar for notifications */}
      {snackbarVisible && (
        <Snackbar
          onClose={() => {
            setSnackbarVisible(false);
            if (snackbarTimeoutRef.current) {
              clearTimeout(snackbarTimeoutRef.current);
            }
          }}
          duration={5000}
          description={snackbarDescription}
          after={
            <Button 
              size="s" 
              onClick={() => {
                setSnackbarVisible(false);
                if (snackbarTimeoutRef.current) {
                  clearTimeout(snackbarTimeoutRef.current);
                }
              }}
            >
              Close
            </Button>
          }
          className="snackbar-top"
        >
          {snackbarMessage}
        </Snackbar>
      )}
    </div>
  );
}; 