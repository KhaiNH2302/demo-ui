import { http, HttpResponse } from 'msw';
import { seedUsers } from '../data/users';
import { seedSchoolAffiliations } from '../data/schoolAffiliationsLocal';
import { seedAuditLogs } from '../data/admin';
import { seedNotifications } from '../data/notifications';
import { mockDelay } from '../utils';
import type { SchoolAffiliationStatus } from '@/types/schoolAffiliation';

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

function actor(request: Request) {
  const id = request.headers.get('authorization')?.replace(/^Bearer mock_jwt_token_/, '');
  return seedUsers.find((user) => user.id === id && user.status === 'active');
}

export const schoolAffiliationHandlers = [
  http.get('/api/v1/school-affiliations/mine', async ({ request }) => {
    await mockDelay();
    const user = actor(request);
    if (!user?.roles.includes('student')) return error(403, 'FORBIDDEN', 'Chỉ Student được gửi xác minh trường.');
    return HttpResponse.json({ data: seedSchoolAffiliations.filter((item) => item.studentId === user.id) });
  }),

  http.post('/api/v1/school-affiliations', async ({ request }) => {
    await mockDelay();
    const user = actor(request);
    if (!user?.roles.includes('student')) return error(403, 'FORBIDDEN', 'Chỉ Student được gửi xác minh trường.');
    if (!user.school || !user.studentCode) return error(400, 'MISSING_EDUCATION', 'Cần khai báo trường và mã sinh viên trước.');
    const body = await request.json() as { schoolEmail?: string; evidenceName?: string; evidenceNote?: string };
    if (!body.schoolEmail?.trim() || !body.evidenceName?.trim()) return error(400, 'INVALID_EVIDENCE', 'Cần email trường và minh chứng.');
    const existing = seedSchoolAffiliations.find((item) => item.studentId === user.id && ['Pending', 'NeedsMoreInfo', 'Verified'].includes(item.status));
    if (existing?.status === 'Pending') return error(409, 'DUPLICATE_PENDING', 'Yêu cầu đang chờ duyệt.');
    if (existing?.status === 'Verified') return error(409, 'ALREADY_VERIFIED', 'Trường của bạn đã được xác minh.');
    const now = new Date().toISOString();
    const entry = existing?.status === 'NeedsMoreInfo' ? existing : {
      id: `aff_${Date.now()}`, studentId: user.id, studentName: user.fullName,
      school: user.school, studentCode: user.studentCode, status: 'Pending' as const,
      submittedAt: now, schoolEmail: '', evidenceName: '', evidenceNote: '',
    };
    Object.assign(entry, {
      school: user.school, studentCode: user.studentCode, schoolEmail: body.schoolEmail.trim(),
      evidenceName: body.evidenceName.trim(), evidenceNote: body.evidenceNote?.trim() || '',
      status: 'Pending', submittedAt: now, reviewedAt: undefined, reviewerId: undefined, reason: undefined,
    });
    if (!existing) seedSchoolAffiliations.unshift(entry);
    seedUsers.filter((candidate) => candidate.roles.includes('school_admin') && candidate.assignedSchool === entry.school).forEach((candidate) => {
      seedNotifications.unshift({ id: `notif_aff_${Date.now()}_${candidate.id}`, userId: candidate.id, source: 'SchoolAffiliation', title: 'Có hồ sơ xác minh trường mới', body: `${entry.studentName} đã gửi minh chứng để xác minh.`, linkTo: '/admin/school-affiliations', read: false, createdAt: now });
    });
    return HttpResponse.json({ data: entry });
  }),

  http.get('/api/v1/admin/school-affiliations', async ({ request }) => {
    await mockDelay();
    const user = actor(request);
    if (!user?.roles.includes('school_admin') || !user.assignedSchool) return error(403, 'FORBIDDEN', 'Chỉ School Admin được xem hàng đợi.');
    return HttpResponse.json({ data: seedSchoolAffiliations.filter((item) => item.school === user.assignedSchool) });
  }),

  http.post('/api/v1/admin/school-affiliations/:id/decision', async ({ request, params }) => {
    await mockDelay();
    const user = actor(request);
    if (!user?.roles.includes('school_admin') || !user.assignedSchool) return error(403, 'FORBIDDEN', 'Chỉ School Admin được xử lý xác minh.');
    const entry = seedSchoolAffiliations.find((item) => item.id === params.id);
    if (!entry || entry.school !== user.assignedSchool) return error(403, 'OUT_OF_SCOPE', 'Yêu cầu không thuộc trường được phân công.');
    const body = await request.json() as { decision?: SchoolAffiliationStatus; reason?: string };
    if (!body.decision || !['Verified', 'NeedsMoreInfo', 'Rejected', 'Revoked'].includes(body.decision)) return error(400, 'INVALID_DECISION', 'Quyết định không hợp lệ.');
    if (body.decision === 'Revoked' ? entry.status !== 'Verified' : entry.status !== 'Pending') return error(409, 'ALREADY_PROCESSED', 'Trạng thái yêu cầu đã thay đổi.');
    if (body.decision !== 'Verified' && !body.reason?.trim()) return error(400, 'REASON_REQUIRED', 'Cần nhập lý do.');
    entry.status = body.decision;
    entry.reason = body.reason?.trim();
    entry.reviewerId = user.id;
    entry.reviewedAt = new Date().toISOString();
    seedAuditLogs.unshift({
      id: `log_aff_${Date.now()}`, actorId: user.id, action: `Xác minh trường: ${body.decision}`,
      targetType: 'SchoolAffiliation', targetId: entry.id, reason: entry.reason || 'Minh chứng hợp lệ',
      createdAt: entry.reviewedAt,
    });
    seedNotifications.unshift({ id: `notif_aff_decision_${Date.now()}`, userId: entry.studentId, source: 'SchoolAffiliation', title: `Xác minh trường: ${entry.status}`, body: entry.reason || 'School Admin đã phê duyệt minh chứng của bạn.', linkTo: '/profile/school-verification', read: false, createdAt: entry.reviewedAt });
    return HttpResponse.json({ data: entry });
  }),
];
