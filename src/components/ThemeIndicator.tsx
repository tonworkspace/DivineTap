import { FC } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

export const ThemeIndicator: FC = () => {
  const { theme, isDark } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <FiSun className="w-3 h-3" />;
      case 'dark':
        return <FiMoon className="w-3 h-3" />;
      case 'auto':
        return <FiMonitor className="w-3 h-3" />;
      default:
        return <FiMonitor className="w-3 h-3" />;
    }
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'light':
        return 'text-yellow-500';
      case 'dark':
        return 'text-blue-400';
      case 'auto':
        return 'text-purple-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed top-4 left-4 z-40">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm ${getThemeColor()}`}>
        {getThemeIcon()}
        <span className="text-xs font-medium capitalize">{theme}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-green-400' : 'bg-blue-400'}`}></div>
      </div>
    </div>
  );
}; 