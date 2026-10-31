import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, MapPin, Users, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '@/components/shared/EmptyState';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/ui/Toast';
import type { MentoringClass, MentorPost } from '@/types/entities';
import { describePostFee } from './plans';
import { MODE_LABELS, campusLabel } from './postOptions';

type SessionAction = 'confirm' | 'dispute' | 'cancel';
type Kind = 'group' | 'one';
type Filter = 'all' | Kind;
// none: chưa ai báo; waiting: mình đã báo, chờ bên kia; asked: bên kia báo, chờ mình; done: đã xác nhận
type Status = 'none' | 'waiting' | 'asked' | 'done';

const ACTION_TOAST: Record<SessionAction, string> = {
  confirm: 'Đã xác nhận đã học',
  dispute: 'Đã báo chưa đúng',
  cancel: 'Đã rút lại ghi nhận',
};

const STATUS_STYLE: Record<Status, string> = {
  none: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  waiting: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  asked: 'bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-100',
  done: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
};

// Thông tin cơ bản của lớp mở theo bài đăng: môn, lịch, học phí, hình thức, sĩ số
const ClassInfo: React.FC<{ post: MentorPost; enrolled: number }> = ({ post, enrolled }) => (
  <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
    {post.schedule?.length ? (
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-neutral-400" />
        <dt className="sr-only">Lịch học</dt>
        <dd>{post.schedule.join(', ')}</dd>
      </div>
    ) : null}
    <div className="flex items-center gap-1.5">
      <Wallet className="h-4 w-4 text-neutral-400" />
      <dt className="sr-only">Học phí</dt>
      <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
        {describePostFee(post.fee)}
        {post.sessions ? <span className="font-normal text-neutral-500">, {post.sessions} buổi</span> : null}
      </dd>
    </div>
    {post.modes?.length ? (
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-neutral-400" />
        <dt className="sr-only">Hình thức</dt>
        <dd>
          {post.modes.map((mode) => MODE_LABELS[mode as keyof typeof MODE_LABELS] || mode).join(', ')}
          {post.campus && <span className="text-neutral-500"> · FPTU {campusLabel(post.campus)}</span>}
        </dd>
      </div>
    ) : null}
    <div className="flex items-center gap-1.5">
      <Users className="h-4 w-4 text-neutral-400" />
      <dt className="sr-only">Sĩ số</dt>
      <dd className="tabular-nums">{post.filledCount ?? enrolled}/{post.capacity || post.slots || enrolled} học viên</dd>
    </div>
  </dl>
);

/**
 * Các lớp đã bắt đầu, chỉ gồm thông tin cơ bản và việc xác nhận đã học của cả lớp (không đếm buổi):
 * bên nào cũng đề nghị xác nhận, bên kia xác nhận thì lớp được tính là đã học.
 * Lớp nhóm và lớp 1-1 dùng cùng một thẻ (lớp 1-1 là lớp có một học viên), cho Mentor và học viên.
 */
