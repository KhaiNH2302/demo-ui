import { http, HttpResponse } from 'msw';
import { seedConversations, seedMessages } from '../data/conversations';
import { mockDelay } from '../utils';

export const chatHandlers = [
  http.get('/api/v1/conversations', async ({ request }) => {
    await mockDelay(100, 200);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const userConvs = seedConversations.filter((c) => c.participantIds.includes(userId));
    return HttpResponse.json({ data: userConvs });
  }),

  http.get('/api/v1/conversations/:id/messages', async ({ params }) => {
    await mockDelay(100, 200);
    const msgs = seedMessages.filter((m) => m.conversationId === params.id);
    return HttpResponse.json({ data: msgs });
  }),

  http.post('/api/v1/conversations/:id/messages', async ({ params, request }) => {
    await mockDelay(100, 200);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { content: string };

    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId: params.id as string,
      senderId: userId,
      content: body.content,
      createdAt: new Date().toISOString(),
    };

    seedMessages.push(newMsg);

    const conv = seedConversations.find((c) => c.id === params.id);
    if (conv) {
      conv.lastMessage = body.content;
      conv.lastMessageAt = newMsg.createdAt;
    }

    return HttpResponse.json({ data: newMsg });
  }),

  http.post('/api/v1/conversations/direct', async ({ request }) => {
    await mockDelay(150, 300);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as {
      targetUserId: string;
      contextType: string;
      contextId: string;
      firstMessage?: string;
    };

    // Find existing direct conversation between the two users
    let conv = seedConversations.find(
      (c) =>
        c.kind === 'direct' &&
        c.participantIds.includes(userId) &&
        c.participantIds.includes(body.targetUserId)
    );

    if (!conv) {
      const targetUser = (await import('../data/users')).seedUsers.find((u) => u.id === body.targetUserId);
      conv = {
        id: `conv_dir_${Date.now()}`,
        kind: 'direct',
        refId: '',
        title: targetUser?.fullName || 'Trò chuyện trực tiếp',
        participantIds: [userId, body.targetUserId],
        lastMessage: body.firstMessage || 'Đã tạo cuộc trò chuyện trực tiếp',
        lastMessageAt: new Date().toISOString(),
      };
      seedConversations.unshift(conv);
    }

    if (body.firstMessage) {
      const newMsg = {
        id: `msg_${Date.now()}`,
        conversationId: conv.id,
        senderId: userId,
        content: body.firstMessage,
        createdAt: new Date().toISOString(),
      };
      seedMessages.push(newMsg);
      conv.lastMessage = body.firstMessage;
      conv.lastMessageAt = newMsg.createdAt;
    }

    return HttpResponse.json({ data: { id: conv.id } });
  }),
];
