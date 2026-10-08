import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ClubMembership } from '@/types/entities';
import type { Role, MembershipRole } from '@/types/status';
import { seedUsers } from '@/mocks/data/users';

export interface RepresentedClubInfo {
  clubId: string;
  name: string;
  logoUrl?: string;
  roleNote?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  representedClubs: RepresentedClubInfo[];
  clubMemberships: ClubMembership[];
  login: (
    user: User,
    token: string,
    membershipsOrClubs?: ClubMembership[] | RepresentedClubInfo[]
  ) => void;
  setSession: (
    user: User,
    token: string,
    representedClubs?: RepresentedClubInfo[]
  ) => void;
  setAuth: (
    user: User,
    token: string,
    representedClubs?: RepresentedClubInfo[]
  ) => void;
  logout: () => void;
  clearSession: () => void;
  updateUser: (partial: Partial<User>) => void;
  hasRole: (role: Role) => boolean;
  isRepresentativeOf: (clubId: string) => boolean;
  isAdmin: () => boolean;
  setRepresentedClubs: (clubs: RepresentedClubInfo[]) => void;
  clubRole: (clubId: string) => MembershipRole | null;
  getClubRole: (clubId: string) => MembershipRole | null;
  setClubMemberships: (memberships: ClubMembership[]) => void;
}

const DEFAULT_REPRESENTED_CLUBS_BY_USER: Record<string, RepresentedClubInfo[]> = {
  usr_student_01: [
    {
      clubId: 'club_01',
      name: 'F-Code Club (CLB Lập Trình FPT)',
      logoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
      roleNote: 'Đại diện truyền thông & Tuyển dụng',
    },
  ],
  usr_manager_03: [
    {
      clubId: 'club_01',
      name: 'F-Code Club (CLB Lập Trình FPT)',
      logoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
      roleNote: 'Chủ nhiệm CLB',
    },
    {
      clubId: 'club_02',
      name: 'JS Club (Japanese Software Club)',
      logoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
      roleNote: 'Đại diện kết nối sinh viên',
    },
  ],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: seedUsers[0],
      token: 'mock_jwt_token_usr_student_01',
      isAuthenticated: true,
      representedClubs: DEFAULT_REPRESENTED_CLUBS_BY_USER['usr_student_01'] || [],
      clubMemberships: [],
      login: (user, token, membershipsOrClubs = []) => {
        const defaultReps = DEFAULT_REPRESENTED_CLUBS_BY_USER[user.id] || [];
        const isRepArray =
          membershipsOrClubs.length > 0 && 'name' in membershipsOrClubs[0];
        set({
          user,
          token,
          isAuthenticated: Boolean(user && token),
          representedClubs: isRepArray
            ? (membershipsOrClubs as RepresentedClubInfo[])
            : defaultReps,
          clubMemberships: !isRepArray
            ? (membershipsOrClubs as ClubMembership[])
            : [],
        });
      },
      setSession: (user, token, representedClubs) => {
        const defaultReps = DEFAULT_REPRESENTED_CLUBS_BY_USER[user.id] || [];
        set({
          user,
          token,
          isAuthenticated: Boolean(user && token),
          representedClubs: representedClubs ?? defaultReps,
        });
      },
      setAuth: (user, token, representedClubs) => {
        const defaultReps = DEFAULT_REPRESENTED_CLUBS_BY_USER[user.id] || [];
        set({
          user,
          token,
          isAuthenticated: Boolean(user && token),
          representedClubs: representedClubs ?? defaultReps,
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          representedClubs: [],
          clubMemberships: [],
        });
      },
      clearSession: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          representedClubs: [],
          clubMemberships: [],
        });
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
        return user.roles.some(
          (r) => r.toLowerCase().replace(/_/g, '') === normalizedRole
        );
      },
      isRepresentativeOf: (clubId: string) => {
        const { representedClubs, user } = get();
        if (!user) return false;
        if (
          user.roles.some((r) =>
            ['super_admin', 'system_admin', 'manager', 'admin', 'SuperAdmin', 'SystemAdmin', 'Manager', 'Admin'].includes(r)
          )
        ) {
          return true;
        }
        return representedClubs.some((c) => c.clubId === clubId);
      },
      isAdmin: () => {
        const user = get().user;
        if (!user) return false;
        return user.roles.some((r) =>
            ['super_admin', 'system_admin', 'manager', 'admin', 'SuperAdmin', 'SystemAdmin', 'Manager', 'Admin'].includes(r)
        );
      },
      setRepresentedClubs: (representedClubs) => set({ representedClubs }),
      clubRole: (clubId: string) => {
        const isRep = get().isRepresentativeOf(clubId);
        return isRep ? 'manager' : null;
      },
      getClubRole: (clubId: string) => {
        const isRep = get().isRepresentativeOf(clubId);
        return isRep ? 'manager' : null;
      },
      setClubMemberships: (clubMemberships) => set({ clubMemberships }),
    }),
    {
      name: 'scs_auth_session',
    }
  )
);
