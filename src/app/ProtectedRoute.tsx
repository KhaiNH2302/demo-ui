import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role, MembershipRole } from '@/types/status';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRoles?: Role[];
  requireRole?: Role | Role[];
  requireClubRole?: { clubId: string; roles: MembershipRole[] };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireRoles,
  requireRole,
  requireClubRole,
}) => {
  const user = useAuthStore((state) => state.user);
  const clubRole = useAuthStore((state) => state.clubRole);
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;
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
