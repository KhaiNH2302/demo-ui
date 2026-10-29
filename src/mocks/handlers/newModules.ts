import { programHandlers } from '@/features/programs/mocks';
import { http, HttpResponse } from 'msw';
import { seedMentorApplications } from '../data/mentorApplications';
import { seedOpportunities } from '../data/opportunities';
import { seedUsers, seedFollows } from '../data/users';
import {
  seedClubs,
  seedClubOpportunities,
  seedOpportunityResponses,
  seedConnectionInvites,
} from '../data/clubs';
import {
  seedProgramChannels,
  seedProgramRegistrations,
} from '../data/programs';
import { seedGroups } from '../data/groups';
import { seedKnowledgePosts, seedReports } from '../data/knowledge';
import { seedMentoringRequests } from '../data/mentoring';
import { getViewerId } from '../utils';
import type {
  NavCounters,
  MentorApplication,
  KnowledgePost,
  User,
  Club,
  Group,
  ConnectionInvite,
} from '@/types/entities';

const mentorApplications: MentorApplication[] = [...seedMentorApplications];
const followingUserIds = new Set<string>([
  'usr_mentor_02',
  'usr_manager_03',
  'usr_mentor_01',
  'usr_organizer_09',
]);

function getCurrentUserId(request: Request): string {
  return getViewerId(request);
}

