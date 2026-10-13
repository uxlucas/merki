# Merki: Figma File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Merki Icons" Figma file from the repo — component sets for all 157 icons at 16/20/24 bound to an `icon` colour variable, plus the Icons, Cover, Construction and Changelog pages — with a sync Claude runs through the Figma connection and can re-run every release, updating components in place.

**Architecture:** The sync code is TypeScript in `scripts/figma/` (`core.ts` for pages, the variable and components; `pages.ts` for the presentation pages). It targets the Figma Plugin API through a `figma` global. A generator (`scripts/figma-scripts.ts`, `npm run figma:scripts`) transpiles it with esbuild, strips the `export`s, and writes one self-contained script per `use_figma` call into `figma/out/` with that call's data embedded: setup, one per category, deprecations, then one per presentation page. The controller (Claude, in the main session) runs those scripts in order through the Figma MCP `use_figma` tool. Subagents only write and test code; they never touch Figma. The core logic is tested in vitest against a small fake `figma`.

**Tech Stack:** As the repo (Node ≥ 22, TypeScript 5.9, vitest 3, tsx), plus `esbuild` (already a devDependency) for transpiling. Figma MCP tools (controller only): `create_new_file`, `use_figma`, `get_metadata`, `get_screenshot`.

**Spec:** `docs/specs/2026-10-10-merki-design.md` §7 (Figma file, settled 2026-10-13), §2 (icon rules, keylines), §8 (release). Read §7 before starting.

## Global Constraints

