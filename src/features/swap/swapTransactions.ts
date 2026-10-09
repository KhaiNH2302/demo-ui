import type { SwapConnection, SwapRequest } from '@/types/entities';

export type SwapConnectionDetails = SwapConnection & {
  requestA?: SwapRequest;
  requestB?: SwapRequest;
  conversationId?: string;
};

export class SwapRuleError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 409) {
    super(message);
    this.name = 'SwapRuleError';
    this.code = code;
    this.status = status;
  }
}

export function assertSwapRequestOwner(request: SwapRequest, viewerId: string) {
  if (viewerId === 'guest' || request.studentId !== viewerId) {
    throw new SwapRuleError('FORBIDDEN', 'Bạn không có quyền thay đổi yêu cầu này.', 403);
  }
}

export function createSwapInvitation(
  requests: SwapRequest[],
  connections: SwapConnection[],
  viewerId: string,
  input: { requestAId: string; requestBId: string; message?: string },
  id: string,
  now: string,
): SwapConnection {
  const requestA = requests.find((request) => request.id === input.requestAId);
  const requestB = requests.find((request) => request.id === input.requestBId);
  if (!requestA || !requestB) {
    throw new SwapRuleError('NOT_FOUND', 'Yêu cầu đổi lớp không tồn tại.', 404);
  }
  assertSwapRequestOwner(requestA, viewerId);
  if (requestA.studentId === requestB.studentId || requestA.offeringId !== requestB.offeringId) {
    throw new SwapRuleError('INVALID_SWAP_PAIR', 'Hai yêu cầu phải cùng môn học và thuộc hai sinh viên khác nhau.', 422);
  }
  if (requestA.status !== 'Open' || requestB.status !== 'Open') {
    throw new SwapRuleError('REQUEST_CLOSED', 'Một trong hai yêu cầu đổi lớp đã đóng hoặc không khả dụng.');
  }
  const duplicate = connections.some((connection) => connection.status === 'Pending' && (
    (connection.requestAId === requestA.id && connection.requestBId === requestB.id) ||
    (connection.requestAId === requestB.id && connection.requestBId === requestA.id)
  ));
  if (duplicate) {
    throw new SwapRuleError('DUPLICATE_PENDING_CONNECTION', 'Hai yêu cầu này đã có lời mời đang chờ phản hồi.');
  }
  const connection: SwapConnection = {
    id,
    requestAId: requestA.id,
    requestBId: requestB.id,
    initiatorId: viewerId,
    recipientId: requestB.studentId,
    message: input.message?.trim() || undefined,
    status: 'Pending',
    createdAt: now,
  };
  connections.unshift(connection);
  return connection;
}

/** All checks and writes run synchronously, after the handler's simulated delay. */
export function acceptSwapInvitation(
  requests: SwapRequest[],
  connections: SwapConnection[],
  connectionId: string,
  viewerId: string,
  now: string,
  versions?: { requestAVersion?: number; requestBVersion?: number },
) {
  const connection = connections.find((item) => item.id === connectionId);
  if (!connection) throw new SwapRuleError('NOT_FOUND', 'Không tìm thấy lời mời.', 404);
  if (viewerId === 'guest' || connection.recipientId !== viewerId) {
    throw new SwapRuleError('FORBIDDEN', 'Chỉ người nhận mới có thể chấp nhận lời mời này.', 403);
  }
  if (connection.status !== 'Pending') {
    throw new SwapRuleError('CONNECTION_NOT_PENDING', 'Lời mời đã được xử lý hoặc hủy. Vui lòng tải lại.');
  }
  const requestA = requests.find((request) => request.id === connection.requestAId);
  const requestB = requests.find((request) => request.id === connection.requestBId);
  if (!requestA || !requestB || requestA.status !== 'Open' || requestB.status !== 'Open') {
    throw new SwapRuleError('SWAP_ALREADY_CONNECTED', 'Một trong hai yêu cầu đã đóng hoặc kết nối với đối tác khác.');
  }
  if (
    requestA.studentId === requestB.studentId || requestA.offeringId !== requestB.offeringId ||
    requestA.studentId !== connection.initiatorId || requestB.studentId !== connection.recipientId
  ) {
    throw new SwapRuleError('INVALID_SWAP_PAIR', 'Thông tin hai yêu cầu không còn phù hợp với lời mời.', 422);
  }
  if (
    (versions?.requestAVersion !== undefined && versions.requestAVersion !== requestA.version) ||
    (versions?.requestBVersion !== undefined && versions.requestBVersion !== requestB.version)
  ) {
    throw new SwapRuleError('VERSION_CONFLICT', 'Yêu cầu đã thay đổi. Vui lòng tải lại và xem xét thông tin mới.');
  }
  const requestIds = new Set([requestA.id, requestB.id]);
  if (connections.some((item) => item.id !== connection.id && item.status === 'Confirmed' && (
    requestIds.has(item.requestAId) || requestIds.has(item.requestBId)
  ))) {
    throw new SwapRuleError('SWAP_ALREADY_CONNECTED', 'Yêu cầu đã được kết nối với một đối tác khác.');
  }

  connection.status = 'Confirmed';
  connection.respondedAt = now;
  for (const request of [requestA, requestB]) {
    request.status = 'Connected';
    request.version += 1;
    request.updatedAt = now;
    request.locked = true;
    request.pendingConnectionCount = 0;
  }
  for (const other of connections) {
    if (other.id !== connection.id && other.status === 'Pending' && (
      requestIds.has(other.requestAId) || requestIds.has(other.requestBId)
    )) {
      other.status = 'Cancelled';
      other.respondedAt = now;
      other.cancelReason = 'Một yêu cầu đã kết nối thành công với đối tác khác.';
    }
  }
  return { connection, requestA, requestB };
}

export function rejectSwapInvitation(
  connections: SwapConnection[], connectionId: string, viewerId: string, now: string,
) {
  const connection = connections.find((item) => item.id === connectionId);
  if (!connection) throw new SwapRuleError('NOT_FOUND', 'Không tìm thấy lời mời.', 404);
  if (viewerId === 'guest' || (viewerId !== connection.recipientId && viewerId !== connection.initiatorId)) {
    throw new SwapRuleError('FORBIDDEN', 'Bạn không có quyền phản hồi lời mời này.', 403);
  }
  if (connection.status !== 'Pending') {
    throw new SwapRuleError('CONNECTION_NOT_PENDING', 'Lời mời đã được xử lý hoặc hủy. Vui lòng tải lại.');
  }
  connection.status = viewerId === connection.initiatorId ? 'Cancelled' : 'Rejected';
  connection.respondedAt = now;
  if (connection.status === 'Cancelled') connection.cancelReason = 'Người gửi đã thu hồi lời mời.';
  return connection;
}
