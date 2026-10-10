import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatViolation, lintAll } from '../lib/lint-all.js';
import { HOME_SVG, meta, wrap } from './fixtures.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'merki-lint-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('lintAll', () => {
  it('returns clean icons and collects violations from the rest', async () => {
    await writeFile(join(dir, 'home.svg'), HOME_SVG);
    await writeFile(join(dir, 'home.json'), meta('navigation'));
    await writeFile(join(dir, 'bad.svg'), wrap('<path d="M2.1 2h4"/>'));
    await writeFile(join(dir, 'bad.json'), meta('navigation'));
    await writeFile(join(dir, 'broken.svg'), '<svg><path></svg>');
    await writeFile(join(dir, 'broken.json'), meta('navigation'));
    await writeFile(join(dir, 'lonely.json'), meta('navigation'));

    const { icons, violations } = await lintAll(dir);

    expect(icons.map((i) => i.name)).toEqual(['home']);
    expect(icons[0].meta.category).toBe('navigation');
    expect(violations.map((v) => `${v.icon}:${v.rule}`).sort()).toEqual(['bad:grid', 'broken:parse', 'lonely:orphan']);
  });

  it('formats violations as name: rule: detail', () => {
    expect(formatViolation({ icon: 'bell', rule: 'grid', detail: '<path> #1: 2.1 not on the 0.25 grid' })).toBe(
      'bell: grid: <path> #1: 2.1 not on the 0.25 grid',
    );
  });
});
