import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { mentoringHandlers } from '../src/mocks/handlers/mentoring.ts';
import { seedClassSessions, seedMentorReviews, seedMentoringPosts, seedMentoringRequests } from '../src/mocks/data/mentoring.ts';

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
  assert.equal(asStudent.data.some((cls) => cls.request.id === 'mreq_01'), true);
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

test('a connected request becomes a class only when the mentor starts it', async () => {
  const request = {
    id: 'mreq_test_start', studentId: STUDENT, mentorId: MENTOR, requesterId: STUDENT, recipientId: MENTOR,
    topic: 'Test bắt đầu lớp', content: 'x', status: 'ACCEPTED', totalSessions: 2, createdAt: new Date().toISOString(),
  };
  seedMentoringRequests.push(request);
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  try {
    const listed = (await api('/mentoring/classes', STUDENT)).data.find((cls) => cls.request.id === request.id);
    assert.equal(listed.startedAt, undefined);
    assert.deepEqual(listed.sessions, []);

    // Chưa bắt đầu thì chưa thêm buổi được; học viên không được bắt đầu
    assert.equal((await api(`/mentoring/classes/${request.id}/sessions`, MENTOR, 'POST', { startsAt })).status, 409);
    assert.equal((await api(`/mentoring/classes/${request.id}/start`, STUDENT, 'POST', { startsAt })).status, 403);
    assert.equal((await api(`/mentoring/classes/${request.id}/start`, MENTOR, 'POST', { startsAt: 'sai' })).status, 422);

    const started = await api(`/mentoring/classes/${request.id}/start`, MENTOR, 'POST', { startsAt, mode: 'offline', note: 'Buổi đầu' });
    assert.equal(started.status, 200);
    assert.ok(started.data.startedAt);
    assert.equal(started.data.sessions.length, 1);
    assert.equal(started.data.sessions[0].status, 'PLANNED');
    assert.equal(started.data.sessions[0].mode, 'offline');

    assert.equal((await api(`/mentoring/classes/${request.id}/start`, MENTOR, 'POST', { startsAt })).status, 409);
    assert.equal((await api(`/mentoring/classes/${request.id}/sessions`, MENTOR, 'POST', { startsAt })).status, 200);
    // Gói 2 buổi đã xếp đủ
    assert.equal((await api(`/mentoring/classes/${request.id}/sessions`, MENTOR, 'POST', { startsAt })).status, 409);
  } finally {
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(request), 1);
    for (let i = seedClassSessions.length - 1; i >= 0; i--) if (seedClassSessions[i].requestId === request.id) seedClassSessions.splice(i, 1);
  }
});

test('either side can end a connection before the class starts and the seat is released', async () => {
  const post = seedMentoringPosts.find((item) => item.id === 'mpost_01');
  const filledBefore = post.filledCount;
  const request = {
    id: 'mreq_test_end', studentId: STUDENT, mentorId: MENTOR, requesterId: STUDENT, recipientId: MENTOR, sourcePostId: post.id,
    topic: 'Test kết thúc', content: 'x', status: 'ACCEPTED', connectedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  };
  seedMentoringRequests.push(request);
  post.filledCount = filledBefore + 1;
  try {
    assert.equal((await api('/mentoring/classes/mreq_test_end/end', 'usr_student_05', 'POST', {})).status, 403);
    const ended = await api('/mentoring/classes/mreq_test_end/end', STUDENT, 'POST', { reason: ' Chưa chốt được lịch ' });
    assert.equal(ended.status, 200);
    assert.equal(request.status, 'ENDED');
    assert.equal(request.endedBy, STUDENT);
    assert.equal(request.endedReason, 'Chưa chốt được lịch');
    assert.equal(post.filledCount, filledBefore);
    // Không còn là lớp của ai và không kết thúc lần hai được
    assert.equal((await api('/mentoring/classes', MENTOR)).data.some((cls) => cls.request.id === request.id), false);
    // Yêu cầu đã kết thúc là bị khóa: không kết thúc lại, không bắt đầu lớp, không thêm buổi
    const startsAt = new Date(Date.now() + 86_400_000).toISOString();
    for (const [path, body] of [['end', {}], ['start', { startsAt }], ['sessions', { startsAt }]]) {
      const locked = await api(`/mentoring/classes/mreq_test_end/${path}`, MENTOR, 'POST', body);
      assert.equal(locked.status, 409);
      assert.equal(locked.error.code, 'CONNECTION_ENDED');
    }
  } finally {
    post.filledCount = filledBefore;
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(request), 1);
  }
});