- **Never run Python** in any form. Use node/tsx or the Edit tool. Never kill processes you didn't start. No dev servers.
- **Gate on real exit codes**: `npm test`, `npm run typecheck` and the generator are run without grep pipes; read the full output.
- **Subagents never call Figma tools.** Every `use_figma`/`create_new_file`/`get_*` call is the controller's, in Tasks 4 and 6.
- **Figma facts (verbatim):** team plan key `team::1560398843000489622`; project (folder) id `670037277`; file name `Merki Icons`; pages in order `Cover`, `Icons`, `Components`, `Construction`, `Changelog`; variable collection `Merki` with modes `Light` (`#18181b`) and `Dark` (`#e6e7eb`); colour variable `icon` with scopes `STROKE_COLOR` and `SHAPE_FILL`; component set name `category/name` (e.g. `objects/calendar`); variant property `Size` with values `16`, `20`, `24`; deprecated section name `Deprecated`.
- **Strokes scale with the size** (1.5 → 1.875 → 2.25, interior 1.25 lines and solid accents too): each variant is the 16px drawing rescaled as a whole. Strokes stay strokes. `opacity` on solid shapes is preserved.
- **Update in place:** a re-sync must keep every component set's and every variant's node id. Only the drawing inside a variant is replaced. Nothing is deleted; icons missing from the repo move to the `Deprecated` section.
- **`use_figma` script rules** (from the figma-use skill, which the controller loads before any call): plain JS with top-level `await` and `return`; no `figma.notify`, `console.log` output, `setPluginData`, `loadAllPagesAsync`, `createImageAsync`, or `figma.closePlugin`; switch pages only with `await figma.setCurrentPageAsync(page)`, **at most once per script**; another page's nodes are read via `await page.loadAsync()`; colours are 0–1 `{r,g,b}`; fills/strokes are reassigned as new arrays; `setBoundVariableForPaint` returns a new paint; fonts are loaded before any text write; every script `return`s the ids and counts it touched.
- **Every generated script is under 50,000 characters** (the `use_figma` limit) and compiles as an async function body.
- **Rate limits:** the controller paces calls to ≤ 15 per minute and ≤ 200 per day (Lucas's Full seat).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Re-sync keeps keys:** running the components scripts twice must not create a second set or variant for any icon, and must keep their node ids. Test: Task 2 (fake Figma); live check: Task 6.
2. **An icon that comes back from Deprecated** moves back to its category section with the same node ids. Test: Task 2.
3. **Script size and syntax:** a category grows, or the runtime grows, and a script silently exceeds 50,000 characters or stops compiling. Test: Task 3 (every generated file).
4. **Solid accents and dimmed shapes:** a solid fill (calendar's header band, user's head) and an `opacity="0.3"` shape keep their look after colour binding. Tests: Task 1 (data keeps them), Task 2 (binding keeps paint opacity); live check: Task 4.
5. **Missing component on a presentation page:** the Icons page, Cover or Construction asks for a set that isn't there. Expected: the script throws a clear error naming it, before changing the page. Test: Task 5.

---

## File structure

```
scripts/
  lib/figma-data.ts            # icons.json + _set.json → FigmaIcon[] / categories (pure)
  figma/core.ts                # runs in Figma: pages, variable, drawing, component sets, sections, deprecations
  figma/pages.ts               # runs in Figma: Icons page, Cover, Construction, Changelog
  figma-scripts.ts             # generator: writes figma/out/*.js + manifest.json
  __tests__/figma-data.test.ts
  __tests__/fake-figma.ts      # minimal fake of the Plugin API for tests
  __tests__/figma-core.test.ts
  __tests__/figma-scripts.test.ts
  __tests__/figma-pages.test.ts
figma/
  file.json                    # { fileKey, url } — written in Task 4, committed
  README.md                    # how a sync runs (Task 7)
  out/                         # generated scripts (git-ignored)
```

---

### Task 1: Figma icon data

**Files:**
- Create: `scripts/lib/figma-data.ts`, `scripts/__tests__/figma-data.test.ts`

**Interfaces:**
- Consumes: `site/src/data/icons.json` (generated by `npm run build:icons`: `{ name, component, category, tags, aliases, svg }[]`), `icons/_set.json` (category → names, canonical order).
- Produces:
  ```ts
  export interface SourceIcon { name: string; component: string; category: string; tags: string[]; aliases: string[]; svg: string }
  export interface FigmaIcon { name: string; category: string; setName: string; description: string; svg: string }
  export interface FigmaCategory { id: string; label: string; icons: FigmaIcon[] }
  export function toFigmaSvg(svg: string): string
  export function figmaDescription(icon: SourceIcon): string
  export function figmaCategories(icons: SourceIcon[], order: Record<string, string[]>): FigmaCategory[]
  ```

- [ ] **Step 1: Write the failing test** `scripts/__tests__/figma-data.test.ts`

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { figmaCategories, figmaDescription, toFigmaSvg, type SourceIcon } from '../lib/figma-data.js';

const icons = JSON.parse(readFileSync(new URL('../../site/src/data/icons.json', import.meta.url), 'utf8')) as SourceIcon[];
const order = JSON.parse(readFileSync(new URL('../../icons/_set.json', import.meta.url), 'utf8')) as Record<string, string[]>;
const byName = new Map(icons.map((i) => [i.name, i]));

describe('toFigmaSvg', () => {
  it('sizes the svg at 16 and swaps currentColor for black, which the sync rebinds to the icon variable', () => {
    const out = toFigmaSvg(byName.get('calendar')!.svg);
    expect(out.startsWith('<svg width="16" height="16" ')).toBe(true);
    expect(out).not.toContain('currentColor');
    expect(out).toContain('#000000');
  });

  it('keeps solid accents, dimmed shapes and the 1.25 detail weight', () => {
    expect(toFigmaSvg(byName.get('calendar')!.svg)).toContain('fill="#000000"');
    expect(toFigmaSvg(byName.get('priority-low')!.svg)).toContain('opacity="0.3"');
    expect(toFigmaSvg(byName.get('globe')!.svg)).toContain('stroke-width="1.25"');
  });
});

describe('figmaDescription', () => {
  it('lists the React name, tags and aliases, skipping empty lines', () => {
    const d = figmaDescription({ name: 'x', component: 'XIcon', category: 'actions', tags: ['close', 'remove'], aliases: [], svg: '' });
    expect(d).toBe('React: <XIcon />\nTags: close, remove');
    expect(figmaDescription({ name: 'a', component: 'AIcon', category: 'data', tags: [], aliases: ['b'], svg: '' })).toBe('React: <AIcon />\nAliases: b');
  });
});

describe('figmaCategories', () => {
  it('follows _set.json order and holds every icon exactly once', () => {
    const cats = figmaCategories(icons, order);
    expect(cats.map((c) => c.id)).toEqual(Object.keys(order));
    expect(cats[0].label).toBe('Navigation');
    const all = cats.flatMap((c) => c.icons);
    expect(all).toHaveLength(157);
    expect(new Set(all.map((i) => i.setName)).size).toBe(157);
    expect(cats.find((c) => c.id === 'objects')!.icons.find((i) => i.name === 'calendar')!.setName).toBe('objects/calendar');
  });

  it('refuses a manifest name the build does not have', () => {
    expect(() => figmaCategories(icons, { ...order, navigation: ['nope'] })).toThrow(/nope/);
  });
});
```

Run: `npm run build:icons` then `npx vitest run scripts/__tests__/figma-data.test.ts` → FAIL (module missing).

- [ ] **Step 2: Write `scripts/lib/figma-data.ts`**

```ts
/** One icon as the build writes it to site/src/data/icons.json. */
export interface SourceIcon {
  name: string;
  component: string;
  category: string;
  tags: string[];
  aliases: string[];
  svg: string;
}

export interface FigmaIcon {
  name: string;
  category: string;
  /** Component set name in Figma: `category/name`. */
  setName: string;
  description: string;
  /** 16px SVG with concrete black paint; the sync binds every paint to the `icon` variable. */
  svg: string;
}

export interface FigmaCategory {
  id: string;
  label: string;
  icons: FigmaIcon[];
}

export function toFigmaSvg(svg: string): string {
  return svg.replace(/^<svg\b/, '<svg width="16" height="16"').replace(/currentColor/g, '#000000');
}

export function figmaDescription(icon: SourceIcon): string {
  return [
    `React: <${icon.component} />`,
    icon.tags.length ? `Tags: ${icon.tags.join(', ')}` : null,
    icon.aliases.length ? `Aliases: ${icon.aliases.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

const label = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1);

export function figmaCategories(icons: SourceIcon[], order: Record<string, string[]>): FigmaCategory[] {
  const byName = new Map(icons.map((icon) => [icon.name, icon]));
  return Object.entries(order).map(([id, names]) => ({
    id,
    label: label(id),
    icons: names.map((name) => {
      const icon = byName.get(name);
      if (!icon) throw new Error(`icons/_set.json lists ${name}, but the build has no such icon`);
      return { name, category: id, setName: `${id}/${name}`, description: figmaDescription(icon), svg: toFigmaSvg(icon.svg) };
    }),
  }));
}
```

Run the test → PASS (5 tests). Then `npm test` and `npm run typecheck` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/figma-data.ts scripts/__tests__/figma-data.test.ts
git commit -m "feat(figma): icon data for the Figma sync"
```

---

### Task 2: The sync core (pages, variable, component sets)

**Files:**
- Create: `scripts/figma/core.ts`, `scripts/__tests__/fake-figma.ts`, `scripts/__tests__/figma-core.test.ts`

**Interfaces:**
- Consumes: `FigmaCategory` shape from Task 1 (as plain JSON data).
- Produces (all run inside Figma via a `figma` global; exported for tests and for the generator):
  `SIZES`, `PAGE_NAMES`, `pageByName(name)`, `ensurePages()`, `ensureIconVariable()`, `boundPaint(paint, variable)`, `bindPaints(node, variable)`, `drawInto(component, svg, size, variable)`, `gridPosition(index, cols)`, `layoutVariants(set)`, `upsertIconSet(icon, sets, section, variable)`, `syncCategory(data)`, `deprecateMissing(keepNames)`, plus shared helpers `hex(color)`, `autoLayout(direction, props)`, `loadFonts()`, `text(chars, font, size, color)`.
  `syncCategory(data)` takes `{ id, label, previousLabel: string | null, icons: FigmaIcon[] }` and returns `{ section, sets, created, updated, variantIds }`.

The file is written in TypeScript with `declare const figma: any;` so it typechecks without Figma's typings; the generator (Task 3) transpiles it. Keep it free of imports — it is inlined into scripts.

- [ ] **Step 1: Write the fake Figma** `scripts/__tests__/fake-figma.ts`

```ts
/* A minimal stand-in for the Figma Plugin API: just what scripts/figma/core.ts and pages.ts touch. */
let nextId = 1;

export class FakeNode {
  id = `${nextId++}:1`;
  name = '';
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  description = '';
  fills: any[] = [];
  strokes: any[] = [];
  opacity = 1;
  clipsContent = true;
  scale = 1;
  parent: FakeNode | null = null;
  children: FakeNode[] = [];
  removed = false;
  constructor(public type: string) {}
  appendChild(child: FakeNode) {
    child.parent?.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = this;
    this.children.push(child);
  }
  insertChild(index: number, child: FakeNode) {
    child.parent?.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = this;
    this.children.splice(index, 0, child);
  }
  remove() {
    this.parent?.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
    this.removed = true;
  }
  findAll(predicate: (n: FakeNode) => boolean = () => true): FakeNode[] {
    return this.children.flatMap((c) => [...(predicate(c) ? [c] : []), ...c.findAll(predicate)]);
  }
  findAllWithCriteria({ types }: { types: string[] }) {
    return this.findAll((n) => types.includes(n.type));
  }
  resizeWithoutConstraints(w: number, h: number) {
    this.width = w;
    this.height = h;
  }
  resize(w: number, h: number) {
    this.resizeWithoutConstraints(w, h);
  }
  rescale(s: number) {
    this.scale *= s;
    this.width *= s;
    this.height *= s;
    for (const c of this.findAll()) c.scale *= s;
  }
  async loadAsync() {}
  createInstance() {
    const inst = new FakeNode('INSTANCE');
    (inst as any).mainComponent = this;
    return inst;
  }
}

export interface FakeFigma {
  figma: any;
  pages: () => FakeNode[];
  current: () => FakeNode;
}

/** `svgs` lets a test see which drawing landed in a component: each import records its source in `svg`. */
export function createFakeFigma(): FakeFigma {
  const root = new FakeNode('DOCUMENT');
  const first = new FakeNode('PAGE');
  first.name = 'Page 1';
  root.appendChild(first);
  let current = first;
  const collections: any[] = [];
  const variables: any[] = [];

  const figma = {
    root,
    get currentPage() {
      return current;
    },
    async setCurrentPageAsync(page: FakeNode) {
      current = page;
    },
    createPage() {
      const p = new FakeNode('PAGE');
      root.appendChild(p);
      return p;
    },
    createComponent() {
      const c = new FakeNode('COMPONENT');
      current.appendChild(c);
      return c;
    },
    createSection() {
      const s = new FakeNode('SECTION');
      current.appendChild(s);
      return s;
    },
    createFrame() {
      const f = new FakeNode('FRAME');
      current.appendChild(f);
      return f;
    },
    createNodeFromSvg(svg: string) {
      const frame = new FakeNode('FRAME');
      frame.resizeWithoutConstraints(16, 16);
      const vector = new FakeNode('VECTOR');
      (vector as any).svg = svg;
      vector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
      if (svg.includes('fill="#000000"')) vector.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: svg.includes('opacity="0.3"') ? 0.3 : 1 }];
      frame.appendChild(vector);
      current.appendChild(frame);
      return frame;
    },
    combineAsVariants(components: FakeNode[], parent: FakeNode) {
      const set = new FakeNode('COMPONENT_SET');
      parent.appendChild(set);
      for (const c of components) set.appendChild(c);
      return set;
    },
    variables: {
      async getLocalVariableCollectionsAsync() {
        return collections;
      },
      async getLocalVariablesAsync() {
        return variables;
      },
      createVariableCollection(name: string) {
        const modes = [{ modeId: 'm1', name: 'Mode 1' }];
        const c = {
          id: `VariableCollectionId:${collections.length + 1}`,
          name,
          modes,
          renameMode(id: string, n: string) {
            modes.find((m) => m.modeId === id)!.name = n;
          },
          addMode(n: string) {
            const id = `m${modes.length + 1}`;
            modes.push({ modeId: id, name: n });
            return id;
          },
        };
        collections.push(c);
        return c;
      },
      createVariable(name: string, collection: any) {
        const values: Record<string, unknown> = {};
        const v = {
          id: `VariableID:${variables.length + 1}`,
          name,
          variableCollectionId: collection.id,
          scopes: ['ALL_SCOPES'],
          values,
          setValueForMode(mode: string, value: unknown) {
            values[mode] = value;
          },
        };
        variables.push(v);
        return v;
      },
      setBoundVariableForPaint(paint: any, field: string, variable: any) {
        return { ...paint, boundVariables: { [field]: { type: 'VARIABLE_ALIAS', id: variable.id } } };
      },
    },
  };
  return { figma, pages: () => root.children, current: () => current };
}
```

- [ ] **Step 2: Write the failing core test** `scripts/__tests__/figma-core.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { deprecateMissing, ensureIconVariable, ensurePages, gridPosition, syncCategory } from '../figma/core.js';
import { createFakeFigma, type FakeFigma } from './fake-figma.js';

let fake: FakeFigma;
beforeEach(async () => {
  fake = createFakeFigma();
  (globalThis as any).figma = fake.figma;
  await ensurePages();
});

const icon = (name: string, svg = '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>') => ({
  name,
  category: 'objects',
  setName: `objects/${name}`,
  description: `React: <${name}Icon />`,
  svg,
});
const category = (icons: ReturnType<typeof icon>[], previousLabel: string | null = null) => ({ id: 'objects', label: 'Objects', previousLabel, icons });
const sets = () => fake.pages().find((p) => p.name === 'Components')!.findAllWithCriteria({ types: ['COMPONENT_SET'] });

describe('ensurePages and the icon variable', () => {
  it('creates the five pages in order, reusing the blank first page', async () => {
    expect(fake.pages().map((p) => p.name)).toEqual(['Cover', 'Icons', 'Components', 'Construction', 'Changelog']);
    await ensurePages();
    expect(fake.pages()).toHaveLength(5);
  });

  it('creates the Merki collection with Light and Dark, once', async () => {
    const v = await ensureIconVariable();
    const again = await ensureIconVariable();
    expect(again.id).toBe(v.id);
    expect(v.name).toBe('icon');
    expect(v.scopes).toEqual(['STROKE_COLOR', 'SHAPE_FILL']);
    const [collection] = await fake.figma.variables.getLocalVariableCollectionsAsync();
    expect(collection.name).toBe('Merki');
    expect(collection.modes.map((m: any) => m.name)).toEqual(['Light', 'Dark']);
  });
});

describe('syncCategory', () => {
  it('builds one set per icon with Size=16/20/24, scaled drawings and bound paints', async () => {
    const result = await syncCategory(category([icon('calendar'), icon('tag')]));
    expect(result).toMatchObject({ sets: 2, created: 2, updated: 0 });
    const [set] = sets();
    expect(set.name).toBe('objects/calendar');
    expect(set.description).toBe('React: <calendarIcon />');
    expect(set.children.map((c) => c.name)).toEqual(['Size=16', 'Size=20', 'Size=24']);
    expect(set.children.map((c) => c.width)).toEqual([16, 20, 24]);
    expect(set.children[2].children[0].scale).toBe(1.5);
    expect(set.children[0].children[0].strokes[0].boundVariables.color.id).toMatch(/^VariableID:/);
    expect(set.parent!.type).toBe('SECTION');
    expect(set.parent!.name).toBe('Objects');
  });

  it('updates in place on a second run: same set and variant ids, new drawing', async () => {
    await syncCategory(category([icon('calendar')]));
    const [set] = sets();
    const ids = [set.id, ...set.children.map((c) => c.id)];
    const result = await syncCategory(category([icon('calendar', '<svg width="16" height="16"><path d="M2 2" stroke="#000000"/></svg>')]));
    expect(result).toMatchObject({ sets: 1, created: 0, updated: 1 });
    expect(sets()).toHaveLength(1);
    const [again] = sets();
    expect([again.id, ...again.children.map((c) => c.id)]).toEqual(ids);
    expect((again.children[0].children[0] as any).svg).toContain('M2 2');
    expect(again.children[0].children).toHaveLength(1);
  });

  it('keeps paint opacity when binding (dimmed solid shapes)', async () => {
    await syncCategory(category([icon('priority-low', '<svg width="16" height="16"><path d="M1 1" fill="#000000" opacity="0.3"/></svg>')]));
    const fill = sets()[0].children[0].children[0].fills[0];
    expect(fill.opacity).toBe(0.3);
    expect(fill.boundVariables.color.id).toMatch(/^VariableID:/);
  });

  it('places the section below the previous category', async () => {
    await syncCategory({ id: 'navigation', label: 'Navigation', previousLabel: null, icons: [icon('home')] });
    await syncCategory(category([icon('calendar')], 'Navigation'));
    const page = fake.pages().find((p) => p.name === 'Components')!;
    const nav = page.children.find((n) => n.name === 'Navigation')!;
    const obj = page.children.find((n) => n.name === 'Objects')!;
    expect(obj.y).toBeGreaterThanOrEqual(nav.y + nav.height);
  });
});

describe('deprecateMissing', () => {
  it('moves sets the repo no longer has into Deprecated, without deleting them', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    const tagId = sets().find((s) => s.name === 'objects/tag')!.id;
    const result = await deprecateMissing(['objects/calendar']);
    expect(result.moved).toEqual(['objects/tag']);
    const tag = sets().find((s) => s.name === 'objects/tag')!;
    expect(tag.id).toBe(tagId);
    expect(tag.parent!.name).toBe('Deprecated');
  });

  it('brings a set back from Deprecated with the same ids when the repo has it again', async () => {
    await syncCategory(category([icon('calendar'), icon('tag')]));
    await deprecateMissing(['objects/calendar']);
    const tag = sets().find((s) => s.name === 'objects/tag')!;
    const ids = [tag.id, ...tag.children.map((c) => c.id)];
    await syncCategory(category([icon('calendar'), icon('tag')]));
    const back = sets().find((s) => s.name === 'objects/tag')!;
    expect([back.id, ...back.children.map((c) => c.id)]).toEqual(ids);
    expect(back.parent!.name).toBe('Objects');
    await deprecateMissing(['objects/calendar', 'objects/tag']);
    const page = fake.pages().find((p) => p.name === 'Components')!;
    expect(page.children.some((n) => n.name === 'Deprecated')).toBe(false);
  });
});

