import { http, HttpResponse } from 'msw';
import { seedGroups, seedGroupMembers, seedJoinRequests, seedGroupInvitations, groupMemberIds, syncGroupMembership, ensureGroupConversation, type ManagedGroup, type GroupInvitation } from '../data/groups';
import { seedUsers } from '../data/users';
import { seedConversations, seedMessages } from '../data/conversations';
import { seedNotifications } from '../data/notifications';
import { mockDelay, isScenarioActive, getViewerId } from '../utils';
import type { Group, GroupJoinRequest, AiGroupMatch, AiMemberSuggestion } from '@/types/entities';

class GroupError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}
type EndpointInput = { request: Request; params: Record<string, string | readonly string[] | undefined> };
const endpoint = (resolver: (input: EndpointInput) => unknown | Promise<unknown>) => async (input: EndpointInput) => {
  try { return HttpResponse.json({ data: await resolver(input) }); }
  catch (error) {
    if (error instanceof GroupError) return HttpResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
};
function authenticatedUser(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const id = auth.startsWith('Bearer mock_jwt_token_') ? auth.slice('Bearer mock_jwt_token_'.length) : '';
  const user = seedUsers.find((item) => item.id === id && item.status === 'active');
  if (!user) throw new GroupError('UNAUTHORIZED', 401, 'Vui lòng đăng nhập để tiếp tục.');
  return user;
}
function findGroup(id: string | readonly string[] | undefined) {
  const group = seedGroups.find((item) => item.id === id);
  if (!group) throw new GroupError('NOT_FOUND', 404, 'Nhóm không tồn tại.');
  syncGroupMembership(group);
  return group;
}
function requireOwner(group: ManagedGroup, request: Request) {
  const user = authenticatedUser(request);
  if (group.ownerId !== user.id || isScenarioActive('forbidden')) throw new GroupError('FORBIDDEN', 403, 'Chỉ trưởng nhóm được thực hiện thao tác này.');
  return user;
}
function requireActive(group: ManagedGroup) {
  if (group.status === 'Closed') throw new GroupError('GROUP_CLOSED', 409, 'Nhóm đã đóng.');
}
function requireCapacity(group: ManagedGroup) {
  syncGroupMembership(group);
  if (group.memberCount >= group.memberLimit) throw new GroupError('GROUP_FULL', 409, 'Nhóm đã đủ thành viên.');
}
function addMember(group: ManagedGroup, userId: string) {
  requireActive(group);
  if (groupMemberIds(group.id).includes(userId)) throw new GroupError('ALREADY_MEMBER', 409, 'Sinh viên đã là thành viên nhóm.');
  requireCapacity(group);
  seedGroupMembers.push({ groupId: group.id, userId, role: 'member', joinedAt: new Date().toISOString() });
  seedJoinRequests.filter((item) => item.groupId === group.id && item.userId === userId && item.status === 'Pending').forEach((item) => { item.status = 'Approved'; });
  seedGroupInvitations.filter((item) => item.groupId === group.id && item.userId === userId && item.status === 'Pending').forEach((item) => { item.status = 'Accepted'; item.respondedAt = new Date().toISOString(); });
  ensureGroupConversation(group);
}
function notify(userId: string, group: ManagedGroup, title: string, body: string, linkTo = '/groups/' + group.id) {
  seedNotifications.unshift({ id: 'notif_group_' + crypto.randomUUID(), userId, source: 'GroupJoin', title, body, linkTo, read: false, createdAt: new Date().toISOString() });
}
function editableSettings(body: Partial<Group>, memberCount: number) {
  if (body.memberLimit !== undefined && (!Number.isInteger(body.memberLimit) || body.memberLimit < Math.max(2, memberCount) || body.memberLimit > 30)) throw new GroupError('INVALID_CAPACITY', 422, 'Sức chứa phải từ 2 đến 30 và không nhỏ hơn số thành viên hiện tại.');
  if (body.name !== undefined && body.name.trim().length < 5) throw new GroupError('INVALID_NAME', 422, 'Tên nhóm phải từ 5 ký tự.');
  if (body.topic !== undefined && body.topic.trim().length < 5) throw new GroupError('INVALID_TOPIC', 422, 'Chủ đề phải từ 5 ký tự.');
  if (body.joinMode !== undefined && !['direct', 'approval'].includes(body.joinMode)) throw new GroupError('INVALID_JOIN_MODE', 422, 'Chế độ tham gia không hợp lệ.');
  const allowed: Partial<Group> = {};
  for (const field of ['name', 'purpose', 'topic', 'skills', 'activityTime', 'interests', 'joinMode', 'memberLimit', 'category', 'targetGoal', 'rolesNeeded', 'rolesFilled', 'campus', 'location'] as const) if (body[field] !== undefined) Object.assign(allowed, { [field]: body[field] });
  return allowed;
}
export const groupHandlers = [
  http.get('/api/v1/groups', endpoint(async () => {
    await mockDelay(); seedGroups.forEach(syncGroupMembership);
    return seedGroups.filter((group) => group.status !== 'Closed');
  })),
  http.post('/api/v1/groups/search', endpoint(async ({ request }) => {
    const body = await request.json() as { mode?: 'ai' | 'filter'; purpose?: string; skills?: string[] };
    if (body.mode === 'ai' && isScenarioActive('ai_timeout')) { await mockDelay(2000, 3000); throw new GroupError('AI_TIMEOUT', 504, 'Dịch vụ gợi ý AI không phản hồi kịp thời.'); }
    await mockDelay(200, 400); seedGroups.forEach(syncGroupMembership);
    const groups = seedGroups.filter((group) => group.status !== 'Closed' && (!body.purpose || group.purpose === body.purpose));
    if (body.mode === 'ai') return groups.map((group, index): AiGroupMatch => ({ groupId: group.id, score: 95 - index * 10, reasons: ['Trùng khớp mục đích hoạt động', 'Khung giờ rảnh tương thích', 'Kỹ năng phù hợp với nhóm'] }));
    return groups;
  })),
  http.get('/api/v1/groups/mine', endpoint(async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    seedGroups.forEach(syncGroupMembership);
    const owned = new URL(request.url).searchParams.get('role') === 'owner';
    const filtered = seedGroups.filter((group) => owned ? group.ownerId === userId : group.ownerId !== userId && groupMemberIds(group.id).includes(userId));
    return filtered.map((group) => ({
      ...group,
      pendingRequestsCount: seedJoinRequests.filter((r) => r.groupId === group.id && r.status === 'Pending').length,
    }));
  })),
  http.get('/api/v1/join-requests/mine', endpoint(async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    return seedJoinRequests
      .filter((item) => item.userId === userId)
      .map((item) => {
        const group = seedGroups.find((g) => g.id === item.groupId);
        return {
          ...item,
          groupName: group?.name || item.groupId,
          groupTopic: group?.topic,
          category: group?.category,
        };
      });
  })),
  http.get('/api/v1/group-invitations', endpoint(async ({ request }) => {
    await mockDelay(); const userId = getViewerId(request);
    return seedGroupInvitations.filter((item) => item.userId === userId).map((item) => ({ ...item, groupName: seedGroups.find((group) => group.id === item.groupId)?.name }));
  })),
  http.get('/api/v1/groups/:id', endpoint(async ({ params }) => {
    await mockDelay(); const group = findGroup(params.id);
    return { ...group, members: seedGroupMembers.filter((member) => member.groupId === group.id) };
  })),
  http.post('/api/v1/groups', endpoint(async ({ request }) => {
    await mockDelay(); const user = authenticatedUser(request); const body = await request.json() as Partial<Group>; editableSettings(body, 1);
    if (!body.name || !body.topic || !body.purpose) throw new GroupError('INVALID_GROUP', 422, 'Điền tên, mục đích và chủ đề nhóm.');
    const group: ManagedGroup = { id: 'grp_' + crypto.randomUUID(), ownerId: user.id, name: body.name.trim(), purpose: body.purpose, topic: body.topic.trim(), skills: body.skills || [], activityTime: body.activityTime || [], interests: body.interests || '', joinMode: body.joinMode || 'approval', memberCount: 1, memberLimit: body.memberLimit ?? 5, status: 'Active', category: body.category || 'project', targetGoal: body.targetGoal || '', rolesNeeded: body.rolesNeeded || [], rolesFilled: body.rolesFilled || ['Trưởng nhóm'], campus: body.campus || user.campus || 'Hòa Lạc', location: body.location || '', createdAt: new Date().toISOString() };
    seedGroups.unshift(group); seedGroupMembers.push({ groupId: group.id, userId: user.id, role: 'owner', joinedAt: group.createdAt }); ensureGroupConversation(group); return group;
  })),
  http.post('/api/v1/groups/:id/conversation', endpoint(({ params, request }) => {
    const group = findGroup(params.id);
    const user = authenticatedUser(request);
    requireActive(group);
    if (!groupMemberIds(group.id).includes(user.id)) throw new GroupError('FORBIDDEN', 403, 'Chỉ thành viên được xem chat nhóm.');
    const conversation = ensureGroupConversation(group);
    if (!seedMessages.some((m) => m.conversationId === conversation.id)) {
      const now = new Date().toISOString();
      seedMessages.push({
        id: 'msg_welcome_' + conversation.id,
        conversationId: conversation.id,
        senderId: group.ownerId,
        content: 'Chào mừng các bạn đã tham gia kênh chat nội bộ nhóm ' + group.name + '! Mọi người cùng thảo luận kế hoạch làm việc nhé.',
        type: 'text',
        status: 'sent',
        createdAt: now,
      });
      conversation.lastMessage = 'Chào mừng các bạn đã tham gia kênh chat nội bộ nhóm ' + group.name + '!';
      conversation.lastMessageAt = now;
    }
    return conversation;
  })),
  http.post('/api/v1/groups/:id/join-requests', endpoint(async ({ params, request }) => {
    await mockDelay(); const body = await request.json() as { message?: string; appliedRole?: string };
    const user = authenticatedUser(request); const group = findGroup(params.id); requireActive(group);
    if (groupMemberIds(group.id).includes(user.id)) throw new GroupError('ALREADY_MEMBER', 409, 'Bạn đã là thành viên nhóm.');
    requireCapacity(group);
    if (seedJoinRequests.some((item) => item.groupId === group.id && item.userId === user.id && item.status === 'Pending')) throw new GroupError('REQUEST_PENDING', 409, 'Bạn đã gửi yêu cầu và đang chờ duyệt.');
    if (group.joinMode === 'direct') { addMember(group, user.id); notify(group.ownerId, group, 'Có thành viên mới', user.fullName + ' đã tham gia nhóm.'); return { joined: true }; }
    const item: GroupJoinRequest = { id: 'jreq_' + crypto.randomUUID(), groupId: group.id, userId: user.id, message: body.message?.trim(), appliedRole: body.appliedRole?.trim(), status: 'Pending', createdAt: new Date().toISOString() };
    seedJoinRequests.push(item); notify(group.ownerId, group, 'Có yêu cầu tham gia nhóm', user.fullName + ' muốn tham gia nhóm.', '/groups/' + group.id + '/manage'); return item;
  })),
  http.get('/api/v1/groups/:id/join-requests', endpoint(({ params, request }) => {
    const group = findGroup(params.id); requireOwner(group, request);
    return seedJoinRequests.filter((item) => item.groupId === group.id && item.status === 'Pending');
  })),
  http.post('/api/v1/groups/:id/join-requests/:reqId/:decision', endpoint(async ({ params, request }) => {
    await mockDelay(); const group = findGroup(params.id); requireOwner(group, request); requireActive(group);
    const item = seedJoinRequests.find((entry) => entry.id === params.reqId && entry.groupId === group.id);
    if (!item) throw new GroupError('NOT_FOUND', 404, 'Yêu cầu không tồn tại trong nhóm này.');
    if (item.status !== 'Pending') throw new GroupError('REQUEST_RESOLVED', 409, 'Yêu cầu đã được xử lý.');
    if (params.decision === 'approve') { addMember(group, item.userId); item.status = 'Approved'; }
    else if (params.decision === 'reject') item.status = 'Rejected';
    else throw new GroupError('INVALID_DECISION', 422, 'Quyết định không hợp lệ.');
    notify(item.userId, group, 'Kết quả yêu cầu tham gia nhóm', item.status === 'Approved' ? 'Bạn đã được duyệt vào nhóm.' : 'Yêu cầu của bạn đã bị từ chối.'); return item;
  })),
  http.get('/api/v1/groups/:id/ai-suggested-members', endpoint(async ({ params, request }) => {
    await mockDelay(200, 400); const group = findGroup(params.id); requireOwner(group, request); requireActive(group);
    if (isScenarioActive('ai_timeout')) throw new GroupError('AI_TIMEOUT', 504, 'Dịch vụ gợi ý AI đang không khả dụng.');
    const excluded = new Set([...groupMemberIds(group.id), ...seedGroupInvitations.filter((item) => item.groupId === group.id && item.status === 'Pending').map((item) => item.userId)]);
    return seedUsers.filter((user) => user.roles.includes('student') && user.status === 'active' && !excluded.has(user.id)).slice(0, 3).map((user, index): AiMemberSuggestion => ({ userId: user.id, score: 92 - index * 8, reasons: ['Kỹ năng phù hợp với yêu cầu của nhóm', 'Có khung giờ sinh hoạt tương thích'] }));
  })),
  http.post('/api/v1/groups/:id/invitations', endpoint(async ({ params, request }) => {
    const body = await request.json() as { userId: string; message?: string };
    const group = findGroup(params.id); const owner = requireOwner(group, request); requireActive(group); requireCapacity(group);
    const target = seedUsers.find((user) => user.id === body.userId && user.status === 'active');
    if (!target) throw new GroupError('USER_NOT_FOUND', 404, 'Sinh viên không tồn tại hoặc tài khoản không hoạt động.');
    if (groupMemberIds(group.id).includes(target.id)) throw new GroupError('ALREADY_MEMBER', 409, 'Sinh viên đã là thành viên nhóm.');
    if (seedGroupInvitations.some((item) => item.groupId === group.id && item.userId === target.id && item.status === 'Pending')) throw new GroupError('INVITATION_PENDING', 409, 'Sinh viên đã có lời mời đang chờ phản hồi.');
    const invitation: GroupInvitation = { id: 'ginv_' + crypto.randomUUID(), groupId: group.id, userId: target.id, invitedBy: owner.id, message: body.message?.trim(), status: 'Pending', createdAt: new Date().toISOString() };
    seedGroupInvitations.push(invitation); notify(target.id, group, 'Bạn được mời tham gia nhóm', owner.fullName + ' mời bạn tham gia ' + group.name + '.', '/groups/me?tab=invitations'); return invitation;
  })),
  http.post('/api/v1/groups/:id/invitations/:invId/:decision', endpoint(async ({ params, request }) => {
    const user = authenticatedUser(request); const group = findGroup(params.id);
    const invitation = seedGroupInvitations.find((item) => item.id === params.invId && item.groupId === group.id);
    if (!invitation) throw new GroupError('NOT_FOUND', 404, 'Lời mời không tồn tại.');
    if (invitation.userId !== user.id) throw new GroupError('FORBIDDEN', 403, 'Chỉ người nhận được phản hồi lời mời.');
    if (invitation.status !== 'Pending') throw new GroupError('INVITATION_RESOLVED', 409, 'Lời mời đã được xử lý.');
    if (params.decision === 'accept') { addMember(group, user.id); invitation.status = 'Accepted'; }
    else if (params.decision === 'decline') invitation.status = 'Declined';
    else throw new GroupError('INVALID_DECISION', 422, 'Quyết định không hợp lệ.');
    invitation.respondedAt = new Date().toISOString(); notify(group.ownerId, group, 'Lời mời nhóm đã có phản hồi', user.fullName + (invitation.status === 'Accepted' ? ' đã tham gia nhóm.' : ' đã từ chối lời mời.')); return invitation;
  })),
  http.delete('/api/v1/groups/:id/members/:userId', endpoint(({ params, request }) => {
    const group = findGroup(params.id); requireOwner(group, request); requireActive(group);
    if (params.userId === group.ownerId) throw new GroupError('OWNER_REQUIRED', 409, 'Không thể xóa trưởng nhóm.');
    const index = seedGroupMembers.findIndex((member) => member.groupId === group.id && member.userId === params.userId);
    if (index < 0) throw new GroupError('NOT_MEMBER', 404, 'Sinh viên không còn là thành viên nhóm.');
    const [removed] = seedGroupMembers.splice(index, 1); syncGroupMembership(group); notify(removed.userId, group, 'Bạn đã rời nhóm', 'Trưởng nhóm đã xóa bạn khỏi danh sách thành viên.'); return { success: true, memberCount: group.memberCount };
  })),
  http.post('/api/v1/groups/:id/leave', endpoint(({ params, request }) => {
    const group = findGroup(params.id); const user = authenticatedUser(request); requireActive(group);
    if (group.ownerId === user.id) throw new GroupError('OWNER_REQUIRED', 409, 'Trưởng nhóm cần đóng nhóm thay vì rời nhóm.');
    const index = seedGroupMembers.findIndex((member) => member.groupId === group.id && member.userId === user.id);
    if (index < 0) throw new GroupError('NOT_MEMBER', 409, 'Bạn không phải thành viên nhóm.');
    seedGroupMembers.splice(index, 1); syncGroupMembership(group); notify(group.ownerId, group, 'Một thành viên đã rời nhóm', user.fullName + ' đã rời nhóm.'); return { success: true, memberCount: group.memberCount };
  })),
  http.post('/api/v1/groups/:id/close', endpoint(async ({ params, request }) => {
    const body = await request.json() as { reason: string };
    const group = findGroup(params.id); requireOwner(group, request); requireActive(group);
    if (!body.reason?.trim()) throw new GroupError('REASON_REQUIRED', 422, 'Vui lòng nhập lý do đóng nhóm.');
    groupMemberIds(group.id).filter((userId) => userId !== group.ownerId).forEach((userId) => notify(userId, group, 'Nhóm đã đóng', body.reason.trim()));
    group.status = 'Closed'; group.closedReason = body.reason.trim(); group.closedAt = new Date().toISOString();
    for (let index = seedGroupMembers.length - 1; index >= 0; index--) if (seedGroupMembers[index].groupId === group.id) seedGroupMembers.splice(index, 1);
    seedJoinRequests.filter((item) => item.groupId === group.id && item.status === 'Pending').forEach((item) => { item.status = 'Cancelled'; });
    seedGroupInvitations.filter((item) => item.groupId === group.id && item.status === 'Pending').forEach((item) => { item.status = 'Cancelled'; item.respondedAt = group.closedAt; });
    syncGroupMembership(group); return group;
  })),
  http.post('/api/v1/groups/:id/message-invitations', endpoint(async ({ params, request }) => {
    const body = await request.json() as { userId: string; message: string };
    const group = findGroup(params.id); const owner = requireOwner(group, request); requireActive(group);
    const target = seedUsers.find((user) => user.id === body.userId && user.status === 'active');
    if (!target || target.id === owner.id) throw new GroupError('INVALID_RECIPIENT', 422, 'Người nhận không hợp lệ.');
    if (!body.message?.trim()) throw new GroupError('MESSAGE_REQUIRED', 422, 'Vui lòng nhập nội dung tin nhắn.');
    let conversation = seedConversations.find((item) => item.kind === 'direct' && item.participantIds.includes(owner.id) && item.participantIds.includes(target.id));
    if (conversation?.requestStatus === 'blocked' || conversation?.requestStatus === 'declined') throw new GroupError('CONVERSATION_CLOSED', 409, 'Không thể gửi lời mời vào hội thoại này.');
    if (conversation?.requestStatus === 'pending') throw new GroupError('MESSAGE_INVITATION_PENDING', 409, 'Đã có lời mời trò chuyện đang chờ phản hồi.');
    const now = new Date().toISOString();
    if (!conversation) {
      conversation = { id: 'conv_dir_' + crypto.randomUUID(), kind: 'direct', refId: target.id, title: target.fullName, avatarUrl: target.avatarUrl, participantIds: [owner.id, target.id], requestStatus: 'pending', requestedBy: owner.id, unreadCount: 1 };
      seedConversations.unshift(conversation);
    }
    seedMessages.push({ id: 'msg_' + crypto.randomUUID(), conversationId: conversation.id, senderId: owner.id, content: body.message.trim(), type: 'text', status: 'sent', createdAt: now });
    conversation.lastMessage = body.message.trim(); conversation.lastMessageAt = now;
    notify(target.id, group, 'Có lời mời trò chuyện về nhóm', owner.fullName + ': ' + body.message.trim(), '/chats/' + conversation.id); return { id: conversation.id };
  })),
  http.put('/api/v1/groups/:id/settings', endpoint(async ({ params, request }) => {
    const body = await request.json() as Partial<Group>;
    const group = findGroup(params.id); requireOwner(group, request); requireActive(group);
    Object.assign(group, editableSettings(body, group.memberCount)); syncGroupMembership(group); return group;
  })),
];
