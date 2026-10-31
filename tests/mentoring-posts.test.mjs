import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { mentoringHandlers } from '../src/mocks/handlers/mentoring.ts';
import { seedMentoringPosts, seedMentoringRequests } from '../src/mocks/data/mentoring.ts';

const server = setupServer(...mentoringHandlers.map((handler) =>
  http[handler.info.method.toLowerCase()]('http://localhost' + handler.info.path, handler.resolver)
));
before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());

const STUDENT = 'usr_student_01';

async function api(path, userId, method = 'GET', body) {
  const response = await fetch('http://localhost/api/v1' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock_jwt_token_' + userId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, ...(await response.json()) };
}

const newPost = (title) =>
  api('/mentoring/posts', STUDENT, 'POST', {
    title, content: 'Cần ôn CSD201', subject: 'CSD201', modes: ['online'], schedule: ['Linh hoạt, thỏa thuận theo tuần'],
    deadline: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10), postType: 'NEED_MENTOR', authorRole: 'student',
  });

test('the owner deletes a need post and pending offers on it are rejected', async () => {
  const created = (await newPost('Bài sẽ xóa')).data;
  assert.ok((await api('/mentoring/posts/mine', STUDENT)).data.some((post) => post.id === created.id));

  const offer = {
    id: 'mreq_test_offer', studentId: STUDENT, mentorId: 'usr_mentor_02', requesterId: 'usr_mentor_02', recipientId: STUDENT,
    sourcePostId: created.id, topic: 'Đề nghị kèm', content: 'x', status: 'PENDING_MENTOR_RESPONSE', createdAt: new Date().toISOString(),
  };
  seedMentoringRequests.push(offer);
  try {
    // Chỉ chủ bài được xóa
    assert.equal((await api(`/mentoring/posts/${created.id}`, 'usr_mentor_02', 'DELETE')).status, 403);
    assert.equal((await api(`/mentoring/posts/${created.id}`, STUDENT, 'DELETE')).status, 200);

    assert.equal(seedMentoringPosts.some((post) => post.id === created.id), false);
    assert.equal((await api('/mentoring/posts/mine', STUDENT)).data.some((post) => post.id === created.id), false);
    assert.equal(offer.status, 'REJECTED');
    assert.ok(offer.rejectReason);
    assert.equal((await api(`/mentoring/posts/${created.id}`, STUDENT, 'DELETE')).status, 404);
  } finally {
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(offer), 1);
  }
});

test('a post that already became a class cannot be deleted', async () => {
  const created = (await newPost('Bài đã có lớp')).data;
  const accepted = {
    id: 'mreq_test_class', studentId: STUDENT, mentorId: 'usr_mentor_02', requesterId: 'usr_mentor_02', recipientId: STUDENT,
    sourcePostId: created.id, topic: 'Đã nhận kèm', content: 'x', status: 'ACCEPTED', createdAt: new Date().toISOString(),
  };
  seedMentoringRequests.push(accepted);
  try {
    const blocked = await api(`/mentoring/posts/${created.id}`, STUDENT, 'DELETE');
    assert.equal(blocked.status, 409);
    assert.equal(blocked.error.code, 'POST_HAS_CLASS');
    assert.equal(seedMentoringPosts.some((post) => post.id === created.id), true);
    // Vẫn đóng được
    assert.equal((await api(`/mentoring/posts/${created.id}`, STUDENT, 'PUT', { status: 'CLOSED', open: false })).status, 200);
  } finally {
    seedMentoringRequests.splice(seedMentoringRequests.indexOf(accepted), 1);
    seedMentoringPosts.splice(seedMentoringPosts.findIndex((post) => post.id === created.id), 1);
  }
});
