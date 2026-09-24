import type { Group, GroupMember, GroupJoinRequest } from '@/types/entities';

export const seedGroups: Group[] = [
  {
    id: 'grp_01',
    ownerId: 'usr_student_01',
    name: 'Nhóm Đồ Án SWP391 - E-Commerce AI App',
    purpose: 'Dự án',
    topic: 'Xây dựng ứng dụng sàn thương mại điện tử tích hợp trợ lý AI',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    activityTime: [
      { day: 'Tue', start: '19:00', end: '21:00' },
      { day: 'Sat', start: '14:00', end: '17:00' },
    ],
    interests: 'Công nghệ, E-commerce, Startup',
    joinMode: 'approval',
    memberCount: 3,
    memberLimit: 5,
    createdAt: '2026-09-10T08:00:00Z',
  },
  {
    id: 'grp_02',
    ownerId: 'usr_mentor_02',
    name: 'Nhóm Luyện Thuật Toán & Phỏng Vấn Tech',
    purpose: 'Học tập',
    topic: 'Luyện LeetCode Medium/Hard chuẩn bị thực tập hè',
    skills: ['Algorithms', 'Data Structures', 'Java', 'C++'],
    activityTime: [
      { day: 'Sun', start: '08:30', end: '11:30' },
    ],
    interests: 'Thuật toán, Thi đấu ACM, Phỏng vấn Big Tech',
    joinMode: 'direct',
    memberCount: 4,
    memberLimit: 6,
    createdAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'grp_03',
    ownerId: 'usr_student_07',
    name: 'Học tiếng Anh giao tiếp & TOEIC 750+',
    purpose: 'Kỹ năng',
    topic: 'Luyện speaking hằng ngày và giải đề ETS',
    skills: ['English Speaking', 'Grammar'],
    activityTime: [
      { day: 'Mon', start: '20:00', end: '21:30' },
      { day: 'Thu', start: '20:00', end: '21:30' },
    ],
    interests: 'Ngoại ngữ, Giao tiếp quốc tế',
    joinMode: 'approval',
    memberCount: 2,
    memberLimit: 4,
    createdAt: '2026-09-18T14:00:00Z',
  },
];

export const seedGroupMembers: GroupMember[] = [
  { groupId: 'grp_01', userId: 'usr_student_01', role: 'owner', joinedAt: '2026-09-10T08:00:00Z' },
  { groupId: 'grp_01', userId: 'usr_student_07', role: 'member', joinedAt: '2026-09-15T09:00:00Z' },
  { groupId: 'grp_01', userId: 'usr_treasurer_04', role: 'member', joinedAt: '2026-09-16T11:00:00Z' },
  { groupId: 'grp_02', userId: 'usr_mentor_02', role: 'owner', joinedAt: '2026-09-12T10:00:00Z' },
  { groupId: 'grp_02', userId: 'usr_student_01', role: 'member', joinedAt: '2026-09-14T10:00:00Z' },
  { groupId: 'grp_03', userId: 'usr_student_07', role: 'owner', joinedAt: '2026-09-18T14:00:00Z' },
];

export const seedJoinRequests: GroupJoinRequest[] = [
  {
    id: 'jreq_01',
    groupId: 'grp_01',
    userId: 'usr_mentor_02',
    message: 'Mình có kinh nghiệm backend Spring Boot, muốn cùng làm phần thanh toán.',
    status: 'Pending',
    createdAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'jreq_02',
    groupId: 'grp_03',
    userId: 'usr_student_01',
    message: 'Mình muốn tham gia để luyện nói tiếng Anh chuẩn bị đi thực tập.',
    status: 'Pending',
    createdAt: '2026-09-23T11:00:00Z',
  },
];
