import type { Group, GroupMember, GroupJoinRequest } from '@/types/entities';
import { seedConversations } from './conversations';

export type ManagedGroup = Group & {
  status?: 'Active' | 'Closed';
  closedReason?: string;
  closedAt?: string;
};

export interface GroupInvitation {
  id: string;
  groupId: string;
  userId: string;
  invitedBy: string;
  message?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Cancelled';
  createdAt: string;
  respondedAt?: string;
}

export const seedGroups: ManagedGroup[] = [
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
  {
    id: 'grp_04',
    ownerId: 'usr_mentor_01',
    name: 'Nhóm Nghiên Cứu Deep Learning & Computer Vision',
    purpose: 'Dự án',
    topic: 'Xây dựng mô hình phân loại ảnh y tế và đọc paper CVPR/ECCV',
    skills: ['Python', 'PyTorch', 'Computer Vision', 'CNN'],
    activityTime: [
      { day: 'Wed', start: '19:00', end: '21:30' },
      { day: 'Sat', start: '09:00', end: '11:30' },
    ],
    interests: 'AI, Thị giác máy tính, Nghiên cứu khoa học',
    joinMode: 'approval',
    memberCount: 3,
    memberLimit: 5,
    createdAt: '2026-09-16T08:00:00Z',
  },
  {
    id: 'grp_05',
    ownerId: 'usr_student_08',
    name: 'Nhóm Ôn Thi PRJ301 & Lập Trình Java Web',
    purpose: 'Học tập',
    topic: 'Tổng hợp đề thi thực hành PRJ301, làm mini-project Java Servlet & MVC2',
    skills: ['Java', 'Servlet', 'JSP', 'JDBC', 'MySQL'],
    activityTime: [
      { day: 'Mon', start: '19:30', end: '21:30' },
      { day: 'Fri', start: '19:30', end: '21:30' },
    ],
    interests: 'Lập trình Backend, Java Core, Ôn thi FPT',
    joinMode: 'direct',
    memberCount: 3,
    memberLimit: 5,
    createdAt: '2026-09-20T08:00:00Z',
  },
  {
    id: 'grp_06',
    ownerId: 'usr_student_10',
    name: 'AI Lab - Nghiên Cứu LLM & RAG System',
    purpose: 'Nghiên cứu',
    topic: 'Ứng dụng Retrieval-Augmented Generation (RAG) vào tra cứu quy chế học vụ trường',
    skills: ['Python', 'LangChain', 'Vector DB', 'Llama 3', 'FastAPI'],
    activityTime: [
      { day: 'Thu', start: '18:30', end: '21:00' },
      { day: 'Sun', start: '14:00', end: '17:00' },
    ],
    interests: 'AI, Generative AI, RAG, NCKH',
    joinMode: 'approval',
    memberCount: 4,
    memberLimit: 6,
    createdAt: '2026-09-21T09:00:00Z',
  },
  {
    id: 'grp_07',
    ownerId: 'usr_student_11',
    name: 'FPT Designer Hub - UI/UX & Design Systems',
    purpose: 'Kỹ năng',
    topic: 'Thực hành thiết kế UI/UX ứng dụng di động, xây dựng design system trên Figma và test usability',
    skills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping'],
    activityTime: [
      { day: 'Wed', start: '19:00', end: '21:00' },
      { day: 'Sat', start: '14:30', end: '17:00' },
    ],
    interests: 'Thiết kế sản phẩm, Trải nghiệm người dùng, Mỹ thuật số',
    joinMode: 'approval',
    memberCount: 3,
    memberLimit: 5,
    createdAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'grp_08',
    ownerId: 'usr_student_13',
    name: 'Dự Án Khởi Nghiệp Sinh Viên Tech Startup 2026',
    purpose: 'Dự án',
    topic: 'Xây dựng nền tảng kết nối gia sư sinh viên và chuẩn bị pitch deck tham gia FPT Edu Biz Contest',
    skills: ['Business Plan', 'Marketing', 'React Native', 'Pitching'],
    activityTime: [
      { day: 'Tue', start: '18:00', end: '20:30' },
      { day: 'Sun', start: '09:00', end: '11:30' },
    ],
    interests: 'Khởi nghiệp, Đổi mới sáng tạo, Kinh doanh số',
    joinMode: 'approval',
    memberCount: 3,
    memberLimit: 6,
    createdAt: '2026-09-23T11:00:00Z',
  },
];

