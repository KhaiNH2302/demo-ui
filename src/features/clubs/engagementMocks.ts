import { http, HttpResponse } from 'msw';
import {
  seedClubs,
  seedClubOpportunities,
  seedOpportunityResponses,
} from '@/mocks/data/clubs';
import { seedUsers } from '@/mocks/data/users';
import { seedNotifications } from '@/mocks/data/notifications';
import { seedConversations, seedMessages } from '@/mocks/data/conversations';
import { getViewerId } from '@/mocks/utils';
import { isRecruitment, isResultOverdue } from './recruitment';
import type { ClubOpportunity } from '@/types/entities';
import type { ClubPreferences } from './useClubPreferences';

export interface RecruitmentQuestion {
  id: string;
  opportunityId: string;
  authorName: string;
  question: string;
  createdAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
}
const preferences = new Map<string, ClubPreferences>();
export const recruitmentQuestions: RecruitmentQuestion[] = [];
const sent = new Map<string, number>();
const error = (message: string, status = 400) =>
  HttpResponse.json(
    { error: { code: 'CLUB_INVALID_REQUEST', message } },
    { status }
  );
const actor = (request: Request) =>
  request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_')
    ? seedUsers.find(
        (u) =>
          u.id === getViewerId(request) && u.status.toLowerCase() === 'active'
      )
    : undefined;
const isRep = (userId: string | undefined, clubId: string) =>
  seedClubs.some(
    (c) =>
      c.id === clubId &&
      c.status !== 'Hidden' &&
      c.representatives?.some((r) => r.userId === userId)
  );
function readPreferences(userId: string): ClubPreferences {
  if (!preferences.has(userId)) {
    let value: ClubPreferences = {
      savedOpportunityIds: [],
      followedClubIds: [],
    };
    try {
      const stored = JSON.parse(
        localStorage.getItem(`scs-clubs:${userId}`) || 'null'
      );
      if (
        stored &&
        Array.isArray(stored.savedOpportunityIds) &&
        Array.isArray(stored.followedClubIds)
      )
        value = {
          savedOpportunityIds: stored.savedOpportunityIds.filter(
            (id: unknown) => typeof id === 'string'
          ),
          followedClubIds: stored.followedClubIds.filter(
            (id: unknown) => typeof id === 'string'
          ),
        };
    } catch {
      /* Storage is optional in the in-memory demo and Node tests. */
    }
    preferences.set(userId, value);
  }
  return preferences.get(userId)!;
}
function notifyOnce(
  key: string,
  userId: string,
  title: string,
  body: string,
  linkTo: string
) {
  if (sent.has(key)) return;
  sent.set(key, Date.now());
  seedNotifications.unshift({
    id: crypto.randomUUID(),
    userId,
    title,
    body,
    linkTo,
    source: 'ClubOpportunity',
    read: false,
    createdAt: new Date().toISOString(),
  });
}
export function notifyRecruitmentPublished(opportunity: ClubOpportunity) {
  if (!isRecruitment(opportunity)) return;
  seedUsers.forEach((user) => {
    if (
      readPreferences(user.id).followedClubIds.includes(opportunity.clubId) &&
      !isRep(user.id, opportunity.clubId)
    ) {
      notifyOnce(
        `published:${opportunity.id}:${user.id}`,
        user.id,
        `${opportunity.clubName} mở đợt tuyển mới`,
        opportunity.title,
        `/clubs/opportunities/${opportunity.id}`
      );
    }
  });
}
export function syncRecruitmentReminders(now = Date.now()) {
  seedClubOpportunities
    .filter(
      (o) => isRecruitment(o) && ['Published', 'Closed'].includes(o.status)
    )
    .forEach((opportunity) => {
      const pending = seedOpportunityResponses.filter(
        (r) =>
          r.opportunityId === opportunity.id &&
          ['Submitted', 'UnderReview', 'NeedsMoreInfo'].includes(r.status)
      );
      const deadline = Date.parse(opportunity.resultDeadline || '');
      if (
        !pending.length ||
        !Number.isFinite(deadline) ||
        deadline - now > 86400000
      )
        return;
      seedClubs
        .find((c) => c.id === opportunity.clubId)
        ?.representatives?.forEach((rep) => {
          notifyOnce(
            `deadline:${opportunity.id}:${deadline}:${deadline < now ? 'overdue' : 'soon'}:${rep.userId}`,
            rep.userId,
            deadline < now
              ? 'Đợt tuyển đã quá hạn trả kết quả'
              : 'Sắp đến hạn trả kết quả tuyển CLB',
            `${opportunity.title}: còn ${pending.length} hồ sơ cần xử lý.`,
            `/clubs/manage/${opportunity.id}`
          );
        });
    });
}
export function recruitmentContact(opportunity?: ClubOpportunity) {
  const representatives =
    seedClubs.find((c) => c.id === opportunity?.clubId)?.representatives || [];
  const contact =
    representatives.find((r) => r.userId === opportunity?.contactUserId) ||
    representatives[0];
  return contact
    ? {
        ...contact,
        email: seedUsers.find((u) => u.id === contact.userId)?.email,
      }
    : null;
}

