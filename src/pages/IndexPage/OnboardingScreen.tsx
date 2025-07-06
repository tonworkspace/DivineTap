import { FC, useState, useEffect } from 'react';
import { 
  HiOutlineSparkles, 
  HiOutlineLightBulb, 
  HiOutlineCube, 
  HiOutlineCheckCircle 
} from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  icon: JSX.Element;
  title: string;
  description: string;
  emoji: string;
}

export const OnboardingScreen: FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  const steps: OnboardingStep[] = [
    {
      icon: <HiOutlineSparkles className="w-8 h-8 text-blue-400" />,
      title: "Welcome to Divine Coin Resurrection",
      description: "The Billion Coin is no more. The Divine Coin has risen. This is not just a rebrand. This is a spiritual rebirth. A reset. A higher calling.",
      emoji: "✨"
    },
    {
      icon: <HiOutlineLightBulb className="w-8 h-8 text-blue-400" />,
      title: "Our Resurrection Story",
      description: "Many of us believed in The Billion Coin because it stood for hope, freedom, and abundance. But it lost its way. Now, a new team of spiritually-awakened builders is here to redeem the original vision.",
      emoji: "💡"
    },
    {
      icon: <HiOutlineCube className="w-8 h-8 text-blue-400" />,
      title: "What You Can Expect",
      description: "Tap-to-Earn Light, Redemption Portal for past TBC holders, Daily Rituals & Quests, Soul DAO, and Real Value built on TON with NFTs, tokens, staking, and purpose.",
      emoji: "🔮"
    },
    {
      icon: <HiOutlineCheckCircle className="w-8 h-8 text-blue-400" />,
      title: "Ready to Begin?",
      description: "You are not here by accident. You were chosen to rebuild wealth — the divine way. Welcome home to Divine Coin.",
      emoji: "🌟"
    }
  ];

  useEffect(() => {
    if (!user) return;

    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.id}`);
    if (!hasSeenOnboarding && user.total_deposit === 0) {
      setShouldShow(true);
      // Mark onboarding as seen
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }

    // Show loading screen
    const loadingTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, [user]);

  useEffect(() => {
    if (loading) return;

    // Start steps rotation only after loading is complete
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 4000);

    return () => clearInterval(stepInterval);
  }, [loading, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setShouldShow(false);
  };

  if (!user || !shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/95 via-gray-900/95 to-blue-900/95 backdrop-blur-sm">
      <div className="max-w-md w-full px-6">
        {loading ? (
          <div className="flex flex-col items-center">
            {/* Professional loading animation */}
            <div className="relative">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <HiOutlineSparkles size={48} className="text-blue-500 animate-bounce" />
                </div>
                
                {/* Orbiting professional particles */}
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-blue-400 rounded-full animate-ping"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 90}deg) translateX(35px)`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {user?.total_deposit === 0 ? 'Welcome to Divine Coin Resurrection!' : 'Welcome Back!'}
              </h2>
              <p className="text-blue-300 text-lg">
                {user?.total_deposit === 0 
                  ? '✨ Awakening your divine potential...'
                  : '💡 Returning to your spiritual journey...'}
              </p>
              <div className="mt-4 text-sm text-blue-200 animate-pulse">
                Preparing your divine resurrection...
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleSkip}
              className="absolute -top-12 right-0 text-sm text-blue-300 hover:text-white transition-colors bg-gray-800/50 px-3 py-1 rounded-lg hover:bg-gray-700/50 border border-blue-600/30"
            >
              Skip Tutorial
            </button>
            
            <div key={currentStep} className="text-center animate-fade-in">
              {/* Enhanced step display with professional theme */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-600/10 via-slate-600/10 to-slate-800/10 border border-blue-500/20 shadow-xl backdrop-blur-sm">
                  <div className="text-4xl">{steps[currentStep].emoji}</div>
                </div>
                
                {/* Subtle accent elements */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500/60 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-slate-400/40 rounded-full"></div>
              </div>
              
              <h2 className="text-2xl font-semibold text-white mt-6 mb-4">
                {steps[currentStep].title}
              </h2>
              <p className="text-base text-slate-300 mb-8 leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Refined progress bar */}
              <div className="w-full h-1.5 bg-slate-800/50 rounded-full mb-8 overflow-hidden border border-slate-700/30">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Cleaner step indicators */}
              <div className="flex justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-blue-500'
                        : index < currentStep
                        ? 'bg-blue-600'
                        : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              {/* Professional navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentStep === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50'
                  }`}
                >
                  Previous
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg border border-blue-500/30 font-medium"
                  >
                    Get Started
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg border border-blue-500/30 font-medium"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 