import { http, HttpResponse } from 'msw';
import { seedSwapRequests, seedSwapConnections } from '../data/swap';
import { seedConversations, seedMessages } from '../data/conversations';
import { mockDelay, isScenarioActive } from '../utils';
import type { SwapRequest, SwapConnection, AiSwapMatch } from '@/types/entities';

export const swapHandlers = [
  http.get('/api/v1/swap-requests', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    let list = seedSwapRequests.filter((r) => r.studentId === userId);
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/swap-requests', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Omit<SwapRequest, 'id' | 'studentId' | 'status' | 'version' | 'createdAt' | 'updatedAt'>;

    const existingOpen = seedSwapRequests.find(
      (r) => r.studentId === userId && r.offeringId === body.offeringId && r.status === 'Open'
    );
    if (existingOpen) {
      return HttpResponse.json(
        {
          error: {
            code: 'DUPLICATE_OPEN_REQUEST',
            message: 'Bạn đã có một yêu cầu đổi lớp đang mở cho môn học này',
            details: { existingRequestId: existingOpen.id },
          },
        },
        { status: 409 }
      );
    }

    const newReq: SwapRequest = {
      id: `swap_req_${Date.now()}`,
      studentId: userId,
      offeringId: body.offeringId,
      currentClassCode: body.currentClassCode,
      targetClassCode: body.targetClassCode,
      schedule: body.schedule,
      status: 'Open',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seedSwapRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  http.get('/api/v1/swap-requests/:id', async ({ params }) => {
    await mockDelay();
    const req = seedSwapRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }
    return HttpResponse.json({ data: req });
  }),

  http.put('/api/v1/swap-requests/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<SwapRequest> & { version?: number };
    const req = seedSwapRequests.find((r) => r.id === params.id);

    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }

    if (isScenarioActive('swap_version_conflict') || (body.version !== undefined && body.version !== req.version)) {
      return HttpResponse.json(
        { error: { code: 'VERSION_CONFLICT', message: 'Yêu cầu đã được cập nhật hoặc kết nối bởi thao tác khác. Vui lòng tải lại.' } },
        { status: 409 }
      );
    }

    Object.assign(req, body);
    req.version += 1;
    req.updatedAt = new Date().toISOString();

    return HttpResponse.json({ data: req });
  }),

  http.delete('/api/v1/swap-requests/:id', async ({ params }) => {
    await mockDelay();
    const req = seedSwapRequests.find((r) => r.id === params.id);
    if (req) {
      req.status = 'Cancelled';
      req.updatedAt = new Date().toISOString();
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  http.get('/api/v1/swap-requests/:id/matches', async ({ params, request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'direct';

    if (mode === 'ai' && isScenarioActive('ai_timeout')) {
      await mockDelay(2000, 3000);
      return HttpResponse.json(
        { error: { code: 'AI_TIMEOUT', message: 'Dịch vụ gợi ý AI không phản hồi kịp thời' } },
        { status: 504 }
      );
    }

    await mockDelay(200, 500);
    const currentReq = seedSwapRequests.find((r) => r.id === params.id);
    if (!currentReq) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }

    const otherRequests = seedSwapRequests.filter(
      (r) => r.id !== currentReq.id && r.offeringId === currentReq.offeringId && r.status === 'Open'
    );

    if (mode === 'ai') {
      const aiMatches: AiSwapMatch[] = otherRequests.map((r) => {
        const isPerfect = r.currentClassCode === currentReq.targetClassCode && r.targetClassCode === currentReq.currentClassCode;
        return {
          requestId: r.id,
          score: isPerfect ? 96 : 82,
          reasons: isPerfect
            ? ['Đối ứng hoàn hảo 2 chiều', 'Khung giờ rảnh tương thích cao (>90%)']
            : ['Môn học trùng khớp', 'Lịch học tự khai không bị trùng lặp'],
        };
      });
      return HttpResponse.json({ data: aiMatches });
    }

    return HttpResponse.json({ data: otherRequests });
  }),

  http.get('/api/v1/swap-connections', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const direction = url.searchParams.get('direction');
    const requestId = url.searchParams.get('requestId');
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    let list = [...seedSwapConnections];
    if (requestId) {
      list = list.filter((c) => c.requestAId === requestId || c.requestBId === requestId);
    } else if (direction === 'incoming') {
      list = list.filter((c) => c.recipientId === userId);
    } else if (direction === 'outgoing') {
      list = list.filter((c) => c.initiatorId === userId);
    } else {
      list = list.filter((c) => c.initiatorId === userId || c.recipientId === userId);
    }
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/swap-connections', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { requestAId: string; requestBId: string; message?: string };

    const reqA = seedSwapRequests.find((r) => r.id === body.requestAId);
    const reqB = seedSwapRequests.find((r) => r.id === body.requestBId);

    if (!reqA || !reqB || reqA.status !== 'Open' || reqB.status !== 'Open') {
      return HttpResponse.json(
        { error: { code: 'REQUEST_CLOSED', message: 'Một trong hai yêu cầu đổi lớp đã đóng hoặc không khả dụng' } },
        { status: 409 }
      );
    }

    const newConn: SwapConnection = {
      id: `conn_${Date.now()}`,
      requestAId: body.requestAId,
      requestBId: body.requestBId,
      initiatorId: userId,
      recipientId: reqB.studentId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    seedSwapConnections.unshift(newConn);
    return HttpResponse.json({ data: newConn });
  }),

  http.post('/api/v1/swap-connections/:id/accept', async ({ params }) => {
    await mockDelay();
    if (isScenarioActive('swap_competing_connection')) {
      return HttpResponse.json(
        { error: { code: 'SWAP_ALREADY_CONNECTED', message: 'Yêu cầu này vừa được kết nối thành công với một đối tác khác.' } },
        { status: 409 }
      );
    }

    const conn = seedSwapConnections.find((c) => c.id === params.id);
    if (!conn) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy lời mời' } }, { status: 404 });
    }

    conn.status = 'Confirmed';
    conn.respondedAt = new Date().toISOString();

    const reqA = seedSwapRequests.find((r) => r.id === conn.requestAId);
    const reqB = seedSwapRequests.find((r) => r.id === conn.requestBId);
    if (reqA) reqA.status = 'Connected';
    if (reqB) reqB.status = 'Connected';

    // Create chat conversation
    const newConv = {
      id: `conv_${Date.now()}`,
      kind: 'swap' as const,
      refId: conn.id,
      title: `Đổi lớp ${reqA?.offeringId || ''} (${reqA?.currentClassCode} ↔ ${reqB?.currentClassCode})`,
      participantIds: [conn.initiatorId, conn.recipientId],
      lastMessage: 'Hai bạn đã kết nối thành công. Hãy trao đổi để làm thủ tục với phòng đào tạo!',
      lastMessageAt: new Date().toISOString(),
    };
    seedConversations.push(newConv);

    seedMessages.push({
      id: `msg_${Date.now()}`,
      conversationId: newConv.id,
      senderId: 'system',
      content: 'Hai bạn đã kết nối thành công. Nhắc nhở: Hai bạn cần tự làm thủ tục chuyển lớp chính thức với phòng đào tạo nhà trường.',
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json({ data: { connection: conn, conversationId: newConv.id } });
  }),

  http.post('/api/v1/swap-connections/:id/reject', async ({ params }) => {
    await mockDelay();
    const conn = seedSwapConnections.find((c) => c.id === params.id);
    if (conn) {
      conn.status = 'Rejected';
      conn.respondedAt = new Date().toISOString();
    }
    return HttpResponse.json({ data: { success: true } });
  }),
];
