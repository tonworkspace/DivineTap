import { useState, useEffect } from 'react';
import { Address } from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient } from '@ton/ton';
import { NftCollection } from '@/utils/contract-build/NftCollection/tact_NftCollection';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { beginCell, toNano } from '@ton/core';

// SBT collection address
const SBT_CONTRACT_ADDRESS = "EQBpQbkNRhzCAalWxnFtU5z28rS_RCxBlEuC010bAjsh3TjU";

interface CollectionMetadata {
    name: string;
    description: string;
    image: string;
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

// Add to props interface
interface NFTMinterProps {
    onStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error', hasMinted: boolean) => void;
    onMintSuccess?: () => Promise<void>;
}

export const NFTMinter = ({ onStatusChange, onMintSuccess }: NFTMinterProps = {}) => {
    const [tonConnectUI] = useTonConnectUI();
    const [isLoading, setIsLoading] = useState(true);
    const [metadata, setMetadata] = useState<CollectionMetadata | null>(null);
    const [mintPrice, setMintPrice] = useState<string>('0');
    const [mintingStatus, setMintingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [hasMinted, setHasMinted] = useState<boolean>(false);
    const userAddress = useTonAddress();

    // Add this function to handle showing notifications
    const showSnackbar = ({ message, description }: { message: string; description?: string }) => {
        // You can implement this based on your app's notification system
        console.error(message, description);
        // If you have a global notification system, call it here
        // For example: window.showNotification(message, description);
    };

    const handleMint = async () => {
        if (!tonConnectUI || !tonConnectUI.account) {
            showSnackbar({
                message: 'Wallet Not Connected',
                description: 'Please connect your wallet first'
            });
            return;
        }

        try {
            setMintingStatus('loading');
            const nftCollectionAddress = Address.parse(SBT_CONTRACT_ADDRESS);
            const mintCost = BigInt(mintPrice) + BigInt(toNano('0.05'));

            await tonConnectUI.sendTransaction({
                validUntil: Math.floor(Date.now() / 1000) + 60,
                messages: [
                    {
                        address: nftCollectionAddress.toString(),
                        amount: mintCost.toString(),
                        payload: beginCell().storeUint(0, 32).storeStringTail("Mint").endCell().toBoc().toString('base64'),
                    },
                ],
            });

            setMintingStatus('success');
            setTimeout(() => setMintingStatus('idle'), 3000);
        } catch (error) {
            console.error('Error minting:', error);
            setMintingStatus('error');
            setTimeout(() => setMintingStatus('idle'), 3000);
        }
    };

    const checkUserMintStatus = async () => {
        if (!userAddress) return;
        
        try {
            // Validate contract address first
            if (!SBT_CONTRACT_ADDRESS) {
                console.error('Contract address is not defined');
                return;
            }

            const endpoint = await getHttpEndpoint({ network: 'mainnet' });
            const client = new TonClient({ endpoint });
            
            // Validate response from TonAPI
            try {
                const response = await fetch(
                    `https://tonapi.io/v2/accounts/${userAddress}/nfts?collection=${SBT_CONTRACT_ADDRESS}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Ensure data has the expected structure
                if (data && Array.isArray(data.nft_items)) {
                    setHasMinted(data.nft_items.length > 0);
                    
                    // If this is a new mint, trigger the reward
                    if (data.nft_items.length > 0 && !hasMinted && onMintSuccess) {
                        await onMintSuccess();
                    }
                } else {
                    console.warn('Unexpected data structure from TonAPI:', data);
                    setHasMinted(false);
                }
            } catch (apiError) {
                console.error('TonAPI request failed:', apiError);
                // Fallback to contract check
                try {
                    const address = Address.parse(SBT_CONTRACT_ADDRESS);
                    const contract = NftCollection.fromAddress(address);
                    const openedContract = client.open(contract);
                    const balance = await openedContract.getGetNftAddressByIndex(0n);
                    setHasMinted(!!balance);
                } catch (contractError) {
                    console.error('Contract check failed:', contractError);
                    setHasMinted(false);
                }
            }
        } catch (error) {
            console.error('Error checking mint status:', error);
            setHasMinted(false);
        }
    };

    useEffect(() => {
        if (userAddress) {
            checkUserMintStatus();
        }
    }, [userAddress]);

    useEffect(() => {
        async function loadCollectionData() {
            try {
                setIsLoading(true);
                const endpoint = await getHttpEndpoint({ network: 'mainnet' });
                const client = new TonClient({ endpoint });
                const address = Address.parse(SBT_CONTRACT_ADDRESS);
                const contract = NftCollection.fromAddress(address);
                const openedContract = client.open(contract);

                const [collectionData, price] = await Promise.all([
                    openedContract.getGetCollectionData(),
                    openedContract.getGetNftPrice()
                ]);

                const metadataUrl = decodeCell(collectionData.collection_content);
                const collectionMetadata = await fetchMetadata(metadataUrl);

                setMetadata(collectionMetadata);
                setMintPrice(price.toString());
            } catch (error) {
                console.error('Error loading collection data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadCollectionData();
    }, []);

    useEffect(() => {
        // Notify parent component of status changes
        onStatusChange?.(mintingStatus, hasMinted);
    }, [mintingStatus, hasMinted, onStatusChange]);

    if (isLoading || !metadata) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4 relative z-0">
            {/* NFT Card */}
            <div 
                className={`relative overflow-hidden group bg-gradient-to-br from-black to-[#0A0A0A]
                         rounded-2xl p-6 border transition-all duration-300
                         ${!hasMinted 
                           ? 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                           : 'border-gray-700/50 opacity-75'}`}
                onClick={() => !hasMinted && handleMint()}
            >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Content */}
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* NFT Image with glow effect */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-300"></div>
                                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 
                                            ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all p-2">
                                    <img 
                                        src={metadata?.image}
                                        alt={metadata?.name}
                                        className="w-full h-full object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </div>
                            
                            {/* Title and Description */}
                            <div>
                                <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300">
                                    {metadata?.name}
                                </h3>
                            </div>
                        </div>

                        {/* Price Tag */}
                        <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center space-x-2 bg-blue-500/10 px-3 py-1 rounded-full">
                                <span className="text-blue-400 font-bold">
                                    {(Number(mintPrice) / 1e9).toFixed(2)}
                                </span>
                                <span className="text-blue-400/70 font-medium">TON</span>
                            </div>
                            <span className="text-xs text-gray-400">One-time mint</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                        {metadata?.description}
                    </p>

                    {/* Mint Button */}
                    <div className="mt-6 transform transition-all duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!hasMinted) handleMint();
                            }}
                            disabled={mintingStatus === 'loading' || hasMinted}
                            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300
                                ${mintingStatus === 'loading' || hasMinted
                                    ? 'bg-gray-700/50 cursor-not-allowed text-gray-400' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                                } relative overflow-hidden`}
                        >
                            {/* Button Content with Status */}
                            <div className="relative flex items-center justify-center space-x-2">
                                {mintingStatus === 'loading' ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Minting your NFT...</span>
                                    </>
                                ) : hasMinted ? (
                                    <>
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Successfully Minted</span>
                                    </>
                                ) : mintingStatus === 'success' ? (
                                    <>
                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Mint Successful!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Mint {metadata?.name || 'NFT'}</span>
                                    </>
                                )}
                            </div>
                            
                            {/* Animated background for hover effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </div>

                    {/* Status Indicators */}
                    {mintingStatus === 'success' && (
                        <div className="mt-4 text-center">
                            <p className="text-green-400 text-sm animate-fade-in">
                                🎉 Congratulations! Your TON Fortune Stakers NFT has been minted successfully.
                            </p>
                        </div>
                    )}
                    
                    {mintingStatus === 'error' && (
                        <div className="mt-4 text-center">
                            <p className="text-red-400 text-sm animate-fade-in">
                                ❌ There was an error minting your TON Fortune Stakers NFT. Please try again.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-gradient-to-br from-black/50 to-[#0A0A0A]/50 rounded-xl p-4 border border-blue-500/10">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This is a Soul-Bound Token (SBT) and cannot be transferred once minted.</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-400 mt-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Minting this NFT allows you to whitelist your wallet for weekly TON distributions from the staking pool.</span>
                </div>
            </div>
        </div>
    );
}; 