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
  MessageSquare,
  ShieldCheck,
  Bell,
  Target,
  MapPin,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import type { Group, GroupJoinRequest, GroupCategory } from '@/types/entities';
import type { GroupInvitation } from '@/mocks/data/groups';
import { invalidateGroupQueries } from './groupQueries';
import { toast } from '@/components/ui/Toast';

const CATEGORY_META: Record<GroupCategory, { label: string; variant: 'brand' | 'neutral' | 'attention' }> = {
  project: { label: '💻 Đồ án / Dự án', variant: 'brand' },
  study: { label: '📚 Môn học', variant: 'neutral' },
  entertainment: { label: '🏸 Giải trí', variant: 'attention' },
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
        description="Quản lý các nhóm bạn sáng lập, nhóm đang tham gia và theo dõi đơn xin gia nhập chờ duyệt"
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

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Nhóm tôi quản lý</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {ownedGroups.length} <span className="text-xs font-normal text-neutral-400">nhóm</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Đã tham gia</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {memberGroups.length} <span className="text-xs font-normal text-neutral-400">nhóm</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border bg-surface shadow-xs flex items-center justify-between ${
          totalPendingRequests > 0
            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20'
            : 'border-neutral-200 dark:border-neutral-800'
        }`}>
          <div>
            <span className="text-xs text-neutral-500 font-medium">Đơn xin vào nhóm chờ duyệt</span>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {totalPendingRequests} <span className="text-xs font-normal text-neutral-400">yêu cầu</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            totalPendingRequests > 0
              ? 'bg-amber-100 text-amber-700 animate-pulse'
              : 'bg-neutral-100 text-neutral-500'
          }`}>
            <Bell className="w-5 h-5" />
          </div>
        </div>
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedGroups.map((g) => {
                  const catMeta = g.category ? CATEGORY_META[g.category] : null;
                  const percentFilled = Math.min(100, Math.round((g.memberCount / g.memberLimit) * 100));

                  return (
                    <Card key={g.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                      <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            {catMeta && (
                              <Badge variant={catMeta.variant} className="text-[11px]">
                                {catMeta.label}
                              </Badge>
                            )}
                            <Badge variant="attention" className="text-[11px]">
                              Trưởng nhóm
                            </Badge>
                          </div>
                          {g.campus && (
                            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-400" /> {g.campus}
                            </span>
                          )}
                        </div>

                        <div>
                          <CardTitle className="text-base line-clamp-1 hover:text-brand-600 transition-colors">
                            <Link to={`/groups/${g.id}`}>{g.name}</Link>
                          </CardTitle>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                            {g.topic || 'Chưa có mô tả chủ đề'}
                          </p>
                        </div>

                        {g.targetGoal && (
                          <div className="flex items-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 font-medium">
                            <Target className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span className="truncate">Mục tiêu: {g.targetGoal}</span>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3.5 py-1">
                        {/* Member progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-neutral-400" /> Thành viên
                            </span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {g.memberCount}/{g.memberLimit} ({percentFilled}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{ width: `${percentFilled}%` }}
                            />
                          </div>
                        </div>

                        {/* Roles needed */}
                        {g.rolesNeeded && g.rolesNeeded.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-neutral-400" /> Cần tuyển:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {g.rolesNeeded.slice(0, 2).map((role, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                >
                                  {role}
                                </span>
                              ))}
                              {g.rolesNeeded.length > 2 && (
                                <span className="text-[10px] text-neutral-400">
                                  +{g.rolesNeeded.length - 2} vị trí
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pending requests alert */}
                        {g.pendingRequestsCount && g.pendingRequestsCount > 0 ? (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                            <span className="flex items-center gap-1.5 font-semibold">
                              <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                              {g.pendingRequestsCount} đơn xin vào nhóm chờ duyệt
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate(`/groups/${g.id}/manage`)}
                              className="font-semibold text-amber-800 dark:text-amber-300 hover:underline shrink-0 ml-1"
                            >
                              Duyệt ngay →
                            </button>
                          </div>
                        ) : null}

                        {/* Skills */}
                        {g.skills && g.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {g.skills.slice(0, 3).map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0.2">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="text-xs"
                        >
                          Xem chi tiết
                        </Button>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/groups/${g.id}`)}
                            className="text-xs"
                            title="Mở kênh chat nội bộ nhóm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1 text-brand-600" /> Chat
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/groups/${g.id}/manage`)}
                            className="text-xs relative"
                          >
                            <Settings className="w-3.5 h-3.5 mr-1" /> Quản lý
                            {g.pendingRequestsCount && g.pendingRequestsCount > 0 ? (
                              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                {g.pendingRequestsCount}
                              </span>
                            ) : null}
                          </Button>
                        </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberGroups.map((g) => {
                  const catMeta = g.category ? CATEGORY_META[g.category] : null;

                  return (
                    <Card key={g.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                      <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            {catMeta && (
                              <Badge variant={catMeta.variant} className="text-[11px]">
                                {catMeta.label}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[11px]">
                              Thành viên
                            </Badge>
                          </div>
                          <Badge variant="neutral" className="text-xs">
                            <Users className="w-3 h-3 mr-1" /> {g.memberCount}/{g.memberLimit}
                          </Badge>
                        </div>

                        <div>
                          <CardTitle className="text-base line-clamp-1 hover:text-brand-600 transition-colors">
                            <Link to={`/groups/${g.id}`}>{g.name}</Link>
                          </CardTitle>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                            {g.topic || 'Chưa có mô tả chủ đề'}
                          </p>
                        </div>

                        {g.targetGoal && (
                          <div className="flex items-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 font-medium">
                            <Target className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span className="truncate">Mục tiêu: {g.targetGoal}</span>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-2 py-1">
                        {g.location && (
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{g.location}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {g.skills.slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0.2">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          className="text-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-brand-600" /> Kênh chat nội bộ
                        </Button>
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
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <Link
                            to={`/groups/${req.groupId}`}
                            className="font-semibold text-sm hover:text-brand-600 transition-colors"
                          >
                            {req.groupName || `Mã nhóm: ${req.groupId}`}
                          </Link>
                          {req.appliedRole && (
                            <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
                              Vị trí: {req.appliedRole}
                            </span>
                          )}
                          <StatusBadge status={req.status} domain="groups" />
                        </div>
                        {req.groupTopic && (
                          <p className="text-xs text-neutral-500 line-clamp-1">
                            Chủ đề: {req.groupTopic}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 italic bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                            Lời nhắn: "{req.message}"
                          </p>
                        )}
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Gửi lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/groups/${req.groupId}`)}
                        className="shrink-0"
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
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <Link
                          to={`/groups/${invitation.groupId}`}
                          className="text-sm font-semibold hover:underline"
                        >
                          {invitation.groupName}
                        </Link>
                        <p className="text-xs text-neutral-500 mt-1">
                          {invitation.message || 'Trưởng nhóm mời bạn tham gia.'}
                        </p>
                        <p className="text-xs mt-1 text-neutral-600">
                          Trạng thái:{' '}
                          {
                            {
                              Pending: 'Chờ phản hồi',
                              Accepted: 'Đã tham gia',
                              Declined: 'Đã từ chối',
                              Cancelled: 'Đã hủy',
                            }[invitation.status]
                          }
                        </p>
                      </div>
                      {invitation.status === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={invitationMutation.isPending}
                            onClick={() =>
                              invitationMutation.mutate({ invitation, decision: 'decline' })
                            }
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
                          >
                            Tham gia
                          </Button>
                        </div>
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
