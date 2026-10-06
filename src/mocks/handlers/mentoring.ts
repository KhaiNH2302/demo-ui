import { http, HttpResponse } from 'msw';
import {
  seedMentors,
  seedMentoringComments,
  seedMentoringPosts,
  seedMentoringRequests,
  seedMentorCourses,
  seedMentorProfileSections,
} from '../data/mentoring';
import { mockDelay, isScenarioActive, getViewerId } from '../utils';
import type {
  Mentor,
  MentorPost,
  MentoringPost,
  MentorCourse,
  MentorProfileSection,
  MentoringRequest,
  AiMentorMatch,
  Comment,
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
    return HttpResponse.json({
      data: seedMentoringPosts.filter(
        (post) => post.open !== false && (!post.status || post.status === 'PUBLISHED')
      ),
    });
  }),

  http.post('/api/v1/mentoring/posts', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const body = (await request.json()) as Partial<MentoringPost>;
    const capacity = Math.max(1, Number(body.capacity || body.slots || 1));
    const newPost: MentoringPost = {
      id: `mpost_${Date.now()}`,
      mentorId: userId,
      authorId: userId,
      authorRole: body.authorRole === 'mentor' ? 'mentor' : 'student',
      postType: body.authorRole === 'mentor' ? 'OFFER_MENTORING' : 'NEED_MENTOR',
      title: body.title || '',
      content: body.content || body.contentMd || '',
      contentMd: body.contentMd || body.content || '',
      field: body.field || 'Mentoring',
      mode: body.mode || 'online',
      slots: capacity,
      capacity,
      filledCount: 0,
      deadline: body.deadline,
      status: 'PUBLISHED',
      open: true,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      tags: body.tags || [],
    };
    seedMentoringPosts.unshift(newPost);
    return HttpResponse.json({ data: newPost });
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

  http.get('/api/v1/mentoring/comments', async () => {
    await mockDelay();
    return HttpResponse.json({ data: seedMentoringComments });
  }),

  http.post('/api/v1/mentoring/posts/:id/like', async ({ params }) => {
    await mockDelay();
    const post = seedMentoringPosts.find((item) => item.id === params.id);
    if (post && !post.liked) {
      post.liked = true;
      post.likeCount += 1;
    }
    return HttpResponse.json({ data: { liked: true, likeCount: post?.likeCount || 0 } });
  }),

  http.delete('/api/v1/mentoring/posts/:id/like', async ({ params }) => {
    await mockDelay();
    const post = seedMentoringPosts.find((item) => item.id === params.id);
    if (post?.liked) {
      post.liked = false;
      post.likeCount = Math.max(0, post.likeCount - 1);
    }
    return HttpResponse.json({ data: { liked: false, likeCount: post?.likeCount || 0 } });
  }),

  http.post('/api/v1/mentoring/posts/:id/comments', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { content: string; parentId?: string };
    const newComment: Comment = {
      id: `mcmt_${Date.now()}`,
      postId: params.id as string,
      authorId: getViewerId(request),
      content: body.content,
      parentId: body.parentId,
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };
    seedMentoringComments.push(newComment);
    const post = seedMentoringPosts.find((item) => item.id === params.id);
    if (post) post.commentCount += 1;
    return HttpResponse.json({ data: newComment });
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
        'Hình thức hỗ trợ phù hợp với nhu cầu đã nhập',
      ],
    }));

    return HttpResponse.json({ data: matches });
  }),

  http.get('/api/v1/mentoring/requests/me', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const reqs = seedMentoringRequests.filter(
      (item) =>
        item.requesterId === userId ||
        item.recipientId === userId ||
        (!item.requesterId && item.studentId === userId)
    );
    return HttpResponse.json({ data: reqs });
  }),

  http.post('/api/v1/mentoring/requests', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const body = (await request.json()) as Omit<MentoringRequest, 'id' | 'studentId' | 'status' | 'createdAt'>;

    const sourcePost = body.sourcePostId
      ? seedMentoringPosts.find((post) => post.id === body.sourcePostId)
      : undefined;
    const recipientId = body.recipientId || body.mentorId;
    const requesterIsMentor = sourcePost?.postType === 'NEED_MENTOR';
    if (!body.deadline || new Date(body.deadline).getTime() <= Date.now()) {
      return HttpResponse.json(
        { error: { code: 'INVALID_DEADLINE', message: 'Deadline phản hồi không hợp lệ.' } },
        { status: 422 }
      );
    }
    if (sourcePost) {
      const postCapacity = sourcePost.capacity || sourcePost.slots || 1;
      const postFilled = sourcePost.filledCount || 0;
      const postExpired = Boolean(
        sourcePost.deadline && new Date(sourcePost.deadline).getTime() <= Date.now()
      );
      if (
        sourcePost.status !== 'PUBLISHED' ||
        sourcePost.open === false ||
        postFilled >= postCapacity ||
        postExpired
      ) {
        return HttpResponse.json(
          { error: { code: 'POST_NOT_AVAILABLE', message: 'Bài đăng không còn hiệu lực hoặc đã đủ capacity.' } },
          { status: 409 }
        );
      }
    } else {
      const mentor = seedMentors.find((item) => item.userId === recipientId);
      if (!mentor?.acceptingRequests) {
        return HttpResponse.json(
          { error: { code: 'MENTOR_UNAVAILABLE', message: 'Mentor hiện không nhận thêm yêu cầu.' } },
          { status: 409 }
        );
      }
    }
    const duplicate = seedMentoringRequests.some(
      (item) =>
        item.status === 'PENDING_MENTOR_RESPONSE' &&
        (item.requesterId || item.studentId) === userId &&
        (item.recipientId || item.mentorId) === recipientId &&
        item.sourcePostId === body.sourcePostId
    );
    if (duplicate) {
      return HttpResponse.json(
        { error: { code: 'DUPLICATE_REQUEST', message: 'Bạn đã có một yêu cầu đang chờ phản hồi.' } },
        { status: 409 }
      );
    }

    const newReq: MentoringRequest = {
      id: `mreq_${Date.now()}`,
      studentId: requesterIsMentor ? recipientId : userId,
      mentorId: requesterIsMentor ? userId : recipientId,
      requesterId: userId,
      recipientId,
      sourceType: body.sourcePostId ? 'POST' : 'DIRECT',
      sourcePostId: body.sourcePostId,
      topic: body.topic,
      content: body.content,
      deadline: body.deadline,
      status: 'PENDING_MENTOR_RESPONSE',
      createdAt: new Date().toISOString(),
    };
    seedMentoringRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  // Mentor Center
  http.get('/api/v1/mentor/profile', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request, 'usr_mentor_02');
    const mentor = seedMentors.find((m) => m.userId === userId);
    return HttpResponse.json({ data: mentor || null });
  }),

  http.put('/api/v1/mentor/profile', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request, 'usr_mentor_02');
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
    const userId = getViewerId(request, 'usr_mentor_02');
    const posts = seedMentoringPosts.filter((p) => p.mentorId === userId);
    return HttpResponse.json({ data: posts });
  }),

  http.post('/api/v1/mentor/posts', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request, 'usr_mentor_02');
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
    const userId = getViewerId(request, 'usr_mentor_02');
    const reqs = seedMentoringRequests.filter(
      (item) => item.recipientId === userId || (!item.recipientId && item.mentorId === userId)
    );
    return HttpResponse.json({ data: reqs });
  }),

  http.post('/api/v1/mentor/requests/:id/accept', async ({ params }) => {
    await mockDelay();
    const req = seedMentoringRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }
    if (req.status !== 'PENDING_MENTOR_RESPONSE') {
      // FE-05 bước 10: request đã xử lý / hết hạn → không xử lý lại, trả về trạng thái hiện tại
      return HttpResponse.json(
        { error: { code: 'MENTORING_REQUEST_NOT_PENDING', message: 'Yêu cầu đã được xử lý hoặc hết hạn', details: { status: req.status } } },
        { status: 409 }
      );
    }
    if (req.deadline && new Date(req.deadline).getTime() < Date.now()) {
      return HttpResponse.json(
        { error: { code: 'REQUEST_EXPIRED', message: 'Yêu cầu đã hết deadline' } },
        { status: 409 }
      );
    }
    const sourcePost = req.sourcePostId
      ? seedMentoringPosts.find((post) => post.id === req.sourcePostId)
      : undefined;
    if (sourcePost) {
      const capacity = sourcePost.capacity || sourcePost.slots || 1;
      const filled = sourcePost.filledCount || 0;
      if (filled >= capacity || sourcePost.status !== 'PUBLISHED') {
        return HttpResponse.json(
          { error: { code: 'POST_CAPACITY_REACHED', message: 'Bài đăng không còn capacity' } },
          { status: 409 }
        );
      }
      sourcePost.filledCount = filled + 1;
      if (sourcePost.filledCount >= capacity) {
        sourcePost.status = 'FILLED';
        sourcePost.open = false;
      }
    }
    req.status = 'ACCEPTED';
    req.connectionId = `mconn_${Date.now()}`;

    return HttpResponse.json({ data: { request: req, connectionId: req.connectionId } });
  }),

  http.post('/api/v1/mentor/requests/:id/reject', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { reason?: string };
    const req = seedMentoringRequests.find((r) => r.id === params.id);
    if (!req) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Yêu cầu không tồn tại' } }, { status: 404 });
    }
    if (req.status !== 'PENDING_MENTOR_RESPONSE') {
      // FE-05 bước 10: request đã xử lý / hết hạn → không xử lý lại, trả về trạng thái hiện tại
      return HttpResponse.json(
        { error: { code: 'MENTORING_REQUEST_NOT_PENDING', message: 'Yêu cầu đã được xử lý hoặc hết hạn', details: { status: req.status } } },
        { status: 409 }
      );
    }
    req.status = 'REJECTED';
    req.rejectReason = body.reason;
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
