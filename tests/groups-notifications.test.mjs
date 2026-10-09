import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { groupHandlers } from '../src/mocks/handlers/groups.ts';
import { notificationHandlers } from '../src/mocks/handlers/notifications.ts';
import { seedGroups, seedGroupMembers, seedJoinRequests, seedGroupInvitations } from '../src/mocks/data/groups.ts';
import { seedConversations, seedMessages } from '../src/mocks/data/conversations.ts';
import { seedFollows } from '../src/mocks/data/users.ts';
import { QueryClient } from '@tanstack/react-query';
import { invalidateGroupQueries } from '../src/features/groups/groupQueries.ts';
import { createGroupDialogAction } from '../src/features/groups/groupDialog.ts';

// Node has no document base URI, so use the same route resolvers at an absolute origin.
const server = setupServer(...[...groupHandlers, ...notificationHandlers].map((handler) =>
  http[handler.info.method.toLowerCase()]('http://localhost' + handler.info.path, handler.resolver)
));
before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());

async function api(path, userId = 'usr_student_01', method = 'GET', body) {
  const response = await fetch('http://localhost/api/v1' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: 'Bearer mock_jwt_token_' + userId } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, ...(await response.json()) };
}
async function createGroup(joinMode = 'direct', memberLimit = 3) {
  const response = await api('/groups', 'usr_student_01', 'POST', { name: 'Regression study group', purpose: 'Học tập', topic: 'Transactional membership tests', joinMode, memberLimit });
  assert.equal(response.status, 200);
  return response.data;
}

test('group counts and exact chat refs follow actual memberships', async () => {
  const groups = await api('/groups');
  for (const group of groups.data) assert.equal(group.memberCount, new Set(seedGroupMembers.filter((member) => member.groupId === group.id).map((member) => member.userId)).size);
  const missingChat = await api('/groups/grp_02/conversation', 'usr_student_01', 'POST');
  assert.equal(missingChat.data.refId, 'grp_02');
  assert.notEqual(missingChat.data.id, 'conv_04');
  const group = await createGroup();
  const chat = await api('/groups/' + group.id + '/conversation', 'usr_student_01', 'POST');
  assert.equal(chat.data.refId, group.id);
  assert.notEqual(chat.data.id, 'conv_04');
  assert.deepEqual(chat.data.participantIds, ['usr_student_01']);
  const existing = await api('/groups/' + group.id + '/conversation', 'usr_student_01', 'POST');
  assert.equal(existing.data.id, chat.data.id);
  assert.equal((await api('/groups/' + group.id + '/conversation', 'usr_student_07', 'POST')).status, 403);
  assert.equal((await api('/groups/' + group.id + '/join-requests', 'usr_student_07', 'POST', {})).status, 200);
  assert.equal((await api('/groups/' + group.id + '/join-requests', 'usr_student_07', 'POST', {})).error.code, 'ALREADY_MEMBER');
  assert.deepEqual(seedConversations.find((item) => item.id === chat.data.id).participantIds.sort(), ['usr_student_01', 'usr_student_07']);
  assert.equal((await api('/groups/' + group.id + '/leave', 'usr_student_07', 'POST')).status, 200);
  assert.equal(seedGroups.find((item) => item.id === group.id).memberCount, 1);
  assert.deepEqual(seedConversations.find((item) => item.id === chat.data.id).participantIds, ['usr_student_01']);
  assert.equal((await api('/groups/' + group.id + '/leave', 'usr_student_01', 'POST')).error.code, 'OWNER_REQUIRED');
});

test('competing joins preserve capacity and one pending request per applicant', async () => {
  const direct = await createGroup('direct', 2);
  const race = await Promise.all(['usr_student_07', 'usr_manager_03'].map((id) => api('/groups/' + direct.id + '/join-requests', id, 'POST', {})));
  assert.deepEqual(race.map((item) => item.status).sort(), [200, 409]);
  assert.equal(seedGroups.find((item) => item.id === direct.id).memberCount, 2);
  const approval = await createGroup('approval', 3);
  const duplicate = await Promise.all([1, 2].map(() => api('/groups/' + approval.id + '/join-requests', 'usr_student_07', 'POST', {})));
  assert.deepEqual(duplicate.map((item) => item.status).sort(), [200, 409]);
  assert.equal(seedJoinRequests.filter((item) => item.groupId === approval.id && item.userId === 'usr_student_07' && item.status === 'Pending').length, 1);
});

