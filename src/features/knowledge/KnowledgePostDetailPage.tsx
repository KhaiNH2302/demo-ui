import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReportPostDialog } from './ReportPostDialog';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
  MoreVertical,
  Flag,
  Pencil,
  Trash2,
  Lock,
  MessageSquare,
  Send,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { seedUsers } from '@/mocks/data/users';
import type { KnowledgePost, Comment } from '@/types/entities';

export default function KnowledgePostDetailPage() {
  const { id = 'post_01' } = useParams<{ id: string }>();
  const [commentText, setCommentText] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const postDetailQuery = useQuery<{ post: KnowledgePost; comments: Comment[] }>({
    queryKey: queryKeys.knowledge.detail(id),
    queryFn: () => apiClient.get(`/posts/${id}`),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => apiClient.post(`/posts/${id}/comments`, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.detail(id) });
      toast({ variant: 'success', title: 'Đã gửi phản hồi' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      navigate('/knowledge');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => apiClient.put(`/posts/${id}`, { status: 'Closed' }),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã đóng bài viết' });
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.detail(id) });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <QueryBoundary query={postDetailQuery}>
        {({ post, comments }) => {
          const isAuthor = user?.id === post.authorId;
          const isClosed = post.status === 'Closed';
          const author = seedUsers.find((u) => u.id === post.authorId) || {
            id: post.authorId,
            fullName: 'Sinh viên SCS',
            school: 'Đại học FPT',
          };

          return (
            <div className="space-y-6">
              <PageHeader
                title={post.title}
                backHref="/knowledge"
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="p-2 rounded-md hover:bg-neutral-100 text-neutral-500 cursor-pointer">
                        <MoreVertical size={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-amber-600">
                        <Flag size={14} /> Báo cáo vi phạm
                      </DropdownMenuItem>
                      {isAuthor && (
                        <>
                          <DropdownMenuItem onClick={() => navigate(`/knowledge/${post.id}/edit`)}>
                            <Pencil size={14} /> Chỉnh sửa bài
                          </DropdownMenuItem>
                          {!isClosed && (
                            <DropdownMenuItem onClick={() => closeMutation.mutate()}>
                              <Lock size={14} /> Đóng thảo luận
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem danger onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 size={14} /> Xóa bài viết
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />

              {/* Author & Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 bg-white shadow-xs">
                <UserMiniCard user={author} subtitle={formatDateTime(post.createdAt)} />

                <div className="flex items-center gap-2">
                  <Badge tier="brand" size="sm">
                    {post.type.toUpperCase()}
                  </Badge>
                  {post.subject && (
                    <Badge tier="neutral" size="sm">
                      {post.subject}
                    </Badge>
                  )}
                  {isClosed && (
                    <Badge tier="neutral" size="sm" dot>
                      Đã đóng
                    </Badge>
                  )}
                </div>
              </div>

              {/* Main Content Card */}
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Markdown formatted content */}
                  <div className="prose prose-sm max-w-none text-neutral-800 leading-relaxed space-y-3 whitespace-pre-line text-sm">
                    {post.contentMd}
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-neutral-100">
                      {post.tags.map((t) => (
                        <span key={t} className="text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="pt-4 border-t border-neutral-100 space-y-2">
                      <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                        Tệp đính kèm ({post.attachments.length})
                      </h4>
                      <AttachmentList items={post.attachments} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-brand-600" />
                  <h3 className="text-base font-bold text-neutral-900">
                    Phản hồi & Thảo luận ({comments.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <Card className="p-6 text-center text-xs text-neutral-400">
                      Chưa có phản hồi nào. Hãy là người đầu tiên để lại bình luận!
                    </Card>
                  ) : (
                    comments.map((cmt) => {
                      const cmtAuthor = seedUsers.find((u) => u.id === cmt.authorId) || {
                        id: cmt.authorId,
                        fullName: 'Thành viên SCS',
                        school: 'Đại học FPT',
                        avatarUrl: undefined,
                      };

                      return (
                        <Card key={cmt.id} className="p-4 shadow-xs">
                          <div className="flex items-start gap-3">
                            <Avatar src={cmtAuthor.avatarUrl} name={cmtAuthor.fullName} size="md" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-neutral-900">{cmtAuthor.fullName}</span>
                                <span className="text-[10px] text-neutral-400">
                                  {formatRelativeTime(cmt.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-700 leading-relaxed">{cmt.content}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>

                {/* Comment Input */}
                {!isClosed ? (
                  <Card className="p-4 shadow-xs">
                    <form onSubmit={handleAddComment} className="space-y-3">
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Viết phản hồi hoặc đặt câu hỏi thảo luận..."
                        rows={3}
                        disabled={addCommentMutation.isPending}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!commentText.trim()}
                          loading={addCommentMutation.isPending}
                          rightIcon={<Send size={14} />}
                        >
                          Gửi phản hồi
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : (
                  <Card className="p-4 text-center text-xs text-neutral-500 bg-neutral-100">
                    Bài viết này đã được đóng thảo luận.
                  </Card>
                )}
              </div>

              {/* Dialogs */}
              <ReportPostDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                postId={post.id}
              />

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
        }}
      </QueryBoundary>
    </div>
  );
}
