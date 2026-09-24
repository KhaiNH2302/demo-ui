import type { SemanticTier } from '@/types/status';

export interface StatusMetaItem {
  tier: SemanticTier;
  label: string;
}

export const statusMeta = {
  swapRequest: {
    Open:      { tier: 'pending', label: 'Đang mở' },
    Connected: { tier: 'success', label: 'Đã kết nối' },
    Cancelled: { tier: 'danger',  label: 'Đã hủy' },
  },
  swapConnection: {
    Pending:   { tier: 'pending', label: 'Chờ phản hồi' },
    Confirmed: { tier: 'success', label: 'Đã xác nhận' },
    Rejected:  { tier: 'danger',  label: 'Đã từ chối' },
    Cancelled: { tier: 'danger',  label: 'Đã hủy' },
  },
  post: {
    Published:    { tier: 'success',   label: 'Đã đăng' },
    PendingReview:{ tier: 'attention', label: 'Chờ kiểm duyệt' },
    Rejected:     { tier: 'danger',    label: 'Bị từ chối' },
    Closed:       { tier: 'neutral',   label: 'Đã đóng' },
  },
  groupJoinRequest: {
    Pending:  { tier: 'pending', label: 'Chờ duyệt' },
    Approved: { tier: 'success', label: 'Đã duyệt' },
    Rejected: { tier: 'danger',  label: 'Bị từ chối' },
  },
  clubApproval: {
    PendingApproval: { tier: 'pending', label: 'Chờ duyệt' },
    Approved:        { tier: 'success', label: 'Đã duyệt' },
    Rejected:        { tier: 'danger',  label: 'Bị từ chối' },
  },
  recruitment: {
    Draft:     { tier: 'neutral', label: 'Nháp' },
    Published: { tier: 'pending', label: 'Đang tuyển' },
    Closed:    { tier: 'neutral', label: 'Đã đóng' },
  },
  application: {
    Submitted:       { tier: 'pending',   label: 'Đã nộp' },
    NeedsSupplement: { tier: 'attention', label: 'Cần bổ sung' },
    Screening:       { tier: 'pending',   label: 'Đang sàng lọc' },
    Interview:       { tier: 'attention', label: 'Phỏng vấn' },
    Accepted:        { tier: 'success',   label: 'Trúng tuyển' },
    Rejected:        { tier: 'danger',    label: 'Không trúng tuyển' },
  },
  membership: {
    Active:    { tier: 'success', label: 'Đang hoạt động' },
    Suspended: { tier: 'danger',  label: 'Tạm ngưng' },
    Left:      { tier: 'neutral', label: 'Đã rời' },
  },
  event: {
    Published: { tier: 'pending', label: 'Sắp diễn ra' },
    Ongoing:   { tier: 'attention', label: 'Đang diễn ra' },
    Finished:  { tier: 'neutral', label: 'Đã kết thúc' },
  },
  task: {
    Todo:       { tier: 'neutral',   label: 'Chưa làm' },
    InProgress: { tier: 'attention', label: 'Đang làm' },
    Done:       { tier: 'success',   label: 'Hoàn thành' },
  },
  expense: {
    PendingApproval: { tier: 'pending', label: 'Chờ duyệt' },
    Approved:        { tier: 'success', label: 'Đã duyệt' },
    Rejected:        { tier: 'danger',  label: 'Bị từ chối' },
  },
  mentoringRequest: {
    PENDING_MENTOR_RESPONSE: { tier: 'pending', label: 'Chờ Mentor phản hồi' },
    ACCEPTED:                { tier: 'success', label: 'Đã kết nối' },
    REJECTED:                { tier: 'danger',  label: 'Bị từ chối' },
  },
  userAccount: {
    active:     { tier: 'success',   label: 'Hoạt động' },
    locked:     { tier: 'danger',    label: 'Bị khóa' },
    unverified: { tier: 'attention', label: 'Chưa xác minh' },
  },
  violationReport: {
    Open:     { tier: 'pending', label: 'Chưa xử lý' },
    Resolved: { tier: 'success', label: 'Đã xử lý' },
  },
} as const;

export type StatusGroup = keyof typeof statusMeta;
