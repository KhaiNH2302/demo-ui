import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { DevScenarioPanel } from '@/components/shared/DevScenarioPanel';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30s
    },
  },
});

// Khách và thành viên dùng chung màn hình → khi đăng nhập/đăng xuất tại chỗ phải tải lại dữ liệu
// (cờ cá nhân như đã theo dõi, đã đăng ký...) thay vì giữ cache của người xem trước.
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) {
    queryClient.resetQueries();
  }
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          {children}
          <DevScenarioPanel />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
