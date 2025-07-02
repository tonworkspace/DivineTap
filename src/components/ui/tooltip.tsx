import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  maxWidth?: number;
  showArrow?: boolean;
}

export const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  className = '',
  delay = 200,
  maxWidth = 200,
  showArrow = true
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    if (!showArrow) return '';
    
    switch (position) {
      case 'top':
        return 'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black/90';
      case 'bottom':
        return 'after:content-[""] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-black/90';
      case 'left':
        return 'after:content-[""] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-black/90';
      case 'right':
        return 'after:content-[""] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-black/90';
      default:
        return 'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-black/90';
    }
  };

  return (
    <div 
      className="group relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div 
        className={`
          absolute ${getPositionClasses()} ${getArrowClasses()}
          px-3 py-2 text-sm text-white bg-black/90 rounded-lg shadow-lg
          opacity-0 transition-all duration-200 pointer-events-none z-50
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        style={{ maxWidth: `${maxWidth}px` }}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

// Specialized tooltip components for common use cases
export const InfoTooltip = ({ children, content }: { children: ReactNode; content: string }) => (
  <Tooltip content={content} position="top" className="bg-blue-600/90">
    {children}
  </Tooltip>
);

export const WarningTooltip = ({ children, content }: { children: ReactNode; content: string }) => (
  <Tooltip content={content} position="top" className="bg-yellow-600/90">
    {children}
  </Tooltip>
);

export const ErrorTooltip = ({ children, content }: { children: ReactNode; content: string }) => (
  <Tooltip content={content} position="top" className="bg-red-600/90">
    {children}
  </Tooltip>
);

export const SuccessTooltip = ({ children, content }: { children: ReactNode; content: string }) => (
  <Tooltip content={content} position="top" className="bg-green-600/90">
    {children}
  </Tooltip>
); 