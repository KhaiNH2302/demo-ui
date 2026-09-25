import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { ThreadCard } from '@/components/shared/ThreadCard';
import { ReportPostDialog } from './ReportPostDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
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
} from 'lucide-react';
import type { KnowledgePost, Comment } from '@/types/entities';

export default function KnowledgePostDetailPage() {
  const { id = 'post_01' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [sortReplies, setSortReplies] = useState<'top' | 'new'>('top');
  const [replyText, setReplyText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
      navigate('/');
    },
  });

  if (postDetailQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <div className="h-8 bg-neutral-100 rounded w-1/4 animate-pulse" />
        <div className="h-48 bg-neutral-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const data = postDetailQuery.data;
  if (!data?.post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <h3 className="text-base font-bold text-neutral-900">Bài viết không tồn tại hoặc đã bị xóa</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          Về trang chủ
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

  // Sorting
  const sortedComments = [...rootComments].sort((a, b) => {
    if (a.isAcceptedAnswer) return -1;
    if (b.isAcceptedAnswer) return 1;
    if (sortReplies === 'top') return (b.likesCount || 0) - (a.likesCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleStartReply = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, authorName });
    setReplyText(`@${authorName} `);
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 50);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addCommentMutation.mutate({
      content: replyText.trim(),
      parentId: replyingTo?.id,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* ContextHeader */}
      <ContextHeader backHref="/" title="Thread" />

      {/* Main Post Full View */}
      <div className="bg-white rounded-xl">
        <ThreadCard
          post={post}
          variant="detail"
          onLikeToggle={(pId, liked) => likeMutation.mutate({ postId: pId, liked })}
          onSaveToggle={(pId, saved) => saveMutation.mutate({ postId: pId, saved })}
          onDelete={() => setDeleteDialogOpen(true)}
          onReport={(pId) => setReportTarget({ type: 'post', id: pId })}
        />
      </div>

      {/* Replies Section Header & Sorting */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 px-1">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
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

      {/* Comment List */}
      <div className="space-y-3 pt-1">
        {comments.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-400">
            Chưa có câu trả lời nào. Hãy là người đầu tiên tham gia thảo luận!
          </div>
        ) : (
          sortedComments.map((comment) => {
            const commentAuthor = seedUsers.find((u) => u.id === comment.authorId) || {
              id: comment.authorId,
              fullName: 'Thành viên FPTU',
              avatarUrl: undefined,
              major: 'Sinh viên',
            };

            const nested = getNestedComments(comment.id);

            return (
              <div
                key={comment.id}
                className={cn(
                  'bg-white border rounded-xl p-4 space-y-3 transition-all',
                  comment.isAcceptedAnswer
                    ? 'border-tier-success-border bg-tier-success-bg/20 ring-1 ring-tier-success-dot/30'
                    : 'border-neutral-200'
                )}
              >
                {/* Accepted Answer Badge */}
                {comment.isAcceptedAnswer && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-tier-success-text pb-1 border-b border-tier-success-border/50">
                    <CheckCircle2 size={15} className="text-tier-success-dot" />
                    <span>Câu trả lời được tác giả chọn</span>
                  </div>
                )}

                {/* Comment Author Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={commentAuthor.avatarUrl}
                      name={commentAuthor.fullName}
                      size="sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block">
                        {commentAuthor.fullName}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Author Select Best Answer button */}
                  {isAuthor && isQuestion && !comment.isAcceptedAnswer && !isClosed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acceptAnswerMutation.mutate(comment.id)}
                      className="text-[11px] h-7 gap-1 text-tier-success-text hover:bg-tier-success-bg"
                    >
                      <CheckCircle2 size={13} /> Chọn câu trả lời này
                    </Button>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      toast({ variant: 'default', title: 'Đã thích phản hồi' });
                    }}
                    className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
                  >
                    <Heart size={14} />
                    <span>{comment.likesCount || 0}</span>
                  </button>

                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => handleStartReply(comment.id, commentAuthor.fullName)}
                      className="flex items-center gap-1 hover:text-brand-600 transition-colors font-medium"
                    >
                      <MessageCircle size={14} />
                      <span>Trả lời</span>
                    </button>
                  )}
                </div>

                {/* Nested 1-Level Replies */}
                {nested.length > 0 && (
                  <div className="pl-4 border-l-2 border-neutral-200 space-y-2.5 pt-2 mt-2">
                    {nested.map((nc) => {
                      const ncAuthor = seedUsers.find((u) => u.id === nc.authorId) || {
                        id: nc.authorId,
                        fullName: 'Thành viên FPTU',
                        avatarUrl: undefined,
                      };

                      return (
                        <div key={nc.id} className="space-y-1 bg-neutral-50/80 rounded-lg p-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-neutral-900">
                              {ncAuthor.fullName}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {formatRelativeTime(nc.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 leading-relaxed">
                            {nc.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Reply Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-3 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto space-y-1.5">
          {/* Active Replying indicator */}
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
                className="text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {!isClosed ? (
            <form onSubmit={handleSubmitReply} className="flex items-center gap-2.5">
              <Avatar
                src={user?.avatarUrl}
                name={user?.fullName || 'Sinh viên'}
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
                className="flex-1 text-xs sm:text-sm bg-neutral-100 hover:bg-neutral-50 focus:bg-white rounded-full px-4 py-2 border border-transparent focus:border-brand-300 outline-hidden transition-all"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!replyText.trim() || addCommentMutation.isPending}
                loading={addCommentMutation.isPending}
                className="rounded-full px-4"
              >
                <Send size={14} />
              </Button>
            </form>
          ) : (
            <div className="text-center py-2 text-xs text-neutral-500 bg-neutral-100 rounded-lg flex items-center justify-center gap-1.5">
              <Lock size={13} /> Tác giả đã đóng thảo luận bài viết này.
            </div>
          )}
        </div>
      </div>

      {/* Report Post/Comment Dialog */}
      {reportTarget && (
        <ReportPostDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          postId={reportTarget.id}
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
