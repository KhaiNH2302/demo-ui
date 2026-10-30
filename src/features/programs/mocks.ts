import { seedClubs } from '@/mocks/data/clubs';
import { http, HttpResponse } from 'msw';
import { seedUsers } from '@/mocks/data/users';
import { seedProgramChannels, seedProgramRegistrations, seedProgramAnnouncements, seedProgramProposals } from '@/mocks/data/programs';
import { seedNotifications } from '@/mocks/data/notifications';
import { getViewerId } from '@/mocks/utils';
import type { ProgramChannel, ProgramProposal, ProgramRegistration, ProgramAnnouncement, User } from '@/types/entities';
import { programRegistrationUnavailable, proposalHybridError, programUnlimited } from './rules';

const error = (message: string, status = 400, code = 'PROGRAM_INVALID_REQUEST') => HttpResponse.json({ error: { code, message } }, { status });
const actor = (request: Request) => request.headers.get('Authorization')?.startsWith('Bearer mock_jwt_token_') ? seedUsers.find((user) => user.id === getViewerId(request) && user.status.toLowerCase() === 'active') : undefined;
const isManager = (user?: User) => Boolean(user?.roles.includes('event_manager'));
const isRep = (user?: User) => Boolean(user?.roles.includes('club_rep'));
const canCreate = (user: User | undefined, type: string | undefined) => type === 'Event' ? isRep(user) : isManager(user);
const owns = (user: User | undefined, program: ProgramChannel) => isManager(user) && program.organizer.userId === user?.id;
const notify = (userId: string, title: string, body: string, linkTo: string) => seedNotifications.unshift({ id: crypto.randomUUID(), userId, source: 'Program', title, body, linkTo, read: false, createdAt: new Date().toISOString() });
const slotFor = (program: ProgramChannel, registration: ProgramRegistration) => program.slots?.find((slot) => slot.id === registration.slotId);
function changeSeats(program: ProgramChannel, registration: ProgramRegistration, delta: number) {
  program.confirmedCount = Math.max(0, program.confirmedCount + delta);
  const slot = slotFor(program, registration);
  if (slot) slot.confirmedCount = Math.max(0, slot.confirmedCount + delta);
}
function programValidation(program: ProgramChannel) {
  if (!['Event', 'Volunteer', 'Workshop'].includes(program.type)) return 'Chỉ hỗ trợ Tình nguyện hoặc Workshop.';
  if (!program.title.trim() || !program.description.trim() || !program.locationOrLink.trim()) return 'Vui lòng nhập tên, mô tả và địa điểm chương trình.';
  if (!programUnlimited(program) && (!Number.isInteger(program.quota) || program.quota < 1 || program.quota < program.confirmedCount)) return 'Chỉ tiêu phải là số nguyên dương và không thấp hơn số người đã xác nhận.';
  if (program.mode === 'Hybrid' && (!program.slots?.some(s => s.attendanceMode === 'Offline') || !program.slots?.some(s => s.attendanceMode === 'Online') || program.slots.some(s => !s.attendanceMode) || !/^https?:\/\//.test(program.onlineLink || ''))) return 'Hybrid cần nhóm trực tiếp, nhóm online và link tham gia hợp lệ.';
  if (program.onlineUnlimited !== undefined && typeof program.onlineUnlimited !== 'boolean') return 'Chế độ không giới hạn không hợp lệ.';
  if (program.mode === 'Hybrid' && Boolean(program.onlineUnlimited) !== Boolean(program.slots?.find(s => s.attendanceMode === 'Online')?.unlimited)) return 'Chế độ không giới hạn phải khớp nhóm online.';
  if ((program.mode === 'Offline' && program.onlineUnlimited) || program.slots?.some(s => s.unlimited && (program.mode !== 'Hybrid' || s.attendanceMode !== 'Online'))) return 'Chỉ nhóm online được phép không giới hạn.';
  const start = Date.parse(program.startAt), end = Date.parse(program.endAt), deadline = Date.parse(program.registrationDeadline);
  if (![start, end, deadline].every(Number.isFinite) || end <= start || deadline >= start) return 'Hạn đăng ký phải trước giờ bắt đầu; giờ kết thúc phải sau giờ bắt đầu.';
  if (program.status === 'Published' && (deadline <= Date.now() || start <= Date.now())) return 'Chỉ công bố chương trình có hạn đăng ký và thời gian diễn ra trong tương lai.';
  if (program.slots?.some((slot) => !slot.name.trim() || (!slot.unlimited && (!Number.isInteger(slot.quota) || slot.quota < 1 || slot.quota < slot.confirmedCount)))) return 'Chỉ tiêu mỗi ca phải hợp lệ và không thấp hơn số người đã xác nhận.';
  if (program.slots?.length && program.quota !== program.slots.reduce((sum, slot) => sum + (slot.unlimited ? 0 : slot.quota), 0)) return 'Chỉ tiêu tổng phải bằng tổng chỉ tiêu các ca.';
  if (program.status === 'Published' && program.type === 'Workshop' && !program.speakerInfo?.name.trim()) return 'Nhập thông tin người trình bày workshop trước khi công bố.';
  return null;
}
function makeProgram(user: User, body: Partial<ProgramChannel>): ProgramChannel {
  const now = new Date().toISOString();
  return {
    onlineUnlimited: body.mode !== 'Offline' && body.onlineUnlimited === true, clubId: body.clubId, onlineLink: body.onlineLink, sourceType: 'ManagerCreated', id: crypto.randomUUID(), type: body.type || 'Workshop', title: body.title || '', summary: body.summary || '', description: body.description || '',
    coverUrl: body.coverUrl, coverImageUrl: body.coverImageUrl, gallery: body.gallery || [], tags: body.tags || [],
    organizer: { userId: user.id, fullName: user.fullName, studentCode: user.studentCode || '', major: user.major || '', cohort: user.cohort || '', avatarUrl: user.avatarUrl, roleNote: 'Manager' },
    coOrganizers: [], startAt: body.startAt || new Date(Date.now() + 7 * 86400000).toISOString(), endAt: body.endAt || new Date(Date.now() + 7 * 86400000 + 7200000).toISOString(),
    mode: body.mode || 'Offline', locationOrLink: body.locationOrLink || '', gatheringPoint: body.gatheringPoint, beneficiaryAndGoal: body.beneficiaryAndGoal,
    slots: body.slots?.map((slot) => ({ ...slot, confirmedCount: 0 })), preparationNotes: body.preparationNotes, safetyNotes: body.safetyNotes, speakerInfo: body.speakerInfo, targetAudience: body.targetAudience, prerequisites: body.prerequisites,
    confirmMode: body.confirmMode || 'Instant', quota: body.quota === undefined ? 40 : Number(body.quota), confirmedCount: 0, submittedCount: 0,
    registrationDeadline: body.registrationDeadline || new Date(Date.now() + 5 * 86400000).toISOString(), questions: body.questions || [],
    status: body.status || 'Draft', hasRegistrations: false, createdAt: now, updatedAt: now,
  };
}

export const programHandlers = [
  http.put('/api/v1/admin/programs/:id/review', () => error('Luồng duyệt kênh bởi Admin đã ngừng sử dụng. Manager duyệt đề xuất và công bố chương trình.', 410, 'RETIRED_ENDPOINT')),
  http.get('/api/v1/programs/eligibility', ({ request }) => {
    const user = actor(request);
    if (!user) return error('Vui lòng đăng nhập bằng tài khoản đang hoạt động.', 401, 'UNAUTHORIZED');
    return HttpResponse.json({ data: { eligible: isManager(user) || isRep(user), activeChannelsCount: seedProgramChannels.filter((p) => p.organizer.userId === user.id && p.status === 'Published').length, maxAllowed: null, checks: [{ key: 'event_manager', label: 'Có quyền tổ chức hoặc đại diện CLB', passed: isManager(user) || isRep(user) }] } });
  }),
  http.get('/api/v1/programs/proposals', ({ request }) => {
    const user = actor(request);
    if (!user) return error('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    const review = new URL(request.url).searchParams.get('review') === 'true';
    if (review && !isManager(user)) return error('Chỉ Manager được xem hàng đợi đề xuất.', 403, 'FORBIDDEN');
    return HttpResponse.json({ data: seedProgramProposals.filter((proposal) => review ? proposal.status !== 'Draft' : proposal.studentId === user.id) });
  }),
  http.post('/api/v1/programs/proposals', async ({ request }) => {
    const user = actor(request);
    if (!user || (!isRep(user) && !user.roles.some((role) => role.toLowerCase() === 'student'))) return error('Chỉ Student được gửi đề xuất chương trình.', 403, 'FORBIDDEN');
    const body = await request.json() as Partial<ProgramProposal>;
    if (body.status && !['Draft','PendingReview'].includes(body.status)) return error('Student chỉ lưu nháp hoặc gửi đề xuất.');
    if (body.type === 'Event' && (!isRep(user) || !seedClubs.some(c => c.id === body.clubId && c.representatives?.some(rep => rep.userId === user.id)))) return error('Chỉ Club Rep được đề xuất sự kiện cho CLB mình đại diện.', 403, 'FORBIDDEN');
    if ((body.type && !['Event','Volunteer','Workshop'].includes(body.type)) || (body.mode && !['Offline','Online','Hybrid'].includes(body.mode)) || (!(body.mode === 'Online' && body.onlineUnlimited) && body.expectedParticipants !== undefined && (!Number.isInteger(body.expectedParticipants) || body.expectedParticipants < 1))) return error('Loại chương trình, hình thức hoặc số người dự kiến không hợp lệ.');
    const now = new Date().toISOString();
    const proposal: ProgramProposal = { id: crypto.randomUUID(), studentId: user.id, studentName: user.fullName, clubId: body.type === 'Event' ? body.clubId : undefined, type: body.type === 'Event' ? 'Event' : body.type === 'Volunteer' ? 'Volunteer' : 'Workshop', title: body.title?.trim() || 'Đề xuất chưa đặt tên', description: body.description?.trim() || '', goal: body.goal?.trim() || '', targetAudience: body.targetAudience?.trim() || '', onlineUnlimited: body.mode !== 'Offline' && body.onlineUnlimited === true, offlineQuota: body.mode === 'Hybrid' ? body.offlineQuota : undefined, onlineQuota: body.mode === 'Hybrid' ? body.onlineQuota : undefined, expectedParticipants: body.mode === 'Hybrid' ? (body.offlineQuota || 0) + (body.onlineUnlimited ? 0 : body.onlineQuota || 0) : body.mode === 'Online' && body.onlineUnlimited ? 0 : Number(body.expectedParticipants) || 30, suggestedStartAt: body.suggestedStartAt || '', location: body.location?.trim() || '', safetyNotes: body.safetyNotes?.trim() || '', mode: body.mode || 'Offline', contactInfo: body.contactInfo?.trim() || user.email, acknowledgedTerms: body.acknowledgedTerms === true, status: body.status || 'PendingReview', createdAt: now, updatedAt: now };
    if (proposalHybridError(proposal)) return error(proposalHybridError(proposal)!);
    if (proposal.status === 'PendingReview' && (!proposal.description || !proposal.goal || !proposal.targetAudience || !proposal.location || !proposal.safetyNotes || (!(proposal.mode === 'Online' && proposal.onlineUnlimited) && (!Number.isInteger(proposal.expectedParticipants) || proposal.expectedParticipants < 1)) || !Number.isFinite(Date.parse(proposal.suggestedStartAt)) || Date.parse(proposal.suggestedStartAt) <= Date.now() || !proposal.acknowledgedTerms)) return error('Điền đầy đủ nội dung, thời gian tương lai và xác nhận cam kết trước khi gửi.');
    if (proposal.status === 'PendingReview' && seedProgramProposals.filter((item) => item.studentId === user.id && item.status === 'PendingReview').length >= 3) return error('Bạn đang có 3 đề xuất chờ duyệt. Hãy chờ kết quả hoặc rút một đề xuất trước khi gửi thêm.', 409, 'PROPOSAL_LIMIT_REACHED');
    seedProgramProposals.unshift(proposal);
    if (proposal.status === 'PendingReview') seedUsers.filter(isManager).forEach((manager) => notify(manager.id, 'Có đề xuất chương trình mới', proposal.title, '/programs/proposals/review'));
    return HttpResponse.json({ data: proposal }, { status: 201 });
  }),
  http.put('/api/v1/programs/proposals/:proposalId', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as Partial<ProgramProposal> & { action?: 'withdraw' };
    const proposal = seedProgramProposals.find((item) => item.id === params.proposalId);
    if (!proposal) return error('Không tìm thấy đề xuất.', 404, 'NOT_FOUND');
    if (body.action === 'withdraw' || body.status === 'Draft' || body.status === 'PendingReview') {
      if (proposal.studentId !== user?.id) return error('Bạn không sở hữu đề xuất này.', 403, 'FORBIDDEN');
      if (body.action === 'withdraw') {
        if (proposal.status !== 'PendingReview') return error('Đề xuất không còn chờ duyệt.', 409);
        proposal.status = 'Draft';
      } else {
        if (proposal.status !== 'Draft') return error('Chỉ sửa bản nháp. Đề xuất đã từ chối phải tạo bản mới.', 409);
        const editable = ['type','title','description','goal','targetAudience','expectedParticipants','offlineQuota','onlineQuota','onlineUnlimited','suggestedStartAt','location','clubId','safetyNotes','mode','contactInfo','acknowledgedTerms'] as const;
        const next = { ...proposal, status: body.status! };
        for (const key of editable) if (body[key] !== undefined) Object.assign(next, { [key]: body[key] });
        if (proposalHybridError(next)) return error(proposalHybridError(next)!);
        if (next.mode === 'Hybrid') next.expectedParticipants = next.offlineQuota! + (next.onlineUnlimited ? 0 : next.onlineQuota!);
        if (!['Event','Volunteer','Workshop'].includes(next.type) || !['Offline','Online','Hybrid'].includes(next.mode || 'Offline') || (!(next.mode === 'Online' && next.onlineUnlimited) && (!Number.isInteger(next.expectedParticipants) || next.expectedParticipants < 1))) return error('Loại chương trình, hình thức hoặc số người dự kiến không hợp lệ.');
        if (next.type === 'Event' && (!isRep(user) || !seedClubs.some(c => c.id === next.clubId && c.representatives?.some(rep => rep.userId === user?.id)))) return error('Bạn không đại diện CLB này.', 403);
        if (next.status === 'PendingReview' && (!next.title.trim() || !next.description.trim() || !next.goal.trim() || !next.targetAudience.trim() || !next.location.trim() || !next.safetyNotes.trim() || !next.contactInfo?.trim() || (!(next.mode === 'Online' && next.onlineUnlimited) && (!Number.isInteger(next.expectedParticipants) || next.expectedParticipants < 1)) || !Number.isFinite(Date.parse(next.suggestedStartAt)) || Date.parse(next.suggestedStartAt) <= Date.now() || !next.acknowledgedTerms)) return error('Điền đầy đủ đề xuất, thời gian tương lai và cam kết trước khi gửi.');
        if (next.status === 'PendingReview' && seedProgramProposals.filter((item) => item.studentId === user!.id && item.status === 'PendingReview').length >= 3) return error('Bạn đang có 3 đề xuất chờ duyệt. Hãy chờ kết quả hoặc rút một đề xuất trước khi gửi thêm.', 409, 'PROPOSAL_LIMIT_REACHED');
        Object.assign(proposal,next);
        if (next.status === 'PendingReview') seedUsers.filter(isManager).forEach((manager) => notify(manager.id, 'Đề xuất chương trình đang chờ duyệt', proposal.title, '/programs/proposals/review'));
      }
    } else {
      if (!isManager(user)) return error('Chỉ Manager được duyệt đề xuất.', 403, 'FORBIDDEN');
      if (proposal.status !== 'PendingReview' || !['Approved','Rejected'].includes(body.status || '')) return error('Đề xuất không còn chờ duyệt.', 409);
      if (!body.reviewReason?.trim()) return error('Vui lòng nhập lý do quyết định.');
      if (body.status === 'Approved') {
        const start = Math.max(Date.parse(proposal.suggestedStartAt), Date.now() + 7 * 86400000);
        const program = makeProgram(user!, { onlineUnlimited: proposal.onlineUnlimited, type: proposal.type, clubId: proposal.clubId, title: proposal.title, description: proposal.description, summary: proposal.goal, targetAudience: proposal.targetAudience, slots: proposal.mode === 'Hybrid' ? [{id: crypto.randomUUID(), name: 'Tham gia trực tiếp', attendanceMode: 'Offline', timeRange: 'Theo lịch chương trình', quota: proposal.offlineQuota!, confirmedCount: 0}, {id: crypto.randomUUID(), name: 'Tham gia online', attendanceMode: 'Online', timeRange: 'Theo lịch chương trình', unlimited: proposal.onlineUnlimited, quota: proposal.onlineUnlimited ? 0 : proposal.onlineQuota!, confirmedCount: 0}] : undefined, quota: proposal.expectedParticipants, startAt: new Date(start).toISOString(), endAt: new Date(start+7200000).toISOString(), registrationDeadline: new Date(start-86400000).toISOString(), locationOrLink: proposal.location, mode: proposal.mode, safetyNotes: proposal.safetyNotes, status: 'Draft' });
        program.sourceType = 'StudentProposal'; program.proposalId = proposal.id;
        seedProgramChannels.unshift(program); proposal.programId = program.id;
      }
      proposal.status = body.status!; proposal.reviewedBy = user!.id; proposal.reviewReason = body.reviewReason.trim(); proposal.reviewedAt = new Date().toISOString();
      notify(proposal.studentId, 'Đề xuất chương trình đã có kết quả', proposal.title + ': ' + proposal.reviewReason, '/programs/proposals');
    }
    proposal.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: proposal });
  }),
  http.get('/api/v1/programs/registrations/me', ({ request }) => {
    const user = actor(request);
    if (!user) return error('Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
    return HttpResponse.json({ data: seedProgramRegistrations.filter((reg) => reg.studentId === user.id) });
  }),
  http.get('/api/v1/programs', ({ request }) => {
    const url = new URL(request.url), user = actor(request), mine = url.searchParams.get('mine') === 'true';
    if (mine && !isManager(user) && !isRep(user)) return error('Chỉ Manager có danh sách chương trình quản lý.', 403, 'FORBIDDEN');
    let list = seedProgramChannels.filter((program) => mine ? program.organizer.userId === user?.id : ['Published', 'Closed', 'Expired'].includes(program.status));
    for (const [key, field] of [['type', 'type'], ['mode', 'mode']] as const) { const value = url.searchParams.get(key); if (value && value !== 'all') list = list.filter((program) => program[field] === value); }
    const query = url.searchParams.get('q')?.toLowerCase();
    if (query) list = list.filter((program) => `${program.title} ${program.summary} ${program.organizer.fullName}`.toLowerCase().includes(query));
    return HttpResponse.json({ data: list.map((program) => ({ ...program, onlineLink: undefined, gatheringPoint: undefined, locationOrLink: program.mode === 'Online' ? 'Link được gửi sau khi xác nhận' : program.locationOrLink })) });
  }),
  http.get('/api/v1/programs/:id', ({ request, params }) => {
    const program = seedProgramChannels.find((item) => item.id === params.id), user = actor(request);
    if (!program) return error('Không tìm thấy chương trình.', 404, 'NOT_FOUND');
    const manager = owns(user, program);
    if (!manager && !['Published', 'Closed', 'Expired', 'Cancelled'].includes(program.status)) return error('Bạn không được xem bản nháp chương trình này.', 403, 'FORBIDDEN');
    const registrations = seedProgramRegistrations.filter((reg) => reg.programId === program.id);
    const mine = registrations.find((reg) => reg.studentId === user?.id) || null;
    const participant = mine?.status === 'Confirmed';
    return HttpResponse.json({ data: { ...program, onlineLink: manager || (participant && program.slots?.find(s => s.id === mine?.slotId)?.attendanceMode === 'Online') ? program.onlineLink : undefined, gatheringPoint: manager || participant ? program.gatheringPoint : undefined, locationOrLink: manager || participant || program.mode !== 'Online' ? program.locationOrLink : 'Link được gửi sau khi xác nhận', myRegistration: mine, registrations: manager ? registrations : [], announcements: manager || participant ? seedProgramAnnouncements.filter((ann) => ann.programId === program.id) : [], coParticipants: participant ? registrations.filter((reg) => reg.status === 'Confirmed' && reg.visibleToCoParticipants && reg.studentId !== user?.id).map((reg) => ({ userId: reg.studentId, ...reg.profileSnapshot, email: undefined, positionOrSlot: reg.slotName })) : [] } });
  }),
  http.post('/api/v1/programs', async ({ request }) => {
    const user = actor(request);
    const body = await request.json() as Partial<ProgramChannel>;
    if (!isManager(user) || !canCreate(user, body.type)) return error('Sự kiện CLB chỉ dành cho Club Representative; loại khác dành cho Manager.', 403, 'FORBIDDEN');
    if (body.type === 'Event' && !seedClubs.some(c => c.id === body.clubId && c.representatives?.some(rep => rep.userId === user?.id))) return error('Bạn không đại diện CLB đã chọn.', 403, 'FORBIDDEN');
    if (!['Draft', 'Published'].includes(body.status || 'Draft')) return error('Manager lưu nháp hoặc công bố trực tiếp.');
    const program = makeProgram(user!, body), validation = programValidation(program);
    if (validation) return error(validation);
    seedProgramChannels.unshift(program);
    return HttpResponse.json({ data: program }, { status: 201 });
  }),
  http.put('/api/v1/programs/:id', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as Partial<ProgramChannel>;
    const program = seedProgramChannels.find((item) => item.id === params.id);
    if (!program) return error('Không tìm thấy chương trình.', 404, 'NOT_FOUND');
    if (!owns(user, program) || (body.type && body.type !== program.type) || (body.clubId && body.clubId !== program.clubId)) return error('Không được đổi loại, CLB hoặc quản lý hoạt động ngoài quyền.', 403, 'FORBIDDEN');
    if (body.organizer || body.coOrganizers || body.confirmedCount !== undefined || body.hasRegistrations !== undefined || body.id !== undefined || body.submittedCount !== undefined || body.sourceType !== undefined || body.proposalId !== undefined || body.createdAt !== undefined) return error('Không được thay chủ chương trình hoặc sửa chỉ tiêu đã dùng.');
    if (program.status === 'Cancelled' || (program.status === 'Expired' && body.status !== 'Cancelled')) return error('Chương trình đã kết thúc vòng đời.', 409);
    if (body.status && !['Draft', 'Published', 'Closed', 'Cancelled'].includes(body.status)) return error('Trạng thái chương trình không hợp lệ.');
    if (body.status === 'Draft' && program.status !== 'Draft') return error('Không đưa chương trình đã công bố về bản nháp.', 409);
    if (body.status === 'Cancelled' && !body.cancelReason?.trim()) return error('Vui lòng nhập lý do hủy chương trình.');
    if (program.hasRegistrations && body.mode && body.mode !== program.mode) return error('Đã có đăng ký; không đổi hình thức tổ chức.');
    if (program.hasRegistrations && body.slots?.some(s => s.attendanceMode !== program.slots?.find(old => old.id === s.id)?.attendanceMode)) return error('Không thay hình thức nhóm đã có đăng ký.');
    if (program.hasRegistrations && body.slots && JSON.stringify(body.slots.map((slot) => slot.id)) !== JSON.stringify((program.slots || []).map((slot) => slot.id))) return error('Đã có đăng ký; không đổi danh sách ca.');
    if (program.hasRegistrations && ((body.type && body.type !== program.type) || (body.confirmMode && body.confirmMode !== program.confirmMode) || (body.questions && JSON.stringify(body.questions) !== JSON.stringify(program.questions)))) return error('Đã có đăng ký: không đổi loại, chế độ xác nhận hoặc câu hỏi.');
    const slots = body.slots?.map((slot) => ({ ...slot, confirmedCount: program.slots?.find((old) => old.id === slot.id)?.confirmedCount || 0 }));
    if (slots && program.slots?.some((old) => old.confirmedCount > 0 && !slots.some((slot) => slot.id === old.id))) return error('Không xóa ca đã có người được xác nhận.');
    const next = { ...program, ...body, ...(slots ? { slots } : {}), updatedAt: new Date().toISOString() };
    if (!body.status || ['Draft', 'Published'].includes(next.status)) { const validation = programValidation(next); if (validation) return error(validation); }
    const previousStatus = program.status;
    Object.assign(program, next);
    if (previousStatus !== 'Published' && program.status === 'Published' && program.proposalId) { const proposal = seedProgramProposals.find((item) => item.id === program.proposalId); if (proposal) notify(proposal.studentId, 'Chương trình từ đề xuất của bạn đã công bố', program.title, '/programs/' + program.id); }
    if (body.status === 'Cancelled') seedProgramRegistrations.filter((reg) => reg.programId === program.id && ['Submitted', 'Confirmed'].includes(reg.status)).forEach((reg) => { if (reg.status === 'Confirmed') changeSeats(program, reg, -1); reg.status = 'Cancelled'; reg.updatedAt = next.updatedAt; notify(reg.studentId, 'Chương trình đã bị hủy', program.cancelReason!, `/programs/${program.id}`); });
    return HttpResponse.json({ data: program });
  }),
  http.put('/api/v1/programs/:id/co-organizers/respond', () => error('Mô hình hiện tại chỉ Manager tổ chức chương trình.', 410)),
  http.post('/api/v1/programs/:id/register', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as Pick<ProgramRegistration, 'answers' | 'note' | 'slotId' | 'acknowledgedTerms' | 'visibleToCoParticipants'>;
    if (!user) return error('Vui lòng đăng nhập bằng tài khoản đang hoạt động.', 401, 'UNAUTHORIZED');
    const program = seedProgramChannels.find((item) => item.id === params.id);
    if (!program) return error('Không tìm thấy chương trình.', 404, 'NOT_FOUND');
    if (program.organizer.userId === user.id) return error('Người tổ chức không đăng ký vào chương trình của mình.');
    const existing = seedProgramRegistrations.find((reg) => reg.programId === program.id && reg.studentId === user.id);
    const unavailable = programRegistrationUnavailable(program, existing, body.slotId || '');
    if (unavailable) return error(unavailable, 409);
    if (!body.acknowledgedTerms) return error('Vui lòng xác nhận cam kết và lưu ý an toàn.');
    if (program.questions.some((question) => question.required && !body.answers?.some((answer) => answer.questionId === question.id && (Array.isArray(answer.value) ? answer.value.length > 0 : answer.value.trim().length > 0)))) return error('Vui lòng trả lời đủ câu hỏi bắt buộc.');
    const now = new Date().toISOString(), slot = program.slots?.find((item) => item.id === body.slotId);
    const registration: ProgramRegistration = { id: existing?.id || crypto.randomUUID(), programId: program.id, programTitle: program.title, programType: program.type, programStartAt: program.startAt, programMode: slot?.attendanceMode || program.mode, programLocationOrLink: slot?.attendanceMode === 'Online' ? (program.confirmMode === 'Instant' ? program.onlineLink || '' : '') : program.locationOrLink, organizerName: program.organizer.fullName, studentId: user.id, profileSnapshot: { fullName: user.fullName, studentCode: user.studentCode || '', email: user.email, major: user.major || '', cohort: user.cohort || '', avatarUrl: user.avatarUrl }, slotId: slot?.id, slotName: slot?.name, answers: body.answers || [], note: body.note, acknowledgedTerms: true, visibleToCoParticipants: body.visibleToCoParticipants === true, status: program.confirmMode === 'Instant' ? 'Confirmed' : 'Submitted', submittedAt: now, updatedAt: now };
    if (existing) Object.assign(existing, registration); else seedProgramRegistrations.unshift(registration);
    program.hasRegistrations = true;
    program.submittedCount = (program.submittedCount || 0) + 1;
    if (registration.status === 'Confirmed') changeSeats(program, registration, 1);
    notify(user.id, registration.status === 'Confirmed' ? 'Đã xác nhận tham gia' : 'Đã nhận đăng ký', program.title, `/programs/${program.id}`);
    return HttpResponse.json({ data: registration }, { status: 201 });
  }),
  http.put('/api/v1/programs/registrations/:regId', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as { action?: 'withdraw' | 'toggleVisibility'; status?: 'Confirmed' | 'Rejected'; visibleToCoParticipants?: boolean; feedbackNote?: string };
    const reg = seedProgramRegistrations.find((item) => item.id === params.regId), program = seedProgramChannels.find((item) => item.id === reg?.programId);
    if (!reg || !program) return error('Không tìm thấy đăng ký.', 404, 'NOT_FOUND');
    if (body.action) {
      if (reg.studentId !== user?.id) return error('Bạn không sở hữu đăng ký này.', 403, 'FORBIDDEN');
      if (body.action === 'withdraw') {
        if (!['Submitted', 'Confirmed'].includes(reg.status)) return error('Đăng ký này không thể rút.', 409);
        if (Date.parse(program.startAt) <= Date.now()) return error('Chương trình đã bắt đầu và không thể rút đăng ký.', 409);
        if (reg.status === 'Confirmed') changeSeats(program, reg, -1);
        reg.status = 'Withdrawn'; reg.visibleToCoParticipants = false;
      } else if (body.action === 'toggleVisibility') {
        if (reg.status !== 'Confirmed') return error('Chỉ người đã xác nhận được xuất hiện trong danh sách.');
        reg.visibleToCoParticipants = body.visibleToCoParticipants === true;
      } else return error('Thao tác không hợp lệ.');
    } else {
      if (!owns(user, program)) return error('Chỉ Manager phụ trách được duyệt đăng ký.', 403, 'FORBIDDEN');
      if (reg.status !== 'Submitted' || !['Confirmed', 'Rejected'].includes(body.status || '')) return error('Đăng ký không còn chờ duyệt hoặc chuyển trạng thái sai.', 409);
      if (!['Published', 'Closed'].includes(program.status) || Date.parse(program.startAt) <= Date.now()) return error('Chương trình không còn nhận kết quả duyệt.', 409);
      if (body.status === 'Rejected' && !body.feedbackNote?.trim()) return error('Vui lòng nhập lý do từ chối.');
      const slot = slotFor(program, reg);
      if (body.status === 'Confirmed' && ((!programUnlimited(program) && program.confirmedCount >= program.quota) || (slot && !slot.unlimited && slot.confirmedCount >= slot.quota))) return error('Chương trình hoặc ca đã hết chỗ.', 409);
      reg.status = body.status!; reg.feedbackNote = body.feedbackNote?.trim();
      if (reg.status === 'Confirmed') changeSeats(program, reg, 1);
      notify(reg.studentId, reg.status === 'Confirmed' ? 'Đăng ký đã được xác nhận' : 'Đăng ký đã bị từ chối', `${program.title}${reg.feedbackNote ? `: ${reg.feedbackNote}` : ''}`, `/programs/${program.id}`);
    }
    reg.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: reg });
  }),
  http.post('/api/v1/programs/:id/announcements', async ({ request, params }) => {
    const user = actor(request), body = await request.json() as { title: string; body: string };
    const program = seedProgramChannels.find((item) => item.id === params.id);
    if (!program) return error('Không tìm thấy chương trình.', 404, 'NOT_FOUND');
    if (!owns(user, program)) return error('Chỉ Manager phụ trách được gửi thông báo.', 403, 'FORBIDDEN');
    if (!['Published', 'Closed', 'Expired'].includes(program.status)) return error('Chưa công bố hoặc đã hủy chương trình.');
    if (!body.title?.trim() || !body.body?.trim()) return error('Nhập tiêu đề và nội dung thông báo.');
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (seedProgramAnnouncements.filter((ann) => ann.programId === program.id && new Date(ann.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) === day).length >= 5) return error('Tối đa 5 thông báo mỗi chương trình trong ngày.', 429);
    const recipients = [...new Set(seedProgramRegistrations.filter((reg) => reg.programId === program.id && reg.status === 'Confirmed').map((reg) => reg.studentId))];
    const announcement: ProgramAnnouncement = { id: crypto.randomUUID(), programId: program.id, authorId: user!.id, authorName: user!.fullName, title: body.title.trim(), body: body.body.trim(), createdAt: new Date().toISOString(), recipientCount: recipients.length };
    seedProgramAnnouncements.unshift(announcement);
    recipients.forEach((userId) => notify(userId, announcement.title, announcement.body, `/programs/${program.id}?tab=announcements`));
    return HttpResponse.json({ data: announcement }, { status: 201 });
  }),
];
