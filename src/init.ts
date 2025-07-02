import {
  backButton,
  viewport,
  themeParams,
  miniApp,
  initData,
  $debug,
  init as initSDK,
} from '@telegram-apps/sdk-react';

/**
 * Initializes the application and configures its dependencies.
 */
export function init(debug: boolean): void {
  try {
    // Set @telegram-apps/sdk-react debug mode.
    $debug.set(debug);

    // Initialize special event handlers for Telegram Desktop, Android, iOS, etc.
    // Also, configure the package.
    initSDK();

    // Add Eruda if needed.
    debug && import('eruda')
      .then((lib) => lib.default.init())
      .catch((err) => {
        // Ignore USER_CANCELED errors
        if (err?.message !== 'USER_CANCELED') {
          console.error('Error initializing Eruda:', err);
        }
      });

    // Check if all required components are supported.
    if (!backButton.isSupported() || !miniApp.isSupported()) {
      throw new Error('ERR_NOT_SUPPORTED');
    }

    // Mount all components used in the project.
    backButton.mount();
    miniApp.mount();
    themeParams.mount();
    initData.restore();
    
    void viewport
      .mount()
      .catch(e => {
        // Ignore USER_CANCELED errors
        if (e?.message !== 'USER_CANCELED') {
          console.error('Something went wrong mounting the viewport', e);
        }
      })
      .then(() => {
        viewport.bindCssVars();
      });

    // Define components-related CSS variables.
    miniApp.bindCssVars();
    themeParams.bindCssVars();
  } catch (error) {
    // Ignore USER_CANCELED errors
    if (!(error instanceof Error) || error.message !== 'USER_CANCELED') {
      throw error;
    }
  }
}