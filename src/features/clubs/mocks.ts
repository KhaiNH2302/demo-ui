import { http, HttpResponse } from 'msw';
import { seedUsers } from '@/mocks/data/users';
import { seedClubs, seedClubOpportunities, seedOpportunityResponses } from '@/mocks/data/clubs';
import { seedNotifications } from '@/mocks/data/notifications';
import { getViewerId } from '@/mocks/utils';
import type { ClubOpportunity, OpportunityResponse } from '@/types/entities';
import type { OpportunityResponseStatus } from '@/types/status';
import { clubRegistrationUnavailable } from '@/features/programs/rules';
import { recruitmentContact, syncRecruitmentReminders } from './engagementMocks';

const error = (message: string, status = 400, code = 'CLUB_INVALID_REQUEST') => HttpResponse.json({ error: { code, message } }, { status });
const actor = (request: Request) => request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') ? seedUsers.find((user) => user.id === getViewerId(request) && user.status.toLowerCase() === 'active') : undefined;
export const canRepresentClub = (userId: string | undefined, clubId: string) => Boolean(userId && seedUsers.some((user) => user.id === userId && user.status.toLowerCase() === 'active') && seedClubs.some((club) => club.id === clubId && club.status !== 'Hidden' && club.representatives?.some((rep) => rep.userId === userId)));
const occupied = (status: OpportunityResponseStatus) => status === 'Confirmed' || status === 'Accepted';
function changeSeats(opportunity: ClubOpportunity, response: OpportunityResponse, delta: number) {
  opportunity.used = Math.max(0, opportunity.used + delta);
  const position = opportunity.positions?.find((item) => item.id === response.positionId);
  if (position) position.registeredCount = Math.max(0, position.registeredCount + delta);
}
const notify = (response: OpportunityResponse, title: string) => seedNotifications.unshift({ id: crypto.randomUUID(), userId: response.studentId, source: 'ClubOpportunity', title, body: `${response.opportunityTitle}${response.feedbackNote ? `: ${response.feedbackNote}` : ''}`, linkTo: `/clubs/registrations/${response.id}`, read: false, createdAt: new Date().toISOString() });