export const ClassesPanel: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [filter, setFilter] = useState<Filter>('all');

  const classesQuery = useQuery({
    queryKey: ['mentoring', 'classes'],
    queryFn: () => apiClient.get<MentoringClass[]>('/mentoring/classes'),
  });
  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts'),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mentoring', 'classes'] });

  const record = useMutation({
    mutationFn: (members: MentoringClass[]) =>
      Promise.all(members.map((cls) => apiClient.post(`/mentoring/classes/${cls.request.id}/sessions`, {}))),
    onSuccess: () => {
      toast.success('Đã gửi xác nhận, chờ bên kia trả lời');
      refresh();
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa gửi được xác nhận, thử lại sau ít phút.'),
  });

  const act = useMutation({
    mutationFn: ({ cls, sessionId, action }: { cls: MentoringClass; sessionId: string; action: SessionAction }) =>
      apiClient.post(`/mentoring/classes/${cls.request.id}/sessions/${sessionId}/${action}`),
    onSuccess: (_data, { action }) => {
      toast.success(ACTION_TOAST[action]);
      refresh();
    },
    onError: (error: any) => toast.error(error?.message || 'Chưa cập nhật được xác nhận, thử lại sau ít phút.'),
  });

  // Chưa bắt đầu hoặc đã hết hạn thì nằm ở "Đã kết nối" / "Đã đóng" của trang Yêu cầu
  const started = (classesQuery.data || []).filter((cls) => cls.startedAt && cls.request.status === 'ACCEPTED');

  const statusOf = (cls: MentoringClass): Status => {
    if (cls.sessions.some((s) => s.status === 'DONE')) return 'done';
    const pending = cls.sessions.find((s) => s.status === 'PENDING_CONFIRM');
    if (!pending) return 'none';
    return pending.createdBy === userId ? 'waiting' : 'asked';
  };

  const postOf = (key: string) => (key.startsWith('req:') ? undefined : postsQuery.data?.find((item) => item.id === key));

  // Mentor: lớp gom theo bài đăng (lớp kèm riêng gom theo chính nó). Học viên: mỗi lớp của mình một thẻ.
  const groupsMap = new Map<string, MentoringClass[]>();
  started.forEach((cls) => {
    const key = cls.request.sourcePostId ?? `req:${cls.request.id}`;
    const mapKey = cls.mentorId === userId ? key : `own:${cls.request.id}`;
    groupsMap.set(mapKey, [...(groupsMap.get(mapKey) || []), cls]);
  });

  const items = [...groupsMap.entries()].map(([mapKey, members]) => {
    const asMentor = members[0].mentorId === userId;
    const key = mapKey.startsWith('own:') ? members[0].request.sourcePostId ?? `req:${members[0].request.id}` : mapKey;
    const post = postOf(key);
    const capacity = post ? post.capacity || post.slots || 1 : 1;
    const kind: Kind = members.length > 1 || capacity > 1 ? 'group' : 'one';
    const needsAction = members.some((cls) => statusOf(cls) === 'asked');
    return { mapKey, key, members, asMentor, post, kind, needsAction };
  });

  const counts = { all: items.length, group: items.filter((i) => i.kind === 'group').length, one: items.filter((i) => i.kind === 'one').length };
  const visible = items
    .filter((item) => filter === 'all' || item.kind === filter)
    .sort((a, b) => Number(b.needsAction) - Number(a.needsAction));

  const renderCard = (item: (typeof items)[number]) => {
    const { members, asMentor, post, kind } = item;
    const first = members[0];
    const statuses = members.map(statusOf);
    const doneCount = statuses.filter((s) => s === 'done').length;
    const todo = members.filter((cls) => statusOf(cls) === 'none');
    const mine = asMentor ? undefined : first;
    const myStatus = mine ? statusOf(mine) : undefined;
    const myPending = mine?.sessions.find((s) => s.status === 'PENDING_CONFIRM');
    const myConfirmed = mine?.sessions.find((s) => s.status === 'DONE');

    // Trạng thái tổng của thẻ
    const pill: { text: string; style: Status } = asMentor
      ? kind === 'group'
        ? { text: `${doneCount}/${members.length} đã xác nhận`, style: doneCount === members.length ? 'done' : doneCount > 0 ? 'waiting' : 'none' }
        : { text: doneCount ? 'Đã xác nhận' : statuses[0] === 'waiting' ? 'Chờ học viên xác nhận' : statuses[0] === 'asked' ? 'Học viên chờ bạn xác nhận' : 'Chưa xác nhận', style: statuses[0] }
      : {
          text: myStatus === 'done' ? 'Đã xác nhận' : myStatus === 'asked' ? 'Chờ bạn xác nhận' : myStatus === 'waiting' ? 'Chờ Mentor xác nhận' : 'Chưa xác nhận',
          style: myStatus ?? 'none',
        };

    const busyOn = (sessionId?: string) => act.isPending && act.variables?.sessionId === sessionId;
    const classmates = first.classmateIds ?? [];

    return (
      <li
        key={item.mapKey}
        className={cn(
          'flex flex-col rounded-2xl border bg-surface dark:border-neutral-700/80',
          item.needsAction ? 'border-amber-300 dark:border-amber-500/50' : 'border-neutral-200',
          kind === 'group' && asMentor && 'lg:col-span-2'
        )}
      >
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-brand-700 dark:text-brand-300">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 dark:bg-brand-500/15">{kind === 'group' ? 'Lớp nhóm' : 'Lớp 1-1'}</span>
                {post?.subject && <span>{post.subject}</span>}
              </p>
              <h3 className="mt-1 text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{post?.title || first.request.topic}</h3>
              {(!post || !asMentor) && first.request.planSummary && <p className="text-sm text-neutral-500">{first.request.planSummary}</p>}
            </div>
            <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums', STATUS_STYLE[pill.style])}>{pill.text}</span>
          </div>

          {post && <ClassInfo post={post} enrolled={asMentor ? members.length : classmates.length + 1} />}

          {asMentor ? (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-700">
              {members.map((cls) => {
                const status = statusOf(cls);
                const pending = cls.sessions.find((s) => s.status === 'PENDING_CONFIRM');
                return (
                  <li key={cls.request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <UserMiniCard userId={cls.studentId} showMajor={kind === 'one'} />
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'done' && (
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE.done)}>
                          <Check className="h-3.5 w-3.5" /> Đã xác nhận
                        </span>
                      )}
                      {status === 'waiting' && pending && (
                        <>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE.waiting)}>Chờ học viên xác nhận</span>
                          <Button size="sm" variant="ghost" disabled={busyOn(pending.id)} onClick={() => act.mutate({ cls, sessionId: pending.id, action: 'cancel' })}>
                            Rút lại
                          </Button>
                        </>
                      )}
                      {status === 'asked' && pending && (
                        <>
                          <span className="text-xs text-amber-800">Học viên báo đã học</span>
                          <Button size="sm" variant="outline" disabled={busyOn(pending.id)} onClick={() => act.mutate({ cls, sessionId: pending.id, action: 'dispute' })}>
                            Chưa đúng
                          </Button>
                          <Button size="sm" loading={busyOn(pending.id)} onClick={() => act.mutate({ cls, sessionId: pending.id, action: 'confirm' })}>
                            Xác nhận
                          </Button>
                        </>
                      )}
                      {status === 'none' && <span className="text-xs text-neutral-500">Chưa xác nhận</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="space-y-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between gap-2">
                <UserMiniCard userId={first.mentorId} showMajor />
                <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">Mentor</span>
              </div>
              {classmates.length > 0 && (
                <div className="border-t border-neutral-200 pt-2 dark:border-neutral-700">
                  <p className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">Bạn học cùng ({classmates.length})</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {classmates.map((id) => (
                      <li key={id}>
                        <UserMiniCard userId={id} size="sm" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Học viên: xác nhận hai chiều của chính mình */}
          {mine && myConfirmed && (
            <p className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', STATUS_STYLE.done)}>
              <Check className="h-4 w-4" /> Đã xác nhận đã học · {formatDate(myConfirmed.startsAt)}
            </p>
          )}
          {mine && myPending && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {myStatus === 'waiting' ? 'Bạn đã báo đã học. Chờ Mentor xác nhận.' : 'Mentor báo lớp đã học. Bạn xác nhận chứ?'}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {myStatus === 'waiting' ? (
                  <Button size="sm" variant="ghost" disabled={busyOn(myPending.id)} onClick={() => act.mutate({ cls: mine, sessionId: myPending.id, action: 'cancel' })}>
                    Rút lại
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" disabled={busyOn(myPending.id)} onClick={() => act.mutate({ cls: mine, sessionId: myPending.id, action: 'dispute' })}>
                      Chưa đúng
                    </Button>
                    <Button size="sm" loading={busyOn(myPending.id)} onClick={() => act.mutate({ cls: mine, sessionId: myPending.id, action: 'confirm' })}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Xác nhận đã học
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nút gửi xác nhận: Mentor gửi cho các học viên chưa có xác nhận, học viên gửi cho Mentor */}
        {(asMentor ? todo.length > 0 : myStatus === 'none') && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
            <p className="text-xs text-neutral-500">
              {asMentor && kind === 'group' ? 'Gửi một lần, từng học viên tự xác nhận mình đã học.' : 'Bên kia xác nhận thì lớp được tính là đã học.'}
            </p>
            <Button
              size="sm"
              loading={record.isPending && Boolean(record.variables?.some((cls) => members.includes(cls)))}
              onClick={() => record.mutate(asMentor ? todo : [first])}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              {asMentor && kind === 'group' ? `Xác nhận đã học cho cả lớp (${todo.length})` : 'Xác nhận đã học'}
            </Button>
          </div>
        )}
      </li>
    );
  };

  const FILTERS: { value: Filter; label: string }[] = [
    { value: 'all', label: `Tất cả (${counts.all})` },
    { value: 'group', label: `Lớp nhóm (${counts.group})` },
    { value: 'one', label: `Lớp 1-1 (${counts.one})` },
  ];

  return (
    <QueryBoundary query={classesQuery}>
      {started.length === 0 ? (
        <EmptyState
          title="Chưa có lớp nào đang học"
          description="Khi Mentor bắt đầu lớp từ mục Đã kết nối trong trang Yêu cầu, lớp học xuất hiện ở đây."
          action={<Button onClick={() => navigate('/mentoring')}>Tìm lớp kèm</Button>}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Loại lớp">
            {FILTERS.map((item) => (
              <Chip key={item.value} selected={filter === item.value} onClick={() => setFilter(item.value)}>
                {item.label}
              </Chip>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
              Chưa có {filter === 'group' ? 'lớp nhóm' : 'lớp 1-1'} nào đang học.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">{visible.map(renderCard)}</ul>
          )}
        </div>
      )}
    </QueryBoundary>
  );
};

export default ClassesPanel;
