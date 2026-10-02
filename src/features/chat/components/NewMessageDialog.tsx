import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { seedUsers } from '@/mocks/data/users';
import { useAuthStore } from '@/store/authStore';
import { Search, Send, UserCheck, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { User } from '@/types/entities';

export interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTargetUser?: User | { id: string; fullName: string; avatarUrl?: string };
}

export const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onOpenChange,
  defaultTargetUser,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(
    (defaultTargetUser as User) || null
  );
  const [firstMessage, setFirstMessage] = useState('');

  // Suggested contacts list
  const suggestedUsers = seedUsers.filter(
    (u) => u.id !== currentUser?.id && u.status === 'Active'
  );

  const filteredUsers = suggestedUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.studentCode && u.studentCode.toLowerCase().includes(q)) ||
      (u.major && u.major.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const createDirectChatMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      message,
    }: {
      targetUserId: string;
      message: string;
    }) => {
      const res = await apiClient.post<{ id: string }>('/conversations/direct', {
        targetUserId,
        firstMessage: message,
      });
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      toast({ variant: 'success', title: 'Đã gửi lời mời trò chuyện thành công' });
      onOpenChange(false);
      setSelectedUser(null);
      setFirstMessage('');
      setSearchQuery('');
      navigate(`/chats/${data.id}`);
    },
    onError: () => {
      toast({ variant: 'error', title: 'Không thể tạo cuộc trò chuyện' });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !firstMessage.trim()) return;
    createDirectChatMutation.mutate({
      targetUserId: selectedUser.id,
      message: firstMessage.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-neutral-100 dark:border-neutral-700">
          <DialogTitle className="text-base font-bold text-neutral-900">
            Tin nhắn mới
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Tìm kiếm sinh viên hoặc giảng viên trong trường để bắt đầu trò chuyện trực tiếp.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Target Selector */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Đến:
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-brand-200 bg-brand-50/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={selectedUser.avatarUrl}
                    name={selectedUser.fullName}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                      {selectedUser.fullName}
                    </span>
                    <span className="text-[11px] text-neutral-500 truncate block">
                      {selectedUser.major || selectedUser.studentCode || 'Sinh viên FPTU'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập họ tên, mã số sinh viên hoặc email..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:border-brand-500 focus:outline-hidden transition-all text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Contacts suggestion list */}
                <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 p-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-400">
                      Không tìm thấy sinh viên phù hợp
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={u.avatarUrl} name={u.fullName} size="sm" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block truncate">
                              {u.fullName}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {u.major || u.studentCode || 'Đại học FPT'}
                            </span>
                          </div>
                        </div>
                        <Badge tier="neutral" size="sm" className="text-[10px]">
                          Chọn
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* First Message & Invitation notice */}
          {selectedUser && (
            <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
              <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 rounded-xl p-3 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                  <Sparkles size={14} className="text-accent-600" />
                  <span>Lời mời trò chuyện</span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Tin nhắn đầu tiên sẽ gửi dưới dạng lời mời. {selectedUser.fullName} sẽ quyết định có chấp nhận kết nối trò chuyện hay không.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Nội dung tin nhắn:
                </label>
                <textarea
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Chào bạn, mình muốn trao đổi về..."
                  rows={3}
                  className="w-full p-3 text-xs text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:border-brand-500 focus:outline-hidden transition-all resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createDirectChatMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!selectedUser || !firstMessage.trim() || createDirectChatMutation.isPending}
            loading={createDirectChatMutation.isPending}
            rightIcon={<Send size={14} />}
          >
            Gửi lời mời
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
