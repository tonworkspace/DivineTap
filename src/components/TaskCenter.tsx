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

  // Save completed tasks to localStorage
  useEffect(() => {
    const userId = user?.id ? user.id.toString() : undefined;
    const userCompletedTasksKey = getUserSpecificKey('divineMiningCompletedTasks', userId);
    localStorage.setItem(userCompletedTasksKey, JSON.stringify(completedTasks));
  }, [completedTasks, user?.id]);

  // Calculate task progress
  useEffect(() => {
    const calculateProgress = () => {
      const userId = user?.id ? user.id.toString() : undefined;
      const userPointsKey = getUserSpecificKey('divineMiningPoints', userId);
      const userUpgradesKey = getUserSpecificKey('divineMiningUpgrades', userId);
      
      const savedPoints = localStorage.getItem(userPointsKey);
      const currentPoints = savedPoints ? parseInt(savedPoints, 10) : 0;
      
      const savedUpgrades = localStorage.getItem(userUpgradesKey);
      let totalUpgrades = 0;
      if (savedUpgrades) {
        try {
          const upgrades = JSON.parse(savedUpgrades);
          totalUpgrades = upgrades.reduce((sum: number, upgrade: any) => sum + upgrade.level, 0);
        } catch (error) {
          totalUpgrades = 0;
        }
      }

      const newProgress: TaskProgress = {
        mine_1000: Math.min(currentPoints, 1000),
        mine_10000: Math.min(currentPoints, 10000),
        mine_1hour: 0, // This would need to be tracked separately
        buy_upgrade: Math.min(totalUpgrades, 1),
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
    const interval = setInterval(calculateProgress, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Task definitions
  const tasks: Task[] = [
    {
      id: 'mine_1000',
      title: 'Mine 1,000 Points',
      description: 'Accumulate 1,000 divine points',
      reward: '50 Gems',
      progress: taskProgress.mine_1000 || 0,
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
      progress: taskProgress.mine_10000 || 0,
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
      progress: taskProgress.mine_1hour || 0,
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
      progress: taskProgress.buy_upgrade || 0,
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
      progress: taskProgress.follow_twitter || 0,
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
      progress: taskProgress.join_telegram || 0,
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
      progress: taskProgress.retweet_post || 0,
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
      progress: taskProgress.submit_wallet || 0,
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
      progress: taskProgress.invite_friend || 0,
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
      progress: taskProgress.like_post || 0,
      max: 1,
      completed: completedTasks.includes('like_post'),
      icon: <span className="text-red-400">❤️</span>,
      type: 'social'
    }
  ];

  // Handle task completion
  const completeTask = (taskId: string, reward: string) => {
    if (!completedTasks.includes(taskId)) {
      // Extract gem amount from reward string
      const gemMatch = reward.match(/(\d+)\s*Gems?/);
      if (gemMatch) {
        const gemAmount = parseInt(gemMatch[1], 10);
        addGems(gemAmount);
        setCompletedTasks(prev => [...prev, taskId]);
        setRewardMessage(`🎉 Task completed! +${gemAmount} Gems`);
        setShowRewardModal(true);
      }
    }
  };

  // Handle social/airdrop task actions
  const handleTaskAction = (task: Task) => {
    switch (task.id) {
      case 'follow_twitter':
        window.open('https://twitter.com/DivineTap', '_blank');
        break;
      case 'join_telegram':
        window.open('https://t.me/DivineTap', '_blank');
        break;
      case 'retweet_post':
        window.open('https://twitter.com/intent/retweet?tweet_id=123456789', '_blank');
        break;
      case 'submit_wallet':
        // This would typically open a form or modal
        alert('Wallet submission form would open here');
        break;
      case 'invite_friend':
        // Open referral system by changing tab
        window.location.hash = '#spells';
        break;
      case 'like_post':
        window.open('https://twitter.com/intent/like?tweet_id=123456789', '_blank');
        break;
      default:
        break;
    }
    
    // Mark as completed for social/airdrop tasks
    if (task.type === 'social' || task.type === 'airdrop') {
      completeTask(task.id, task.reward);
    }
  };

  // Get mining status
  const getMiningStatus = () => {
    const savedGameState = localStorage.getItem('divineMiningGame');
    if (savedGameState) {
      try {
        const gameState = JSON.parse(savedGameState);
        return gameState.isMining ? 'ACTIVE' : 'INACTIVE';
      } catch (error) {
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
                  Progress: {task.progress.toLocaleString()}/{task.max.toLocaleString()}
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
    </div>
  );
}; 