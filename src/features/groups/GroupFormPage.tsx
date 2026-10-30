import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateGroupQueries } from './groupQueries';
import type { JoinMode } from '@/types/entities';
import { GraduationCap, BookOpen, Gamepad2 } from 'lucide-react';

const groupSchema = z.object({
  name: z.string().min(5, 'Tên nhóm phải từ 5 ký tự trở lên'),
  purpose: z.string().min(1, 'Vui lòng chọn mục đích nhóm'),
  category: z.enum(['project', 'study', 'entertainment']).default('project'),
  topic: z.string().min(5, 'Chủ đề / Đề tài phải từ 5 ký tự trở lên'),
  targetGoal: z.string().default('Aim 8.5+'),
  campus: z.string().default('Hòa Lạc'),
  rolesNeeded: z.array(z.string()).default([]),
  skills: z.array(z.string()).min(1, 'Thêm ít nhất 1 kỹ năng cần thiết'),
  activityTime: z.array(z.any()).default([]),
  interests: z.string().default(''),
  joinMode: z.enum(['direct', 'approval']).default('approval'),
  memberLimit: z.number().min(2, 'Số lượng tối thiểu là 2').max(20, 'Tối đa 20 thành viên'),
});

type GroupFormInput = z.infer<typeof groupSchema>;

const categoryList = [
  { value: 'project', label: 'Đồ án & Capstone', icon: GraduationCap, purpose: 'Dự án' },
  { value: 'study', label: 'Môn học & Ôn thi', icon: BookOpen, purpose: 'Học tập' },
  { value: 'entertainment', label: 'Nhóm Giải trí & Sở thích', icon: Gamepad2, purpose: 'Sở thích' },
];

const campusOptions = [
  { value: 'Hòa Lạc', label: 'FPT Hòa Lạc (Hà Nội)' },
  { value: 'TP. Hồ Chí Minh', label: 'FPT TP. Hồ Chí Minh' },
  { value: 'Đà Nẵng', label: 'FPT Đà Nẵng' },
  { value: 'Cần Thơ', label: 'FPT Cần Thơ' },
  { value: 'Quy Nhơn', label: 'FPT Quy Nhơn' },
];

const quickSubjectPresets = {
  project: [
    { label: 'SWP391 (Web App)', text: 'Đồ án SWP391 - Xây dựng ứng dụng web' },
    { label: 'Capstone Project', text: 'Đồ án tốt nghiệp Capstone' },
    { label: 'PRJ301 (Java Web)', text: 'Mini Project PRJ301 Servlet & MVC2' },
    { label: 'PRN231 (.NET API)', text: 'Đồ án PRN231 RESTful Web API' },
  ],
  study: [
    { label: 'Ôn thi PE PRJ301', text: 'Luyện bộ đề thi thực hành PE Java Web' },
    { label: 'Cứu môn CSD201', text: 'Ôn tập thuật toán & Cấu trúc dữ liệu' },
    { label: 'Toán MAD101/MAS291', text: 'Giải đề thi toán rời rạc & xác suất' },
    { label: 'Luyện IELTS/TOEIC', text: 'Nhóm luyện nói tiếng Anh hằng ngày' },
  ],
  entertainment: [
    { label: 'Cầu lông giao lưu', text: 'Đánh cầu lông rèn luyện thể lực tối trong tuần' },
    { label: 'Board Game / Ma Sói', text: 'Tụ tập chơi Ma Sói / Avalon cuối tuần' },
    { label: 'Leo Rank Valorant', text: 'Team leo rank Kim Cương / Cao Thủ ban đêm' },
    { label: 'Cafe & Chụp ảnh', text: 'Khám phá quán cafe gần trường cuối tuần' },
  ],
};

