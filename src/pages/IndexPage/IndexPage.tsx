import { FC, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { OnboardingScreen } from './OnboardingScreen';
import { DivineMiningGame } from '@/components/DivineMiningGame';
import { DailyRewards } from '@/components/DailyRewards';
import { DivinePointsLeaderboard } from '@/components/DivinePointsLeaderboard';
import { TaskCenter } from '@/components/TaskCenter';
import { ReferralSystem } from '@/components/ReferralSystem';
// import { useTonAddress } from '@tonconnect/ui-react';
// import { isValidAddress } from '@/utility/address';
// import { Address } from '@ton/core';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import { GameProvider, useGameContext } from '@/contexts/GameContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  GiCrystalBall, 
  GiCrystalCluster,
  GiSpellBook,
  GiDiamonds
} from 'react-icons/gi';
import { BiHome } from 'react-icons/bi';
// Import gem sync test utilities for debugging
import '@/utils/gemSyncTest';


// interface GameState {
//   divinePoints: number;
//   pointsPerSecond: number;
//   totalEarned24h: number;
//   totalEarned7d: number;
//   upgradesPurchased: number;
//   minersActive: number;
//   isMining: boolean;
// }

// interface Upgrade {
//   id: string;
//   name: string;
//   level: number;
//   effect: string;
//   baseCost: number;
//   costMultiplier: number;
// }