export const newModulesHandlers = [
  // 0. Public Stats for Landing Page (C12)
  http.get('/api/v1/public/stats', () => {
    return HttpResponse.json({
      data: {
        totalPosts: seedKnowledgePosts.filter((p) => p.status === 'Published').length,
        publishedPostsCount: seedKnowledgePosts.filter((p) => p.status === 'Published').length,
        openProgramsCount: seedProgramChannels.filter((p) => p.status === 'Published').length,
        openClubOpportunitiesCount: seedClubOpportunities.filter((o) => o.status === 'Published').length,
        activeClubsCount: seedClubs.filter((c) => c.status !== 'Hidden').length,
      },
    });
  }),

  // Public Preview Posts (3 posts for Guest / Welcome)
  http.get('/api/v1/public/posts/preview', () => {
    const list = seedKnowledgePosts
      .filter((p) => p.status === 'Published')
      .slice(0, 3);
    return HttpResponse.json({
      data: list,
      meta: { total: seedKnowledgePosts.filter((p) => p.status === 'Published').length },
    });
  }),

  // Public Upcoming Activities (up to 4 items)
  http.get('/api/v1/public/upcoming', () => {
    const upcomingPrograms = seedProgramChannels
      .filter((p) => p.status === 'Published')
      .slice(0, 2)
      .map((p) => ({
        id: p.id,
        type: 'program' as const,
        title: p.title,
        subtitle: `${p.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · ${p.organizer.fullName}`,
        startAt: p.startAt,
        weekday: 'T7',
        dateStr: '04/10',
        href: `/programs/${p.id}`,
        linkTo: `/programs/${p.id}`,
      }));

    const upcomingClubOpps = seedClubOpportunities
      .filter((o) => o.status === 'Published')
      .slice(0, 2)
      .map((o) => ({
        id: o.id,
        type: 'club' as const,
        title: o.title,
        subtitle: `${o.clubName} · Còn ${Math.max(0, o.quota - o.used)} chỗ`,
        startAt: o.startAt || o.registrationDeadline,
        weekday: 'CN',
        dateStr: '05/10',
        href: `/clubs/opportunities/${o.id}`,
        linkTo: `/clubs/opportunities/${o.id}`,
      }));

    return HttpResponse.json({
      data: [...upcomingPrograms, ...upcomingClubOpps].slice(0, 4),
    });
  }),

  // Home Today Panel & My Spaces (C6.T)
  http.get('/api/v1/home/today', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'td-2',
          kind: 'club_need_info',
          title: 'Đơn đăng ký F-Code cần bổ sung thông tin',
          subtitle: 'Đợt tuyển Thành viên Gen 19 · Còn 2 ngày',
          actionLabel: 'Bổ sung',
          href: '/clubs?tab=registrations',
        },
      ],
    });
  }),

  http.get('/api/v1/home/spaces', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'grp_01',
          kind: 'group',
          name: 'Nhóm Đồ án SEP490 - G72',
          roleLabel: 'Trưởng nhóm',
          hasUnread: true,
          href: '/groups/grp_01',
        },
        {
          id: 'club_01',
          kind: 'club',
          name: 'F-Code Club',
          roleLabel: 'Đại diện CLB',
          hasUnread: true,
          href: '/clubs/club_01',
        },
      ],
    });
  }),

  http.post('/api/v1/uploads/images', async () => {
    return HttpResponse.json({
      data: {
        id: `img_${Date.now()}`,
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        thumbUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
        width: 1200,
        height: 675,
      },
    });
  }),

  // Public Config
  http.get('/api/v1/public/config', () => {
    return HttpResponse.json({
      data: {
        guestAccess: { knowledge: true, programs: true, clubs: true },
        limits: { posts: 3, programs: 6, opportunities: 6 },
      },
    });
  }),

  // 1. Nav Counters (GET /nav/counters)
  http.get('/api/v1/nav/counters', ({ request }) => {
    const userId = getCurrentUserId(request);
    const myApp = mentorApplications.find((a) => a.userId === userId);

    const needMoreInfoCount = seedOpportunityResponses.filter(
      (r) => r.studentId === userId && r.status === 'NeedsMoreInfo'
    ).length;
    const myRepClubIds = seedClubs
      .filter((c) => c.representatives?.some((rep) => rep.userId === userId))
      .map((c) => c.id);
    const clubPendingReviews = seedOpportunityResponses.filter(
      (r) =>
        myRepClubIds.includes(r.clubId) &&
        (r.status === 'Submitted' || r.status === 'UnderReview')
    ).length;

    const myProgramIds = seedProgramChannels
      .filter(
        (p) =>
          p.organizer.userId === userId ||
          p.coOrganizers.some((co) => co.userId === userId && co.status === 'Accepted')
      )
      .map((p) => p.id);
    const pendingProgramRegs = seedProgramRegistrations.filter(
      (reg) => myProgramIds.includes(reg.programId) && reg.status === 'Submitted'
    ).length;

    const pendingFollows = seedFollows.filter(
      (f) => f.followeeId === userId && f.status === 'Pending'
    ).length;

    const counters: NavCounters = {
      unreadNotifications: 3,
      unreadMessages: 2,
      pendingMessageRequests: 1,
      pendingGroupJoinRequests: 1,
      pendingSwapInvites: 0,
      pendingRequestsTotal:
        needMoreInfoCount + clubPendingReviews + pendingProgramRegs + pendingFollows + 2,
      pendingMentoringRequests: seedMentoringRequests.filter(
        (r) => r.mentorId === userId && r.status === 'PENDING_MENTOR_RESPONSE'
      ).length,
      mentoringRequestUpdates: seedMentoringRequests.filter(
        (r) => r.studentId === userId && r.status === 'ACCEPTED'
      ).length,
      pendingOpportunityResponses: needMoreInfoCount + clubPendingReviews,
      pendingProgramRegistrations: pendingProgramRegs,
      pendingFollowRequests: pendingFollows,
      todayRegisteredEvents: 2,
      mentorApplicationStatus: myApp?.status,
    };
    return HttpResponse.json({ data: counters });
  }),

  // 2. Global Search (GET /search and GET /search/suggest)
  http.get('/api/v1/search', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();

    const posts = seedKnowledgePosts
      .filter(
        (p: KnowledgePost) =>
          (p.contentMd || p.title || '').toLowerCase().includes(q) ||
          (p.subject && p.subject.toLowerCase().includes(q))
      )
      .slice(0, 10);

    const students = seedUsers
      .filter(
        (u: User) =>
          u.fullName.toLowerCase().includes(q) ||
          (u.studentCode && u.studentCode.toLowerCase().includes(q))
      )
      .slice(0, 10);

    const clubs = seedClubs
      .filter(
        (c: Club) =>
          c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const groups = seedGroups
      .filter(
        (g: Group) => g.name.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const programs = seedProgramChannels
      .filter(
        (p) =>
          p.status === 'Published' &&
          (p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))
      )
      .slice(0, 10);

    const mentors = seedUsers
      .filter(
        (u: User) =>
          u.roles.some((r) => r.toLowerCase() === 'mentor') &&
          u.fullName.toLowerCase().includes(q)
      )
      .slice(0, 10);

    return HttpResponse.json({
      data: {
        posts,
        students,
        clubs,
        groups,
        events: programs,
        programs,
        mentors,
        total:
          posts.length +
          students.length +
          clubs.length +
          groups.length +
          programs.length +
          mentors.length,
      },
    });
  }),

  http.get('/api/v1/search/suggest', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();

    const suggestions = [
      ...seedKnowledgePosts
        .filter((p: KnowledgePost) => (p.contentMd || p.title || '').toLowerCase().includes(q))
        .slice(0, 3)
        .map((p: KnowledgePost) => ({
          type: 'post',
          title: (p.title || p.contentMd || '').slice(0, 50) + '...',
          link: `/knowledge/${p.id}`,
        })),
      ...seedProgramChannels
        .filter((p) => p.title.toLowerCase().includes(q))
        .slice(0, 2)
        .map((p) => ({
          type: 'program',
          title: p.title,
          link: `/programs/${p.id}`,
        })),
      ...seedClubs
        .filter((c: Club) => c.name.toLowerCase().includes(q))
        .slice(0, 2)
        .map((c: Club) => ({
          type: 'club',
          title: c.name,
          link: `/clubs/${c.id}`,
        })),
      ...seedUsers
        .filter((u: User) => u.fullName.toLowerCase().includes(q))
        .slice(0, 2)
        .map((u: User) => ({
          type: 'user',
          title: u.fullName,
          link: `/users/${u.id}`,
        })),
    ];

    return HttpResponse.json({ data: suggestions });
  }),

  // 3. Opportunities (GET /opportunities — O1)
  http.get('/api/v1/opportunities', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const field = url.searchParams.get('field');

    const clubMapped = seedClubOpportunities
      .filter((o) => o.status === 'Published')
      .map((o) => ({
        id: o.id,
        type: 'club' as const,
        title: o.title,
        subtitle:
          o.type === 'MemberRecruitment'
            ? 'Tuyển thành viên CLB'
            : o.type === 'CollaboratorRecruitment'
            ? 'Tuyển cộng tác viên CLB'
            : 'Sự kiện CLB',
        organizationName: o.clubName,
        avatarUrl: o.clubLogo,
        field: o.clubCategory === 'Tech' ? 'Công nghệ thông tin' : 'Hoạt động sinh viên',
        deadline: o.registrationDeadline,
        spotsLeft: Math.max(0, o.quota - o.used),
        tags: o.tags,
        linkTo: `/clubs/opportunities/${o.id}`,
        isUrgent: o.quota - o.used <= 10,
        isFeatured: o.id === 'opp_02',
        createdAt: o.createdAt,
      }));

    const programMapped = seedProgramChannels
      .filter((p) => p.status === 'Published')
      .map((p) => ({
        id: p.id,
        type: 'program' as const,
        title: p.title,
        subtitle: p.type === 'Volunteer' ? 'Chiến dịch Tình nguyện' : 'Workshop Kỹ năng & Học thuật',
        organizationName: `Tổ chức bởi ${p.organizer.fullName}`,
        avatarUrl: p.organizer.avatarUrl,
        coverUrl: p.coverUrl,
        field: p.type === 'Volunteer' ? 'Cộng đồng & Xã hội' : 'Công nghệ thông tin',
        deadline: p.registrationDeadline,
        spotsLeft: Math.max(0, p.quota - p.confirmedCount),
        tags: p.tags,
        linkTo: `/programs/${p.id}`,
        isUrgent: p.quota - p.confirmedCount <= 10,
        isFeatured: p.id === 'prog_01',
        createdAt: p.createdAt,
      }));

    const otherOpps = seedOpportunities.filter((o) => o.type !== 'club');
    let list = [...clubMapped, ...programMapped, ...otherOpps];

    if (type && type !== 'all') {
      list = list.filter((item) => item.type === type);
    }
    if (field && field !== 'all') {
      list = list.filter((item) => item.field.includes(field));
    }

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/opportunities/featured', () => {
    const featured = seedOpportunities.filter((item) => item.isFeatured);
    return HttpResponse.json({ data: featured });
  }),

  // 4. Read-only Aggregated Events Calendar (E1 — aggregates FE-04 Event + FE-06 ProgramChannel)
  http.get('/api/v1/events', ({ request }) => {
    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'upcoming';
    const sourceFilter = url.searchParams.get('source') || 'all';
    const userId = getCurrentUserId(request);

    const clubEventItems = seedClubOpportunities
      .filter((o) => o.type === 'Event' && o.status !== 'Draft')
      .map((o) => {
        const myResp = seedOpportunityResponses.find(
          (r) =>
            r.opportunityId === o.id &&
            r.studentId === userId &&
            (r.status === 'Confirmed' || r.status === 'Accepted' || r.status === 'Submitted')
        );
        return {
          id: o.id,
          sourceType: 'club' as const,
          sourceLabel: `CLB ${o.clubName}`,
          clubId: o.clubId,
          clubName: o.clubName,
          clubLogo: o.clubLogo,
          title: o.title,
          description: o.summary,
          startAt: o.startAt || o.registrationDeadline,
          endAt: o.endAt || o.registrationDeadline,
          mode: o.mode || 'Offline',
          location: o.locationOrLink || 'ĐH FPT Hà Nội',
          capacity: o.quota,
          registeredCount: o.used,
          registeredByMe: Boolean(myResp),
          myStatus: myResp?.status,
          status: o.status === 'Expired' || o.status === 'Closed' ? 'Finished' : 'Published',
          detailUrl: `/clubs/opportunities/${o.id}`,
          tags: o.tags,
        };
      });

    const programEventItems = seedProgramChannels
      .filter((p) => p.status === 'Published' || p.status === 'Closed' || p.status === 'Expired')
      .map((p) => {
        const myReg = seedProgramRegistrations.find(
          (r) =>
            r.programId === p.id &&
            r.studentId === userId &&
            (r.status === 'Confirmed' || r.status === 'Submitted')
        );
        return {
          id: p.id,
          sourceType: 'program' as const,
          programType: p.type,
          sourceLabel: `Tổ chức bởi ${p.organizer.fullName}`,
          clubId: p.id,
          clubName: `${p.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · ${p.organizer.fullName}`,
          clubLogo: p.organizer.avatarUrl,
          coverUrl: p.coverUrl,
          title: p.title,
          description: p.summary,
          startAt: p.startAt,
          endAt: p.endAt,
          mode: p.mode,
          location: p.locationOrLink,
          capacity: p.quota,
          registeredCount: p.confirmedCount,
          registeredByMe: Boolean(myReg),
          myStatus: myReg?.status,
          status: p.status === 'Expired' ? 'Finished' : 'Published',
          detailUrl: `/programs/${p.id}`,
          tags: p.tags,
        };
      });

    let list = [...clubEventItems, ...programEventItems].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    if (sourceFilter === 'club') {
      list = list.filter((e) => e.sourceType === 'club');
    } else if (sourceFilter === 'volunteer') {
      list = list.filter((e) => e.sourceType === 'program' && (e as any).programType === 'Volunteer');
    } else if (sourceFilter === 'workshop') {
      list = list.filter((e) => e.sourceType === 'program' && (e as any).programType === 'Workshop');
    }

    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const registered = url.searchParams.get('registered');

    if (tab === 'registered' || registered === 'true') {
      list = list.filter((e) => e.registeredByMe);
    } else if (tab === 'past') {
      list = list.filter((e) => e.status === 'Finished');
    } else if (tab === 'upcoming') {
      list = list.filter((e) => e.status !== 'Finished');
    }

    if (from) {
      const fromTime = new Date(from).getTime();
      list = list.filter((e) => new Date(e.endAt || e.startAt).getTime() >= fromTime);
    }
    if (to) {
      const toTime = new Date(to).getTime();
      list = list.filter((e) => new Date(e.startAt).getTime() <= toTime);
    }

    return HttpResponse.json({ data: list });
  }),

  // 5. People / Student Connection & Follow Requests (P1)
  http.get('/api/v1/users/suggested', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const major = url.searchParams.get('major');
    const cohort = url.searchParams.get('cohort');

    let students = seedUsers.map((u) => ({
      ...u,
      isFollowing: followingUserIds.has(u.id),
      sharedTags: [u.major || 'Kỹ thuật phần mềm', u.cohort || 'K18', 'Cùng học SWP391'],
      mutualConnectionsCount: 4,
    }));

    if (q) {
      students = students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
          (s.major && s.major.toLowerCase().includes(q))
      );
    }
    if (major && major !== 'all') {
      students = students.filter((s) => s.major === major);
    }
    if (cohort && cohort !== 'all') {
      students = students.filter((s) => s.cohort === cohort);
    }

    return HttpResponse.json({ data: students });
  }),

  http.get('/api/v1/users/me/following', () => {
    const list = seedUsers
      .filter((u) => followingUserIds.has(u.id))
      .map((u) => ({
        ...u,
        isFollowing: true,
        sharedTags: [u.major || 'Kỹ thuật phần mềm', u.cohort || 'K18', 'Bạn học FPTU'],
        mutualConnectionsCount: 5,
      }));
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/users/me/followers', () => {
    const followerIds = seedFollows
      .filter((f) => f.followeeId === 'usr_student_01' && f.status === 'Active')
      .map((f) => f.followerId);
    let list = seedUsers.filter((u) => followerIds.includes(u.id));
    if (list.length === 0) list = seedUsers.slice(1, 4);
    const enriched = list.map((u) => ({
      ...u,
      isFollowing: followingUserIds.has(u.id),
      sharedTags: [u.major || 'Kỹ thuật phần mềm', u.cohort || 'K18', 'Cùng theo dõi F-Code'],
      mutualConnectionsCount: 4,
    }));
    return HttpResponse.json({ data: enriched });
  }),

  http.get('/api/v1/follow-requests', ({ request }) => {
    const userId = getCurrentUserId(request);
    const incoming = seedFollows.filter((f) => f.followeeId === userId && f.status === 'Pending');
    const outgoing = seedFollows.filter((f) => f.followerId === userId && f.status === 'Pending');
    return HttpResponse.json({ data: { incoming, outgoing } });
  }),

  http.put('/api/v1/follow-requests/:id/respond', async ({ params, request }) => {
    const body = (await request.json()) as { action: 'accept' | 'decline' };
    const flw = seedFollows.find((f) => f.id === params.id);
    if (flw) {
      flw.status = body.action === 'accept' ? 'Active' : 'Declined';
      flw.respondedAt = new Date().toISOString();
    }
    return HttpResponse.json({ data: flw });
  }),

  http.post('/api/v1/users/:id/follow', ({ params }) => {
    followingUserIds.add(params.id as string);
    return HttpResponse.json({ data: { following: true } });
  }),

  http.delete('/api/v1/users/:id/follow', ({ params }) => {
    followingUserIds.delete(params.id as string);
    return HttpResponse.json({ data: { following: false } });
  }),

  // 6. Connection Invites (CL11 / PG2 CoParticipantsPanel)
  http.get('/api/v1/connection-invites', ({ request }) => {
    const userId = getCurrentUserId(request);
    const list = seedConnectionInvites.filter(
      (i) => i.toUserId === userId || i.fromUserId === userId
    );
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/connection-invites', async ({ request }) => {
    const userId = getCurrentUserId(request);
    const user = seedUsers.find((u) => u.id === userId) || seedUsers[0];
    const body = (await request.json()) as {
      sourceType: 'opportunity' | 'program';
      sourceId: string;
      sourceTitle: string;
      toUserId: string;
      toUserName: string;
      message: string;
    };

    const created: ConnectionInvite = {
      id: `cinv_${Date.now()}`,
      fromUserId: user.id,
      fromUserName: user.fullName,
      fromUserAvatar: user.avatarUrl,
      fromUserMeta: `${user.major || 'Kỹ thuật phần mềm'} · ${user.cohort || 'K18'}`,
      toUserId: body.toUserId,
      toUserName: body.toUserName,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      sourceTitle: body.sourceTitle,
      message: body.message,
      status: 'Pending',
      conversationId: 'conv_02',
      createdAt: new Date().toISOString(),
    };
    seedConnectionInvites.unshift(created);
    return HttpResponse.json({ data: created });
  }),

  http.put('/api/v1/connection-invites/:id/respond', async ({ params, request }) => {
    const body = (await request.json()) as { action: 'accept' | 'decline' };
    const inv = seedConnectionInvites.find((i) => i.id === params.id);
    if (inv) {
      inv.status = body.action === 'accept' ? 'Accepted' : 'Declined';
      inv.conversationId = 'conv_02';
    }
    return HttpResponse.json({ data: inv });
  }),

  // 7. Unified Violation Reports (C9b)
  http.post('/api/v1/reports', async ({ request }) => {
    const userId = getCurrentUserId(request);
    const user = seedUsers.find((u) => u.id === userId) || seedUsers[0];
    const body = (await request.json()) as {
      targetType: any;
      targetId: string;
      targetTitle: string;
      targetAuthorName: string;
      reason: string;
      description?: string;
      contentSnapshot?: string;
    };

    const existing = seedReports.find(
      (r) => r.targetType === body.targetType && r.targetId === body.targetId && r.status === 'Open'
    );

    if (existing) {
      existing.reportCount = (existing.reportCount || 1) + 1;
      if (existing.reportCount >= 5) {
        existing.autoHidden = true;
        if (body.targetType === 'post') {
          const post = seedKnowledgePosts.find((p) => p.id === body.targetId);
          if (post) post.status = 'TemporarilyHidden';
        }
      }
      return HttpResponse.json({ data: existing });
    }

    const newReport = {
      id: `rep_${Date.now()}`,
      targetType: body.targetType,
      targetId: body.targetId,
      targetTitle: body.targetTitle,
      targetAuthorName: body.targetAuthorName,
      reporterId: user.id,
      reporterName: user.fullName,
      reason: body.reason,
      description: body.description,
      contentSnapshot: body.contentSnapshot,
      reportCount: 1,
      autoHidden: false,
      status: 'Open' as const,
      createdAt: new Date().toISOString(),
    };
    seedReports.unshift(newReport);
    return HttpResponse.json({ data: newReport });
  }),

  // FE-06: Event Manager programs and Student proposals.
  ...programHandlers,

  // 9. Requests Management (GET /requests — C13)
  http.get('/api/v1/requests', ({ request }) => {
    const url = new URL(request.url);
    const box = url.searchParams.get('box') || 'incoming';

    const incomingItems = [
      {
        id: 'req_club_sup_01',
        module: 'club_supplement',
        moduleLabel: 'Đơn CLB cần bổ sung',
        title: 'Đơn CTV Matsuri Tech 2026 (JS Club) cần bổ sung link bài viết mẫu',
        fromUser: {
          id: 'usr_manager_03',
          fullName: 'JS Club · Trần Minh Cường',
          avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150',
        },
        createdAt: '2026-09-28T15:30:00Z',
        status: 'NeedsMoreInfo',
        linkTo: '/clubs/registrations/resp_01',
      },
      {
        id: 'req_club_rev_01',
        module: 'club_review',
        moduleLabel: 'Đơn CLB chờ xét',
        title: 'Vũ Minh Khôi (K19) gửi đơn đăng ký Tuyển thành viên F-Code Gen 11',
        fromUser: {
          id: 'usr_newbie_08',
          fullName: 'Vũ Minh Khôi',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
        createdAt: '2026-09-28T09:15:00Z',
        status: 'Submitted',
        linkTo: '/clubs/manage/opp_02',
      },
      {
        id: 'req_prog_rev_01',
        module: 'program_review',
        moduleLabel: 'Đăng ký chương trình chờ xét',
        title: 'Vũ Minh Khôi đăng ký tham dự Workshop Thiết kế Database & SRS SWP391',
        fromUser: {
          id: 'usr_newbie_08',
          fullName: 'Vũ Minh Khôi',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
        createdAt: '2026-09-28T11:20:00Z',
        status: 'Submitted',
        linkTo: '/programs/manage/prog_02',
      },
      {
        id: 'req_cinv_01',
        module: 'connection_invite',
        moduleLabel: 'Lời mời kết nối',
        title: 'Vũ Minh Khôi (cùng tham gia Seminar RAG) gửi lời mời kết nối',
        fromUser: {
          id: 'usr_newbie_08',
          fullName: 'Vũ Minh Khôi',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        },
        createdAt: '2026-09-28T20:15:00Z',
        status: 'Pending',
        linkTo: '/clubs/opportunities/opp_04',
      },
      {
        id: 'req_flw_01',
        module: 'follow',
        moduleLabel: 'Yêu cầu theo dõi',
        title: 'Hoàng Trọng Nghĩa (AI · K18) gửi yêu cầu theo dõi hồ sơ của bạn',
        fromUser: {
          id: 'usr_student_07',
          fullName: 'Hoàng Trọng Nghĩa',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        },
        createdAt: '2026-09-29T07:45:00Z',
        status: 'Pending',
        linkTo: '/people?tab=requests',
      },
      {
        id: 'req_02',
        module: 'group',
        moduleLabel: 'Nhóm kết nối',
        title: 'Yêu cầu gia nhập nhóm đồ án SWP391_G04',
        fromUser: {
          id: 'usr_student_07',
          fullName: 'Hoàng Trọng Nghĩa',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        },
        createdAt: '2026-09-25T10:15:00Z',
        status: 'Pending',
        linkTo: '/groups/grp_01/manage',
      },
    ];

    if (box === 'outgoing') {
      return HttpResponse.json({
        data: [
          {
            id: 'req_out_01',
            module: 'club',
            moduleLabel: 'Đăng ký cơ hội CLB',
            title: 'Tuyển CTV Ngày hội Văn hóa & Công nghệ Việt - Nhật (Matsuri Tech 2026)',
            to: 'JS Club',
            createdAt: '2026-09-24T10:00:00Z',
            status: 'NeedsMoreInfo',
            linkTo: '/clubs/registrations/resp_01',
          },
          {
            id: 'req_out_02',
            module: 'program',
            moduleLabel: 'Kênh chương trình',
            title: 'Chia sẻ kinh nghiệm Ôn thi & Thực tập OJT tại doanh nghiệp Nhật Bản',
            to: 'Ban Quản trị SCS',
            createdAt: '2026-09-28T16:00:00Z',
            status: 'PendingReview',
            linkTo: '/programs/prog_04',
          },
          {
            id: 'req_out_03',
            module: 'mentor_apply',
            moduleLabel: 'Hồ sơ Mentor',
            title: 'Hồ sơ đăng ký trở thành Mentor SCS học kỳ Fall 2026',
            to: 'Ban Quản trị SCS',
            createdAt: '2026-09-20T10:00:00Z',
            status: 'NeedsMoreInfo',
            linkTo: '/mentor/apply',
          },
        ],
      });
    }

    if (box === 'history') {
      return HttpResponse.json({
        data: [
          {
            id: 'req_hist_01',
            module: 'program',
            moduleLabel: 'Tình nguyện',
            title: 'Đã xác nhận tham gia Chiến dịch Chủ Nhật Xanh: Thu gom pin cũ',
            createdAt: '2026-09-24T09:00:00Z',
            status: 'Confirmed',
            linkTo: '/programs/prog_01',
          },
          {
            id: 'req_hist_02',
            module: 'club',
            moduleLabel: 'Sự kiện CLB',
            title: 'Đã xác nhận tham gia Seminar: Xây dựng hệ thống RAG tiếng Việt',
            createdAt: '2026-09-25T14:20:00Z',
            status: 'Confirmed',
            linkTo: '/clubs/registrations/resp_02',
          },
        ],
      });
    }

    return HttpResponse.json({ data: incomingItems });
  }),

  // 10. Student Mentor Application (GET /mentor/applications/me, PUT, POST)
  http.get('/api/v1/mentor/applications/me', () => {
    let app = mentorApplications.find((a) => a.userId === 'usr_student_01');
    if (!app) {
      app = {
        id: 'app_new',
        userId: 'usr_student_01',
        status: 'Draft',
        personal: {
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          currentRole: 'student',
          yearOrGraduation: 'Năm 3 (K18)',
        },
        education: {
          major: 'Kỹ thuật phần mềm',
          gpa: 3.5,
          gpaScale: 4,
          gpaPublic: true,
          strongSubjects: [{ code: 'CSD201', grade: '9.0' }],
        },
        experiences: [],
        skills: [],
        achievements: [],
        focus: { areas: [], subjects: [], targetAudience: [], maxMentees: 3 },
        about: { headline: '', bio: '', motivation: '' },
        availability: { slots: [], modes: ['online', 'chat'], sessionMinutes: 45 },
        evidence: { cvUrl: '', portfolioUrls: [], otherFiles: [] },
        agreed: false,
        history: [],
        createdAt: new Date().toISOString(),
      };
    }
    return HttpResponse.json({ data: app });
  }),

  http.put('/api/v1/mentor/applications/me', async ({ request }) => {
    const body = (await request.json()) as Partial<MentorApplication>;
    const idx = mentorApplications.findIndex((a) => a.userId === 'usr_student_01');
    if (idx !== -1) {
      mentorApplications[idx] = { ...mentorApplications[idx], ...body, status: 'Draft' };
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    const newApp: MentorApplication = {
      ...seedMentorApplications[0],
      ...body,
      id: 'app_' + Date.now(),
      userId: 'usr_student_01',
      status: 'Draft',
    };
    mentorApplications.push(newApp);
    return HttpResponse.json({ data: newApp });
  }),

  http.post('/api/v1/mentor/applications/me/submit', async () => {
    const idx = mentorApplications.findIndex((a) => a.userId === 'usr_student_01');
    if (idx !== -1) {
      mentorApplications[idx].status = 'Submitted';
      mentorApplications[idx].submittedAt = new Date().toISOString();
      mentorApplications[idx].history.push({
        status: 'Submitted',
        at: new Date().toISOString(),
        by: 'usr_student_01',
        note: 'Đã nộp hồ sơ xét duyệt',
      });
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Chưa có hồ sơ' } },
      { status: 404 }
    );
  }),

  http.post('/api/v1/mentor/applications/me/withdraw', () => {
    const idx = mentorApplications.findIndex((a) => a.userId === 'usr_student_01');
    if (idx !== -1) {
      mentorApplications[idx].status = 'Withdrawn';
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } },
      { status: 404 }
    );
  }),

  // 11. Admin Mentor Applications Review
  http.get('/api/v1/admin/mentor-applications', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let list = [...mentorApplications];
    if (status && status !== 'all') {
      if (status === 'pending') {
        list = list.filter((a) => a.status === 'Submitted' || a.status === 'UnderReview');
      } else {
        list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
      }
    }

    return HttpResponse.json({
      data: list,
      meta: { total: list.length, page: 1, pageSize: 20 },
    });
  }),

  http.get('/api/v1/admin/mentor-applications/:id', ({ params }) => {
    const app = mentorApplications.find((a) => a.id === params.id) || mentorApplications[0];
    return HttpResponse.json({ data: app });
  }),

  http.post('/api/v1/admin/mentor-applications/:id/approve', ({ params }) => {
    const idx = mentorApplications.findIndex((a) => a.id === params.id);
    if (idx !== -1) {
      mentorApplications[idx].status = 'Approved';
      mentorApplications[idx].decidedAt = new Date().toISOString();
      mentorApplications[idx].history.push({
        status: 'Approved',
        at: new Date().toISOString(),
        by: 'Admin',
        note: 'Đã phê duyệt trở thành Mentor',
      });
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } },
      { status: 404 }
    );
  }),

  http.post('/api/v1/admin/mentor-applications/:id/request-info', async ({ params, request }) => {
    const body = (await request.json()) as { note: string; sections: string[] };
    const idx = mentorApplications.findIndex((a) => a.id === params.id);
    if (idx !== -1) {
      mentorApplications[idx].status = 'NeedsMoreInfo';
      mentorApplications[idx].reviewNote = body.note;
      mentorApplications[idx].flaggedSections = body.sections;
      mentorApplications[idx].history.push({
        status: 'NeedsMoreInfo',
        at: new Date().toISOString(),
        by: 'Admin',
        note: body.note,
      });
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } },
      { status: 404 }
    );
  }),

  http.post('/api/v1/admin/mentor-applications/:id/reject', async ({ params, request }) => {
    const body = (await request.json()) as { reasonCode: string; note: string };
    const idx = mentorApplications.findIndex((a) => a.id === params.id);
    if (idx !== -1) {
      mentorApplications[idx].status = 'Rejected';
      mentorApplications[idx].rejectReasonCode = body.reasonCode;
      mentorApplications[idx].reviewNote = body.note;
      mentorApplications[idx].history.push({
        status: 'Rejected',
        at: new Date().toISOString(),
        by: 'Admin',
        note: body.note,
      });
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } },
      { status: 404 }
    );
  }),
];