describe('gridPosition', () => {
  it('lays sets out in rows of six', () => {
    expect(gridPosition(0, 6)).toEqual({ x: 40, y: 64 });
    expect(gridPosition(7, 6)).toEqual({ x: 40 + 136, y: 64 + 72 });
  });
});
```

Run: `npx vitest run scripts/__tests__/figma-core.test.ts` → FAIL (module missing).

- [ ] **Step 3: Write `scripts/figma/core.ts`**

```ts
/*
 * Runs inside Figma through the Figma connection (use_figma). Plain Plugin API, no imports:
 * scripts/figma-scripts.ts transpiles this file, strips `export`, and inlines it into every script.
 */
declare const figma: any;

export const SIZES = [16, 20, 24];
export const PAGE_NAMES = ['Cover', 'Icons', 'Components', 'Construction', 'Changelog'];
const COLLECTION = 'Merki';
const VARIABLE = 'icon';
const DEPRECATED = 'Deprecated';
const GRID = { cols: 6, cellW: 136, cellH: 72, pad: 40, top: 64, gap: 120 };

export const hex = (value: string) => ({
  r: parseInt(value.slice(1, 3), 16) / 255,
  g: parseInt(value.slice(3, 5), 16) / 255,
  b: parseInt(value.slice(5, 7), 16) / 255,
});

