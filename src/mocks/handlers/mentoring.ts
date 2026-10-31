import { http, HttpResponse } from 'msw';
import {
  seedClassSessions,
  seedMentors,
  seedMentoringComments,
  seedMentoringPosts,
  seedMentoringRequests,
  seedMentorCourses,
  seedMentorProfileSections,
  seedMentorReviews,
} from '../data/mentoring';
import { mockDelay, isScenarioActive, getViewerId } from '../utils';
import { seedUsers } from '../data/users';
import { parseMentorQuery, rankMentors } from '../aiMentorMatching';
import { isConnectionExpired } from '../../features/mentoring/classRules';
import type {
  Mentor,
  MentorPost,
  MentoringPost,
  MentorCourse,
  MentorProfileSection,
  MentorReview,
  MentoringClass,
  MentoringRequest,
  AiMentorCriteria,
  AiMentorSearchResult,
  Comment,
} from '@/types/entities';

const toClass = (req: MentoringRequest): MentoringClass => ({
  request: req,
  startedAt: req.classStartedAt,
  mentorId: req.mentorId,
  studentId: req.studentId,
  classmateIds: req.sourcePostId
    ? seedMentoringRequests
        .filter((item) => item.sourcePostId === req.sourcePostId && item.id !== req.id && item.status === 'ACCEPTED' && item.classStartedAt)
        .map((item) => item.studentId)
    : [],
  sessions: seedClassSessions
    .filter((session) => session.requestId === req.id)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
});

const lockedConnectionError = (req?: MentoringRequest) => {
  if (req?.status === 'EXPIRED') {
    return classError('CONNECTION_EXPIRED', 'Kết nối đã hết hạn nên không thể bắt đầu lớp, ghi nhận buổi hay kết thúc.', 409);
  }
  if (req?.status === 'ENDED') {
    return classError('CONNECTION_ENDED', 'Kết nối đã kết thúc nên yêu cầu này đã khóa.', 409);
  }
  return null;
};

const ANONYMOUS_AUTHOR = 'Học viên ẩn danh';

// Trả lại chỗ trên lớp mở theo bài đăng khi kết nối kết thúc hoặc hết hạn trước khi bắt đầu lớp
const releaseSeat = (req: MentoringRequest) => {
  const post = req.sourcePostId ? seedMentoringPosts.find((item) => item.id === req.sourcePostId) : undefined;
  if (!post || post.postType !== 'OFFER_MENTORING') return;
  post.filledCount = Math.max(0, (post.filledCount || 0) - 1);
  if (post.status === 'FILLED') {
    post.status = 'PUBLISHED';
    post.open = true;
  }
};

// Mock không có đồng hồ chạy ngầm nên kết nối quá hạn được đánh dấu ngay khi có ai đọc hoặc thao tác
const expireStaleConnections = () => {
  const now = Date.now();
  seedMentoringRequests.forEach((req) => {
    if (!isConnectionExpired(req, now)) return;
    req.status = 'EXPIRED';
    req.expiredAt = new Date(now).toISOString();
    releaseSeat(req);
  });
};

const findConnectionRequest = (id: string) => {
  expireStaleConnections();
  return seedMentoringRequests.find(
    (item) => item.id === id && (item.status === 'ACCEPTED' || item.status === 'EXPIRED' || item.status === 'ENDED')
  );
};

