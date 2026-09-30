import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { savePendingGuestAction, useLoginGateStore } from '@/lib/viewer';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export const LoginGate: React.FC = () => {
  const navigate = useNavigate();
  const { open, actionLabel, redirectTo, closeGate } = useLoginGateStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const label = actionLabel || 'tiếp tục thao tác này';
  const targetRedirect =
    redirectTo ||
    (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

  const handleGoogleLogin = async () => {
    savePendingGuestAction({
      actionLabel: label,
      redirectTo: targetRedirect,
      timestamp: Date.now(),
    });
    setLoadingGoogle(true);
    try {
      const res = await api.post('/auth/google/mock');
      const data = res.data?.data ?? res.data;
      setAuth(data.user, data.accessToken);
      closeGate();
      toast.success(`Chào mừng ${data.user.fullName}!`);
      navigate('/');
    } catch {
      closeGate();
      navigate('/login');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeGate()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-neutral-900">
            Đăng nhập để {label}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 mt-1">
            Bạn sẽ quay lại đúng nội dung đang xem sau khi đăng nhập.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-3">
          <Button
            variant="primary"
            className="w-full"
            loading={loadingGoogle}
            onClick={handleGoogleLogin}
          >
            Tiếp tục với Google
          </Button>

          <div className="flex items-center justify-center gap-3 text-xs font-medium pt-1">
            <Link
              to="/login"
              onClick={() => {
                savePendingGuestAction({
                  actionLabel: label,
                  redirectTo: targetRedirect,
                  timestamp: Date.now(),
                });
                closeGate();
              }}
              className="text-brand-600 hover:underline"
            >
              Đăng nhập bằng email
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              to="/register"
              onClick={() => {
                savePendingGuestAction({
                  actionLabel: label,
                  redirectTo: targetRedirect,
                  timestamp: Date.now(),
                });
                closeGate();
              }}
              className="text-brand-600 hover:underline"
            >
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
