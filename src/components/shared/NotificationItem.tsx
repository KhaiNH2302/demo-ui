import React from 'react';
import {
  Repeat2,
  UsersRound,
  FileCheck,
  CalendarDays,
  ShieldAlert,
  GraduationCap,
  Wallet,
  Bell,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/entities';

const sourceIcons: Record<string, React.ReactNode> = {
  Swap: <Repeat2 size={12} className="text-brand-600" />,
  swap: <Repeat2 size={12} className="text-brand-600" />,
  GroupJoin: <UsersRound size={12} className="text-emerald-600" />,
  group_join: <UsersRound size={12} className="text-emerald-600" />,
  ClubApplication: <FileCheck size={12} className="text-amber-600" />,
  club_application: <FileCheck size={12} className="text-amber-600" />,
  ClubEvent: <CalendarDays size={12} className="text-indigo-600" />,
  club_event: <CalendarDays size={12} className="text-indigo-600" />,
  ClubRole: <ShieldAlert size={12} className="text-purple-600" />,
  club_role: <ShieldAlert size={12} className="text-purple-600" />,
  ClubFinance: <Wallet size={12} className="text-blue-600" />,
  club_finance: <Wallet size={12} className="text-blue-600" />,
  Mentoring: <GraduationCap size={12} className="text-emerald-600" />,
  mentoring: <GraduationCap size={12} className="text-emerald-600" />,
  Moderation: <ShieldAlert size={12} className="text-rose-600" />,
  moderation: <ShieldAlert size={12} className="text-rose-600" />,
};

export interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  actions?: React.ReactNode;
  className?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  actions,
  className,
}) => {
  const initial = notification.title.trim().charAt(0).toUpperCase() || 'S';

  return (
    <div
      onClick={() => onClick?.(notification)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer text-left',
        notification.read ? 'bg-surface hover:bg-neutral-100' : 'bg-brand-50/40 hover:bg-brand-50/60 dark:bg-brand-950/40 dark:hover:bg-brand-950/60',
        className
      )}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-semibold text-xs shrink-0 mt-0.5">
        {initial}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-neutral-200 shadow-xs">
          {sourceIcons[notification.source] || <Bell size={11} className="text-neutral-600" />}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h5
            className={cn(
              'text-sm truncate',
              notification.read ? 'font-medium text-neutral-800' : 'font-semibold text-neutral-900'
            )}
          >
            {notification.title}
          </h5>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-caption text-neutral-400">
              {formatRelativeTime(notification.createdAt)}
            </span>
            {!notification.read && <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0" />}
          </div>
        </div>
        <p className="text-meta text-neutral-600 mt-0.5 line-clamp-2">{notification.body}</p>
        {actions && (
          <div
            className="mt-2 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
