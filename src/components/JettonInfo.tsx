// import { useState, useEffect } from 'react';
// import { Address } from '@ton/core';
// import { useTonWallet } from '@tonconnect/ui-react';
// import { JettonMaster } from '@/contracts/JettonMaster';
// import { getHttpEndpoint } from '@orbs-network/ton-access';
// import { TonClient } from '@ton/ton';

// interface JettonInfoProps {
//     jettonAddress: string;
// }

// export function JettonInfo({ jettonAddress }: JettonInfoProps) {
//     const wallet = useTonWallet();
//     const [isLoading, setIsLoading] = useState(true);
//     const [jettonData, setJettonData] = useState<{
//         totalSupply: bigint;
//         mintable: boolean;
//         adminAddress: Address;
//     } | null>(null);
//     const [walletAddress, setWalletAddress] = useState<string | null>(null);

//     useEffect(() => {
//         async function loadJettonData() {
//             try {
//                 setIsLoading(true);
//                 const endpoint = await getHttpEndpoint({ network: 'mainnet' });
//                 const client = new TonClient({ endpoint });
//                 const contract = JettonMaster.createFromAddress(Address.parse(jettonAddress));
//                 const openedContract = client.open(contract);

//                 const data = await openedContract.getJettonData();
//                 setJettonData(data);

//                 if (wallet?.account.address) {
//                     const jettonWalletAddress = await openedContract.getWalletAddress(
//                         Address.parse(wallet.account.address)
//                     );
//                     setWalletAddress(jettonWalletAddress.toString());
//                 }
//             } catch (error) {
//                 console.error('Error loading jetton data:', error);
//             } finally {
//                 setIsLoading(false);
//             }
//         }

//         loadJettonData();
//     }, [jettonAddress, wallet]);

//     if (isLoading) {
//         return <div className="text-center">Loading jetton information...</div>;
//     }

//     if (!jettonData) {
//         return <div className="text-center">Failed to load jetton information</div>;
//     }

//     return (
//         <div className="bg-[#2c2d31] rounded-2xl p-6 border border-gray-800">
//             <h2 className="text-2xl font-bold text-white mb-4">Jetton Information</h2>
//             <div className="space-y-4">
//                 <div>
//                     <span className="text-gray-400">Total Supply:</span>{' '}
//                     <span className="text-white">{jettonData.totalSupply.toString()}</span>
//                 </div>
//                 <div>
//                     <span className="text-gray-400">Mintable:</span>{' '}
//                     <span className="text-white">{jettonData.mintable ? 'Yes' : 'No'}</span>
//                 </div>
//                 <div>
//                     <span className="text-gray-400">Admin Address:</span>{' '}
//                     <span className="text-white">{jettonData.adminAddress.toString()}</span>
//                 </div>
//                 {walletAddress && (
//                     <div>
//                         <span className="text-gray-400">Your Jetton Wallet:</span>{' '}
//                         <span className="text-white">{walletAddress}</span>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// } 