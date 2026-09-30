import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  SlidersHorizontal,
  X,
  Check,
  SearchX,
  HelpCircle,
  BookOpen,
  Briefcase,
  MessagesSquare,
  FileText,
  Zap,
  TrendingUp,
  FolderGit2,
  BadgeCheck,
  Lightbulb,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { KnowledgeListItem } from '@/components/shared/KnowledgeListItem';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LimitNotice } from '@/components/shared/LimitNotice';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';
import type { KnowledgePost } from '@/types/entities';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'knowledge', label: 'Chia sẻ kiến thức' },
  { value: 'study_experience', label: 'Kinh nghiệm học tập' },
  { value: 'internship', label: 'Kinh nghiệm thực tập' },
  { value: 'interview', label: 'Kinh nghiệm phỏng vấn' },
  { value: 'document', label: 'Tài liệu môn học' },
  { value: 'tips', label: 'Tips & Tricks' },
  { value: 'career', label: 'Career Sharing' },
  { value: 'project', label: 'Chia sẻ dự án' },
  { value: 'qa', label: 'Hỏi đáp' },
  { value: 'mentor_senior', label: 'Kinh nghiệm Mentor/Senior' },
];

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'Tất cả môn học' },
  { value: 'CSD201', label: 'CSD201 · Cấu trúc dữ liệu & Giải thuật' },
  { value: 'PRJ301', label: 'PRJ301 · Java Web Applications' },
  { value: 'SWP391', label: 'SWP391 · Software Project' },
  { value: 'DBI202', label: 'DBI202 · Database Systems' },
  { value: 'MAS291', label: 'MAS291 · Statistics & Probability' },
  { value: 'PRN231', label: 'PRN231 · .NET & Web API' },
];

const SORT_OPTIONS = [
  { value: 'new', label: 'Mới nhất' },
  { value: 'hot', label: 'Nổi bật' },
  { value: 'discussed', label: 'Nhiều thảo luận' },
  { value: 'unanswered', label: 'Chưa có trả lời' },
];

