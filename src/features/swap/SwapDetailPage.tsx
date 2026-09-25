import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SwapConnectionReviewSheet } from './SwapConnectionReviewSheet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import type { SwapRequest, SwapConnection } from '@/types/entities';

export default function SwapDetailPage() {
  const { id = 'swap_req_01' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editTargetClass, setEditTargetClass] = useState('');
  const [reviewConn, setReviewConn] = useState<SwapConnection | null>(null);

  const requestQuery = useQuery<SwapRequest>({
    queryKey: queryKeys.swap.detail(id),
    queryFn: () => apiClient.get(`/swap-requests/${id}`),
  });

  const connectionsQuery = useQuery<SwapConnection[]>({
    queryKey: queryKeys.swap.connections({ requestId: id }),
    queryFn: () => apiClient.get('/swap-connections', { params: { requestId: id } }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.delete(`/swap-requests/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã hủy yêu cầu đổi lớp' });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { targetClassCode: string; version: number }) =>
      apiClient.put(`/swap-requests/${id}`, payload),
    onSuccess: () => {
      toast({ variant: 'success', title: 'Cập nhật yêu cầu thành công' });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
    },
    onError: (err: ApiError) => {
      toast({ variant: 'error', title: 'Xung đột phiên bản (Version Conflict)', description: err.message });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
    },
  });

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <QueryBoundary query={requestQuery}>
        {(req) => (
          <div className="space-y-6">
            <PageHeader
              title={`Yêu cầu đổi lớp môn ${req.offeringId.toUpperCase()}`}
              description={`Mã lớp: ${req.currentClassCode} → ${req.targetClassCode}`}
              backHref="/swap"
              actions={
                req.status === 'Open' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil size={14} />}
                      onClick={() => {
                        setEditTargetClass(req.targetClassCode);
                        setEditDialogOpen(true);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      className="text-[#dc3c33] border-[#f7c9c7]"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Hủy bài đăng
                    </Button>
                    <Link to={`/swap/${req.id}/match`}>
                      <Button size="sm" leftIcon={<Sparkles size={14} />}>
                        Tìm đối tác
                      </Button>
                    </Link>
                  </div>
                )
              }
            />

            {/* Main Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-base font-bold">Thông tin chi tiết</CardTitle>
                  <StatusBadge group="swapRequest" value={req.status} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <span className="text-neutral-500 block mb-1">Môn học:</span>
                    <span className="font-bold text-neutral-900 text-sm">{req.offeringId.toUpperCase()}</span>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <span className="text-neutral-500 block mb-1">Lớp hiện tại:</span>
                    <span className="font-bold text-neutral-900 text-sm">{req.currentClassCode}</span>
                  </div>
                  <div className="rounded-lg bg-brand-50/50 p-3 border border-brand-100">
                    <span className="text-brand-700 block mb-1">Lớp muốn đổi sang:</span>
                    <span className="font-bold text-brand-900 text-sm">{req.targetClassCode}</span>
                  </div>
                </div>

                {req.schedule && req.schedule.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-700 mb-2">Lịch học tự khai:</h5>
                    <div className="flex flex-wrap gap-2">
                      {req.schedule.map((s, idx) => (
                        <Badge key={idx} tier="neutral" size="sm">
                          {s.day}: {s.start}–{s.end}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                  <span>Ngày tạo: {formatDateTime(req.createdAt)}</span>
                  <span>Cập nhật lần cuối: {formatDateTime(req.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Connections Section */}
            <div className="space-y-4">
              <h3 className="text-section-title text-neutral-900">Lời mời kết nối liên quan</h3>

              <QueryBoundary query={connectionsQuery}>
                {(connections) => {
                  const incoming = connections.filter((c) => c.requestBId === req.id);
                  const outgoing = connections.filter((c) => c.requestAId === req.id);

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Incoming */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider">
                            Lời mời nhận được ({incoming.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-neutral-100">
                          {incoming.length === 0 ? (
                            <p className="text-xs text-neutral-400 py-3">Chưa nhận được lời mời nào</p>
                          ) : (
                            incoming.map((conn) => (
                              <div key={conn.id} className="py-3 flex items-center justify-between gap-2">
                                <div>
                                  <StatusBadge group="swapConnection" value={conn.status} />
                                  <span className="text-[11px] text-neutral-400 ml-2">
                                    {formatDateTime(conn.createdAt)}
                                  </span>
                                </div>
                                {conn.status === 'Pending' && (
                                  <Button size="sm" variant="outline" onClick={() => setReviewConn(conn)}>
                                    Xem & Phản hồi
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      {/* Outgoing */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xs font-bold uppercase tracking-wider">
                            Lời mời đã gửi ({outgoing.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-neutral-100">
                          {outgoing.length === 0 ? (
                            <p className="text-xs text-neutral-400 py-3">Chưa gửi lời mời nào từ yêu cầu này</p>
                          ) : (
                            outgoing.map((conn) => (
                              <div key={conn.id} className="py-3 flex items-center justify-between gap-2">
                                <div>
                                  <StatusBadge group="swapConnection" value={conn.status} />
                                  <span className="text-[11px] text-neutral-400 ml-2">
                                    {formatDateTime(conn.createdAt)}
                                  </span>
                                </div>
                                {conn.status === 'Confirmed' && (
                                  <Link to="/chats">
                                    <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                                      Đến hộp chat
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                }}
              </QueryBoundary>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent size="sm">
                <DialogHeader>
                  <DialogTitle>Sửa mã lớp muốn đổi</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  <FormField label="Mã lớp muốn đổi mới" required>
                    <Input
                      value={editTargetClass}
                      onChange={(e) => setEditTargetClass(e.target.value.toUpperCase())}
                      placeholder="vd: SE1603"
                    />
                  </FormField>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={() =>
                      updateMutation.mutate({
                        targetClassCode: editTargetClass,
                        version: req.version,
                      })
                    }
                    loading={updateMutation.isPending}
                  >
                    Lưu thay đổi
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Cancel Confirm Dialog */}
            <ConfirmDialog
              open={cancelDialogOpen}
              onOpenChange={setCancelDialogOpen}
              title="Hủy bài đăng đổi lớp"
              description="Bạn có chắc chắn muốn hủy yêu cầu này không? Bài đăng sẽ chuyển sang trạng thái Đã hủy và không còn xuất hiện trong kết quả tìm kiếm."
              confirmLabel="Hủy bài đăng"
              danger={true}
              onConfirm={() => {
                cancelMutation.mutate();
              }}
            />

            {/* Review Sheet */}
            {reviewConn && (
              <SwapConnectionReviewSheet
                open={!!reviewConn}
                onOpenChange={(open) => !open && setReviewConn(null)}
                connection={reviewConn}
                requestA={req}
                requestB={req}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
                  queryClient.invalidateQueries({ queryKey: queryKeys.swap.connections({ requestId: id }) });
                }}
              />
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
