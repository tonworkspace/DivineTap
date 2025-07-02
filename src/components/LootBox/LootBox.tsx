import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import confetti from 'canvas-confetti';

interface LootBoxProps {
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'mystery';
  price: number;
  onPurchase: () => Promise<void>;
  onOpen: () => Promise<{
    type: 'ton' | 'nft' | 'ticket' | 'collection' | 'golden';
    value: number | string;
    rarity?: string;
  }>;
}

const tierConfig = {
  common: {
    color: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-500/50',
    label: 'Common Box',
    description: 'Contains common rewards with a chance for rare items'
  },
  rare: {
    color: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/50',
    label: 'Rare Box',
    description: 'Higher chance of rare rewards and exclusive items'
  },
  epic: {
    color: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/50',
    label: 'Epic Box',
    description: 'Premium rewards with guaranteed rare items'
  },
  legendary: {
    color: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/50',
    label: 'Legendary Box',
    description: 'The most exclusive rewards and unique items'
  },
  mystery: {
    color: 'from-green-400 to-green-600',
    glow: 'shadow-green-500/50',
    label: 'Mystery Box',
    description: 'Special seasonal rewards and limited items'
  }
};

const LootBox: React.FC<LootBoxProps> = ({ tier, price, onPurchase }) => {
  const [state, setState] = useState<'idle' | 'purchasing' | 'opening' | 'revealing'>('idle');
  const [reward, setReward] = useState<any>(null);
  const config = tierConfig[tier];

  const handlePurchase = async () => {
    try {
      setState('purchasing');
      await onPurchase();
      setState('idle');
    } catch (error) {
      console.error('Purchase failed:', error);
      setState('idle');
    }
  };

  // const handleOpen = async () => {
  //   try {
  //     setState('opening');
  //     // Trigger box opening animation
  //     await new Promise(resolve => setTimeout(resolve, 2000));
      
  //     const reward = await onOpen();
  //     setReward(reward);
  //     setState('revealing');
      
  //     // Trigger confetti for rare rewards
  //     if (reward.type === 'nft' || reward.type === 'golden') {
  //       confetti({
  //         particleCount: 100,
  //         spread: 70,
  //         origin: { y: 0.6 }
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Opening failed:', error);
  //     setState('idle');
  //   }
  // };

  return (
    <div className="relative">
      <motion.div
        className={`
          relative w-full aspect-square rounded-2xl overflow-hidden
          bg-gradient-to-br ${config.color}
          shadow-lg ${config.glow}
          cursor-pointer
          hover:scale-105 transition-transform duration-300
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Box Content */}
        <AnimatePresence>
          {state === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
            >
              <div className="text-xl font-bold text-white mb-2">{config.label}</div>
              <div className="text-sm text-white/80 text-center mb-4">{config.description}</div>
              <button
                onClick={handlePurchase}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full
                         text-white font-medium transition-colors"
              >
                Buy for {price} TON
              </button>
            </motion.div>
          )}

          {state === 'opening' && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 0.8, 1.1, 1] }}
              transition={{ duration: 2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-white rounded-full border-t-transparent animate-spin" />
            </motion.div>
          )}

          {state === 'revealing' && reward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <div className="text-2xl font-bold text-white mb-4">
                {reward.type === 'ton' && `${reward.value} TON`}
                {reward.type === 'nft' && `${reward.rarity} NFT`}
                {reward.type === 'ticket' && 'Bonus Ticket'}
                {reward.type === 'collection' && 'Collection Item'}
                {reward.type === 'golden' && 'Golden Ticket'}
              </div>
              <button
                onClick={() => {
                  setState('idle');
                  setReward(null);
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full
                         text-white font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Box Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-shine" />
      </motion.div>
    </div>
  );
};

export default LootBox; 