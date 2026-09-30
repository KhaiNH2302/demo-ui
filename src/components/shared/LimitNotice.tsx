import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export interface LimitNoticeProps {
  remaining?: number;
  count?: number;
  noun: 'bài viết' | 'chương trình' | 'cơ hội' | 'bình luận';
  alwaysShow?: boolean;
}

export const LimitNotice: React.FC<LimitNoticeProps> = ({
  remaining,
  count,
  noun,
  alwaysShow = false,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loadingGoogle, setLoadingGoogle] = React.useState(false);

  if (user && !alwaysShow) {
    return null;
  }

  const displayRemaining = remaining ?? count ?? 12;

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await api.post('/auth/google/mock');
      const data = res?.data ?? res;
      setAuth(data.user, data.token || data.accessToken);
      toast.success(`Chào mừng ${data.user.fullName}!`);
      navigate('/');
    } catch {
      navigate('/login');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-6 text-left space-y-3 bg-white">
      <div className="space-y-1">
        <p className="text-base font-semibold text-neutral-900">
          Còn {displayRemaining} {noun} khác trong trường.
        </p>
        <p className="text-sm text-neutral-600">
          Đăng nhập để đọc, hỏi và trả lời.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          variant="primary"
          size="sm"
          loading={loadingGoogle}
          onClick={handleGoogleLogin}
        >
          Tiếp tục với Google
        </Button>
        <Link
          to="/register"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Đăng ký bằng email
        </Link>
        <span className="text-neutral-300">·</span>
        <Link
          to="/login"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};