export function pageByName(name: string): any {
  const page = figma.root.children.find((p: any) => p.name === name);
  if (!page) throw new Error(`Page "${name}" is missing. Run 00-setup first.`);
  return page;
}

export async function ensurePages(): Promise<string[]> {
  const created: string[] = [];
  const pages = figma.root.children;
  // A new file starts with one blank "Page 1": make it the Cover instead of leaving it behind.
  if (!pages.some((p: any) => p.name === 'Cover') && pages.length === 1 && pages[0].children.length === 0) pages[0].name = 'Cover';
  for (const name of PAGE_NAMES) {
    if (!figma.root.children.some((p: any) => p.name === name)) {
      const page = figma.createPage();
      page.name = name;
      created.push(page.id);
    }
  }
  PAGE_NAMES.forEach((name, index) => {
    const page = pageByName(name);
    if (figma.root.children.indexOf(page) !== index) figma.root.insertChild(index, page);
  });
  return created;
}

export async function ensureIconVariable(): Promise<any> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find((c: any) => c.name === COLLECTION);
  if (!collection) {
    collection = figma.variables.createVariableCollection(COLLECTION);
    collection.renameMode(collection.modes[0].modeId, 'Light');
    collection.addMode('Dark');
  }
  const mode = (name: string) => collection.modes.find((m: any) => m.name === name).modeId;
  const variables = await figma.variables.getLocalVariablesAsync('COLOR');
  let variable = variables.find((v: any) => v.name === VARIABLE && v.variableCollectionId === collection.id);
  if (!variable) variable = figma.variables.createVariable(VARIABLE, collection, 'COLOR');
  variable.scopes = ['STROKE_COLOR', 'SHAPE_FILL'];
  variable.setValueForMode(mode('Light'), hex('#18181b'));
  variable.setValueForMode(mode('Dark'), hex('#e6e7eb'));
  return variable;
}

export function boundPaint(paint: any, variable: any): any {
  const bound = figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: paint.color }, 'color', variable);
  return paint.opacity !== undefined && paint.opacity !== 1 ? { ...bound, opacity: paint.opacity } : bound;
}

export function bindPaints(node: any, variable: any): number {
  const nodes = node.findAll(() => true);
  for (const n of nodes) {
    if (Array.isArray(n.strokes) && n.strokes.length) n.strokes = n.strokes.map((p: any) => (p.type === 'SOLID' ? boundPaint(p, variable) : p));
    if (Array.isArray(n.fills) && n.fills.length) n.fills = n.fills.map((p: any) => (p.type === 'SOLID' ? boundPaint(p, variable) : p));
  }
  return nodes.length;
}

/** Replace a variant's drawing with the 16px SVG rescaled to `size` (strokes scale with it). The component itself stays. */
export function drawInto(component: any, svg: string, size: number, variable: any): void {
  for (const child of [...component.children]) child.remove();
  const art = figma.createNodeFromSvg(svg);
  if (size !== 16) art.rescale(size / 16);
  component.resizeWithoutConstraints(size, size);
  for (const child of [...art.children]) component.appendChild(child);
  art.remove();
  component.fills = [];
  component.clipsContent = false;
  bindPaints(component, variable);
}

export function gridPosition(index: number, cols: number): { x: number; y: number } {
  return { x: GRID.pad + (index % cols) * GRID.cellW, y: GRID.top + Math.floor(index / cols) * GRID.cellH };
}

export function layoutVariants(set: any): void {
  let x = 16;
  for (const child of set.children) {
    child.x = x;
    child.y = 16;
    x += child.width + 16;
  }
  set.resizeWithoutConstraints(x, 16 + Math.max(...set.children.map((c: any) => c.height)) + 16);
}

export function upsertIconSet(icon: any, sets: Map<string, any>, section: any, variable: any): { set: any; created: boolean } {
  const existing = sets.get(icon.setName);
  const variants = new Map<string, any>();
  if (existing) for (const child of existing.children) if (child.type === 'COMPONENT') variants.set(child.name, child);
  const fresh: any[] = [];
  const components = SIZES.map((size) => {
    const name = `Size=${size}`;
    let component = variants.get(name);
    if (!component) {
      component = figma.createComponent();
      component.name = name;
      fresh.push(component);
    }
    drawInto(component, icon.svg, size, variable);
    return component;
  });
  let set = existing;
  if (!set) {
    set = figma.combineAsVariants(components, section);
    set.name = icon.setName;
    sets.set(icon.setName, set);
  } else {
    for (const component of fresh) set.appendChild(component);
    if (set.parent !== section) section.appendChild(set);
  }
  set.description = icon.description;
  layoutVariants(set);
  return { set, created: !existing };
}

function sizeSection(section: any, count: number): void {
  const rows = Math.max(1, Math.ceil(count / GRID.cols));
  section.resizeWithoutConstraints(GRID.pad * 2 + GRID.cols * GRID.cellW, GRID.top + rows * GRID.cellH + GRID.pad);
}

/** One category: its section on the Components page, and every icon's set inside it, updated in place. */
export async function syncCategory(data: { id: string; label: string; previousLabel: string | null; icons: any[] }) {
  const page = pageByName('Components');
  await figma.setCurrentPageAsync(page);
  const variable = await ensureIconVariable();
  const sets = new Map<string, any>(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s]));
  let section = page.children.find((n: any) => n.type === 'SECTION' && n.name === data.label);
  if (!section) {
    section = figma.createSection();
    section.name = data.label;
    page.appendChild(section);
  }
  let created = 0;
  const variantIds: string[] = [];
  data.icons.forEach((icon, index) => {
    const result = upsertIconSet(icon, sets, section, variable);
    if (result.created) created += 1;
    const at = gridPosition(index, GRID.cols);
    result.set.x = at.x;
    result.set.y = at.y;
    variantIds.push(...result.set.children.map((c: any) => c.id));
  });
  sizeSection(section, data.icons.length);
  const previous = data.previousLabel ? page.children.find((n: any) => n.type === 'SECTION' && n.name === data.previousLabel) : null;
  section.x = 0;
  section.y = previous ? previous.y + previous.height + GRID.gap : 0;
  return { section: section.id, sets: data.icons.length, created, updated: data.icons.length - created, variantIds };
}

