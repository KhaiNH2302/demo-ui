import React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { UserMiniCard } from './UserMiniCard';
import type { User } from '@/types/entities';

export interface UserHoverCardProps {
  user: User;
  children?: React.ReactNode;
}

export const UserHoverCard: React.FC<UserHoverCardProps> = ({ user, children }) => {
  return (
    <HoverCardPrimitive.Root>
      <HoverCardPrimitive.Trigger asChild>
        {children || <span className="font-medium text-brand-600 hover:underline cursor-pointer">{user.fullName}</span>}
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-50 w-72 rounded-lg border border-neutral-200 bg-surface p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          sideOffset={5}
        >
          <UserMiniCard user={user} size="lg" linkToProfile={true} />
          <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-600 space-y-1">
            <div><span className="font-semibold text-neutral-700">Email: </span>{user.email}</div>
            {user.studentCode && <div><span className="font-semibold text-neutral-700">MSSV: </span>{user.studentCode}</div>}
            <div><span className="font-semibold text-neutral-700">Trường: </span>{user.school}</div>
          </div>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
};
