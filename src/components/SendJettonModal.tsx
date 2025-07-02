import { useState } from "react";
import { JettonBalance } from "@ton-api/client";
import { toDecimals } from "../utility/decimals";
import { Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getJettonTransaction } from "../utility/jetton-transfer";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, AlertCircle, Loader2 } from "lucide-react"; // Import icons

interface SendJettonModalProps {
  jetton: JettonBalance;
  senderAddress: Address;
  onClose: () => void;
}

export const SendJettonModal = ({
  jetton,
  senderAddress,
  onClose,
}: SendJettonModalProps) => {
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tonConnectUI] = useTonConnectUI();

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const transaction = getJettonTransaction(
        jetton,
        amount,
        recipientAddress,
        senderAddress
      );

      await tonConnectUI.sendTransaction(transaction);
      setError(null);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1E1E1E] rounded-2xl max-w-md w-full overflow-hidden border border-gray-800 shadow-xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Send {jetton.jetton.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    Available: {toDecimals(jetton.balance, jetton.jetton.decimals)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Recipient Address Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter recipient address"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <button
                      onClick={() => setAmount(toDecimals(jetton.balance, jetton.jetton.decimals))}
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 bg-gray-900/50">
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !amount || !recipientAddress}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2
                  ${
                    isLoading || !amount || !recipientAddress
                      ? 'bg-blue-500/50 cursor-not-allowed text-white/50'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } transition-colors`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send {jetton.jetton.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
