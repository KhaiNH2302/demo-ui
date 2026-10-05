import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, SearchX, type LucideIcon } from 'lucide-react';
import { ThreadCard } from './ThreadCard';
import { ReportDialog } from './ReportDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import type { KnowledgePost } from '@/types/entities';

export interface ThreadFeedProps {
  posts: KnowledgePost[];
  isLoading?: boolean;
  skeletonCount?: number;
  density?: 'default' | 'compact';
  paging?: 'pages' | 'infinite' | 'none';
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  newPostsCount?: number;
  onLoadNewPosts?: () => void;
  /**
   * Điểm chèn chung (03-knowledge.md § K-U.2):
   * ThreadFeed không biết thứ được chèn là gì (có thể là khối FE-02 ở K0 hoặc FeedInsert ở Trang chủ).
   */
  renderInsert?: (afterIndex: number) => React.ReactNode | null;
  onEditPost?: (post: KnowledgePost) => void;
  onLikeToggle?: (postId: string, liked: boolean) => void;
  onSaveToggle?: (postId: string, saved: boolean) => void;
  onPostDeleted?: (postId: string) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  footerSlot?: React.ReactNode;
  className?: string;
}

/**
 * ThreadFeed (FE-02) — Lõi bảng tin bài viết dùng chung cho:
 * - C6 Trang chủ (DashboardPage)
 * - K0 Knowledge Sharing (KnowledgeHubPage)
 * - K5 Bài viết của tôi (MyPostsPage)
 * - C7/C8 Hồ sơ (tab Bài viết)
 * - K7/C12 Màn cho khách (KnowledgeHubPage guest mode)
 */
export const ThreadFeed: React.FC<ThreadFeedProps> = ({
  posts,
  isLoading = false,
  skeletonCount = 5,
  density = 'default',
  paging = 'none',
  page = 1,
  pageSize = 20,
  total,
  onPageChange,
  newPostsCount = 0,
  onLoadNewPosts,
  renderInsert,
  onEditPost,
  onLikeToggle,
  onSaveToggle,
  onPostDeleted,
  emptyIcon: EmptyIcon = SearchX,
  emptyTitle = 'Chưa có bài viết nào trong mục này.',
  emptyDescription,
  emptyAction,
  footerSlot,
  className,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [internalPage, setInternalPage] = useState<number>(1);
  const currentPage = onPageChange ? page : internalPage;
  const handlePageChange = (nextPage: number) => {
    if (onPageChange) {
      onPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  const [reportPost, setReportPost] = useState<KnowledgePost | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const defaultLikeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${id}/like`) : apiClient.delete(`/posts/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const defaultSaveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${id}/save`) : apiClient.delete(`/posts/${id}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: (_, deletedId) => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      setDeletePostId(null);
      onPostDeleted?.(deletedId);
    },
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <LoadingSkeleton
          variant={density === 'compact' ? 'row-list' : 'thread-list'}
          count={skeletonCount}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={cn('py-12 text-center space-y-2.5', className)}>
        <EmptyIcon size={32} className="mx-auto text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-xs text-neutral-500 max-w-md mx-auto">{emptyDescription}</p>
        )}
        {emptyAction && <div className="pt-2">{emptyAction}</div>}
      </div>
    );
  }

  const totalItems = total ?? posts.length;
  const paginatedPosts =
    paging === 'pages' && !onPageChange
      ? posts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : posts;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Viên "↑ n bài mới" (03-knowledge.md § K-U.2) */}
      {newPostsCount > 0 && onLoadNewPosts && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={onLoadNewPosts}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>{newPostsCount} bài mới</span>
          </button>
        </div>
      )}

      {/* Danh sách ThreadCard + điểm chèn renderInsert */}
      <div>
        {paginatedPosts.map((post, index) => {
          const isReported = reportedIds.includes(post.id);
          const insertedNode = renderInsert ? renderInsert(index) : null;

          return (
            <React.Fragment key={post.id}>
              {isReported ? (
                <div className="py-3 px-4 my-1 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                  <span>Bạn đã báo cáo nội dung này và tạm ẩn khỏi bảng tin.</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReportedIds((prev) => prev.filter((rid) => rid !== post.id))
                    }
                    className="font-semibold text-brand-600 hover:underline cursor-pointer"
                  >
                    Hoàn tác
                  </button>
                </div>
              ) : (
                <ThreadCard
                  post={post}
                  variant="feed"
                  density={density}
                  onEdit={onEditPost}
                  onLikeToggle={(id, liked) => {
                    if (onLikeToggle) onLikeToggle(id, liked);
                    else defaultLikeMutation.mutate({ id, liked });
                  }}
                  onSaveToggle={(id, saved) => {
                    if (onSaveToggle) onSaveToggle(id, saved);
                    else defaultSaveMutation.mutate({ id, saved });
                  }}
                  onDelete={(id) => setDeletePostId(id)}
                  onReport={() => setReportPost(post)}
                />
              )}

              {insertedNode}
            </React.Fragment>
          );
        })}
      </div>

      {/* Phân trang số 20/trang (K0) */}
      {paging === 'pages' && totalItems > pageSize && (
        <div className="pt-4">
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
          />
        </div>
      )}

      {footerSlot}

      {/* ReportDialog dùng chung */}
      {reportPost && (
        <ReportDialog
          open={!!reportPost}
          onOpenChange={(open) => !open && setReportPost(null)}
          targetType="post"
          targetId={reportPost.id}
          targetTitle={reportPost.title || reportPost.contentMd?.split('\n')[0]}
          targetAuthorName={reportPost.authorName || 'Sinh viên'}
          contentSnapshot={reportPost.contentMd?.slice(0, 120)}
          onReported={(id) => {
            setReportedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
          }}
        />
      )}

      {/* ConfirmDialog xóa bài */}
      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        danger
        confirmLabel="Xóa bài viết"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletePostId) deleteMutation.mutate(deletePostId);
        }}
      />
    </div>
  );
};

export default ThreadFeed;
