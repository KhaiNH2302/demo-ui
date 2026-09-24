import type { AuditLog, SystemSettings } from '@/types/entities';

export const seedAuditLogs: AuditLog[] = [
  {
    id: 'log_01',
    actorId: 'usr_admin_05',
    action: 'Duyệt bài viết vi phạm',
    targetType: 'KnowledgePost',
    targetId: 'post_01',
    reason: 'Nội dung chia sẻ học tập hợp lệ',
    createdAt: '2026-09-18T11:00:00Z',
  },
  {
    id: 'log_02',
    actorId: 'usr_admin_05',
    action: 'Từ chối bài viết',
    targetType: 'KnowledgePost',
    targetId: 'post_04',
    reason: 'Vi phạm bản quyền đề thi nội bộ',
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'log_03',
    actorId: 'usr_admin_05',
    action: 'Phê duyệt thành lập CLB',
    targetType: 'Club',
    targetId: 'club_01',
    reason: 'Hồ sơ đầy đủ kế hoạch hoạt động và cố vấn',
    createdAt: '2025-08-15T00:00:00Z',
  },
];

export const seedSystemSettings: SystemSettings = {
  aiEnabledModules: {
    swap: true,
    group: true,
    mentoring: true,
  },
  emailNotifications: {
    swap: true,
    groups: true,
    clubs: true,
    mentoring: true,
  },
  defaultPrivacy: {
    showProfilePublicly: true,
    allowMatching: true,
  },
  autoModerationThreshold: 75,
};

export const seedTags = [
  'React', 'TypeScript', 'Node.js', 'Spring Boot', 'Java', 'CSD201', 'PRJ301', 'SWP391', 'DBI202',
  'Algorithms', 'Machine Learning', 'Data Structures', 'Git', 'Scrum', 'English', 'Tiếng Nhật',
];
