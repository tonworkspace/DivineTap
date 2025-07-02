import React from 'react';
import { Address } from '@ton/core';
import { TonApi, Item } from '../utility/ton-api';

interface NFTGalleryProps {
  address: Address;
  onError?: (error: any) => void;
  onNFTSelect?: (nft: Item) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ address, onError, onNFTSelect }) => {
  const [nfts, setNfts] = React.useState<Item[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = React.useState<Item | null>(null);
  const [hoveredNFT, setHoveredNFT] = React.useState<string | null>(null);
  
  const tonApi = React.useMemo(() => new TonApi(), []);

  React.useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const nftItems = await tonApi.searchItemsFromUser(address.toString());
        
        if (nftItems) {
          setNfts(nftItems.nft_items || []);
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

  const handleNFTSelect = (nft: Item) => {
    setSelectedNFT(nft);
    if (onNFTSelect) {
      onNFTSelect(nft);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-center space-x-4">
        <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-900/30 to-orange-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No NFTs Found</h3>
        <p className="text-gray-400 text-lg">Your NFT collection is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span>NFT Gallery</span>
          <span className="text-sm text-gray-400 font-normal">
            ({nfts.length} items)
          </span>
        </h2>
      </div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft, index) => (
          <div
            key={index}
            className={`group relative bg-gradient-to-br from-orange-900/10 to-orange-900/5 rounded-xl overflow-hidden border border-orange-500/30 transform transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] ${
              selectedNFT?.address === nft.address ? 'ring-2 ring-orange-500' : ''
            }`}
            onMouseEnter={() => setHoveredNFT(nft.address)}
            onMouseLeave={() => setHoveredNFT(null)}
            onClick={() => handleNFTSelect(nft)}
          >
            {/* NFT Image with parallax effect */}
            <div className="relative h-48 overflow-hidden">
              {nft.metadata?.image ? (
                <img
                  src={nft.metadata.image}
                  alt={nft.metadata?.name || "NFT"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{
                    transform: hoveredNFT === nft.address ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ) : nft.previews?.[0]?.url ? (
                <img
                  src={nft.previews[0].url}
                  alt={nft.metadata?.name || "NFT"}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{
                    transform: hoveredNFT === nft.address ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-900/20 to-orange-900/10 flex items-center justify-center">
                  <svg className="w-16 h-16 text-orange-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Collection badge with glass effect */}
              {nft.collection?.name && (
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium text-orange-300 border border-orange-500/30">
                  {nft.collection.name}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* NFT Info with enhanced styling */}
            <div className="p-4 border-t border-orange-500/30 bg-gray-900/50 backdrop-blur-sm">
              <h3 className="text-white font-bold text-lg truncate group-hover:text-orange-300 transition-colors">
                {nft.metadata?.name || "Unnamed NFT"}
              </h3>
              
              {/* Additional NFT details */}
              <div className="mt-2 space-y-1">
                {nft.metadata?.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {nft.metadata.description}
                  </p>
                )}
                
                {/* Action buttons */}
                <div className="mt-3 flex justify-end space-x-2">
                  <button className="px-4 py-1.5 text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-md transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 