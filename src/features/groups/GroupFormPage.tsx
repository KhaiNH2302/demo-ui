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
import { cn } from '@/lib/cn';
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

            {/* 1. Quick Subject / Course Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800">
                  Môn học / Khóa học <span className="text-red-500">*</span>:
                </label>
                <span className="text-[11px] text-neutral-400">Bấm để chọn nhanh</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {['SWP391', 'PRJ301', 'CSD201', 'PRN231', 'MAS291', 'Capstone'].map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      const cur = watch('topic') || '';
                      if (!cur.includes(subj)) {
                        setValue('topic', cur ? `${subj} - ${cur}` : `Đồ án môn ${subj}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                  >
                    + {subj}
                  </button>
                ))}
              </div>
              <FormField label="Chủ đề / Tên đề tài" required error={errors.topic?.message}>
                <Input
                  placeholder="vd: Xây dựng ứng dụng web thương mại điện tử với Spring Boot và React..."
                  {...register('topic')}
                  error={!!errors.topic}
                />
              </FormField>
            </div>

            {/* 2. Purpose & Member Limit with Quick Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FormField label="Mục đích hoạt động" required error={errors.purpose?.message}>
                  <Select
                    options={purposeOptions}
                    value={selectedPurpose}
                    onValueChange={(v) => setValue('purpose', v)}
                  />
                </FormField>
                <div className="flex flex-wrap gap-1 pt-1">
                  {purposeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('purpose', opt.value)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                        selectedPurpose === opt.value
                          ? 'bg-brand-100 text-brand-800 border border-brand-300 font-semibold'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <FormField label="Số lượng thành viên tối đa" required error={errors.memberLimit?.message}>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    {...register('memberLimit', { valueAsNumber: true })}
                  />
                </FormField>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-neutral-500">Chọn nhanh:</span>
                  {[3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setValue('memberLimit', num)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer',
                        watch('memberLimit') === num
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                      )}
                    >
                      {num} người
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Skills with Quick Selection Tags */}
            <div className="space-y-1.5">
              <FormField label="Kỹ năng mong muốn ở thành viên" required error={errors.skills?.message}>
                <Controller
                  control={control}
                  name="skills"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {['React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'UI/UX', 'Tester', 'Python', 'DevOps'].map((sk) => {
                          const hasSkill = field.value?.includes(sk);
                          return (
                            <button
                              key={sk}
                              type="button"
                              onClick={() => {
                                if (hasSkill) {
                                  field.onChange(field.value.filter((s: string) => s !== sk));
                                } else {
                                  field.onChange([...(field.value || []), sk]);
                                }
                              }}
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer',
                                hasSkill
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                              )}
                            >
                              {hasSkill ? '✓ ' : '+ '} {sk}
                            </button>
                          );
                        })}
                      </div>
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Nhập kỹ năng khác và nhấn Enter..."
                        suggestions={['React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'UI/UX', 'Tester']}
                      />
                    </div>
                  )}
                />
              </FormField>
            </div>

            {/* 4. Common Schedule Shifts & Custom Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800">
                  Thời gian hoạt động / Ca rảnh nhóm:
                </label>
                <span className="text-[11px] text-neutral-400">Bấm chọn nhanh ca phổ biến</span>
              </div>
              <Controller
                control={control}
                name="activityTime"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'Tối T3 - T5 (19h-21h)', slot: { day: 'Tue', start: '19:00', end: '21:00' } },
                        { label: 'Tối T2 - T4 - T6 (20h-22h)', slot: { day: 'Mon', start: '20:00', end: '22:00' } },
                        { label: 'Sáng T7 - CN (9h-11h)', slot: { day: 'Sat', start: '09:00', end: '11:00' } },
                        { label: 'Chiều T7 - CN (14h-17h)', slot: { day: 'Sat', start: '14:00', end: '17:00' } },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            field.onChange([item.slot]);
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          🕒 {item.label}
                        </button>
                      ))}
                    </div>
                    <ScheduleInput value={field.value} onChange={field.onChange} />
                  </div>
                )}
              />
            </div>

            {/* 5. Simple Textarea 3-5 lines */}
            <FormField label="Mô tả nhóm & Yêu cầu cụ thể">
              <Textarea
                placeholder="vd: Nhóm aim điểm 8.5+, họp online 2 buổi/tuần vào tối T3-T5. Cần bạn chịu khó, chủ động trao đổi và hoàn thành task đúng hạn..."
                {...register('interests')}
                rows={4}
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
