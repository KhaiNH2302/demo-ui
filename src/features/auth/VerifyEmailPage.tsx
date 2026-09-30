import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const email = (location.state as { email?: string })?.email || 'ban@example.com';

  const [status, setStatus] = useState<'pending' | 'verified' | 'expired'>('pending');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleSimulateVerify = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/verify-email', { token: 'mock_verify_token_123', email });
      setStatus('verified');
    } catch {
      setStatus('expired');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterHome = () => {
    const fallback = seedUsers.find((u) => u.email === 'newbie@fpt.edu.vn') || seedUsers[0];
    const { password: _, ...safeUser } = fallback;
    const memberships = seedClubMemberships.filter((m) => m.userId === fallback.id);
    login(safeUser, `mock_jwt_token_${fallback.id}`, memberships);
    navigate('/', { replace: true });
  };

  const handleResend = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <Card className="max-w-md mx-auto text-center p-2">
      {status === 'pending' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-2">
              <Mail size={24} />
            </div>
            <CardTitle className="text-lg">Xác nhận email</CardTitle>
            <CardDescription className="max-w-xs">
              Chúng tôi đã gửi liên kết xác nhận đến địa chỉ <strong>{email}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-3">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-xs text-neutral-500 mb-2">
                Môi trường Demo: Nhấn nút bên dưới để giả lập bấm liên kết xác nhận email.
              </p>
              <Button onClick={handleSimulateVerify} loading={loading} size="sm" className="w-full">
                Xác nhận email ngay
              </Button>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={resendCountdown > 0}
                className="text-xs"
              >
                {resendCountdown > 0
                  ? `Gửi lại sau (${resendCountdown}s)`
                  : 'Gửi lại email xác nhận'}
              </Button>
            </div>
          </CardContent>
        </>
      )}

      {status === 'verified' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tier-good-bg text-tier-good-fg mb-2">
              <CheckCircle2 size={28} />
            </div>
            <CardTitle className="text-lg text-tier-good-fg">Đã xác nhận email</CardTitle>
            <CardDescription>
              Tài khoản của bạn đã sẵn sàng. Vào Trang chủ để bắt đầu kết nối.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-3">
            <Button
              onClick={handleEnterHome}
              className="w-full"
              rightIcon={<ArrowRight size={16} />}
            >
              Vào Trang chủ
            </Button>
          </CardContent>
        </>
      )}

      {status === 'expired' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tier-danger-bg text-tier-danger-fg mb-2">
              <AlertTriangle size={28} />
            </div>
            <CardTitle className="text-lg text-tier-danger-fg">Liên kết đã hết hạn</CardTitle>
            <CardDescription>
              Liên kết xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-3">
            <Button onClick={handleResend} className="w-full">
              Gửi lại email xác nhận
            </Button>
          </CardContent>
        </>
      )}

      <CardFooter className="justify-center border-t border-neutral-100 py-3 text-xs text-neutral-400">
        <Link to="/login" className="hover:underline text-neutral-500">
          Đổi email / Quay lại đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
