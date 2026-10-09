import { http, HttpResponse } from 'msw';
import { seedSwapRequests, seedSwapConnections } from '../data/swap';
import { seedCourseOfferings } from '../data/courseOfferings';
import { seedUsers } from '../data/users';
import { seedConversations, seedMessages } from '../data/conversations';
import { mockDelay, isScenarioActive, getViewerId, getAuthenticatedViewerId, GUEST_VIEWER_ID } from '../utils';
import type { SwapRequest, AiSwapMatch } from '@/types/entities';
import { acceptSwapInvitation, assertSwapRequestOwner, createSwapInvitation, rejectSwapInvitation, SwapRuleError } from '@/features/swap/swapTransactions';

function swapError(error: unknown) {
  if (error instanceof SwapRuleError) {
    return HttpResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  throw error;
}

function getSwapActorId(request: Request): string {
  const id = getAuthenticatedViewerId(request);
  return seedUsers.some(user => user.id === id && user.status.toLowerCase() === 'active') ? id : GUEST_VIEWER_ID;
}

function forbiddenSwapActor() {
  return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Vui lòng đăng nhập bằng tài khoản đang hoạt động để thực hiện thao tác.' } }, { status: 403 });
}

export const swapHandlers = [
  // Course Offerings for Combobox
  http.get('/api/v1/course-offerings', async ({ request }) => {
    await mockDelay(100, 200);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();

    let list = [...seedCourseOfferings];
    if (q) {
      list = list.filter(
        (o) =>
          o.courseCode.toLowerCase().includes(q) ||
          o.courseName.toLowerCase().includes(q) ||
          (o.subjectCode && o.subjectCode.toLowerCase().includes(q)),
      );
    }
    return HttpResponse.json({ data: list });
  }),

  // Explore other requests (Block C)
  http.get('/api/v1/swap-requests/explore', async ({ request }) => {
    await mockDelay(200, 400);
    const url = new URL(request.url);
    const offeringId = url.searchParams.get('offeringId');
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    const sort = url.searchParams.get('sort') || 'newest';
    const excludeIds = (url.searchParams.get('excludeIds') || '').split(',').filter(Boolean);
    const userId = getViewerId(request);

    let list = seedSwapRequests.filter(
      (r) => r.studentId !== userId && r.status === 'Open' && !excludeIds.includes(r.id),
    );

    if (offeringId && offeringId !== 'all') {
      list = list.filter((r) => r.offeringId === offeringId);
    }

    if (q) {
      list = list.filter((r) => {
        const off = seedCourseOfferings.find((o) => o.id === r.offeringId);
        return (
          r.currentClassCode.toLowerCase().includes(q) ||
          r.targetClassCode.toLowerCase().includes(q) ||
          (off && (off.courseCode.toLowerCase().includes(q) || off.courseName.toLowerCase().includes(q)))
        );
      });
    }

    if (sort === 'random') {
      list = [...list].sort(() => 0.5 - Math.random());
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/swap-requests', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const userId = getViewerId(request);

    let list = seedSwapRequests.filter((r) => r.studentId === userId);
    if (status) {
      list = list.filter((r) => r.status === status);
    }

    // Attach computed lock status & pendingConnectionCount
    const enriched = list.map((r) => {
      const pendingConns = seedSwapConnections.filter(
        (c) => (c.requestAId === r.id || c.requestBId === r.id) && c.status === 'Pending',
      );
      return {
        ...r,
        pendingConnectionCount: pendingConns.length,
        locked: r.status !== 'Open' || pendingConns.length > 0,
      };
    });

    return HttpResponse.json({ data: enriched });
  }),

  http.post('/api/v1/swap-requests', async ({ request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    const body = (await request.json()) as Omit<
      SwapRequest,
      'id' | 'studentId' | 'status' | 'version' | 'createdAt' | 'updatedAt'
    >;

    const existingOpen = seedSwapRequests.find(
      (r) => r.studentId === userId && r.offeringId === body.offeringId && r.status === 'Open',
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
        { status: 409 },
      );
    }

    const newReq: SwapRequest = {
      id: `swap_req_${crypto.randomUUID()}`,
      studentId: userId,
      offeringId: body.offeringId,
      currentClassCode: body.currentClassCode,
      targetClassCode: body.targetClassCode,
      schedule: body.schedule,
      note: body.note,
      status: 'Open',
      version: 1,
      locked: false,
      pendingConnectionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seedSwapRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  http.get('/api/v1/swap-requests/:id', async ({ params, request }) => {
    await mockDelay();
    const req = seedSwapRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } },
        { status: 404 },
      );
    }

    const userId = getViewerId(request);
    const isOwner = req.studentId === userId;

    const pendingConns = seedSwapConnections.filter(
      (c) => (c.requestAId === req.id || c.requestBId === req.id) && c.status === 'Pending',
    );
    const isLocked = req.status !== 'Open' || pendingConns.length > 0;

    const ownerUser = seedUsers.find((u) => u.id === req.studentId) || {
      id: req.studentId,
      fullName: 'Sinh viên FPT',
      cohort: 'K18',
      major: 'Kỹ thuật phần mềm',
    };

    // My request in same course offering
    const myRequestInSameOffering = seedSwapRequests.find(
      (r) => r.studentId === userId && r.offeringId === req.offeringId && r.status === 'Open',
    );

    // Existing connection between us
    const existingConnection = seedSwapConnections.find(
      (c) =>
        (c.requestAId === req.id || c.requestBId === req.id) &&
        ((c.initiatorId === userId && c.recipientId === req.studentId) ||
          (c.initiatorId === req.studentId && c.recipientId === userId)) &&
        (c.status === 'Pending' || c.status === 'Confirmed'),
    );

    let matchLabel = undefined;
    let aiScore = undefined;
    if (myRequestInSameOffering) {
      const isPerfect =
        myRequestInSameOffering.currentClassCode === req.targetClassCode &&
        myRequestInSameOffering.targetClassCode === req.currentClassCode;
      matchLabel = isPerfect ? '★ Đối ứng hoàn hảo' : '◐ Khớp một chiều';
      aiScore = isPerfect ? 92 : 74;
    }

    return HttpResponse.json({
      data: {
        ...req,
        locked: isLocked,
        pendingConnectionCount: pendingConns.length,
        owner: ownerUser,
        viewerContext: {
          isOwner,
          myRequestInSameOffering,
          connection: existingConnection,
          matchLabel,
          aiScore,
        },
      },
    });
  }),

  http.put('/api/v1/swap-requests/:id', async ({ params, request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    const body = (await request.json()) as Partial<SwapRequest> & { version?: number };
    const req = seedSwapRequests.find((r) => r.id === params.id);

    if (!req) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } },
        { status: 404 },
      );
    }

    try {
      assertSwapRequestOwner(req, userId);
    } catch (error) {
      return swapError(error);
    }
    if (req.status !== 'Open') {
      return HttpResponse.json({ error: { code: 'REQUEST_CLOSED', message: 'Chỉ được sửa yêu cầu đang mở.' } }, { status: 409 });
    }

    if (
      isScenarioActive('swap_version_conflict') ||
      (body.version !== undefined && body.version !== req.version)
    ) {
      return HttpResponse.json(
        {
          error: {
            code: 'VERSION_CONFLICT',
            message:
              'Yêu cầu đã được cập nhật hoặc kết nối bởi thao tác khác. Vui lòng tải lại.',
          },
        },
        { status: 409 },
      );
    }

    // Check hard lock rule (section 5.3)
    const pendingConns = seedSwapConnections.filter(
      (c) => (c.requestAId === req.id || c.requestBId === req.id) && c.status === 'Pending',
    );
    const isHardLocked = pendingConns.length > 0;

    const isAttemptingToChangeClassOrSchedule =
      (body.currentClassCode !== undefined && body.currentClassCode !== req.currentClassCode) ||
      (body.targetClassCode !== undefined && body.targetClassCode !== req.targetClassCode) ||
      (body.schedule !== undefined && JSON.stringify(body.schedule) !== JSON.stringify(req.schedule));

    if (isHardLocked && isAttemptingToChangeClassOrSchedule) {
      return HttpResponse.json(
        {
          error: {
            code: 'REQUEST_LOCKED',
            message:
              'Đang có lời mời kết nối chờ phản hồi nên mã lớp và lịch học tạm thời bị khóa. Bạn chỉ có thể sửa ghi chú.',
          },
        },
        { status: 409 },
      );
    }

    if (body.currentClassCode !== undefined) req.currentClassCode = body.currentClassCode;
    if (body.targetClassCode !== undefined) req.targetClassCode = body.targetClassCode;
    if (body.schedule !== undefined) req.schedule = body.schedule;
    if (body.note !== undefined) req.note = body.note;
    req.version += 1;
    req.updatedAt = new Date().toISOString();

    return HttpResponse.json({ data: req });
  }),

  http.delete('/api/v1/swap-requests/:id', async ({ params, request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    const req = seedSwapRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại.' } }, { status: 404 });
    }
    try {
      assertSwapRequestOwner(req, userId);
    } catch (error) {
      return swapError(error);
    }
    if (req.status !== 'Open') {
      return HttpResponse.json({ error: { code: 'REQUEST_CLOSED', message: 'Chỉ được hủy yêu cầu đang mở.' } }, { status: 409 });
    }
    req.status = 'Cancelled';
    req.version += 1;
    req.updatedAt = new Date().toISOString();

    seedSwapConnections.forEach((c) => {
      if ((c.requestAId === req.id || c.requestBId === req.id) && c.status === 'Pending') {
        c.status = 'Cancelled';
        c.cancelReason = 'Chủ yêu cầu đã hủy yêu cầu đổi lớp.';
        c.respondedAt = new Date().toISOString();
      }
    });
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
    const userId = getViewerId(request);

    let list = seedSwapConnections.filter((c) => c.initiatorId === userId || c.recipientId === userId);
    if (requestId) {
      list = list.filter((c) => c.requestAId === requestId || c.requestBId === requestId);
    } else if (direction === 'incoming') {
      list = list.filter((c) => c.recipientId === userId);
    } else if (direction === 'outgoing') {
      list = list.filter((c) => c.initiatorId === userId);
    } else {
      list = list.filter((c) => c.initiatorId === userId || c.recipientId === userId);
    }
    return HttpResponse.json({ data: list.map((connection) => ({
      ...connection,
      requestA: seedSwapRequests.find((r) => r.id === connection.requestAId),
      requestB: seedSwapRequests.find((r) => r.id === connection.requestBId),
      conversationId: seedConversations.find((c) => c.kind === 'swap' && c.refId === connection.id && c.participantIds.includes(connection.initiatorId) && c.participantIds.includes(connection.recipientId))?.id,
    })) });
  }),

  http.post('/api/v1/swap-connections', async ({ request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    const body = (await request.json()) as { requestAId: string; requestBId: string; message?: string };

    try {
      const connection = createSwapInvitation(seedSwapRequests, seedSwapConnections, userId, body, 'conn_' + crypto.randomUUID(), new Date().toISOString());
      return HttpResponse.json({ data: connection });
    } catch (error) {
      return swapError(error);
    }
  }),

  http.post('/api/v1/swap-connections/:id/accept', async ({ params, request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    const candidate = seedSwapConnections.find((c) => c.id === params.id);
    if (candidate && candidate.recipientId !== userId) {
      return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ người nhận mới được chấp nhận lời mời.' } }, { status: 403 });
    }
    if (isScenarioActive('swap_competing_connection')) {
      return HttpResponse.json(
        { error: { code: 'SWAP_ALREADY_CONNECTED', message: 'Yêu cầu này vừa được kết nối thành công với một đối tác khác.' } },
        { status: 409 }
      );
    }

    const versions = await request.json().catch(() => ({})) as { requestAVersion?: number; requestBVersion?: number };
    let accepted;
    try {
      accepted = acceptSwapInvitation(seedSwapRequests, seedSwapConnections, String(params.id), userId, new Date().toISOString(), versions);
    } catch (error) {
      return swapError(error);
    }
    const { connection: conn, requestA: reqA, requestB: reqB } = accepted;

    // Create chat conversation
    const newConv = {
      id: 'conv_swap_' + conn.id,
      kind: 'swap' as const,
      refId: conn.id,
      title: `Đổi lớp ${reqA?.offeringId || ''} (${reqA?.currentClassCode} ↔ ${reqB?.currentClassCode})`,
      participantIds: [conn.initiatorId, conn.recipientId],
      lastMessage: 'Hai bạn đã kết nối thành công. Hãy trao đổi để làm thủ tục với phòng đào tạo!',
      lastMessageAt: new Date().toISOString(),
    };
    seedConversations.push(newConv);

    seedMessages.push({
      id: 'msg_swap_' + conn.id,
      conversationId: newConv.id,
      senderId: 'system',
      content: 'Hai bạn đã kết nối thành công. Nhắc nhở: Hai bạn cần tự làm thủ tục chuyển lớp chính thức với phòng đào tạo nhà trường.',
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json({ data: { connection: conn, conversationId: newConv.id } });
  }),

  http.post('/api/v1/swap-connections/:id/reject', async ({ params, request }) => {
    await mockDelay();
    const userId = getSwapActorId(request);
    if (userId === GUEST_VIEWER_ID) return forbiddenSwapActor();
    try {
      rejectSwapInvitation(seedSwapConnections, String(params.id), userId, new Date().toISOString());
      return HttpResponse.json({ data: { success: true } });
    } catch (error) {
      return swapError(error);
    }
  }),
];
