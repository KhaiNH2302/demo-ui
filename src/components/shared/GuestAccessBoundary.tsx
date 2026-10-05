import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getGuestAccess, countsTowardGuestBudget } from '@/lib/access';
import { useGuestBudgetStore } from '@/lib/guestBudget';
import { useLoginGateStore } from '@/lib/viewer';
import { LockedPreview } from './LockedPreview';

function getMemberCopy(pathname: string): { title: string; description: string } {
  if (pathname.startsWith('/chats')) {
    return {
      title: 'Đăng nhập để xem tin nhắn',
      description: 'Trò chuyện trực tiếp với bạn học, nhóm và mentor sau khi đăng nhập.',
    };
  }
  if (pathname.startsWith('/notifications')) {
    return {
      title: 'Đăng nhập để xem thông báo',
      description: 'Nhận cập nhật về bài viết, nhóm, CLB và yêu cầu của bạn.',
    };
  }
  if (pathname.startsWith('/requests') || pathname.includes('/registrations/')) {
    return {
      title: 'Đăng nhập để quản lý yêu cầu',
      description: 'Theo dõi đơn đăng ký, lời mời và yêu cầu đang chờ của riêng bạn.',
    };
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/profile/me')) {
    return {
      title: 'Đăng nhập để xem hồ sơ của bạn',
      description: 'Cập nhật kỹ năng, lịch rảnh và quyền riêng tư cho tài khoản của bạn.',
    };
  }
  if (pathname.startsWith('/knowledge/')) {
    return {
      title: 'Đăng nhập để đọc bài viết',
      description: 'Xem nội dung đầy đủ, bình luận và trả lời trong cộng đồng sau khi đăng nhập.',
    };
  }
  if (pathname.startsWith('/mentor')) {
    return {
      title: 'Đăng nhập để vào Mentor Center',
      description: 'Quản lý hồ sơ mentor, bài đăng và yêu cầu kèm học của bạn.',
    };
  }
  return {
    title: 'Đăng nhập để tiếp tục',
    description: 'Đây là không gian cá nhân — đăng nhập để xem và quản lý nội dung của bạn.',
  };
}

/**
 * Áp quy tắc truy cập của khách cho nội dung chính trong AppShell (xem lib/access.ts):
 * - member → làm mờ + yêu cầu đăng nhập.
 * - trang chi tiết → tính vào giới hạn lướt; vượt ngưỡng cứng thì làm mờ.
 */
export const GuestAccessBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const access = getGuestAccess(pathname);
  const counts = countsTowardGuestBudget(pathname);

  const limits = useGuestBudgetStore((s) => s.limits);
  const isBlocked = useGuestBudgetStore(
    (s) => counts && !s.viewed.includes(pathname) && s.viewed.length >= s.limits.hard,
  );
  const recordView = useGuestBudgetStore((s) => s.recordView);
  const markSoftShown = useGuestBudgetStore((s) => s.markSoftShown);
  const openGate = useLoginGateStore((s) => s.openGate);

  useEffect(() => {
    if (user || !counts) return;
    if (recordView(pathname) === 'soft') {
      markSoftShown();
      openGate('tiếp tục khám phá', undefined, {
        title: 'Thích những gì bạn đang xem?',
        description:
          'Đăng nhập để lưu bài, theo dõi CLB, tham gia nhóm và xem không giới hạn. Chỉ mất vài giây với tài khoản Google.',
        dismissLabel: 'Để sau',
      });
    }
  }, [user, pathname, counts, recordView, markSoftShown, openGate]);

  if (user) return <>{children}</>;

  if (access === 'member') {
    return (
      <LockedPreview key={pathname} {...getMemberCopy(pathname)}>
        {children}
      </LockedPreview>
    );
  }

  if (isBlocked) {
    return (
      <LockedPreview
        key={pathname}
        title="Đăng nhập để xem tiếp"
        description={`Bạn đã xem ${limits.hard} nội dung với tư cách khách. Đăng nhập miễn phí để tiếp tục khám phá không giới hạn.`}
        actionLabel="xem tiếp nội dung"
      >
        {children}
      </LockedPreview>
    );
  }

  return <>{children}</>;
};

export default GuestAccessBoundary;
