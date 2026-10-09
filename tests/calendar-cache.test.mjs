import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { localDateKey, localEventTime } from '../src/lib/calendarDate.ts';
import { queryKeys } from '../src/lib/queryKeys.ts';

test('calendar date and event keys agree in positive and negative UTC offsets', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['Asia/Bangkok', 'UTC', 'America/Los_Angeles']) {
      process.env.TZ = timezone;
      assert.equal(localDateKey(new Date(2026, 9, 3)), '2026-10-03');
    }
    process.env.TZ = 'Asia/Bangkok';
    assert.equal(localDateKey('2026-10-03T07:30:00Z'), '2026-10-03');
    assert.equal(localEventTime('2026-10-03T07:30:00Z'), '14:30');
    assert.equal(localDateKey('2026-10-03T23:30:00Z'), '2026-10-04');
    assert.equal(localDateKey('2026-12-31T23:30:00Z'), '2027-01-01');
    assert.equal(localDateKey('invalid'), '');
    assert.equal(localEventTime('invalid'), '');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('unfiltered notification and swap keys invalidate every filtered list', async () => {
  const client = new QueryClient();
  const lists = [
    [queryKeys.notifications.list({ read: false, source: 'Swap' }), queryKeys.notifications.list()],
    [queryKeys.notifications.list({ read: true }), queryKeys.notifications.list()],
    [queryKeys.swap.connections({ direction: 'incoming' }), queryKeys.swap.connections()],
    [queryKeys.swap.connections({ direction: 'outgoing' }), queryKeys.swap.connections()],
  ];
  for (const [key] of lists) client.setQueryData(key, []);
  for (const [, prefix] of lists) await client.invalidateQueries({ queryKey: prefix });
  for (const [key] of lists) assert.equal(client.getQueryState(key)?.isInvalidated, true);
  client.clear();
});