test('approval enforces owner, request-group identity, duplicate decisions and capacity', async () => {
  const group = await createGroup('approval', 2);
  const request = await api('/groups/' + group.id + '/join-requests', 'usr_student_07', 'POST', { message: 'Please approve me.' });
  assert.equal((await api('/groups/' + group.id + '/join-requests', 'usr_student_07', 'POST', {})).error.code, 'REQUEST_PENDING');
  assert.equal((await api('/groups/' + group.id + '/join-requests/' + request.data.id + '/approve', 'usr_manager_03', 'POST')).status, 403);
  assert.equal((await api('/groups/grp_01/join-requests/' + request.data.id + '/approve', 'usr_student_01', 'POST')).status, 404);
  assert.equal((await api('/groups/' + group.id + '/join-requests/' + request.data.id + '/approve', 'usr_student_01', 'POST')).status, 200);
  assert.equal((await api('/groups/' + group.id + '/join-requests/' + request.data.id + '/approve', 'usr_student_01', 'POST')).error.code, 'REQUEST_RESOLVED');
  assert.equal((await api('/groups/' + group.id + '/join-requests', 'usr_manager_03', 'POST', {})).error.code, 'GROUP_FULL');
  assert.equal((await api('/groups/' + group.id + '/settings', 'usr_student_01', 'PUT', { memberLimit: 1 })).status, 422);
  assert.equal((await api('/groups/' + group.id + '/settings', 'usr_student_01', 'PUT', { ownerId: 'usr_student_07' })).data.ownerId, 'usr_student_01');
  assert.equal((await api('/groups/' + group.id + '/members/usr_student_01', 'usr_student_01', 'DELETE')).error.code, 'OWNER_REQUIRED');
  assert.equal((await api('/groups/' + group.id + '/members/usr_student_07', 'usr_manager_03', 'DELETE')).status, 403);
  assert.equal((await api('/groups/' + group.id + '/members/usr_student_07', 'usr_student_01', 'DELETE')).status, 200);
  assert.equal(seedGroups.find((item) => item.id === group.id).memberCount, 1);
  assert.deepEqual(seedConversations.find((item) => item.refId === group.id).participantIds, ['usr_student_01']);
});

test('invitations can be answered only by recipients and closing revokes members and pending work', async () => {
  const group = await createGroup('approval', 3);
  const invitation = await api('/groups/' + group.id + '/invitations', 'usr_student_01', 'POST', { userId: 'usr_student_07' });
  assert.equal(invitation.status, 200);
  assert.equal((await api('/groups/' + group.id + '/invitations', 'usr_student_01', 'POST', { userId: 'usr_student_07' })).error.code, 'INVITATION_PENDING');
  assert.equal((await api('/groups/' + group.id + '/invitations/' + invitation.data.id + '/accept', 'usr_manager_03', 'POST')).status, 403);
  assert.equal((await api('/groups/' + group.id + '/invitations/' + invitation.data.id + '/accept', 'usr_student_07', 'POST')).status, 200);
  assert.equal((await api('/groups/' + group.id + '/invitations/' + invitation.data.id + '/accept', 'usr_student_07', 'POST')).error.code, 'INVITATION_RESOLVED');
  const pending = await api('/groups/' + group.id + '/invitations', 'usr_student_01', 'POST', { userId: 'usr_student_03' });
  const request = await api('/groups/' + group.id + '/join-requests', 'usr_mentor_02', 'POST', {});
  assert.equal((await api('/groups/' + group.id + '/close', 'usr_student_07', 'POST', { reason: 'Done' })).status, 403);
  assert.equal((await api('/groups/' + group.id + '/close', 'usr_student_01', 'POST', { reason: '' })).status, 422);
  const closed = await api('/groups/' + group.id + '/close', 'usr_student_01', 'POST', { reason: 'Course completed' });
  assert.equal(closed.data.status, 'Closed');
  assert.equal(closed.data.memberCount, 0);
  assert.equal(seedGroupInvitations.find((item) => item.id === pending.data.id).status, 'Cancelled');
  assert.equal(seedJoinRequests.find((item) => item.id === request.data.id).status, 'Cancelled');
  assert.deepEqual(seedConversations.find((item) => item.refId === group.id).participantIds, []);
  assert.equal((await api('/groups')).data.some((item) => item.id === group.id), false);
  assert.equal((await api('/groups/' + group.id + '/join-requests', 'usr_student_07', 'POST', {})).error.code, 'GROUP_CLOSED');
  assert.equal((await api('/groups', null, 'POST', { name: 'Guest group' })).status, 401);
});

