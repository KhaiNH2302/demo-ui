import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { router } from './app/router';
import './styles/tokens.css';
import './index.css';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true' && import.meta.env.DEV !== true) {
    return;
  }
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>
  );
});
