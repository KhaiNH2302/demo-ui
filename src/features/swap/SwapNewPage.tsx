import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { FormField } from '@/components/shared/FormField';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import type { ScheduleSlot } from '@/types/entities';

const swapSchema = z
  .object({
    offeringId: z.string().min(1, 'Vui lòng chọn môn học'),
    currentClassCode: z.string().min(2, 'Vui lòng nhập mã lớp hiện tại (vd: SE1601)').toUpperCase(),
    targetClassCode: z.string().min(2, 'Vui lòng nhập mã lớp muốn đổi (vd: SE1602)').toUpperCase(),
    schedule: z
      .array(
        z.object({
          day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
          start: z.string(),
          end: z.string(),
        })
      )
      .optional(),
    acknowledgedDisclaimer: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải xác nhận đã đọc và hiểu tuyên bố trách nhiệm học vụ',
    }),
  })
  .refine((data) => data.currentClassCode !== data.targetClassCode, {
    message: 'Mã lớp muốn đổi phải khác mã lớp hiện tại',
    path: ['targetClassCode'],
  });

type SwapFormInput = z.infer<typeof swapSchema>;

export default function SwapNewPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateReqId, setDuplicateReqId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const offeringOptions = seedCourseOfferings.map((o) => ({
    value: o.id,
    label: `${o.courseCode} — ${o.courseName} (${o.term})`,
  }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SwapFormInput>({
    resolver: zodResolver(swapSchema),
    defaultValues: {
      offeringId: 'off_01',
      currentClassCode: '',
      targetClassCode: '',
      schedule: [],
      acknowledgedDisclaimer: false,
    },
  });

  const selectedOffering = watch('offeringId');

  const onSubmit = async (data: SwapFormInput) => {
    setLoading(true);
    setErrorMessage(null);
    setDuplicateReqId(null);
    try {
      const result = (await apiClient.post('/swap-requests', data)) as any;
      toast({ variant: 'success', title: 'Tạo bài đăng đổi lớp thành công!' });
      navigate(`/swap/${result.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Không thể tạo yêu cầu đổi lớp');
      if (apiErr.details?.existingRequestId) {
        setDuplicateReqId(apiErr.details.existingRequestId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <DisclaimerBanner />

      <PageHeader
        title="Tạo bài đăng đổi lớp mới"
        description="Đăng thông tin mã lớp bạn đang học và mã lớp bạn có nhu cầu chuyển sang"
        backHref="/swap"
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin yêu cầu đổi lớp</CardTitle>
          <CardDescription>Điền chính xác mã lớp theo lịch học của trường</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMessage && (
              <Alert tier="danger" onClose={() => setErrorMessage(null)}>
                <div>
                  <p>{errorMessage}</p>
                  {duplicateReqId && (
                    <Link to={`/swap/${duplicateReqId}`} className="font-bold underline mt-1 block">
                      Xem yêu cầu đang mở của bạn tại đây →
                    </Link>
                  )}
                </div>
              </Alert>
            )}

            <FormField label="Môn học / Lớp học phần" required error={errors.offeringId?.message}>
              <Select
                options={offeringOptions}
                value={selectedOffering}
                onValueChange={(val) => setValue('offeringId', val)}
                error={!!errors.offeringId}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Mã lớp hiện tại"
                required
                error={errors.currentClassCode?.message}
                helperText="Ví dụ: SE1601"
              >
                <Input
                  placeholder="Mã lớp bạn đang có..."
                  {...register('currentClassCode')}
                  error={!!errors.currentClassCode}
                />
              </FormField>

              <FormField
                label="Mã lớp muốn đổi"
                required
                error={errors.targetClassCode?.message}
                helperText="Ví dụ: SE1602"
              >
                <Input
                  placeholder="Mã lớp bạn muốn chuyển vào..."
                  {...register('targetClassCode')}
                  error={!!errors.targetClassCode}
                />
              </FormField>
            </div>

            <FormField
              label="Lịch học tự khai (Tùy chọn)"
              helperText="Khai báo khung giờ giúp thuật toán so sánh với lịch của các bạn sinh viên khác"
            >
              <Controller
                control={control}
                name="schedule"
                render={({ field }) => (
                  <ScheduleInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>

            <div className="pt-2 border-t border-neutral-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-700">
                <input
                  type="checkbox"
                  className="rounded border-neutral-300 text-brand-500 mt-0.5"
                  {...register('acknowledgedDisclaimer')}
                />
                <span className="leading-relaxed">
                  Tôi xác nhận đã hiểu rằng SCS <strong>không tự động cập nhật dữ liệu với nhà trường</strong>. Khi tìm được đối tác đối ứng, hai bên sẽ tự chịu trách nhiệm liên hệ phòng đào tạo để hoàn tất thủ tục.
                </span>
              </label>
              {errors.acknowledgedDisclaimer && (
                <p className="text-[11px] text-[#b3261e] mt-1">{errors.acknowledgedDisclaimer.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => navigate('/swap')}>
                Hủy
              </Button>
              <Button type="submit" loading={loading}>
                Đăng bài đổi lớp
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
