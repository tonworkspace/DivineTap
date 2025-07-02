import { FC, useState, useEffect } from 'react';
import { GiFrog, GiBasket, GiTrophy, GiCoins, } from 'react-icons/gi';
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
      icon: <GiFrog className="w-12 h-12 text-green-500" />,
      title: "Welcome to CroakKingdom!",
      description: "Join the most adorable mining adventure! Catch frogs, mine croaks, and build your digital pond empire. Every frog has unique mining powers!",
      emoji: "🐸"
    },
    {
      icon: <GiBasket className="w-12 h-12 text-yellow-500" />,
      title: "Harvest Your Croaks",
      description: "Your frogs work tirelessly to mine croaks! Harvest them regularly to earn rewards. Higher rarity frogs mine faster and have special abilities.",
      emoji: "🪙"
    },
    {
      icon: <GiTrophy className="w-12 h-12 text-purple-500" />,
      title: "Level Up & Upgrade",
      description: "Upgrade your frogs to increase their mining speed! Level up to unlock new abilities and earn more croaks. The stronger your frogs, the bigger your rewards!",
      emoji: "⭐"
    },
    {
      icon: <GiCoins className="w-12 h-12 text-blue-500" />,
      title: "Earn & Trade",
      description: "Convert your croaks to STK tokens, participate in token sales, and join our referral program. Build your web3 fortune in the most fun way possible!",
      emoji: "💎"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-sm">
      <div className="max-w-md w-full px-6">
        {loading ? (
          <div className="flex flex-col items-center">
            {/* Frog-themed loading animation */}
            <div className="relative">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <GiFrog size={48} className="text-green-500 animate-bounce" />
                </div>
                
                {/* Orbiting lily pads */}
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping"
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
                {user?.total_deposit === 0 ? 'Welcome to CroakKingdom!' : 'Welcome Back!'}
              </h2>
              <p className="text-green-300 text-lg">
                {user?.total_deposit === 0 
                  ? '🐸 Hopping into your new pond...'
                  : '🌿 Returning to your frog collection...'}
              </p>
              <div className="mt-4 text-sm text-green-200 animate-pulse">
                Preparing your mining adventure...
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleSkip}
              className="absolute -top-12 right-0 text-sm text-green-300 hover:text-white transition-colors bg-green-800/50 px-3 py-1 rounded-lg hover:bg-green-700/50"
            >
              Skip Tutorial
            </button>
            
            <div key={currentStep} className="text-center animate-fade-in">
              {/* Enhanced step display with frog theme */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 border-4 border-green-400/30 shadow-lg">
                  <div className="text-4xl mb-2">{steps[currentStep].emoji}</div>
                  {steps[currentStep].icon}
                </div>
                
                {/* Floating particles */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mt-6 mb-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {steps[currentStep].title}
              </h2>
              <p className="text-lg text-green-200 mb-8 leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Enhanced progress bar */}
              <div className="w-full h-2 bg-green-800/50 rounded-full mb-8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-green-400 scale-125'
                        : index < currentStep
                        ? 'bg-green-600'
                        : 'bg-green-800'
                    }`}
                  />
                ))}
              </div>

              {/* Enhanced navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                    currentStep === 0
                      ? 'opacity-0 pointer-events-none'
                      : 'text-green-300 hover:text-white bg-green-800/50 hover:bg-green-700/50 border border-green-600/50'
                  }`}
                >
                  ← Previous
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={handleSkip}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-xl hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg border-2 border-green-400 font-bold text-lg"
                  >
                    🐸 Start Mining!
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white rounded-xl hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg border-2 border-green-400 font-bold text-lg"
                  >
                    Next →
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