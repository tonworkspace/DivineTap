import { FC, useMemo, useState } from 'react';
import { FaUsers, FaStore } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingScreen } from './OnboardingScreen';
import { BsNewspaper } from 'react-icons/bs';
import { ShoutboxHeader } from '@/components/ShoutboxHeader/ShoutboxHeader';
import { GiFrog } from 'react-icons/gi';
import { PiCubeTransparentFill } from 'react-icons/pi';
import { FrogsMiner } from '@/components/FrogsMiner';
import SmartStore from '@/components/SmartStore';
// import TonWallet from '@/components/TonWallet';
// import { NFTGallery } from '@/components/NFTGallery';
import { NFTList } from '@/components/NFTList';
import { useTonAddress } from '@tonconnect/ui-react';
import { isValidAddress } from '@/utility/address';
import { Address } from '@ton/core';
import ReferralSystem from '@/components/ReferralSystem';
import TaskCenter from '@/components/TaskCenter';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';

export const IndexPage: FC = () => {
  const [currentTab, setCurrentTab] = useState('frogs');
  const { user, isLoading, error } = useAuth();
  const connectedAddressString = useTonAddress();
  
  // Add referral integration
  useReferralIntegration();
  
  const connectedAddress = useMemo(() => {
    return isValidAddress(connectedAddressString)
      ? Address.parse(connectedAddressString)
      : null;
  }, [connectedAddressString]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 via-green-50 to-white">
        <div className="relative flex flex-col items-center space-y-8">
          {/* Cartoonish Frog Loading Animation */}
          <div className="relative">
            {/* Main Frog Character */}
            <div className="relative w-32 h-32">
              {/* Frog Body */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg border-4 border-green-300 animate-bounce">
                {/* Frog Eyes */}
                <div className="absolute top-6 left-6 w-8 h-8 bg-white rounded-full border-2 border-green-700 flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-800 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute top-6 right-6 w-8 h-8 bg-white rounded-full border-2 border-green-700 flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-800 rounded-full animate-pulse"></div>
                </div>
                
                {/* Frog Mouth */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-green-700 rounded-full"></div>
                
                {/* Frog Nose */}
              </div>
              
              {/* Frog Legs */}
               <div className="absolute -bottom-2 left-2 w-6 h-8 bg-green-500 rounded-full border-2 border-green-300"></div>
              <div className="absolute -bottom-2 right-2 w-6 h-8 bg-green-500 rounded-full border-2 border-green-300"></div>
              <div className="absolute bottom-4 -left-1 w-4 h-6 bg-green-500 rounded-full border-2 border-green-300"></div>
              <div className="absolute bottom-4 -right-1 w-4 h-6 bg-green-500 rounded-full border-2 border-green-300"></div>
            </div>
            
            {/* Orbiting Lily Pads */}
           
            
            {/* Floating Bubbles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`bubble-${i}`}
                className="absolute w-3 h-3 bg-white/80 rounded-full border border-green-200"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 60}deg) translateX(40px)`,
                  animation: `bubble-float ${2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-green-800 animate-pulse">
              🐸 Croak Kingdom
            </div>
            <div className="text-green-600 font-medium">
              Loading your frog adventure...
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Fun Loading Tips */}
          <div className="text-center max-w-sm">
            <div className="text-sm text-green-700 bg-green-100/50 rounded-lg p-3 border border-green-200">
              💡 <span className="font-medium">Tip:</span> Each frog mines points automatically while you're away!
            </div>
          </div>
        </div>
        
        {/* Add custom CSS animations */}
        <style>{`
          @keyframes lily-orbit {
            0% {
              transform: rotate(0deg) translateX(60px) translateY(-50%);
            }
            100% {
              transform: rotate(360deg) translateX(60px) translateY(-50%);
            }
          }
          
          @keyframes bubble-float {
            0%, 100% {
              transform: rotate(var(--rotation)) translateX(40px) translateY(0px);
              opacity: 0.6;
            }
            50% {
              transform: rotate(var(--rotation)) translateX(45px) translateY(-10px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F] text-white">
        <div className="text-center p-4">
          <p className="text-red-500">{error}</p>
          <p className="mt-2">Please open this app in Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Cartoonish Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Main playful gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-300 via-green-200 to-blue-200" />
        {/* Cartoon blobs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-green-400 rounded-full opacity-70 blur-2xl" />
        <div className="absolute top-24 left-1/2 w-80 h-56 bg-yellow-200 rounded-[60%] opacity-80 blur-2xl" style={{ transform: 'translateX(-50%) rotate(-12deg)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-64 bg-green-200 rounded-tl-[80%] rounded-tr-[60%] rounded-bl-[60%] rounded-br-[80%] opacity-80 blur-2xl" />
        <div className="absolute bottom-10 left-10 w-40 h-32 bg-blue-200 rounded-full opacity-60 blur-2xl" />
        {/* Optional: cartoon clouds */}
        <div className="absolute top-10 right-10 w-32 h-16 bg-white rounded-full opacity-70 blur-md" />
        <div className="absolute top-20 right-24 w-24 h-10 bg-white rounded-full opacity-60 blur-md" />
      </div>
      <div className="relative z-10">
        {!isLoading && user && <OnboardingScreen />}
        {/* Network Status Bar */}
        <ShoutboxHeader onTabChange={setCurrentTab} />

        {/* Main Content Area */}
        <div className="flex-1">
          {currentTab === 'frogs' && (
            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
              <FrogsMiner />
            </div>
          )}

          {currentTab === 'nfts' && (
            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
              {connectedAddress ? (
                <NFTList address={connectedAddress} />
              ) : (
                <div className="text-center py-8 text-black">Please connect your wallet to view NFTs</div>
              )}
            </div>
          )}

{currentTab === 'tasks' && (
            <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
            <TaskCenter />
            </div>
          )}


{currentTab === 'shop' && (
            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
              <SmartStore />
            </div>
          )}
          

          {currentTab === 'friends' && (
            <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
            <ReferralSystem />
            </div>
          )}

        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#eaffea] backdrop-blur-xl border-t-4 border-green-300/60 safe-area-pb z-40 shadow-[0_-4px_24px_0_rgba(34,197,94,0.15)]">
          <div className="max-w-lg mx-auto px-2 md:px-4">
            <div className="grid grid-cols-5 items-center gap-1">
              {[
                { id: 'shop', text: 'Shop', Icon: FaStore },
                { id: 'frogs', text: 'Frogs', Icon: GiFrog },
                { id: 'tasks', text: 'Tasks', Icon: BsNewspaper }, 
                { id: 'nfts', text: 'NFTs', Icon: PiCubeTransparentFill },
                { id: 'friends', text: 'Friends', Icon: FaUsers }, 
              ].map(({ id, text, Icon }) => {
                const isActive = currentTab === id;
                return (
                  <button 
                    key={id} 
                    aria-label={text}
                    onClick={() => setCurrentTab(id)}
                    className={`
                      flex flex-col items-center py-2 md:py-3 w-full transition-all duration-300
                      font-cartoon
                      ${isActive 
                        ? 'text-green-700 drop-shadow-[0_2px_6px_rgba(34,197,94,0.5)]'
                        : 'text-green-400'
                      }
                    `}
                    style={{
                      position: 'relative',
                    }}
                  >
                    <span
                      className={`
                        flex items-center justify-center rounded-full transition-all duration-300
                        ${isActive 
                          ? 'bg-green-200 shadow-lg scale-110 border-2 border-green-400'
                          : 'bg-green-100'
                        }
                      `}
                      style={{
                        width: 44,
                        height: 44,
                        marginBottom: 2,
                        boxShadow: isActive ? '0 4px 16px 0 rgba(34,197,94,0.25)' : undefined,
                      }}
                    >
                      <Icon size={25} className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.10)]" />
                    </span>
                    <span className="text-[15px] md:text-sm font-bold tracking-wide truncate max-w-[64px] text-center mt-1"
                      style={{
                        fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
                        letterSpacing: '0.5px',
                        textShadow: isActive ? '0 1px 0 #eaffea, 0 2px 2px #bbf7d0' : '0 1px 0 #eaffea',
                      }}
                    >
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


