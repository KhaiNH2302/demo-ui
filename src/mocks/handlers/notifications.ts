import { http, HttpResponse } from 'msw';
import { seedNotifications } from '../data/notifications';
import { mockDelay } from '../utils';

export const notificationHandlers = [
  http.get('/api/v1/notifications', async ({ request }) => {
    await mockDelay();
    const url = new URL(request.url);
    const read = url.searchParams.get('read');
    const source = url.searchParams.get('source');

    let list = [...seedNotifications];
    if (read !== null && read !== undefined && read !== '') {
      const isRead = read === 'true';
      list = list.filter((n) => n.read === isRead);
    }
    if (source) {
      list = list.filter((n) => n.source === source);
    }

    return HttpResponse.json({ data: list });
  }),

  http.post('/api/v1/notifications/:id/read', async ({ params }) => {
    await mockDelay(50, 100);
    const item = seedNotifications.find((n) => n.id === params.id);
    if (item) {
      item.read = true;
    }
    return HttpResponse.json({ data: { success: true } });
  }),
];
