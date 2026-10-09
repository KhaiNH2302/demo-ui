import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { chatHandlers } from '../src/mocks/handlers/chat.ts';
import { seedConversations, seedMessages } from '../src/mocks/data/conversations.ts';
import { seedUsers } from '../src/mocks/data/users.ts';
globalThis.location = new URL('http://localhost');
test('conversation reads and writes require membership and valid request transitions', async () => {
  const server = setupServer(...chatHandlers);
  server.listen({ onUnhandledRequest: 'error' });
  const conv = seedConversations.find(c => c.participantIds.length && c.kind === 'group');
  const member = conv.participantIds[0];
  const outsider = seedUsers.find(u => !conv.participantIds.includes(u.id)).id;
  const call = (route, user, body) => fetch(`http://localhost/api/v1/${route}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...(user ? { Authorization: `Bearer mock_jwt_token_${user}` } : {}), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    assert.equal((await call(`conversations/${conv.id}/messages`)).status, 401);
    for (const Authorization of [member, `Bearer ${member}`]) {
      assert.equal((await fetch(`http://localhost/api/v1/conversations/${conv.id}/messages`, { headers: { Authorization } })).status, 401);
    }
    assert.equal((await call(`conversations/${conv.id}/messages`, outsider)).status, 403);
    const before = seedMessages.length;
    assert.equal((await call(`conversations/${conv.id}/messages`, outsider, { content: 'forbidden' })).status, 403);
    assert.equal(seedMessages.length, before);
    assert.equal((await call(`conversations/${conv.id}/messages`, member)).status, 200);
    assert.equal((await call(`conversations/${conv.id}/messages`, member, { content: '  ' })).status, 400);
    assert.equal((await call('conversations/direct', member, { targetUserId: member })).status, 400);
    const created = await (await call('conversations/direct', outsider, { targetUserId: member, firstMessage: 'Xin chào' })).json();
    const id = created.data.id;
    assert.equal((await call(`conversations/${id}/accept`, outsider, {})).status, 403);
    assert.equal((await call(`conversations/${id}/messages`, outsider, { content: 'again' })).status, 409);
    assert.equal((await call(`conversations/${id}/accept`, member, {})).status, 200);
    assert.equal((await call(`conversations/${id}/accept`, member, {})).status, 409);
    assert.equal((await call(`conversations/${id}/messages`, outsider, { content: 'Sau khi chấp nhận' })).status, 200);
  } finally { server.close(); }
});
