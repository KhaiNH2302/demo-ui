import { http, HttpResponse } from 'msw';
import { seedGroups, seedGroupMembers, seedJoinRequests } from '../data/groups';
import { seedUsers } from '../data/users';
import { mockDelay, isScenarioActive, getViewerId } from '../utils';
import type { Group, GroupJoinRequest, AiGroupMatch, AiMemberSuggestion } from '@/types/entities';

export const groupHandlers = [
  http.get('/api/v1/groups', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedGroups });
  }),

  http.post('/api/v1/groups/search', async ({ request }) => {
    const body = (await request.json()) as { mode?: 'ai' | 'filter'; purpose?: string; skills?: string[] };

    if (body.mode === 'ai' && isScenarioActive('ai_timeout')) {
      await mockDelay(2000, 3000);
      return HttpResponse.json(
        { error: { code: 'AI_TIMEOUT', message: 'Dịch vụ gợi ý AI không phản hồi kịp thời' } },
        { status: 504 }
      );
    }

    await mockDelay(200, 400);

    if (body.mode === 'ai') {
      const matches: AiGroupMatch[] = seedGroups.map((g, idx) => ({
        groupId: g.id,
        score: 95 - idx * 10,
        reasons: [
          'Trùng khớp mục đích hoạt động',
          'Khung giờ rảnh tương thích tối T3/T5',
          'Cần bổ sung kỹ năng React/TypeScript',
        ],
      }));
      return HttpResponse.json({ data: matches });
    }

    let filtered = [...seedGroups];
    if (body.purpose) {
      filtered = filtered.filter((g) => g.purpose === body.purpose);
    }
    return HttpResponse.json({ data: filtered });
  }),

  http.get('/api/v1/groups/mine', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const userId = getViewerId(request);

    if (role === 'owner') {
      const owned = seedGroups.filter((g) => g.ownerId === userId);
      return HttpResponse.json({ data: owned });
    }

    const memberGroupIds = seedGroupMembers.filter((m) => m.userId === userId && m.role === 'member').map((m) => m.groupId);
    const memberGroups = seedGroups.filter((g) => memberGroupIds.includes(g.id));
    return HttpResponse.json({ data: memberGroups });
  }),

  http.get('/api/v1/join-requests/mine', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const myRequests = seedJoinRequests.filter((r) => r.userId === userId);
    return HttpResponse.json({ data: myRequests });
  }),

  http.get('/api/v1/groups/:id', async ({ params }) => {
    await mockDelay();
    const group = seedGroups.find((g) => g.id === params.id);
    if (!group) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Nhóm không tồn tại' } }, { status: 404 });
    }
    const members = seedGroupMembers.filter((m) => m.groupId === params.id);
    return HttpResponse.json({ data: { ...group, members } });
  }),

  http.post('/api/v1/groups', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const body = (await request.json()) as Omit<Group, 'id' | 'ownerId' | 'memberCount' | 'createdAt'>;

    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      ownerId: userId,
      name: body.name,
      purpose: body.purpose,
      topic: body.topic,
      skills: body.skills || [],
      activityTime: body.activityTime || [],
      interests: body.interests || '',
      joinMode: body.joinMode || 'approval',
      memberCount: 1,
      memberLimit: body.memberLimit || 5,
      createdAt: new Date().toISOString(),
    };

    seedGroups.unshift(newGroup);
    seedGroupMembers.push({
      groupId: newGroup.id,
      userId,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    return HttpResponse.json({ data: newGroup });
  }),

  http.post('/api/v1/groups/:id/join-requests', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const body = (await request.json()) as { message?: string };
    const group = seedGroups.find((g) => g.id === params.id);

    if (!group) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Nhóm không tồn tại' } }, { status: 404 });
    }

    if (group.joinMode === 'direct') {
      seedGroupMembers.push({
        groupId: group.id,
        userId,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
      group.memberCount += 1;
      return HttpResponse.json({ data: { joined: true } });
    }

    const newReq: GroupJoinRequest = {
      id: `jreq_${Date.now()}`,
      groupId: group.id,
      userId,
      message: body.message,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    seedJoinRequests.push(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  http.get('/api/v1/groups/:id/join-requests', async ({ params }) => {
    await mockDelay();
    const reqs = seedJoinRequests.filter((r) => r.groupId === params.id && r.status === 'Pending');
    return HttpResponse.json({ data: reqs });
  }),

  http.post('/api/v1/groups/:id/join-requests/:reqId/:decision', async ({ params }) => {
    await mockDelay();
    const req = seedJoinRequests.find((r) => r.id === params.reqId);
    const group = seedGroups.find((g) => g.id === params.id);

    if (!req || !group) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }

    if (params.decision === 'approve') {
      req.status = 'Approved';
      seedGroupMembers.push({
        groupId: group.id,
        userId: req.userId,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
      group.memberCount += 1;
    } else {
      req.status = 'Rejected';
    }

    return HttpResponse.json({ data: req });
  }),

  http.get('/api/v1/groups/:id/ai-suggested-members', async () => {
    await mockDelay(200, 400);
    const suggestions: AiMemberSuggestion[] = seedUsers
      .filter((u) => u.roles.includes('student'))
      .slice(0, 3)
      .map((u, i) => ({
        userId: u.id,
        score: 92 - i * 8,
        reasons: ['Trùng khớp kỹ năng React & TypeScript', 'Lịch rảnh tương thích vào cuối tuần'],
      }));
    return HttpResponse.json({ data: suggestions });
  }),

  http.put('/api/v1/groups/:id/settings', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<Group>;
    const group = seedGroups.find((g) => g.id === params.id);
    if (!group) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Nhóm không tồn tại' } }, { status: 404 });
    }
    Object.assign(group, body);
    return HttpResponse.json({ data: group });
  }),
];
