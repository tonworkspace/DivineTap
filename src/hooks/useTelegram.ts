interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  photoUrl?: string;
}

export const useTelegram = () => {
  // Access the Telegram WebApp object
  const tg = window.Telegram?.WebApp;

  return {
    user: tg?.initDataUnsafe?.user as TelegramUser | undefined,
    initDataUnsafe: tg?.initDataUnsafe
  };
}; 