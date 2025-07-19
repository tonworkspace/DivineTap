import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

interface GameState {
  divinePoints?: number;
  isMining?: boolean;
  sessionStartTime?: number;
  upgrades?: Array<{ id: string; level: number }>;
  upgradesPurchased?: number;
}

export const TaskCenter: React.FC = () => {
  const { addGems } = useGameContext();
  const { user } = useAuth();
  
  // Centralized state management
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress>({});
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());
  const [lastCompletionTime, setLastCompletionTime] = useState<{ [key: string]: number }>({});
  const [gameState, setGameState] = useState<GameState>({});
  const [miningTime, setMiningTime] = useState<number>(0);
  
  // Modal states
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
  
  // Refs for tracking
  const autoCompletedTasksRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  
  // Helper function to get user-specific localStorage keys
  const getUserSpecificKey = useCallback((baseKey: string, userId?: string) => {
    if (!userId) return baseKey;
    return `${baseKey}_${userId}`;
  }, []);

  // Safe localStorage operations
  const safeGetItem = useCallback((key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return defaultValue;
    }
  }, []);

  const safeSetItem = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Optimized mining time calculation
  const calculateMiningTime = useCallback((currentGameState: GameState, userId: string) => {
    if (!currentGameState.isMining || !currentGameState.sessionStartTime) {
      return 0;
    }

    const miningTimeKey = getUserSpecificKey('miningTime', userId);
    const lastUpdateKey = getUserSpecificKey('lastMiningUpdate', userId);
    
    const now = Date.now();
    const storedTime = parseFloat(localStorage.getItem(miningTimeKey) || '0');
    const lastUpdate = parseFloat(localStorage.getItem(lastUpdateKey) || '0');
    
    // Calculate time delta more accurately
    const timeDelta = lastUpdate > 0 ? 
      (now - lastUpdate) / 1000 : 
      (now - currentGameState.sessionStartTime) / 1000;
    
    const newTotalTime = storedTime + Math.max(0, timeDelta);
    
    // Update storage
    localStorage.setItem(miningTimeKey, newTotalTime.toString());
    localStorage.setItem(lastUpdateKey, now.toString());
    
    return Math.min(newTotalTime, 3600); // Cap at 1 hour
  }, [getUserSpecificKey]);

  // Centralized game state reader
  const readGameState = useCallback((): GameState => {
    const savedGameState = safeGetItem('divineMiningGame', {});
    return {
      divinePoints: savedGameState.divinePoints || 0,
      isMining: savedGameState.isMining || false,
      sessionStartTime: savedGameState.sessionStartTime || 0,
      upgrades: savedGameState.upgrades || [],
      upgradesPurchased: savedGameState.upgradesPurchased || 0
    };
  }, [safeGetItem]);

  // Optimized progress calculation
  const calculateProgress = useCallback(() => {
    if (!user?.id) return;

    const currentGameState = readGameState();
    const userId = user.id.toString();
    
    // Calculate mining time
    const currentMiningTime = calculateMiningTime(currentGameState, userId);
    
    // Check for upgrades
    const hasUpgrades = currentGameState.upgrades?.some(upgrade => (upgrade.level || 0) > 0) || 
                       (currentGameState.upgradesPurchased || 0) > 0;

    const newProgress: TaskProgress = {
      mine_1000: Math.min(currentGameState.divinePoints || 0, 1000),
      mine_10000: Math.min(currentGameState.divinePoints || 0, 10000),
      mine_1hour: Math.floor(currentMiningTime),
      buy_upgrade: hasUpgrades ? 1 : 0,
      follow_twitter: 0,
      join_telegram: 0,
      retweet_post: 0,
      submit_wallet: 0,
      invite_friend: 0,
      like_post: 0
    };

    // Update states
    setGameState(currentGameState);
    setMiningTime(currentMiningTime);
    setTaskProgress(newProgress);

    // Auto-complete tasks
    const tasksToComplete = [
      { id: 'mine_1000', condition: newProgress.mine_1000 >= 1000, reward: '50 Gems' },
      { id: 'mine_10000', condition: newProgress.mine_10000 >= 10000, reward: '100 Gems' },
      { id: 'mine_1hour', condition: newProgress.mine_1hour >= 3600, reward: '75 Gems' },
      { id: 'buy_upgrade', condition: newProgress.buy_upgrade >= 1, reward: '25 Gems' }
    ];

    tasksToComplete.forEach(({ id, condition, reward }) => {
      if (condition && 
          !completedTasks.includes(id) && 
          !processingTasks.has(id) &&
          !autoCompletedTasksRef.current.has(id)) {
        console.log(`🎉 Auto-completing task: ${id}`);
        autoCompletedTasksRef.current.add(id);
        completeTask(id, reward);
      }
    });

  }, [user?.id, readGameState, calculateMiningTime, completedTasks, processingTasks]);

  // Optimized completeTask function
  const completeTask = useCallback((taskId: string, reward: string) => {
    const now = Date.now();
    
    // Comprehensive validation
    if (completedTasks.includes(taskId)) {
      console.log(`⚠️ Task ${taskId} already completed`);
      return;
    }
    
    if (processingTasks.has(taskId)) {
      console.log(`⚠️ Task ${taskId} is being processed`);
      return;
    }
    
    // Rate limiting
    const lastCompletion = lastCompletionTime[taskId];
    if (lastCompletion && (now - lastCompletion) < 1000) {
      console.log(`⚠️ Task ${taskId} rate limited`);
      return;
    }
    
    // Mark as processing
    setProcessingTasks(prev => new Set(prev).add(taskId));
    setLastCompletionTime(prev => ({ ...prev, [taskId]: now }));
    
    try {
      const gemMatch = reward.match(/(\d+)\s*Gems?/);
      if (gemMatch) {
        const gemAmount = parseInt(gemMatch[1], 10);
        
        // Atomic state update
        setCompletedTasks(prev => {
          if (prev.includes(taskId)) {
            console.log(`⚠️ Task ${taskId} was completed by another process`);
            autoCompletedTasksRef.current.delete(taskId);
            return prev;
          }
          
          const newCompleted = [...prev, taskId];
          
          // Add gems and show reward
          addGems(gemAmount, `task_${taskId}`);
          setRewardMessage(`🎉 Task completed! +${gemAmount} Gems`);
          setShowRewardModal(true);
          
          // Clean up auto-completion tracking
          autoCompletedTasksRef.current.delete(taskId);
          
          return newCompleted;
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      // Always clean up processing state
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [completedTasks, processingTasks, lastCompletionTime, addGems]);

  // Load completed tasks on mount
  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id.toString();
    const completedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    const savedTasks = safeGetItem(completedTasksKey, []);
    
    setCompletedTasks(savedTasks);
    
    // Clean up auto-completion refs
    savedTasks.forEach((taskId: string) => {
      autoCompletedTasksRef.current.delete(taskId);
    });
    
    isInitializedRef.current = true;
  }, [user?.id, getUserSpecificKey, safeGetItem]);

  // Save completed tasks
  useEffect(() => {
    if (!user?.id || !isInitializedRef.current) return;

    const userId = user.id.toString();
    const completedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    safeSetItem(completedTasksKey, completedTasks);
  }, [completedTasks, user?.id, getUserSpecificKey, safeSetItem]);

  // Optimized polling with better cleanup
  useEffect(() => {
    if (!user?.id) return;

    // Initial calculation
    calculateProgress();

    // Set up optimized interval (every 2 seconds instead of 1)
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Throttle updates to prevent excessive calculations
      if (now - lastUpdateRef.current < 2000) return;
      
      lastUpdateRef.current = now;
      calculateProgress();
    }, 2000);

    // Event listeners for immediate updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'divineMiningGame') {
        calculateProgress();
      }
    };

    const handleUpgradePurchase = (e: CustomEvent) => {
      console.log('🎉 Upgrade purchased event detected:', e.detail);
      // Force immediate progress calculation
      setTimeout(calculateProgress, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('upgradePurchased', handleUpgradePurchase as EventListener);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('upgradePurchased', handleUpgradePurchase as EventListener);
    };
  }, [user?.id, calculateProgress]);

  // Memoized task definitions
  const tasks: Task[] = useMemo(() => [
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
  ], [completedTasks, taskProgress]);

  // Rest of the component methods remain the same...
  const displayTaskModal = useCallback((task: Task, type: 'social' | 'wallet' | 'invite', message: string, confirmText: string, cancelText?: string, onConfirm?: () => void, onCancel?: () => void) => {
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
  }, [completeTask]);

  const handleTaskAction = useCallback((task: Task) => {
    if (completedTasks.includes(task.id)) {
      displayTaskModal(task, 'invite', 'This task has already been completed!', 'OK');
      return;
    }
    
    if (processingTasks.has(task.id)) {
      displayTaskModal(task, 'invite', 'This task is currently being processed. Please wait...', 'OK');
      return;
    }

    switch (task.id) {
      case 'follow_twitter':
        window.open('https://x.com/DivineTaps', '_blank');
        setTimeout(() => {
          displayTaskModal(
            task,
            'social',
            'Did you follow @DivineTaps on Twitter?',
            'Yes, Complete Task',
            'Not Yet',
            () => completeTask(task.id, task.reward),
            () => setShowTaskModal(false)
          );
        }, 3000);
        break;
      case 'join_telegram':
        window.open('https://t.me/DivineTaps', '_blank');
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
        break;
      case 'retweet_post':
        window.open('https://twitter.com/intent/retweet?tweet_id=1946298009924288617', '_blank');
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
        break;
      case 'submit_wallet':
        setWalletAddress('');
        setWalletError('');
        setShowWalletModal(true);
        break;
      case 'invite_friend':
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
        window.open('https://x.com/intent/like?tweet_id=1946298009924288617', '_blank');
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
        break;
      default:
        break;
    }
  }, [completedTasks, processingTasks, displayTaskModal, completeTask]);

  const getMiningStatus = useCallback(() => {
    return gameState.isMining ? 'ACTIVE' : 'INACTIVE';
  }, [gameState.isMining]);

  // Filter tasks by type
  const miningTasks = useMemo(() => tasks.filter(task => task.type === 'mining'), [tasks]);
  const socialTasks = useMemo(() => tasks.filter(task => task.type === 'social'), [tasks]);
  const airdropTasks = useMemo(() => tasks.filter(task => task.type === 'airdrop'), [tasks]);

  const [activeTab, setActiveTab] = useState<'all' | 'mining' | 'social' | 'airdrop'>('all');

  const getCurrentTasks = useCallback(() => {
    switch (activeTab) {
      case 'mining': return miningTasks;
      case 'social': return socialTasks;
      case 'airdrop': return airdropTasks;
      default: return tasks;
    }
  }, [activeTab, miningTasks, socialTasks, airdropTasks, tasks]);

  // Debug function for development
  const resetMiningTimeTracking = useCallback(() => {
    if (!user?.id) return;
    
    const userId = user.id.toString();
    const miningTimeKey = getUserSpecificKey('miningTime', userId);
    const lastUpdateKey = getUserSpecificKey('lastMiningUpdate', userId);
    
    localStorage.removeItem(miningTimeKey);
    localStorage.removeItem(lastUpdateKey);
    
    setMiningTime(0);
    autoCompletedTasksRef.current.delete('mine_1hour');
    
    console.log('🔄 Mining time tracking reset');
  }, [user?.id, getUserSpecificKey]);

  // Expose debug functions (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).resetMiningTime = resetMiningTimeTracking;
      (window as any).debugTaskCenter = () => {
        console.log('Task Center Debug:', {
          gameState,
          taskProgress,
          completedTasks,
          processingTasks: Array.from(processingTasks),
          miningTime,
          autoCompleted: Array.from(autoCompletedTasksRef.current)
        });
      };
    }
  }, [resetMiningTimeTracking, gameState, taskProgress, completedTasks, processingTasks, miningTime]);

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
            {import.meta.env.DEV && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => {
                    (window as any).debugTaskCenter?.();
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  title="Debug Task Center"
                >
                  🔍
                </button>
                <button
                  onClick={() => {
                    if (confirm('Reset mining time tracking?')) {
                      resetMiningTimeTracking();
                      alert('Mining time tracking reset!');
                    }
                  }}
                  className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                  title="Reset Mining Time"
                >
                  🔄
                </button>
              </div>
            )}
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
          const isCompleted = task.completed;
          const isProcessing = processingTasks.has(task.id);
          
          return (
            <div key={task.id} className={`relative bg-black/40 backdrop-blur-xl border rounded-lg p-3 transition-all duration-300 ${
              isCompleted 
                ? 'bg-green-500/20 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                : isProcessing
                ? 'bg-orange-500/20 border-orange-400 shadow-[0_0_20px_rgba(255,165,0,0.1)]'
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
                  {isProcessing && (
                    <div className="text-orange-400 text-xs font-mono tracking-wider animate-pulse">⏳ PROCESSING</div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min((task.progress / task.max) * 100, 100)}%` }}
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
                  <div className="text-xs text-gray-500 font-mono tracking-wider">
                    AUTO-TRACKED
                  </div>
                ) : (
                  <button
                    onClick={() => handleTaskAction(task)}
                    disabled={isCompleted || isProcessing}
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : isProcessing
                        ? 'bg-orange-600 text-orange-200 cursor-not-allowed animate-pulse'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400'
                    }`}
                  >
                    {isCompleted ? 'COMPLETED' : isProcessing ? 'PROCESSING...' : 'ACTION'}
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