/** Sets the repo no longer has move to "Deprecated" (never deleted, so other files' instances keep working). */
export async function deprecateMissing(keepNames: string[]) {
  const page = pageByName('Components');
  await figma.setCurrentPageAsync(page);
  const keep = new Set(keepNames);
  const stale = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).filter((s: any) => !keep.has(s.name));
  let section = page.children.find((n: any) => n.type === 'SECTION' && n.name === DEPRECATED);
  if (!stale.length) {
    if (section && section.children.length === 0) section.remove();
    return { moved: [] as string[] };
  }
  if (!section) {
    section = figma.createSection();
    section.name = DEPRECATED;
    page.appendChild(section);
  }
  stale.forEach((set: any, index: number) => {
    section.appendChild(set);
    const at = gridPosition(index, GRID.cols);
    set.x = at.x;
    set.y = at.y;
  });
  sizeSection(section, stale.length);
  const bottom = Math.max(0, ...page.children.filter((n: any) => n !== section).map((n: any) => n.y + n.height));
  section.x = 0;
  section.y = bottom + GRID.gap;
  return { moved: stale.map((s: any) => s.name) };
}

/* ---- Shared helpers for the presentation pages (scripts/figma/pages.ts). ---- */

export function autoLayout(direction: 'HORIZONTAL' | 'VERTICAL', props: Record<string, unknown> = {}): any {
  const frame = figma.createFrame();
  frame.layoutMode = direction;
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.fills = [];
  Object.assign(frame, props);
  return frame;
}

export async function loadFonts() {
  const available = await figma.listAvailableFontsAsync();
  const has = (family: string, style: string) => available.some((f: any) => f.fontName.family === family && f.fontName.style === style);
  const pick = (family: string, style: string) => (has(family, style) ? { family, style } : { family: 'Inter', style });
  const fonts = {
    head: pick('Host Grotesk', 'Medium'),
    mono: pick('JetBrains Mono', 'Regular'),
    monoMedium: pick('JetBrains Mono', 'Medium'),
    text: { family: 'Inter', style: 'Regular' },
  };
  for (const font of Object.values(fonts)) await figma.loadFontAsync(font);
  return fonts;
}

export function text(chars: string, font: any, size: number, color: string): any {
  const node = figma.createText();
  node.fontName = font;
  node.fontSize = size;
  node.characters = chars;
  node.fills = [{ type: 'SOLID', color: hex(color) }];
  return node;
}
```

Run: `npx vitest run scripts/__tests__/figma-core.test.ts` → PASS (10 tests). If a test exposes a gap in the fake (not in core), extend the fake minimally and say so in the report. Then `npm test` and `npm run typecheck` → exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/figma/core.ts scripts/__tests__/fake-figma.ts scripts/__tests__/figma-core.test.ts
git commit -m "feat(figma): sync core — pages, icon variable, component sets updated in place"
```

---

### Task 3: The script generator

**Files:**
- Create: `scripts/figma-scripts.ts`, `scripts/__tests__/figma-scripts.test.ts`
- Modify: `package.json` (script), `.gitignore`

**Interfaces:**
- Consumes: Task 1 (`figmaCategories`), Task 2 (`scripts/figma/core.ts`), later Task 5 (`scripts/figma/pages.ts`, added to the same generator there).
- Produces: `export function buildScripts(): { name: string; purpose: string; code: string }[]` and, when run as `npm run figma:scripts`, the files `figma/out/NN-name.js` plus `figma/out/manifest.json` (`[{ file, purpose, chars }]`).

- [ ] **Step 1: Write the failing test** `scripts/__tests__/figma-scripts.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { buildScripts } from '../figma-scripts.js';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const scripts = buildScripts();

describe('generated Figma scripts', () => {
  it('runs setup first, then one script per category, then deprecations', () => {
    const names = scripts.map((s) => s.name);
    expect(names[0]).toBe('00-setup');
    expect(names.filter((n) => n.startsWith('10-components-'))).toHaveLength(10);
    expect(names).toContain('20-deprecated');
    expect(names.indexOf('20-deprecated')).toBeGreaterThan(names.lastIndexOf('10-components-billing'));
  });

  it('keeps every script under the 50,000-character use_figma limit and compiling', () => {
    for (const s of scripts) {
      expect(s.code.length, s.name).toBeLessThan(50_000);
      expect(() => new AsyncFunction(s.code), s.name).not.toThrow();
      expect(s.code, s.name).not.toMatch(/^export /m);
      expect(s.code, s.name).not.toMatch(/setPluginData|loadAllPagesAsync|figma\.notify|closePlugin/);
    }
  });

  it('puts every icon in exactly one components script', () => {
    const all = scripts.filter((s) => s.name.startsWith('10-')).flatMap((s) => [...s.code.matchAll(/"setName":"([a-z0-9/-]+)"/g)].map((m) => m[1]));
    expect(all).toHaveLength(157);
    expect(new Set(all).size).toBe(157);
  });

  it('passes the full set list to the deprecation script', () => {
    const dep = scripts.find((s) => s.name === '20-deprecated')!;
    const names = JSON.parse(dep.code.match(/deprecateMissing\((\[.*\])\)/)![1]) as string[];
    expect(names).toHaveLength(157);
    expect(names).toContain('objects/calendar');
  });
});
```

Run: `npx vitest run scripts/__tests__/figma-scripts.test.ts` → FAIL (module missing).

- [ ] **Step 2: Write `scripts/figma-scripts.ts`**

```ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';
import { figmaCategories, type SourceIcon } from './lib/figma-data.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Transpile a runtime file for inlining: no exports, no types, plain JS. */
function runtime(file: string): string {
  const { code } = transformSync(readFileSync(at(file), 'utf8'), { loader: 'ts', format: 'esm', target: 'es2020' });
  return code.replace(/^export /gm, '');
}

export interface Script {
  name: string;
  purpose: string;
  code: string;
}

export function buildScripts(): Script[] {
  const icons = JSON.parse(readFileSync(at('../site/src/data/icons.json'), 'utf8')) as SourceIcon[];
  const order = JSON.parse(readFileSync(at('../icons/_set.json'), 'utf8')) as Record<string, string[]>;
  const categories = figmaCategories(icons, order);
  const core = runtime('./figma/core.ts');
  const script = (name: string, purpose: string, body: string): Script => ({ name, purpose, code: `${core}\n${body}\n` });

  return [
    script(
      '00-setup',
      'Create the five pages in order and the Merki/icon colour variable (Light, Dark).',
      'const created = await ensurePages();\nconst variable = await ensureIconVariable();\nreturn { pages: figma.root.children.map((p) => p.name), createdPageIds: created, variableId: variable.id };',
    ),
    ...categories.map((category, index) =>
      script(
        `10-components-${category.id}`,
        `Update or create the ${category.label} component sets on the Components page.`,
        `const DATA = ${JSON.stringify({ id: category.id, label: category.label, previousLabel: index ? categories[index - 1].label : null, icons: category.icons })};\nreturn await syncCategory(DATA);`,
      ),
    ),
    script(
      '20-deprecated',
      'Move component sets the repo no longer has into the Deprecated section.',
      `return await deprecateMissing(${JSON.stringify(categories.flatMap((c) => c.icons.map((i) => i.setName)))});`,
    ),
  ];
}

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const out = at('../figma/out');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const scripts = buildScripts();
  for (const s of scripts) writeFileSync(`${out}/${s.name}.js`, s.code);
  writeFileSync(`${out}/manifest.json`, `${JSON.stringify(scripts.map((s) => ({ file: `${s.name}.js`, purpose: s.purpose, chars: s.code.length })), null, 2)}\n`);
  console.log(`Wrote ${scripts.length} scripts to figma/out (largest ${Math.max(...scripts.map((s) => s.code.length))} chars).`);
}
```

Note on `isMain`: on Windows `process.argv[1]` may differ in drive-letter casing from the module path; if `npm run figma:scripts` prints nothing, compare with `realpathSync` on both sides (as `site/prerender.ts` does) and say so in the report.

