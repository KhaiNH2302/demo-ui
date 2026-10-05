import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormField } from '@/components/shared/FormField';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Chip } from '@/components/ui/Chip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import {
  BookOpen,
  Plus,
  Users,
  Edit3,
  Calendar,
  Send,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MentorCourse, MentorPost, SupportMode } from '@/types/entities';

export const MentorPostsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const mentorId = currentUser?.id || 'usr_mentor_02';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'posts';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  // ==========================================
  // TAB 1: BÀI CHIA SẺ (Posts)
  // ==========================================
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postField, setPostField] = useState('Kỹ thuật phần mềm');
  const [postTags, setPostTags] = useState('');
  const [isEditingPost, setIsEditingPost] = useState<MentorPost | null>(null);

  const postsQuery = useQuery<MentorPost[]>({
    queryKey: ['mentor-posts', mentorId],
    queryFn: () => apiClient.get<MentorPost[]>(`/mentors/${mentorId}/posts`),
  });

  const createPostMutation = useMutation({
    mutationFn: (payload: Partial<MentorPost>) =>
      apiClient.post(`/mentors/${mentorId}/posts`, payload),
    onSuccess: () => {
      toast.success('Đã đăng bài chia sẻ thành công!');
      setPostTitle('');
      setPostContent('');
      setPostTags('');
      queryClient.invalidateQueries({ queryKey: ['mentor-posts', mentorId] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi đăng bài.'),
  });

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung bài chia sẻ.');
      return;
    }
    const tags = postTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    createPostMutation.mutate({
      title: postTitle.trim(),
      contentMd: postContent.trim(),
      field: postField,
      tags: tags.length > 0 ? tags : ['KinhNghiem', 'FPTU'],
    });
  };

  // ==========================================
  // TAB 2: KHÓA HỌC (Courses)
  // ==========================================
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MentorCourse | null>(null);
  const [courseFormData, setCourseFormData] = useState<{
    title: string;
    description: string;
    subjectOrField: string;
    mode: SupportMode;
    schedule: string;
    slots: number;
  }>({
    title: '',
    description: '',
    subjectOrField: 'CSD201 · Cấu trúc dữ liệu & Giải thuật',
    mode: 'online',
    schedule: 'Thứ 3 & Thứ 5, 19:30–21:30',
    slots: 10,
  });

  const coursesQuery = useQuery<MentorCourse[]>({
    queryKey: ['mentor-courses', mentorId],
    queryFn: () => apiClient.get<MentorCourse[]>(`/mentors/${mentorId}/courses`),
  });

  const saveCourseMutation = useMutation({
    mutationFn: (data: typeof courseFormData) => {
      if (editingCourse) {
        return apiClient.put(`/mentor-courses/${editingCourse.id}`, data);
      }
      return apiClient.post('/mentor-courses', { ...data, mentorId });
    },
    onSuccess: () => {
      toast.success(
        editingCourse ? 'Đã cập nhật thông tin khóa học!' : 'Tạo khóa học mới thành công!',
      );
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
      queryClient.invalidateQueries({ queryKey: ['mentor-courses', mentorId] });
    },
    onError: () => toast.error('Không thể lưu khóa học, vui lòng thử lại.'),
  });

  const toggleCourseStatusMutation = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      apiClient.put(`/mentor-courses/${id}`, { open }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái mở/đóng khóa học!');
      queryClient.invalidateQueries({ queryKey: ['mentor-courses', mentorId] });
    },
    onError: () => toast.error('Có lỗi xảy ra khi đổi trạng thái.'),
  });

  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseFormData({
      title: '',
      description: '',
      subjectOrField: 'CSD201 · Cấu trúc dữ liệu & Giải thuật',
      mode: 'online',
      schedule: 'Thứ 3 & Thứ 5, 19:30–21:30',
      slots: 10,
    });
    setIsCourseDialogOpen(true);
  };

  const handleOpenEditCourse = (course: MentorCourse) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      subjectOrField: course.subjectOrField,
      mode: course.mode,
      schedule: course.schedule,
      slots: course.slots,
    });
    setIsCourseDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Bài đăng & Khóa học"
        description="Quản lý bài chia sẻ học thuật và các khóa học / workshop bạn đang phụ trách"
        actions={
          activeTab === 'courses' ? (
            <Button onClick={handleOpenCreateCourse} leftIcon={<Plus className="w-4 h-4" />}>
              Mở khóa học mới
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">
            Bài chia sẻ ({postsQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="courses">
            Khóa học &amp; Lớp ôn thi ({coursesQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BÀI CHIA SẺ */}
        <TabsContent value="posts" className="space-y-6 pt-4">
          {/* Post Composer giống Knowledge */}
          <Card className="p-5 border-neutral-200 dark:border-neutral-800">
            <form onSubmit={handlePublishPost} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Viết bài chia sẻ kinh nghiệm mới
                </span>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Tiêu đề bài chia sẻ (ví dụ: Kinh nghiệm ôn thi Practical CSD201 đạt 9+...)"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="font-medium"
                  required
                />

                <Textarea
                  rows={4}
                  placeholder="Nội dung chia sẻ: lời khuyên, checklist chuẩn bị đồ án, lưu ý làm bài thi thực hành..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Select
                    value={postField}
                    onChange={(e) => setPostField(e.target.value)}
                    options={[
                      { label: 'Kỹ thuật phần mềm', value: 'Kỹ thuật phần mềm' },
                      { label: 'Thuật toán & Cấu trúc dữ liệu', value: 'Thuật toán & Cấu trúc dữ liệu' },
                      { label: 'Phát triển Web (Java/React)', value: 'Phát triển Web (Java/React)' },
                      { label: 'An toàn thông tin', value: 'An toàn thông tin' },
                      { label: 'Trí tuệ nhân tạo', value: 'Trí tuệ nhân tạo' },
                    ]}
                  />

                  <Input
                    placeholder="Tags cách nhau bởi dấu phẩy (CSD201, SWP391...)"
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={createPostMutation.isPending}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Đăng bài chia sẻ
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts Feed */}
          <QueryBoundary queries={[postsQuery]}>
            {postsQuery.data && postsQuery.data.length === 0 ? (
              <EmptyState
                title="Chưa có bài chia sẻ nào"
                description="Hãy chia sẻ kinh nghiệm đầu tiên của bạn cho các bạn sinh viên!"
              />
            ) : (
              <div className="space-y-4">
                {postsQuery.data?.map((post) => (
                  <Card key={post.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          user={{
                            id: mentorId,
                            fullName: currentUser?.fullName || 'Lê Thị Bình',
                            avatarUrl: currentUser?.avatarUrl,
                          }}
                          size="md"
                          className="ring-1 ring-brand-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {currentUser?.fullName || 'Lê Thị Bình'}
                            </span>
                            <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                              Mentor
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>{post.field || 'Kỹ thuật phần mềm'}</span>
                            <span>·</span>
                            <span>Mới đăng</span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-xs">
                        Bài chia sẻ
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                        {post.contentMd || post.content}
                      </p>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((t) => (
                          <Chip key={t} size="sm">
                            #{t}
                          </Chip>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span>{post.likeCount || 0} thích</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentCount || 0} bình luận</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          toast.success('Đã sao chép liên kết bài viết');
                        }}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="Chia sẻ"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* TAB 2: KHÓA HỌC */}
        <TabsContent value="courses" className="space-y-6 pt-4">
          <QueryBoundary queries={[coursesQuery]}>
            {coursesQuery.data && coursesQuery.data.length === 0 ? (
              <EmptyState
                title="Chưa có khóa học nào"
                description="Bạn chưa mở khóa học hoặc workshop nào. Hãy tạo khóa học đầu tiên để học viên đăng ký!"
                action={
                  <Button onClick={handleOpenCreateCourse} leftIcon={<Plus className="w-4 h-4" />}>
                    Mở khóa học mới
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {coursesQuery.data?.map((course) => {
                  const isFull = course.enrolled >= course.slots;
                  return (
                    <Card key={course.id} className="flex flex-col justify-between">
                      <CardHeader className="space-y-2 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="truncate max-w-[200px]">
                            {course.subjectOrField}
                          </Badge>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              {course.open ? 'Đang mở' : 'Đã đóng'}
                            </span>
                            <Switch
                              checked={course.open}
                              onCheckedChange={(checked) =>
                                toggleCourseStatusMutation.mutate({
                                  id: course.id,
                                  open: checked,
                                })
                              }
                            />
                          </div>
                        </div>

                        <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                          {course.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3 flex-1 pb-4">
                        {course.description && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}

                        <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">Hình thức:</span>
                            <Badge variant="outline" className="capitalize text-[11px]">
                              {course.mode}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Lịch học:
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                              {course.schedule}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Sĩ số học viên:
                            </span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                              {course.enrolled} / {course.slots} slot
                            </span>
                          </div>

                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? 'bg-amber-500' : 'bg-brand-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((course.enrolled / course.slots) * 100),
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCourse(course)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Chỉnh sửa thông tin
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Chỉnh sửa khóa học' : 'Mở khóa học / lớp ôn tập mới'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCourseMutation.mutate(courseFormData);
            }}
            className="space-y-4 py-2"
          >
            <FormField label="Tiêu đề khóa học / buổi workshop" required>
              <Input
                placeholder="Ví dụ: Ôn tập Practical CSD201 & Cây AVL..."
                value={courseFormData.title}
                onChange={(e) =>
                  setCourseFormData({ ...courseFormData, title: e.target.value })
                }
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Môn học / Lĩnh vực" required>
                <Input
                  placeholder="CSD201, PRJ301, Web..."
                  value={courseFormData.subjectOrField}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      subjectOrField: e.target.value,
                    })
                  }
                  required
                />
              </FormField>

              <FormField label="Số slot tối đa" required>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={courseFormData.slots}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      slots: Number(e.target.value),
                    })
                  }
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Hình thức học">
                <Select
                  value={courseFormData.mode}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      mode: e.target.value as SupportMode,
                    })
                  }
                  options={[
                    { label: 'Online qua Google Meet', value: 'online' },
                    { label: 'Offline tại Campus', value: 'offline' },
                    { label: 'Linh hoạt', value: 'chat' },
                  ]}
                />
              </FormField>

              <FormField label="Lịch học dự kiến" required>
                <Input
                  placeholder="Ví dụ: Tối T3 & T5, 19:30–21:30"
                  value={courseFormData.schedule}
                  onChange={(e) =>
                    setCourseFormData({
                      ...courseFormData,
                      schedule: e.target.value,
                    })
                  }
                  required
                />
              </FormField>
            </div>

            <FormField label="Mô tả nội dung & Mục tiêu khóa học">
              <Textarea
                rows={3}
                placeholder="Nêu rõ kiến thức trọng tâm, tài liệu cung cấp và đối tượng học viên phù hợp..."
                value={courseFormData.description}
                onChange={(e) =>
                  setCourseFormData({
                    ...courseFormData,
                    description: e.target.value,
                  })
                }
              />
            </FormField>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCourseDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" loading={saveCourseMutation.isPending}>
                {editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorPostsPage;
