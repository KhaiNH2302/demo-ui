import {
  BookOpen,
  UsersRound,
  GraduationCap,
  Flag,
  HeartHandshake,
  Calendar,
  Inbox,
  Compass,
  Users,
  Settings,
  LifeBuoy,
  ShieldAlert,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import type { NavCounters } from '@/types/entities';

export interface NavItemConfig {
  key: string;
  label: string;
  href: string;
  to: string;
  icon: LucideIcon;
  requiresRole?: 'mentor' | 'admin';
  badgeType?: 'count' | 'dot';
  badge?: (counters: NavCounters) => number | boolean | undefined;
  /** Ghi đè khi tài khoản có role 'mentor' (cùng vị trí menu, khác nhãn & trang đầu tiên). */
  mentorVariant?: Partial<Pick<NavItemConfig, 'label' | 'href' | 'to' | 'icon' | 'badge'>>;
}

export interface NavSection {
  title?: string;
  items: NavItemConfig[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'HỌC TẬP',
    items: [
      {
        key: 'knowledge',
        label: 'Kiến thức',
        href: '/knowledge',
        to: '/knowledge',
        icon: BookOpen,
        badgeType: 'dot',
      },
      {
        key: 'groups',
        label: 'Nhóm học tập',
        href: '/groups',
        to: '/groups',
        icon: UsersRound,
        badgeType: 'dot',
        badge: (c) => (c.pendingGroupJoinRequests || 0) > 0,
      },
      {
        key: 'mentoring',
        label: 'Tìm Mentor',
        href: '/mentoring',
        to: '/mentoring',
        icon: GraduationCap,
        badgeType: 'dot',
        // Học viên: có yêu cầu đã gửi vừa được Mentor phản hồi
        badge: (c) => (c.mentoringRequestUpdates || 0) > 0,
        // Mentor: vào thẳng Mentor Center, trang đầu là Yêu cầu nhận được
        mentorVariant: {
          label: 'Mentor Center',
          href: '/mentor',
          to: '/mentor',
          icon: BadgeCheck,
          badge: (c) => (c.pendingMentoringRequests || 0) > 0,
        },
      },
    ],
  },
  {
    title: 'HOẠT ĐỘNG',
    items: [
      {
        key: 'clubs',
        label: 'Câu lạc bộ',
        href: '/clubs',
        to: '/clubs',
        icon: Flag,
        badgeType: 'dot',
        badge: (c) =>
          (c.pendingOpportunityResponses || 0) > 0 ||
          (c.clubsWithNewActivity?.length || 0) > 0,
      },
      {
        key: 'programs',
        label: 'Hoạt động',
        href: '/programs',
        to: '/programs',
        icon: HeartHandshake,
        badgeType: 'dot',
        badge: (c) => (c.pendingProgramRegistrations || 0) > 0,
      },
      {
        key: 'events',
        label: 'Sự kiện',
        href: '/events',
        to: '/events',
        icon: Calendar,
        badgeType: 'dot',
        badge: (c) => (c.todayRegisteredEvents || 0) > 0,
      },
    ],
  },
  {
    title: 'CÁ NHÂN',
    items: [
      {
        key: 'requests',
        label: 'Yêu cầu của tôi',
        href: '/requests',
        to: '/requests',
        icon: Inbox,
        badgeType: 'dot',
        badge: (c) => (c.pendingRequestsTotal || 0) > 0,
      },
      {
        key: 'people',
        label: 'Mọi người',
        href: '/people',
        to: '/people',
        icon: Users,
        badgeType: 'dot',
        badge: (c) => (c.pendingFollowRequests || 0) > 0,
      },
    ],
  },
];

export const SIDEBAR_SECTIONS = NAV_SECTIONS;

export const FOOTER_NAV_ITEMS: NavItemConfig[] = [
  {
    key: 'settings',
    label: 'Cài đặt',
    href: '/settings',
    to: '/settings',
    icon: Settings,
  },
  {
    key: 'help',
    label: 'Trợ giúp',
    href: '/help',
    to: '/help',
    icon: LifeBuoy,
  },
];

export const ADMIN_SECTION: NavSection = {
  title: 'QUẢN TRỊ',
  items: [
    {
      key: 'admin',
      label: 'Quản trị hệ thống',
      href: '/admin',
      to: '/admin',
      icon: ShieldAlert,
    },
  ],
};

export function getActiveNavKey(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/chats')) return 'chats';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/groups')) return 'groups';
  if (pathname.startsWith('/mentoring') || pathname.startsWith('/mentor')) return 'mentoring';
  if (pathname.startsWith('/clubs') || pathname.startsWith('/opportunities/')) return 'clubs';
  if (pathname.startsWith('/programs')) return 'programs';
  if (pathname.startsWith('/events')) return 'events';
  if (pathname.startsWith('/requests')) return 'requests';
  if (pathname.startsWith('/people')) return 'people';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/help')) return 'help';
  return '';
}

export function getActiveMobileTab(
  pathname: string,
): 'home' | 'knowledge' | 'chats' | 'menu' {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/chats')) return 'chats';
  return 'menu';
}
