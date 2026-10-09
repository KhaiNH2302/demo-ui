import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/shared/AppHeader';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { LoginGate } from '@/components/shared/LoginGate';
import { GuestAccessBoundary } from '@/components/shared/GuestAccessBoundary';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import { PageLoading } from '@/components/shared/PageLoading';

/**
 * Bố cục chung cho cả thành viên lẫn khách — khách xem như thành viên,
 * quyền truy cập do GuestAccessBoundary quyết định.
 */
export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isFullBleed = !!user && location.pathname.startsWith('/chats');

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('scs_sidebar') === 'collapsed';
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('scs_sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  return (
    <div
      className={cn(
        'bg-neutral-50/50 flex flex-col antialiased min-h-screen',
        isFullBleed ? 'h-screen overflow-hidden' : 'min-h-screen',
      )}
    >
      <AppHeader
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={collapsed}
      />

      <div className="flex-1 flex w-full relative">
        <div className="hidden md:block shrink-0">
          <AppSidebar
            variant={collapsed ? 'collapsed' : 'expanded'}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-200',
            isFullBleed && 'h-[calc(100vh-3.5rem)] overflow-hidden',
          )}
        >
          <main
            className={cn(
              'w-full flex-1',
              isFullBleed
                ? 'p-0 m-0 overflow-hidden'
                : 'max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] 4xl:max-w-[2240px] mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-12',
            )}
          >
            <React.Suspense fallback={<PageLoading />}>
              <GuestAccessBoundary>{children ?? <Outlet />}</GuestAccessBoundary>
            </React.Suspense>
          </main>
        </div>
      </div>

      <BottomTabBar />
      <LoginGate />
    </div>
  );
};

export default AppShell;
