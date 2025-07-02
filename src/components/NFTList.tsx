import React from 'react';
import { Address } from '@ton/core';
import { TonApi, Item } from '../utility/ton-api';
import { NFTDetailsModal } from './NFTDetailsModal';
import { GiTrophy } from 'react-icons/gi';
import { MdImage, MdCollections } from 'react-icons/md';

// Define props interface
interface NFTListProps {
  address: Address;
  onError?: (error: any) => void;
}

// Create a functional component using React.FC
export const NFTList: React.FC<NFTListProps> = ({ address, onError }) => {
  const [nfts, setNfts] = React.useState<Item[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [selectedNFT, setSelectedNFT] = React.useState<Item | null>(null);
  const itemsPerPage = 9; // Show 9 NFTs per page (3x3 grid)
  
  // Create API instance
  const tonApi = React.useMemo(() => new TonApi(), []);

  // Fetch NFTs when component mounts or address changes
  React.useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        setError(null);
        setPage(1); // Reset to page 1 when address changes
        
        const nftItems = await tonApi.searchItemsFromUser(address.toString());
        
        if (nftItems) {
          setNfts(nftItems.nft_items || []);
          setHasMore((nftItems.nft_items || []).length > itemsPerPage);
        }
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        setError('Failed to load NFTs');
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, onError, tonApi]);

  // Function to load more NFTs
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  // Calculate which NFTs to display based on current page
  const displayedNfts = nfts.slice(0, page * itemsPerPage);
  
  // Check if we've reached the end of the list
  React.useEffect(() => {
    setHasMore(page * itemsPerPage < nfts.length);
  }, [page, nfts.length]);

  // Loading state - Similar to FrogsMiner
  if (isLoading && page === 1) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="flex flex-col items-center space-y-4 max-w-sm w-full">
          {/* Compact Loading Animation */}
          <div className="relative">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <MdImage size={40} className="text-green-600 animate-bounce" />
              </div>
              
              {/* Fewer orbiting particles */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateX(30px)`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center space-y-1">
            <div className="text-xs text-green-500 font-medium">LOADING NFT COLLECTION</div>
            <div className="text-xs text-green-700 font-medium">
              🖼️ Gathering your digital treasures...
            </div>
            <div className="text-xs text-gray-500 animate-pulse">
              Fetching your unique assets...
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state - Similar to FrogsMiner styling
  if (error) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-300 shadow-lg text-center max-w-sm">
          <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  // Empty state - Similar to FrogsMiner empty state
  if (!nfts.length) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 shadow-lg text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-green-200 to-green-100 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg border-2 border-green-300">
            <MdImage size={40} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No NFTs Found</h3>
          <p className="text-gray-600 text-sm">Your NFT collection is empty</p>
          <p className="text-gray-500 text-xs mt-2">Start collecting unique digital assets!</p>
        </div>
      </div>
    );
  }
  
  // NFT grid display - Similar to FrogsMiner layout
  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Stats - Similar to FrogsMiner stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-green-700 font-bold mb-1">Total NFTs</h3>
                <p className="text-2xl font-bold text-green-800">{nfts.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <MdCollections size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-2 w-full bg-white/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full shadow transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, (displayedNfts.length / nfts.length) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-purple-700 font-bold mb-1">Collections</h3>
                <p className="text-2xl font-bold text-purple-800">
                  {new Set(nfts.map(nft => nft.collection?.name).filter(Boolean)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <GiTrophy size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* NFT Grid - Similar to Frog Collection in FrogsMiner */}
        <div className="bg-white/50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              <MdImage size={20} className="text-green-600" />
              Your NFT Collection
            </h3>
            <div className="text-sm text-green-600">
              Showing {displayedNfts.length} of {nfts.length}
            </div>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {displayedNfts.map((nft, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${
                  index % 4 === 0 ? 'from-blue-50 to-green-50' : 
                  index % 4 === 1 ? 'from-green-50 to-blue-50' : 
                  index % 4 === 2 ? 'from-purple-50 to-pink-50' :
                  'from-yellow-50 to-orange-50'
                } rounded-2xl p-3 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl mb-3 border border-green-200">
                  {nft.metadata?.image ? (
                    <img 
                      src={nft.metadata.image} 
                      alt={nft.metadata?.name || "NFT"} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : nft.previews?.[0]?.url ? (
                    <img 
                      src={nft.previews[0].url} 
                      alt={nft.metadata?.name || "NFT"} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                      <MdImage size={32} className="text-green-400" />
                    </div>
                  )}
                  
                  {nft.collection?.name && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-medium text-green-600 border border-green-200 shadow-sm max-w-[80%] truncate">
                      {nft.collection.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-green-700 font-bold text-sm truncate">
                    {nft.metadata?.name || "Unnamed NFT"}
                  </h3>
                  
                  {nft.metadata?.description && (
                    <p className="text-green-600/80 text-xs leading-relaxed line-clamp-2">
                      {nft.metadata.description}
                    </p>
                  )}
                  
                  <button 
                    onClick={() => setSelectedNFT(nft)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-green-400"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Button - Similar to FrogsMiner buttons */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={loadMore}
                disabled={isLoading}
                className={`px-6 py-3 text-base font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 border-2 ${
                  isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'
                    : 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white border-green-400'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600 mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  'Load More NFTs'
                )}
              </button>
            </div>
          )}
        </div>

        <NFTDetailsModal 
          nft={selectedNFT} 
          onClose={() => setSelectedNFT(null)} 
        />
      </div>
    </div>
  );
};