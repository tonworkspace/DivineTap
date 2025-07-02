import { useState, useEffect, useRef } from "react";
import { GiBasket, GiFrog } from "react-icons/gi";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Tooltip, InfoTooltip, SuccessTooltip } from '@/components/ui/tooltip';
import { processReferralHarvestBonus, giveWelcomeBonus } from '@/lib/referralIntegration';
import { useReferralIntegration } from '@/hooks/useReferralIntegration';
import { toast } from 'react-hot-toast';

const frogNames = ["Bubbles", "Sprout", "Jumpy", "Lily", "Croaky", "Hopper", "Peppy", "Warty"];
const rarities = [
  { type: "Common", color: "bg-green-300", text: "text-green-800", rate: 1, emoji: "🐸" },
  { type: "Rare", color: "bg-blue-300", text: "text-blue-800", rate: 2, emoji: "🟦" },
  { type: "Epic", color: "bg-purple-300", text: "text-purple-800", rate: 5, emoji: "💜" },
];

const DAILY_LIMIT = 4;
const CATCH_COOLDOWN = 60; // seconds

const rarityCatchChances: Record<string, number> = {
  Common: 0.9,
  Rare: 0.6,
  Epic: 0.3,
};


function getRandomFrog() {
  const name = frogNames[Math.floor(Math.random() * frogNames.length)];
  const rarity =
    Math.random() < 0.7
      ? rarities[0]
      : Math.random() < 0.9
      ? rarities[1]
      : rarities[2];
  // Randomly assign an ability (or none)
  const possibleAbilities = [
    null,
    { type: "Double Mining", description: "Mines double points for 10s every minute." },
    { type: "Cooldown Reducer", description: "Reduces catch cooldown by 10s." },
    { type: "Bonus Catch", description: "+10% catch chance." },
    { type: "Harvest Bonus", description: "+20% points when harvesting." },
  ];
  const ability = possibleAbilities[Math.floor(Math.random() * possibleAbilities.length)];
  return {
    name,
    color: rarity.color,
    text: rarity.text,
    rate: rarity.rate,
    rarity: rarity.type,
    emoji: rarity.emoji,
    id: Math.random().toString(36).slice(2),
    ability,
    level: 1,
    nextUpgradeCost: 1000, // Start at 1000
  };
}

const getRandomUpgradeIncrement = () => 1000 + Math.floor(Math.random() * 1001); // 1000-2000

