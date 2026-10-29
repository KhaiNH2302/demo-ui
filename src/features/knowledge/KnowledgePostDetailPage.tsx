import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LimitNotice } from '@/components/shared/LimitNotice';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';
import { apiClient } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/format';
import { seedUsers } from '@/mocks/data/users';
import { cn } from '@/lib/cn';
import {
  Send,
  Heart,
  MessageCircle,
  CheckCircle2,
  X,
  Lock,
  CornerDownRight,
  Flag,
  ThumbsUp,
  CheckCheck,
  Pin,
} from 'lucide-react';
import type { KnowledgePost, Comment } from '@/types/entities';

export default function KnowledgePostDetailPage() {
  const { id = 'post_01' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const viewer = useViewer();
  const canInteract = viewer.can('knowledge.interact');
  const guard = useGuardedAction();
  const { toast } = useToast();
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [sortReplies, setSortReplies] = useState<'top' | 'new'>('top');
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
    title: string;
    authorName?: string;
    snapshot?: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [upvotedComments, setUpvotedComments] = useState<Record<string, boolean>>({});
  const [commentVotes, setCommentVotes] = useState<Record<string, number>>({});

  const handleUpvoteComment = (commentId: string, initialCount: number) => {
    guard('like_post', () => {
      const isUpvoted = !!upvotedComments[commentId];
      setUpvotedComments((prev) => ({ ...prev, [commentId]: !isUpvoted }));
      setCommentVotes((prev) => {
        const cur = prev[commentId] !== undefined ? prev[commentId] : initialCount;
        return { ...prev, [commentId]: isUpvoted ? Math.max(0, cur - 1) : cur + 1 };
      });
      toast({
        variant: 'default',
        title: isUpvoted ? 'Đã bỏ bình chọn hữu ích' : 'Đã đánh giá phản hồi là Hữu ích!',
      });
    })();
  };

  const postDetailQuery = useQuery<{ post: KnowledgePost; comments: Comment[] }>({
    queryKey: ['knowledge', 'detail', id],
    queryFn: () => apiClient.get(`/posts/${id}`),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
      apiClient.post(`/posts/${id}/comments`, { content, parentId }),
    onSuccess: () => {
      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'detail', id] });
      toast({ variant: 'success', title: 'Đã gửi phản hồi' });
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiClient.put(`/posts/${id}/accepted-answer`, { commentId }),
    onSuccess: () => {
      toast({ variant: 'success', title: 'Đã chọn câu trả lời hay nhất' });
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'detail', id] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? apiClient.post(`/posts/${postId}/like`) : apiClient.delete(`/posts/${postId}/like`),
  });

  const saveMutation = useMutation({
    mutationFn: ({ postId, saved }: { postId: string; saved: boolean }) =>
      saved ? apiClient.post(`/posts/${postId}/save`) : apiClient.delete(`/posts/${postId}/save`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      navigate('/knowledge');
    },
  });

  if (postDetailQuery.isLoading) {
    return (
      <div className="max-w-[720px] mx-auto space-y-4 pt-4">
        <div className="h-8 bg-neutral-100 rounded w-1/4 animate-pulse" />
        <div className="h-48 bg-neutral-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const data = postDetailQuery.data;
  if (!data?.post) {
    return (
      <div className="max-w-[720px] mx-auto text-center py-16 space-y-3">
        <h3 className="text-base font-bold text-neutral-900">
          Bài viết không tồn tại hoặc đã bị gỡ
        </h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/knowledge')}>
          Về trang Chia sẻ kiến thức
        </Button>
      </div>
    );
  }

  const { post, comments = [] } = data;
  const isAuthor = user?.id === post.authorId;
  const isQuestion = post.type === 'question';
  const isClosed = post.status === 'Closed' || post.status === 'closed';

  const rootComments = comments.filter((c) => !c.parentId);
  const getNestedComments = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const sortedComments = [...rootComments].sort((a, b) => {
    if (a.isAcceptedAnswer) return -1;
    if (b.isAcceptedAnswer) return 1;
    if (sortReplies === 'top') return (b.likesCount || 0) - (a.likesCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const visibleComments = canInteract ? sortedComments : sortedComments.slice(0, 10);
  const hiddenCommentsCount = Math.max(0, sortedComments.length - 10);

  const handleStartReply = guard('comment', (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    setReplyText(`@${authorName} `);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 50);
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInteract) {
      guard('comment', () => {})();
      return;
    }
    if (!replyText.trim()) return;
    addCommentMutation.mutate({
      content: replyText.trim(),
      parentId: replyingTo?.id,
    });
  };

  return (
    <div className="max-w-[720px] mx-auto pb-8">
      <div className="bg-surface border border-neutral-200 rounded-xl shadow-2xs">
        <ContextHeader
          backHref="/knowledge"
          title="Chi tiết thảo luận"
          className="rounded-t-xl px-5 sm:px-6"
        />

        {/* Main Post Full View */}
        <div className="px-5 sm:px-6">
          <ThreadCard
            post={post}
            variant="detail"
            className="border-b-0 py-5"
            onLikeToggle={guard('like_post', (pId: string, liked: boolean) =>
              likeMutation.mutate({ postId: pId, liked })
            )}
            onSaveToggle={guard('bookmark_post', (pId: string, saved: boolean) =>
              saveMutation.mutate({ postId: pId, saved })
            )}
            onDelete={() => setDeleteDialogOpen(true)}
            onReport={guard('report', () =>
              setReportTarget({
                type: 'post',
                id: post.id,
                title: post.title || 'Bài viết thảo luận',
                authorName: post.authorName,
                snapshot: post.contentMd,
              })
            )}
          />
        </div>

        {/* Replies Section Header & Sorting */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 bg-neutral-50/80 border-y border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
            <MessageCircle size={16} className="text-brand-600" />
            <span>Phản hồi ({comments.length})</span>
          </h3>

          <SegmentedControl
            options={[
              { value: 'top', label: 'Hữu ích nhất' },
              { value: 'new', label: 'Mới nhất' },
            ]}
            value={sortReplies}
            onValueChange={(val) => setSortReplies(val as any)}
            size="sm"
          />
        </div>

        {/* Comment List (2-column ThreadCard reply layout per K3 spec) */}
        <div className="divide-y divide-neutral-100">
          {comments.length === 0 ? (
            <div className="text-center py-12 px-5 sm:px-6 text-xs text-neutral-500">
              Chưa có câu trả lời nào. Hãy là người đầu tiên tham gia thảo luận.
            </div>
          ) : (
            visibleComments.map((comment) => {
              const commentAuthor = seedUsers.find((u) => u.id === comment.authorId) || {
                id: comment.authorId,
                fullName: 'Thành viên FPTU',
                avatarUrl: undefined,
                major: 'Sinh viên',
                cohort: 'K18',
              };

              const nested = getNestedComments(comment.id);

              return (
                <div
                  key={comment.id}
                  className={cn(
                    'px-5 sm:px-6 py-4 transition-colors',
                    comment.isAcceptedAnswer &&
                      'border-l-2 border-l-tier-success-dot bg-tier-success-bg/15'
                  )}
                >
                  {comment.isAcceptedAnswer && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 mb-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCheck size={16} className="text-emerald-600 shrink-0" />
                        <span>Câu trả lời đúng & hữu ích nhất (Được người hỏi chọn & ghim lên đầu)</span>
                      </div>
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => acceptAnswerMutation.mutate(comment.id)}
                          className="text-[11px] text-emerald-700 hover:underline font-normal cursor-pointer"
                        >
                          Bỏ ghim
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Left Avatar Column */}
                    <div className="shrink-0 pt-0.5">
                      <UserAvatar
                        user={{
                          id: commentAuthor.id,
                          fullName: commentAuthor.fullName,
                          avatarUrl: commentAuthor.avatarUrl,
                        }}
                        linkToProfile
                        size="sm"
                      />
                    </div>

                    {/* Right Content Column */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="font-semibold text-neutral-900">
                            {commentAuthor.fullName}
                          </span>
                          {commentAuthor.major && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="text-neutral-500">{commentAuthor.major}</span>
                            </>
                          )}
                          <span className="text-neutral-300">·</span>
                          <span className="text-neutral-400">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>

                        {isAuthor && isQuestion && !comment.isAcceptedAnswer && !isClosed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acceptAnswerMutation.mutate(comment.id)}
                            className="text-xs h-7 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0 font-medium"
                          >
                            <CheckCheck size={13} className="text-emerald-600" /> Chọn câu trả lời đúng nhất
                          </Button>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                        <div className="flex items-center gap-3">
                          {/* Upvote Button */}
                          {(() => {
                            const isUpvoted = !!upvotedComments[comment.id];
                            const currentVotes =
                              commentVotes[comment.id] !== undefined
                                ? commentVotes[comment.id]
                                : comment.likesCount || 0;
                            return (
                              <button
                                type="button"
                                onClick={() => handleUpvoteComment(comment.id, comment.likesCount || 0)}
                                className={cn(
                                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all cursor-pointer',
                                  isUpvoted
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-2xs'
                                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                                )}
                              >
                                <ThumbsUp size={13} className={isUpvoted ? 'fill-current text-amber-600' : 'text-neutral-500'} />
                                <span>Hữu ích ({currentVotes})</span>
                              </button>
                            );
                          })()}

                          {!isClosed && (
                            <button
                              type="button"
                              onClick={() => handleStartReply(comment.id, commentAuthor.fullName)}
                              className="flex items-center gap-1.5 hover:text-brand-600 transition-colors font-medium cursor-pointer"
                            >
                              <MessageCircle size={14} />
                              <span>Trả lời</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={guard('report', () =>
                            setReportTarget({
                              type: 'comment',
                              id: comment.id,
                              title: `Bình luận của ${commentAuthor.fullName}`,
                              authorName: commentAuthor.fullName,
                              snapshot: comment.content,
                            })
                          )}
                          className="flex items-center gap-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          title="Báo cáo bình luận"
                        >
                          <Flag size={13} />
                          <span>Báo cáo</span>
                        </button>
                      </div>

                      {/* Nested 1-Level Replies */}
                      {nested.length > 0 && (
                        <div className="pl-3.5 border-l-2 border-neutral-200 space-y-2.5 pt-1 mt-2.5">
                          {nested.map((nc) => {
                            const ncAuthor = seedUsers.find((u) => u.id === nc.authorId) || {
                              id: nc.authorId,
                              fullName: 'Thành viên FPTU',
                              avatarUrl: undefined,
                            };

                            return (
                              <div
                                key={nc.id}
                                className="flex items-start gap-2.5 bg-neutral-50/80 rounded-lg p-2.5"
                              >
                                <UserAvatar
                                  user={{
                                    id: ncAuthor.id,
                                    fullName: ncAuthor.fullName,
                                    avatarUrl: ncAuthor.avatarUrl,
                                  }}
                                  linkToProfile
                                  size="xs"
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-semibold text-neutral-900">
                                      {ncAuthor.fullName}
                                    </span>
                                    <span className="text-neutral-400">
                                      {formatRelativeTime(nc.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-700 leading-relaxed">
                                    {nc.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!canInteract && hiddenCommentsCount > 0 && (
          <div className="p-5 sm:p-6 border-t border-neutral-100">
            <LimitNotice remaining={hiddenCommentsCount} noun="bình luận" />
          </div>
        )}

        {/* Sticky Bottom Reply Bar — aligned inside the 720px thread column */}
        <div className="sticky bottom-0 z-20 bg-surface/95 backdrop-blur-md border-t border-neutral-200 px-5 sm:px-6 py-3 rounded-b-xl">
          <div className="space-y-1.5">
            {replyingTo && (
              <div className="flex items-center justify-between text-xs text-brand-700 bg-brand-50 px-3 py-1 rounded-md">
                <span className="flex items-center gap-1">
                  <CornerDownRight size={13} /> Đang trả lời <strong>@{replyingTo.authorName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {isClosed ? (
              <div className="text-center py-2 text-xs text-neutral-500 bg-neutral-100 rounded-lg flex items-center justify-center gap-1.5">
                <Lock size={13} /> Tác giả đã đóng thảo luận bài viết này.
              </div>
            ) : !canInteract ? (
              <div className="flex items-center justify-between gap-3 py-1 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                <span>Đăng nhập để trả lời</span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={guard('comment', () => {})}
                >
                  Đăng nhập
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReply} className="flex items-center gap-3">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.fullName || 'Thành viên'}
                  size="sm"
                  className="shrink-0"
                />
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyingTo
                      ? `Trả lời @${replyingTo.authorName}...`
                      : 'Viết câu trả lời hoặc thảo luận...'
                  }
                  disabled={addCommentMutation.isPending}
                  className="flex-1 text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-200 focus:bg-surface rounded-full px-4 py-2 border border-transparent focus:border-brand-300 outline-hidden transition-all"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyText.trim() || addCommentMutation.isPending}
                  loading={addCommentMutation.isPending}
                  className="rounded-full px-4 shrink-0"
                >
                  <Send size={14} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Shared Report Dialog */}
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          targetAuthorName={reportTarget.authorName}
          contentSnapshot={reportTarget.snapshot}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác."
        danger={true}
        confirmLabel="Xóa vĩnh viễn"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </div>
  );
}
