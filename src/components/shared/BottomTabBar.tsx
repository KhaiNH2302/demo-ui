import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Repeat2, Plus, MessageCircle, LayoutList } from 'lucide-react';
import { QuickCreateSheet } from './QuickCreateSheet';
import { getActiveNavKey } from '@/lib/navigation';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

interface NavCounters {
  unreadMessages: number;
  pendingSwapInvites: number;
  myActionItems: number;
  unreadNotifications: number;
}

export const BottomTabBar: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const location = useLocation();
  const activeKey = getActiveNavKey(location.pathname, true);

  const { data: counters } = useQuery({
    queryKey: ['nav', 'counters'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<NavCounters>('/nav/counters');
        return res;
      } catch {
        return { unreadMessages: 0, pendingSwapInvites: 0, myActionItems: 0, unreadNotifications: 0 };
      }
    },
    refetchInterval: 30000,
  });

  const tabs: (
    | {
        key: 'home' | 'swap' | 'chats' | 'me';
        to: string;
        label: string;
        icon: React.ElementType;
        badgeType?: 'dot' | 'count';
        badgeValue?: number;
        isAction?: false;
      }
    | {
        isAction: true;
        label: string;
        icon: React.ElementType;
        key?: undefined;
        to?: undefined;
        badgeType?: undefined;
        badgeValue?: undefined;
      }
  )[] = [
    {
      key: 'home',
      to: '/',
      label: 'Trang chủ',
      icon: Home,
    },
    {
      key: 'swap',
      to: '/swap',
      label: 'Đổi lớp',
      icon: Repeat2,
      badgeType: 'dot',
      badgeValue: counters?.pendingSwapInvites || 0,
    },
    {
      isAction: true,
      label: 'Tạo mới',
      icon: Plus,
    },
    {
      key: 'chats',
      to: '/chats',
      label: 'Tin nhắn',
      icon: MessageCircle,
      badgeType: 'count',
      badgeValue: counters?.unreadMessages || 0,
    },
    {
      key: 'me',
      to: '/me',
      label: 'Của tôi',
      icon: LayoutList,
      badgeType: 'count',
      badgeValue: counters?.myActionItems || 0,
    },
  ];

  return (
    <>
      <nav
        aria-label="Điều hướng dưới cùng trên di động"
        className="fixed bottom-0 inset-x-0 z-30 md:hidden flex items-center justify-around border-t border-neutral-200 bg-white/95 px-2 py-1.5 backdrop-blur-md shadow-lg select-none"
      >
        {tabs.map((tab, idx) => {
          if (tab.isAction) {
            return (
              <button
                key="action-create"
                type="button"
                aria-label="Tạo mới"
                onClick={() => setIsCreateOpen(true)}
                className="group -mt-4 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500/40 rounded-full cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-4 ring-white active:scale-95 transition-transform">
                  <Plus size={24} strokeWidth={2.25} />
                </div>
                <span className="text-[10px] font-semibold text-brand-600 mt-0.5">Tạo mới</span>
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeKey === tab.key;

          return (
            <NavLink
              key={tab.to || idx}
              to={tab.to!}
              aria-label={tab.label}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors cursor-pointer min-w-[56px] focus:outline-none focus:ring-2 focus:ring-brand-500/40',
                isActive ? 'text-brand-600 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={1.75} />
                {tab.badgeType === 'dot' && (tab.badgeValue ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
                )}
                {tab.badgeType === 'count' && (tab.badgeValue ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex min-w-3.5 h-3.5 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {(tab.badgeValue ?? 0) > 9 ? '9+' : tab.badgeValue}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <QuickCreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
};

export default BottomTabBar;
