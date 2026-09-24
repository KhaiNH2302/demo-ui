import { http, HttpResponse } from 'msw';
import { seedKnowledgePosts, seedComments, seedReports } from '../data/knowledge';
import { mockDelay, isScenarioActive } from '../utils';
import type { KnowledgePost } from '@/types/entities';

export const knowledgeHandlers = [
  http.get('/api/v1/posts', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const subject = url.searchParams.get('subject');
    const q = url.searchParams.get('q');
    const tag = url.searchParams.get('tag');

    let list = seedKnowledgePosts.filter((p) => p.status === 'Published');

    if (type) list = list.filter((p) => p.type === type);
    if (subject) list = list.filter((p) => p.subject === subject);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(lower) || p.contentMd.toLowerCase().includes(lower));
    }

    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/posts', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as Omit<KnowledgePost, 'id' | 'authorId' | 'status' | 'commentCount' | 'createdAt' | 'updatedAt'>;

    const shouldAutoFlag = isScenarioActive('post_auto_flagged');

    const newPost: KnowledgePost = {
      id: `post_${Date.now()}`,
      authorId: userId,
      type: body.type,
      title: body.title,
      contentMd: body.contentMd,
      subject: body.subject,
      tags: body.tags || [],
      attachments: body.attachments || [],
      visibility: body.visibility || 'school',
      status: shouldAutoFlag ? 'PendingReview' : 'Published',
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seedKnowledgePosts.unshift(newPost);
    return HttpResponse.json({ data: newPost });
  }),

  http.get('/api/v1/posts/me', async ({ request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';

    const list = seedKnowledgePosts.filter((p) => p.authorId === userId);
    return HttpResponse.json({ data: list });
  }),

  http.get('/api/v1/posts/:id', async ({ params }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Bài viết không tồn tại' } }, { status: 404 });
    }
    const comments = seedComments.filter((c) => c.postId === params.id);
    return HttpResponse.json({ data: { post, comments } });
  }),

  http.put('/api/v1/posts/:id', async ({ params, request }) => {
    await mockDelay();
    const body = (await request.json()) as Partial<KnowledgePost>;
    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (!post) {
      return HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Bài viết không tồn tại' } }, { status: 404 });
    }
    Object.assign(post, body);
    post.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: post });
  }),

  http.delete('/api/v1/posts/:id', async ({ params }) => {
    await mockDelay();
    const idx = seedKnowledgePosts.findIndex((p) => p.id === params.id);
    if (idx !== -1) {
      seedKnowledgePosts.splice(idx, 1);
    }
    return HttpResponse.json({ data: { success: true } });
  }),

  http.post('/api/v1/posts/:id/comments', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { content: string };

    const newComment = {
      id: `cmt_${Date.now()}`,
      postId: params.id as string,
      authorId: userId,
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    seedComments.push(newComment);

    const post = seedKnowledgePosts.find((p) => p.id === params.id);
    if (post) post.commentCount += 1;

    return HttpResponse.json({ data: newComment });
  }),

  http.post('/api/v1/posts/:id/report', async ({ params, request }) => {
    await mockDelay();
    const authHeader = request.headers.get('Authorization') || '';
    const userId = authHeader.replace('Bearer mock_jwt_token_', '') || 'usr_student_01';
    const body = (await request.json()) as { reason: string; note?: string };

    const newReport = {
      id: `rep_${Date.now()}`,
      postId: params.id as string,
      reporterId: userId,
      reason: body.reason,
      note: body.note,
      status: 'Open' as const,
      createdAt: new Date().toISOString(),
    };
    seedReports.push(newReport);

    return HttpResponse.json({ data: newReport });
  }),
];
