import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { FormField } from '@/components/shared/FormField';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { CalendarClock, CheckCircle2, Send, Sparkles } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

interface SendMentoringRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  initialTopic?: string;
  initialContent?: string;
  sourcePostId?: string;
  recipientLabel?: string;
}

const getDefaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

export const SendMentoringRequestDialog: React.FC<SendMentoringRequestDialogProps> = ({
  open,
  onOpenChange,
  mentorId,
  initialTopic = '',
  initialContent = '',
  sourcePostId,
  recipientLabel = 'Mentor',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState(initialTopic);
  const [content, setContent] = useState(initialContent);
  const [deadline, setDeadline] = useState(getDefaultDeadline);

  const sendMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentoringRequest>('/mentoring/requests', {
        mentorId,
        topic,
        content,
        sourceType: sourcePostId ? 'POST' : 'DIRECT',
        sourcePostId,
        deadline,
      }),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu hỗ trợ tới Mentor thành công!');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] });
      navigate('/mentoring/requests');
    },
    onError: () => toast.error('Gửi yêu cầu thất bại, vui lòng thử lại.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !content.trim() || !deadline) {
      toast.error('Vui lòng nhập chủ đề, nội dung và deadline phản hồi');
      return;
    }
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Gửi yêu cầu Mentoring
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
            <span className="text-xs text-[var(--text-muted)] block mb-1">Gửi tới {recipientLabel}:</span>
            <UserMiniCard userId={mentorId} showMajor />
          </div>

          <FormField label="Chủ đề / Môn học cần hỗ trợ" required>
            <Input
              placeholder="Ví dụ: Ôn tập thuật toán Tree & Graph môn CSD201"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Nội dung thắc mắc & Yêu cầu chi tiết" required>
            <Textarea
              rows={4}
              placeholder="Mô tả cụ thể phần kiến thức bạn chưa hiểu hoặc các bài toán cần giải đáp..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Deadline phản hồi" required>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </FormField>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-neutral-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Kiểm tra trước khi gửi
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Deadline còn hiệu lực • còn capacity • không có yêu cầu trùng
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={sendMutation.isPending}>
              <Send className="w-4 h-4 mr-1.5" /> Gửi yêu cầu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
