import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, type AvatarProps } from '@/components/ui/Avatar';
import type { User } from '@/types/entities';
import { cn } from '@/lib/cn';

export interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name'> {
  user?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> | null;
  src?: string;
  name?: string;
  linkToProfile?: boolean;
}

/**
 * Wrapper xung quanh Avatar chuẩn hóa nhận entity User hoặc src/name trực tiếp.
 * Tuỳ chọn bọc trong Link tới /users/:id.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  linkToProfile = false,
  className,
  ...avatarProps
}) => {
  const resolvedSrc = user?.avatarUrl || src;
  const resolvedName = user?.fullName || name || 'User';

  const avatar = (
    <Avatar
      src={resolvedSrc}
      name={resolvedName}
      className={cn(linkToProfile && 'cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all', className)}
      {...avatarProps}
    />
  );

  if (linkToProfile && user?.id) {
    return (
      <Link to={`/users/${user.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex shrink-0">
        {avatar}
      </Link>
    );
  }

  return avatar;
};

export default UserAvatar;
