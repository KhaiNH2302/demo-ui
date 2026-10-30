import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock, Send, ShieldCheck, Users, Wallet } from 'lucide-react';
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
import { describePostFee } from './plans';
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

  const post = postQuery.data?.post;
  if (!post) return <QueryBoundary query={postQuery}>{null}</QueryBoundary>;

  const ownerId = post.authorId || post.mentorId;
  const isOwner = ownerId === user?.id;
  const isNeed = post.postType === 'NEED_MENTOR';
  const total = post.capacity || post.slots || 1;
  const filled = post.filledCount || 0;
  const remaining = Math.max(total - filled, 0);

  return (
    <QueryBoundary query={postQuery}>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title={post.title}
          description={`${isNeed ? 'Need Mentor' : 'Offer Mentoring'} • ${post.field || 'Mentoring'}`}
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring Feed', href: '/mentoring' }, { label: 'Chi tiết bài' }]}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
            </Button>
          }
        />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <UserMiniCard userId={ownerId} showMajor />
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant={isNeed ? 'attention' : 'brand'}>{isNeed ? 'Need Mentor' : 'Offer Mentoring'}</Badge>
                <Badge variant={post.status === 'PUBLISHED' || !post.status ? 'success' : 'neutral'} dot>
                  {post.status || 'PUBLISHED'}
                </Badge>
              </div>
            </div>
            <CardTitle className="text-xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{post.content || post.contentMd}</p>

            <div className="flex flex-wrap gap-1.5">
              {post.field && <Chip size="sm">{post.field}</Chip>}
              {post.mode && <Chip size="sm">{String(post.mode)}</Chip>}
              {(post.tags || []).map((tag) => <Chip key={tag} size="sm">#{tag}</Chip>)}
            </div>

            {/* Cùng thông tin với thẻ ở Feed: lịch, học phí, số buổi, học thử */}
            <dl className="grid gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-500">Lịch học</dt>
                  <dd className="font-medium text-neutral-900">{post.schedule?.length ? post.schedule.join(', ') : 'Lịch thỏa thuận'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <dt className="text-xs text-neutral-500">{isNeed ? 'Ngân sách' : 'Học phí'}</dt>
                  <dd className="font-medium text-neutral-900">
                    {describePostFee(post.fee)}
                    {post.sessions ? <span className="font-normal text-neutral-500">, {post.sessions} buổi</span> : null}
                  </dd>
                </div>
              </div>
              {!isNeed && (
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <dt className="text-xs text-neutral-500">Học thử</dt>
                    <dd className="font-medium text-neutral-900">{post.trial ? 'Có buổi học thử trước khi quyết định học tiếp' : 'Không có học thử'}</dd>
                  </div>
                </div>
              )}
            </dl>

            <div className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span>Trả lời trước: <strong>{post.deadline ? new Date(post.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 sm:justify-end">
                <Users className="h-4 w-4 text-neutral-400" />
                <span>Capacity còn lại: <strong>{remaining}/{total}</strong></span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
              <p className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4" /> SCS sẽ kiểm tra deadline, capacity và duplicate trước khi chuyển yêu cầu cho Post Owner.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-neutral-100 pt-4">
            {isOwner ? (
              <Button variant="secondary" onClick={() => navigate(user?.roles?.some((role) => role.toLowerCase() === 'mentor') ? '/mentor/requests' : '/mentoring/requests')}>
                Xem yêu cầu nhận được
              </Button>
            ) : (
              <Button onClick={() => setSendOpen(true)} disabled={remaining === 0 || post.status === 'FILLED'}>
                <Send className="mr-1.5 h-4 w-4" /> Gửi yêu cầu cho Post Owner
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
