import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ScheduleCompare } from '@/components/shared/ScheduleCompare';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import type { SwapConnection, SwapRequest } from '@/types/entities';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

export interface SwapConnectionReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: SwapConnection;
  requestA?: SwapRequest;
  requestB?: SwapRequest;
  onSuccess?: () => void;
}

export const SwapConnectionReviewSheet: React.FC<SwapConnectionReviewSheetProps> = ({
  open,
  onOpenChange,
  connection,
  requestA: providedRequestA,
  requestB: providedRequestB,
  onSuccess,
}) => {
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdConvId, setCreatedConvId] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorReason, setErrorReason] = useState<string>('');
  const [completed, setCompleted] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const validProvidedA = providedRequestA?.id === connection.requestAId ? providedRequestA : undefined;
  const validProvidedB = providedRequestB?.id === connection.requestBId ? providedRequestB : undefined;
  const requestAQuery = useQuery<SwapRequest>({
    queryKey: queryKeys.swap.detail(connection.requestAId),
    queryFn: () => apiClient.get('/swap-requests/' + connection.requestAId),
    enabled: open && !validProvidedA,
  });
  const requestBQuery = useQuery<SwapRequest>({
    queryKey: queryKeys.swap.detail(connection.requestBId),
    queryFn: () => apiClient.get('/swap-requests/' + connection.requestBId),
    enabled: open && !validProvidedB,
  });
  const requestA = validProvidedA || requestAQuery.data;
  const requestB = validProvidedB || requestBQuery.data;
  const detailsFailed = (!validProvidedA && requestAQuery.isError) || (!validProvidedB && requestBQuery.isError);
  const detailsReady = Boolean(requestA && requestB) && !detailsFailed;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['swap'] });
    queryClient.invalidateQueries({ queryKey: ['swap-explore'] });
    queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    onSuccess?.();
  };

  const handleAccept = async () => {
    if (!requestA || !requestB || loadingAccept || loadingReject || completed) return;
    setLoadingAccept(true);
    try {
      const res = (await apiClient.post(`/swap-connections/${connection.id}/accept`, {
        requestAVersion: requestA.version,
        requestBVersion: requestB.version,
      })) as any;
      setCompleted(true);
      setCreatedConvId(res.conversationId);
      setSuccessDialogOpen(true);
      refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorReason(apiErr.message || 'Không thể xác nhận kết nối đổi lớp.');
      setErrorDialogOpen(true);
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleReject = async () => {
    setLoadingReject(true);
    try {
      await apiClient.post(`/swap-connections/${connection.id}/reject`);
      toast({ variant: 'default', title: 'Đã từ chối lời mời đổi lớp. Hai yêu cầu vẫn tiếp tục mở.' });
      onOpenChange(false);
      refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      toast({ variant: 'error', title: 'Lỗi', description: apiErr.message });
    } finally {
      setLoadingReject(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent size="lg">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Chi tiết lời mời đổi lớp</SheetTitle>
              <StatusBadge group="swapConnection" value={completed ? 'Confirmed' : connection.status} />
            </div>
            <SheetDescription>
              Xem xét lịch học và mã lớp đối tác trước khi quyết định chấp nhận kết nối
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 my-4">
            <DisclaimerBanner />
            {!detailsReady && (
              <div role={detailsFailed ? 'alert' : 'status'} className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-600">
                {detailsFailed ? 'Không tải được dữ liệu hai yêu cầu. Vui lòng thử lại trước khi phản hồi.' : 'Đang tải thông tin yêu cầu của hai bên...'}
                {detailsFailed && <Button size="sm" variant="outline" className="ml-2" onClick={() => { requestAQuery.refetch(); requestBQuery.refetch(); }}>Thử lại</Button>}
              </div>
            )}
            {connection.message && <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">Lời nhắn: {connection.message}</p>}

            {/* Swap comparison box */}
            <div className="rounded-xl border border-neutral-200 bg-surface p-4 space-y-4">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Đối chiếu mã lớp 2 bên
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                  <span className="text-neutral-500 block mb-1">Bên gửi lời mời:</span>
                  <div className="font-bold text-neutral-900 text-sm">
                    {requestA?.currentClassCode || 'Lớp hiện tại'} → {requestA?.targetClassCode || 'Lớp muốn đổi'}
                  </div>
                </div>

                <div className="rounded-lg bg-brand-50/50 p-3 border border-brand-100">
                  <span className="text-brand-700 block mb-1">Lớp của bạn:</span>
                  <div className="font-bold text-brand-900 text-sm">
                    {requestB?.currentClassCode || 'Lớp hiện tại'} → {requestB?.targetClassCode || 'Lớp muốn đổi'}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Compare */}
            <div>
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                So sánh lịch học tự khai
              </h4>
              <ScheduleCompare
                labelA="Lịch của đối tác"
                slotsA={requestA?.schedule || []}
                labelB="Lịch của bạn"
                slotsB={requestB?.schedule || []}
              />
            </div>
          </div>

          {connection.status === 'Pending' && connection.recipientId === userId && !completed && (
            <SheetFooter>
              <Button
                variant="outline"
                className="text-[#b3261e] border-[#f7c9c7] hover:bg-[#fdecec]/50"
                onClick={handleReject}
                loading={loadingReject}
                disabled={loadingAccept || !detailsReady}
              >
                Từ chối lời mời
              </Button>
              <Button onClick={handleAccept} loading={loadingAccept} disabled={loadingReject || !detailsReady}>
                Chấp nhận kết nối
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader className="text-center items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f7ee] text-[#16794a] mb-2">
              <CheckCircle2 size={32} />
            </div>
            <DialogTitle className="text-xl text-[#16794a]">Kết nối thành công 🎉</DialogTitle>
            <DialogDescription>
              Bạn và đối tác đã đồng ý kết nối đổi lớp. Kênh tin nhắn trao đổi riêng đã được tạo.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-1">
            <p className="font-semibold text-neutral-800">Bước tiếp theo:</p>
            <p>1. Nhắn tin với đối tác để thống nhất lịch hẹn.</p>
            <p>2. Cả hai cùng làm thủ tục xin chuyển đổi lớp với phòng Đào tạo.</p>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setSuccessDialogOpen(false)}>
              Đóng
            </Button>
            {createdConvId && (
              <Button
                size="sm"
                leftIcon={<MessageSquare size={16} />}
                onClick={() => {
                  setSuccessDialogOpen(false);
                  onOpenChange(false);
                  navigate(`/chats/${createdConvId}`);
                }}
              >
                Mở khung Chat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog for Conflict */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader className="text-center items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-[#dc3c33] mb-2">
              <AlertTriangle size={32} />
            </div>
            <DialogTitle className="text-lg text-[#dc3c33]">Không thể xác nhận</DialogTitle>
            <DialogDescription className="text-xs text-neutral-700 mt-2">{errorReason}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorDialogOpen(false);
                onOpenChange(false);
                  refresh();
              }}
            >
              Đóng & Tải lại dữ liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
