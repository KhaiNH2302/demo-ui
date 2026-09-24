import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || 'sinhvien@fpt.edu.vn';

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
    <Card className="shadow-md text-center p-2">
      {status === 'pending' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-2">
              <Mail size={28} />
            </div>
            <CardTitle className="text-xl">Kiểm tra hộp thư của bạn</CardTitle>
            <CardDescription className="max-w-xs">
              Chúng tôi đã gửi link xác nhận đến địa chỉ <strong>{email}</strong>. Vui lòng kiểm tra và xác thực để kích hoạt tài khoản.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Demo button to simulate email link click */}
            <div className="p-3 bg-brand-50/50 rounded-lg border border-brand-100">
              <p className="text-[11px] text-neutral-500 mb-2">
                (Môi trường Demo: Không có email thật gửi đi, hãy nhấn nút dưới đây để giả lập xác minh)
              </p>
              <Button onClick={handleSimulateVerify} loading={loading} size="sm" className="w-full">
                Giả lập click link xác minh email
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
                {resendCountdown > 0 ? `Gửi lại sau (${resendCountdown}s)` : 'Chưa nhận được? Gửi lại email'}
              </Button>
            </div>
          </CardContent>
        </>
      )}

      {status === 'verified' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f7ee] text-[#16794a] mb-2">
              <CheckCircle2 size={32} />
            </div>
            <CardTitle className="text-xl text-[#16794a]">Xác minh thành công!</CardTitle>
            <CardDescription>
              Tài khoản của bạn đã được kích hoạt. Hãy đăng nhập để bắt đầu sử dụng SCS.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Button onClick={() => navigate('/login')} className="w-full" rightIcon={<ArrowRight size={16} />}>
              Đến trang đăng nhập
            </Button>
          </CardContent>
        </>
      )}

      {status === 'expired' && (
        <>
          <CardHeader className="items-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-[#dc3c33] mb-2">
              <AlertTriangle size={32} />
            </div>
            <CardTitle className="text-xl text-[#dc3c33]">Link xác minh hết hạn</CardTitle>
            <CardDescription>
              Link xác minh đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <Button onClick={handleResend} className="w-full">
              Gửi lại link xác minh mới
            </Button>
          </CardContent>
        </>
      )}

      <CardFooter className="justify-center border-t border-neutral-100 py-3 text-xs text-neutral-400">
        <Link to="/login" className="hover:underline text-neutral-500">
          Quay lại trang đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
