import { useLaunchParams, miniApp, useSignal } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { PriceProvider } from '@/contexts/PriceContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationSystemProvider } from '@/components/NotificationSystem';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { routes } from '@/navigation/routes.tsx';
import { useEffect } from 'react';

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => console.log('App is online');
    const handleOffline = () => console.log('App is offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppRoot
        appearance={isDark ? 'dark' : 'light'}
        platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
      >
        <ThemeProvider>
          <PriceProvider>
            <NotificationSystemProvider>
              <HashRouter>
                <Routes>
                  {routes.map((route) => <Route key={route.path} {...route} />)}
                  <Route path="*" element={<Navigate to="/"/>}/>
                </Routes>
              </HashRouter>
            </NotificationSystemProvider>
          </PriceProvider>
        </ThemeProvider>
      </AppRoot>
    </ErrorBoundary>
  );
}


export default App;
