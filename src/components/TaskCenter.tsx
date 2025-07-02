import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { GiFrog, GiBasket, GiShare, GiCheckMark, GiLoad } from 'react-icons/gi';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'social' | 'community' | 'referral' | 'daily';
  status: 'available' | 'completed' | 'claimed' | 'pending_review';
  emoji: string;
  requirements: string[];
  cooldown?: number; // in hours
  lastCompleted?: string;
  submissionRequired?: boolean;
  submissionType?: 'screenshot' | 'link' | 'text' | 'none';
}

interface TaskProgress {
  totalTasks: number;
  completedTasks: number;
  totalRewards: number;
  claimedRewards: number;
}


const TaskCenter = () => {
  const { user, refreshSTKBalance } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<TaskProgress>({
    totalTasks: 0,
    completedTasks: 0,
    totalRewards: 0,
    claimedRewards: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Task submission modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionData, setSubmissionData] = useState<{
    type: 'screenshot' | 'link' | 'text';
    content: string;
    file: File | null;
    telegramUsername: string;
    twitterUsername: string;
  }>({
    type: 'text',
    content: '',
    file: null,
    telegramUsername: '',
    twitterUsername: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add tracking for clicked links
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set());

  // Add mining progress tracking
  const [miningProgress, setMiningProgress] = useState({
    totalMined: 0,
    harvestCount: 0,
    lastHarvestDate: ''
  });

  // Add last login date tracking
  const [lastLoginDate, setLastLoginDate] = useState<string>(() => {
    return localStorage.getItem(`${user?.id || 'guest'}_lastLoginDate`) || '';
  });

  // Initialize default tasks with submission requirements
  const defaultTasks: Task[] = [
    {
      id: 'join_telegram',
      title: 'Join Telegram Community',
      description: 'Join our official Telegram group to stay updated with the latest news and announcements.',
      reward: 50,
      type: 'social',
      status: 'available',
      emoji: '📱',
      requirements: ['Join @CroakKingdom_news'],
      submissionRequired: true,
      submissionType: 'screenshot'
    },
    {
      id: 'follow_twitter',
      title: 'Follow on Twitter',
      description: 'Follow us on Twitter to get the latest updates about CroakKingdom and upcoming features.',
      reward: 30,
      type: 'social',
      status: 'available',
      emoji: '🐦',
      requirements: ['Follow @CroakKingdom'],
      submissionRequired: true,
      submissionType: 'screenshot'
    },
    {
      id: 'retweet_announcement',
      title: 'Retweet Announcement',
      description: 'Help spread the word about CroakKingdom by retweeting our latest announcement.',
      reward: 25,
      type: 'social',
      status: 'available',
      emoji: '🔄',
      requirements: ['Retweet pinned post', 'Use #CroakKingdom'],
      submissionRequired: true,
      submissionType: 'link'
    },
    {
      id: 'daily_login',
      title: 'Daily Login',
      description: 'Log in to CroakKingdom daily to earn bonus croaks. Consistency is key!',
      reward: 10,
      type: 'daily',
      status: 'available',
      emoji: '🌅',
      requirements: ['Login to the app'],
      cooldown: 24, // 24 hours
      submissionRequired: false,
      submissionType: 'none'
    },
    {
      id: 'invite_friend',
      title: 'Invite a Friend',
      description: 'Invite a friend to join CroakKingdom and both of you will earn bonus rewards!',
      reward: 100,
      type: 'referral',
      status: 'available',
      emoji: '👥',
      requirements: ['Share referral link', 'Friend joins successfully'],
      submissionRequired: true,
      submissionType: 'text'
    },
    {
      id: 'community_feedback',
      title: 'Community Feedback',
      description: 'Share your thoughts and suggestions about CroakKingdom in our community chat.',
      reward: 40,
      type: 'community',
      status: 'available',
      emoji: '💭',
      requirements: ['Post feedback in Telegram'],
      submissionRequired: true,
      submissionType: 'screenshot'
    },
    {
      id: 'share_screenshot',
      title: 'Share Your Progress',
      description: 'Share a screenshot of your frog collection or mining progress on social media.',
      reward: 35,
      type: 'social',
      status: 'available',
      emoji: '📸',
      requirements: ['Post screenshot', 'Tag @CroakKingdom'],
      submissionRequired: true,
      submissionType: 'link'
    },
    {
      id: 'weekly_challenge',
      title: 'Weekly Mining Challenge',
      description: 'Complete the weekly mining challenge to earn extra croaks and special rewards.',
      reward: 150,
      type: 'community',
      status: 'available',
      emoji: '🏆',
      requirements: ['Mine 1000 croaks this week', 'Harvest 5 times'],
      submissionRequired: true,
      submissionType: 'screenshot'
    }
  ];

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  // Separate useEffect for daily login check that runs after tasks are loaded
  useEffect(() => {
    if (tasks.length > 0) {
      checkDailyLogin();
    }
  }, [tasks, user?.id]);

  // Fix the checkDailyLogin function
  const checkDailyLogin = () => {
    if (!user?.id || tasks.length === 0) return;

    const today = new Date().toDateString();
    const storedLastLogin = localStorage.getItem(`${user.id}_lastLoginDate`);
    
    if (storedLastLogin !== today) {
      localStorage.setItem(`${user.id}_lastLoginDate`, today);
      setLastLoginDate(today);
      
      // Check if daily login task exists and is available
      const dailyLoginTask = tasks.find(t => t.id === 'daily_login');
      if (dailyLoginTask && dailyLoginTask.status === 'available') {
        // Auto-complete the daily login task
        handleDailyLoginComplete();
      }
    }
  };

  // Fix the handleDailyLoginComplete function to update the correct task
  const handleDailyLoginComplete = async () => {
    if (!user?.id) return;

    try {
      // Update task status to completed
      const { error: taskError } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: 'daily_login',
          status: 'completed',
          last_completed: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error updating daily login task:', taskError);
        return;
      }

      // Get current user data to see what balance field exists
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('total_sbt, total_harvested, points')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      // Determine which balance field to update
      let balanceUpdate: any = {};
      const reward = 10; // Daily login reward

      if (currentUser.total_harvested !== null && currentUser.total_harvested !== undefined) {
        balanceUpdate.total_harvested = (currentUser.total_harvested || 0) + reward;
      } else if (currentUser.total_sbt !== null && currentUser.total_sbt !== undefined) {
        balanceUpdate.total_sbt = (currentUser.total_sbt || 0) + reward;
      } else {
        balanceUpdate.total_sbt = reward;
      }

      balanceUpdate.last_sbt_claim = new Date().toISOString();

      const { error: balanceError } = await supabase
        .from('users')
        .update(balanceUpdate)
        .eq('id', user.id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Log the reward
      await supabase
        .from('earning_history')
        .insert({
          user_id: user.id,
          amount: reward,
          type: 'daily_login',
          created_at: new Date().toISOString()
        });

      // Update local state with the correct lastCompleted timestamp
      const updatedTasks = tasks.map(t => 
        t.id === 'daily_login' ? { 
          ...t, 
          status: 'completed' as const,
          lastCompleted: new Date().toISOString()
        } : t
      );
      setTasks(updatedTasks);
      calculateProgress(updatedTasks);

      // Refresh user data
      await refreshSTKBalance();

      // Show success message
      toast.success(`Daily login bonus! You earned ${reward} Croaks! 🌅`);
      
    } catch (error) {
      console.error('Error completing daily login:', error);
    }
  };

  const loadTasks = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load user's task progress from database
      const { data: taskProgress, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading task progress:', error);
      }

      // Merge default tasks with user progress
      const userTaskMap = new Map();
      if (taskProgress) {
        taskProgress.forEach(progress => {
          userTaskMap.set(progress.task_id, progress);
        });
      }

      const updatedTasks = defaultTasks.map(task => {
        const userProgress = userTaskMap.get(task.id);
        if (userProgress) {
          return {
            ...task,
            status: userProgress.status,
            lastCompleted: userProgress.last_completed
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      calculateProgress(updatedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks(defaultTasks);
      calculateProgress(defaultTasks);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (taskList: Task[]) => {
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(task => task.status === 'completed' || task.status === 'claimed').length;
    const totalRewards = taskList.reduce((sum, task) => sum + task.reward, 0);
    const claimedRewards = taskList
      .filter(task => task.status === 'claimed')
      .reduce((sum, task) => sum + task.reward, 0);

    setProgress({
      totalTasks,
      completedTasks,
      totalRewards,
      claimedRewards
    });
  };

  const openSubmissionModal = (task: Task) => {
    setSelectedTask(task);
    setSubmissionData({
      type: task.submissionType === 'none' ? 'text' : (task.submissionType || 'text'),
      content: '',
      file: null,
      telegramUsername: '',
      twitterUsername: ''
    });
    setShowSubmissionModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setSubmissionData(prev => ({ ...prev, file }));
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const submitTask = async () => {
    if (!user?.id || !selectedTask || isSubmitting) return;

    // Validate telegram username
    if (!submissionData.telegramUsername.trim()) {
      toast.error('Please provide your Telegram username');
      return;
    }

    // Validate twitter username for social tasks
    if (selectedTask.type === 'social' && !submissionData.twitterUsername.trim()) {
      toast.error('Please provide your Twitter username');
      return;
    }

    setIsSubmitting(true);
    try {
      let submissionContent = '';

      // Handle different submission types
      switch (submissionData.type) {
        case 'screenshot':
          if (!submissionData.file) {
            toast.error('Please upload a screenshot');
            return;
          }
          submissionContent = await uploadImageToStorage(submissionData.file);
          break;
        
        case 'link':
          if (!submissionData.content.trim()) {
            toast.error('Please provide a valid link');
            return;
          }
          // Validate URL
          try {
            new URL(submissionData.content);
          } catch {
            toast.error('Please provide a valid URL');
            return;
          }
          submissionContent = submissionData.content;
          break;
        
        case 'text':
          if (!submissionData.content.trim()) {
            toast.error('Please provide submission details');
            return;
          }
          submissionContent = submissionData.content;
          break;
      }

      // Create task submission record with both usernames
      const { error: submissionError } = await supabase
        .from('task_submissions')
        .insert({
          user_id: user.id,
          task_id: selectedTask.id,
          submission_type: submissionData.type,
          submission_data: submissionContent,
          telegram_username: submissionData.telegramUsername.trim(),
          twitter_username: submissionData.twitterUsername.trim(),
          status: 'pending'
        });

      if (submissionError) {
        console.error('Error creating submission:', submissionError);
        toast.error('Failed to submit task. Please try again.');
        return;
      }

      // Update task status to pending review
      const { error: taskError } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: selectedTask.id,
          status: 'pending_review',
          last_completed: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error updating task status:', taskError);
      }

      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === selectedTask.id ? { ...t, status: 'pending_review' as const } : t
      );
      setTasks(updatedTasks);
      calculateProgress(updatedTasks);

      setShowSubmissionModal(false);
      setSelectedTask(null);
      setSubmissionData({ type: 'text', content: '', file: null, telegramUsername: '', twitterUsername: '' });

      toast.success('Task submitted successfully! We will review your submission and reward you with Croaks once approved.');
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openExternalLink = (url: string, taskId: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Mark this link as clicked
    setClickedLinks(prev => new Set([...prev, taskId]));
    
    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem(`${user?.id || 'guest'}_clickedLinks`) || '[]');
    if (!stored.includes(taskId)) {
      stored.push(taskId);
      localStorage.setItem(`${user?.id || 'guest'}_clickedLinks`, JSON.stringify(stored));
    }
  };

  // Load clicked links on component mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`${user?.id || 'guest'}_clickedLinks`) || '[]');
    setClickedLinks(new Set(stored));
  }, [user?.id]);

  const handleTaskComplete = async (taskId: string) => {
    if (!user?.id || isProcessing) return;

    setIsProcessing(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        toast.error('Task not found');
        return;
      }

      // Check if social task requires link to be clicked first
      if (task.type === 'social' && !clickedLinks.has(taskId)) {
        toast.error('Please click "Open Link" first before completing this task!');
        setIsProcessing(false);
        return;
      }

      // Special handling for daily login task
      if (taskId === 'daily_login') {
        const today = new Date().toDateString();
        const lastCompleted = task.lastCompleted ? new Date(task.lastCompleted).toDateString() : '';
        
        if (lastCompleted === today) {
          toast.error('Daily login already completed today! Come back tomorrow.');
          setIsProcessing(false);
          return;
        }
        
        // Auto-complete daily login
        await handleDailyLoginComplete();
        setIsProcessing(false);
        return;
      }

      // Check if task requires submission
      if (task.submissionRequired) {
        openSubmissionModal(task);
        return;
      }

      // For tasks that don't require submission, complete immediately
      await completeTaskAndReward(taskId, task.reward);
      
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeTaskAndReward = async (taskId: string, reward: number) => {
    if (!user?.id) return;

    try {
      // Check cooldown for tasks that have it
      const task = tasks.find(t => t.id === taskId);
      if (task?.cooldown && task.lastCompleted) {
        const lastCompleted = new Date(task.lastCompleted);
        const cooldownEnd = new Date(lastCompleted.getTime() + task.cooldown * 60 * 60 * 1000);
        const now = new Date();
        
        if (now < cooldownEnd) {
          const remainingHours = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
          toast.error(`Task on cooldown! Available in ${remainingHours} hours.`);
          return;
        }
      }

      // Update task status to completed
      const { error: taskError } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          status: 'completed',
          last_completed: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error updating task status:', taskError);
        throw taskError;
      }

      // Get current user data to see what balance field exists
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('total_sbt, total_harvested')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      // Determine which balance field to update based on what exists
      let balanceUpdate: any = {};
      let currentBalance = 0;

      if (currentUser.total_harvested !== null && currentUser.total_harvested !== undefined) {
        // Use total_harvested (matches FrogsMiner)
        currentBalance = currentUser.total_harvested || 0;
        balanceUpdate.total_harvested = currentBalance + reward;
      } else if (currentUser.total_sbt !== null && currentUser.total_sbt !== undefined) {
        // Fallback to total_sbt
        currentBalance = currentUser.total_sbt || 0;
        balanceUpdate.total_sbt = currentBalance + reward;
      } else {
        // Default to total_sbt if no field exists
        balanceUpdate.total_sbt = reward;
      }

      // Add last claim timestamp
      balanceUpdate.last_sbt_claim = new Date().toISOString();

      const { error: balanceError } = await supabase
        .from('users')
        .update(balanceUpdate)
        .eq('id', user.id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        throw balanceError;
      }

      // Log the reward in earning_history with a default stake_id for task rewards
      const { error: logError } = await supabase
        .from('earning_history')
        .insert({
          user_id: user.id,
          amount: reward,
          type: 'task_completion',
          stake_id: 0, // Use 0 as default for task rewards (non-staking activities)
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Error logging reward:', logError);
        // Don't throw error here as the main reward was already given
      }

      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status: 'completed' as const, lastCompleted: new Date().toISOString() } : t
      );
      setTasks(updatedTasks);
      calculateProgress(updatedTasks);

      // Refresh user data to show updated balance
      await refreshSTKBalance();

      toast.success(`Task completed! You earned ${reward} Croaks! 🎉`);
      
    } catch (error) {
      console.error('Error completing task and rewarding:', error);
      throw error;
    }
  };

  const handleClaimReward = async (taskId: string) => {
    if (!user?.id || isProcessing) return;

    setIsProcessing(true);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        toast.error('Task not found');
        return;
      }

      // Check if task is actually completed
      if (task.status !== 'completed') {
        toast.error('Task must be completed before claiming reward');
        return;
      }

      // Get current user data to see what balance field exists
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('total_sbt, total_harvested')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      // Determine which balance field to update based on what exists
      let balanceUpdate: any = {};
      let currentBalance = 0;

      if (currentUser.total_harvested !== null && currentUser.total_harvested !== undefined) {
        // Use total_harvested (matches FrogsMiner)
        currentBalance = currentUser.total_harvested || 0;
        balanceUpdate.total_harvested = currentBalance + task.reward;
      } else if (currentUser.total_sbt !== null && currentUser.total_sbt !== undefined) {
        // Fallback to total_sbt
        currentBalance = currentUser.total_sbt || 0;
        balanceUpdate.total_sbt = currentBalance + task.reward;
      } else {
        // Default to total_sbt if no field exists
        balanceUpdate.total_sbt = task.reward;
      }

      // Add last claim timestamp
      balanceUpdate.last_sbt_claim = new Date().toISOString();

      const { error: balanceError } = await supabase
        .from('users')
        .update(balanceUpdate)
        .eq('id', user.id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        throw balanceError;
      }

      // Log the reward in earning_history with a default stake_id for task rewards
      const { error: logError } = await supabase
        .from('earning_history')
        .insert({
          user_id: user.id,
          amount: task.reward,
          type: 'task_claim',
          stake_id: 0, // Use 0 as default for task rewards (non-staking activities)
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Error logging reward:', logError);
        // Don't throw error here as the main reward was already given
      }

      // Update task status to claimed
      const { error: taskError } = await supabase
        .from('user_tasks')
        .update({ status: 'claimed' })
        .eq('user_id', user.id)
        .eq('task_id', taskId);

      if (taskError) {
        console.error('Error updating task to claimed:', taskError);
        toast.error('Failed to mark task as claimed');
        return;
      }

      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status: 'claimed' as const } : t
      );
      setTasks(updatedTasks);
      calculateProgress(updatedTasks);

      // Refresh user data to show updated balance
      await refreshSTKBalance();

      toast.success(`Successfully claimed ${task.reward} Croaks! 🎉`);

    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load mining progress from localStorage
  useEffect(() => {
    const loadMiningProgress = () => {
      if (!user?.id) return;
      
      const userId = user.id;
      
      // Get total harvested from localStorage (matches FrogsMiner)
      const totalHarvested = parseInt(localStorage.getItem(`${userId}_totalHarvested`) || '0', 10);
      
      // Get harvest count from localStorage
      const harvestCount = parseInt(localStorage.getItem(`${userId}_harvestCount`) || '0', 10);
      
      // Get last harvest date
      const lastHarvestDate = localStorage.getItem(`${userId}_lastHarvestDate`) || '';
      
      setMiningProgress({
        totalMined: totalHarvested,
        harvestCount,
        lastHarvestDate
      });
    };
    
    loadMiningProgress();
    
    // Listen for storage changes (when user harvests in FrogsMiner)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('_totalHarvested') || e.key?.includes('_harvestCount')) {
        loadMiningProgress();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(loadMiningProgress, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.id]);

  // Check weekly mining challenge completion
  useEffect(() => {
    const checkWeeklyMiningChallenge = () => {
      if (!user?.id || tasks.length === 0) return;
      
      const weeklyTask = tasks.find(t => t.id === 'weekly_challenge');
      if (!weeklyTask || weeklyTask.status !== 'available') return;
      
      // Check if user meets the requirements
      const hasMinedEnough = miningProgress.totalMined >= 1000;
      const hasHarvestedEnough = miningProgress.harvestCount >= 5;
      
      if (hasMinedEnough && hasHarvestedEnough) {
        // Auto-complete the weekly challenge
        handleWeeklyChallengeComplete();
      }
    };
    
    checkWeeklyMiningChallenge();
  }, [miningProgress, tasks, user?.id]);

  // Handle weekly challenge completion
  const handleWeeklyChallengeComplete = async () => {
    if (!user?.id) return;

    try {
      // Update task status to completed
      const { error: taskError } = await supabase
        .from('user_tasks')
        .upsert({
          user_id: user.id,
          task_id: 'weekly_challenge',
          status: 'completed',
          last_completed: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error updating weekly challenge task:', taskError);
        return;
      }

      // Get current user data to see what balance field exists
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('total_sbt, total_harvested, points')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      // Determine which balance field to update
      let balanceUpdate: any = {};
      const reward = 150; // Weekly challenge reward

      if (currentUser.total_harvested !== null && currentUser.total_harvested !== undefined) {
        balanceUpdate.total_harvested = (currentUser.total_harvested || 0) + reward;
      } else if (currentUser.total_sbt !== null && currentUser.total_sbt !== undefined) {
        balanceUpdate.total_sbt = (currentUser.total_sbt || 0) + reward;
      } else {
        balanceUpdate.total_sbt = reward;
      }

      balanceUpdate.last_sbt_claim = new Date().toISOString();

      const { error: balanceError } = await supabase
        .from('users')
        .update(balanceUpdate)
        .eq('id', user.id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Log the reward
      await supabase
        .from('earning_history')
        .insert({
          user_id: user.id,
          amount: reward,
          type: 'weekly_challenge',
          created_at: new Date().toISOString()
        });

      // Update local state
      const updatedTasks = tasks.map(t => 
        t.id === 'weekly_challenge' ? { 
          ...t, 
          status: 'completed' as const,
          lastCompleted: new Date().toISOString()
        } : t
      );
      setTasks(updatedTasks);
      calculateProgress(updatedTasks);

      // Refresh user data
      await refreshSTKBalance();

      // Show success message
      toast.success(`Weekly Mining Challenge completed! You earned ${reward} Croaks! 🏆`);
      
    } catch (error) {
      console.error('Error completing weekly challenge:', error);
    }
  };

  // Update the weekly challenge task description to show progress
  const getWeeklyChallengeTask = () => {
    const weeklyTask = defaultTasks.find(t => t.id === 'weekly_challenge');
    if (!weeklyTask) return weeklyTask;
    
    const progressMined = Math.min(miningProgress.totalMined, 1000);
    const progressHarvests = Math.min(miningProgress.harvestCount, 5);
    
    return {
      ...weeklyTask,
      description: `Complete the weekly mining challenge to earn extra croaks and special rewards. Progress: ${progressMined}/1000 croaks mined, ${progressHarvests}/5 harvests completed.`,
      requirements: [
        `Mine 1000 croaks this week (${progressMined}/1000)`,
        `Harvest 5 times (${progressHarvests}/5)`
      ]
    };
  };

  // Loading state - Similar to FrogsMiner
  if (isLoading) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
        <div className="flex flex-col items-center space-y-4 max-w-sm w-full">
          <div className="relative">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <GiFrog size={40} className="text-green-600 animate-bounce" />
              </div>
              
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

          <div className="text-center space-y-1">
            <div className="text-xs text-green-500 font-medium">LOADING TASK CENTER</div>
            <div className="text-xs text-green-700 font-medium">
              🎁 Preparing your missions...
            </div>
            <div className="text-xs text-gray-500 animate-pulse">
              Loading available tasks...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center p-custom">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Stats - Similar to FrogsMiner */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-green-700 font-bold mb-1">Tasks Completed</h3>
                <p className="text-2xl font-bold text-green-800">
                  {progress.completedTasks}/{progress.totalTasks}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <GiCheckMark size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-2 w-full bg-white/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full shadow transition-all duration-500 ease-out" 
                style={{ width: `${(progress.completedTasks / progress.totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm text-purple-700 font-bold mb-1">Total Rewards</h3>
                <p className="text-2xl font-bold text-purple-800">
                  {progress.claimedRewards} Croaks
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <GiBasket size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Task Categories */}
        <div className="bg-white/50 rounded-2xl p-4 border-2 border-green-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              <GiFrog size={20} className="text-green-600" />
              Available Tasks
            </h3>
            <div className="text-sm text-green-600">
              {tasks.filter(t => t.status === 'available').length} Available
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task, index) => {
              // Calculate cooldown status for daily tasks
              const isOnCooldown = task.cooldown && task.lastCompleted;
              let cooldownRemaining = 0;
              let canComplete = true;
              
              if (isOnCooldown && task.lastCompleted && task.cooldown) {
                const lastCompleted = new Date(task.lastCompleted);
                const cooldownEnd = new Date(lastCompleted.getTime() + task.cooldown * 60 * 60 * 1000);
                const now = new Date();
                
                if (now < cooldownEnd) {
                  cooldownRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
                  canComplete = false;
                }
              }

              // Check if social task link has been clicked
              const hasClickedLink = clickedLinks.has(task.id);
              const canCompleteSocialTask = task.type !== 'social' || hasClickedLink;

              // Get weekly challenge task with updated progress
              const displayTask = task.id === 'weekly_challenge' ? getWeeklyChallengeTask() : task;

              // Add null check before using displayTask
              if (!displayTask) return null;

              return (
                <div 
                  key={task.id} 
                  className={`bg-gradient-to-br ${
                    index % 4 === 0 ? 'from-blue-50 to-green-50' : 
                    index % 4 === 1 ? 'from-green-50 to-blue-50' : 
                    index % 4 === 2 ? 'from-purple-50 to-pink-50' :
                    'from-yellow-50 to-orange-50'
                  } rounded-2xl p-4 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{displayTask.emoji}</div>
                      <div>
                        <h3 className="text-lg font-bold text-green-800">{displayTask.title}</h3>
                        <p className="text-sm text-green-600">{displayTask.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-800">+{displayTask.reward}</div>
                      <div className="text-xs text-green-600">Croaks</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xs font-medium text-green-700 mb-2">Requirements:</div>
                    <ul className="space-y-1">
                      {displayTask.requirements.map((req, idx) => (
                        <li key={idx} className="text-xs text-green-600 flex items-center gap-2">
                          <GiCheckMark size={12} className="text-green-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Progress bar for weekly challenge */}
                  {task.id === 'weekly_challenge' && task.status === 'available' && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-green-700 mb-2">Progress:</div>
                      <div className="space-y-3">
                        {/* Mining Progress */}
                        <div>
                          <div className="flex justify-between items-center text-xs text-green-600 mb-1">
                            <span>Mining Progress</span>
                            <span className="font-bold">{Math.min(miningProgress.totalMined, 1000)}/1000</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(miningProgress.totalMined / 1000, 1) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        {/* Harvest Progress */}
                        <div>
                          <div className="flex justify-between items-center text-xs text-blue-600 mb-1">
                            <span>Harvest Progress</span>
                            <span className="font-bold">{Math.min(miningProgress.harvestCount, 5)}/5</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(miningProgress.harvestCount / 5, 1) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {task.status === 'available' && (
                      <>
                        {task.type === 'social' && (
                          <button
                            onClick={() => {
                              if (task.id === 'join_telegram') {
                                openExternalLink('https://t.me/CroakKingdom', task.id);
                              } else if (task.id === 'follow_twitter') {
                                openExternalLink('https://twitter.com/CroakKingdom', task.id);
                              } else if (task.id === 'retweet_announcement') {
                                openExternalLink('https://twitter.com/intent/retweet?tweet_id=1926319009055514828&text=Check%20out%20%40CroakKingdom%20%23CroakKingdom%20%F0%9F%8D%8A', task.id);
                              }
                            }}
                            className={`flex-1 px-3 py-2 ${
                              hasClickedLink 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105`}
                          >
                            {hasClickedLink ? '✅ Link Opened' : 'Open Link'}
                          </button>
                        )}
                        <button
                          onClick={() => handleTaskComplete(task.id)}
                          disabled={isProcessing || lastLoginDate === new Date().toDateString()}
                          className={`flex-1 px-3 py-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-green-400 ${
                            !canComplete || !canCompleteSocialTask ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isProcessing ? 'Processing...' : lastLoginDate === new Date().toDateString() ? 'Already Claimed' : 'Complete Task'}
                        </button>
                      </>
                    )}
                    
                    {task.status === 'completed' && (
                      <button
                        onClick={() => handleClaimReward(task.id)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Claiming...
                          </div>
                        ) : (
                          `Claim ${task.reward} Croaks`
                        )}
                      </button>
                    )}
                    
                    {task.status === 'claimed' && (
                      <div className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2">
                        <GiCheckMark size={16} />
                        Claimed {task.reward} Croaks
                      </div>
                    )}
                    
                    {task.status === 'pending_review' && (
                      <div className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2">
                        <GiLoad size={16} className="animate-spin" />
                        Under Review
                      </div>
                    )}
                  </div>

                  {task.cooldown && task.lastCompleted && cooldownRemaining > 0 && (
                    <div className="mt-2 text-xs text-yellow-600">
                      ⏰ Available in {cooldownRemaining} hours
                    </div>
                  )}
                  
                  {task.type === 'social' && !hasClickedLink && (
                    <div className="mt-2 text-xs text-blue-600">
                      🔗 Click "Open Link" first to visit the required page
                    </div>
                  )}

                  {task.id === 'daily_login' && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last login: {lastLoginDate || 'Never'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg">
          <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <GiShare size={20} className="text-yellow-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => openExternalLink('https://t.me/CroakKingdom', 'join_telegram')}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              📱 Join Telegram
            </button>
            <button
              onClick={() => openExternalLink('https://twitter.com/CroakKingdom', 'follow_twitter')}
              className="px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🐦 Follow Twitter
            </button>
          </div>
        </div>

        {/* Task Submission Modal */}
        {showSubmissionModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-300 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                  <GiLoad size={20} className="text-green-600" />
                  Submit Task: {selectedTask.title}
                </h3>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Task Info */}
                <div className="bg-white/50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedTask.emoji}</span>
                    <div>
                      <h4 className="font-bold text-green-800">{selectedTask.title}</h4>
                      <p className="text-sm text-green-600">{selectedTask.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">+{selectedTask.reward} Croaks</div>
                  </div>
                </div>

                {/* Telegram Username Field */}
                <div>
                  <label className="block text-green-700 font-medium mb-2">
                    📱 Your Telegram Username *
                  </label>
                  <input
                    type="text"
                    value={submissionData.telegramUsername}
                    onChange={(e) => setSubmissionData(prev => ({ 
                      ...prev, 
                      telegramUsername: e.target.value.replace('@', '')
                    }))}
                    placeholder="Enter your Telegram username (without @)"
                    className="w-full p-3 bg-white border-2 border-green-200 rounded-xl text-green-800 placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    We'll use this to verify your task completion
                  </p>
                </div>

                {/* Twitter Username Field - Show for social tasks */}
                {selectedTask.type === 'social' && (
                  <div>
                    <label className="block text-green-700 font-medium mb-2">
                      🐦 Your Twitter Username *
                    </label>
                    <input
                      type="text"
                      value={submissionData.twitterUsername}
                      onChange={(e) => setSubmissionData(prev => ({ 
                        ...prev, 
                        twitterUsername: e.target.value.replace('@', '')
                      }))}
                      placeholder="Enter your Twitter username (without @)"
                      className="w-full p-3 bg-white border-2 border-green-200 rounded-xl text-green-800 placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-green-600 mt-1">
                      We'll use this to verify your social media activity
                    </p>
                  </div>
                )}

                {/* Submission Type */}
                <div>
                  <label className="block text-green-700 font-medium mb-2">
                    Submission Type: {submissionData.type.toUpperCase()}
                  </label>
                  
                  {submissionData.type === 'screenshot' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full p-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400"
                      />
                      <p className="text-xs text-green-600">
                        Upload a screenshot showing task completion (max 5MB)
                      </p>
                      {submissionData.file && (
                        <div className="bg-green-100 p-2 rounded-lg">
                          <p className="text-sm text-green-700">
                            Selected: {submissionData.file.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {submissionData.type === 'link' && (
                    <div className="space-y-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={submissionData.content}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full p-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400"
                      />
                      <p className="text-xs text-green-600">
                        Provide the link to your social media post
                      </p>
                    </div>
                  )}

                  {submissionData.type === 'text' && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Describe how you completed the task..."
                        value={submissionData.content}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="w-full p-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-400 resize-none"
                      />
                      <p className="text-xs text-green-600">
                        Provide details about how you completed the task
                      </p>
                    </div>
                  )}
                </div>

                {/* Requirements Reminder */}
                <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Requirements:</h4>
                  <ul className="space-y-1">
                    {selectedTask.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 flex items-center gap-2">
                        <GiCheckMark size={12} className="text-yellow-600" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmissionModal(false)}
                    className="flex-1 px-4 py-3 text-green-700 hover:text-green-800 border-2 border-green-300 rounded-xl hover:bg-green-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTask}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg border-2 border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Task'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCenter; 