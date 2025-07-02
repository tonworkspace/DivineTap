// import React, { useState, useEffect } from 'react';
// import { useTonConnectUI } from '@tonconnect/ui-react';
// import { Address, beginCell, toNano } from '@ton/core';
// import { NftCollection } from '@/utils/contract-build/NftCollection/tact_NftCollection';
// import { getHttpEndpoint } from '@orbs-network/ton-access';
// import { TonClient } from '@ton/ton';
// import { decodeCell } from '@/utility/decode-cell';

// // Add NFT contract address
// const NFT_CONTRACT_ADDRESS = "EQC1uQO67YdPQPGBUsfnE2HOa3gpQM745zbxKX3IPEIDiZP5"; // Replace with your contract address

// async function fetchMetadata(url: string) {
//     try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error('Network response was not ok');
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching metadata:', error);
//         return null;
//     }
// }

// interface CollectionMetadata {
//   name: string;
//   description: string;
//   image: string;
// }

// interface LootBoxCardProps {
//   type: "common" | "rare" | "epic" | "legendary";
//   title: string;
//   description: string;
//   price: number;
//   onStatusChange?: (status: 'idle' | 'loading' | 'success' | 'error') => void;
//   onOpenSuccess?: () => void;
// }

// export const LootBoxCard2: React.FC<LootBoxCardProps> = ({
//   type,
//   title,
//   description,
//   price,
//   onStatusChange,
//   onOpenSuccess,
// }) => {
//   const [tonConnectUI] = useTonConnectUI();
//   const [state, setState] = useState({
//     isLoading: true,
//     metadata: null as CollectionMetadata | null,
//     openingStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error'
//   });

//   useEffect(() => {
//     const loadCollectionData = async () => {
//       try {
//         const client = new TonClient({ endpoint: await getHttpEndpoint({ network: 'mainnet' }) });
//         const contract = client.open(NftCollection.fromAddress(Address.parse(NFT_CONTRACT_ADDRESS)));
//         const collectionData = await contract.getGetCollectionData();
//         const metadata = await fetchMetadata(decodeCell(collectionData.collection_content));
//         setState(s => ({ ...s, isLoading: false, metadata }));
//       } catch (error) {
//         console.error('Error loading collection data:', error);
//         setState(s => ({ ...s, isLoading: false }));
//       }
//     };

//     loadCollectionData();
//   }, []);

//   const handleOpenBox = async () => {
//     if (!tonConnectUI?.account) return;

//     try {
//       setState(s => ({ ...s, openingStatus: 'loading' }));
//       onStatusChange?.('loading');

//       // Initialize TON client
//       const client = new TonClient({
//         endpoint: await getHttpEndpoint({ network: 'mainnet' })
//       });

//       // Connect to NFT Collection contract
//       const contract = client.open(NftCollection.fromAddress(Address.parse(NFT_CONTRACT_ADDRESS)));

//       // Get mint price from contract
//       const mintPrice = await contract.getGetNftPrice();
//       const totalPrice = BigInt(mintPrice) + BigInt(toNano('0.05')); // Add gas fees

//       // Send mint transaction
//       await tonConnectUI.sendTransaction({
//         validUntil: Math.floor(Date.now() / 1000) + 60,
//         messages: [{
//           address: NFT_CONTRACT_ADDRESS,
//           amount: totalPrice.toString(),
//           payload: beginCell()
//             .storeUint(0, 32)
//             .storeStringTail("Mint")
//             .endCell()
//             .toBoc()
//             .toString('base64'),
//         }],
//       });

//       setState(s => ({ ...s, openingStatus: 'success' }));
//       onStatusChange?.('success');
//       onOpenSuccess?.();

//       setTimeout(() => {
//         setState(s => ({ ...s, openingStatus: 'idle' }));
//         onStatusChange?.('idle');
//       }, 3000);
//     } catch (error) {
//       console.error('Error minting NFT from loot box:', error);
//       setState(s => ({ ...s, openingStatus: 'error' }));
//       onStatusChange?.('error');
      
//       setTimeout(() => {
//         setState(s => ({ ...s, openingStatus: 'idle' }));
//         onStatusChange?.('idle');
//       }, 3000);
//     }
//   };

//   const getColors = () => {
//     return type === 'common' 
//       ? {
//           gradient: 'from-blue-900/20 to-blue-800/10',
//           border: 'border-blue-500/20',
//           glow: 'bg-blue-500/20',
//           text: 'text-blue-400',
//           button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400',
//         }
//       : {
//           gradient: 'from-purple-900/20 to-purple-800/10',
//           border: 'border-purple-500/20',
//           glow: 'bg-purple-500/20',
//           text: 'text-purple-400',
//           button: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400',
//         };
//   };

//   const colors = getColors();

//   if (state.isLoading || !state.metadata) {
//     return <div className="flex justify-center py-8">
//       <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//     </div>;
//   }

//   return (
//     <div className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-4 border ${colors.border}`}>
//       <div className="flex items-center justify-center h-24 mb-3">
//         <div className="relative">
//           <div className={`absolute inset-0 rounded-lg ${colors.glow} blur-xl animate-pulse`}></div>
//           <img 
//             src={state.metadata.image}
//             alt={state.metadata.name}
//             className="w-32 h-32 object-cover rounded-lg"
//           />
//         </div>
//       </div>
      
//       <h3 className="text-center text-white font-medium mb-1">{state.metadata.name}</h3>
//       <p className="text-xs text-center text-white/60 mb-3">{state.metadata.description}</p>
      
//       <button
//         onClick={handleOpenBox}
//         disabled={state.openingStatus === 'loading'}
//         className={`w-full py-2 rounded-lg ${colors.button} text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2`}
//       >
//         {state.openingStatus === 'loading' ? (
//           <>
//             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
//             <span>Opening...</span>
//           </>
//         ) : state.openingStatus === 'success' ? (
//           <>
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//             </svg>
//             <span>Opened!</span>
//           </>
//         ) : (
//           <span>Open for {price} TON</span>
//         )}
//       </button>
//     </div>
//   );
// }; 