import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { IconRailNav } from '@/components/shared/IconRailNav';
import { Topbar } from '@/components/shared/Topbar';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { DevScenarioPanel } from '@/components/shared/DevScenarioPanel';
import { cn } from '@/lib/cn';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const isFullBleed = location.pathname.startsWith('/chats');

  return (
    <div
      className={cn(
        'bg-neutral-50/60 flex flex-col antialiased',
        isFullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'
      )}
    >
      {/* 72px Fixed Desktop Left Rail */}
      <IconRailNav />

      {/* Main Column (offset by 72px on desktop) */}
      <div
        className={cn(
          'flex-1 flex flex-col md:pl-[72px] transition-all',
          isFullBleed && 'h-full overflow-hidden'
        )}
      >
        {/* Global Topbar */}
        <Topbar />

        {/* Dynamic Page Content */}
        <main
          className={cn(
            'w-full',
            isFullBleed
              ? 'flex-1 min-h-0 p-0 m-0 overflow-hidden'
              : 'flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-12'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomTabBar />

      {/* Developer Scenario Switcher */}
      <DevScenarioPanel />
    </div>
  );
};

export default AppShell;
