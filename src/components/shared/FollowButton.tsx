import React, { useState } from 'react';
import { UserCheck, UserPlus, Clock, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGuardedAction } from '@/lib/guestGate';
import type { ProfileVisibility } from '@/types/status';

export type FollowButtonState = 'none' | 'following' | 'requested' | 'follows_you';

export interface FollowButtonProps {
  userId: string;
  initialState?: FollowButtonState;
  targetVisibility?: ProfileVisibility;
  size?: 'sm' | 'md';
  onChangeState?: (nextState: FollowButtonState) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialState = 'none',
  targetVisibility = 'members',
  size = 'sm',
  onChangeState,
}) => {
  const [state, setState] = useState<FollowButtonState>(initialState);
  const [hovering, setHovering] = useState(false);
  const guard = useGuardedAction();

  const updateState = (next: FollowButtonState) => {
    setState(next);
    onChangeState?.(next);
  };

  const handleFollow = guard(
    'follow',
    () => {
      const next: FollowButtonState =
        targetVisibility === 'followers' || targetVisibility === 'private'
          ? 'requested'
          : 'following';
      updateState(next);
    },
    { targetId: userId }
  );

  const handleUnfollowOrCancel = guard(
    'follow',
    () => {
      updateState('none');
    },
    { targetId: userId }
  );

  if (state === 'following') {
    return (
      <Button
        variant={hovering ? 'danger' : 'secondary'}
        size={size}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={handleUnfollowOrCancel}
        leftIcon={hovering ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      >
        {hovering ? 'Bỏ theo dõi' : 'Đang theo dõi'}
      </Button>
    );
  }

  if (state === 'requested') {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleUnfollowOrCancel}
        leftIcon={<Clock className="h-3.5 w-3.5" />}
      >
        Đã gửi yêu cầu
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      onClick={handleFollow}
      leftIcon={<UserPlus className="h-3.5 w-3.5" />}
    >
      {state === 'follows_you' ? 'Theo dõi lại' : 'Theo dõi'}
    </Button>
  );
};
