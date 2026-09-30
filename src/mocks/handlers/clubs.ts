import { http, HttpResponse } from 'msw';
import {
  seedClubs,
  seedClubOpportunities,
  seedOpportunityResponses,
  seedClubRepresentativeRequests,
  seedConnectionInvites,
} from '../data/clubs';
import { seedUsers } from '../data/users';
import { mockDelay } from '../utils';
import type {
  Club,
  ClubOpportunity,
  OpportunityResponse,
  ClubRepresentativeRequest,
} from '@/types/entities';
import type { OpportunityResponseStatus } from '@/types/status';

function getCurrentUserId(request: Request): string {
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
}

export const clubHandlers = [
  // 1. Clubs Directory (CL1b, CL2)
  http.get('/api/v1/clubs', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const q = url.searchParams.get('q');

    let list = seedClubs.filter((c) => c.status !== 'Hidden');
    if (category && category !== 'all') {
      list = list.filter((c) => c.category === category || c.field === category);
    }
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.code && c.code.toLowerCase().includes(lower)) ||
          (c.tagline && c.tagline.toLowerCase().includes(lower))
      );
    }

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/clubs/mine', async ({ request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const myClubs = seedClubs.filter((c) =>
      c.representatives?.some((r) => r.userId === userId)
    );
    return HttpResponse.json({ data: myClubs });
  }),

  // 2. Club Opportunities Discovery & Detail (CL1, CL3, CL7, CL8, CL9)
  http.get('/api/v1/clubs/opportunities', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const clubId = url.searchParams.get('clubId');
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q');
    const mine = url.searchParams.get('mine');
    const userId = getCurrentUserId(request);

    let list = [...seedClubOpportunities];

    if (mine === 'true') {
      const myClubIds = seedClubs
        .filter((c) => c.representatives?.some((r) => r.userId === userId))
        .map((c) => c.id);
      list = list.filter(
        (o) => o.createdById === userId || myClubIds.includes(o.clubId)
      );
    } else if (!status) {
      list = list.filter((o) => o.status !== 'Draft');
    }

    if (clubId) list = list.filter((o) => o.clubId === clubId);
    if (type && type !== 'all') list = list.filter((o) => o.type === type);
    if (category && category !== 'all') {
      list = list.filter((o) => o.clubCategory === category);
    }
    if (status && status !== 'all') {
      list = list.filter((o) => o.status === status);
    }
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(lower) ||
          o.clubName.toLowerCase().includes(lower) ||
          o.summary.toLowerCase().includes(lower)
      );
    }

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/clubs/opportunities/:oppId', async ({ params, request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const opp = seedClubOpportunities.find((o) => o.id === params.oppId);
    if (!opp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy cơ hội CLB' } },
        { status: 404 }
      );
    }

    const myResponse = seedOpportunityResponses.find(
      (r) => r.opportunityId === opp.id && r.studentId === userId && r.status !== 'Withdrawn'
    );

    const coParticipants = seedOpportunityResponses
      .filter(
        (r) =>
          r.opportunityId === opp.id &&
          (r.status === 'Confirmed' || r.status === 'Accepted') &&
          r.visibleToCoParticipants &&
          r.studentId !== userId
      )
      .map((r) => {
        const invite = seedConnectionInvites.find(
          (inv) =>
            inv.sourceType === 'opportunity' &&
            inv.sourceId === opp.id &&
            ((inv.fromUserId === userId && inv.toUserId === r.studentId) ||
              (inv.fromUserId === r.studentId && inv.toUserId === userId))
        );
        return {
          userId: r.studentId,
          fullName: r.profileSnapshot.fullName,
          studentCode: r.profileSnapshot.studentCode,
          major: r.profileSnapshot.major,
          cohort: r.profileSnapshot.cohort,
          avatarUrl: r.profileSnapshot.avatarUrl,
          positionOrSlot: r.positionName,
          inviteStatus: invite ? (invite.status === 'Accepted' ? 'Accepted' : 'Pending') : 'none',
          conversationId: invite?.conversationId || 'conv_02',
        };
      });

    return HttpResponse.json({
      data: {
        ...opp,
        myResponse: myResponse || null,
        coParticipants,
      },
    });
  }),

  // Create / Edit Club Opportunity (CL8)
  http.post('/api/v1/clubs/opportunities', async ({ request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const user = seedUsers.find((u) => u.id === userId) || seedUsers[0];
    const body = (await request.json()) as Partial<ClubOpportunity>;
    const club = seedClubs.find((c) => c.id === body.clubId) || seedClubs[0];

    const newOpp: ClubOpportunity = {
      id: `opp_${Date.now()}`,
      clubId: club.id,
      clubName: club.name,
      clubCode: club.code,
      clubLogo: club.logoUrl,
      clubCategory: club.category,
      createdById: user.id,
      createdByName: user.fullName,
      type: body.type || 'Event',
      title: body.title || 'Cơ hội mới',
      summary: body.summary || '',
      description: body.description || '',
      tags: body.tags || [],
      startAt: body.startAt,
      endAt: body.endAt,
      mode: body.mode,
      locationOrLink: body.locationOrLink,
      confirmMode: body.confirmMode || 'Instant',
      expectedCommitment: body.expectedCommitment,
      positions: body.positions,
      quota: body.quota || 30,
      used: 0,
      submittedCount: 0,
      registrationDeadline:
        body.registrationDeadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      resultDeadline: body.resultDeadline,
      questions: body.questions || [],
      status: body.status || 'Published',
      hasResponses: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seedClubOpportunities.unshift(newOpp);
    return HttpResponse.json({ data: newOpp });
  }),

  http.put('/api/v1/clubs/opportunities/:oppId', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<ClubOpportunity>;
    const opp = seedClubOpportunities.find((o) => o.id === params.oppId);
    if (!opp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy cơ hội' } },
        { status: 404 }
      );
    }
    Object.assign(opp, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json({ data: opp });
  }),

  // 3. Student Registrations / Responses (CL4, CL5, CL6)
  http.get('/api/v1/clubs/registrations/me', async ({ request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const list = seedOpportunityResponses.filter((r) => r.studentId === userId);
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/clubs/registrations/:responseId', async ({ params, request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const resp = seedOpportunityResponses.find((r) => r.id === params.responseId);
    if (!resp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn đăng ký' } },
        { status: 404 }
      );
    }
    const opp = seedClubOpportunities.find((o) => o.id === resp.opportunityId);
    const coParticipants = seedOpportunityResponses
      .filter(
        (r) =>
          r.opportunityId === resp.opportunityId &&
          (r.status === 'Confirmed' || r.status === 'Accepted') &&
          r.visibleToCoParticipants &&
          r.studentId !== userId
      )
      .map((r) => ({
        userId: r.studentId,
        fullName: r.profileSnapshot.fullName,
        studentCode: r.profileSnapshot.studentCode,
        major: r.profileSnapshot.major,
        cohort: r.profileSnapshot.cohort,
        avatarUrl: r.profileSnapshot.avatarUrl,
        positionOrSlot: r.positionName,
      }));

    return HttpResponse.json({
      data: {
        ...resp,
        opportunity: opp || null,
        coParticipants,
      },
    });
  }),

  http.post('/api/v1/clubs/opportunities/:oppId/register', async ({ params, request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const user = seedUsers.find((u) => u.id === userId) || seedUsers[0];
    const opp = seedClubOpportunities.find((o) => o.id === params.oppId);
    if (!opp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy cơ hội CLB' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      positionId?: string;
      answers: { questionId: string; questionLabel: string; value: string | string[] }[];
      note?: string;
      visibleToCoParticipants?: boolean;
      isDraft?: boolean;
    };

    const existingIdx = seedOpportunityResponses.findIndex(
      (r) => r.opportunityId === opp.id && r.studentId === userId
    );

    const isInstantEvent =
      !body.isDraft && opp.type === 'Event' && opp.confirmMode !== 'Approval';
    const nextStatus: OpportunityResponseStatus = body.isDraft
      ? 'Draft'
      : isInstantEvent
      ? 'Confirmed'
      : 'Submitted';

    const pos = opp.positions?.find((p) => p.id === body.positionId);

    if (existingIdx !== -1) {
      const existing = seedOpportunityResponses[existingIdx];
      existing.positionId = body.positionId ?? existing.positionId;
      existing.positionName = pos?.name ?? existing.positionName;
      existing.answers = body.answers;
      existing.note = body.note;
      existing.visibleToCoParticipants =
        body.visibleToCoParticipants ?? existing.visibleToCoParticipants;
      existing.status = nextStatus;
      existing.updatedAt = new Date().toISOString();
      existing.history.push({
        status: nextStatus,
        at: new Date().toISOString(),
        actorName: user.fullName,
        note: body.isDraft ? 'Lưu bản nháp' : 'Đã cập nhật và gửi lại thông tin đăng ký',
      });
      return HttpResponse.json({ data: existing });
    }

    const created: OpportunityResponse = {
      id: `resp_${Date.now()}`,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      opportunityType: opp.type,
      clubId: opp.clubId,
      clubName: opp.clubName,
      clubLogo: opp.clubLogo,
      studentId: user.id,
      profileSnapshot: {
        fullName: user.fullName,
        studentCode: user.studentCode || 'HE180001',
        email: user.email,
        major: user.major || 'Kỹ thuật phần mềm',
        cohort: user.cohort || 'K18',
        avatarUrl: user.avatarUrl,
      },
      positionId: body.positionId,
      positionName: pos?.name,
      answers: body.answers || [],
      note: body.note,
      status: nextStatus,
      visibleToCoParticipants: body.visibleToCoParticipants ?? true,
      conversationId: 'conv_02',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: nextStatus,
          at: new Date().toISOString(),
          actorName: user.fullName,
          note: isInstantEvent ? 'Xác nhận tự động ngay khi đăng ký' : 'Đã gửi đăng ký',
        },
      ],
    };

    seedOpportunityResponses.unshift(created);
    opp.hasResponses = true;
    opp.submittedCount = (opp.submittedCount || 0) + 1;
    if (isInstantEvent) {
      opp.used += 1;
    }

    return HttpResponse.json({ data: created });
  }),

  http.put('/api/v1/clubs/registrations/:responseId', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<OpportunityResponse> & {
      action?: 'withdraw' | 'toggleVisibility';
    };
    const resp = seedOpportunityResponses.find((r) => r.id === params.responseId);
    if (!resp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn' } },
        { status: 404 }
      );
    }

    if (body.action === 'withdraw') {
      resp.status = 'Withdrawn';
      resp.updatedAt = new Date().toISOString();
      resp.history.push({
        status: 'Withdrawn',
        at: new Date().toISOString(),
        actorName: resp.profileSnapshot.fullName,
        note: 'Sinh viên chủ động rút đăng ký',
      });
    } else if (body.action === 'toggleVisibility') {
      resp.visibleToCoParticipants = Boolean(body.visibleToCoParticipants);
    } else {
      Object.assign(resp, body, { updatedAt: new Date().toISOString() });
    }

    return HttpResponse.json({ data: resp });
  }),

  // 4. Club Representative Review & Management (CL9, CL10)
  http.get('/api/v1/clubs/opportunities/:oppId/responses', async ({ params }) => {
    await mockDelay();
    const list = seedOpportunityResponses.filter(
      (r) => r.opportunityId === params.oppId && r.status !== 'Draft'
    );
    return HttpResponse.json({ data: list });
  }),

  http.put('/api/v1/clubs/responses/:responseId/review', async ({ params, request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const actor = seedUsers.find((u) => u.id === userId);
    const body = (await request.json()) as {
      status: OpportunityResponseStatus;
      feedbackNote?: string;
    };

    const resp = seedOpportunityResponses.find((r) => r.id === params.responseId);
    if (!resp) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn đăng ký' } },
        { status: 404 }
      );
    }

    const prevStatus = resp.status;
    resp.status = body.status;
    if (body.feedbackNote !== undefined) {
      resp.feedbackNote = body.feedbackNote;
    }
    resp.updatedAt = new Date().toISOString();
    resp.history.push({
      status: body.status,
      at: new Date().toISOString(),
      actorName: actor?.fullName || 'Đại diện CLB',
      note: body.feedbackNote,
    });

    const opp = seedClubOpportunities.find((o) => o.id === resp.opportunityId);
    if (
      opp &&
      (body.status === 'Accepted' || body.status === 'Confirmed') &&
      prevStatus !== 'Accepted' &&
      prevStatus !== 'Confirmed'
    ) {
      opp.used += 1;
    }

    return HttpResponse.json({ data: resp });
  }),

  // 5. Representative Requests (CL12)
  http.get('/api/v1/clubs/representative-requests/me', async ({ request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const list = seedClubRepresentativeRequests.filter((r) => r.userId === userId);
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/clubs/representative-requests', async ({ request }) => {
    await mockDelay();
    const userId = getCurrentUserId(request);
    const user = seedUsers.find((u) => u.id === userId) || seedUsers[0];
    const body = (await request.json()) as Partial<ClubRepresentativeRequest>;

    const newReq: ClubRepresentativeRequest = {
      id: `repreq_${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      studentCode: user.studentCode || 'HE180001',
      userEmail: user.email,
      clubId: body.clubId,
      proposedClub: body.proposedClub,
      clubName: body.clubName || body.proposedClub?.name || 'Câu lạc bộ',
      roleNote: body.roleNote || 'Đại diện CLB',
      evidenceNote: body.evidenceNote || '',
      evidenceFileName: body.evidenceFileName,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    seedClubRepresentativeRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  // 6. Club Profile Details & Edit (CL2)
  http.get('/api/v1/clubs/:id', async ({ params }) => {
    await mockDelay();
    const club = seedClubs.find((c) => c.id === params.id);
    if (!club) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'CLB không tồn tại' } },
        { status: 404 }
      );
    }
    const opportunities = seedClubOpportunities.filter(
      (o) => o.clubId === club.id && o.status !== 'Draft'
    );
    return HttpResponse.json({
      data: {
        ...club,
        opportunities,
      },
    });
  }),

  http.put('/api/v1/clubs/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<Club>;
    const club = seedClubs.find((c) => c.id === params.id);
    if (!club) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'CLB không tồn tại' } },
        { status: 404 }
      );
    }
    Object.assign(club, body);
    return HttpResponse.json({ data: club });
  }),
];
