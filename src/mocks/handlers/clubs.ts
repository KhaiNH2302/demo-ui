import { clubRegistrationHandlers, canRepresentClub } from '@/features/clubs/mocks';
import { http, HttpResponse } from 'msw';
import {
  seedClubs,
  seedClubOpportunities,
  seedOpportunityResponses,
  seedClubRepresentativeRequests,
  seedConnectionInvites,
} from '../data/clubs';
import { seedUsers } from '../data/users';
import { mockDelay, getViewerId } from '../utils';
import type {
  Club,
  ClubOpportunity,
  ClubRepresentativeRequest,
} from '@/types/entities';

function getCurrentUserId(request: Request): string {
  return getViewerId(request);
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
      if (!request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_')) return HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' } }, { status: 401 });
      const myClubIds = seedClubs
        .filter((c) => c.representatives?.some((r) => r.userId === userId))
        .map((c) => c.id);
      list = list.filter(
        (o) => o.createdById === userId || myClubIds.includes(o.clubId)
      );
    } else {
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

    const authenticated = request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') && seedUsers.some((user) => user.id === userId && user.status.toLowerCase() === 'active');
    if (opp.status === 'Draft' && (!authenticated || !canRepresentClub(userId, opp.clubId))) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Bản nháp chỉ dành cho đại diện CLB phụ trách.' } }, { status: 403 });
    const myResponse = authenticated ? seedOpportunityResponses.find(
      (r) => r.opportunityId === opp.id && r.studentId === userId && r.status !== 'Withdrawn'
    ) : undefined;

    const coParticipants = opp.type !== 'MemberRecruitment' && myResponse && ['Confirmed','Accepted'].includes(myResponse.status) ? seedOpportunityResponses
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
          conversationId: invite?.status === 'Accepted' ? invite.conversationId : undefined,
        };
      }) : [];

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
    const user = seedUsers.find((u) => u.id === userId);
    const body = (await request.json()) as Partial<ClubOpportunity>;
    const club = seedClubs.find((c) => c.id === body.clubId);
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') || !user || !club || !canRepresentClub(userId, club.id)) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ đại diện CLB được tạo cơ hội của CLB mình.' } }, { status: 403 });
    if (!body.title?.trim() || !body.description?.trim() || !Number.isInteger(body.quota) || Number(body.quota) < 1 || !Number.isFinite(Date.parse(body.registrationDeadline || '')) || Date.parse(body.registrationDeadline || '') <= Date.now()) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Kiểm tra nội dung, chỉ tiêu và hạn đăng ký.' } }, { status: 400 });

    if (!['Event','MemberRecruitment','CollaboratorRecruitment'].includes(body.type || 'Event') || !['Draft','Published'].includes(body.status || 'Published') || body.positions?.some((position) => !position.name.trim() || !Number.isInteger(position.quota) || position.quota < 1)) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Kiểm tra loại cơ hội, trạng thái và chỉ tiêu vị trí.' } }, { status: 400 });
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
      positions: body.positions?.map((position) => ({ ...position, registeredCount: 0 })),
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
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') || !canRepresentClub(getCurrentUserId(request), opp.clubId)) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ đại diện CLB phụ trách được quản lý cơ hội.' } }, { status: 403 });
    if (opp.status === 'Cancelled' || (opp.status === 'Expired' && body.status !== 'Cancelled')) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Cơ hội đã kết thúc vòng đời.' } }, { status: 409 });
    if (body.status && (!['Draft','Published','Closed','Cancelled'].includes(body.status) || (body.status === 'Draft' && opp.status !== 'Draft'))) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Chuyển trạng thái cơ hội không hợp lệ.' } }, { status: 409 });
    if ((body.status === 'Published' || (opp.status === 'Published' && body.registrationDeadline)) && Date.parse(body.registrationDeadline || opp.registrationDeadline) <= Date.now()) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Hạn đăng ký phải trong tương lai khi công bố.' } }, { status: 400 });
    if (body.clubId || body.createdById || body.used !== undefined || body.hasResponses !== undefined || body.id !== undefined || body.submittedCount !== undefined || body.createdByName !== undefined || body.clubName !== undefined) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Không được thay chủ sở hữu hoặc sửa chỉ tiêu đã dùng.' } }, { status: 400 });
    if (body.quota !== undefined && (!Number.isInteger(body.quota) || body.quota < Math.max(1, opp.used))) return HttpResponse.json({ error: { code: 'CLUB_CAPACITY_INVALID', message: 'Chỉ tiêu không được thấp hơn số đã nhận.' } }, { status: 409 });
    if (body.status === 'Cancelled' && !body.cancelReason?.trim()) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Nhập lý do hủy cơ hội.' } }, { status: 400 });
    if (opp.hasResponses && ((body.type && body.type !== opp.type) || (body.confirmMode && body.confirmMode !== opp.confirmMode) || (body.questions && JSON.stringify(body.questions) !== JSON.stringify(opp.questions)))) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Đã có đăng ký; không đổi loại, cách xác nhận hoặc câu hỏi.' } }, { status: 409 });
    if (body.positions) {
      if (opp.positions?.some((position) => position.registeredCount > 0 && !body.positions?.some((next) => next.id === position.id))) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Không xóa vị trí đã có người được nhận.' } }, { status: 409 });
      body.positions = body.positions.map((position) => ({ ...position, registeredCount: opp.positions?.find((old) => old.id === position.id)?.registeredCount || 0 }));
      if (body.positions.some((position) => !Number.isInteger(position.quota) || position.quota < Math.max(1, position.registeredCount))) return HttpResponse.json({ error: { code: 'CLUB_CAPACITY_INVALID', message: 'Chỉ tiêu vị trí không hợp lệ.' } }, { status: 409 });
    }
    Object.assign(opp, body, { updatedAt: new Date().toISOString() });
    if (body.status === 'Cancelled') seedOpportunityResponses.filter((response) => response.opportunityId === opp.id && ['Submitted','UnderReview','NeedsMoreInfo','Confirmed','Accepted'].includes(response.status)).forEach((response) => {
      if (['Confirmed','Accepted'].includes(response.status)) { opp.used = Math.max(0,opp.used-1); const position = opp.positions?.find((item) => item.id === response.positionId); if (position) position.registeredCount = Math.max(0,position.registeredCount-1); }
      response.status = 'Cancelled'; response.visibleToCoParticipants = false; response.updatedAt = opp.updatedAt;
    });
    return HttpResponse.json({ data: opp });
  }),

  ...clubRegistrationHandlers,

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
    const user = request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') ? seedUsers.find((u) => u.id === userId && u.status.toLowerCase() === 'active') : undefined;
    if (!user?.roles.includes('student')) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Cần đăng nhập bằng tài khoản Student đang hoạt động.' } }, { status: 403 });
    const body = (await request.json()) as Partial<ClubRepresentativeRequest>;
    if (!body.evidenceNote?.trim() || (!body.clubId && !body.proposedClub?.name.trim())) return HttpResponse.json({ error: { code: 'CLUB_INVALID_REQUEST', message: 'Chọn CLB và nhập minh chứng đại diện.' } }, { status: 400 });

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
    if (!request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') || !canRepresentClub(getCurrentUserId(request), club.id)) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ đại diện CLB phụ trách được sửa hồ sơ.' } }, { status: 403 });
    const editable = { name: body.name, description: body.description, contactEmail: body.contactEmail, tagline: body.tagline, field: body.field, category: body.category, gallery: body.gallery, coverImageUrl: body.coverImageUrl, foundedYear: body.foundedYear, socialLinks: body.socialLinks, logoUrl: body.logoUrl, coverUrl: body.coverUrl };
    for (const [key,value] of Object.entries(editable)) if (value !== undefined) Object.assign(club, { [key]: value });
    return HttpResponse.json({ data: club });
  }),
];
