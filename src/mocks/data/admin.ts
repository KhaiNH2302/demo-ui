import type { AuditLog, SystemSettings } from '@/types/entities';

export const seedAuditLogs: AuditLog[] = [
  { id: 'log_10', actorId: 'usr_admin_05', action: 'Cập nhật cấu hình hệ thống', targetType: 'SystemSettings', targetId: 'settings', reason: 'Điều chỉnh giới hạn kênh hoạt động', createdAt: '2026-10-08T09:30:00Z' },
  { id: 'log_09', actorId: 'usr_admin_05', action: 'Cập nhật quyền Manager', targetType: 'User', targetId: 'usr_opsmanager_06', reason: 'Bổ sung quyền kiểm duyệt nội dung', createdAt: '2026-10-07T14:20:00Z' },
  { id: 'log_08', actorId: 'usr_admin_05', action: 'Phê duyệt hồ sơ Mentor', targetType: 'MentorApplication', targetId: 'app_mentor_03', reason: 'Hồ sơ và minh chứng hợp lệ', createdAt: '2026-10-06T10:15:00Z' },
  { id: 'log_07', actorId: 'usr_admin_05', action: 'Thêm dữ liệu môn học', targetType: 'CourseOffering', targetId: 'off_09', reason: 'Đồng bộ danh mục học kỳ Fall 2026', createdAt: '2026-10-05T08:45:00Z' },
  { id: 'log_06', actorId: 'usr_admin_05', action: 'Tạm ẩn câu lạc bộ', targetType: 'Club', targetId: 'club_04', reason: 'Thông tin đại diện cần được xác minh lại', createdAt: '2026-10-04T16:00:00Z' },
  { id: 'log_05', actorId: 'usr_admin_05', action: 'Yêu cầu chỉnh sửa chương trình', targetType: 'ProgramChannel', targetId: 'prog_04', reason: 'Thiếu thông tin an toàn và địa điểm', createdAt: '2026-10-03T11:25:00Z' },
  { id: 'log_04', actorId: 'usr_admin_05', action: 'Mở khóa tài khoản', targetType: 'User', targetId: 'usr_student_03', reason: 'Đã xác minh yêu cầu hỗ trợ', createdAt: '2026-10-02T13:10:00Z' },
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
