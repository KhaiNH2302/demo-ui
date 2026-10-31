import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Plus, Trash2, Wallet } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import type { MentoringRequest, MentorPost } from '@/types/entities';
import { describePostFee } from './plans';

const isClosed = (post: MentorPost) =>
  post.status === 'CLOSED' ||
  post.status === 'EXPIRED' ||
  post.open === false ||
  Boolean(post.deadline && new Date(post.deadline).getTime() < Date.now());

interface MyNeedPostsProps {
  requests: MentoringRequest[];
  onViewOffers: () => void;
}

/**
 * Danh sách bài nhờ kèm của chính học viên. Bài không sửa được: cần đổi nội dung thì xóa rồi đăng bài mới.
 * Bài đã có Mentor nhận kèm (đã thành lớp) không xóa được, chỉ đóng hoặc mở lại.
 */
export const MyNeedPosts: React.FC<MyNeedPostsProps> = ({ requests, onViewOffers }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<MentorPost | null>(null);

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts', 'mine'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts/mine'),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] });
  };

  const changeStatus = useMutation({
    mutationFn: ({ post, close }: { post: MentorPost; close: boolean }) =>
      apiClient.put<MentorPost>(`/mentoring/posts/${post.id}`, close ? { status: 'CLOSED', open: false } : { status: 'PUBLISHED', open: true }),
    onSuccess: (_data, { close }) => {
      toast.success(close ? 'Đã đóng bài' : 'Đã mở lại bài');
      refresh();
    },
    onError: () => toast.error('Chưa đổi được trạng thái bài, thử lại sau ít phút.'),
  });

  const remove = useMutation({
    mutationFn: (post: MentorPost) => apiClient.delete(`/mentoring/posts/${post.id}`),
    onSuccess: () => {
      toast.success('Đã xóa bài. Bạn có thể đăng bài mới bất cứ lúc nào.');
      setDeleting(null);
      refresh();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Chưa xóa được bài, thử lại sau ít phút.');
      setDeleting(null);
    },
  });

  const posts = postsQuery.data || [];
  const offersOf = (post: MentorPost) => requests.filter((request) => request.sourcePostId === post.id);
  const pendingOf = (post: MentorPost) => offersOf(post).filter((request) => request.status === 'PENDING_MENTOR_RESPONSE').length;
  const hasClass = (post: MentorPost) => offersOf(post).some((request) => request.status === 'ACCEPTED');
  const postNew = () => navigate('/mentoring/new?type=need');

  return (
    <>
      <QueryBoundary query={postsQuery}>
        {posts.length === 0 ? (
          <EmptyState
            title="Bạn chưa đăng bài nhờ kèm nào"
            description="Đăng môn đang vướng và giờ học được để Mentor tìm tới bạn."
            action={<Button onClick={postNew}><Plus className="mr-1.5 h-4 w-4" /> Đăng bài nhờ kèm</Button>}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-neutral-600">Muốn đổi nội dung bài? Xóa bài cũ rồi đăng bài mới.</p>
              <Button size="sm" onClick={postNew}><Plus className="mr-1.5 h-4 w-4" /> Đăng bài mới</Button>
            </div>
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {posts.map((post) => {
                const closed = isClosed(post);
                const offers = offersOf(post).length;
                const pending = pendingOf(post);
                const busy = changeStatus.isPending && changeStatus.variables?.post.id === post.id;
                return (
                  <li
                    key={post.id}
                    className={cn('flex flex-col justify-between rounded-2xl border bg-surface', closed ? 'border-neutral-200 opacity-75' : 'border-neutral-200 dark:border-neutral-700/80')}
                  >
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between gap-2">
                        {post.subject && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                            {post.subject}
                          </span>
                        )}
                        <span className={cn('text-xs font-medium', closed ? 'text-neutral-500' : 'text-emerald-700')}>
                          {closed ? 'Đã đóng' : 'Đang mở'}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{post.title}</h3>
                      <dl className="space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <dt className="sr-only">Giờ học được</dt>
                          <dd>{post.schedule?.length ? post.schedule.join(', ') : 'Lịch thỏa thuận'}</dd>
                        </div>
                        <div className="flex items-start gap-2">
                          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <dt className="sr-only">Học phí</dt>
                          <dd>
                            {describePostFee(post.fee)}
                            {post.sessions ? <span className="text-neutral-500">, {post.sessions} buổi</span> : null}
                          </dd>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <dt className="sr-only">Cần tìm trước</dt>
                          <dd>Cần tìm trước {post.deadline ? new Date(post.deadline).toLocaleDateString('vi-VN') : 'ngày chưa đặt'}</dd>
                        </div>
                      </dl>
                      <p className="text-sm text-neutral-600">
                        {offers === 0 ? (
                          'Chưa có Mentor nào đề nghị kèm.'
                        ) : (
                          <>
                            Đã có <strong>{offers}</strong> lời đề nghị
                            {pending > 0 && (
                              <>
                                {', '}
                                <button type="button" onClick={onViewOffers} className="font-semibold text-rose-600 hover:underline">
                                  {pending} đang chờ bạn trả lời
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                      {hasClass(post) ? (
                        <span className="text-xs text-neutral-500">Đã có Mentor nhận kèm nên không xóa được.</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => setDeleting(post)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa bài
                        </Button>
                      )}
                      {closed ? (
                        <Button variant="outline" size="sm" loading={busy} onClick={() => changeStatus.mutate({ post, close: false })}>
                          Mở lại bài
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" loading={busy} onClick={() => changeStatus.mutate({ post, close: true })}>
                          Đóng bài
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa bài nhờ kèm?"
        description={
          deleting && offersOf(deleting).length > 0
            ? `Bài và ${offersOf(deleting).length} lời đề nghị liên quan sẽ bị gỡ, Mentor sẽ thấy yêu cầu đã bị từ chối. Bạn có thể đăng bài mới ngay sau đó.`
            : 'Bài sẽ biến mất khỏi Bảng tin. Bạn có thể đăng bài mới ngay sau đó.'
        }
        confirmLabel="Xóa bài"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting);
        }}
      />
    </>
  );
};
