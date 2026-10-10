# Keyline Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Keyline pipeline end to end: icon linter → optimizer → generated React package → `/lab` review page. Then prove it with the first 16 icons.

**Architecture:** SVG files in `icons/` are the only source. A Node pipeline in `scripts/` lints them against the spec's rules, optimizes them conservatively, and generates per-icon React modules plus site data. `packages/keyline` holds a small hand-written runtime (`createIcon`) and the generated modules, built per-file with tsup so they tree-shake. `site/` is a Vite + React app whose only real page in this plan is `/lab`. `/lab` reads `icons/` live through a dev-server plugin and stores review notes in `icons/_review.json`.

**Tech Stack:** Node ≥ 22, npm workspaces, TypeScript 5.9, tsx, vitest 3 (+ jsdom, Testing Library), svgson, svgpath, svg-path-bbox, svgo 4, tsup 8, esbuild, React 19, Vite 7.

**Spec:** `docs/specs/2026-10-10-keyline-design.md`. Read §2 (icon rules), §4 (repo and build) and §5 (React API) before starting. This plan covers spec build-order step 1 (foundation). Later plans cover the rest of the set, the site, Figma and release.

## Global Constraints

- ESM everywhere: every `package.json` has `"type": "module"`. Relative imports in `scripts/` and `packages/` use `.js` extensions (`./load.js`), because those files run in Node or ship to npm. `site/` files are Vite-bundled and use extensionless imports.
- Icon canvas: `viewBox="0 0 16 16"`. Nothing drawn outside 1–15, stroke width (0.75 per side) included.
- Root `<svg>` attributes, exactly: `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`. `xmlns` is optional, the rest are required.
- Anchors (path endpoints, arc radii, cx/cy/r, x/y/width/height/rx, line ends) on a 0.25 grid. Bézier handles have at most 2 decimals.
- Allowed elements: `path`, `circle`, `rect`, `line`. Allowed attributes — path: `d fill stroke fill-rule`; circle: `cx cy r fill stroke stroke-dasharray stroke-dashoffset`; rect: `x y width height rx fill stroke`; line: `x1 y1 x2 y2`.
- Colors: `fill` and `stroke` values are only `currentColor` or `none`.
- Categories (exact ids): `navigation, actions, status, people, objects, data, communication, system, text, billing`.
- Icon names are kebab-case: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. React exports are `<PascalName>Icon` (`arrow-up-right` → `ArrowUpRightIcon`, `x` → `XIcon`).
- Component defaults: `size` 16, stroke `currentColor`, `aria-hidden="true"` and `focusable="false"` unless labelled. No hooks, no context, no generated ids. No `strokeWidth` prop and no dynamic `<Icon name>`.
- Package: name `keyline`, ESM-only, `"sideEffects": false`, peer `react >= 18`, `"private": true` until the release plan flips it.
- Generated files are never committed or hand-edited: `packages/keyline/src/icons/`, `packages/keyline/src/index.ts`, `packages/keyline/svg/`, `packages/keyline/dist/`, `site/src/data/icons.json`.
- Files in `icons/` that start with `_` or `.` are not icons (`_review.json`, `.gitkeep`).
- Every commit ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

These are the failure modes most likely to hurt a real user that the spec implies but doesn't spell out. Each one has a pinning test in the task named in brackets.

1. **The same icon twice on one page.** No `id` may appear in the rendered output, or the second copy breaks. [Task 5: `renders no ids, even twice`]
2. **`color="red"` must recolor solid accents too.** If `color` only set `stroke`, `fill="currentColor"` parts would stay the text color. Expected: everything turns red. [Task 5: `color recolors fills and strokes alike`]
3. **A developer labels an icon with `aria-label` instead of `title`.** Expected: the icon is announced (`role="img"`), not hidden. [Task 5: `aria-label alone still makes it visible to screen readers`]
4. **An SVG pasted from Figma or saved on Windows.** BOM, CRLF, `width`/`height`, `fill="#000"`, a `<g>` wrapper. Expected: clear rule violations naming the icon and rule, never a crash or a silent pass. [Task 1: `tolerates a BOM and CRLF line endings`; Task 3: `reports every problem in a typical Figma paste`]
5. **A hand-edited `_review.json` with broken JSON.** Expected: the lab reports an error and **never overwrites** the file, so Lucas's notes aren't lost. [Task 6: `refuses to parse broken JSON instead of resetting it`]

---

## File map

```
package.json                      root: workspaces, scripts, all devDependencies
tsconfig.json                     root type-check config (scripts, package, site)
vitest.config.ts                  one test runner for the repo
.gitignore
.github/workflows/ci.yml          lint:icons → build → typecheck → test
LICENSE                           MIT
icons/                            masters: name.svg + name.json (+ _review.json)
scripts/
  lint.ts                         CLI: lint icons/, exit 1 on violations
  build.ts                        CLI: lint + generate everything
  lib/categories.ts               CATEGORIES, Category, IconMeta
  lib/load.ts                     loadIcons(dir) → svg/json pairs + orphans
  lib/parse.ts                    parseSvg(text) → SvgElement tree
  lib/geometry.ts                 elementBBox, geometryValues, onQuarterGrid, hasAtMostTwoDecimals
  lib/rules.ts                    lintName, lintMeta, lintSvg, Violation
  lib/lint-all.ts                 lintAll(dir), formatViolation
  lib/optimize.ts                 optimizeSvg, withSize
  lib/react.ts                    componentName, toIconNode, renderIconModule, renderIndex
  lib/site-data.ts                SiteIcon, toSiteIcon
  lib/build-all.ts                buildAll(paths)
  __tests__/fixtures.ts           shared SVG/JSON strings
  __tests__/*.test.ts
packages/keyline/
  package.json, tsconfig.json, tsup.config.ts
  src/create-icon.ts              hand-written runtime
  test/create-icon.test.ts        jsdom
  test/treeshake.test.ts
site/
  package.json, index.html, vite.config.ts
  lab-plugin.ts                   virtual:keyline-icons + /__lab/review middleware
  lab-plugin.test.ts
  src/main.tsx, src/virtual.d.ts
  src/lab/types.ts, review.ts, review.test.ts
  src/lab/IconGlyph.tsx, KeylineOverlay.tsx, Ladder.tsx, GridView.tsx,
          MenuMock.tsx, Compare.tsx, ReviewPanel.tsx, Lab.tsx, Lab.test.tsx, lab.css
```

---

### Task 1: Workspace, icon loading and SVG parsing

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `LICENSE`, `icons/.gitkeep`
- Create: `scripts/lib/categories.ts`, `scripts/lib/load.ts`, `scripts/lib/parse.ts`
- Test: `scripts/__tests__/load.test.ts`, `scripts/__tests__/parse.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CATEGORIES: readonly Category[]`, `type Category`, `interface IconMeta { category: Category; tags: string[]; aliases: string[] }` (from `scripts/lib/categories.ts`)
  - `interface IconSource { name: string; svg: string; metaJson: string | null }`, `interface LoadResult { icons: IconSource[]; orphans: string[] }`, `loadIcons(dir: string): Promise<LoadResult>`
  - `interface SvgElement { tag: string; attrs: Record<string, string>; children: SvgElement[] }`, `parseSvg(svg: string): Promise<SvgElement>`

- [ ] **Step 1: Create the root files**

`package.json`:
```json
{
  "name": "keyline-repo",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*", "site"],
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vite/client"]
  },
  "include": ["scripts", "packages/keyline/src", "packages/keyline/test", "site/src", "site/*.ts", "vitest.config.ts"]
}
```

`vitest.config.ts`:
```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      'scripts/**/*.test.ts',
      'packages/**/test/**/*.test.{ts,tsx}',
      'site/**/*.test.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
  },
});
```

`.gitignore`:
```
node_modules/
dist/
packages/keyline/svg/
packages/keyline/src/icons/
packages/keyline/src/index.ts
site/src/data/icons.json
*.log
.DS_Store
```

`LICENSE`:
```
MIT License

Copyright (c) 2026 Lucas Lima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`icons/.gitkeep`: empty file.

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
npm install -D typescript@~5.9.3 tsx@^4.20.0 vitest@^3.2.0 jsdom@^26.1.0 @testing-library/react@^16.3.0 @testing-library/dom@^10.4.0 @types/node@^22 svgson@^5.3.1 svgpath@^2.6.0 svg-path-bbox@^2.1.0 svgo@^4.0.0 tsup@^8.5.0 esbuild@^0.25.0 react@^19.1.0 react-dom@^19.1.0 @types/react@^19.1.0 @types/react-dom@^19.1.0 vite@^7.0.0 @vitejs/plugin-react@^5.0.0
```
Expected: `package-lock.json` created, no errors. `npm install` warns that `site` and `packages/*` don't exist yet. That's fine.

- [ ] **Step 3: Write `scripts/lib/categories.ts`**

```ts
export const CATEGORIES = [
  'navigation',
  'actions',
  'status',
  'people',
  'objects',
  'data',
  'communication',
  'system',
  'text',
  'billing',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface IconMeta {
  category: Category;
  tags: string[];
  aliases: string[];
}
```

- [ ] **Step 4: Write the failing load test**

`scripts/__tests__/load.test.ts`:
```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadIcons } from '../lib/load.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'keyline-load-'));
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
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/load.test.ts`
Expected: FAIL, `Failed to load url ../lib/load.js` (or "Cannot find module").

- [ ] **Step 6: Implement `scripts/lib/load.ts`**

```ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface IconSource {
  name: string;
  svg: string;
  metaJson: string | null;
}

export interface LoadResult {
  icons: IconSource[];
  orphans: string[];
}

export async function loadIcons(dir: string): Promise<LoadResult> {
  const files = (await readdir(dir)).filter((f) => !f.startsWith('_') && !f.startsWith('.'));
  const svgNames = files
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length))
    .sort();
  const jsonNames = new Set(files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -'.json'.length)));

  const icons = await Promise.all(
    svgNames.map(async (name) => ({
      name,
      svg: await readFile(join(dir, `${name}.svg`), 'utf8'),
      metaJson: jsonNames.has(name) ? await readFile(join(dir, `${name}.json`), 'utf8') : null,
    })),
  );

  const svgSet = new Set(svgNames);
  const orphans = [...jsonNames].filter((name) => !svgSet.has(name)).sort();
  return { icons, orphans };
}
```

- [ ] **Step 7: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/load.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Write the failing parse test**

`scripts/__tests__/parse.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseSvg } from '../lib/parse.js';

describe('parseSvg', () => {
  it('returns the root and its element children with attributes', async () => {
    const root = await parseSvg('<svg viewBox="0 0 16 16"><path d="M2 2h12"/><circle cx="8" cy="8" r="2"/></svg>');

    expect(root.tag).toBe('svg');
    expect(root.attrs.viewBox).toBe('0 0 16 16');
    expect(root.children.map((c) => c.tag)).toEqual(['path', 'circle']);
    expect(root.children[0].attrs.d).toBe('M2 2h12');
  });

  it('drops text nodes between elements', async () => {
    const root = await parseSvg('<svg>\n  <path d="M2 2h12"/>\n</svg>');
    expect(root.children).toHaveLength(1);
  });

  it('keeps nested elements so the linter can report them', async () => {
    const root = await parseSvg('<svg><g><path d="M2 2h12"/></g></svg>');
    expect(root.children[0].tag).toBe('g');
    expect(root.children[0].children[0].tag).toBe('path');
  });

  it('tolerates a BOM and CRLF line endings', async () => {
    const root = await parseSvg('﻿<svg viewBox="0 0 16 16">\r\n  <path d="M2 2h12"/>\r\n</svg>\r\n');
    expect(root.children.map((c) => c.tag)).toEqual(['path']);
  });

  it('throws a readable error for malformed markup', async () => {
    await expect(parseSvg('<svg><path></svg>')).rejects.toThrow(/could not parse SVG/);
    await expect(parseSvg('not xml')).rejects.toThrow(/could not parse SVG/);
  });
});
```

- [ ] **Step 9: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/parse.test.ts`
Expected: FAIL, cannot find `../lib/parse.js`.

- [ ] **Step 10: Implement `scripts/lib/parse.ts`**

```ts
import { parse } from 'svgson';

