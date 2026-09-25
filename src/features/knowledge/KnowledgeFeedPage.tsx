import React, { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { ReportPostDialog } from './ReportPostDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import type { KnowledgePost, PostType } from '@/types/entities';

const SUBJECT_NAMES: Record<string, string> = {
  CSD201: 'Cấu trúc dữ liệu & Giải thuật',
  PRJ301: 'Java Web Application',
  SWP391: 'Dự án Phát triển Phần mềm',
  DBI202: 'Hệ Quản trị Cơ sở dữ liệu',
  MAS291: 'Xác suất & Thống kê',
  PRN231: 'Lập trình .NET & Web API',
};

export default function KnowledgeFeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subject = searchParams.get('subject') || '';
  const tag = searchParams.get('tag') || '';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'hot';
  const type = searchParams.get('type') || 'all';

  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);

  // If no subject, tag, or q is specified, redirect to Home Feed (C6) per spec
  if (!subject && !tag && !q && sort !== 'unanswered') {
    return <Navigate to="/" replace />;
  }

  const subjectTitle = subject
    ? `${subject} · ${SUBJECT_NAMES[subject] || 'Chủ đề học tập'}`
    : tag
    ? `#${tag}`
    : q
    ? `Tìm kiếm: "${q}"`
    : 'Câu hỏi chưa có trả lời';

  const postsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'topic', { subject, tag, q, sort, type }],
    queryFn: () =>
      apiClient.get('/posts', {
        params: {
          subject: subject || undefined,
          tag: tag || undefined,
          q: q || undefined,
          sort: sort || undefined,
          type: type !== 'all' ? type : undefined,
        },
      }),
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
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'topic'] });
      setDeletePostId(null);
    },
  });

  const handleFollowToggle = async () => {
    if (!subject) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (nextState) {
      await apiClient.post(`/subjects/${subject}/follow`);
      toast({ variant: 'success', title: `Đang theo dõi môn ${subject}` });
    } else {
      await apiClient.delete(`/subjects/${subject}/follow`);
      toast({ variant: 'default', title: `Đã bỏ theo dõi môn ${subject}` });
    }
  };

  const setSort = (val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', val);
    setSearchParams(next);
  };

  const setTypeFilter = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'all') next.delete('type');
    else next.set('type', val);
    setSearchParams(next);
  };

  const posts = postsQuery.data || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* ContextHeader */}
      <ContextHeader
        backHref="/"
        title={subjectTitle}
        actions={
          subject ? (
            <Button
              size="sm"
              variant={isFollowing ? 'outline' : 'primary'}
              onClick={handleFollowToggle}
              className="text-xs h-8"
            >
              {isFollowing ? 'Đang theo dõi' : 'Theo dõi môn'}
            </Button>
          ) : undefined
        }
      />

      {/* Meta Stats line */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <span>{posts.length} thread · 34 người theo dõi</span>
      </div>

      {/* Sort SegmentedControl */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2">
        <SegmentedControl
          options={[
            { value: 'hot', label: 'Nổi bật' },
            { value: 'new', label: 'Mới nhất' },
            { value: 'unanswered', label: 'Chưa có trả lời' },
          ]}
          value={sort}
          onValueChange={setSort}
          size="sm"
        />
      </div>

      {/* Type Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'discussion', label: 'Chia sẻ' },
          { value: 'question', label: 'Hỏi đáp' },
          { value: 'document', label: 'Tài liệu' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTypeFilter(t.value)}
            className={cn(
              'px-3 py-1 rounded-full border transition-all cursor-pointer font-medium',
              type === t.value
                ? 'bg-brand-50 text-brand-700 border-brand-300'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Thread Composer with prefilled subject */}
      <ThreadComposer
        defaultSubject={subject || 'General'}
        onPosted={(newPost) => {
          queryClient.setQueryData<KnowledgePost[]>(
            ['knowledge', 'topic', { subject, tag, q, sort, type }],
            (prev = []) => [newPost, ...prev]
          );
        }}
      />

      {/* Thread list */}
      <div className="space-y-1">
        {postsQuery.isLoading ? (
          <div className="space-y-4 pt-2">
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
          <div className="text-center py-12 text-neutral-400 bg-neutral-50 rounded-xl border border-neutral-200 p-6 space-y-2">
            <p className="text-sm font-medium text-neutral-700">Chưa có bài viết nào trong chủ đề này.</p>
            <p className="text-xs text-neutral-500">Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ tài liệu!</p>
          </div>
        ) : (
          posts.map((post) => (
            <ThreadCard
              key={post.id}
              post={post}
              variant="feed"
              onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
              onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
              onDelete={(id) => setDeletePostId(id)}
              onReport={(id) => setReportPostId(id)}
            />
          ))
        )}
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
}
