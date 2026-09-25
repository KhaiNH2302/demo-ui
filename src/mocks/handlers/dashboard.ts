import { http, HttpResponse } from 'msw';
import { seedSwapRequests, seedSwapConnections } from '../data/swap';
import { seedJoinRequests, seedGroups } from '../data/groups';
import { seedApplications, seedClubEvents, seedClubs } from '../data/clubs';
import { seedMentoringRequests } from '../data/mentoring';
import { seedKnowledgePosts } from '../data/knowledge';
import { mockDelay } from '../utils';

export const dashboardHandlers = [
  // Nav Counters query (dùng chung cho IconRailNav, BottomTabBar, Topbar)
  http.get('/api/v1/nav/counters', async ({ request }) => {
    await mockDelay(100, 300);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const unreadMessages = 3;
    const pendingSwapInvites = seedSwapConnections.filter(
      (c) => c.recipientId === userId && c.status === 'Pending'
    ).length;
    const myActionItems = 4;
    const unreadNotifications = 2;

    return HttpResponse.json({
      data: {
        unreadMessages,
        pendingSwapInvites,
        myActionItems,
        unreadNotifications,
      },
    });
  }),

  // /me/summary query (cho C13 Của tôi)
  http.get('/api/v1/me/summary', async ({ request }) => {
    await mockDelay(200, 400);
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const openSwaps = seedSwapRequests.filter((r) => r.studentId === userId && r.status === 'Open').length;
    const pendingSwapConns = seedSwapConnections.filter((c) => c.recipientId === userId && c.status === 'Pending').length;
    const groupsOwned = seedGroups.filter((g) => g.ownerId === userId).length;
    const groupsJoined = 2;
    const applicationsNeedingAction = seedApplications.filter(
      (a) => a.applicantId === userId && (a.status === 'NeedsSupplement' || a.status === 'Interview')
    ).length;
    const pendingMentoring = seedMentoringRequests.filter(
      (m) => (m.studentId === userId || m.mentorId === userId) && m.status === 'PENDING_MENTOR_RESPONSE'
    ).length;
    const myPosts = seedKnowledgePosts.filter((p) => p.authorId === userId && p.status === 'Published').length;
    const pendingReviewPosts = seedKnowledgePosts.filter((p) => p.authorId === userId && p.status === 'PendingReview').length;

    const actionItems = [
      {
        id: 'act_1',
        type: 'swap',
        title: 'Lời mời đổi lớp PRN231 đang chờ bạn xác nhận',
        count: pendingSwapConns || 2,
        linkTo: '/swap/connections',
      },
      {
        id: 'act_2',
        type: 'club',
        title: 'Đơn tuyển JS Club: Cần bổ sung CV hoặc có lịch phỏng vấn',
        count: 1,
        linkTo: '/applications',
      },
      {
        id: 'act_3',
        type: 'mentoring',
        title: 'Yêu cầu hỗ trợ CSD201 đang chờ Mentor phản hồi',
        count: 1,
        linkTo: '/mentoring/requests',
      },
      {
        id: 'act_4',
        type: 'group',
        title: 'Có 2 sinh viên gửi yêu cầu xin vào nhóm Capstone SWP391',
        count: 2,
        linkTo: '/groups/me',
      },
    ];

    const myClubs = seedClubs.slice(0, 2).map((c, i) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      role: i === 0 ? 'manager' : 'member',
    }));

    return HttpResponse.json({
      data: {
        actionItems,
        counts: {
          clubs: myClubs.length,
          groupsOwned: groupsOwned || 1,
          groupsJoined,
          openSwaps: openSwaps || 1,
          applicationsNeedingAction: applicationsNeedingAction || 1,
          pendingMentoring: pendingMentoring || 1,
          myPosts: myPosts || 3,
          pendingReviewPosts: pendingReviewPosts || 1,
        },
        clubs: myClubs,
      },
    });
  }),

  http.get('/api/v1/dashboard/summary', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const openSwaps = seedSwapRequests.filter((r) => r.studentId === userId && r.status === 'Open').length;
    const pendingSwapConns = seedSwapConnections.filter((c) => c.recipientId === userId && c.status === 'Pending').length;
    const pendingGroupRequests = seedJoinRequests.filter((r) => r.userId === userId && r.status === 'Pending').length;
    const myClubApps = seedApplications.filter((a) => a.applicantId === userId).length;
    const pendingMentoring = seedMentoringRequests.filter(
      (m) => (m.studentId === userId || m.mentorId === userId) && m.status === 'PENDING_MENTOR_RESPONSE'
    ).length;
    const upcomingEvents = seedClubEvents.filter((e) => e.status !== 'Finished').length;
    const recentPosts = seedKnowledgePosts.filter((p) => p.status === 'Published').length;

    const actionItems = [
      ...(pendingSwapConns > 0
        ? [{ id: 'act_1', title: 'Lời mời đổi lớp môn SWP391 đang chờ bạn phản hồi', linkTo: '/swap/connections', type: 'swap', time: 'Hôm nay' }]
        : []),
      ...(pendingMentoring > 0
        ? [{ id: 'act_2', title: 'Yêu cầu Mentoring đang chờ phản hồi', linkTo: '/mentoring/requests', type: 'mentoring', time: '1 ngày trước' }]
        : []),
      ...(pendingGroupRequests > 0
        ? [{ id: 'act_3', title: 'Yêu cầu tham gia nhóm đang được duyệt', linkTo: '/groups/me', type: 'group', time: '2 ngày trước' }]
        : []),
    ];

    return HttpResponse.json({
      data: {
        metrics: {
          openSwaps,
          pendingSwapConns,
          pendingGroupRequests,
          myClubApps,
          pendingMentoring,
          upcomingEvents,
          recentPosts,
        },
        actionItems,
      },
    });
  }),
];