export const seedGroupMembers: GroupMember[] = [
  { groupId: 'grp_01', userId: 'usr_student_01', role: 'owner', joinedAt: '2026-09-10T08:00:00Z' },
  { groupId: 'grp_01', userId: 'usr_student_07', role: 'member', joinedAt: '2026-09-15T09:00:00Z' },
  { groupId: 'grp_01', userId: 'usr_manager_03', role: 'member', joinedAt: '2026-09-16T11:00:00Z' },
  { groupId: 'grp_02', userId: 'usr_mentor_02', role: 'owner', joinedAt: '2026-09-12T10:00:00Z' },
  { groupId: 'grp_02', userId: 'usr_student_01', role: 'member', joinedAt: '2026-09-14T10:00:00Z' },
  { groupId: 'grp_03', userId: 'usr_student_07', role: 'owner', joinedAt: '2026-09-18T14:00:00Z' },
  { groupId: 'grp_04', userId: 'usr_mentor_01', role: 'owner', joinedAt: '2026-09-16T08:00:00Z' },
  { groupId: 'grp_04', userId: 'usr_student_01', role: 'member', joinedAt: '2026-09-17T10:00:00Z' },
  { groupId: 'grp_05', userId: 'usr_student_08', role: 'owner', joinedAt: '2026-09-20T08:00:00Z' },
  { groupId: 'grp_05', userId: 'usr_student_09', role: 'member', joinedAt: '2026-09-20T09:30:00Z' },
  { groupId: 'grp_05', userId: 'usr_student_12', role: 'member', joinedAt: '2026-09-21T10:00:00Z' },
  { groupId: 'grp_06', userId: 'usr_student_10', role: 'owner', joinedAt: '2026-09-21T09:00:00Z' },
  { groupId: 'grp_06', userId: 'usr_student_07', role: 'member', joinedAt: '2026-09-21T14:00:00Z' },
  { groupId: 'grp_06', userId: 'usr_mentor_03', role: 'member', joinedAt: '2026-09-22T08:00:00Z' },
  { groupId: 'grp_06', userId: 'usr_student_01', role: 'member', joinedAt: '2026-09-22T15:00:00Z' },
  { groupId: 'grp_07', userId: 'usr_student_11', role: 'owner', joinedAt: '2026-09-22T10:00:00Z' },
  { groupId: 'grp_07', userId: 'usr_mentor_06', role: 'member', joinedAt: '2026-09-22T16:00:00Z' },
  { groupId: 'grp_07', userId: 'usr_student_15', role: 'member', joinedAt: '2026-09-23T09:00:00Z' },
  { groupId: 'grp_08', userId: 'usr_student_13', role: 'owner', joinedAt: '2026-09-23T11:00:00Z' },
  { groupId: 'grp_08', userId: 'usr_student_14', role: 'member', joinedAt: '2026-09-23T14:30:00Z' },
  { groupId: 'grp_08', userId: 'usr_newbie_08', role: 'member', joinedAt: '2026-09-24T08:00:00Z' },
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
  {
    id: 'jreq_03',
    groupId: 'grp_02',
    userId: 'usr_student_01',
    message: 'Mình có nền tảng C++ và Java tốt, muốn tham gia nhóm để cùng cày đề LeetCode.',
    status: 'Accepted',
    createdAt: '2026-09-14T09:00:00Z',
  },
  {
    id: 'jreq_04',
    groupId: 'grp_04',
    userId: 'usr_student_01',
    message: 'Mình đã học xong khóa Deep Learning cơ bản, muốn tham gia nhóm làm đồ án CV.',
    status: 'Accepted',
    createdAt: '2026-09-17T08:30:00Z',
  },
  {
    id: 'jreq_05',
    groupId: 'grp_05',
    userId: 'usr_student_01',
    message: 'Mình muốn tham gia để cày bài tập PRJ301 cùng các bạn.',
    status: 'Pending',
    createdAt: '2026-09-24T09:30:00Z',
  },
  {
    id: 'jreq_06',
    groupId: 'grp_06',
    userId: 'usr_student_09',
    message: 'Mình có kiến thức về bảo mật hệ thống và API, muốn tham gia phần security cho chatbot.',
    status: 'Pending',
    createdAt: '2026-09-25T11:00:00Z',
  },
  {
    id: 'jreq_07',
    groupId: 'grp_08',
    userId: 'usr_student_10',
    message: 'Mình muốn phụ trách technical lead cho ứng dụng kết nối gia sư.',
    status: 'Accepted',
    createdAt: '2026-09-25T15:20:00Z',
  },
  {
    id: 'jreq_08',
    groupId: 'grp_01',
    userId: 'usr_student_12',
    message: 'Mình có kinh nghiệm làm Docker và deploy CI/CD trên VPS, muốn xin gia nhập nhóm SWP391.',
    status: 'Pending',
    createdAt: '2026-09-26T10:00:00Z',
  },
  {
    id: 'jreq_09',
    groupId: 'grp_01',
    userId: 'usr_student_16',
    message: 'Mình muốn tham gia làm Tester và viết Unit Test cho dự án.',
    status: 'Rejected',
    createdAt: '2026-09-25T18:00:00Z',
  },
];

