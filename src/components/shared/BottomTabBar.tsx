import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Repeat2, Plus, MessageSquare, User } from 'lucide-react';
import { QuickCreateSheet } from './QuickCreateSheet';
import { cn } from '@/lib/cn';

export const BottomTabBar: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const location = useLocation();

  const tabs = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      exact: true,
      active: location.pathname === '/',
    },
    {
      to: '/swap',
      label: 'Đổi lớp',
      icon: Repeat2,
      active: location.pathname.startsWith('/swap'),
    },
    {
      isAction: true,
      label: 'Tạo',
      icon: Plus,
    },
    {
      to: '/chats',
      label: 'Chat',
      icon: MessageSquare,
      active: location.pathname.startsWith('/chats'),
    },
    {
      to: '/profile/me',
      label: 'Hồ sơ',
      icon: User,
      active: location.pathname.startsWith('/profile'),
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden flex items-center justify-around border-t border-neutral-200 bg-white/95 px-2 py-1.5 backdrop-blur-md shadow-lg select-none">
        {tabs.map((tab, idx) => {
          if (tab.isAction) {
            return (
              <button
                key="action-create"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="group -mt-5 flex flex-col items-center justify-center focus:outline-none cursor-pointer"
              >
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 group-hover:scale-105">
                  <Plus size={26} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-brand-600 mt-1">Tạo mới</span>
              </button>
            );
          }

          const Icon = tab.icon!;
          const isActive = tab.active;

          return (
            <NavLink
              key={tab.to || idx}
              to={tab.to!}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px]',
                isActive ? 'text-brand-600 font-bold' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              <Icon size={20} className={cn('transition-transform', isActive && 'scale-110')} />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <QuickCreateSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
};
