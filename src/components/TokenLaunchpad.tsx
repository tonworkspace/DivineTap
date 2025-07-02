import { FC, useState } from 'react';
import {
  FaRocket,
  FaChartLine,
  FaLock,
  FaRoad,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
} from 'react-icons/fa';
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


export const TokenLaunchpad: FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tokenomics' | 'roadmap'>('overview');
  const [showFutureRoadmap, setShowFutureRoadmap] = useState(false);  
  const userStkBalance = user?.total_sbt || 0;

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

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-2 sm:px-4 p-custom">
      {/* Combined STK Balance and Idle Rewards Card */}
      {/* Main Card with Tabs */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-700/50">
        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-700/50 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-500/10 text-blue-400 font-medium'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FaInfoCircle className="w-4 h-4" />
            <span>Token Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tokenomics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'tokenomics'
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            <span>Tokenomics</span>
          </button>
          
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-purple-500/10 text-purple-400 font-medium'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FaRoad className="w-4 h-4" />
            <span>Roadmap</span>
          </button>
        </div>
        
        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-4 sm:p-6 border border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
          <div className="absolute top-1/3 left-3/4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-2/3 left-1/2 w-1 h-1 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
        
        {/* Balance Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl shadow-inner border border-white/10 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-blue-300 group-hover:text-blue-200 transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9H9V15H15V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">Your STK Balance</h2>
              <p className="text-sm text-gray-400">Stakers Token</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                {userStkBalance.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-white/80">STK</span>
            </div>
            <div className="mt-1 px-2 py-0.5 bg-green-500/20 rounded-full text-xs text-green-400 font-medium">
              Liquid Asset
            </div>
          </div>
        </div>
        
        {/* Progress bar showing token power */}
        <div className="mt-4 pt-4 border-t border-blue-500/20 relative z-10">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Token Power</span>
            <span className="text-blue-300 font-medium">{Math.min(100, Math.floor(userStkBalance / 100))}%</span>
          </div>
          <div className="h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full relative"
              style={{ width: `${Math.min(100, Math.floor(userStkBalance / 100))}%` }}
            >
              <div className="absolute inset-0 bg-white/30 opacity-0 animate-pulse"></div>
            </div>
          </div>
        </div>
        
      </div>
            {/* Token Overview Card */}
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl p-4 sm:p-6 border border-white/5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl self-start">
                  <FaRocket className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div className="flex-1 w-full">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">{tokenInfo.name}</h1>
                  <p className="text-sm sm:text-base text-gray-400 mb-4">{tokenInfo.description}</p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Symbol</p>
                      <p className="text-base sm:text-lg font-semibold">{tokenInfo.symbol}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Supply</p>
                      <p className="text-base sm:text-lg font-semibold">{tokenInfo.totalSupply}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Initial MCap</p>
                      <p className="text-base sm:text-lg font-semibold">{tokenInfo.initialMarketCap}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Launch Date</p>
                      <p className="text-base sm:text-lg font-semibold">
                        {formatDate(tokenInfo.launchDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>           
          </div>
        )}
        
        {/* Tokenomics Content */}
        {activeTab === 'tokenomics' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Token Distribution
              </h2>
              <div className="text-xs text-gray-400">Total Supply: {tokenInfo.totalSupply}</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokenDistribution.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-black/20 rounded-xl p-4 border border-slate-700/30 hover:border-green-500/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold">{item.percentage}%</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-base text-gray-200">{item.category}</p>
                      {item.lockup && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <FaLock className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.lockup}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <p className="text-sm text-gray-400 leading-relaxed">
                {tokenInfo.description}
              </p>
            </div>
          </div>
        )}
        
        {/* Roadmap Content */}
        {activeTab === 'roadmap' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
              Development Timeline
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-transparent hidden sm:block"></div>
              
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
                          ? 'bg-blue-500/30 border-2 border-blue-500 animate-pulse' 
                          : 'bg-purple-500/30 border-2 border-purple-500/50'
                      }`}>
                      {phase.status === 'completed' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>
                    
                    <div className={`p-4 rounded-xl border transition-all duration-300
                      ${phase.status === 'completed' 
                        ? 'bg-green-900/10 border-green-500/30 hover:border-green-500/50' 
                        : phase.status === 'in-progress'
                          ? 'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50 shadow-lg shadow-blue-500/10' 
                          : 'bg-slate-800/30 border-slate-700/30 hover:border-purple-500/30'
                      }`}>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg
                          ${phase.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400' 
                            : phase.status === 'in-progress'
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-purple-500/10 text-purple-400'
                          }`}>
                          <span className="text-sm font-medium">{phase.quarter}</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-200">
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
                                  ? 'bg-blue-400/50 group-hover/item:bg-blue-400' 
                                  : 'bg-purple-400/50 group-hover/item:bg-purple-400'
                              }`}></div>
                            <span className={`text-sm transition-colors
                              ${phase.status === 'completed' 
                                ? 'text-gray-300' 
                                : phase.status === 'in-progress'
                                  ? 'text-gray-300' 
                                  : 'text-gray-400 group-hover/item:text-gray-300'
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
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
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
                        <div className="absolute left-2 top-4 w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500/30 hidden sm:block"></div>
                        
                        <div className="p-3 bg-slate-800/20 rounded-lg border border-slate-700/20 hover:border-purple-500/20 transition-all duration-300">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="px-2 py-0.5 bg-purple-500/5 rounded text-xs font-medium text-purple-400/80">
                              {phase.quarter}
                            </div>
                            <h3 className="text-sm font-medium text-gray-300">
                              {phase.title}
                            </h3>
                            
                            {/* Expandable Items */}
                            <div className="w-full mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                              {phase.items.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-start gap-1.5 group/item"
                                >
                                  <div className="w-1 h-1 rounded-full bg-purple-400/30 mt-1.5 group-hover/item:bg-purple-400/60 transition-colors"></div>
                                  <span className="text-xs text-gray-400 group-hover/item:text-gray-300 transition-colors">
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
    </div>
  );
}; 