export const clubEngagementHandlers = [
  http.get('/api/v1/clubs/preferences', ({ request }) => {
    const user = actor(request);
    return user
      ? HttpResponse.json({ data: readPreferences(user.id) })
      : error('Vui lòng đăng nhập.', 401);
  }),
  http.put('/api/v1/clubs/preferences', async ({ request }) => {
    const user = actor(request);
    if (!user) return error('Vui lòng đăng nhập.', 401);
    const body = (await request.json()) as {
      kind?: string;
      id?: string;
      active?: boolean;
    };
    if (
      !['save', 'follow'].includes(body.kind || '') ||
      typeof body.active !== 'boolean' ||
      !body.id
    )
      return error('Lựa chọn không hợp lệ.');
    const exists =
      body.kind === 'save'
        ? seedClubOpportunities.some(
            (o) => o.id === body.id && isRecruitment(o) && o.status !== 'Draft'
          )
        : seedClubs.some((c) => c.id === body.id && c.status !== 'Hidden');
    if (body.active && !exists)
      return error('Không tìm thấy CLB hoặc đợt tuyển.', 404);
    const value = readPreferences(user.id);
    const field =
      body.kind === 'save' ? 'savedOpportunityIds' : 'followedClubIds';
    value[field] = body.active
      ? [...new Set([...value[field], body.id])]
      : value[field].filter((id) => id !== body.id);
    try {
      localStorage.setItem(`scs-clubs:${user.id}`, JSON.stringify(value));
    } catch {
      /* Keep session state if storage is unavailable. */
    }
    return HttpResponse.json({ data: value });
  }),
  http.get(
    '/api/v1/clubs/opportunities/:oppId/questions',
    ({ params, request }) => {
      const opp = seedClubOpportunities.find((o) => o.id === params.oppId);
      if (
        !opp ||
        (opp.status === 'Draft' && !isRep(actor(request)?.id, opp.clubId))
      )
        return error('Không tìm thấy đợt tuyển.', 404);
      return HttpResponse.json({
        data: recruitmentQuestions.filter((q) => q.opportunityId === opp.id),
      });
    }
  ),
  http.post(
    '/api/v1/clubs/opportunities/:oppId/questions',
    async ({ params, request }) => {
      const user = actor(request),
        opp = seedClubOpportunities.find((o) => o.id === params.oppId);
      if (!user) return error('Đăng nhập để đặt câu hỏi.', 401);
      if (
        !opp ||
        !isRecruitment(opp) ||
        !['Published', 'Closed'].includes(opp.status)
      )
        return error('Đợt tuyển không còn nhận câu hỏi.', 409);
      const body = (await request.json()) as { question?: string };
      if (
        typeof body.question !== 'string' ||
        body.question.trim().length < 5 ||
        body.question.length > 1000
      )
        return error('Câu hỏi cần từ 5 đến 1.000 ký tự.');
      const question: RecruitmentQuestion = {
        id: crypto.randomUUID(),
        opportunityId: opp.id,
        authorName: user.fullName,
        question: body.question.trim(),
        createdAt: new Date().toISOString(),
      };
      recruitmentQuestions.push(question);
      seedClubs
        .find((c) => c.id === opp.clubId)
        ?.representatives?.forEach((rep) =>
          notifyOnce(
            `question:${question.id}:${rep.userId}`,
            rep.userId,
            'Có câu hỏi về đợt tuyển CLB',
            question.question,
            `/clubs/opportunities/${opp.id}#questions`
          )
        );
      return HttpResponse.json({ data: question }, { status: 201 });
    }
  ),
  http.put(
    '/api/v1/clubs/opportunities/:oppId/questions/:questionId',
    async ({ params, request }) => {
      const user = actor(request),
        opp = seedClubOpportunities.find((o) => o.id === params.oppId);
      if (!opp || !user || !isRep(user.id, opp.clubId))
        return error('Chỉ đại diện CLB phụ trách được trả lời.', 403);
      const question = recruitmentQuestions.find(
        (q) => q.id === params.questionId && q.opportunityId === opp.id
      );
      if (!question) return error('Không tìm thấy câu hỏi.', 404);
      const body = (await request.json()) as { answer?: string };
      if (
        typeof body.answer !== 'string' ||
        !body.answer.trim() ||
        body.answer.length > 2000
      )
        return error('Câu trả lời cần từ 1 đến 2.000 ký tự.');
      Object.assign(question, {
        answer: body.answer.trim(),
        answeredBy: user.fullName,
        answeredAt: new Date().toISOString(),
      });
      return HttpResponse.json({ data: question });
    }
  ),
  http.post(
    '/api/v1/clubs/registrations/:responseId/remind',
    ({ params, request }) => {
      const user = actor(request),
        response = seedOpportunityResponses.find(
          (r) => r.id === params.responseId
        );
      if (!user || response?.studentId !== user.id)
        return error('Bạn không sở hữu đơn này.', 403);
      const opp = seedClubOpportunities.find(
        (o) => o.id === response.opportunityId
      );
      if (!opp || !isResultOverdue(response, opp))
        return error(
          'Chỉ nhắc khi đơn đang chờ xử lý và đã quá hạn trả kết quả.',
          409
        );
      const key = `student-reminder:${response.id}`;
      if (Date.now() - (sent.get(key) || 0) < 86400000)
        return HttpResponse.json({ data: { alreadySent: true } });
      seedClubs
        .find((c) => c.id === opp.clubId)
        ?.representatives?.forEach((rep) =>
          notifyOnce(
            `${key}:${Date.now()}:${rep.userId}`,
            rep.userId,
            'Sinh viên nhắc kết quả ứng tuyển CLB',
            `${user.fullName} đang chờ phản hồi cho ${opp.title}.`,
            `/clubs/manage/${opp.id}`
          )
        );
      sent.set(key, Date.now());
      return HttpResponse.json({ data: { alreadySent: false } });
    }
  ),
  http.post(
    '/api/v1/clubs/registrations/:responseId/conversation',
    ({ params, request }) => {
      const user = actor(request),
        response = seedOpportunityResponses.find(
          (r) => r.id === params.responseId
        );
      if (
        !response ||
        !user ||
        (response.studentId !== user.id && !isRep(user.id, response.clubId))
      )
        return error('Bạn không được truy cập đơn này.', 403);
      if (!['Accepted', 'Confirmed'].includes(response.status))
        return error('Kênh hướng dẫn mở sau khi được nhận.', 409);
      const opp = seedClubOpportunities.find(
          (o) => o.id === response.opportunityId
        ),
        contact = recruitmentContact(opp);
      if (!contact) return error('CLB chưa công bố người phụ trách.', 409);
      let conversation = seedConversations.find(
        (c) =>
          c.id === response.conversationId &&
          c.participantIds.includes(response.studentId) &&
          c.participantIds.includes(contact.userId)
      );
      if (!conversation) {
        const now = new Date().toISOString();
        conversation = {
          id: crypto.randomUUID(),
          kind: 'opportunity',
          refId: response.id,
          title: `${response.clubName} · Hướng dẫn sau trúng tuyển`,
          participantIds: [
            ...new Set([response.studentId, contact.userId, user.id]),
          ],
          requestStatus: 'accepted',
          lastMessage: 'Trao đổi lịch gặp mặt và các bước tiếp theo tại đây.',
          lastMessageAt: now,
          unreadCount: 0,
        };
        seedConversations.unshift(conversation);
        seedMessages.push({
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          senderId: contact.userId,
          content: `Chào ${response.profileSnapshot.fullName}, bạn đã được nhận vào đợt tuyển “${response.opportunityTitle}”. Trao đổi lịch gặp mặt và các bước tiếp theo tại đây.`,
          type: 'text',
          status: 'sent',
          createdAt: now,
        });
        response.conversationId = conversation.id;
      }
      if (!conversation.participantIds.includes(user.id))
        conversation.participantIds.push(user.id);
      return HttpResponse.json({ data: { id: conversation.id } });
    }
  ),
];
