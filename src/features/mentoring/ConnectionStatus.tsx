import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import type { MentoringRequest } from '@/types/entities';
import { CONNECTION_STALE_DAYS, connectionAgeDays, connectionDaysLeft } from './classRules';

interface ConnectionStatusProps {
  request: MentoringRequest;
  // Mở mục Lớp học khi lớp đã bắt đầu
  onOpenClass: () => void;
}

/**
 * Phần cuối thẻ yêu cầu "Đã kết nối": chưa bắt đầu lớp thì hiện thời gian chờ và cho hai bên chốt hoặc kết thúc,
 * Mentor toàn quyền bắt đầu lớp; đã bắt đầu thì dẫn sang mục Lớp học.
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ request, onOpenClass }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const isMentor = request.mentorId === userId;
  const counterpartId = isMentor ? request.studentId : request.mentorId;
  const started = Boolean(request.classStartedAt);
  const age = connectionAgeDays(request);
  const stale = age >= CONNECTION_STALE_DAYS;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'classes'] });
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] });
    queryClient.invalidateQueries({ queryKey: ['mentor', 'requests'] });
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
  };

  const start = useMutation({
    mutationFn: () => apiClient.post(`/mentoring/classes/${request.id}/start`, {}),
    onSuccess: () => {
      toast.success('Đã bắt đầu lớp học. Hai bên ghi nhận các buổi đã học ở mục Lớp học.');
      setStarting(false);
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Chưa bắt đầu được lớp học, thử lại sau ít phút.');
      setStarting(false);
    },
  });

  const end = useMutation({
    mutationFn: (reason: string) => apiClient.post(`/mentoring/classes/${request.id}/end`, { reason }),
    onSuccess: () => {
      toast.success('Đã kết thúc kết nối');
      setEnding(false);
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Chưa kết thúc được kết nối, thử lại sau ít phút.');
      setEnding(false);
    },
  });

  const chat = (
    <Button size="sm" variant="outline" onClick={() => navigate(`/chats?targetUser=${counterpartId}`)}>
      <MessageSquare className="mr-1 h-3.5 w-3.5" /> Nhắn tin
    </Button>
  );

  if (started) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-neutral-600">Lớp học đã bắt đầu.</span>
        <div className="flex gap-2">
          {chat}
          <Button size="sm" onClick={onOpenClass}>Vào lớp học</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <p className="text-neutral-600">
            {isMentor ? 'Chốt xong gói và giờ với học viên thì bắt đầu lớp.' : 'Chờ Mentor bắt đầu lớp học.'}
          </p>
          <p className={cn('text-xs', stale ? 'font-medium text-amber-700' : 'text-neutral-500')}>
            Đã chờ {age === 0 ? 'dưới 1 ngày' : `${age} ngày`}, còn {connectionDaysLeft(request)} ngày trước khi kết nối hết hạn
            {stale && '. Chưa chốt được thì nên kết thúc kết nối.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEnding(true)}>Kết thúc kết nối</Button>
          {chat}
          {isMentor && <Button size="sm" onClick={() => setStarting(true)}>Bắt đầu lớp học</Button>}
        </div>
      </div>

      <ConfirmDialog
        open={starting}
        onOpenChange={setStarting}
        title="Bắt đầu lớp học?"
        description="Từ đây hai bên ghi nhận các buổi đã học trong mục Lớp học. Hãy chắc là bạn và học viên đã chốt gói và giờ."
        confirmLabel="Bắt đầu lớp"
        loading={start.isPending}
        onConfirm={() => start.mutate()}
      />

      <ReasonDialog
        open={ending}
        onOpenChange={setEnding}
        title="Kết thúc kết nối?"
        description="Kết nối này sẽ không thành lớp học và bên kia sẽ biết. Nếu là lớp mở theo bài đăng, chỗ được trả lại cho người khác."
        label="Lý do (tùy chọn)"
        placeholder="Ví dụ: chưa thống nhất được lịch học."
        confirmLabel="Kết thúc kết nối"
        variant="danger"
        loading={end.isPending}
        onConfirm={(reason) => end.mutate(reason)}
      />
    </>
  );
};
