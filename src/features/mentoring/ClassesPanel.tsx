import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, MessageSquare, Plus, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormField } from '@/components/shared/FormField';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/Toast';
import type { MentoringClass, MentoringSession } from '@/types/entities';
import { MODE_LABELS, MODES } from './postOptions';
import { countDone } from './reviews';

type SessionAction = 'done' | 'confirm' | 'dispute' | 'cancel';

const ACTION_TOAST: Record<SessionAction, string> = {
  done: 'Đã gửi cho học viên xác nhận',
  confirm: 'Đã xác nhận buổi học',
  dispute: 'Đã báo cho Mentor là buổi này chưa học',
  cancel: 'Đã hủy buổi học',
};

const STATUS_LABEL: Record<MentoringSession['status'], string> = {
  PLANNED: 'Dự kiến',
  PENDING_CONFIRM: 'Chờ học viên xác nhận',
  DONE: 'Đã học',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLE: Record<MentoringSession['status'], string> = {
  PLANNED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  PENDING_CONFIRM: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  DONE: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  CANCELLED: 'bg-neutral-100 text-neutral-400 line-through dark:bg-neutral-800',
};

// Chuyển giờ địa phương của ô datetime-local thành ISO để lưu
const defaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// `starting`: buổi đầu tiên đồng thời bắt đầu lớp học; ngược lại chỉ thêm một buổi vào lớp đã bắt đầu
const AddSessionDialog: React.FC<{ cls: MentoringClass | null; starting: boolean; onClose: () => void }> = ({ cls, starting, onClose }) => {
  const queryClient = useQueryClient();
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [mode, setMode] = useState('online');
  const [note, setNote] = useState('');

  const add = useMutation({
    mutationFn: () =>
      apiClient.post(`/mentoring/classes/${cls?.request.id}/${starting ? 'start' : 'sessions'}`, {
        startsAt: new Date(startsAt).toISOString(),
        mode,
        note,
      }),
    onSuccess: () => {
      toast.success(starting ? 'Đã bắt đầu lớp học' : 'Đã thêm buổi học');
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'classes'] });
      onClose();
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa thêm được buổi học, thử lại sau ít phút.'),
  });

  return (
    <Dialog open={Boolean(cls)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{starting ? 'Bắt đầu lớp học' : 'Thêm buổi học'}</DialogTitle>
          <DialogDescription>
            {starting
              ? 'Chọn ngày giờ buổi đầu tiên. Lớp học sẽ hiện trong mục Lớp học của học viên.'
              : 'Học viên sẽ thấy buổi này trong mục Lớp học của họ.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="Ngày giờ" required>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </FormField>
          <FormField label="Hình thức">
            <Select value={mode} onChange={(e) => setMode(e.target.value)} options={MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))} />
          </FormField>
          <FormField label="Nội dung buổi học" helperText="Ví dụ: ôn BFS/DFS, review code đăng nhập.">
            <Input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button disabled={!startsAt} loading={add.isPending} onClick={() => add.mutate()}>
            {starting ? 'Bắt đầu lớp' : 'Thêm buổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Sổ buổi học của các lớp đã kết nối. Dùng chung cho Mentor (Mentor Center) và học viên (trang Yêu cầu);
 * vai trò được suy ra từ người đang đăng nhập. Mentor đánh dấu đã học, học viên xác nhận thì buổi mới được tính.
 */
export const ClassesPanel: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [adding, setAdding] = useState<{ cls: MentoringClass; starting: boolean } | null>(null);

  const classesQuery = useQuery({
    queryKey: ['mentoring', 'classes'],
    queryFn: () => apiClient.get<MentoringClass[]>('/mentoring/classes'),
  });

  const act = useMutation({
    mutationFn: ({ cls, session, action }: { cls: MentoringClass; session: MentoringSession; action: SessionAction }) =>
      apiClient.post(`/mentoring/classes/${cls.request.id}/sessions/${session.id}/${action}`),
    onSuccess: (_data, { action }) => {
      toast.success(ACTION_TOAST[action]);
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'classes'] });
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa cập nhật được buổi học, thử lại sau ít phút.'),
  });
  const busyId = act.isPending ? act.variables?.session.id : undefined;

  const allClasses = classesQuery.data || [];
  const waiting = allClasses.filter((cls) => !cls.startedAt);
  const classes = allClasses.filter((cls) => cls.startedAt);

  return (
    <>
      <QueryBoundary query={classesQuery}>
        {waiting.length > 0 && (
          <section className="mb-8 space-y-3" aria-labelledby="waiting-classes">
            <div>
              <h2 id="waiting-classes" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Đã kết nối, chờ bắt đầu <span className="font-normal text-neutral-400">{waiting.length}</span>
              </h2>
              <p className="text-sm text-neutral-500">Hai bên nhắn tin chốt gói và giờ học, rồi Mentor bắt đầu lớp.</p>
            </div>
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {waiting.map((cls) => {
                const isMentorSide = cls.mentorId === userId;
                const counterpartId = isMentorSide ? cls.studentId : cls.mentorId;
                return (
                  <li key={cls.request.id} className="space-y-3 rounded-2xl border border-dashed border-neutral-300 bg-surface p-5 dark:border-neutral-600">
                    <UserMiniCard userId={counterpartId} showMajor />
                    <div>
                      <h3 className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{cls.request.topic}</h3>
                      {cls.request.planSummary && <p className="text-sm text-neutral-500">{cls.request.planSummary}</p>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-neutral-600">
                        {isMentorSide ? 'Chốt xong với học viên thì bắt đầu lớp.' : 'Chờ Mentor xếp lịch buổi đầu tiên.'}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/chats?targetUser=${counterpartId}`)}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> Nhắn tin
                        </Button>
                        {isMentorSide && (
                          <Button size="sm" onClick={() => setAdding({ cls, starting: true })}>
                            Bắt đầu lớp học
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {classes.length === 0 && waiting.length === 0 ? (
          <EmptyState
            title="Chưa có lớp học nào"
            description="Khi một yêu cầu được chấp nhận, bạn nhắn tin chốt lịch với đối phương, rồi Mentor bắt đầu lớp học tại đây."
            action={<Button onClick={() => navigate('/mentoring')}>Tìm lớp kèm</Button>}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {classes.map((cls) => {
              const isMentorSide = cls.mentorId === userId;
              const total = cls.request.totalSessions;
              const done = countDone(cls);
              const active = cls.sessions.filter((session) => session.status !== 'CANCELLED').length;
              const full = Boolean(total && active >= total);
              const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
              const finished = Boolean(total && done >= total);
              return (
                <li key={cls.request.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-surface dark:border-neutral-700/80">
                  <div className="space-y-3 p-5">
                    <UserMiniCard userId={isMentorSide ? cls.studentId : cls.mentorId} showMajor />
                    <div>
                      <h3 className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{cls.request.topic}</h3>
                      {cls.request.planSummary && <p className="text-sm text-neutral-500">{cls.request.planSummary}</p>}
                    </div>

                    <div>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                          {done}
                          {total ? `/${total}` : ''} buổi đã học
                        </span>
                        {finished && <span className="text-xs font-medium text-emerald-700">Đã học xong gói</span>}
                      </div>
                      {total ? (
                        <div
                          className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
                          role="progressbar"
                          aria-valuenow={done}
                          aria-valuemin={0}
                          aria-valuemax={total}
                          aria-label="Tiến độ lớp học"
                        >
                          <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <ul className="divide-y divide-neutral-100 border-t border-neutral-100 dark:divide-neutral-800 dark:border-neutral-800">
                    {cls.sessions.length === 0 && (
                      <li className="px-5 py-4 text-sm text-neutral-600">
                        {isMentorSide ? 'Chưa có buổi nào. Thêm buổi đầu tiên để chốt lịch với học viên.' : 'Mentor chưa xếp buổi nào. Nhắn tin để chốt lịch buổi đầu.'}
                      </li>
                    )}
                    {cls.sessions.map((session) => {
                      const busy = busyId === session.id;
                      return (
                        <li key={session.id} className="space-y-2 px-5 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={cn('flex items-center gap-1.5 text-sm font-medium tabular-nums', session.status === 'CANCELLED' ? 'text-neutral-400' : 'text-neutral-900 dark:text-neutral-100')}>
                              <CalendarClock className="h-4 w-4 text-neutral-400" />
                              {formatDateTime(session.startsAt)}
                              <span className="font-normal text-neutral-500">· {MODE_LABELS[session.mode]}</span>
                            </p>
                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[session.status])}>
                              {STATUS_LABEL[session.status]}
                            </span>
                          </div>
                          {session.note && <p className="text-sm text-neutral-600">{session.note}</p>}
                          {session.disputed && session.status === 'PLANNED' && (
                            <p className="text-xs font-medium text-amber-700">Học viên báo buổi này chưa học. Hai bên nhắn tin để thống nhất lại.</p>
                          )}

                          <div className="flex flex-wrap justify-end gap-2">
                            {session.status === 'PLANNED' && isMentorSide && (
                              <Button size="sm" loading={busy} onClick={() => act.mutate({ cls, session, action: 'done' })}>
                                <Check className="mr-1 h-3.5 w-3.5" /> Đã học
                              </Button>
                            )}
                            {session.status === 'PLANNED' && (
                              <Button size="sm" variant="ghost" disabled={busy} onClick={() => act.mutate({ cls, session, action: 'cancel' })}>
                                Hủy buổi
                              </Button>
                            )}
                            {session.status === 'PENDING_CONFIRM' && !isMentorSide && (
                              <>
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => act.mutate({ cls, session, action: 'dispute' })}>
                                  Chưa học
                                </Button>
                                <Button size="sm" loading={busy} onClick={() => act.mutate({ cls, session, action: 'confirm' })}>
                                  <Check className="mr-1 h-3.5 w-3.5" /> Xác nhận đã học
                                </Button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
                    <p className="text-xs text-neutral-500">
                      {isMentorSide
                        ? full
                          ? 'Đã xếp đủ số buổi của gói.'
                          : 'Học viên xác nhận thì buổi mới được tính.'
                        : 'Đánh giá Mentor mở sau buổi đầu tiên bạn xác nhận.'}
                    </p>
                    {isMentorSide ? (
                      <Button size="sm" variant="outline" disabled={full} onClick={() => setAdding({ cls, starting: false })}>
                        <Plus className="mr-1 h-3.5 w-3.5" /> Thêm buổi
                      </Button>
                    ) : (
                      done > 0 && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/users/${cls.mentorId}`)}>
                          <Star className="mr-1 h-3.5 w-3.5" /> Đánh giá Mentor
                        </Button>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>

      <AddSessionDialog key={adding?.cls.request.id ?? 'none'} cls={adding?.cls ?? null} starting={adding?.starting ?? false} onClose={() => setAdding(null)} />
    </>
  );
};

export default ClassesPanel;
