// ... existing code ...

import {  useEffect, useMemo, useState } from "react";
import { TonConnectButton, useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Address } from "@ton/core";
import { toNano } from "@ton/core";
import { X, Send, AlertCircle } from "lucide-react";
import { Button, Snackbar } from "@telegram-apps/telegram-ui";
import {
  FaRocket,
  FaChartLine,
  FaLock,
  FaRoad,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
} from 'react-icons/fa';

import { isValidAddress } from '../utility/address';
import { formatTonValue } from "../utility/format";
import ta from "../utility/tonapi";
import { JettonList } from "./JettonList";
import { NFTList } from "./NFTList";
import { useAuth } from '@/hooks/useAuth';

interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  initialMarketCap: string;
  launchDate: string;
  description: string;
}

interface TokenDistribution {
  category: string;
  percentage: number;
  lockup?: string;
}

interface RoadmapItem {
  quarter: string;
  title: string;
  items: string[];
  status: 'completed' | 'in-progress' | 'upcoming';
}

function TonWallet() {
  const [error, setError] = useState<string | null>(null);
  const [tonBalance, setTonBalance] = useState<string>("0.00");
  const [isSendModalOpen, setSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
  const [isLoadingTON, setIsLoadingTON] = useState(true);
  const [activeTab, setActiveTab] = useState<'jettons' | 'nfts' | 'token'>('jettons');
  const [tokenActiveTab, setTokenActiveTab] = useState<'overview' | 'tokenomics' | 'roadmap'>('overview');
  const [showFutureRoadmap, setShowFutureRoadmap] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarDescription, setSnackbarDescription] = useState<string>('');
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [jettons, setJettons] = useState<any[]>([]);
  const [, setSelectedJetton] = useState<any>(null);
  const [isImportingToken, setIsImportingToken] = useState(false);
  const { user } = useAuth();
  const userStkBalance = user?.total_sbt || 0;

  const connectedAddressString = useTonAddress();
  const connectedAddress = useMemo(() => {
    return isValidAddress(connectedAddressString)
      ? Address.parse(connectedAddressString)
      : null;
  }, [connectedAddressString]);

  const [tonConnectUI] = useTonConnectUI();
  // const { open: openWalletModal } = useTonConnectModal();
  // const [, setIsConnecting] = useState(false);

  const tokenInfo: TokenInfo = {
    name: "Stakers Token",
    symbol: "$STK",
    totalSupply: "1,000,000,000",
    initialMarketCap: "$50,000",
    launchDate: "2025-06-03",
    description: "Stakers Token (STK) is the governance and utility token powering the Stakers ecosystem, ensuring rewards, liquidity, and community engagement. With a total supply of 1 Billion tokens the updated token allocation ensures sustainability and growth."
  };

  const tokenDistribution: TokenDistribution[] = [
    { category: "Staking Rewards", percentage: 35, lockup: "No lockup" },
    { category: "Community Growth", percentage: 15, lockup: "2 years vesting" },
    { category: "Liquidity Pool", percentage: 20, lockup: "1 year vesting" },
    { category: "Team and Advisors", percentage: 10, lockup: "2 years vesting" },
    { category: "Partnerships and Marketing", percentage: 10, lockup: "1 year vesting" },
    { category: "Reserve Fund", percentage: 10, lockup: "2 years vesting" }
  ];

  const roadmap: RoadmapItem[] = [
    {
      quarter: "Q1 2025",
      title: "Platform Launch & Initial Growth",
      items: [
        "Launch Ton Stake It Platform & Website",
        "Implement Referral & Ranking Systems",
        "Begin Stakers Token Distribution"
      ],
      status: 'completed'
    },
    {
      quarter: "Q2 2025",
      title: "Token Launch & Community Building",
      items: [
        "Execute Community Airdrop Campaigns",
        "List $STK on DEX Platforms",
        "Strategic Influencer Partnerships"
      ],
      status: 'in-progress'
    },
    {
      quarter: "Q3 2025",
      title: "Mobile & Governance",
      items: [
        "Release TON Stake It Mobile App",
        "Implement $STK Governance System",
        "Expand TON Wallet Integration"
      ],
      status: 'upcoming'
    },
    {
      quarter: "Q4 2025",
      title: "Ecosystem Growth",
      items: [
        "Expand Global Partnerships",
        "Launch Special Staking Events",
        "Implement Sustainability Features"
      ],
      status: 'upcoming'
    },
    {
      quarter: "2026",
      title: "Gaming & Education",
      items: [
        "Launch P2E Gaming Platform",
        "Develop Blockchain Education Hub",
        "Implement Cross-chain Features"
      ],
      status: 'upcoming'
    },
    {
      quarter: "2027",
      title: "Ecosystem Maturity",
      items: [
        "Launch NFT Marketplace",
        "Advanced Staking Mechanisms",
        "Institutional Partnership Program",
        "Global Staking Leadership"
      ],
      status: 'upcoming'
    }
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'TBA';
    }
  };

  // const handleOpenWalletModal = async () => {
  //   setIsConnecting(true);
  //   try {
  //     await openWalletModal();
  //   } finally {
  //     setIsConnecting(false);
  //   }
  // };

  // Fetch TON balance
  useEffect(() => {
    if (!connectedAddress) {
      setTonBalance("0.00");
      setIsLoadingTON(false);
      return;
    }

    setIsLoadingTON(true);
    ta.accounts
      .getAccount(connectedAddress)
      .then((info) => {
        const balance = formatTonValue(info.balance.toString());
        setTonBalance(balance);
      })
      .catch((e) => {
        console.error("Failed to fetch TON balance:", e);
        setTonBalance("0.00");
      })
      .finally(() => {
        setIsLoadingTON(false);
      });
  }, [connectedAddress]);

  const handleSendTon = async (destinationAddress: string, amount: string) => {
    try {
      setError(null);
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
        messages: [
          {
            address: destinationAddress,
            amount: toNano(amount).toString(),
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);
      setSendModalOpen(false);
    } catch (e) {
      console.error('Failed to send TON:', e);
      setError(e instanceof Error ? e.message : 'Failed to send TON. Please try again.');
    }
  };

  const handleCopyAddress = async () => {
    if (!connectedAddressString) return;
    
    try {
      await navigator.clipboard.writeText(connectedAddressString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      setError('Failed to copy address to clipboard');
    }
  };

  const showSnackbar = (message: string, description: string) => {
    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setIsSnackbarVisible(true);
    setTimeout(() => setIsSnackbarVisible(false), 3000);
  };

  const importSpecificJetton = async (tokenAddress: string = "EQAz-pzFbiv4pw_nPh-8Z9eimuaDJEnZhCVWfZPGOdB8TlfS") => {
    if (!connectedAddress) return;
    
    try {
      setIsImportingToken(true);
      // Get all jetton balances for the wallet
      const balanceInfo = await ta.accounts.getAccountJettonsBalances(connectedAddress);
      
      // Find the specific jetton balance
      const balance = balanceInfo.balances.find(
        j => j.jetton.address.toString() === tokenAddress
      );
      
      if (balance) {
        setJettons(prev => {
          // Check if this jetton is already in the list
          const exists = prev.some(j => j.jetton.address.toString() === tokenAddress);
          if (exists) return prev;
          return [...prev, balance];
        });
        showSnackbar("Token imported", "The token has been added to your list");
      } else {
        // If the user doesn't have a balance of this token, fetch the jetton info
        const jettonInfo = await ta.jettons.getJettonInfo(Address.parse(tokenAddress));
        if (jettonInfo) {
          showSnackbar("Token found", "This token exists but you don't have a balance yet");
        }
      }
    } catch (error) {
      console.error('Error importing specific token:', error);
      showSnackbar("Import failed", "Could not import the token");
    } finally {
      setIsImportingToken(false);
    }
  };

  const handleImportToken = async (tokenAddress: string): Promise<void> => {
    if (!connectedAddress) return;
    
    try {
      // Get all jetton balances for the wallet
      const balanceInfo = await ta.accounts.getAccountJettonsBalances(connectedAddress);
      
      // Find the specific jetton balance
      const balance = balanceInfo.balances.find(
        j => j.jetton.address.toString() === tokenAddress
      );
      
      if (balance) {
        setJettons(prev => {
          // Check if this jetton is already in the list
          const exists = prev ? prev.some(j => j.jetton.address.toString() === tokenAddress) : false;
          if (exists) return prev || [];
          return prev ? [...prev, balance] : [balance];
        });
      } else {
        // If the user doesn't have a balance of this token, fetch the jetton info
        const jettonInfo = await ta.jettons.getJettonInfo(Address.parse(tokenAddress));
        if (jettonInfo) {
          showSnackbar("Token found", "This token exists but you don't have a balance yet");
        }
      }
    } catch (error) {
      console.error('Error importing token:', error);
    }
  };

  useEffect(() => {
    if (connectedAddress) {
      ta.accounts.getAccountJettonsBalances(connectedAddress)
        .then(balanceInfo => {
          setJettons(balanceInfo.balances || []);
        })
        .catch(error => {
          console.error('Error loading jettons:', error);
        });
    } else {
      setJettons([]);
    }
  }, [connectedAddress]);

  // Add new profile-related states
  const [showProfileStats, setShowProfileStats] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'stats' | 'achievements'>('overview');

  // Helper function to format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200 shadow-lg overflow-hidden">
      {/* Profile Card */}
      {connectedAddress && (
        <div className="relative mb-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="relative p-4">
            <div className="absolute inset-0 bg-grid-green/[0.03] bg-[length:20px_20px]"></div>
            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* Left side: Profile info */}
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="relative group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-200 overflow-hidden flex items-center justify-center">
                    {user?.photoUrl ? (
                      <img 
                        src={user.photoUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🐸</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-green-800">
                      {user?.username || 'Ribbit User'}
                    </h2>
                    <span className="px-2 py-0.5 bg-green-100 rounded-full text-xs font-medium text-green-700">
                      {user?.rank || 'Tadpole'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center bg-green-100 rounded-full">💎</span>
                      <span className="text-xs text-green-700">{formatNumber(user?.balance || 0)} TON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center bg-green-100 rounded-full">👥</span>
                      <span className="text-xs text-green-700">{formatNumber(user?.direct_referrals || 0)} Frogs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Connect button and expand */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfileStats(!showProfileStats)}
                  className="p-1 hover:bg-green-100 rounded-lg transition-colors"
                >
                  {showProfileStats ? (
                    <FaChevronUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <FaChevronDown className="w-3 h-3 text-green-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Profile Stats */}
          {showProfileStats && (
            <div className="border-t border-green-200 animate-fade-in">
              {/* Profile Navigation */}
              <div className="flex border-b border-green-200">
                {['overview', 'stats', 'achievements'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveProfileTab(tab as typeof activeProfileTab)}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      activeProfileTab === tab
                        ? 'bg-green-100 text-green-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Profile Content */}
              <div className="p-4">
                {activeProfileTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <p className="text-xs text-green-700">Connected Wallet</p>
                          </div>
                        </div>
                      </div>
                      <TonConnectButton className="!min-h-[32px] !px-3 !py-1.5 relative" />
                    </div>
                  </div>
                )}

                {activeProfileTab === 'stats' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Value Locked', value: user?.balance || 0, unit: 'TON', icon: '💎' },
                      { label: 'Stakers Token', value: user?.total_sbt || 0, unit: 'STK', icon: '🐸' },
                    ].map((stat, index) => (
                      <div key={index} className="p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{stat.icon}</span>
                          <p className="text-xs text-green-700">{stat.label}</p>
                        </div>
                        <p className="text-sm font-medium text-green-800">
                          {formatNumber(stat.value)}
                          {stat.unit && <span className="text-xs text-green-600 ml-1">{stat.unit}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeProfileTab === 'achievements' && (
                  <div className="space-y-3">
                    <p className="text-center text-green-600 text-sm">🐸 Ribbit! Achievements coming soon!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Wallet Connection Card */}
      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-200 shadow-md relative overflow-hidden">
        {/* Enhanced decorative elements */}
        <div className="absolute inset-0 bg-grid-green/[0.03] bg-[length:20px_20px]"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-green-100/50 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-green-100/50 blur-3xl"></div>
        
        {/* Enhanced animated particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-green-400/40 blur-sm animate-float"></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 rounded-full bg-green-400/30 blur-sm animate-float-slow"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 rounded-full bg-green-400/30 blur-sm animate-float-slower"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-green-400/30 blur-sm animate-float-medium"></div>
        
        {!connectedAddress ? (
          <div className="flex flex-col items-center gap-4 py-8 relative z-10">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-green-800 mb-2 text-shadow-glow">Connect Wallet</h2>
              <p className="text-green-700 text-sm">Connect your TON wallet to access your digital assets</p>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <TonConnectButton className="!min-h-[48px] !px-6 !py-3 relative" />
            </div>
            
            {/* Wallet Features */}
            <div className="grid grid-cols-2 gap-4 mt-8 w-full">
              {[
                {
                  icon: "🔒",
                  title: "Secure Connection",
                  description: "Your keys, your crypto"
                },
                {
                  icon: "⚡",
                  title: "Fast Transactions",
                  description: "Lightning-quick transfers"
                },
                {
                  icon: "🌐",
                  title: "Cross-Chain Ready",
                  description: "Multi-chain support"
                },
                {
                  icon: "💎",
                  title: "Token Management",
                  description: "Handle all your assets"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/5 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h3 className="text-sm font-medium text-green-800 mb-1">{feature.title}</h3>
                      <p className="text-xs text-green-700">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20 w-full">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-1">Security First</h4>
                  <p className="text-xs text-green-700">
                    We never store your private keys. All transactions require your confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Balance Display Section */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-medium text-green-700 uppercase tracking-wider">Your Balance</h2>
                <div className="flex items-baseline gap-2">
                  {isLoadingTON ? (
                    <div className="animate-pulse h-8 bg-green-100 rounded w-24"></div>
                  ) : (
                    <p className="text-3xl font-bold text-green-800">
                      {tonBalance} <span className="text-sm text-green-600">TON</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setReceiveModalOpen(true)}
                  className="p-2.5 bg-white hover:bg-green-50 text-green-700 rounded-lg transition-all duration-300 hover:scale-105 border border-green-200 hover:border-green-300 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="sm:inline">Receive</span>
                </button>
                <button 
                  onClick={() => setSendModalOpen(true)}
                  className="p-2.5 bg-white hover:bg-green-50 text-green-700 rounded-lg transition-all duration-300 hover:scale-105 border border-green-200 hover:border-green-300 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="sm:inline">Send</span>
                </button>
              </div>
            </div>

            {/* STK Balance Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]"></div>
              
              {/* Balance Section */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 9H9V15H15V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-green-800">Your STK Balance</h2>
                    <p className="text-sm text-green-600">Stakers Token</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-800">
                      {userStkBalance.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-green-600">STK</span>
                  </div>
                  <div className="mt-1 px-2 py-0.5 bg-green-50 rounded-full text-xs text-green-600 font-medium border border-green-100">
                    Liquid Asset
                  </div>
                </div>
              </div>
              
              {/* Progress bar showing token power */}
              <div className="border-t border-green-100 mt-4 pt-4 relative z-10">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-green-600">Token Power</span>
                  <span className="text-green-700 font-medium">{Math.min(100, Math.floor(userStkBalance / 100))}%</span>
                </div>
                <div className="h-1.5 bg-green-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full relative"
                    style={{ width: `${Math.min(100, Math.floor(userStkBalance / 100))}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Display - Enhanced with more game-like styling */}
            <div className="mb-6 mt-4">
              <h3 className="text-sm font-medium text-green-800 uppercase tracking-wider mb-2">Wallet Address</h3>
              <div className="flex items-center gap-2 bg-gray-700/60 rounded-lg p-3 border border-green-500/40 backdrop-blur-sm hover:border-green-500/60 transition-all duration-300">
                <div className="flex-1 truncate text-sm text-green-200 font-mono">
                  {connectedAddressString}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-800 rounded-lg transition-all duration-300 hover:scale-105 border border-green-500/30 hover:border-green-500/50"
                >
                  {copySuccess ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Navigation - Enhanced with more game-like styling */}
            <div className="flex space-x-4 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('jettons')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 whitespace-nowrap
                  ${activeTab === 'jettons' 
                    ? 'bg-green-500/30 text-green-200 border border-green-500/50 shadow-glow-sm scale-105' 
                    : 'text-green-700 hover:text-green-800 hover:bg-green-500/10 border border-transparent'}`}
              >
                <span className="text-lg">💎</span>
                <span>Jettons</span>
              </button>
              
              <button
                onClick={() => setActiveTab('nfts')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 whitespace-nowrap
                  ${activeTab === 'nfts' 
                    ? 'bg-green-500/30 text-green-200 border border-green-500/50 shadow-glow-sm scale-105' 
                    : 'text-green-700 hover:text-green-800 hover:bg-green-500/10 border border-transparent'}`}
              >
                <span className="text-lg">🖼️</span>
                <span>NFTs</span>
              </button>
              
              <button
                onClick={() => setActiveTab('token')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 whitespace-nowrap
                  ${activeTab === 'token' 
                    ? 'bg-green-500/30 text-green-200 border border-green-500/50 shadow-glow-sm scale-105' 
                    : 'text-green-700 hover:text-green-800 hover:bg-green-500/10 border border-transparent'}`}
              >
                <span className="text-lg">🚀</span>
                <span>STK Token</span>
              </button>
            </div>

            {/* Tab Content - Enhanced with more game-like styling */}
            <div className="bg-gray-700/40 backdrop-blur-sm rounded-lg p-5 min-h-[200px] border border-green-500/30 hover:border-green-500/40 transition-all duration-500 shadow-inner">
              {activeTab === 'jettons' ? (
                <div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 via-green-400 to-green-400 bg-clip-text text-transparent drop-shadow-glow flex items-center gap-2">
                        <span>Your Jettons</span>
                        <span className="text-sm text-green-700 font-normal">
                          (Fungible Tokens)
                        </span>
                      </h2>
                      {connectedAddress && (
                        <button
                          onClick={() => importSpecificJetton()}
                          disabled={isImportingToken}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
                            ${isImportingToken 
                              ? 'bg-gray-700/50 text-gray-700 cursor-not-allowed' 
                              : 'bg-green-500/20 hover:bg-green-500/30 text-green-800 border border-green-500/30 hover:border-green-500/50 hover:scale-105'}`}
                        >
                          {isImportingToken ? (
                            <span className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                              Importing...
                            </span>
                          ) : (
                            <span>Import Jettons</span>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-green-600/70">
                      Jettons are fungible tokens on TON, similar to ERC-20 tokens on Ethereum.
                      Each Jetton represents a divisible and interchangeable digital asset.
                    </p>
                    <JettonList
                      jettons={jettons}
                      onSelect={setSelectedJetton}
                      onImport={handleImportToken}
                    />
                  </div>
                </div>
              ) : activeTab === 'nfts' ? (
                <div>
                  <NFTList address={connectedAddress} />
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">  
                  {/* Token Tab Navigation */}
                  <div className="flex items-center gap-4 border-b border-slate-700/50 pb-4 overflow-x-auto">
                  <button
                      onClick={() => setTokenActiveTab('overview')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                        tokenActiveTab === 'overview'
                          ? 'bg-green-500/10 text-green-400 font-medium'
                          : 'text-green-700 hover:text-green-800'
                      }`}
                    >
                      <FaInfoCircle className="w-4 h-4" />
                      <span>Token Overview</span>
                    </button>
                    
                    <button
                      onClick={() => setTokenActiveTab('tokenomics')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                        tokenActiveTab === 'tokenomics'
                          ? 'bg-green-500/10 text-green-400 font-medium'
                          : 'text-green-700 hover:text-green-800'
                      }`}
                    >
                      <FaChartLine className="w-4 h-4" />
                      <span>Tokenomics</span>
                    </button>
                    
                    <button
                      onClick={() => setTokenActiveTab('roadmap')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                        tokenActiveTab === 'roadmap'
                          ? 'bg-green-500/10 text-green-400 font-medium'
                          : 'text-green-700 hover:text-green-800'
                      }`}
                    >
                      <FaRoad className="w-4 h-4" />
                      <span>Roadmap</span>
                    </button>
                  </div>
                  
                  {/* Token Overview Tab Content */}
                  {tokenActiveTab === 'overview' && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Enhanced Token Overview Card - More responsive and compact */}
                      <div className="relative group">
                        {/* Simplified background effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-500/5 to-green-500/5 rounded-xl blur-md group-hover:blur-lg transition-all duration-300"></div>
                        
                        {/* Main content container - More compact padding */}
                        <div className="relative bg-black/30 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                          {/* Header section with responsive layout */}
                          <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              {/* Simplified logo container */}
                              <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-gradient-to-br from-green-500/10 to-green-500/10 rounded-xl border border-white/10 flex items-center justify-center">
                                <FaRocket className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                              </div>

                              {/* Token info with responsive typography */}
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 via-green-400 to-green-400 bg-clip-text text-transparent">
                                    {tokenInfo.name}
                                  </h1>
                                  <span className="px-2 py-0.5 bg-green-500/10 rounded-full text-green-400 text-xs font-medium border border-green-500/20">
                                    {tokenInfo.symbol}
                                  </span>
                                </div>
                                <p className="text-sm text-green-700 leading-relaxed line-clamp-3">
                                  {tokenInfo.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats grid - More responsive with better spacing */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
                            {[
                              { label: "Total Supply", value: tokenInfo.totalSupply, icon: "📊" },
                              { label: "Initial MCap", value: tokenInfo.initialMarketCap, icon: "💰" },
                              { label: "Launch Date", value: formatDate(tokenInfo.launchDate), icon: "🚀" },
                              { label: "Token Type", value: "TON Jetton", icon: "💎" }
                            ].map((stat, index) => (
                              <div key={index} className="group/stat relative">
                                <div className="relative p-3 sm:p-4 bg-black/20">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg sm:text-xl">{stat.icon}</span>
                                    <div>
                                      <p className="text-xs text-green-700">{stat.label}</p>
                                      <p className="text-sm font-semibold text-green-800 group-hover/stat:text-green-300 transition-colors">
                                        {stat.value}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Features Section - More compact and responsive */}
                          <div className="p-4 sm:p-5">
                            <h3 className="text-base font-semibold text-green-800 mb-3">Key Features</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                {
                                  title: "Quantum-Proof Security",
                                  description: "Future-ready cryptographic standards",
                                  icon: "🔐"
                                },
                                {
                                  title: "AI-Powered Distribution",
                                  description: "Smart contract optimization via ML",
                                  icon: "🤖"
                                },
                                {
                                  title: "Cross-Chain Bridge",
                                  description: "Seamless blockchain integration",
                                  icon: "🌉"
                                },
                                {
                                  title: "Community Governance",
                                  description: "Decentralized decision-making",
                                  icon: "⚡"
                                }
                              ].map((feature, index) => (
                                <div key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                  <span className="text-xl mt-0.5">{feature.icon}</span>
                                  <div>
                                    <h4 className="font-medium text-sm text-green-800">{feature.title}</h4>
                                    <p className="text-xs text-green-700">
                                      {feature.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer - More compact and professional */}
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/20 border border-white/10 flex items-center justify-center text-xs">
                                    {['👥', '🌟', '🔥'][i]}
                                  </div>
                                ))}
                              </div>
                              {/* <span className="text-xs text-gray-400">1,000+ holders</span> */}
                            </div>
                            
                            <a 
                              href="https://tonviewer.com/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg text-green-400 text-xs font-medium border border-green-500/20 hover:border-green-500/30 transition-all duration-300 flex items-center gap-1.5"
                            >
                              <span>Coming Soon</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tokenomics Content */}
                  {tokenActiveTab === 'tokenomics' && (
                    <div className="animate-fade-in">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-green-400 bg-clip-text text-transparent">
                          Token Distribution
                        </h2>
                        <div className="text-xs text-green-700">Total Supply: {tokenInfo.totalSupply}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tokenDistribution.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-black/20 rounded-xl p-4 border border-slate-700/30 hover:border-green-500/30 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/20 flex items-center justify-center shrink-0">
                                <span className="text-lg font-bold">{item.percentage}%</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-base text-green-200">{item.category}</p>
                                {item.lockup && (
                                  <div className="flex items-center gap-2 text-sm text-green-700 mt-1">
                                    <FaLock className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.lockup}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 to-green-500" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <p className="text-sm text-green-700 leading-relaxed">
                          {tokenInfo.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Roadmap Content */}
                  {tokenActiveTab === 'roadmap' && (
                    <div className="animate-fade-in">
                      <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-green-400 bg-clip-text text-transparent mb-6">
                        Development Timeline
                      </h2>
                      
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-green-500/50 to-transparent hidden sm:block"></div>
                        
                        <div className="space-y-6">
                          {/* Current and Past Phases (Q1-Q2) */}
                          {roadmap.slice(0, 2).map((phase, index) => (
                            <div 
                              key={index} 
                              className="relative group sm:pl-12"
                            >
                              {/* Timeline dot with dynamic styling based on status */}
                              <div className={`absolute left-2 top-2 w-4 h-4 rounded-full hidden sm:flex items-center justify-center
                                ${phase.status === 'completed' 
                                  ? 'bg-green-500 border-0' 
                                  : phase.status === 'in-progress'
                                    ? 'bg-green-500/30 border-2 border-green-500 animate-pulse' 
                                    : 'bg-green-500/30 border-2 border-green-500/50'
                                }`}>
                                {phase.status === 'completed' && (
                                  <svg className="w-2.5 h-2.5 text-green-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                  </svg>
                                )}
                              </div>
                              
                              <div className={`p-4 rounded-xl border transition-all duration-300
                                ${phase.status === 'completed' 
                                  ? 'bg-green-900/10 border-green-500/30 hover:border-green-500/50' 
                                  : phase.status === 'in-progress'
                                    ? 'bg-green-900/10 border-green-500/30 hover:border-green-500/50 shadow-lg shadow-green-500/10' 
                                    : 'bg-slate-800/30 border-slate-700/30 hover:border-green-500/30'
                                }`}>
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                  <div className={`px-3 py-1 rounded-lg
                                    ${phase.status === 'completed' 
                                      ? 'bg-green-500/10 text-green-400' 
                                      : phase.status === 'in-progress'
                                        ? 'bg-green-500/10 text-green-400' 
                                        : 'bg-green-500/10 text-green-400'
                                    }`}>
                                    <span className="text-sm font-medium">{phase.quarter}</span>
                                  </div>
                                  <h3 className="text-base font-semibold text-green-200">
                                    {phase.title}
                                  </h3>
                                  <div className="ml-auto px-2 py-0.5 rounded text-xs font-medium capitalize" 
                                    style={{
                                      backgroundColor: phase.status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 
                                                      phase.status === 'in-progress' ? 'rgba(59, 130, 246, 0.2)' : 
                                                      'rgba(168, 85, 247, 0.2)',
                                      color: phase.status === 'completed' ? 'rgb(134, 239, 172)' : 
                                            phase.status === 'in-progress' ? 'rgb(147, 197, 253)' : 
                                            'rgb(216, 180, 254)'
                                    }}
                                  >
                                    {phase.status}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                                  {phase.items.map((item, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-start gap-2 group/item"
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-colors
                                        ${phase.status === 'completed' 
                                          ? 'bg-green-400' 
                                          : phase.status === 'in-progress'
                                            ? 'bg-green-400/50 group-hover/item:bg-green-400' 
                                            : 'bg-green-400/50 group-hover/item:bg-green-400'
                                        }`}></div>
                                      <span className={`text-sm transition-colors
                                        ${phase.status === 'completed' 
                                          ? 'text-green-300' 
                                          : phase.status === 'in-progress'
                                            ? 'text-green-300' 
                                            : 'text-green-700 group-hover/item:text-green-300'
                                        }`}>
                                        {item}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Toggle Button for Future Roadmap */}
                          <div className="flex justify-center">
                            <button
                              onClick={() => setShowFutureRoadmap(!showFutureRoadmap)}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-green-700 hover:text-green-800 transition-all"
                            >
                              {showFutureRoadmap ? (
                                <>
                                  <span>Hide Future Roadmap</span>
                                  <FaChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <span>Show Future Roadmap</span>
                                  <FaChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </div>
                          
                          {/* Future Roadmap (Q3 onwards) - Compact Version */}
                          {showFutureRoadmap && (
                            <div className="mt-4 space-y-3 animate-fade-in">
                              {roadmap.slice(2).map((phase, index) => (
                                <div 
                                  key={index} 
                                  className="relative group sm:pl-12"
                                >
                                  {/* Small timeline dot */}
                                  <div className="absolute left-2 top-4 w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30 hidden sm:block"></div>
                                  
                                  <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/20 hover:border-green-500/20 transition-all duration-300">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="px-2 py-0.5 bg-green-500/5 rounded text-xs font-medium text-green-400/80">
                                        {phase.quarter}
                                      </div>
                                      <h3 className="text-sm font-medium text-green-300">
                                        {phase.title}
                                      </h3>
                                      
                                      {/* Expandable Items */}
                                      <div className="w-full mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                        {phase.items.map((item, idx) => (
                                          <div 
                                            key={idx} 
                                            className="flex items-start gap-1.5 group/item"
                                          >
                                            <div className="w-1 h-1 rounded-full bg-green-400/30 mt-1.5 group-hover/item:bg-green-400/60 transition-colors"></div>
                                            <span className="text-xs text-green-700 group-hover/item:text-green-300 transition-colors">
                                              {item}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    {/* Send Modal - Enhanced with more game-like styling */}
    {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSendModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full overflow-hidden border border-green-500/40 shadow-[0_0_25px_rgba(99,102,241,0.3)] animate-fade-in">
            <div className="p-6 border-b border-green-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]"></div>
              <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-green-500/10 blur-2xl"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40">
                    <Send className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 via-green-400 to-green-400 bg-clip-text text-transparent">Send TON</h2>
                    <p className="text-sm text-green-300">
                      Available: {tonBalance} TON
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSendModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors hover:scale-110 duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const address = (form.elements.namedItem('address') as HTMLInputElement).value;
              const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
              await handleSendTon(address, amount);
            }}>
              <div className="p-6 space-y-6 relative">
                <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]"></div>
                <div className="relative z-10">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center space-x-3 animate-pulse">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-green-300 mb-2 font-medium">
                        Recipient Address
                      </label>
                      <input
                        name="address"
                        type="text"
                        placeholder="Enter TON address"
                        className="w-full px-4 py-3 bg-gray-900/70 border border-green-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/70 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-green-300 mb-2 font-medium">
                        Amount
                      </label>
                      <div className="relative">
                        <input
                          name="amount"
                          type="number"
                          step="0.000000001"
                          min="0"
                          placeholder="0.0"
                          className="w-full px-4 py-3 bg-gray-900/70 border border-green-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/70 focus:ring-1 focus:ring-green-500/70 transition-all"
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                              input.value = tonBalance;
                            }}
                            className="text-sm text-green-400 hover:text-green-300 font-medium px-2 py-1 bg-green-500/10 rounded-md hover:bg-green-500/20 transition-all"
                          >
                            MAX
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-green-500/30 bg-gray-900/70 relative">
                <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]"></div>
                <div className="flex space-x-4 relative z-10">
                  <button
                    type="button"
                    onClick={() => setSendModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-green-500/30 rounded-xl text-green-300 hover:bg-green-500/10 transition-all duration-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 via-green-600 to-green-600 hover:from-green-500 hover:via-green-500 hover:to-green-500 rounded-xl text-white text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-glow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send TON</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Modal - Enhanced with more game-like styling */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setReceiveModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-green-500/40 shadow-[0_0_25px_rgba(99,102,241,0.3)] animate-fade-in relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-green/[0.02] bg-[length:20px_20px]"></div>
            <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-green-500/10 blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-20 h-20 rounded-full bg-green-500/10 blur-2xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 via-green-400 to-green-400 bg-clip-text text-transparent mb-4">Receive TON</h3>
              {!connectedAddressString ? (
                <div className="text-center py-6">
                  <p className="text-green-300 mb-4">Please connect your wallet first</p>
                  <div className="relative group inline-block">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <TonConnectButton className="relative" />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-green-300 mb-2 font-medium">Your Wallet Address</label>
                    <div className="relative group">
                      <div className="flex items-center w-full px-4 py-3 bg-gray-900/70 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all">
                        <input
                          type="text"
                          value={connectedAddressString}
                          readOnly
                          className="w-full bg-transparent text-white font-mono text-sm outline-none"
                        />
                        <button
                          onClick={handleCopyAddress}
                          className="ml-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 text-sm transition-all flex items-center gap-2 whitespace-nowrap border border-green-500/30 hover:border-green-500/50"
                        >
                          {copySuccess ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-xl flex justify-center relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white p-4 rounded-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${connectedAddressString}`}
                        alt="Wallet Address QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-green-200/70">
                      Share this address to receive TON and other tokens in your wallet.
                    </p>
                  </div>
                  <button
                    onClick={() => setReceiveModalOpen(false)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 via-green-600 to-green-600 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:shadow-glow-sm"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isSnackbarVisible && (
        <Snackbar
          onClose={() => setIsSnackbarVisible(false)}
          duration={4000}
          description={snackbarDescription}
          after={<Button size="s" onClick={() => setIsSnackbarVisible(false)}>Close</Button>}
          className="snackbar-top"
        >
          <div>
            {snackbarMessage}
          </div>
        </Snackbar>
      )}
    </div>
  );
}

// // Add the formatDate function
// const formatDate = (dateString: string) => {
//   try {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) {
//       throw new Error('Invalid date');
//     }
//     return date.toLocaleDateString();
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return 'TBA';
//   }
// };

export default TonWallet;