export const KnowledgeHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewer = useViewer();
  const canBrowse = viewer.can('knowledge.browse');
  const canCompose = viewer.can('compose');
  const guard = useGuardedAction();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'discover';
  const myPostsSubTab = searchParams.get('subTab') || 'published';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSubject = searchParams.get('subject') || 'all';
  const sort = searchParams.get('sort') || 'new';
  const searchQuery = searchParams.get('q') || '';
  const hasFile = searchParams.get('hasFile') === 'true';

  const [composerOpen, setComposerOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [reportPost, setReportPost] = useState<KnowledgePost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // 1. Fetch Followed Subjects
  const { data: followedSubjectsRes } = useQuery<{ data: string[] } | string[]>({
    queryKey: ['subjects', 'following'],
    queryFn: () => apiClient.get('/subjects/following'),
    enabled: canBrowse,
  });
  const followedSubjects: string[] = Array.isArray(followedSubjectsRes)
    ? followedSubjectsRes
    : (followedSubjectsRes as any)?.data || ['CSD201', 'SWP391'];

  // 2. Fetch Unanswered Questions for Sidebar (Chưa có trả lời)
  const { data: unansweredRes } = useQuery<{ data: KnowledgePost[] } | KnowledgePost[]>({
    queryKey: ['knowledge', 'unanswered-sidebar'],
    queryFn: () =>
      apiClient.get('/posts', {
        params: { sort: 'unanswered', type: 'question' },
      }),
    enabled: canBrowse,
  });
  const unansweredQuestions: KnowledgePost[] = Array.isArray(unansweredRes)
    ? unansweredRes.slice(0, 4)
    : (unansweredRes as any)?.data?.slice(0, 4) || [];

  // 3. Fetch Posts based on Mode (Guest preview vs Member tab)
  const { data: postsRes, isLoading } = useQuery<{ data: KnowledgePost[]; meta?: { total: number; limited?: boolean } } | KnowledgePost[]>({
    queryKey: [
      'knowledge',
      'posts',
      { canBrowse, activeTab, myPostsSubTab, selectedCategory, selectedSubject, sort, searchQuery, hasFile },
    ],
    queryFn: () => {
      if (!canBrowse) {
        return apiClient.get('/public/posts/preview');
      }

      if (activeTab === 'mine') {
        if (myPostsSubTab === 'saved') {
          return apiClient.get('/posts/saved');
        }
        return apiClient.get('/posts/me', {
          params: {
            status:
              myPostsSubTab === 'pending'
                ? 'PendingReview'
                : myPostsSubTab === 'rejected'
                ? 'Rejected'
                : 'Published',
          },
        });
      }

      return apiClient.get('/posts', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          sort,
          q: searchQuery || undefined,
          tab: activeTab,
        },
      });
    },
  });

  // Extract array safely
  const rawPosts: KnowledgePost[] = Array.isArray(postsRes)
    ? postsRes
    : (postsRes as any)?.data || [];
  const displayedPosts = canBrowse ? rawPosts : rawPosts.slice(0, 3);
  const totalCount = (postsRes as any)?.meta?.total ?? rawPosts.length;

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${id}/like`) : apiClient.delete(`/posts/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${id}/save`) : apiClient.delete(`/posts/${id}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
    },
  });

  const followSubjectMutation = useMutation({
    mutationFn: ({ code, follow }: { code: string; follow: boolean }) =>
      follow ? apiClient.post(`/subjects/${code}/follow`) : apiClient.delete(`/subjects/${code}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', 'following'] });
      toast({ title: 'Đã cập nhật theo dõi môn học' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ title: 'Đã xóa bài viết thành công' });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
      setDeletePostId(null);
    },
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const handleTabChange = (tab: string) => {
    if (!canBrowse && tab !== 'discover') {
      guard('auth', () => {})();
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab !== 'mine') next.delete('subTab');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (activeTab) next.set('tab', activeTab);
    setSearchParams(next);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSubject !== 'all' ||
    searchQuery.trim().length > 0 ||
    sort !== 'new' ||
    hasFile;

  return (
    <div className={canBrowse ? 'max-w-[1080px] mx-auto space-y-6' : 'max-w-[720px] mx-auto space-y-6'}>
      {/* 1. Page Header: Title + Subtitle + Write Post Button (when canCompose) */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Knowledge Sharing
          </h1>
          {!canBrowse && (
            <p className="text-sm text-neutral-500">
              Bạn đang xem 3 bài chọn lọc trong tuần.
            </p>
          )}
        </div>
        {canCompose && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setComposerOpen(true)}
            className="h-9 px-4"
          >
            Viết bài
          </Button>
        )}
      </div>

      {/* 2. Three Underline Tabs (hidden for Guest per K7 & GU5.2) */}
      {canBrowse && (
        <div className="border-b border-neutral-200">
          <div className="flex items-center gap-8 -mb-px">
            {[
              { key: 'discover', label: 'Khám phá' },
              { key: 'following', label: 'Đang theo dõi' },
              { key: 'mine', label: 'Của tôi' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-neutral-900 text-neutral-900 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tabs if activeTab === 'mine' */}
      {canBrowse && activeTab === 'mine' && (
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg w-fit text-xs font-semibold">
          {[
            { key: 'published', label: 'Đã đăng' },
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'rejected', label: 'Bị từ chối' },
            { key: 'saved', label: 'Đã lưu' },
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setParam('subTab', st.key)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                myPostsSubTab === st.key
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. 1-Row Toolbar (height 40px) — hidden for Guest per K7 & GU5.2 */}
      {canBrowse && (
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Tìm bài viết, môn học, tag..."
              value={searchQuery}
              onChange={(e) => setParam('q', e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Category Select */}
          <div className="w-48 shrink-0">
            <Select
              options={CATEGORY_OPTIONS}
              value={selectedCategory}
              onValueChange={(val) => setParam('category', val)}
            />
          </div>

          {/* Subject Select */}
          <div className="w-44 shrink-0">
            <Select
              options={SUBJECT_OPTIONS}
              value={selectedSubject}
              onValueChange={(val) => setParam('subject', val)}
            />
          </div>

          {/* Sort Select */}
          <div className="w-36 shrink-0">
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onValueChange={(val) => setParam('sort', val)}
            />
          </div>

          {/* Extra Filters Popover Button */}
          <button
            type="button"
            onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
            className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-colors cursor-pointer relative ${
              hasFile
                ? 'border-brand-500 text-brand-600 bg-brand-50'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
            aria-label="Thêm bộ lọc"
          >
            <SlidersHorizontal size={16} />
            {hasFile && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-600" />
            )}
          </button>
        </div>
      )}

      {/* Extra Filters Popover Drawer / Dropdown */}
      {canBrowse && filterPopoverOpen && (
        <div className="p-4 bg-white rounded-lg border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-700">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFile}
                onChange={(e) => setParam('hasFile', e.target.checked ? 'true' : null)}
                className="rounded border-neutral-300 text-brand-600"
              />
              <span>Chỉ hiện bài có tệp đính kèm</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => setFilterPopoverOpen(false)}
            className="text-xs text-neutral-500 hover:text-neutral-900 font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Active Filter Chips Row */}
      {canBrowse && hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800">
              Từ khóa: "{searchQuery}"
              <button
                type="button"
                onClick={() => setParam('q', null)}
                className="hover:text-neutral-900 ml-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800">
              {CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label}
              <button
                type="button"
                onClick={() => setParam('category', null)}
                className="hover:text-neutral-900 ml-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedSubject !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800">
              Môn: {selectedSubject}
              <button
                type="button"
                onClick={() => setParam('subject', null)}
                className="hover:text-neutral-900 ml-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {hasFile && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800">
              Có tệp đính kèm
              <button
                type="button"
                onClick={() => setParam('hasFile', null)}
                className="hover:text-neutral-900 ml-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-neutral-500 hover:text-neutral-900 underline text-xs cursor-pointer ml-1"
          >
            Xóa lọc
          </button>
        </div>
      )}

      {/* 4. Main Layout (2-Column when canBrowse, 1-Column when Guest) */}
      <div className={canBrowse ? 'grid grid-cols-1 xl:grid-cols-12 gap-8 items-start' : 'space-y-6'}>
        {/* Main Post List Column */}
        <div className={canBrowse ? 'xl:col-span-8 space-y-4' : 'space-y-6'}>
          {isLoading ? (
            <LoadingSkeleton count={canBrowse ? 6 : 3} />
          ) : displayedPosts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <SearchX size={32} className="mx-auto text-neutral-300" />
              <p className="text-sm font-medium text-neutral-700">
                {searchQuery
                  ? `Không có bài nào khớp với từ khóa "${searchQuery}"`
                  : 'Chưa có bài viết nào trong mục này.'}
              </p>
              {canCompose && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComposerOpen(true)}
                  >
                    Đặt câu hỏi cho chủ đề này
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {displayedPosts.map((post) => (
                <KnowledgeListItem
                  key={post.id}
                  post={post}
                  showBookmark={canBrowse}
                  onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
                  onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
                />
              ))}
            </div>
          )}

          {!canBrowse && (
            <LimitNotice
              remaining={Math.max(12, totalCount - 3)}
              noun="bài viết"
            />
          )}
        </div>

        {/* 5. Sticky Sidebar Column (280px / 4 cols) — shown when canBrowse */}
        {canBrowse && (
          <aside className="hidden xl:block xl:col-span-4 space-y-8 sticky top-20">
            {/* Mục 1: Môn bạn theo dõi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Môn bạn theo dõi
                </h3>
                <button
                  type="button"
                  onClick={() => setFollowModalOpen(true)}
                  className="text-xs text-brand-600 hover:underline cursor-pointer font-medium"
                >
                  + Theo dõi môn khác
                </button>
              </div>

              {followedSubjects.length === 0 ? (
                <div className="text-xs text-neutral-500 space-y-2">
                  <p>Theo dõi môn học để lọc nhanh bài viết.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['CSD201', 'SWP391', 'PRJ301', 'DBI202'].map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => followSubjectMutation.mutate({ code: subj, follow: true })}
                        className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold cursor-pointer"
                      >
                        + {subj}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {followedSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setParam('subject', selectedSubject === subj ? null : subj)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedSubject === subj
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mục 2: Chưa có trả lời (3-5 câu hỏi qa chưa có trả lời) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Chưa có trả lời
                </h3>
                <button
                  type="button"
                  onClick={() => setParam('sort', 'unanswered')}
                  className="text-xs text-brand-600 hover:underline cursor-pointer font-medium"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {unansweredQuestions.length === 0 ? (
                  <p className="text-neutral-500">Tất cả câu hỏi đều đã được phản hồi.</p>
                ) : (
                  unansweredQuestions.map((q) => {
                    const qTitle =
                      q.title || q.contentMd.split('\n')[0] || 'Câu hỏi học tập';
                    return (
                      <Link
                        key={q.id}
                        to={`/knowledge/${q.id}`}
                        className="block text-neutral-700 hover:text-brand-600 truncate transition-colors"
                      >
                        · {qTitle}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Composer Dialog (Viết bài mới) */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">
              Viết bài mới
            </h2>
          </div>
          <div className="p-4">
            <ThreadComposer
              variant="sheet"
              onPosted={() => {
                setComposerOpen(false);
                queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
                toast({ title: 'Đã đăng bài viết thành công' });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow Subjects Modal */}
      <Dialog open={followModalOpen} onOpenChange={setFollowModalOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg">Theo dõi môn học</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-neutral-600">
            Chọn các môn học bạn quan tâm để lọc nhanh bài viết và nhận thông báo khi có thảo luận mới.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {['CSD201', 'PRJ301', 'SWP391', 'DBI202', 'MAS291', 'PRN231', 'LAB211', 'MAD101'].map((subj) => {
              const isFollowing = followedSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() =>
                    followSubjectMutation.mutate({ code: subj, follow: !isFollowing })
                  }
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isFollowing
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span>{subj}</span>
                  {isFollowing && <Check size={14} />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setFollowModalOpen(false)}>
              Hoàn tất
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      {reportPost && (
        <ReportDialog
          open={!!reportPost}
          onOpenChange={(open) => !open && setReportPost(null)}
          targetType="post"
          targetId={reportPost.id}
          targetTitle={reportPost.title || reportPost.contentMd.split('\n')[0]}
          targetAuthorName={reportPost.authorName || 'Sinh viên'}
          contentSnapshot={reportPost.contentMd?.slice(0, 100)}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deletePostId && (
        <ConfirmDialog
          open={!!deletePostId}
          onOpenChange={(open) => !open && setDeletePostId(null)}
          title="Xóa bài viết?"
          description="Hành động này không thể hoàn tác. Bài viết và toàn bộ bình luận sẽ bị gỡ bỏ."
          confirmLabel="Xóa bài viết"
          danger
          onConfirm={() => deleteMutation.mutate(deletePostId)}
        />
      )}
    </div>
  );
};

export default KnowledgeHubPage;
