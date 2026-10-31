import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { mentoringHandlers } from '../src/mocks/handlers/mentoring.ts';
import { seedClassSessions, seedMentorReviews, seedMentoringPosts, seedMentoringRequests } from '../src/mocks/data/mentoring.ts';
import { isConnectionExpired, CONNECTION_EXPIRY_DAYS } from '../src/features/mentoring/classRules.ts';

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

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
const sessionsOf = (requestId) => seedClassSessions.filter((s) => s.requestId === requestId);
const dropSessions = (requestId) => {
  for (let i = seedClassSessions.length - 1; i >= 0; i--) if (seedClassSessions[i].requestId === requestId) seedClassSessions.splice(i, 1);
};

test('both sides see the class, with the sessions sorted by date', async () => {
  const asStudent = await api('/mentoring/classes', STUDENT);
  const asMentor = await api('/mentoring/classes', MENTOR);
  assert.equal(asStudent.data.some((cls) => cls.request.id === 'mreq_01'), true);
  assert.equal(asMentor.data.some((cls) => cls.request.id === 'mreq_01'), true);
  const cls = asStudent.data.find((item) => item.request.id === 'mreq_01');
  const dates = cls.sessions.map((s) => new Date(s.startsAt).getTime());
  assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
  // Người ngoài lớp không thấy
  assert.equal((await api('/mentoring/classes', 'usr_student_16')).data.length, 0);
});

test('either side records a session and the other side confirms it', async () => {
  const pending = seedClassSessions.find((s) => s.id === 'msess_03');
  assert.equal(pending.status, 'PENDING_CONFIRM');
  assert.equal(pending.createdBy, MENTOR);

  // Bên ghi nhận không tự xác nhận được; người ngoài không đụng được
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_03/confirm', MENTOR, 'POST')).status, 403);
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_03/confirm', 'usr_student_16', 'POST')).status, 403);

  // Bên kia báo chưa đúng thì buổi bị bỏ, không tính vào tiến độ
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_03/dispute', STUDENT, 'POST')).status, 200);
  assert.equal(pending.status, 'CANCELLED');

  // Học viên ghi nhận ngược lại, Mentor xác nhận
  const recorded = await api('/mentoring/classes/mreq_01/sessions', STUDENT, 'POST', {});
  assert.equal(recorded.status, 200);
  const mine = recorded.data.sessions.find((s) => s.createdBy === STUDENT);
  assert.equal(mine.status, 'PENDING_CONFIRM');
  assert.equal((await api(`/mentoring/classes/mreq_01/sessions/${mine.id}/confirm`, STUDENT, 'POST')).status, 403);
  assert.equal((await api(`/mentoring/classes/mreq_01/sessions/${mine.id}/confirm`, MENTOR, 'POST')).status, 200);
  assert.equal(seedClassSessions.find((s) => s.id === mine.id).status, 'DONE');
  // Buổi đã xác nhận không rút lại hay xác nhận lại được
  assert.equal((await api(`/mentoring/classes/mreq_01/sessions/${mine.id}/cancel`, STUDENT, 'POST')).status, 409);

  // Khôi phục dữ liệu mẫu
  seedClassSessions.splice(seedClassSessions.findIndex((s) => s.id === mine.id), 1);
  pending.status = 'PENDING_CONFIRM';
});

test('the recorder can withdraw, one pending request at a time, and a class is confirmed only once', async () => {
  const pending = seedClassSessions.find((s) => s.id === 'msess_03');
  // Còn buổi chờ xác nhận thì chưa ghi nhận thêm được
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', STUDENT, 'POST', {})).error.code, 'PENDING_EXISTS');
  // Chỉ bên ghi nhận được rút lại
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_03/cancel', STUDENT, 'POST')).status, 403);
  assert.equal((await api('/mentoring/classes/mreq_01/sessions/msess_03/cancel', MENTOR, 'POST')).status, 200);
  assert.equal(pending.status, 'CANCELLED');

  // Chỉ ghi nhận được buổi đã diễn ra
  const future = new Date(Date.now() + 86_400_000).toISOString();
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', { startsAt: future })).status, 422);
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', { startsAt: 'không phải ngày' })).status, 422);

  // Đề nghị lại, bên kia xác nhận → lớp đã học; không đề nghị thêm được nữa
  const recorded = await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', {});
  assert.equal(recorded.status, 200);
  const created = recorded.data.sessions.find((s) => s.status === 'PENDING_CONFIRM');
  assert.equal((await api(`/mentoring/classes/mreq_01/sessions/${created.id}/confirm`, STUDENT, 'POST')).status, 200);
  assert.equal((await api('/mentoring/classes/mreq_01/sessions', MENTOR, 'POST', {})).error.code, 'ALREADY_CONFIRMED');

  // Khôi phục dữ liệu mẫu
  for (let i = seedClassSessions.length - 1; i >= 0; i--) {
    const s = seedClassSessions[i];
    if (s.requestId === 'mreq_01' && s.id !== 'msess_03') seedClassSessions.splice(i, 1);
  }
  pending.status = 'PENDING_CONFIRM';
});

