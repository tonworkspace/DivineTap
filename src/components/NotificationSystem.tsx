import React, { useState, useEffect, useCallback } from 'react';

// Enhanced Notification System Interfaces
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'milestone' | 'offline' | 'energy' | 'upgrade' | 'system' | 'progress' | 'reward' | 'prestige' | 'tutorial';
  title: string;
  message: string;
  description?: string;
  icon?: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: NotificationAction[];
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center' | 'smart';
  animation?: 'slide-in' | 'fade-in' | 'bounce-in' | 'scale-in' | 'slide-up' | 'slide-down' | 'zoom-in' | 'flip-in';
  sound?: boolean;
  vibration?: boolean;
  autoDismiss?: boolean;
  persistent?: boolean;
  category?: string;
  metadata?: Record<string, any>;
  progress?: {
    current: number;
    max: number;
    label?: string;
    color?: string;
  };
  stackable?: boolean;
  groupId?: string;
  expiresAt?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
}

export interface NotificationQueue {
  notifications: Notification[];
  maxNotifications: number;
  maxDuration: number;
  history: Notification[];
  maxHistory: number;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoDismiss: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'smart';
  maxNotifications: number;
  showNotifications: boolean;
  categories: {
    achievement: boolean;
    milestone: boolean;
    system: boolean;
    energy: boolean;
    upgrade: boolean;
    offline: boolean;
    progress: boolean;
    tutorial: boolean;
  };
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'dark' | 'light' | 'auto';
}

interface NotificationSystemProps {
  children?: React.ReactNode;
}

interface NotificationSystemContextType {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => string;
  dismissNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  showAchievementNotification: (achievement: any) => void;
  showMilestoneNotification: (milestone: number, currentPoints: number) => void;
  showEnergyWarningNotification: (currentEnergy: number, energyCost: number) => void;
  showUpgradeNotification: (upgradeName: string, cost: number) => void;
  showSystemNotification: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showOfflineRewardsNotification: (rewards: number, bonus: number, onClaim: () => void) => void;
  showProgressNotification: (title: string, current: number, max: number, label?: string) => void;
  showRewardNotification: (title: string, amount: number, type?: string) => void;
  showPrestigeNotification: (bonus: number) => void;
  showTutorialNotification: (title: string, message: string) => void;
  notificationQueue: NotificationQueue;
  notificationSettings: NotificationPreferences;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
}

const NotificationSystemContext = React.createContext<NotificationSystemContextType | null>(null);

export const useNotificationSystem = () => {
  const context = React.useContext(NotificationSystemContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within a NotificationSystemProvider');
  }
  return context;
};

