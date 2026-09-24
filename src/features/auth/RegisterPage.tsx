import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/shared/FormField';
import { apiClient, type ApiError } from '@/lib/apiClient';

const schoolOptions = [
  { value: 'Đại học FPT Hà Nội', label: 'Đại học FPT Hà Nội' },
  { value: 'Đại học FPT TP.HCM', label: 'Đại học FPT TP.HCM' },
  { value: 'Đại học FPT Đà Nẵng', label: 'Đại học FPT Đà Nẵng' },
  { value: 'Đại học FPT Quy Nhơn', label: 'Đại học FPT Quy Nhơn' },
  { value: 'Đại học FPT Cần Thơ', label: 'Đại học FPT Cần Thơ' },
];

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải từ 2 ký tự trở lên'),
    email: z.string().email('Email không đúng định dạng').refine((e) => e.endsWith('.edu.vn') || e.includes('@fpt'), {
      message: 'Vui lòng sử dụng email sinh viên trường (.edu.vn)',
    }),
    studentCode: z.string().min(6, 'MSSV không hợp lệ (vd: HE160001)'),
    school: z.string().min(1, 'Vui lòng chọn trường học'),
    password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
    confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn cần đồng ý với điều khoản sử dụng',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      studentCode: '',
      school: 'Đại học FPT Hà Nội',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const selectedSchool = watch('school');

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await apiClient.post('/auth/register', data);
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Đăng ký không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Tạo tài khoản mới</CardTitle>
        <CardDescription>Tham gia cộng đồng kết nối sinh viên SCS</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <Alert tier="danger" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <FormField label="Họ và tên" required error={errors.fullName?.message}>
            <Input placeholder="vd: Nguyễn Văn An" {...register('fullName')} error={!!errors.fullName} />
          </FormField>

          <FormField label="Email trường (.edu.vn)" required error={errors.email?.message}>
            <Input type="email" placeholder="vd: annvhe160001@fpt.edu.vn" {...register('email')} error={!!errors.email} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Mã số sinh viên (MSSV)" required error={errors.studentCode?.message}>
              <Input placeholder="vd: HE160001" {...register('studentCode')} error={!!errors.studentCode} />
            </FormField>

            <FormField label="Trường" required error={errors.school?.message}>
              <Select
                options={schoolOptions}
                value={selectedSchool}
                onValueChange={(val) => setValue('school', val)}
                error={!!errors.school}
              />
            </FormField>
          </div>

          <FormField label="Mật khẩu" required error={errors.password?.message}>
            <Input type="password" placeholder="••••••••" {...register('password')} error={!!errors.password} />
          </FormField>

          <FormField label="Xác nhận mật khẩu" required error={errors.confirmPassword?.message}>
            <Input type="password" placeholder="••••••••" {...register('confirmPassword')} error={!!errors.confirmPassword} />
          </FormField>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-600">
              <input type="checkbox" className="rounded border-neutral-300 text-brand-500 mt-0.5" {...register('agreeTerms')} />
              <span>
                Tôi đồng ý với <span className="text-brand-600 underline">Điều khoản dịch vụ</span> và{' '}
                <span className="text-brand-600 underline">Chính sách bảo mật</span> của SCS.
              </span>
            </label>
            {errors.agreeTerms && <p className="text-[11px] text-[#b3261e] mt-1">{errors.agreeTerms.message}</p>}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Đăng ký tài khoản
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-neutral-100 py-4 text-xs text-neutral-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-brand-600 font-semibold ml-1 hover:underline">
          Đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