export const FrogsMiner = () => {
  const { user } = useAuth();
  const userId = String(user?.id || 'guest');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [, setLoadingStep] = useState('');
  
  // Add cache reference
  const dataCache = useRef({
    lastSync: 0,
    data: null
  });

  // Add session management
  const [sessionStartTime, setSessionStartTime] = useState(() => {
    const stored = localStorage.getItem(`${userId}_sessionStartTime`);
    return stored ? parseInt(stored, 10) : Date.now();
  });

  const [lastMiningTime, setLastMiningTime] = useState(() => {
    const stored = localStorage.getItem(`${userId}_lastMiningTime`);
    return stored ? parseInt(stored, 10) : Date.now();
  });

  // Optimize initial state loading
  const [frogs, setFrogs] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem(`${userId}_frogs`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Add performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0
  });

  // Add sync status monitoring
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 0,
    syncError: null as string | null,
    isOnline: navigator.onLine
  });

  // Add UX monitoring
  const [uxMetrics, setUxMetrics] = useState({
    timeToFirstInteraction: 0,
    interactions: 0,
    errors: 0,
    lastError: null
  });

  // Add harvesting state management
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [lastHarvestTime, setLastHarvestTime] = useState(() => {
    const stored = localStorage.getItem(`${userId}_lastHarvestTime`);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Add harvest cooldown (prevent spam clicking)
  const HARVEST_COOLDOWN = 2000; // 2 seconds
  const [harvestCooldown, setHarvestCooldown] = useState(0);

  // Add referral integration
  const { markUserAsActive, hasReferrer, isActiveReferral } = useReferralIntegration();

  // Optimize the initialization effect
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingStep('Initializing...');
      
      try {
        // Simulate loading steps for better UX
        setTimeout(() => {
          setLoadingProgress(20);
          setLoadingStep('Checking local data...');
        }, 200);

        // Load current points from localStorage first to preserve them
        const currentPoints = localStorage.getItem(`${userId}_points`);
        const currentPointsValue = currentPoints ? parseInt(currentPoints, 10) : 0;

        // Only fetch from Supabase if:
        // 1. User is logged in
        // 2. Last sync was more than 30 seconds ago
        const shouldFetchFromSupabase = user?.id && 
          (Date.now() - dataCache.current.lastSync > 30000);

        if (shouldFetchFromSupabase) {
          setTimeout(() => {
            setLoadingProgress(40);
            setLoadingStep('Connecting to server...');
          }, 400);

          // Parallel fetch from Supabase
          const supabasePromise = supabase
            .from('frog_miner_data')
            .select('*')
            .eq('id', user.id)
            .single();

          // While Supabase is loading, immediately show localStorage data
          const localData = localStorage.getItem(`${userId}_frogs`);
          if (localData) {
            setTimeout(() => {
              setLoadingProgress(60);
              setLoadingStep('Loading cached data...');
            }, 600);
            
            const parsedLocalData = JSON.parse(localData);
            setFrogs(parsedLocalData);
            // Preserve current points instead of resetting
            setPoints(currentPointsValue);
            setIsLoading(false); // Show content immediately
          }

          // Wait for Supabase data
          const { data, error } = await supabasePromise;

          setTimeout(() => {
            setLoadingProgress(80);
            setLoadingStep('Syncing data...');
          }, 800);

          if (data && !error) {
            // Update cache timestamp
            dataCache.current.lastSync = Date.now();
            dataCache.current.data = data;

            // Update state with Supabase data, but preserve points
            setFrogs(data.frogs || []);
            // IMPORTANT: Use the higher value between Supabase and localStorage points
            const supabasePoints = data.points || 0;
            const finalPoints = Math.max(currentPointsValue, supabasePoints);
            setPoints(finalPoints);
            setTotalHarvested(data.total_harvested || 0);
            setCaughtToday(data.caught_today || 0);

            // Update localStorage with fresh data, preserving the higher points value
            updateLocalStorageForUser({
              frogs: data.frogs || [],
              points: finalPoints,
              totalHarvested: data.total_harvested || 0,
              caughtToday: data.caught_today || 0,
              lastResetDate: data.last_reset_date || new Date().toDateString()
            });
          }
        } else {
          setTimeout(() => {
            setLoadingProgress(60);
            setLoadingStep('Loading local data...');
          }, 600);
          
          // For guest users or recent syncs, just use localStorage
          const localData = localStorage.getItem(`${userId}_frogs`);
          if (localData) {
            setFrogs(JSON.parse(localData));
          }
          // Ensure points are loaded from localStorage
          setPoints(currentPointsValue);
        }

        setTimeout(() => {
          setLoadingProgress(100);
          setLoadingStep('Ready!');
        }, 1000);

      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage on error
        const localData = localStorage.getItem(`${userId}_frogs`);
        if (localData) {
          setFrogs(JSON.parse(localData));
        }
        // Preserve points even on error
        const currentPoints = localStorage.getItem(`${userId}_points`);
        setPoints(currentPoints ? parseInt(currentPoints, 10) : 0);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1200); // Small delay to show completion
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        renderCount: prev.renderCount + 1,
        lastRenderTime: renderTime,
        averageRenderTime: (prev.averageRenderTime + renderTime) / 2
      }));
      
      // Log slow renders
      if (renderTime > 16) { // 60fps threshold
        console.warn('Slow render detected:', renderTime.toFixed(2) + 'ms');
      }
    };
  }, []);

  // Add memory usage monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        if (usedMB > 100) { // Alert if using more than 100MB
          console.warn('High memory usage:', usedMB + 'MB / ' + totalMB + 'MB');
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const [wildFrog, setWildFrog] = useState<
    { name: string; color: string; text: string; rate: number; rarity: string; emoji: string; id: string; ability?: any; level: number; nextUpgradeCost: number | null } | null
  >(null);
  const [points, setPoints] = useState(() => {
    const stored = localStorage.getItem(`${userId}_points`);
    const storedTime = localStorage.getItem(`${userId}_lastMiningTime`);
    
    if (stored && storedTime) {
      const lastTime = parseInt(storedTime, 10);
      const currentTime = Date.now();
      const timeDiff = Math.floor((currentTime - lastTime) / 1000); // seconds
      
      // Calculate offline mining
      const cachedFrogs = localStorage.getItem(`${userId}_frogs`);
      if (cachedFrogs) {
        const frogs = JSON.parse(cachedFrogs);
        const totalMiningRate = frogs.reduce((sum: number, f: any) => sum + f.rate, 0);
        const offlinePoints = totalMiningRate * timeDiff;
        return parseInt(stored, 10) + offlinePoints;
      }
    }
    
    return stored ? parseInt(stored, 10) : 0;
  });
  const [catchAnim, setCatchAnim] = useState(false);
  const [caughtToday, setCaughtToday] = useState(() => {
    const stored = localStorage.getItem(`${userId}_caughtToday`);
    const lastReset = localStorage.getItem(`${userId}_lastResetDate`);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      localStorage.setItem(`${userId}_lastResetDate`, today);
      return 0;
    }
    
    return stored ? parseInt(stored, 10) : 0;
  });
  
  // FIXED: Initialize catchCooldown from localStorage with timestamp calculation
  const [catchCooldown, setCatchCooldown] = useState(() => {
    const cooldownEndTime = localStorage.getItem(`${userId}_cooldownEndTime`);
    if (cooldownEndTime) {
      const endTime = parseInt(cooldownEndTime, 10);
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      return remaining;
    }
    return 0;
  });
  
  const [catching, setCatching] = useState(false);
  const [catchResult, setCatchResult] = useState<null | "success" | "fail">(null);
  const [harvested, setHarvested] = useState(false);
  const [totalHarvested, setTotalHarvested] = useState(() => {
    const stored = localStorage.getItem(`${userId}_totalHarvested`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;
 

  // Enhanced mining effect with session persistence
  const frogsRef = useRef(frogs);
  useEffect(() => { frogsRef.current = frogs; }, [frogs]);

  useEffect(() => {
    // Initialize session if not exists
    if (!localStorage.getItem(`${userId}_sessionStartTime`)) {
      localStorage.setItem(`${userId}_sessionStartTime`, Date.now().toString());
      setSessionStartTime(Date.now());
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setPoints((prev) => {
        const newPoints = prev + frogsRef.current.reduce((sum, f) => sum + f.rate, 0);
        // Update last mining time
        localStorage.setItem(`${userId}_lastMiningTime`, currentTime.toString());
        setLastMiningTime(currentTime);
        return newPoints;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [userId]);

  // Session management effects
  useEffect(() => {
    // Save session start time
    localStorage.setItem(`${userId}_sessionStartTime`, sessionStartTime.toString());
  }, [sessionStartTime, userId]);

  useEffect(() => {
    // Save last mining time
    localStorage.setItem(`${userId}_lastMiningTime`, lastMiningTime.toString());
  }, [lastMiningTime, userId]);

  // Enhanced localStorage update function
  const updateLocalStorageForUser = (data: {
    frogs: any[],
    points: number,
    totalHarvested: number,
    caughtToday: number,
    lastResetDate: string
  }) => {
    localStorage.setItem(`${userId}_frogs`, JSON.stringify(data.frogs));
    // IMPORTANT: Only update points if the new value is higher or if explicitly harvesting
    const currentPoints = localStorage.getItem(`${userId}_points`);
    const currentPointsValue = currentPoints ? parseInt(currentPoints, 10) : 0;
    const pointsToSave = data.points === 0 ? 0 : Math.max(currentPointsValue, data.points);
    localStorage.setItem(`${userId}_points`, pointsToSave.toString());
    localStorage.setItem(`${userId}_totalHarvested`, data.totalHarvested.toString());
    localStorage.setItem(`${userId}_caughtToday`, data.caughtToday.toString());
    localStorage.setItem(`${userId}_lastResetDate`, data.lastResetDate);
    localStorage.setItem(`${userId}_lastMiningTime`, Date.now().toString());
  };

  // Add session info display
  const getSessionDuration = () => {
    const duration = Date.now() - sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getTotalMiningTime = () => {
    const duration = lastMiningTime - sessionStartTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Mining effect: Each frog mines points per second based on rarity
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => prev + frogsRef.current.reduce((sum, f) => sum + f.rate, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save caughtToday to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`${userId}_caughtToday`, caughtToday.toString());
  }, [caughtToday]);

  // FIXED: Enhanced cooldown timer effect with localStorage persistence
  useEffect(() => {
    if (catchCooldown > 0) {
      const timer = setInterval(() => {
        setCatchCooldown((c) => {
          const newCooldown = c - 1;
          if (newCooldown <= 0) {
            // Clear the cooldown end time when it reaches 0
            localStorage.removeItem(`${userId}_cooldownEndTime`);
            return 0;
          }
          return newCooldown;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [catchCooldown, userId]);

  // FIXED: Save cooldown end time to localStorage whenever cooldown is set
  const setCatchCooldownWithPersistence = (seconds: number) => {
    if (seconds > 0) {
      const endTime = Date.now() + (seconds * 1000);
      localStorage.setItem(`${userId}_cooldownEndTime`, endTime.toString());
    } else {
      localStorage.removeItem(`${userId}_cooldownEndTime`);
    }
    setCatchCooldown(seconds);
  };

  // Save frogs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`${userId}_frogs`, JSON.stringify(frogs));
    console.log('Saved frogs to localStorage:', frogs);
    if (page > 1 && (page - 1) * PAGE_SIZE >= frogs.length) {
      setPage(Math.max(1, Math.ceil(frogs.length / PAGE_SIZE)));
    }
  }, [frogs, userId]);

  // Save points to localStorage whenever they change
  useEffect(() => {
    // Only save if points are not being reset to 0 (unless it's a harvest)
    if (points >= 0) {
      localStorage.setItem(`${userId}_points`, points.toString());
      
      // Add backup points to prevent loss
      localStorage.setItem(`${userId}_points_backup`, points.toString());
      localStorage.setItem(`${userId}_points_backup_time`, Date.now().toString());
    }
  }, [points, userId]);

  // Add points recovery mechanism
  useEffect(() => {
    // Check if points were accidentally reset and recover from backup
    const currentPoints = localStorage.getItem(`${userId}_points`);
    const backupPoints = localStorage.getItem(`${userId}_points_backup`);
    const backupTime = localStorage.getItem(`${userId}_points_backup_time`);
    const isHarvesting = localStorage.getItem(`${userId}_harvesting_flag`);
    
    // Don't recover if we're in the middle of a harvest
    if (currentPoints === '0' && backupPoints && backupTime && !isHarvesting) {
      const backupAge = Date.now() - parseInt(backupTime, 10);
      // Only recover if backup is less than 1 hour old
      if (backupAge < 60 * 60 * 1000) {
        const backupValue = parseInt(backupPoints, 10);
        if (backupValue > 0) {
          console.log('Recovering points from backup:', backupValue);
          setPoints(backupValue);
          localStorage.setItem(`${userId}_points`, backupValue.toString());
        }
      }
    }
  }, []);

  // Add points validation on component mount
  useEffect(() => {
    const validateAndRecoverPoints = () => {
      const currentPoints = localStorage.getItem(`${userId}_points`);
      const backupPoints = localStorage.getItem(`${userId}_points_backup`);
      const isHarvesting = localStorage.getItem(`${userId}_harvesting_flag`);
      
      // Don't validate if we're in the middle of a harvest
      if (currentPoints && backupPoints && !isHarvesting) {
        const current = parseInt(currentPoints, 10);
        const backup = parseInt(backupPoints, 10);
        
        // If current points are significantly lower than backup, recover
        if (current < backup * 0.5 && backup > 0) {
          console.log('Points validation failed, recovering from backup');
          setPoints(backup);
          localStorage.setItem(`${userId}_points`, backup.toString());
        }
      }
    };
    
    validateAndRecoverPoints();
  }, [userId]);

  // Calculate the cost to catch a new frog
  const catchCost = 0 + frogs.length * 0;

  // Update the findWildFrog function to check croaks
  const findWildFrog = () => {
    if (
      caughtToday < DAILY_LIMIT &&
      catchCooldown === 0 &&
      totalHarvested >= catchCost // Only allow if enough croaks
    ) {
      setWildFrog(getRandomFrog());
      setCatchAnim(false);
    }
  };

  // Update the catchFrog function to use the persistent cooldown setter
  const catchFrog = () => {
    trackInteraction('catch_frog');
    
    if (wildFrog && caughtToday < DAILY_LIMIT && !catching) {
      setCatching(true);
      setCatchResult(null);

      setTimeout(async () => {
        const bonusCatch = frogs.some(f => f.ability?.type === "Bonus Catch") ? 0.1 : 0;
        const chance = (rarityCatchChances[wildFrog.rarity] ?? 0.5) + bonusCatch;
        if (Math.random() < chance) {
          const newFrogs = [...frogs, wildFrog];
          const newCaughtToday = caughtToday + 1;
          const newTotalHarvested = totalHarvested - catchCost;

          // Update state
          setFrogs(newFrogs);
          setCatchAnim(true);
          setCaughtToday(newCaughtToday);
          setCatchResult("success");
          setTotalHarvested(newTotalHarvested);

          // Immediately save to localStorage
          localStorage.setItem(`${userId}_frogs`, JSON.stringify(newFrogs));

          // Immediately sync with Supabase if logged in
          if (user?.id) {
            try {
              await syncWithSupabase({
                points,
                totalHarvested: newTotalHarvested,
                caughtToday: newCaughtToday,
                frogs: newFrogs
              });
            } catch (error) {
              console.error('Error syncing with Supabase:', error);
            }
          }
        } else {
          setCatchResult("fail");
        }
        
        const cooldownReduction = frogs.some(f => f.ability?.type === "Cooldown Reducer") ? 10 : 0;
        // FIXED: Use the persistent cooldown setter
        setCatchCooldownWithPersistence(Math.max(0, CATCH_COOLDOWN - cooldownReduction));
        
        setTimeout(() => {
          setWildFrog(null);
          setCatchAnim(false);
          setCatching(false);
          setCatchResult(null);
        }, 1200);
      }, 1200);
    } else {
      trackError(new Error('Cannot catch frog - conditions not met'));
    }
  };

  // Enhanced harvest function with referral integration
  const harvestPoints = () => {
    trackInteraction('harvest_points');
    
    // Prevent multiple harvests
    if (isHarvesting || harvestCooldown > 0) {
      trackError(new Error('Harvesting in progress or on cooldown'));
      return;
    }
    
    // Check if there are points to harvest
    if (points <= 0) {
      trackError(new Error('No points to harvest'));
      return;
    }
    
    // Check if enough time has passed since last harvest
    const timeSinceLastHarvest = Date.now() - lastHarvestTime;
    if (timeSinceLastHarvest < HARVEST_COOLDOWN) {
      const remainingCooldown = Math.ceil((HARVEST_COOLDOWN - timeSinceLastHarvest) / 1000);
      setHarvestCooldown(remainingCooldown);
      trackError(new Error(`Harvest cooldown: ${remainingCooldown}s remaining`));
      return;
    }
    
    // Start harvesting
    setIsHarvesting(true);
    
    try {
      const harvestBonus = frogs.some(f => f.ability?.type === "Harvest Bonus") ? 1.2 : 1;
      const pointsToAdd = Math.floor(points * harvestBonus);
      
      // Update total harvested
      setTotalHarvested((prev) => {
        const newTotal = prev + pointsToAdd;
        localStorage.setItem(`${userId}_totalHarvested`, newTotal.toString());
        return newTotal;
      });
      
      // Reset points to 0
      localStorage.setItem(`${userId}_harvesting_flag`, 'true');
      setPoints(0);
      localStorage.setItem(`${userId}_points`, '0');
      
      // Clear the harvest flag after a short delay
      setTimeout(() => {
        localStorage.removeItem(`${userId}_harvesting_flag`);
      }, 1000);
      
      // Update harvest time
      const currentTime = Date.now();
      setLastHarvestTime(currentTime);
      localStorage.setItem(`${userId}_lastHarvestTime`, currentTime.toString());
      
      // Show success animation
      setHarvested(true);
      setCaughtToday(0);
      
      // Process referral harvest bonus if user is logged in
      if (user?.id) {
        processReferralHarvestBonus(user.id, pointsToAdd)
          .then(({ success, bonusAmount, referrerId }) => {
            if (success && bonusAmount > 0) {
              console.log(`Referral bonus processed: ${bonusAmount} croaks to referrer ${referrerId}`);
              toast.success(`Your referrer earned ${bonusAmount} croaks from your harvest!`);
            }
          })
          .catch(error => {
            console.error('Error processing referral bonus:', error);
          });
        
        // Mark user as active for referral purposes
        markUserAsActive();
        
        // Sync with Supabase
        syncWithSupabase({
          points: 0,
          totalHarvested: totalHarvested + pointsToAdd,
          caughtToday: 0,
          frogs
        }).catch(error => {
          console.error('Error syncing harvest with Supabase:', error);
        });
      }
      
      console.log(`Harvested ${pointsToAdd} points (${points} base + ${Math.floor(points * (harvestBonus - 1))} bonus)`);
      
      // Update harvest count for weekly challenge
      const currentHarvestCount = parseInt(localStorage.getItem(`${userId}_harvestCount`) || '0', 10);
      localStorage.setItem(`${userId}_harvestCount`, (currentHarvestCount + 1).toString());
      localStorage.setItem(`${userId}_lastHarvestDate`, new Date().toISOString());
      
    } catch (error) {
      trackError(error);
      console.error('Error during harvest:', error);
    } finally {
      // Reset harvesting state after animation
      setTimeout(() => {
        setIsHarvesting(false);
        setHarvested(false);
      }, 1500);
    }
  };

  // Add harvest cooldown timer
  useEffect(() => {
    if (harvestCooldown > 0) {
      const timer = setInterval(() => {
        setHarvestCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [harvestCooldown]);

  // Save last harvest time to localStorage
  useEffect(() => {
    localStorage.setItem(`${userId}_lastHarvestTime`, lastHarvestTime.toString());
  }, [lastHarvestTime, userId]);

  const upgradeFrog = async (id: string) => {
    trackInteraction('upgrade_frog');
    
    setFrogs((currentFrogs) => {
      const updatedFrogs = currentFrogs.map((frog) => {
        if (
          frog.id === id &&
          frog.level < 10 &&
          frog.nextUpgradeCost !== null &&
          totalHarvested >= frog.nextUpgradeCost
        ) {
          // Deduct the upgrade cost
          const newTotalHarvested = totalHarvested - frog.nextUpgradeCost!;
          setTotalHarvested(newTotalHarvested);
          localStorage.setItem(`${userId}_totalHarvested`, newTotalHarvested.toString());
          
          // Return upgraded frog
          const upgradedFrog = {
            ...frog,
            level: frog.level + 1,
            rate: frog.rate + 1,
            nextUpgradeCost: frog.level >= 9 ? null : frog.nextUpgradeCost! + getRandomUpgradeIncrement(),
          };
          
          return upgradedFrog;
        }
        return frog;
      });

      // Immediately save to localStorage
      localStorage.setItem(`${userId}_frogs`, JSON.stringify(updatedFrogs));
      
      // Sync with Supabase if user is logged in
      if (user?.id) {
        syncWithSupabase({
          points,
          totalHarvested: totalHarvested - (currentFrogs.find(f => f.id === id)?.nextUpgradeCost ?? 0),
          caughtToday,
          frogs: updatedFrogs
        }).catch(error => {
          console.error('Error syncing upgrade with Supabase:', error);
        });
      }

      return updatedFrogs;
    });
  };

  // Add sync status monitoring
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced sync function with status tracking
  const syncWithSupabase = async (data: any) => {
    if (!user?.id) return;
    
    try {
      setSyncStatus(prev => ({ ...prev, syncError: null }));
      
      // Get current points from localStorage to ensure we don't lose them
      const currentPoints = localStorage.getItem(`${userId}_points`);
      const currentPointsValue = currentPoints ? parseInt(currentPoints, 10) : 0;
      
      // Use the higher value between current state and localStorage
      const pointsToSync = Math.max(data.points, currentPointsValue);
      
      const { error } = await supabase
        .from('frog_miner_data')
        .upsert({
          id: user.id,
          points: pointsToSync, // Use the higher value
          total_harvested: data.totalHarvested,
          caught_today: data.caughtToday,
          last_reset_date: new Date().toDateString(),
          frogs: data.frogs
        });

      if (error) throw error;
      
      setSyncStatus(prev => ({ 
        ...prev, 
        lastSync: Date.now(),
        syncError: null 
      }));
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  // Loading tips for better engagement
  const loadingTips = [
    "🐸 Each frog mines points automatically!",
    "🎯 Higher rarity frogs mine faster",
    "⚡ Upgrade your frogs to increase mining speed",
    "🌿 Catch new frogs daily to expand your collection",
    "💎 Epic frogs are rare but very powerful",
    "🔄 Harvest your points regularly",
    "🏆 Level up frogs to unlock their full potential",
    "🎁 Daily catch limit resets at midnight"
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % loadingTips.length);
      }, 3000);
      return () => clearInterval(tipInterval);
    }
  }, [isLoading]);

  // Add this debugging function to your component
  const debugDataState = () => {
    console.log('=== DEBUG DATA STATE ===');
    console.log('User ID:', userId);
    console.log('Frogs:', frogs);
    console.log('Points:', points);
    console.log('Total Harvested:', totalHarvested);
    console.log('Caught Today:', caughtToday);
    console.log('Catch Cooldown:', catchCooldown);
    console.log('Session Start:', sessionStartTime);
    console.log('Last Mining Time:', lastMiningTime);
    
    // Check localStorage
    console.log('localStorage frogs:', localStorage.getItem(`${userId}_frogs`));
    console.log('localStorage points:', localStorage.getItem(`${userId}_points`));
    console.log('localStorage totalHarvested:', localStorage.getItem(`${userId}_totalHarvested`));
    console.log('localStorage caughtToday:', localStorage.getItem(`${userId}_caughtToday`));
    console.log('localStorage cooldownEndTime:', localStorage.getItem(`${userId}_cooldownEndTime`));
    
    // Check Supabase sync status
    if (user?.id) {
      console.log('Supabase sync enabled for user:', user.id);
    } else {
      console.log('Guest mode - no Supabase sync');
    }
  };

  // Add this to your component for testing
  useEffect(() => {
    // Debug on mount and when key data changes
    debugDataState();
  }, [frogs, points, totalHarvested, caughtToday, catchCooldown]);

  // Add these validation functions
  const validateFrogData = (frog: any) => {
    const required = ['id', 'name', 'color', 'text', 'rate', 'rarity', 'emoji', 'level'];
    const missing = required.filter(field => !frog[field]);
    
    if (missing.length > 0) {
      console.error('Invalid frog data - missing fields:', missing, frog);
      return false;
    }
    
    if (frog.rate < 0 || frog.level < 1 || frog.level > 10) {
      console.error('Invalid frog stats:', frog);
      return false;
    }
    
    return true;
  };

  const validateGameState = () => {
    const errors = [];
    
    if (points < 0) errors.push('Points cannot be negative');
    if (totalHarvested < 0) errors.push('Total harvested cannot be negative');
    if (caughtToday < 0 || caughtToday > DAILY_LIMIT) errors.push('Invalid caught today count');
    if (catchCooldown < 0) errors.push('Cooldown cannot be negative');
    
    frogs.forEach((frog, index) => {
      if (!validateFrogData(frog)) {
        errors.push(`Invalid frog at index ${index}`);
      }
    });
    
    if (errors.length > 0) {
      console.error('Game state validation errors:', errors);
      return false;
    }
    
    return true;
  };

  // Add validation to key state changes
  useEffect(() => {
    validateGameState();
  }, [frogs, points, totalHarvested, caughtToday, catchCooldown]);

  // Add this testing panel (only in development)
  const TestingPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
        <div className="font-bold mb-2">Testing Panel</div>
        
        <div className="space-y-1 mb-3">
          <div>Frogs: {frogs.length}</div>
          <div>Points: {points}</div>
          <div>Total: {totalHarvested}</div>
          <div>Caught: {caughtToday}/{DAILY_LIMIT}</div>
          <div>Cooldown: {catchCooldown}s</div>
          <div>Mining Rate: {frogs.reduce((sum, f) => sum + f.rate, 0)}/s</div>
        </div>
        
        <div className="space-y-1">
          <Tooltip content="Add 1000 points for testing">
            <button 
              onClick={() => setPoints(prev => prev + 1000)}
              className="bg-blue-500 px-2 py-1 rounded text-xs"
            >
              +1000 Points
            </button>
          </Tooltip>
          <Tooltip content="Add 1000 croaks for testing">
            <button 
              onClick={() => setTotalHarvested(prev => prev + 1000)}
              className="bg-green-500 px-2 py-1 rounded text-xs ml-1"
            >
              +1000 Croaks
            </button>
          </Tooltip>
          <Tooltip content="Reset catch cooldown">
            <button 
              onClick={() => setCatchCooldown(0)}
              className="bg-yellow-500 px-2 py-1 rounded text-xs ml-1"
            >
              Reset Cooldown
            </button>
          </Tooltip>
          <Tooltip content="Reset daily catch limit">
            <button 
              onClick={() => setCaughtToday(0)}
              className="bg-purple-500 px-2 py-1 rounded text-xs ml-1"
            >
              Reset Daily
            </button>
          </Tooltip>
          <Tooltip content="Log current game state to console">
            <button 
              onClick={debugDataState}
              className="bg-red-500 px-2 py-1 rounded text-xs ml-1"
            >
              Debug Log
            </button>
          </Tooltip>
          <Tooltip content="Reset harvest cooldown">
            <button 
              onClick={() => setHarvestCooldown(0)}
              className="bg-orange-500 px-2 py-1 rounded text-xs ml-1"
            >
              Reset Harvest CD
            </button>
          </Tooltip>
          <Tooltip content="Add 500 points for testing">
            <button 
              onClick={() => setPoints(prev => prev + 500)}
              className="bg-indigo-500 px-2 py-1 rounded text-xs ml-1"
            >
              +500 Points
            </button>
          </Tooltip>
        </div>
        
        <div className="mt-2 text-gray-300">
          <div>Render: {performanceMetrics.renderCount}</div>
          <div>Avg: {performanceMetrics.averageRenderTime.toFixed(1)}ms</div>
        </div>
      </div>
    );
  };

  // Add backup and recovery functions
  const backupGameData = () => {
    const backup = {
      frogs,
      points,
      totalHarvested,
      caughtToday,
      sessionStartTime,
      lastMiningTime,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`${userId}_backup`, JSON.stringify(backup));
    console.log('Game data backed up');
  };

  // const recoverGameData = () => {
  //   const backup = localStorage.getItem(`${userId}_backup`);
  //   if (backup) {
  //     try {
  //       const data = JSON.parse(backup);
  //       setFrogs(data.frogs || []);
  //       setPoints(data.points || 0);
  //       setTotalHarvested(data.totalHarvested || 0);
  //       setCaughtToday(data.caughtToday || 0);
  //       setSessionStartTime(data.sessionStartTime || Date.now());
  //       setLastMiningTime(data.lastMiningTime || Date.now());
  //       console.log('Game data recovered from backup');
  //     } catch (error) {
  //       console.error('Failed to recover backup:', error);
  //     }
  //   }
  // };

  // Auto-backup every 5 minutes
  useEffect(() => {
    const interval = setInterval(backupGameData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [frogs, points, totalHarvested, caughtToday]);

  // Track first interaction
  useEffect(() => {
    if (uxMetrics.timeToFirstInteraction === 0 && !isLoading) {
      setUxMetrics(prev => ({
        ...prev,
        timeToFirstInteraction: Date.now() - sessionStartTime
      }));
    }
  }, [isLoading, sessionStartTime]);

  // Track interactions and errors
  const trackInteraction = (action: string) => {
    setUxMetrics(prev => ({
      ...prev,
      interactions: prev.interactions + 1
    }));
    
    console.log('User interaction:', action);
  };

  const trackError = (error: any) => {
    setUxMetrics(prev => ({
      ...prev,
      errors: prev.errors + 1,
      lastError: error.message
    }));
    
    console.error('User-facing error:', error);
  };

  const StatusIndicator = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <Tooltip content={syncStatus.isOnline ? 'Connected to internet' : 'No internet connection'}>
          <div className={`w-3 h-3 rounded-full ${syncStatus.isOnline ? 'bg-green-500' : 'bg-red-500'} cursor-help`} />
        </Tooltip>
        <Tooltip content={syncStatus.syncError ? `Sync error: ${syncStatus.syncError}` : 'Data synced successfully'}>
          <div className={`w-3 h-3 rounded-full ${syncStatus.syncError ? 'bg-yellow-500' : 'bg-green-500'} cursor-help`} />
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
      <StatusIndicator />
      {isLoading ? (
        <div className="flex flex-col items-center space-y-4 max-w-sm w-full">
          {/* Compact Loading Animation */}
          <div className="relative">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <GiFrog size={40} className="text-green-600 animate-bounce" />
              </div>
              
              {/* Fewer orbiting particles */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateX(30px)`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Combined Tips and Message */}
          <div className="text-center space-y-1">
            <div className="text-xs text-green-500 font-medium">DID YOU KNOW?</div>
            <div className="text-xs text-green-700 font-medium min-h-[2rem] flex items-center justify-center">
              {loadingTips[currentTipIndex]}
            </div>
            <div className="text-xs text-gray-500 animate-pulse">
              {loadingProgress < 50 ? "🐸 Hopping into your collection..." :
               loadingProgress < 80 ? "🌿 Gathering your frogs..." :
               loadingProgress < 100 ? "✨ Almost ready..." :
               "🎉 Welcome back!"}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6">
          {/* Session Info */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-200 shadow-sm">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <InfoTooltip content="Time since you started this session. Your progress is saved automatically!">
                  <span className="font-semibold text-blue-800 cursor-help">🕒 Session: {getSessionDuration()}</span>
                </InfoTooltip>
              </div>
              <div className="flex items-center gap-3">
                <InfoTooltip content="Total time your frogs have been actively mining points">
                  <span className="text-blue-600 cursor-help">⏱️ {getTotalMiningTime()}</span>
                </InfoTooltip>
                <SuccessTooltip content={`Your frogs are mining ${frogs.reduce((sum, f) => sum + f.rate, 0)} points every second!`}>
                  <span className="text-green-600 font-bold cursor-help">⚡ {frogs.reduce((sum, f) => sum + f.rate, 0)}/s</span>
                </SuccessTooltip>
              </div>
            </div>
          </div>

          {/* Points Display */}
          <div className="flex flex-col items-center mb-2">
            <div className="text-4xl font-bold text-green-800 flex items-center gap-2">
              <GiFrog size={32} className="text-green-600" />
              <InfoTooltip content="Points mined by your frogs. Each frog mines points per second based on their rarity and level!">
                <span className="cursor-help">{points}</span>
              </InfoTooltip>
            </div>
            <div className="text-sm text-green-600">Each frog mines points per second based on rarity!</div>
            {caughtToday >= DAILY_LIMIT && (
              <div className="relative group w-full flex flex-col items-center">
                <Tooltip 
                  content={
                    <div className="text-center">
                      <div className="font-bold mb-1">Harvest Your Points!</div>
                      <div className="text-xs">
                        {points === 0 ? "No points to harvest" :
                         isHarvesting ? "Processing harvest..." :
                         harvestCooldown > 0 ? `Cooldown: ${harvestCooldown}s remaining` :
                         "Collect your mined croaks!"}
                      </div>
                      {frogs.some(f => f.ability?.type === "Harvest Bonus") && (
                        <div className="text-xs text-yellow-300 mt-1">
                          🎁 Harvest Bonus: +20% points!
                        </div>
                      )}
                    </div>
                  }
                  maxWidth={250}
                >
                  <button
                    onClick={harvestPoints}
                    disabled={points === 0 || isHarvesting || harvestCooldown > 0}
                    className={`mt-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 hover:from-yellow-400 hover:to-yellow-500 text-yellow-900 font-bold py-2 px-4 rounded-xl shadow cartoon-btn transition-transform duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg flex items-center gap-2 relative ${
                      points === 0 || isHarvesting || harvestCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ minWidth: 140 }}
                  >
                    <span className="inline-block transition-transform duration-200 group-hover:animate-bounce">
                      <GiBasket size={36} className="mb-1" />
                    </span>
                    <span>
                      {isHarvesting ? "Harvesting..." : 
                       harvestCooldown > 0 ? `Wait ${harvestCooldown}s` : 
                       "Harvest"}
                    </span>
                  </button>
                </Tooltip>
                {harvested && (
                  <div className="text-green-700 mt-1 animate-bounce font-bold">
                    +{Math.floor(points * (frogs.some(f => f.ability?.type === "Harvest Bonus") ? 1.2 : 1))} Croaks Harvested!
                  </div>
                )}
                {harvestCooldown > 0 && (
                  <div className="text-yellow-600 mt-1 text-sm">
                    ⏱️ Cooldown: {harvestCooldown}s
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 mt-4">
            <Tooltip 
              content={
                <div className="text-center">
                  <div className="font-bold mb-1">Catch New Frogs!</div>
                  <div className="text-xs space-y-1">
                    {caughtToday >= DAILY_LIMIT ? (
                      <div className="text-red-300">Daily limit reached! Come back tomorrow.</div>
                    ) : catchCooldown > 0 ? (
                      <div className="text-yellow-300">Wait {catchCooldown}s before next catch</div>
                    ) : totalHarvested < catchCost ? (
                      <div className="text-red-300">Need {catchCost - totalHarvested} more croaks</div>
                    ) : (
                      <>
                        <div>Find wild frogs in the pond!</div>
                        <div>Higher rarity = better mining rate</div>
                        <div>Some frogs have special abilities</div>
                      </>
                    )}
                  </div>
                  {frogs.some(f => f.ability?.type === "Cooldown Reducer") && (
                    <div className="text-xs text-blue-300 mt-1">
                      ⚡ Cooldown Reducer: -10s catch time!
                    </div>
                  )}
                  {frogs.some(f => f.ability?.type === "Bonus Catch") && (
                    <div className="text-xs text-green-300 mt-1">
                      🎯 Bonus Catch: +10% success rate!
                    </div>
                  )}
                </div>
              }
              maxWidth={280}
            >
              <button
                onClick={findWildFrog}
                disabled={
                  caughtToday >= DAILY_LIMIT ||
                  catchCooldown > 0 ||
                  totalHarvested < catchCost
                }
                className={`flex flex-col items-center bg-blue-200 hover:bg-blue-300 text-blue-900 font-bold py-3 px-6 rounded-2xl shadow-lg transition-all duration-200 cartoon-btn
                  ${(caughtToday >= DAILY_LIMIT || catchCooldown > 0 || totalHarvested < catchCost) ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <GiFrog size={40} className="mb-1" />
                {catchCooldown > 0
                  ? `Wait ${catchCooldown}s`
                  : `Catch Frog`}
              </button>
            </Tooltip>
            <div className="text-xs text-gray-500">
              {caughtToday}/{DAILY_LIMIT} frogs caught today
            </div>
          </div>

          {wildFrog && (
            <div className={`relative flex flex-col items-center bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl p-6 shadow-2xl border-4 border-blue-300 transition-all duration-700 ${catchAnim ? "scale-110 rotate-2" : "scale-100"}`}>
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-green-200/20 rounded-3xl animate-pulse"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              
              {/* Frog display with enhanced styling */}
              <div className={`relative flex items-center justify-center w-24 h-24 rounded-full ${wildFrog.color} mb-4 text-5xl shadow-lg border-4 border-white transform transition-all duration-300 ${catchAnim ? "animate-bounce" : "hover:scale-110"}`}>
                {wildFrog.emoji}
                {/* Sparkle effects */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
              </div>
              
              {/* Frog info with better typography */}
              <div className="text-center mb-4">
                <div className={`font-black text-xl mb-1 ${wildFrog.text} drop-shadow-lg`}>
                  {wildFrog.name}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <InfoTooltip content={`${wildFrog.rarity} frogs are ${wildFrog.rarity === 'Common' ? 'easy to find' : wildFrog.rarity === 'Rare' ? 'uncommon but valuable' : 'very rare and powerful'}!`}>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${wildFrog.color} ${wildFrog.text} bg-white/80 cursor-help`}>
                      {wildFrog.rarity}
                    </span>
                  </InfoTooltip>
                  <InfoTooltip content={`This frog will mine ${wildFrog.rate} points every second when added to your collection!`}>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full cursor-help">
                      ⚡ {wildFrog.rate} pts/sec
                    </span>
                  </InfoTooltip>
                </div>
                
                {/* Ability display */}
                {wildFrog.ability && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-2 mb-3 border border-purple-200">
                    <div className="text-xs font-bold text-purple-800 flex items-center gap-1">
                      <span>🛠️</span>
                      <InfoTooltip content={wildFrog.ability.description}>
                        <span className="cursor-help">{wildFrog.ability.type}</span>
                      </InfoTooltip>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {wildFrog.ability.description}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced catch button */}
              <div className="relative">
                <button
                  onClick={catchFrog}
                  disabled={catching}
                  className={`relative bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white font-black py-3 px-8 rounded-2xl shadow-lg border-2 border-green-300 transform transition-all duration-200 ${
                    catching 
                      ? "opacity-75 cursor-not-allowed" 
                      : "hover:scale-105 hover:shadow-xl active:scale-95"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {catching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Catching...</span>
                      </>
                    ) : (
                      <>
                        <span>🎣</span>
                        <span>Catch!</span>
                      </>
                    )}
                  </span>
                  
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur opacity-50 animate-pulse"></div>
                </button>
              </div>
              
              {/* Enhanced status messages */}
              {catching && (
                <div className="mt-4 text-center">
                  <div className="text-lg font-bold text-blue-800 animate-pulse mb-2">
                    🎣 Trying to catch...
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.random() > 0.5 ? "The frog is being sneaky!" : "Almost got it!"}
                  </div>
                </div>
              )}
              
              {catchResult === "success" && (
                <div className="mt-4 text-center animate-bounce">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-xl font-bold text-green-700">Caught!</div>
                  <div className="text-sm text-green-600">Added to your collection!</div>
                </div>
              )}
              
              {catchResult === "fail" && (
                <div className="mt-4 text-center animate-shake">
                  <div className="text-3xl mb-2">😅</div>
                  <div className="text-xl font-bold text-red-600">Escaped!</div>
                  <div className="text-sm text-red-500">Better luck next time!</div>
                </div>
              )}
              
              {/* Catch chance indicator */}
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Catch Chance</div>
                <InfoTooltip content={`Base chance: ${Math.round((rarityCatchChances[wildFrog.rarity] ?? 0.5) * 100)}% + ${frogs.some(f => f.ability?.type === "Bonus Catch") ? "10% bonus" : "no bonus"} from abilities`}>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden cursor-help">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 transition-all duration-500"
                      style={{ 
                        width: `${(rarityCatchChances[wildFrog.rarity] ?? 0.5) * 100}%` 
                      }}
                    ></div>
                  </div>
                </InfoTooltip>
                <div className="text-xs text-gray-600 mt-1">
                  {Math.round((rarityCatchChances[wildFrog.rarity] ?? 0.5) * 100)}% success rate
                </div>
              </div>
            </div>
          )}

          <div>
          <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-lg text-green-800">Your Frogs</div>
              <InfoTooltip content="Total croaks you've harvested. Use these to upgrade your frogs!">
                <div className="text-md text-yellow-700 cursor-help">
                  Croaks: <span className="font-bold">{totalHarvested}</span>
                </div>
              </InfoTooltip>
            </div>
            {frogs.length === 0 ? (
              <div className="text-gray-400 italic">No frogs in your collection yet.</div>
            ) : (
              <>
                <div className="max-h-58 overflow-y-auto grid grid-cols-2 gap-3">
                  {frogs
                    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                    .map((frog: any, idx: number) => {
                    const upgradeCost = frog.nextUpgradeCost ?? 0;
                    const isMax = frog.level >= 10;
                    const canUpgrade = !isMax && totalHarvested >= upgradeCost;

                    return (
                      <div
                        key={frog.id + idx}
                        className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 ${frog.color} border-green-300 bg-gradient-to-br from-white/90 to-green-100`}
                      >
                        {/* Level badge */}
                        <InfoTooltip content={`Level ${frog.level} frog. Higher levels mine more points per second!`}>
                          <div className="absolute top-1 right-1 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow cursor-help">
                            Lv {frog.level}
                          </div>
                        </InfoTooltip>
                        <span className="text-3xl drop-shadow">{frog.emoji}</span>
                        <div className="w-full text-center">
                          <div className={`font-extrabold text-base ${frog.text} drop-shadow`}>{frog.name}</div>
                          <div className="text-xs font-semibold">
                            <InfoTooltip content={`${frog.rarity} frogs are ${frog.rarity === 'Common' ? 'easy to find' : frog.rarity === 'Rare' ? 'uncommon but valuable' : 'very rare and powerful'}!`}>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-black border border-gray-200 mr-1 cursor-help">{frog.rarity}</span>
                            </InfoTooltip>
                            <br/>
                            {frog.ability && (
                              <InfoTooltip content={frog.ability.description}>
                                <span className="ml-1 text-blue-700 cursor-help">🛠 {frog.ability.type}</span>
                              </InfoTooltip>
                            )}
                          </div>
                          <Tooltip 
                            content={
                              <div className="text-center">
                                <div className="font-bold mb-1">Upgrade Frog</div>
                                <div className="text-xs space-y-1">
                                  {isMax ? (
                                    <div className="text-green-300">This frog is at maximum level!</div>
                                  ) : !canUpgrade ? (
                                    <div className="text-red-300">Need {upgradeCost - totalHarvested} more croaks</div>
                                  ) : (
                                    <>
                                      <div>Cost: {upgradeCost} croaks</div>
                                      <div>New level: {frog.level + 1}</div>
                                      <div>New mining rate: {frog.rate + 1}/sec</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            }
                            maxWidth={200}
                          >
                            <button
                              className={`mt-2 w-full px-2 py-1 rounded-xl bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 text-yellow-900 font-extrabold text-xs shadow cartoon-btn border-2 border-yellow-400
                                ${!canUpgrade ? "opacity-50 cursor-not-allowed" : "hover:from-yellow-300 hover:to-yellow-400 hover:scale-105"}
                                transition-all duration-150`}
                              disabled={!canUpgrade}
                              onClick={() => upgradeFrog(frog.id)}
                            >
                              {isMax ? "Max" : `Upgrade (${upgradeCost} Croaks)`}
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination Controls */}
                {frogs.length > PAGE_SIZE && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Tooltip content="Go to previous page">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 rounded-lg font-bold text-sm transition-all duration-200 ${
                          page === 1 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-300 hover:bg-green-400 text-green-900 hover:scale-105'
                        }`}
                      >
                        ← Prev
                      </button>
                    </Tooltip>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(frogs.length / PAGE_SIZE) }, (_, i) => i + 1).map((pageNum) => (
                        <Tooltip key={pageNum} content={`Go to page ${pageNum}`}>
                          <button
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg font-bold text-sm transition-all duration-200 ${
                              page === pageNum
                                ? 'bg-green-600 text-white'
                                : 'bg-green-200 hover:bg-green-300 text-green-900 hover:scale-105'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                    
                    <Tooltip content="Go to next page">
                      <button
                        onClick={() => setPage(Math.min(Math.ceil(frogs.length / PAGE_SIZE), page + 1))}
                        disabled={page >= Math.ceil(frogs.length / PAGE_SIZE)}
                        className={`px-3 py-1 rounded-lg font-bold text-sm transition-all duration-200 ${
                          page >= Math.ceil(frogs.length / PAGE_SIZE)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-300 hover:bg-green-400 text-green-900 hover:scale-105'
                        }`}
                      >
                        Next →
                      </button>
                    </Tooltip>
                  </div>
                )}
                
                {/* Page Info */}
                {frogs.length > PAGE_SIZE && (
                  <div className="text-center text-sm text-gray-600 mt-2">
                    Page {page} of {Math.ceil(frogs.length / PAGE_SIZE)} • 
                    Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, frogs.length)} of {frogs.length} frogs
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <TestingPanel />
    </div>
  );
};