import React from 'react';

export type EnergyUpgradeType = {
  name: string;
  icon: string;
  maxLevel: number;
  getCost: (level: number) => number;
};

export type HardwareType = {
  [key: string]: {
    id: string;
    name: string;
    hashRate: number;
    powerUsage: number;
    cost: number;
    description: string;
    icon: string;
    maxCount: number;
    upgradeMultiplier: number;
  };
};

export type HardwareId = string;

export type BoosterType = {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  isPermanent: boolean;
};

interface StoreModalProps {
  onClose: () => void;
  points: number;
  ownedHardware: {[key in HardwareId]?: number};
  MINING_HARDWARE: HardwareType;
  activeHardware: HardwareId;
  setActiveHardware: (id: HardwareId) => void;
  purchaseHardware: (id: HardwareId) => void;
  formatNumber: (num: number) => string;
  ENERGY_UPGRADES: { [key: string]: EnergyUpgradeType };
  energyUpgrades: {[key: string]: number};
  purchaseEnergyUpgrade: (upgradeId: string) => void;
  BOOSTERS: { [key: string]: BoosterType };
  ownedBoosters: string[];
  purchaseBooster: (id: string) => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  onClose,
  points,
  ownedHardware,
  MINING_HARDWARE,
  activeHardware,
  setActiveHardware,
  purchaseHardware,
  formatNumber,
  ENERGY_UPGRADES,
  energyUpgrades,
  purchaseEnergyUpgrade,
  BOOSTERS,
  ownedBoosters,
  purchaseBooster
}) => {
  const [activeTab, setActiveTab] = React.useState<'hardware' | 'energy' | 'boosters'>('hardware');
  const [quantity, setQuantity] = React.useState(1);
  const hardwareList = Object.values(MINING_HARDWARE);
  const currentIndex = hardwareList.findIndex(h => h.id === activeHardware);
  const currentHardware = hardwareList[currentIndex];
  const ownedCount = ownedHardware[currentHardware.id] ?? 0;
  const scaledCost = currentHardware.cost * Math.pow(1.2, ownedCount) * quantity;
  const remainingSlots = currentHardware.maxCount - ownedCount;
  const canAfford = points >= scaledCost && quantity <= remainingSlots;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(quantity + delta, remainingSlots));
    setQuantity(newQuantity);
  };

  // Reset quantity when changing hardware
  React.useEffect(() => {
    setQuantity(1);
  }, [activeHardware]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50">
      <div className="max-w-xl mx-auto h-full flex flex-col px-4">
        {/* Header with Stats and Tabs */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">🔥</span>
              <span className="text-white font-medium">STK</span>
              <span className="px-2 py-1 bg-white/10 rounded text-sm">
                {formatNumber(points)}
              </span>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
          </div>

          {/* Updated Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'hardware' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              💻 Hardware
            </button>
            <button
              onClick={() => setActiveTab('energy')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'energy' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              ⚡ Energy
            </button>
            <button
              onClick={() => setActiveTab('boosters')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'boosters' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              🚀 Boosters
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'hardware' ? (
            // Hardware Section
            <div className="flex flex-col h-full">
              {/* Hardware Display */}
              <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
                {/* Navigation Arrows */}
                <button 
                  onClick={() => setActiveHardware(hardwareList[(currentIndex - 1 + hardwareList.length) % hardwareList.length].id)}
                  className="absolute left-0 text-white/60 hover:text-white text-4xl"
                >
                  ‹
                </button>
                
                {/* Hardware Info */}
                <div className="text-center">
                  <div className="w-64 h-64 mx-auto mb-8 relative">
                    <div className="text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      {currentHardware.icon}
                    </div>
                  </div>
                  
                  <div className="text-white/60 text-sm mb-4">
                    {currentHardware.description}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">
                        {formatNumber(currentHardware.hashRate)}
                      </div>
                      <div className="text-white/60 text-sm">Hash Rate (H/s)</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">
                        {currentHardware.powerUsage}
                      </div>
                      <div className="text-white/60 text-sm">Power Usage (W)</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveHardware(hardwareList[(currentIndex + 1) % hardwareList.length].id)}
                  className="absolute right-0 text-white/60 hover:text-white text-4xl"
                >
                  ›
                </button>
              </div>

              {/* Purchase Section */}
              <div className="py-8">
                {/* Quantity Selector */}
                <div className="mb-4">
                  <div className="text-white mb-2">Quantity</div>
                  <div className="flex items-center gap-4 justify-center">
                    <button 
                      onClick={() => handleQuantityChange(-1)}
                      className={`text-2xl ${quantity <= 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white'}`}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <div className="bg-white/5 px-8 py-2 rounded-lg text-white">
                      {quantity}
                    </div>
                    <button 
                      onClick={() => handleQuantityChange(1)}
                      className={`text-2xl ${quantity >= remainingSlots ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white'}`}
                      disabled={quantity >= remainingSlots}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Hardware Stats */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Owned</span>
                    <span className="text-white">{ownedCount} / {currentHardware.maxCount}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(ownedCount / currentHardware.maxCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Info Message */}
                <div className="text-white/60 text-sm text-center mb-6">
                  {!ownedBoosters.includes('multipleGPU') && 
                    "Without Multiple GPU booster, purchasing a new card will replace your previous one, and 50% of the cost will be refunded."}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => canAfford && purchaseHardware(currentHardware.id)}
                  className={`
                    w-full py-3 rounded-lg text-white font-medium transition-all
                    ${canAfford 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-white/10 cursor-not-allowed'}
                  `}
                >
                  {canAfford 
                    ? `Purchase for ${formatNumber(scaledCost)} STK` 
                    : quantity > remainingSlots 
                      ? `Max ${currentHardware.maxCount} allowed` 
                      : 'Insufficient STK'
                  }
                </button>
              </div>
            </div>
          ) : activeTab === 'energy' ? (
            // Energy Upgrades Section
            <div className="py-4 space-y-4">
              {Object.entries(ENERGY_UPGRADES).map(([id, upgrade]) => {
                const currentLevel = energyUpgrades[id] || 0;
                const cost = upgrade.getCost(currentLevel);
                const canAffordUpgrade = points >= cost && currentLevel < upgrade.maxLevel;

                return (
                  <div key={id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="text-3xl">{upgrade.icon}</div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{upgrade.name}</div>
                          <div className="text-sm text-white/60">
                            Level {currentLevel}/{upgrade.maxLevel}
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full mt-2">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(currentLevel / upgrade.maxLevel) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Purchase Button */}
                      <button
                        onClick={() => canAffordUpgrade && purchaseEnergyUpgrade(id)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                          ${canAffordUpgrade 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : 'bg-white/10 text-white/60 cursor-not-allowed'}
                        `}
                      >
                        {currentLevel >= upgrade.maxLevel 
                          ? 'Max Level' 
                          : `${formatNumber(cost)} STK`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Boosters Section
            <div className="py-4 space-y-6">
              {/* Permanent Boosters Section */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span>🚀</span>
                  <span>Permanent Boosters</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(BOOSTERS).map(([id, booster]) => {
                    const isOwned = ownedBoosters.includes(id);
                    const canAfford = points >= booster.cost;

                    return (
                      <div key={id} 
                        className={`
                          bg-white/5 rounded-lg p-4 transition-all duration-300
                          ${isOwned ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/20' : 'hover:bg-white/10'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon with glow effect */}
                          <div className={`
                            text-3xl p-2 rounded-lg
                            ${isOwned ? 'bg-green-500/10 shadow-lg shadow-green-500/20' : 'bg-white/5'}
                          `}>
                            {booster.icon}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-medium">{booster.name}</div>
                              {isOwned && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-white/60 mt-1">{booster.description}</div>
                          </div>

                          {/* Purchase Button */}
                          <button
                            onClick={() => !isOwned && canAfford && purchaseBooster(id)}
                            disabled={isOwned || !canAfford}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                              transition-all duration-300
                              ${isOwned 
                                ? 'bg-green-500 text-white cursor-default'
                                : canAfford
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                  : 'bg-white/10 text-white/60 cursor-not-allowed'}
                            `}
                          >
                            {isOwned 
                              ? '✓ Owned' 
                              : canAfford
                                ? `Purchase (${formatNumber(booster.cost)} STK)`
                                : `Need ${formatNumber(booster.cost)} STK`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Premium Section */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <span>⭐</span>
                  <span>Premium Features</span>
                </h3>
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl p-2 rounded-lg bg-yellow-500/10">⭐</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Mining Premium</div>
                      <div className="text-sm text-white/60 mt-1">
                        Boost your mining income by 15% and unlock exclusive features
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['15% More Income', '24/7 Support', 'Exclusive Upgrades'].map((feature, i) => (
                          <span key={i} className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium 
                        bg-gradient-to-r from-yellow-500 to-orange-500 
                        text-white hover:brightness-110 transition-all"
                    >
                      Coming Soon
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 