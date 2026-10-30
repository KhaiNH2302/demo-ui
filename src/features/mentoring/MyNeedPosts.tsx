import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Pencil, Plus, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { FormField } from '@/components/shared/FormField';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/format';
import type { MentoringRequest, MentorPost, SupportMode } from '@/types/entities';
import { describePostFee } from './plans';
import { MODES, MODE_LABELS, SUBJECTS, TIME_PRESETS, type Mode } from './postOptions';

const isClosed = (post: MentorPost) =>
  post.status === 'CLOSED' ||
  post.status === 'EXPIRED' ||
  post.open === false ||
  Boolean(post.deadline && new Date(post.deadline).getTime() < Date.now());

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

interface EditForm {
  subject: string;
  title: string;
  content: string;
  schedule: string[];
  modes: string[];
  feeMode: 'negotiable' | 'fixed';
  fee: number;
  sessions: number;
  deadline: string;
}

const toForm = (post: MentorPost): EditForm => ({
  subject: post.subject || SUBJECTS[0].code,
  title: post.title,
  content: post.content || post.contentMd || '',
  schedule: post.schedule || [],
  modes: (post.modes || []).map(String),
  feeMode: post.fee === undefined || post.fee === null ? 'negotiable' : 'fixed',
  fee: post.fee ?? 100000,
  sessions: post.sessions || 4,
  deadline: toDateInput(post.deadline),
});

