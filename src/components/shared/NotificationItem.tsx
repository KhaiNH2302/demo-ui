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
import type { Notification, NotificationSource } from '@/types/entities';

const sourceIcons: Record<string, React.ReactNode> = {
  Swap: <Repeat2 size={16} className="text-brand-500" />,
  swap: <Repeat2 size={16} className="text-brand-500" />,
  GroupJoin: <UsersRound size={16} className="text-emerald-500" />,
  group_join: <UsersRound size={16} className="text-emerald-500" />,
  ClubApplication: <FileCheck size={16} className="text-amber-500" />,
  club_application: <FileCheck size={16} className="text-amber-500" />,
  ClubEvent: <CalendarDays size={16} className="text-indigo-500" />,
  club_event: <CalendarDays size={16} className="text-indigo-500" />,
  ClubRole: <ShieldAlert size={16} className="text-purple-500" />,
  club_role: <ShieldAlert size={16} className="text-purple-500" />,
  ClubFinance: <Wallet size={16} className="text-blue-500" />,
  club_finance: <Wallet size={16} className="text-blue-500" />,
  Mentoring: <GraduationCap size={16} className="text-emerald-600" />,
  mentoring: <GraduationCap size={16} className="text-emerald-600" />,
  Moderation: <ShieldAlert size={16} className="text-rose-500" />,
  moderation: <ShieldAlert size={16} className="text-rose-500" />,
};

export interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  className?: string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={() => onClick?.(notification)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer text-left',
        notification.read ? 'bg-white hover:bg-neutral-50' : 'bg-brand-50/30 hover:bg-brand-50/50',
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 shrink-0 mt-0.5">
        {sourceIcons[notification.source] || <Bell size={16} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h5
            className={cn(
              'text-xs truncate',
              notification.read ? 'font-medium text-neutral-800' : 'font-semibold text-neutral-900'
            )}
          >
            {notification.title}
          </h5>
          {!notification.read && <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />}
        </div>
        <p className="text-meta text-neutral-600 mt-0.5 line-clamp-2">{notification.body}</p>
        <span className="text-[10px] text-neutral-400 mt-1 block">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );
};
