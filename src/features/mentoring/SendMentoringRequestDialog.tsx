import React, { useState, useEffect } from 'react';
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
import { Send, Sparkles } from 'lucide-react';
import type { MentoringRequest } from '@/types/entities';

interface SendMentoringRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  initialTopic?: string;
  initialContent?: string;
}

export const SendMentoringRequestDialog: React.FC<SendMentoringRequestDialogProps> = ({
  open,
  onOpenChange,
  mentorId,
  initialTopic = '',
  initialContent = '',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState(initialTopic);
  const [content, setContent] = useState(initialContent);
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    if (open) {
      if (initialTopic) setTopic(initialTopic);
      if (initialContent) setContent(initialContent);
    }
  }, [open, initialTopic, initialContent]);

  const sendMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentoringRequest>('/mentoring/requests', {
        mentorId,
        topic,
        content,
        preferredTime: preferredTime ? [preferredTime] : ['Tối Thứ 3 / Thứ 5'],
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
    if (!topic.trim() || !content.trim()) {
      toast.error('Vui lòng nhập chủ đề và nội dung cần hỗ trợ');
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
            <span className="text-xs text-[var(--text-muted)] block mb-1">Gửi tới Mentor:</span>
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

          <FormField label="Khung giờ mong muốn">
            <Input
              placeholder="Ví dụ: Tối Thứ 3 hoặc Chiều Thứ 7 tuần này"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />
          </FormField>

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
