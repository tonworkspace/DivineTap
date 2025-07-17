import React, { useState, useEffect } from 'react';
import { GiCoins, GiLightningArc, GiUpgrade } from 'react-icons/gi';
import { useGameContext } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import './TaskCenter.css';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  max: number;
  completed: boolean;
  icon?: React.ReactNode;
  type: 'mining' | 'social' | 'airdrop';
}

interface TaskProgress {
  [key: string]: number;
}

export const TaskCenter: React.FC = () => {
  const { addGems } = useGameContext();
  const { user } = useAuth();
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = (baseKey: string, userId?: string) => {
    if (!userId) return baseKey; // Fallback for non-authenticated users
    return `${baseKey}_${userId}`;
  };
  
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({});
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentTaskModal, setCurrentTaskModal] = useState<{
    task: Task;
    type: 'social' | 'wallet' | 'invite';
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');

  // Load completed tasks from localStorage
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userCompletedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    const savedCompletedTasks = localStorage.getItem(userCompletedTasksKey);
    if (savedCompletedTasks) {
      try {
        setCompletedTasks(JSON.parse(savedCompletedTasks));
      } catch (error) {
        console.error('Error parsing completed tasks for user:', userId, error);
      }
    }
  }, [user?.id]);

  // Listen for localStorage changes and custom events to detect upgrade purchases
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'divineMiningGame' && e.newValue) {
        try {
          const gameState = JSON.parse(e.newValue);
          
          // Check multiple indicators for upgrade purchases
          let hasUpgrades = false;
          let upgradeDetails = {};
          
          // Method 1: Check upgrades array for any level > 0
          if (gameState.upgrades && Array.isArray(gameState.upgrades)) {
            const purchasedUpgrades = gameState.upgrades.filter((upgrade: any) => (upgrade.level || 0) > 0);
            hasUpgrades = purchasedUpgrades.length > 0;
            upgradeDetails = {
              method: 'upgrades_array',
              purchasedUpgrades: purchasedUpgrades.length,
              upgrades: gameState.upgrades.map((u: any) => ({ id: u.id, level: u.level }))
            };
          }
          
          // Method 2: Check upgradesPurchased counter
          if (!hasUpgrades && gameState.upgradesPurchased && gameState.upgradesPurchased > 0) {
            hasUpgrades = true;
            upgradeDetails = {
              method: 'upgradesPurchased_counter',
              upgradesPurchased: gameState.upgradesPurchased
            };
          }
          
          console.log('🔄 Storage change detected - Upgrade check:', {
            hasUpgrades,
            ...upgradeDetails
          });
          
          // If upgrades are detected and task is not completed, complete it
          if (hasUpgrades && !completedTasks.includes('buy_upgrade')) {
            console.log('🎉 Storage change triggered upgrade task completion!');
            completeTask('buy_upgrade', '25 Gems');
          }
        } catch (error) {
          console.error('Error parsing game state from storage change:', error);
        }
      }
    };

    // Listen for custom upgrade purchase events
    const handleUpgradePurchase = (e: CustomEvent) => {
      console.log('🎉 Custom upgrade purchase event detected:', e.detail);
      if (!completedTasks.includes('buy_upgrade')) {
        console.log('🎉 Custom event triggered upgrade task completion!');
        completeTask('buy_upgrade', '25 Gems');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('upgradePurchased', handleUpgradePurchase as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('upgradePurchased', handleUpgradePurchase as EventListener);
    };
  }, [completedTasks]);

  // Save completed tasks to localStorage
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userCompletedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    localStorage.setItem(userCompletedTasksKey, JSON.stringify(completedTasks));
  }, [completedTasks, user?.id]);

  // Calculate task progress
  useEffect(() => {
    const calculateProgress = () => {
      // Get current game state from localStorage
      const savedGameState = localStorage.getItem('divineMiningGame');
      let currentPoints = 0;
      let totalUpgrades = 0;
      let miningTime = 0;
      let hasUpgrades = false;

      if (savedGameState) {
        try {
          const gameState = JSON.parse(savedGameState);
          currentPoints = gameState.divinePoints || 0;
          
          // Calculate total upgrade levels and check for purchased upgrades
          if (gameState.upgrades && Array.isArray(gameState.upgrades)) {
            totalUpgrades = gameState.upgrades.reduce((sum: number, upgrade: any) => sum + (upgrade.level || 0), 0);
            
            // Check if any upgrade has been purchased (level > 0)
            const purchasedUpgrades = gameState.upgrades.filter((upgrade: any) => (upgrade.level || 0) > 0);
            hasUpgrades = purchasedUpgrades.length > 0;
            
            // Also check for upgradesPurchased field in game state
            if (gameState.upgradesPurchased && gameState.upgradesPurchased > 0) {
              hasUpgrades = true;
            }
            
            // Debug logging for upgrade detection
            console.log('🔍 TaskCenter Upgrade Debug:', {
              totalUpgrades,
              purchasedUpgrades: purchasedUpgrades.length,
              hasUpgrades,
              upgradesPurchased: gameState.upgradesPurchased || 0,
              upgrades: gameState.upgrades.map((u: any) => ({ id: u.id, level: u.level })),
              completedTasks: completedTasks
            });
          }
          
          // Calculate mining time - track cumulative mining time
          if (gameState.sessionStartTime) {
            let totalMiningTime = gameState.totalMiningTime || 0; // Get previously saved mining time
            
            // Add current session time if mining is active
            if (gameState.isMining) {
              const sessionTime = Date.now() - gameState.sessionStartTime;
              totalMiningTime += sessionTime / 1000; // Convert to seconds
            }
            
            miningTime = Math.min(totalMiningTime, 3600); // Cap at 1 hour for the task
          }
        } catch (error) {
          console.error('Error parsing game state for task progress:', error);
        }
      }

      const newProgress: TaskProgress = {
        mine_1000: Math.min(currentPoints, 1000),
        mine_10000: Math.min(currentPoints, 10000),
        mine_1hour: Math.floor(miningTime),
        buy_upgrade: hasUpgrades ? 1 : 0,
        follow_twitter: 0,
        join_telegram: 0,
        retweet_post: 0,
        submit_wallet: 0,
        invite_friend: 0,
        like_post: 0
      };

      setTaskProgress(newProgress);
      
      // Auto-complete mining tasks when they reach their goals
      if (newProgress.mine_1000 >= 1000 && !completedTasks.includes('mine_1000')) {
        console.log('🎉 Auto-completing mine_1000 task!');
        completeTask('mine_1000', '50 Gems');
      }
      if (newProgress.mine_10000 >= 10000 && !completedTasks.includes('mine_10000')) {
        console.log('🎉 Auto-completing mine_10000 task!');
        completeTask('mine_10000', '100 Gems');
      }
      if (newProgress.mine_1hour >= 3600 && !completedTasks.includes('mine_1hour')) {
        console.log('🎉 Auto-completing mine_1hour task!');
        completeTask('mine_1hour', '75 Gems');
      }
      if (newProgress.buy_upgrade >= 1 && !completedTasks.includes('buy_upgrade')) {
        console.log('🎉 Auto-completing buy_upgrade task!');
        completeTask('buy_upgrade', '25 Gems');
      }
      
      // Save updated mining time back to game state
      if (savedGameState) {
        try {
          const gameState = JSON.parse(savedGameState);
          const currentMiningTime = gameState.totalMiningTime || 0;
          const sessionTime = gameState.isMining && gameState.sessionStartTime ? 
            (Date.now() - gameState.sessionStartTime) / 1000 : 0;
          const newTotalMiningTime = currentMiningTime + sessionTime;
          
          // Only update if the time has changed significantly
          if (Math.abs(newTotalMiningTime - currentMiningTime) > 1) {
            gameState.totalMiningTime = newTotalMiningTime;
            localStorage.setItem('divineMiningGame', JSON.stringify(gameState));
          }
        } catch (error) {
          console.error('Error updating mining time in game state:', error);
        }
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000); // Update every 1 second for faster response

    return () => clearInterval(interval);
  }, [user?.id, completedTasks]);

  // Task definitions
  const tasks: Task[] = [
    {
      id: 'mine_1000',
      title: 'Mine 1,000 Points',
      description: 'Accumulate 1,000 divine points',
      reward: '50 Gems',
      progress: completedTasks.includes('mine_1000') ? 1000 : (taskProgress.mine_1000 || 0),
      max: 1000,
      completed: completedTasks.includes('mine_1000'),
      icon: <GiCoins className="text-yellow-400" />,
      type: 'mining'
    },
    {
      id: 'mine_10000',
      title: 'Mine 10,000 Points',
      description: 'Accumulate 10,000 divine points',
      reward: '100 Gems',
      progress: completedTasks.includes('mine_10000') ? 10000 : (taskProgress.mine_10000 || 0),
      max: 10000,
      completed: completedTasks.includes('mine_10000'),
      icon: <GiCoins className="text-yellow-400" />,
      type: 'mining'
    },
    {
      id: 'mine_1hour',
      title: 'Mine for 1 Hour',
      description: 'Keep mining active for 1 hour',
      reward: '75 Gems',
      progress: completedTasks.includes('mine_1hour') ? 3600 : (taskProgress.mine_1hour || 0),
      max: 3600,
      completed: completedTasks.includes('mine_1hour'),
      icon: <GiLightningArc className="text-green-400" />,
      type: 'mining'
    },
    {
      id: 'buy_upgrade',
      title: 'Buy Your First Upgrade',
      description: 'Purchase any mining upgrade',
      reward: '25 Gems',
      progress: completedTasks.includes('buy_upgrade') ? 1 : (taskProgress.buy_upgrade || 0),
      max: 1,
      completed: completedTasks.includes('buy_upgrade'),
      icon: <GiUpgrade className="text-blue-400" />,
      type: 'mining'
    },
    {
      id: 'follow_twitter',
      title: 'Follow on Twitter',
      description: 'Follow our official Twitter account',
      reward: '30 Gems',
      progress: completedTasks.includes('follow_twitter') ? 1 : (taskProgress.follow_twitter || 0),
      max: 1,
      completed: completedTasks.includes('follow_twitter'),
      icon: <span className="text-blue-400">🐦</span>,
      type: 'social'
    },
    {
      id: 'join_telegram',
      title: 'Join Telegram',
      description: 'Join our Telegram community',
      reward: '40 Gems',
      progress: completedTasks.includes('join_telegram') ? 1 : (taskProgress.join_telegram || 0),
      max: 1,
      completed: completedTasks.includes('join_telegram'),
      icon: <span className="text-blue-400">📱</span>,
      type: 'social'
    },
    {
      id: 'retweet_post',
      title: 'Retweet Latest Post',
      description: 'Retweet our latest announcement',
      reward: '35 Gems',
      progress: completedTasks.includes('retweet_post') ? 1 : (taskProgress.retweet_post || 0),
      max: 1,
      completed: completedTasks.includes('retweet_post'),
      icon: <span className="text-blue-400">🔄</span>,
      type: 'social'
    },
    {
      id: 'submit_wallet',
      title: 'Submit Wallet for Airdrop',
      description: 'Submit your wallet address for airdrop',
      reward: '100 Gems',
      progress: completedTasks.includes('submit_wallet') ? 1 : (taskProgress.submit_wallet || 0),
      max: 1,
      completed: completedTasks.includes('submit_wallet'),
      icon: <span className="text-purple-400">💎</span>,
      type: 'airdrop'
    },
    {
      id: 'invite_friend',
      title: 'Invite a Friend',
      description: 'Invite a friend to join the game',
      reward: '50 Gems',
      progress: completedTasks.includes('invite_friend') ? 1 : (taskProgress.invite_friend || 0),
      max: 1,
      completed: completedTasks.includes('invite_friend'),
      icon: <span className="text-green-400">👥</span>,
      type: 'social'
    },
    {
      id: 'like_post',
      title: 'Like Latest Post',
      description: 'Like our latest social media post',
      reward: '20 Gems',
      progress: completedTasks.includes('like_post') ? 1 : (taskProgress.like_post || 0),
      max: 1,
      completed: completedTasks.includes('like_post'),
      icon: <span className="text-red-400">❤️</span>,
      type: 'social'
    }
  ];

  // Handle task completion
  const completeTask = (taskId: string, reward: string) => {
    console.log(`🎯 Attempting to complete task: ${taskId}, already completed: ${completedTasks.includes(taskId)}`);
    
    if (!completedTasks.includes(taskId)) {
      // Extract gem amount from reward string
      const gemMatch = reward.match(/(\d+)\s*Gems?/);
      if (gemMatch) {
        const gemAmount = parseInt(gemMatch[1], 10);
        console.log(`💰 Adding ${gemAmount} gems for task completion`);
        addGems(gemAmount);
        setCompletedTasks(prev => {
          const newCompleted = [...prev, taskId];
          console.log(`✅ Updated completed tasks:`, newCompleted);
          return newCompleted;
        });
        setRewardMessage(`🎉 Task completed! +${gemAmount} Gems`);
        setShowRewardModal(true);
        
        // Force refresh task progress to update UI immediately
        setTimeout(() => {
          const calculateProgress = () => {
            const savedGameState = localStorage.getItem('divineMiningGame');
            let currentPoints = 0;
            let totalUpgrades = 0;
            let miningTime = 0;
            let hasUpgrades = false;

            if (savedGameState) {
              try {
                const gameState = JSON.parse(savedGameState);
                currentPoints = gameState.divinePoints || 0;
                
                if (gameState.upgrades && Array.isArray(gameState.upgrades)) {
                  totalUpgrades = gameState.upgrades.reduce((sum: number, upgrade: any) => sum + (upgrade.level || 0), 0);
                  const purchasedUpgrades = gameState.upgrades.filter((upgrade: any) => (upgrade.level || 0) > 0);
                  hasUpgrades = purchasedUpgrades.length > 0;
                }
                
                if (gameState.sessionStartTime) {
                  let totalMiningTime = gameState.totalMiningTime || 0;
                  if (gameState.isMining) {
                    const sessionTime = Date.now() - gameState.sessionStartTime;
                    totalMiningTime += sessionTime / 1000;
                  }
                  miningTime = Math.min(totalMiningTime, 3600);
                }
              } catch (error) {
                console.error('Error parsing game state for task progress refresh:', error);
              }
            }

            const newProgress: TaskProgress = {
              mine_1000: Math.min(currentPoints, 1000),
              mine_10000: Math.min(currentPoints, 10000),
              mine_1hour: Math.floor(miningTime),
              buy_upgrade: hasUpgrades ? 1 : 0,
              follow_twitter: 0,
              join_telegram: 0,
              retweet_post: 0,
              submit_wallet: 0,
              invite_friend: 0,
              like_post: 0
            };

            setTaskProgress(newProgress);
          };
          
          calculateProgress();
        }, 100);
      }
    } else {
      console.log(`⚠️ Task ${taskId} already completed, skipping`);
    }
  };

  // Show custom task modal
  const displayTaskModal = (task: Task, type: 'social' | 'wallet' | 'invite', message: string, confirmText: string, cancelText?: string, onConfirm?: () => void, onCancel?: () => void) => {
    setCurrentTaskModal({
      task,
      type,
      message,
      confirmText,
      cancelText,
      onConfirm: onConfirm || (() => completeTask(task.id, task.reward)),
      onCancel
    });
    setShowTaskModal(true);
  };

  // Handle social/airdrop task actions with custom UI
  const handleTaskAction = (task: Task) => {
    // Don't allow completion if already completed
    if (completedTasks.includes(task.id)) {
      displayTaskModal(task, 'invite', 'This task has already been completed!', 'OK');
      return;
    }

    switch (task.id) {
      case 'follow_twitter':
        // Open Twitter and show custom modal
        const twitterWindow = window.open('https://twitter.com/DivineTap', '_blank');
        if (twitterWindow) {
          setTimeout(() => {
            displayTaskModal(
              task,
              'social',
              'Did you follow @DivineTap on Twitter?',
              'Yes, Complete Task',
              'Not Yet',
              () => completeTask(task.id, task.reward),
              () => setShowTaskModal(false)
            );
          }, 3000);
        }
        break;
      case 'join_telegram':
        // Open Telegram and show custom modal
        const telegramWindow = window.open('https://t.me/DivineTap', '_blank');
        if (telegramWindow) {
          setTimeout(() => {
            displayTaskModal(
              task,
              'social',
              'Did you join our Telegram group?',
              'Yes, Complete Task',
              'Not Yet',
              () => completeTask(task.id, task.reward),
              () => setShowTaskModal(false)
            );
          }, 3000);
        }
        break;
      case 'retweet_post':
        // Open retweet and show custom modal
        const retweetWindow = window.open('https://twitter.com/intent/retweet?tweet_id=123456789', '_blank');
        if (retweetWindow) {
          setTimeout(() => {
            displayTaskModal(
              task,
              'social',
              'Did you retweet our latest post?',
              'Yes, Complete Task',
              'Not Yet',
              () => completeTask(task.id, task.reward),
              () => setShowTaskModal(false)
            );
          }, 3000);
        }
        break;
      case 'submit_wallet':
        // Show custom wallet input modal
        setWalletAddress('');
        setWalletError('');
        setShowWalletModal(true);
        break;
      case 'invite_friend':
        // Show referral instructions modal
        displayTaskModal(
          task,
          'invite',
          '👥 Share your referral link with friends!\n\nYou can find your referral link in the Referral System tab.',
          'Got It!',
          undefined,
          () => completeTask(task.id, task.reward)
        );
        break;
      case 'like_post':
        // Open like and show custom modal
        const likeWindow = window.open('https://twitter.com/intent/like?tweet_id=123456789', '_blank');
        if (likeWindow) {
          setTimeout(() => {
            displayTaskModal(
              task,
              'social',
              'Did you like our latest post?',
              'Yes, Complete Task',
              'Not Yet',
              () => completeTask(task.id, task.reward),
              () => setShowTaskModal(false)
            );
          }, 3000);
        }
        break;
      default:
        break;
    }
  };

  // Get mining status
  const getMiningStatus = () => {
    const savedGameState = localStorage.getItem('divineMiningGame');
    if (savedGameState) {
      try {
        const gameState = JSON.parse(savedGameState);
        if (gameState.isMining) {
          return 'ACTIVE';
        } else {
          return 'INACTIVE';
        }
      } catch (error) {
        console.error('Error parsing game state for mining status:', error);
        return 'UNKNOWN';
      }
    }
    return 'UNKNOWN';
  };

  // Filter tasks by type
  const miningTasks = tasks.filter(task => task.type === 'mining');
  const socialTasks = tasks.filter(task => task.type === 'social');
  const airdropTasks = tasks.filter(task => task.type === 'airdrop');

  const [activeTab, setActiveTab] = useState<'all' | 'mining' | 'social' | 'airdrop'>('all');

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'mining': return miningTasks;
      case 'social': return socialTasks;
      case 'airdrop': return airdropTasks;
      default: return tasks;
    }
  };

      return (
    <div className="task-center-container flex-1 p-custom space-y-2 overflow-y-auto game-scrollbar">
      {/* Header */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-mono font-bold tracking-wider text-sm">TASK CENTER</span>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-cyan-300 font-mono text-xs tracking-wider">
            Complete missions to earn bonus rewards
          </p>
        </div>
      </div>

      {/* Mining Status */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                  <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 font-mono font-bold text-xs tracking-wider">MINING STATUS</span>
            </div>
            <div className="text-right">
              <div className="text-cyan-300 font-mono text-xs tracking-wider">
                {getMiningStatus()}
              </div>
              {/* Debug button */}
              <button
                onClick={() => {
                  const savedGameState = localStorage.getItem('divineMiningGame');
                  if (savedGameState) {
                    try {
                      const gameState = JSON.parse(savedGameState);
                      console.log('🔍 TaskCenter Debug - Current Game State:', gameState);
                      console.log('🔍 TaskCenter Debug - Current Progress:', taskProgress);
                      console.log('🔍 TaskCenter Debug - Completed Tasks:', completedTasks);
                      
                      // Detailed upgrade info
                      const upgradeInfo = gameState.upgrades?.map((u: any) => `${u.id}: Level ${u.level}`).join('\n') || 'No upgrades found';
                      const purchasedUpgrades = gameState.upgrades?.filter((u: any) => (u.level || 0) > 0).length || 0;
                      
                      alert(`Debug Info:\nDivine Points: ${gameState.divinePoints || 0}\nTotal Upgrades: ${gameState.upgrades?.length || 0}\nPurchased Upgrades: ${purchasedUpgrades}\nMining: ${gameState.isMining ? 'Yes' : 'No'}\n\nUpgrade Details:\n${upgradeInfo}`);
                    } catch (error) {
                      console.error('Error parsing game state for debug:', error);
                      alert('Error reading game state');
                    }
                  } else {
                    alert('No game state found in localStorage');
                  }
                }}
                className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="Debug Task Center"
              >
                🐛
              </button>
              
              {/* Manual upgrade task test button */}
              <button
                onClick={() => {
                  if (!completedTasks.includes('buy_upgrade')) {
                    console.log('🧪 Manual test: Completing buy_upgrade task');
                    completeTask('buy_upgrade', '25 Gems');
                  } else {
                    alert('Upgrade task already completed!');
                  }
                }}
                className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                title="Test Upgrade Task"
              >
                ⚡
              </button>
              
              {/* Force check upgrades button */}
              <button
                onClick={() => {
                  const savedGameState = localStorage.getItem('divineMiningGame');
                  if (savedGameState) {
                    try {
                      const gameState = JSON.parse(savedGameState);
                      let hasUpgrades = false;
                      let upgradeDetails = {};
                      
                      // Check multiple indicators
                      if (gameState.upgrades && Array.isArray(gameState.upgrades)) {
                        const purchasedUpgrades = gameState.upgrades.filter((upgrade: any) => (upgrade.level || 0) > 0);
                        hasUpgrades = purchasedUpgrades.length > 0;
                        upgradeDetails = {
                          method: 'upgrades_array',
                          purchasedUpgrades: purchasedUpgrades.length,
                          upgrades: gameState.upgrades.map((u: any) => ({ id: u.id, level: u.level }))
                        };
                      }
                      
                      if (!hasUpgrades && gameState.upgradesPurchased && gameState.upgradesPurchased > 0) {
                        hasUpgrades = true;
                        upgradeDetails = {
                          method: 'upgradesPurchased_counter',
                          upgradesPurchased: gameState.upgradesPurchased
                        };
                      }
                      
                      console.log('🔍 Force check upgrades:', {
                        hasUpgrades,
                        ...upgradeDetails,
                        completedTasks: completedTasks
                      });
                      
                      if (hasUpgrades && !completedTasks.includes('buy_upgrade')) {
                        console.log('🎉 Force check triggered upgrade task completion!');
                        completeTask('buy_upgrade', '25 Gems');
                      } else if (hasUpgrades && completedTasks.includes('buy_upgrade')) {
                        alert('Upgrade task already completed!');
                      } else {
                        alert('No upgrades found. Purchase an upgrade first!');
                      }
                    } catch (error) {
                      console.error('Error parsing game state for force check:', error);
                      alert('Error reading game state');
                    }
                  } else {
                    alert('No game state found!');
                  }
                }}
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Force Check Upgrades"
              >
                🔍
              </button>
            </div>
          </div>
      </div>

      {/* Task Type Tabs */}
      <div className="flex gap-1">
        {[
          { id: 'all', name: 'All', count: tasks.length },
          { id: 'mining', name: 'Mining', count: miningTasks.length },
          { id: 'social', name: 'Social', count: socialTasks.length },
          { id: 'airdrop', name: 'Airdrop', count: airdropTasks.length }
        ].map(({ id, name, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                : 'bg-black/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            {name} ({count})
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {getCurrentTasks().map((task) => {
          const isCompleted = task.completed || (task.progress >= task.max && task.type === 'mining');
          
          return (
            <div key={task.id} className={`relative bg-black/40 backdrop-blur-xl border rounded-lg p-3 transition-all duration-300 ${
              isCompleted 
                ? 'bg-green-500/20 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                : 'bg-gray-800/50 border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {task.icon}
                  <div>
                    <h3 className={`font-mono font-bold text-sm tracking-wider ${
                      isCompleted ? 'text-green-400' : 'text-cyan-300'
                    }`}>
                      {task.title}
                    </h3>
                    <p className="text-gray-400 text-xs font-mono">{task.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-mono text-sm font-bold tracking-wider">{task.reward}</div>
                  {isCompleted && (
                    <div className="text-green-400 text-xs font-mono tracking-wider">✓ COMPLETED</div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${(task.progress / task.max) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400 font-mono tracking-wider">
                  {task.id === 'mine_1hour' ? (
                    `Progress: ${Math.floor(task.progress / 60)}m ${task.progress % 60}s / 60m 0s`
                  ) : (
                    `Progress: ${task.progress.toLocaleString()}/${task.max.toLocaleString()}`
                  )}
                </div>
                
                {/* Action Button */}
                {task.type === 'mining' ? (
                  // Mining tasks complete automatically
                  <div className="text-xs text-gray-500 font-mono tracking-wider">
                    AUTO-TRACKED
                  </div>
                ) : (
                  // Social/Airdrop tasks need manual action
                  <button
                    onClick={() => handleTaskAction(task)}
                    disabled={isCompleted}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400'
                    }`}
                  >
                    {isCompleted ? 'COMPLETED' : 'ACTION'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-sm mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            
            <h3 className="text-white font-mono font-bold text-xl mb-4 tracking-wider">TASK COMPLETED!</h3>
            
            <div className="bg-cyan-500/20 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/30 mb-6">
              <p className="text-cyan-200 text-sm font-mono tracking-wider">{rewardMessage}</p>
            </div>
            
            <button
              onClick={() => setShowRewardModal(false)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            >
              AWESOME! ✨
            </button>
          </div>
        </div>
      )}

      {/* Custom Task Modal */}
      {showTaskModal && currentTaskModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-md mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            {/* Close button */}
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl transition-colors duration-300"
            >
              ×
            </button>
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
            
            {/* Task Icon */}
            <div className="text-4xl mb-4">
              {currentTaskModal.type === 'social' && '🌐'}
              {currentTaskModal.type === 'wallet' && '💎'}
              {currentTaskModal.type === 'invite' && '👥'}
            </div>
            
            {/* Task Title */}
            <h3 className="text-white font-mono font-bold text-lg mb-3 tracking-wider">
              {currentTaskModal.task.title}
            </h3>
            
            {/* Task Message */}
            <div className="bg-cyan-500/10 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/20 mb-6">
              <p className="text-cyan-200 text-sm font-mono tracking-wider whitespace-pre-line">
                {currentTaskModal.message}
              </p>
            </div>
            
            {/* Reward Info */}
            <div className="bg-yellow-500/10 backdrop-blur-xl rounded-lg p-3 border border-yellow-400/20 mb-6">
              <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider">
                REWARD: {currentTaskModal.task.reward}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  currentTaskModal.onConfirm();
                  setShowTaskModal(false);
                }}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center gap-2"
              >
                <span>✅</span>
                <span>{currentTaskModal.confirmText}</span>
              </button>
              
              {currentTaskModal.cancelText && (
                <button
                  onClick={() => {
                    currentTaskModal.onCancel?.();
                    setShowTaskModal(false);
                  }}
                  className="bg-gradient-to-r from-gray-600 to-gray-500 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-gray-500 hover:to-gray-400 transition-all duration-300 flex items-center gap-2"
                >
                  <span>❌</span>
                  <span>{currentTaskModal.cancelText}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Wallet Input Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-xl p-6 text-center max-w-md mx-4 border border-cyan-400/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            {/* Close button */}
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl transition-colors duration-300"
            >
              ×
            </button>
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-cyan-400"></div>
            
            {/* Wallet Icon */}
            <div className="text-4xl mb-4">💎</div>
            
            {/* Title */}
            <h3 className="text-white font-mono font-bold text-lg mb-3 tracking-wider">
              SUBMIT WALLET FOR AIRDROP
            </h3>
            
            {/* Description */}
            <div className="bg-cyan-500/10 backdrop-blur-xl rounded-lg p-4 border border-cyan-400/20 mb-6">
              <p className="text-cyan-200 text-sm font-mono tracking-wider">
                Enter your wallet address to receive exclusive airdrops and rewards!
              </p>
            </div>
            
            {/* Wallet Input */}
            <div className="mb-6">
              <label className="block text-cyan-400 font-mono font-bold text-sm mb-2 tracking-wider">
                WALLET ADDRESS
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => {
                  setWalletAddress(e.target.value);
                  setWalletError(''); // Clear error when user types
                }}
                placeholder="Enter your wallet address here..."
                className="w-full bg-black/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white font-mono text-sm tracking-wider placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
                autoFocus
              />
              {walletError && (
                <div className="mt-2 text-red-400 font-mono text-xs tracking-wider">
                  ❌ {walletError}
                </div>
              )}
            </div>
            
            {/* Reward Info */}
            <div className="bg-yellow-500/10 backdrop-blur-xl rounded-lg p-3 border border-yellow-400/20 mb-6">
              <div className="text-yellow-400 font-mono font-bold text-sm tracking-wider">
                REWARD: 100 Gems
              </div>
              <div className="text-yellow-300 font-mono text-xs tracking-wider mt-1">
                + Access to exclusive airdrops
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  const trimmedAddress = walletAddress.trim();
                  if (!trimmedAddress) {
                    setWalletError('Please enter a wallet address');
                    return;
                  }
                  if (trimmedAddress.length < 10) {
                    setWalletError('Wallet address must be at least 10 characters');
                    return;
                  }
                  if (trimmedAddress.length > 100) {
                    setWalletError('Wallet address is too long');
                    return;
                  }
                  
                  // Success - close modal and show success message
                  setShowWalletModal(false);
                  displayTaskModal(
                    tasks.find(t => t.id === 'submit_wallet')!,
                    'invite',
                    '✅ Wallet address submitted successfully!\n\nYou will receive 100 Gems and access to exclusive airdrops!',
                    'Awesome!'
                  );
                }}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] flex items-center gap-2"
              >
                <span>💎</span>
                <span>Submit Wallet</span>
              </button>
              
              <button
                onClick={() => setShowWalletModal(false)}
                className="bg-gradient-to-r from-gray-600 to-gray-500 text-white font-mono font-bold py-3 px-6 rounded-lg tracking-wider hover:from-gray-500 hover:to-gray-400 transition-all duration-300 flex items-center gap-2"
              >
                <span>❌</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 