export const NotificationSystemProvider: React.FC<NotificationSystemProps> = ({ children }) => {
  // Enhanced Notification System State
  const [notificationQueue, setNotificationQueue] = useState<NotificationQueue>({
    notifications: [],
    maxNotifications: 5,
    maxDuration: 8000,
    history: [],
    maxHistory: 100
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    soundEnabled: true,
    vibrationEnabled: true,
    autoDismiss: true,
    position: 'top-right',
    maxNotifications: 5,
    showNotifications: true,
    categories: {
      achievement: true,
      milestone: true,
      system: true,
      energy: true,
      upgrade: true,
      offline: true,
      progress: true,
      tutorial: true
    },
    animationSpeed: 'normal',
    theme: 'auto'
  });

  // Cleanup expired notifications and remove duplicates
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setNotificationQueue(prev => {
        // Remove expired and old dismissed notifications
        const validNotifications = prev.notifications.filter(notification => {
          // Remove notifications that have expired
          if (notification.expiresAt && now > notification.expiresAt) {
            return false;
          }
          // Remove notifications that have been dismissed for too long
          if (notification.dismissed && (now - notification.timestamp) > 1000) {
            return false;
          }
          return true;
        });

        // Remove duplicate notifications (same title and message within 1 second)
        const uniqueNotifications = validNotifications.filter((notification, index, self) => 
          index === self.findIndex(n => 
            n.title === notification.title && 
            n.message === notification.message &&
            Math.abs(n.timestamp - notification.timestamp) < 1000
          )
        );

        if (uniqueNotifications.length !== prev.notifications.length) {
          console.log('Cleaned up notifications:', {
            removed: prev.notifications.length - uniqueNotifications.length,
            remaining: uniqueNotifications.length
          });
          return {
            ...prev,
            notifications: uniqueNotifications
          };
        }
        return prev;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // Load notification settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error);
    }
  }, []);

  // Save notification settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    } catch (error) {
      console.warn('Failed to save notification settings:', error);
    }
  }, [notificationSettings]);

  // Notification System Functions
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    try {
      console.log('Adding notification:', notification);
      
      // Check for duplicate notifications (same title and message within last 2 seconds)
      const now = Date.now();
      const recentNotifications = notificationQueue.notifications.filter(n => 
        n.title === notification.title && 
        n.message === notification.message && 
        (now - n.timestamp) < 2000
      );
      
      if (recentNotifications.length > 0) {
        console.log('Duplicate notification detected, skipping:', notification.title);
        return recentNotifications[0].id;
      }
      
      const newNotification: Notification = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
        dismissed: false,
        duration: notification.duration || 5000,
        autoDismiss: notification.autoDismiss ?? true,
        persistent: notification.persistent ?? false,
        sound: notification.sound ?? notificationSettings.soundEnabled,
        vibration: notification.vibration ?? notificationSettings.vibrationEnabled,
        progress: notification.progress,
        stackable: notification.stackable,
        groupId: notification.groupId,
        expiresAt: notification.expiresAt
      };

      setNotificationQueue(prev => {
        const updatedNotifications = [...prev.notifications, newNotification];
        
        // Limit notifications based on maxNotifications setting
        if (updatedNotifications.length > prev.maxNotifications) {
          updatedNotifications.splice(0, updatedNotifications.length - prev.maxNotifications);
        }
        
        console.log('Updated notification queue:', updatedNotifications);
        return {
          ...prev,
          notifications: updatedNotifications
        };
      });

      // Auto-dismiss if enabled
      if (newNotification.autoDismiss && !newNotification.persistent) {
        setTimeout(() => {
          dismissNotification(newNotification.id);
        }, newNotification.duration);
      }

      // Play sound if enabled
      if (newNotification.sound && notificationSettings.soundEnabled) {
        try {
          playNotificationSound(newNotification.type);
        } catch (error) {
          console.warn('Failed to play notification sound:', error);
        }
      }

      // Vibrate if enabled
      if (newNotification.vibration && notificationSettings.vibrationEnabled) {
        try {
          playNotificationVibration(newNotification.type);
        } catch (error) {
          console.warn('Failed to vibrate:', error);
        }
      }

      return newNotification.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      return '';
    }
  }, [notificationSettings]);

  const dismissNotification = useCallback((id: string) => {
    try {
      setNotificationQueue(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === id
            ? { ...notification, dismissed: true }
            : notification
        )
      }));

      // Remove from queue after animation
      setTimeout(() => {
        setNotificationQueue(prev => ({
          ...prev,
          notifications: prev.notifications.filter(notification => notification.id !== id)
        }));
      }, 300);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    try {
      setNotificationQueue(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    try {
      setNotificationQueue(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          dismissed: true
        }))
      }));

      setTimeout(() => {
        setNotificationQueue(prev => ({
          ...prev,
          notifications: []
        }));
      }, 300);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Notification Sound and Vibration Functions
  const playNotificationSound = useCallback((type: Notification['type']) => {
    try {
      // Create audio context for different notification sounds
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const frequencies = {
        success: [523, 659, 784], // C major chord
        error: [220, 196, 174],   // Low descending
        warning: [440, 494, 523], // A major
        info: [523, 587, 659],    // C major
        achievement: [659, 784, 988, 1318], // High ascending
        milestone: [523, 659, 784, 1047],   // C major ascending
        offline: [440, 523, 659], // A major
        energy: [330, 440, 554],  // E major
        upgrade: [523, 659, 784, 1047], // C major ascending
        system: [440, 554, 659],  // A major
        progress: [523, 659, 784], // C major
        reward: [659, 784, 988],  // High ascending
        prestige: [784, 988, 1318], // Very high ascending
        tutorial: [440, 523, 659] // A major
      };

      const freq = frequencies[type] || frequencies.info;
      
      freq.forEach((frequency, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 100);
      });
    } catch (error) {
      console.log('Audio not supported or blocked');
    }
  }, []);

  const playNotificationVibration = useCallback((type: Notification['type']) => {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [100, 50, 100],
        error: [200, 100, 200, 100, 200],
        warning: [150, 100, 150],
        info: [100, 100],
        achievement: [100, 50, 100, 50, 100, 50, 100],
        milestone: [100, 50, 100, 50, 100],
        offline: [200, 100, 200],
        energy: [150, 100, 150, 100],
        upgrade: [100, 50, 100, 50, 100],
        system: [200, 200],
        progress: [100, 100, 100],
        reward: [100, 50, 100, 50, 100],
        prestige: [100, 50, 100, 50, 100, 50, 100, 50],
        tutorial: [150, 100, 150]
      };

      const pattern = patterns[type] || patterns.info;
      navigator.vibrate(pattern);
    }
  }, []);

  // Smart Notification Helpers
  const showAchievementNotification = useCallback((achievement: any) => {
    addNotification({
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      message: achievement.name,
      description: achievement.description,
      priority: 'high',
      duration: 6000,
      animation: 'bounce-in',
      sound: true,
      vibration: true,
      autoDismiss: true,
      persistent: false,
      position: 'top-center',
      actions: [
        {
          label: 'View All',
          action: () => {
            // Could open achievements panel
            console.log('View all achievements');
          },
          type: 'secondary',
          icon: '🏆'
        }
      ]
    });
  }, [addNotification]);

  const showMilestoneNotification = useCallback((milestone: number,) => {
    addNotification({
      type: 'milestone',
      title: '⭐ Milestone Reached!',
      message: `${milestone.toLocaleString()} Points`,
      description: `You've reached ${milestone.toLocaleString()} divine points!`,
      priority: 'medium',
      duration: 5000,
      animation: 'scale-in',
      sound: true,
      vibration: true,
      autoDismiss: true,
      position: 'top-center',
      actions: [
        {
          label: 'Share',
          action: () => {
            // Could implement sharing functionality
            console.log('Share milestone');
          },
          type: 'primary',
          icon: '📤'
        }
      ]
    });
  }, [addNotification]);

  const showEnergyWarningNotification = useCallback((currentEnergy: number, energyCost: number) => {
    addNotification({
      type: 'energy',
      title: '⚡ Low Energy Warning',
      message: `Energy: ${currentEnergy.toFixed(0)}/${energyCost.toFixed(0)}`,
      description: 'Your energy is running low. Consider upgrading energy efficiency or taking a break.',
      priority: 'medium',
      duration: 4000,
      animation: 'slide-in',
      sound: true,
      vibration: false,
      autoDismiss: true,
      position: 'bottom-right',
      actions: [
        {
          label: 'Upgrade Energy',
          action: () => {
            // Could scroll to energy upgrades
            console.log('Show energy upgrades');
          },
          type: 'primary',
          icon: '⚡'
        }
      ]
    });
  }, [addNotification]);

  const showUpgradeNotification = useCallback((upgradeName: string, cost: number) => {
    addNotification({
      type: 'upgrade',
      title: '⚡ Upgrade Purchased!',
      message: upgradeName,
      description: `Successfully purchased for ${cost.toLocaleString()} points`,
      priority: 'medium',
      duration: 4000,
      animation: 'fade-in',
      sound: true,
      vibration: false,
      autoDismiss: true,
      position: 'top-right'
    });
  }, [addNotification]);

  const showSystemNotification = useCallback((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    addNotification({
      type: 'system',
      title,
      message,
      priority: type === 'error' ? 'critical' : type === 'warning' ? 'high' : 'medium',
      duration: type === 'error' ? 6000 : 4000,
      animation: 'slide-in',
      sound: type === 'error' || type === 'warning',
      vibration: type === 'error',
      autoDismiss: true,
      position: 'top-right'
    });
  }, [addNotification]);

  const showOfflineRewardsNotification = useCallback((rewards: number, bonus: number, onClaim: () => void) => {
    addNotification({
      type: 'offline',
      title: '🎁 Offline Rewards Available!',
      message: `${Math.floor(rewards).toLocaleString()} points`,
      description: `You've been away for a while! Claim your rewards with a ${(bonus * 100).toFixed(1)}% bonus.`,
      priority: 'high',
      duration: 8000,
      animation: 'bounce-in',
      sound: true,
      vibration: true,
      autoDismiss: false,
      persistent: true,
      position: 'top-center',
      actions: [
        {
          label: 'Claim Now',
          action: onClaim,
          type: 'primary',
          icon: '🎁'
        },
        {
          label: 'Later',
          action: () => {
            // Will be dismissed by the notification system
          },
          type: 'secondary',
          icon: '⏰'
        }
      ]
    });
  }, [addNotification]);

  const showProgressNotification = useCallback((title: string, current: number, max: number, label?: string) => {
    addNotification({
      type: 'progress',
      title,
      message: `${current}/${max}`,
      description: label,
      priority: 'medium',
      duration: 3000,
      animation: 'slide-up',
      sound: false,
      vibration: false,
      autoDismiss: true,
      position: 'bottom-center',
      progress: {
        current,
        max,
        label,
        color: 'cyan'
      }
    });
  }, [addNotification]);

  const showRewardNotification = useCallback((title: string, amount: number, type?: string) => {
    addNotification({
      type: 'reward',
      title,
      message: `+${amount.toLocaleString()} points`,
      description: type ? `Reward type: ${type}` : undefined,
      priority: 'medium',
      duration: 4000,
      animation: 'bounce-in',
      sound: true,
      vibration: true,
      autoDismiss: true,
      position: 'top-right'
    });
  }, [addNotification]);

  const showPrestigeNotification = useCallback((bonus: number) => {
    addNotification({
      type: 'prestige',
      title: '🌟 Prestige Complete!',
      message: `+${bonus.toFixed(1)}% permanent bonus`,
      description: 'You have successfully prestiged and gained a permanent mining speed bonus!',
      priority: 'high',
      duration: 6000,
      animation: 'scale-in',
      sound: true,
      vibration: true,
      autoDismiss: true,
      position: 'top-center',
      actions: [
        {
          label: 'Continue',
          action: () => {
            console.log('Continue after prestige');
          },
          type: 'primary',
          icon: '🌟'
        }
      ]
    });
  }, [addNotification]);

  const showTutorialNotification = useCallback((title: string, message: string) => {
    addNotification({
      type: 'tutorial',
      title,
      message,
      priority: 'medium',
      duration: 5000,
      animation: 'fade-in',
      sound: true,
      vibration: false,
      autoDismiss: true,
      position: 'center',
      actions: [
        {
          label: 'Got it!',
          action: () => {
            console.log('Tutorial notification acknowledged');
          },
          type: 'primary',
          icon: '📚'
        }
      ]
    });
  }, [addNotification]);

  // Enhanced Notification Component
  const NotificationSystem = () => {
    const [showNotificationCenter, setShowNotificationCenter] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
      setNotificationCount(notificationQueue.notifications.filter(n => !n.read).length);
    }, [notificationQueue.notifications]);

    const formatTimestamp = (timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return new Date(timestamp).toLocaleDateString();
    };

    const getNotificationIcon = (type: Notification['type']) => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        achievement: '🏆',
        milestone: '⭐',
        offline: '🎁',
        energy: '⚡',
        upgrade: '⚡',
        system: '🔧',
        progress: '📊',
        reward: '🎁',
        prestige: '🌟',
        tutorial: '📚'
      };
      return icons[type] || icons.info;
    };

    const getNotificationColor = (type: Notification['type']) => {
      const colors = {
        success: 'border-green-500/50 bg-green-500/20',
        error: 'border-red-500/50 bg-red-500/20',
        warning: 'border-yellow-500/50 bg-yellow-500/20',
        info: 'border-blue-500/50 bg-blue-500/20',
        achievement: 'border-purple-500/50 bg-purple-500/20',
        milestone: 'border-yellow-500/50 bg-yellow-500/20',
        offline: 'border-purple-500/50 bg-purple-500/20',
        energy: 'border-orange-500/50 bg-orange-500/20',
        upgrade: 'border-cyan-500/50 bg-cyan-500/20',
        system: 'border-gray-500/50 bg-gray-500/20',
        progress: 'border-blue-500/50 bg-blue-500/20',
        reward: 'border-purple-500/50 bg-purple-500/20',
        prestige: 'border-yellow-500/50 bg-yellow-500/20',
        tutorial: 'border-cyan-500/50 bg-cyan-500/20'
      };
      return colors[type] || colors.info;
    };

    const getNotificationTextColor = (type: Notification['type']) => {
      const colors = {
        success: 'text-green-100',
        error: 'text-red-100',
        warning: 'text-yellow-100',
        info: 'text-blue-100',
        achievement: 'text-purple-100',
        milestone: 'text-yellow-100',
        offline: 'text-purple-100',
        energy: 'text-orange-100',
        upgrade: 'text-cyan-100',
        system: 'text-gray-100',
        progress: 'text-blue-100',
        reward: 'text-purple-100',
        prestige: 'text-yellow-100',
        tutorial: 'text-cyan-100'
      };
      return colors[type] || colors.info;
    };

    const getAnimationClass = (animation?: string) => {
      const animations = {
        'slide-in': 'animate-slide-in',
        'fade-in': 'animate-fade-in',
        'bounce-in': 'animate-bounce-in',
        'scale-in': 'animate-scale-in',
        'slide-up': 'animate-slide-up',
        'slide-down': 'animate-slide-down',
        'zoom-in': 'animate-zoom-in',
        'flip-in': 'animate-flip-in'
      };
      return animations[animation as keyof typeof animations] || 'animate-fade-in';
    };

    const getPositionClass = (position?: string) => {
      const positions = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
        'center': 'fixed inset-1/2 transform -translate-x-1/2 -translate-y-1/2',
        'smart': 'fixed inset-1/2 transform -translate-x-1/2 -translate-y-1/2'
      };
      return positions[position as keyof typeof positions] || 'top-4 right-4';
    };

    // Group notifications by position for better stacking
    const groupedNotifications = notificationQueue.notifications.reduce((groups, notification) => {
      const position = notification.position || 'top-right';
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(notification);
      return groups;
    }, {} as Record<string, Notification[]>);

    return (
      <>
        {/* Notification Bell */}
        <div className="fixed top-20 sm:top-4 right-4 sm:right-4 z-[9999]">
          <button
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="relative p-2 sm:p-3 bg-black/80 backdrop-blur-xl border-2 border-cyan-500/50 rounded-lg hover:bg-black/90 hover:border-cyan-400/70 transition-all duration-300 group shadow-lg"
          >
            <div className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors text-lg">
              🔔
            </div>
            {notificationCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse border-2 border-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </div>
            )}
          </button>
        </div>

        {/* Notification Center */}
        {showNotificationCenter && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={() => setShowNotificationCenter(false)}>
            <div className="absolute top-16 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-96 max-h-[calc(100vh-8rem)] bg-black/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.3)] overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-cyan-500/30 flex justify-between items-center bg-black/50">
                <h3 className="text-cyan-400 font-mono font-bold text-sm sm:text-base">Notifications</h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-red-400 hover:text-red-300 font-mono"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="text-xs text-gray-400 hover:text-white font-mono"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto bg-black/80">
                {notificationQueue.notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 font-mono text-sm">
                    No notifications
                  </div>
                ) : (
                  notificationQueue.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 border-b border-cyan-500/20 hover:bg-cyan-500/30 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-cyan-500/40' : 'bg-black/60'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-lg sm:text-xl">{getNotificationIcon(notification.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-mono font-bold text-sm sm:text-base ${getNotificationTextColor(notification.type)}`}>
                            {notification.title}
                          </h4>
                          <p className="text-white font-mono text-xs sm:text-sm mt-1 leading-relaxed">{notification.message}</p>
                          {notification.description && (
                            <p className="text-gray-300 font-mono text-xs mt-1">{notification.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-gray-400 font-mono text-xs">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Individual Notifications - Grouped by position */}
        {Object.entries(groupedNotifications).map(([position, notifications]) => (
          <div key={position} className={`fixed z-[9997] ${getPositionClass(position)}`}>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`max-w-sm w-full mb-2 ${getAnimationClass(notification.animation)} ${
                  notification.dismissed ? 'animate-slide-out' : ''
                }`}
                style={{ 
                  pointerEvents: 'auto',
                  transform: `translateY(${index * 10}px)`,
                  zIndex: 9997 - index
                }}
              >
                <div className={`p-3 sm:p-4 rounded-xl border backdrop-blur-xl shadow-[0_0_20px_rgba(0,255,255,0.1)] ${getNotificationColor(notification.type)} min-w-[280px] max-w-[400px] sm:max-w-[450px]`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl sm:text-2xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-mono font-bold text-sm sm:text-base ${getNotificationTextColor(notification.type)}`}>
                        {notification.title}
                      </h4>
                      <p className="text-white font-mono text-xs sm:text-sm mt-1 leading-relaxed">{notification.message}</p>
                      {notification.description && (
                        <div className="mt-2 p-2 bg-black/30 rounded-lg">
                          <p className="text-gray-300 font-mono text-xs">{notification.description}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-400 font-mono text-xs">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.persistent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-white transition-colors text-xs font-mono"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  const contextValue: NotificationSystemContextType = {
    addNotification,
    dismissNotification,
    markNotificationAsRead,
    clearAllNotifications,
    showAchievementNotification,
    showMilestoneNotification,
    showEnergyWarningNotification,
    showUpgradeNotification,
    showSystemNotification,
    showOfflineRewardsNotification,
    showProgressNotification,
    showRewardNotification,
    showPrestigeNotification,
    showTutorialNotification,
    notificationQueue,
    notificationSettings,
    setNotificationSettings
  };

  return (
    <NotificationSystemContext.Provider value={contextValue}>
      <NotificationSystem />
      {children}
    </NotificationSystemContext.Provider>
  );
};

export default NotificationSystemProvider;