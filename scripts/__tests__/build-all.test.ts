import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildAll, type BuildPaths } from '../lib/build-all.js';
import { HOME_SVG, SEARCH_SVG, meta, wrap } from './fixtures.js';

let root: string;
let paths: BuildPaths;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'merki-build-'));
  paths = {
    iconsDir: join(root, 'icons'),
    packageDir: join(root, 'pkg'),
    siteDataFile: join(root, 'site', 'icons.json'),
  };
  await mkdir(paths.iconsDir);
  await writeFile(join(paths.iconsDir, 'home.svg'), HOME_SVG);
  await writeFile(join(paths.iconsDir, 'home.json'), meta('navigation'));
  await writeFile(join(paths.iconsDir, 'search.svg'), SEARCH_SVG);
  await writeFile(join(paths.iconsDir, 'search.json'), meta('navigation'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('buildAll', () => {
  it('writes sized SVGs, icon modules, the index and site data', async () => {
    const result = await buildAll(paths);

    expect(result).toEqual({ count: 2, violations: [] });
    const svg = await readFile(join(paths.packageDir, 'svg', 'home.svg'), 'utf8');
    expect(svg).toMatch(/^<svg width="16" height="16"/);
    const module = await readFile(join(paths.packageDir, 'src', 'icons', 'search.ts'), 'utf8');
    expect(module).toContain('export const SearchIcon = /* @__PURE__ */ createIcon("search", [');
    const index = await readFile(join(paths.packageDir, 'src', 'index.ts'), 'utf8');
    expect(index).toContain('export { HomeIcon } from "./icons/home.js";');
    const site = JSON.parse(await readFile(paths.siteDataFile, 'utf8'));
    expect(site.map((icon: { name: string }) => icon.name)).toEqual(['home', 'search']);
  });

  it('removes generated files for icons that no longer exist', async () => {
    await buildAll(paths);
    await rm(join(paths.iconsDir, 'search.svg'));
    await rm(join(paths.iconsDir, 'search.json'));

    await buildAll(paths);

    expect(existsSync(join(paths.packageDir, 'svg', 'search.svg'))).toBe(false);
    expect(existsSync(join(paths.packageDir, 'src', 'icons', 'search.ts'))).toBe(false);
  });

  it('writes nothing when any icon breaks a rule', async () => {
    await writeFile(join(paths.iconsDir, 'bad.svg'), wrap('<path d="M2.1 2h4"/>'));
    await writeFile(join(paths.iconsDir, 'bad.json'), meta('navigation'));

    const result = await buildAll(paths);

    expect(result.count).toBe(0);
    expect(result.violations.map((v) => v.rule)).toEqual(['grid']);
    expect(existsSync(paths.packageDir)).toBe(false);
  });
});
