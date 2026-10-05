import { matchPath } from 'react-router-dom';

/**
 * Mức truy cập của khách (chưa đăng nhập) theo route.
 * - open:   xem như thành viên; thao tác ghi bị chặn bởi LoginGate.
 * - action: mở được màn hình (thường là form), chỉ chặn khi gửi/lưu.
 * - member: dữ liệu cá nhân — hiển thị bản làm mờ + yêu cầu đăng nhập.
 */
export type GuestAccess = 'open' | 'action' | 'member';

interface AccessRule {
  pattern: string;
  access: GuestAccess;
  /** Tính vào giới hạn lướt của khách (trang chi tiết nội dung). */
  countsTowardBudget?: boolean;
}

// Thứ tự quan trọng: pattern cụ thể đứng trước pattern có tham số.
const RULES: AccessRule[] = [
  // ---- member: dữ liệu cá nhân / quản lý ----
  { pattern: '/chats/*', access: 'member' },
  { pattern: '/notifications', access: 'member' },
  { pattern: '/requests', access: 'member' },
  { pattern: '/settings', access: 'member' },
  { pattern: '/profile/me', access: 'member' },
  { pattern: '/knowledge/me', access: 'member' },
  // Chi tiết bài viết Knowledge (kèm bình luận) chỉ dành cho thành viên
  { pattern: '/knowledge/:id', access: 'member' },
  { pattern: '/groups/me', access: 'member' },
  { pattern: '/groups/:id/manage', access: 'member' },
  { pattern: '/swap/connections', access: 'member' },
  { pattern: '/mentoring/requests', access: 'member' },
  { pattern: '/clubs/registrations/:respId', access: 'member' },
  { pattern: '/clubs/manage/*', access: 'member' },
  { pattern: '/programs/manage/:id', access: 'member' },
  { pattern: '/programs/:id/edit', access: 'member' },
  { pattern: '/mentor/apply/review', access: 'member' },
  { pattern: '/mentor/profile', access: 'member' },
  { pattern: '/mentor/posts', access: 'member' },
  { pattern: '/mentor/requests', access: 'member' },

  // ---- action: mở form, chặn khi gửi ----
  { pattern: '/groups/new', access: 'action' },
  { pattern: '/programs/new', access: 'action' },
  { pattern: '/programs/:id/register', access: 'action' },
  { pattern: '/clubs/opportunities/:oppId/register', access: 'action' },
  { pattern: '/clubs/represent', access: 'action' },
  { pattern: '/mentor/apply', access: 'action' },
  { pattern: '/mentor/apply/form', access: 'action' },

  // ---- open: trang chi tiết tính vào giới hạn lướt ----
  { pattern: '/groups/:id', access: 'open', countsTowardBudget: true },
  { pattern: '/swap/:id', access: 'open', countsTowardBudget: true },
  { pattern: '/clubs/opportunities/:oppId', access: 'open', countsTowardBudget: true },
  { pattern: '/opportunities/:oppId', access: 'open', countsTowardBudget: true },
  { pattern: '/clubs/:id', access: 'open', countsTowardBudget: true },
  { pattern: '/programs/:id', access: 'open', countsTowardBudget: true },
  { pattern: '/mentoring/posts/:id', access: 'open', countsTowardBudget: true },
  { pattern: '/users/:id', access: 'open', countsTowardBudget: true },
];

function findRule(pathname: string): AccessRule | undefined {
  return RULES.find((r) => matchPath({ path: r.pattern, end: true }, pathname));
}

export function getGuestAccess(pathname: string): GuestAccess {
  return findRule(pathname)?.access ?? 'open';
}

export function countsTowardGuestBudget(pathname: string): boolean {
  return !!findRule(pathname)?.countsTowardBudget;
}
