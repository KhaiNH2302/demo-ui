import type { MentoringRequest } from '@/types/entities';

// Quy tắc thời hạn của kết nối chờ bắt đầu lớp. Dùng chung cho giao diện và mock để hai bên luôn khớp nhau.
export const CONNECTION_EXPIRY_DAYS = 14;
// Từ ngày này trở đi thẻ chuyển vàng để nhắc hai bên chốt hoặc kết thúc
export const CONNECTION_STALE_DAYS = 7;

const DAY_MS = 86_400_000;

// Lớp đã bắt đầu thì không còn hạn. Dữ liệu cũ chưa có connectedAt thì tính từ lúc gửi yêu cầu.
const connectedSince = (req: Pick<MentoringRequest, 'connectedAt' | 'createdAt'>) =>
  new Date(req.connectedAt ?? req.createdAt).getTime();

export const connectionAgeDays = (req: Pick<MentoringRequest, 'connectedAt' | 'createdAt'>, now = Date.now()) =>
  Math.max(0, Math.floor((now - connectedSince(req)) / DAY_MS));

export const connectionDaysLeft = (req: Pick<MentoringRequest, 'connectedAt' | 'createdAt'>, now = Date.now()) =>
  Math.max(0, CONNECTION_EXPIRY_DAYS - connectionAgeDays(req, now));

export const isConnectionExpired = (
  req: Pick<MentoringRequest, 'status' | 'classStartedAt' | 'connectedAt' | 'createdAt'>,
  now = Date.now()
) => req.status === 'ACCEPTED' && !req.classStartedAt && connectionAgeDays(req, now) >= CONNECTION_EXPIRY_DAYS;

// Yêu cầu đã kết thúc hoặc hết hạn thì bị khóa: chỉ xem lại, không còn thao tác nào
export const isRequestLocked = (req: Pick<MentoringRequest, 'status'>) => req.status === 'ENDED' || req.status === 'EXPIRED';

// Đã đóng = bị từ chối, kết thúc hoặc hết hạn: cùng một tab "Đã đóng" ở hộp thư hai phía
export const isRequestClosed = (req: Pick<MentoringRequest, 'status'>) => req.status === 'REJECTED' || isRequestLocked(req);

/** Dòng giải thích vì sao yêu cầu bị khóa, gọi theo góc nhìn của người đang xem. */
export const describeLockedRequest = (
  req: Pick<MentoringRequest, 'status' | 'endedBy' | 'endedReason' | 'mentorId'>,
  viewerId?: string
): string | null => {
  const next = 'Yêu cầu đã khóa, muốn học tiếp cần gửi yêu cầu mới.';
  if (req.status === 'EXPIRED') {
    return `Hết hạn sau ${CONNECTION_EXPIRY_DAYS} ngày kết nối mà lớp chưa bắt đầu. ${next}`;
  }
  if (req.status !== 'ENDED') return null;
  let who = 'Học viên';
  if (req.endedBy === viewerId) who = 'Bạn';
  else if (req.endedBy === req.mentorId) who = 'Mentor';
  const reason = req.endedReason ? ` Lý do: ${req.endedReason}.` : '';
  return `${who} đã kết thúc kết nối.${reason} ${next}`;
};
