import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, type AvatarProps } from '@/components/ui/Avatar';
import type { User } from '@/types/entities';
import { cn } from '@/lib/cn';
import { useViewer, useLoginGateStore } from '@/lib/viewer';

export interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'name'> {
  user?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> | null;
  src?: string;
  name?: string;
  linkToProfile?: boolean;
}

/**
 * Wrapper xung quanh Avatar chuẩn hóa nhận entity User hoặc src/name trực tiếp.
 * Tuỳ chọn mở /users/:id (nếu Guest thì bật LoginGate theo GU5.2).
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  linkToProfile = false,
  className,
  ...avatarProps
}) => {
  const navigate = useNavigate();
  const { can } = useViewer();
  const openGate = useLoginGateStore((s) => s.openGate);

  const resolvedName = user?.fullName || name || 'User';
  const resolvedSrc =
    user?.avatarUrl ||
    src ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.id || resolvedName)}`;

  const avatar = (
    <Avatar
      src={resolvedSrc}
      name={resolvedName}
      className={cn(
        linkToProfile && 'cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all',
        className,
      )}
      {...avatarProps}
    />
  );

  if (linkToProfile && user?.id) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (can('profile.open')) {
            navigate(`/users/${user.id}`);
          } else {
            openGate(`xem hồ sơ của ${resolvedName}`, `/users/${user.id}`);
          }
        }}
        className="inline-flex shrink-0 rounded-full focus:outline-none"
      >
        {avatar}
      </button>
    );
  }

  return avatar;
};

export default UserAvatar;
