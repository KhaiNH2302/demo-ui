import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { apiClient } from '@/lib/apiClient';
import type { MentoringRequest } from '@/types/entities';

/**
 * [MC0] Khung Mentor Center — luồng FE-05 phía Mentor.
 * Trang đầu tiên là Yêu cầu nhận được; bật/tắt "Nhận yêu cầu" cấu hình ở tab Hồ sơ Mentor.
 */
export const MentorCenterShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: requests } = useQuery({
    queryKey: ['mentor', 'requests'],
    queryFn: async () => {
      try {
        return await apiClient.get<MentoringRequest[]>('/mentor/requests');
      } catch {
        return [];
      }
    },
  });

  const pendingCount = (Array.isArray(requests) ? requests : []).filter(
    (r) => r.status === 'PENDING_MENTOR_RESPONSE'
  ).length;

  const path = location.pathname;
  const currentTab = path.startsWith('/mentor/posts')
    ? 'posts'
    : path.startsWith('/mentor/profile')
    ? 'profile'
    : 'requests';

  const menuOptions = [
    {
      value: 'requests',
      label: 'Yêu cầu nhận được',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { value: 'posts', label: 'Bài đăng' },
    { value: 'profile', label: 'Hồ sơ Mentor' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-3 overflow-x-auto">
        <SegmentedControl
          options={menuOptions}
          value={currentTab}
          onValueChange={(val) => navigate(`/mentor/${val}`)}
          size="md"
        />
      </div>

      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
};

export default MentorCenterShell;
