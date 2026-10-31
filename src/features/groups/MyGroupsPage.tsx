import React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Plus,
  Settings,
  ArrowRight,
  Clock,
  Bell,
} from 'lucide-react';
import type { Group, GroupJoinRequest, GroupCategory } from '@/types/entities';
import type { GroupInvitation } from '@/mocks/data/groups';
import { invalidateGroupQueries } from './groupQueries';
import { toast } from '@/components/ui/Toast';

const CATEGORY_META: Record<GroupCategory, { label: string; variant: 'brand' | 'neutral' | 'attention' }> = {
  project: { label: 'Đồ án', variant: 'brand' },
  study: { label: 'Môn học', variant: 'neutral' },
  entertainment: { label: 'Giải trí', variant: 'attention' },
};

export const MyGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const ownedGroupsQuery = useQuery({
    queryKey: queryKeys.groups.mine('owner'),
    queryFn: () => apiClient.get<Group[]>('/groups/mine?role=owner'),
  });

  const memberGroupsQuery = useQuery({
    queryKey: queryKeys.groups.mine('member'),
    queryFn: () => apiClient.get<Group[]>('/groups/mine?role=member'),
  });

  const myRequestsQuery = useQuery({
    queryKey: queryKeys.groups.myJoinRequests,
    queryFn: () => apiClient.get<GroupJoinRequest[]>('/join-requests/mine'),
  });

  const invitationsQuery = useQuery({
    queryKey: ['group-invitations', 'mine'],
    queryFn: () => apiClient.get<(GroupInvitation & { groupName: string })[]>('/group-invitations'),
  });

  const invitationMutation = useMutation({
    mutationFn: ({ invitation, decision }: { invitation: GroupInvitation; decision: 'accept' | 'decline' }) =>
      apiClient.post(`/groups/${invitation.groupId}/invitations/${invitation.id}/${decision}`),
    onSuccess: (_, { decision }) => {
      toast.success(decision === 'accept' ? 'Bạn đã tham gia nhóm.' : 'Đã từ chối lời mời.');
      invalidateGroupQueries(queryClient);
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể phản hồi lời mời.'),
  });

  const ownedGroups = ownedGroupsQuery.data || [];
  const memberGroups = memberGroupsQuery.data || [];
  const myRequests = myRequestsQuery.data || [];
  const invitations = invitationsQuery.data || [];

  const totalPendingRequests = ownedGroups.reduce(
    (acc, g) => acc + (g.pendingRequestsCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm của tôi"
        description="Quản lý các nhóm bạn sáng lập, nhóm đang tham gia và theo dõi đơn xin gia nhập"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tìm nhóm', href: '/groups' },
          { label: 'Nhóm của tôi' },
        ]}
        actions={
          <Button onClick={() => navigate('/groups/new')}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo nhóm mới
          </Button>
        }
      />

      <Tabs
        value={searchParams.get('tab') || 'owner'}
        onValueChange={(tab) => setSearchParams({ tab })}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto">
          <TabsTrigger value="owner" className="relative">
            Tôi quản lý ({ownedGroups.length})
            {totalPendingRequests > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {totalPendingRequests}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="member">
            Đã tham gia ({memberGroups.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Yêu cầu đã gửi ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Lời mời ({invitations.filter((item) => item.status === 'Pending').length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Groups Owned */}
        <TabsContent value="owner" className="mt-6">
          <QueryBoundary queries={[ownedGroupsQuery]}>
            {ownedGroups.length === 0 ? (
              <EmptyState
                title="Chưa quản lý nhóm nào"
                description="Bạn chưa tạo nhóm kết nối hay làm đồ án nào. Hãy bắt đầu ngay!"
                action={
                  <Button onClick={() => navigate('/groups/new')}>
                    <Plus className="w-4 h-4 mr-1.5" /> Tạo nhóm mới
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedGroups.map((g) => {
                  const catMeta = g.category ? CATEGORY_META[g.category] : null;

                  return (
                    <Card key={g.id} className="flex flex-col justify-between hover:shadow-xs transition-shadow">
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {catMeta && (
                              <Badge variant={catMeta.variant} className="text-[11px]">
                                {catMeta.label}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-neutral-400" /> {g.memberCount}/{g.memberLimit}
                          </span>
                        </div>

                        <div>
                          <CardTitle className="text-base line-clamp-1 hover:text-brand-600 transition-colors">
                            <Link to={`/groups/${g.id}`}>{g.name}</Link>
                          </CardTitle>
                          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {g.topic || 'Chưa có mô tả chủ đề'}
                          </p>
                        </div>

                        {g.pendingRequestsCount && g.pendingRequestsCount > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold w-fit">
                            <Bell className="w-3 h-3 text-amber-600" /> {g.pendingRequestsCount} đơn chờ duyệt
                          </div>
                        ) : null}
                      </CardHeader>

                      <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="text-xs"
                        >
                          Xem chi tiết
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/groups/${g.id}/manage`)}
                          className="text-xs"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1" /> Quản lý
                          {g.pendingRequestsCount && g.pendingRequestsCount > 0 ? (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                              {g.pendingRequestsCount}
                            </span>
                          ) : null}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 2: Groups Joined */}
        <TabsContent value="member" className="mt-6">
          <QueryBoundary queries={[memberGroupsQuery]}>
            {memberGroups.length === 0 ? (
              <EmptyState
                title="Chưa tham gia nhóm nào"
                description="Khám phá các nhóm kết nối và dự án phù hợp với kỹ năng của bạn"
                action={
                  <Button onClick={() => navigate('/groups')}>
                    Tìm nhóm phù hợp
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memberGroups.map((g) => {
                  const catMeta = g.category ? CATEGORY_META[g.category] : null;

                  return (
                    <Card key={g.id} className="flex flex-col justify-between hover:shadow-xs transition-shadow">
                      <CardHeader className="space-y-2 pb-2">
                        <div className="flex items-center justify-between gap-2">
                          {catMeta && (
                            <Badge variant={catMeta.variant} className="text-[11px]">
                              {catMeta.label}
                            </Badge>
                          )}
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-neutral-400" /> {g.memberCount}/{g.memberLimit}
                          </span>
                        </div>

                        <div>
                          <CardTitle className="text-base line-clamp-1 hover:text-brand-600 transition-colors">
                            <Link to={`/groups/${g.id}`}>{g.name}</Link>
                          </CardTitle>
                          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                            {g.topic || 'Chưa có mô tả chủ đề'}
                          </p>
                        </div>
                      </CardHeader>

                      <CardFooter className="flex items-center justify-end border-t border-[var(--border-subtle)] pt-2.5 mt-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="text-xs"
                        >
                          Vào nhóm <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 3: My Join Requests */}
        <TabsContent value="requests" className="mt-6">
          <QueryBoundary queries={[myRequestsQuery]}>
            {myRequests.length === 0 ? (
              <EmptyState
                title="Không có yêu cầu nào"
                description="Bạn chưa gửi yêu cầu tham gia vào nhóm nào."
              />
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => (
                  <Card key={req.id} className="hover:shadow-xs transition-shadow">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <Link
                            to={`/groups/${req.groupId}`}
                            className="font-semibold text-sm hover:text-brand-600 transition-colors truncate"
                          >
                            {req.groupName || `Mã nhóm: ${req.groupId}`}
                          </Link>
                          {req.appliedRole && (
                            <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-medium">
                              {req.appliedRole}
                            </span>
                          )}
                          <StatusBadge status={req.status} domain="groups" />
                        </div>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Gửi lúc: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/groups/${req.groupId}`)}
                        className="shrink-0 text-xs"
                      >
                        Xem nhóm
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 4: Invitations */}
        <TabsContent value="invitations" className="mt-6">
          <QueryBoundary query={invitationsQuery}>
            {!invitations.length ? (
              <EmptyState title="Chưa có lời mời tham gia nhóm" />
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link
                          to={`/groups/${invitation.groupId}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {invitation.groupName}
                        </Link>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {invitation.message || 'Trưởng nhóm mời bạn tham gia.'}
                        </p>
                      </div>
                      {invitation.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={invitationMutation.isPending}
                            onClick={() =>
                              invitationMutation.mutate({ invitation, decision: 'decline' })
                            }
                            className="text-xs"
                          >
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            disabled={invitationMutation.isPending}
                            loading={
                              invitationMutation.isPending &&
                              invitationMutation.variables?.invitation.id === invitation.id
                            }
                            onClick={() =>
                              invitationMutation.mutate({ invitation, decision: 'accept' })
                            }
                            className="text-xs"
                          >
                            Tham gia
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {
                            {
                              Accepted: 'Đã tham gia',
                              Declined: 'Đã từ chối',
                              Cancelled: 'Đã hủy',
                            }[invitation.status]
                          }
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyGroupsPage;
