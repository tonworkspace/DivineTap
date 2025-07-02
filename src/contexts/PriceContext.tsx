import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getTONPrice } from '@/lib/api';

interface PriceContextType {
  tonPrice: number;
  isLoading: boolean;
  error: string | null;
}

const PriceContext = createContext<PriceContextType>({
  tonPrice: 2.5,
  isLoading: true,
  error: null,
});

export const PriceProvider = ({ children }: { children: ReactNode }) => {
  const [tonPrice, setTonPrice] = useState<number>(2.5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getTONPrice();
        setTonPrice(price);
        setError(null);
      } catch (err) {
        setError('Failed to fetch TON price');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <PriceContext.Provider value={{ tonPrice, isLoading, error }}>
      {children}
    </PriceContext.Provider>
  );
};

export const useTONPrice = () => useContext(PriceContext); 