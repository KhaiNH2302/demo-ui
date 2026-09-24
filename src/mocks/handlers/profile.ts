import { http, HttpResponse } from 'msw';
import { seedUsers, seedProfiles } from '../data/users';
import { mockDelay } from '../utils';
import type { StudentProfile } from '@/types/entities';

export const profileHandlers = [
  http.get('/api/v1/profile/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const user = seedUsers.find((u) => u.id === userId);
    const profile = seedProfiles[userId] || {
      userId,
      skills: [],
      interests: [],
      goals: [],
      availability: [],
      privacy: { swapMatching: true, groupMatching: true, mentoringMatching: true },
    };

    if (!user) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;
    return HttpResponse.json({ data: { user: safeUser, profile } });
  }),

  http.put('/api/v1/profile/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Partial<StudentProfile> & { fullName?: string; avatarUrl?: string };

    const user = seedUsers.find((u) => u.id === userId);
    if (user) {
      if (body.fullName) user.fullName = body.fullName;
      if (body.avatarUrl) user.avatarUrl = body.avatarUrl;
    }

    if (!seedProfiles[userId]) {
      seedProfiles[userId] = {
        userId,
        skills: [],
        interests: [],
        goals: [],
        availability: [],
        privacy: { swapMatching: true, groupMatching: true, mentoringMatching: true },
      };
    }

    Object.assign(seedProfiles[userId], body);

    const { password: _, ...safeUser } = user || ({} as any);
    return HttpResponse.json({ data: { user: safeUser, profile: seedProfiles[userId] } });
  }),

  http.get('/api/v1/users/:id', async ({ params }) => {
    await mockDelay();
    const user = seedUsers.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }
    const profile = seedProfiles[user.id];
    const { password: _, ...safeUser } = user;
    return HttpResponse.json({ data: { user: safeUser, profile } });
  }),
];
