import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadIcons } from '../lib/load.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'merki-load-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('loadIcons', () => {
  it('pairs svg and json files by name, sorted by name', async () => {
    await writeFile(join(dir, 'search.svg'), '<svg/>');
    await writeFile(join(dir, 'search.json'), '{}');
    await writeFile(join(dir, 'home.svg'), '<svg/>');

    const { icons, orphans } = await loadIcons(dir);

    expect(icons.map((i) => [i.name, i.metaJson])).toEqual([
      ['home', null],
      ['search', '{}'],
    ]);
    expect(orphans).toEqual([]);
  });

  it('reports json files without a matching svg as orphans', async () => {
    await writeFile(join(dir, 'bell.json'), '{}');

    const { icons, orphans } = await loadIcons(dir);

    expect(icons).toEqual([]);
    expect(orphans).toEqual(['bell']);
  });

  it('ignores files that start with _ or .', async () => {
    await writeFile(join(dir, '_review.json'), '{}');
    await writeFile(join(dir, '.gitkeep'), '');
    await writeFile(join(dir, '_draft.svg'), '<svg/>');

    const { icons, orphans } = await loadIcons(dir);

    expect(icons).toEqual([]);
    expect(orphans).toEqual([]);
  });
});
