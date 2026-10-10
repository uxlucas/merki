import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readLabIcons } from './lab-plugin';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'merki-lab-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('readLabIcons', () => {
  it('reads every svg with its metadata, skipping _ and . files', async () => {
    await writeFile(join(dir, 'search.svg'), '﻿<svg/>');
    await writeFile(join(dir, 'search.json'), '{"category":"navigation","tags":[],"aliases":[]}');
    await writeFile(join(dir, 'bell.svg'), '<svg/>');
    await writeFile(join(dir, 'bell.json'), '{ broken');
    await writeFile(join(dir, 'home.svg'), '<svg/>');
    await writeFile(join(dir, '_review.json'), '{}');
    await writeFile(join(dir, '.gitkeep'), '');

    expect(readLabIcons(dir)).toEqual([
      { name: 'bell', svg: '<svg/>', meta: null },
      { name: 'home', svg: '<svg/>', meta: null },
      { name: 'search', svg: '<svg/>', meta: { category: 'navigation', tags: [], aliases: [] } },
    ]);
  });
});
