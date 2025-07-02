import { useState, useEffect } from 'react';
import { getJettonMetadata, JettonMetadata } from '../utility/jetton-contract';
import { useTonAddress } from '@tonconnect/ui-react';
import { toDecimals } from '../utility/decimals';

interface CustomJettonInfoProps {
  contractAddress: string;
  onImportSuccess?: (metadata: JettonMetadata) => void;
}
// Local storage key for imported tokens
const IMPORTED_TOKENS_KEY = 'importedTokens';

export const CustomJettonInfo = ({ 
  contractAddress, 
  onImportSuccess 
}: CustomJettonInfoProps) => {
  const [metadata, setMetadata] = useState<JettonMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImported, setIsImported] = useState(false);
  const connectedAddress = useTonAddress();

  // Check if token is already imported
  useEffect(() => {
    const checkImportStatus = () => {
      const importedTokens = JSON.parse(localStorage.getItem(IMPORTED_TOKENS_KEY) || '{}');
      setIsImported(!!importedTokens[contractAddress]);
    };
    
    checkImportStatus();
  }, [contractAddress]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        const data = await getJettonMetadata(contractAddress);
        setMetadata(data);
      } catch (e) {
        console.error('Error loading metadata:', e);
        setError(e instanceof Error ? e.message : 'Failed to load Jetton metadata');
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [contractAddress, connectedAddress]);

  const handleImport = () => {
    if (!metadata) return;

    try {
      // Get existing imported tokens
      const importedTokens = JSON.parse(localStorage.getItem(IMPORTED_TOKENS_KEY) || '{}');
      
      // Add new token
      importedTokens[contractAddress] = {
        ...metadata,
        lastUpdated: Date.now()
      };

      // Save back to localStorage
      localStorage.setItem(IMPORTED_TOKENS_KEY, JSON.stringify(importedTokens));
      
      // Update UI
      setIsImported(true);
      
      // Notify parent component
      onImportSuccess?.(metadata);
      
    } catch (e) {
      console.error('Error saving token:', e);
      setError('Failed to import token');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm py-2">
        {error}
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="text-gray-400 text-sm py-2">
        No token information available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {metadata.image ? (
            <img 
              src={metadata.image} 
              alt={metadata.name || 'Token'} 
              className="w-12 h-12 rounded-xl"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {metadata.symbol?.[0]}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-white font-medium">{metadata.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">{metadata.symbol}</span>
              {metadata.verified && (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {!isImported && (
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Import</span>
          </button>
        )}

        {isImported && (
          <div className="flex items-center space-x-2 text-green-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Imported</span>
          </div>
        )}
      </div>

      {metadata.description && (
        <p className="text-sm text-gray-400 border-t border-gray-700 pt-3">
          {metadata.description}
        </p>
      )}

      {metadata.balance && connectedAddress && (
        <div className="border-t border-gray-700 pt-3">
          <p className="text-sm text-gray-400">Your Balance</p>
          <p className="text-white font-medium">
            {toDecimals(BigInt(metadata.balance), metadata.decimals)}{' '}
            {metadata.symbol}
          </p>
        </div>
      )}
    </div>
  );
}; 