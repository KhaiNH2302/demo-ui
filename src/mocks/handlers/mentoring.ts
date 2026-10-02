import { http, HttpResponse } from 'msw';
import {
  seedMentors,
  seedMentoringPosts,
  seedMentoringRequests,
  seedMentorCourses,
  seedMentorProfileSections,
} from '../data/mentoring';
import { seedConversations, seedMessages } from '../data/conversations';
import { mockDelay, isScenarioActive } from '../utils';
import type {
  Mentor,
  MentorPost,
  MentoringPost,
  MentorCourse,
  MentorProfileSection,
  MentoringRequest,
  AiMentorMatch,
} from '@/types/entities';

export const mentoringHandlers = [
  // Student side
  http.get('/api/v1/mentoring/mentors', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedMentors });
  }),

  http.get('/api/v1/mentoring/mentors/:id', async ({ params }) => {
    await mockDelay();
    const mentor = seedMentors.find((m) => m.userId === params.id);
    if (!mentor) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Mentor không tồn tại' } }, { status: 404 });
    }
    const posts = seedMentoringPosts.filter((p) => p.mentorId === params.id);
    return HttpResponse.json({ data: { mentor, posts } });
  }),

  http.get('/api/v1/mentoring/posts', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedMentoringPosts.filter((p) => p.open !== false) });
  }),

  http.get('/api/v1/mentoring/posts/:id', async ({ params }) => {
    await mockDelay();
    const post = seedMentoringPosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Bài đăng không tồn tại' } }, { status: 404 });
    }
    const mentor = seedMentors.find((m) => m.userId === post.mentorId);
    return HttpResponse.json({
      data: {
        post: {
          ...post,
          content: post.content || post.contentMd,
        },
        mentor,
      },
    });
  }),

  http.post('/api/v1/mentoring/ai-search', async () => {
    if (isScenarioActive('ai_timeout')) {
      await mockDelay(2000, 3000);
      return HttpResponse.json(
        { error: { code: 'AI_TIMEOUT', message: 'Dịch vụ gợi ý AI không phản hồi kịp thời' } },
        { status: 504 }
      );
    }
    await mockDelay(300, 500);

    const matches: AiMentorMatch[] = seedMentors.map((m) => ({
      mentorId: m.userId,
      score: 95,
      confidence: 0.92,
      reasons: [
        'Kinh nghiệm chuyên sâu môn CSD201 và PRJ301',
        'Hình thức hỗ trợ phù hợp (Online + Chat)',
        'Khung giờ rảnh tối T3/T5 tương thích 100%',
      ],
    }));

    return HttpResponse.json({ data: matches });
  }),

  http.get('/api/v1/mentoring/requests/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const reqs = seedMentoringRequests.filter((r) => r.studentId === userId);
    return HttpResponse.json({ data: reqs });
  }),

  http.post('/api/v1/mentoring/requests', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Omit<MentoringRequest, 'id' | 'studentId' | 'status' | 'createdAt'>;

    const newReq: MentoringRequest = {
      id: `mreq_${Date.now()}`,
      studentId: userId,
      mentorId: body.mentorId,
      topic: body.topic,
      content: body.content,
      preferredTime: body.preferredTime,
      status: 'PENDING_MENTOR_RESPONSE',
      createdAt: new Date().toISOString(),
    };
    seedMentoringRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  // Mentor Center
  http.get('/api/v1/mentor/profile', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_mentor_02';
    const mentor = seedMentors.find((m) => m.userId === userId);
    return HttpResponse.json({ data: mentor || null });
  }),

  http.put('/api/v1/mentor/profile', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_mentor_02';
    const body = (await request.json()) as Partial<Mentor>;

    let mentor = seedMentors.find((m) => m.userId === userId);
    if (!mentor) {
      mentor = {
        userId,
        fields: body.fields || [],
        subjects: body.subjects || [],
        experience: body.experience || '',
        availability: body.availability || [],
        supportModes: body.supportModes || ['online', 'chat'],
        acceptingRequests: true,
      };
      seedMentors.push(mentor);
    } else {
      Object.assign(mentor, body);
    }
    return HttpResponse.json({ data: mentor });
  }),

  http.get('/api/v1/mentor/posts', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_mentor_02';
    const posts = seedMentoringPosts.filter((p) => p.mentorId === userId);
    return HttpResponse.json({ data: posts });
  }),

  http.post('/api/v1/mentor/posts', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_mentor_02';
    const body = (await request.json()) as Omit<MentoringPost, 'id' | 'mentorId'>;

    const newPost: MentoringPost = {
      id: `mpost_${Date.now()}`,
      mentorId: userId,
      title: body.title,
      content: body.content,
      contentMd: body.contentMd || body.content || '',
      field: body.field,
      mode: body.mode,
      slots: body.slots,
      open: true,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    seedMentoringPosts.unshift(newPost);
    return HttpResponse.json({ data: newPost });
  }),

  http.put('/api/v1/mentor/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<MentoringPost>;
    const post = seedMentoringPosts.find((p) => p.id === params.id);
    if (post) Object.assign(post, body);
    return HttpResponse.json({ data: post });
  }),

  http.get('/api/v1/mentor/requests', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_mentor_02';
    const reqs = seedMentoringRequests.filter((r) => r.mentorId === userId);
    return HttpResponse.json({ data: reqs });
  }),

  http.post('/api/v1/mentor/requests/:id/accept', async ({ params }) => {
    await mockDelay();
    const req = seedMentoringRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }
    req.status = 'ACCEPTED';

    const newConv = {
      id: `conv_${Date.now()}`,
      kind: 'mentoring' as const,
      refId: req.id,
      title: `Mentoring: ${req.topic}`,
      participantIds: [req.studentId, req.mentorId],
      lastMessage: 'Mentor đã chấp nhận yêu cầu của bạn. Hãy trao đổi tại đây!',
      lastMessageAt: new Date().toISOString(),
    };
    seedConversations.push(newConv);

    seedMessages.push({
      id: `msg_${Date.now()}`,
      conversationId: newConv.id,
      senderId: req.mentorId,
      content: `Chào bạn, mình đã nhận yêu cầu về chủ đề "${req.topic}". Chúng ta trao đổi lịch cụ thể nhé!`,
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json({ data: { request: req, conversationId: newConv.id } });
  }),

  http.post('/api/v1/mentor/requests/:id/reject', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { reason?: string };
    const req = seedMentoringRequests.find((r) => r.id === params.id);
    if (req) {
      req.status = 'REJECTED';
      req.rejectReason = body.reason;
    }
    return HttpResponse.json({ data: req });
  }),

  // Mentor Courses
  http.get('/api/v1/mentors/:id/courses', async ({ params }) => {
    await mockDelay();
    const courses = seedMentorCourses.filter((c) => c.mentorId === params.id);
    return HttpResponse.json({ data: courses });
  }),

  http.post('/api/v1/mentor-courses/:id/enroll', async ({ params }) => {
    await mockDelay();
    const course = seedMentorCourses.find((c) => c.id === params.id);
    if (!course) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Khóa học không tồn tại' } }, { status: 404 });
    }
    course.enrolled = Math.min(course.slots, course.enrolled + 1);
    return HttpResponse.json({ data: course });
  }),

  http.post('/api/v1/mentor-courses', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<MentorCourse>;
    const newCourse: MentorCourse = {
      id: `mcourse_${Date.now()}`,
      mentorId: body.mentorId || 'usr_mentor_02',
      title: body.title || 'Khóa học mới',
      description: body.description || '',
      subjectOrField: body.subjectOrField || 'Công nghệ thông tin',
      mode: body.mode || 'online',
      schedule: body.schedule || 'Lịch linh hoạt',
      slots: body.slots || 10,
      enrolled: 0,
      open: true,
      createdAt: new Date().toISOString(),
    };
    seedMentorCourses.unshift(newCourse);
    return HttpResponse.json({ data: newCourse });
  }),

  http.put('/api/v1/mentor-courses/:id', async ({ params, request }) => {
    await mockDelay();
    const course = seedMentorCourses.find((c) => c.id === params.id);
    if (!course) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Khóa học không tồn tại' } }, { status: 404 });
    }
    const body = (await request.json()) as Partial<MentorCourse>;
    Object.assign(course, body);
    return HttpResponse.json({ data: course });
  }),

  // Mentor Profile Sections
  http.get('/api/v1/mentors/:id/profile-sections', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedMentorProfileSections });
  }),

  http.put('/api/v1/mentors/:id/profile-sections', async ({ request }) => {
    await mockDelay();
    const body = (await request.json()) as { sections: MentorProfileSection[] };
    if (body.sections) {
      seedMentorProfileSections.length = 0;
      seedMentorProfileSections.push(...body.sections);
    }
    return HttpResponse.json({ data: seedMentorProfileSections });
  }),

  // Mentor Posts
  http.get('/api/v1/mentors/:id/posts', async ({ params }) => {
    await mockDelay();
    const posts = seedMentoringPosts.filter((p) => p.mentorId === params.id);
    return HttpResponse.json({ data: posts });
  }),

  http.post('/api/v1/mentors/:id/posts', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<MentorPost>;
    const newPost: MentorPost = {
      id: `mpost_${Date.now()}`,
      mentorId: (params.id as string) || 'usr_mentor_02',
      authorId: (params.id as string) || 'usr_mentor_02',
      title: body.title || 'Bài chia sẻ',
      contentMd: body.contentMd || '',
      field: body.field || 'Học thuật',
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      tags: body.tags || [],
    };
    seedMentoringPosts.unshift(newPost);
    return HttpResponse.json({ data: newPost });
  }),
];
