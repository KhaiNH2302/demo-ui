import './swap-transactions.test.ts';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { swapHandlers } from '../src/mocks/handlers/swap.ts';
import { seedSwapRequests, seedSwapConnections } from '../src/mocks/data/swap.ts';
import { seedConversations, seedMessages } from '../src/mocks/data/conversations.ts';

const server = setupServer(...swapHandlers);
globalThis.location = new URL('http://localhost');
before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());

const now = '2026-10-09T10:00:00Z';
const fixtureUsers = { a: 'usr_student_01', b: 'usr_student_02', c: 'usr_student_03' };
function addFixture() {
  for (const id of ['a', 'b', 'c']) {
    seedSwapRequests.push({
      id: 'test_swap_' + id, studentId: fixtureUsers[id], offeringId: 'off_01',
      currentClassCode: 'SE' + id, targetClassCode: 'SE' + (id === 'b' ? 'a' : 'b'),
      status: 'Open', version: 1, createdAt: now, updatedAt: now,
    });
  }
  for (const from of ['a', 'c']) {
    seedSwapConnections.push({
      id: 'test_swap_' + from + 'b', requestAId: 'test_swap_' + from, requestBId: 'test_swap_b',
      initiatorId: fixtureUsers[from], recipientId: fixtureUsers.b, status: 'Pending', createdAt: now,
    });
  }
}
function removeFixture() {
  for (const [list, predicate] of [
    [seedSwapRequests, (item) => item.id.startsWith('test_swap_')],
    [seedSwapConnections, (item) => item.id.startsWith('test_swap_')],
    [seedConversations, (item) => item.refId?.startsWith('test_swap_')],
    [seedMessages, (item) => item.conversationId.startsWith('conv_swap_test_swap_')],
  ]) {
    for (let index = list.length - 1; index >= 0; index--) if (predicate(list[index])) list.splice(index, 1);
  }
}
async function api(path, viewer, method = 'GET', body) {
  const response = await fetch('http://localhost/api/v1' + path, {
    method, headers: { Authorization: 'Bearer mock_jwt_token_' + viewer, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('MSW accepts one winner, creates one chat, cancels competitors and includes both request details', async () => {
  addFixture();
  try {
    const initialChats = seedConversations.length;
    const denied = await api('/swap-connections/test_swap_ab/accept', fixtureUsers.c, 'POST', {});
    assert.equal(denied.status, 403);
    assert.equal(seedConversations.length, initialChats);
    const accepted = await api('/swap-connections/test_swap_ab/accept', fixtureUsers.b, 'POST', { requestAVersion: 1, requestBVersion: 1 });
    assert.equal(accepted.status, 200);
    assert.equal(seedConversations.length, initialChats + 1);
    assert.equal((await api('/swap-connections/test_swap_ab/accept', fixtureUsers.b, 'POST', {})).status, 409);
    assert.equal((await api('/swap-connections/test_swap_cb/accept', fixtureUsers.b, 'POST', {})).status, 409);
    assert.equal(seedConversations.length, initialChats + 1);
    const listed = await api('/swap-connections?direction=incoming', fixtureUsers.b);
    const winner = listed.body.data.find((item) => item.id === 'test_swap_ab');
    assert.equal(winner.requestA.id, 'test_swap_a');
    assert.equal(winner.requestB.id, 'test_swap_b');
    assert.equal(winner.conversationId, accepted.body.data.conversationId);
    assert.equal(listed.body.data.find((item) => item.id === 'test_swap_cb').status, 'Cancelled');
    assert.deepEqual((await api('/swap-connections?requestId=test_swap_a', 'usr_mentor_01')).body.data, []);
  } finally {
    removeFixture();
  }
});

test('MSW blocks reverse duplicate invitations and updates by another request owner', async () => {
  addFixture();
  try {
    const duplicate = await api('/swap-connections', fixtureUsers.b, 'POST', { requestAId: 'test_swap_b', requestBId: 'test_swap_a' });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'DUPLICATE_PENDING_CONNECTION');
    const update = await api('/swap-requests/test_swap_a', fixtureUsers.c, 'PUT', { currentClassCode: 'FAKE', version: 1 });
    assert.equal(update.status, 403);
    assert.equal(seedSwapRequests.find((item) => item.id === 'test_swap_a').currentClassCode, 'SEa');
    assert.equal((await api('/swap-requests/test_swap_a', fixtureUsers.c, 'DELETE')).status, 403);
  } finally {
    removeFixture();
  }
});