test('a review needs a connection and at least one confirmed session', async () => {
  const body = { requestId: 'mreq_01', rating: 5, tags: ['Đúng giờ'], comment: 'Rất tốt' };
  const done = sessionsOf('mreq_01').filter((s) => s.status === 'DONE');
  const saved = done.map((s) => s.status);
  done.forEach((s) => { s.status = 'CANCELLED'; });

  const early = await api(`/mentors/${MENTOR}/reviews`, STUDENT, 'POST', body);
  assert.equal(early.status, 403);
  assert.equal(early.error.code, 'REVIEW_TOO_EARLY');
  done.forEach((s, i) => { s.status = saved[i]; });

  // Có một lần xác nhận đã học thì đánh giá được
  const confirmed = { id: 'msess_tmp', requestId: 'mreq_01', startsAt: new Date().toISOString(), createdBy: MENTOR, status: 'DONE', createdAt: new Date().toISOString() };
  seedClassSessions.push(confirmed);
  assert.equal((await api(`/mentors/${MENTOR}/reviews`, 'usr_student_16', 'POST', body)).status, 403);
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

  seedClassSessions.splice(seedClassSessions.indexOf(confirmed), 1);
  seedMentorReviews.splice(seedMentorReviews.findIndex((r) => r.id === ok.data.id), 1);
});

test('a connected request becomes a class only when the mentor starts it', async () => {
  const request = {
    id: 'mreq_test_start', studentId: STUDENT, mentorId: MENTOR, requesterId: STUDENT, recipientId: MENTOR,
    topic: 'Test bắt đầu lớp', content: 'x', status: 'ACCEPTED', totalSessions: 2, createdAt: new Date().toISOString(),
  };
  seedMentoringRequests.push(request);
  try {
    const listed = (await api('/mentoring/classes', STUDENT)).data.find((cls) => cls.request.id === request.id);
    assert.equal(listed.startedAt, undefined);
    assert.deepEqual(listed.sessions, []);

    // Chưa bắt đầu thì chưa ghi nhận buổi được; học viên không được bắt đầu
    assert.equal((await api(`/mentoring/classes/${request.id}/sessions`, MENTOR, 'POST', {})).error.code, 'NOT_STARTED');
    assert.equal((await api(`/mentoring/classes/${request.id}/start`, STUDENT, 'POST', {})).status, 403);

    const started = await api(`/mentoring/classes/${request.id}/start`, MENTOR, 'POST', {});
    assert.equal(started.status, 200);
    assert.ok(started.data.startedAt);
    // Bắt đầu lớp không tự tạo buổi nào
    assert.equal(started.data.sessions.length, 0);
    assert.equal((await api(`/mentoring/classes/${request.id}/start`, MENTOR, 'POST', {})).status, 409);

    assert.equal((await api(`/mentoring/classes/${request.id}/sessions`, STUDENT, 'POST', {})).status, 200);
  } finally {
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(request), 1);
    dropSessions(request.id);
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
    assert.equal((await api('/mentoring/classes/mreq_test_end/end', 'usr_student_16', 'POST', {})).status, 403);
    const ended = await api('/mentoring/classes/mreq_test_end/end', STUDENT, 'POST', { reason: ' Chưa chốt được lịch ' });
    assert.equal(ended.status, 200);
    assert.equal(request.status, 'ENDED');
    assert.equal(request.endedBy, STUDENT);
    assert.equal(request.endedReason, 'Chưa chốt được lịch');
    assert.equal(post.filledCount, filledBefore);
    // Không còn là lớp của ai
    assert.equal((await api('/mentoring/classes', MENTOR)).data.some((cls) => cls.request.id === request.id), false);
    // Yêu cầu đã kết thúc là bị khóa: không kết thúc lại, không bắt đầu lớp, không ghi nhận buổi
    for (const path of ['end', 'start', 'sessions']) {
      const locked = await api(`/mentoring/classes/mreq_test_end/${path}`, MENTOR, 'POST', {});
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
  assert.equal((await api('/mentoring/classes/mreq_10/start', mentorOfSeed, 'POST', {})).error.code, 'CONNECTION_EXPIRED');
  assert.equal((await api('/mentoring/classes/mreq_10/sessions', mentorOfSeed, 'POST', {})).status, 409);
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

test('request lists also lock a connection that has expired', async () => {
  const stale = {
    id: 'mreq_test_list', studentId: STUDENT, mentorId: 'usr_mentor_01', requesterId: STUDENT, recipientId: 'usr_mentor_01',
    topic: 'Test danh sách', content: 'x', status: 'ACCEPTED', connectedAt: daysAgo(CONNECTION_EXPIRY_DAYS + 3), createdAt: daysAgo(30),
  };
  seedMentoringRequests.push(stale);
  try {
    const mine = (await api('/mentoring/requests/me', STUDENT)).data.find((item) => item.id === stale.id);
    assert.equal(mine.status, 'EXPIRED');
  } finally {
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(stale), 1);
  }
});
