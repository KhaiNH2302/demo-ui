import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/shared/FormField';
import { AuthAside } from './AuthAside';
import { useAuthStore } from '@/store/authStore';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { savePendingGuestAction, getPendingGuestAction } from '@/lib/viewer';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';
import type { User } from '@/types/entities';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type LoginInput = z.infer<typeof loginSchema>;

export const GoogleLogoSvg: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.4l3.99-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.72-4.94z"
    />
  </svg>
);

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectToParam = searchParams.get('redirectTo');

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

  /**
   * Quy tắc điều hướng sau đăng nhập (01-common-screens.md § C1 & SCS_UI_Plan.md § 18.2):
   * - Mọi lần đăng nhập thành công đều điều hướng về `/` (HomeFeedPage)
   *   (hoặc `/admin` nếu tài khoản có role admin — vào thẳng Admin Dashboard).
   * - KHÔNG tự nhảy thẳng sang trang đích; giữ pendingAction trong sessionStorage
   *   để HomeFeedPage hiển thị dòng nhắc "Tiếp tục: ... · Mở lại · ×".
   */
  const navigateAfterLogin = (loggedUser: User) => {
    if (redirectToParam && redirectToParam !== '/' && !getPendingGuestAction()) {
      savePendingGuestAction({
        actionLabel: `nội dung tại ${redirectToParam}`,
        redirectTo: redirectToParam,
        timestamp: Date.now(),
      });
    }
    const isAdmin = loggedUser.roles.some((r) =>
      ['system_admin', 'school_admin', 'SystemAdmin', 'SchoolAdmin'].includes(r),
    );

    navigate(isAdmin ? '/admin' : '/', { replace: true });
  };

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = (await apiClient.post('/auth/login', data)) as {
        user: User;
        token: string;
        memberships?: unknown[];
      };
      login(response.user, response.token, response.memberships as never);
      navigateAfterLogin(response.user);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr.message || 'Email hoặc mật khẩu chưa đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setLoadingGoogle(true);
    setErrorMessage(null);
    try {
      const response = (await apiClient.post('/auth/google/mock', {})) as {
        user: User;
        accessToken?: string;
        token?: string;
        memberships?: unknown[];
      };
      login(
        response.user,
        response.accessToken || response.token || 'mock_google_jwt',
        response.memberships as never,
      );
      navigateAfterLogin(response.user);
    } catch {
      const fallback = seedUsers[0];
      const { password: _, ...safeUser } = fallback;
      const memberships = seedClubMemberships.filter((m) => m.userId === fallback.id);
      login(safeUser, `mock_jwt_token_${fallback.id}`, memberships);
      navigateAfterLogin(safeUser);
    } finally {
      setLoadingGoogle(false);
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
      navigateAfterLogin(safeUser);
    }
  };

  const demoAccounts = [
    {
      email: 'student@fpt.edu.vn',
      name: 'Nguyễn Văn An',
      roleLabel: 'Student · Hồ sơ thành viên',
    },
    {
      email: 'mentor@fpt.edu.vn',
      name: 'Lê Thị Bình',
      roleLabel: 'Mentor · Chỉ người theo dõi',
    },
    {
      email: 'clubrep@fpt.edu.vn',
      name: 'Trần Minh Cường',
      roleLabel: 'Đại diện CLB F-Code & JS',
    },
    {
      email: 'organizer@fpt.edu.vn',
      name: 'Đặng Thu Hà',
      roleLabel: 'Tổ chức Tình nguyện/Workshop',
    },
    {
      email: 'applicant@fpt.edu.vn',
      name: 'Phạm Hoàng Dung',
      roleLabel: 'Ứng viên · Hồ sơ riêng tư',
    },
    {
      email: 'newbie@fpt.edu.vn',
      name: 'Vũ Minh Khôi',
      roleLabel: 'Tân sinh viên K19',
    },
    {
      email: 'admin@fpt.edu.vn',
      name: 'Vũ Quốc Em',
      roleLabel: 'System Admin',
    },
    {
      email: 'schooladmin@fpt.edu.vn',
      name: 'Đỗ Hải Phong',
      roleLabel: 'School Admin',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-lg border border-neutral-200 bg-surface overflow-hidden">
        {/* Cột trái: Form đăng nhập (C1) */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Đăng nhập</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Sử dụng Google hoặc email cá nhân/email trường để tiếp tục
            </p>
          </div>

          {/* Nút Tiếp tục với Google */}
          <Button
            type="button"
            variant="secondary"
            loading={loadingGoogle}
            onClick={handleGoogleOAuth}
            leftIcon={<GoogleLogoSvg />}
            className="w-full h-10 font-medium text-neutral-800 border-neutral-200 hover:bg-neutral-100"
          >
            Tiếp tục với Google
          </Button>

          {/* Dải phân cách "hoặc" */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-surface px-3 text-xs text-neutral-400">hoặc</span>
            <div className="border-t border-neutral-200 w-full" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <Alert tier="danger" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <FormField label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="ban@example.com"
                {...register('email')}
                error={!!errors.email}
              />
            </FormField>

            <FormField label="Mật khẩu" required error={errors.password?.message}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={!!errors.password}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                <input
                  type="checkbox"
                  className="rounded border-neutral-300 text-brand-600"
                  defaultChecked
                />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="text-brand-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Đăng nhập
            </Button>

            <div className="text-center text-xs text-neutral-500 pt-1">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:underline">
                Đăng ký
              </Link>
            </div>
          </form>
        </div>

        {/* Cột phải: AuthAside (C1) */}
        <AuthAside variant="login" />
      </div>

      {/* Seed Accounts Panel for Testing in DEV mode */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
            <KeyRound size={14} className="text-brand-600" /> Tài khoản mẫu kiểm thử (Bấm để đăng nhập nhanh):
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleQuickLogin(acc.email)}
              className="text-left rounded-md border border-neutral-200 bg-surface px-3 py-2 hover:border-brand-400 transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-neutral-900">{acc.name}</div>
              <div className="text-[11px] text-neutral-500 truncate">{acc.roleLabel}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
