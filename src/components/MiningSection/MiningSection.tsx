import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { StoreModal } from '../StoreModal/StoreModal';
import { LotteryCard } from '../LotteryCard/LotteryCard';

const ENERGY_PER_MINING_ATTEMPT = 5; // Reduced from 10

// Add default constants
const DEFAULT_MAX_ENERGY = 1000;
const DEFAULT_ENERGY_REGEN_RATE = 2;

export const MiningSection = () => {
  const { user } = useAuth();

  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(DEFAULT_MAX_ENERGY);
  const [lastClickTime, setLastClickTime] = useState(Date.now());

  // Add new state variables
  const [hashRate, setHashRate] = useState(0);         // Current mining speed in H/s
  const [difficulty,] = useState(1000);  // Mining difficulty
  const [minedBlocks, setMinedBlocks] = useState(0);   // Successfully mined blocks

  // Mining simulation constants
  const BLOCK_REWARD = 10;  // Increase if you want more points per block
  const TARGET_BLOCK_TIME = 1000; // Reduce to 1 second for more frequent rewards

  // Add mining status state
  const [isMining, setIsMining] = useState(false);

  // Add new state variables at the top
  const [isPremium, ] = useState(false);
  const [premiumMultiplier, ] = useState(1);
  const [premiumLevel, setPremiumLevel] = useState(0);

  // Add new state variables for mining hardware
  const [ownedHardware, setOwnedHardware] = useState<{[key in HardwareId]?: number}>({});
  const [baseHashRate, setBaseHashRate] = useState(1);
  const [showStore, setShowStore] = useState(false);

  // Define mining hardware options with increased power usage
  const MINING_HARDWARE = {
    basic_gpu: {
      id: 'basic_gpu',
      name: 'Basic GPU',
      hashRate: 10,
      powerUsage: 20, // Increased from 2
      cost: 500,
      description: 'Entry level mining GPU',
      icon: '💻',
      maxCount: 10,
      upgradeMultiplier: 1.5
    },
    advanced_gpu: {
      id: 'advanced_gpu',
      name: 'Advanced GPU',
      hashRate: 30,
      powerUsage: 40, // Increased from 4
      cost: 1500,
      description: 'High-performance gaming GPU',
      icon: '🖥️',
      maxCount: 8,
      upgradeMultiplier: 1.8
    },
    mining_rig: {
      id: 'mining_rig',
      name: 'Mining Rig',
      hashRate: 100,
      powerUsage: 100, // Increased from 10
      cost: 5000,
      description: 'Professional mining setup',
      icon: '⚡',
      maxCount: 5,
      upgradeMultiplier: 2.0
    },
    asic_miner: {
      id: 'asic_miner',
      name: 'ASIC Miner',
      hashRate: 500,
      powerUsage: 200, // Increased from 20
      cost: 15000,
      description: 'Specialized mining hardware',
      icon: '🔋',
      maxCount: 3,
      upgradeMultiplier: 2.5
    }
  };

  // Add this type definition
  type HardwareType = typeof MINING_HARDWARE;
  type HardwareId = keyof HardwareType;

  // Add new state variables for monitoring
  const [miningStats, setMiningStats] = useState({
    attempts: 0,
    successes: 0,
    averageHashRate: 0,
    startTime: Date.now(),
    actualBlockTime: 0,
    energyUsed: 0,
    profitPerHour: 0
  });

  const [showDebug, setShowDebug] = useState(false);

  // Add new state variables at the top with other states
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const COOLDOWN_DURATION = 4 * 60 * 1000; // 4 minutes in milliseconds
  const COOLDOWN_MINING_RATE = 0.2; // 20% mining rate during cooldown
  const COOLDOWN_BLOCK_REWARD = BLOCK_REWARD * 0.1; // 10% of normal reward

  // Add new state variables for energy upgrades
  const [maxEnergy, setMaxEnergy] = useState(DEFAULT_MAX_ENERGY);
  const [energyRegenRate, setEnergyRegenRate] = useState(DEFAULT_ENERGY_REGEN_RATE);

  // Add energy upgrade configurations
  const ENERGY_UPGRADES = {
    capacity: {
      id: 'capacity',
      name: 'Energy Capacity',
      baseIncrease: 500,
      baseCost: 2000,
      maxLevel: 10,
      icon: '⚡',
      description: 'Increase maximum energy storage',
      getCurrentStats: (level: number) => ({
        current: 1000 + (level * 500),
        next: level < 10 ? 1000 + ((level + 1) * 500) : null
      }),
      getCost: (level: number) => Math.floor(2000 * Math.pow(1.5, level))
    },
    regeneration: {
      id: 'regeneration',
      name: 'Energy Regeneration',
      baseIncrease: 1,
      baseCost: 1500,
      maxLevel: 10,
      icon: '🔋',
      description: 'Improve energy regeneration rate',
      getCurrentStats: (level: number) => ({
        current: 2 + (level * 1),
        next: level < 10 ? 2 + ((level + 1) * 1) : null
      }),
      getCost: (level: number) => Math.floor(1500 * Math.pow(1.5, level))
    }
  };

  // Add state for upgrade levels
  const [energyUpgrades, setEnergyUpgrades] = useState<{[key: string]: number}>({
    capacity: 0,
    regeneration: 0
  });

  // Replace the constant with state

  // Add new types for particles
  type Particle = {
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    color: string;
  };

  // Add new animation states
  const [particles, setParticles] = useState<Particle[]>([]);
  const [miningPulse, setMiningPulse] = useState(false);

  // Add particle colors based on mining state
  const PARTICLE_COLORS = ['#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'];
  const SUCCESS_COLORS = ['#34D399', '#10B981', '#059669', '#047857'];
  const PREMIUM_COLORS = ['#FBBF24', '#F59E0B', '#D97706', '#B45309'];

  // Add new state variables
  const [miningStartTime, setMiningStartTime] = useState<number | null>(null);

  // Enhanced boost system constants
  const BOOST_TYPES = {
    SPEED: {
      id: 'speed',
      name: 'Speed Boost',
      multiplier: 2.0,
      duration: 10000, // 10 seconds
      cooldown: 30000, // 30 seconds
      energyCost: 100,
      icon: '⚡',
      color: 'yellow-400'
    },
    POWER: {
      id: 'power',
      name: 'Power Boost',
      multiplier: 3.0,
      duration: 5000, // 5 seconds
      cooldown: 45000, // 45 seconds
      energyCost: 200,
      icon: '💪',
      color: 'red-400'
    },
    EFFICIENCY: {
      id: 'efficiency',
      name: 'Efficiency Boost',
      multiplier: 1.5,
      duration: 15000, // 15 seconds
      cooldown: 20000, // 20 seconds
      energyCost: 50,
      icon: '♻️',
      color: 'green-400'
    }
  };

  // Add new state variables
  const [activeBoost, setActiveBoost] = useState<keyof typeof BOOST_TYPES | null>(null);
  const [boostCooldowns, setBoostCooldowns] = useState<Record<string, number>>({});
  const [selectedBoost, setSelectedBoost] = useState<keyof typeof BOOST_TYPES>('SPEED');

  // Add new state variables at the top with other states
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const CLAIM_COOLDOWN = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  // Add state for cooldown upgrades
  const [cooldownUpgrades, setCooldownUpgrades] = useState<{[key: string]: number}>({
    duration: 0,
    efficiency: 0
  });

  // Add new state for carousel
  const [activeHardware, setActiveHardware] = useState<HardwareId>('basic_gpu');
  // const [showDetails, setShowDetails] = useState(false);

  // Add new state for energy efficiency (move this up with other state declarations)
  const [energyEfficiency, setEnergyEfficiency] = useState(1);

  // Add new state variables at the top with other states
  const [autoMining, setAutoMining] = useState(false);

  // Add particle generation function
  const generateParticle = useCallback((success: boolean = false) => {
    return {
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: 1,
      color: success 
        ? SUCCESS_COLORS[Math.floor(Math.random() * SUCCESS_COLORS.length)]
        : isPremium 
          ? PREMIUM_COLORS[Math.floor(Math.random() * PREMIUM_COLORS.length)]
          : PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    };
  }, [isPremium]);

  // Add particle animation effect
  useEffect(() => {
    if (!isMining) {
      setParticles([]);
      return;
    }

    const particleInterval = setInterval(() => {
      setParticles(prev => {
        // Remove old particles
        const filtered = prev.filter(p => p.opacity > 0);
        
        // Add new particles
        const newParticles = [...filtered];
        if (newParticles.length < 20) {
          newParticles.push(generateParticle());
        }

        // Update existing particles
        return newParticles.map(p => ({
          ...p,
          y: p.y - p.speed,
          opacity: p.opacity - 0.02
        }));
      });
    }, 50);

    return () => clearInterval(particleInterval);
  }, [isMining, generateParticle]);

  // Add success animation when mining block
  const handleMiningSuccess = useCallback(() => {
    setMiningPulse(true);
    setTimeout(() => setMiningPulse(false), 300);

    // Add success particles
    setParticles(prev => [
      ...prev,
      ...Array(10).fill(null).map(() => generateParticle(true))
    ]);
  }, [generateParticle]);
 
  // Modify the mining interval effect
  useEffect(() => {
    if (!isMining) return;

    const mineInterval = setInterval(async () => {
      // Calculate boost multiplier
      const boostMultiplier = activeBoost ? BOOST_TYPES[activeBoost].multiplier : 1;
      
      // Apply boost to mining calculations
      const totalPowerUsage = Object.entries(ownedHardware).reduce((total, [id, count]) => {
        const basePowerUsage = MINING_HARDWARE[id as HardwareId].powerUsage * (count || 0);
        return total + calculateEnergyConsumption(basePowerUsage);
      }, calculateEnergyConsumption(ENERGY_PER_MINING_ATTEMPT));

      // Stop mining if not enough energy and trigger cooldown
      if (energy - totalPowerUsage < 0) {
        setIsMining(false);
        setIsInCooldown(true);
        setCooldownEndTime(Date.now() + COOLDOWN_DURATION);
        return;
      }

      // Update mining statistics and consume energy
      setMiningStats(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        energyUsed: prev.energyUsed + totalPowerUsage
      }));

      // Consume energy for all active hardware
      setEnergy(prev => Math.max(0, prev - totalPowerUsage));

      const block = await mineBlock();
      if (block) {
        handleMiningSuccess();
        const reward = BLOCK_REWARD * premiumMultiplier * boostMultiplier;
        setPoints(prev => prev + reward);
        setMinedBlocks(prev => prev + 1);
        
        setMiningStats(prev => ({
          ...prev,
          successes: prev.successes + 1,
          actualBlockTime: (Date.now() - prev.startTime) / prev.successes,
          profitPerHour: (prev.successes * BLOCK_REWARD * 3600000) / (Date.now() - prev.startTime)
        }));
      }
    }, 50);

    return () => clearInterval(mineInterval);
  }, [isMining, energy, difficulty, premiumMultiplier, ownedHardware, energyEfficiency, activeBoost]);

  // Add mining helper functions
  const mineBlock = async () => {
    const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    const data = `block_${minedBlocks}_${nonce}`;
    
    // Simplify the difficulty check to make successful mining more frequent
    // Now there's a 10% chance to mine a block each attempt
    return Math.random() < 0.1 ? data : null;
  };


  // Add useEffect for continuous hash rate calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const currentHashRate = calculateHashRate();
      setHashRate(currentHashRate);
    }, 1000);

    return () => clearInterval(interval);
  }, [minedBlocks, difficulty]);

  const calculateHashRate = () => {
    // Simple hash rate calculation based on blocks mined
    return (minedBlocks * 1000) / (Date.now() - lastClickTime);
  };

  // Modify cooldown timer effect to enable mining after energy restoration
  useEffect(() => {
    if (!isInCooldown || !cooldownEndTime) return;

    const cooldownInterval = setInterval(() => {
        const now = Date.now();
        const timeRemaining = cooldownEndTime - now;
        
        if (timeRemaining <= 0) {
            // Reset states and enable mining
            setIsInCooldown(false);
            setCooldownEndTime(null);
            setEnergy(maxEnergy);
            
            // Enable mining automatically if they had it on before
            if (autoMining) {
                setIsMining(true);
            }
            
            showSnackbar({
                message: 'Cooldown Complete',
                description: 'Energy fully restored! Ready to mine again.'
            });
            
            // Save state after cooldown ends
            saveMiningState();
        } else {
            // Calculate energy restoration progress
            const progress = 1 - (timeRemaining / COOLDOWN_DURATION);
            const targetEnergy = Math.floor(maxEnergy * progress);
            setEnergy(targetEnergy);

            // Continue passive mining during cooldown
            if (Math.random() < COOLDOWN_MINING_RATE) {
                const cooldownReward = COOLDOWN_BLOCK_REWARD * premiumMultiplier;
                setPoints(prev => prev + cooldownReward);
                setMinedBlocks(prev => prev + 1);
                setMiningStats(prev => ({
                    ...prev,
                    attempts: prev.attempts + 1,
                    successes: prev.successes + 1
                }));
            }
        }
    }, 1000);

    return () => clearInterval(cooldownInterval);
  }, [isInCooldown, cooldownEndTime, maxEnergy, premiumMultiplier, autoMining]);

  // Remove or comment out the regular energy regeneration during cooldown
  useEffect(() => {
    if (isInCooldown) return;

    const interval = setInterval(() => {
        setEnergy((prevEnergy) => {
          const regenAmount = energyRegenRate * (isPremium ? 1.5 : 1);
          return Math.min(prevEnergy + regenAmount, maxEnergy);
        });
    }, 100);

    return () => clearInterval(interval);
  }, [isInCooldown, energyRegenRate, maxEnergy, isPremium]);

  // Add cooldown time formatter helper
  const formatCooldownTime = (endTime: number | null) => {
    if (!endTime) return '';
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



  // Update purchase function to save state after purchase
  const purchaseHardware = async (hardwareId: HardwareId) => {
    const hardware = MINING_HARDWARE[hardwareId];
    const currentCount = ownedHardware[hardwareId] ?? 0;
    
    // Check if maximum count reached
    if (currentCount >= hardware.maxCount) {
      showSnackbar({
        message: 'Maximum Limit Reached',
        description: `You cannot own more than ${hardware.maxCount} ${hardware.name}s`
      });
      return;
    }

    // Calculate scaled cost based on owned count
    const scaledCost = hardware.cost * Math.pow(1.2, currentCount);
    
    if (points < scaledCost) {
      showSnackbar({
        message: 'Insufficient Points',
        description: `You need ${formatNumber(scaledCost)} points to purchase this hardware`
      });
      return;
    }

    setPoints(prev => prev - scaledCost);
    setOwnedHardware(prev => ({
      ...prev,
      [hardwareId]: currentCount + 1
    }));

    // Update total hash rate with upgrade multiplier
    updateTotalHashRate();

    // Save state after purchase
    await saveMiningState();

    showSnackbar({
      message: 'Purchase Successful',
      description: `You purchased a ${hardware.name}!`
    });
  };

  // Add function to calculate total hash rate from owned hardware
  const updateTotalHashRate = () => {
    const totalRate = Object.entries(ownedHardware).reduce((total, [id, count]) => {
      const hardware = MINING_HARDWARE[id as HardwareId];
      const baseRate = hardware.hashRate * (count || 0);
      const upgradeBonus = Math.pow(hardware.upgradeMultiplier, count - 1);
      return total + (baseRate * upgradeBonus);
    }, baseHashRate);
    
    setBaseHashRate(totalRate);
  };

  // Update energy upgrade purchase function to save state
  const purchaseEnergyUpgrade = async (upgradeId: keyof typeof ENERGY_UPGRADES) => {
    const upgrade = ENERGY_UPGRADES[upgradeId];
    const currentLevel = energyUpgrades[upgradeId] || 0;
    
    if (currentLevel >= upgrade.maxLevel) {
      showSnackbar({
        message: 'Maximum Level Reached',
        description: `${upgrade.name} is already at maximum level`
      });
      return;
    }
    
    const cost = upgrade.getCost(currentLevel);
    if (points < cost) {
      showSnackbar({
        message: 'Insufficient Points',
        description: `You need ${formatNumber(cost)} points for this upgrade`
      });
      return;
    }
    
    setPoints(prev => prev - cost);
    setEnergyUpgrades(prev => ({
      ...prev,
      [upgradeId]: (prev[upgradeId] || 0) + 1
    }));
    
    // Update related stats
    if (upgradeId === 'capacity') {
      const newLevel = currentLevel + 1;
      const newMax = upgrade.getCurrentStats(newLevel).current;
      setMaxEnergy(newMax);
      // Optionally fill energy to new maximum
      setEnergy(newMax);
      
      showSnackbar({
        message: 'Capacity Upgraded',
        description: `Energy capacity increased to ${formatNumber(newMax)}!`
      });
    } else if (upgradeId === 'regeneration') {
      const newRate = upgrade.getCurrentStats(currentLevel + 1).current;
      setEnergyRegenRate(newRate);
      
      showSnackbar({
        message: 'Regeneration Upgraded',
        description: `Energy regeneration increased to ${formatNumber(newRate)}/s!`
      });
    }

    // Save state immediately after upgrade
    await saveMiningState();
  };

  // Add energy efficiency calculation helper
  const calculateEnergyConsumption = (baseConsumption: number) => {
    return Math.max(1, Math.floor(baseConsumption * (1 / energyEfficiency)));
  };


  // Update when mining starts/stops
  useEffect(() => {
    if (isMining && !miningStartTime) {
      setMiningStartTime(Date.now());
    } else if (!isMining && miningStartTime) {
      setMiningStartTime(null);
    }
  }, [isMining]);

 
  // Add this helper function
  const canActivateBoost = (boostType: keyof typeof BOOST_TYPES) => {
    const boost = BOOST_TYPES[boostType];
    const cooldownEnd = boostCooldowns[boostType] || 0;
    return Date.now() > cooldownEnd && energy >= boost.energyCost;
  };

  // Modify the mining circle render function
  const renderMiningCircle = () => (
    <div className="relative flex flex-col items-center gap-4">
      {/* Boost Selection Buttons - Only show when mining */}
      {isMining && (
        <div className="flex gap-2 mb-2">
          {(Object.keys(BOOST_TYPES) as Array<keyof typeof BOOST_TYPES>).map((boostType) => {
            const boost = BOOST_TYPES[boostType];
            const isSelected = selectedBoost === boostType;
            const isAvailable = canActivateBoost(boostType);
            const cooldownEnd = boostCooldowns[boostType] || 0;
            const cooldownRemaining = Math.max(0, cooldownEnd - Date.now());
            
            return (
              <button
                key={boostType}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedBoost(boostType);
                    activateBoost(boostType);
                  }
                }}
                disabled={!isAvailable}
                className={`
                  relative px-3 py-2 rounded-lg
                  transition-all duration-300
                  ${isSelected ? `bg-${boost.color} text-black` : 'bg-white/10'}
                  ${isAvailable ? 'hover:bg-white/20' : 'opacity-50 cursor-not-allowed'}
                  flex items-center gap-2
                `}
              >
                <span>{boost.icon}</span>
                {cooldownRemaining > 0 && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <span className="text-sm">
                      {Math.ceil(cooldownRemaining / 1000)}s
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Mining Button */}
      <button
        onClick={() => handleMiningClick()}
        disabled={isInCooldown}
        className={`
          relative group
          w-36 h-36 sm:w-48 sm:h-48 rounded-full
          transition-all duration-300
          ${isInCooldown 
            ? 'cursor-not-allowed opacity-80' 
            : !isMining 
              ? 'hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] cursor-pointer' 
              : 'cursor-pointer'}
          ${isInCooldown ? 'bg-orange-500/10' : 'bg-white/5'}
        `}
      >
        {/* Particle Effects Container - Only show when mining */}
        {isMining && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {particles.map(particle => (
              <div
                key={particle.id}
                className="absolute rounded-full transition-all duration-300"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  opacity: particle.opacity,
                  transform: `scale(${miningPulse ? 1.2 : 1})`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mining Circle */}
        <div className={`
          absolute inset-0 rounded-full
          bg-gradient-to-b from-white/5 to-white/10
          border-2 transition-all duration-500
          ${!isMining 
            ? 'hover:border-blue-500/50 border-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
            : activeBoost 
              ? `border-${BOOST_TYPES[activeBoost].color} shadow-[0_0_30px_rgba(250,204,21,0.4)]` 
              : 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]'}
          ${isInCooldown 
            ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)]' 
            : ''}
          ${miningPulse ? 'scale-105' : 'scale-100'}
        `}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isInCooldown ? (
              <div className="text-center">
               <div className="text-orange-400 font-bold text-2xl mb-2">COOLING</div>
                <div className="text-sm text-orange-400/70">{COOLDOWN_MINING_RATE * 100}% Speed</div>
              </div>
            ) : (
              <>
                <div className={`
                  text-3xl font-bold mb-2
                  ${!isMining 
                    ? 'text-white group-hover:text-blue-400 transition-colors duration-300' 
                    : activeBoost 
                      ? `text-${BOOST_TYPES[activeBoost].color} animate-pulse` 
                      : 'text-blue-400 animate-pulse'}
                `}>
                  {!isMining ? 'START MINING' : 'MINING'}
                </div>
                {!isMining && (
                  <div className="text-sm text-white/60 group-hover:text-blue-400/60 transition-colors duration-300">
                    Click to begin
                  </div>
                )}
                {activeBoost && (
                  <div className={`text-sm text-${BOOST_TYPES[activeBoost].color}`}>
                    {BOOST_TYPES[activeBoost].name}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </button>

      {/* Boost Info - Only show when mining */}
      {isMining && selectedBoost && (
        <div className="text-center mt-2">
          <div className={`text-${BOOST_TYPES[selectedBoost].color} text-sm font-medium`}>
            {BOOST_TYPES[selectedBoost].name}
          </div>
          <div className="text-white/60 text-xs mt-1">
            {BOOST_TYPES[selectedBoost].multiplier}x Mining Speed • 
            {BOOST_TYPES[selectedBoost].duration / 1000}s Duration • 
            {BOOST_TYPES[selectedBoost].energyCost} Energy
          </div>
        </div>
      )}
    </div>
  );

  // Add these constants at the top
  const SYNC_INTERVAL = 30000; // 30 seconds


  // Add function to load from localStorage
  const loadFromLocalStorage = () => {
    if (!user?.telegram_id) return;

    const savedState = localStorage.getItem(`mining_state_${user.telegram_id}`);
    if (!savedState) return;

    try {
      const parsedState = JSON.parse(savedState);
      
      setPoints(parsedState.points || 0);
      setEnergy(parsedState.energy || 0);
      setMaxEnergy(parsedState.max_energy || DEFAULT_MAX_ENERGY);
      setEnergyRegenRate(parsedState.energy_regen_rate || DEFAULT_ENERGY_REGEN_RATE);
      setMiningStartTime(parsedState.mining_started_at);
      setIsMining(parsedState.is_mining || false);
      setOwnedHardware(parsedState.owned_hardware || {});
      setEnergyUpgrades(parsedState.energy_upgrades || {});
      setCooldownUpgrades(parsedState.cooldown_upgrades || {});
      setLastClaimTime(parsedState.last_claim_time ? new Date(parsedState.last_claim_time).getTime() : null);
      setPremiumLevel(parsedState.premium_level || 0);
      setAutoMining(parsedState.auto_mining || false);
    } catch (error) {
      console.error('Error parsing localStorage mining state:', error);
    }
  };

  // Add function to save to localStorage
  const saveToLocalStorage = () => {
    try {
      const stateToSave = {
        points,
        minedBlocks,
        energy,
        maxEnergy,
        energyRegenRate,
        miningStartTime,
        isMining,
        ownedHardware,
        energyUpgrades,
        cooldownUpgrades,
        lastClaimTime: lastClaimTime ? new Date(lastClaimTime).toISOString() : null,
        premiumLevel,
        autoMining,
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem(`mining_state_${user?.telegram_id}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Update the save function to handle both localStorage and Supabase
  const saveMiningState = async () => {
    if (!user?.telegram_id) return;

    try {
      const stateToSave = {
        user_id: user.id,
        points,
        mined_blocks: minedBlocks,
        energy,
        max_energy: maxEnergy,
        energy_regen_rate: energyRegenRate,
        mining_started_at: miningStartTime ? new Date(miningStartTime).toISOString() : null,
        is_mining: isMining,
        owned_hardware: ownedHardware,
        energy_upgrades: energyUpgrades,
        cooldown_upgrades: cooldownUpgrades,
        last_claim_time: lastClaimTime ? new Date(lastClaimTime).toISOString() : null,
        premium_level: premiumLevel,
        auto_mining: autoMining,
        energy_efficiency: energyEfficiency,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('mining_states')
        .upsert(stateToSave, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      // setLastSyncTime(Date.now());

      // Also save to localStorage for redundancy
      saveToLocalStorage();
    } catch (error) {
      console.error('Error saving mining state:', error);
    }
  };

  // Update load function to handle both localStorage and Supabase
  const loadMiningState = async () => {
    if (!user?.telegram_id) return;

    try {
      // Load from localStorage first
      loadFromLocalStorage();

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', user.telegram_id)
        .single();

      if (userError || !userData) return;

      const { data, error } = await supabase
        .from('mining_states')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      if (error?.code === 'PGRST116') return;
      if (error) throw error;
      if (!data) return;

      // Calculate offline progress
      const offlineTime = Date.now() - new Date(data.updated_at).getTime();
      const offlinePoints = calculateOfflineProgress(offlineTime, data);

      // Calculate energy regeneration during offline time
      const energyRegenAmount = calculateOfflineEnergyRegen(
        offlineTime,
        data.energy || DEFAULT_MAX_ENERGY,
        data.max_energy || DEFAULT_MAX_ENERGY,
        data.energy_regen_rate || DEFAULT_ENERGY_REGEN_RATE,
        data.premium_level || 0
      );

      // Update state with persisted values, ensuring energy is properly set
      const updatedEnergy = Math.min(
        (data.energy || DEFAULT_MAX_ENERGY) + energyRegenAmount,
        data.max_energy || DEFAULT_MAX_ENERGY
      );

      setPoints(data.points + offlinePoints);
      setMinedBlocks(data.mined_blocks || 0);
      setEnergy(updatedEnergy);
      setMaxEnergy(data.max_energy || DEFAULT_MAX_ENERGY);
      setEnergyRegenRate(data.energy_regen_rate || DEFAULT_ENERGY_REGEN_RATE);
      setMiningStartTime(data.mining_started_at);
      setIsMining(data.is_mining);
      setOwnedHardware(data.owned_hardware || {});
      setEnergyUpgrades(data.energy_upgrades || {});
      setCooldownUpgrades(data.cooldown_upgrades || {});
      setLastClaimTime(data.last_claim_time);
      setPremiumLevel(data.premium_level || 0);
      setAutoMining(data.auto_mining || false);
      setEnergyEfficiency(data.energy_efficiency || 1);

      // Update derived states
      updateTotalHashRate();
      
      // Update energy stats based on upgrades
      if (data.energy_upgrades?.capacity) {
        const capacityLevel = data.energy_upgrades.capacity;
        const newMax = ENERGY_UPGRADES.capacity.getCurrentStats(capacityLevel).current;
        setMaxEnergy(newMax);
      }
      
      if (data.energy_upgrades?.regeneration) {
        const regenLevel = data.energy_upgrades.regeneration;
        const newRate = ENERGY_UPGRADES.regeneration.getCurrentStats(regenLevel).current;
        setEnergyRegenRate(newRate);
      }

      // Save merged state to localStorage
      saveToLocalStorage();

      if (offlinePoints > 0 || energyRegenAmount > 0) {
        showSnackbar({
          message: 'Welcome Back!',
          description: `Earned ${formatNumber(offlinePoints)} points and regenerated ${formatNumber(energyRegenAmount)} energy while away!`
        });
      }
    } catch (error) {
      console.error('Error loading mining state:', error);
    }
  };

  // Add helper function to calculate offline energy regeneration
  const calculateOfflineEnergyRegen = (
    offlineTime: number,
    currentEnergy: number,
    maxEnergy: number,
    regenRate: number,
    premiumLevel: number
  ): number => {
    // Calculate how much energy should have regenerated during offline time
    const premiumMultiplier = premiumLevel ? 1.5 : 1;
    const regenPerSecond = regenRate * premiumMultiplier;
    const totalRegenPossible = (offlineTime / 1000) * regenPerSecond;
    
    // Calculate how much energy can actually be added without exceeding max
    const energyDeficit = maxEnergy - currentEnergy;
    return Math.min(totalRegenPossible, energyDeficit);
  };

  // Add effect for auto-saving to localStorage
  useEffect(() => {
    if (isMining) {
      const saveInterval = setInterval(saveToLocalStorage, 5000); // Save every 5 seconds while mining
      return () => clearInterval(saveInterval);
    }
  }, [isMining, points, energy, ownedHardware, energyUpgrades]);

  // Add effect for periodic Supabase sync
  useEffect(() => {
    if (isMining) {
      const syncInterval = setInterval(saveMiningState, SYNC_INTERVAL);
      return () => clearInterval(syncInterval);
    }
  }, [isMining]);

  // Add effect to load state on mount
  useEffect(() => {
    if (user) {
      loadMiningState();
    }
  }, [user]);

  // Add this near the top with other state declarations
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);

  // Add new state for NFT modal
  const [showNftModal, setShowNftModal] = useState(false);
  const [nftMintStatus, setNftMintStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [hasNft, setHasNft] = useState(false);

  // Modify handleClaimRewards to check for NFT first
  const handleClaimRewards = async () => {
    if (!user || !points || points <= 0) return;
    
    const now = Date.now();
    const timeUntilNextClaim = lastClaimTime ? (lastClaimTime + CLAIM_COOLDOWN) - now : 0;
    
    if (timeUntilNextClaim > 0) {
      showSnackbar({
        message: 'Claim Cooldown',
        description: `Please wait ${formatTime(timeUntilNextClaim)} before claiming again`
      });
      return;
    }

    // Check if user has NFT
    if (!hasNft) {
      setShowNftModal(true);
      return;
    }
    
    try {
      setIsClaimingRewards(true);
      
      const pointsToClaim = Math.floor(points * 0.9);
      const pointsToKeep = points - pointsToClaim;
      
      const { error } = await supabase.rpc('claim_mining_rewards', {
        p_user_id: user.id,
        p_amount: pointsToClaim
      });

      if (error) throw error;

      setLastClaimTime(now);
      setPoints(pointsToKeep);
      
      // Save state immediately after claiming
      await saveMiningState();
      saveToLocalStorage();
      
      showSnackbar({
        message: 'Rewards Claimed!',
        description: `Claimed ${formatNumber(pointsToClaim)} STK. Kept ${formatNumber(pointsToKeep)} points for level progress.`
      });

    } catch (error) {
      console.error('Error claiming rewards:', error);
      showSnackbar({
        message: 'Claim Failed',
        description: 'Please try again later'
      });
    } finally {
      setIsClaimingRewards(false);
    }
  };

  // Add NFT status change handler
  const handleNftStatusChange = (status: 'idle' | 'loading' | 'success' | 'error', hasMinted: boolean) => {
    setNftMintStatus(status);
    setHasNft(hasMinted);
  };

  // Add NFT mint success handler
  const handleNftMintSuccess = async () => {
    setHasNft(true);
    setShowNftModal(false);
    showSnackbar({
      message: 'NFT Minted Successfully!',
      description: 'You can now claim your rewards'
    });
  };

  // Add helper function to format time
  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Add this near your other state declarations
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDescription, setSnackbarDescription] = useState('');

  const showSnackbar = ({ message, description }: { message: string; description: string }) => {
    setSnackbarMessage(message);
    setSnackbarDescription(description);
    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 5000); // Hide after 5s
  };

  // Add these state variables at the top with other states
  const [ownedBoosters, setOwnedBoosters] = useState<string[]>([]);

  // Add this constant with your other constants
  const BOOSTERS = {
    multipleGPU: {
      id: 'multipleGPU',
      name: 'Multiple GPU',
      icon: '🚀',
      description: 'Unlock the ability to mine with unlimited GPUs',
      cost: 25000,
      isPermanent: true
    },
    powerFlow: {
      id: 'powerFlow',
      name: 'PowerFlow',
      icon: '⚡',
      description: 'GPUs operate 24/7, auto-restart if offline',
      cost: 50000,
      isPermanent: true
    }
  };

  // Add this function with your other functions
  const purchaseBooster = async (id: string) => {
    const booster = BOOSTERS[id as keyof typeof BOOSTERS];
    if (!booster) return;

    if (points < booster.cost) {
      showSnackbar({
        message: 'Insufficient Points',
        description: `You need ${formatNumber(booster.cost)} points to purchase this booster`
      });
      return;
    }

    if (ownedBoosters.includes(id)) {
      showSnackbar({
        message: 'Already Owned',
        description: `You already own this booster`
      });
      return;
    }

    setPoints(prev => prev - booster.cost);
    setOwnedBoosters(prev => [...prev, id]);

    // Save state after purchase
    await saveMiningState();

    showSnackbar({
      message: 'Purchase Successful',
      description: `You purchased ${booster.name}!`
    });
  };

  // Update the MINING_LEVELS constant to use points instead of blocks
  const MINING_LEVELS = [
    { 
      level: 1, 
      requiredPoints: 0, 
      reward: 1.0, 
      color: 'text-gray-400', 
      name: 'Novice Miner',
      badge: '🔨'
    },
    { 
      level: 2, 
      requiredPoints: 2500, 
      reward: 1.2, 
      color: 'text-green-400', 
      name: 'Amateur Miner',
      badge: '⛏️'
    },
    { 
      level: 3, 
      requiredPoints: 25000, 
      reward: 1.5, 
      color: 'text-blue-400', 
      name: 'Skilled Miner',
      badge: '💎'
    },
    { 
      level: 4, 
      requiredPoints: 75000, 
      reward: 2.0, 
      color: 'text-purple-400', 
      name: 'Expert Miner',
      badge: '⚡'
    },
    { 
      level: 5, 
      requiredPoints: 100000, 
      reward: 2.5, 
      color: 'text-yellow-400', 
      name: 'Master Miner',
      badge: '🌟'
    },
    { 
      level: 6, 
      requiredPoints: 250000, 
      reward: 3.0, 
      color: 'text-orange-400', 
      name: 'Elite Miner',
      badge: '🏆'
    },
    { 
      level: 7, 
      requiredPoints: 7500000, 
      reward: 4.0, 
      color: 'text-red-400', 
      name: 'Legendary Miner',
      badge: '👑'
    },
    { 
      level: 8, 
      requiredPoints: 25000000, 
      reward: 5.0, 
      color: 'text-rose-500', 
      name: 'Mining Oracle',
      badge: '🔮'
    },
    { 
      level: 9, 
      requiredPoints: 50000000, 
      reward: 7.0, 
      color: 'text-fuchsia-400', 
      name: 'Mining Deity',
      badge: '⚜️'
    }
  ];

  // Update the renderMiningLevel function
  const renderMiningLevel = () => {
    // Find current level based on points
    const currentLevelInfo = MINING_LEVELS.reduce((prev, curr) => {
      return points >= curr.requiredPoints ? curr : prev;
    }, MINING_LEVELS[0]);

    // Find next level
    const nextLevelInfo = MINING_LEVELS.find(l => l.requiredPoints > points);

    // Calculate progress percentage
    const levelProgress = nextLevelInfo ? (
      ((points - currentLevelInfo.requiredPoints) / 
      (nextLevelInfo.requiredPoints - currentLevelInfo.requiredPoints)) * 100
    ) : 100;

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {currentLevelInfo.badge}
            </div>
            <div>
              <div className={`text-lg font-bold ${currentLevelInfo.color}`}>
                Level {currentLevelInfo.level}
              </div>
              <div className="text-sm text-white/60">
                {currentLevelInfo.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {currentLevelInfo.reward}x
            </div>
            <div className="text-xs text-white/60">
              Reward Multiplier
            </div>
          </div>
        </div>

        {nextLevelInfo && (
          <>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full
                  ${currentLevelInfo.level >= 8 
                    ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-xs">
                <span className="text-white/60">Progress: </span>
                <span className="text-white font-medium">
                  {Math.floor(levelProgress)}%
                </span>
              </div>
              <div className="text-xs">
                <span className="text-white/60">Next: </span>
                <span className={nextLevelInfo.color}>
                  {nextLevelInfo.name} {nextLevelInfo.badge}
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/40">
              <span>{formatNumber(points)} points</span>
              <span>{formatNumber(nextLevelInfo.requiredPoints)} needed</span>
            </div>
          </>
        )}
        
        {currentLevelInfo.level === 9 && (
          <div className="mt-2 text-center text-xs text-fuchsia-400 font-medium">
            Maximum Level Achieved! 🎉
          </div>
        )}
      </div>
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Add this helper function
  const calculateOfflineProgress = (offlineTime: number, data: any): number => {
    if (!data.is_mining) return 0;
    
    const offlineHours = offlineTime / (1000 * 60 * 60);
    const basePointsPerHour = 3600; // Base points earned per hour
    const multiplier = data.premium_level ? 1 + (data.premium_level * 0.1) : 1;
    
    return Math.floor(basePointsPerHour * offlineHours * multiplier);
  };

  // Add mining click handler
  const handleMiningClick = () => {
    if (isInCooldown) return;
    
    setIsMining(!isMining);
    if (!isMining) {
      setMiningStartTime(Date.now());
      setLastClickTime(Date.now());
    } else {
      setMiningStartTime(null);
    }
    saveMiningState();
  };

  // Add this function to handle boost activation
  const activateBoost = (boostType: keyof typeof BOOST_TYPES) => {
    const boost = BOOST_TYPES[boostType];
    
    // Check if boost can be activated
    if (!canActivateBoost(boostType)) {
      showSnackbar({
        message: 'Cannot Activate Boost',
        description: 'Not enough energy or boost is on cooldown'
      });
      return;
    }

    // Consume energy
    setEnergy(prev => prev - boost.energyCost);
    
    // Set active boost
    setActiveBoost(boostType);
    
    // Set cooldown
    const cooldownEnd = Date.now() + boost.cooldown;
    setBoostCooldowns(prev => ({
      ...prev,
      [boostType]: cooldownEnd
    }));

    // Show activation message
    showSnackbar({
      message: `${boost.name} Activated`,
      description: `Mining speed increased by ${boost.multiplier}x for ${boost.duration/1000}s`
    });

    // Clear boost after duration
    setTimeout(() => {
      setActiveBoost(null);
      showSnackbar({
        message: `${boost.name} Ended`,
        description: 'Boost effect has worn off'
      });
    }, boost.duration);
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Add margin-top to main content to account for fixed header */}
      <div className="pt-2">
        {/* Beautiful Background */}
        <div className="fixed inset-0 bg-[#0A0F1C]">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f3c] via-[#0A0F1C] to-[#0d1424]" />
          
          {/* Animated Gradient Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
          
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
          
          {/* Star Field */}
          <div className="absolute inset-0" 
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, #0A0F1C 100%), ' +
                         'repeating-radial-gradient(circle at center, #ffffff 0, #ffffff 1px, transparent 1px, transparent 100%) 50% 50% / 24px 24px'
            }} 
          />
        </div>

        {/* Main Content Container - Reduced top padding */}
        <div className="relative w-full min-h-screen flex flex-col items-center pt-10 px-4 sm:px-6">
          {/* Premium Badge - Adjusted positioning */}
          {isPremium && (
            <div className="fixed top-2 right-4 z-20
              bg-gradient-to-r from-amber-400 to-yellow-300
              rounded-full px-3 py-1
              text-xs font-medium text-black/80
              shadow-[0_0_20px_rgba(245,158,11,0.3)]
              flex items-center gap-1
              sm:absolute sm:top-1"
            >
              <span>⭐</span>
              <span>Premium {premiumLevel}</span>
            </div>
          )}

          {/* Main Content Area - Reduced gap */}
          <div className="w-full max-w-lg flex flex-col gap-2">
            {/* Top Stats Section - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Token Display - Made responsive */}
              <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10
                sm:col-span-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-2">
                      <span className="text-xl sm:text-2xl">💎</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {points.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/60">Mining Points</div>
                    </div>
                  </div>
                  <button
                    onClick={handleClaimRewards}
                    disabled={Boolean(!points || points <= 0 || isClaimingRewards || (lastClaimTime && Date.now() - lastClaimTime < CLAIM_COOLDOWN))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-300 flex items-center gap-2
                      ${points > 0 && !isClaimingRewards && (!lastClaimTime || Date.now() - lastClaimTime >= CLAIM_COOLDOWN)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                        : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {isClaimingRewards ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Claiming...</span>
                      </>
                    ) : lastClaimTime && Date.now() - lastClaimTime < CLAIM_COOLDOWN ? (
                      <>
                        <span>⏳</span>
                        <span>{formatTime((lastClaimTime + CLAIM_COOLDOWN) - Date.now())}</span>
                      </>
                    ) : (
                      <>
                        <span>💰</span>
                        <span>Claim</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Energy Bar - Made responsive */}
              <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10
                sm:col-span-2"
              >
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Energy</span>
                  <span className="text-white/60">{energy}/{maxEnergy}</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full
                      ${energy > maxEnergy * 0.6 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                        : energy > maxEnergy * 0.3 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                    style={{ width: `${(energy/maxEnergy) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1.5">
                  <span className="text-emerald-400">+{energyRegenRate}/s</span>
                  {isInCooldown && (
                    <span className="text-orange-400">Cooldown: {formatCooldownTime(cooldownEndTime)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mining Button Section - Responsive sizing */}
            <div className="flex-1 flex items-center justify-center py-4">
              {renderMiningCircle()}
            </div>

            {/* Stats Grid - Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Blocks Mined', value: minedBlocks },
                { label: 'Difficulty', value: difficulty },
                { label: 'Success Rate', value: miningStats.attempts === 0 ? '0%' : `${((miningStats.successes / miningStats.attempts) * 100).toFixed(1)}%` },
                { label: 'Hash Rate', value: hashRate === 0 
                  ? '0 H/s' 
                  : `${formatNumber(Number(hashRate.toFixed(2)))} H/s` 
              }
              ].map((stat, index) => (
                <div key={index} 
                  className="bg-white/5 backdrop-blur-xl rounded-lg p-2.5 border border-white/10
                    hover:bg-white/10 transition-colors duration-300"
                >
                  <div className="text-white/60 text-xs">{stat.label}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Mining Level Display */}
            {renderMiningLevel()}

            {/* Bottom Buttons - Made responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* <button 
                onClick={() => setShowStore(true)}
                className="w-full px-4 py-3 sm:py-2 rounded-lg
                  bg-gradient-to-r from-blue-500 to-purple-500
                  shadow-lg shadow-blue-500/20
                  transition-all duration-300
                  hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
                  active:scale-95
                  flex items-center justify-center gap-2"
              >
                <span className="text-lg">🏪</span>
                <span className="text-sm font-medium text-white">Open Store</span>
              </button> */}

              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="w-full px-4 py-3 sm:py-2 rounded-lg
                  bg-white/5 hover:bg-white/10
                  border border-white/10
                  transition-colors duration-300
                  text-sm text-white/60 hover:text-white
                  flex items-center justify-center gap-2"
              >
                <span>{showDebug ? '🔽' : '🔼'}</span>
                <span>Debug Info</span>
              </button>
            </div>

            {/* Debug Panel - Made responsive */}
            {showDebug && (
              <div className="p-3 bg-black/30 rounded-lg text-xs font-mono space-y-1
                overflow-x-auto whitespace-nowrap sm:whitespace-normal"
              >
                <div className="text-[#0099ff] mb-2">Mining Debug Statistics</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="text-white/60">Mining Attempts:</div>
                  <div className="text-white">{miningStats.attempts}</div>
                  
                  <div className="text-white/60">Successful Blocks:</div>
                  <div className="text-white">{miningStats.successes}</div>
                  
                  <div className="text-white/60">Success Rate:</div>
                  <div className="text-white">{((miningStats.successes / miningStats.attempts) * 100).toFixed(2)}%</div>
                  
                  <div className="text-white/60">Avg Block Time:</div>
                  <div className="text-white">{miningStats.actualBlockTime.toFixed(2)}ms</div>
                  
                  <div className="text-white/60">Target Block Time:</div>
                  <div className="text-white">{TARGET_BLOCK_TIME}ms</div>
                  
                  <div className="text-white/60">Energy Used:</div>
                  <div className="text-white">{miningStats.energyUsed}</div>
                  
                  <div className="text-white/60">Profit/Hour:</div>
                  <div className="text-white">{miningStats.profitPerHour.toFixed(2)} STK</div>
                  
                  <div className="text-white/60">Current Hash Rate:</div>
                  <div className="text-white">{hashRate.toFixed(2)} H/s</div>
                  
                  <div className="text-white/60">Base Hash Rate:</div>
                  <div className="text-white">{baseHashRate.toFixed(2)} H/s</div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10">
                  <div className="text-white/60">Hardware Count:</div>
                  <div className="text-white break-all">
                    {Object.entries(ownedHardware)
                      .filter(([_, count]) => count > 0)
                      .map(([id, count]) => `${id}:${count}`)
                      .join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Modal - Made responsive */}
      {showStore && (
        <StoreModal
          onClose={() => setShowStore(false)}
          points={points}
          ownedHardware={ownedHardware}
          MINING_HARDWARE={MINING_HARDWARE}
          activeHardware={activeHardware}
          setActiveHardware={(id: string) => setActiveHardware(id as HardwareId)}
          purchaseHardware={(id: string) => purchaseHardware(id as HardwareId)}
          formatNumber={formatNumber}
          ENERGY_UPGRADES={ENERGY_UPGRADES}
          energyUpgrades={energyUpgrades}
          purchaseEnergyUpgrade={(id: string) => purchaseEnergyUpgrade(id as keyof typeof ENERGY_UPGRADES)}
          BOOSTERS={BOOSTERS}
          ownedBoosters={ownedBoosters}
          purchaseBooster={purchaseBooster}
        />
      )}

      {/* Add NFT Modal */}
      {showNftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#1A1A2E] rounded-xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">NFT Required</h3>
                <button 
                  onClick={() => setShowNftModal(false)}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-white/70 mb-4">
                  To claim rewards, you need to mint our NFT first. This is a one-time requirement.
                </p>
              </div>

              <LotteryCard
                title="Mining NFT"
                description="Mint this NFT to unlock reward claiming"
                price={1}
                onPurchase={() => {}}
                onStatusChange={handleNftStatusChange}
                onMintSuccess={handleNftMintSuccess}
                disabled={nftMintStatus === 'loading'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Snackbar Component */}
      {snackbarVisible && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
          bg-white/10 backdrop-blur-xl rounded-lg p-4
          border border-white/20 shadow-lg
          animate-fade-in-up"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-white">
                {snackbarMessage}
              </div>
              <div className="text-sm text-white/60 mt-0.5">
                {snackbarDescription}
              </div>
            </div>
            <button
              onClick={() => setSnackbarVisible(false)}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

