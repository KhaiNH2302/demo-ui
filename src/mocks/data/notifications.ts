import type { Notification } from '@/types/entities';

export const seedNotifications: Notification[] = [
  {
    id: 'notif_01',
    userId: 'usr_student_01',
    source: 'Swap',
    title: 'Có lời mời kết nối đổi lớp mới!',
    body: 'Sinh viên Hoàng Trọng Nghĩa đã gửi lời mời đổi lớp môn SWP391 với bạn.',
    linkTo: '/swap/connections',
    read: false,
    createdAt: '2026-09-22T08:30:00Z',
  },
  {
    id: 'notif_02',
    userId: 'usr_student_01',
    source: 'Mentoring',
    title: 'Mentor đã chấp nhận yêu cầu của bạn',
    body: 'Lê Thị Bình đã đồng ý hỗ trợ chủ đề "Tư vấn thiết kế Authentication JWT".',
    linkTo: '/mentoring/requests',
    read: true,
    createdAt: '2026-09-21T10:00:00Z',
  },
  {
    id: 'notif_03',
    userId: 'usr_student_01',
    source: 'ClubEvent',
    title: 'Nhắc nhở sự kiện CLB F-Code sắp diễn ra',
    body: 'Workshop: Làm chủ Git & GitHub sẽ bắt đầu vào 18:00 ngày 26/09.',
    linkTo: '/clubs/club_01/workspace/events/evt_01',
    read: false,
    createdAt: '2026-09-24T09:00:00Z',
  },
  {
    id: 'notif_04',
    userId: 'usr_manager_03',
    source: 'ClubApplication',
    title: 'Có đơn ứng tuyển thành viên mới',
    body: 'Hoàng Trọng Nghĩa đã nộp đơn ứng tuyển vào CLB F-Code.',
    linkTo: '/clubs/club_01/workspace/recruitments/rec_01/applications',
    read: false,
    createdAt: '2026-09-20T10:00:00Z',
  },
];
