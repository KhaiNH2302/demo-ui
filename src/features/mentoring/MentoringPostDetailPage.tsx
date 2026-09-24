import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Send, Users, Sparkles, BookOpen } from 'lucide-react';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { MentoringPost, Mentor } from '@/types/entities';

interface PostDetailResponse {
  post: MentoringPost;
  mentor?: Mentor;
}

export const MentoringPostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSendOpen, setIsSendOpen] = useState(false);

  const postQuery = useQuery({
    queryKey: ['mentoring', 'posts', id],
    queryFn: () => apiClient.get<PostDetailResponse>(`/mentoring/posts/${id}`),
    enabled: !!id,
  });

  const post = postQuery.data?.post;
  const mentor = postQuery.data?.mentor;

  return (
    <QueryBoundary queries={[postQuery]}>
      {post && (
        <div className="max-w-3xl mx-auto space-y-6">
          <PageHeader
            title={post.title}
            description={`Chuyên ngành: ${post.field} • Hình thức: ${post.mode}`}
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Mentoring', href: '/mentoring' },
              { label: 'Chi tiết bài đăng' },
            ]}
            actions={
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
              </Button>
            }
          />

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{post.field}</Badge>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Còn trống {post.slots} slot
                </span>
              </div>
              <CardTitle className="text-xl">{post.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-[var(--surface-muted)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Mentor phụ trách:</span>
                <UserMiniCard userId={post.mentorId} showMajor />
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Nội dung chi tiết chương trình:</h4>
                <p className="text-sm text-[var(--text-main)] whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t border-[var(--border-subtle)] pt-4 flex justify-end">
              <Button onClick={() => setIsSendOpen(true)}>
                <Send className="w-4 h-4 mr-1.5" /> Đăng ký học cùng Mentor
              </Button>
            </CardFooter>
          </Card>

          {/* Send Request Dialog */}
          <SendMentoringRequestDialog
            open={isSendOpen}
            onOpenChange={setIsSendOpen}
            mentorId={post.mentorId}
            initialTopic={post.title}
          />
        </div>
      )}
    </QueryBoundary>
  );
};

export default MentoringPostDetailPage;
