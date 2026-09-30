import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from './AppShell';

export const PublicOrAuthRoute: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  return <AppShell variant={user ? 'member' : 'guest'} />;
};
