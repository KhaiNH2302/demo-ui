import { http, HttpResponse } from 'msw';
import { seedSwapRequests, seedSwapConnections } from '../data/swap';
import { seedJoinRequests } from '../data/groups';
import { seedApplications, seedClubEvents } from '../data/clubs';
import { seedMentoringRequests } from '../data/mentoring';
import { seedKnowledgePosts } from '../data/knowledge';
import { mockDelay } from '../utils';

export const dashboardHandlers = [
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
