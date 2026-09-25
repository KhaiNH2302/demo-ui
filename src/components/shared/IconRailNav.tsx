import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Repeat2,
  Compass,
  MessageCircle,
  LayoutList,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { getActiveNavKey, type NavKey } from '@/lib/navigation';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

interface NavCounters {
  unreadMessages: number;
  pendingSwapInvites: number;
  myActionItems: number;
  unreadNotifications: number;
}

export const IconRailNav: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const activeKey = getActiveNavKey(location.pathname, false);

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

  const navItems: {
    key: NavKey;
    to: string;
    label: string;
    icon: React.ElementType;
    badgeType?: 'dot' | 'count';
    badgeValue?: number;
  }[] = [
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
      key: 'discover',
      to: '/discover',
      label: 'Khám phá',
      icon: Compass,
    },
    {
      key: 'chats',
      to: '/chats',
      label: 'Tin nhắn',
      icon: MessageCircle,
      badgeType: 'count',
      badgeValue: counters?.unreadMessages || 0,
    },
  ];

  const isProfileActive = location.pathname.startsWith('/profile');

  return (
    <aside
      aria-label="Thanh điều hướng chính"
      className="fixed inset-y-0 left-0 z-30 hidden md:flex w-[72px] h-screen overflow-hidden flex-col items-center justify-between border-r border-neutral-200 bg-white py-3.5 select-none shadow-2xs"
    >
      {/* Top Logo & Main Items */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Link
          to="/"
          aria-label="Về trang chủ SCS"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white font-black text-lg shadow-xs hover:bg-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 shrink-0"
        >
          S
        </Link>

        {/* Main Nav Items */}
        <nav className="flex flex-col items-center gap-1 w-full px-2" aria-label="Menu chính">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <NavLink
                key={item.key}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/40 shrink-0',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                {/* 3px Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-[-8px] top-2 bottom-2 w-[3px] rounded-r-full bg-brand-500" />
                )}

                <Icon size={21} strokeWidth={1.75} />

                {/* Badges */}
                {item.badgeType === 'dot' && (item.badgeValue ?? 0) > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
                )}
                {item.badgeType === 'count' && (item.badgeValue ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {(item.badgeValue ?? 0) > 9 ? '9+' : item.badgeValue}
                  </span>
                )}

                {/* Tooltip on hover & focus */}
                <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block group-focus-visible:block whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Của tôi & Profile Avatar */}
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        {/* Của tôi item */}
        <NavLink
          to="/me"
          aria-label="Của tôi"
          className={cn(
            'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/40 shrink-0',
            activeKey === 'me'
              ? 'bg-brand-50 text-brand-600'
              : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
          )}
        >
          {activeKey === 'me' && (
            <span className="absolute left-[-8px] top-2 bottom-2 w-[3px] rounded-r-full bg-brand-500" />
          )}
          <LayoutList size={21} strokeWidth={1.75} />

          {(counters?.myActionItems ?? 0) > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {(counters?.myActionItems ?? 0) > 9 ? '9+' : counters?.myActionItems}
            </span>
          )}

          <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block group-focus-visible:block whitespace-nowrap pointer-events-none">
            Của tôi
          </span>
        </NavLink>

        {/* Profile Avatar */}
        <NavLink
          to="/profile/me"
          aria-label="Hồ sơ cá nhân"
          className={cn(
            'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40 shrink-0',
            isProfileActive ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:opacity-85'
          )}
        >
          <Avatar
            src={user?.avatarUrl}
            name={user?.fullName || 'User'}
            size="md"
          />
          <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block group-focus-visible:block whitespace-nowrap pointer-events-none">
            Hồ sơ
          </span>
        </NavLink>
      </div>
    </aside>
  );
};

export default IconRailNav;
