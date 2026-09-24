import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/components/ui/Toast';
import { Send } from 'lucide-react';
import type { User } from '@/types/entities';

export interface StartConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'school'> | null;
  contextType: 'group_suggestion' | 'club_candidate' | 'group_member' | 'club_member';
  contextId: string;
  contextLabel?: string;
  onSuccess?: (conversationId: string) => void;
}

export const StartConversationDialog: React.FC<StartConversationDialogProps> = ({
  open,
  onOpenChange,
  targetUser,
  contextType,
  contextId,
  contextLabel,
  onSuccess,
}) => {
  const [firstMessage, setFirstMessage] = useState('');
  const queryClient = useQueryClient();

  const placeholderMap: Record<string, string> = {
    group_suggestion: 'Chào bạn, mình thấy hồ sơ của bạn rất phù hợp với nhóm. Bạn có muốn cùng thảo luận tham gia không?',
    club_candidate: 'Chào bạn, liên quan đến đơn ứng tuyển vào CLB...',
    group_member: 'Chào bạn, liên quan đến hoạt động nhóm...',
    club_member: 'Chào bạn, liên quan đến nhiệm vụ CLB...',
  };

  const createConvMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return null;
      return apiClient.post<{ id: string }>('/conversations/direct', {
        targetUserId: targetUser.id,
        contextType,
        contextId,
        firstMessage: firstMessage.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      toast.success('Đã bắt đầu cuộc trò chuyện!');
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      setFirstMessage('');
      onOpenChange(false);
      if (res?.id && onSuccess) {
        onSuccess(res.id);
      }
    },
    onError: () => {
      toast.error('Không thể tạo cuộc trò chuyện, vui lòng thử lại.');
    },
  });

  const handleSend = () => {
    createConvMutation.mutate();
  };

  if (!targetUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bắt đầu cuộc trò chuyện</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target User Info */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <UserMiniCard user={targetUser} />
            {contextLabel && (
              <p className="text-xs text-neutral-500 mt-2 pt-2 border-t border-neutral-200/60">
                {contextLabel}
              </p>
            )}
          </div>

          {/* Optional Message Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Lời nhắn mở đầu (Tùy chọn)
            </label>
            <Textarea
              rows={3}
              placeholder={placeholderMap[contextType] || 'Nhập lời nhắn...'}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createConvMutation.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSend} loading={createConvMutation.isPending} rightIcon={<Send size={14} />}>
            Gửi & Nhắn tin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartConversationDialog;
