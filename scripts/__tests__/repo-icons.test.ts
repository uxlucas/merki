import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { formatViolation, lintAll } from '../lib/lint-all.js';

it('every icon in icons/ passes the rules', async () => {
  const { violations } = await lintAll(fileURLToPath(new URL('../../icons', import.meta.url)));
  expect(violations.map(formatViolation)).toEqual([]);
});
