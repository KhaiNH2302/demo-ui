import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/app/layouts/AppShell';
import { Button } from '@/components/ui/Button';
import { ThreadFeed } from '@/components/shared/ThreadFeed';
import { UpcomingList, type UpcomingItem } from '@/components/shared/UpcomingList';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { LegalDialog } from '@/components/shared/LegalDialog';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { KnowledgePost } from '@/types/entities';

export const GuestHomePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const legalParam = searchParams.get('legal');
  const legalType = legalParam === 'terms' || legalParam === 'privacy' ? legalParam : null;

  const handleCloseLegal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('legal');
    setSearchParams(next, { replace: true });
  };

  const { data: previewPosts, isLoading: loadingPosts } = useQuery<KnowledgePost[]>({
    queryKey: ['public', 'posts', 'preview'],
    queryFn: async () => {
      const res = await api.get('/public/posts/preview');
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : raw?.items ?? [];
    },
    enabled: !user,
  });

  const { data: upcomingItems, isLoading: loadingUpcoming } = useQuery<UpcomingItem[]>({
    queryKey: ['public', 'upcoming', 4],
    queryFn: async () => {
      const res = await api.get('/public/upcoming', { params: { limit: 4 } });
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : raw?.items ?? [];
    },
    enabled: !user,
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await api.post('/auth/google/mock');
      const data = res.data?.data ?? res.data;
      setAuth(data.user, data.accessToken);
      toast.success(`Chào mừng ${data.user.fullName}!`);
      navigate('/');
    } catch {
      navigate('/login');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const posts = (previewPosts || []).slice(0, 3);

  return (
    <AppShell variant="guest">
      <div className="space-y-8">
        {/* Khối 1 — Hero trái căn, tối giản (C12.2) */}
        <section className="max-w-2xl space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Kết nối đúng người trong trường của bạn.
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            Hỏi bài, tìm nhóm đồ án, đăng ký hoạt động CLB và tình nguyện — dành cho sinh viên trong trường.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              loading={loadingGoogle}
              onClick={handleGoogleLogin}
            >
              Tiếp tục với Google
            </Button>
            <Link
              to="/register"
              className="text-sm font-medium text-brand-600 hover:underline px-1"
            >
              Đăng ký bằng email
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              to="/login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline px-1"
            >
              Đăng nhập
            </Link>
          </div>
        </section>

        {/* Khối 2 — Đang diễn ra trong trường (2 cột 2/3 + 1/3) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Cột trái 2/3: Sinh viên đang hỏi gì — tái sử dụng ThreadFeed + ThreadCard density="compact" (C12 & K-U) */}
          <div className="lg:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                Sinh viên đang hỏi gì
              </h2>
              <Link
                to="/knowledge"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Xem thêm →
              </Link>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-surface px-4 overflow-hidden">
              <ThreadFeed
                posts={posts}
                isLoading={loadingPosts}
                skeletonCount={3}
                density="compact"
                paging="none"
              />
            </div>
          </div>

          {/* Cột phải 1/3: Sắp diễn ra */}
          <div className="lg:col-span-1">
            {loadingUpcoming ? (
              <LoadingSkeleton variant="row-list" count={4} />
            ) : (
              <UpcomingList
                title="Sắp diễn ra"
                items={upcomingItems || []}
                maxItems={4}
                viewAllHref="/programs"
              />
            )}
          </div>
        </section>

        {/* Khối 3 — Dòng cam kết 1 hàng (C12.2) */}
        <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          Bạn chọn ai được xem hồ sơ · AI chỉ gợi ý, bạn là người quyết định · Nội dung vi phạm được kiểm duyệt
        </footer>
      </div>

      {legalType && (
        <LegalDialog
          open={!!legalType}
          onOpenChange={(open) => !open && handleCloseLegal()}
          type={legalType}
        />
      )}
    </AppShell>
  );
};

export default GuestHomePage;
