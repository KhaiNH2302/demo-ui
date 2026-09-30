import { http, HttpResponse } from 'msw';
import { seedUsers, seedProfiles, seedFollows } from '../data/users';
import { seedKnowledgePosts } from '../data/knowledge';
import { seedClubs } from '../data/clubs';
import { seedProgramChannels } from '../data/programs';
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
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Partial<StudentProfile> & {
      fullName?: string;
      avatarUrl?: string;
    };

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

    const posts = seedKnowledgePosts.filter(
      (p) => p.authorId === user.id && p.status === 'Published'
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
