import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { mentoringHandlers } from '../src/mocks/handlers/mentoring.ts';
import { seedClassSessions, seedMentorReviews, seedMentoringRequests } from '../src/mocks/data/mentoring.ts';

const server = setupServer(...mentoringHandlers.map((handler) =>
  http[handler.info.method.toLowerCase()]('http://localhost' + handler.info.path, handler.resolver)
));
before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());

const STUDENT = 'usr_student_01';
const MENTOR = 'usr_mentor_02';

async function api(path, userId, method = 'GET', body) {
  const response = await fetch('http://localhost/api/v1' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock_jwt_token_' + userId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, ...(await response.json()) };
}

const reset = () => {
  const request = seedMentoringRequests.find((item) => item.id === 'mreq_01');
  request.totalSessions = 4;
  for (let i = seedClassSessions.length - 1; i >= 0; i--) {
    if (seedClassSessions[i].requestId === 'mreq_01' && !seedClassSessions[i].id.startsWith('msess_0')) seedClassSessions.splice(i, 1);
  }
};

test('both sides see the class, with the sessions sorted by date', async () => {
  const asStudent = await api('/mentoring/classes', STUDENT);
  const asMentor = await api('/mentoring/classes', MENTOR);
  assert.equal(asStudent.data.length, 1);
  assert.equal(asMentor.data.some((cls) => cls.request.id === 'mreq_01'), true);
  const dates = asStudent.data[0].sessions.map((s) => new Date(s.startsAt).getTime());
  assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
  // Người ngoài lớp không thấy
  assert.equal((await api('/mentoring/classes', 'usr_student_05')).data.length, 0);
});

test('a session only counts after the mentor marks it and the student confirms', async () => {
  const planned = seedClassSessions.find((s) => s.id === 'msess_04');
  planned.status = 'PLANNED';

  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_04/done', STUDENT, 'POST')).status, 403);
  const marked = await api('/mentoring/classes/mreq_01/sessions/msess_04/done', MENTOR, 'POST');
  assert.equal(marked.status, 200);
  assert.equal(planned.status, 'PENDING_CONFIRM');

  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_04/confirm', MENTOR, 'POST')).status, 403);
  const disputed = await api('/mentoring/classes/mreq_01/sessions/msess_04/dispute', STUDENT, 'POST');
  assert.equal(disputed.status, 200);
  assert.equal(planned.status, 'PLANNED');
  assert.equal(planned.disputed, true);

  await api('/mentoring/classes/mreq_01/sessions/msess_04/done', MENTOR, 'POST');
  await api('/mentoring/classes/mreq_01/sessions/msess_04/confirm', STUDENT, 'POST');
  assert.equal(planned.status, 'DONE');

  // Buổi đã học không hủy được
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_04/cancel', MENTOR, 'POST')).status, 409);
  planned.status = 'PLANNED';
  planned.disputed = false;
});

test('only the mentor adds sessions and never beyond the package size', async () => {
  reset();
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', STUDENT, 'POST', { startsAt })).status, 403);
  // Gói 4 buổi đã xếp đủ 4 buổi
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', { startsAt })).status, 409);

  const cancelled = await api('/mentoring/classes/mreq_01/sessions/msess_04/cancel', STUDENT, 'POST');
  assert.equal(cancelled.status, 200);
  const added = await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', { startsAt, mode: 'chat', note: ' Ôn tập ' });
  assert.equal(added.status, 200);
  const created = added.data.sessions.find((s) => s.note === 'Ôn tập');
  assert.equal(created.status, 'PLANNED');
  assert.equal(created.mode, 'chat');
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', { startsAt: 'không phải ngày' })).status, 422);

  seedClassSessions.splice(seedClassSessions.findIndex((s) => s.id === created.id), 1);
  seedClassSessions.find((s) => s.id === 'msess_04').status = 'PLANNED';
});

test('a review needs a connection and at least one confirmed session', async () => {
  const body = { requestId: 'mreq_01', rating: 5, tags: ['Đúng giờ'], comment: 'Rất tốt' };
  const done = seedClassSessions.filter((s) => s.requestId === 'mreq_01' && s.status === 'DONE');
  const saved = done.map((s) => s.status);
  done.forEach((s) => { s.status = 'PLANNED'; });

  const early = await api(`/mentors/${MENTOR}/reviews`, STUDENT, 'POST', body);
  assert.equal(early.status, 403);
  assert.equal(early.error.code, 'REVIEW_TOO_EARLY');
  done.forEach((s, i) => { s.status = saved[i]; });

  assert.equal((await api(`/mentors/${MENTOR}/reviews`, 'usr_student_05', 'POST', body)).status, 403);
  assert.equal((await api(`/mentors/${MENTOR}/reviews`, STUDENT, 'POST', { ...body, rating: 9 })).status, 422);

  const ok = await api(`/mentors/${MENTOR}/reviews`, STUDENT, 'POST', body);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.requestId, 'mreq_01');
  // Mỗi lần kết nối chỉ đánh giá một lần
  assert.equal((await api(`/mentors/${MENTOR}/reviews`, STUDENT, 'POST', body)).status, 409);

  const replied = await api(`/mentors/${MENTOR}/reviews/${ok.data.id}/reply`, MENTOR, 'POST', { content: 'Cảm ơn em' });
  assert.equal(replied.status, 200);
  assert.equal((await api(`/mentors/${MENTOR}/reviews/${ok.data.id}/reply`, STUDENT, 'POST', { content: 'x' })).status, 403);
  assert.equal((await api(`/mentors/${MENTOR}/reviews/${ok.data.id}/reply`, MENTOR, 'POST', { content: 'lần hai' })).status, 409);

  seedMentorReviews.splice(seedMentorReviews.findIndex((r) => r.id === ok.data.id), 1);
});
