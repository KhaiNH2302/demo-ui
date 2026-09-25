import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';

const reportReasons = [
  'Nội dung spam / quảng cáo',
  'Thông tin sai lệch / đề thi bảo mật',
  'Ngôn từ thiếu văn hóa / quấy rối',
  'Vi phạm bản quyền tài liệu',
  'Khác',
];

export interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  target?: { type: 'post' | 'comment'; id: string };
}

export const ReportPostDialog: React.FC<ReportPostDialogProps> = ({
  open,
  onOpenChange,
  postId,
  target,
}) => {
  const [reason, setReason] = useState(reportReasons[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const targetType = target?.type || 'post';
  const targetId = target?.id || postId || '';

  const handleReport = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      if (targetType === 'comment') {
        await apiClient.post(`/comments/${targetId}/report`, { reason, note });
      } else {
        await apiClient.post(`/posts/${targetId}/report`, { reason, note });
      }
      toast({
        variant: 'success',
        title: 'Đã gửi báo cáo vi phạm, cảm ơn bạn',
        description: 'Đội ngũ kiểm duyệt sẽ xử lý trong thời gian sớm nhất.',
      });
      onOpenChange(false);
      setNote('');
    } catch {
      toast({ variant: 'error', title: 'Gửi báo cáo thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {targetType === 'comment' ? 'Báo cáo vi phạm bình luận' : 'Báo cáo vi phạm bài viết'}
          </DialogTitle>
          <DialogDescription>
            Hãy chọn lý do chính xác giúp ban quản trị kiểm duyệt và giữ gìn môi trường học tập lành mạnh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormField label="Lý do báo cáo" required>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2 pt-1">
              {reportReasons.map((r) => (
                <label key={r} className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
                  <RadioGroupItem value={r} />
                  <span>{r}</span>
                </label>
              ))}
            </RadioGroup>
          </FormField>

          <FormField label="Mô tả chi tiết (Tùy chọn)">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cung cấp thêm ngữ cảnh hoặc vị trí vi phạm trong bài..."
              rows={3}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleReport} loading={loading} variant="destructive">
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
