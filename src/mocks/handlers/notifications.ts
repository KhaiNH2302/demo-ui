import { http, HttpResponse } from 'msw';
import { seedNotifications } from '../data/notifications';
import { seedFollows, seedUsers } from '../data/users';
import { mockDelay, getViewerId } from '../utils';
import { persistLifeSearchRead, reconcileLifeSearchAlerts } from '../lifeSearches';

import { persistLifePostNoticeRead } from '../lifePostLifecycle';

function authenticatedId(request: Request) {
  const auth = request.headers.get('Authorization') || '';
  const id = auth.startsWith('Bearer mock_jwt_token_') ? auth.slice('Bearer mock_jwt_token_'.length) : '';
  return seedUsers.some((user) => user.id === id && user.status === 'active') ? id : null;
}

function error(code: string, status: number, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const notificationHandlers = [
  http.get('/api/v1/notifications', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const read = url.searchParams.get('read');
    const source = url.searchParams.get('source');
    reconcileLifeSearchAlerts();

    let list = seedNotifications.filter((item) => item.userId === getViewerId(request));
    if (read !== null && read !== undefined && read !== '') {
      const isRead = read === 'true';
      list = list.filter((n) => n.read === isRead);
    }
    if (source) {
      list = list.filter((n) => n.source === source);
    }

    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/notifications/:id/read', async ({ params, request }) => {
    await mockDelay(50, 100);
    const userId = authenticatedId(request);
    if (!userId) return error('UNAUTHORIZED', 401, 'Vui lòng đăng nhập.');
    const item = seedNotifications.find((n) => n.id === params.id);
    if (!item) return error('NOT_FOUND', 404, 'Thông báo không tồn tại.');
    if (item.userId !== userId) return error('FORBIDDEN', 403, 'Bạn không có quyền đọc thông báo này.');
    item.read = true;
    persistLifeSearchRead(item);
    persistLifePostNoticeRead(item);
    return HttpResponse.json({ data: { success: true } });
  }),

  // Canonical follow routes precede the legacy newModules handlers.
  http.get('/api/v1/follow-requests', ({ request }) => {
    const userId = getViewerId(request);
    return HttpResponse.json({ data: {
      incoming: seedFollows.filter((item) => item.followeeId === userId && item.status === 'Pending'),
      outgoing: seedFollows.filter((item) => item.followerId === userId && item.status === 'Pending'),
    } });
  }),

  http.put('/api/v1/follow-requests/:id/respond', async ({ params, request }) => {
    const userId = authenticatedId(request);
    if (!userId) return error('UNAUTHORIZED', 401, 'Vui lòng đăng nhập.');
    const item = seedFollows.find((follow) => follow.id === params.id);
    if (!item) return error('NOT_FOUND', 404, 'Yêu cầu theo dõi không tồn tại.');
    if (item.followeeId !== userId) return error('FORBIDDEN', 403, 'Chỉ người nhận được phản hồi yêu cầu theo dõi.');
    const body = await request.json() as { action: 'accept' | 'decline' };
    if (item.status !== 'Pending') return error('REQUEST_RESOLVED', 409, 'Yêu cầu đã được xử lý.');
    if (!['accept', 'decline'].includes(body.action)) return error('INVALID_ACTION', 422, 'Phản hồi không hợp lệ.');
    item.status = body.action === 'accept' ? 'Active' : 'Declined';
    item.respondedAt = new Date().toISOString();
    return HttpResponse.json({ data: item });
  }),
];
