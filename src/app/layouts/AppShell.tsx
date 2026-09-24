import React from 'react';
import { Outlet } from 'react-router-dom';
import { IconRailNav } from '@/components/shared/IconRailNav';
import { Topbar } from '@/components/shared/Topbar';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { DevScenarioPanel } from '@/components/shared/DevScenarioPanel';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50/60 flex flex-col antialiased">
      {/* 72px Fixed Desktop Left Rail */}
      <IconRailNav />

      {/* Main Column (offset by 72px on desktop) */}
      <div className="flex-1 flex flex-col md:pl-[72px] transition-all">
        {/* Global Topbar */}
        <Topbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-12">
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
