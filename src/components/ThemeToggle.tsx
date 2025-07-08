// import { FC, useState, useRef, useEffect } from 'react';
// import { useTheme } from '@/contexts/ThemeContext';
// import { FiSun, FiMoon, FiMonitor, FiChevronDown } from 'react-icons/fi';

// export const ThemeToggle: FC = () => {
//   const { theme, setTheme, toggleTheme, isDark } = useTheme();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const buttonRef = useRef<HTMLButtonElement>(null);

//   const themes = [
//     { id: 'light', icon: FiSun, label: 'Light', description: 'Always light mode' },
//     { id: 'dark', icon: FiMoon, label: 'Dark', description: 'Always dark mode' },
//     { id: 'auto', icon: FiMonitor, label: 'Auto', description: 'Follow system' },
//   ] as const;

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
//           buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Close dropdown on escape key
//   useEffect(() => {
//     const handleEscape = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         setIsDropdownOpen(false);
//       }
//     };

//     document.addEventListener('keydown', handleEscape);
//     return () => document.removeEventListener('keydown', handleEscape);
//   }, []);

//   const handleThemeSelect = (selectedTheme: typeof themes[number]['id']) => {
//     setTheme(selectedTheme);
//     setIsDropdownOpen(false);
//   };

//   const handleMainButtonClick = (e: React.MouseEvent) => {
//     e.preventDefault();
//     // Quick toggle between light and dark, preserving auto if it was set
//     if (theme === 'auto') {
//       // If auto, switch to the opposite of current system preference
//       setTheme(isDark ? 'light' : 'dark');
//     } else if (theme === 'light') {
//       setTheme('dark');
//     } else {
//       setTheme('light');
//     }
//   };

//   const handleDropdownToggle = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsDropdownOpen(!isDropdownOpen);
//   };

//   const handleKeyboardToggle = () => {
//     // Quick toggle between light and dark, preserving auto if it was set
//     if (theme === 'auto') {
//       // If auto, switch to the opposite of current system preference
//       setTheme(isDark ? 'light' : 'dark');
//     } else if (theme === 'light') {
//       setTheme('dark');
//     } else {
//       setTheme('light');
//     }
//   };

//   const getCurrentIcon = () => {
//     switch (theme) {
//       case 'light':
//         return FiSun;
//       case 'dark':
//         return FiMoon;
//       case 'auto':
//         return FiMonitor;
//       default:
//         return FiMonitor;
//     }
//   };

//   const getThemeColors = () => {
//     switch (theme) {
//       case 'light':
//         return {
//           bg: 'from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20',
//           border: 'border-yellow-300 dark:border-yellow-600',
//           glow: 'shadow-yellow-400/30 dark:shadow-yellow-500/20',
//           icon: 'text-yellow-600 dark:text-yellow-400'
//         };
//       case 'dark':
//         return {
//           bg: 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
//           border: 'border-blue-300 dark:border-blue-600',
//           glow: 'shadow-blue-400/30 dark:shadow-blue-500/20',
//           icon: 'text-blue-600 dark:text-blue-400'
//         };
//       case 'auto':
//         return {
//           bg: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
//           border: 'border-purple-300 dark:border-purple-600',
//           glow: 'shadow-purple-400/30 dark:shadow-purple-500/20',
//           icon: 'text-purple-600 dark:text-purple-400'
//         };
//       default:
//         return {
//           bg: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
//           border: 'border-gray-300 dark:border-gray-600',
//           glow: 'shadow-gray-400/30 dark:shadow-gray-500/20',
//           icon: 'text-gray-600 dark:text-gray-400'
//         };
//     }
//   };

//   const colors = getThemeColors();
//   const CurrentIcon = getCurrentIcon();

