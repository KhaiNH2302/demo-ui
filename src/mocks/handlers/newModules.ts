import { http, HttpResponse } from 'msw';
import { seedMentorApplications } from '../data/mentorApplications';
import { seedPublicEvents } from '../data/events';
import { seedOpportunities } from '../data/opportunities';
import { seedUsers } from '../data/users';
import { seedClubs } from '../data/clubs';
import { seedGroups } from '../data/groups';
import { seedKnowledgePosts } from '../data/knowledge';
import type { NavCounters, MentorApplication, KnowledgePost, User, Club, Group, ClubEvent } from '@/types/entities';

// In-memory mutable states
const mentorApplications: MentorApplication[] = [...seedMentorApplications];
const events = [...seedPublicEvents];
const followingUserIds = new Set<string>(['usr_mentor_02', 'usr_manager_03']);

export const newModulesHandlers = [
  // 1. Nav Counters (GET /nav/counters)
  http.get('/api/v1/nav/counters', () => {
    const myApp = mentorApplications.find((a) => a.userId === 'usr_student_01');
    const counters: NavCounters = {
      unreadNotifications: 3,
      unreadMessages: 2,
      pendingMessageRequests: 1,
      pendingGroupJoinRequests: 1,
      pendingSwapInvites: 1,
      pendingRequestsTotal: 4,
      pendingMentoringRequests: 2,
      todayRegisteredEvents: 1,
      clubsWithNewActivity: ['club_01'],
      mentorApplicationStatus: myApp?.status,
    };
    return HttpResponse.json({ data: counters });
  }),

  // 2. Global Search (GET /search and GET /search/suggest)
  http.get('/api/v1/search', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();

    const posts = seedKnowledgePosts
      .filter((p: KnowledgePost) =>
        (p.contentMd || p.title || '').toLowerCase().includes(q) ||
        (p.subject && p.subject.toLowerCase().includes(q))
      )
      .slice(0, 10);

    const students = seedUsers
      .filter((u: User) =>
        u.fullName.toLowerCase().includes(q) ||
        (u.studentCode && u.studentCode.toLowerCase().includes(q))
      )
      .slice(0, 10);

    const clubs = seedClubs
      .filter((c: Club) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const groups = seedGroups
      .filter((g: Group) =>
        g.name.toLowerCase().includes(q) ||
        g.topic.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const evts = events
      .filter((e: ClubEvent) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
      .slice(0, 10);

    const mentors = seedUsers
      .filter((u: User) =>
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
        events: evts,
        mentors,
        total: posts.length + students.length + clubs.length + groups.length + evts.length + mentors.length,
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

  // 3. Opportunities (GET /opportunities)
  http.get('/api/v1/opportunities', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const field = url.searchParams.get('field');

    let list = [...seedOpportunities];
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

  // 4. Public Events (GET /events, POST /events/:id/register)
  http.get('/api/v1/events', ({ request }) => {
    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') || 'upcoming';

    let list = [...events];
    if (tab === 'registered') {
      list = list.filter((e) => e.registeredByMe);
    } else if (tab === 'past') {
      list = list.filter((e) => e.status === 'Finished');
    } else {
      list = list.filter((e) => e.status !== 'Finished');
    }

    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/events/:id', ({ params }) => {
    const event = events.find((e) => e.id === params.id) || events[0];
    return HttpResponse.json({ data: event });
  }),

  http.post('/api/v1/events/:id/register', ({ params }) => {
    const idx = events.findIndex((e) => e.id === params.id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], registeredByMe: true, registeredCount: events[idx].registeredCount + 1 };
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  http.delete('/api/v1/events/:id/register', ({ params }) => {
    const idx = events.findIndex((e) => e.id === params.id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], registeredByMe: false, registeredCount: Math.max(0, events[idx].registeredCount - 1) };
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  // 5. People / Student Connection (GET /users/suggested)
  http.get('/api/v1/users/suggested', () => {
    const students = seedUsers.slice(0, 15).map((u) => ({
      ...u,
      isFollowing: followingUserIds.has(u.id),
      sharedTags: ['Cùng học CSD201', 'Kỹ thuật phần mềm', 'F-Code'],
      mutualConnectionsCount: 4,
    }));
    return HttpResponse.json({ data: students });
  }),

  http.get('/api/v1/users/me/following', () => {
    const list = seedUsers.filter((u) => followingUserIds.has(u.id)).map((u) => ({ ...u, isFollowing: true }));
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/users/me/followers', () => {
    const list = seedUsers.slice(2, 6).map((u) => ({ ...u, isFollowing: followingUserIds.has(u.id) }));
    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/users/:id/follow', ({ params }) => {
    followingUserIds.add(params.id as string);
    return HttpResponse.json({ data: { following: true } });
  }),

  http.delete('/api/v1/users/:id/follow', ({ params }) => {
    followingUserIds.delete(params.id as string);
    return HttpResponse.json({ data: { following: false } });
  }),

  // 6. Requests Management (GET /requests)
  http.get('/api/v1/requests', ({ request }) => {
    const url = new URL(request.url);
    const box = url.searchParams.get('box') || 'incoming';

    const items = [
      {
        id: 'req_01',
        module: 'swap',
        moduleLabel: 'Đổi lớp',
        title: 'Lời mời đổi lớp CSD201 (SE1701 ➔ SE1704)',
        fromUser: { id: 'usr_student_02', fullName: 'Trần Văn Bình', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
        createdAt: '2026-09-25T14:30:00Z',
        status: 'Pending',
        linkTo: '/swap/connections',
      },
      {
        id: 'req_02',
        module: 'group',
        moduleLabel: 'Nhóm kết nối',
        title: 'Yêu cầu gia nhập nhóm SWP391_G04',
        fromUser: { id: 'usr_student_06', fullName: 'Lê Hoàng Minh', avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
        createdAt: '2026-09-25T10:15:00Z',
        status: 'Pending',
        linkTo: '/groups/grp_01/manage',
      },
      {
        id: 'req_03',
        module: 'mentoring',
        moduleLabel: 'Mentoring',
        title: 'Đề nghị hỗ trợ môn CSD201: Cấu trúc dữ liệu cây AVL',
        fromUser: { id: 'usr_student_07', fullName: 'Phạm Thu Hương', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
        createdAt: '2026-09-24T18:00:00Z',
        status: 'PENDING_MENTOR_RESPONSE',
        linkTo: '/mentor/requests',
      },
      {
        id: 'req_04',
        module: 'chat',
        moduleLabel: 'Lời mời trò chuyện',
        title: 'Nguyễn Văn Minh muốn kết nối nhắn tin trực tiếp',
        fromUser: { id: 'usr_student_08', fullName: 'Nguyễn Văn Minh' },
        createdAt: '2026-09-26T08:00:00Z',
        status: 'pending',
        linkTo: '/chats',
      },
    ];

    if (box === 'outgoing') {
      return HttpResponse.json({
        data: [
          {
            id: 'req_out_01',
            module: 'club',
            moduleLabel: 'Đơn ứng tuyển CLB',
            title: 'Đơn ứng tuyển Ban Chuyên môn - CLB F-Code Gen 10',
            to: 'F-Code Club',
            createdAt: '2026-09-23T10:00:00Z',
            status: 'Submitted',
            linkTo: '/applications',
          },
          {
            id: 'req_out_02',
            module: 'mentor_apply',
            moduleLabel: 'Hồ sơ Mentor',
            title: 'Hồ sơ đăng ký trở thành Mentor SCS',
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
            module: 'swap',
            moduleLabel: 'Đổi lớp',
            title: 'Đã kết nối đổi lớp PRJ301 với Lê Nam',
            createdAt: '2026-09-18T10:00:00Z',
            status: 'Confirmed',
            linkTo: '/swap/connections',
          },
        ],
      });
    }

    return HttpResponse.json({ data: items });
  }),

  // 7. Student Mentor Application (GET /mentor/applications/me, PUT, POST)
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
          yearOrGraduation: 'Năm 3 (K17)',
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
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Chưa có hồ sơ' } }, { status: 404 });
  }),

  http.post('/api/v1/mentor/applications/me/withdraw', () => {
    const idx = mentorApplications.findIndex((a) => a.userId === 'usr_student_01');
    if (idx !== -1) {
      mentorApplications[idx].status = 'Withdrawn';
      return HttpResponse.json({ data: mentorApplications[idx] });
    }
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } }, { status: 404 });
  }),

  // 8. Admin Mentor Applications Review (GET /admin/mentor-applications, POST approve/request-info/reject)
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
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } }, { status: 404 });
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
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } }, { status: 404 });
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
    return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy hồ sơ' } }, { status: 404 });
  }),
];
