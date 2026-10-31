import { http, HttpResponse } from 'msw';
import { seedConversations, seedMessages } from '../data/conversations';
import { seedUsers } from '../data/users';
import { seedProgramChannels, seedProgramRegistrations } from '../data/programs';
import { seedGroups } from '../data/groups';
import { mockDelay, getViewerId } from '../utils';
import type { Conversation, Message, MessageAttachment } from '@/types/entities';

const error = (status: number, message: string) => HttpResponse.json({ error: { message } }, { status });
const authenticated = (request: Request) => !request.headers.has('X-Demo-Sample') && seedUsers.some(user => user.id === getViewerId(request) && user.status.toLowerCase() === 'active');
function accessError(request: Request, conversation?: Conversation) {
  if (!authenticated(request)) return error(401, 'Bạn cần đăng nhập để trò chuyện.');
  if (!conversation) return error(404, 'Không tìm thấy cuộc trò chuyện.');
  if (!conversation.participantIds.includes(getViewerId(request))) return error(403, 'Bạn không tham gia cuộc trò chuyện này.');
  return null;
}

export const chatHandlers = [
  http.get('/api/v1/conversations', async ({ request }) => {
    await mockDelay(80, 150);
    if (!authenticated(request)) return error(401, 'Bạn cần đăng nhập để trò chuyện.');
    for (const program of seedProgramChannels) {
      const participantIds = [...new Set([program.organizer.userId, ...seedProgramRegistrations.filter(r => r.programId === program.id && r.status === 'Confirmed').map(r => r.studentId)])];
      const groupId = `program-group-${program.id}`;
      const existing = seedConversations.find(c => c.id === groupId);
      if (existing) existing.participantIds = participantIds;
      else seedConversations.push({ id: groupId, kind: 'program', refId: program.id, title: `Nhóm hoạt động: ${program.title}`, participantIds, requestStatus: 'accepted', unreadCount: 0 });
    }
    return HttpResponse.json({ data: seedConversations.filter(c => c.participantIds.includes(getViewerId(request))) });
  }),

  http.get('/api/v1/conversations/:id/messages', async ({ params, request }) => {
    await mockDelay(80, 150);
    const conv = seedConversations.find(c => c.id === params.id);
    const denied = accessError(request, conv);
    if (denied) return denied;
    return HttpResponse.json({ data: seedMessages.filter(m => m.conversationId === params.id) });
  }),

  http.post('/api/v1/conversations/:id/messages', async ({ params, request }) => {
    await mockDelay(80, 150);
    const conv = seedConversations.find(c => c.id === params.id);
    const denied = accessError(request, conv);
    if (denied || !conv) return denied!;
    if (conv.requestStatus && conv.requestStatus !== 'accepted') return error(409, 'Lời mời trò chuyện cần được chấp nhận trước khi gửi thêm tin.');
    if (conv.kind === 'group' && seedGroups.find(g => g.id === conv.refId)?.status === 'Closed') return error(409, 'Nhóm đã đóng, không thể gửi thêm tin nhắn.');
    const body = await request.json() as { content?: string; type?: Message['type']; images?: string[]; attachments?: MessageAttachment[] };
    const type = body.type || 'text';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!['text', 'image', 'file', 'link', 'like'].includes(type)) return error(400, 'Loại tin nhắn không hợp lệ.');
    if (type !== 'like' && !content && !body.images?.length && !body.attachments?.length) return error(400, 'Tin nhắn không được để trống.');
    const newMsg: Message = {
      id: crypto.randomUUID(), conversationId: conv.id, senderId: getViewerId(request), content,
      type, images: body.images || [], attachments: body.attachments || [], reactions: {},
      status: 'sent', createdAt: new Date().toISOString(),
    };
    seedMessages.push(newMsg);
    conv.lastMessage = type === 'like' ? '👍 Đã gửi nút thích' : type === 'image' ? '📷 Đã gửi hình ảnh' : type === 'file' ? '📁 Đã gửi tệp đính kèm' : content;
    conv.lastMessageAt = newMsg.createdAt;
    conv.unreadCount = 0;
    return HttpResponse.json({ data: newMsg });
  }),

  http.post('/api/v1/conversations/direct', async ({ request }) => {
    await mockDelay(100, 200);
    if (!authenticated(request)) return error(401, 'Bạn cần đăng nhập để trò chuyện.');
    const userId = getViewerId(request);
    const body = await request.json() as { targetUserId: string; firstMessage?: string };
    const targetUser = seedUsers.find(u => u.id === body.targetUserId);
    if (!targetUser) return error(404, 'Không tìm thấy người nhận.');
    if (targetUser.id === userId) return error(400, 'Bạn không thể gửi lời mời cho chính mình.');
    let conv = seedConversations.find(c => c.kind === 'direct' && c.participantIds.includes(userId) && c.participantIds.includes(targetUser.id));
    const firstMessage = body.firstMessage?.trim();
    if (conv?.requestStatus && conv.requestStatus !== 'accepted' && firstMessage) return error(409, 'Lời mời trò chuyện đang chờ phản hồi.');
    if (!conv) {
      conv = {
        id: crypto.randomUUID(), kind: 'direct', refId: targetUser.id, title: targetUser.fullName,
        avatarUrl: targetUser.avatarUrl, participantIds: [userId, targetUser.id],
        lastMessage: firstMessage || 'Đã gửi lời mời trò chuyện', lastMessageAt: new Date().toISOString(),
        unreadCount: 0, requestStatus: 'pending', requestedBy: userId,
      };
      seedConversations.unshift(conv);
    }
    if (firstMessage) {
      const msg: Message = { id: crypto.randomUUID(), conversationId: conv.id, senderId: userId, content: firstMessage, type: 'text', status: 'sent', createdAt: new Date().toISOString() };
      seedMessages.push(msg);
      conv.lastMessage = firstMessage;
      conv.lastMessageAt = msg.createdAt;
    }
    return HttpResponse.json({ data: { id: conv.id } });
  }),

  http.post('/api/v1/conversations/:id/accept', async ({ params, request }) => {
    await mockDelay(100, 200);
    const conv = seedConversations.find(c => c.id === params.id);
    const denied = accessError(request, conv);
    if (denied || !conv) return denied!;
    if (conv.kind !== 'direct' || conv.requestedBy === getViewerId(request)) return error(403, 'Chỉ người nhận được phản hồi lời mời.');
    if (conv.requestStatus !== 'pending') return error(409, 'Lời mời đã được xử lý.');
    conv.requestStatus = 'accepted';
    return HttpResponse.json({ data: { success: true } });
  }),

  http.post('/api/v1/conversations/:id/decline', async ({ params, request }) => {
    await mockDelay(100, 200);
    const conv = seedConversations.find(c => c.id === params.id);
    const denied = accessError(request, conv);
    if (denied || !conv) return denied!;
    if (conv.kind !== 'direct' || conv.requestedBy === getViewerId(request)) return error(403, 'Chỉ người nhận được phản hồi lời mời.');
    if (conv.requestStatus !== 'pending') return error(409, 'Lời mời đã được xử lý.');
    seedConversations.splice(seedConversations.indexOf(conv), 1);
    for (let i = seedMessages.length - 1; i >= 0; i--) if (seedMessages[i].conversationId === conv.id) seedMessages.splice(i, 1);
    return HttpResponse.json({ data: { success: true } });
  }),
];