export interface SvgElement {
  tag: string;
  attrs: Record<string, string>;
  children: SvgElement[];
}

interface SvgsonNode {
  name: string;
  type: string;
  attributes: Record<string, string>;
  children: SvgsonNode[];
}

function toElement(node: SvgsonNode): SvgElement {
  return {
    tag: node.name,
    attrs: { ...node.attributes },
    children: node.children.filter((child) => child.type === 'element').map(toElement),
  };
}

export async function parseSvg(svg: string): Promise<SvgElement> {
  let root: SvgsonNode;
  try {
    root = (await parse(svg.replace(/^﻿/, ''))) as SvgsonNode;
  } catch (error) {
    throw new Error(`could not parse SVG: ${(error as Error).message}`);
  }
  if (root.name !== 'svg') throw new Error(`could not parse SVG: root is <${root.name}>, expected <svg>`);
  return toElement(root);
}
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `npx vitest run scripts/__tests__`
Expected: PASS (8 tests).

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore LICENSE icons/.gitkeep scripts
git commit -m "feat: workspace, icon loading and SVG parsing" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Geometry, the numbers the rules check

**Files:**
- Create: `scripts/lib/geometry.ts`
- Test: `scripts/__tests__/geometry.test.ts`

**Interfaces:**
- Consumes: `SvgElement` from `scripts/lib/parse.ts`.
- Produces:
  - `type BBox = readonly [minX: number, minY: number, maxX: number, maxY: number]`
  - `elementBBox(el: SvgElement): BBox`. Geometric box without stroke. Throws `Error` for unknown tags or invalid path data.
  - `interface GeometryValues { anchors: number[]; handles: number[] }`, `geometryValues(el: SvgElement): GeometryValues`. Throws like `elementBBox`.
  - `onQuarterGrid(v: number): boolean`, `hasAtMostTwoDecimals(v: number): boolean`

- [ ] **Step 1: Write the failing test**

`scripts/__tests__/geometry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { elementBBox, geometryValues, hasAtMostTwoDecimals, onQuarterGrid } from '../lib/geometry.js';
import type { SvgElement } from '../lib/parse.js';

const el = (tag: string, attrs: Record<string, string>): SvgElement => ({ tag, attrs, children: [] });

describe('elementBBox', () => {
  it('measures circles, rects and lines', () => {
    expect(elementBBox(el('circle', { cx: '7', cy: '7', r: '4.5' }))).toEqual([2.5, 2.5, 11.5, 11.5]);
    expect(elementBBox(el('rect', { x: '2.25', y: '2.75', width: '11.5', height: '11' }))).toEqual([2.25, 2.75, 13.75, 13.75]);
    expect(elementBBox(el('line', { x1: '12', y1: '2', x2: '4', y2: '6' }))).toEqual([4, 2, 12, 6]);
  });

  it('measures paths including arcs', () => {
    const [minX, minY, maxX, maxY] = elementBBox(el('path', { d: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 1 1 0-12.5Z' }));
    expect([minX, minY, maxX, maxY].map((n) => Math.round(n * 1000) / 1000)).toEqual([1.75, 1.75, 14.25, 14.25]);
  });

  it('throws on broken path data', () => {
    expect(() => elementBBox(el('path', { d: 'M2 2 Q' }))).toThrow(/path data/);
  });
});

describe('geometryValues', () => {
  it('separates anchors from bezier handles in absolute coordinates', () => {
    const { anchors, handles } = geometryValues(el('path', { d: 'M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75' }));
    expect(anchors).toEqual([3, 13.25, 8, 9.5, 13, 13.25]);
    expect(handles.map((n) => Math.round(n * 100) / 100)).toEqual([3.45, 10.95, 5.45, 9.5, 12.55, 10.95]);
  });

  it('treats arc radii and endpoints as anchors and skips flags', () => {
    const { anchors, handles } = geometryValues(el('path', { d: 'M4 4a2 2 0 0 1 2 2' }));
    expect(anchors).toEqual([4, 4, 2, 2, 6, 6]);
    expect(handles).toEqual([]);
  });

  it('reads the geometry attributes of basic shapes, defaulting to 0', () => {
    expect(geometryValues(el('circle', { cx: '8', cy: '8', r: '2' })).anchors).toEqual([8, 8, 2]);
    expect(geometryValues(el('rect', { x: '2', y: '3', width: '4', height: '5' })).anchors).toEqual([2, 3, 4, 5, 0]);
    expect(geometryValues(el('line', { x1: '1', y1: '2', x2: '3', y2: '4' })).anchors).toEqual([1, 2, 3, 4]);
  });

  it('throws on non-numeric attributes', () => {
    expect(() => geometryValues(el('circle', { cx: 'abc', cy: '8', r: '2' }))).toThrow(/not a number/);
  });
});

describe('grid checks', () => {
  it('accepts quarter steps and rejects anything else', () => {
    expect([0, 0.25, 2.75, 13.5, -1.25].every(onQuarterGrid)).toBe(true);
    expect([0.1, 2.9, 10.4, 6.125].some(onQuarterGrid)).toBe(false);
  });

  it('accepts handles with up to two decimals, despite float noise', () => {
    expect(hasAtMostTwoDecimals(13.75 - 1.45)).toBe(true);
    expect(hasAtMostTwoDecimals(3 + 0.45)).toBe(true);
    expect(hasAtMostTwoDecimals(3.333)).toBe(false);
  });

  it('keeps long relative chains on the grid', () => {
    const d = 'M2 2' + 'l.25.25'.repeat(40);
    const { anchors } = geometryValues(el('path', { d }));
    expect(anchors.every(onQuarterGrid)).toBe(true);
    expect(anchors.at(-1)).toBe(12);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/geometry.test.ts`
Expected: FAIL, cannot find `../lib/geometry.js`.

- [ ] **Step 3: Implement `scripts/lib/geometry.ts`**

```ts
import { svgPathBbox } from 'svg-path-bbox';
import svgpath from 'svgpath';
import type { SvgElement } from './parse.js';

export type BBox = readonly [minX: number, minY: number, maxX: number, maxY: number];

export interface GeometryValues {
  anchors: number[];
  handles: number[];
}

const EPSILON = 1e-6;

export const onQuarterGrid = (v: number): boolean => Math.abs(v * 4 - Math.round(v * 4)) < EPSILON;
export const hasAtMostTwoDecimals = (v: number): boolean => Math.abs(v * 100 - Math.round(v * 100)) < EPSILON;

function num(el: SvgElement, key: string): number {
  const raw = el.attrs[key];
  if (raw === undefined) return 0;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`<${el.tag}> ${key}="${raw}" is not a number`);
  return value;
}

function checkedPath(d: string): ReturnType<typeof svgpath> {
  const path = svgpath(d);
  if (path.err) throw new Error(`invalid path data: ${path.err}`);
  return path;
}

export function elementBBox(el: SvgElement): BBox {
  switch (el.tag) {
    case 'path': {
      const d = el.attrs.d ?? '';
      checkedPath(d);
      const [minX, minY, maxX, maxY] = svgPathBbox(d);
      return [minX, minY, maxX, maxY];
    }
    case 'circle': {
      const cx = num(el, 'cx');
      const cy = num(el, 'cy');
      const r = num(el, 'r');
      return [cx - r, cy - r, cx + r, cy + r];
    }
    case 'rect': {
      const x = num(el, 'x');
      const y = num(el, 'y');
      return [x, y, x + num(el, 'width'), y + num(el, 'height')];
    }
    case 'line': {
      const x1 = num(el, 'x1');
      const y1 = num(el, 'y1');
      const x2 = num(el, 'x2');
      const y2 = num(el, 'y2');
      return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }
    default:
      throw new Error(`no geometry for <${el.tag}>`);
  }
}

function pathValues(d: string): GeometryValues {
  const anchors: number[] = [];
  const handles: number[] = [];
  const segments = checkedPath(d).abs().segments as Array<[string, ...number[]]>;
  for (const [command, ...v] of segments) {
    switch (command) {
      case 'M':
      case 'L':
      case 'T':
      case 'H':
      case 'V':
        anchors.push(...v);
        break;
      case 'C':
        handles.push(...v.slice(0, 4));
        anchors.push(...v.slice(4));
        break;
      case 'S':
      case 'Q':
        handles.push(...v.slice(0, 2));
        anchors.push(...v.slice(2));
        break;
      case 'A':
        anchors.push(v[0], v[1], v[5], v[6]);
        break;
      default:
        break;
    }
  }
  return { anchors, handles };
}

export function geometryValues(el: SvgElement): GeometryValues {
  switch (el.tag) {
    case 'path':
      return pathValues(el.attrs.d ?? '');
    case 'circle':
      return { anchors: ['cx', 'cy', 'r'].map((k) => num(el, k)), handles: [] };
    case 'rect':
      return { anchors: ['x', 'y', 'width', 'height', 'rx'].map((k) => num(el, k)), handles: [] };
    case 'line':
      return { anchors: ['x1', 'y1', 'x2', 'y2'].map((k) => num(el, k)), handles: [] };
    default:
      throw new Error(`no geometry for <${el.tag}>`);
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/geometry.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/geometry.ts scripts/__tests__/geometry.test.ts
git commit -m "feat: icon geometry (bounds, anchors, handles)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The linter

**Files:**
- Create: `scripts/lib/rules.ts`, `scripts/lib/lint-all.ts`, `scripts/lint.ts`, `scripts/__tests__/fixtures.ts`
- Modify: `package.json` (add the `lint:icons` script)
- Test: `scripts/__tests__/rules.test.ts`, `scripts/__tests__/lint-all.test.ts`, `scripts/__tests__/repo-icons.test.ts`

**Interfaces:**
- Consumes: `parseSvg`, `SvgElement` (Task 1); `loadIcons` (Task 1); `CATEGORIES`, `IconMeta` (Task 1); `elementBBox`, `geometryValues`, `onQuarterGrid`, `hasAtMostTwoDecimals` (Task 2).
- Produces:
  - `type RuleId = 'parse' | 'name' | 'metadata' | 'orphan' | 'viewbox' | 'root-attrs' | 'empty' | 'elements' | 'attributes' | 'color' | 'grid' | 'handles' | 'bounds'`
  - `interface Violation { icon: string; rule: RuleId; detail: string }`
  - `NAME_PATTERN: RegExp`, `lintName(name: string): Violation[]`
  - `lintMeta(name: string, metaJson: string | null): { violations: Violation[]; meta: IconMeta | null }`
  - `lintSvg(name: string, root: SvgElement): Violation[]`
  - `interface LintedIcon { name: string; svg: string; root: SvgElement; meta: IconMeta }`, `lintAll(dir: string): Promise<{ icons: LintedIcon[]; violations: Violation[] }>`. Only fully clean icons appear in `icons`.
  - `formatViolation(v: Violation): string` → `"name: rule: detail"`
  - Fixtures: `ROOT_ATTRS`, `wrap(body: string, rootAttrs?: string): string`, `HOME_SVG`, `SEARCH_SVG`, `meta(category: string): string`

- [ ] **Step 1: Write the shared fixtures**

`scripts/__tests__/fixtures.ts`:
```ts
export const ROOT_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export const wrap = (body: string, rootAttrs = ROOT_ATTRS): string => `<svg ${rootAttrs}>${body}</svg>`;

export const HOME_SVG = wrap(
  '<path d="M2.75 6.5 8 2.25l5.25 4.25v6.25a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1Z"/>' +
    '<path d="M6.5 13.75V10.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v3.25"/>',
);

export const SEARCH_SVG = wrap('<circle cx="7" cy="7" r="4.5"/><path d="M10.25 10.25 13.75 13.75"/>');

export const meta = (category: string): string => JSON.stringify({ category, tags: [], aliases: [] });
```

- [ ] **Step 2: Write the failing rules test**

`scripts/__tests__/rules.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseSvg } from '../lib/parse.js';
import { lintMeta, lintName, lintSvg, type Violation } from '../lib/rules.js';
import { HOME_SVG, ROOT_ATTRS, wrap } from './fixtures.js';

