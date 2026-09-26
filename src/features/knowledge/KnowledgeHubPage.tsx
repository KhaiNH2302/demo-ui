import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Flame,
  Search,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Award,
  Filter,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { ReportPostDialog } from './ReportPostDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/ui/Toast';
import type { KnowledgePost } from '@/types/entities';
import type { PostCategory } from '@/types/status';

export const KnowledgeHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'discover';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedSubject = searchParams.get('subject') || 'all';
  const sort = searchParams.get('sort') || 'hot';

  const [composerOpen, setComposerOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả danh mục', count: 128 },
    { key: 'knowledge', label: 'Chia sẻ kiến thức', count: 42 },
    { key: 'study_experience', label: 'Kinh nghiệm học tập', count: 28 },
    { key: 'internship', label: 'Thực tập & OJT', count: 19 },
    { key: 'interview', label: 'Phỏng vấn tuyển dụng', count: 15 },
    { key: 'document', label: 'Tài liệu môn học', count: 35 },
    { key: 'tips', label: 'Tips & Tricks', count: 22 },
    { key: 'career', label: 'Career & Hướng nghiệp', count: 14 },
    { key: 'project', label: 'Dự án sinh viên', count: 18 },
    { key: 'qa', label: 'Hỏi đáp bài tập', count: 31 },
    { key: 'mentor_senior', label: 'Kinh nghiệm từ Mentor/Senior', count: 16 },
  ];

  const subjects = ['all', 'CSD201', 'PRJ301', 'SWP391', 'DBI202', 'MAS291', 'PRN231'];

  // Query Posts
  const { data: posts, isLoading } = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'posts', { activeTab, selectedCategory, selectedSubject, sort }],
    queryFn: () =>
      apiClient.get('/posts', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          sort,
          tab: activeTab,
        },
      }),
  });

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ title: 'Đã xóa bài viết thành công' });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
      setDeletePostId(null);
    },
  });

  const setTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  const setCategory = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', cat);
    setSearchParams(newParams);
  };

  const setSubject = (sub: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subject', sub);
    setSearchParams(newParams);
  };

  const setSort = (s: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', s);
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={BookOpen}
        title="Knowledge Sharing"
        description="Diễn đàn chia sẻ kiến thức, kinh nghiệm học tập, tài liệu và hỏi đáp bài tập trong trường"
        actions={
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} />
            <span>Viết bài mới</span>
          </button>
        }
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setTab} className="w-full space-y-6">
        <TabsList className="bg-neutral-100 p-1 rounded-xl">
          <TabsTrigger value="discover" className="rounded-lg text-xs font-semibold">
            Khám phá
          </TabsTrigger>
          <TabsTrigger value="following" className="rounded-lg text-xs font-semibold">
            Đang theo dõi
          </TabsTrigger>
          <TabsTrigger value="mine" className="rounded-lg text-xs font-semibold">
            Bài viết của tôi
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-lg text-xs font-semibold">
            Đã lưu
          </TabsTrigger>
        </TabsList>

        {/* 10 Category Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all shadow-2xs ${
                selectedCategory === cat.key
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:border-brand-200 hover:bg-brand-50/50'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center (2/3): Composer + Filter + Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Thread Composer */}
            <ThreadComposer
              onPosted={() => {
                queryClient.invalidateQueries({ queryKey: ['knowledge', 'posts'] });
                setComposerOpen(false);
              }}
            />

            {/* Filter & Sort Bar */}
            <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs font-medium text-neutral-400 mr-1">Môn học:</span>
                {subjects.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSubject === s
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {s === 'all' ? 'Tất cả' : s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setSort('hot')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    sort === 'hot' ? 'bg-white text-brand-700 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Nổi bật
                </button>
                <button
                  type="button"
                  onClick={() => setSort('new')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    sort === 'new' ? 'bg-white text-brand-700 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => setSort('unanswered')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    sort === 'unanswered' ? 'bg-white text-brand-700 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  Chưa trả lời
                </button>
              </div>
            </div>

            {/* Thread Posts List */}
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : !posts || posts.length === 0 ? (
              <EmptyState
                title="Chưa có bài viết nào"
                description="Hãy là người đầu tiên chia sẻ kiến thức hoặc đặt câu hỏi cho chủ đề này nhé!"
              />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <ThreadCard
                    key={post.id}
                    post={post}
                    onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
                    onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
                    onReport={(id) => setReportPostId(id)}
                    onDelete={(id) => setDeletePostId(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column (1/3): Sidebar Widgets */}
          <div className="space-y-5">
            {/* 1. Category Directory Widget */}
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-600" />
                <span>Danh mục chuyên đề</span>
              </h3>
              <div className="space-y-1 text-xs">
                {categories.slice(1).map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      selectedCategory === cat.key
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[11px] text-neutral-400 font-normal">{cat.count} bài</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Top Active Authors */}
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                <span>Tác giả tích cực tuần này</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">
                    TB
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-neutral-900 block truncate">Trần Quốc Bảo</span>
                    <span className="text-[11px] text-neutral-400">14 bài viết • 120 lời cảm ơn</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                    LH
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-neutral-900 block truncate">Lê Hoàng Minh</span>
                    <span className="text-[11px] text-neutral-400">9 bài viết • 85 lời cảm ơn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Dialogs */}
      {reportPostId && (
        <ReportPostDialog
          open={!!reportPostId}
          onOpenChange={(open) => !open && setReportPostId(null)}
          postId={reportPostId}
        />
      )}

      {deletePostId && (
        <ConfirmDialog
          open={!!deletePostId}
          onOpenChange={(open) => !open && setDeletePostId(null)}
          title="Xóa bài viết?"
          description="Hành động này không thể hoàn tác. Tất cả các câu trả lời và thảo luận trong bài viết này cũng sẽ bị gỡ bỏ."
          confirmLabel="Xóa bài viết"
          variant="destructive"
          onConfirm={() => deleteMutation.mutate(deletePostId)}
        />
      )}
    </div>
  );
};

export default KnowledgeHubPage;