const EditPostDialog: React.FC<{ post: MentorPost | null; offerCount: number; onClose: () => void }> = ({ post, offerCount, onClose }) => {
  const queryClient = useQueryClient();
  // Component được gắn lại theo từng bài (key) nên chỉ cần khởi tạo một lần
  const [form, setForm] = useState<EditForm | null>(() => (post ? toForm(post) : null));

  const save = useMutation({
    mutationFn: (current: EditForm) =>
      apiClient.put<MentorPost>(`/mentoring/posts/${post?.id}`, {
        title: current.title.trim(),
        content: current.content.trim(),
        subject: current.subject,
        field: current.subject,
        modes: current.modes as SupportMode[],
        mode: current.modes[0] || 'online',
        schedule: current.schedule,
        fee: current.feeMode === 'fixed' ? current.fee : null,
        sessions: current.sessions,
        deadline: current.deadline,
        tags: [current.subject],
      }),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi');
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
      onClose();
    },
    onError: () => toast.error('Chưa lưu được bài, thử lại sau ít phút.'),
  });

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  const scheduleOptions = form ? Array.from(new Set([...form.schedule, ...TIME_PRESETS])) : TIME_PRESETS;
  const canSave = Boolean(form && form.title.trim() && form.content.trim() && form.schedule.length && form.modes.length && form.deadline);

  return (
    <Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài nhờ kèm</DialogTitle>
          <DialogDescription>
            {offerCount > 0
              ? `Đã có ${offerCount} Mentor đề nghị kèm. Họ sẽ thấy nội dung mới sau khi bạn lưu.`
              : 'Chưa có Mentor nào đề nghị, bạn có thể sửa thoải mái.'}
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_1fr]">
              <FormField label="Môn" required>
                <Select
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  options={SUBJECTS.map((s) => ({ value: s.code, label: s.code }))}
                />
              </FormField>
              <FormField label="Tiêu đề" required>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
              </FormField>
            </div>

            <FormField label="Bạn đang vướng ở đâu?" required>
              <Textarea rows={4} value={form.content} onChange={(e) => set('content', e.target.value)} />
            </FormField>

            <FormField label="Giờ bạn học được" required>
              <div className="flex flex-wrap gap-2">
                {scheduleOptions.map((option) => (
                  <Chip key={option} selected={form.schedule.includes(option)} onClick={() => set('schedule', toggle(form.schedule, option))}>
                    {option}
                  </Chip>
                ))}
              </div>
            </FormField>

            <FormField label="Hình thức" required>
              <div className="flex flex-wrap gap-2">
                {MODES.map((mode: Mode) => (
                  <Chip key={mode} selected={form.modes.includes(mode)} onClick={() => set('modes', toggle(form.modes, mode))}>
                    {MODE_LABELS[mode]}
                  </Chip>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Học phí bạn trả được">
                <div className="space-y-2">
                  <Select
                    value={form.feeMode}
                    onChange={(e) => set('feeMode', e.target.value as 'negotiable' | 'fixed')}
                    options={[
                      { value: 'negotiable', label: 'Thỏa thuận' },
                      { value: 'fixed', label: 'Nhập mức cụ thể' },
                    ]}
                  />
                  {form.feeMode === 'fixed' && (
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      value={form.fee}
                      onChange={(e) => set('fee', Number(e.target.value) || 0)}
                      aria-label="Học phí (VNĐ/buổi)"
                    />
                  )}
                  {form.feeMode === 'fixed' && (
                    <p className="text-xs text-neutral-500">{form.fee === 0 ? 'Miễn phí' : `${formatCurrency(form.fee)}/buổi`}</p>
                  )}
                </div>
              </FormField>
              <FormField label="Số buổi dự kiến">
                <Input type="number" min={1} max={30} value={form.sessions} onChange={(e) => set('sessions', Number(e.target.value) || 1)} />
              </FormField>
              <FormField label="Cần tìm trước ngày" required>
                <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
              </FormField>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button disabled={!canSave} loading={save.isPending} onClick={() => form && save.mutate(form)}>
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface MyNeedPostsProps {
  requests: MentoringRequest[];
  onViewOffers: () => void;
}

/** Danh sách bài nhờ kèm của chính học viên: sửa, đóng, mở lại và xem số lời đề nghị đã nhận. */
export const MyNeedPosts: React.FC<MyNeedPostsProps> = ({ requests, onViewOffers }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MentorPost | null>(null);
  const [closing, setClosing] = useState<MentorPost | null>(null);

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts', 'mine'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts/mine'),
  });

  const changeStatus = useMutation({
    mutationFn: ({ post, close }: { post: MentorPost; close: boolean }) =>
      apiClient.put<MentorPost>(`/mentoring/posts/${post.id}`, close ? { status: 'CLOSED', open: false } : { status: 'PUBLISHED', open: true }),
    onSuccess: (_data, { close }) => {
      toast.success(close ? 'Đã đóng bài' : 'Đã mở lại bài');
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    },
    onError: () => toast.error('Chưa đổi được trạng thái bài, thử lại sau ít phút.'),
  });

  const posts = postsQuery.data || [];
  const offersOf = (post: MentorPost) => requests.filter((request) => request.sourcePostId === post.id);
  const pendingOf = (post: MentorPost) => offersOf(post).filter((request) => request.status === 'PENDING_MENTOR_RESPONSE').length;

  return (
    <>
      <QueryBoundary query={postsQuery}>
        {posts.length === 0 ? (
          <EmptyState
            title="Bạn chưa đăng bài nhờ kèm nào"
            description="Đăng môn đang vướng và giờ học được để Mentor tìm tới bạn."
            action={<Button onClick={() => navigate('/mentoring')}><Plus className="mr-1.5 h-4 w-4" /> Đăng bài nhờ kèm</Button>}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {posts.map((post) => {
              const closed = isClosed(post);
              const offers = offersOf(post).length;
              const pending = pendingOf(post);
              return (
                <li
                  key={post.id}
                  className={cn('flex flex-col justify-between rounded-2xl border bg-surface', closed ? 'border-neutral-200 opacity-75' : 'border-neutral-200 dark:border-neutral-700/80')}
                >
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-2">
                      {post.subject && (
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                          {post.subject}
                        </span>
                      )}
                      <span className={cn('text-xs font-medium', closed ? 'text-neutral-500' : 'text-emerald-700')}>
                        {closed ? 'Đã đóng' : 'Đang mở'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{post.title}</h3>
                    <dl className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <dt className="sr-only">Giờ học được</dt>
                        <dd>{post.schedule?.length ? post.schedule.join(', ') : 'Lịch thỏa thuận'}</dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <dt className="sr-only">Học phí</dt>
                        <dd>
                          {describePostFee(post.fee)}
                          {post.sessions ? <span className="text-neutral-500">, {post.sessions} buổi</span> : null}
                        </dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                        <dt className="sr-only">Cần tìm trước</dt>
                        <dd>Cần tìm trước {post.deadline ? new Date(post.deadline).toLocaleDateString('vi-VN') : 'ngày chưa đặt'}</dd>
                      </div>
                    </dl>
                    <p className="text-sm text-neutral-600">
                      {offers === 0 ? (
                        'Chưa có Mentor nào đề nghị kèm.'
                      ) : (
                        <>
                          Đã có <strong>{offers}</strong> lời đề nghị
                          {pending > 0 && (
                            <>
                              {', '}
                              <button type="button" onClick={onViewOffers} className="font-semibold text-rose-600 hover:underline">
                                {pending} đang chờ bạn trả lời
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                    {closed ? (
                      <Button variant="outline" size="sm" loading={changeStatus.isPending && changeStatus.variables?.post.id === post.id} onClick={() => changeStatus.mutate({ post, close: false })}>
                        Mở lại bài
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setClosing(post)}>Đóng bài</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditing(post)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Chỉnh sửa
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>

      <EditPostDialog key={editing?.id ?? 'none'} post={editing} offerCount={editing ? offersOf(editing).length : 0} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={Boolean(closing)}
        onOpenChange={(open) => !open && setClosing(null)}
        title="Đóng bài nhờ kèm?"
        description="Mentor sẽ không thấy bài này ở Bảng tin nữa. Bạn có thể mở lại bất cứ lúc nào."
        confirmLabel="Đóng bài"
        onConfirm={() => {
          if (closing) changeStatus.mutate({ post: closing, close: true });
        }}
      />
    </>
  );
};