const lint = async (body: string, rootAttrs?: string): Promise<Violation[]> =>
  lintSvg('test', await parseSvg(wrap(body, rootAttrs)));
const rules = (violations: Violation[]): string[] => [...new Set(violations.map((v) => v.rule))].sort();

describe('lintSvg', () => {
  it('passes a clean icon', async () => {
    expect(lintSvg('home', await parseSvg(HOME_SVG))).toEqual([]);
  });

  it('requires the 16px viewBox', async () => {
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('0 0 16 16', '0 0 24 24')))).toEqual(['viewbox']);
  });

  it('requires the stroke attributes on the root and nothing extra', async () => {
    expect(rules(await lint('<path d="M2 2h4"/>', ROOT_ATTRS.replace('stroke-width="1.5"', 'stroke-width="2"')))).toEqual(['root-attrs']);
    expect(rules(await lint('<path d="M2 2h4"/>', `${ROOT_ATTRS} width="16"`))).toEqual(['root-attrs']);
  });

  it('reports an empty icon', async () => {
    expect(rules(await lint(''))).toEqual(['empty']);
  });

  it('rejects groups, masks and nested elements', async () => {
    expect(rules(await lint('<g><path d="M2 2h4"/></g>'))).toContain('elements');
    expect(rules(await lint('<mask/><path d="M2 2h4"/>'))).toContain('elements');
  });

  it('rejects attributes outside the allow-list', async () => {
    expect(rules(await lint('<path d="M2 2h4" transform="rotate(45 8 8)"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" id="a"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" stroke-width="2"/>'))).toEqual(['attributes']);
    expect(rules(await lint('<path d="M2 2h4" stroke-dasharray="1 1"/>'))).toEqual(['attributes']);
  });

  it('allows dashes on circles', async () => {
    expect(await lint('<circle cx="8" cy="8" r="5.5" stroke-dasharray="1 3.32" stroke-dashoffset="0.5"/>')).toEqual([]);
  });

  it('allows only currentColor and none as colors', async () => {
    expect(rules(await lint('<path d="M2 2h4" stroke="#000"/>'))).toEqual(['color']);
    expect(await lint('<circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>')).toEqual([]);
  });

  it('puts anchors on the quarter grid', async () => {
    const violations = await lint('<path d="M2.1 2h4"/><circle cx="8" cy="8" r="4.6"/>');
    expect(rules(violations)).toEqual(['grid']);
    expect(violations.map((v) => v.detail).join(' ')).toMatch(/2\.1.*4\.6/);
  });

  it('allows two-decimal handles and rejects finer ones', async () => {
    expect(await lint('<path d="M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75"/>')).toEqual([]);
    expect(rules(await lint('<path d="M3 13c.333-1 .5-1 1 0"/>'))).toEqual(['handles']);
  });

  it('keeps strokes inside the 1px padding', async () => {
    expect(rules(await lint('<path d="M1.5 8h4"/>'))).toEqual(['bounds']);
    expect(rules(await lint('<circle cx="8" cy="8" r="7"/>'))).toEqual(['bounds']);
  });

  it('lets unstroked solids reach the padding edge', async () => {
    expect(await lint('<circle cx="8" cy="8" r="7" fill="currentColor" stroke="none"/>')).toEqual([]);
  });

  it('reports every problem in a typical Figma paste', async () => {
    const figma =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<g><path d="M2.1 2H6" stroke="black" stroke-width="1.5"/></g></svg>';
    const violations = lintSvg('pasted', await parseSvg(figma));
    expect(rules(violations)).toEqual(['elements', 'root-attrs']);
    expect(violations.every((v) => v.icon === 'pasted')).toBe(true);

    const unwrapped = figma.replace('<g>', '').replace('</g>', '');
    expect(rules(lintSvg('pasted', await parseSvg(unwrapped)))).toEqual(['attributes', 'color', 'grid', 'root-attrs']);
  });

  it('reports unreadable geometry instead of throwing', async () => {
    expect(rules(await lint('<path d="M2 2 Q"/>'))).toEqual(['parse']);
  });
});

describe('lintName', () => {
  it('accepts kebab-case and rejects everything else', () => {
    expect(lintName('arrow-up-right')).toEqual([]);
    for (const bad of ['ArrowUp', 'arrow_up', 'arrow--up', '-x', 'x-', 'arrow up']) {
      expect(lintName(bad).map((v) => v.rule)).toEqual(['name']);
    }
  });
});

