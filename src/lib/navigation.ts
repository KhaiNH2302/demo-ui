import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Bell,
  MessageCircle,
  BookOpen,
  GraduationCap,
  UsersRound,
  Repeat2,
  Building2,
  CalendarDays,
  Compass,
  Inbox,
  BadgeCheck,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import type { NavCounters } from '@/types/entities';

export type NavKey =
  | 'home'
  | 'notifications'
  | 'chats'
  | 'knowledge'
  | 'mentoring'
  | 'groups'
  | 'swap'
  | 'clubs'
  | 'events'
  | 'opportunities'
  | 'requests'
  | 'mentor'
  | 'mentor-apply';

export interface NavItemConfig {
  key: NavKey;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: (counters?: NavCounters | null) => number | boolean | null;
  requiresRole?: string;
  isCustomComponent?: boolean;
}

export interface NavSectionConfig {
  title?: string;
  items: NavItemConfig[];
}

export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    items: [
      {
        key: 'home',
        label: 'Trang chủ',
        href: '/',
        icon: Home,
      },
      {
        key: 'notifications',
        label: 'Thông báo',
        href: '/notifications',
        icon: Bell,
        badge: (c) => c?.unreadNotifications || null,
      },
      {
        key: 'chats',
        label: 'Tin nhắn',
        href: '/chats',
        icon: MessageCircle,
        badge: (c) =>
          c ? (c.unreadMessages + c.pendingMessageRequests > 0 ? c.unreadMessages + c.pendingMessageRequests : null) : null,
      },
    ],
  },
  {
    title: 'Học tập',
    items: [
      {
        key: 'knowledge',
        label: 'Knowledge Sharing',
        href: '/knowledge',
        icon: BookOpen,
      },
      {
        key: 'mentoring',
        label: 'Mentoring',
        href: '/mentoring',
        icon: GraduationCap,
      },
      {
        key: 'groups',
        label: 'Nhóm kết nối',
        href: '/groups',
        icon: UsersRound,
        badge: (c) => c?.pendingGroupJoinRequests || null,
      },
      {
        key: 'swap',
        label: 'Đổi lớp',
        href: '/swap',
        icon: Repeat2,
        badge: (c) => ((c?.pendingSwapInvites || 0) > 0 ? true : null), // dot badge
      },
    ],
  },
  {
    title: 'Cộng đồng',
    items: [
      {
        key: 'clubs',
        label: 'Câu lạc bộ',
        href: '/clubs',
        icon: Building2,
        badge: (c) => ((c?.clubsWithNewActivity?.length || 0) > 0 ? true : null),
      },
      {
        key: 'events',
        label: 'Sự kiện',
        href: '/events',
        icon: CalendarDays,
        badge: (c) => c?.todayRegisteredEvents || null,
      },
      {
        key: 'opportunities',
        label: 'Cơ hội',
        href: '/opportunities',
        icon: Compass,
      },
    ],
  },
  {
    title: 'Quản lý',
    items: [
      {
        key: 'requests',
        label: 'Quản lý yêu cầu',
        href: '/requests',
        icon: Inbox,
        badge: (c) => c?.pendingRequestsTotal || null,
      },
      {
        key: 'mentor',
        label: 'Mentor Center',
        href: '/mentor',
        icon: BadgeCheck,
        requiresRole: 'mentor',
        badge: (c) => c?.pendingMentoringRequests || null,
      },
    ],
  },
];

export const FOOTER_NAV_ITEMS = [
  {
    key: 'settings',
    label: 'Cài đặt',
    href: '/settings',
    icon: Settings,
  },
  {
    key: 'help',
    label: 'Trợ giúp',
    href: '/help',
    icon: LifeBuoy,
  },
];

/**
 * Xác định mục điều hướng L1 / Sidebar nào đang active dựa trên pathname.
 * Tuân thủ bảng ánh xạ chuẩn trong specs/ui/design-system/03-patterns.md § 7.6.
 */
export function getActiveNavKey(pathname: string): NavKey | null {
  // 1. Trang chủ
  if (pathname === '/' || pathname === '/dashboard') {
    return 'home';
  }

  // 2. Thông báo
  if (pathname.startsWith('/notifications')) {
    return 'notifications';
  }

  // 3. Tin nhắn
  if (pathname.startsWith('/chats')) {
    return 'chats';
  }

  // 4. Knowledge Sharing
  if (pathname.startsWith('/knowledge')) {
    return 'knowledge';
  }

  // 5. Mentoring (phía sinh viên)
  if (pathname.startsWith('/mentoring')) {
    return 'mentoring';
  }

  // 6. Nhóm kết nối
  if (pathname.startsWith('/groups')) {
    return 'groups';
  }

  // 7. Đổi lớp
  if (pathname.startsWith('/swap')) {
    return 'swap';
  }

  // 8. Đăng ký Mentor
  if (pathname.startsWith('/mentor/apply')) {
    return 'mentor-apply';
  }

  // 9. Mentor Center (dành cho Mentor đã duyệt)
  if (pathname.startsWith('/mentor')) {
    return 'mentor';
  }

  // 10. Câu lạc bộ (kể cả workspace, applications, register)
  if (
    pathname.startsWith('/clubs') ||
    pathname.startsWith('/applications')
  ) {
    return 'clubs';
  }

  // 11. Sự kiện
  if (pathname.startsWith('/events')) {
    return 'events';
  }

  // 13. Cơ hội
  if (pathname.startsWith('/opportunities')) {
    return 'opportunities';
  }

  // 14. Quản lý yêu cầu & Của tôi
  if (pathname.startsWith('/requests') || pathname === '/me') {
    return 'requests';
  }

  // Các trang không làm sáng mục nào (Search, Profile/me, Settings, Help, Legal, Admin)
  return null;
}

/**
 * Xác định mục active trên mobile bottom tab bar (5 mục: Home, Knowledge, New, Chats, Menu).
 */
export function getActiveMobileTab(pathname: string): 'home' | 'knowledge' | 'chats' | 'menu' | null {
  if (pathname === '/' || pathname === '/dashboard') return 'home';
  if (pathname.startsWith('/knowledge')) return 'knowledge';
  if (pathname.startsWith('/chats')) return 'chats';
  if (
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/mentoring') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/swap') ||
    pathname.startsWith('/clubs') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/opportunities') ||
    pathname.startsWith('/requests') ||
    pathname.startsWith('/mentor') ||
    pathname.startsWith('/applications')
  ) {
    return 'menu';
  }
  return null;
}
