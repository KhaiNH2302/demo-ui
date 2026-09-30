import type { LucideIcon } from 'lucide-react';
import {
  Repeat2,
  GraduationCap,
  Building2,
  UsersRound,
  MessageCircle,
  HeartHandshake,
} from 'lucide-react';
import type { SemanticTier } from '@/types/status';
import type { Conversation } from '@/types/entities';

export interface StatusMetaItem {
  tier: SemanticTier;
  label: string;
}

export const conversationKindMeta: Record<Conversation['kind'], { icon: LucideIcon; label: string }> = {
  swap: { icon: Repeat2, label: 'Đổi lớp' },
  mentoring: { icon: GraduationCap, label: 'Mentoring' },
  club: { icon: Building2, label: 'Cơ hội CLB' },
  opportunity: { icon: Building2, label: 'Cơ hội CLB' },
  program: { icon: HeartHandshake, label: 'Chương trình' },
  group: { icon: UsersRound, label: 'Nhóm' },
  direct: { icon: MessageCircle, label: 'Trực tiếp' },
};

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
    Draft:             { tier: 'neutral',   label: 'Bản nháp' },
    Published:         { tier: 'success',   label: 'Đã đăng' },
    PendingReview:     { tier: 'attention', label: 'Chờ kiểm duyệt' },
    TemporarilyHidden: { tier: 'attention', label: 'Tạm ẩn (nhiều báo cáo)' },
    Hidden:            { tier: 'neutral',   label: 'Đã ẩn' },
    Rejected:          { tier: 'danger',    label: 'Bị từ chối' },
    Closed:            { tier: 'neutral',   label: 'Đã đóng' },
  },
  groupJoinRequest: {
    Pending:  { tier: 'pending', label: 'Chờ duyệt' },
    Approved: { tier: 'success', label: 'Đã duyệt' },
    Rejected: { tier: 'danger',  label: 'Bị từ chối' },
  },
  // FE-04 — Club Connection (29/09/2026)
  club: {
    Active: { tier: 'success', label: 'Đang hoạt động' },
    Hidden: { tier: 'neutral', label: 'Đang tạm ẩn' },
  },
  representativeRequest: {
    Pending:  { tier: 'pending', label: 'Chờ xác minh' },
    Verified: { tier: 'success', label: 'Đã xác minh' },
    Rejected: { tier: 'danger',  label: 'Từ chối' },
  },
  opportunity: {
    Draft:     { tier: 'neutral', label: 'Bản nháp' },
    Published: { tier: 'success', label: 'Đang mở đăng ký' },
    Closed:    { tier: 'neutral', label: 'Đã đóng nhận đơn' },
    Expired:   { tier: 'neutral', label: 'Đã hết hạn' },
    Cancelled: { tier: 'danger',  label: 'Đã hủy' },
  },
  opportunityResponse: {
    Draft:         { tier: 'neutral',   label: 'Bản nháp' },
    Submitted:     { tier: 'pending',   label: 'Đã gửi đăng ký' },
    UnderReview:   { tier: 'pending',   label: 'CLB đang xem xét' },
    NeedsMoreInfo: { tier: 'attention', label: 'Cần bổ sung thông tin' },
    Confirmed:     { tier: 'success',   label: 'Đã xác nhận tham gia' },
    Accepted:      { tier: 'success',   label: 'Được chấp nhận' },
    Rejected:      { tier: 'danger',    label: 'Chưa phù hợp' },
    Withdrawn:     { tier: 'neutral',   label: 'Đã rút đăng ký' },
    Expired:       { tier: 'neutral',   label: 'Quá hạn phản hồi' },
    Cancelled:     { tier: 'neutral',   label: 'Bài đăng đã hủy' },
  },
  connectionInvite: {
    Pending:   { tier: 'pending', label: 'Chờ phản hồi' },
    Accepted:  { tier: 'success', label: 'Đã kết nối' },
    Declined:  { tier: 'neutral', label: 'Đã từ chối' },
    Withdrawn: { tier: 'neutral', label: 'Đã thu hồi' },
    Cancelled: { tier: 'neutral', label: 'Đã hủy' },
  },
  // FE-06 — Programs (29/09/2026)
  programChannel: {
    Draft:         { tier: 'neutral', label: 'Bản nháp' },
    PendingReview: { tier: 'pending', label: 'Chờ Admin duyệt' },
    Rejected:      { tier: 'danger',  label: 'Cần chỉnh sửa' },
    Published:     { tier: 'success', label: 'Đang mở đăng ký' },
    Closed:        { tier: 'neutral', label: 'Đã đóng đăng ký' },
    Expired:       { tier: 'neutral', label: 'Đã kết thúc' },
    Cancelled:     { tier: 'danger',  label: 'Đã hủy' },
  },
  programRegistration: {
    Submitted: { tier: 'pending', label: 'Chờ người tổ chức duyệt' },
    Confirmed: { tier: 'success', label: 'Đã xác nhận tham gia' },
    Rejected:  { tier: 'danger',  label: 'Chưa phù hợp' },
    Withdrawn: { tier: 'neutral', label: 'Đã hủy đăng ký' },
    Expired:   { tier: 'neutral', label: 'Kênh đã kết thúc' },
    Cancelled: { tier: 'neutral', label: 'Kênh đã hủy' },
  },
  coOrganizer: {
    Pending:  { tier: 'pending', label: 'Chờ xác nhận' },
    Accepted: { tier: 'success', label: 'Đồng tổ chức' },
    Declined: { tier: 'neutral', label: 'Đã từ chối' },
    Removed:  { tier: 'neutral', label: 'Đã gỡ' },
  },
  follow: {
    Pending:   { tier: 'pending', label: 'Đã gửi yêu cầu' },
    Active:    { tier: 'success', label: 'Đang theo dõi' },
    Declined:  { tier: 'neutral', label: 'Đã từ chối' },
    Withdrawn: { tier: 'neutral', label: 'Đã hủy yêu cầu' },
    Cancelled: { tier: 'neutral', label: 'Đã hủy' },
    Ended:     { tier: 'neutral', label: 'Đã bỏ theo dõi' },
  },
  // Legacy keys kept for backward compatibility
  clubApproval: {
    PendingApproval: { tier: 'pending', label: 'Chờ xác minh' },
    Approved:        { tier: 'success', label: 'Đã xác minh' },
    Rejected:        { tier: 'danger',  label: 'Bị từ chối' },
  },
  recruitment: {
    Draft:     { tier: 'neutral', label: 'Nháp' },
    Published: { tier: 'pending', label: 'Đang mở' },
    Closed:    { tier: 'neutral', label: 'Đã đóng' },
  },
  application: {
    Submitted:       { tier: 'pending',   label: 'Đã nộp' },
    NeedsSupplement: { tier: 'attention', label: 'Cần bổ sung' },
    Screening:       { tier: 'pending',   label: 'Đang xem xét' },
    Interview:       { tier: 'attention', label: 'Phỏng vấn' },
    Accepted:        { tier: 'success',   label: 'Được chấp nhận' },
    Rejected:        { tier: 'danger',    label: 'Chưa phù hợp' },
  },
  membership: {
    Active:    { tier: 'success', label: 'Đang hoạt động' },
    Suspended: { tier: 'danger',  label: 'Tạm ngưng' },
    Left:      { tier: 'neutral', label: 'Đã rời' },
  },
  event: {
    Published: { tier: 'pending',   label: 'Sắp diễn ra' },
    Ongoing:   { tier: 'attention', label: 'Đang diễn ra' },
    Finished:  { tier: 'neutral',   label: 'Đã kết thúc' },
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
    Pending:                 { tier: 'pending', label: 'Chờ Mentor phản hồi' },
    Accepted:                { tier: 'success', label: 'Đã kết nối' },
    Declined:                { tier: 'danger',  label: 'Bị từ chối' },
  },
  userAccount: {
    active:     { tier: 'success',   label: 'Hoạt động' },
    locked:     { tier: 'danger',    label: 'Bị khóa' },
    unverified: { tier: 'attention', label: 'Chưa xác minh' },
  },
  violationReport: {
    Open:        { tier: 'attention', label: 'Chưa xử lý' },
    UnderReview: { tier: 'pending',   label: 'Đang xem xét' },
    Resolved:    { tier: 'success',   label: 'Đã xử lý' },
    Rejected:    { tier: 'neutral',   label: 'Đã bác bỏ' },
  },
  mentorApplication: {
    Draft:         { tier: 'neutral',   label: 'Bản nháp' },
    Submitted:     { tier: 'pending',   label: 'Đã nộp' },
    UnderReview:   { tier: 'pending',   label: 'Đang xét duyệt' },
    NeedsMoreInfo: { tier: 'attention', label: 'Cần bổ sung' },
    Approved:      { tier: 'success',   label: 'Đã duyệt' },
    Rejected:      { tier: 'danger',    label: 'Không được duyệt' },
    Withdrawn:     { tier: 'neutral',   label: 'Đã rút' },
  },
} as const;

export type StatusGroup = keyof typeof statusMeta;
export const STATUS_META = statusMeta;

export function getStatusMeta(group: StatusGroup, status: string): StatusMetaItem {
  const g = statusMeta[group] as Record<string, StatusMetaItem> | undefined;
  return g?.[status] ?? { label: status, tier: 'neutral' };
}
