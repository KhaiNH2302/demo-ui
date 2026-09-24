import { http, HttpResponse } from 'msw';
import { seedUsers } from '../data/users';
import { seedKnowledgePosts, seedReports } from '../data/knowledge';
import { seedClubs } from '../data/clubs';
import { seedCourseOfferings } from '../data/courseOfferings';
import { seedAuditLogs, seedSystemSettings, seedTags } from '../data/admin';
import { mockDelay, isScenarioActive } from '../utils';
import type { AuditLog, SystemSettings } from '@/types/entities';

export const adminHandlers = [
  http.get('/api/v1/admin/dashboard', async () => {
    await mockDelay();
    return HttpResponse.json({
      data: {
        metrics: {
          newUsers7d: seedUsers.length,
          pendingPosts: seedKnowledgePosts.filter((p) => p.status === 'PendingReview').length,
          openReports: seedReports.filter((r) => r.status === 'Open').length,
          pendingClubs: seedClubs.filter((c) => c.approvalStatus === 'PendingApproval').length,
        },
        moduleActivity: [
          { module: 'Class Swap', count: 42 },
          { module: 'Knowledge', count: 89 },
          { module: 'Group Finding', count: 35 },
          { module: 'Clubs', count: 124 },
          { module: 'Mentoring', count: 56 },
        ],
      },
    });
  }),

  // Users
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
      list = list.filter((u) => u.fullName.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower));
    }

    const safeList = list.map(({ password: _, ...u }) => u);
    return HttpResponse.json({ data: safeList });
  }),

  http.get('/api/v1/admin/users/:id', async ({ params }) => {
    await mockDelay();
    const user = seedUsers.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại' } }, { status: 404 });
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
    const body = (await request.json()) as { action: 'lock' | 'unlock' | 'restrict'; reason: string };
    const user = seedUsers.find((u) => u.id === params.id);
    if (user) {
      if (body.action === 'lock') user.status = 'locked';
      if (body.action === 'unlock') user.status = 'active';

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: `${body.action === 'lock' ? 'Khóa' : body.action === 'unlock' ? 'Mở khóa' : 'Hạn chế'} tài khoản`,
        targetType: 'User',
        targetId: user.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    const { password: _, ...safeUser } = user || ({} as any);
    return HttpResponse.json({ data: safeUser });
  }),

  // Moderation
  http.get('/api/v1/admin/moderation/posts', async () => {
    await mockDelay();
    const pending = seedKnowledgePosts.filter((p) => p.status === 'PendingReview');
    return HttpResponse.json({ data: pending });
  }),

  http.put('/api/v1/admin/moderation/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { status: 'Published' | 'Rejected'; reason?: string };
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) {
      post.status = body.status;
      if (body.reason) post.rejectReason = body.reason;

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: body.status === 'Published' ? 'Duyệt bài viết' : 'Từ chối bài viết',
        targetType: 'KnowledgePost',
        targetId: post.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: post });
  }),

  http.get('/api/v1/admin/moderation/reports', async () => {
    await mockDelay();
    const openReports = seedReports.filter((r) => r.status === 'Open');
    return HttpResponse.json({ data: openReports });
  }),

  http.put('/api/v1/admin/moderation/reports/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { action: 'dismiss' | 'remove_content' | 'restrict_user'; reason?: string };
    const report = seedReports.find((r) => r.id === params.id);
    if (report) {
      report.status = 'Resolved';
      if (body.action === 'remove_content') {
        const post = seedKnowledgePosts.find((p) => p.id === report.postId);
        if (post) post.status = 'Closed';
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

  // Clubs Approval
  http.get('/api/v1/admin/clubs', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let list = [...seedClubs];
    if (status) list = list.filter((c) => c.approvalStatus === status);
    return HttpResponse.json({ data: list });
  }),

  http.put('/api/v1/admin/clubs/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { approvalStatus: 'Approved' | 'Rejected'; managerId?: string; reason?: string };
    const club = seedClubs.find((c) => c.id === params.id);
    if (club) {
      club.approvalStatus = body.approvalStatus;
      if (body.managerId) club.managerId = body.managerId;

      seedAuditLogs.unshift({
        id: `log_${Date.now()}`,
        actorId: 'usr_admin_05',
        action: `${body.approvalStatus === 'Approved' ? 'Phê duyệt' : 'Từ chối'} thành lập CLB`,
        targetType: 'Club',
        targetId: club.id,
        reason: body.reason,
        createdAt: new Date().toISOString(),
      });
    }
    return HttpResponse.json({ data: club });
  }),

  // Master data
  http.get('/api/v1/admin/master-data/course-offerings', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedCourseOfferings });
  }),

  http.put('/api/v1/admin/master-data/course-offerings', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as any;
    return HttpResponse.json({ data: body });
  }),

  http.get('/api/v1/admin/master-data/tags', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedTags });
  }),

  // Settings
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

  // Admins
  http.get('/api/v1/admin/admins', async () => {
    await mockDelay();
    const admins = seedUsers.filter((u) => u.roles.includes('system_admin') || u.roles.includes('school_admin'));
    const safe = admins.map(({ password: _, ...u }) => u);
    return HttpResponse.json({ data: safe });
  }),

  http.post('/api/v1/admin/admins', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as { userId: string; role: 'system_admin' | 'school_admin' };
    const user = seedUsers.find((u) => u.id === body.userId);
    if (user && !user.roles.includes(body.role)) {
      user.roles.push(body.role);
    }
    const { password: _, ...safeUser } = user || ({} as any);
    return HttpResponse.json({ data: safeUser });
  }),

  http.delete('/api/v1/admin/admins/:id', async ({ params }) => {
    await mockDelay();
    const systemAdmins = seedUsers.filter((u) => u.roles.includes('system_admin'));
    const targetUser = seedUsers.find((u) => u.id === params.id);

    if (
      isScenarioActive('last_system_admin') ||
      (targetUser?.roles.includes('system_admin') && systemAdmins.length <= 1)
    ) {
      return HttpResponse.json(
        { error: { code: 'LAST_SYSTEM_ADMIN', message: 'Không thể thu hồi quyền của Quản trị viên Hệ thống cuối cùng!' } },
        { status: 409 }
      );
    }

    if (targetUser) {
      targetUser.roles = targetUser.roles.filter((r) => r !== 'system_admin' && r !== 'school_admin');
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  // Audit logs
  http.get('/api/v1/admin/audit-logs', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedAuditLogs });
  }),
];
