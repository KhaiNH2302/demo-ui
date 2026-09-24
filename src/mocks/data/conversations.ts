import type { Conversation, Message } from '@/types/entities';

export const seedConversations: Conversation[] = [
  {
    id: 'conv_01',
    kind: 'swap',
    refId: 'conn_01',
    title: 'Đổi lớp PRJ301 (IA1601 ↔ IA1603)',
    participantIds: ['usr_student_01', 'usr_mentor_02'],
    lastMessage: 'Hai bạn nhớ nộp đơn lên phòng đào tạo trước thứ 6 nhé!',
    lastMessageAt: '2026-09-18T16:30:00Z',
  },
  {
    id: 'conv_02',
    kind: 'mentoring',
    refId: 'mreq_01',
    title: 'Mentoring: Thiết kế Authentication JWT',
    participantIds: ['usr_student_01', 'usr_mentor_02'],
    lastMessage: 'Tối thứ Năm lúc 20:00 mình sẽ gửi link Google Meet cho bạn.',
    lastMessageAt: '2026-09-21T10:15:00Z',
  },
  {
    id: 'conv_03',
    kind: 'club',
    refId: 'club_01',
    title: 'F-Code Club - Kênh thảo luận chung',
    participantIds: ['usr_student_01', 'usr_mentor_02', 'usr_manager_03', 'usr_treasurer_04'],
    lastMessage: 'Chào mừng các bạn tham gia chuẩn bị cho sự kiện Workshop cuối tuần!',
    lastMessageAt: '2026-09-24T11:00:00Z',
  },
  {
    id: 'conv_04',
    kind: 'group',
    refId: 'grp_01',
    title: 'Nhóm học React & TypeScript nâng cao',
    participantIds: ['usr_student_01', 'usr_mentor_02', 'usr_student_03'],
    lastMessage: 'Tuần này nhóm mình họp lúc 20:00 tối thứ 5 nhé mọi người.',
    lastMessageAt: '2026-09-24T14:30:00Z',
  },
];

export const seedMessages: Message[] = [
  {
    id: 'msg_01',
    conversationId: 'conv_01',
    senderId: 'usr_student_01',
    content: 'Chào Bình, mình đã nhận được xác nhận đổi lớp trên hệ thống!',
    createdAt: '2026-09-18T16:05:00Z',
  },
  {
    id: 'msg_02',
    conversationId: 'conv_01',
    senderId: 'usr_mentor_02',
    content: 'Ok An, mai mình cùng lên phòng 102 để xin chữ ký giáo vụ nhé.',
    createdAt: '2026-09-18T16:15:00Z',
  },
  {
    id: 'msg_03',
    conversationId: 'conv_02',
    senderId: 'usr_mentor_02',
    content: 'Chào An, mình đã nhận yêu cầu mentoring của bạn.',
    createdAt: '2026-09-21T10:05:00Z',
  },
  {
    id: 'msg_04',
    conversationId: 'conv_02',
    senderId: 'usr_mentor_02',
    content: 'Tối thứ Năm lúc 20:00 mình sẽ gửi link Google Meet cho bạn.',
    createdAt: '2026-09-21T10:15:00Z',
  },
  {
    id: 'msg_05',
    conversationId: 'conv_03',
    senderId: 'usr_manager_03',
    content: 'Chào mừng các bạn tham gia chuẩn bị cho sự kiện Workshop cuối tuần!',
    createdAt: '2026-09-24T11:00:00Z',
  },
  {
    id: 'msg_06',
    conversationId: 'conv_04',
    senderId: 'usr_student_01',
    content: 'Tuần này nhóm mình họp lúc 20:00 tối thứ 5 nhé mọi người.',
    createdAt: '2026-09-24T14:30:00Z',
  },
];
