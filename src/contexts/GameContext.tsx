import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface GameContextType {
  points: number;
  gems: number;
  setPoints: (points: number) => void;
  setGems: (gems: number) => void;
  addPoints: (amount: number) => void;
  addGems: (amount: number, source?: string) => void;
  activeBoosts: Array<{type: string, multiplier: number, expires: number}>;
  addBoost: (boost: {type: string, multiplier: number, expires: number}) => void;
  removeBoost: (index: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string, userId?: string) => {
    if (!userId) return baseKey; // Fallback for non-authenticated users
    return `${baseKey}_${userId}`;
  };
  
  // Points are now managed by DivineMiningGame - this is just for display
  const [points, setPoints] = useState(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userPointsKey = getUserSpecificKey('spiritualEssencePoints', userId);
    const saved = localStorage.getItem(userPointsKey);
    return saved ? parseInt(saved, 10) : 100;
  });

  const [gems, setGems] = useState(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
    const saved = localStorage.getItem(userGemsKey);
    return saved ? parseInt(saved, 10) : 10;
  });

  const [activeBoosts, setActiveBoosts] = useState<Array<{type: string, multiplier: number, expires: number}>>(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userBoostsKey = getUserSpecificKey('divineMiningBoosts', userId);
    const saved = localStorage.getItem(userBoostsKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Track last gem claim time to prevent spam
  const [lastGemClaimTime, setLastGemClaimTime] = useState(0);

  // Gem transaction logging
  const logGemTransaction = useCallback((amount: number, source: string, newTotal: number) => {
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const logKey = getUserSpecificKey('gemTransactionLog', userId);
    const existingLog = localStorage.getItem(logKey);
    
    let transactionLog = existingLog ? JSON.parse(existingLog) : [];
    
    // Add new transaction
    const transaction = {
      timestamp: Date.now(),
      amount,
      source,
      newTotal,
      userId: userId,
      sessionId: Date.now().toString(36) // Simple session identifier
    };
    
    transactionLog.push(transaction);
    
    // Keep only last 100 transactions to prevent storage bloat
    if (transactionLog.length > 100) {
      transactionLog = transactionLog.slice(-100);
    }
    
    localStorage.setItem(logKey, JSON.stringify(transactionLog));
    
    // Log to console for debugging
    console.log(`💎 Gem Transaction: +${amount} from ${source} | New Total: ${newTotal} | User: ${userId}`);
  }, [user?.id]);

  // Real-time sync with DivineMiningGame localStorage
  useEffect(() => {
    const syncWithDivineMining = () => {
      const userId = user?.id ? user.id.toString() : undefined;
      const userPointsKey = getUserSpecificKey('spiritualEssencePoints', userId);
      const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
      const userBoostsKey = getUserSpecificKey('divineMiningBoosts', userId);
      
      const savedPoints = localStorage.getItem(userPointsKey);
      const savedGems = localStorage.getItem(userGemsKey);
      const savedBoosts = localStorage.getItem(userBoostsKey);
      
      if (savedPoints) {
        const newPoints = parseInt(savedPoints, 10);
        setPoints(currentPoints => {
          if (newPoints !== currentPoints) {
            return newPoints;
          }
          return currentPoints;
        });
      }
      
      if (savedGems) {
        const newGems = parseInt(savedGems, 10);
        setGems(currentGems => {
          if (newGems !== currentGems) {
            // Dispatch global gem update event for sync
            window.dispatchEvent(new CustomEvent('gemsUpdated', { 
              detail: { gems: newGems, amount: 0 } 
            }));
            return newGems;
          }
          return currentGems;
        });
      }
      
      if (savedBoosts) {
        try {
          const newBoosts = JSON.parse(savedBoosts);
          setActiveBoosts(currentBoosts => {
            if (JSON.stringify(newBoosts) !== JSON.stringify(currentBoosts)) {
              return newBoosts;
            }
            return currentBoosts;
          });
        } catch (error) {
          console.error('Error parsing boosts:', error);
        }
      }
    };

    // Sync immediately
    syncWithDivineMining();

    // Set up interval for real-time sync
    const syncInterval = setInterval(syncWithDivineMining, 1000); // Sync every second

    // Also listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      const userId = user?.id ? user.id.toString() : undefined;
      const userPointsKey = getUserSpecificKey('spiritualEssencePoints', userId);
      const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
      const userBoostsKey = getUserSpecificKey('divineMiningBoosts', userId);
      
      if (e.key === userPointsKey || e.key === userGemsKey || e.key === userBoostsKey) {
        syncWithDivineMining();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.id]);

  // Save gems to localStorage whenever state changes
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userGemsKey = getUserSpecificKey('divineMiningGems', userId);
    localStorage.setItem(userGemsKey, gems.toString());
  }, [gems, user?.id]);

  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userBoostsKey = getUserSpecificKey('divineMiningBoosts', userId);
    localStorage.setItem(userBoostsKey, JSON.stringify(activeBoosts));
  }, [activeBoosts, user?.id]);

  // Clean up expired boosts
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBoosts(prev => prev.filter(boost => Date.now() < boost.expires));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const addPoints = (amount: number) => {
    // This is now handled by DivineMiningGame
    console.log('addPoints called with:', amount, '- handled by DivineMiningGame');
  };

  const addGems = useCallback((amount: number, source: string = 'unknown') => {
    // Rate limiting: prevent claiming gems more than once per 100ms
    const now = Date.now();
    if (now - lastGemClaimTime < 100) {
      console.warn('🚫 Gem claim rate limit exceeded - preventing spam');
      return;
    }
    
    // Validate amount
    if (amount <= 0 || amount > 10000) {
      console.warn('🚫 Invalid gem amount:', amount);
      return;
    }
    
    // Prevent huge amounts that might indicate exploitation
    if (amount > 1000) {
      console.warn('🚫 Gem amount too large, capping at 1000:', amount);
      amount = 1000;
    }
    
    setLastGemClaimTime(now);
    
    setGems(prev => {
      const newGems = prev + amount;
      
      // Log the transaction
      logGemTransaction(amount, source, newGems);
      
      // Dispatch global gem update event
      window.dispatchEvent(new CustomEvent('gemsUpdated', { 
        detail: { gems: newGems, amount, source } 
      }));
      
      return newGems;
    });
  }, [lastGemClaimTime, logGemTransaction]);

  const addBoost = (boost: {type: string, multiplier: number, expires: number}) => {
    setActiveBoosts(prev => [...prev, boost]);
  };

  const removeBoost = (index: number) => {
    setActiveBoosts(prev => prev.filter((_, i) => i !== index));
  };

  // Enhanced setGems with global event dispatch
  const enhancedSetGems = (newGems: number) => {
    setGems(newGems);
    // Dispatch global gem update event
    window.dispatchEvent(new CustomEvent('gemsUpdated', { 
      detail: { gems: newGems, amount: 0 } 
    }));
  };

  // Debug function to get gem transaction logs (development only)
  const getGemTransactionLogs = useCallback(() => {
    if (!import.meta.env.DEV) return [];
    
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const logKey = getUserSpecificKey('gemTransactionLog', userId);
    const existingLog = localStorage.getItem(logKey);
    
    return existingLog ? JSON.parse(existingLog) : [];
  }, [user?.id]);

  // Debug function to clear gem transaction logs (development only)
  const clearGemTransactionLogs = useCallback(() => {
    if (!import.meta.env.DEV) return;
    
    const userId = user?.id ? user.id.toString() : 'anonymous';
    const logKey = getUserSpecificKey('gemTransactionLog', userId);
    localStorage.removeItem(logKey);
    
    console.log('🧹 Gem transaction logs cleared');
  }, [user?.id]);

  // Expose debug functions to window for development
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).getGemLogs = getGemTransactionLogs;
      (window as any).clearGemLogs = clearGemTransactionLogs;
    }
  }, [getGemTransactionLogs, clearGemTransactionLogs]);

  const value: GameContextType = {
    points,
    gems,
    setPoints,
    setGems: enhancedSetGems,
    addPoints,
    addGems,
    activeBoosts,
    addBoost,
    removeBoost
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}; 