import {
  mockTelegramEnv,
  isTMA,
  parseInitData,
  LaunchParams, retrieveLaunchParams
} from '@telegram-apps/sdk-react';

// It is important, to mock the environment only for development purposes.
// When building the application the import.meta.env.DEV will value become
// `false` and the code inside will be tree-shaken (removed), so you will not
// see it in your final bundle.
if (import.meta.env.DEV) {
  await (async () => {
    if (await isTMA()) {
      return;
    }

    // Determine which launch params should be applied. We could already
    // apply them previously, or they may be specified on purpose using the
    // default launch parameters transmission method.
    let lp: LaunchParams | undefined;
    try {
      lp = retrieveLaunchParams();
    } catch (e) {
      const initDataRaw = new URLSearchParams([
        ['user', JSON.stringify({
          id: 987654321,
          first_name: 'Jamie',
          last_name: 'Smith',
          username: 'jamiesmithdev',
          language_code: 'es',
          is_premium: false,
          allows_write_to_pm: false,
        })],
        ['hash', 'z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0'],
        ['auth_date', '1711555555'],
        ['start_param', 'testuser'],
        ['chat_type', 'private'],
        ['chat_instance', '9876543210987654321'],
        ['signature', 'z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0'],

      ]).toString();

      lp = {
        themeParams: {
          accentTextColor: '#6ab2f2',
          bgColor: '#17212b',
          buttonColor: '#5288c1',
          buttonTextColor: '#ffffff',
          destructiveTextColor: '#ec3942',
          headerBgColor: '#17212b',
          hintColor: '#708499',
          linkColor: '#6ab3f3',
          secondaryBgColor: '#232e3c',
          sectionBgColor: '#17212b',
          sectionHeaderTextColor: '#6ab3f3',
          subtitleTextColor: '#708499',
          textColor: '#f5f5f5',
        },
        initData: parseInitData(initDataRaw),
        initDataRaw,
        version: '8',
        platform: 'tdesktop',
      }
    }

    mockTelegramEnv(lp);
    console.warn(
      '⚠️ As long as the current environment was not considered as the Telegram-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Telegram.',
    );
  })();
}
