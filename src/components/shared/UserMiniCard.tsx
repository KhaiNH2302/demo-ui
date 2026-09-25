import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import type { User } from '@/types/entities';
import { seedUsers } from '@/mocks/data/users';

export interface UserMiniCardProps {
  user?: Partial<User>;
  userId?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  linkToProfile?: boolean;
  action?: React.ReactNode;
  showMajor?: boolean;
  className?: string;
}

export const UserMiniCard: React.FC<UserMiniCardProps> = ({
  user,
  userId,
  subtitle,
  size = 'md',
  linkToProfile = true,
  action,
  showMajor = false,
  className,
}) => {
  // Resolve user either from prop or from mock seed
  let targetUser = user;
  if (!targetUser && userId) {
    targetUser = seedUsers.find((u) => u.id === userId);
  }

  const fullName = targetUser?.fullName || userId || 'Người dùng';
  const displaySubtitle =
    subtitle ||
    (showMajor ? targetUser?.major || 'Kỹ thuật phần mềm' : targetUser?.school || 'FPT University');

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar
        src={targetUser?.avatarUrl}
        name={fullName}
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
      />
      <div className="min-w-0">
        <div
          className={cn(
            'font-medium text-neutral-900 truncate',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {fullName}
        </div>
        {displaySubtitle && (
          <div className="text-xs text-neutral-500 truncate">{displaySubtitle}</div>
        )}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );

  if (linkToProfile && (targetUser?.id || userId)) {
    return (
      <Link to={`/users/${targetUser?.id || userId}`} className="hover:opacity-85 transition-opacity block">
        {content}
      </Link>
    );
  }

  return content;
};
