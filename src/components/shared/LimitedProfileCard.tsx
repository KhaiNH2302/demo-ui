import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FollowButton, type FollowButtonState } from './FollowButton';
import type { ProfileVisibility } from '@/types/status';

export interface LimitedProfileCardProps {
  userId: string;
  fullName: string;
  visibility: ProfileVisibility;
  followState?: FollowButtonState;
  isGuest?: boolean;
  onFollowStateChange?: (next: FollowButtonState) => void;
}

export const LimitedProfileCard: React.FC<LimitedProfileCardProps> = ({
  userId,
  fullName,
  visibility,
  followState = 'none',
  isGuest = false,
  onFollowStateChange,
}) => {
  const location = useLocation();
  const redirectParam = encodeURIComponent(location.pathname + location.search);

  return (
    <Card className="p-8 text-center max-w-lg mx-auto my-4 space-y-4">
      <div className="mx-auto h-11 w-11 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
        {visibility === 'followers' ? (
          <Users className="h-5 w-5" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>

      {isGuest && visibility === 'members' ? (
        <>
          <div className="space-y-1">
            <h3 className="text-card-title text-neutral-900">
              Đăng nhập để xem hồ sơ của {fullName}
            </h3>
            <p className="text-meta text-neutral-500">
              Sinh viên này chỉ chia sẻ hồ sơ học tập và hoạt động với các thành viên đã đăng nhập trên SCS.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Link to={`/login?redirectTo=${redirectParam}`}>
              <Button variant="primary" size="sm">
                Đăng nhập bằng email trường
              </Button>
            </Link>
            <Link to={`/register?redirectTo=${redirectParam}`}>
              <Button variant="secondary" size="sm">
                Tạo tài khoản
              </Button>
            </Link>
          </div>
        </>
      ) : visibility === 'followers' ? (
        <>
          <div className="space-y-1">
            <h3 className="text-card-title text-neutral-900">
              Hồ sơ này chỉ hiển thị với người theo dõi đã được chấp nhận
            </h3>
            <p className="text-meta text-neutral-500">
              Theo dõi {fullName} để xem bài viết, hoạt động cộng đồng và thông tin giới thiệu chi tiết.
            </p>
          </div>
          <div className="pt-1 flex justify-center">
            <FollowButton
              userId={userId}
              initialState={followState}
              targetVisibility="followers"
              size="md"
              onChangeState={onFollowStateChange}
            />
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <h3 className="text-card-title text-neutral-900">
            Sinh viên này đang giới hạn hiển thị hồ sơ cá nhân
          </h3>
          <p className="text-meta text-neutral-500">
            Chỉ các thông tin định danh cơ bản được hiển thị theo cài đặt quyền riêng tư của {fullName}.
          </p>
        </div>
      )}
    </Card>
  );
};
