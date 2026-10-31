import { lifeDiscoverable } from '@/lib/lifePostLifecycle';
import { restoreLifePosts } from '../lifePostLifecycle';
import { http, HttpResponse } from 'msw';
import { seedUsers, seedProfiles, seedFollows } from '../data/users';
import { seedKnowledgePosts } from '../data/knowledge';
import { seedClubs } from '../data/clubs';
import { seedProgramChannels } from '../data/programs';
import { mockDelay, getViewerId } from '../utils';
import type { StudentProfile } from '@/types/entities';

async function handleUpdateProfile(request: Request) {
  await mockDelay();
  const userId = getViewerId(request);
  const body = (await request.json()) as Partial<StudentProfile> & {
    fullName?: string;
    avatarUrl?: string;
    coverUrl?: string;
    school?: string;
    major?: string;
    cohort?: string;
    campus?: string;
    studentCode?: string;
  };

  const user = seedUsers.find((u) => u.id === userId);
  if (user) {
    if (body.fullName) user.fullName = body.fullName;
    if (body.avatarUrl) user.avatarUrl = body.avatarUrl;
    if (body.coverUrl) user.coverUrl = body.coverUrl;
    if (body.school) user.school = body.school;
    if (body.major) user.major = body.major;
    if (body.cohort) user.cohort = body.cohort;
    if (body.campus) user.campus = body.campus;
    if (body.studentCode) user.studentCode = body.studentCode;

    // Also sync from education entry if provided
    if (body.education && body.education.length > 0) {
      const currentEdu = body.education.find((e) => e.isCurrent) || body.education[0];
      if (currentEdu.schoolName) user.school = currentEdu.schoolName;
      if (currentEdu.major) user.major = currentEdu.major;
      if (currentEdu.cohort) user.cohort = currentEdu.cohort;
      if (currentEdu.campus) user.campus = currentEdu.campus;
      if (currentEdu.studentCode) user.studentCode = currentEdu.studentCode;
    }
  }

  if (!seedProfiles[userId]) {
    seedProfiles[userId] = {
      userId,
      skills: [],
      interests: [],
      goals: [],
      availability: [],
      privacy: {
        swapMatching: true,
        groupMatching: true,
        mentoringMatching: true,
        profileVisibility: 'members',
        whoCanMessage: 'everyone',
      },
    };
  }

  Object.assign(seedProfiles[userId], body);

  const { password: _, ...safeUser } = user || ({} as any);
  return HttpResponse.json({ data: { user: safeUser, profile: seedProfiles[userId] } });
}

export const profileHandlers = [
  http.get('/api/v1/profile/me', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const user = seedUsers.find((u) => u.id === userId);
    const profile = seedProfiles[userId] || {
      userId,
      skills: [],
      interests: [],
      goals: [],
      availability: [],
      privacy: {
        swapMatching: true,
        groupMatching: true,
        mentoringMatching: true,
        profileVisibility: 'members',
        whoCanMessage: 'everyone',
      },
    };

    if (!user) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const { password: _, ...safeUser } = user;
    return HttpResponse.json({ data: { user: safeUser, profile } });
  }),

  http.put('/api/v1/profile/me', async ({ request }) => {
    return handleUpdateProfile(request);
  }),

  http.patch('/api/v1/profile/me', async ({ request }) => {
    return handleUpdateProfile(request);
  }),

  http.get('/api/v1/users/:id', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const viewerId = authHeader ? authHeader.replace('Bearer mock_jwt_token_', '') : null;

    const user = seedUsers.find((u) => u.id === params.id);
    if (!user) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Không tìm thấy sinh viên' } },
        { status: 404 }
      );
    }

    const profile = seedProfiles[user.id] || {
      userId: user.id,
      bio: 'Sinh viên Đại học FPT',
      skills: ['Teamwork', 'Problem Solving'],
      interests: ['Học thuật', 'Cộng đồng'],
      goals: ['Hoàn thành tốt học kỳ Fall 2026'],
      availability: [],
      privacy: {
        swapMatching: true,
        groupMatching: true,
        mentoringMatching: true,
        profileVisibility: 'members',
        whoCanMessage: 'everyone',
      },
    };

    const visibility = profile.privacy.profileVisibility || 'members';
    const isSelf = viewerId === user.id;

    const followEdge = seedFollows.find(
      (f) => f.followerId === viewerId && f.followeeId === user.id
    );
    const reverseFollow = seedFollows.find(
      (f) => f.followerId === user.id && f.followeeId === viewerId && f.status === 'Active'
    );

    const followState =
      followEdge?.status === 'Active'
        ? 'following'
        : followEdge?.status === 'Pending'
        ? 'requested'
        : reverseFollow
        ? 'follows_you'
        : 'none';

    let viewerAccess: 'self' | 'full' | 'limited' = 'full';
    if (isSelf) {
      viewerAccess = 'self';
    } else if (!viewerId) {
      // Guest viewer
      viewerAccess = 'limited';
    } else if (visibility === 'private') {
      viewerAccess = 'limited';
    } else if (visibility === 'followers' && followState !== 'following') {
      viewerAccess = 'limited';
    }

    restoreLifePosts();
    const posts = seedKnowledgePosts.filter(
      (p) => p.authorId === user.id && lifeDiscoverable(p) && (isSelf || p.visibility === 'cross_school' || Boolean(viewerId && seedUsers.find((u) => u.id === viewerId)?.school === user.school))
    );
    const representedClubs = seedClubs.filter((c) =>
      c.representatives?.some((r) => r.userId === user.id)
    );
    const organizedPrograms = seedProgramChannels.filter(
      (p) => p.organizer.userId === user.id && p.status === 'Published'
    );

    const { password: _, ...safeUser } = user;
    return HttpResponse.json({
      data: {
        user: safeUser,
        profile,
        viewerAccess,
        visibility,
        followState,
        posts,
        representedClubs,
        organizedPrograms,
      },
    });
  }),
];
