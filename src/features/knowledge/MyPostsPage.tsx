import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ThreadComposer } from '@/components/shared/ThreadComposer';
import { ThreadFeed } from '@/components/shared/ThreadFeed';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { Plus, BookOpen, Bookmark } from 'lucide-react';
import type { KnowledgePost } from '@/types/entities';

type TabStatus = 'published' | 'pending' | 'rejected' | 'saved';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabStatus>('published');
  const [editingPost, setEditingPost] = useState<KnowledgePost | null>(null);
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

      {/* ThreadFeed (K-U.2) */}
      <ThreadFeed
        posts={displayedPosts}
        isLoading={isLoading}
        skeletonCount={3}
        paging="pages"
        pageSize={20}
        onEditPost={(p) => setEditingPost(p)}
        emptyIcon={activeTab === 'saved' ? Bookmark : BookOpen}
        emptyTitle={
          activeTab === 'saved'
            ? 'Bạn chưa lưu bài viết nào.'
            : activeTab === 'pending'
              ? 'Không có bài viết nào đang chờ duyệt.'
              : activeTab === 'rejected'
                ? 'Không có bài viết nào bị từ chối.'
                : 'Bạn chưa đăng bài viết nào.'
        }
        emptyDescription={
          activeTab === 'saved'
            ? 'Bấm biểu tượng lưu trên bất kỳ thread nào để xem lại tại đây.'
            : undefined
        }
        emptyAction={
          activeTab === 'saved' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Khám phá bảng tin
            </Button>
          ) : activeTab === 'published' ? (
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              Đăng thread ngay
            </Button>
          ) : undefined
        }
      />

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
    </div>
  );
}