`package.json` (root) scripts, add: `"figma:scripts": "npm run build:icons && tsx scripts/figma-scripts.ts"`.

`.gitignore`, add: `figma/out/`.

- [ ] **Step 3: Test, run, commit**

Run: `npx vitest run scripts/__tests__/figma-scripts.test.ts` → PASS (4 tests). Then `npm run figma:scripts` → exit 0, prints `Wrote 12 scripts to figma/out (largest … chars).` with largest < 50000. Then `npm test`, `npm run typecheck` → exit 0.

```bash
git add scripts/figma-scripts.ts scripts/__tests__/figma-scripts.test.ts package.json .gitignore
git commit -m "feat(figma): generator writes the use_figma scripts for a sync"
```

---

### Task 4: First live sync of the components (controller)

The controller does this task in the main session; it is not dispatched. Load the `figma:figma-use` skill first and pass `skillNames: "figma-use"` on every `use_figma` call.

- [ ] **Step 1: Create the file** with `create_new_file`: `fileName: "Merki Icons"`, `planKey: "team::1560398843000489622"`, `projectId: "670037277"`, `editorType: "design"`. Write `figma/file.json`:
  ```json
  { "fileKey": "<returned key>", "url": "<returned url>", "team": "team::1560398843000489622", "project": "670037277" }
  ```
