import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, MessageSquare, UserPlus, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';

export interface CoParticipantItem {
  userId: string;
  fullName: string;
  studentCode: string;
  major: string;
  cohort: string;
  avatarUrl?: string;
  positionOrSlot?: string;
  inviteStatus?: 'none' | 'Pending' | 'Accepted';
  conversationId?: string;
}

export interface CoParticipantsPanelProps {
  sourceType: 'opportunity' | 'program';
  sourceId: string;
  sourceTitle: string;
  participants: CoParticipantItem[];
  visibleToOthers: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}

export const CoParticipantsPanel: React.FC<CoParticipantsPanelProps> = ({
  sourceType,
  sourceId,
  sourceTitle,
  participants,
  visibleToOthers,
  onToggleVisibility,
}) => {
  const queryClient = useQueryClient();
  const [inviteTarget, setInviteTarget] = useState<CoParticipantItem | null>(null);
  const [message, setMessage] = useState('');
  const [sentIds, setSentIds] = useState<string[]>([]);

  const inviteMutation = useMutation({
    mutationFn: (payload: { toUserId: string; toUserName: string; message: string }) =>
      apiClient.post('/connection-invites', {
        sourceType,
        sourceId,
        sourceTitle,
        toUserId: payload.toUserId,
        toUserName: payload.toUserName,
        message: payload.message,
      }),
    onSuccess: (_, vars) => {
      setSentIds((prev) => [...prev, vars.toUserId]);
      setInviteTarget(null);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['connection-invites'] });
      toast.success(`Đã gửi lời mời kết nối tới ${vars.toUserName}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi lời mời kết nối');
    },
  });

  const handleOpenInvite = (p: CoParticipantItem) => {
    setInviteTarget(p);
    setMessage(
      `Chào ${p.fullName}, mình cũng tham gia "${sourceTitle}". Kết nối để cùng trao đổi và đi chung nhé!`
    );
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-card-title text-neutral-900">
              Sinh viên cùng tham gia ({participants.length})
            </h3>
            <p className="text-caption text-neutral-500">
              Kết nối với những bạn đã xác nhận tham gia và bật chia sẻ danh sách
            </p>
          </div>
        </div>

        {onToggleVisibility && (
          <label className="inline-flex items-center gap-2 text-caption font-medium text-neutral-700 cursor-pointer bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
            <input
              type="checkbox"
              checked={visibleToOthers}
              onChange={(e) => onToggleVisibility(e.target.checked)}
              className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Hiển thị tên tôi trong danh sách</span>
          </label>
        )}
      </div>

      {participants.length === 0 ? (
        <p className="text-meta text-neutral-500 py-4 text-center">
          Chưa có sinh viên nào bật hiển thị công khai trong danh sách này.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {participants.map((p) => {
            const isSent = p.inviteStatus === 'Pending' || sentIds.includes(p.userId);
            const isConnected = p.inviteStatus === 'Accepted';

            return (
              <div
                key={p.userId}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neutral-200 bg-surface"
              >
                <Link to={`/users/${p.userId}`} className="flex items-center gap-2.5 min-w-0 group">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.fullName}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold text-sm shrink-0">
                      {p.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 group-hover:text-brand-600 truncate">
                      {p.fullName}
                    </div>
                    <div className="text-caption text-neutral-500 truncate">
                      {p.major} · {p.cohort}
                      {p.positionOrSlot ? ` · ${p.positionOrSlot}` : ''}
                    </div>
                  </div>
                </Link>

                <div className="shrink-0">
                  {isConnected ? (
                    <Link to={p.conversationId ? `/chats/${p.conversationId}` : '/chats'}>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                      >
                        Nhắn tin
                      </Button>
                    </Link>
                  ) : isSent ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Đã gửi lời mời
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenInvite(p)}
                      leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                    >
                      Kết nối
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={!!inviteTarget} onOpenChange={(v) => !v && setInviteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gửi lời mời kết nối</DialogTitle>
            <DialogDescription>
              Khi {inviteTarget?.fullName} chấp nhận, một cuộc trò chuyện trực tiếp gắn với hoạt động này sẽ được mở.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-2">
            <label className="text-caption font-semibold text-neutral-700 block">
              Lời nhắn làm quen
            </label>
            <Textarea
              rows={3}
              maxLength={240}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập lời nhắn ngắn gọn..."
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setInviteTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              isLoading={inviteMutation.isPending}
              onClick={() => {
                if (!inviteTarget) return;
                inviteMutation.mutate({
                  toUserId: inviteTarget.userId,
                  toUserName: inviteTarget.fullName,
                  message: message.trim() || `Chào bạn, mình cùng tham gia ${sourceTitle}!`,
                });
              }}
            >
              Gửi lời mời
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
