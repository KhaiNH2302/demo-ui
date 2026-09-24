import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterBar } from '@/components/shared/FilterBar';
import { NotificationItem } from '@/components/shared/NotificationItem';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Bell } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { Notification } from '@/types/entities';

const sourceOptions = [
  { value: '', label: 'Tất cả nguồn' },
  { value: 'Swap', label: 'Đổi lớp' },
  { value: 'GroupJoin', label: 'Nhóm học tập' },
  { value: 'ClubApplication', label: 'Đơn CLB' },
  { value: 'ClubEvent', label: 'Sự kiện CLB' },
  { value: 'ClubRole', label: 'Vai trò CLB' },
  { value: 'ClubFinance', label: 'Quỹ CLB' },
  { value: 'Mentoring', label: 'Mentoring' },
  { value: 'Moderation', label: 'Kiểm duyệt' },
];

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'false', label: 'Chưa đọc' },
  { value: 'true', label: 'Đã đọc' },
];

export default function NotificationsPage() {
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedRead, setSelectedRead] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list({ source: selectedSource, read: selectedRead ? selectedRead === 'true' : undefined }),
    queryFn: () =>
      apiClient.get('/notifications', {
        params: {
          source: selectedSource || undefined,
          read: selectedRead || undefined,
        },
      }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });

  const handleItemClick = (item: Notification) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    navigate(item.linkTo);
  };

  const handleClearFilters = () => {
    setSelectedSource('');
    setSelectedRead('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Thông báo của bạn"
        description="Theo dõi cập nhật từ các yêu cầu đổi lớp, ứng tuyển CLB, nhóm học tập và hoạt động Mentoring"
      />

      <FilterBar
        onClear={handleClearFilters}
        showClear={!!selectedSource || !!selectedRead}
      >
        <div className="w-44">
          <Select
            options={statusOptions}
            value={selectedRead}
            onValueChange={setSelectedRead}
          />
        </div>
        <div className="w-48">
          <Select
            options={sourceOptions}
            value={selectedSource}
            onValueChange={setSelectedSource}
          />
        </div>
      </FilterBar>

      <QueryBoundary
        query={notificationsQuery}
        isEmpty={(data) => data.length === 0}
        empty={<EmptyState icon={Bell} title="Không có thông báo nào" description="Bạn đã cập nhật mọi thông báo mới nhất." />}
      >
        {(data) => (
          <Card>
            <CardContent className="p-2 divide-y divide-neutral-100">
              {data.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onClick={handleItemClick}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </QueryBoundary>
    </div>
  );
}
