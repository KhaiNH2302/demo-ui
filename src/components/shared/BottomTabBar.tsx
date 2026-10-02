import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Plus, MessageCircle, Menu } from 'lucide-react';
import { QuickCreateSheet } from './QuickCreateSheet';
import { AppSidebar } from './AppSidebar';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { getActiveMobileTab } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { NavCounters } from '@/types/entities';
import { cn } from '@/lib/cn';

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false);

  const activeTab = getActiveMobileTab(location.pathname);

  // Counters for badges
  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
    refetchInterval: 30000,
  });

  const unreadMessagesCount = (counters?.unreadMessages || 0) + (counters?.pendingMessageRequests || 0);

  // Total badge count for Menu (notifications, groups, swap, mentoring, requests)
  const menuBadgeCount =
    (counters?.unreadNotifications || 0) +
    (counters?.pendingGroupJoinRequests || 0) +
    (counters?.pendingRequestsTotal || 0) +
    (counters?.pendingMentoringRequests || 0) +
    (counters?.todayRegisteredEvents || 0);

  return (
    <>
      <nav
        aria-label="Điều hướng chính di động"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-neutral-200 bg-surface/95 px-2 backdrop-blur-md md:hidden shadow-lg"
      >
        {/* 1. Trang chủ */}
        <NavLink
          to="/"
          className={() =>
            cn(
              'flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors select-none',
              activeTab === 'home' ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          <Home size={20} className={activeTab === 'home' ? 'text-brand-600' : 'text-neutral-500'} />
          <span className="mt-1">Trang chủ</span>
        </NavLink>

        {/* 2. Kiến thức */}
        <NavLink
          to="/knowledge"
          className={() =>
            cn(
              'flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors select-none',
              activeTab === 'knowledge' ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          <BookOpen size={20} className={activeTab === 'knowledge' ? 'text-brand-600' : 'text-neutral-500'} />
          <span className="mt-1">Kiến thức</span>
        </NavLink>

        {/* 3. Nút Tạo mới ở giữa (nhô cao 8px) */}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setQuickCreateOpen(true)}
            aria-label="Tạo mới nhanh"
            className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* 4. Tin nhắn */}
        <NavLink
          to="/chats"
          className={() =>
            cn(
              'relative flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors select-none',
              activeTab === 'chats' ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
            )
          }
        >
          <div className="relative">
            <MessageCircle size={20} className={activeTab === 'chats' ? 'text-brand-600' : 'text-neutral-500'} />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-surface">
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="mt-1">Tin nhắn</span>
        </NavLink>

        {/* 5. Menu (mở full sidebar dạng Sheet) */}
        <button
          type="button"
          onClick={() => setSidebarSheetOpen(true)}
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors select-none',
            activeTab === 'menu' ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-900'
          )}
        >
          <div className="relative">
            <Menu size={20} className={activeTab === 'menu' ? 'text-brand-600' : 'text-neutral-500'} />
            {menuBadgeCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-surface">
                {menuBadgeCount > 9 ? '9+' : menuBadgeCount}
              </span>
            )}
          </div>
          <span className="mt-1">Menu</span>
        </button>
      </nav>

      {/* Quick Create Dialog Sheet */}
      <QuickCreateSheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen} />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarSheetOpen} onOpenChange={setSidebarSheetOpen}>
        <SheetContent side="left" className="p-0 w-[85%] sm:max-w-sm">
          <div className="h-full flex flex-col pt-3">
            <div className="px-4 pb-2 border-b border-neutral-100 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                S
              </div>
              <span className="font-bold text-base text-neutral-900">SCS Menu</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AppSidebar variant="sheet" onNavigate={() => setSidebarSheetOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BottomTabBar;
