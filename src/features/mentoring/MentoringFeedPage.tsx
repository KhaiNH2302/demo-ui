import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Heart,
  Inbox,
  MessageCircleMore,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { formatCurrency, formatScheduleSlot } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import { describePostFee } from './plans';
import { MODES, MODE_LABELS, SUBJECTS, TIME_PRESETS, type Mode } from './postOptions';
import type { Comment, Mentor, MentoringRequest, MentorPost, SupportMode } from '@/types/entities';

type Lane = 'OFFER_MENTORING' | 'NEED_MENTOR';

const LANES: Record<Lane, { title: string; hint: string; empty: string }> = {
  OFFER_MENTORING: {
    title: 'Lớp kèm đang mở',
    hint: 'Mentor mở lớp theo môn, có lịch và học phí rõ ràng',
    empty: 'Chưa có lớp kèm nào khớp bộ lọc. Thử bỏ bớt bộ lọc, hoặc đăng bài nhờ kèm để Mentor tìm tới bạn.',
  },
  NEED_MENTOR: {
    title: 'Bạn khóa dưới cần kèm',
    hint: 'Sinh viên đăng môn đang vướng và giờ học được',
    empty: 'Chưa có bài nhờ kèm nào khớp bộ lọc.',
  },
};

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const isClosed = (post: MentorPost) =>
  post.status === 'CLOSED' ||
  post.status === 'EXPIRED' ||
  post.open === false ||
  Boolean(post.deadline && new Date(post.deadline).getTime() < Date.now());

const daysLeft = (deadline?: string) => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
};

// Bài cũ chỉ có chuỗi mode tự do ("Online qua Google Meet") → quy về 3 hình thức chuẩn
const postModes = (post: MentorPost): Mode[] => {
  const raw = (post.modes?.length ? post.modes.join(' ') : String(post.mode || '')).toLowerCase();
  return MODES.filter((mode) => raw.includes(mode));
};

const deadlineLabel = (closed: boolean, left: number | null) => {
  if (closed || left === null || left < 0) return 'Đã đóng';
  if (left === 0) return 'Hết hạn hôm nay';
  return `Còn ${left} ngày`;
};

const ToggleChips: React.FC<{ options: { value: string; label: string }[]; value: string[]; onChange: (next: string[]) => void }> = ({
  options,
  value,
  onChange,
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => (
      <Chip
        key={option.value}
        selected={value.includes(option.value)}
        onClick={() =>
          onChange(value.includes(option.value) ? value.filter((item) => item !== option.value) : [...value, option.value])
        }
      >
        {option.label}
      </Chip>
    ))}
  </div>
);

interface MentoringFeedPageProps {
  embedded?: boolean;
  roleOverride?: 'student' | 'mentor';
}

