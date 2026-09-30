import type { AuditLog, SystemSettings } from '@/types/entities';

export const seedAuditLogs: AuditLog[] = [
  {
    id: 'log_01',
    actorId: 'usr_admin_05',
    action: 'Xác minh quyền đại diện CLB',
    targetType: 'ClubRepresentative',
    targetId: 'club_01',
    reason: 'Đã đối chiếu quyết định bổ nhiệm Ban chủ nhiệm học kỳ Fall 2026',
    createdAt: '2026-09-26T11:00:00Z',
  },
  {
    id: 'log_02',
    actorId: 'usr_admin_05',
    action: 'Phê duyệt kênh chương trình cộng đồng',
    targetType: 'ProgramChannel',
    targetId: 'prog_01',
    reason: 'Hoạt động tình nguyện môi trường hợp lệ, không thu phí',
    createdAt: '2026-09-25T09:00:00Z',
  },
  {
    id: 'log_03',
    actorId: 'usr_admin_05',
    action: 'Xử lý báo cáo vi phạm (Gỡ nội dung)',
    targetType: 'KnowledgePost',
    targetId: 'post_11',
    reason: 'Vi phạm bản quyền đề thi nội bộ của bộ môn',
    createdAt: '2026-09-15T09:00:00Z',
  },
];

export const seedSystemSettings: SystemSettings = {
  aiEnabledModules: {
    swap: true,
    group: true,
    mentoring: true,
    clubs: true,
  },
  aiFeatures: {
    smartSwapMatch: true,
    groupMemberSuggestion: true,
    mentorAutoMatch: true,
    clubOpportunitySuggestion: true,
  },
  emailNotifications: {
    swap: true,
    groups: true,
    clubs: true,
    mentoring: true,
    programs: true,
  },
  notifications: {
    emailOnStatusChange: true,
    inAppInstantChat: true,
  },
  defaultPrivacy: {
    showProfilePublicly: true,
    allowMatching: true,
    defaultProfileVisibility: 'members',
  },
  guestAccess: {
    allowGuestPreview: true,
    knowledgePreviewLimit: 3,
    programsPreviewLimit: 6,
  },
  programLimits: {
    maxActiveChannelsPerStudent: 2,
    maxAnnouncementsPerDay: 5,
  },
  autoModerationThreshold: 75,
  autoHideReportThreshold: 5,
};

export const seedTags = [
  'React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'CSD201', 'PRJ301', 'SWP391', 'DBI202',
  'Algorithms', 'Machine Learning', 'Data Structures', 'Git', 'Scrum', 'English', 'Tiếng Nhật',
];