export const clubRegistrationHandlers = [
  http.get('/api/v1/clubs/registrations/me', ({ request }) => {
    const user = actor(request);
    if (!user) return error('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    return HttpResponse.json({ data: seedOpportunityResponses.filter((response) => response.studentId === user.id) });
  }),
  http.get('/api/v1/clubs/registrations/:responseId', ({ request, params }) => {
    const user = actor(request), response = seedOpportunityResponses.find((item) => item.id === params.responseId);
    if (!response) return error('Không tìm thấy đơn đăng ký.', 404, 'NOT_FOUND');
    if (response.studentId !== user?.id && !canRepresentClub(user?.id, response.clubId)) return error('Bạn không được xem đơn đăng ký này.', 403, 'FORBIDDEN');
    const opportunity = seedClubOpportunities.find((item) => item.id === response.opportunityId);
    const coParticipants = occupied(response.status) ? seedOpportunityResponses.filter((item) => item.opportunityId === response.opportunityId && occupied(item.status) && item.visibleToCoParticipants && item.studentId !== user?.id).map((item) => ({ userId: item.studentId, fullName: item.profileSnapshot.fullName, studentCode: item.profileSnapshot.studentCode, major: item.profileSnapshot.major, cohort: item.profileSnapshot.cohort, avatarUrl: item.profileSnapshot.avatarUrl, positionOrSlot: item.positionName })) : [];
    syncRecruitmentReminders();
    return HttpResponse.json({ data: { ...response, opportunity, coParticipants, contact: recruitmentContact(opportunity) } });
  }),
  http.post('/api/v1/clubs/opportunities/:oppId/register', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as Pick<OpportunityResponse, 'positionId' | 'answers' | 'note' | 'visibleToCoParticipants'> & { isDraft?: boolean };
    if (!user) return error('Vui lòng đăng nhập bằng tài khoản đang hoạt động.', 401, 'UNAUTHORIZED');
    const opportunity = seedClubOpportunities.find((item) => item.id === params.oppId);
    if (!opportunity) return error('Không tìm thấy cơ hội CLB.', 404, 'NOT_FOUND');
    if (canRepresentClub(user.id, opportunity.clubId)) return error('Đại diện CLB không đăng ký cơ hội của chính CLB mình.', 403, 'FORBIDDEN');
    const existing = seedOpportunityResponses.find((item) => item.opportunityId === opportunity.id && item.studentId === user.id);
    const previousStatus = existing?.status;
    const unavailable = clubRegistrationUnavailable(opportunity, existing, body.positionId || '');
    if (unavailable) return error(unavailable, 409);
    if (!body.isDraft && opportunity.questions.some((question) => question.required && !body.answers?.some((answer) => answer.questionId === question.id && (Array.isArray(answer.value) ? answer.value.length > 0 : answer.value.trim().length > 0)))) return error('Vui lòng trả lời đủ câu hỏi bắt buộc.');
    const instant = opportunity.type === 'Event' && opportunity.confirmMode !== 'Approval';
    const status: OpportunityResponseStatus = body.isDraft ? 'Draft' : instant ? 'Confirmed' : 'Submitted';
    const now = new Date().toISOString(), position = opportunity.positions?.find((item) => item.id === body.positionId);
    const response: OpportunityResponse = { id: existing?.id || crypto.randomUUID(), opportunityId: opportunity.id, opportunityTitle: opportunity.title, opportunityType: opportunity.type, clubId: opportunity.clubId, clubName: opportunity.clubName, clubLogo: opportunity.clubLogo, studentId: user.id, profileSnapshot: { fullName: user.fullName, studentCode: user.studentCode || '', email: user.email, major: user.major || '', cohort: user.cohort || '', avatarUrl: user.avatarUrl }, positionId: position?.id, positionName: position?.name, answers: body.answers || [], note: body.note, status, visibleToCoParticipants: body.visibleToCoParticipants === true, submittedAt: now, updatedAt: now, history: [...(existing?.history || []), { status, at: now, actorName: user.fullName, note: body.isDraft ? 'Lưu bản nháp' : 'Gửi đăng ký' }] };
    if (existing) Object.assign(existing, response); else seedOpportunityResponses.unshift(response);
    if (!body.isDraft) opportunity.hasResponses = true;
    if (!body.isDraft && (!previousStatus || ['Draft', 'Withdrawn', 'Cancelled'].includes(previousStatus))) opportunity.submittedCount = (opportunity.submittedCount || 0) + 1;
    if (occupied(status)) changeSeats(opportunity, response, 1);
    if (!body.isDraft) notify(response, status === 'Confirmed' ? 'Đã xác nhận đăng ký cơ hội CLB' : 'Đã nhận đăng ký cơ hội CLB');
    return HttpResponse.json({ data: response }, { status: 201 });
  }),
  http.put('/api/v1/clubs/registrations/:responseId', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as { action?: 'withdraw' | 'toggleVisibility'; visibleToCoParticipants?: boolean };
    const response = seedOpportunityResponses.find((item) => item.id === params.responseId), opportunity = seedClubOpportunities.find((item) => item.id === response?.opportunityId);
    if (!response || !opportunity) return error('Không tìm thấy đơn.', 404, 'NOT_FOUND');
    if (response.studentId !== user?.id) return error('Bạn không sở hữu đơn đăng ký này.', 403, 'FORBIDDEN');
    if (body.action === 'withdraw') {
      if (!['Draft', 'Submitted', 'UnderReview', 'NeedsMoreInfo', 'Confirmed', 'Accepted'].includes(response.status)) return error('Đơn này không thể rút.', 409);
      if (opportunity.startAt && Date.parse(opportunity.startAt) <= Date.now()) return error('Hoạt động đã bắt đầu và không thể rút đăng ký.', 409);
      if (occupied(response.status)) changeSeats(opportunity, response, -1);
      response.status = 'Withdrawn'; response.visibleToCoParticipants = false;
      response.history.push({ status: 'Withdrawn', at: new Date().toISOString(), actorName: user!.fullName, note: 'Sinh viên chủ động rút đăng ký' });
    } else if (body.action === 'toggleVisibility') {
      if (!occupied(response.status)) return error('Chỉ người đã được nhận được xuất hiện trong danh sách.');
      response.visibleToCoParticipants = body.visibleToCoParticipants === true;
    } else return error('Thao tác không hợp lệ. Không được tự đổi trạng thái đơn.');
    response.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: response });
  }),
  http.get('/api/v1/clubs/opportunities/:oppId/responses', ({ request, params }) => {
    const user = actor(request), opportunity = seedClubOpportunities.find((item) => item.id === params.oppId);
    if (!opportunity) return error('Không tìm thấy cơ hội.', 404, 'NOT_FOUND');
    if (!canRepresentClub(user?.id, opportunity.clubId)) return error('Chỉ đại diện CLB được xem danh sách đơn.', 403, 'FORBIDDEN');
    return HttpResponse.json({ data: seedOpportunityResponses.filter((item) => item.opportunityId === opportunity.id && item.status !== 'Draft') });
  }),
  http.put('/api/v1/clubs/responses/:responseId/review', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as { status: OpportunityResponseStatus; feedbackNote?: string };
    const response = seedOpportunityResponses.find((item) => item.id === params.responseId), opportunity = seedClubOpportunities.find((item) => item.id === response?.opportunityId);
    if (!response || !opportunity) return error('Không tìm thấy đơn.', 404, 'NOT_FOUND');
    if (!canRepresentClub(user?.id, opportunity.clubId)) return error('Chỉ đại diện CLB phụ trách được duyệt.', 403, 'FORBIDDEN');
    if (!['Submitted', 'UnderReview', 'NeedsMoreInfo'].includes(response.status)) return error('Đơn không còn chờ duyệt.', 409);
    const accepted = opportunity.type === 'Event' ? 'Confirmed' : 'Accepted';
    if (!['UnderReview', 'NeedsMoreInfo', 'Rejected', accepted].includes(body.status)) return error('Trạng thái quyết định không phù hợp loại cơ hội.');
    if (!['Published', 'Closed'].includes(opportunity.status) || (opportunity.type === 'Event' && Date.parse(opportunity.startAt || opportunity.registrationDeadline) <= Date.now())) return error('Cơ hội đã đóng vòng đời.', 409);
    if (['NeedsMoreInfo', 'Rejected'].includes(body.status) && !body.feedbackNote?.trim()) return error('Vui lòng nhập lý do phản hồi.');
    const position = opportunity.positions?.find((item) => item.id === response.positionId);
    if (body.status === accepted && (opportunity.used >= opportunity.quota || (position && position.registeredCount >= position.quota))) return error('Đã hết chỉ tiêu tổng hoặc chỉ tiêu vị trí.', 409);
    response.status = body.status; response.feedbackNote = body.feedbackNote?.trim(); response.updatedAt = new Date().toISOString();
    response.history.push({ status: body.status, at: response.updatedAt, actorName: user!.fullName, note: response.feedbackNote });
    if (occupied(body.status)) changeSeats(opportunity, response, 1);
    notify(response, body.status === accepted ? 'Đăng ký cơ hội đã được nhận' : 'Đơn đăng ký có cập nhật');
    return HttpResponse.json({ data: response });
  }),
];
