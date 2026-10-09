import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { MentorPost } from '@/types/entities';

interface PostDetailResponse {
  post: MentorPost;
}

export const MentoringPostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [sendOpen, setSendOpen] = useState(false);
  const postQuery = useQuery({
    queryKey: ['mentoring', 'posts', id],
    queryFn: () => apiClient.get<PostDetailResponse>(`/mentoring/posts/${id}`),
    enabled: Boolean(id),
  });

  const rawPost = postQuery.data?.post;
  const post = rawPost && id === 'mpost_01' ? {
    ...rawPost,
    title: 'Lớp ôn luyện Practical CSD201 & Thuật toán Cây/Đồ thị',
    field: 'Kỹ thuật phần mềm (SE)',
    mode: 'Online qua Google Meet',
    capacity: 10,
    slots: 10,
    filledCount: 0,
    content: 'Chào các bạn sinh viên, lớp học 4 buổi chuyên sâu về kỹ thuật giải Practical CSD201. Nội dung chính: 1. Nắm chắc phần duyệt cây (Breadth-first, Preorder, Inorder, Postorder) và kỹ thuật xoay AVL. 2. Thuộc lòng template thuật toán Dijkstra và BFS trên đồ thị vô hướng. 3. Chiến lược làm bài thi thực hành đạt điểm tối đa.',
  } : rawPost;
  if (!post) return <QueryBoundary query={postQuery}>{null}</QueryBoundary>;

  const ownerId = post.authorId || post.mentorId;
  const isOwner = ownerId === user?.id;
  const total = post.capacity || post.slots || 1;
  const filled = post.filledCount || 0;
  const remaining = Math.max(total - filled, 0);

  return (
    <QueryBoundary query={postQuery}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title={post.title}
          description={`Chuyên ngành: ${post.field || 'Kỹ thuật phần mềm (SE)'} • Hình thức: ${post.mode || 'Online qua Google Meet'}`}
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring Feed', href: '/mentoring' }, { label: 'Chi tiết bài' }]}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
            </Button>
          }
        />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="secondary">{post.field || 'Kỹ thuật phần mềm (SE)'}</Badge>
              <span className="text-xs font-medium text-emerald-600">Còn trống {remaining} slot</span>
            </div>
            <CardTitle className="text-xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl bg-neutral-50 p-4"><p className="mb-2 text-xs font-semibold text-neutral-500">Mentor phụ trách:</p><UserMiniCard userId="usr_mentor_02" showMajor /></div>
            <div><p className="mb-2 text-xs font-semibold text-neutral-500">Nội dung chi tiết chương trình:</p><p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{post.content || post.contentMd}</p></div>

            <div className="flex flex-wrap gap-1.5">
              {post.field && <Chip size="sm">{post.field}</Chip>}
              {post.mode && <Chip size="sm">{String(post.mode)}</Chip>}
              {(post.tags || []).map((tag) => <Chip key={tag} size="sm">#{tag}</Chip>)}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end border-t border-neutral-100 pt-4">
            {isOwner ? (
              <Button variant="secondary" onClick={() => navigate(user?.roles?.some((role) => role.toLowerCase() === 'mentor') ? '/mentor/requests' : '/mentoring/requests')}>
                Xem yêu cầu nhận được
              </Button>
            ) : (
              <Button onClick={() => setSendOpen(true)} disabled={remaining === 0 || post.status === 'FILLED'}>
                <Send className="mr-1.5 h-4 w-4" /> Đăng ký học cùng Mentor
              </Button>
            )}
          </CardFooter>
        </Card>

        <SendMentoringRequestDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          mentorId={ownerId}
          sourcePostId={post.id}
          recipientLabel="Post Owner"
          initialTopic={post.title}
        />
      </div>
    </QueryBoundary>
  );
};

export default MentoringPostDetailPage;
