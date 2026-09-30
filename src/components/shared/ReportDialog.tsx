import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type { ReportTargetType } from '@/types/status';

export interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  targetAuthorName?: string;
  contentSnapshot?: string;
  onReported?: (targetId: string) => void;
  onUndoHide?: (targetId: string) => void;
}

const REPORT_REASONS = [
  'Spam hoặc quảng cáo trá hình',
  'Thông tin sai sự thật / lừa đảo',
  'Quấy rối, xúc phạm hoặc công kích cá nhân',
  'Gian lận học thuật (mua bán đề thi, học hộ)',
  'Giả mạo cá nhân hoặc tổ chức / CLB',
  'Thu phí trái phép hoặc không minh bạch',
  'Khác',
] as const;

const TARGET_LABELS: Record<ReportTargetType, string> = {
  post: 'Bài viết học thuật',
  comment: 'Bình luận',
  user: 'Tài khoản người dùng',
  opportunity: 'Cơ hội Câu lạc bộ',
  program: 'Kênh chương trình',
  group: 'Nhóm kết nối',
  mentor_post: 'Bài đăng Mentor',
  announcement: 'Thông báo chương trình',
  message: 'Tin nhắn',
};

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetTitle = 'Nội dung trên SCS',
  targetAuthorName,
  contentSnapshot,
  onReported,
  onUndoHide,
}) => {
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reportMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/reports', {
        targetType,
        targetId,
        targetTitle,
        targetAuthorName: targetAuthorName || 'Người dùng SCS',
        reason: selectedReason,
        description: note.trim(),
        contentSnapshot: contentSnapshot || targetTitle,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      onOpenChange(false);
      setNote('');
      setError('');
      onReported?.(targetId);

      toast.success('Đã ghi nhận báo cáo và ẩn mục này khỏi màn hình của bạn', {
        description: 'Bộ phận kiểm duyệt sẽ xem xét trong thời gian sớm nhất.',
        duration: 10_000,
        action: onUndoHide
          ? {
              label: 'Hoàn tác',
              onClick: () => onUndoHide(targetId),
            }
          : undefined,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi báo cáo lúc này');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReason === 'Khác' && !note.trim()) {
      setError('Vui lòng nhập mô tả cụ thể khi chọn lý do "Khác".');
      return;
    }
    setError('');
    reportMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-neutral-900">
              <div className="h-8 w-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <Flag className="h-4 w-4" />
              </div>
              <DialogTitle>Báo cáo vi phạm</DialogTitle>
            </div>
            <DialogDescription className="mt-1">
              Giúp cộng đồng SCS giữ môi trường học thuật văn minh và an toàn.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            {/* Target preview box */}
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-meta">
              <div className="text-caption font-semibold text-neutral-500">
                {TARGET_LABELS[targetType]}
                {targetAuthorName ? ` · ${targetAuthorName}` : ''}
              </div>
              <div className="font-medium text-neutral-900 line-clamp-2 mt-0.5">
                {targetTitle}
              </div>
            </div>

            {/* Reason radios */}
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-neutral-700 block">
                Lý do báo cáo <span className="text-tier-danger-text">*</span>
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-800 transition-colors"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      checked={selectedReason === reason}
                      onChange={() => {
                        setSelectedReason(reason);
                        setError('');
                      }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-caption font-semibold text-neutral-700 block">
                Mô tả chi tiết {selectedReason === 'Khác' && <span className="text-tier-danger-text">*</span>}
              </label>
              <Textarea
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Cung cấp thêm ngữ cảnh hoặc bằng chứng vi phạm (tối đa 500 ký tự)..."
              />
              {error && <p className="text-caption text-tier-danger-text">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" isLoading={reportMutation.isPending}>
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
