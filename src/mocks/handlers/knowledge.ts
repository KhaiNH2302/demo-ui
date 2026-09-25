import { http, HttpResponse } from 'msw';
import { seedKnowledgePosts, seedComments, seedReports } from '../data/knowledge';
import { mockDelay, isScenarioActive } from '../utils';
import type { KnowledgePost, Comment, ViolationReport } from '@/types/entities';

// In-memory set of followed subjects and saved post IDs for mock session
const followedSubjects = new Set<string>(['CSD201', 'SWP391']);
const savedPostIds = new Set<string>(['post_01', 'post_04', 'post_08']);

export const knowledgeHandlers = [
  // GET /api/v1/posts
  http.get('/api/v1/posts', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const subject = url.searchParams.get('subject');
    const q = url.searchParams.get('q');
    const tag = url.searchParams.get('tag');
    const sort = url.searchParams.get('sort'); // 'hot' | 'new' | 'unanswered'
    const authorId = url.searchParams.get('authorId');

    let list = seedKnowledgePosts.filter((p) => p.status === 'Published');

    if (authorId) list = list.filter((p) => p.authorId === authorId);
    if (type && type !== 'all') list = list.filter((p) => p.type === type);
    if (subject) list = list.filter((p) => p.subject === subject || p.subjectCode === subject);
    if (tag) list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(lower)) ||
          p.contentMd.toLowerCase().includes(lower) ||
          (p.subject && p.subject.toLowerCase().includes(lower))
      );
    }

    if (sort === 'unanswered') {
      list = list.filter((p) => p.type === 'question' && p.commentCount === 0);
    } else if (sort === 'hot') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Attach user saved state
    const mapped = list.map((p) => ({
      ...p,
      savedByMe: savedPostIds.has(p.id),
    }));

    return HttpResponse.json({ data: mapped });
  }),

  // POST /api/v1/posts
  http.post('/api/v1/posts', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Omit<
      KnowledgePost,
      'id' | 'authorId' | 'status' | 'commentCount' | 'createdAt' | 'updatedAt'
    >;

    const shouldAutoFlag = isScenarioActive('post_auto_flagged');

    const newPost: KnowledgePost = {
      id: `post_${Date.now()}`,
      authorId: userId,
      type: body.type || 'discussion',
      title: body.title,
      contentMd: body.contentMd,
      subject: body.subject,
      subjectCode: body.subject,
      tags: body.tags || [],
      images: body.images || [],
      attachments: body.attachments || [],
      visibility: body.visibility || 'school',
      status: shouldAutoFlag ? 'PendingReview' : 'Published',
      likesCount: 0,
      likedByMe: false,
      savedByMe: false,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seedKnowledgePosts.unshift(newPost);
    return HttpResponse.json({ data: newPost });
  }),

  // GET /api/v1/posts/me
  http.get('/api/v1/posts/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let list = seedKnowledgePosts.filter((p) => p.authorId === userId);
    if (status) {
      list = list.filter((p) => p.status === status);
    }
    const mapped = list.map((p) => ({
      ...p,
      savedByMe: savedPostIds.has(p.id),
    }));
    return HttpResponse.json({ data: mapped });
  }),

  // GET /api/v1/posts/saved
  http.get('/api/v1/posts/saved', async () => {
    await mockDelay();
    const list = seedKnowledgePosts
      .filter((p) => savedPostIds.has(p.id))
      .map((p) => ({ ...p, savedByMe: true }));
    return HttpResponse.json({ data: list });
  }),

  // GET /api/v1/posts/:id
  http.get('/api/v1/posts/:id', async ({ params }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Bài viết không tồn tại' } },
        { status: 404 }
      );
    }
    const comments = seedComments.filter((c) => c.postId === params.id);
    return HttpResponse.json({
      data: {
        post: { ...post, savedByMe: savedPostIds.has(post.id) },
        comments,
      },
    });
  }),

  // PUT /api/v1/posts/:id
  http.put('/api/v1/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<KnowledgePost>;
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Bài viết không tồn tại' } },
        { status: 404 }
      );
    }
    Object.assign(post, body);
    post.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: post });
  }),

  // DELETE /api/v1/posts/:id
  http.delete('/api/v1/posts/:id', async ({ params }) => {
    await mockDelay();
    const idx = seedKnowledgePosts.findIndex((p) => p.id === params.id);
    if (idx !== -1) {
      seedKnowledgePosts.splice(idx, 1);
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  // POST /api/v1/posts/:id/like
  http.post('/api/v1/posts/:id/like', async ({ params }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) {
      post.likesCount = (post.likesCount || 0) + 1;
      post.likedByMe = true;
    }
    return HttpResponse.json({ data: { liked: true, likesCount: post?.likesCount || 1 } });
  }),

  // DELETE /api/v1/posts/:id/like
  http.delete('/api/v1/posts/:id/like', async ({ params }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) {
      post.likesCount = Math.max(0, (post.likesCount || 0) - 1);
      post.likedByMe = false;
    }
    return HttpResponse.json({ data: { liked: false, likesCount: post?.likesCount || 0 } });
  }),

  // POST /api/v1/posts/:id/save
  http.post('/api/v1/posts/:id/save', async ({ params }) => {
    await mockDelay();
    const id = params.id as string;
    savedPostIds.add(id);
    return HttpResponse.json({ data: { saved: true } });
  }),

  // DELETE /api/v1/posts/:id/save
  http.delete('/api/v1/posts/:id/save', async ({ params }) => {
    await mockDelay();
    const id = params.id as string;
    savedPostIds.delete(id);
    return HttpResponse.json({ data: { saved: false } });
  }),

  // POST /api/v1/posts/:id/comments
  http.post('/api/v1/posts/:id/comments', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { content: string; parentId?: string };

    const newComment: Comment = {
      id: `cmt_${Date.now()}`,
      postId: params.id as string,
      authorId: userId,
      content: body.content,
      parentId: body.parentId,
      likesCount: 0,
      likedByMe: false,
      isAcceptedAnswer: false,
      createdAt: new Date().toISOString(),
    };
    seedComments.push(newComment);

    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) post.commentCount += 1;

    return HttpResponse.json({ data: newComment });
  }),

  // PUT /api/v1/posts/:id/accepted-answer
  http.put('/api/v1/posts/:id/accepted-answer', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as { commentId: string };
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) {
      post.isSolved = true;
      post.acceptedCommentId = body.commentId;
    }
    seedComments
      .filter((c) => c.postId === params.id)
      .forEach((c) => {
        c.isAcceptedAnswer = c.id === body.commentId;
      });

    return HttpResponse.json({ data: { success: true } });
  }),

  // POST /api/v1/posts/:id/report
  http.post('/api/v1/posts/:id/report', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { reason: string; note?: string };

    const newReport: ViolationReport = {
      id: `rep_${Date.now()}`,
      postId: params.id as string,
      reporterId: userId,
      reason: body.reason,
      note: body.note,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    seedReports.push(newReport);

    return HttpResponse.json({ data: newReport });
  }),

  // POST /api/v1/comments/:id/report
  http.post('/api/v1/comments/:id/report', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { reason: string; note?: string };

    const newReport: ViolationReport = {
      id: `rep_${Date.now()}`,
      commentId: params.id as string,
      reporterId: userId,
      reason: body.reason,
      note: body.note,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    seedReports.push(newReport);

    return HttpResponse.json({ data: newReport });
  }),

  // POST /api/v1/subjects/:code/follow
  http.post('/api/v1/subjects/:code/follow', async ({ params }) => {
    await mockDelay();
    const code = params.code as string;
    followedSubjects.add(code);
    return HttpResponse.json({ data: { following: true, subjectCode: code } });
  }),

  // DELETE /api/v1/subjects/:code/follow
  http.delete('/api/v1/subjects/:code/follow', async ({ params }) => {
    await mockDelay();
    const code = params.code as string;
    followedSubjects.delete(code);
    return HttpResponse.json({ data: { following: false, subjectCode: code } });
  }),

  // GET /api/v1/subjects/following
  http.get('/api/v1/subjects/following', async () => {
    await mockDelay();
    return HttpResponse.json({ data: Array.from(followedSubjects) });
  }),

  // GET /api/v1/subjects/trending
  http.get('/api/v1/subjects/trending', async () => {
    await mockDelay();
    const list = [
      {
        rank: 1,
        code: 'CSD201',
        name: 'Cấu trúc dữ liệu & Giải thuật',
        threadCount: 38,
        replyCount: 142,
        topQuestion: 'Có ai có mẹo nhớ nhanh các trường hợp xoay cây AVL trong CSD201 không?',
        isFollowing: followedSubjects.has('CSD201'),
      },
      {
        rank: 2,
        code: 'SWP391',
        name: 'Dự án Phát triển Phần mềm',
        threadCount: 29,
        replyCount: 98,
        topQuestion: 'Cách cấu hình GitHub Actions CI/CD deploy lên cloud?',
        isFollowing: followedSubjects.has('SWP391'),
      },
      {
        rank: 3,
        code: 'PRJ301',
        name: 'Java Web Application Development',
        threadCount: 24,
        replyCount: 86,
        topQuestion: 'Lỗi Spring Security CORS khi gửi Bearer token?',
        isFollowing: followedSubjects.has('PRJ301'),
      },
      {
        rank: 4,
        code: 'DBI202',
        name: 'Hệ Quản trị Cơ sở dữ liệu',
        threadCount: 19,
        replyCount: 65,
        topQuestion: 'Phân biệt Clustered Index và Non-clustered Index?',
        isFollowing: followedSubjects.has('DBI202'),
      },
      {
        rank: 5,
        code: 'MAS291',
        name: 'Xác suất & Thống kê Ứng dụng',
        threadCount: 15,
        replyCount: 42,
        topQuestion: 'Cách vẽ tree diagram giải bài toán định lý Bayes?',
        isFollowing: followedSubjects.has('MAS291'),
      },
      {
        rank: 6,
        code: 'PRN231',
        name: 'Lập trình .NET & Web API nâng cao',
        threadCount: 12,
        replyCount: 37,
        topQuestion: 'Setup Clean Architecture với Entity Framework Core?',
        isFollowing: followedSubjects.has('PRN231'),
      },
    ];
    return HttpResponse.json({ data: list });
  }),
];
