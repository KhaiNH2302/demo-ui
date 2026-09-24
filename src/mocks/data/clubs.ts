import type {
  Club,
  ClubMembership,
  Recruitment,
  ClubApplication,
  ClubEvent,
  EventRegistration,
  EventTask,
  Transaction,
  ExpenseRequest,
  Reconciliation,
} from '@/types/entities';

export const seedClubs: Club[] = [
  {
    id: 'club_01',
    name: 'F-Code Club (CLB Lập Trình FPT)',
    logoUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    description: 'Câu lạc bộ học thuật chuyên sâu về Lập trình phần mềm, Thuật toán thi đấu và Phát triển ứng dụng thực tế tại Đại học FPT.',
    field: 'Công nghệ thông tin',
    managerId: 'usr_manager_03',
    approvalStatus: 'Approved',
    createdAt: '2025-08-15T00:00:00Z',
  },
  {
    id: 'club_02',
    name: 'JS Club (Japanese Software Club)',
    logoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80',
    description: 'CLB Kỹ sư Cầu nối & Tiếng Nhật Công nghệ thông tin.',
    field: 'Công nghệ & Ngôn ngữ',
    managerId: 'usr_student_07',
    approvalStatus: 'Approved',
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'club_03',
    name: 'FPT AI Innovators',
    description: 'Câu lạc bộ nghiên cứu và ứng dụng trí tuệ nhân tạo thế hệ mới.',
    field: 'Trí tuệ nhân tạo',
    managerId: 'usr_student_01',
    approvalStatus: 'PendingApproval',
    createdAt: '2026-09-20T00:00:00Z',
  },
];

export const seedClubMemberships: ClubMembership[] = [
  { clubId: 'club_01', userId: 'usr_manager_03', role: 'manager', status: 'Active', contributionScore: 95, joinedAt: '2025-08-15T00:00:00Z' },
  { clubId: 'club_01', userId: 'usr_treasurer_04', role: 'treasurer', status: 'Active', contributionScore: 88, joinedAt: '2025-08-20T00:00:00Z' },
  { clubId: 'club_01', userId: 'usr_student_01', role: 'member', status: 'Active', contributionScore: 72, joinedAt: '2026-02-10T00:00:00Z' },
  { clubId: 'club_01', userId: 'usr_mentor_02', role: 'member', status: 'Active', contributionScore: 85, joinedAt: '2025-09-01T00:00:00Z' },
];

export const seedRecruitments: Recruitment[] = [
  {
    id: 'rec_01',
    clubId: 'club_01',
    title: 'Tuyển thành viên Gen 10 - Ban Chuyên môn & Truyền thông',
    criteria: 'Đam mê lập trình, có tinh thần học hỏi cao, ưu tiên sinh viên K16-K17.',
    deadline: '2026-10-15T23:59:59Z',
    quota: 15,
    acceptedCount: 3,
    status: 'Published',
    questions: [
      { id: 'q1', label: 'Tại sao bạn muốn tham gia F-Code?', required: true },
      { id: 'q2', label: 'Bạn tự tin nhất với ngôn ngữ / công nghệ nào?', required: true },
      { id: 'q3', label: 'Link GitHub hoặc Portfolio cá nhân (nếu có)', required: false },
    ],
  },
];

export const seedApplications: ClubApplication[] = [
  {
    id: 'app_01',
    recruitmentId: 'rec_01',
    clubId: 'club_01',
    applicantId: 'usr_student_07',
    answers: {
      q1: 'Mình muốn học hỏi thêm về Web và làm quen với các anh chị giỏi thuật toán.',
      q2: 'React, Node.js cơ bản.',
      q3: 'https://github.com/hoangnghia',
    },
    status: 'Interview',
    interview: {
      scheduledAt: '2026-09-28T14:00:00Z',
      mode: 'offline',
      location: 'Phòng 204 Tòa Alpha',
      note: 'Mang theo laptop nếu có demo project',
    },
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'app_02',
    recruitmentId: 'rec_01',
    clubId: 'club_01',
    applicantId: 'usr_student_01',
    answers: {
      q1: 'Muốn cống hiến cho ban kỹ thuật.',
      q2: 'React, TypeScript, Tailwind.',
    },
    status: 'Accepted',
    createdAt: '2026-09-10T08:00:00Z',
  },
];

