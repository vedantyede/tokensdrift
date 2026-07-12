import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IgnoreMatcher } from '../src/ignore.js';

test('IgnoreMatcher excludes .test./.spec. files and __tests__ directories by default', () => {
  const m = new IgnoreMatcher();

  assert.equal(m.isIgnored('src/lib/colors.test.ts', false), true);
  assert.equal(m.isIgnored('src/lib/colors.spec.tsx', false), true);
  assert.equal(m.isIgnored('src/lib/colors.test.js', false), true);
  assert.equal(m.isIgnored('__tests__/fixtures/colors.ts', false), true);

  // Real UI code should still be scanned, including files that merely
  // contain "test" as a substring rather than matching the .test./.spec.
  // suffix convention.
  assert.equal(m.isIgnored('src/components/Button.tsx', false), false);
  assert.equal(m.isIgnored('src/lib/latest-changes.ts', false), false);
});
