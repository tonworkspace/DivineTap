import React from 'react';
import { Item } from '../utility/ton-api';

interface NFTDetailsModalProps {
  nft: Item | null;
  onClose: () => void;
}

export const NFTDetailsModal: React.FC<NFTDetailsModalProps> = ({ nft, onClose }) => {
  if (!nft) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-200 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded-full text-green-600 transition-colors z-10"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* NFT Image */}
        <div className="relative h-48 sm:h-64 md:h-80">
          {nft.metadata?.image ? (
            <img
              src={nft.metadata.image}
              alt={nft.metadata?.name || "NFT"}
              className="w-full h-full object-cover"
            />
          ) : nft.previews?.[0]?.url ? (
            <img
              src={nft.previews[0].url}
              alt={nft.metadata?.name || "NFT"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Collection badge */}
          {nft.collection?.name && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium text-green-600 border border-green-200 shadow-sm max-w-[80%] truncate">
              {nft.collection.name}
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-green-700 font-cartoon">
            {nft.metadata?.name || "Unnamed NFT"}
          </h2>

          {nft.metadata?.description && (
            <p className="text-green-600/80 text-xs sm:text-sm leading-relaxed">
              {nft.metadata.description}
            </p>
          )}

          {/* NFT Properties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-green-100">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-green-600 mb-1 sm:mb-2">Token ID</h3>
              <p className="text-green-700 font-mono text-xs sm:text-sm break-all">{nft.address}</p>
            </div>
            {nft.collection && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-green-600 mb-1 sm:mb-2">Collection</h3>
                <p className="text-green-700 text-xs sm:text-sm break-all">{nft.collection.name}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-green-100">
            <button className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm">
             Claim Reward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 