import { TonConnectUIProvider } from '@tonconnect/ui-react';
import '../buffer-polyfill';


import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import { publicUrl } from '@/helpers/publicUrl.ts';


function ErrorBoundaryError({ error }: { error: unknown }) {
  if (error instanceof Error && error.message === 'USER_CANCELED') {
    return null;
  }

  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root() {
  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <TonConnectUIProvider
        manifestUrl={publicUrl('https://cdn.stakenova.io/tonconnect-manifest.json')}
      >
        <App/>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
