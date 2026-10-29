import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CornerDownRight,
  DollarSign,
  GraduationCap,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  MessageCircleMore,
  Newspaper,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { toast } from '@/components/ui/Toast';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { Comment, MentorPost, SupportMode } from '@/types/entities';

const SUBJECT_OPTIONS = [
  { label: 'Tất cả môn học', value: 'all' },
  { label: 'CSD201 - Data Structures & Algorithms', value: 'CSD201' },
  { label: 'PRJ301 - Java Web Application', value: 'PRJ301' },
  { label: 'SWE201c - Software Engineering', value: 'SWE201c' },
  { label: 'MAS291 - Statistics & Probability', value: 'MAS291' },
  { label: 'PRF192 - Programming with C', value: 'PRF192' },
  { label: 'MAD101 - Discrete Mathematics', value: 'MAD101' },
  { label: 'SWP391 - Software Project', value: 'SWP391' },
];

const MODE_FILTER_OPTIONS = [
  { label: 'Tất cả hình thức học', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Trực tiếp tại trường (Offline)', value: 'offline' },
  { label: 'Trao đổi qua Chat', value: 'chat' },
];

const TIME_SLOT_OPTIONS = [
  'Tối Thứ 2 & Thứ 4 (19:30 - 21:00)',
  'Tối Thứ 3 & Thứ 5 (19:30 - 21:00)',
  'Chiều Thứ 7 & Chủ Nhật (14:00 - 16:30)',
  'Linh hoạt thỏa thuận theo tuần',
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
    (!roleOverride &&
      (location.pathname.startsWith('/mentor') || user?.roles?.some((role) => role.toLowerCase() === 'mentor')));

  // Feed Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEED_MENTOR' | 'OFFER_MENTORING'>('ALL');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  // Dedicated Create Post View State
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createPostTab, setCreatePostTab] = useState<'need' | 'offer'>(isMentorContext ? 'offer' : 'need');

  // Tab 1: Form "Tìm Mentor" (Need Mentor)
  const [needTitle, setNeedTitle] = useState('');
  const [needContent, setNeedContent] = useState('');
  const [needSubject, setNeedSubject] = useState('CSD201');
  const [needSlots, setNeedSlots] = useState<string[]>([TIME_SLOT_OPTIONS[0]]);
  const [needModes, setNeedModes] = useState<string[]>(['online']);
  const [needFee, setNeedFee] = useState('100.000');
  const [needDeadline, setNeedDeadline] = useState(defaultDeadline);

  // Tab 2: Form "Mở lớp kèm" (Offer Mentoring)
  const [offerSubject, setOfferSubject] = useState('CSD201');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerSessions, setOfferSessions] = useState(8);
  const [offerFee, setOfferFee] = useState('120.000');
  const [offerSchedule, setOfferSchedule] = useState('Tối Thứ 3 & Thứ 5 (19:30 - 21:00)');
  const [offerModes, setOfferModes] = useState<string[]>(['online']);
  const [offerCapacity, setOfferCapacity] = useState(5);
  const [offerTrialLesson, setOfferTrialLesson] = useState(true);
  const [offerDeadline, setOfferDeadline] = useState(defaultDeadline);

  // Send request dialog
  const [requestMentorId, setRequestMentorId] = useState<string | null>(null);
  const [requestPostId, setRequestPostId] = useState<string | null>(null);

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

  const createNeedPostMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentorPost>('/mentoring/posts', {
        title: needTitle.trim(),
        content: needContent.trim(),
        contentMd: needContent.trim(),
        field: needSubject,
        mode: needModes[0] || 'online',
        deadline: needDeadline,
        postType: 'NEED_MENTOR',
        authorRole: 'student',
        tags: [needSubject, ...needModes, `${needFee}đ/buổi`],
      }),
    onSuccess: () => {
      toast.success('Đã đăng bài Tìm Mentor (Need Mentor) thành công!');
      setIsCreatingPost(false);
      setNeedTitle('');
      setNeedContent('');
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'posts'] });
    },
    onError: () => toast.error('Không thể đăng bài. Vui lòng kiểm tra nội dung và thử lại.'),
  });

  const createOfferPostMutation = useMutation({
    mutationFn: () =>
      apiClient.post<MentorPost>('/mentoring/posts', {
        title: `Mở lớp kèm môn ${offerSubject} (${offerSessions} buổi) - ${offerSchedule}`,
        content: `${offerDescription.trim()}\n\n• Lịch học: ${offerSchedule}\n• Số buổi: ${offerSessions} buổi\n• Học phí: ${offerFee}đ/buổi\n• Có học thử: ${offerTrialLesson ? 'Có (01 buổi miễn phí)' : 'Không'}`,
        contentMd: offerDescription.trim(),
        field: offerSubject,
        mode: offerModes[0] || 'online',
        capacity: offerCapacity,
        slots: offerCapacity,
        deadline: offerDeadline,
        postType: 'OFFER_MENTORING',
        authorRole: 'mentor',
        tags: [offerSubject, ...offerModes, `${offerFee}đ/buổi`, offerTrialLesson ? 'Có học thử' : ''],
      }),
    onSuccess: () => {
      toast.success('Đã đăng bài Mở lớp kèm (Offer Mentoring) thành công!');
      setIsCreatingPost(false);
      setOfferDescription('');
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

  // Filter posts (Bỏ hoàn toàn mục "Bài phù hợp", lọc theo Tab, Môn học, Hình thức học)
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (postsQuery.data || []).filter((post) => {
      if (activeTab === 'NEED_MENTOR' && post.postType !== 'NEED_MENTOR') return false;
      if (activeTab === 'OFFER_MENTORING' && post.postType !== 'OFFER_MENTORING') return false;

      if (subjectFilter !== 'all') {
        const text = (post.title + ' ' + (post.content || '') + ' ' + (post.field || '')).toUpperCase();
        if (!text.includes(subjectFilter.toUpperCase())) return false;
      }

      if (modeFilter !== 'all') {
        if (post.mode && String(post.mode).toLowerCase() !== modeFilter.toLowerCase()) return false;
      }

      if (q) {
        const searchable = [post.title, post.content, post.contentMd, post.field, ...(post.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [postsQuery.data, activeTab, subjectFilter, modeFilter, search]);

  const toggleSlot = (slot: string) => {
    setNeedSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  };

  const toggleNeedMode = (m: string) => {
    setNeedModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const toggleOfferMode = (m: string) => {
    setOfferModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleOpenRequest = (mentorId: string, postId: string) => {
    setRequestMentorId(mentorId);
    setRequestPostId(postId);
  };

  // MÀN HÌNH TẠO BÀI MENTORING RIÊNG BIỆT (KHÔNG DÙNG POPUP, GỒM 2 TAB)
  if (isCreatingPost) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreatingPost(false)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Quay lại Bảng tin Mentoring
        </Button>

        <div>
          <h1 className="text-page-title text-neutral-900">Tạo bài đăng Mentoring</h1>
          <p className="text-meta text-neutral-600 mt-1">
            Chọn mô hình phù hợp: Tìm Mentor hướng dẫn hoặc Mở lớp kèm học cho sinh viên khóa dưới.
          </p>
        </div>

        <Tabs value={createPostTab} onValueChange={(val) => setCreatePostTab(val as 'need' | 'offer')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="need" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Tab 1: Tìm Mentor (Need Mentor)</span>
            </TabsTrigger>
            <TabsTrigger value="offer" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Tab 2: Mở lớp kèm (Offer Mentoring)</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TÌM MENTOR (Cho mọi sinh viên & mentor) */}
          <TabsContent value="need" className="space-y-4 pt-2">
            <Card className="p-6 space-y-4">
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-caption">
                💡 <strong>Dành cho mọi sinh viên &amp; Mentor:</strong> Đăng nhu cầu cần anh chị khóa trên kèm môn khó, review đồ án hoặc giải đáp bài tập.
              </div>

              <div className="space-y-4">
                <FormField label="Môn học bạn cần hỗ trợ" required>
                  <Select
                    value={needSubject}
                    onChange={(e) => setNeedSubject(e.target.value)}
                    options={SUBJECT_OPTIONS.filter((s) => s.value !== 'all')}
                  />
                </FormField>

                <FormField label="Tiêu đề bài đăng" required>
                  <Input
                    value={needTitle}
                    onChange={(e) => setNeedTitle(e.target.value)}
                    placeholder="VD: Cần tìm Mentor kèm ôn thi Practical Exam CSD201 tuần tới"
                    required
                  />
                </FormField>

                <FormField label="Mô tả chi tiết nhu cầu học & mục tiêu" required>
                  <Textarea
                    rows={4}
                    value={needContent}
                    onChange={(e) => setNeedContent(e.target.value)}
                    placeholder="Mô tả phần kiến thức bạn đang bị hổng, mong muốn kèm 1-1 hay nhóm nhỏ, mục tiêu điểm số..."
                    required
                  />
                </FormField>

                {/* Khung giờ có thể học (Chọn nhiều) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-800 mb-2">
                    Khung giờ có thể học (Chọn nhiều) <span className="text-tier-danger-text">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOT_OPTIONS.map((slot) => {
                      const isSelected = needSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => toggleSlot(slot)}
                          className={`px-3 py-1.5 rounded-lg text-caption font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                              : 'bg-surface border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {isSelected && '✓ '} {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hình thức học (Chọn nhiều: Online, Gặp trực tiếp, Chat) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-800 mb-2">
                    Hình thức học mong muốn (Chọn nhiều) <span className="text-tier-danger-text">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'online', label: 'Online qua Google Meet / Zoom' },
                      { id: 'offline', label: 'Gặp trực tiếp tại trường (Offline)' },
                      { id: 'chat', label: 'Hỏi đáp qua Chat' },
                    ].map((m) => {
                      const isSelected = needModes.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleNeedMode(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-caption font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                              : 'bg-surface border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {isSelected && '✓ '} {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mức học phí mong muốn (đ/buổi - tùy chọn) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Mức học phí mong muốn (đ/buổi - Tùy chọn)">
                    <div className="relative">
                      <Input
                        value={needFee}
                        onChange={(e) => setNeedFee(e.target.value)}
                        placeholder="VD: 100.000 hoặc Thỏa thuận"
                      />
                      <span className="absolute right-3 top-2.5 text-caption text-neutral-400">VNĐ/buổi</span>
                    </div>
                  </FormField>

                  <FormField label="Thời hạn cần tìm Mentor" required>
                    <Input
                      type="date"
                      value={needDeadline}
                      onChange={(e) => setNeedDeadline(e.target.value)}
                    />
                  </FormField>
                </div>

                {/* Ghi chú UI: KHÔNG CÓ Ô SỐ CHỖ Ở TAB NÀY */}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-150">
                <Button variant="outline" onClick={() => setIsCreatingPost(false)}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!needTitle.trim() || !needContent.trim()) {
                      toast.error('Vui lòng nhập tiêu đề và mô tả nhu cầu');
                      return;
                    }
                    createNeedPostMutation.mutate();
                  }}
                  isLoading={createNeedPostMutation.isPending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Đăng bài Need Mentor
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: MỞ LỚP KÈM (Dành cho tài khoản Mentor) */}
          <TabsContent value="offer" className="space-y-4 pt-2">
            <Card className="p-6 space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-caption">
                ⭐ <strong>Dành riêng cho Mentor:</strong> Tạo lớp học kèm có lộ trình bài bản, số buổi và lịch học cố định cho sinh viên.
              </div>

              <div className="space-y-4">
                <FormField label="Môn học mở lớp kèm" required>
                  <Select
                    value={offerSubject}
                    onChange={(e) => setOfferSubject(e.target.value)}
                    options={SUBJECT_OPTIONS.filter((s) => s.value !== 'all')}
                  />
                </FormField>

                <FormField label="Mô tả nội dung & Lộ trình khóa học" required>
                  <Textarea
                    rows={4}
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    placeholder="Mô tả chi tiết những gì sinh viên sẽ học được, tài liệu cung cấp và phương pháp giải đề thi thực chiến..."
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Số buổi học" required>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={offerSessions}
                      onChange={(e) => setOfferSessions(Number(e.target.value))}
                    />
                  </FormField>

                  <FormField label="Học phí (đ/buổi - Chỉ hiển thị thông tin)" required>
                    <div className="relative">
                      <Input
                        value={offerFee}
                        onChange={(e) => setOfferFee(e.target.value)}
                        placeholder="120.000"
                      />
                      <span className="absolute right-3 top-2.5 text-caption text-neutral-400">VNĐ/buổi</span>
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Lịch học cố định" required>
                    <Input
                      value={offerSchedule}
                      onChange={(e) => setOfferSchedule(e.target.value)}
                      placeholder="VD: Tối Thứ 3 & Thứ 5 (19:30 - 21:00)"
                    />
                  </FormField>

                  <FormField label="Số chỗ nhận tối đa (Capacity)" required>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={offerCapacity}
                      onChange={(e) => setOfferCapacity(Number(e.target.value))}
                    />
                  </FormField>
                </div>

                {/* Hình thức học */}
                <div>
                  <label className="block text-sm font-medium text-neutral-800 mb-2">
                    Hình thức giảng dạy (Chọn nhiều) <span className="text-tier-danger-text">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'online', label: 'Online qua Google Meet / Zoom' },
                      { id: 'offline', label: 'Trực tiếp tại thư viện / phòng học' },
                      { id: 'chat', label: 'Hỗ trợ Q&A qua Chat' },
                    ].map((m) => {
                      const isSelected = offerModes.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleOfferMode(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-caption font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                              : 'bg-surface border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {isSelected && '✓ '} {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Checkbox Có học thử hay không */}
                <label className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerTrialLesson}
                    onChange={(e) => setOfferTrialLesson(e.target.checked)}
                    className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-emerald-950 block">
                      Có học thử miễn phí (Trial Session)
                    </span>
                    <span className="text-caption text-emerald-800">
                      Cho phép sinh viên tham gia 01 buổi đầu tiên để đánh giá sự phù hợp trước khi xác nhận học tiếp.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-150">
                <Button variant="outline" onClick={() => setIsCreatingPost(false)}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!offerDescription.trim()) {
                      toast.error('Vui lòng nhập mô tả lớp học kèm');
                      return;
                    }
                    createOfferPostMutation.mutate();
                  }}
                  isLoading={createOfferPostMutation.isPending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Đăng bài Mở lớp kèm
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // MÀN HÌNH BẢNG TIN (FEED MENTORING)
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!embedded && (
        <PageHeader
          title="Bảng tin Mentoring & Học kèm"
          description="Nền tảng cố vấn 2 chiều: Sinh viên đăng tìm Mentor và Mentor mở lớp kèm theo môn học trường."
          breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Tìm Mentor' }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/mentoring/browse')}>
                <Search className="mr-1.5 h-4 w-4" /> Danh sách Mentor
              </Button>
              <Button variant="outline" onClick={() => navigate('/mentoring/ai')}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Gợi ý AI
              </Button>
              <Button variant="primary" onClick={() => setIsCreatingPost(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Tạo bài đăng
              </Button>
            </div>
          }
        />
      )}

      {/* Quick Action Banner */}
      <Card className="border-violet-100 bg-gradient-to-r from-violet-50 to-surface">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Newspaper className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingPost(true)}
            className="min-h-11 flex-1 rounded-full border border-neutral-200 bg-surface px-4 text-left text-sm text-neutral-500 transition-colors hover:border-violet-300 hover:bg-violet-50/40 cursor-pointer"
          >
            {isMentorContext
              ? 'Mở lớp kèm môn mới hoặc tìm học viên cần hỗ trợ...'
              : 'Bạn đang cần kèm môn nào? Bấm vào đây để đăng nhu cầu...'}
          </button>
          <Button size="sm" onClick={() => setIsCreatingPost(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Đăng bài ngay
          </Button>
        </CardContent>
      </Card>

      {/* THANH BỘ LỌC TRÊN FEED: Nút chọn [Tất cả] / [Tìm Mentor] / [Mở lớp] + Lọc Môn học & Hình thức */}
      <Card className="p-4 space-y-3">
        {/* Row 1: Nút chọn 3 tab bài đăng */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả bài đăng' },
              { id: 'NEED_MENTOR', label: '🙋 Sinh viên tìm Mentor (Need Mentor)' },
              { id: 'OFFER_MENTORING', label: '🎓 Mentor mở lớp kèm (Offer Mentoring)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-caption font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white font-semibold shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-caption text-neutral-500">
            {filteredPosts.length} bài đăng phù hợp
          </span>
        </div>

        {/* Row 2: Search + Lọc theo Môn học + Lọc theo Hình thức học */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-150">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo chủ đề, từ khóa, người đăng..."
          />
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={SUBJECT_OPTIONS}
          />
          <Select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            options={MODE_FILTER_OPTIONS}
          />
        </div>
      </Card>

      {/* POSTS LIST */}
      <QueryBoundary query={postsQuery}>
        {filteredPosts.length === 0 ? (
          <Card className="p-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="font-semibold text-neutral-900">Không tìm thấy bài đăng phù hợp</p>
            <p className="mt-1 text-sm text-neutral-500">Hãy thử đổi bộ lọc môn học hoặc tạo bài đăng mới.</p>
          </Card>
        ) : (
          <div className="w-full space-y-4">
            {filteredPosts.map((post) => {
              const ownerId = post.authorId || post.mentorId;
              const isOwner = ownerId === user?.id;
              const total = post.capacity || post.slots || 5;
              const filled = post.filledCount || 0;
              const remaining = Math.max(total - filled, 0);
              const isNeed = post.postType === 'NEED_MENTOR';
              const postComments = (commentsQuery.data || []).filter((comment) => comment.postId === post.id);
              const rootComments = postComments.filter((comment) => !comment.parentId);
              const commentsOpen = Boolean(expandedComments[post.id]);

              return (
                <Card key={post.id} className="overflow-hidden shadow-2xs hover:border-neutral-300 transition-colors">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <UserMiniCard userId={ownerId} showMajor />
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge variant={isNeed ? 'attention' : 'brand'}>
                          {isNeed ? 'Tìm Mentor (Need Mentor)' : 'Mở lớp kèm (Offer Mentoring)'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">4.9</span>
                          <span className="text-neutral-400">· 24 đánh giá</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                        {post.content || post.contentMd}
                      </p>
                    </div>
                  </CardHeader>

                  {/* THIẾT KẾ THẺ BÀI (MENTORING CARD) TRỰC QUAN */}
                  <CardContent className="space-y-3 pb-4">
                    {/* Visual Attributes Pill Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-150 text-caption">
                      <div>
                        <span className="text-neutral-500 block">Mã môn học:</span>
                        <span className="font-bold text-brand-700">{post.field || 'CSD201'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Lịch học:</span>
                        <span className="font-semibold text-neutral-800">Tối T3 - T5</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Học phí:</span>
                        <span className="font-bold text-emerald-700">120.000đ/buổi</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">
                          {isNeed ? 'Hình thức:' : 'Chỗ còn lại:'}
                        </span>
                        {isNeed ? (
                          <span className="font-semibold text-neutral-800">{String(post.mode || 'Online')}</span>
                        ) : (
                          <span className="font-bold text-amber-700">Còn {remaining}/{total} chỗ</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="h-3 w-3" /> Có học thử
                      </span>
                      {post.mode && <Chip size="sm">Hình thức: {String(post.mode)}</Chip>}
                      <Chip size="sm">Khoá 8 buổi</Chip>
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={post.liked ? 'text-rose-600' : 'text-neutral-600'}
                        loading={likeMutation.isPending && likeMutation.variables?.postId === post.id}
                        onClick={() => likeMutation.mutate({ postId: post.id, liked: !post.liked })}
                      >
                        <Heart className={`mr-1.5 h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                        {post.likeCount || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-600"
                        onClick={() =>
                          setExpandedComments((current) => ({ ...current, [post.id]: !current[post.id] }))
                        }
                      >
                        <MessageCircleMore className="mr-1.5 h-4 w-4" />
                        {post.commentCount || 0} Bình luận
                      </Button>
                    </div>

                    {isOwner ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(isMentorContext ? '/mentor/requests' : '/mentoring/requests')}
                      >
                        Xem yêu cầu nhận được <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenRequest(ownerId || 'usr_mentor_01', post.id)}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Gửi yêu cầu kết nối
                      </Button>
                    )}
                  </CardFooter>

                  {/* COMMENTS EXPANDED */}
                  {commentsOpen && (
                    <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/60 p-4">
                      {rootComments.length === 0 ? (
                        <p className="text-center text-xs text-neutral-500">Chưa có bình luận. Hãy là người đầu tiên đặt câu hỏi!</p>
                      ) : (
                        <div className="space-y-3">
                          {rootComments.map((comment) => (
                            <div key={comment.id} className="rounded-xl border border-neutral-200 bg-surface p-3">
                              <UserMiniCard
                                userId={comment.authorId}
                                size="sm"
                                subtitle={new Date(comment.createdAt).toLocaleString('vi-VN')}
                              />
                              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{comment.content}</p>
                            </div>
                          ))}
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
                          onChange={(event) =>
                            setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                          }
                          placeholder="Viết câu hỏi hoặc trao đổi với người đăng..."
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          loading={addCommentMutation.isPending && addCommentMutation.variables?.postId === post.id}
                        >
                          <Send className="h-4 w-4" />
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

      {/* MỞ KHÓA DIALOG GỬI YÊU CẦU */}
      {requestMentorId && (
        <SendMentoringRequestDialog
          open={!!requestMentorId}
          onOpenChange={(open) => {
            if (!open) {
              setRequestMentorId(null);
              setRequestPostId(null);
            }
          }}
          mentorId={requestMentorId}
          sourcePostId={requestPostId || undefined}
        />
      )}
    </div>
  );
};

export default MentoringFeedPage;
