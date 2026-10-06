import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { CalendarClock, Check, Clock, ShieldCheck, X } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';
import { useMentorRequestActions } from './useMentorRequestActions';

export const MentorRequestsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');

  const [tab, setTab] = useState<'pending' | 'accepted' | 'rejected'>(
    initialTab === 'accepted' || initialTab === 'rejected' ? initialTab : 'pending'
  );
  const [selectedReq, setSelectedReq] = useState<MentoringRequest | null>(null);
  const [rejectReqId, setRejectReqId] = useState<string | null>(null);

  const requestsQuery = useQuery({
    queryKey: ['mentor', 'requests'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentor/requests'),
  });

  const { accept: acceptMutation, reject: rejectMutation } = useMentorRequestActions({
    onAccepted: (data) => {
      setSelectedReq(data.request);
    },
    onRejected: () => {
      setRejectReqId(null);
      setSelectedReq(null);
    },
  });

  const allRequests = requestsQuery.data || [];
  const filteredRequests = allRequests.filter((r) => {
    if (tab === 'pending') return r.status === 'PENDING_MENTOR_RESPONSE';
    if (tab === 'accepted') return r.status === 'ACCEPTED';
    return r.status === 'REJECTED';
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Yêu cầu nhận được</h2>
        <p className="text-sm text-neutral-600">
          Mở yêu cầu rồi Chấp nhận hoặc Từ chối. Khi chấp nhận, SCS kiểm tra lại deadline, capacity và duplicate trước khi tạo Mentoring Connection.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pending">
            Chờ phản hồi ({allRequests.filter((r) => r.status === 'PENDING_MENTOR_RESPONSE').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Đã chấp nhận ({allRequests.filter((r) => r.status === 'ACCEPTED').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Đã từ chối ({allRequests.filter((r) => r.status === 'REJECTED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <QueryBoundary queries={[requestsQuery]}>
            {filteredRequests.length === 0 ? (
              <EmptyState
                title="Không có yêu cầu nào"
                description="Chưa có yêu cầu học viên gửi cho bạn trong danh mục này."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map((req) => (
                  <Card key={req.id} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={req.status} domain="mentoring" />
                        <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <UserMiniCard userId={req.studentId} showMajor />
                      <CardTitle className="text-sm pt-1 line-clamp-1">{req.topic}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3 bg-[var(--surface-muted)] p-2.5 rounded">
                        {req.content}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-subtle)]">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" /> Deadline: {req.deadline ? new Date(req.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                        </span>
                        <Badge variant="outline">{req.sourceType === 'POST' ? 'Từ Mentoring Feed' : 'Yêu cầu trực tiếp'}</Badge>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReq(req)}>
                        Chi tiết
                      </Button>
                      {req.status === 'PENDING_MENTOR_RESPONSE' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectReqId(req.id)}
                          >
                            <X className="w-3.5 h-3.5 text-[var(--status-danger-fg)]" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => acceptMutation.mutate(req.id)}
                            loading={acceptMutation.isPending && acceptMutation.variables === req.id}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Chấp nhận
                          </Button>
                        </div>
                      ) : req.status === 'ACCEPTED' ? (
                        <Badge variant="success" dot>Mentoring Connection đã tạo</Badge>
                      ) : null}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Request Detail Dialog */}
      <Dialog
        open={!!selectedReq}
        onOpenChange={() => {
          setSelectedReq(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu hỗ trợ học tập</DialogTitle>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Học viên gửi yêu cầu:</span>
                <UserMiniCard userId={selectedReq.studentId} showMajor />
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Chủ đề: {selectedReq.topic}</h4>
                <p className="text-sm text-[var(--text-main)] bg-[var(--surface-sunken)] p-3 rounded border border-[var(--border-subtle)] whitespace-pre-line">
                  {selectedReq.content}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                <p className="flex items-center gap-1.5 font-semibold text-neutral-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Kiểm tra cuối khi chấp nhận
                </p>
                <p className="mt-1">Deadline • capacity • duplicate</p>
              </div>

              <DialogFooter className="pt-4 border-t border-[var(--border-subtle)]">
                {selectedReq.status !== 'PENDING_MENTOR_RESPONSE' && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <StatusBadge status={selectedReq.status} domain="mentoring" />
                    {selectedReq.status === 'ACCEPTED' && <Badge variant="success" dot>Mentoring Connection đã tạo</Badge>}
                  </div>
                )}
                {selectedReq.status === 'PENDING_MENTOR_RESPONSE' && (
                  <div className="flex items-center gap-2 w-full justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectReqId(selectedReq.id);
                        setSelectedReq(null);
                      }}
                    >
                      Từ chối
                    </Button>
                    <Button
                      onClick={() => acceptMutation.mutate(selectedReq.id)}
                      loading={acceptMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Đồng ý hướng dẫn
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <ReasonDialog
        open={!!rejectReqId}
        onOpenChange={() => setRejectReqId(null)}
        title="Từ chối yêu cầu Mentoring"
        description="Học viên sẽ thấy lý do này trong mục Yêu cầu đã gửi."
        label="Lý do từ chối (tùy chọn)"
        placeholder="Ví dụ: Đã kín lịch vào khung giờ này..."
        onConfirm={(reason) => {
          if (!rejectReqId) return;
          rejectMutation.mutate({ id: rejectReqId, reason });
        }}
      />
    </div>
  );
};

export default MentorRequestsPage;
