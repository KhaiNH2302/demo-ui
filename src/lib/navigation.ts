export type NavKey = 'home' | 'swap' | 'discover' | 'chats' | 'me';

/**
 * Xác định mục điều hướng L1 nào đang active dựa trên pathname.
 * Tuân thủ bảng ánh xạ chuẩn trong specs/ui/design-system/03-patterns.md § 7.6.3.
 */
export function getActiveNavKey(pathname: string, isMobile = false): NavKey | null {
  // 1. Trang chủ
  if (pathname === '/' || pathname === '/dashboard') {
    return 'home';
  }

  // 2. Đổi lớp
  if (pathname.startsWith('/swap')) {
    return 'swap';
  }

  // 3. Tin nhắn
  if (pathname.startsWith('/chats')) {
    return 'chats';
  }

  // 4. Club Workspace thuộc "Của tôi" (vì là CLB người dùng đã tham gia)
  if (pathname.includes('/workspace')) {
    return 'me';
  }

  // 5. Của tôi & các trang quản lý cá nhân
  if (
    pathname === '/me' ||
    pathname.startsWith('/applications') ||
    pathname === '/groups/me' ||
    pathname.includes('/manage') ||
    pathname === '/knowledge/me' ||
    pathname === '/mentoring/requests' ||
    pathname.startsWith('/mentor')
  ) {
    return 'me';
  }

  // 6. Khám phá (Discover và các trang danh sách khám phá)
  if (
    pathname.startsWith('/discover') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/clubs') ||
    pathname.startsWith('/knowledge') ||
    pathname.startsWith('/mentoring') ||
    pathname.startsWith('/users/')
  ) {
    // Trên mobile, khám phá nằm trong Trang chủ (SegmentedControl)
    return isMobile ? 'home' : 'discover';
  }

  // Các trang không làm sáng mục nào trên rail/bottom-tab (Notifications, Settings, Help, Legal, Admin)
  return null;
}
