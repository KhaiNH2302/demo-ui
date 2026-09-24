import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/shared/FormField';
import { useAuthStore } from '@/store/authStore';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirectTo') || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'student@fpt.edu.vn',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = (await apiClient.post('/auth/login', data)) as any;
      login(response.user, response.token, response.memberships);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
    const targetUser = seedUsers.find((u) => u.email === email);
    if (targetUser) {
      const { password: _, ...safeUser } = targetUser;
      const memberships = seedClubMemberships.filter((m) => m.userId === targetUser.id);
      login(safeUser, `mock_jwt_token_${targetUser.id}`, memberships);
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Đăng nhập tài khoản</CardTitle>
          <CardDescription>Sử dụng email trường hoặc tài khoản sinh viên của bạn</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert tier="danger" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <FormField label="Email trường" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="vd: student@fpt.edu.vn"
                {...register('email')}
                error={!!errors.email}
              />
            </FormField>

            <FormField label="Mật khẩu" required error={errors.password?.message}>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={!!errors.password}
              />
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                <input type="checkbox" className="rounded border-neutral-300 text-brand-500" defaultChecked />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-brand-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Đăng nhập
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-neutral-100 py-4 text-xs text-neutral-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-brand-600 font-semibold ml-1 hover:underline">
            Đăng ký ngay
          </Link>
        </CardFooter>
      </Card>

      {/* Seed Accounts Panel for Dev */}
      {import.meta.env.DEV && (
        <Card className="border-brand-200 bg-brand-50/20 p-4">
          <h4 className="text-xs font-bold text-neutral-800 mb-2">⚡ Tài khoản Demo (Click để đăng nhập nhanh):</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('student@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Nguyễn Văn An</div>
                <div className="text-neutral-400">Role: Student</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('mentor@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Lê Thị Bình</div>
                <div className="text-neutral-400">Role: Mentor</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('manager@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Trần Minh Cường</div>
                <div className="text-neutral-400">Role: Club Manager</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('treasurer@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Phạm Hoàng Dung</div>
                <div className="text-neutral-400">Role: Treasurer</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('admin@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Vũ Quốc Em</div>
                <div className="text-neutral-400">Role: System Admin</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickLogin('schooladmin@fpt.edu.vn')}
              className="text-left justify-start text-[11px] bg-white h-auto py-2"
            >
              <div>
                <div className="font-semibold">Đỗ Hải Phong</div>
                <div className="text-neutral-400">Role: School Admin</div>
              </div>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