- [ ] **Step 2:** `npm run figma:scripts`. Run `figma/out/00-setup.js` through `use_figma` (pass the file's content as `code`). Expect pages `Cover, Icons, Components, Construction, Changelog` and a variable id.
- [ ] **Step 3: Probe before the full run.** Run `10-components-objects.js`. Then a read-only `use_figma` on the Components page that returns, for `objects/calendar`: the variant names, each variant's width, the `strokeWeight` of each variant's first stroked child (expect ≈ 1.5, 1.875, 2.25), and whether that child's stroke paint has `boundVariables.color`. Also for `objects/calendar` Size=16: the solid header's fill is bound. If `rescale` didn't scale stroke weights, fix `drawInto` in `scripts/figma/core.ts` (e.g. scale `strokeWeight` explicitly after `rescale`), add a regression assertion in `figma-core.test.ts`, regenerate, and re-run the probe. Any code fix here is committed as `fix(figma): …`.
- [ ] **Step 4:** Run the other nine `10-components-*.js` scripts in manifest order (≤ 15 calls a minute), then `20-deprecated.js` (expect `moved: []`).
- [ ] **Step 5: Check.** `get_metadata` on the Components page: 10 sections, 157 component sets, 471 variants. `get_screenshot` of two sections (Navigation, Data) and `priority-low` (dimmed bars kept). Record the counts in the ledger.
- [ ] **Step 6: Commit** `figma/file.json` (and any fix):
  ```bash
  git add figma/file.json
  git commit -m "chore(figma): create the Merki Icons file and sync the components"
  ```

---

### Task 5: The presentation pages

**Files:**
- Create: `scripts/figma/pages.ts`, `scripts/__tests__/figma-pages.test.ts`
- Modify: `scripts/figma-scripts.ts` (add four scripts), `scripts/__tests__/figma-scripts.test.ts` (expect them)

**Interfaces:**
- Consumes: Task 2 helpers (`pageByName`, `SIZES`, `hex`, `autoLayout`, `loadFonts`, `text`); Task 3 generator.
- Produces: `setsFromComponentsPage()`, `variantOf(set, size)`, `requireSets(sets, names)`, `buildIconsPage(categories)`, `buildCover(data)`, `buildConstruction(data)`, `buildChangelog(blocks)`; scripts `30-icons`, `40-cover`, `50-construction`, `60-changelog`.

`pages.ts` is inlined after `core.ts`, so it uses core's helpers directly. Declare them at the top for typechecking: `declare const figma: any; declare function pageByName(n: string): any; declare const hex: (v: string) => { r: number; g: number; b: number }; declare function autoLayout(d: 'HORIZONTAL' | 'VERTICAL', p?: Record<string, unknown>): any; declare function loadFonts(): Promise<any>; declare function text(c: string, f: any, s: number, color: string): any;` — and in tests, import core first (it defines the real ones on the module) by re-exporting: tests import both modules and assign core's exports onto `globalThis` before calling pages functions.

- [ ] **Step 1: Write the failing test** `scripts/__tests__/figma-pages.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../figma/core.js';
import { requireSets, variantOf } from '../figma/pages.js';
import { createFakeFigma } from './fake-figma.js';

beforeEach(async () => {
  const fake = createFakeFigma();
  Object.assign(globalThis, { figma: fake.figma, ...core });
  await core.ensurePages();
  await core.syncCategory({ id: 'objects', label: 'Objects', previousLabel: null, icons: [{ name: 'calendar', category: 'objects', setName: 'objects/calendar', description: '', svg: '<svg width="16" height="16"><path d="M1 1" stroke="#000000"/></svg>' }] });
});

describe('presentation pages', () => {
  it('finds a variant by size', async () => {
    const page = core.pageByName('Components');
    const set = page.findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];
    expect(variantOf(set, 24).name).toBe('Size=24');
    expect(() => variantOf(set, 32)).toThrow(/Size=32/);
  });

  it('refuses to build a page when a set is missing, naming it, before touching the page', async () => {
    const page = core.pageByName('Components');
    const sets = new Map(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s]));
    expect(() => requireSets(sets, ['objects/calendar', 'objects/nope'])).toThrow(/objects\/nope/);
    expect(() => requireSets(sets, ['objects/calendar'])).not.toThrow();
  });
});
```

Run → FAIL (module missing).

- [ ] **Step 2: Write `scripts/figma/pages.ts`**

```ts
/*
 * Presentation pages. Runs inside Figma, inlined after core.ts (uses its helpers).
 * Each build* function switches page once, clears what it owns, and rebuilds it from the data.
 */
declare const figma: any;
declare function pageByName(name: string): any;
declare const hex: (value: string) => { r: number; g: number; b: number };
declare function autoLayout(direction: 'HORIZONTAL' | 'VERTICAL', props?: Record<string, unknown>): any;
declare function loadFonts(): Promise<any>;
declare function text(chars: string, font: any, size: number, color: string): any;

const solid = (value: string, opacity?: number) => ({ type: 'SOLID', color: hex(value), ...(opacity === undefined ? {} : { opacity }) });

/** Component sets by name, read from the Components page without switching to it. */
export async function setsFromComponentsPage(): Promise<Map<string, any>> {
  const page = pageByName('Components');
  await page.loadAsync();
  return new Map(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s: any) => [s.name, s]));
}

export function variantOf(set: any, size: number): any {
  const variant = set.children.find((c: any) => c.name === `Size=${size}`);
  if (!variant) throw new Error(`${set.name} has no Size=${size} variant`);
  return variant;
}

export function requireSets(sets: Map<string, any>, names: string[]): void {
  const missing = names.filter((n) => !sets.has(n));
  if (missing.length) throw new Error(`Missing component sets: ${missing.join(', ')}. Run the 10-components scripts first.`);
}

function clearPage(page: any, keep: (node: any) => boolean = () => false): void {
  for (const child of [...page.children]) if (!keep(child)) child.remove();
}

/** Icons page: a white card per category, 16px instances with their names in mono (like the site). */
export async function buildIconsPage(categories: { label: string; setNames: string[] }[]) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, categories.flatMap((c) => c.setNames));
  const page = pageByName('Icons');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const column = autoLayout('VERTICAL', { name: 'Icons', itemSpacing: 32, paddingTop: 64, paddingBottom: 64, paddingLeft: 64, paddingRight: 64 });
  column.fills = [solid('#fafafa')];
  page.appendChild(column);
  let instances = 0;
  for (const category of categories) {
    const card = autoLayout('VERTICAL', { name: category.label, itemSpacing: 16, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, cornerRadius: 16 });
    card.fills = [solid('#ffffff')];
    card.strokes = [solid('#ececef')];
    card.strokeWeight = 1;
    const head = autoLayout('HORIZONTAL', { name: 'Header', itemSpacing: 8 });
    head.appendChild(text(category.label, fonts.head, 18, '#18181b'));
    head.appendChild(text(String(category.setNames.length), fonts.text, 14, '#a1a1aa'));
    card.appendChild(head);
    const grid = autoLayout('HORIZONTAL', { name: 'Grid', itemSpacing: 8, counterAxisSpacing: 8, layoutWrap: 'WRAP' });
    grid.primaryAxisSizingMode = 'FIXED';
    grid.resize(7 * 112 + 6 * 8, 112);
    card.appendChild(grid);
    for (const setName of category.setNames) {
      const name = setName.split('/')[1];
      const tile = autoLayout('VERTICAL', { name, itemSpacing: 12, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', cornerRadius: 14 });
      tile.primaryAxisSizingMode = 'FIXED';
      tile.counterAxisSizingMode = 'FIXED';
      tile.resize(112, 112);
      tile.fills = [solid('#ffffff')];
      tile.strokes = [solid('#ececef')];
      tile.strokeWeight = 1;
      tile.appendChild(variantOf(sets.get(setName), 16).createInstance());
      const label = text(name, fonts.mono, 11, '#71717a');
      label.textAutoResize = 'NONE';
      label.resize(96, 14);
      label.textAlignHorizontal = 'CENTER';
      label.textTruncation = 'ENDING';
      tile.appendChild(label);
      grid.appendChild(tile);
      instances += 1;
    }
    column.appendChild(card);
  }
  column.x = 0;
  column.y = 0;
  return { page: page.id, column: column.id, cards: categories.length, instances };
}

/** Cover, 1920×960 (also the Community thumbnail): the site's hero. */
export async function buildCover(data: { count: number; markSvg: string; wall: string[]; highlight: string[] }) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, data.wall);
  const page = pageByName('Cover');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const cover = figma.createFrame();
  cover.name = 'Cover';
  cover.resize(1920, 960);
  cover.fills = [solid('#fafafa')];
  cover.clipsContent = true;
  page.appendChild(cover);

  const wall = figma.createFrame();
  wall.name = 'Wall';
  wall.fills = [];
  wall.clipsContent = false;
  cover.appendChild(wall);
  const cols = 16;
  data.wall.forEach((setName, index) => {
    const instance = variantOf(sets.get(setName), 24).createInstance();
    instance.rescale(2);
    instance.x = (index % cols) * 96 + 24;
    instance.y = Math.floor(index / cols) * 96 + 24;
    if (data.highlight.includes(setName)) {
      for (const n of instance.findAll(() => true)) {
        if (Array.isArray(n.strokes) && n.strokes.length) n.strokes = [solid('#3b82f6')];
        if (Array.isArray(n.fills) && n.fills.length) n.fills = [solid('#3b82f6')];
      }
    }
    wall.appendChild(instance);
  });
  wall.resizeWithoutConstraints(cols * 96, Math.ceil(data.wall.length / cols) * 96);
  wall.x = (1920 - wall.width) / 2;
  wall.y = 600;

  const fade = figma.createRectangle();
  fade.name = 'Fade';
  fade.resize(1920, 360);
  fade.y = 600;
  fade.fills = [
    {
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[0, 1, 0], [-1, 0, 1]],
      gradientStops: [
        { position: 0, color: { ...hex('#fafafa'), a: 1 } },
        { position: 1, color: { ...hex('#fafafa'), a: 0 } },
      ],
    },
  ];
  cover.appendChild(fade);

  const brand = autoLayout('HORIZONTAL', { name: 'Brand', itemSpacing: 14, counterAxisAlignItems: 'CENTER' });
  const mark = figma.createNodeFromSvg(data.markSvg);
  mark.resize(26, 32);
  brand.appendChild(mark);
  brand.appendChild(text('merki-icons', fonts.monoMedium, 28, '#18181b'));
  cover.appendChild(brand);
  brand.x = (1920 - brand.width) / 2;
  brand.y = 140;

  const headline = text('An icon library that\nobsesses over details', fonts.head, 104, '#18181b');
  headline.textAlignHorizontal = 'CENTER';
  headline.letterSpacing = { unit: 'PERCENT', value: -4 };
  headline.lineHeight = { unit: 'PERCENT', value: 100 };
  cover.appendChild(headline);
  headline.x = (1920 - headline.width) / 2;
  headline.y = 224;

  const facts = text(`${data.count} icons · 16 / 20 / 24 · MIT`, fonts.mono, 24, '#71717a');
  cover.appendChild(facts);
  facts.x = (1920 - facts.width) / 2;
  facts.y = 476;

  cover.x = 0;
  cover.y = 0;
  return { page: page.id, cover: cover.id, wall: data.wall.length, highlighted: data.highlight.length };
}

/** Construction: the 16px grid template (kept as one component, redrawn in place) and worked examples. */
export async function buildConstruction(data: { examples: string[] }) {
  const sets = await setsFromComponentsPage();
  requireSets(sets, data.examples);
  const page = pageByName('Construction');
  await figma.setCurrentPageAsync(page);
  // The template is a component other files may use: keep the node, redraw its contents.
  let template = page.children.find((n: any) => n.type === 'COMPONENT' && n.name === 'Construction grid');
  clearPage(page, (n) => n === template);
  if (!template) {
    template = figma.createComponent();
    template.name = 'Construction grid';
    page.appendChild(template);
  }
  for (const child of [...template.children]) child.remove();
  template.resizeWithoutConstraints(320, 320);
  template.fills = [solid('#ffffff')];
  template.description = 'The 16px grid at 20×: 1px padding (pink) and the four keylines (blue) from spec §2.';
  for (let i = 0; i <= 16; i += 1) {
    for (const vertical of [true, false]) {
      const line = figma.createRectangle();
      line.resize(vertical ? 1 : 320, vertical ? 320 : 1);
      line.x = vertical ? Math.min(i * 20, 319) : 0;
      line.y = vertical ? 0 : Math.min(i * 20, 319);
      line.fills = [solid('#eceef3')];
      template.appendChild(line);
    }
  }
  const outline = (node: any, color: string, opacity: number) => {
    node.fills = [];
    node.strokes = [solid(color, opacity)];
    node.strokeWeight = 1;
    template.appendChild(node);
    return node;
  };
  const padding = outline(figma.createRectangle(), '#e11d74', 0.5);
  padding.resize(280, 280);
  padding.x = 20;
  padding.y = 20;
  padding.dashPattern = [4, 4];
  const circle = outline(figma.createEllipse(), '#3b82f6', 0.55);
  circle.resize(240, 240);
  circle.x = 40;
  circle.y = 40;
  for (const [w, h, x, y] of [[230, 230, 45, 45], [200, 250, 60, 35], [250, 200, 35, 60]]) {
    const r = outline(figma.createRectangle(), '#3b82f6', 0.55);
    r.resize(w, h);
    r.x = x;
    r.y = y;
    r.cornerRadius = 40;
  }
  template.x = 0;
  template.y = 0;

  const fonts = await loadFonts();
  const row = autoLayout('HORIZONTAL', { name: 'Examples', itemSpacing: 40 });
  for (const setName of data.examples) {
    const cell = autoLayout('VERTICAL', { name: setName, itemSpacing: 12 });
    const stage = figma.createFrame();
    stage.name = 'Stage';
    stage.resize(320, 320);
    stage.fills = [];
    stage.clipsContent = false;
    stage.appendChild(template.createInstance());
    const icon = variantOf(sets.get(setName), 16).createInstance();
    icon.rescale(20);
    stage.appendChild(icon);
    cell.appendChild(stage);
    cell.appendChild(text(setName.split('/')[1], fonts.mono, 14, '#71717a'));
    row.appendChild(cell);
  }
  page.appendChild(row);
  row.x = 400;
  row.y = 0;
  return { page: page.id, template: template.id, examples: data.examples.length };
}

/** Changelog: CHANGELOG.md as text blocks. */
export async function buildChangelog(blocks: { type: 'h' | 'p' | 'ul'; level?: number; text?: string; items?: string[] }[]) {
  const page = pageByName('Changelog');
  await figma.setCurrentPageAsync(page);
  clearPage(page);
  const fonts = await loadFonts();
  const plain = (s: string) => s.replace(/\*\*|`/g, '');
  const column = autoLayout('VERTICAL', { name: 'Changelog', itemSpacing: 14, paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 });
  column.counterAxisSizingMode = 'FIXED';
  column.resize(816, column.height);
  column.fills = [solid('#ffffff')];
  page.appendChild(column);
  const add = (node: any) => {
    column.appendChild(node);
    node.layoutSizingHorizontal = 'FILL';
    node.textAutoResize = 'HEIGHT';
  };
  for (const block of blocks) {
    if (block.type === 'h') add(text(plain(block.text ?? ''), fonts.head, block.level === 1 ? 32 : block.level === 2 ? 22 : 16, '#18181b'));
    else if (block.type === 'p') add(text(plain(block.text ?? ''), fonts.text, 14, '#52525b'));
    else for (const item of block.items ?? []) add(text(`•  ${plain(item)}`, fonts.text, 14, '#52525b'));
  }
  column.x = 0;
  column.y = 0;
  return { page: page.id, column: column.id, blocks: blocks.length };
}
```

- [ ] **Step 3: Generator entries** — in `scripts/figma-scripts.ts`:
  - Add `const pages = runtime('./figma/pages.ts');` and a second helper `const pageScript = (name, purpose, body) => ({ name, purpose, code: \`${core}\n${pages}\n${body}\n\` })`.
  - Import `parseMarkdown` from `'../site/src/lib/markdown.js'` (the `.tsx` resolves through tsx and vitest; the root tsconfig already compiles JSX) and read `../CHANGELOG.md` with `at()`.
  - Lucas's mark: create `figma/mark.svg` by copying the `<svg>` and `<path>` from `site/src/components/LucasMark.tsx` into plain SVG: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="32" viewBox="0 0 512 640"><path fill="#18181b" fill-rule="evenodd" d="…the same d…"/></svg>`. Read it with `at('../figma/mark.svg')`.
  - Append, in order:
    - `30-icons`: `return await buildIconsPage(${JSON.stringify(categories.map((c) => ({ label: c.label, setNames: c.icons.map((i) => i.setName) })))});`
    - `40-cover`: `const wall = categories.flatMap((c) => c.icons.map((i) => i.setName)).slice(0, 64);` then `return await buildCover(${JSON.stringify({ count: icons.length, markSvg, wall, highlight: [9, 22, 37, 50].map((n) => wall[n]) })});` (the four blue icons sit at the same wall positions as the approved mockup).
    - `50-construction`: examples = the setNames of `calendar`, `settings`, `bell`.
    - `60-changelog`: `return await buildChangelog(${JSON.stringify(parseMarkdown(changelog))});`
  - In `figma-scripts.test.ts`, extend the order test: `30-icons`, `40-cover`, `50-construction`, `60-changelog` come after `20-deprecated`, in that order; the size/compile test already covers them.

- [ ] **Step 4: Test, run, commit**

Run: `npx vitest run scripts/__tests__/figma-pages.test.ts scripts/__tests__/figma-scripts.test.ts` → PASS. `npm run figma:scripts` → exit 0, 16 scripts, largest < 50000. `npm test`, `npm run typecheck` → exit 0.

```bash
git add scripts/figma/pages.ts scripts/__tests__/figma-pages.test.ts scripts/figma-scripts.ts scripts/__tests__/figma-scripts.test.ts figma/mark.svg
git commit -m "feat(figma): Icons page, Cover, Construction and Changelog scripts"
```

---

### Task 6: Live pages and the re-sync check (controller)

Controller task (Figma calls). Load `figma:figma-use` first.

- [ ] **Step 1:** `npm run figma:scripts`. Run `30-icons.js`, `40-cover.js`, `50-construction.js`, `60-changelog.js` (they're on different pages; they may run in parallel within the rate limit).
- [ ] **Step 2: Look.** `get_screenshot` of the Icons column (first two cards), the Cover frame, the Construction row and the Changelog column. Check: names truncate cleanly; cover text centred, fade direction (opaque at the top of the wall, clear at the bottom — if reversed, flip the gradient stops), highlights blue; construction icons sit on the keylines; changelog text not clipped. Fix in `scripts/figma/pages.ts` and re-run only the affected script. Commit fixes as `fix(figma): …`.
- [ ] **Step 3: Re-sync check (Review Focus 1).** Record all 157 set ids and 471 variant ids (read-only `use_figma` on the Components page returning `{ name: [setId, ...variantIds] }`). Run all `10-components-*` scripts and `20-deprecated` again. Re-read the ids and compare: identical, and still 157 sets and 471 variants. Record the result in the ledger.
- [ ] **Step 4: Instances survive.** On the Icons page, read one instance's `mainComponent.id` before and after the re-sync: unchanged.
- [ ] **Step 5:** Commit any fixes; hand the file to Lucas with its URL for review.

---

### Task 7: How a sync runs (docs)

**Files:**
- Create: `figma/README.md`
- Modify: `RELEASE.md`

- [ ] **Step 1: Write `figma/README.md`**

````markdown
# The Merki Figma file

The file is built from the repo, one way: repo → Figma. Nobody edits it by hand.

- File: see `file.json` (Lucas Lima Design team, Professional).
- Spec: `docs/specs/2026-10-10-merki-design.md` §7.

## Running a sync

Claude runs it through the Figma connection (MCP `use_figma`). Steps:

1. `npm run figma:scripts` — builds the icons and writes the scripts to `figma/out/` (git-ignored), in order, with `manifest.json`.
2. Load the `figma:figma-use` skill. Then run each script in `manifest.json` order through `use_figma` with the `fileKey` from `file.json`, passing the file's content as `code` and `skillNames: "figma-use"`. Stay under 15 calls a minute.
   - `00-setup` — pages and the `icon` variable.
   - `10-components-*` — one category each; updates sets in place.
   - `20-deprecated` — moves sets the repo no longer has to "Deprecated".
   - `30-icons`, `40-cover`, `50-construction`, `60-changelog` — presentation pages, rebuilt from the data.
3. Check: counts on the Components page (sets = icons, variants = icons × 3), screenshots of each page.
4. Lucas publishes the team library and the Community update.

Never delete a component set or variant by hand: other files' instances point at them.
````

- [ ] **Step 2:** In `RELEASE.md`, change the Figma line to: `- [ ] Figma sync run by Claude (see figma/README.md) and checked; Lucas publishes the team library and the Community update.`

- [ ] **Step 3: Commit**

```bash
git add figma/README.md RELEASE.md
git commit -m "docs(figma): how a sync runs"
```
