import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { GreetingHeader } from '@/components/shared/GreetingHeader';
import { ActionSummaryBanner } from '@/components/shared/ActionSummaryBanner';
import { HighlightReel, type HighlightItem } from '@/components/shared/HighlightReel';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { CommunityActivityCard, type CommunityActivityItem } from '@/components/shared/CommunityActivityCard';
import { ReportPostDialog } from '@/features/knowledge/ReportPostDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Avatar } from '@/components/ui/Avatar';
import { Progress } from '@/components/ui/Progress';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/format';
import {
  Building2,
  UsersRound,
  Sparkles,
  HelpCircle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Plus,
  Compass,
  FileText,
  Repeat2,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';
import type { KnowledgePost } from '@/types/entities';
import type { ActionItem } from '@/components/shared/ActionStrip';

// Story items for joined clubs / groups only (C6 spec)
const highlightItems: HighlightItem[] = [
  { id: 'hl_1', label: 'F-Code Club', icon: Building2, isNew: true, href: '/clubs/club_01/workspace/overview' },
  { id: 'hl_2', label: 'Nhóm SWP391 Capstone', icon: UsersRound, isNew: true, href: '/groups/grp_01' },
  { id: 'hl_3', label: 'CLB Tiếng Anh (ESC)', icon: Building2, href: '/clubs/club_02/workspace/overview' },
];

const communityActivities: CommunityActivityItem[] = [
  {
    id: 'act_club_01',
    sourceType: 'club',
    sourceId: 'club_01',
    sourceName: 'F-Code Club',
    sourceLogoUrl: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=120&q=80',
    activityType: 'event',
    title: 'Workshop: Làm chủ AI Prompt Engineering & GitHub Copilot',
    summary: 'Diễn giả cựu sinh viên FPT Software chia sẻ kinh nghiệm ứng dụng AI Agent trong thực tế phát triển phần mềm.',
    timestamp: '2026-09-25T08:00:00Z',
    eventDetails: {
      date: 'Thứ Bảy, 27/09/2026 (09:00 - 11:30)',
      location: 'Hội trường Alpha, FPTU Hòa Lạc',
      rsvpCount: 42,
    },
    linkTo: '/clubs/club_01/workspace/events',
  },
  {
    id: 'act_grp_01',
    sourceType: 'group',
    sourceId: 'grp_01',
    sourceName: 'Nhóm SWP391 Capstone',
    activityType: 'milestone',
    title: 'Cột mốc Sprint 1: Hoàn thành thiết kế Kiến trúc & Database',
    summary: 'Nhóm đã hoàn thiện xong SRS và chuẩn bị nộp báo cáo Milestone 1 cho Mentor.',
    timestamp: '2026-09-24T17:00:00Z',
    linkTo: '/groups/grp_01',
  },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<KnowledgePost | null>(null);

  // User onboarding widget state (C6.1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]); // step 1 done

  // Action items query
  const actionItemsQuery = useQuery({
    queryKey: ['dashboard', 'action-items'],
    queryFn: async () => {
      const items: ActionItem[] = [
        { id: 'act_1', type: 'swap', title: 'Lời mời đổi lớp PRN231 cần xác nhận', count: 1, linkTo: '/swap/connections' },
        { id: 'act_2', type: 'group', title: 'Yêu cầu gia nhập nhóm SWP391', count: 1, linkTo: '/groups/me' },
        { id: 'act_3', type: 'club', title: 'Đơn ứng tuyển CLB JS Club có lịch phỏng vấn', count: 1, linkTo: '/applications' },
      ];
      return items;
    },
  });

  // Followed subjects query
  const followingSubjectsQuery = useQuery<string[]>({
    queryKey: ['subjects', 'following'],
    queryFn: () => apiClient.get('/subjects/following'),
  });

  // Posts Feed Query
  const feedQuery = useQuery<KnowledgePost[]>({
    queryKey: ['feed', feedTab],
    queryFn: async () => {
      const posts = await apiClient.get<KnowledgePost[]>('/posts');
      if (feedTab === 'following') {
        const followed = followingSubjectsQuery.data || ['CSD201', 'SWP391'];
        return posts.filter(
          (p) =>
            (p.subject && followed.includes(p.subject)) ||
            (p.subjectCode && followed.includes(p.subjectCode))
        );
      }
      return posts;
    },
  });

  // Optimistic like mutation
  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${id}/like`) : apiClient.delete(`/posts/${id}/like`),
  });

  // Optimistic save mutation
  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${id}/save`) : apiClient.delete(`/posts/${id}/save`),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setDeletePostId(null);
    },
  });

  const posts = feedQuery.data || [];

  // Questions needing answers (C6.1 widget)
  const unansweredQuestions = posts.filter(
    (p) => p.type === 'question' && !p.isSolved && p.commentCount <= 1
  );

  const handlePostCreated = (newPost: KnowledgePost) => {
    queryClient.setQueryData<KnowledgePost[]>(['feed', feedTab], (prev = []) => [
      newPost,
      ...prev,
    ]);
  };

  const isNewcomer = completedSteps.length < 3;

  return (
    <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8 items-start">
      {/* Main Single Column Feed (max-w-2xl) */}
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Lời chào — text thuần, không card */}
        <GreetingHeader fullName={user?.fullName} />

        {/* Story Tray (Highlight Reel) — Only joined clubs/groups */}
        <HighlightReel items={highlightItems} />

        {/* Action Summary Banner — 1 collapsed line */}
        <ActionSummaryBanner items={actionItemsQuery.data || []} />

        {/* Thread Composer (K1) — collapsible in-place */}
        <ThreadComposer onPosted={handlePostCreated} />

        {/* Feed Tab SegmentedControl */}
        <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-xs py-2 border-b border-neutral-100 flex items-center justify-between">
          <SegmentedControl
            options={[
              { value: 'for_you', label: 'Dành cho bạn' },
              { value: 'following', label: 'Đang theo dõi' },
            ]}
            value={feedTab}
            onValueChange={(val) => setFeedTab(val as any)}
            size="sm"
          />

          <Link
            to="/discover#chu-de"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
          >
            <Compass size={14} /> Khám phá môn học
          </Link>
        </div>

        {/* Newcomer Onboarding Checklist (C6.1) */}
        {isNewcomer && (
          <div className="bg-brand-50/70 border border-brand-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600" />
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Bắt đầu với SCS ({completedSteps.length}/3)
                </h4>
              </div>
              <span className="text-xs font-semibold text-brand-700">
                {Math.round((completedSteps.length / 3) * 100)}%
              </span>
            </div>
            <Progress value={(completedSteps.length / 3) * 100} className="h-1.5" />
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-800">
                  <CheckCircle2 size={15} className="text-tier-success-dot" /> Theo dõi các môn học kỳ này
                </span>
                <Link to="/discover#chu-de" className="text-brand-600 font-semibold hover:underline">
                  Chọn môn
                </Link>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-800">
                  <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" /> Đăng bài viết hoặc câu hỏi đầu tiên
                </span>
                <span className="text-neutral-400">Dùng ô soạn ở trên</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-neutral-800">
                  <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block" /> Khám phá và tham gia CLB / Nhóm học
                </span>
                <Link to="/discover" className="text-brand-600 font-semibold hover:underline">
                  Khám phá →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Feed Timeline */}
        <div className="space-y-1">
          {feedQuery.isLoading ? (
            /* Loading skeletons */
            <div className="space-y-6 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 py-4 border-b border-neutral-100 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-3.5 bg-neutral-100 rounded w-full" />
                    <div className="h-3.5 bg-neutral-100 rounded w-4/5" />
                    <div className="h-8 bg-neutral-50 rounded w-1/2 pt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-neutral-50 rounded-xl border border-neutral-200 p-6">
              <p className="text-sm text-neutral-600">
                {feedTab === 'following'
                  ? 'Chưa có thread nào trong các môn bạn đang theo dõi.'
                  : 'Bảng tin chưa có bài viết mới.'}
              </p>
              <Link to="/discover#chu-de">
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
                  {/* Highlighted of the day badge if 1st item */}
                  {index === 0 && feedTab === 'for_you' && (
                    <div className="flex items-center gap-1.5 pb-1 text-xs text-brand-700 font-semibold">
                      <Sparkles size={13} className="text-accent-600" />
                      <span>Nổi bật hôm nay</span>
                    </div>
                  )}

                  <ThreadCard
                    post={post}
                    variant="feed"
                    onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
                    onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
                    onDelete={(id) => setDeletePostId(id)}
                    onReport={(id) => setReportPostId(id)}
                    onEdit={(p) => setEditingPost(p)}
                  />

                  {/* Widget: Câu hỏi đang cần bạn (C6.1) */}
                  {showUnansweredWidget && (
                    <div className="bg-neutral-50/90 border border-neutral-200 rounded-xl p-4 my-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle size={16} className="text-brand-600" />
                          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                            Các bạn đang cần giúp · Câu hỏi chưa có trả lời
                          </h4>
                        </div>
                        <Link
                          to="/knowledge?sort=unanswered"
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Xem tất cả →
                        </Link>
                      </div>

                      <div className="space-y-2.5">
                        {unansweredQuestions.slice(0, 2).map((q) => (
                          <div
                            key={q.id}
                            onClick={() => navigate(`/knowledge/${q.id}`)}
                            className="p-2.5 rounded-lg bg-white border border-neutral-200/80 hover:border-brand-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Badge tier="neutral" size="sm" className="text-[10px]">
                                  {q.subject || 'CSD201'}
                                </Badge>
                                <span className="text-[11px] text-neutral-400">
                                  {formatRelativeTime(q.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-neutral-900 line-clamp-1">
                                {q.title || q.contentMd.split('\n')[0]}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="shrink-0 text-xs h-7">
                              Trả lời
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Community Activity Card (C6.1) */}
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
            Bạn đã xem hết thread mới ·{' '}
            <Link
              to="/discover#chu-de"
              className="text-brand-600 font-semibold hover:underline"
            >
              Khám phá chủ đề khác →
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop Side Column (≥1280px, width 300px sticky) */}
      <div className="hidden xl:block w-[300px] shrink-0 sticky top-20 space-y-6">
        {/* Box 1: Môn học bạn theo dõi */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Môn học theo dõi
            </h4>
            <Link
              to="/discover#chu-de"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Thêm →
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
              )
            )}
          </div>
        </div>

        {/* Box 2: Sắp diễn ra trong các CLB đã tham gia */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Sắp diễn ra
            </h4>
            <Link to="/clubs" className="text-xs text-neutral-400 hover:text-neutral-700">
              CLB của bạn
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex flex-col items-center justify-center shrink-0 border border-brand-100">
                <span className="text-[10px] uppercase font-bold">T7</span>
                <span className="text-sm font-bold leading-none">27</span>
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-semibold text-neutral-900 line-clamp-1">Workshop AI Prompting</h5>
                <p className="text-[11px] text-neutral-500">F-Code Club · 09:00</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex flex-col items-center justify-center shrink-0 border border-neutral-200">
                <span className="text-[10px] uppercase font-bold">CN</span>
                <span className="text-sm font-bold leading-none">28</span>
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-semibold text-neutral-900 line-clamp-1">English Speaking Club</h5>
                <p className="text-[11px] text-neutral-500">ESC FPTU · 14:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Footer */}
        <div className="pt-2 px-2 text-[11px] text-neutral-400 space-x-2">
          <Link to="/help" className="hover:underline">Trợ giúp</Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">Điều khoản</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">Quyền riêng tư</Link>
          <span>·</span>
          <span>© SCS 2026</span>
        </div>
      </div>

      {/* Report Post Dialog */}
      {reportPostId && (
        <ReportPostDialog
          open={!!reportPostId}
          onOpenChange={(open) => !open && setReportPostId(null)}
          postId={reportPostId}
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