const classError = (code: string, message: string, status: number) =>
  HttpResponse.json({ error: { code, message } }, { status });

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
      // Chỉ Mentor được mở lớp; ai cũng đăng được bài tìm người kèm
      postType: body.authorRole === 'mentor' && body.postType !== 'NEED_MENTOR' ? 'OFFER_MENTORING' : 'NEED_MENTOR',
      subject: body.subject,
      modes: body.modes,
      // Chỉ lưu cơ sở khi có hình thức gặp tại trường
      campus: body.modes?.includes('offline') ? body.campus : undefined,
      schedule: body.schedule,
      fee: body.fee,
      sessions: body.sessions,
      trial: body.trial,
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

  // Bài nhờ kèm của người đang đăng nhập, gồm cả bài đã đóng, để quản lý ở trang Yêu cầu
  http.get('/api/v1/mentoring/posts/mine', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    return HttpResponse.json({
      data: seedMentoringPosts.filter((post) => post.postType === 'NEED_MENTOR' && (post.authorId || post.mentorId) === userId),
    });
  }),

  // Chủ bài sửa nội dung hoặc đóng/mở lại bài
  http.put('/api/v1/mentoring/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const body = (await request.json()) as Partial<MentoringPost>;
    const post = seedMentoringPosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Bài đăng không tồn tại' } }, { status: 404 });
    }
    if ((post.authorId || post.mentorId) !== userId) {
      return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ người đăng được sửa bài' } }, { status: 403 });
    }
    const content = body.content ?? body.contentMd;
    Object.assign(post, body, content === undefined ? {} : { content, contentMd: content });
    return HttpResponse.json({ data: post });
  }),

  // Chủ bài xóa bài nhờ kèm; bài đã có lớp học thì không xóa, các đề nghị đang chờ bị từ chối
  http.delete('/api/v1/mentoring/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const index = seedMentoringPosts.findIndex((p) => p.id === params.id);
    if (index < 0) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Bài đăng không tồn tại' } }, { status: 404 });
    }
    const post = seedMentoringPosts[index];
    if ((post.authorId || post.mentorId) !== userId) {
      return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ người đăng được xóa bài' } }, { status: 403 });
    }
    const related = seedMentoringRequests.filter((item) => item.sourcePostId === post.id);
    if (related.some((item) => item.status === 'ACCEPTED')) {
      return HttpResponse.json(
        { error: { code: 'POST_HAS_CLASS', message: 'Bài đã có Mentor nhận kèm nên không xóa được. Hãy đóng bài.' } },
        { status: 409 }
      );
    }
    related
      .filter((item) => item.status === 'PENDING_MENTOR_RESPONSE')
      .forEach((item) => {
        item.status = 'REJECTED';
        item.rejectReason = 'Người đăng đã xóa bài nhờ kèm.';
      });
    seedMentoringPosts.splice(index, 1);
    return HttpResponse.json({ data: { id: post.id } });
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

  // Body: { query } lần đầu, hoặc { criteria } khi học viên đã sửa tiêu chí
  http.post('/api/v1/mentoring/ai-search', async ({ request }) => {
    if (isScenarioActive('ai_timeout')) {
      await mockDelay(2000, 3000);
      return HttpResponse.json(
        { error: { code: 'AI_TIMEOUT', message: 'Dịch vụ gợi ý AI không phản hồi kịp thời' } },
        { status: 504 }
      );
    }
    await mockDelay(500, 900);

    const body = (await request.json()) as { query?: string; criteria?: AiMentorCriteria };
    const criteria = body.criteria ?? parseMentorQuery(body.query || '');
    const result: AiMentorSearchResult = { criteria, matches: rankMentors(seedMentors, criteria) };
    return HttpResponse.json({ data: result });
  }),

  http.get('/api/v1/mentoring/requests/me', async ({ request }) => {
    await mockDelay();
    expireStaleConnections();
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
        { error: { code: 'INVALID_DEADLINE', message: 'Hạn phản hồi phải là một ngày trong tương lai.' } },
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
      planType: body.planType,
      packageId: body.packageId,
      planSummary: body.planSummary,
      totalSessions: body.totalSessions,
      preferredTime: body.preferredTime,
      deadline: body.deadline,
      status: 'PENDING_MENTOR_RESPONSE',
      createdAt: new Date().toISOString(),
    };
    seedMentoringRequests.unshift(newReq);
    return HttpResponse.json({ data: newReq });
  }),

  // Lớp học: sổ buổi học giữa Mentor và học viên sau khi đã kết nối
  http.get('/api/v1/mentoring/classes', async ({ request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    expireStaleConnections();
    const classes = seedMentoringRequests
      .filter((item) => (item.status === 'ACCEPTED' || item.status === 'EXPIRED') && (item.mentorId === userId || item.studentId === userId))
      .map(toClass);
    return HttpResponse.json({ data: classes });
  }),

  // Mentor toàn quyền bắt đầu lớp sau khi hai bên đã nhắn tin chốt gói và giờ
  http.post('/api/v1/mentoring/classes/:requestId/start', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const req = findConnectionRequest(String(params.requestId));
    const locked = lockedConnectionError(req);
    if (locked) return locked;
    if (!req) return classError('NOT_FOUND', 'Yêu cầu không tồn tại hoặc chưa được kết nối.', 404);
    if (req.mentorId !== userId) return classError('FORBIDDEN', 'Chỉ Mentor được bắt đầu lớp học.', 403);
    if (req.classStartedAt) return classError('ALREADY_STARTED', 'Lớp học đã được bắt đầu.', 409);
    req.classStartedAt = new Date().toISOString();
    return HttpResponse.json({ data: toClass(req) });
  }),

  // Hai bên không chốt được thì một trong hai kết thúc kết nối trước khi lớp bắt đầu; chỗ trên bài đăng được trả lại
  http.post('/api/v1/mentoring/classes/:requestId/end', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const req = findConnectionRequest(String(params.requestId));
    const locked = lockedConnectionError(req);
    if (locked) return locked;
    if (!req) return classError('NOT_FOUND', 'Yêu cầu không tồn tại hoặc chưa được kết nối.', 404);
    if (req.mentorId !== userId && req.studentId !== userId) return classError('FORBIDDEN', 'Bạn không thuộc kết nối này.', 403);
    if (req.classStartedAt) return classError('ALREADY_STARTED', 'Lớp học đã bắt đầu nên không kết thúc kết nối được.', 409);
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    req.status = 'ENDED';
    req.endedBy = userId;
    req.endedReason = body.reason?.trim() || undefined;

    releaseSeat(req);
    return HttpResponse.json({ data: { request: req } });
  }),

  // Xác nhận đã học của lớp: Mentor hay học viên đều đề nghị được, bên kia xác nhận thì lớp được tính là đã học
  http.post('/api/v1/mentoring/classes/:requestId/sessions', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const req = findConnectionRequest(String(params.requestId));
    const locked = lockedConnectionError(req);
    if (locked) return locked;
    if (!req) return classError('NOT_FOUND', 'Lớp học không tồn tại hoặc chưa được kết nối.', 404);
    if (req.mentorId !== userId && req.studentId !== userId) return classError('FORBIDDEN', 'Bạn không thuộc lớp học này.', 403);
    if (!req.classStartedAt) return classError('NOT_STARTED', 'Mentor cần bắt đầu lớp học trước khi ghi nhận buổi.', 409);
    const body = (await request.json().catch(() => ({}))) as { startsAt?: string; note?: string };
    const startsAt = body.startsAt ?? new Date().toISOString();
    if (Number.isNaN(new Date(startsAt).getTime())) return classError('VALIDATION_ERROR', 'Ngày giờ của buổi học không hợp lệ.', 422);
    if (new Date(startsAt).getTime() > Date.now() + 5 * 60_000) {
      return classError('VALIDATION_ERROR', 'Chỉ ghi nhận được buổi đã diễn ra.', 422);
    }
    const sessions = seedClassSessions.filter((item) => item.requestId === req.id && item.status !== 'CANCELLED');
    if (sessions.some((item) => item.status === 'PENDING_CONFIRM')) {
      return classError('PENDING_EXISTS', 'Còn một buổi đang chờ xác nhận, hãy xử lý buổi đó trước.', 409);
    }
    // Lớp chỉ cần được xác nhận đã học một lần, không đếm buổi
    if (sessions.some((item) => item.status === 'DONE')) {
      return classError('ALREADY_CONFIRMED', 'Lớp này đã được xác nhận đã học.', 409);
    }
    seedClassSessions.push({
      id: `msess_${Date.now()}`,
      requestId: req.id,
      startsAt,
      createdBy: userId,
      note: body.note?.trim() || undefined,
      status: 'PENDING_CONFIRM',
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json({ data: toClass(req) });
  }),

  // Bên kia xác nhận hoặc báo chưa đúng; bên ghi nhận rút lại được khi chưa ai xác nhận
  http.post('/api/v1/mentoring/classes/:requestId/sessions/:sessionId/:action', async ({ params, request }) => {
    await mockDelay();
    const userId = getViewerId(request);
    const req = findConnectionRequest(String(params.requestId));
    const locked = lockedConnectionError(req);
    if (locked) return locked;
    const session = seedClassSessions.find((item) => item.id === params.sessionId && item.requestId === params.requestId);
    if (!req || !session) return classError('NOT_FOUND', 'Buổi học không tồn tại.', 404);
    if (req.mentorId !== userId && req.studentId !== userId) return classError('FORBIDDEN', 'Bạn không thuộc lớp học này.', 403);
    if (session.status !== 'PENDING_CONFIRM') return classError('INVALID_STATE', 'Buổi này không còn chờ xác nhận.', 409);
    const action = String(params.action);

    if (action === 'confirm' || action === 'dispute') {
      if (session.createdBy === userId) return classError('FORBIDDEN', 'Buổi do bạn ghi nhận, cần bên kia xác nhận.', 403);
      session.status = action === 'confirm' ? 'DONE' : 'CANCELLED';
    } else if (action === 'cancel') {
      if (session.createdBy !== userId) return classError('FORBIDDEN', 'Chỉ bên ghi nhận được rút lại.', 403);
      session.status = 'CANCELLED';
    } else {
      return classError('VALIDATION_ERROR', 'Thao tác không hợp lệ.', 422);
    }
    return HttpResponse.json({ data: toClass(req) });
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
    expireStaleConnections();
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
    req.connectedAt = new Date().toISOString();
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
  http.get('/api/v1/mentors/:id/reviews', async ({ params }) => {
    await mockDelay();
    // Đánh giá ẩn danh: không trả tên và ảnh người viết về client
    const reviews = seedMentorReviews
      .filter((review) => review.mentorId === params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((review) => ({ ...review, authorName: ANONYMOUS_AUTHOR, authorAvatarUrl: undefined }));
    return HttpResponse.json({ data: reviews });
  }),

  // Chỉ người đã "Đã kết nối" với Mentor mới đánh giá được, mỗi yêu cầu một lần
  http.post('/api/v1/mentors/:id/reviews', async ({ params, request }) => {
    await mockDelay();
    const viewerId = getViewerId(request);
    const body = (await request.json()) as { requestId?: string; rating?: number; tags?: string[]; comment?: string };
    const connection = seedMentoringRequests.find((item) => item.id === body.requestId);
    const connected = connection?.status === 'ACCEPTED' && connection.studentId === viewerId && connection.mentorId === params.id;
    if (!connection || !connected) {
      return HttpResponse.json(
        { error: { code: 'REVIEW_NOT_ALLOWED', message: 'Chỉ học viên đã kết nối với Mentor mới đánh giá được.' } },
        { status: 403 }
      );
    }
    // Phải có ít nhất 1 buổi học đã được học viên xác nhận
    if (!seedClassSessions.some((session) => session.requestId === connection.id && session.status === 'DONE')) {
      return HttpResponse.json(
        { error: { code: 'REVIEW_TOO_EARLY', message: 'Đánh giá mở sau buổi học đầu tiên được xác nhận.' } },
        { status: 403 }
      );
    }
    if (seedMentorReviews.some((review) => review.requestId === connection.id)) {
      return HttpResponse.json({ error: { code: 'REVIEW_EXISTS', message: 'Bạn đã đánh giá lần kết nối này rồi.' } }, { status: 409 });
    }
    const rating = Math.round(Number(body.rating));
    if (!(rating >= 1 && rating <= 5)) {
      return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Hãy chọn số sao từ 1 đến 5.' } }, { status: 422 });
    }
    const author = seedUsers.find((user) => user.id === viewerId);
    const review: MentorReview = {
      id: `mrev_${Date.now()}`,
      mentorId: String(params.id),
      requestId: connection.id,
      authorName: ANONYMOUS_AUTHOR,
      authorMajor: author ? [author.major, author.cohort].filter(Boolean).join(' · ') : undefined,
      rating,
      topic: connection.topic,
      tags: body.tags || [],
      comment: (body.comment || '').trim().slice(0, 300),
      createdAt: new Date().toISOString(),
    };
    seedMentorReviews.unshift(review);
    return HttpResponse.json({ data: review });
  }),

  // Mentor trả lời công khai một lần
  http.post('/api/v1/mentors/:id/reviews/:reviewId/reply', async ({ params, request }) => {
    await mockDelay();
    if (getViewerId(request) !== params.id) {
      return HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Chỉ Mentor được trả lời đánh giá của mình.' } }, { status: 403 });
    }
    const review = seedMentorReviews.find((item) => item.id === params.reviewId && item.mentorId === params.id);
    if (!review) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Đánh giá không tồn tại' } }, { status: 404 });
    }
    if (review.reply) {
      return HttpResponse.json({ error: { code: 'REPLY_EXISTS', message: 'Bạn đã trả lời đánh giá này.' } }, { status: 409 });
    }
    const body = (await request.json()) as { content?: string };
    review.reply = { content: (body.content || '').trim().slice(0, 300), createdAt: new Date().toISOString() };
    return HttpResponse.json({ data: review });
  }),

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
