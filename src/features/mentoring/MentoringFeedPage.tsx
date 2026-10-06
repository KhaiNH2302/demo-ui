import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CornerDownRight,
  Filter,
  Heart,
  MessageCircleMore,
  Newspaper,
  Plus,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { SearchInput } from '@/components/shared/SearchInput';
import { FormField } from '@/components/shared/FormField';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import type { Comment, MentorPost, SupportMode } from '@/types/entities';

const FIELD_OPTIONS = [
  { label: 'Tất cả lĩnh vực', value: 'all' },
  { label: 'Kỹ thuật phần mềm', value: 'Kỹ thuật phần mềm' },
  { label: 'Thuật toán & Cấu trúc dữ liệu', value: 'Thuật toán' },
  { label: 'Phát triển Web', value: 'Phát triển Web' },
  { label: 'An toàn thông tin', value: 'An toàn thông tin' },
  { label: 'Trí tuệ nhân tạo', value: 'Trí tuệ nhân tạo' },
];

const MODE_OPTIONS = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Trao đổi qua chat', value: 'chat' },
];

const defaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

interface MentoringFeedPageProps {
  embedded?: boolean;
  roleOverride?: 'student' | 'mentor';
}

export const MentoringFeedPage: React.FC<MentoringFeedPageProps> = ({
  embedded = false,
  roleOverride,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isMentorContext =
    roleOverride === 'mentor' ||
    (!roleOverride && location.pathname.startsWith('/mentor') && user?.roles?.some((role) => role.toLowerCase() === 'mentor'));
  const currentRole: 'student' | 'mentor' = isMentorContext ? 'mentor' : 'student';
  const postType = currentRole === 'mentor' ? 'OFFER_MENTORING' : 'NEED_MENTOR';

  const [search, setSearch] = useState('');
  const [field, setField] = useState('all');
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postField, setPostField] = useState('Kỹ thuật phần mềm');
  const [mode, setMode] = useState<SupportMode>('online');
  const [capacity, setCapacity] = useState(1);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts'),
  });

  const commentsQuery = useQuery({
    queryKey: ['mentoring', 'comments'],
    queryFn: () => apiClient.get<Comment[]>('/mentoring/comments'),
  });

  const createPostMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentorPost>('/mentoring/posts', {
        title: title.trim(),
        content: content.trim(),
        contentMd: content.trim(),
        field: postField,
        mode,
        capacity,
        slots: capacity,
        deadline,
        postType,
        authorRole: currentRole,
      }),
    onSuccess: () => {
      toast.success(postType === 'NEED_MENTOR' ? 'Đã đăng bài Need Mentor.' : 'Đã đăng bài Offer Mentoring.');
      setComposerOpen(false);
      setTitle('');
      setContent('');
      setCapacity(1);
      setDeadline(defaultDeadline());
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    },
    onError: () => toast.error('Không thể đăng bài. Vui lòng kiểm tra nội dung và thử lại.'),
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? apiClient.post(`/mentoring/posts/${postId}/like`)
        : apiClient.delete(`/mentoring/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] }),
    onError: () => toast.error('Không thể cập nhật lượt thích.'),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiClient.post<Comment>(`/mentoring/posts/${postId}/comments`, { content }),
    onSuccess: (_comment, variables) => {
      setCommentDrafts((current) => ({ ...current, [variables.postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    },
    onError: () => toast.error('Không thể gửi bình luận.'),
  });

  const posts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const expectedType = currentRole === 'mentor' ? 'NEED_MENTOR' : 'OFFER_MENTORING';
    return (postsQuery.data || []).filter((post) => {
      const isOwnPost = (post.authorId || post.mentorId) === user?.id;
      if (onlyCompatible && post.postType && post.postType !== expectedType && !isOwnPost) return false;
      if (field !== 'all' && !(post.field || '').toLowerCase().includes(field.toLowerCase())) return false;
      if (!query) return true;
      return [post.title, post.content || post.contentMd, post.field, ...(post.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [currentRole, field, onlyCompatible, postsQuery.data, search, user?.id]);

  const submitPost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !deadline) {
      toast.error('Vui lòng nhập tiêu đề, nội dung và deadline.');
      return;
    }
    if (capacity < 1) {
      toast.error('Capacity phải từ 1 trở lên.');
      return;
    }
    createPostMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!embedded && (
        <PageHeader
          title="Mentoring Feed"
          description="Lướt bài đăng, tìm Mentor phù hợp hoặc đăng nhu cầu mentoring của bạn."
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm Mentor' }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/mentoring/browse')}>
                <Search className="mr-1.5 h-4 w-4" /> Danh sách Mentor
              </Button>
              <Button variant="outline" onClick={() => navigate('/mentoring/ai')}>
                Gợi ý bằng AI
              </Button>
              <Button onClick={() => setComposerOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Tạo bài
              </Button>
            </div>
          }
        />
      )}

      {embedded && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Mentoring Feed</h2>
            <p className="text-sm text-neutral-600">Lướt bài Need Mentor và đăng Offer Mentoring của bạn.</p>
          </div>
          <Button onClick={() => setComposerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Tạo bài Offer Mentoring
          </Button>
        </div>
      )}

      <Card className="border-violet-100 bg-gradient-to-r from-violet-50 to-surface">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Newspaper className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="min-h-11 flex-1 rounded-full border border-neutral-200 bg-surface px-4 text-left text-sm text-neutral-500 transition-colors hover:border-violet-300 hover:bg-violet-50/40"
          >
            {currentRole === 'mentor'
              ? 'Giới thiệu bản thân để sinh viên phù hợp tìm thấy bạn...'
              : 'Bạn đang cần Mentor hỗ trợ điều gì? Hãy đăng Need Mentor...'}
          </button>
          <Badge variant={currentRole === 'mentor' ? 'brand' : 'secondary'}>
            Tự gán: {postType === 'OFFER_MENTORING' ? 'Offer Mentoring' : 'Need Mentor'}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo chủ đề, kỹ năng hoặc từ khóa..." />
        <Select value={field} onChange={(event) => setField(event.target.value)} options={FIELD_OPTIONS} />
        <Button
          variant={onlyCompatible ? 'secondary' : 'outline'}
          onClick={() => setOnlyCompatible((value) => !value)}
          className="whitespace-nowrap"
        >
          <Filter className="mr-1.5 h-4 w-4" /> {onlyCompatible ? 'Bài phù hợp' : 'Tất cả bài'}
        </Button>
      </div>

      <QueryBoundary query={postsQuery}>
        {posts.length === 0 ? (
          <Card className="p-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="font-semibold text-neutral-900">Chưa có bài phù hợp</p>
            <p className="mt-1 text-sm text-neutral-500">Hãy đổi bộ lọc hoặc tạo bài mentoring mới.</p>
          </Card>
        ) : (
          <div className="w-full space-y-4">
            {posts.map((post) => {
              const ownerId = post.authorId || post.mentorId;
              const isOwner = ownerId === user?.id;
              const total = post.capacity || post.slots || 1;
              const filled = post.filledCount || 0;
              const remaining = Math.max(total - filled, 0);
              const isNeed = post.postType === 'NEED_MENTOR';
              const postComments = (commentsQuery.data || []).filter((comment) => comment.postId === post.id);
              const rootComments = postComments.filter((comment) => !comment.parentId);
              const commentsOpen = Boolean(expandedComments[post.id]);
              return (
                <Card key={post.id} className="overflow-hidden">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <UserMiniCard userId={ownerId} showMajor />
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={isNeed ? 'attention' : 'brand'}>
                          {isNeed ? 'Need Mentor' : 'Offer Mentoring'}
                        </Badge>
                        <span className="text-[11px] text-neutral-500">
                          {post.authorRole === 'student' ? 'Student' : 'Mentor'} · {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                        {post.content || post.contentMd}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {post.field && <Chip size="sm">{post.field}</Chip>}
                      {post.mode && <Chip size="sm">{String(post.mode)}</Chip>}
                      {(post.tags || []).slice(0, 3).map((tag) => <Chip key={tag} size="sm">#{tag}</Chip>)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                        Deadline: {post.deadline ? new Date(post.deadline).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                      </span>
                      <span className="flex items-center justify-end gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        Còn {remaining}/{total} vị trí
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={post.liked ? 'text-rose-600' : 'text-neutral-600'}
                        loading={likeMutation.isPending && likeMutation.variables?.postId === post.id}
                        onClick={() => likeMutation.mutate({ postId: post.id, liked: !post.liked })}
                      >
                        <Heart className={`mr-1.5 h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                        {post.likeCount || 0} Thích
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-600"
                        onClick={() => setExpandedComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                      >
                        <MessageCircleMore className="mr-1.5 h-4 w-4" />
                        {post.commentCount || 0} Bình luận
                      </Button>
                    </div>
                    {isOwner ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(currentRole === 'mentor' ? '/mentor/requests' : '/mentoring/requests')}
                      >
                        Xem yêu cầu nhận được <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => navigate(`/mentoring/posts/${post.id}`)} disabled={remaining === 0}>
                        Xem bài &amp; gửi yêu cầu <Send className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </CardFooter>

                  {commentsOpen && (
                    <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/60 p-4">
                      {rootComments.length === 0 ? (
                        <p className="text-center text-xs text-neutral-500">Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện.</p>
                      ) : (
                        <div className="space-y-4">
                          {rootComments.map((comment) => {
                            const replies = postComments.filter((reply) => reply.parentId === comment.id);
                            return (
                              <div key={comment.id} className="space-y-2.5">
                                <div className="rounded-xl border border-neutral-200 bg-surface p-3">
                                  <UserMiniCard
                                    userId={comment.authorId}
                                    size="sm"
                                    subtitle={new Date(comment.createdAt).toLocaleString('vi-VN')}
                                  />
                                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">{comment.content}</p>
                                </div>
                                {replies.map((reply) => (
                                  <div key={reply.id} className="ml-6 flex gap-2 sm:ml-10">
                                    <CornerDownRight className="mt-3 h-4 w-4 shrink-0 text-neutral-400" />
                                    <div className="min-w-0 flex-1 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                                      <UserMiniCard
                                        userId={reply.authorId}
                                        size="sm"
                                        subtitle={`Phản hồi · ${new Date(reply.createdAt).toLocaleString('vi-VN')}`}
                                      />
                                      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <form
                        className="flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const content = (commentDrafts[post.id] || '').trim();
                          if (content) addCommentMutation.mutate({ postId: post.id, content });
                        }}
                      >
                        <Input
                          value={commentDrafts[post.id] || ''}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                          placeholder="Viết bình luận hoặc đặt câu hỏi cho Mentor..."
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          loading={addCommentMutation.isPending && addCommentMutation.variables?.postId === post.id}
                        >
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Gửi bình luận</span>
                        </Button>
                      </form>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </QueryBoundary>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tạo bài {postType === 'OFFER_MENTORING' ? 'Offer Mentoring' : 'Need Mentor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPost} className="space-y-4 py-2">
            <div className="rounded-lg border border-violet-100 bg-violet-50 p-3 text-sm text-violet-800">
              Loại bài được hệ thống tự gán theo role <strong>{currentRole === 'mentor' ? 'Mentor' : 'Student'}</strong>. Bạn không cần chọn loại bài.
            </div>
            <FormField label={currentRole === 'mentor' ? 'Câu giới thiệu nổi bật' : 'Tiêu đề'} required>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={currentRole === 'mentor' ? 'Ví dụ: Mình là Minh — Mentor backend luôn sẵn sàng đồng hành' : 'Ví dụ: Cần Mentor review kiến trúc Capstone'} required />
            </FormField>
            <FormField label={currentRole === 'mentor' ? 'Giới thiệu về bạn' : 'Nội dung'} required>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={5}
                placeholder={currentRole === 'mentor'
                  ? 'Bạn là ai, phong cách đồng hành của bạn thế nào và vì sao sinh viên nên kết nối với bạn?'
                  : 'Mô tả mục tiêu, vấn đề và sự hỗ trợ bạn đang cần...'}
                required
              />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={currentRole === 'mentor' ? 'Bạn có thể hỗ trợ về' : 'Lĩnh vực'} required>
                <Select value={postField} onChange={(event) => setPostField(event.target.value)} options={FIELD_OPTIONS.filter((option) => option.value !== 'all')} />
              </FormField>
              <FormField label="Hình thức">
                <Select value={mode} onChange={(event) => setMode(event.target.value as SupportMode)} options={MODE_OPTIONS} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Capacity" required>
                <Input type="number" min={1} max={20} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} required />
              </FormField>
              <FormField label="Deadline" required>
                <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>Hủy</Button>
              <Button type="submit" loading={createPostMutation.isPending}>
                <Send className="mr-1.5 h-4 w-4" /> Đăng lên Feed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentoringFeedPage;
