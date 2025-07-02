import { useState } from 'react';

interface WalletEditModalProps {
  currentWallet?: string;
  onSave: (wallet: string) => void;
  onClose: () => void;
}

export default function WalletEditModal({ currentWallet, onSave, onClose }: WalletEditModalProps) {
  const [wallet, setWallet] = useState(currentWallet || '');
  const [isValid, setIsValid] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateWallet = (address: string) => {
    // Add TON wallet validation logic here
    return address.length >= 48;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[#1A1B1E] rounded-xl w-full max-w-md p-6">
        {showConfirm ? (
          <>
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">⚠️ Important Notice</h3>
            <p className="text-white/70 mb-6">
              Your wallet address cannot be changed after submission. Please verify it carefully.
            </p>
            <div className="bg-white/5 rounded-lg p-3 mb-6">
              <div className="text-sm text-white/60 mb-1">Wallet Address</div>
              <div className="text-sm font-medium text-white break-all">{wallet}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/5 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => onSave(wallet)}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg"
              >
                Confirm & Lock
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">Set Withdrawal Wallet</h3>
            <input
              type="text"
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setIsValid(validateWallet(e.target.value));
              }}
              placeholder="Enter TON wallet address"
              className="w-full bg-white/5 rounded-lg px-3 py-2 mb-4"
            />
            {!isValid && (
              <p className="text-red-400 text-sm mb-4">Please enter a valid TON wallet address</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => isValid && setShowConfirm(true)}
                disabled={!isValid}
                className="flex-1 px-4 py-2 bg-blue-500 rounded-lg disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 