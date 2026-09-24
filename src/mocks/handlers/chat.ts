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
];
