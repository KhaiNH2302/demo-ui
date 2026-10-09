import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateGroupQueries } from './groupQueries';
import type { JoinMode } from '@/types/entities';

const groupSchema = z.object({
  name: z.string().min(5, 'Tên nhóm phải từ 5 ký tự trở lên'),
  purpose: z.string().min(1, 'Vui lòng chọn mục đích nhóm'),
  topic: z.string().min(5, 'Chủ đề / Đề tài phải từ 5 ký tự trở lên'),
  skills: z.array(z.string()).min(1, 'Thêm ít nhất 1 kỹ năng cần thiết'),
  activityTime: z.array(z.any()).default([]),
  interests: z.string().default(''),
  joinMode: z.enum(['direct', 'approval']).default('approval'),
  memberLimit: z.number().min(2, 'Số lượng tối thiểu là 2').max(20, 'Tối đa 20 thành viên'),
});

type GroupFormInput = z.infer<typeof groupSchema>;

const purposeOptions = [
  { value: 'Học tập', label: 'Học tập' },
  { value: 'Dự án', label: 'Đồ án / Dự án' },
  { value: 'Kỹ năng', label: 'Rèn luyện kỹ năng' },
  { value: 'Sở thích', label: 'Sở thích & Giao lưu' },
];

export default function GroupFormPage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupFormInput>({
    resolver: zodResolver(groupSchema) as any,
    defaultValues: {
      name: '',
      purpose: 'Dự án',
      topic: '',
      skills: ['React', 'TypeScript'],
      activityTime: [{ day: 'Sat', start: '14:00', end: '17:00' }],
      interests: '',
      joinMode: 'approval',
      memberLimit: 5,
    },
  });

  const selectedPurpose = watch('purpose');
  const selectedJoinMode = watch('joinMode');

  const onSubmit = async (data: GroupFormInput) => {
    setLoading(true);
    try {
      const result = (await apiClient.post('/groups', data)) as any;
      await invalidateGroupQueries(queryClient);
      toast({ variant: 'success', title: 'Tạo nhóm thành công! Đang chuyển đến phần gợi ý thành viên AI...' });
      navigate(`/groups/${result.id}/manage?tab=suggestions`);
    } catch {
      toast({ variant: 'error', title: 'Tạo nhóm thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Tạo nhóm kết nối & Đồ án mới"
        description="Thiết lập thông tin nhóm và tiêu chí để tìm kiếm các thành viên phù hợp"
        backHref="/groups"
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhóm</CardTitle>
          <CardDescription>Các thông tin sẽ hiển thị công khai để sinh viên tìm kiếm</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Tên nhóm" required error={errors.name?.message}>
              <Input
                placeholder="vd: Nhóm Đồ Án SWP391 - E-Commerce App..."
                {...register('name')}
                error={!!errors.name}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Mục đích hoạt động" required error={errors.purpose?.message}>
                <Select
                  options={purposeOptions}
                  value={selectedPurpose}
                  onValueChange={(v) => setValue('purpose', v)}
                />
              </FormField>

              <FormField label="Số lượng thành viên tối đa" required error={errors.memberLimit?.message}>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  {...register('memberLimit', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <FormField label="Chủ đề / Đề tài chính" required error={errors.topic?.message}>
              <Input
                placeholder="vd: Xây dựng ứng dụng web thương mại điện tử với Spring Boot và React..."
                {...register('topic')}
                error={!!errors.topic}
              />
            </FormField>

            <FormField label="Kỹ năng mong muốn ở thành viên" required error={errors.skills?.message}>
              <Controller
                control={control}
                name="skills"
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={['React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'UI/UX', 'Tester']}
                  />
                )}
              />
            </FormField>

            <FormField label="Thời gian hoạt động nhóm">
              <Controller
                control={control}
                name="activityTime"
                render={({ field }) => (
                  <ScheduleInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            <FormField label="Sở thích & Yêu cầu khác (Tùy chọn)">
              <Textarea
                placeholder="vd: Ưu tiên các bạn nghiêm túc, có trách nhiệm đúng deadline..."
                {...register('interests')}
                rows={3}
              />
            </FormField>

            <FormField label="Chế độ tiếp nhận thành viên" required>
              <RadioGroup
                value={selectedJoinMode}
                onValueChange={(val) => setValue('joinMode', val as JoinMode)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
              >
                <label className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="approval" />
                  <div>
                    <div className="text-xs font-semibold">Cần xét duyệt (Khuyến nghị)</div>
                    <div className="text-[11px] text-neutral-400">Chủ nhóm duyệt từng đơn xin tham gia</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <RadioGroupItem value="direct" />
                  <div>
                    <div className="text-xs font-semibold">Tham gia trực tiếp</div>
                    <div className="text-[11px] text-neutral-400">Tự động vào nhóm nếu còn chỗ</div>
                  </div>
                </label>
              </RadioGroup>
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => navigate('/groups')}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                Tạo nhóm & Tìm thành viên
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