export const seedGroupInvitations: GroupInvitation[] = [
  {
    id: 'inv_01',
    groupId: 'grp_01',
    userId: 'usr_student_08',
    invitedBy: 'usr_student_01',
    message: 'Nhóm mình đang cần 1 bạn dev React cứng, cậu join cùng nhóm nhé!',
    status: 'Pending',
    createdAt: '2026-09-23T10:00:00Z',
  },
  {
    id: 'inv_02',
    groupId: 'grp_06',
    userId: 'usr_student_01',
    invitedBy: 'usr_student_10',
    message: 'Mời An tham gia nhóm nghiên cứu RAG và LLM tại AI Lab.',
    status: 'Pending',
    createdAt: '2026-09-24T16:00:00Z',
  },
  {
    id: 'inv_03',
    groupId: 'grp_02',
    userId: 'usr_student_07',
    invitedBy: 'usr_mentor_02',
    message: 'Mời Nghĩa tham gia nhóm luyện thuật toán ICPC nhé!',
    status: 'Accepted',
    createdAt: '2026-09-22T08:00:00Z',
  },
];

export function groupMemberIds(groupId: string): string[] {
  return [...new Set(seedGroupMembers.filter((member) => member.groupId === groupId).map((member) => member.userId))];
}

/** Every membership change uses the same source for badges and chat access. */
export function syncGroupMembership(group: ManagedGroup) {
  const participantIds = groupMemberIds(group.id);
  group.memberCount = participantIds.length;
  const conversation = seedConversations.find((item) => item.kind === 'group' && item.refId === group.id);
  if (conversation) {
    conversation.title = group.name;
    conversation.participantIds = participantIds;
    conversation.archived = group.status === 'Closed';
  }
  return conversation;
}

export function ensureGroupConversation(group: ManagedGroup) {
  const existing = syncGroupMembership(group);
  if (existing) return existing;
  const conversation = {
    id: `conv_group_${group.id}`,
    kind: 'group' as const,
    refId: group.id,
    title: group.name,
    participantIds: groupMemberIds(group.id),
    requestStatus: 'accepted' as const,
    unreadCount: 0,
  };
  seedConversations.unshift(conversation);
  return conversation;
}

seedGroups.forEach((group) => {
  group.status ??= 'Active';
  syncGroupMembership(group);
});
