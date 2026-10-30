import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ThreadFeed } from '@/components/shared/ThreadFeed';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { Plus, BookOpen, Bookmark } from 'lucide-react';
import type { KnowledgePost } from '@/types/entities';

type TabStatus = 'published' | 'pending' | 'rejected' | 'saved';

export default function MyPostsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabStatus>('published');

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
        description="Những câu chuyện bạn đã chia sẻ và các bài viết bạn muốn xem lại"
        backHref="/me"
        actions={
          <Button size="sm" onClick={() => navigate('/knowledge/new?returnTo=%2Fknowledge%2Fme')} leftIcon={<Plus size={16} />}>
            Viết bài mới
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
        key={activeTab}
        posts={displayedPosts}
        isLoading={isLoading}
        skeletonCount={3}
        paging="infinite"
        pageSize={20}
        onEditPost={(p) => navigate(`/knowledge/${p.id}/edit?returnTo=%2Fknowledge%2Fme`)}
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
            ? 'Bấm biểu tượng lưu trên bài viết để xem lại tại đây.'
            : undefined
        }
        emptyAction={
          activeTab === 'saved' ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Khám phá bảng tin
            </Button>
          ) : activeTab === 'published' ? (
            <Button size="sm" onClick={() => navigate('/knowledge/new?returnTo=%2Fknowledge%2Fme')}>
              Viết bài ngay
            </Button>
          ) : undefined
        }
      />


    </div>
  );
}