describe('lintMeta', () => {
  it('returns parsed metadata when valid', () => {
    const result = lintMeta('home', JSON.stringify({ category: 'navigation', tags: ['house'], aliases: [] }));
    expect(result.violations).toEqual([]);
    expect(result.meta).toEqual({ category: 'navigation', tags: ['house'], aliases: [] });
  });

  it('reports missing, broken and wrong metadata', () => {
    expect(lintMeta('home', null).violations.map((v) => v.detail)).toEqual(['missing home.json']);
    expect(lintMeta('home', '{').violations[0].detail).toMatch(/not valid JSON/);
    expect(lintMeta('home', JSON.stringify({ category: 'nav', tags: [], aliases: [] })).violations[0].detail).toMatch(/category "nav"/);
    expect(lintMeta('home', JSON.stringify({ category: 'navigation', tags: 'house', aliases: [] })).violations[0].detail).toMatch(/tags/);
    expect(lintMeta('home', JSON.stringify({ category: 'navigation', tags: [] })).violations[0].detail).toMatch(/aliases/);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/rules.test.ts`
Expected: FAIL, cannot find `../lib/rules.js`.

- [ ] **Step 4: Implement `scripts/lib/rules.ts`**

```ts
import { CATEGORIES, type Category, type IconMeta } from './categories.js';
import { elementBBox, geometryValues, hasAtMostTwoDecimals, onQuarterGrid } from './geometry.js';
import type { SvgElement } from './parse.js';

export type RuleId =
  | 'parse'
  | 'name'
  | 'metadata'
  | 'orphan'
  | 'viewbox'
  | 'root-attrs'
  | 'empty'
  | 'elements'
  | 'attributes'
  | 'color'
  | 'grid'
  | 'handles'
  | 'bounds';

export interface Violation {
  icon: string;
  rule: RuleId;
  detail: string;
}

export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REQUIRED_ROOT: Record<string, string> = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.5',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};
const OPTIONAL_ROOT = new Set(['xmlns']);

const ALLOWED_ATTRS: Record<string, ReadonlySet<string>> = {
  path: new Set(['d', 'fill', 'stroke', 'fill-rule']),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-dasharray', 'stroke-dashoffset']),
  rect: new Set(['x', 'y', 'width', 'height', 'rx', 'fill', 'stroke']),
  line: new Set(['x1', 'y1', 'x2', 'y2']),
};
const COLOR_VALUES = new Set(['currentColor', 'none']);
const HALF_STROKE = 0.75;
const LIMIT_MIN = 1;
const LIMIT_MAX = 15;
const EPSILON = 1e-6;

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

export function lintName(name: string): Violation[] {
  return NAME_PATTERN.test(name)
    ? []
    : [{ icon: name, rule: 'name', detail: `"${name}" must be kebab-case (lowercase letters, digits, single dashes)` }];
}

export function lintMeta(name: string, metaJson: string | null): { violations: Violation[]; meta: IconMeta | null } {
  const fail = (detail: string) => ({ violations: [{ icon: name, rule: 'metadata' as const, detail }], meta: null });
  if (metaJson === null) return fail(`missing ${name}.json`);

  let data: unknown;
  try {
    data = JSON.parse(metaJson);
  } catch (error) {
    return fail(`${name}.json is not valid JSON: ${(error as Error).message}`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return fail(`${name}.json must be an object`);

  const record = data as Record<string, unknown>;
  if (!CATEGORIES.includes(record.category as Category)) {
    return fail(`category "${String(record.category)}" must be one of: ${CATEGORIES.join(', ')}`);
  }
  for (const key of ['tags', 'aliases'] as const) {
    const value = record[key];
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      return fail(`${key} must be an array of strings`);
    }
  }
  return {
    violations: [],
    meta: { category: record.category as Category, tags: record.tags as string[], aliases: record.aliases as string[] },
  };
}

export function lintSvg(name: string, root: SvgElement): Violation[] {
  const out: Violation[] = [];
  const add = (rule: RuleId, detail: string) => out.push({ icon: name, rule, detail });

  if (root.attrs.viewBox !== REQUIRED_ROOT.viewBox) {
    add('viewbox', `viewBox must be "0 0 16 16" (got ${root.attrs.viewBox === undefined ? 'nothing' : `"${root.attrs.viewBox}"`})`);
  }
  for (const [key, expected] of Object.entries(REQUIRED_ROOT)) {
    if (key === 'viewBox') continue;
    if (root.attrs[key] !== expected) {
      add('root-attrs', `<svg> ${key} must be "${expected}" (got ${root.attrs[key] === undefined ? 'nothing' : `"${root.attrs[key]}"`})`);
    }
  }
  for (const key of Object.keys(root.attrs)) {
    if (!(key in REQUIRED_ROOT) && !OPTIONAL_ROOT.has(key)) add('root-attrs', `<svg> has unexpected attribute "${key}"`);
  }

  if (root.children.length === 0) add('empty', 'the icon draws nothing');

  root.children.forEach((child, index) => {
    const label = `<${child.tag}> #${index + 1}`;
    const allowed = ALLOWED_ATTRS[child.tag];
    if (!allowed) {
      add('elements', `${label} is not allowed; use path, circle, rect or line`);
      return;
    }
    if (child.children.length > 0) add('elements', `${label} must not contain other elements`);

    for (const key of Object.keys(child.attrs)) {
      if (!allowed.has(key)) add('attributes', `${label}: attribute "${key}" is not allowed`);
    }
    for (const key of ['fill', 'stroke']) {
      const value = child.attrs[key];
      if (value !== undefined && !COLOR_VALUES.has(value)) add('color', `${label}: ${key}="${value}" must be currentColor or none`);
    }

    let values;
    let box;
    try {
      values = geometryValues(child);
      box = elementBBox(child);
    } catch (error) {
      add('parse', `${label}: ${(error as Error).message}`);
      return;
    }

    const offGrid = [...new Set(values.anchors.filter((v) => !onQuarterGrid(v)))];
    if (offGrid.length) add('grid', `${label}: ${offGrid.map(fmt).join(', ')} not on the 0.25 grid`);
    const fineHandles = [...new Set(values.handles.filter((v) => !hasAtMostTwoDecimals(v)))];
    if (fineHandles.length) add('handles', `${label}: handles ${fineHandles.map(fmt).join(', ')} need at most 2 decimals`);

    const stroked = (child.attrs.stroke ?? root.attrs.stroke) !== 'none';
    const pad = stroked ? HALF_STROKE : 0;
    const [minX, minY, maxX, maxY] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
    const edges: string[] = [];
    if (minX < LIMIT_MIN - EPSILON) edges.push(`x=${fmt(minX)}`);
    if (minY < LIMIT_MIN - EPSILON) edges.push(`y=${fmt(minY)}`);
    if (maxX > LIMIT_MAX + EPSILON) edges.push(`x=${fmt(maxX)}`);
    if (maxY > LIMIT_MAX + EPSILON) edges.push(`y=${fmt(maxY)}`);
    if (edges.length) add('bounds', `${label} reaches ${edges.join(', ')}${stroked ? ' with its stroke' : ''} (allowed 1–15)`);
  });

  return out;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/rules.test.ts`
Expected: PASS (17 tests). If the Figma-paste test lists different rules, read the violation details. The expected set follows from the rules above: `<g>` → elements; `width`/`height` + missing stroke attrs → root-attrs; `stroke="black"` → color; `stroke-width` on the path → attributes; `2.1` → grid.

- [ ] **Step 6: Write the failing lint-all test**

`scripts/__tests__/lint-all.test.ts`:
```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatViolation, lintAll } from '../lib/lint-all.js';
import { HOME_SVG, meta, wrap } from './fixtures.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'keyline-lint-'));
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
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/lint-all.test.ts`
Expected: FAIL, cannot find `../lib/lint-all.js`.

- [ ] **Step 8: Implement `scripts/lib/lint-all.ts`**

```ts
import type { IconMeta } from './categories.js';
import { loadIcons } from './load.js';
import { parseSvg, type SvgElement } from './parse.js';
import { lintMeta, lintName, lintSvg, type Violation } from './rules.js';

export interface LintedIcon {
  name: string;
  svg: string;
  root: SvgElement;
  meta: IconMeta;
}

export async function lintAll(dir: string): Promise<{ icons: LintedIcon[]; violations: Violation[] }> {
  const { icons, orphans } = await loadIcons(dir);
  const violations: Violation[] = orphans.map((name) => ({
    icon: name,
    rule: 'orphan',
    detail: `${name}.json has no matching ${name}.svg`,
  }));
  const clean: LintedIcon[] = [];

  for (const source of icons) {
    const found: Violation[] = [...lintName(source.name)];
    const { violations: metaViolations, meta } = lintMeta(source.name, source.metaJson);
    found.push(...metaViolations);

    let root: SvgElement | null = null;
    try {
      root = await parseSvg(source.svg);
      found.push(...lintSvg(source.name, root));
    } catch (error) {
      found.push({ icon: source.name, rule: 'parse', detail: (error as Error).message });
    }

    violations.push(...found);
    if (found.length === 0 && root && meta) clean.push({ name: source.name, svg: source.svg, root, meta });
  }

  return { icons: clean, violations };
}

export const formatViolation = (v: Violation): string => `${v.icon}: ${v.rule}: ${v.detail}`;
```

- [ ] **Step 9: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/lint-all.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 10: Add the CLI, the repo-wide test and the script**

`scripts/lint.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { formatViolation, lintAll } from './lib/lint-all.js';

const iconsDir = fileURLToPath(new URL('../icons', import.meta.url));
const { icons, violations } = await lintAll(iconsDir);

if (violations.length > 0) {
  for (const violation of violations) console.error(formatViolation(violation));
  console.error(`\n${violations.length} problem(s). Fix them before building.`);
  process.exit(1);
}
console.log(`${icons.length} icons pass.`);
```

`scripts/__tests__/repo-icons.test.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { formatViolation, lintAll } from '../lib/lint-all.js';

it('every icon in icons/ passes the rules', async () => {
  const { violations } = await lintAll(fileURLToPath(new URL('../../icons', import.meta.url)));
  expect(violations.map(formatViolation)).toEqual([]);
});
```

In `package.json` `"scripts"`, add:
```json
"lint:icons": "tsx scripts/lint.ts",
```

- [ ] **Step 11: Run everything**

Run: `npm run lint:icons`
Expected: `0 icons pass.`, exit code 0.

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 12: Commit**

```bash
git add scripts package.json
git commit -m "feat: icon linter with rule-level violations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Optimizer, generators and the build

**Files:**
- Create: `scripts/lib/optimize.ts`, `scripts/lib/react.ts`, `scripts/lib/site-data.ts`, `scripts/lib/build-all.ts`, `scripts/build.ts`
- Modify: `package.json` (add `build:icons`)
- Test: `scripts/__tests__/optimize.test.ts`, `scripts/__tests__/react.test.ts`, `scripts/__tests__/build-all.test.ts`

**Interfaces:**
- Consumes: `lintAll`, `formatViolation`, `LintedIcon` (Task 3); `parseSvg`, `SvgElement` (Task 1); `lintSvg`, `Violation` (Task 3); `IconMeta`, `Category` (Task 1).
- Produces:
  - `optimizeSvg(svg: string): string`, `withSize(svg: string, size?: number): string`
  - `toPascal(name: string): string`, `componentName(name: string): string`
  - `type NodeTuple = [tag: string, attrs: Record<string, string>]`, `toIconNode(root: SvgElement): NodeTuple[]` (attribute names camelCased)
  - `renderIconModule(name: string, node: NodeTuple[], createIconPath?: string): string` (default `'../create-icon.js'`)
  - `renderIndex(names: string[], createIconPath?: string): string` (default `'./create-icon.js'`)
  - `interface SiteIcon { name: string; component: string; category: Category; tags: string[]; aliases: string[]; svg: string }`, `toSiteIcon(name: string, meta: IconMeta, svg: string): SiteIcon`
  - `interface BuildPaths { iconsDir: string; packageDir: string; siteDataFile: string }`, `buildAll(paths: BuildPaths): Promise<{ count: number; violations: Violation[] }>`
  - Generated layout (used by Task 5): `packageDir/svg/<name>.svg`, `packageDir/src/icons/<name>.ts`, `packageDir/src/index.ts`

- [ ] **Step 1: Write the failing optimizer test**

`scripts/__tests__/optimize.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { optimizeSvg, withSize } from '../lib/optimize.js';
import { parseSvg } from '../lib/parse.js';
import { lintSvg } from '../lib/rules.js';
import { HOME_SVG, ROOT_ATTRS } from './fixtures.js';

describe('optimizeSvg', () => {
  it('strips comments and whitespace but keeps everything the rules need', async () => {
    const input = `﻿<svg ${ROOT_ATTRS}>\r\n  <!-- door -->\r\n  <path d="M2.75 6.5 8 2.25"/>\r\n</svg>\r\n`;
    const output = optimizeSvg(input);

    expect(output).not.toContain('door');
    expect(output).not.toContain('\n');
    expect(output).toContain('viewBox="0 0 16 16"');
    expect(output).toContain('stroke-linecap="round"');
    expect(output).toContain('stroke-linejoin="round"');
    expect(output).toContain('d="M2.75 6.5 8 2.25"');
  });

  it('produces output that still passes the linter', async () => {
    expect(lintSvg('home', await parseSvg(optimizeSvg(HOME_SVG)))).toEqual([]);
  });

  it('never converts shapes to paths', () => {
    const output = optimizeSvg(`<svg ${ROOT_ATTRS}><circle cx="8" cy="8" r="2"/></svg>`);
    expect(output).toContain('<circle');
  });
});

describe('withSize', () => {
  it('adds width and height to the root', () => {
    expect(withSize('<svg viewBox="0 0 16 16"/>')).toBe('<svg width="16" height="16" viewBox="0 0 16 16"/>');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/optimize.test.ts`
Expected: FAIL, cannot find `../lib/optimize.js`.

- [ ] **Step 3: Implement `scripts/lib/optimize.ts`**

```ts
import { optimize } from 'svgo';

// An explicit list, not preset-default: path rewriting, shape-to-path conversion and
// merging could move anchors off the grid or break future fills.
const PLUGINS = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeEditorsNSData',
  'cleanupAttrs',
  'removeEmptyAttrs',
  'removeEmptyText',
  'removeEmptyContainers',
  'sortAttrs',
] as const;

export function optimizeSvg(svg: string): string {
  return optimize(svg.replace(/^﻿/, ''), { plugins: [...PLUGINS] }).data;
}

export function withSize(svg: string, size = 16): string {
  return svg.replace(/^<svg\b/, `<svg width="${size}" height="${size}"`);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/optimize.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing generator test**

`scripts/__tests__/react.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseSvg } from '../lib/parse.js';
import { componentName, renderIconModule, renderIndex, toIconNode, toPascal } from '../lib/react.js';
import { toSiteIcon } from '../lib/site-data.js';
import { wrap } from './fixtures.js';

describe('names', () => {
  it('turns kebab names into Icon-suffixed components', () => {
    expect(toPascal('arrow-up-right')).toBe('ArrowUpRight');
    expect(componentName('arrow-up-right')).toBe('ArrowUpRightIcon');
    expect(componentName('x')).toBe('XIcon');
    expect(componentName('priority-high')).toBe('PriorityHighIcon');
  });
});

describe('toIconNode', () => {
  it('keeps element order and camelCases attribute names', async () => {
    const root = await parseSvg(
      wrap('<path d="M8 2Z" fill="currentColor" fill-rule="evenodd" stroke="none"/><circle cx="8" cy="8" r="5.5" stroke-dasharray="1 3.32"/>'),
    );
    expect(toIconNode(root)).toEqual([
      ['path', { d: 'M8 2Z', fill: 'currentColor', fillRule: 'evenodd', stroke: 'none' }],
      ['circle', { cx: '8', cy: '8', r: '5.5', strokeDasharray: '1 3.32' }],
    ]);
  });
});

describe('renderIconModule', () => {
  it('emits a pure, typed createIcon call', () => {
    const source = renderIconModule('search', [
      ['circle', { cx: '7', cy: '7', r: '4.5' }],
      ['path', { d: 'M10.25 10.25 13.75 13.75' }],
    ]);
    expect(source).toBe(
      [
        '// Generated by scripts/build.ts. Do not edit.',
        'import { createIcon } from "../create-icon.js";',
        '',
        'export const SearchIcon = /* @__PURE__ */ createIcon("search", [',
        '  ["circle", {"cx":"7","cy":"7","r":"4.5"}],',
        '  ["path", {"d":"M10.25 10.25 13.75 13.75"}],',
        ']);',
        '',
      ].join('\n'),
    );
  });
});

describe('renderIndex', () => {
  it('re-exports the runtime and every icon', () => {
    expect(renderIndex(['home', 'search'])).toBe(
      [
        '// Generated by scripts/build.ts. Do not edit.',
        'export { createIcon } from "./create-icon.js";',
        'export type { IconNode, IconProps, IconTag, KeylineIcon } from "./create-icon.js";',
        'export { HomeIcon } from "./icons/home.js";',
        'export { SearchIcon } from "./icons/search.js";',
        '',
      ].join('\n'),
    );
  });
});

describe('toSiteIcon', () => {
  it('bundles what the site needs per icon', () => {
    expect(toSiteIcon('home', { category: 'navigation', tags: ['house'], aliases: ['dashboard'] }, '<svg/>')).toEqual({
      name: 'home',
      component: 'HomeIcon',
      category: 'navigation',
      tags: ['house'],
      aliases: ['dashboard'],
      svg: '<svg/>',
    });
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/react.test.ts`
Expected: FAIL, cannot find `../lib/react.js`.

- [ ] **Step 7: Implement `scripts/lib/react.ts` and `scripts/lib/site-data.ts`**

`scripts/lib/react.ts`:
```ts
import type { SvgElement } from './parse.js';

export type NodeTuple = [tag: string, attrs: Record<string, string>];

const HEADER = '// Generated by scripts/build.ts. Do not edit.';

export const toPascal = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const componentName = (name: string): string => `${toPascal(name)}Icon`;

const camel = (attr: string): string => attr.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

export function toIconNode(root: SvgElement): NodeTuple[] {
  return root.children.map((el) => [
    el.tag,
    Object.fromEntries(Object.entries(el.attrs).map(([key, value]) => [camel(key), value])),
  ]);
}

export function renderIconModule(name: string, node: NodeTuple[], createIconPath = '../create-icon.js'): string {
  return [
    HEADER,
    `import { createIcon } from ${JSON.stringify(createIconPath)};`,
    '',
    `export const ${componentName(name)} = /* @__PURE__ */ createIcon(${JSON.stringify(name)}, [`,
    ...node.map(([tag, attrs]) => `  [${JSON.stringify(tag)}, ${JSON.stringify(attrs)}],`),
    ']);',
    '',
  ].join('\n');
}

export function renderIndex(names: string[], createIconPath = './create-icon.js'): string {
  return [
    HEADER,
    `export { createIcon } from ${JSON.stringify(createIconPath)};`,
    `export type { IconNode, IconProps, IconTag, KeylineIcon } from ${JSON.stringify(createIconPath)};`,
    ...names.map((name) => `export { ${componentName(name)} } from ${JSON.stringify(`./icons/${name}.js`)};`),
    '',
  ].join('\n');
}
```

`scripts/lib/site-data.ts`:
```ts
import type { Category, IconMeta } from './categories.js';
import { componentName } from './react.js';

export interface SiteIcon {
  name: string;
  component: string;
  category: Category;
  tags: string[];
  aliases: string[];
  svg: string;
}

export function toSiteIcon(name: string, meta: IconMeta, svg: string): SiteIcon {
  return { name, component: componentName(name), category: meta.category, tags: meta.tags, aliases: meta.aliases, svg };
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run scripts/__tests__/react.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 9: Write the failing build test**

`scripts/__tests__/build-all.test.ts`:
```ts
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
  root = await mkdtemp(join(tmpdir(), 'keyline-build-'));
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
```

- [ ] **Step 10: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/build-all.test.ts`
Expected: FAIL, cannot find `../lib/build-all.js`.

- [ ] **Step 11: Implement `scripts/lib/build-all.ts` and `scripts/build.ts`**

`scripts/lib/build-all.ts`:
```ts
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { formatViolation, lintAll } from './lint-all.js';
import { optimizeSvg, withSize } from './optimize.js';
import { parseSvg } from './parse.js';
import { renderIconModule, renderIndex, toIconNode } from './react.js';
import { lintSvg, type Violation } from './rules.js';
import { toSiteIcon, type SiteIcon } from './site-data.js';

export interface BuildPaths {
  iconsDir: string;
  packageDir: string;
  siteDataFile: string;
}

export async function buildAll(paths: BuildPaths): Promise<{ count: number; violations: Violation[] }> {
  const { icons, violations } = await lintAll(paths.iconsDir);
  if (violations.length > 0) return { count: 0, violations };

  const svgDir = join(paths.packageDir, 'svg');
  const modulesDir = join(paths.packageDir, 'src', 'icons');
  await rm(svgDir, { recursive: true, force: true });
  await rm(modulesDir, { recursive: true, force: true });
  await mkdir(svgDir, { recursive: true });
  await mkdir(modulesDir, { recursive: true });
  await mkdir(dirname(paths.siteDataFile), { recursive: true });

  const site: SiteIcon[] = [];
  for (const icon of icons) {
    const optimized = optimizeSvg(icon.svg);
    const root = await parseSvg(optimized);
    const broken = lintSvg(icon.name, root);
    if (broken.length > 0) {
      throw new Error(`the optimizer broke ${icon.name}: ${broken.map(formatViolation).join('; ')}`);
    }
    await writeFile(join(svgDir, `${icon.name}.svg`), `${withSize(optimized)}\n`);
    await writeFile(join(modulesDir, `${icon.name}.ts`), renderIconModule(icon.name, toIconNode(root)));
    site.push(toSiteIcon(icon.name, icon.meta, optimized));
  }

  await writeFile(join(paths.packageDir, 'src', 'index.ts'), renderIndex(icons.map((icon) => icon.name)));
  await writeFile(paths.siteDataFile, `${JSON.stringify(site, null, 2)}\n`);
  return { count: icons.length, violations: [] };
}
```

`scripts/build.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { buildAll } from './lib/build-all.js';
import { formatViolation } from './lib/lint-all.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const { count, violations } = await buildAll({
  iconsDir: at('../icons'),
  packageDir: at('../packages/keyline'),
  siteDataFile: at('../site/src/data/icons.json'),
});

if (violations.length > 0) {
  for (const violation of violations) console.error(formatViolation(violation));
  console.error(`\n${violations.length} problem(s). Nothing was generated.`);
  process.exit(1);
}
console.log(`Generated ${count} icons.`);
```

In `package.json` `"scripts"`, add:
```json
"build:icons": "tsx scripts/build.ts",
```

- [ ] **Step 12: Run the tests**

Run: `npx vitest run scripts/__tests__`
Expected: PASS, all suites.

- [ ] **Step 13: Commit**

```bash
git add scripts package.json
git commit -m "feat: optimizer, React and site generators, build command" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The `keyline` package runtime

**Files:**
- Create: `packages/keyline/package.json`, `packages/keyline/tsconfig.json`, `packages/keyline/tsup.config.ts`, `packages/keyline/src/create-icon.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add `build`)
- Test: `packages/keyline/test/create-icon.test.ts`, `packages/keyline/test/treeshake.test.ts`

**Interfaces:**
- Consumes: `renderIconModule`, `renderIndex` (Task 4) in the tree-shake test; the generated layout from Task 4.
- Produces (exported from `packages/keyline/src/create-icon.ts`, re-exported by the generated index):
  - `type IconTag = 'path' | 'circle' | 'rect' | 'line'`
  - `type IconNode = ReadonlyArray<readonly [IconTag, Readonly<Record<string, string>>]>`
  - `interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> { size?: number | string; color?: string; absoluteStrokeWidth?: boolean; title?: string }`
  - `type KeylineIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>`
  - `createIcon(name: string, node: IconNode): KeylineIcon`

- [ ] **Step 1: Create the package files**

`packages/keyline/package.json`:
```json
{
  "name": "keyline",
  "version": "0.0.0",
  "private": true,
  "description": "Icons for software people use all day. 16px grid, one stroke.",
  "license": "MIT",
  "author": "Lucas Lima",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./svg/*": "./svg/*"
  },
  "files": ["dist", "svg"],
  "scripts": {
    "build": "tsup"
  },
  "peerDependencies": {
    "react": ">=18"
  }
}
```

`packages/keyline/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "noEmit": false, "types": [] },
  "include": ["src"]
}
```

`packages/keyline/tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';

// bundle: false keeps one output file per icon. Bundlers drop whole unused modules,
// and the /* @__PURE__ */ annotations cover anyone who bundles the package themselves.
export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  bundle: false,
  dts: { entry: 'src/index.ts' },
  clean: true,
  outDir: 'dist',
  external: ['react'],
});
```

Run: `npm install` (links the new workspace).
Expected: no errors. `node_modules/keyline` is a link to `packages/keyline`.

- [ ] **Step 2: Write the failing runtime test**

`packages/keyline/test/create-icon.test.ts`:
```ts
// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { createElement, createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createIcon, type IconNode } from '../src/create-icon.js';

const NODE: IconNode = [
  ['rect', { x: '2.25', y: '2.75', width: '11.5', height: '11', rx: '2' }],
  ['path', { d: 'M2.25 4.75a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2V6.5H2.25Z', fill: 'currentColor', stroke: 'none' }],
];
const CalendarIcon = createIcon('calendar', NODE);

const svgOf = (element: Parameters<typeof render>[0]) => render(element).container.querySelector('svg')!;

afterEach(cleanup);

describe('createIcon', () => {
  it('renders the spec defaults', () => {
    const svg = svgOf(createElement(CalendarIcon));
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('height')).toBe('16');
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
    expect(svg.getAttribute('stroke-linecap')).toBe('round');
    expect(svg.getAttribute('stroke-linejoin')).toBe('round');
    expect(svg.getAttribute('class')).toBe('keyline keyline-calendar');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('color')).toBeNull();
    expect(svg.querySelectorAll('rect, path')).toHaveLength(2);
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('currentColor');
  });

  it('sizes with numbers and CSS strings', () => {
    expect(svgOf(createElement(CalendarIcon, { size: 20 })).getAttribute('width')).toBe('20');
    expect(svgOf(createElement(CalendarIcon, { size: '2rem' })).getAttribute('height')).toBe('2rem');
  });

  it('title makes the icon an announced image', () => {
    const svg = svgOf(createElement(CalendarIcon, { title: 'Due date' }));
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Due date');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.querySelector('title')!.textContent).toBe('Due date');
  });

  it('aria-label alone still makes it visible to screen readers', () => {
    const svg = svgOf(createElement(CalendarIcon, { 'aria-label': 'Due date' }));
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Due date');
    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('color recolors fills and strokes alike', () => {
    const svg = svgOf(createElement(CalendarIcon, { color: 'red' }));
    expect(svg.getAttribute('color')).toBe('red');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('currentColor');
  });

  it('absoluteStrokeWidth keeps strokes at screen size, even for CSS sizes', () => {
    const svg = svgOf(createElement(CalendarIcon, { size: '2rem', absoluteStrokeWidth: true }));
    const shapes = [...svg.querySelectorAll('rect, path')];
    expect(shapes.map((s) => s.getAttribute('vector-effect'))).toEqual(['non-scaling-stroke', 'non-scaling-stroke']);
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
  });

  it('merges className and passes other props through', () => {
    const extra = { 'data-testid': 'cal' } as Record<string, string>;
    const svg = svgOf(createElement(CalendarIcon, { className: 'text-muted', style: { opacity: 0.5 }, ...extra }));
    expect(svg.getAttribute('class')).toBe('keyline keyline-calendar text-muted');
    expect(svg.getAttribute('data-testid')).toBe('cal');
    expect(svg.style.opacity).toBe('0.5');
  });

  it('forwards refs to the svg element', () => {
    const ref = createRef<SVGSVGElement>();
    render(createElement(CalendarIcon, { ref }));
    expect(ref.current?.tagName.toLowerCase()).toBe('svg');
  });

  it('renders no ids, even twice', () => {
    const { container } = render(createElement('div', null, createElement(CalendarIcon), createElement(CalendarIcon, { title: 'Due' })));
    expect(container.querySelectorAll('[id]')).toHaveLength(0);
  });

  it('has a readable display name', () => {
    expect(CalendarIcon.displayName).toBe('CalendarIcon');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run packages/keyline/test/create-icon.test.ts`
Expected: FAIL, cannot find `../src/create-icon.js`.

- [ ] **Step 4: Implement `packages/keyline/src/create-icon.ts`**

```ts
import {
  createElement,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from 'react';

export type IconTag = 'path' | 'circle' | 'rect' | 'line';
export type IconNode = ReadonlyArray<readonly [IconTag, Readonly<Record<string, string>>]>;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'> {
  /** Width and height. Number (px) or any CSS length. Default 16. */
  size?: number | string;
  /** Sets the SVG `color`, which strokes and solid accents both follow. Default currentColor. */
  color?: string;
  /** Keep the stroke at 1.5 screen px at any size. Solid accents still scale. */
  absoluteStrokeWidth?: boolean;
  /** Accessible name. Without it (or aria-label) the icon is hidden from screen readers. */
  title?: string;
}

export type KeylineIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

const toPascal = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export function createIcon(name: string, node: IconNode): KeylineIcon {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function KeylineIconComponent(
    { size = 16, color = 'currentColor', absoluteStrokeWidth = false, title, className, children, ...rest },
    ref,
  ) {
    const labelled = Boolean(title || rest['aria-label'] || rest['aria-labelledby']);
    const a11y = labelled
      ? { role: 'img', 'aria-label': title ?? rest['aria-label'] }
      : { 'aria-hidden': true, focusable: 'false' };

    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...(color === 'currentColor' ? {} : { color }),
        className: ['keyline', `keyline-${name}`, className].filter(Boolean).join(' '),
        ...a11y,
        ...rest,
      } as SVGProps<SVGSVGElement>,
      title ? createElement('title', null, title) : null,
      ...node.map(([tag, attrs], index) =>
        createElement(tag, {
          key: index,
          ...attrs,
          ...(absoluteStrokeWidth ? { vectorEffect: 'non-scaling-stroke' } : {}),
        }),
      ),
      children,
    );
  });
  Icon.displayName = `${toPascal(name)}Icon`;
  return Icon;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run packages/keyline/test/create-icon.test.ts`
Expected: PASS (10 tests). Expect no React warnings about unknown props. If one appears for `focusable`, it means React wants the string `'false'`, which is already what's passed.

- [ ] **Step 6: Write the tree-shake test**

`packages/keyline/test/treeshake.test.ts`:
```ts
import { build } from 'esbuild';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { renderIconModule, renderIndex } from '../../../scripts/lib/react.js';

const createIconPath = fileURLToPath(new URL('../src/create-icon.ts', import.meta.url)).replace(/\\/g, '/');
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'keyline-shake-'));
  await mkdir(join(dir, 'icons'));
  await writeFile(join(dir, 'icons', 'alpha.ts'), renderIconModule('alpha', [['path', { d: 'M2 2h11.11' }]], createIconPath));
  await writeFile(join(dir, 'icons', 'beta.ts'), renderIconModule('beta', [['path', { d: 'M4 4h22.22' }]], createIconPath));
  await writeFile(join(dir, 'index.ts'), renderIndex(['alpha', 'beta'], createIconPath));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

it('importing one icon does not ship the others', async () => {
  const result = await build({
    stdin: { contents: "import { AlphaIcon } from './index.ts'; console.log(AlphaIcon);", resolveDir: dir, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    external: ['react'],
    logLevel: 'silent',
  });
  const output = result.outputFiles[0].text;
  expect(output).toContain('M2 2h11.11');
  expect(output).not.toContain('M4 4h22.22');
});
```

- [ ] **Step 7: Run it**

Run: `npx vitest run packages/keyline/test/treeshake.test.ts`
Expected: PASS. If it fails because beta is present, the `/* @__PURE__ */` annotation in `renderIconModule` is missing or misplaced. Fix the generator, not the test.

- [ ] **Step 8: Add the build script and CI, then run the full pipeline**

In root `package.json` `"scripts"`, add:
```json
"build": "npm run build:icons && npm run build -w keyline",
```

`.github/workflows/ci.yml`:
```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint:icons
      - run: npm run build
      - run: npm run typecheck
      - run: npm test
```

Run: `npm run build`
Expected: `Generated 0 icons.`, then tsup builds `packages/keyline/dist/index.js`, `create-icon.js` and `index.d.ts`.

Run: `npm run typecheck && npm test`
Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add packages/keyline/package.json packages/keyline/tsconfig.json packages/keyline/tsup.config.ts packages/keyline/src/create-icon.ts packages/keyline/test .github package.json package-lock.json
git commit -m "feat: keyline React runtime, package build and CI" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lab dev plugin and review store

**Files:**
- Create: `site/package.json`, `site/index.html`, `site/vite.config.ts`, `site/lab-plugin.ts`, `site/src/virtual.d.ts`, `site/src/lab/types.ts`, `site/src/lab/review.ts`
- Modify: `package.json` (add `dev:lab`)
- Test: `site/src/lab/review.test.ts`, `site/lab-plugin.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks at runtime. It reads `icons/` directly, so the lab shows icons that still fail lint.
- Produces:
  - `interface LabIcon { name: string; svg: string; meta: { category?: string; tags?: string[]; aliases?: string[] } | null }` and `SIZES = [16, 20, 24] as const`, `REFERENCE_NAMES = ['search', 'calendar', 'user', 'circle-x'] as const` (`site/src/lab/types.ts`)
  - `type ReviewStatus = 'needs-work' | 'ok'`, `interface ReviewEntry { status: ReviewStatus; note: string; updatedAt: string }`, `type ReviewFile = Record<string, ReviewEntry>`, `interface ReviewUpdate { name: string; status: ReviewStatus | 'clear'; note?: string }`
  - `parseReviewFile(text: string | null): ReviewFile` throws on invalid JSON; `applyReview(current: ReviewFile, update: ReviewUpdate, now: Date): ReviewFile` throws on an invalid update
  - `readLabIcons(iconsDir: string): LabIcon[]`, `keylineLab(options: { iconsDir: string }): Plugin`
  - Virtual module `virtual:keyline-icons` (default export `LabIcon[]`). HTTP `GET/POST /__lab/review`.

- [ ] **Step 1: Write the failing review test**

`site/src/lab/review.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyReview, parseReviewFile } from './review';

const NOW = new Date('2026-10-10T12:00:00.000Z');

describe('parseReviewFile', () => {
  it('treats a missing or empty file as no reviews', () => {
    expect(parseReviewFile(null)).toEqual({});
    expect(parseReviewFile('  \n')).toEqual({});
  });

  it('refuses to parse broken JSON instead of resetting it', () => {
    expect(() => parseReviewFile('{ "home": ')).toThrow();
    expect(() => parseReviewFile('[]')).toThrow(/must be an object/);
  });
});

describe('applyReview', () => {
  it('adds and updates entries with a trimmed note and timestamp', () => {
    const first = applyReview({}, { name: 'bell', status: 'needs-work', note: '  0.5px too wide  ' }, NOW);
    expect(first).toEqual({ bell: { status: 'needs-work', note: '0.5px too wide', updatedAt: NOW.toISOString() } });

    const second = applyReview(first, { name: 'bell', status: 'ok' }, NOW);
    expect(second.bell).toEqual({ status: 'ok', note: '', updatedAt: NOW.toISOString() });
  });

  it('clears an entry and leaves the rest alone', () => {
    const current = {
      bell: { status: 'ok' as const, note: '', updatedAt: 'a' },
      home: { status: 'needs-work' as const, note: 'x', updatedAt: 'b' },
    };
    expect(applyReview(current, { name: 'bell', status: 'clear' }, NOW)).toEqual({ home: current.home });
  });

  it('does not mutate the current object', () => {
    const current = {};
    applyReview(current, { name: 'bell', status: 'ok' }, NOW);
    expect(current).toEqual({});
  });

  it('rejects bad names and statuses', () => {
    expect(() => applyReview({}, { name: '../etc', status: 'ok' }, NOW)).toThrow(/invalid icon name/);
    expect(() => applyReview({}, { name: 'bell', status: 'maybe' as 'ok' }, NOW)).toThrow(/invalid status/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run site/src/lab/review.test.ts`
Expected: FAIL, cannot find `./review`.

- [ ] **Step 3: Implement `site/src/lab/review.ts` and `site/src/lab/types.ts`**

`site/src/lab/review.ts`:
```ts
export type ReviewStatus = 'needs-work' | 'ok';

export interface ReviewEntry {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
}

export type ReviewFile = Record<string, ReviewEntry>;

export interface ReviewUpdate {
  name: string;
  status: ReviewStatus | 'clear';
  note?: string;
}

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['needs-work', 'ok', 'clear']);

export function parseReviewFile(text: string | null): ReviewFile {
  if (text === null || text.trim() === '') return {};
  const data: unknown = JSON.parse(text);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('_review.json must be an object of { name: { status, note, updatedAt } }');
  }
  return data as ReviewFile;
}

export function applyReview(current: ReviewFile, update: ReviewUpdate, now: Date): ReviewFile {
  if (typeof update?.name !== 'string' || !NAME.test(update.name)) {
    throw new Error(`invalid icon name: ${String(update?.name)}`);
  }
  if (!STATUSES.has(update.status)) throw new Error(`invalid status: ${String(update.status)}`);

  const next = { ...current };
  if (update.status === 'clear') {
    delete next[update.name];
    return next;
  }
  next[update.name] = { status: update.status, note: (update.note ?? '').trim(), updatedAt: now.toISOString() };
  return next;
}
```

`site/src/lab/types.ts`:
```ts
export interface LabIcon {
  name: string;
  svg: string;
  meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
}

export const SIZES = [16, 20, 24] as const;

/** Fixed weight references shown in compare mode. */
export const REFERENCE_NAMES = ['search', 'calendar', 'user', 'circle-x'] as const;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run site/src/lab/review.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the failing plugin test**

`site/lab-plugin.test.ts`:
```ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readLabIcons } from './lab-plugin';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'keyline-lab-'));
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
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run site/lab-plugin.test.ts`
Expected: FAIL, cannot find `./lab-plugin`.

- [ ] **Step 7: Implement `site/lab-plugin.ts` and the site shell**

`site/lab-plugin.ts`:
```ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { applyReview, parseReviewFile, type ReviewFile, type ReviewUpdate } from './src/lab/review';
import type { LabIcon } from './src/lab/types';

const VIRTUAL_ID = 'virtual:keyline-icons';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function readLabIcons(iconsDir: string): LabIcon[] {
  return readdirSync(iconsDir)
    .filter((file) => file.endsWith('.svg') && !file.startsWith('_') && !file.startsWith('.'))
    .sort()
    .map((file) => {
      const name = file.slice(0, -'.svg'.length);
      const metaPath = join(iconsDir, `${name}.json`);
      let meta: LabIcon['meta'] = null;
      if (existsSync(metaPath)) {
        try {
          meta = JSON.parse(readFileSync(metaPath, 'utf8'));
        } catch {
          meta = null;
        }
      }
      return { name, svg: readFileSync(join(iconsDir, file), 'utf8').replace(/^﻿/, ''), meta };
    });
}

export function keylineLab({ iconsDir }: { iconsDir: string }): Plugin {
  const reviewFile = join(iconsDir, '_review.json');
  const isIconFile = (file: string) => {
    const rel = relative(iconsDir, file);
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && !basename(file).startsWith('_');
  };

  return {
    name: 'keyline-lab',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      return id === RESOLVED_ID ? `export default ${JSON.stringify(readLabIcons(iconsDir))};` : null;
    },
    configureServer(server) {
      server.watcher.add(iconsDir);
      const reload = (file: string) => {
        if (!isIconFile(file)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('change', reload);
      server.watcher.on('unlink', reload);

      server.middlewares.use('/__lab/review', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        let current: ReviewFile;
        try {
          current = parseReviewFile(existsSync(reviewFile) ? readFileSync(reviewFile, 'utf8') : null);
        } catch (error) {
          send(500, { error: `icons/_review.json is unreadable, fix it by hand: ${(error as Error).message}` });
          return;
        }
        if (req.method === 'GET') {
          send(200, current);
          return;
        }
        if (req.method !== 'POST') {
          send(405, { error: 'use GET or POST' });
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const next = applyReview(current, JSON.parse(body) as ReviewUpdate, new Date());
            writeFileSync(reviewFile, `${JSON.stringify(next, null, 2)}\n`);
            send(200, next);
          } catch (error) {
            send(400, { error: (error as Error).message });
          }
        });
      });
    },
  };
}
```

`site/package.json`:
```json
{
  "name": "site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}
```

`site/vite.config.ts`:
```ts
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { keylineLab } from './lab-plugin';

export default defineConfig({
  plugins: [react(), keylineLab({ iconsDir: fileURLToPath(new URL('../icons', import.meta.url)) })],
});
```

`site/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Keyline</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`site/src/virtual.d.ts`:
```ts
declare module 'virtual:keyline-icons' {
  const icons: Array<{
    name: string;
    svg: string;
    meta: { category?: string; tags?: string[]; aliases?: string[] } | null;
  }>;
  export default icons;
}
```

In root `package.json` `"scripts"`, add:
```json
"dev:lab": "npm run dev -w site",
```

Run: `npm install`
Expected: links the `site` workspace, no errors.

- [ ] **Step 8: Run the tests**

Run: `npx vitest run site`
Expected: PASS (review + plugin suites).

- [ ] **Step 9: Commit**

```bash
git add site package.json package-lock.json
git commit -m "feat: lab dev plugin with live icons and review notes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The `/lab` page

**Files:**
- Create: `site/src/main.tsx`, `site/src/lab/IconGlyph.tsx`, `site/src/lab/KeylineOverlay.tsx`, `site/src/lab/Ladder.tsx`, `site/src/lab/GridView.tsx`, `site/src/lab/MenuMock.tsx`, `site/src/lab/Compare.tsx`, `site/src/lab/ReviewPanel.tsx`, `site/src/lab/Lab.tsx`, `site/src/lab/lab.css`
- Test: `site/src/lab/Lab.test.tsx`

**Interfaces:**
- Consumes: `LabIcon`, `SIZES`, `REFERENCE_NAMES` (Task 6); `ReviewFile`, `ReviewEntry`, `ReviewUpdate` (Task 6); `virtual:keyline-icons` and `/__lab/review` (Task 6).
- Produces: `Lab({ icons, fetchImpl }: { icons: LabIcon[]; fetchImpl?: typeof fetch })`. Nothing later in this plan depends on it. The site plan replaces `main.tsx` routing.

- [ ] **Step 1: Write the failing Lab test**

`site/src/lab/Lab.test.tsx`:
```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Lab } from './Lab';
import type { LabIcon } from './types';

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 2h12"/></svg>';
const icon = (name: string, category: string): LabIcon => ({ name, svg, meta: { category, tags: [], aliases: [] } });
const ICONS = [icon('home', 'navigation'), icon('inbox', 'navigation'), icon('search', 'navigation'), icon('calendar', 'objects')];

const reply = (data: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => data }) as Response;

afterEach(cleanup);

describe('Lab', () => {
  it('shows every icon at 16, 20 and 24', async () => {
    const fetchMock = vi.fn(async () => reply({}));
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    for (const size of [16, 20, 24]) {
      expect(screen.getAllByRole('button', { name: new RegExp(` at ${size}px$`) })).toHaveLength(4);
    }
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/__lab/review'));
  });

  it('opens compare with the same category plus the reference icons, each once', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const compare = screen.getByRole('region', { name: 'Compare home' });
    for (const name of ['home', 'inbox', 'search', 'calendar']) {
      expect(within(compare).getAllByText(name)).toHaveLength(2);
    }
  });

  it('saves a review note through the dev endpoint', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'POST'
        ? reply({ home: { status: 'needs-work', note: 'too wide', updatedAt: 'now' } })
        : reply({}),
    );
    render(<Lab icons={ICONS} fetchImpl={fetchMock as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    fireEvent.change(await screen.findByLabelText('Note'), { target: { value: 'too wide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Needs work' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/__lab/review',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'home', status: 'needs-work', note: 'too wide' }),
        }),
      ),
    );
    expect(await screen.findByText(/1 need work/)).toBeTruthy();
  });

  it('explains that notes need the dev server when the endpoint is missing', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({}, false)) as unknown as typeof fetch} />);
    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));
    expect(await screen.findByText(/only work in the dev server/)).toBeTruthy();
  });

  it('says what to do when there are no icons yet', () => {
    render(<Lab icons={[]} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);
    expect(screen.getByText(/No icons yet/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run site/src/lab/Lab.test.tsx`
Expected: FAIL, cannot find `./Lab`.

- [ ] **Step 3: Implement the small components**

`site/src/lab/IconGlyph.tsx`:
```tsx
export function IconGlyph({ svg, size }: { svg: string; size: number }) {
  return (
    <span
      className="glyph"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

`site/src/lab/KeylineOverlay.tsx`:
```tsx
const LINES = Array.from({ length: 15 }, (_, i) => i + 1);

/** The 16px grid, the 1px padding and the four keylines from spec §2. */
export function KeylineOverlay() {
  return (
    <svg className="overlay" viewBox="0 0 16 16" aria-hidden="true">
      {LINES.map((i) => (
        <g key={i}>
          <line x1={i} y1={0} x2={i} y2={16} />
          <line x1={0} y1={i} x2={16} y2={i} />
        </g>
      ))}
      <rect className="pad" x={1} y={1} width={14} height={14} />
      <circle className="key" cx={8} cy={8} r={6} />
      <rect className="key" x={2.25} y={2.25} width={11.5} height={11.5} rx={2} />
      <rect className="key" x={3} y={1.75} width={10} height={12.5} rx={2} />
      <rect className="key" x={1.75} y={3} width={12.5} height={10} rx={2} />
    </svg>
  );
}
```

`site/src/lab/Ladder.tsx`:
```tsx
import { IconGlyph } from './IconGlyph';
import type { ReviewFile } from './review';
import { SIZES, type LabIcon } from './types';

interface Props {
  icons: LabIcon[];
  selected: string | null;
  reviews: ReviewFile;
  onSelect: (name: string) => void;
}

export function Ladder({ icons, selected, reviews, onSelect }: Props) {
  return (
    <section className="lab-section" aria-label="Sizes">
      <h2>Sizes</h2>
      {SIZES.map((size) => (
        <div className="ladder-row" key={size}>
          <span className="ladder-size">{size}</span>
          {icons.map((icon) => (
            <button
              key={icon.name}
              type="button"
              className="cell"
              title={icon.name}
              aria-label={`${icon.name} at ${size}px`}
              data-selected={selected === icon.name || undefined}
              data-review={reviews[icon.name]?.status}
              onClick={() => onSelect(icon.name)}
            >
              <IconGlyph svg={icon.svg} size={size} />
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
```

`site/src/lab/GridView.tsx`:
```tsx
import { IconGlyph } from './IconGlyph';
import { KeylineOverlay } from './KeylineOverlay';
import type { LabIcon } from './types';

export function GridView({ icons, onSelect }: { icons: LabIcon[]; onSelect: (name: string) => void }) {
  return (
    <section className="lab-section" aria-label="On the grid">
      <h2>On the grid · 8×</h2>
      <div className="zoom-list">
        {icons.map((icon) => (
          <figure key={icon.name} className="zoom">
            <button type="button" className="zoom-stage" aria-label={`Select ${icon.name}`} onClick={() => onSelect(icon.name)}>
              <KeylineOverlay />
              <IconGlyph svg={icon.svg} size={128} />
            </button>
            <figcaption>{icon.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
```

`site/src/lab/MenuMock.tsx`:
```tsx
import { IconGlyph } from './IconGlyph';
import type { LabIcon } from './types';

const label = (name: string) => name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function MenuMock({ icons }: { icons: LabIcon[] }) {
  return (
    <section className="lab-section" aria-label="In a menu">
      <h2>In a menu</h2>
      <div className="menus">
        {(['light', 'dark'] as const).map((theme) => (
          <ul key={theme} className="menu" data-theme={theme}>
            {icons.map((icon) => (
              <li key={icon.name}>
                <IconGlyph svg={icon.svg} size={16} />
                <span>{label(icon.name)}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
```

`site/src/lab/Compare.tsx`:
```tsx
import { IconGlyph } from './IconGlyph';
import { REFERENCE_NAMES, type LabIcon } from './types';

export function Compare({ target, icons }: { target: LabIcon; icons: LabIcon[] }) {
  const category = target.meta?.category;
  const neighbours = icons.filter((i) => i.name !== target.name && category !== undefined && i.meta?.category === category);
  const references = REFERENCE_NAMES.map((name) => icons.find((i) => i.name === name)).filter(
    (i): i is LabIcon => i !== undefined && i.name !== target.name && !neighbours.includes(i),
  );
  const row = [target, ...neighbours, ...references];

  return (
    <section className="lab-section" aria-label={`Compare ${target.name}`}>
      <h2>Compare · {target.name}</h2>
      {[16, 24].map((size) => (
        <div key={size} className="compare-row">
          {row.map((icon) => (
            <figure key={icon.name} data-target={icon.name === target.name || undefined}>
              <IconGlyph svg={icon.svg} size={size} />
              <figcaption>{icon.name}</figcaption>
            </figure>
          ))}
        </div>
      ))}
    </section>
  );
}
```

`site/src/lab/ReviewPanel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { ReviewEntry, ReviewUpdate } from './review';

interface Props {
  name: string;
  entry: ReviewEntry | undefined;
  available: boolean;
  onSave: (update: ReviewUpdate) => Promise<void>;
}

export function ReviewPanel({ name, entry, available, onSave }: Props) {
  const [note, setNote] = useState(entry?.note ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');

  useEffect(() => {
    setNote(entry?.note ?? '');
    setState('idle');
  }, [name, entry?.note]);

  if (!available) {
    return (
      <section className="lab-section review" aria-label={`Review ${name}`}>
        <p className="muted">Review notes only work in the dev server: npm run dev:lab.</p>
      </section>
    );
  }

  const save = async (status: ReviewUpdate['status']) => {
    setState('saving');
    try {
      await onSave({ name, status, note });
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="lab-section review" aria-label={`Review ${name}`}>
      <h2>
        Review · {name} {entry && <span className="badge" data-status={entry.status}>{entry.status}</span>}
      </h2>
      <label htmlFor="review-note">Note</label>
      <textarea
        id="review-note"
        rows={3}
        value={note}
        placeholder="e.g. reads heavier than calendar at 16"
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="review-actions">
        <button type="button" disabled={state === 'saving'} onClick={() => save('needs-work')}>
          Needs work
        </button>
        <button type="button" disabled={state === 'saving'} onClick={() => save('ok')}>
          Looks right
        </button>
        <button type="button" disabled={state === 'saving' || !entry} onClick={() => save('clear')}>
          Clear
        </button>
      </div>
      {state === 'error' && <p role="alert">Couldn't save. Is the dev server running?</p>}
    </section>
  );
}
```

- [ ] **Step 4: Implement `site/src/lab/Lab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Compare } from './Compare';
import { GridView } from './GridView';
import { Ladder } from './Ladder';
import { MenuMock } from './MenuMock';
import type { ReviewFile, ReviewUpdate } from './review';
import { ReviewPanel } from './ReviewPanel';
import type { LabIcon } from './types';

interface Props {
  icons: LabIcon[];
  fetchImpl?: typeof fetch;
}

export function Lab({ icons, fetchImpl = globalThis.fetch }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selected, setSelected] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewFile>({});
  const [reviewsAvailable, setReviewsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchImpl('/__lab/review')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: ReviewFile) => {
        if (cancelled) return;
        setReviews(data);
        setReviewsAvailable(true);
      })
      .catch(() => {
        if (!cancelled) setReviewsAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchImpl]);

  const saveReview = async (update: ReviewUpdate) => {
    const res = await fetchImpl('/__lab/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error(`save failed: ${res.status}`);
    setReviews((await res.json()) as ReviewFile);
  };

  const target = icons.find((icon) => icon.name === selected) ?? null;
  const flagged = Object.values(reviews).filter((entry) => entry.status === 'needs-work').length;

  return (
    <div className="lab" data-theme={theme}>
      <header className="lab-header">
        <h1>
          keyline <span>/lab</span>
        </h1>
        <p>
          {icons.length} icons{reviewsAvailable ? ` · ${flagged} need work` : ''}
        </p>
        <button type="button" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      {icons.length === 0 ? (
        <p className="muted">No icons yet. Add name.svg and name.json to icons/ and this page reloads.</p>
      ) : (
        <>
          {target && (
            <div className="focus">
              <Compare target={target} icons={icons} />
              <ReviewPanel name={target.name} entry={reviews[target.name]} available={reviewsAvailable} onSave={saveReview} />
            </div>
          )}
          <Ladder icons={icons} selected={selected} reviews={reviews} onSelect={setSelected} />
          <GridView icons={icons} onSelect={setSelected} />
          <MenuMock icons={icons} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run site/src/lab/Lab.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Add the entry point and styles**

`site/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import icons from 'virtual:keyline-icons';
import { Lab } from './lab/Lab';
import './lab/lab.css';

const isLab = window.location.pathname.replace(/\/$/, '') === '/lab';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLab ? (
      <Lab icons={icons} />
    ) : (
      <main className="lab">
        <p className="muted">
          Keyline. The site comes in a later plan. <a href="/lab">Open /lab</a>
        </p>
      </main>
    )}
  </StrictMode>,
);
```

`site/src/lab/lab.css`:
```css
body {
  margin: 0;
}

.lab {
  --bg: #fafafa;
  --surface: #ffffff;
  --fg: #18181b;
  --muted: #71717a;
  --line: #e4e4e7;
  --grid: #ececef;
  --pad: #e11d74;
  --guide: #3b82f6;
  --flag: #f97316;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 24px 32px 64px;
  background: var(--bg);
  color: var(--fg);
  font: 14px/1.45 Inter, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.lab[data-theme='dark'] {
  --bg: #111113;
  --surface: #18181b;
  --fg: #ececef;
  --muted: #8b8b94;
  --line: #27272a;
  --grid: #232327;
}

.lab .muted { color: var(--muted); }
.lab a { color: inherit; }

.lab-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; }
.lab-header h1 { margin: 0; font-size: 15px; font-weight: 600; }
.lab-header h1 span { color: var(--muted); font-weight: 400; }
.lab-header p { flex: 1; margin: 0; color: var(--muted); font-variant-numeric: tabular-nums; }

.lab button {
  font: inherit;
  color: inherit;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
}
.lab button:disabled { opacity: 0.5; cursor: default; }
.lab button:focus-visible { outline: 2px solid var(--guide); outline-offset: 2px; }

.lab-section {
  margin-bottom: 16px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
}
.lab-section h2 { margin: 0 0 12px; font-size: 12px; font-weight: 500; color: var(--muted); }

.glyph { display: inline-block; flex: none; line-height: 0; }
.glyph > svg { display: block; width: 100%; height: 100%; }

.ladder-row { display: flex; flex-wrap: wrap; align-items: center; }
.ladder-size { width: 32px; font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
.lab .cell {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
}
.lab .cell:hover,
.lab .cell[data-selected] { background: var(--bg); }
.lab .cell[data-selected] { box-shadow: inset 0 0 0 1px var(--line); }
.lab .cell[data-review='needs-work']::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--flag);
}

.zoom-list { display: flex; flex-wrap: wrap; gap: 12px; }
.zoom { margin: 0; font-size: 11px; color: var(--muted); text-align: center; }
.lab .zoom-stage { position: relative; display: block; width: 130px; height: 130px; padding: 0; border-radius: 4px; }
.zoom-stage > .glyph,
.zoom-stage > .overlay { position: absolute; inset: 0; width: 128px; height: 128px; margin: auto; }
.overlay line { stroke: var(--grid); stroke-width: 1; vector-effect: non-scaling-stroke; }
.overlay .pad { fill: none; stroke: var(--pad); stroke-opacity: 0.35; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.overlay .key { fill: none; stroke: var(--guide); stroke-opacity: 0.3; vector-effect: non-scaling-stroke; }

.menus { display: flex; flex-wrap: wrap; gap: 16px; }
.menu { width: 240px; margin: 0; padding: 6px 0; list-style: none; border: 1px solid; border-radius: 12px; }
.menu[data-theme='light'] { background: #ffffff; color: #18181b; border-color: #e4e4e7; }
.menu[data-theme='dark'] { background: #18181b; color: #ececef; border-color: #27272a; }
.menu li { display: flex; align-items: center; gap: 10px; height: 32px; padding: 0 14px; font-size: 13px; }

.focus { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
.compare-row { display: flex; flex-wrap: wrap; align-items: end; gap: 16px; margin-bottom: 12px; }
.compare-row figure { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 0; font-size: 11px; color: var(--muted); }
.compare-row figure[data-target] figcaption { color: var(--fg); }

.review label { font-size: 12px; color: var(--muted); }
.review textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 6px 0 10px;
  padding: 8px;
  font: inherit;
  color: inherit;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  resize: vertical;
}
.review-actions { display: flex; gap: 8px; }
.badge { padding: 1px 6px; font-size: 11px; border-radius: 6px; background: var(--bg); }
.badge[data-status='needs-work'] { color: var(--flag); }

@media (max-width: 760px) {
  .lab { padding: 16px; }
  .focus { grid-template-columns: 1fr; }
}
```

- [ ] **Step 7: Check it in the browser**

Run: `npm run dev:lab` (Vite prints a local URL, usually `http://localhost:5173`).
Open `/lab`. Expected: header "keyline /lab · 0 icons", and the "No icons yet" message. Add any temporary icon from `scripts/__tests__/fixtures.ts` as `icons/home.svg` + `icons/home.json`. The page reloads by itself, and the icon shows in all sections. Click it: compare and review appear. Save a note, then check that `icons/_review.json` was written. Delete the temporary files and `_review.json` afterwards.

Run: `npm run typecheck && npm test`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add site/src
git commit -m "feat: /lab review page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: First batch, the 16 spike icons drawn to the rules

**Files:**
- Create: 16 pairs in `icons/`: `home`, `search`, `inbox`, `user`, `user-arrow`, `settings`, `sliders`, `bell`, `status-dashed`, `circle-x`, `calendar`, `tag`, `flag`, `trash`, `link`, `priority-high` (`.svg` + `.json`)
- Test: covered by `scripts/__tests__/repo-icons.test.ts` (Task 3) and the build.

**Interfaces:**
- Consumes: the whole pipeline (Tasks 1–7).
- Produces: 16 linted icons, a built `keyline` package exporting `HomeIcon` … `PriorityHighIcon`, and a `/lab` page with real content for Lucas's review.

Every `.svg` uses exactly this root, with the listed children inside:
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  …children…
</svg>
```

- [ ] **Step 1: Write the 16 SVGs**

| file | children |
|---|---|
| `home.svg` | `<path d="M2.75 6.5 8 2.25l5.25 4.25v6.25a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1Z"/>` `<path d="M6.5 13.75V10.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v3.25"/>` |
| `search.svg` | `<circle cx="7" cy="7" r="4.5"/>` `<path d="M10.25 10.25 13.75 13.75"/>` |
| `inbox.svg` | `<rect x="2.25" y="2.75" width="11.5" height="10.5" rx="2"/>` `<path d="M2.25 9H5l1 1.5h4L11 9h2.75"/>` |
| `user.svg` | `<circle cx="8" cy="4.75" r="2.75" fill="currentColor" stroke="none"/>` `<path d="M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75"/>` |
| `user-arrow.svg` | `<circle cx="7" cy="4.5" r="2.5" fill="currentColor" stroke="none"/>` `<path d="M2.25 13.25c.45-2.25 2.35-3.75 4.75-3.75"/>` `<path d="M10 12h3.75M12 10.25 13.75 12 12 13.75"/>` |
| `settings.svg` | `<path d="M5.75 3.75 6.25 2h3.5l.5 1.75.5.25 1.5-.5 1.75 3-1 1.25v.5l1 1.25-1.75 3-1.5-.5-.5.25-.5 1.75h-3.5l-.5-1.75-.5-.25-1.5.5-1.75-3 1-1.25v-.5l-1-1.25 1.75-3 1.5.5Z"/>` `<circle cx="8" cy="8" r="2"/>` |
| `sliders.svg` | `<path d="M2.5 5h4.25m3.5 0h3.25M2.5 11h1.25m3.5 0h6.25"/>` `<circle cx="8.5" cy="5" r="1.75"/>` `<circle cx="5.5" cy="11" r="1.75"/>` |
| `bell.svg` | `<path d="M3 11.5c.75-.5 1.25-1.25 1.25-2.25V7a3.75 3.75 0 0 1 7.5 0v2.25c0 1 .5 1.75 1.25 2.25Z"/>` `<path d="M6.5 13.75h3"/>` |
| `status-dashed.svg` | `<circle cx="8" cy="8" r="5.5" stroke-dasharray="1 3.32" stroke-dashoffset="0.5"/>` |
| `circle-x.svg` | `<path d="M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 1 1 0-12.5ZM6.5 5.5 8 7l1.5-1.5 1 1L9 8l1.5 1.5-1 1L8 9l-1.5 1.5-1-1L7 8 5.5 6.5Z" fill="currentColor" fill-rule="evenodd" stroke="none"/>` |
| `calendar.svg` | `<rect x="2.25" y="2.75" width="11.5" height="11" rx="2"/>` `<path d="M2.25 4.75a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2V6.5H2.25Z" fill="currentColor" stroke="none"/>` |
| `tag.svg` | `<path d="M5.5 3.75h6.75a1.5 1.5 0 0 1 1.5 1.5v5.5a1.5 1.5 0 0 1-1.5 1.5H5.5L2.25 8Z"/>` `<circle cx="6" cy="8" r="1" fill="currentColor" stroke="none"/>` |
| `flag.svg` | `<path d="M3.5 14V2.75"/>` `<path d="M3.5 2.75H12L10 6l2 3H3.5Z" fill="currentColor"/>` |
| `trash.svg` | `<path d="M2.5 4.25h11"/>` `<path d="M6 4.25V3a.75.75 0 0 1 .75-.75h2.5A.75.75 0 0 1 10 3v1.25"/>` `<path d="m3.75 4.25.5 8.5a1 1 0 0 0 1 1h5.5a1 1 0 0 0 1-1l.5-8.5"/>` |
| `link.svg` | `<path d="M6.5 5.25H4.75a2.75 2.75 0 0 0 0 5.5H6.5"/>` `<path d="M9.5 5.25h1.75a2.75 2.75 0 0 1 0 5.5H9.5"/>` `<path d="M5.75 8h4.5"/>` |
| `priority-high.svg` | `<rect x="2.5" y="9.5" width="2.5" height="4.25" rx=".75" fill="currentColor" stroke="none"/>` `<rect x="6.75" y="6" width="2.5" height="7.75" rx=".75" fill="currentColor" stroke="none"/>` `<rect x="11" y="2.25" width="2.5" height="11.5" rx=".75" fill="currentColor" stroke="none"/>` |

Notes for the drawer:
- `circle-x` builds its x as an evenodd cutout with square ends, not a mask (spec §2).
- `link` is horizontal because transforms are banned. A diagonal version is a review question for Lucas.
- `status-dashed` uses 8 dashes: 2πr/8 = 4.32 per cycle. The 0.5 offset centers a dash on each axis.

- [ ] **Step 2: Write the 16 metadata files**

| file | contents |
|---|---|
| `home.json` | `{"category":"navigation","tags":["house","start","dashboard"],"aliases":["dashboard"]}` |
| `search.json` | `{"category":"navigation","tags":["find","magnifier","lookup"],"aliases":["find"]}` |
| `inbox.json` | `{"category":"navigation","tags":["tray","notifications","messages"],"aliases":["tray"]}` |
| `user.json` | `{"category":"people","tags":["person","account","profile","creator"],"aliases":["person"]}` |
| `user-arrow.json` | `{"category":"people","tags":["assignee","assign","delegate","person"],"aliases":["assignee"]}` |
| `settings.json` | `{"category":"system","tags":["gear","cog","preferences","options"],"aliases":["gear","cog"]}` |
| `sliders.json` | `{"category":"system","tags":["preferences","adjust","controls","filters"],"aliases":["preferences","adjustments"]}` |
| `bell.json` | `{"category":"status","tags":["notification","alert","subscribe"],"aliases":["notification"]}` |
| `status-dashed.json` | `{"category":"status","tags":["backlog","draft","pending","status"],"aliases":["backlog"]}` |
| `circle-x.json` | `{"category":"status","tags":["closed","cancel","error","remove"],"aliases":["closed","cancelled"]}` |
| `calendar.json` | `{"category":"objects","tags":["date","schedule","due","event"],"aliases":["date"]}` |
| `tag.json` | `{"category":"objects","tags":["label","category","price"],"aliases":["label"]}` |
| `flag.json` | `{"category":"objects","tags":["report","milestone","relation","mark"],"aliases":["report"]}` |
| `trash.json` | `{"category":"actions","tags":["delete","remove","bin","discard"],"aliases":["delete","bin"]}` |
| `link.json` | `{"category":"actions","tags":["url","chain","hyperlink","attach"],"aliases":["url","chain"]}` |
| `priority-high.json` | `{"category":"data","tags":["priority","importance","signal","bars"],"aliases":["signal"]}` |

- [ ] **Step 3: Lint, build, type-check and test**

Run: `npm run lint:icons`
Expected: `16 icons pass.` If anything fails, the output names the icon and rule. Fix the SVG, not the rule.

Run: `npm run build`
Expected: `Generated 16 icons.`, then tsup succeeds. `packages/keyline/dist/icons/` has 16 `.js` files, and `dist/index.d.ts` declares `HomeIcon` … `PriorityHighIcon`.

Run: `npm run typecheck && npm test`
Expected: both pass. `repo-icons.test.ts` now covers 16 real icons.

- [ ] **Step 4: Commit the batch**

```bash
git add icons
git commit -m "feat: first 16 icons drawn to the keyline rules" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Review gate (Lucas)**

Run: `npm run dev:lab` and open `/lab`.
Lucas reviews every icon at 16/20/24, light and dark, on the grid, in the menu, and in compare against the references. He marks each one **Looks right** or **Needs work** with a note.

Specific questions to answer during the review:
1. `user` / `user-arrow`: is the solid head the right weight next to `calendar`'s header band?
2. `settings`: are six wide teeth calm enough at 16, or should `sliders` be the default settings glyph?
3. `link`: horizontal (current) or diagonal like Linear's (a redraw without transforms)?
4. `circle-x`: do the square-ended cutouts read as rounded at 16?

- [ ] **Step 6: Apply review notes**

Read `icons/_review.json`. For every `needs-work` entry, change the SVG as the note asks, re-run `npm run lint:icons`, and check it in `/lab`. When Lucas marks it **Looks right**, move on. Commit each round:

```bash
git add icons
git commit -m "fix: apply /lab review notes to first batch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

The task is done when every one of the 16 icons is `ok` in `_review.json`. `_review.json` is committed with the batch so the review history stays in git.

---

## After this plan

The next plans, in order, each written once the previous one ships:
1. **The set:** the remaining 129 icons in category batches, each through the Task 8 loop.
2. **The site:** home, icon panel, craft cards and articles, guide (spec §6).
3. **Figma + release:** sync script, community file, README, `RELEASE.md`, 1.0 (spec §7–8).
