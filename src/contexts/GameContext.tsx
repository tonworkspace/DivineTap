import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GameContextType {
  points: number;
  gems: number;
  setPoints: (points: number) => void;
  setGems: (gems: number) => void;
  addPoints: (amount: number) => void;
  addGems: (amount: number) => void;
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
  // Points are now managed by DivineMiningGame - this is just for display
  const [points, setPoints] = useState(100);

  const [gems, setGems] = useState(() => {
    const saved = localStorage.getItem('divineMiningGems');
    return saved ? parseInt(saved, 10) : 10;
  });

  const [activeBoosts, setActiveBoosts] = useState<Array<{type: string, multiplier: number, expires: number}>>(() => {
    const saved = localStorage.getItem('divineMiningBoosts');
    return saved ? JSON.parse(saved) : [];
  });

  // Save gems to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('divineMiningGems', gems.toString());
  }, [gems]);

  useEffect(() => {
    localStorage.setItem('divineMiningBoosts', JSON.stringify(activeBoosts));
  }, [activeBoosts]);

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

  const addGems = (amount: number) => {
    setGems(prev => prev + amount);
  };

  const addBoost = (boost: {type: string, multiplier: number, expires: number}) => {
    setActiveBoosts(prev => [...prev, boost]);
  };

  const removeBoost = (index: number) => {
    setActiveBoosts(prev => prev.filter((_, i) => i !== index));
  };

  const value: GameContextType = {
    points,
    gems,
    setPoints,
    setGems,
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