import { FC, useState, useEffect, useRef } from 'react';

export const ShoutboxHeader: FC<{ onTabChange?: (tab: string) => void }> = ({ onTabChange }) => {
  const [shoutboxMessages] = useState([
    { text: "CroakKingdom is coming soon! 🐸" }
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollSpeed] = useState(30); // pixels per second
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Calculate total width of content
    const contentWidth = scrollContainer.scrollWidth / 2; // Divide by 2 because content is duplicated
    const duration = contentWidth / scrollSpeed;

    scrollContainer.style.setProperty('--scroll-duration', `${duration}s`);

    // Reset animation when content changes
    scrollContainer.style.animation = 'none';
    scrollContainer.offsetHeight; // Trigger reflow
    scrollContainer.style.animation = '';
  }, [scrollSpeed, shoutboxMessages]);

  return (
    <div className="relative top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-yellow-600 overflow-hidden h-8">
      <div className="relative flex items-center h-full">
        {/* Scrolling messages */}
        <div className="flex-1 overflow-hidden"
             onMouseEnter={() => setIsPaused(true)}
             onMouseLeave={() => setIsPaused(false)}>
          <div 
            ref={scrollRef}
            className={`flex items-center h-full whitespace-nowrap
                      ${isPaused ? 'animate-pause' : 'animate-marquee'}`}
          >
            {shoutboxMessages.map((message, index) => (
              <div 
                key={index}
                className="flex items-center mx-4 text-sm text-white font-medium
                         hover:text-white/90 transition-colors duration-200"
              >
                <span className="mr-2 text-yellow-300">•</span>
                {message.text}
              </div>
            ))}
            {/* Duplicate messages for seamless loop */}
            {shoutboxMessages.map((message, index) => (
              <div 
                key={`repeat-${index}`}
                className="flex items-center mx-4 text-sm text-white font-medium
                         hover:text-white/90 transition-colors duration-200"
              >
                <span className="mr-2 text-yellow-300">•</span>
                {message.text}
              </div>
            ))}
          </div>
        </div>
        
        {/* Fixed Participate button */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
          <button 
            className="px-3 py-0.5 text-xs bg-white text-green-600 rounded-2xl 
                     hover:bg-purple-100 transition-colors duration-200 font-semibold
                     shadow-md hover:shadow-lg"
            onClick={() => onTabChange?.('tasks')}
          >
            Participate
          </button>
        </div>
      </div>
    </div>
  );
}; 