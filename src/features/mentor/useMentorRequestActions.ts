import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import { statusMeta } from '@/lib/statusMeta';
import type { MentoringRequest } from '@/types/entities';

/**
 * Hành động của Mentor với yêu cầu nhận được (FE-05 bước 9 → 10).
 * Nếu request không còn pending (409 MENTORING_REQUEST_NOT_PENDING) → báo trạng thái hiện tại, không xử lý lại.
 */
export function useMentorRequestActions(opts?: {
  onAccepted?: (data: { request: MentoringRequest; conversationId: string }) => void;
  onRejected?: () => void;
}) {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['mentor', 'requests'] });
    queryClient.invalidateQueries({ queryKey: ['nav', 'counters'] });
  };

  const handleError = (err: unknown) => {
    const e = err as ApiError;
    if (e?.code === 'MENTORING_REQUEST_NOT_PENDING') {
      const status = e.details?.status;
      const meta = statusMeta.mentoringRequest as Record<string, { label: string }>;
      const label = status ? meta[status]?.label ?? status : '';
      toast.warning('Yêu cầu không còn chờ phản hồi', `Trạng thái hiện tại: ${label}. Hệ thống không xử lý lại.`);
      refresh();
      return;
    }
    toast.error('Có lỗi xảy ra, vui lòng thử lại.');
  };

  const accept = useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ request: MentoringRequest; conversationId: string }>(`/mentor/requests/${id}/accept`),
    onSuccess: (data) => {
      toast.success('Đã chấp nhận yêu cầu', 'Kênh chat với học viên đã được tạo.');
      refresh();
      opts?.onAccepted?.(data);
    },
    onError: handleError,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post(`/mentor/requests/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu.');
      refresh();
      opts?.onRejected?.();
    },
    onError: handleError,
  });

  return { accept, reject };
}
