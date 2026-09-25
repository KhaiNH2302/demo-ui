import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { FileUploader } from '@/components/shared/FileUploader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { apiClient, type ApiError } from '@/lib/apiClient';
import type { PostType, KnowledgePost } from '@/types/entities';

const subjectOptions = [
  { value: 'CSD201', label: 'CSD201 (Cấu trúc dữ liệu & Giải thuật)' },
  { value: 'PRJ301', label: 'PRJ301 (Lập trình Java Web)' },
  { value: 'SWP391', label: 'SWP391 (Đồ án phát triển phần mềm)' },
  { value: 'DBI202', label: 'DBI202 (Hệ cơ sở dữ liệu)' },
  { value: 'SWE201', label: 'SWE201 (Nhập môn Kỹ nghệ phần mềm)' },
];

const postFormSchema = z.object({
  type: z.enum(['experience', 'question', 'document', 'discussion']),
  title: z.string().min(5, 'Tiêu đề bài viết phải từ 5 ký tự trở lên'),
  contentMd: z.string().min(20, 'Nội dung bài viết phải từ 20 ký tự trở lên'),
  subject: z.string().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.any()).default([]),
  visibility: z.enum(['school', 'cross_school']).default('school'),
});

type PostFormData = z.infer<typeof postFormSchema>;

export default function KnowledgePostFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [createdPost, setCreatedPost] = useState<KnowledgePost | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema) as any,
    defaultValues: {
      type: 'experience',
      title: '',
      contentMd: '',
      subject: 'CSD201',
      tags: ['CSD201', 'Tips'],
      attachments: [],
      visibility: 'school',
    },
  });

  const selectedType = watch('type');
  const selectedSubject = watch('subject');
  const selectedVisibility = watch('visibility');

  useEffect(() => {
    if (isEdit && id) {
      apiClient.get(`/posts/${id}`).then((res: any) => {
        if (res.post) {
          reset({
            type: res.post.type,
            title: res.post.title,
            contentMd: res.post.contentMd,
            subject: res.post.subject || '',
            tags: res.post.tags || [],
            attachments: res.post.attachments || [],
            visibility: res.post.visibility || 'school',
          });
        }
      });
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        const result = (await apiClient.put(`/posts/${id}`, data)) as any;
        setCreatedPost(result);
      } else {
        const result = (await apiClient.post('/posts', data)) as any;
        setCreatedPost(result);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  // Result view after submit
  if (createdPost) {
    const isPending = createdPost.status === 'PendingReview';

    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card className="p-8 text-center shadow-lg">
          <div className="flex flex-col items-center">
            {isPending ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tier-attention-bg text-tier-attention-dot mb-4">
                <Clock size={36} />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tier-success-bg text-tier-success-dot mb-4">
                <CheckCircle2 size={36} />
              </div>
            )}

            <h2 className="text-xl font-bold text-neutral-900">
              {isPending ? 'Bài viết đang chờ kiểm duyệt' : 'Bài viết đã được đăng thành công'}
            </h2>

            <p className="text-xs text-neutral-600 mt-2 max-w-md leading-relaxed">
              {isPending
                ? 'Nội dung của bạn đã được gửi đến ban quản trị để kiểm duyệt theo chính sách an toàn học tập. Bài viết sẽ hiển thị công khai trên feed ngay sau khi được duyệt.'
                : 'Bài viết của bạn đã được xuất bản và các bạn sinh viên trong trường có thể đọc, tải tài liệu và phản hồi thảo luận.'}
            </p>

            <div className="flex items-center gap-3 mt-8">
              <Link to="/knowledge">
                <Button variant="outline" size="sm">
                  Về trang Kiến thức
                </Button>
              </Link>
              {!isPending && (
                <Link to={`/knowledge/${createdPost.id}`}>
                  <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                    Xem bài viết
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={isEdit ? 'Chỉnh sửa bài viết' : 'Soạn bài chia sẻ kiến thức mới'}
        description="Đăng kinh nghiệm, câu hỏi giải đáp hoặc tài liệu học phần cho cộng đồng sinh viên"
        backHref="/knowledge"
      />

      <Card>
        <CardHeader>
          <CardTitle>Nội dung bài đăng</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Loại bài viết" required>
              <RadioGroup
                value={selectedType}
                onValueChange={(val) => setValue('type', val as PostType)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
              >
                <label className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="experience" />
                  <span className="text-xs font-medium">Kinh nghiệm</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="question" />
                  <span className="text-xs font-medium">Câu hỏi</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="document" />
                  <span className="text-xs font-medium">Tài liệu</span>
                </label>
              </RadioGroup>
            </FormField>

            <FormField label="Tiêu đề bài viết" required error={errors.title?.message}>
              <Input
                placeholder="vd: Tổng hợp đề thi và kinh nghiệm ôn tập môn CSD201 điểm 9+..."
                {...register('title')}
                error={!!errors.title}
              />
            </FormField>

            <FormField label="Môn học liên quan">
              <Select
                options={subjectOptions}
                value={selectedSubject}
                onValueChange={(val) => setValue('subject', val)}
              />
            </FormField>

            <FormField
              label="Nội dung bài viết (Hỗ trợ định dạng Markdown)"
              required
              error={errors.contentMd?.message}
            >
              <Textarea
                rows={10}
                placeholder="Nhập nội dung chia sẻ chi tiết..."
                {...register('contentMd')}
                error={!!errors.contentMd}
              />
            </FormField>

            <FormField label="Tags / Từ khóa tìm kiếm">
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={['CSD201', 'PRJ301', 'SWP391', 'Java', 'React', 'Tips', 'Quiz']}
                  />
                )}
              />
            </FormField>

            <FormField label="Tệp đính kèm (PDF, DOCX, ZIP... tối đa 10MB)">
              <Controller
                control={control}
                name="attachments"
                render={({ field }) => (
                  <FileUploader
                    multiple
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormField>

            <FormField label="Quyền hiển thị bài viết">
              <RadioGroup
                value={selectedVisibility}
                onValueChange={(val) => setValue('visibility', val as 'school' | 'cross_school')}
                className="flex items-center gap-6 pt-1"
              >
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="school" />
                  <span>Trong trường (Chỉ sinh viên FPT)</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <RadioGroupItem value="cross_school" />
                  <span>Liên trường (Công khai)</span>
                </label>
              </RadioGroup>
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => navigate('/knowledge')}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'Lưu bài viết' : 'Đăng bài'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
