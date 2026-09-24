import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export interface AvatarStackUser {
  id?: string;
  name: string;
  avatarUrl?: string;
}

export interface AvatarStackProps {
  users: AvatarStackUser[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  max = 4,
  size = 'sm',
  className,
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px] -space-x-1.5',
    md: 'h-8 w-8 text-xs -space-x-2',
    lg: 'h-10 w-10 text-sm -space-x-2.5',
  };

  return (
    <div className={cn('flex items-center', sizeClasses[size].split(' ')[3], className)}>
      {visibleUsers.map((u, i) => (
        <div key={u.id || i} className="relative ring-2 ring-white rounded-full">
          <Avatar src={u.avatarUrl} name={u.name} size={size} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-neutral-200 text-neutral-700 font-bold ring-2 ring-white select-none',
            sizeClasses[size].split(' ')[0],
            sizeClasses[size].split(' ')[1],
            sizeClasses[size].split(' ')[2]
          )}
          title={`+${remainingCount} người khác`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