//   return (
//     <div className="relative group" ref={dropdownRef}>
//       {/* Main Toggle Button */}
//       <button
//         ref={buttonRef}
//         onClick={handleMainButtonClick}
//         onContextMenu={handleDropdownToggle}
//         onKeyDown={(e) => {
//           if (e.key === 'Enter' || e.key === ' ') {
//             e.preventDefault();
//             handleKeyboardToggle();
//           } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
//             e.preventDefault();
//             setIsDropdownOpen(true);
//           }
//         }}
//         className={`
//           relative w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.bg}
//           border-2 ${colors.border} flex items-center justify-center 
//           transition-all duration-500 ease-out
//           hover:scale-105 active:scale-95 
//           hover:shadow-xl ${colors.glow}
//           focus:outline-none focus:ring-4 focus:ring-blue-500/50
//           group-hover:rotate-3
//         `}
//         aria-label={`Current theme: ${theme}. Click to toggle theme, right-click for options`}
//         aria-expanded={isDropdownOpen}
//         aria-haspopup="true"
//       >
//         {/* Icon Container */}
//         <div className="relative w-7 h-7 flex items-center justify-center">
//           <CurrentIcon className={`w-6 h-6 transition-all duration-500 ${colors.icon}`} />
          
//           {/* Animated Background Glow */}
//           <div className={`
//             absolute inset-0 rounded-full transition-all duration-700
//             ${colors.bg.replace('from-', 'bg-gradient-to-br from-').replace(' to-', ' to-')}
//             opacity-0 group-hover:opacity-20 animate-pulse
//           `} />
//         </div>

//         {/* Status Indicator */}
//         <div className={`
//           absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800
//           ${isDark ? 'bg-green-400' : 'bg-blue-400'}
//           transition-all duration-300
//         `} />

//         {/* Chevron for dropdown indication */}
//         <FiChevronDown 
//           className={`
//             absolute -bottom-1 w-4 h-4 transition-all duration-300
//             ${isDropdownOpen ? 'rotate-180 text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}
//           `} 
//         />
//       </button>

//       {/* Enhanced Dropdown Menu */}
//       <div className={`
//         absolute bottom-full right-0 mb-3 transition-all duration-300 ease-out
//         ${isDropdownOpen 
//           ? 'opacity-100 translate-y-0 pointer-events-auto' 
//           : 'opacity-0 translate-y-2 pointer-events-none'
//         }
//       `}>
//         <div className="
//           bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl
//           rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50
//           p-3 min-w-[200px] transform origin-bottom-right
//         ">
//           {/* Header */}
//           <div className="flex items-center gap-2 px-2 py-1 mb-2">
//             <CurrentIcon className={`w-4 h-4 ${colors.icon}`} />
//             <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
//               Theme Settings
//             </span>
//           </div>

//           {/* Theme Options */}
//           <div className="space-y-1">
//             {themes.map(({ id, icon: Icon, label, description }) => {
//               const isActive = theme === id;
//               const optionColors = isActive ? {
//                 bg: 'bg-blue-50 dark:bg-blue-900/30',
//                 text: 'text-blue-700 dark:text-blue-300',
//                 border: 'border-blue-200 dark:border-blue-700'
//               } : {
//                 bg: 'hover:bg-gray-50 dark:hover:bg-gray-700/30',
//                 text: 'text-gray-700 dark:text-gray-300',
//                 border: 'border-transparent'
//               };

//               return (
//                 <button
//                   key={id}
//                   onClick={() => handleThemeSelect(id)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' || e.key === ' ') {
//                       e.preventDefault();
//                       handleThemeSelect(id);
//                     }
//                   }}
//                   className={`
//                     w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
//                     transition-all duration-200 border ${optionColors.bg} ${optionColors.text} ${optionColors.border}
//                     hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50
//                     ${isActive ? 'ring-2 ring-blue-500/30' : ''}
//                   `}
//                   aria-label={`Switch to ${label} theme: ${description}`}
//                 >
//                   <div className="relative">
//                     <Icon className={`w-4 h-4 transition-colors duration-200 ${
//                       isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
//                     }`} />
//                     {isActive && (
//                       <div className="absolute -inset-1 bg-blue-500/20 rounded-full animate-ping" />
//                     )}
//                   </div>
//                   <div className="flex-1 text-left">
//                     <div className="font-medium">{label}</div>
//                     <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
//                   </div>
//                   {isActive && (
//                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
//                   )}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Quick Toggle Hint */}
//           <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
//             <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
//               💡 Tip: Click to toggle theme, right-click for more options
//             </div>
//           </div>
//         </div>

//         {/* Dropdown Arrow */}
//         <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95 dark:border-t-gray-800/95" />
//       </div>
//     </div>
//   );
// }; 