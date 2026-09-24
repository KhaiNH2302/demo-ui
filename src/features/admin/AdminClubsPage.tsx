import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { Check, X, Building2, Users } from 'lucide-react';
import type { Club } from '@/types/entities';

export const AdminClubsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'PendingApproval' | 'Approved' | 'Rejected'>('PendingApproval');
  const [rejectClubId, setRejectClubId] = useState<string | null>(null);

  const clubsQuery = useQuery({
    queryKey: ['admin', 'clubs', tab],
    queryFn: () => apiClient.get<Club[]>(`/admin/clubs?status=${tab}`),
  });

  const reviewClubMutation = useMutation({
    mutationFn: ({ id, approvalStatus, reason }: { id: string; approvalStatus: 'Approved' | 'Rejected'; reason?: string }) =>
      apiClient.put(`/admin/clubs/${id}`, { approvalStatus, reason }),
    onSuccess: (_, vars) => {
      toast.success(vars.approvalStatus === 'Approved' ? 'Phê duyệt thành lập CLB thành công!' : 'Đã từ chối đơn thành lập CLB.');
      setRejectClubId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => toast.error('Có lỗi xảy ra.'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phê duyệt Câu lạc bộ & Tổ chức"
        description="Xét duyệt đề xuất thành lập câu lạc bộ mới và quản lý trạng thái hoạt động"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Duyệt CLB' },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="PendingApproval">Chờ phê duyệt</TabsTrigger>
          <TabsTrigger value="Approved">Đã phê duyệt</TabsTrigger>
          <TabsTrigger value="Rejected">Đã từ chối</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <QueryBoundary queries={[clubsQuery]}>
            {clubsQuery.data && clubsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có hồ sơ nào"
                description={`Hiện tại không có câu lạc bộ nào ở trạng thái ${tab}.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubsQuery.data?.map((club) => (
                  <Card key={club.id} className="flex flex-col justify-between">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{club.field}</Badge>
                        <StatusBadge status={club.approvalStatus} domain="clubs" />
                      </div>
                      <CardTitle className="text-base">{club.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3">
                        {club.description}
                      </p>
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-xs text-[var(--text-muted)] block mb-1">Người đại diện nộp đơn:</span>
                        <UserMiniCard userId={club.managerId} showMajor />
                      </div>
                    </CardContent>
                    {club.approvalStatus === 'PendingApproval' && (
                      <CardFooter className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectClubId(club.id)}
                        >
                          <X className="w-3.5 h-3.5 mr-1 text-[var(--status-danger-fg)]" /> Từ chối
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            reviewClubMutation.mutate({
                              id: club.id,
                              approvalStatus: 'Approved',
                            })
                          }
                          loading={reviewClubMutation.isPending}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Phê duyệt
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Reject Reason Dialog */}
      <ReasonDialog
        open={!!rejectClubId}
        onOpenChange={() => setRejectClubId(null)}
        title="Từ chối đề xuất thành lập CLB"
        description="Nêu rõ lý do không đạt yêu cầu (mục đích chưa rõ ràng, trùng lặp định hướng...)."
        label="Lý do từ chối"
        placeholder="Nhập lý do gửi người đại diện..."
        onConfirm={(reason) => {
          if (!rejectClubId) return;
          reviewClubMutation.mutate({ id: rejectClubId, approvalStatus: 'Rejected', reason });
        }}
      />
    </div>
  );
};

export default AdminClubsPage;
