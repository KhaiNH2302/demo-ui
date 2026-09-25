import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { ReportPostDialog } from './ReportPostDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { Plus, BookOpen, Bookmark } from 'lucide-react';
import type { KnowledgePost } from '@/types/entities';

type TabStatus = 'published' | 'pending' | 'rejected' | 'saved';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabStatus>('published');
  const [editingPost, setEditingPost] = useState<KnowledgePost | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);

  // My posts query
  const myPostsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'me'],
    queryFn: () => apiClient.get('/posts/me'),
  });

  // Saved posts query
  const savedPostsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'saved'],
    queryFn: () => apiClient.get('/posts/saved'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      setDeletePostId(null);
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${id}/like`) : apiClient.delete(`/posts/${id}/like`),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${id}/save`) : apiClient.delete(`/posts/${id}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'saved'] });
    },
  });

  const allMyPosts = myPostsQuery.data || [];
  const savedPosts = savedPostsQuery.data || [];

  const publishedPosts = allMyPosts.filter(
    (p) => p.status === 'Published' || p.status === 'published' || p.status === 'Closed' || p.status === 'closed'
  );
  const pendingPosts = allMyPosts.filter(
    (p) => p.status === 'PendingReview' || p.status === 'pending_review'
  );
  const rejectedPosts = allMyPosts.filter(
    (p) => p.status === 'Rejected' || p.status === 'rejected'
  );

  let displayedPosts: KnowledgePost[] = [];
  if (activeTab === 'published') displayedPosts = publishedPosts;
  else if (activeTab === 'pending') displayedPosts = pendingPosts;
  else if (activeTab === 'rejected') displayedPosts = rejectedPosts;
  else if (activeTab === 'saved') displayedPosts = savedPosts;

  const isLoading = myPostsQuery.isLoading || savedPostsQuery.isLoading;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Bài viết của tôi"
        description="Quản lý các thread kiến thức, tài liệu bạn đã đăng và bài viết đã lưu"
        backHref="/me"
        actions={
          <Button size="sm" onClick={() => setShowCreateDialog(true)} leftIcon={<Plus size={16} />}>
            Đăng thread mới
          </Button>
        }
      />

      {/* SegmentedControl Tabs */}
      <SegmentedControl
        options={[
          { value: 'published', label: `Đã đăng (${publishedPosts.length})` },
          { value: 'pending', label: `Chờ duyệt (${pendingPosts.length})` },
          { value: 'rejected', label: `Bị từ chối (${rejectedPosts.length})` },
          { value: 'saved', label: `Đã lưu (${savedPosts.length})` },
        ]}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabStatus)}
        size="md"
        fullWidth
      />

      {/* Thread list */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-4 border-b border-neutral-100 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-neutral-200 rounded w-1/3" />
                  <div className="h-3.5 bg-neutral-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 p-6 space-y-3">
            {activeTab === 'saved' ? (
              <>
                <Bookmark size={32} className="mx-auto text-neutral-400" />
                <p className="text-sm font-medium text-neutral-700">Bạn chưa lưu bài viết nào.</p>
                <p className="text-xs text-neutral-500">
                  Bấm biểu tượng lưu trên bất kỳ thread nào để xem lại tại đây.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  Khám phá bảng tin
                </Button>
              </>
            ) : (
              <>
                <BookOpen size={32} className="mx-auto text-neutral-400" />
                <p className="text-sm font-medium text-neutral-700">
                  {activeTab === 'pending'
                    ? 'Không có bài viết nào đang chờ duyệt.'
                    : activeTab === 'rejected'
                    ? 'Không có bài viết nào bị từ chối.'
                    : 'Bạn chưa đăng bài viết nào.'}
                </p>
                {activeTab === 'published' && (
                  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                    Đăng thread ngay
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          displayedPosts.map((post) => (
            <ThreadCard
              key={post.id}
              post={post}
              variant="feed"
              onLikeToggle={(id, liked) => likeMutation.mutate({ id, liked })}
              onSaveToggle={(id, saved) => saveMutation.mutate({ id, saved })}
              onDelete={(id) => setDeletePostId(id)}
              onEdit={(p) => setEditingPost(p)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Đăng thread mới</DialogTitle>
          </DialogHeader>
          <ThreadComposer
            variant="sheet"
            onPosted={() => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ['knowledge'] });
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
            </DialogHeader>
            <ThreadComposer
              post={editingPost}
              variant="sheet"
              onPosted={() => {
                setEditingPost(null);
                queryClient.invalidateQueries({ queryKey: ['knowledge'] });
              }}
              onCancel={() => setEditingPost(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Dữ liệu và các thảo luận liên quan sẽ bị xóa vĩnh viễn."
        danger={true}
        confirmLabel="Xóa vĩnh viễn"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletePostId) deleteMutation.mutate(deletePostId);
        }}
      />
    </div>
  );
}
