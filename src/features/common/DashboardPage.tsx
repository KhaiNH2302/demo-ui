import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UsersRound,
  ArrowLeftRight,
  AlertCircle,
  GraduationCap,
  HelpCircle,
  Compass,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { CommunityActivityCard, type CommunityActivityItem } from '@/components/shared/CommunityActivityCard';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EntityRow } from '@/components/shared/EntityRow';
import { DateBadge } from '@/components/shared/DateBadge';
import { UpcomingList } from '@/components/shared/UpcomingList';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { formatRelativeTime, getInitials } from '@/lib/format';
import {
  getPendingGuestAction,
  consumePendingGuestAction,
  type PendingGuestAction,
} from '@/lib/viewer';
import type { KnowledgePost } from '@/types/entities';

export interface TodayTaskItem {
  id: string;
  kind:
    | 'event_today'
    | 'group_join_request'
    | 'swap_proposal'
    | 'supplement_needed'
    | 'mentoring_session'
    | 'deadline_soon';
  title: string;
  subtitle: string;
  date?: string;
  actionLabel: 'Mở' | 'Xét duyệt' | 'Phản hồi' | 'Bổ sung' | 'Xem';
  href: string;
}

export interface MySpaceItem {
  id: string;
  type: 'group' | 'club' | 'program' | 'mentoring';
  name: string;
  roleNote: string;
  logoUrl?: string;
  unreadCount?: number;
  hasUpdate?: boolean;
  href: string;
}

const DEFAULT_TODAY_ITEMS: TodayTaskItem[] = [
  {
    id: 'td_1',
    kind: 'group_join_request',
    title: 'Duyệt 2 yêu cầu xin vào Nhóm SWP391 Capstone',
    subtitle: 'Trưởng nhóm · Gửi 2 giờ trước',
    actionLabel: 'Xét duyệt',
    href: '/groups/grp_01/manage',
  },
  {
    id: 'td_2',
    kind: 'swap_proposal',
    title: 'Phản hồi lời mời đổi lớp PRN231 (SE1702 ↔ SE1705)',
    subtitle: 'Từ Trần Minh Cường · Khớp lịch 100%',
    actionLabel: 'Phản hồi',
    href: '/swap/connections',
  },
  {
    id: 'td_3',
    kind: 'supplement_needed',
    title: 'Bổ sung thông tin đơn CTV Matsuri Tech 2026',
    subtitle: 'JS Club · Hạn bổ sung 02/10',
    actionLabel: 'Bổ sung',
    href: '/clubs/registrations/resp_01',
  },
];

const DEFAULT_SPACES: MySpaceItem[] = [
  {
    id: 'sp_1',
    type: 'group',
    name: 'Nhóm SWP391 Capstone',
    roleNote: 'Trưởng nhóm · 4/5 TV',
    unreadCount: 3,
    href: '/groups/grp_01',
  },
  {
    id: 'sp_2',
    type: 'club',
    name: 'F-Code Club',
    roleNote: 'Đại diện CLB',
    logoUrl:
      'https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=120&q=80',
    hasUpdate: true,
    href: '/clubs/club_01',
  },
  {
    id: 'sp_3',
    type: 'program',
    name: 'Tủ Sách Cho Em — Ba Vì',
    roleNote: 'Tình nguyện viên · CN 25/10',
    href: '/programs/prog_01',
  },
];

const communityActivities: CommunityActivityItem[] = [
  {
    id: 'act_club_01',
    sourceType: 'club',
    sourceId: 'club_01',
    sourceName: 'F-Code Club',
    sourceLogoUrl:
      'https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=120&q=80',
    activityType: 'event',
    title: 'Seminar: Ứng dụng LLM & RAG trong Đồ án Tốt nghiệp SEP490',
    summary:
      'Chia sẻ kiến trúc RAG thực chiến và kinh nghiệm bảo vệ đồ án SEP490 trước hội đồng.',
    timestamp: '2026-09-25T08:00:00Z',
    eventDetails: {
      date: 'Thứ Bảy, 18/10/2026 (09:00 - 11:30)',
      location: 'Hội trường Gamma, Tầng 5, ĐH FPT Hà Nội',
      rsvpCount: 68,
    },
    linkTo: '/opportunities/opp_04',
  },
];

const DISMISS_ONBOARDING_KEY = 'scs_dismiss_onboarding_until';

