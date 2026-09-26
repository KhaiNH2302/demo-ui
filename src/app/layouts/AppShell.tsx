import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/shared/AppHeader';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { DevScenarioPanel } from '@/components/shared/DevScenarioPanel';
import { cn } from '@/lib/cn';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const isFullBleed = location.pathname.startsWith('/chats');

  // Sidebar collapse state (desktop)
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
        'bg-neutral-50/60 flex flex-col antialiased min-h-screen',
        isFullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'
      )}
    >
      {/* 1. Global Brand Header (64px, Sticky Top) */}
      <AppHeader
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={collapsed}
      />

      {/* 2. Workspace Body: Left Sidebar + Main Content */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block shrink-0">
          <AppSidebar
            variant={collapsed ? 'collapsed' : 'expanded'}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* Main Content Area */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-200',
            isFullBleed && 'h-[calc(100vh-4rem)] overflow-hidden'
          )}
        >
          <main
            className={cn(
              'w-full flex-1',
              isFullBleed
                ? 'p-0 m-0 overflow-hidden'
                : 'max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-12'
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <BottomTabBar />

      {/* 4. Developer Scenario Switcher */}
      <DevScenarioPanel />
    </div>
  );
};

export default AppShell;
