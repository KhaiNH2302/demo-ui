import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptSwapInvitation, createSwapInvitation, rejectSwapInvitation, SwapRuleError } from '../src/features/swap/swapTransactions.ts';
import type { SwapConnection, SwapRequest } from '../src/types/entities.ts';

const now = '2026-10-09T10:00:00Z';
function request(id: string, studentId: string, offeringId = 'off_01'): SwapRequest {
  return { id, studentId, offeringId, currentClassCode: 'SE1', targetClassCode: 'SE2', status: 'Open', version: 1, createdAt: now, updatedAt: now };
}
function fixture() {
  const requests = [request('a', 'alice'), request('b', 'bob'), request('c', 'carol'), request('d', 'dave')];
  const connections: SwapConnection[] = [];
  createSwapInvitation(requests, connections, 'alice', { requestAId: 'a', requestBId: 'b' }, 'ab', now);
  return { requests, connections };
}
function hasCode(code: string) {
  return (error: unknown) => error instanceof SwapRuleError && error.code === code;
}

test('accept once, connect both requests, then reject repeated accept without further mutation', () => {
  const { requests, connections } = fixture();
  acceptSwapInvitation(requests, connections, 'ab', 'bob', now, { requestAVersion: 1, requestBVersion: 1 });
  assert.equal(connections[0].status, 'Confirmed');
  assert.deepEqual(requests.slice(0, 2).map((item) => [item.status, item.version]), [['Connected', 2], ['Connected', 2]]);
  const snapshot = structuredClone({ requests, connections });
  assert.throws(() => acceptSwapInvitation(requests, connections, 'ab', 'bob', now), hasCode('CONNECTION_NOT_PENDING'));
  assert.deepEqual({ requests, connections }, snapshot);
});

test('first winner cancels competitors sharing either request; independent requests remain open', () => {
  const { requests, connections } = fixture();
  createSwapInvitation(requests, connections, 'carol', { requestAId: 'c', requestBId: 'b' }, 'cb', now);
  createSwapInvitation(requests, connections, 'alice', { requestAId: 'a', requestBId: 'd' }, 'ad', now);
  acceptSwapInvitation(requests, connections, 'ab', 'bob', now);
  assert.deepEqual(connections.filter((item) => item.id !== 'ab').map((item) => item.status), ['Cancelled', 'Cancelled']);
  assert.equal(requests[2].status, 'Open');
  assert.equal(requests[3].status, 'Open');
  const snapshot = structuredClone({ requests, connections });
  assert.throws(() => acceptSwapInvitation(requests, connections, 'cb', 'bob', now), hasCode('CONNECTION_NOT_PENDING'));
  assert.throws(() => acceptSwapInvitation(requests, connections, 'ad', 'dave', now), hasCode('CONNECTION_NOT_PENDING'));
  assert.deepEqual({ requests, connections }, snapshot);
});

test('wrong recipient, initiator and guest cannot accept or mutate a pending invitation', () => {
  const { requests, connections } = fixture();
  const snapshot = structuredClone({ requests, connections });
  for (const viewer of ['carol', 'alice', 'guest']) {
    assert.throws(() => acceptSwapInvitation(requests, connections, 'ab', viewer, now), hasCode('FORBIDDEN'));
  }
  assert.deepEqual({ requests, connections }, snapshot);
});

test('duplicates in either direction and invitations on another owner request are rejected', () => {
  const { requests, connections } = fixture();
  const snapshot = structuredClone({ requests, connections });
  assert.throws(() => createSwapInvitation(requests, connections, 'alice', { requestAId: 'a', requestBId: 'b' }, 'duplicate', now), hasCode('DUPLICATE_PENDING_CONNECTION'));
  assert.throws(() => createSwapInvitation(requests, connections, 'bob', { requestAId: 'b', requestBId: 'a' }, 'reverse', now), hasCode('DUPLICATE_PENDING_CONNECTION'));
  assert.throws(() => createSwapInvitation(requests, connections, 'carol', { requestAId: 'a', requestBId: 'c' }, 'foreign', now), hasCode('FORBIDDEN'));
  assert.deepEqual({ requests, connections }, snapshot);
});

test('closed requests and changed versions cannot be accepted', () => {
  const { requests, connections } = fixture();
  requests[0].version = 2;
  assert.throws(() => acceptSwapInvitation(requests, connections, 'ab', 'bob', now, { requestAVersion: 1 }), hasCode('VERSION_CONFLICT'));
  requests[0].status = 'Cancelled';
  assert.throws(() => acceptSwapInvitation(requests, connections, 'ab', 'bob', now), hasCode('SWAP_ALREADY_CONNECTED'));
  assert.equal(connections[0].status, 'Pending');
  assert.equal(requests[1].status, 'Open');
});

test('recipient can reject and initiator can withdraw; outsiders cannot mutate either', () => {
  const { connections } = fixture();
  assert.throws(() => rejectSwapInvitation(connections, 'ab', 'carol', now), hasCode('FORBIDDEN'));
  rejectSwapInvitation(connections, 'ab', 'alice', now);
  assert.equal(connections[0].status, 'Cancelled');
  const other = fixture();
  rejectSwapInvitation(other.connections, 'ab', 'bob', now);
  assert.equal(other.connections[0].status, 'Rejected');
  assert.throws(() => rejectSwapInvitation(other.connections, 'ab', 'bob', now), hasCode('CONNECTION_NOT_PENDING'));
});