function getGreetingTimeWord(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function getTodayFormatted(): string {
  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${days[now.getDay()]} ${dd}/${mm}`;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [reportPost, setReportPost] = useState<KnowledgePost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // C6.0 Line 1: Pending guest action before login
  const [pendingAction, setPendingAction] = useState<PendingGuestAction | null>(() =>
    getPendingGuestAction(),
  );

  // C6.0 Line 2: Profile completion reminder
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_ONBOARDING_KEY) || 0);
      return Date.now() < until;
    } catch {
      return false;
    }
  });

  const needsProfileOnboarding =
    !onboardingDismissed && (!user?.major || !user?.skills || user.skills.length === 0);

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      localStorage.setItem(
        DISMISS_ONBOARDING_KEY,
        String(Date.now() + 7 * 24 * 3600 * 1000),
      );
    } catch {
      // ignore
    }
  };

  // C6.T.2: TodayPanel query
  const todayQuery = useQuery<{ items: TodayTaskItem[]; total: number }>({
    queryKey: ['home', 'today'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ items: TodayTaskItem[]; total: number }>('/home/today');
        if (res && Array.isArray(res.items)) return res;
      } catch {
        // fallback
      }
      return { items: DEFAULT_TODAY_ITEMS, total: 4 };
    },
  });

  // C6.T.3: MySpaces query
  const spacesQuery = useQuery<MySpaceItem[]>({
    queryKey: ['home', 'spaces'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<MySpaceItem[]>('/home/spaces');
        if (Array.isArray(res)) return res;
      } catch {
        // fallback
      }
      return DEFAULT_SPACES;
    },
  });

  const followingSubjectsQuery = useQuery<string[]>({
    queryKey: ['subjects', 'following'],
    queryFn: () => apiClient.get('/subjects/following'),
  });

  const feedQuery = useQuery<KnowledgePost[]>({
    queryKey: ['feed', feedTab],
    queryFn: async () => {
      const posts = await apiClient.get<KnowledgePost[]>('/posts');
      const visible = posts.filter((p) => p.status === 'Published');
      if (feedTab === 'following') {
        const followed = followingSubjectsQuery.data || ['CSD201', 'SWP391'];
        return visible.filter(
          (p) =>
            (p.subject && followed.includes(p.subject)) ||
            (p.subjectCode && followed.includes(p.subjectCode)),
        );
      }
      return visible;
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${id}/like`) : apiClient.delete(`/posts/${id}/like`),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${id}/save`) : apiClient.delete(`/posts/${id}/save`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setDeletePostId(null);
    },
  });

  const posts = feedQuery.data || [];
  const todayItems = todayQuery.data?.items || [];
  const todayTotal = todayQuery.data?.total ?? todayItems.length;
  const spaces = spacesQuery.data || DEFAULT_SPACES;

  const unansweredQuestions = posts.filter(
    (p) => p.type === 'question' && !p.isSolved && p.commentCount <= 1,
  );

  const handlePostCreated = (newPost: KnowledgePost) => {
    queryClient.setQueryData<KnowledgePost[]>(['feed', feedTab], (prev = []) => [
      newPost,
      ...prev,
    ]);
  };

  const givenName = user?.fullName
    ? user.fullName.trim().split(/\s+/).slice(-2).join(' ')
    : 'bạn';

  const renderTodayLeading = (item: TodayTaskItem) => {
    if (item.date && (item.kind === 'event_today' || item.kind === 'deadline_soon')) {
      return <DateBadge date={item.date} size="sm" />;
    }
    const Icon =
      item.kind === 'group_join_request'
        ? UsersRound
        : item.kind === 'swap_proposal'
          ? ArrowLeftRight
          : item.kind === 'mentoring_session'
            ? GraduationCap
            : AlertCircle;

    return (
      <div className="h-10 w-10 rounded-md bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8 items-start">
      {/* Main Single Column Feed (max-w-[680px]) */}
      <div className="w-full max-w-[680px] mx-auto space-y-4">
        {/* C6.0 — 2 dòng nhắc ngắn trên đầu Bảng tin */}
        {pendingAction && (
          <div className="px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-700 truncate">
              Tiếp tục: <strong className="font-semibold text-neutral-900">{pendingAction.actionLabel}</strong>
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = pendingAction.redirectTo;
                  consumePendingGuestAction();
                  setPendingAction(null);
                  navigate(target);
                }}
                className="font-semibold text-brand-600 hover:underline"
              >
                Mở lại
              </button>
              <button
                type="button"
                onClick={() => {
                  consumePendingGuestAction();
                  setPendingAction(null);
                }}
                aria-label="Đóng nhắc nhở"
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {needsProfileOnboarding && (
          <div className="px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-neutral-700">
              Hoàn thiện hồ sơ (môn học, kỹ năng, lịch rảnh) để nhận gợi ý phù hợp hơn.
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/onboarding" className="font-semibold text-brand-600 hover:underline">
                Bắt đầu (2 phút)
              </Link>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={handleDismissOnboarding}
                className="text-neutral-500 hover:text-neutral-800"
              >
                Để sau
              </button>
            </div>
          </div>
        )}

        {/* C6.T.1 — GreetingLine (1 dòng 24px, không hộp, không emoji) */}
        <div className="h-6 flex items-center text-sm text-neutral-500">
          <span>
            {getGreetingTimeWord()},{' '}
            <strong className="font-medium text-neutral-900">{givenName}</strong> ·{' '}
            {getTodayFormatted()}
          </span>
        </div>

        {/* C6.T.2 — TodayPanel ("Hôm nay") */}
        {todayItems.length > 0 && (
          <section className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Hôm nay
              </h2>
              <Link
                to="/requests"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Xem tất cả ({todayTotal}) →
              </Link>
            </div>
            <div className="divide-y divide-neutral-200">
              {todayItems.slice(0, 3).map((item) => (
                <EntityRow
                  key={item.id}
                  href={item.href}
                  leading={renderTodayLeading(item)}
                  title={item.title}
                  subtitle={item.subtitle}
                  trailing={
                    <span className="text-xs font-semibold text-brand-600 hover:underline">
                      {item.actionLabel}
                    </span>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* C6.T.3 (Mobile < 1280px) — MySpacesChips */}
        {spaces.length > 0 && (
          <div className="xl:hidden flex items-center gap-2 overflow-x-auto pb-1">
            {spaces.map((sp) => (
              <Link
                key={sp.id}
                to={sp.href}
                className="shrink-0 inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs hover:bg-neutral-50"
              >
                {sp.logoUrl ? (
                  <img
                    src={sp.logoUrl}
                    alt={sp.name}
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <span className="h-5 w-5 rounded bg-neutral-100 text-neutral-700 text-[10px] font-semibold flex items-center justify-center">
                    {getInitials(sp.name)}
                  </span>
                )}
                <span className="font-medium text-neutral-800 max-w-[160px] truncate">
                  {sp.name}
                </span>
                {(sp.unreadCount || sp.hasUpdate) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Composer */}
        <ThreadComposer onPosted={handlePostCreated} />

        {/* Feed Tab SegmentedControl */}
        <div className="sticky top-14 z-10 bg-white/95 backdrop-blur-xs py-2 border-b border-neutral-200 flex items-center justify-between">
          <SegmentedControl
            options={[
              { value: 'for_you', label: 'Dành cho bạn' },
              { value: 'following', label: 'Đang theo dõi' },
            ]}
            value={feedTab}
            onValueChange={(val) => setFeedTab(val as 'for_you' | 'following')}
            size="sm"
          />

          <Link
            to="/knowledge"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
          >
            <Compass size={14} /> Khám phá môn học
          </Link>
        </div>

        {/* Feed Timeline */}
        <div className="space-y-1">
          {feedQuery.isLoading ? (
            <div className="space-y-6 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 py-4 border-b border-neutral-100 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-3.5 bg-neutral-100 rounded w-full" />
                    <div className="h-3.5 bg-neutral-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-white rounded-lg border border-neutral-200 p-6">
              <p className="text-sm text-neutral-600">
                {feedTab === 'following'
                  ? 'Chưa có bài thảo luận nào trong các môn bạn đang theo dõi.'
                  : 'Bảng tin chưa có bài viết mới.'}
              </p>
              <Link to="/knowledge">
                <Button variant="outline" size="sm">
                  Theo dõi thêm môn học
                </Button>
              </Link>
            </div>
          ) : (
            posts.map((post, index) => {
              const showUnansweredWidget = index === 2 && unansweredQuestions.length > 0;
              const showCommunityActivity = index === 4 && communityActivities.length > 0;

              return (
                <React.Fragment key={post.id}>
                  <ThreadCard
                    post={post}
                    variant="feed"
                    onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
                    onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
                    onDelete={(id) => setDeletePostId(id)}
                    onReport={() => setReportPost(post)}
                  />

                  {showUnansweredWidget && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 my-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle size={16} className="text-brand-600" />
                          <h4 className="text-xs font-bold text-neutral-900">
                            Câu hỏi chưa có lời giải
                          </h4>
                        </div>
                        <Link
                          to="/knowledge?sort=unanswered"
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Xem tất cả
                        </Link>
                      </div>

                      <div className="space-y-2">
                        {unansweredQuestions.slice(0, 2).map((q) => (
                          <div
                            key={q.id}
                            onClick={() => navigate(`/knowledge/${q.id}`)}
                            className="p-3 rounded-md bg-white border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge tier="neutral" size="sm">
                                  {q.subject || 'CSD201'}
                                </Badge>
                                <span className="text-xs text-neutral-500">
                                  {formatRelativeTime(q.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-neutral-900 line-clamp-1">
                                {q.title || q.contentMd.split('\n')[0]}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="shrink-0">
                              Trả lời
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showCommunityActivity && (
                    <CommunityActivityCard activity={communityActivities[0]} />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* End of Feed message */}
        <div className="text-center py-6 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Bạn đã xem hết bài viết mới ·{' '}
            <Link to="/knowledge" className="text-brand-600 font-semibold hover:underline">
              Khám phá chủ đề khác
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop Right Column (≥1280px, width 300px sticky) */}
      <aside className="hidden xl:block w-[300px] shrink-0 sticky top-20 space-y-5">
        {/* C6.T.3 — Box 1: Không gian của bạn (MySpacesList) */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Không gian của bạn
            </h3>
            <Link to="/requests" className="text-xs font-medium text-brand-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-neutral-200">
            {spaces.slice(0, 5).map((sp) => (
              <EntityRow
                key={sp.id}
                dense
                href={sp.href}
                leading={
                  sp.logoUrl ? (
                    <img
                      src={sp.logoUrl}
                      alt={sp.name}
                      className="h-7 w-7 rounded-md object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-md bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center justify-center">
                      {getInitials(sp.name)}
                    </div>
                  )
                }
                title={sp.name}
                subtitle={sp.roleNote}
                trailing={
                  sp.unreadCount ? (
                    <span className="text-[11px] font-medium text-brand-600 tabular-nums">
                      {sp.unreadCount} mới
                    </span>
                  ) : sp.hasUpdate ? (
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                  ) : null
                }
              />
            ))}
          </div>
        </div>

        {/* Box 2: Môn học theo dõi */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Môn học theo dõi</h3>
            <Link to="/knowledge" className="text-xs font-medium text-brand-600 hover:underline">
              Thêm
            </Link>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(followingSubjectsQuery.data || ['CSD201', 'SWP391', 'PRJ301', 'DBI202']).map(
              (subj) => (
                <Link key={subj} to={`/knowledge?subject=${subj}`}>
                  <Badge
                    tier="neutral"
                    size="md"
                    className="hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors cursor-pointer"
                  >
                    #{subj}
                  </Badge>
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Box 3: Sắp diễn ra (UpcomingList) */}
        <UpcomingList
          title="Sắp diễn ra"
          viewAllHref="/events"
          items={[
            {
              id: 'opp_04',
              title: 'Seminar LLM & RAG SEP490',
              startAt: '2026-10-18T09:00:00Z',
              organizerName: 'F-Code Club',
              location: 'Hội trường Gamma',
              href: '/opportunities/opp_04',
            },
            {
              id: 'prog_01',
              title: 'Tủ Sách Cho Em — Ba Vì',
              startAt: '2026-10-25T06:30:00Z',
              organizerName: 'Tình nguyện',
              location: 'Ba Vì, Hà Nội',
              href: '/programs/prog_01',
            },
          ]}
        />

        {/* Mini Footer */}
        <div className="pt-1 px-1 text-xs text-neutral-500 space-x-2">
          <Link to="/help" className="hover:underline">
            Trợ giúp
          </Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">
            Điều khoản
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">
            Quyền riêng tư
          </Link>
          <span>·</span>
          <span>© SCS 2026</span>
        </div>
      </aside>

      {/* Shared Report Dialog */}
      {reportPost && (
        <ReportDialog
          open={!!reportPost}
          onOpenChange={(open) => !open && setReportPost(null)}
          targetType="post"
          targetId={reportPost.id}
          targetTitle={reportPost.title}
          targetAuthorName={reportPost.authorName}
          contentSnapshot={reportPost.contentMd}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        danger={true}
        confirmLabel="Xóa bài viết"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletePostId) deleteMutation.mutate(deletePostId);
        }}
      />
    </div>
  );
};

export default DashboardPage;
