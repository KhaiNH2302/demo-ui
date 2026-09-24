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

function renderApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </React.StrictMode>
  );
}

// Không để lỗi khởi động MSW (SW bị chặn, mất mạng...) làm treo cả app ở màn
// hình trắng im lặng — vẫn render UI, chỉ log cảnh báo để dev biết mock đang tắt.
enableMocking()
  .catch((err) => {
    console.warn('[MSW] Không khởi động được mock worker, API call sẽ lỗi:', err);
  })
  .finally(renderApp);