test('a class that already started cannot be ended this way', async () => {
  const result = await api('/mentoring/classes/mreq_01/end', STUDENT, 'POST', {});
  assert.equal(result.status, 409);
  assert.equal(result.error.code, 'ALREADY_STARTED');
  assert.equal(seedMentoringRequests.find((item) => item.id === 'mreq_01').status, 'ACCEPTED');
});

import { isConnectionExpired, CONNECTION_EXPIRY_DAYS } from '../src/features/mentoring/classRules.ts';

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

test('a connection expires after the limit unless the class has started', () => {
  const base = { status: 'ACCEPTED', createdAt: daysAgo(40) };
  assert.equal(isConnectionExpired({ ...base, connectedAt: daysAgo(CONNECTION_EXPIRY_DAYS - 1) }), false);
  assert.equal(isConnectionExpired({ ...base, connectedAt: daysAgo(CONNECTION_EXPIRY_DAYS) }), true);
  assert.equal(isConnectionExpired({ ...base, connectedAt: daysAgo(30), classStartedAt: daysAgo(20) }), false);
  assert.equal(isConnectionExpired({ ...base, status: 'REJECTED', connectedAt: daysAgo(30) }), false);
  // Dữ liệu cũ chưa có connectedAt thì tính từ lúc gửi yêu cầu
  assert.equal(isConnectionExpired(base), true);
});

test('an expired connection locks both sides and frees the seat it held', async () => {
  const seeded = seedMentoringRequests.find((item) => item.id === 'mreq_10');
  const listed = (await api('/mentoring/classes', STUDENT)).data.find((cls) => cls.request.id === 'mreq_10');
  assert.equal(listed.request.status, 'EXPIRED');
  assert.ok(seeded.expiredAt);
  // Kết nối còn hạn không bị ảnh hưởng
  assert.equal((await api('/mentoring/classes', STUDENT)).data.find((cls) => cls.request.id === 'mreq_09').request.status, 'ACCEPTED');

  const mentorOfSeed = seeded.mentorId;
  assert.equal((await api('/mentoring/classes/mreq_10/start', mentorOfSeed, 'POST', { startsAt: new Date(Date.now() + 86_400_000).toISOString() })).error.code, 'CONNECTION_EXPIRED');
  assert.equal((await api('/mentoring/classes/mreq_10/sessions', mentorOfSeed, 'POST', { startsAt: new Date(Date.now() + 86_400_000).toISOString() })).status, 409);
  assert.equal((await api('/mentoring/classes/mreq_10/end', STUDENT, 'POST', {})).status, 409);

  const post = seedMentoringPosts.find((item) => item.id === 'mpost_01');
  const filledBefore = post.filledCount;
  const stale = {
    id: 'mreq_test_stale', studentId: STUDENT, mentorId: MENTOR, requesterId: STUDENT, recipientId: MENTOR, sourcePostId: post.id,
    topic: 'Test hết hạn trả chỗ', content: 'x', status: 'ACCEPTED', connectedAt: daysAgo(CONNECTION_EXPIRY_DAYS + 1), createdAt: daysAgo(30),
  };
  seedMentoringRequests.push(stale);
  post.filledCount = filledBefore + 1;
  try {
    await api('/mentoring/classes', STUDENT);
    assert.equal(stale.status, 'EXPIRED');
    assert.equal(post.filledCount, filledBefore);
  } finally {
    post.filledCount = filledBefore;
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(stale), 1);
  }
});
