import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { FilterBar } from '@/components/shared/FilterBar';
import { NotificationItem } from '@/components/shared/NotificationItem';
import { EntityRow } from '@/components/shared/EntityRow';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Bell, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/components/ui/Toast';
import type { Notification, Follow } from '@/types/entities';

interface FollowRequestItem {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  major?: string;
  cohort?: string;
  createdAt: string;
}

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

type TimeBucket = 'Mới' | 'Hôm nay' | 'Tuần này' | 'Trước đó';

function classifyBucket(item: Notification): TimeBucket {
  const now = new Date();
  const created = new Date(item.createdAt);
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 3600);

  if (!item.read && diffHours <= 6) {
    return 'Mới';
  }
  const isSameDay =
    now.getFullYear() === created.getFullYear() &&
    now.getMonth() === created.getMonth() &&
    now.getDate() === created.getDate();
  if (isSameDay) {
    return 'Hôm nay';
  }
  if (diffHours <= 24 * 7) {
    return 'Tuần này';
  }
  return 'Trước đó';
}

export default function NotificationsPage() {
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedRead, setSelectedRead] = useState('');
  const [followReqsOpen, setFollowReqsOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const followRequestsQuery = useQuery({
    queryKey: ['follow-requests'],
    queryFn: () => apiClient.get<{ incoming: Follow[]; outgoing: Follow[] }>('/follow-requests'),
  });
  const followRequests: FollowRequestItem[] = (followRequestsQuery.data?.incoming || []).map((item) => ({
    id: item.id, userId: item.followerId, fullName: item.followerName,
    avatarUrl: item.followerAvatar, major: item.followerMeta, createdAt: item.createdAt,
  }));
  const followResponseMutation = useMutation({
    mutationFn: ({ req, action }: { req: FollowRequestItem; action: 'approve' | 'reject' }) => apiClient.put(`/follow-requests/${req.id}/respond`, { action: action === 'approve' ? 'accept' : 'decline' }),
    onSuccess: (_, { req, action }) => {
      toast.success(action === 'approve' ? `Đã xác nhận yêu cầu theo dõi từ ${req.fullName}` : `Đã từ chối yêu cầu theo dõi từ ${req.fullName}`);
      [['follow-requests'], ['profile'], ['users'], ['people'], ['nav'], ['notifications'], ['dashboard'], ['requests']].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể phản hồi yêu cầu theo dõi.'),
  });

  const notificationsQuery = useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list({
      source: selectedSource,
      read: selectedRead ? selectedRead === 'true' : undefined,
    }),
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['nav'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể đánh dấu thông báo đã đọc.'),
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

  const handleFollowRequestAction = (req: FollowRequestItem, action: 'approve' | 'reject') => {
    followResponseMutation.mutate({ req, action });
  };

  const grouped = useMemo(() => {
    const items = notificationsQuery.data ?? [];
    const buckets: Record<TimeBucket, Notification[]> = {
      Mới: [],
      'Hôm nay': [],
      'Tuần này': [],
      'Trước đó': [],
    };
    for (const item of items) {
      buckets[classifyBucket(item)].push(item);
    }
    return buckets;
  }, [notificationsQuery.data]);

  const bucketOrder: TimeBucket[] = ['Mới', 'Hôm nay', 'Tuần này', 'Trước đó'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Thông báo của bạn"
        description="Theo dõi cập nhật từ các yêu cầu đổi lớp, cơ hội CLB, nhóm học tập và hoạt động Mentoring"
      />

      {/* Dòng Yêu cầu theo dõi đầu danh sách (05-social-patterns #8) */}
      <QueryBoundary query={followRequestsQuery}>
      {followRequests.length > 0 && (
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setFollowReqsOpen((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  Yêu cầu theo dõi ({followRequests.length})
                </div>
                <div className="text-caption text-neutral-500">
                  {followRequests.map((r) => r.fullName).join(', ')} muốn theo dõi hồ sơ của bạn
                </div>
              </div>
            </div>
            {followReqsOpen ? (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-neutral-500" />
            )}
          </button>

          {followReqsOpen && (
            <div className="border-t border-neutral-200 px-4 divide-y divide-neutral-100">
              {followRequests.map((req) => (
                <EntityRow
                  key={req.id}
                  href={`/users/${req.userId}`}
                  leading={
                    <UserAvatar
                      user={{
                        id: req.userId,
                        fullName: req.fullName,
                        avatarUrl: req.avatarUrl,
                      }}
                      size="sm"
                      linkToProfile={false}
                    />
                  }
                  title={req.fullName}
                  subtitle={[req.major, req.cohort].filter(Boolean).join(' · ')}
                  actions={
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleFollowRequestAction(req, 'approve')}
                        loading={followResponseMutation.isPending && followResponseMutation.variables?.req.id === req.id && followResponseMutation.variables?.action === 'approve'}
                        disabled={followResponseMutation.isPending}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleFollowRequestAction(req, 'reject')}
                        disabled={followResponseMutation.isPending}
                      >
                        Xóa
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </Card>
      )}
      </QueryBoundary>

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
        empty={
          <EmptyState
            icon={Bell}
            title="Không có thông báo nào"
            description="Bạn đã cập nhật mọi thông báo mới nhất."
          />
        }
      >
        {() => (
          <div className="space-y-4">
            {bucketOrder.map((bucket) => {
              const items = grouped[bucket];
              if (!items || items.length === 0) return null;
              return (
                <Card key={bucket}>
                  <div className="px-4 pt-3 pb-1 text-caption font-semibold text-neutral-500 uppercase tracking-wider">
                    {bucket}
                  </div>
                  <CardContent className="p-2 divide-y divide-neutral-100">
                    {items.map((item) => {
                      const needsAction =
                        !item.read &&
                        (item.source === 'GroupJoin' ||
                          item.source === 'Swap' ||
                          item.source === 'Mentoring');
                      return (
                        <NotificationItem
                          key={item.id}
                          notification={item}
                          onClick={handleItemClick}
                          actions={
                            needsAction ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleItemClick(item)}
                              >
                                Xem & phản hồi
                              </Button>
                            ) : undefined
                          }
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