const quickRolePresets = {
  project: ['Frontend React', 'Backend Node/Java', 'UI/UX Designer', 'Tester QA', 'Business Analyst'],
  study: ['Bạn cùng luyện đề', 'Người hỗ trợ sửa bug', 'Thành viên đặt câu hỏi'],
  entertainment: ['Bạn đánh đôi', 'Quản trò / Host', 'Initiator / Duelist', 'Thành viên cùng chơi'],
};

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
      category: 'project',
      topic: '',
      targetGoal: 'Aim 9.0+ (Săn học bổng)',
      campus: 'Hòa Lạc',
      rolesNeeded: ['Frontend Dev (React)', 'UI/UX Designer'],
      skills: ['React', 'TypeScript'],
      activityTime: [{ day: 'Sat', start: '14:00', end: '17:00' }],
      interests: '',
      joinMode: 'approval',
      memberLimit: 5,
    },
  });

  const selectedCategory = watch('category');
  const selectedJoinMode = watch('joinMode');

  const onSubmit = async (data: GroupFormInput) => {
    setLoading(true);
    try {
      const result = (await apiClient.post('/groups', data)) as any;
      await invalidateGroupQueries(queryClient);
      toast({ variant: 'success', title: 'Tạo nhóm thành công! Đang chuyển đến danh sách nhóm...' });
      navigate(`/groups/${result.id}`);
    } catch {
      toast({ variant: 'error', title: 'Tạo nhóm thất bại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Tạo nhóm đồ án, môn học hoặc giải trí"
        description="Thiết lập mục tiêu rõ ràng và các vị trí còn thiếu để tìm đúng đồng đội phù hợp, tránh tình trạng bùng việc"
        backHref="/groups"
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin thiết lập nhóm</CardTitle>
          <CardDescription>Giúp các bạn sinh viên khác thấy rõ kỳ vọng điểm số, lịch rảnh và vai trò cần tuyển</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* 1. Category Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-800">
                Thể loại nhóm <span className="text-red-500">*</span>:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {categoryList.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setValue('category', cat.value as any);
                        setValue('purpose', cat.purpose);
                        if (cat.value === 'project') setValue('targetGoal', 'Aim 9.0+ (Săn học bổng)');
                        if (cat.value === 'study') setValue('targetGoal', 'Chắc chắn qua môn');
                        if (cat.value === 'entertainment') setValue('targetGoal', 'Giao lưu vui vẻ & Xả stress');
                      }}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 text-brand-900 ring-1 ring-brand-500 font-semibold'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', isSelected ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500')}>
                        <Icon size={16} />
                      </div>
                      <div className="text-xs">
                        <div>{cat.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Group Name */}
            <FormField label="Tên nhóm" required error={errors.name?.message}>
              <Input
                placeholder="vd: Nhóm Đồ Án SWP391 - E-Commerce AI App..."
                {...register('name')}
                error={!!errors.name}
              />
            </FormField>

            {/* 3. Quick Presets for Topic */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800">
                  Chủ đề / Đề tài / Mục tiêu chính <span className="text-red-500">*</span>:
                </label>
                <span className="text-[11px] text-neutral-400">Gợi ý nhanh theo thể loại</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {quickSubjectPresets[selectedCategory]?.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setValue('topic', preset.text)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
              <FormField label="" error={errors.topic?.message}>
                <Input
                  placeholder="Mô tả cụ thể đề tài, môn học hoặc hoạt động..."
                  {...register('topic')}
                  error={!!errors.topic}
                />
              </FormField>
            </div>

            {/* 4. Campus & Target Goal (Commitment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Cơ sở / Campus">
                <Select
                  options={campusOptions}
                  value={watch('campus')}
                  onValueChange={(v) => setValue('campus', v)}
                />
              </FormField>

              <FormField label="Mục tiêu cam kết của nhóm">
                <Input
                  placeholder="vd: Aim 9.0+ / Qua môn / Vui vẻ..."
                  {...register('targetGoal')}
                />
              </FormField>
            </div>

            {/* 5. Role Matrix (Roles Needed) - Differentiator from FB */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800">
                  Vị trí / Vai trò nhóm đang cần tuyển:
                </label>
                <span className="text-[11px] text-neutral-400">Khác biệt với FB: Tránh thừa/thiếu kỹ năng</span>
              </div>
              <Controller
                control={control}
                name="rolesNeeded"
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickRolePresets[selectedCategory]?.map((r) => {
                        const hasRole = field.value?.includes(r);
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              if (hasRole) {
                                field.onChange(field.value.filter((item: string) => item !== r));
                              } else {
                                field.onChange([...(field.value || []), r]);
                              }
                            }}
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer',
                              hasRole
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            )}
                          >
                            {hasRole ? '✓ ' : '+ '} {r}
                          </button>
                        );
                      })}
                    </div>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Nhập vai trò khác và nhấn Enter (vd: Mobile Dev, Leader)..."
                      suggestions={['Frontend Dev', 'Backend Dev', 'UI/UX Designer', 'Tester']}
                    />
                  </div>
                )}
              />
            </div>

            {/* 6. Skills Required */}
            <div className="space-y-1.5">
              <FormField label="Kỹ năng mong muốn" required error={errors.skills?.message}>
                <Controller
                  control={control}
                  name="skills"
                  render={({ field }) => (
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Nhập kỹ năng và nhấn Enter..."
                      suggestions={['React', 'TypeScript', 'Node.js', 'Java', 'UI/UX', 'Cầu lông', 'Valorant']}
                    />
                  )}
                />
              </FormField>
            </div>

            {/* 7. Capacity & Activity Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Số lượng thành viên tối đa" required error={errors.memberLimit?.message}>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  {...register('memberLimit', { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Chế độ tiếp nhận thành viên" required>
                <Select
                  options={[
                    { value: 'approval', label: 'Cần duyệt hồ sơ (Khuyến nghị)' },
                    { value: 'direct', label: 'Vào trực tiếp khi còn chỗ' },
                  ]}
                  value={selectedJoinMode}
                  onValueChange={(val) => setValue('joinMode', val as JoinMode)}
                />
              </FormField>
            </div>

            {/* 8. Schedule Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-800">
                Khung giờ sinh hoạt / Ca rảnh nhóm:
              </label>
              <Controller
                control={control}
                name="activityTime"
                render={({ field }) => (
                  <ScheduleInput value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            {/* 9. Description & Specific Requirements */}
            <FormField label="Mô tả chi tiết & Yêu cầu làm việc">
              <Textarea
                placeholder="vd: Nhóm aim điểm 8.5+, họp định kỳ 2 buổi/tuần. Yêu cầu chủ động thông báo nếu bận, không seen bơ tin nhắn..."
                {...register('interests')}
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => navigate('/groups')}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                Đăng tạo nhóm ngay
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
