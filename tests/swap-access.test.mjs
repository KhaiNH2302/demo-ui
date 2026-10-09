import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { swapHandlers } from '../src/mocks/handlers/swap.ts';
import { seedSwapRequests, seedSwapConnections } from '../src/mocks/data/swap.ts';
import { seedConversations, seedMessages } from '../src/mocks/data/conversations.ts';
import { seedUsers } from '../src/mocks/data/users.ts';

globalThis.location = new URL('http://localhost');

test('sample preview and malformed tokens cannot mutate swaps, and inactive accounts cannot act', async () => {
  const server = setupServer(...swapHandlers);
  const originalRequests = structuredClone(seedSwapRequests);
  const originalConnections = structuredClone(seedSwapConnections);
  const originalConversations = structuredClone(seedConversations);
  const originalMessages = structuredClone(seedMessages);
  const owner = seedUsers.find(user => user.id === 'usr_student_01');
  const originalStatus = owner.status;
  const base = structuredClone(seedSwapRequests[0]);
  seedSwapRequests.push(
    { ...base, id: 'access-request-a', studentId: owner.id, status: 'Open', version: 1 },
    { ...base, id: 'access-request-b', studentId: 'usr_student_02', status: 'Open', version: 1 },
  );
  seedSwapConnections.push({ id: 'access-incoming', requestAId: 'access-request-b', requestBId: 'access-request-a', initiatorId: 'usr_student_02', recipientId: owner.id, status: 'Pending', createdAt: new Date().toISOString() });
  const call = (route, method, headers, body) => fetch(`http://localhost/api/v1/${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const snapshot = () => JSON.stringify([seedSwapRequests, seedSwapConnections, seedConversations, seedMessages]);
  server.listen({ onUnhandledRequest: 'error' });
  try {
    const operations = [
      ['swap-requests', 'POST', { offeringId: 'unused-access-offering', currentClassCode: 'A', targetClassCode: 'B', schedule: [] }],
      ['swap-requests/access-request-a', 'PUT', { note: 'forbidden change' }],
      ['swap-requests/access-request-a', 'DELETE'],
      ['swap-connections', 'POST', { requestAId: 'access-request-a', requestBId: 'access-request-b' }],
      ['swap-connections/access-incoming/accept', 'POST', {}],
      ['swap-connections/access-incoming/reject', 'POST', {}],
    ];
    for (const headers of [{ 'X-Demo-Sample': '1' }, { Authorization: owner.id }, { Authorization: `Bearer ${owner.id}` }, { Authorization: 'Bearer mock_jwt_token_unknown' }]) {
      for (const [route, method, body] of operations) {
        const before = snapshot();
        const response = await call(route, method, headers, body);
        assert.equal(response.status, 403, `${method} ${route} must require an authenticated actor`);
        assert.equal(snapshot(), before, 'denied writes must preserve every related record');
      }
    }
    const preview = await (await call('swap-requests', 'GET', { 'X-Demo-Sample': '1' })).json();
    assert.ok(preview.data.some(request => request.id === 'access-request-a'));
    const auth = { Authorization: `Bearer mock_jwt_token_${owner.id}` };
    owner.status = 'suspended';
    const before = snapshot();
    assert.equal((await call('swap-requests/access-request-a', 'PUT', auth, { note: 'blocked account' })).status, 403);
    assert.equal(snapshot(), before);
    owner.status = originalStatus;
    assert.equal((await call('swap-requests/access-request-a', 'PUT', auth, { note: 'valid owner update' })).status, 200);
    assert.equal(seedSwapRequests.find(request => request.id === 'access-request-a').note, 'valid owner update');
  } finally {
    owner.status = originalStatus;
    seedSwapRequests.splice(0, seedSwapRequests.length, ...originalRequests);
    seedSwapConnections.splice(0, seedSwapConnections.length, ...originalConnections);
    seedConversations.splice(0, seedConversations.length, ...originalConversations);
    seedMessages.splice(0, seedMessages.length, ...originalMessages);
    server.close();
  }
});
