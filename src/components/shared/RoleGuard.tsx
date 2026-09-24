import React from 'react';
import { useAuthStore } from '@/store/authStore';
import type { UserContext } from '@/lib/permissions';

export interface RoleGuardProps {
  can: (ctx: UserContext) => boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ can, fallback = null, children }) => {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const clubRole = useAuthStore((state) => state.clubRole);

  const ctx: UserContext = {
    user,
    hasRole,
    clubRole,
  };

  if (!can(ctx)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
