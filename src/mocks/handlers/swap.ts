import { http, HttpResponse } from 'msw';
import { seedSwapRequests, seedSwapConnections } from '../data/swap';
import { seedCourseOfferings } from '../data/courseOfferings';
import { seedUsers } from '../data/users';
import { seedConversations, seedMessages } from '../data/conversations';
import { mockDelay, isScenarioActive } from '../utils';
import type { SwapRequest, SwapConnection, AiSwapMatch, User } from '@/types/entities';

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
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

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
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

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
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
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
      id: `swap_req_${Date.now()}`,
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

    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
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
        ((c.initiatorId === userId && c.recipientId === req.studentId) ||
          (c.initiatorId === req.studentId && c.recipientId === userId)) &&
        c.status !== 'Rejected',
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
    const body = (await request.json()) as Partial<SwapRequest> & { version?: number };
    const req = seedSwapRequests.find((r) => r.id === params.id);

    if (!req) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } },
        { status: 404 },
      );
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

    // Never allow changing offeringId per spec 5.2
    delete (body as any).offeringId;

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

      // Automatically cancel any pending connections
      seedSwapConnections.forEach((c) => {
        if ((c.requestAId === req.id || c.requestBId === req.id) && c.status === 'Pending') {
          c.status = 'Rejected';
          c.respondedAt = new Date().toISOString();
        }
      });
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
