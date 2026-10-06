import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Filter,
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
import type { MentorPost, SupportMode } from '@/types/entities';

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

  const postsQuery = useQuery({
    queryKey: ['mentoring', 'posts'],
    queryFn: () => apiClient.get<MentorPost[]>('/mentoring/posts'),
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
          description="Feed dùng chung để Student và Mentor tìm thấy nhau qua các bài đăng mentoring."
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring', href: '/mentoring' }, { label: 'Feed' }]}
          actions={
            <Button onClick={() => setComposerOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo bài
            </Button>
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
              ? 'Bạn muốn nhận hỗ trợ chủ đề nào? Hãy đăng Offer Mentoring...'
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
          <div className="mx-auto max-w-2xl space-y-4">
            {posts.map((post) => {
              const ownerId = post.authorId || post.mentorId;
              const isOwner = ownerId === user?.id;
              const total = post.capacity || post.slots || 1;
              const filled = post.filledCount || 0;
              const remaining = Math.max(total - filled, 0);
              const isNeed = post.postType === 'NEED_MENTOR';
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
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <MessageCircleMore className="h-4 w-4" />
                      {post.commentCount || 0} trao đổi
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
            <FormField label="Tiêu đề" required>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={currentRole === 'mentor' ? 'Ví dụ: Nhận hướng dẫn CSD201 và PRJ301' : 'Ví dụ: Cần Mentor review kiến trúc Capstone'} required />
            </FormField>
            <FormField label="Nội dung" required>
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} placeholder="Mô tả mục tiêu, kỹ năng hoặc phạm vi hỗ trợ..." required />
            </FormField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Lĩnh vực" required>
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
