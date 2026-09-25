import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import type { Mentor, MentoringRequest } from '@/types/entities';

export const MentorCenterShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mentor } = useQuery({
    queryKey: ['mentor', 'profile'],
    queryFn: async () => {
      try {
        return await apiClient.get<Mentor>('/mentor/profile');
      } catch {
        return null;
      }
    },
  });

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

  const [accepting, setAccepting] = useState(mentor?.acceptingRequests ?? true);

  const toggleAcceptingMutation = useMutation({
    mutationFn: (newVal: boolean) =>
      apiClient.put('/mentor/profile', { ...mentor, acceptingRequests: newVal }),
    onSuccess: (_, newVal) => {
      setAccepting(newVal);
      queryClient.invalidateQueries({ queryKey: ['mentor', 'profile'] });
      toast({
        variant: 'success',
        title: newVal ? 'Đã bật nhận yêu cầu' : 'Đã tạm ngưng nhận yêu cầu',
      });
    },
    onError: () => {
      toast({ variant: 'error', title: 'Không thể cập nhật trạng thái' });
    },
  });

  const pendingCount = (requests || []).filter(
    (r) => r.status === 'PENDING_MENTOR_RESPONSE'
  ).length;

  const currentTab = location.pathname.includes('/posts')
    ? 'posts'
    : location.pathname.includes('/requests')
    ? 'requests'
    : 'profile';

  const menuOptions = [
    { value: 'profile', label: 'Hồ sơ Mentor' },
    { value: 'posts', label: 'Bài đăng' },
    {
      value: 'requests',
      label: pendingCount > 0 ? `Yêu cầu (${pendingCount})` : 'Yêu cầu',
    },
  ];

  const handleTabChange = (val: string) => {
    if (val === 'profile') navigate('/mentor/profile');
    else if (val === 'posts') navigate('/mentor/posts');
    else if (val === 'requests') navigate('/mentor/requests');
  };

  return (
    <div className="space-y-6">
      {/* ContextHeader L3: Quay lại /me */}
      <ContextHeader
        backHref="/me"
        title="Mentor Center"
        avatar={{ src: user?.avatarUrl, name: user?.fullName || 'Mentor' }}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 hidden sm:inline">
              {accepting ? 'Đang nhận yêu cầu' : 'Tạm bận'}
            </span>
            <Switch
              checked={accepting}
              onCheckedChange={(checked) => toggleAcceptingMutation.mutate(checked)}
              aria-label="Bật tắt trạng thái nhận yêu cầu"
            />
          </div>
        }
      />

      {/* Sub-menu SegmentedControl */}
      <div className="border-b border-neutral-200 pb-3">
        <SegmentedControl
          options={menuOptions}
          value={currentTab}
          onValueChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Child Pages Outlet */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  );
};

export default MentorCenterShell;
