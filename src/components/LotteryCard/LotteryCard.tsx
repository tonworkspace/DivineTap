import React, { useState, useEffect } from 'react';
import { Address } from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient } from '@ton/ton';
import { NftCollection } from '@/utils/contract-build/NftCollection/tact_NftCollection';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, toNano } from '@ton/core';
import { TonConnectButton } from '@tonconnect/ui-react';

// SBT collection address
const SBT_CONTRACT_ADDRESS = "EQBpQbkNRhzCAalWxnFtU5z28rS_RCxBlEuC010bAjsh3TjU";

interface CollectionMetadata {
    name: string;
    description: string;
    image: string;
}

interface LotteryCardProps {
    title: string;
    description: string;
    price: number;
    onPurchase: () => void;
    onStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error', hasMinted: boolean) => void;
    onMintSuccess?: () => void;
    disabled?: boolean;
}

function decodeCell(cell: any): string {
    let slice = cell.beginParse();
    slice.loadUint(8);
    return slice.loadStringTail();
}

async function fetchMetadata(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
    }
}

export const LotteryCard: React.FC<LotteryCardProps> = ({ onStatusChange, onMintSuccess }) => {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  
  const [state, setState] = useState({
    isLoading: true,
    metadata: null as CollectionMetadata | null,
    mintPrice: '0',
    mintingStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    hasMinted: false
  });

  const handleMint = async () => {
    if (!tonConnectUI?.account) return;

    try {
      setState(s => ({ ...s, mintingStatus: 'loading' }));
      const mintCost = BigInt(state.mintPrice) + BigInt(toNano('0.05'));

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: Address.parse(SBT_CONTRACT_ADDRESS).toString(),
          amount: mintCost.toString(),
          payload: beginCell().storeUint(0, 32).storeStringTail("Mint").endCell().toBoc().toString('base64'),
        }],
      });

      setState(s => ({ ...s, mintingStatus: 'success' }));
      setTimeout(() => setState(s => ({ ...s, mintingStatus: 'idle' })), 3000);
    } catch (error) {
      console.error('Error minting:', error);
      setState(s => ({ ...s, mintingStatus: 'error' }));
      setTimeout(() => setState(s => ({ ...s, mintingStatus: 'idle' })), 3000);
    }
  };

  useEffect(() => {
    const checkMintStatus = async () => {
      if (!userAddress) return;
      
      try {
        const { nft_items = [] } = await fetch(
          `https://tonapi.io/v2/accounts/${userAddress}/nfts?collection=${SBT_CONTRACT_ADDRESS}`,
          { headers: { Accept: 'application/json' } }
        ).then(res => res.json());
        
        const hasNft = nft_items.length > 0;
        setState(s => ({ ...s, hasMinted: hasNft }));
        
        if (hasNft && !state.hasMinted && onMintSuccess) {
          await onMintSuccess();
        }
      } catch (error) {
        console.error('Error checking mint status:', error);
      }
    };

    checkMintStatus();
  }, [userAddress]);

  useEffect(() => {
    const loadCollectionData = async () => {
      try {
        const client = new TonClient({ endpoint: await getHttpEndpoint({ network: 'mainnet' }) });
        const contract = client.open(NftCollection.fromAddress(Address.parse(SBT_CONTRACT_ADDRESS)));

        const [collectionData, price] = await Promise.all([
          contract.getGetCollectionData(),
          contract.getGetNftPrice()
        ]);

        const metadata = await fetchMetadata(decodeCell(collectionData.collection_content));
        setState(s => ({ 
          ...s, 
          isLoading: false,
          metadata,
          mintPrice: price.toString()
        }));
      } catch (error) {
        console.error('Error loading collection data:', error);
        setState(s => ({ ...s, isLoading: false }));
      }
    };

    loadCollectionData();
  }, []);

  useEffect(() => {
    onStatusChange?.(state.mintingStatus, state.hasMinted);
  }, [state.mintingStatus, state.hasMinted, onStatusChange]);

  if (!tonConnectUI?.connected) {
    return (
      <div className="bg-gradient-to-br from-black to-purple-900/30 border border-purple-500/30 rounded-xl p-5">
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-white/60 text-center">Connect your wallet to purchase lottery tickets</p>
          <TonConnectButton />
        </div>
      </div>
    );
  }

  if (state.isLoading || !state.metadata) {
    return <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 border border-purple-500/30 relative overflow-hidden rounded-xl p-5">
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="absolute inset-0 bg-purple-500/20 rounded-lg blur-sm" />
          <div className="relative h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg grid place-items-center">
            <img 
              src={state.metadata.image}
              alt={state.metadata.name}
              className="w-32 h-32 object-cover rounded-lg hover:scale-105 transition-transform duration-300 ease-out animate-fade-in hover:shadow-lg hover:shadow-purple-500/20"
              style={{
                animation: 'float 6s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">Weekly Lottery</h3>
            <div className="bg-purple-500/10 px-3 py-1 rounded-full">
              <span className="text-purple-400 font-bold">{(Number(state.mintPrice) / 1e9).toFixed(2)} </span>
              <span className="text-purple-400/70">TON</span>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-3"> Buy a ticket to participate in the weekly lottery. Early participants get access to the whitelist and a chance to win Stakers Token Rewards.</p>
          
          {/* <p className="text-sm text-white/60 mb-3">{state.metadata.description}</p> */}
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleMint}
              disabled={state.mintingStatus === 'loading' || state.hasMinted}
              className={`px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2
                ${state.mintingStatus === 'loading' || state.hasMinted
                  ? 'bg-gray-500/50 cursor-not-allowed' 
                  : 'bg-[#2E9BFF] hover:bg-[#2E9BFF]/90'}`}
            >
              {state.mintingStatus === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Purchasing...</span>
                </>
              ) : state.hasMinted ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Purchased</span>
                </>
              ) : (
                <>
                  <span>Purchase Ticket</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 