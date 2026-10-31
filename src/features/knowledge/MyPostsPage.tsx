import { LIFE_OWNER_STATUSES, matchesLifeOwnerStatus } from '@/lib/lifePostLifecycle';
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

type TabStatus = typeof LIFE_OWNER_STATUSES[number][0] | 'saved';

export default function MyPostsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabStatus>('Published');

  // My posts query
  const myPostsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'me'],
    refetchInterval: 30000,
    queryFn: () => apiClient.get('/posts/me'),
  });

  // Saved posts query
  const savedPostsQuery = useQuery<KnowledgePost[]>({
    queryKey: ['knowledge', 'saved'],
    queryFn: () => apiClient.get('/posts/saved'),
  });

  const allMyPosts = myPostsQuery.data || [];
  const savedPosts = savedPostsQuery.data || [];

  const displayedPosts = activeTab === 'saved' ? savedPosts : allMyPosts.filter((p) => matchesLifeOwnerStatus(p, activeTab));

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
        options={[...LIFE_OWNER_STATUSES.map(([value,label]) => ({ value, label: label + ' (' + allMyPosts.filter((p) => matchesLifeOwnerStatus(p, value)).length + ')' })), { value: 'saved', label: 'Đã lưu (' + savedPosts.length + ')' }]}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabStatus)}
        size="md"
        className="flex-wrap"
      />

      {/* ThreadFeed (K-U.2) */}
      <ThreadFeed
        key={activeTab}
        posts={displayedPosts}
        showOwnerControls={activeTab !== "saved"}
        isLoading={isLoading}
        skeletonCount={3}
        paging="infinite"
        pageSize={20}
        onEditPost={(p) => navigate(`/knowledge/${p.id}/edit?returnTo=%2Fknowledge%2Fme`)}
        emptyIcon={activeTab === 'saved' ? Bookmark : BookOpen}
        emptyTitle={
          activeTab === 'saved'
            ? 'Bạn chưa lưu bài viết nào.'
            : activeTab === 'PendingReview'
              ? 'Không có bài viết nào đang chờ duyệt.'
              : activeTab === 'Rejected'
                ? 'Không có bài viết nào bị từ chối.'
                : 'Chưa có bài viết ở trạng thái này.'
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
          ) : activeTab === 'Published' ? (
            <Button size="sm" onClick={() => navigate('/knowledge/new?returnTo=%2Fknowledge%2Fme')}>
              Viết bài ngay
            </Button>
          ) : undefined
        }
      />


    </div>
  );
}
