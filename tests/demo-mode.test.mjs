import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDemoEnvironment } from '../src/lib/demoMode.ts';
test('production does not enable demo auth unless mock mode is explicitly selected', () => {
  assert.equal(isDemoEnvironment({ DEV: false }), false);
  assert.equal(isDemoEnvironment({ DEV: false, VITE_USE_MOCK: 'false' }), false);
  assert.equal(isDemoEnvironment({ DEV: false, VITE_USE_MOCK: 'true' }), true);
  assert.equal(isDemoEnvironment({ DEV: true }), true);
});