export const MentoringFeedPage: React.FC<MentoringFeedPageProps> = ({ embedded = false, roleOverride }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isMentor =
    roleOverride === 'mentor' || (!roleOverride && Boolean(user?.roles?.some((role) => role.toLowerCase() === 'mentor')));

  const [lane, setLane] = useState<Lane>(isMentor ? 'NEED_MENTOR' : 'OFFER_MENTORING');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [request, setRequest] = useState<{ recipientId: string; postId: string; label: string } | null>(null);
  const [matchOnly, setMatchOnly] = useState(false);

  // Màn tạo bài
  // /mentoring?compose=need mở sẵn form đăng bài nhờ kèm (dùng cho nút "Đăng bài mới" ở trang Yêu cầu)
  const [searchParams] = useSearchParams();
  const [composer, setComposer] = useState<Lane | null>(() =>
    searchParams.get('compose') === 'need' && !isMentor ? 'NEED_MENTOR' : null
  );
  const [form, setForm] = useState({
    subject: SUBJECTS[0].code,
    title: '',
    content: '',
    schedule: [TIME_PRESETS[1]] as string[],
    modes: ['online'] as string[],
    feeMode: 'negotiable' as 'negotiable' | 'fixed',
    fee: 100000,
    sessions: 4,
    capacity: 5,
    trial: true,
    deadline: inDays(7),
  });
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts'),
  });
  const mentorsQuery = useQuery({
    queryKey: ['mentoring', 'mentors'],
    queryFn: () => apiClient.get<Mentor[]>('/mentoring/mentors'),
  });
  const commentsQuery = useQuery({
    queryKey: ['mentoring', 'comments'],
    queryFn: () => apiClient.get<Comment[]>('/mentoring/comments'),
  });

  const myMentorProfile = mentorsQuery.data?.find((mentor) => mentor.userId === user?.id);
  const mentorById = (id?: string) => mentorsQuery.data?.find((mentor) => mentor.userId === id);

  const openComposer = (type: Lane) => {
    // Mentor mở lớp: lấy sẵn học phí & lịch rảnh từ hồ sơ Mentor để khỏi nhập lại
    const pricing = myMentorProfile?.pricing;
    setForm((prev) => ({
      ...prev,
      title: '',
      content: '',
      feeMode: type === 'OFFER_MENTORING' ? 'fixed' : 'negotiable',
      fee: type === 'OFFER_MENTORING' ? pricing?.pricePerSession ?? 100000 : prev.fee,
      trial: type === 'OFFER_MENTORING' ? pricing?.trial.enabled ?? true : prev.trial,
      schedule:
        type === 'OFFER_MENTORING' && myMentorProfile?.availability.length
          ? myMentorProfile.availability.map((slot) => formatScheduleSlot(slot))
          : [TIME_PRESETS[1]],
    }));
    setComposer(type);
  };

  const createPost = useMutation({
    mutationFn: () => {
      const offer = composer === 'OFFER_MENTORING';
      return apiClient.post<MentorPost>('/mentoring/posts', {
        title: form.title.trim(),
        content: form.content.trim(),
        contentMd: form.content.trim(),
        subject: form.subject,
        field: form.subject,
        modes: form.modes as SupportMode[],
        mode: form.modes[0] || 'online',
        schedule: form.schedule,
        fee: form.feeMode === 'fixed' ? form.fee : undefined,
        sessions: form.sessions,
        trial: offer ? form.trial : undefined,
        capacity: offer ? form.capacity : 1,
        deadline: form.deadline,
        postType: composer,
        authorRole: offer ? 'mentor' : 'student',
        tags: [form.subject],
      });
    },
    onSuccess: () => {
      toast.success(composer === 'OFFER_MENTORING' ? 'Đã mở lớp kèm' : 'Đã đăng bài nhờ kèm');
      const posted = composer;
      setComposer(null);
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts', 'mine'] });
      // Học viên quản lý bài nhờ kèm của mình ở trang Yêu cầu; Mentor ở lại Bảng tin
      if (!isMentor && posted === 'NEED_MENTOR') navigate('/mentoring/requests?tab=posts');
      else setLane(posted ?? lane);
    },
    onError: () => toast.error('Chưa đăng được bài. Kiểm tra các ô bắt buộc rồi thử lại.'),
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? apiClient.post(`/mentoring/posts/${postId}/like`) : apiClient.delete(`/mentoring/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] }),
    onError: () => toast.error('Chưa cập nhật được lượt thích.'),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiClient.post<Comment>(`/mentoring/posts/${postId}/comments`, { content }),
    onSuccess: (_comment, variables) => {
      setCommentDrafts((current) => ({ ...current, [variables.postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    },
    onError: () => toast.error('Chưa gửi được bình luận.'),
  });

  const posts = useMemo(() => postsQuery.data || [], [postsQuery.data]);
  const laneCounts = {
    OFFER_MENTORING: posts.filter((post) => post.postType === 'OFFER_MENTORING' && !isClosed(post)).length,
    NEED_MENTOR: posts.filter((post) => post.postType === 'NEED_MENTOR' && !isClosed(post)).length,
  };

  const subjectOptions = useMemo(() => {
    const codes = Array.from(new Set(posts.map((post) => post.subject).filter(Boolean))) as string[];
    return [{ label: 'Tất cả môn', value: 'all' }, ...codes.sort().map((code) => ({ label: code, value: code }))];
  }, [posts]);

  // Môn Mentor đang nhận kèm → đánh dấu & đưa bài nhờ kèm khớp môn lên đầu
  const mySubjects = useMemo(
    () => (isMentor ? (myMentorProfile?.subjects || []).map((s) => s.toUpperCase()) : []),
    [isMentor, myMentorProfile]
  );
  const isSubjectMatch = (post: MentorPost) => Boolean(post.subject && mySubjects.includes(post.subject.toUpperCase()));
  const matchingCount = posts.filter((post) => post.postType === 'NEED_MENTOR' && !isClosed(post) && isSubjectMatch(post)).length;
  const myClasses = posts.filter((post) => post.postType === 'OFFER_MENTORING' && (post.authorId || post.mentorId) === user?.id);

  const mentorRequestsQuery = useQuery({
    queryKey: ['mentor', 'requests'],
    queryFn: () => apiClient.get<MentoringRequest[]>('/mentor/requests'),
    enabled: embedded && isMentor,
  });
  const pendingByPost = (mentorRequestsQuery.data || []).reduce<Record<string, number>>((acc, req) => {
    if (req.sourcePostId && req.status === 'PENDING_MENTOR_RESPONSE') acc[req.sourcePostId] = (acc[req.sourcePostId] || 0) + 1;
    return acc;
  }, {});

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (post: MentorPost) => Boolean(post.subject && mySubjects.includes(post.subject.toUpperCase()));
    return posts
      .filter((post) => post.postType === lane)
      .filter((post) => !matchOnly || lane !== 'NEED_MENTOR' || matches(post))
      .filter((post) => subjectFilter === 'all' || post.subject === subjectFilter)
      .filter((post) => modeFilter === 'all' || postModes(post).includes(modeFilter as Mode))
      .filter((post) => {
        if (!q) return true;
        return [post.title, post.content, post.contentMd, post.subject, ...(post.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        // Bài đã đóng luôn xuống cuối
        if (isClosed(a) !== isClosed(b)) return isClosed(a) ? 1 : -1;
        if (lane === 'NEED_MENTOR' && matches(a) !== matches(b)) return matches(a) ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [posts, lane, subjectFilter, modeFilter, search, matchOnly, mySubjects]);

  const filtersActive = search.trim() !== '' || subjectFilter !== 'all' || modeFilter !== 'all' || matchOnly;

  // ---------- Màn tạo bài ----------
  if (composer) {
    const offer = composer === 'OFFER_MENTORING';
    const scheduleOptions = Array.from(new Set([...form.schedule, ...TIME_PRESETS])).map((value) => ({ value, label: value }));
    const canSubmit = form.title.trim() && form.content.trim() && form.schedule.length > 0 && form.modes.length > 0 && form.deadline;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => setComposer(null)}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại bảng tin
        </button>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {offer ? 'Mở lớp kèm' : 'Đăng bài nhờ kèm'}
          </h1>
          <p className="text-sm text-neutral-600">
            {offer
              ? 'Học viên thấy môn, lịch, học phí và số chỗ ngay trên thẻ bài. Học phí và lịch được lấy sẵn từ hồ sơ Mentor của bạn.'
              : 'Mentor thấy môn bạn đang vướng và giờ bạn học được, rồi gửi lời nhận kèm.'}
          </p>
          {isMentor && (
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-700" role="tablist">
              {(['OFFER_MENTORING', 'NEED_MENTOR'] as Lane[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={composer === type}
                  onClick={() => openComposer(type)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    composer === type ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  {type === 'OFFER_MENTORING' ? 'Mở lớp kèm' : 'Tôi cần người kèm'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 dark:border-neutral-700/80">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr]">
            <FormField label="Môn" required>
              <Select
                value={form.subject}
                onChange={(e) => setField('subject', e.target.value)}
                options={SUBJECTS.map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
              />
            </FormField>
            <FormField label="Tiêu đề" required>
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder={offer ? 'VD: Kèm CSD201 từ mất gốc tới qua môn, 8 buổi' : 'VD: Cần người kèm ôn Practical Exam CSD201 tuần sau'}
              />
            </FormField>
          </div>

          <FormField label={offer ? 'Lớp học gồm những gì?' : 'Bạn đang vướng ở đâu?'} required>
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              placeholder={
                offer
                  ? 'Lộ trình từng buổi, tài liệu bạn chuẩn bị, cách bạn chữa bài...'
                  : 'Phần kiến thức chưa hiểu, mục tiêu (qua môn, đạt điểm, xong đồ án), muốn học 1-1 hay nhóm nhỏ...'
              }
            />
          </FormField>

          <FormField label={offer ? 'Lịch học' : 'Giờ bạn học được'} required helperText="Chọn một hoặc nhiều khung giờ.">
            <ToggleChips options={scheduleOptions} value={form.schedule} onChange={(next) => setField('schedule', next)} />
          </FormField>

          <FormField label="Hình thức" required>
            <ToggleChips
              options={MODES.map((mode) => ({ value: mode, label: MODE_LABELS[mode] }))}
              value={form.modes}
              onChange={(next) => setField('modes', next)}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={offer ? 'Học phí mỗi buổi' : 'Học phí bạn trả được'}>
              <div className="space-y-2">
                {!offer && (
                  <Select
                    value={form.feeMode}
                    onChange={(e) => setField('feeMode', e.target.value as 'negotiable' | 'fixed')}
                    options={[
                      { value: 'negotiable', label: 'Thỏa thuận' },
                      { value: 'fixed', label: 'Nhập mức cụ thể' },
                    ]}
                  />
                )}
                {(offer || form.feeMode === 'fixed') && (
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={form.fee}
                    onChange={(e) => setField('fee', Number(e.target.value) || 0)}
                    aria-label="Học phí (VNĐ/buổi)"
                  />
                )}
                {(offer || form.feeMode === 'fixed') && (
                  <p className="text-xs text-neutral-500">{form.fee === 0 ? 'Miễn phí' : `${formatCurrency(form.fee)}/buổi`}</p>
                )}
              </div>
            </FormField>
            <FormField label={offer ? 'Số buổi' : 'Số buổi dự kiến'}>
              <Input type="number" min={1} max={30} value={form.sessions} onChange={(e) => setField('sessions', Number(e.target.value) || 1)} />
            </FormField>
            <FormField label={offer ? 'Hạn đăng ký' : 'Cần tìm trước ngày'} required>
              <Input type="date" min={inDays(0)} value={form.deadline} onChange={(e) => setField('deadline', e.target.value)} />
            </FormField>
          </div>

          {offer && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Số học viên tối đa">
                <Input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setField('capacity', Number(e.target.value) || 1)} />
              </FormField>
              <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-neutral-200 px-4 py-2.5 text-sm dark:border-neutral-700">
                <span>
                  <span className="block font-medium text-neutral-900 dark:text-neutral-100">Cho học thử 1 buổi</span>
                  <span className="text-xs text-neutral-500">Học viên gặp bạn trước khi quyết định</span>
                </span>
                <Switch checked={form.trial} onCheckedChange={(checked) => setField('trial', checked)} />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
            <Button variant="outline" onClick={() => setComposer(null)}>Hủy</Button>
            <Button disabled={!canSubmit} loading={createPost.isPending} onClick={() => createPost.mutate()}>
              {offer ? 'Mở lớp kèm' : 'Đăng bài nhờ kèm'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Bảng tin ----------
  const primaryCreate: Lane = isMentor ? 'OFFER_MENTORING' : 'NEED_MENTOR';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!embedded && (
        <PageHeader
          title="Mentoring"
          description="Tìm lớp kèm theo môn, hoặc đăng môn bạn đang vướng để Mentor tìm tới bạn."
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring' }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => navigate('/mentoring/browse')}>
                <Users className="mr-1.5 h-4 w-4" /> Danh sách Mentor
              </Button>
              <Button variant="ghost" onClick={() => navigate('/mentoring/ai')}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Gợi ý bằng AI
              </Button>
              <Button variant="ghost" onClick={() => navigate('/mentoring/requests')}>
                <Inbox className="mr-1.5 h-4 w-4" /> Yêu cầu của tôi
              </Button>
              <Button onClick={() => openComposer(primaryCreate)}>
                <Plus className="mr-1.5 h-4 w-4" /> {isMentor ? 'Mở lớp kèm' : 'Đăng bài nhờ kèm'}
              </Button>
            </div>
          }
        />
      )}
      {/* Trong Mentor Center: bảng tin bên trái, "Lớp của bạn" bên phải để dùng hết bề ngang */}
      <div className={cn(embedded ? 'grid grid-cols-1 items-start gap-6 lg:grid-cols-12' : 'space-y-6')}>
      <div className={cn(embedded ? 'min-w-0 space-y-4 lg:col-span-8' : 'space-y-6')}>

      {/* Điện thoại: cột "Lớp của bạn" nằm cuối trang, nên đưa nút mở lớp lên đầu */}
      {embedded && (
        <Button className="w-full lg:hidden" onClick={() => openComposer('OFFER_MENTORING')}>
          <Plus className="mr-1.5 h-4 w-4" /> Mở lớp kèm
        </Button>
      )}

      {/* Hai nhu cầu chính: chọn bên nào thì feed hiện bên đó */}
      {/* Học viên chỉ xem lớp Mentor đăng; bài nhờ kèm của mình nằm ở trang Yêu cầu */}
      {!isMentor && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{LANES.OFFER_MENTORING.title}</h2>
            <p className="text-sm text-neutral-500">{LANES.OFFER_MENTORING.hint}</p>
          </div>
          <span className="text-3xl font-bold tabular-nums text-brand-600 dark:text-brand-300" aria-label={`${laneCounts.OFFER_MENTORING} lớp đang mở`}>
            {laneCounts.OFFER_MENTORING}
          </span>
        </div>
      )}

      {isMentor && <div className={cn('grid grid-cols-1 sm:grid-cols-2', embedded ? 'gap-2' : 'gap-3')} role="tablist" aria-label="Loại bài">
        {(['OFFER_MENTORING', 'NEED_MENTOR'] as Lane[]).map((key) => {
          const active = lane === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setLane(key)}
              className={cn(
                'flex items-center justify-between gap-4 rounded-2xl border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                embedded ? 'px-4 py-3' : 'px-5 py-4',
                active
                  ? 'border-brand-500 bg-surface dark:border-brand-400'
                  : 'border-transparent bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-700'
              )}
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-neutral-900 dark:text-neutral-100">{LANES[key].title}</span>
                <span className={cn('block text-sm text-neutral-500', embedded && 'line-clamp-1')}>
                  {embedded && isMentor && key === 'NEED_MENTOR' ? 'Học viên đang tìm người kèm' : LANES[key].hint}
                </span>
              </span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  embedded ? 'text-2xl' : 'text-3xl',
                  active ? 'text-brand-600 dark:text-brand-300' : 'text-neutral-400'
                )}
                aria-label={`${laneCounts[key]} bài đang mở`}
              >
                {laneCounts[key]}
              </span>
            </button>
          );
        })}
      </div>}

      {/* Bộ lọc gọn một hàng */}
      <div className={cn('grid gap-2', embedded ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-[1fr_10rem_11rem]')}>
        <div className={embedded ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo môn, chủ đề..." />
        </div>
        <Select aria-label="Lọc theo môn" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} options={subjectOptions} />
        <Select
          aria-label="Lọc theo hình thức"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          options={[{ value: 'all', label: 'Mọi hình thức' }, ...MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))]}
        />
      </div>

      <QueryBoundary query={postsQuery}>
        {visiblePosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
            <Search className="mx-auto mb-3 h-7 w-7 text-neutral-300" />
            <p className="mx-auto max-w-md text-sm text-neutral-600">{LANES[lane].empty}</p>
            <div className="mt-4 flex justify-center gap-2">
              {filtersActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('all');
                    setModeFilter('all');
                    setMatchOnly(false);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
              {!isMentor && !filtersActive && (
                <Button size="sm" onClick={() => openComposer('NEED_MENTOR')}>Đăng bài nhờ kèm</Button>
              )}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {visiblePosts.map((post) => {
              const ownerId = post.authorId || post.mentorId;
              const isOwner = ownerId === user?.id;
              const isOffer = post.postType === 'OFFER_MENTORING';
              const closed = isClosed(post);
              const capacity = post.capacity || post.slots || 1;
              const remaining = Math.max(capacity - (post.filledCount || 0), 0);
              const full = isOffer && remaining === 0;
              const left = daysLeft(post.deadline);
              const author = isOffer ? mentorById(ownerId) : undefined;
              const modes = postModes(post);
              const bodyText = post.content || post.contentMd || '';
              const bodyOpen = Boolean(expandedBodies[post.id]);
              const rootComments = (commentsQuery.data || []).filter((c) => c.postId === post.id && !c.parentId);
              const commentsOpen = Boolean(expandedComments[post.id]);
              const matchesMe = isMentor && !isOffer && isSubjectMatch(post);

              let action: React.ReactNode;
              if (isOwner) {
                action = (
                  <Button variant="outline" size="sm" onClick={() => navigate(isMentor ? '/mentor/requests' : '/mentoring/requests')}>
                    Xem yêu cầu nhận được
                  </Button>
                );
              } else if (closed) {
                action = <span className="text-sm text-neutral-500">Đã hết hạn</span>;
              } else if (full) {
                action = <span className="text-sm text-neutral-500">Lớp đã đủ chỗ</span>;
              } else if (isOffer) {
                action = (
                  <Button size="sm" onClick={() => setRequest({ recipientId: ownerId || '', postId: post.id, label: 'Mentor' })}>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Đăng ký lớp
                  </Button>
                );
              } else if (isMentor) {
                action = (
                  <Button size="sm" onClick={() => setRequest({ recipientId: ownerId || '', postId: post.id, label: 'Học viên' })}>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Nhận kèm bạn này
                  </Button>
                );
              } else {
                action = (
                  <span className="text-xs text-neutral-500">
                    Chỉ Mentor nhận kèm được. <Link to="/mentor/apply" className="text-primary hover:underline">Trở thành Mentor</Link>
                  </span>
                );
              }

              return (
                <li
                  key={post.id}
                  className={cn(
                    'rounded-2xl border bg-surface',
                    matchesMe && !closed ? 'border-brand-200 dark:border-brand-500/40' : 'border-neutral-200 dark:border-neutral-700/80',
                    closed && 'opacity-70'
                  )}
                >
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <UserMiniCard userId={ownerId} showMajor />
                      <div className="flex shrink-0 items-center gap-2">
                        {matchesMe && (
                          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">Khớp môn bạn kèm</span>
                        )}
                        {author?.rating ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {author.rating.toFixed(1)}
                            <span className="font-normal text-neutral-500">({author.reviewCount})</span>
                          </span>
                        ) : null}
                        {post.subject && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                            {post.subject}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/mentoring/posts/${post.id}`}
                      className="block text-lg font-semibold leading-snug text-neutral-900 hover:underline dark:text-neutral-100"
                    >
                      {post.title}
                    </Link>

                    {/* Thông tin chính: cái người đọc cần để quyết định */}
                    <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-neutral-400" />
                        <dt className="sr-only">Lịch</dt>
                        <dd>{post.schedule?.length ? post.schedule.join(', ') : 'Lịch thỏa thuận'}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-4 w-4 text-neutral-400" />
                        <dt className="sr-only">Học phí</dt>
                        <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {describePostFee(post.fee)}
                          {post.sessions ? <span className="font-normal text-neutral-500">, {post.sessions} buổi</span> : null}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <dt className="sr-only">Hạn</dt>
                        <dd className={cn(left !== null && left >= 0 && left <= 3 && 'font-medium text-amber-700')}>
                          {deadlineLabel(closed, left)}
                          {isOffer && !closed && <span className="text-neutral-500">, {remaining}/{capacity} chỗ trống</span>}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-1.5">
                      {post.trial && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                          Có học thử
                        </span>
                      )}
                      {modes.map((mode) => (
                        <span key={mode} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {MODE_LABELS[mode]}
                        </span>
                      ))}
                    </div>

                    {bodyText && (
                      <div>
                        <p className={cn('whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-400', !bodyOpen && 'line-clamp-3')}>
                          {bodyText}
                        </p>
                        {bodyText.length > 220 && (
                          <button
                            type="button"
                            onClick={() => setExpandedBodies((current) => ({ ...current, [post.id]: !current[post.id] }))}
                            className="mt-1 text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                          >
                            {bodyOpen ? 'Thu gọn' : 'Xem thêm'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-pressed={Boolean(post.liked)}
                        className={post.liked ? 'text-rose-600' : 'text-neutral-600'}
                        onClick={() => likeMutation.mutate({ postId: post.id, liked: !post.liked })}
                      >
                        <Heart className={cn('mr-1.5 h-4 w-4', post.liked && 'fill-current')} />
                        {post.likeCount || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={commentsOpen}
                        className="text-neutral-600"
                        onClick={() => setExpandedComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                      >
                        <MessageCircleMore className="mr-1.5 h-4 w-4" />
                        {post.commentCount || 0} bình luận
                      </Button>
                    </div>
                    <div className="px-2">{action}</div>
                  </div>

                  {commentsOpen && (
                    <div className="space-y-3 border-t border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                      {rootComments.length === 0 ? (
                        <p className="text-sm text-neutral-500">Chưa có bình luận. Hỏi người đăng điều bạn muốn biết trước khi đăng ký.</p>
                      ) : (
                        rootComments.map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-neutral-200 bg-surface p-3 dark:border-neutral-700">
                            <UserMiniCard userId={comment.authorId} size="sm" subtitle={new Date(comment.createdAt).toLocaleString('vi-VN')} />
                            <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{comment.content}</p>
                          </div>
                        ))
                      )}
                      <form
                        className="flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const content = (commentDrafts[post.id] || '').trim();
                          if (content) addCommentMutation.mutate({ postId: post.id, content });
                        }}
                      >
                        <Input
                          aria-label="Viết bình luận"
                          value={commentDrafts[post.id] || ''}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                          placeholder="Hỏi về lịch, học phí, cách học..."
                        />
                        <Button
                          type="submit"
                          size="sm"
                          aria-label="Gửi bình luận"
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          loading={addCommentMutation.isPending && addCommentMutation.variables?.postId === post.id}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>
      </div>

      {embedded && (
        <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          {/* Lớp Mentor đang mở: theo dõi chỗ trống và yêu cầu chờ mà không phải lục bảng tin */}
          <section className="rounded-2xl border border-neutral-200 bg-surface dark:border-neutral-700/80" aria-labelledby="my-classes">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
              <h2 id="my-classes" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Lớp của bạn <span className="font-normal text-neutral-400">{myClasses.length}</span>
              </h2>
              <Button size="sm" onClick={() => openComposer('OFFER_MENTORING')}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Mở lớp kèm
              </Button>
            </div>
            {myClasses.length === 0 ? (
              <p className="px-4 py-5 text-sm text-neutral-600">
                Bạn chưa mở lớp nào. Lớp có lịch và học phí rõ ràng giúp học viên tự tìm tới bạn.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {myClasses.map((post) => {
                  const capacity = post.capacity || post.slots || 1;
                  const remaining = Math.max(capacity - (post.filledCount || 0), 0);
                  const pending = pendingByPost[post.id] || 0;
                  const closed = isClosed(post);
                  return (
                    <li key={post.id} className="space-y-1.5 px-4 py-3">
                      <Link
                        to={`/mentoring/posts/${post.id}`}
                        className="line-clamp-2 text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                      >
                        {post.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                        {post.subject && <span className="font-bold text-brand-700 dark:text-brand-300">{post.subject}</span>}
                        <span className="tabular-nums">{closed ? 'Đã đóng' : `${remaining}/${capacity} chỗ trống`}</span>
                        <span>{deadlineLabel(closed, daysLeft(post.deadline))}</span>
                      </div>
                      {pending > 0 && (
                        <button
                          type="button"
                          onClick={() => navigate('/mentor/requests')}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          {pending} yêu cầu đang chờ bạn trả lời
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Lọc nhanh bài nhờ kèm khớp môn Mentor nhận */}
          {mySubjects.length > 0 && (
            <section className="space-y-3 rounded-2xl border border-neutral-200 bg-surface p-4 dark:border-neutral-700/80">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {matchingCount} bài nhờ kèm khớp môn bạn kèm
                </p>
                <p className="text-xs text-neutral-500">{mySubjects.join(', ')}</p>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                Chỉ xem bài khớp môn
                <Switch
                  checked={matchOnly}
                  onCheckedChange={(checked) => {
                    setMatchOnly(checked);
                    if (checked) setLane('NEED_MENTOR');
                  }}
                  aria-label="Chỉ xem bài khớp môn"
                />
              </label>
            </section>
          )}

          <button
            type="button"
            onClick={() => openComposer('NEED_MENTOR')}
            className="w-full rounded-xl px-4 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-neutral-800"
          >
            Bạn cũng cần người kèm môn khác? <span className="font-medium text-brand-700 dark:text-brand-300">Đăng bài nhờ kèm</span>
          </button>
        </aside>
      )}
      </div>

      {request && (
        <SendMentoringRequestDialog
          open
          onOpenChange={(open) => !open && setRequest(null)}
          mentorId={request.recipientId}
          sourcePostId={request.postId}
          recipientLabel={request.label}
        />
      )}
    </div>
  );
};

export default MentoringFeedPage;
