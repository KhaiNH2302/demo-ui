import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  Heart,
  Inbox,
  MessageCircleMore,
  Plus,
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Send,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/Toast';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import { describePostFee } from './plans';
import { CAMPUSES, MODES, MODE_LABELS, campusLabel, type Mode } from './postOptions';
import type { Comment, Mentor, MentoringRequest, MentorPost } from '@/types/entities';

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

const PRICE_OPTIONS = [
  { label: 'Mọi mức giá', value: 'all' },
  { label: 'Miễn phí', value: 'free' },
  { label: 'Dưới 100.000 ₫/buổi', value: 'lt100' },
  { label: '100.000 – 150.000 ₫/buổi', value: '100-150' },
  { label: 'Trên 150.000 ₫/buổi', value: 'gt150' },
];

const DEADLINE_OPTIONS = [
  { label: 'Mọi thời hạn', value: 'all' },
  { label: 'Còn từ 7 ngày trở lên', value: 'week' },
  { label: 'Sắp hết hạn (3 ngày)', value: 'soon' },
];

const matchesPrice = (fee: number | undefined, price: string) => {
  if (price === 'all') return true;
  if (fee === undefined || fee === null) return false;
  if (price === 'free') return fee === 0;
  if (price === 'lt100') return fee < 100000;
  if (price === '100-150') return fee >= 100000 && fee <= 150000;
  return fee > 150000;
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

// Chỗ trống của lớp: số còn lại đặt to, thanh tiến độ cho thấy lớp đã đầy tới đâu; màu báo sắp hết / hết chỗ
const SeatMeter: React.FC<{ capacity: number; filled: number; pending?: number; closed: boolean; compact?: boolean }> = ({ capacity, filled, pending = 0, closed, compact = false }) => {
  // Số chỗ vừa tăng so với lần hiển thị trước (ví dụ sau khi nhận một học viên) để Mentor thấy sự thay đổi
  const [seen, setSeen] = useState(filled);
  const gained = Math.max(filled - Math.min(seen, filled), 0);
  useEffect(() => {
    if (gained === 0) return;
    const timer = window.setTimeout(() => setSeen(filled), 6000);
    return () => window.clearTimeout(timer);
  }, [filled, seen, gained]);
  const remaining = Math.max(capacity - filled, 0);
  const tone = closed
    ? { text: 'text-neutral-500', bar: 'bg-neutral-300 dark:bg-neutral-600', box: 'bg-neutral-50 dark:bg-neutral-800/60', note: 'Đã đóng' }
    : remaining === 0
      ? { text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', box: 'bg-rose-50 dark:bg-rose-500/10', note: 'Đã đủ chỗ' }
      : remaining / capacity <= 0.25
        ? { text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', box: 'bg-amber-50 dark:bg-amber-500/10', note: 'Sắp hết chỗ' }
        : { text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', box: 'bg-emerald-50 dark:bg-emerald-500/10', note: 'Còn nhiều chỗ' };
  const pendingSeats = closed ? 0 : Math.min(pending, Math.max(capacity - filled, 0));
  return (
    <div className={cn('rounded-xl', tone.box, compact ? 'space-y-1 px-3 py-2' : 'space-y-2 px-3 py-2.5')}>
      <div className="flex items-end justify-between gap-2">
        <p className="flex items-baseline gap-1.5">
          <span className={cn('font-bold leading-none tabular-nums', compact ? 'text-xl' : 'text-3xl', tone.text)}>{closed ? '–' : remaining}</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">chỗ trống</span>
          <span className="text-xs text-neutral-500 tabular-nums">/ {capacity}</span>
        </p>
        <span className={cn('text-xs font-semibold', tone.text)}>{tone.note}</span>
      </div>
      {/* Mỗi ô là một chỗ: đã nhận (đặc), đang chờ duyệt (vằn vàng), còn trống (rỗng) → nhìn là thấy lớp đang đầy dần */}
      <div
        className="flex gap-0.5"
        role="progressbar"
        aria-label={`Đã có ${filled}/${capacity} học viên`}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={filled}
      >
        {Array.from({ length: capacity }, (_, i) => {
          const taken = i < filled;
          const waiting = !taken && i < filled + pendingSeats;
          return (
            <span
              key={i}
              className={cn(
                'h-3 min-w-0 flex-1 rounded-sm transition-colors duration-500',
                taken && tone.bar,
                taken && i >= filled - gained && 'animate-pulse ring-2 ring-offset-1 ring-current',
                waiting && 'bg-amber-300/70 [background-image:repeating-linear-gradient(45deg,transparent_0_3px,rgba(255,255,255,.7)_3px_5px)]',
                !taken && !waiting && 'bg-white dark:bg-neutral-900/60'
              )}
            />
          );
        })}
      </div>
      {(!compact || pendingSeats > 0 || gained > 0) && (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1"><span className={cn('h-2 w-2 rounded-sm', tone.bar)} />Đã nhận</span>
        {pendingSeats > 0 && (
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-300" />Chờ duyệt ({pendingSeats})</span>
        )}
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-neutral-300 bg-white" />Trống</span>
        {gained > 0 && <span className="font-semibold text-emerald-600">+{gained} vừa đăng ký</span>}
      </div>
      )}
      {!compact && <p className="text-xs text-neutral-500 tabular-nums">{filled}/{capacity} học viên đã tham gia</p>}
    </div>
  );
};

const deadlineLabel = (closed: boolean, left: number | null) => {
  if (closed || left === null || left < 0) return 'Đã đóng';
  if (left === 0) return 'Hết hạn hôm nay';
  return `Còn ${left} ngày`;
};

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
  const [campusFilter, setCampusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [seatOnly, setSeatOnly] = useState(false);
  const [trialOnly, setTrialOnly] = useState(false);
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [request, setRequest] = useState<{ recipientId: string; postId: string; label: string } | null>(null);
  const [matchOnly, setMatchOnly] = useState(false);

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

  // Đăng bài nằm ở trang riêng, không mở popup hay chế độ trong cùng trang
  const openComposer = (type: Lane) => navigate(`/mentoring/new?type=${type === 'OFFER_MENTORING' ? 'offer' : 'need'}`);

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
      .filter((post) => campusFilter === 'all' || post.campus === campusFilter)
      .filter((post) => matchesPrice(post.fee, priceFilter))
      .filter((post) => {
        if (deadlineFilter === 'all') return true;
        const left = daysLeft(post.deadline);
        if (left === null) return false;
        return deadlineFilter === 'soon' ? left >= 0 && left <= 3 : left >= 7;
      })
      .filter((post) => !seatOnly || lane !== 'OFFER_MENTORING' || (post.capacity || post.slots || 1) - (post.filledCount || 0) > 0)
      .filter((post) => !trialOnly || lane !== 'OFFER_MENTORING' || Boolean(post.trial))
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
  }, [posts, lane, subjectFilter, modeFilter, campusFilter, priceFilter, deadlineFilter, seatOnly, trialOnly, search, matchOnly, mySubjects]);

  const modeOptions = [{ value: 'all', label: 'Mọi hình thức' }, ...MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))];
  const activeFilters = [
    { key: 'subject', label: subjectFilter, on: subjectFilter !== 'all', clear: () => setSubjectFilter('all') },
    { key: 'mode', label: modeOptions.find((o) => o.value === modeFilter)?.label, on: modeFilter !== 'all', clear: () => setModeFilter('all') },
    { key: 'campus', label: campusLabel(campusFilter), on: campusFilter !== 'all', clear: () => setCampusFilter('all') },
    { key: 'price', label: PRICE_OPTIONS.find((o) => o.value === priceFilter)?.label, on: priceFilter !== 'all', clear: () => setPriceFilter('all') },
    { key: 'deadline', label: DEADLINE_OPTIONS.find((o) => o.value === deadlineFilter)?.label, on: deadlineFilter !== 'all', clear: () => setDeadlineFilter('all') },
    { key: 'seat', label: 'Còn chỗ trống', on: seatOnly && lane === 'OFFER_MENTORING', clear: () => setSeatOnly(false) },
    { key: 'trial', label: 'Có học thử', on: trialOnly && lane === 'OFFER_MENTORING', clear: () => setTrialOnly(false) },
  ].filter((item) => item.on);
  const resetFilters = () => {
    setSearch('');
    setSubjectFilter('all');
    setModeFilter('all');
    setCampusFilter('all');
    setPriceFilter('all');
    setDeadlineFilter('all');
    setSeatOnly(false);
    setTrialOnly(false);
    setMatchOnly(false);
  };
  const filtersActive = search.trim() !== '' || activeFilters.length > 0 || matchOnly;

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

      {/* Tìm kiếm + bộ lọc nâng cao gom một nút, điều kiện đang lọc hiện thành chip bỏ được từng cái */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo môn, chủ đề..." />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Bộ lọc
                {activeFilters.length > 0 && (
                  <span className="ml-2 rounded-full bg-brand-600 px-1.5 text-xs font-bold leading-5 text-white">{activeFilters.length}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Bộ lọc nâng cao</p>
              {[
                { id: 'subject', label: 'Môn học', value: subjectFilter, set: setSubjectFilter, options: subjectOptions },
                { id: 'mode', label: 'Hình thức học', value: modeFilter, set: setModeFilter, options: modeOptions },
                { id: 'campus', label: 'Cơ sở FPTU (học tại trường)', value: campusFilter, set: setCampusFilter, options: [{ value: 'all', label: 'Mọi cơ sở' }, ...CAMPUSES] },
                { id: 'price', label: 'Học phí', value: priceFilter, set: setPriceFilter, options: PRICE_OPTIONS },
                { id: 'deadline', label: 'Hạn đăng ký', value: deadlineFilter, set: setDeadlineFilter, options: DEADLINE_OPTIONS },
              ].map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <label htmlFor={`feed-filter-${item.id}`} className="text-xs font-medium text-neutral-500">{item.label}</label>
                  <Select id={`feed-filter-${item.id}`} value={item.value} onChange={(e) => item.set(e.target.value)} options={item.options} />
                </div>
              ))}
              {lane === 'OFFER_MENTORING' && (
                <div className="space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <label className="flex items-center justify-between gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                    Chỉ lớp còn chỗ trống
                    <Switch checked={seatOnly} onCheckedChange={setSeatOnly} aria-label="Chỉ lớp còn chỗ trống" />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                    Chỉ lớp có học thử
                    <Switch checked={trialOnly} onCheckedChange={setTrialOnly} aria-label="Chỉ lớp có học thử" />
                  </label>
                </div>
              )}
              <div className="flex justify-end pt-1">
                <Button size="sm" variant="ghost" disabled={!filtersActive} onClick={resetFilters}>Xóa bộ lọc</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Đang lọc:</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.clear}
                aria-label={`Bỏ lọc ${filter.label}`}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                {filter.label}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
            <Button size="sm" variant="ghost" onClick={resetFilters}>Xóa hết</Button>
          </div>
        )}
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
                  onClick={resetFilters}
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
                        </dd>
                      </div>
                      {post.campus && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                          <dt className="sr-only">Cơ sở</dt>
                          <dd>FPTU {campusLabel(post.campus)}</dd>
                        </div>
                      )}
                    </dl>

                    {/* Tag bên trái, chỗ trống bên phải trên cùng một hàng để không chừa khoảng trống */}
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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
                      {isOffer && !closed && (
                        <div className="w-full sm:w-80">
                          <SeatMeter compact capacity={capacity} filled={Math.min(post.filledCount || 0, capacity)} pending={embedded ? pendingByPost[post.id] || 0 : 0} closed={false} />
                        </div>
                      )}
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
                        <span>{deadlineLabel(closed, daysLeft(post.deadline))}</span>
                      </div>
                      <SeatMeter capacity={capacity} filled={Math.min(post.filledCount || 0, capacity)} pending={pending} closed={closed} />
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
