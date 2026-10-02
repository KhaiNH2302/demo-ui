import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/shared/FormField';
import { LegalDialog } from '@/components/shared/LegalDialog';
import { AuthAside } from './AuthAside';
import { GoogleLogoSvg } from './LoginPage';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';
import type { User } from '@/types/entities';

/**
 * C2 — Đăng ký tài khoản (01-common-screens.md § C2 & SCS_UI_Plan.md § 18.1):
 * Form ngắn chỉ gồm Họ tên, Email (mọi domain), Mật khẩu (tối thiểu 8 ký tự, có nút hiện/ẩn),
 * Checkbox Điều khoản & Quyền riêng tư.
 * MSSV, Trường, Chuyên ngành, Khóa chuyển sang Onboarding (C4) / Hồ sơ cá nhân (C7).
 */
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải từ 2 ký tự trở lên'),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần đồng ý với điều khoản sử dụng và chính sách quyền riêng tư',
  }),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      agreeTerms: false,
    },
  });

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
      navigate('/', { replace: true });
    } catch {
      const fallback = seedUsers[0];
      const { password: _, ...safeUser } = fallback;
      const memberships = seedClubMemberships.filter((m) => m.userId === fallback.id);
      login(safeUser, `mock_jwt_token_${fallback.id}`, memberships);
      navigate('/', { replace: true });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 max-w-4xl mx-auto rounded-lg border border-neutral-200 bg-surface overflow-hidden">
      {/* Cột trái: Form đăng ký ngắn gọn (C2) */}
      <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Tạo tài khoản</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Đăng ký nhanh bằng Google hoặc email bất kỳ
          </p>
        </div>

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

          <FormField label="Họ tên" required error={errors.fullName?.message}>
            <Input
              placeholder="vd: Nguyễn Văn An"
              {...register('fullName')}
              error={!!errors.fullName}
            />
          </FormField>

          <FormField label="Email" required error={errors.email?.message}>
            <Input
              type="email"
              placeholder="ban@example.com"
              {...register('email')}
              error={!!errors.email}
            />
          </FormField>

          <FormField
            label="Mật khẩu (tối thiểu 8 ký tự)"
            required
            error={errors.password?.message}
          >
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

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-neutral-600">
              <input
                type="checkbox"
                className="rounded border-neutral-300 text-brand-600 mt-0.5"
                {...register('agreeTerms')}
              />
              <span>
                Tôi đồng ý với{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('terms')}
                  className="text-brand-600 underline cursor-pointer hover:text-brand-700"
                >
                  Điều khoản
                </button>{' '}
                &amp;{' '}
                <button
                  type="button"
                  onClick={() => setLegalModal('privacy')}
                  className="text-brand-600 underline cursor-pointer hover:text-brand-700"
                >
                  Quyền riêng tư
                </button>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-[11px] text-tier-danger-dot mt-1">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Tạo tài khoản
          </Button>

          <div className="text-center text-xs text-neutral-500 pt-1">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>

      {/* Cột phải: AuthAside (C2) */}
      <AuthAside variant="register" />

      {legalModal && (
        <LegalDialog
          open={!!legalModal}
          onOpenChange={(open) => !open && setLegalModal(null)}
          type={legalModal}
        />
      )}
    </div>
  );
}
