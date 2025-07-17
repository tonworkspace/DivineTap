import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingProgress: number;
  loadingStep: string;
  loadingError: string | null;
  isRetrying: boolean;
  isInitialLoadComplete: boolean;
}

interface LoadingContextType extends LoadingState {
  startLoading: () => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingStep: (step: string) => void;
  setLoadingError: (error: string | null) => void;
  setIsRetrying: (retrying: boolean) => void;
  setIsInitialLoadComplete: (complete: boolean) => void;
  completeLoading: () => void;
  resetLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    loadingProgress: 0,
    loadingStep: 'Initializing...',
    loadingError: null,
    isRetrying: false,
    isInitialLoadComplete: false,
  });

  const startLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      loadingProgress: 0,
      loadingStep: 'Initializing...',
      loadingError: null,
    }));
  }, []);

  const setLoadingProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      loadingProgress: progress,
    }));
  }, []);

  const setLoadingStep = useCallback((step: string) => {
    setLoadingState(prev => ({
      ...prev,
      loadingStep: step,
    }));
  }, []);

  const setLoadingError = useCallback((error: string | null) => {
    setLoadingState(prev => ({
      ...prev,
      loadingError: error,
    }));
  }, []);

  const setIsRetrying = useCallback((retrying: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      isRetrying: retrying,
    }));
  }, []);

  const setIsInitialLoadComplete = useCallback((complete: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      isInitialLoadComplete: complete,
    }));
  }, []);

  const completeLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      loadingProgress: 100,
      loadingStep: 'Ready!',
      isInitialLoadComplete: true,
    }));
  }, []);

  const resetLoading = useCallback(() => {
    setLoadingState({
      isLoading: true,
      loadingProgress: 0,
      loadingStep: 'Initializing...',
      loadingError: null,
      isRetrying: false,
      isInitialLoadComplete: false,
    });
  }, []);

  const value: LoadingContextType = {
    ...loadingState,
    startLoading,
    setLoadingProgress,
    setLoadingStep,
    setLoadingError,
    setIsRetrying,
    setIsInitialLoadComplete,
    completeLoading,
    resetLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}; 