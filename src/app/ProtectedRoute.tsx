import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { Role, MembershipRole } from '@/types/status';
import { AppShell } from './layouts/AppShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { savePendingGuestAction } from '@/lib/viewer';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: Role[];
  requireRole?: Role | Role[];
  requireClubRole?: { clubId: string; roles: MembershipRole[] };
}

function getBlockedCopy(pathname: string): { title: string; description: string } {
  if (pathname.startsWith('/groups')) {
    return {
      title: 'Khu vực Nhóm học tập yêu cầu đăng nhập',
      description:
        'Việc tìm thành viên và ghép nhóm dựa trên kỹ năng, lịch rảnh và môn đang học của từng sinh viên.',
    };
  }
  if (pathname.startsWith('/mentoring') || pathname.startsWith('/mentor')) {
    return {
      title: 'Khu vực Mentor yêu cầu đăng nhập',
      description:
        'Kết nối Mentor dựa trên chuyên ngành, môn học và mục tiêu học tập cá nhân của bạn.',
    };
  }
  if (pathname.startsWith('/swap')) {
    return {
      title: 'Khu vực Đổi lớp yêu cầu đăng nhập',
      description:
        'Đổi lớp học phần cần đối chiếu lớp hiện tại và lịch học cá nhân của sinh viên.',
    };
  }
  if (pathname.startsWith('/users/')) {
    return {
      title: 'Hồ sơ sinh viên chỉ hiển thị cho thành viên đã đăng nhập',
      description:
        'Đăng nhập để xem kỹ năng, hoạt động và kết nối học tập với sinh viên trong trường.',
    };
  }
  return {
    title: 'Tính năng này dành cho thành viên đã đăng nhập',
    description:
      'Đăng nhập để truy cập đầy đủ các không gian học tập, nhắn tin và quản lý yêu cầu cá nhân.',
  };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRoles,
  requireRole,
  requireClubRole,
}) => {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clubRole = useAuthStore((state) => state.clubRole);
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  if (!user) {
    if (location.pathname === '/') {
      return <Navigate to="/welcome" replace />;
    }

    const copy = getBlockedCopy(location.pathname);
    const targetPath = location.pathname + location.search;

    const handleGoogleLogin = async () => {
      savePendingGuestAction({
        actionLabel: copy.title,
        redirectTo: targetPath,
        timestamp: Date.now(),
      });
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

    return (
      <AppShell variant="guest">
        <div className="max-w-lg mx-auto py-8">
          <EmptyState
            icon={Lock}
            title={copy.title}
            description={copy.description}
            action={
              <div className="flex flex-col items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  loading={loadingGoogle}
                  onClick={handleGoogleLogin}
                >
                  Tiếp tục với Google
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
                  <Link
                    to="/login"
                    onClick={() =>
                      savePendingGuestAction({
                        actionLabel: copy.title,
                        redirectTo: targetPath,
                        timestamp: Date.now(),
                      })
                    }
                    className="text-brand-600 hover:underline"
                  >
                    Đăng nhập
                  </Link>
                  <span className="text-neutral-300">·</span>
                  <Link
                    to="/register"
                    onClick={() =>
                      savePendingGuestAction({
                        actionLabel: copy.title,
                        redirectTo: targetPath,
                        timestamp: Date.now(),
                      })
                    }
                    className="text-brand-600 hover:underline"
                  >
                    Đăng ký
                  </Link>
                  <span className="text-neutral-300">·</span>
                  <Link
                    to="/welcome"
                    className="text-neutral-600 hover:text-neutral-900 hover:underline"
                  >
                    Về trang giới thiệu
                  </Link>
                </div>
              </div>
            }
          />
        </div>
      </AppShell>
    );
  }

  // Redirect new student to /onboarding if mandatory Step 1 education is missing
  const isCompleted = localStorage.getItem('scs_onboarding_completed') === 'true';
  const lacksMandatoryEdu = user.roles.includes('student') && (!user.school || !user.studentCode || !user.major);
  if (lacksMandatoryEdu && !isCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const effectiveRoles: Role[] = [];
  if (requireRoles) effectiveRoles.push(...requireRoles);
  if (requireRole) {
    if (Array.isArray(requireRole)) effectiveRoles.push(...requireRole);
    else effectiveRoles.push(requireRole);
  }

  if (effectiveRoles.length > 0) {
    const hasAnyRequiredRole = effectiveRoles.some((r) => user.roles.includes(r));
    if (!hasAnyRequiredRole) {
      return <Navigate to="/403" replace />;
    }
  }

  if (requireClubRole) {
    const role = clubRole(requireClubRole.clubId);
    if (!role || !requireClubRole.roles.includes(role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
};