// Header component that uses GameContext
const GameHeader: FC<{ user: any; currentTab: string }> = ({ user, currentTab }) => {
  const { gems } = useGameContext();
  
  return (
    <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 mb-2 shadow-[0_0_30px_rgba(0,255,255,0.1)] overflow-hidden game-card-frame">
      {/* Futuristic Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400 corner-accent"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400 corner-accent"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400 corner-accent"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400 corner-accent"></div>
      
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 rounded-xl transition-all duration-1000 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 animate-pulse"></div>
      
      {/* Single Line Content */}
      <div className="relative z-10 flex items-center justify-between space-x-2">
        {/* Status + Title */}
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          <span className="text-cyan-400 font-mono font-bold text-[10px] tracking-wider">MINING</span>
          <div className="w-px h-3 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="text-cyan-300 font-mono text-[9px] font-medium">
            {currentTab === 'zodiac' ? 'ACTIVE' : 'ONLINE'}
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="flex items-center space-x-3">
          {/* Gems */}
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-400 font-mono font-bold text-[9px] uppercase">💎</span>
            <span className="text-purple-300 font-mono font-bold text-sm">
              {gems >= 1000 ? `${(gems / 1000).toFixed(1)}K` : gems.toString()}
            </span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-3 bg-gradient-to-b from-transparent via-gray-500/50 to-transparent"></div>
        </div>
        
        {/* User Badge */}
        {user?.username && (
          <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-900/80 to-black/80 rounded-full px-1.5 py-0.5 border border-cyan-500/30 backdrop-blur-sm">
            <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-cyan-300 font-mono font-bold text-[10px] truncate max-w-[100px]">
              {user.username}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const IndexPage: FC = () => {
  const { user, isLoading, error } = useAuth();
  
  // Skip loading if user is already authenticated
  const shouldShowLoading = isLoading && !user;
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState('zodiac');
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  // const connectedAddressString = useTonAddress();
  
  // Add referral integration
  useReferralIntegration();
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setShowNetworkWarning(false);
    };
    
    const handleOffline = () => {
      setShowNetworkWarning(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // const connectedAddress = useMemo(() => {
  //   return isValidAddress(connectedAddressString)
  //     ? Address.parse(connectedAddressString)
  //     : null;
  // }, [connectedAddressString]);
  
  // Get theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'light':
        return {
          mainGradient: 'from-gray-100 via-gray-50 to-gray-200',
          energyFields: 'bg-cyan-200/20',
          energyFieldsDark: 'bg-cyan-400/15',
          energyFields2: 'bg-blue-300/15',
          energyFields2Dark: 'bg-blue-500/10',
          energyFields3: 'bg-purple-400/15',
          energyFields3Dark: 'bg-purple-600/10',
          energyFields4: 'bg-cyan-300/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/50',
          orbsDark: 'bg-cyan-500/45',
          particles: 'bg-cyan-500/40',
          particlesDark: 'bg-cyan-600/35',
          gridOverlay: 'from-cyan-200/10 via-transparent to-cyan-200/10',
          gridOverlayDark: 'from-cyan-500/6 via-transparent to-cyan-500/6',
          lightRays: 'from-transparent via-cyan-200/8 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-500/4 to-transparent',
          cornerGlows: 'bg-cyan-300/20',
          cornerGlowsDark: 'bg-cyan-500/15',
          cornerGlows2: 'bg-blue-400/20',
          cornerGlows2Dark: 'bg-blue-600/15',
          cornerGlows3: 'bg-purple-500/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-600/15',
          bottomNav: 'from-white/95 via-gray-50/90 to-white/95',
          bottomNavDark: 'from-gray-900/95 via-gray-800/90 to-gray-900/95',
          bottomBorder: 'border-cyan-300',
          bottomBorderDark: 'border-cyan-600',
          bottomShadow: 'shadow-[0_-4px_20px_0_rgba(0,255,255,0.15)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]'
        };
      case 'dark':
        return {
          mainGradient: 'from-black via-gray-900 to-black',
          energyFields: 'bg-cyan-500/20',
          energyFieldsDark: 'bg-cyan-600/15',
          energyFields2: 'bg-blue-600/15',
          energyFields2Dark: 'bg-blue-700/10',
          energyFields3: 'bg-purple-600/15',
          energyFields3Dark: 'bg-purple-700/10',
          energyFields4: 'bg-cyan-400/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/60',
          orbsDark: 'bg-cyan-500/55',
          particles: 'bg-cyan-400/50',
          particlesDark: 'bg-cyan-500/45',
          gridOverlay: 'from-cyan-500/8 via-transparent to-cyan-500/8',
          gridOverlayDark: 'from-cyan-600/5 via-transparent to-cyan-600/5',
          lightRays: 'from-transparent via-cyan-500/6 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-600/3 to-transparent',
          cornerGlows: 'bg-cyan-500/20',
          cornerGlowsDark: 'bg-cyan-600/15',
          cornerGlows2: 'bg-blue-600/20',
          cornerGlows2Dark: 'bg-blue-700/15',
          cornerGlows3: 'bg-purple-600/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-500/15',
          bottomNav: 'from-black/95 via-gray-900/90 to-black/95',
          bottomNavDark: 'from-black/95 via-gray-900/90 to-black/95',
          bottomBorder: 'border-cyan-500',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.25)]'
        };
      case 'auto':
        return {
          mainGradient: 'from-gray-900 via-black to-gray-900',
          energyFields: 'bg-cyan-400/20',
          energyFieldsDark: 'bg-cyan-500/15',
          energyFields2: 'bg-blue-500/15',
          energyFields2Dark: 'bg-blue-600/10',
          energyFields3: 'bg-purple-500/15',
          energyFields3Dark: 'bg-purple-600/10',
          energyFields4: 'bg-cyan-300/15',
          energyFields4Dark: 'bg-cyan-400/10',
          orbs: 'bg-cyan-400/55',
          orbsDark: 'bg-cyan-500/50',
          particles: 'bg-cyan-400/45',
          particlesDark: 'bg-cyan-500/40',
          gridOverlay: 'from-cyan-400/9 via-transparent to-cyan-400/9',
          gridOverlayDark: 'from-cyan-500/5.5 via-transparent to-cyan-500/5.5',
          lightRays: 'from-transparent via-cyan-400/7 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-500/3.5 to-transparent',
          cornerGlows: 'bg-cyan-400/20',
          cornerGlowsDark: 'bg-cyan-500/15',
          cornerGlows2: 'bg-blue-500/20',
          cornerGlows2Dark: 'bg-blue-600/15',
          cornerGlows3: 'bg-purple-500/20',
          cornerGlows3Dark: 'bg-purple-600/15',
          cornerGlows4: 'bg-cyan-300/20',
          cornerGlows4Dark: 'bg-cyan-400/15',
          bottomNav: 'from-gray-900/95 via-black/90 to-gray-900/95',
          bottomNavDark: 'from-gray-900/95 via-black/90 to-gray-900/95',
          bottomBorder: 'border-cyan-400',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.18)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.22)]'
        };
      default:
        return {
          mainGradient: 'from-black via-gray-900 to-black',
          energyFields: 'bg-cyan-500/20',
          energyFieldsDark: 'bg-cyan-600/15',
          energyFields2: 'bg-blue-600/15',
          energyFields2Dark: 'bg-blue-700/10',
          energyFields3: 'bg-purple-600/15',
          energyFields3Dark: 'bg-purple-700/10',
          energyFields4: 'bg-cyan-400/15',
          energyFields4Dark: 'bg-cyan-500/10',
          orbs: 'bg-cyan-400/60',
          orbsDark: 'bg-cyan-500/55',
          particles: 'bg-cyan-400/50',
          particlesDark: 'bg-cyan-500/45',
          gridOverlay: 'from-cyan-500/8 via-transparent to-cyan-500/8',
          gridOverlayDark: 'from-cyan-600/5 via-transparent to-cyan-600/5',
          lightRays: 'from-transparent via-cyan-500/6 to-transparent',
          lightRaysDark: 'from-transparent via-cyan-600/3 to-transparent',
          cornerGlows: 'bg-cyan-500/20',
          cornerGlowsDark: 'bg-cyan-600/15',
          cornerGlows2: 'bg-blue-600/20',
          cornerGlows2Dark: 'bg-blue-700/15',
          cornerGlows3: 'bg-purple-600/20',
          cornerGlows3Dark: 'bg-purple-700/15',
          cornerGlows4: 'bg-cyan-400/20',
          cornerGlows4Dark: 'bg-cyan-500/15',
          bottomNav: 'from-black/95 via-gray-900/90 to-black/95',
          bottomNavDark: 'from-black/95 via-gray-900/90 to-black/95',
          bottomBorder: 'border-cyan-500',
          bottomBorderDark: 'border-cyan-500',
          bottomShadow: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.2)]',
          bottomShadowDark: 'shadow-[0_-4px_16px_0_rgba(0,255,255,0.25)]'
        };
    }
  };

  const colors = getThemeColors();
  
  // Only show loading on initial load, not when switching tabs
  if (shouldShowLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-1000">
        {/* Futuristic Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
        </div>
        
        <div className="relative flex flex-col items-center space-y-6 z-10">
          {/* Futuristic Loading Animation */}
          <div className="relative">
            {/* Cyberpunk Core */}
            <div className="relative w-24 h-24">
              {/* Main Holographic Core */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 rounded-full shadow-[0_0_30px_rgba(0,255,255,0.5)] border-2 border-cyan-400 animate-pulse transition-all duration-1000">
                {/* Inner Core */}
                <div className="absolute inset-3 bg-gradient-to-br from-cyan-300 to-cyan-400 rounded-full animate-spin transition-all duration-1000" style={{ animationDuration: '3s' }}>
                  <div className="absolute inset-2 bg-gradient-to-br from-cyan-200 to-cyan-300 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                
                {/* Data Nodes */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full border border-cyan-600 flex items-center justify-center shadow-md transition-all duration-1000">
                  <div className="w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full border border-cyan-600 flex items-center justify-center shadow-md transition-all duration-1000">
                  <div className="w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
                
                {/* Holographic Aura */}
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-lg animate-pulse transition-all duration-1000"></div>
              </div>
              
              {/* Orbiting Data Particles */}
              {[...Array(16)].map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full shadow-md transition-all duration-1000"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 22.5}deg) translateX(50px)`,
                    animation: `cyberpunk-orbit ${4 + i * 0.2}s linear infinite`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            
            {/* Futuristic Energy Waves */}
            <div className="absolute inset-0 bg-cyan-400/15 rounded-full blur-xl animate-ping transition-all duration-1000" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 bg-cyan-300/10 rounded-full blur-2xl animate-ping transition-all duration-1000" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 bg-cyan-200/5 rounded-full blur-3xl animate-ping transition-all duration-1000" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
          </div>
          
          {/* Futuristic Loading Text */}
          <div className="text-center space-y-3">
            <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse transition-all duration-1000 tracking-wider">
              ⚡ CYBERPUNK REALM ⚡
            </div>
            <div className="text-sm text-cyan-300 font-mono font-medium transition-all duration-1000 tracking-wide">
              Initializing neural interface...
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce transition-all duration-1000" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Futuristic Loading Status */}
          <div className="text-center max-w-xs">
            <div className="text-xs text-cyan-300 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30 transition-all duration-1000">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-mono font-bold tracking-wider">SYSTEM STATUS: INITIALIZING</span>
              </div>
              <p className="text-gray-300 font-mono text-[10px] tracking-wide">
                🔮 <span className="font-medium">Cyber Tip:</span> Neural networks are processing...
              </p>
            </div>
          </div>
        </div>
        
        {/* Futuristic custom CSS animations */}
        <style>{`
          @keyframes cyberpunk-orbit {
            0% {
              transform: rotate(0deg) translateX(50px) translateY(-50%);
              opacity: 0.8;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) translateX(50px) translateY(-50%);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${colors.mainGradient} dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 transition-all duration-1000`}>
        <div className="text-center p-3">
          <p className="text-red-500 dark:text-red-400 text-sm transition-all duration-1000">{error}</p>
          <p className="mt-1 text-blue-600 dark:text-blue-400 text-xs transition-all duration-1000">Please open this app in Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GameProvider>
        <div className="w-full min-h-screen relative overflow-hidden">
          {/* Network Warning */}
          {showNetworkWarning && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-500 text-white p-3 text-center font-mono font-bold text-sm animate-pulse">
              ⚠️ NO INTERNET CONNECTION - Some features may be limited
            </div>
          )}
      {/* Futuristic Cyberpunk Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Main cyberpunk gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-1000" />
        
        {/* Futuristic energy fields */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-cyan-500/20 rounded-full opacity-60 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '8s' }} />
        <div className="absolute top-32 left-1/2 w-96 h-64 bg-blue-600/15 rounded-[60%] opacity-70 blur-3xl animate-pulse transition-all duration-1000" style={{ transform: 'translateX(-50%) rotate(-12deg)', animationDuration: '10s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-80 bg-purple-600/20 rounded-tl-[80%] rounded-tr-[60%] rounded-bl-[60%] rounded-br-[80%] opacity-80 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-20 left-20 w-60 h-48 bg-cyan-400/15 rounded-full opacity-50 blur-3xl animate-pulse transition-all duration-1000" style={{ animationDuration: '14s' }} />
        
        {/* Futuristic floating data nodes */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`node-${i}`}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping transition-all duration-1000"
            style={{
              top: `${15 + (i * 7)}%`,
              left: `${8 + (i * 8)}%`,
              animationDuration: `${2 + i * 0.3}s`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
        
        {/* Futuristic data particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full animate-ping transition-all duration-1000"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${1.5 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Futuristic cyberpunk grid overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Futuristic scan lines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse transition-all duration-1000" style={{ animationDuration: '4s' }} />
        
        {/* Futuristic corner energy fields */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-br-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-bl-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/20 rounded-tr-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400/20 rounded-tl-full blur-2xl animate-pulse transition-all duration-1000" style={{ animationDuration: '9s' }} />
        
        {/* Futuristic circuit patterns */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Futuristic holographic interference */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/2 to-transparent animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/2 to-transparent animate-pulse" style={{ animationDuration: '12s' }} />
      </div>
      
      <div className="relative z-10">
        {!isLoading && user && <OnboardingScreen />}

                 {/* Enhanced Cyberpunk Main Content Area */}
         <div className="flex-1 pb-20 px-4 pt-4 max-w-md mx-auto">
           
           {/* Ultra-Compact Cyberpunk Stats Header */}
           <GameHeader user={user} currentTab={currentTab} />


          {currentTab === 'zodiac' && <DivineMiningGame />}
          {currentTab === 'daily' && <DailyRewards />}
          {currentTab === 'divine' && <DivinePointsLeaderboard />}

          {currentTab === 'crystals' && (
            <div className="flex-1 overflow-y-auto">
              <TaskCenter/>
            </div>
          )}

          {currentTab === 'spells' && (
            <div className="flex-1 overflow-y-auto">
              <ReferralSystem />
            </div>
          )}

        </div>

                 {/* Enhanced Cyberpunk Bottom Navigation */}
         <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/98 via-gray-900/95 to-black/98 backdrop-blur-2xl border-t border-cyan-500/40 safe-area-pb z-40 shadow-[0_-8px_32px_0_rgba(0,255,255,0.15)] transition-all duration-300 overflow-hidden">
           {/* Enhanced Top Border with Animation */}
           <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
           
           {/* Holographic Scan Effect */}
           <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/2 via-transparent to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
           
           <div className="max-w-lg mx-auto px-3 py-3 relative">
             <div className="grid grid-cols-5 items-center gap-2">
               {[
                 { id: 'zodiac', text: 'Play', Icon: BiHome, color: 'cyan' },
                 { id: 'daily', text: 'Rewards', Icon: GiCrystalBall, color: 'purple' },
                 { id: 'divine', text: 'Divine', Icon: GiDiamonds, color: 'yellow' },
                 { id: 'crystals', text: 'Tasks', Icon: GiCrystalCluster, color: 'green' },
                 { id: 'spells', text: 'Friends', Icon: GiSpellBook, color: 'pink' }, 
               ].map(({ id, text, Icon, color }) => {
                 const isActive = currentTab === id;
                 
                 const getColorClasses = (colorName: string, active: boolean) => {
                   const colors = {
                     cyan: {
                       bg: active ? 'from-cyan-500/80 to-cyan-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-cyan-400/60' : 'border-gray-600/40',
                       text: active ? 'text-cyan-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(6,182,212,0.4)]' : '',
                       hover: 'group-hover:from-cyan-600/60 group-hover:to-cyan-700/40 group-hover:border-cyan-500/50'
                     },
                     purple: {
                       bg: active ? 'from-purple-500/80 to-purple-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-purple-400/60' : 'border-gray-600/40',
                       text: active ? 'text-purple-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(147,51,234,0.4)]' : '',
                       hover: 'group-hover:from-purple-600/60 group-hover:to-purple-700/40 group-hover:border-purple-500/50'
                     },
                     yellow: {
                       bg: active ? 'from-yellow-500/80 to-yellow-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-yellow-400/60' : 'border-gray-600/40',
                       text: active ? 'text-yellow-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' : '',
                       hover: 'group-hover:from-yellow-600/60 group-hover:to-yellow-700/40 group-hover:border-yellow-500/50'
                     },
                     green: {
                       bg: active ? 'from-emerald-500/80 to-emerald-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-emerald-400/60' : 'border-gray-600/40',
                       text: active ? 'text-emerald-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' : '',
                       hover: 'group-hover:from-emerald-600/60 group-hover:to-emerald-700/40 group-hover:border-emerald-500/50'
                     },
                     pink: {
                       bg: active ? 'from-pink-500/80 to-pink-600/60' : 'from-gray-700/80 to-gray-800/60',
                       border: active ? 'border-pink-400/60' : 'border-gray-600/40',
                       text: active ? 'text-pink-300' : 'text-gray-400',
                       glow: active ? 'shadow-[0_0_20px_rgba(236,72,153,0.4)]' : '',
                       hover: 'group-hover:from-pink-600/60 group-hover:to-pink-700/40 group-hover:border-pink-500/50'
                     }
                   };
                   return colors[colorName as keyof typeof colors];
                 };
                 
                 const colorClasses = getColorClasses(color, isActive);
                 
                 return (
                   <button 
                     key={id} 
                     aria-label={text}
                     onClick={() => setCurrentTab(id)}
                     className={`
                       group relative flex flex-col items-center py-2 px-1 w-full transition-all duration-300 rounded-xl
                       ${isActive ? 'scale-105' : 'hover:scale-102'}
                     `}
                   >
                     {/* Enhanced Icon Container */}
                     <div className={`
                       relative flex items-center justify-center rounded-xl transition-all duration-300 mb-1.5 border-2
                       bg-gradient-to-br ${colorClasses.bg} ${colorClasses.border} ${colorClasses.glow} ${colorClasses.hover}
                     `}
                       style={{
                         width: 40,
                         height: 40,
                       }}
                     >
                       {/* Enhanced Glow Effect */}
                       {isActive && (
                         <>
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl animate-pulse" style={{ animationDuration: '2s' }}></div>
                           <div className="absolute -inset-1 bg-gradient-to-br from-current/20 to-transparent rounded-xl blur-sm animate-pulse" style={{ animationDuration: '3s' }}></div>
                         </>
                       )}
                       
                       {/* Floating Particles for Active Tab */}
                       {isActive && (
                         <>
                           <div className="absolute top-0 right-0 w-1 h-1 bg-current rounded-full animate-ping opacity-60"></div>
                           <div className="absolute bottom-0 left-0 w-1 h-1 bg-current rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
                         </>
                       )}
                       
                       <Icon 
                         size={18} 
                         className={`
                           relative z-10 transition-all duration-300
                           ${isActive 
                             ? 'text-white filter drop-shadow-[0_0_8px_currentColor]' 
                             : 'text-gray-300 group-hover:text-white group-hover:drop-shadow-[0_0_4px_currentColor]'
                           }
                         `} 
                       />
                     </div>
                     
                     {/* Enhanced Text */}
                     <span className={`
                       text-[9px] font-mono font-bold tracking-wider truncate max-w-[55px] text-center transition-all duration-300 uppercase
                       ${colorClasses.text} group-hover:text-gray-300
                       ${isActive ? 'filter drop-shadow-[0_0_4px_currentColor]' : ''}
                     `}>
                       {text}
                     </span>
                     
                     {/* Enhanced Active Indicator */}
                     {isActive && (
                       <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-current rounded-full animate-pulse"></div>
                     )}
                   </button>
                 );
               })}
             </div>
           </div>
           
           {/* Enhanced Bottom Effects */}
           <div className="absolute bottom-0 left-0 right-0">
             <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
             <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
           </div>
         </div>
               </div>
      </div>
        </GameProvider>
      </ErrorBoundary>
    );
  };