export const seedClubEvents: ClubEvent[] = [
  {
    id: 'evt_01',
    clubId: 'club_01',
    title: 'Workshop: Làm chủ Git & GitHub trong dự án phần mềm nhóm',
    description: 'Hướng dẫn Git Flow, xử lý merge conflict và CI/CD cơ bản cho sinh viên SWP391/PRJ301.',
    startAt: '2026-09-26T18:00:00Z',
    endAt: '2026-09-26T21:00:00Z',
    location: 'Hội trường Beta & Google Meet',
    capacity: 60,
    status: 'Ongoing',
  },
  {
    id: 'evt_02',
    clubId: 'club_01',
    title: 'Hackathon Nội Bộ F-Code 2026',
    description: 'Cuộc thi lập trình 24h giải quyết bài toán thực tế cho sinh viên trong trường.',
    startAt: '2026-10-20T08:00:00Z',
    endAt: '2026-10-21T08:00:00Z',
    location: 'Sảnh Tòa Alpha',
    capacity: 100,
    status: 'Published',
  },
];

export const seedEventRegistrations: EventRegistration[] = [
  { eventId: 'evt_01', userId: 'usr_student_01', checkedIn: true, registeredAt: '2026-09-21T09:00:00Z' },
  { eventId: 'evt_01', userId: 'usr_mentor_02', checkedIn: false, registeredAt: '2026-09-22T10:00:00Z' },
];

export const seedEventTasks: EventTask[] = [
  { id: 'tsk_01', eventId: 'evt_01', assigneeId: 'usr_student_01', title: 'Thiết kế Slide thuyết trình Workshop Git', status: 'Done', note: 'Đã hoàn thành và gửi duyệt' },
  { id: 'tsk_02', eventId: 'evt_01', assigneeId: 'usr_treasurer_04', title: 'Mua teabreak và nước uống hội trường', status: 'InProgress', note: 'Đã đặt hàng bên cung cấp' },
  { id: 'tsk_03', eventId: 'evt_01', assigneeId: 'usr_mentor_02', title: 'Soạn bộ câu hỏi thực hành Hands-on', status: 'Todo' },
];

export const seedTransactions: Transaction[] = [
  { id: 'tx_01', clubId: 'club_01', type: 'Income', amount: 5000000, description: 'Quỹ hoạt động kỳ Fall 2026 từ phòng PDP', recordedBy: 'usr_treasurer_04', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'tx_02', clubId: 'club_01', type: 'Income', amount: 1500000, description: 'Thu hội phí thành viên mới đợt 1', recordedBy: 'usr_treasurer_04', createdAt: '2026-09-10T10:00:00Z' },
  { id: 'tx_03', clubId: 'club_01', type: 'Expense', amount: 850000, description: 'In ấn backdrop và banner Workshop Git', recordedBy: 'usr_treasurer_04', createdAt: '2026-09-22T14:00:00Z' },
];

export const seedExpenses: ExpenseRequest[] = [
  {
    id: 'exp_01',
    clubId: 'club_01',
    amount: 1200000,
    purpose: 'Chi phí mua teabreak bánh kẹo nước cho 50 người tham gia Workshop Git',
    requestedBy: 'usr_treasurer_04',
    status: 'PendingApproval',
    createdAt: '2026-09-23T10:00:00Z',
  },
];

export const seedReconciliations: Reconciliation[] = [
  {
    id: 'rec_01',
    clubId: 'club_01',
    periodFrom: '2026-08-01',
    periodTo: '2026-08-31',
    openingBalance: 2000000,
    closingBalance: 4500000,
    note: 'Số dư khớp hoàn toàn với sao kê ngân hàng VPBank.',
    createdAt: '2026-09-02T10:00:00Z',
  },
];
