import { http, HttpResponse } from 'msw';
import { seedUsers } from '../data/users';
import { seedKnowledgePosts, seedReports } from '../data/knowledge';
import { seedClubs, seedClubRepresentativeRequests } from '../data/clubs';
import { seedProgramChannels } from '../data/programs';
import { seedCourseOfferings } from '../data/courseOfferings';
import { seedAuditLogs, seedSystemSettings, seedTags } from '../data/admin';
import { seedSchoolAffiliations } from '../data/schoolAffiliations';
import { mockDelay, isScenarioActive } from '../utils';
import type { SystemSettings } from '@/types/entities';
import { UNIVERSITIES } from '@/features/profile/profileConstants';

const systemAdminFrom = (request: Request) => {
  const id = request.headers.get('authorization')?.replace(/^Bearer mock_jwt_token_/, '');
  return seedUsers.find((user) => user.id === id && user.roles.includes('admin'));
};

export const adminHandlers = [
  // A1 Dashboard
  http.get('/api/v1/admin/dashboard', async () => {
    await mockDelay();
    return HttpResponse.json({
      data: {
        metrics: {
          newUsers7d: seedUsers.length,
          pendingPosts: seedKnowledgePosts.filter(
            (p) => p.status === 'PendingReview' || p.status === 'TemporarilyHidden'
          ).length,
          openReports: seedReports.filter((r) => r.status === 'Open').length,
          pendingClubs: seedClubRepresentativeRequests.filter((r) => r.status === 'Pending').length,
          pendingRepRequests: seedClubRepresentativeRequests.filter((r) => r.status === 'Pending')
            .length,
          pendingPrograms: seedProgramChannels.filter((p) => p.status === 'PendingReview').length,
        },
        moduleActivity: [
          { module: 'Đời sống sinh viên', count: 89 },
          { module: 'Câu lạc bộ (FE-04)', count: 64 },
          { module: 'Tình nguyện & Workshop (FE-06)', count: 48 },
          { module: 'Mentoring (FE-05)', count: 56 },
          { module: 'Nhóm học tập (FE-02)', count: 77 },
        ],
      },
    });
  }),

  // A2 Users
  http.get('/api/v1/admin/users', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const school = url.searchParams.get('school');
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');
    const q = url.searchParams.get('q');

    let list = [...seedUsers];
    if (school) list = list.filter((u) => u.school === school);
    if (status) list = list.filter((u) => u.status === status);
    if (role) list = list.filter((u) => u.roles.includes(role as any));
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          (u.studentCode && u.studentCode.toLowerCase().includes(lower))
      );
    }

    const safeList = list.map(({ password: _, ...u }) => u);
    return HttpResponse.json({ data: safeList });
  }),

  http.get('/api/v1/admin/users/:id', async ({ params }) => {
    await mockDelay();
    const user = seedUsers.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại' } },
        { status: 404 }
      );
    }
    const { password: _, ...safeUser } = user;
    const userReports = seedReports.filter((r) => r.reporterId === params.id);
    const auditLogs = seedAuditLogs.filter((l) => l.targetId === params.id);

    return HttpResponse.json({ data: { user: safeUser, reports: userReports, auditLogs } });
  }),

  http.put('/api/v1/admin/users/:id', async ({ params, request }) => {
    await mockDelay();
    if (isScenarioActive('forbidden')) {
      return HttpResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Thao tác ngoài phạm vi trường của bạn' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as {
      action: 'lock' | 'unlock' | 'restrict';
      reason: string;
    };
    const user = seedUsers.find((u) => u.id === params.id);
    if (user) {
      if (body.action === 'lock') user.status = 'locked';
      if (body.action === 'unlock') user.status = 'active';

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: `${
          body.action === 'lock' ? 'Khóa' : body.action === 'unlock' ? 'Mở khóa' : 'Hạn chế'
        } tài khoản`,
        targetType: 'User',
        targetId: user.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    const { password: _, ...safeUser } = user || ({} as any);
    return HttpResponse.json({ data: safeUser });
  }),

  // A3 Moderation (Posts & Grouped Reports across 7 TargetTypes)
  http.get('/api/v1/admin/moderation/posts', async () => {
    await mockDelay();
    const pending = seedKnowledgePosts.filter(
      (p) => p.status === 'PendingReview' || p.status === 'TemporarilyHidden'
    );
    return HttpResponse.json({ data: pending });
  }),

  http.put('/api/v1/admin/moderation/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      status: 'Published' | 'Rejected';
      reason?: string;
    };
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) {
      post.status = body.status;
      if (body.reason) post.rejectReason = body.reason;

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: body.status === 'Published' ? 'Duyệt / Khôi phục bài viết' : 'Từ chối / Gỡ bài viết',
        targetType: 'KnowledgePost',
        targetId: post.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: post });
  }),

  http.get('/api/v1/admin/moderation/reports', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const targetType = url.searchParams.get('targetType');
    const status = url.searchParams.get('status') || 'Open';

    let list = [...seedReports];
    if (status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    if (targetType && targetType !== 'all') {
      list = list.filter((r) => (r.targetType || 'post') === targetType);
    }

    // Sort autoHidden (TemporarilyHidden) to top
    list.sort((a, b) => Number(Boolean(b.autoHidden)) - Number(Boolean(a.autoHidden)));
    return HttpResponse.json({ data: list });
  }),

  http.put('/api/v1/admin/moderation/reports/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      action: 'dismiss' | 'remove_content' | 'restrict_user';
      reason?: string;
    };
    const report = seedReports.find((r) => r.id === params.id);
    if (report) {
      report.status = body.action === 'dismiss' ? 'Rejected' : 'Resolved';
      report.resolvedAt = new Date().toISOString();
      report.resolvedBy = 'Vũ Quốc Em';
      report.resolution =
        body.action === 'dismiss'
          ? 'Dismissed'
          : body.action === 'remove_content'
          ? 'ContentRemoved'
          : 'UserRestricted';
      report.resolutionNote = body.reason;

      if (body.action === 'remove_content' && (report.postId || report.targetId)) {
        const post = seedKnowledgePosts.find(
          (p) => p.id === report.postId || p.id === report.targetId
        );
        if (post) post.status = 'Hidden';
      }

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: `Xử lý báo cáo vi phạm (${body.action})`,
        targetType: 'ViolationReport',
        targetId: report.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: report });
  }),

  // A4 Club Representative Verification & Clubs Directory
  http.get('/api/v1/admin/club-rep-requests', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let list = [...seedClubRepresentativeRequests];
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    return HttpResponse.json({ data: list });
  }),

  http.put('/api/v1/admin/club-rep-requests/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      status: 'Verified' | 'Rejected';
      reason?: string;
    };
    const reqItem = seedClubRepresentativeRequests.find((r) => r.id === params.id);
    if (reqItem) {
      reqItem.status = body.status;
      reqItem.rejectionReason = body.reason;
      reqItem.reviewedAt = new Date().toISOString();
      reqItem.reviewedBy = 'Vũ Quốc Em';

      if (body.status === 'Verified') {
        if (reqItem.clubId) {
          const targetClub = seedClubs.find((c) => c.id === reqItem.clubId);
          if (targetClub) {
            targetClub.representatives = targetClub.representatives || [];
            if (!targetClub.representatives.some((r) => r.userId === reqItem.userId)) {
              targetClub.representatives.push({
                userId: reqItem.userId,
                fullName: reqItem.userName,
                studentCode: reqItem.studentCode,
                roleNote: reqItem.roleNote,
                verifiedAt: new Date().toISOString(),
              });
            }
          }
        } else if (reqItem.proposedClub) {
          seedClubs.unshift({
            id: `club_${Date.now()}`,
            code: reqItem.proposedClub.code,
            name: reqItem.proposedClub.name,
            category: reqItem.proposedClub.category,
            field: reqItem.proposedClub.category,
            tagline: reqItem.proposedClub.tagline,
            description: reqItem.proposedClub.description,
            contactEmail: reqItem.proposedClub.contactEmail,
            foundedYear: 2026,
            representatives: [
              {
                userId: reqItem.userId,
                fullName: reqItem.userName,
                studentCode: reqItem.studentCode,
                roleNote: reqItem.roleNote,
                verifiedAt: new Date().toISOString(),
              },
            ],
            openOpportunitiesCount: 0,
            status: 'Active',
            approvalStatus: 'Approved',
            createdAt: new Date().toISOString(),
          });
        }
      }

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action:
          body.status === 'Verified'
            ? `Xác minh quyền đại diện CLB (${reqItem.clubName})`
            : `Từ chối yêu cầu đại diện CLB (${reqItem.clubName})`,
        targetType: 'ClubRepresentativeRequest',
        targetId: reqItem.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: reqItem });
  }),

  http.get('/api/v1/admin/clubs', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedClubs });
  }),

  http.put('/api/v1/admin/clubs/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      status?: 'Active' | 'Hidden';
      revokeUserId?: string;
      grantRepresentative?: {
        userId: string;
        fullName: string;
        studentCode: string;
        roleNote: string;
      };
      reason?: string;
    };
    const club = seedClubs.find((c) => c.id === params.id);
    if (club) {
      if (body.status) {
        club.status = body.status;
      }
      if (body.revokeUserId && club.representatives) {
        club.representatives = club.representatives.filter(
          (r) => r.userId !== body.revokeUserId
        );
      }
      if (body.grantRepresentative) {
        club.representatives = club.representatives || [];
        club.representatives.push({
          ...body.grantRepresentative,
          verifiedAt: new Date().toISOString(),
        });
      }

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: `Cập nhật CLB / Quyền đại diện (${club.name})`,
        targetType: 'Club',
        targetId: club.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: club });
  }),

  // A10 Community Program Channel Approval
  http.get('/api/v1/admin/programs', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let list = [...seedProgramChannels];
    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    }
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/admin/programs/:id', async ({ params }) => {
    await mockDelay();
    const prog = seedProgramChannels.find((p) => p.id === params.id);
    if (!prog) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy kênh chương trình' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: prog });
  }),

  http.put('/api/v1/admin/programs/:id/review', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as {
      status: 'Published' | 'Rejected' | 'Cancelled';
      reason?: string;
    };
    const prog = seedProgramChannels.find((p) => p.id === params.id);
    if (prog) {
      prog.status = body.status;
      if (body.status === 'Rejected') prog.rejectionReason = body.reason;
      if (body.status === 'Cancelled') prog.cancelReason = body.reason;
      prog.updatedAt = new Date().toISOString();

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action:
          body.status === 'Published'
            ? `Phê duyệt kênh chương trình "${prog.title}"`
            : body.status === 'Rejected'
            ? `Yêu cầu chỉnh sửa kênh "${prog.title}"`
            : `Gỡ / Hủy kênh "${prog.title}"`,
        targetType: 'ProgramChannel',
        targetId: prog.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: prog });
  }),

  // A5 Master data
  http.get('/api/v1/admin/master-data/course-offerings', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedCourseOfferings });
  }),

  http.put('/api/v1/admin/master-data/course-offerings', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as any;
    seedCourseOfferings.splice(0, seedCourseOfferings.length, ...(Array.isArray(body) ? body : body.data || []));
    return HttpResponse.json({ data: body });
  }),

  http.get('/api/v1/admin/master-data/tags', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedTags });
  }),

  http.put('/api/v1/admin/master-data/tags', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as { tags?: string[] };
    if (Array.isArray(body.tags)) {
      seedTags.splice(0, seedTags.length, ...body.tags);
    }
    return HttpResponse.json({ data: seedTags });
  }),

  // A6 Settings
  http.get('/api/v1/admin/settings', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedSystemSettings });
  }),

  http.put('/api/v1/admin/settings', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<SystemSettings>;
    Object.assign(seedSystemSettings, body);
    return HttpResponse.json({ data: seedSystemSettings });
  }),

  // A7 Admins
  http.get('/api/v1/admin/admins', async ({ request }) => {
    await mockDelay();
    if (!systemAdminFrom(request)) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ System Admin được phân quyền.' } }, { status: 403 });
    const admins = seedUsers.filter(
      (u) => u.roles.includes('admin') || u.roles.includes('manager') || u.roles.includes('school_admin')
    );
    const safe = admins.map(({ password: _, ...u }) => u);
    return HttpResponse.json({ data: safe });
  }),

  // School Affiliations (UC-64 Review Student School Affiliation)
  http.get('/api/v1/admin/school-affiliations', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedSchoolAffiliations });
  }),

  http.put('/api/v1/admin/school-affiliations/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { status: string; reason?: string; reviewedBy?: string };
    const item = seedSchoolAffiliations.find((a) => a.id === params.id);
    if (!item) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Hồ sơ không tồn tại' } }, { status: 404 });
    }
    item.status = body.status as any;
    item.reviewedAt = new Date().toISOString();
    if (body.reason) item.reason = body.reason;
    if (body.reviewedBy) item.reviewedBy = body.reviewedBy;
    return HttpResponse.json({ data: item });
  }),

  http.post('/api/v1/admin/admins', async ({ request }) => {
    await mockDelay();
    const admin = systemAdminFrom(request);
    if (!admin) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ System Admin được phân quyền.' } }, { status: 403 });
    const body = (await request.json()) as {
      userId: string;
      role: 'manager' | 'school_admin';
      school?: string;
      adminPermissions?: string[];
      assignedSchool?: string;
      reason?: string;
    };
    const user = seedUsers.find((u) => u.id === body.userId);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản.' } }, { status: 404 });
    if (!body.reason?.trim()) return HttpResponse.json({ error: { code: 'REASON_REQUIRED', message: 'Cần nêu lý do cấp quyền.' } }, { status: 400 });
    if (body.role === 'school_admin' && !UNIVERSITIES.includes(body.assignedSchool || '')) return HttpResponse.json({ error: { code: 'INVALID_SCOPE', message: 'Cần chọn một trường hợp lệ.' } }, { status: 400 });
    if (user && !user.roles.includes(body.role)) {
      user.roles.push(body.role);
    }
    if (user && body.role === 'manager') user.adminPermissions = body.adminPermissions || [];
    if (user && body.role === 'school_admin') {
      if (body.school) user.school = body.school;
      user.adminPermissions = ['dashboard', 'school_affiliations'];
    }
    if (body.role === 'school_admin') user.assignedSchool = body.assignedSchool;
    seedAuditLogs.unshift({ id: `log_role_${Date.now()}`, actorId: admin.id, action: `Cấp quyền ${body.role}`, targetType: 'User', targetId: user.id, reason: body.reason.trim(), createdAt: new Date().toISOString() });
    const { password: _, ...safeUser } = user || ({} as any);
    return HttpResponse.json({ data: safeUser });
  }),

  http.put('/api/v1/admin/admins/:id/permissions', async ({ params, request }) => {
    await mockDelay();
    if (!systemAdminFrom(request)) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ System Admin được phân quyền.' } }, { status: 403 });
    const body = (await request.json()) as { adminPermissions?: string[] };
    const user = seedUsers.find((u) => u.id === params.id);
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy quản trị viên' } }, { status: 404 });
    user.adminPermissions = body.adminPermissions || [];
    const { password: _, ...safeUser } = user;
    return HttpResponse.json({ data: safeUser });
  }),

  http.put('/api/v1/admin/admins/:id/scope', async ({ params, request }) => {
    await mockDelay();
    const admin = systemAdminFrom(request);
    if (!admin) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ System Admin được phân quyền.' } }, { status: 403 });
    const body = await request.json() as { assignedSchool?: string; reason?: string };
    const user = seedUsers.find((item) => item.id === params.id && item.roles.includes('school_admin'));
    if (!user) return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy School Admin.' } }, { status: 404 });
    if (!UNIVERSITIES.includes(body.assignedSchool || '')) return HttpResponse.json({ error: { code: 'INVALID_SCOPE', message: 'Cần chọn một trường hợp lệ.' } }, { status: 400 });
    if (!body.reason?.trim()) return HttpResponse.json({ error: { code: 'REASON_REQUIRED', message: 'Cần nêu lý do đổi phạm vi.' } }, { status: 400 });
    user.assignedSchool = body.assignedSchool;
    seedAuditLogs.unshift({ id: `log_scope_${Date.now()}`, actorId: admin.id, action: 'Đổi phạm vi School Admin', targetType: 'User', targetId: user.id, reason: body.reason.trim(), createdAt: new Date().toISOString() });
    const { password: _, ...safeUser } = user;
    return HttpResponse.json({ data: safeUser });
  }),

  http.delete('/api/v1/admin/admins/:id', async ({ params, request }) => {
    await mockDelay();
    const admin = systemAdminFrom(request);
    if (!admin) return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ System Admin được phân quyền.' } }, { status: 403 });
    const body = await request.json().catch(() => ({})) as { reason?: string };
    if (!body.reason?.trim()) return HttpResponse.json({ error: { code: 'REASON_REQUIRED', message: 'Cần nêu lý do thu hồi quyền.' } }, { status: 400 });
    const targetUser = seedUsers.find((u) => u.id === params.id);

    if (targetUser?.roles.includes('admin') || isScenarioActive('admin_protected')) {
      return HttpResponse.json(
        {
          error: {
            code: 'ADMIN_PROTECTED',
            message: 'Admin duy nhất của hệ thống không thể bị thu hồi quyền.',
          },
        },
        { status: 409 }
      );
    }

    if (targetUser) {
      const revokedRole = targetUser.roles.includes('school_admin') ? 'school_admin' : 'manager';
      targetUser.roles = targetUser.roles.filter((r) => r !== revokedRole);
      if (revokedRole === 'school_admin') targetUser.assignedSchool = undefined;
      seedAuditLogs.unshift({ id: `log_revoke_${Date.now()}`, actorId: admin.id, action: `Thu hồi quyền ${revokedRole}`, targetType: 'User', targetId: targetUser.id, reason: body.reason.trim(), createdAt: new Date().toISOString() });
    }

    return HttpResponse.json({ data: { success: true } });
  }),

  // A8 Audit Logs
  http.get('/api/v1/admin/audit-logs', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedAuditLogs });
  }),
];
