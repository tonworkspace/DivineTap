import { JettonBalance } from "@ton-api/client";
import { JettonItem } from "./JettonItem";
import { useState } from 'react';
import { Address } from "@ton/core";
import ta from "../utility/tonapi";
import { CustomJettonInfo } from './CustomJettonInfo';

interface JettonListProps {
  jettons: JettonBalance[] | null;
  onSelect: (jetton: JettonBalance | null) => void;
  onImport: (tokenAddress: string) => Promise<void>;
  className?: string;
  connectedAddressString?: string;
}

export const JettonList = ({ 
  jettons, 
  onSelect, 
  onImport 
}: Omit<JettonListProps, 'connectedAddressString' | 'className'>) => {
  const [customAddress, setCustomAddress] = useState<string>('');
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedToken, setImportedToken] = useState<{
    address: string;
    showInfo: boolean;
  } | null>(null);
  const [importedTokens, setImportedTokens] = useState<Set<string>>(new Set());

  const handleAddCustomJetton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate address format
      const jettonAddress = Address.parse(customAddress);
      
      // Fetch jetton metadata
      const jettonData = await ta.jettons.getJettonInfo(jettonAddress);
      
      if (!jettonData) {
        throw new Error('Invalid jetton contract address');
      }

      // Show token information
      setImportedToken({
        address: customAddress,
        showInfo: true
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token');
      setImportedToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative px-4 sm:px-6 md:px-8">
      {/* Mobile-optimized Header Section */}
      {/* <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Token Assets</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your tokens</p>
          </div>
          
          <button
            onClick={() => setIsAddingToken(true)}
            className="touch-manipulation flex items-center space-x-2 px-4 py-2.5 bg-blue-500/10 
                       text-blue-400 rounded-xl hover:bg-blue-500/20 active:bg-blue-500/30 
                       transition-all duration-200 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Import Token</span>
            <span className="sm:hidden">Import</span>
          </button>
        </div>
      </div> */}

      {/* Mobile-optimized Token List */}
      <div className="space-y-3 -mx-4 sm:mx-0">
        {jettons?.map((jettonBalance) => (
          <div key={jettonBalance.jetton.address.toString()} 
               className="touch-manipulation sm:hover:translate-x-0 transition-transform duration-200">
            <JettonItem
              jettonBalance={jettonBalance}
              onSelect={onSelect}
              isImported={importedTokens.has(jettonBalance.jetton.address.toString())}
            />
          </div>
        ))}
      </div>

      {/* Mobile-optimized Empty State */}
      {jettons?.length === 0 && (
        <div className="text-center py-12 px-6 mx-4 sm:mx-0 rounded-2xl bg-[#1e2738]/50 
                      backdrop-blur-sm border border-gray-800/50 touch-manipulation">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 
                         rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">No Tokens Found</h3>
          <p className="text-gray-400 text-sm max-w-[250px] mx-auto">
            Import your tokens to start managing your digital assets
          </p>
        </div>
      )}

      {/* Mobile-optimized Import Token Modal */}
      {isAddingToken && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 
                      touch-manipulation overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1e2738] rounded-2xl p-5 sm:p-6 
                          border border-gray-800/50 shadow-xl relative">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Import Token</h3>
                  <p className="text-sm text-gray-400 mt-1">Add a custom token to your wallet</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddingToken(false);
                    setError(null);
                    setCustomAddress('');
                    setImportedToken(null);
                  }}
                  className="touch-manipulation -m-2 p-2 text-gray-400 hover:text-white 
                           rounded-xl hover:bg-gray-800/50 active:bg-gray-800/70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile-optimized Form */}
              <form onSubmit={handleAddCustomJetton} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Token Contract Address
                  </label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter token address"
                    className="w-full bg-[#2a3548] text-white p-4 rounded-xl border border-gray-700/50 
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none 
                             transition-all text-base"
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-2 flex items-center space-x-2 px-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </p>
                  )}
                </div>

                {/* Warning Message */}
                {!importedToken && (
                  <div className="bg-yellow-500/10 text-yellow-300 rounded-xl p-4 
                                border border-yellow-500/20">
                    <div className="flex space-x-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm">
                        Make sure you trust this token. Anyone can create a token with any name, 
                        including fake versions of existing tokens.
                      </p>
                    </div>
                  </div>
                )}

                {/* Token Info */}
                {importedToken?.showInfo && (
                  <div className="border border-gray-700/50 rounded-xl p-4 bg-[#2a3548]">
                    <CustomJettonInfo contractAddress={importedToken.address} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {!importedToken?.showInfo ? (
                    <button
                      type="submit"
                      disabled={isLoading || !customAddress}
                      className={`w-full py-4 sm:py-3 px-4 rounded-xl font-medium transition-all 
                                flex items-center justify-center touch-manipulation
                                ${isLoading || !customAddress
                                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'}`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent 
                                        rounded-full animate-spin mr-2" />
                          <span>Checking...</span>
                        </>
                      ) : (
                        'Check Token'
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (importedToken) {
                              await onImport(importedToken.address);
                              setImportedTokens(prev => new Set([...prev, importedToken.address]));
                              setIsAddingToken(false);
                              setCustomAddress('');
                              setImportedToken(null);
                            }
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to import token');
                          }
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
                                 text-white py-4 sm:py-3 px-4 rounded-xl font-medium transition-all 
                                 flex items-center justify-center space-x-2 touch-manipulation"
                      >
                        <span>Import Token</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomAddress('');
                          setImportedToken(null);
                        }}
                        className="flex-1 bg-gray-700/50 hover:bg-gray-700 active:bg-gray-800 
                                 text-white py-4 sm:py-3 px-4 rounded-xl font-medium transition-all 
                                 touch-manipulation"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};