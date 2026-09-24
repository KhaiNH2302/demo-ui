import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ClubMembership } from '@/types/entities';
import type { Role, MembershipRole } from '@/types/status';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';

export interface AuthState {
  user: User | null;
  token: string | null;
  clubMemberships: ClubMembership[];
  login: (user: User, token: string, memberships?: ClubMembership[]) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  hasRole: (role: Role) => boolean;
  clubRole: (clubId: string) => MembershipRole | null;
  getClubRole: (clubId: string) => MembershipRole | null;
  setClubMemberships: (memberships: ClubMembership[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: seedUsers[0],
      token: 'mock-jwt-token-student',
      clubMemberships: seedClubMemberships,
      login: (user, token, memberships = []) => {
        set({ user, token, clubMemberships: memberships });
      },
      logout: () => {
        set({ user: null, token: null, clubMemberships: [] });
      },
      updateUser: (partial) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...partial } });
        }
      },
      hasRole: (role: Role) => {
        const user = get().user;
        if (!user) return false;
        const normalizedRole = role.toLowerCase().replace(/_/g, '');
        return user.roles.some((r) => r.toLowerCase().replace(/_/g, '') === normalizedRole);
      },
      clubRole: (clubId: string) => {
        const memberships = get().clubMemberships;
        const membership = memberships.find((m) => m.clubId === clubId && (m.status === 'Active' || m.status === 'active'));
        return membership ? membership.role : null;
      },
      getClubRole: (clubId: string) => {
        const memberships = get().clubMemberships;
        const membership = memberships.find((m) => m.clubId === clubId && (m.status === 'Active' || m.status === 'active'));
        return membership ? membership.role : null;
      },
      setClubMemberships: (clubMemberships) => {
        set({ clubMemberships });
      },
    }),
    {
      name: 'scs_auth_session',
    }
  )
);
