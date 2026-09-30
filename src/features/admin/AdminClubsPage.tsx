import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Building2,
  UserCheck,
  UserMinus,
  EyeOff,
  Eye,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import type { Club, ClubRepresentativeRequest } from '@/types/entities';

export const AdminClubsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'requests' | 'clubs'>('requests');
  const [rejectReqId, setRejectReqId] = useState<string | null>(null);

  const repRequestsQuery = useQuery<ClubRepresentativeRequest[]>({
    queryKey: ['admin', 'club-rep-requests'],
    queryFn: () => apiClient.get('/admin/club-rep-requests'),
  });

  const clubsQuery = useQuery<Club[]>({
    queryKey: ['admin', 'clubs'],
    queryFn: () => apiClient.get('/admin/clubs'),
  });

  const reviewRepMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'Verified' | 'Rejected';
      reason?: string;
    }) => apiClient.put(`/admin/club-rep-requests/${id}`, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'Verified'
          ? 'Đã xác minh và cấp quyền Đại diện CLB thành công!'
          : 'Đã từ chối yêu cầu đại diện CLB.'
      );
      setRejectReqId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'club-rep-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: ({
      id,
      status,
      revokeUserId,
    }: {
      id: string;
      status?: 'Active' | 'Hidden';
      revokeUserId?: string;
    }) => apiClient.put(`/admin/clubs/${id}`, { status, revokeUserId }),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin Câu lạc bộ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'clubs'] });
    },
  });

  const pendingCount = (repRequestsQuery.data || []).filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xác minh Quyền Đại diện CLB & Danh bạ CLB"
        description="Xét duyệt yêu cầu làm đại diện đăng cơ hội cho Câu lạc bộ và quản lý danh sách CLB trong trường"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Quyền đại diện CLB' },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="requests">
            Yêu cầu đại diện chờ xác minh ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="clubs">
            Danh sách CLB ({clubsQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Representative Verification Requests */}
        <TabsContent value="requests" className="mt-4">
          <QueryBoundary queries={[repRequestsQuery]}>
            {(repRequestsQuery.data || []).length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Không có yêu cầu đại diện nào"
                description="Hiện tại không có yêu cầu xác minh đại diện CLB nào."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {repRequestsQuery.data?.map((req) => (
                  <Card key={req.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tier={req.clubId ? 'neutral' : 'brand'} size="sm">
                          {req.clubId ? 'CLB đã có trong danh mục' : 'Đề xuất thêm CLB mới'}
                        </Badge>
                        <StatusBadge status={req.status} group="representativeRequest" />
                      </div>
                      <CardTitle className="text-base">{req.clubName}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1">
                        <div className="font-semibold text-neutral-900">
                          Sinh viên yêu cầu: {req.userName} ({req.studentCode})
                        </div>
                        <div className="text-neutral-600">
                          Email: {req.userEmail} · Vai trò trong CLB:{' '}
                          <strong className="text-neutral-900">{req.roleNote}</strong>
                        </div>
                      </div>

                      {req.proposedClub && (
                        <div className="rounded-lg bg-brand-50/40 border border-brand-100 p-3 space-y-1">
                          <div className="font-semibold text-brand-700">
                            Thông tin CLB đề xuất bổ sung ({req.proposedClub.code}):
                          </div>
                          <p className="text-neutral-700">{req.proposedClub.description}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-semibold text-neutral-800 block">
                          Minh chứng chức vụ / Quyết định BCN:
                        </span>
                        <div className="text-neutral-600 bg-white border border-neutral-200 rounded-lg p-2.5 space-y-1">
                          <p>{req.evidenceNote || req.proofNote || '—'}</p>
                          {req.evidenceFileName && (
                            <p className="text-neutral-500 font-medium">
                              Tệp đính kèm: {req.evidenceFileName}
                            </p>
                          )}
                        </div>
                      </div>

                      {req.rejectionReason && (
                        <p className="text-tier-danger-text font-medium">
                          Lý do từ chối: {req.rejectionReason}
                        </p>
                      )}
                    </CardContent>

                    {req.status === 'Pending' && (
                      <CardFooter className="border-t border-neutral-100 pt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<X size={14} />}
                          onClick={() => setRejectReqId(req.id)}
                        >
                          Từ chối
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Check size={14} />}
                          loading={reviewRepMutation.isPending}
                          onClick={() =>
                            reviewRepMutation.mutate({ id: req.id, status: 'Verified' })
                          }
                        >
                          Xác minh & Cấp quyền
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* Tab 2: Clubs Directory & Representative Management */}
        <TabsContent value="clubs" className="mt-4">
          <QueryBoundary queries={[clubsQuery]}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {clubsQuery.data?.map((club) => (
                <Card key={club.id} className="flex flex-col justify-between">
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tier="neutral" size="sm">
                        {club.code || club.category}
                      </Badge>
                      <StatusBadge status={club.status || 'Active'} group="club" />
                    </div>
                    <CardTitle className="text-base">{club.name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <p className="text-neutral-600 line-clamp-2">{club.description}</p>

                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <span className="font-semibold text-neutral-800 block">
                        Đại diện được xác minh ({club.representatives?.length || 0}):
                      </span>
                      {!club.representatives || club.representatives.length === 0 ? (
                        <p className="text-neutral-500 italic">
                          Chưa có đại diện nào được xác minh cho CLB này.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {club.representatives.map((rep) => (
                            <div
                              key={rep.userId}
                              className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2"
                            >
                              <div>
                                <span className="font-semibold text-neutral-900">
                                  {rep.fullName} ({rep.studentCode})
                                </span>
                                <span className="block text-neutral-500">{rep.roleNote}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Thu hồi quyền đại diện"
                                onClick={() =>
                                  updateClubMutation.mutate({
                                    id: club.id,
                                    revokeUserId: rep.userId,
                                  })
                                }
                              >
                                <UserMinus size={14} className="text-tier-danger-text" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="border-t border-neutral-100 pt-3 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      Đang mở: <strong>{club.openOpportunitiesCount ?? 0}</strong> cơ hội
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={
                        club.status === 'Hidden' ? <Eye size={14} /> : <EyeOff size={14} />
                      }
                      onClick={() =>
                        updateClubMutation.mutate({
                          id: club.id,
                          status: club.status === 'Hidden' ? 'Active' : 'Hidden',
                        })
                      }
                    >
                      {club.status === 'Hidden' ? 'Hiện lại CLB' : 'Tạm ẩn CLB'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Reject Reason Dialog */}
      <ReasonDialog
        open={!!rejectReqId}
        onOpenChange={() => setRejectReqId(null)}
        title="Từ chối yêu cầu đại diện CLB"
        description="Nêu rõ lý do chưa thể xác minh quyền đại diện (thiếu quyết định BCN, thông tin chưa khớp...)."
        label="Lý do từ chối"
        placeholder="Nhập lý do gửi tới sinh viên..."
        onConfirm={(reason) => {
          if (!rejectReqId) return;
          reviewRepMutation.mutate({ id: rejectReqId, status: 'Rejected', reason });
        }}
      />
    </div>
  );
};

export default AdminClubsPage;
