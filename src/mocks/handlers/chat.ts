import { http, HttpResponse } from 'msw';
import { seedConversations, seedMessages } from '../data/conversations';
import { seedUsers } from '../data/users';
import { mockDelay, getViewerId } from '../utils';
import type { Message, MessageAttachment } from '@/types/entities';

export const chatHandlers = [
  // GET /api/v1/conversations
  http.get('/api/v1/conversations', async ({ request }) => {
    await mockDelay(80, 150);
    const userId = getViewerId(request);

    const userConvs = seedConversations.filter((c) => c.participantIds.includes(userId));
    return HttpResponse.json({ data: userConvs });
  }),

  // GET /api/v1/conversations/:id/messages
  http.get('/api/v1/conversations/:id/messages', async ({ params }) => {
    await mockDelay(80, 150);
    const msgs = seedMessages.filter((m) => m.conversationId === params.id);
    return HttpResponse.json({ data: msgs });
  }),

  // POST /api/v1/conversations/:id/messages
  http.post('/api/v1/conversations/:id/messages', async ({ params, request }) => {
    await mockDelay(80, 150);
    const userId = getViewerId(request);
    const body = (await request.json()) as {
      content: string;
      type?: 'text' | 'image' | 'file' | 'link' | 'like';
      images?: string[];
      attachments?: MessageAttachment[];
    };

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: params.id as string,
      senderId: userId,
      content: body.content,
      type: body.type || 'text',
      images: body.images || [],
      attachments: body.attachments || [],
      reactions: {},
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    seedMessages.push(newMsg);

    const conv = seedConversations.find((c) => c.id === params.id);
    if (conv) {
      conv.lastMessage =
        body.type === 'like'
          ? '👍 Đã gửi nút thích'
          : body.type === 'image'
          ? '📷 Đã gửi hình ảnh'
          : body.type === 'file'
          ? '📁 Đã gửi tệp đính kèm'
          : body.content;
      conv.lastMessageAt = newMsg.createdAt;
      conv.unreadCount = 0;
    }

    return HttpResponse.json({ data: newMsg });
  }),

  // POST /api/v1/conversations/direct
  http.post('/api/v1/conversations/direct', async ({ request }) => {
    await mockDelay(100, 200);
    const userId = getViewerId(request);
    const body = (await request.json()) as {
      targetUserId: string;
      firstMessage?: string;
    };

    // Find existing direct conversation
    let conv = seedConversations.find(
      (c) =>
        c.kind === 'direct' &&
        c.participantIds.includes(userId) &&
        c.participantIds.includes(body.targetUserId)
    );

    if (!conv) {
      const targetUser = seedUsers.find((u) => u.id === body.targetUserId);
      conv = {
        id: `conv_dir_${Date.now()}`,
        kind: 'direct',
        refId: body.targetUserId,
        title: targetUser?.fullName || 'Trò chuyện trực tiếp',
        avatarUrl: targetUser?.avatarUrl,
        participantIds: [userId, body.targetUserId],
        lastMessage: body.firstMessage || 'Đã gửi lời mời trò chuyện',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        requestStatus: 'pending',
        requestedBy: userId,
      };
      seedConversations.unshift(conv);
    }

    if (body.firstMessage) {
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        conversationId: conv.id,
        senderId: userId,
        content: body.firstMessage,
        type: 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      seedMessages.push(newMsg);
      conv.lastMessage = body.firstMessage;
      conv.lastMessageAt = newMsg.createdAt;
    }

    return HttpResponse.json({ data: { id: conv.id } });
  }),

  // POST /api/v1/conversations/:id/accept
  http.post('/api/v1/conversations/:id/accept', async ({ params }) => {
    await mockDelay(100, 200);
    const conv = seedConversations.find((c) => c.id === params.id);
    if (conv) {
      conv.requestStatus = 'accepted';
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  // POST /api/v1/conversations/:id/decline
  http.post('/api/v1/conversations/:id/decline', async ({ params }) => {
    await mockDelay(100, 200);
    const idx = seedConversations.findIndex((c) => c.id === params.id);
    if (idx !== -1) {
      seedConversations.splice(idx, 1);
    }
    return HttpResponse.json({ data: { success: true } });
  }),
];
