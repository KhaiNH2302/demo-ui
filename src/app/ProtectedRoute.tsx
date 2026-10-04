import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role, MembershipRole } from '@/types/status';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: Role[];
  requireRole?: Role | Role[];
  requireClubRole?: { clubId: string; roles: MembershipRole[] };
  /**
   * Cho khách đi qua — dùng cho các route nằm trong AppShell, nơi GuestAccessBoundary
   * quyết định khách được xem, xem bản làm mờ hay bị giới hạn lướt (lib/access.ts).
   */
  allowGuest?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRoles,
  requireRole,
  requireClubRole,
  allowGuest = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const clubRole = useAuthStore((state) => state.clubRole);
  const location = useLocation();

  if (!user) {
    if (allowGuest) return <>{children}</>;

    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
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
