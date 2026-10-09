import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { router } from './app/router';
import { PageLoading } from './components/shared/PageLoading';
import { isDemoMode } from './lib/demoMode';
import './index.css';

async function enableMocking() {
  if (!isDemoMode) {
    return;
  }
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

function renderApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders>
        <React.Suspense fallback={<PageLoading />}><RouterProvider router={router} /></React.Suspense>
      </AppProviders>
    </React.StrictMode>
  );
}

// Không để lỗi khởi động MSW (SW bị chặn, mất mạng...) làm treo cả app ở màn
// hình trắng im lặng — vẫn render UI, chỉ log cảnh báo để dev biết mock đang tắt.
// Do not hold the first paint hostage to service-worker startup. In a fresh
// browser profile, a blocked/stale service worker can leave `worker.start()`
// pending indefinitely, which otherwise renders a completely blank page.
const MOCK_START_TIMEOUT_MS = 1500;

async function bootApp() {
  const mockingReady = enableMocking().catch((err) => {
    console.warn('[MSW] Không khởi động được mock worker, API call sẽ lỗi:', err);
  });

  await Promise.race([
    mockingReady,
    new Promise<void>((resolve) => window.setTimeout(resolve, MOCK_START_TIMEOUT_MS)),
  ]);

  renderApp();
}

void bootApp();
