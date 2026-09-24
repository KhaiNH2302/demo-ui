import { http, HttpResponse } from 'msw';
import {
  seedClubs,
  seedClubMemberships,
  seedRecruitments,
  seedApplications,
  seedClubEvents,
  seedEventRegistrations,
  seedEventTasks,
  seedTransactions,
  seedExpenses,
  seedReconciliations,
} from '../data/clubs';
import { mockDelay, isScenarioActive } from '../utils';
import type { Club, ClubApplication, ClubEvent, EventTask, Transaction, ExpenseRequest, Reconciliation, Recruitment } from '@/types/entities';

export const clubHandlers = [
  // Discovery
  http.get('/api/v1/clubs', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const field = url.searchParams.get('field');
    const q = url.searchParams.get('q');

    let list = seedClubs.filter((c) => c.approvalStatus === 'Approved');
    if (field) list = list.filter((c) => c.field === field);
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/clubs/:id', async ({ params }) => {
    await mockDelay();
    const club = seedClubs.find((c) => c.id === params.id);
    if (!club) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'CLB không tồn tại' } }, { status: 404 });
    }
    return HttpResponse.json({ data: club });
  }),

  http.post('/api/v1/clubs', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Omit<Club, 'id' | 'managerId' | 'approvalStatus' | 'createdAt'>;

    const newClub: Club = {
      id: `club_${Date.now()}`,
      name: body.name,
      description: body.description,
      field: body.field,
      managerId: userId,
      approvalStatus: 'PendingApproval',
      createdAt: new Date().toISOString(),
    };
    seedClubs.push(newClub);
    return HttpResponse.json({ data: newClub });
  }),

  // Applications
  http.post('/api/v1/clubs/:id/applications', async ({ params, request }) => {
    await mockDelay();
    if (isScenarioActive('recruitment_closed')) {
      return HttpResponse.json(
        { error: { code: 'RECRUITMENT_CLOSED', message: 'Đợt tuyển thành viên đã kết thúc hạn nhận đơn' } },
        { status: 409 }
      );
    }
    if (isScenarioActive('recruitment_quota_full')) {
      return HttpResponse.json(
        { error: { code: 'QUOTA_FULL', message: 'Đợt tuyển đã đủ chỉ tiêu tiếp nhận' } },
        { status: 409 }
      );
    }

    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { recruitmentId: string; answers: Record<string, string> };

    const newApp: ClubApplication = {
      id: `app_${Date.now()}`,
      recruitmentId: body.recruitmentId,
      clubId: params.id as string,
      applicantId: userId,
      answers: body.answers,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    seedApplications.unshift(newApp);
    return HttpResponse.json({ data: newApp });
  }),

  http.get('/api/v1/applications/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const myApps = seedApplications.filter((a) => a.applicantId === userId);
    return HttpResponse.json({ data: myApps });
  }),

  http.put('/api/v1/applications/:id/supplement', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { answers: Record<string, string> };
    const app = seedApplications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Đơn không tồn tại' } }, { status: 404 });
    }
    app.answers = body.answers;
    app.status = 'Submitted';
    delete app.supplementNote;
    return HttpResponse.json({ data: app });
  }),

  // Workspace
  http.get('/api/v1/clubs/:id/dashboard-summary', async ({ params }) => {
    await mockDelay();
    const clubId = params.id as string;
    const eventsCount = seedClubEvents.filter((e) => e.clubId === clubId && e.status !== 'Finished').length;
    const tasksCount = seedEventTasks.length;
    const pendingApps = seedApplications.filter((a) => a.clubId === clubId && a.status === 'Submitted').length;
    const pendingExpenses = seedExpenses.filter((e) => e.clubId === clubId && e.status === 'PendingApproval').length;
    return HttpResponse.json({
      data: {
        eventsCount,
        tasksCount,
        pendingApps,
        pendingExpenses,
      },
    });
  }),

  http.get('/api/v1/clubs/:id/events', async ({ params }) => {
    await mockDelay();
    const events = seedClubEvents.filter((e) => e.clubId === params.id);
    return HttpResponse.json({ data: events });
  }),

  http.post('/api/v1/clubs/:id/events', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Omit<ClubEvent, 'id' | 'clubId' | 'status'>;
    const newEvt: ClubEvent = {
      id: `evt_${Date.now()}`,
      clubId: params.id as string,
      ...body,
      status: 'Published',
    };
    seedClubEvents.unshift(newEvt);
    return HttpResponse.json({ data: newEvt });
  }),

  http.get('/api/v1/clubs/:id/events/:eid', async ({ params }) => {
    await mockDelay();
    const evt = seedClubEvents.find((e) => e.id === params.eid);
    if (!evt) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Sự kiện không tồn tại' } }, { status: 404 });
    }
    const registrations = seedEventRegistrations.filter((r) => r.eventId === params.eid);
    const tasks = seedEventTasks.filter((t) => t.eventId === params.eid);
    return HttpResponse.json({ data: { ...evt, registrations, tasks } });
  }),

  http.post('/api/v1/clubs/:id/events/:eid/register', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const existing = seedEventRegistrations.find((r) => r.eventId === params.eid && r.userId === userId);
    if (existing) {
      const idx = seedEventRegistrations.indexOf(existing);
      seedEventRegistrations.splice(idx, 1);
      return HttpResponse.json({ data: { registered: false } });
    }

    seedEventRegistrations.push({
      eventId: params.eid as string,
      userId,
      checkedIn: false,
      registeredAt: new Date().toISOString(),
    });
    return HttpResponse.json({ data: { registered: true } });
  }),

  http.post('/api/v1/clubs/:id/events/:eid/checkin/:userId', async ({ params }) => {
    await mockDelay();
    const reg = seedEventRegistrations.find((r) => r.eventId === params.eid && r.userId === params.userId);
    if (reg) {
      reg.checkedIn = true;
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  http.put('/api/v1/clubs/:id/events/:eid', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<ClubEvent>;
    const evt = seedClubEvents.find((e) => e.id === params.eid);
    if (evt) Object.assign(evt, body);
    return HttpResponse.json({ data: evt });
  }),

  http.get('/api/v1/clubs/:id/tasks', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    const assigneeId = url.searchParams.get('assigneeId');

    let list = [...seedEventTasks];
    if (eventId) list = list.filter((t) => t.eventId === eventId);
    if (assigneeId) list = list.filter((t) => t.assigneeId === assigneeId);
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/clubs/:id/events/:eid/tasks', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { assigneeId: string; title: string; note?: string };
    const newTask: EventTask = {
      id: `tsk_${Date.now()}`,
      eventId: params.eid as string,
      assigneeId: body.assigneeId,
      title: body.title,
      status: 'Todo',
      note: body.note,
    };
    seedEventTasks.push(newTask);
    return HttpResponse.json({ data: newTask });
  }),

  http.put('/api/v1/tasks/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<EventTask>;
    const task = seedEventTasks.find((t) => t.id === params.id);
    if (task) Object.assign(task, body);
    return HttpResponse.json({ data: task });
  }),

  http.get('/api/v1/clubs/:id/members', async ({ params }) => {
    await mockDelay();
    const members = seedClubMemberships.filter((m) => m.clubId === params.id);
    return HttpResponse.json({ data: members });
  }),

  http.put('/api/v1/clubs/:id/members/:userId', async ({ params, request }) => {
    await mockDelay();
    if (isScenarioActive('forbidden')) {
      return HttpResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Bạn không đủ quyền hạn thực hiện thao tác này' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as { role?: any; status?: any; reason?: string };
    const member = seedClubMemberships.find((m) => m.clubId === params.id && m.userId === params.userId);
    if (member) {
      if (body.role) member.role = body.role;
      if (body.status) member.status = body.status;
    }
    return HttpResponse.json({ data: member });
  }),

  http.get('/api/v1/clubs/:id/recruitments', async ({ params }) => {
    await mockDelay();
    const recs = seedRecruitments.filter((r) => r.clubId === params.id);
    return HttpResponse.json({ data: recs });
  }),

  http.post('/api/v1/clubs/:id/recruitments', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Omit<Recruitment, 'id' | 'clubId' | 'acceptedCount'>;
    const newRec = {
      id: `rec_${Date.now()}`,
      clubId: params.id as string,
      ...body,
      acceptedCount: 0,
    };
    seedRecruitments.unshift(newRec);
    return HttpResponse.json({ data: newRec });
  }),

  http.get('/api/v1/clubs/:id/recruitments/:rid/applications', async ({ params }) => {
    await mockDelay();
    const apps = seedApplications.filter((a) => a.recruitmentId === params.rid);
    return HttpResponse.json({ data: apps });
  }),

  http.put('/api/v1/clubs/:id/applications/:aid', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<ClubApplication>;
    const app = seedApplications.find((a) => a.id === params.aid);
    if (app) {
      Object.assign(app, body);
      if (body.status === 'Accepted') {
        const existingMem = seedClubMemberships.find((m) => m.clubId === app.clubId && m.userId === app.applicantId);
        if (!existingMem) {
          seedClubMemberships.push({
            clubId: app.clubId,
            userId: app.applicantId,
            role: 'member',
            status: 'Active',
            contributionScore: 10,
            joinedAt: new Date().toISOString(),
          });
        }
      }
    }
    return HttpResponse.json({ data: app });
  }),

  // Finance
  http.get('/api/v1/clubs/:id/finance/summary', async ({ params }) => {
    await mockDelay();
    const clubId = params.id as string;
    const txs = seedTransactions.filter((t) => t.clubId === clubId);
    const totalIncome = txs.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return HttpResponse.json({
      data: {
        balance,
        totalIncome,
        totalExpense,
        monthlyStats: [
          { month: 'T06', income: 3000000, expense: 1200000 },
          { month: 'T07', income: 4500000, expense: 2000000 },
          { month: 'T08', income: 2000000, expense: 1500000 },
          { month: 'T09', income: 6500000, expense: 850000 },
        ],
      },
    });
  }),

  http.get('/api/v1/clubs/:id/finance/transactions', async ({ params }) => {
    await mockDelay();
    const txs = seedTransactions.filter((t) => t.clubId === params.id);
    return HttpResponse.json({ data: txs });
  }),

  http.post('/api/v1/clubs/:id/finance/transactions', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_treasurer_04';
    const body = (await request.json()) as { amount: number; description: string; type?: 'Income' | 'Expense' };

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      clubId: params.id as string,
      type: body.type || 'Income',
      amount: body.amount,
      description: body.description,
      recordedBy: userId,
      createdAt: new Date().toISOString(),
    };
    seedTransactions.unshift(newTx);
    return HttpResponse.json({ data: newTx });
  }),

  http.get('/api/v1/clubs/:id/finance/expenses', async ({ params }) => {
    await mockDelay();
    const exps = seedExpenses.filter((e) => e.clubId === params.id);
    return HttpResponse.json({ data: exps });
  }),

  http.post('/api/v1/clubs/:id/finance/expenses', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_treasurer_04';
    const body = (await request.json()) as { amount: number; purpose: string };

    const newExp: ExpenseRequest = {
      id: `exp_${Date.now()}`,
      clubId: params.id as string,
      amount: body.amount,
      purpose: body.purpose,
      requestedBy: userId,
      status: 'PendingApproval',
      createdAt: new Date().toISOString(),
    };
    seedExpenses.unshift(newExp);
    return HttpResponse.json({ data: newExp });
  }),

  http.put('/api/v1/clubs/:id/finance/expenses/:eid', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { status: 'Approved' | 'Rejected'; approverNote?: string };
    const exp = seedExpenses.find((e) => e.id === params.eid);
    if (exp) {
      exp.status = body.status;
      exp.approverNote = body.approverNote;
      if (body.status === 'Approved') {
        seedTransactions.unshift({
          id: `tx_${Date.now()}`,
          clubId: exp.clubId,
          type: 'Expense',
          amount: exp.amount,
          description: `[Đã duyệt] ${exp.purpose}`,
          recordedBy: exp.requestedBy,
          createdAt: new Date().toISOString(),
        });
      }
    }
    return HttpResponse.json({ data: exp });
  }),

  http.get('/api/v1/clubs/:id/finance/reconciliations', async ({ params }) => {
    await mockDelay();
    const recs = seedReconciliations.filter((r) => r.clubId === params.id);
    return HttpResponse.json({ data: recs });
  }),

  http.post('/api/v1/clubs/:id/finance/reconciliations', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Omit<Reconciliation, 'id' | 'clubId' | 'createdAt'>;
    const newRec: Reconciliation = {
      id: `rec_${Date.now()}`,
      clubId: params.id as string,
      ...body,
      createdAt: new Date().toISOString(),
    };
    seedReconciliations.unshift(newRec);
    return HttpResponse.json({ data: newRec });
  }),

  http.put('/api/v1/clubs/:id/settings', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<Club>;
    const club = seedClubs.find((c) => c.id === params.id);
    if (club) Object.assign(club, body);
    return HttpResponse.json({ data: club });
  }),
];
