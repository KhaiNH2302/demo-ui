import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Repeat2,
  Compass,
  MessageSquare,
  User,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';

export const IconRailNav: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const isMentor = user?.roles.some((r) => r.toLowerCase().includes('mentor'));
  const isAdmin = user?.roles.some((r) => r.toLowerCase().includes('admin'));

  const navItems = [
    {
      to: '/',
      label: 'Trang chủ',
      icon: Home,
      exact: true,
      active: location.pathname === '/',
    },
    {
      to: '/swap',
      label: 'Đổi lịch học',
      icon: Repeat2,
      active: location.pathname.startsWith('/swap'),
    },
    {
      to: '/discover',
      label: 'Khám phá',
      icon: Compass,
      active:
        location.pathname.startsWith('/discover') ||
        location.pathname.startsWith('/groups') ||
        location.pathname.startsWith('/clubs') ||
        location.pathname.startsWith('/knowledge') ||
        (location.pathname.startsWith('/mentoring') && !location.pathname.startsWith('/mentor/')),
    },
    {
      to: '/chats',
      label: 'Tin nhắn',
      icon: MessageSquare,
      active: location.pathname.startsWith('/chats'),
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden md:flex w-[72px] flex-col items-center justify-between border-r border-neutral-200 bg-white py-4 select-none shadow-2xs">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <Link
          to="/"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white font-black text-xl shadow-md hover:scale-105 transition-transform"
          title="Student Connection System — SCS"
        >
          S
        </Link>

        {/* Main Nav Items */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  'group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all cursor-pointer',
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-semibold shadow-xs'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-[-8px] top-2.5 bottom-2.5 w-[4px] rounded-r-full bg-brand-600" />
                )}

                <Icon size={22} className="transition-transform group-hover:scale-110" />

                {/* Floating Tooltip */}
                <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area (Mentor Center, Admin Portal, Profile) */}
      <div className="flex flex-col items-center gap-2.5 w-full px-2">
        {isMentor && (
          <NavLink
            to="/mentor/profile"
            title="Mentor Center"
            className={cn(
              'group relative flex h-11 w-11 items-center justify-center rounded-2xl text-neutral-500 hover:bg-neutral-100 hover:text-purple-600 transition-all',
              location.pathname.startsWith('/mentor/') && 'bg-purple-50 text-purple-600 font-semibold'
            )}
          >
            <GraduationCap size={20} />
            <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap pointer-events-none">
              Mentor Center
            </span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            title="Admin Portal"
            className={cn(
              'group relative flex h-11 w-11 items-center justify-center rounded-2xl text-neutral-500 hover:bg-neutral-100 hover:text-rose-600 transition-all',
              location.pathname.startsWith('/admin') && 'bg-rose-50 text-rose-600 font-semibold'
            )}
          >
            <ShieldCheck size={20} />
            <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap pointer-events-none">
              Quản trị hệ thống
            </span>
          </NavLink>
        )}

        <NavLink
          to="/profile/me"
          title="Hồ sơ của tôi"
          className={cn(
            'group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
            location.pathname.startsWith('/profile')
              ? 'ring-2 ring-brand-500 ring-offset-2'
              : 'hover:opacity-80'
          )}
        >
          <Avatar
            src={user?.avatarUrl}
            name={user?.fullName || 'User'}
            size="md"
          />
          <span className="absolute left-16 z-50 hidden rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap pointer-events-none">
            Hồ sơ cá nhân
          </span>
        </NavLink>
      </div>
    </aside>
  );
};