test('message invitations create a real direct request and reject duplicates', async () => {
  const group = await createGroup();
  const sent = await api('/groups/' + group.id + '/message-invitations', 'usr_student_01', 'POST', { userId: 'usr_student_07', message: 'Would you join our group?' });
  assert.equal(sent.status, 200);
  const conversation = seedConversations.find((item) => item.id === sent.data.id);
  assert.equal(conversation.requestStatus, 'pending');
  assert.equal(conversation.requestedBy, 'usr_student_01');
  assert.equal(seedMessages.some((item) => item.conversationId === conversation.id && item.content === 'Would you join our group?'), true);
  assert.equal((await api('/groups/' + group.id + '/message-invitations', 'usr_student_01', 'POST', { userId: 'usr_student_07', message: 'Again' })).error.code, 'MESSAGE_INVITATION_PENDING');
});

test('notifications and follow decisions belong to the authenticated recipient', async () => {
  const notifications = await api('/notifications', 'usr_student_01');
  assert.equal(notifications.data.every((item) => item.userId === 'usr_student_01'), true);
  assert.equal((await api('/notifications/notif_04/read', 'usr_student_01', 'POST')).status, 403);
  assert.equal((await api('/notifications/notif_01/read', null, 'POST')).status, 401);
  assert.equal((await api('/notifications/notif_01/read', 'usr_student_01', 'POST')).status, 200);
  const requests = await api('/follow-requests');
  assert.equal(requests.data.incoming.every((item) => item.followeeId === 'usr_student_01' && item.status === 'Pending'), true);
  assert.ok(requests.data.incoming.some((item) => item.id === 'flw_02'));
  assert.equal((await api('/follow-requests/flw_02/respond', 'usr_student_07', 'PUT', { action: 'accept' })).status, 403);
  assert.equal((await api('/follow-requests/flw_02/respond', 'usr_student_01', 'PUT', { action: 'accept' })).status, 200);
  assert.equal(seedFollows.find((item) => item.id === 'flw_02').status, 'Active');
  assert.equal((await api('/follow-requests')).data.incoming.some((item) => item.id === 'flw_02'), false);
  assert.equal((await api('/follow-requests/flw_02/respond', 'usr_student_01', 'PUT', { action: 'decline' })).status, 409);
  assert.equal((await api('/follow-requests/flw_03/respond', 'usr_student_01', 'PUT', { action: 'decline' })).status, 200);
  assert.equal(seedFollows.find((item) => item.id === 'flw_03').status, 'Declined');
});

test('group actions refresh list, history, group chat and navigation queries', async () => {
  const client = new QueryClient();
  const keys = [['groups', 'list'], ['groups', 'mine', 'member'], ['groups', 'myJoinRequests'], ['group-invitations', 'mine'], ['chat', 'group', 'grp_01'], ['notifications', 'list', { read: false }], ['nav', 'counters']];
  keys.forEach((key) => client.setQueryData(key, []));
  await invalidateGroupQueries(client);
  keys.forEach((key) => assert.equal(client.getQueryState(key).isInvalidated, true));
  client.clear();
});

test('a follow decision cannot overwrite another response while reading its body', async () => {
  const item = { id: 'flw_regression_race', followerId: 'usr_student_07', followeeId: 'usr_student_01', status: 'Pending', createdAt: new Date().toISOString() };
  seedFollows.push(item);
  const handler = notificationHandlers.find((entry) => entry.info.method === 'PUT' && entry.info.path.endsWith('/respond'));
  const release = [];
  const replies = ['accept', 'decline'].map((action) => {
    const request = new Request('http://localhost/api/v1/follow-requests/' + item.id + '/respond', { method: 'PUT', headers: { Authorization: 'Bearer mock_jwt_token_usr_student_01' } });
    request.json = () => new Promise((resolve) => release.push(() => resolve({ action })));
    return handler.resolver({ params: { id: item.id }, request });
  });
  assert.equal(release.length, 2);
  release.forEach((resolve) => resolve());
  const responses = await Promise.all(replies);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(item.status, 'Active');
});

test('group confirmation retains failed input, permits cancellation and closes after retry', async () => {
  const transitions = [];
  const dialog = createGroupDialogAction((open) => transitions.push(open));
  await dialog.submit(async () => { throw new Error('Mock API failure'); });
  dialog.changeOpen(false); // Shared dialog automatically closes after onConfirm.
  assert.deepEqual(transitions, []);
  dialog.changeOpen(false); // The user can still cancel after seeing the error.
  assert.deepEqual(transitions, [false]);
  await dialog.submit(async () => {});
  dialog.changeOpen(false);
  assert.deepEqual(transitions, [false, false]);

  let complete;
  const pending = dialog.submit(() => new Promise((resolve) => { complete = resolve; }));
  dialog.changeOpen(false); // Escape and backdrop clicks must not hide pending work.
  assert.deepEqual(transitions, [false, false]);
  complete();
  await pending;
  dialog.changeOpen(false);
  assert.deepEqual(transitions, [false, false, false]);
});
