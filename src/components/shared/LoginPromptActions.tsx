import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { consumePendingGuestAction, savePendingGuestAction } from '@/lib/viewer';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export interface LoginPromptActionsProps {
  actionLabel: string;
  /** Trang quay lại sau khi đăng nhập; mặc định là trang hiện tại. */
  redirectTo?: string;
  /** Gọi sau khi đăng nhập Google thành công hoặc khi chuyển sang trang đăng nhập/đăng ký. */
  onDone?: () => void;
  extra?: React.ReactNode;
}

/** Cụm nút đăng nhập dùng chung cho LoginGate và LockedPreview. */
export const LoginPromptActions: React.FC<LoginPromptActionsProps> = ({
  actionLabel,
  redirectTo,
  onDone,
  extra,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const currentPath = location.pathname + location.search;
  const target = redirectTo || currentPath;

  const savePending = () =>
    savePendingGuestAction({ actionLabel, redirectTo: target, timestamp: Date.now() });

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const data = await api.post<{ user: Parameters<typeof setAuth>[0]; accessToken: string }>(
        '/auth/google/mock',
      );
      setAuth(data.user, data.accessToken);
      consumePendingGuestAction(); // đã quay lại tại chỗ, không cần nhắc "Tiếp tục" ở Bảng tin
      onDone?.();
      toast.success(`Chào mừng ${data.user.fullName}!`);
      // Đăng nhập tại chỗ: ở lại đúng nội dung đang xem.
      if (target !== currentPath) navigate(target);
    } catch {
      savePending();
      onDone?.();
      navigate('/login');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <Button variant="primary" className="w-full" loading={loadingGoogle} onClick={handleGoogleLogin}>
        Tiếp tục với Google
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
        <Link
          to="/login"
          onClick={() => {
            savePending();
            onDone?.();
          }}
          className="text-brand-600 hover:underline"
        >
          Đăng nhập bằng email
        </Link>
        <span className="text-neutral-300">·</span>
        <Link
          to="/register"
          onClick={() => {
            savePending();
            onDone?.();
          }}
          className="text-brand-600 hover:underline"
        >
          Tạo tài khoản
        </Link>
        {extra}
      </div>
    </div>
  );
};

export default LoginPromptActions;
