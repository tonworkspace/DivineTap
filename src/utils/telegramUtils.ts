// Basic Telegram utilities for web apps

export const initUtils = () => {
  // Check if Telegram WebApp is available
  const tg = window.Telegram?.WebApp;

  return {
    openTelegramLink: (url: string) => {
      if (tg) {
        // Use Telegram's native method if available
        tg.openLink(url);
      } else {
        // Fallback to regular window.open
        window.open(url, '_blank');
      }
    }
  };
};

// Add type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
} 