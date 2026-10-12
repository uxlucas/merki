# Merki: The Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw the remaining 129 icons of the 145-icon v1 set in ten category batches. Each batch is reviewed by Lucas in `/lab`. Before the batches start, three small tooling upgrades make batch review workable: a category filter and side panel in `/lab`, a PNG contact sheet the drawer can look at, and a manifest that tracks what's left.

**Architecture:** Same pipeline as the foundation. Icons live in `icons/` as `name.svg` + `name.json`. The linter enforces the rules, the build generates the `merki-icons` package, and `/lab` is the review surface. New pieces:
- `icons/_set.json` is the manifest: the spec §3 list, category → names.
- `scripts/sheet.ts` renders a batch to a PNG with @resvg/resvg-js, so the drawer can check its own work by eye before Lucas sees it.
- `/lab` gets category chips and a sticky side panel for compare and review.

**Tech Stack:** As in the foundation plan (Node ≥ 22, npm workspaces, TypeScript 5.9, vitest 3, React 19, Vite 7), plus `@resvg/resvg-js@2.6.2`.

**Spec:** `docs/specs/2026-10-10-merki-design.md`. Read §2 (icon rules) and §3 (the set) before drawing. Also read the foundation plan's Global Constraints (`docs/plans/2026-10-10-merki-foundation.md`), which still bind. Follow-ups from the foundation are in `docs/plans/2026-10-10-merki-foundation-followups.md`; this plan picks up the "Before batch 2" items.

## Global Constraints

- All foundation constraints hold, as amended there:
  - `xmlns` is required on the root.
  - Names must start with a letter: `/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/`.
  - Stroke width is locked at 1.5.
  - The npm package is `merki-icons`, not `merki`.
- Root element of every icon, exactly: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`
- Anchors on the 0.25 grid. Handles at most 2 decimals. Ink stays within 1–15 including the 0.75 half-stroke. Allowed elements are path, circle, rect, line. Allowed attributes on path, circle, rect and line include `stroke-width (1.25 only)`, for interior detail lines on stroked shapes (decided 2026-10-12). Colors are only `currentColor` or `none`. `opacity="0.3"` is allowed on path, circle and rect, only on solid shapes (fill currentColor, stroke none), for inactive states such as priority bars (decided 2026-10-11). No transforms, masks, groups or ids.
- Categories (exact ids): `navigation, actions, status, people, objects, data, communication, system, text, billing`.
- **Never trace or reuse paths from Linear, Lucide, Heroicons, Phosphor or any other set.** Draw from the construction notes and the shared parts below.
- **Never run Python** (`python`, `python3`) for edits or checks. Use node/tsx or the Edit tool. A stuck python3 stdin helper blocked Lucas's machine for hours. Before reporting, make sure no process you started is still running.
- A batch is not "done" until every icon in it is `ok` in `icons/_review.json`. The next batch does not start before that.

### Drawing guidance (Lucas's review of batch 1, 2026-10-10)

- **Clear negative space at 16px.** Interior gaps must be at least 1px of clear space after stroke (2.5px between stroke centerlines). Batch 1 notes that drove this: the home door was too narrow, the link gap too tight, the tag hole too small, and the trash handle merged with the lid.
- **Rounded ends.** Line ends are round (the cap does this). Cut-outs in solids get rounded ends too: arc caps of radius 0.75 (see `circle-x`).
- **Soft over sharp.** Prefer curves and rounded joins to hard corners. Gears and badges should be scalloped, not blocky (see `settings`).
- **Marks must read as what they are at 16px.** A 3px arrow reads as a dot. Modifier marks need about 4.5px length and 2px heads (see `user-arrow`).
- **Partial outlines end with intent** (actions review). When a shape is partly hidden behind another (copy's back square, stacked bubbles), its visible part ends at the hidden shape's corner arcs, curling toward the front shape with ≥1px clear. Never a straight stub hanging in space.
- **Arrowheads: the tip is the end of the stroke, and the legs trail behind it** (actions review). On straight arrows, the legs sit symmetric about the shaft (see `arrow-right`). On curved arrows (refresh, sync, undo, history), the curve must turn into a short straight 45° segment before the tip, and the head is the axis-aligned L at that tip, legs trailing up/left or down/right (see `refresh`). Never end a head on a still-curving stroke: the inner leg collides with the curve and reads as a hook or a bump. Never point legs forward.
- **"Simplify" means fewer parts** (actions review). Name the parts first (pin: head, neck, flange, point), give each one clear shape, and use no overlapping or crossing strokes. One outline plus one line beats several overlapping shapes.
- **Check against the references before reporting.** Compare every icon with how the approved ones handle the same problem: corners, ends, heads, partial shapes. If it looks odd at 4×, it is odd. Fix it before Lucas sees it.
- **One solid element per icon, with a reason.** Solid shapes are for people's heads, header bands, markers, solid states and data bars.

### Shared parts (centerline coordinates; reuse them so the set stays consistent)

| part | geometry |
|---|---|
| circle frame | `<circle cx="8" cy="8" r="6"/>` (outline status icons) |
| solid circle | path `M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 1 1 0-12.5Z` with evenodd cut-outs (see `circle-x`) |
| square frame | `<rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/>` |
| document | `M9.25 1.75H4.5A1.5 1.5 0 0 0 3 3.25v9.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5V5.5Z` plus fold `M9.25 1.75V4.5a1 1 0 0 0 1 1H13` |
| chevron (right) | `M6.25 4.5 9.75 8l-3.5 3.5`, rotated by swapping axes for up/down/left |
| arrow (right) | shaft `M3 8h10`, head `M9 4l4 4-4 4`. Other directions are the same geometry turned |
| plus | `M8 3v10M3 8h10` (modifier size: 4.5 long, centered in the 9–15 zone) |
| x | `M4 4l8 8M12 4 4 12` |
| check | `M3.5 8.5 6.5 11.5 12.5 4.5` |
| person | solid head `<circle cx="8" cy="4.75" r="2.75" fill="currentColor" stroke="none"/>` + shoulders `M3 13.25c.45-2.3 2.45-3.75 5-3.75s4.55 1.45 5 3.75` (from `user`) |
| modifier zone | bottom-right 6×6 (x,y 9–15). The base glyph leaves 1px of clear space around the mark |

## Review Focus

1. **A batch drawn without looking.** The drawer must render `npm run sheet -- <category>` and look at the PNG before reporting. Expected: the report attaches the sheet path and names anything that looked off at 16. [Every batch task, Step 3]
2. **A partial batch reaching Lucas.** Expected: `npm run coverage -- <category>` prints `0 missing` before the batch goes to review. [Task 3: `coverage lists missing icons per category`; every batch task, Step 4]
3. **An icon that lints clean but draws nothing**, for example a circle without `r` or a rect without `width`. Expected: rule `parse` names the missing attribute. [Task 3: `reports shapes with missing or non-positive size`]
4. **Two names that make the same React export** (`x-1` and `x1` both become `X1Icon`). Expected: lint fails, naming both icons. [Task 3: `reports two icons that generate the same component name`]
5. **Reviewing one category among 145 icons.** Expected: `/lab` filters to the chosen category, and the review panel stays visible while scrolling. [Task 1: `filters every section by category`, `keeps compare and review in a side panel`]

---

## File map

```
icons/_set.json                       manifest: the spec §3 list (category → names)
scripts/lib/manifest.ts               readManifest, missingIcons, manifestViolations
scripts/coverage.ts                   CLI: npm run coverage [-- <category>]
scripts/lib/sheet.ts                  renderSheet(icons, opts) → PNG Buffer
scripts/sheet.ts                      CLI: npm run sheet -- <category|name,name>
scripts/lib/rules.ts                  + size checks
scripts/lib/lint-all.ts               + collision + manifest checks
site/src/lab/Lab.tsx                  + category chips, side-panel layout
site/src/lab/CategoryChips.tsx        new
site/src/lab/lab.css                  + .lab-body grid, sticky aside
site/lab-plugin.ts                    watcher reloads only on .svg/.json
vitest.config.ts                      + setupFiles for Testing Library timeout
site/src/test-setup.ts                new
sheets/                               generated PNGs (git-ignored)
```

---

### Task 1: `/lab` for batch review

**Files:**
- Create: `site/src/lab/CategoryChips.tsx`, `site/src/test-setup.ts`
- Modify: `site/src/lab/Lab.tsx`, `site/src/lab/lab.css`, `site/lab-plugin.ts`, `vitest.config.ts`
- Test: `site/src/lab/Lab.test.tsx`

**Interfaces:**
- Consumes: `LabIcon` (`site/src/lab/types.ts`), the existing `Lab` props `{ icons, fetchImpl? }`.
- Produces: `CategoryChips({ categories, selected, counts, onSelect }: { categories: string[]; selected: string | null; counts: Record<string, number>; onSelect: (c: string | null) => void })`. `Lab` keeps its props.

- [ ] **Step 1: Harden the test timing.** This is the follow-up from the unidentified flake.

`site/src/test-setup.ts`:
```ts
import { configure } from '@testing-library/react';

// /lab tests wait on async fetch state; 1s flaked once while the dev server was busy.
configure({ asyncUtilTimeout: 3000 });
```
In `vitest.config.ts`, add `setupFiles: ['site/src/test-setup.ts']` inside `test`.

- [ ] **Step 2: Write the failing tests** (append to `site/src/lab/Lab.test.tsx`, reusing its `ICONS`, `icon` and `reply` helpers)

```tsx
  it('filters every section by category', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'objects 1' }));

    expect(screen.getAllByRole('button', { name: / at 16px$/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'calendar at 16px' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'home at 16px' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'All 4' }));
    expect(screen.getAllByRole('button', { name: / at 16px$/ })).toHaveLength(4);
  });

  it('keeps compare and review in a side panel', async () => {
    const { container } = render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const aside = container.querySelector('aside.lab-aside');
    expect(aside).not.toBeNull();
    expect(aside!.querySelector('[aria-label="Compare home"]')).not.toBeNull();
    expect(aside!.querySelector('[aria-label="Review home"]')).not.toBeNull();
  });

  it('compares against the whole set even when filtered', async () => {
    render(<Lab icons={ICONS} fetchImpl={vi.fn(async () => reply({})) as unknown as typeof fetch} />);

    fireEvent.click(screen.getByRole('button', { name: 'navigation 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'home at 16px' }));

    const compare = screen.getByRole('region', { name: 'Compare home' });
    expect(within(compare).getAllByText('calendar')).toHaveLength(2);
  });
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run site/src/lab/Lab.test.tsx`
Expected: the 3 new tests FAIL (no chip buttons, no `aside.lab-aside`). The existing 9 pass.

- [ ] **Step 4: Implement**

`site/src/lab/CategoryChips.tsx`:
```tsx
interface Props {
  categories: string[];
  selected: string | null;
  counts: Record<string, number>;
  onSelect: (category: string | null) => void;
}

export function CategoryChips({ categories, selected, counts, onSelect }: Props) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <nav className="chips" aria-label="Categories">
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)}>
        All <span>{total}</span>
      </button>
      {categories.map((category) => (
        <button key={category} type="button" aria-pressed={selected === category} onClick={() => onSelect(category)}>
          {category} <span>{counts[category]}</span>
        </button>
      ))}
    </nav>
  );
}
```

In `site/src/lab/Lab.tsx`:
- Add state `const [category, setCategory] = useState<string | null>(null);`
- Derive `counts` from `icons` (key `icon.meta?.category ?? 'uncategorized'`) and `categories = Object.keys(counts).sort()`.
- Derive `visible = category === null ? icons : icons.filter((i) => (i.meta?.category ?? 'uncategorized') === category)`.
- Render `<CategoryChips …/>` under the header.
- Replace the body with:
```tsx
<div className="lab-body">
  <main className="lab-main">
    <Ladder icons={visible} selected={selected} reviews={reviews} onSelect={setSelected} />
    <GridView icons={visible} onSelect={setSelected} />
    <MenuMock icons={visible} />
  </main>
  {target && (
    <aside className="lab-aside">
      <Compare target={target} icons={icons} />
      <ReviewPanel name={target.name} entry={reviews[target.name]} review={review} onSave={saveReview} />
    </aside>
  )}
</div>
```
`Compare` keeps the full `icons` list, so references from other categories still show. Remove the old `.focus` wrapper.

In `site/src/lab/lab.css`, add the following, and delete the `.focus` rules and the `.focus` part of the media query:
```css
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: -8px 0 20px; }
.lab .chips button { font-size: 12px; padding: 3px 9px; }
.lab .chips button span { color: var(--muted); font-variant-numeric: tabular-nums; margin-left: 2px; }
.lab .chips button[aria-pressed='true'] { background: var(--fg); color: var(--bg); border-color: var(--fg); }
.lab .chips button[aria-pressed='true'] span { color: inherit; opacity: 0.7; }

.lab-body { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
.lab-body:not(:has(.lab-aside)) { grid-template-columns: minmax(0, 1fr); }
.lab-aside { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; }

@media (max-width: 900px) {
  .lab-body { grid-template-columns: minmax(0, 1fr); }
  .lab-aside { position: static; max-height: none; order: -1; }
}
```

In `site/lab-plugin.ts`, extend `isIconFile` so it also requires the basename to end in `.svg` or `.json`, which stops editor swap files from triggering reloads.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run site` then `npm run typecheck`
Expected: all pass, with no React warnings.

- [ ] **Step 6: Commit**

```bash
git add site vitest.config.ts
git commit -m "feat: /lab category filter and side panel for batch review" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Contact sheet renderer

**Files:**
- Create: `scripts/lib/sheet.ts`, `scripts/sheet.ts`
- Modify: `package.json` (dependency + `sheet` script), `.gitignore` (`sheets/`)
- Test: `scripts/__tests__/sheet.test.ts`

**Interfaces:**
- Consumes: `lintAll` is not used here. The sheet must render icons that still fail lint, so it reads files directly with `loadIcons` (Task 1 of the foundation).
- Produces: `interface SheetIcon { name: string; svg: string }` and `renderSheet(icons: SheetIcon[]): Buffer` (PNG). Layout: one row per icon with the name, the icon at 16, 20 and 24 at 1×, the 16px version at 4× (64px) on a grid with the 1px padding and keylines, plus a dark-mode 16px swatch.

- [ ] **Step 1: Install**

Run: `npm install -D @resvg/resvg-js@2.6.2`
Add `sheets/` to `.gitignore`.

- [ ] **Step 2: Write the failing test**

`scripts/__tests__/sheet.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { renderSheet } from '../lib/sheet.js';
import { HOME_SVG, SEARCH_SVG } from './fixtures.js';

const pngSize = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

describe('renderSheet', () => {
  it('renders a PNG with one row per icon', () => {
    const one = renderSheet([{ name: 'home', svg: HOME_SVG }]);
    const two = renderSheet([{ name: 'home', svg: HOME_SVG }, { name: 'search', svg: SEARCH_SVG }]);

    expect(one.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(pngSize(one).width).toBe(pngSize(two).width);
    expect(pngSize(two).height).toBeGreaterThan(pngSize(one).height);
  });

  it('renders icons that would fail lint instead of throwing', () => {
    const broken = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2.1 2h4"/></svg>';
    expect(() => renderSheet([{ name: 'broken', svg: broken }])).not.toThrow();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run scripts/__tests__/sheet.test.ts`
Expected: FAIL, cannot find `../lib/sheet.js`.

- [ ] **Step 4: Implement `scripts/lib/sheet.ts`**

```ts
import { Resvg } from '@resvg/resvg-js';

export interface SheetIcon {
  name: string;
  svg: string;
}

const ROW = 84;
const WIDTH = 420;
const INK = '#18181b';

const inner = (svg: string): string =>
  svg.replace(/^﻿/, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const glyph = (body: string, x: number, y: number, size: number, color = INK): string =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" ` +
  `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="${color}">${body}</svg>`;

// Grid, 1px padding and keylines at 4× (64px), matching /lab's overlay.
const guides = (x: number, y: number): string => {
  const lines = Array.from({ length: 15 }, (_, i) => i + 1)
    .map((i) => `<line x1="${i}" y1="0" x2="${i}" y2="16"/><line x1="0" y1="${i}" x2="16" y2="${i}"/>`)
    .join('');
  return (
    `<svg x="${x}" y="${y}" width="64" height="64" viewBox="0 0 16 16" fill="none">` +
    `<rect width="16" height="16" fill="#ffffff"/>` +
    `<g stroke="#ececef" stroke-width="0.06">${lines}</g>` +
    `<rect x="1" y="1" width="14" height="14" stroke="#e11d74" stroke-opacity="0.4" stroke-width="0.06" stroke-dasharray="0.25 0.25"/>` +
    `<g stroke="#3b82f6" stroke-opacity="0.35" stroke-width="0.06">` +
    `<circle cx="8" cy="8" r="6"/><rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/>` +
    `<rect x="3" y="1.75" width="10" height="12.5" rx="2"/><rect x="1.75" y="3" width="12.5" height="10" rx="2"/></g></svg>`
  );
};

export function renderSheet(icons: SheetIcon[]): Buffer {
  const rows = icons
    .map((icon, i) => {
      const y = i * ROW + 10;
      const body = inner(icon.svg);
      return (
        `<text x="12" y="${y + 36}" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#3f3f46">${icon.name}</text>` +
        glyph(body, 130, y + 24, 16) +
        glyph(body, 158, y + 22, 20) +
        glyph(body, 190, y + 20, 24) +
        guides(232, y) +
        glyph(body, 232, y, 64) +
        `<rect x="312" y="${y + 16}" width="40" height="32" rx="6" fill="#18181b"/>` +
        glyph(body, 324, y + 24, 16, '#ececef')
      );
    })
    .join('');
  const height = icons.length * ROW + 10;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">` +
    `<rect width="100%" height="100%" fill="#fafafa"/>${rows}</svg>`;
  return new Resvg(sheet, { font: { loadSystemFonts: true }, fitTo: { mode: 'zoom', value: 2 } }).render().asPng();
}
```

`scripts/sheet.ts`:
```ts
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from './lib/categories.js';
import { loadIcons } from './lib/load.js';
import { renderSheet } from './lib/sheet.js';

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const arg = process.argv[2];
if (!arg) {
  console.error('usage: npm run sheet -- <category | name,name,...>');
  process.exit(1);
}

const { icons } = await loadIcons(at('../icons'));
const wanted = (CATEGORIES as readonly string[]).includes(arg)
  ? icons.filter((i) => i.metaJson !== null && JSON.parse(i.metaJson).category === arg)
  : icons.filter((i) => arg.split(',').includes(i.name));
if (wanted.length === 0) {
  console.error(`no icons match "${arg}"`);
  process.exit(1);
}

await mkdir(at('../sheets'), { recursive: true });
const out = at(`../sheets/${arg.replace(/[^a-z0-9-]+/g, '_')}.png`);
await writeFile(out, renderSheet(wanted.map((i) => ({ name: i.name, svg: i.svg }))));
console.log(`${wanted.length} icons → ${out}`);
```

In `package.json` `"scripts"`, add `"sheet": "tsx scripts/sheet.ts",`.

- [ ] **Step 5: Run the tests, then render one sheet and look at it**

Run: `npx vitest run scripts/__tests__/sheet.test.ts`
Expected: PASS (2).

Run: `npm run sheet -- people`, then open `sheets/people.png` with the Read tool.
Expected: `user` and `user-arrow`, each at 16, 20 and 24, plus the 4× grid view with keylines and the dark swatch. Names are readable.

- [ ] **Step 6: Commit**

```bash
git add scripts package.json package-lock.json .gitignore
git commit -m "feat: PNG contact sheets for self-review" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Manifest, coverage and linter hardening

**Files:**
- Create: `icons/_set.json`, `scripts/lib/manifest.ts`, `scripts/coverage.ts`
- Modify: `scripts/lib/rules.ts`, `scripts/lib/lint-all.ts`, `package.json` (`coverage` script)
- Test: `scripts/__tests__/manifest.test.ts`, `scripts/__tests__/rules.test.ts`, `scripts/__tests__/lint-all.test.ts`

**Interfaces:**
- Consumes: `lintAll`, `Violation`, `RuleId`, `componentName` (`scripts/lib/react.ts`), `CATEGORIES`.
- Produces:
  - `type Manifest = Record<Category, string[]>`
  - `readManifest(dir: string): Promise<Manifest>`
  - `missingIcons(manifest: Manifest, present: string[], category?: Category): string[]`
  - `manifestViolations(manifest: Manifest, icons: { name: string; category: Category }[]): Violation[]`, using the new rule id `'manifest'`
  - New `RuleId` members `'manifest'` and `'collision'`.

- [ ] **Step 1: Write the manifest**

`icons/_set.json`, copied from spec §3, 145 names:
```json
{
  "navigation": ["home", "inbox", "search", "menu", "sidebar", "layout-grid", "layout-list", "chevron-up", "chevron-down", "chevron-left", "chevron-right", "chevrons-up-down", "arrow-up", "arrow-down", "arrow-left", "arrow-right", "arrow-up-right", "arrow-left-right", "more-horizontal", "more-vertical"],
  "actions": ["plus", "minus", "x", "check", "pencil", "square-pen", "trash", "copy", "undo", "redo", "refresh", "download", "upload", "share", "link", "filter", "sort", "expand", "collapse", "archive", "pin", "star", "bookmark", "send"],
  "status": ["circle-check", "circle-x", "circle-alert", "triangle-alert", "info", "help", "ban", "status-dashed", "status-empty", "status-half", "loader", "clock", "history", "bell", "bell-off", "eye", "eye-off", "lock", "unlock"],
  "people": ["user", "users", "user-circle", "user-plus", "user-check", "user-arrow", "building", "log-in", "log-out", "shield", "key"],
  "objects": ["calendar", "tag", "flag", "folder", "folder-open", "file", "file-text", "file-plus", "book", "image", "paperclip", "package", "layers", "briefcase", "target", "diamond"],
  "data": ["bar-chart", "line-chart", "pie-chart", "trending-up", "trending-down", "activity", "table", "database", "kanban", "gauge", "priority-low", "priority-medium", "priority-high"],
  "communication": ["mail", "message", "messages", "at-sign", "phone", "video", "megaphone", "smile", "thumbs-up"],
  "system": ["settings", "sliders", "toggle", "palette", "sun", "moon", "monitor", "smartphone", "globe", "plug", "zap", "workflow", "command", "keyboard", "sparkle", "code", "terminal", "git-branch"],
  "text": ["type", "bold", "italic", "underline", "strikethrough", "list-bullet", "list-ordered", "square-check", "quote", "hash", "align-left"],
  "billing": ["credit-card", "receipt", "wallet", "circle-dollar"]
}
```

- [ ] **Step 2: Write the failing tests**

`scripts/__tests__/manifest.test.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { manifestViolations, missingIcons, readManifest, type Manifest } from '../lib/manifest.js';

const small = { navigation: ['home', 'search'], objects: ['calendar'] } as unknown as Manifest;

describe('manifest', () => {
  it('the real manifest lists 145 unique names across the ten categories', async () => {
    const manifest = await readManifest(fileURLToPath(new URL('../../icons', import.meta.url)));
    const names = Object.values(manifest).flat();
    expect(names).toHaveLength(145);
    expect(new Set(names).size).toBe(145);
    expect(Object.keys(manifest).sort()).toEqual(
      ['actions', 'billing', 'communication', 'data', 'navigation', 'objects', 'people', 'status', 'system', 'text'],
    );
  });

  it('coverage lists missing icons per category', () => {
    expect(missingIcons(small, ['home'])).toEqual(['calendar', 'search']);
    expect(missingIcons(small, ['home'], 'navigation' as never)).toEqual(['search']);
    expect(missingIcons(small, ['home', 'search', 'calendar'])).toEqual([]);
  });

  it('flags icons that are not in the manifest or sit in the wrong category', () => {
    const violations = manifestViolations(small, [
      { name: 'home', category: 'navigation' as never },
      { name: 'calendar', category: 'navigation' as never },
      { name: 'rocket', category: 'objects' as never },
    ]);
    expect(violations.map((v) => `${v.icon}:${v.rule}`)).toEqual(['calendar:manifest', 'rocket:manifest']);
  });
});
```

Append to `scripts/__tests__/rules.test.ts` inside `describe('lintSvg', …)`:
```ts
  it('reports shapes with missing or non-positive size', async () => {
    expect(rules(await lint('<circle cx="8" cy="8"/>'))).toEqual(['parse']);
    expect(rules(await lint('<circle cx="8" cy="8" r="0"/>'))).toEqual(['parse']);
    expect(rules(await lint('<rect x="2" y="2" height="4"/>'))).toEqual(['parse']);
    expect(rules(await lint('<rect x="2" y="2" width="-4" height="4"/>'))).toEqual(['parse']);
    expect((await lint('<circle cx="8" cy="8"/>'))[0].detail).toMatch(/needs r/);
  });
```

Append to `scripts/__tests__/lint-all.test.ts` inside `describe('lintAll', …)`:
```ts
  it('reports two icons that generate the same component name', async () => {
    await writeFile(join(dir, 'arrow-2.svg'), HOME_SVG);
    await writeFile(join(dir, 'arrow-2.json'), meta('navigation'));
    await writeFile(join(dir, 'arrow2.svg'), HOME_SVG);
    await writeFile(join(dir, 'arrow2.json'), meta('navigation'));

    const { icons, violations } = await lintAll(dir);

    expect(violations.map((v) => `${v.icon}:${v.rule}`)).toEqual(['arrow-2:collision', 'arrow2:collision']);
    expect(violations[0].detail).toMatch(/Arrow2Icon/);
    expect(icons).toEqual([]);
  });
```
(This temp dir has no `_set.json`. `lintAll` must skip the manifest check when the file is absent. See Step 4.)

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run scripts/__tests__/manifest.test.ts scripts/__tests__/rules.test.ts scripts/__tests__/lint-all.test.ts`
Expected: the manifest suite FAILS (module missing), and the two new rules and lint-all tests FAIL. Existing tests pass.

- [ ] **Step 4: Implement**

`scripts/lib/manifest.ts`:
```ts
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Category } from './categories.js';
import type { Violation } from './rules.js';

export type Manifest = Record<Category, string[]>;

export async function readManifest(dir: string): Promise<Manifest> {
  return JSON.parse(await readFile(join(dir, '_set.json'), 'utf8')) as Manifest;
}

export async function readManifestIfPresent(dir: string): Promise<Manifest | null> {
  return existsSync(join(dir, '_set.json')) ? readManifest(dir) : null;
}

export function missingIcons(manifest: Manifest, present: string[], category?: Category): string[] {
  const have = new Set(present);
  const wanted = category ? (manifest[category] ?? []) : Object.values(manifest).flat();
  return wanted.filter((name) => !have.has(name)).sort();
}

export function manifestViolations(manifest: Manifest, icons: { name: string; category: Category }[]): Violation[] {
  const home = new Map<string, string>();
  for (const [category, names] of Object.entries(manifest)) for (const name of names) home.set(name, category);
  return icons
    .filter((icon) => home.get(icon.name) !== icon.category)
    .map((icon) => ({
      icon: icon.name,
      rule: 'manifest' as const,
      detail: home.has(icon.name)
        ? `category is "${icon.category}" but icons/_set.json lists it under "${home.get(icon.name)}"`
        : 'not in icons/_set.json; add it there first (the set is curated)',
    }))
    .sort((a, b) => a.icon.localeCompare(b.icon));
}
```

In `scripts/lib/rules.ts`:
- Add `'manifest' | 'collision'` to `RuleId`.
- Inside the per-element geometry `try`, before computing the values, check required sizes. A circle needs `r > 0`; a rect needs `width > 0` and `height > 0`. If an attribute is missing, throw `new Error(`<${tag}> needs ${key}`)`. If it is ≤ 0, throw `new Error(`<${tag}> ${key} must be positive`)`. The existing catch reports both as rule `parse`.

In `scripts/lib/lint-all.ts`, after the per-icon loop and before returning:
1. **Collisions:** group the clean and dirty icon names by `componentName(name)`. For every group with more than one name, add a `collision` violation per name, with detail `"<a>" and "<b>" both generate <Component>`. Remove those names from the clean list.
2. **Manifest:** `const manifest = await readManifestIfPresent(dir)`. If present, add `manifestViolations(manifest, clean.map((i) => ({ name: i.name, category: i.meta.category })))`, and remove flagged names from the clean list.

`scripts/coverage.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { CATEGORIES, type Category } from './lib/categories.js';
import { loadIcons } from './lib/load.js';
import { missingIcons, readManifest } from './lib/manifest.js';

const dir = fileURLToPath(new URL('../icons', import.meta.url));
const arg = process.argv[2] as Category | undefined;
if (arg && !(CATEGORIES as readonly string[]).includes(arg)) {
  console.error(`unknown category "${arg}"; one of: ${CATEGORIES.join(', ')}`);
  process.exit(1);
}
const manifest = await readManifest(dir);
const { icons } = await loadIcons(dir);
const missing = missingIcons(manifest, icons.map((i) => i.name), arg);
const total = arg ? manifest[arg].length : Object.values(manifest).flat().length;
console.log(`${total - missing.length}/${total} drawn${arg ? ` in ${arg}` : ''}, ${missing.length} missing`);
if (missing.length) console.log(missing.join('\n'));
```
In `package.json` `"scripts"`, add `"coverage": "tsx scripts/coverage.ts",`.

- [ ] **Step 5: Run everything**

Run: `npm test`, `npm run lint:icons`, `npm run coverage`
Expected: all tests pass. Lint reports `16 icons pass.` (all 16 are in the manifest under the right categories). Coverage prints `16/145 drawn, 129 missing` and lists them.

- [ ] **Step 6: Commit**

```bash
git add icons/_set.json scripts package.json
git commit -m "feat: icon manifest, coverage report, size and collision checks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Batch tasks (4–13)

Every batch task follows the same steps. The task text lists only what differs: the icons, their construction notes and their metadata.

**Batch steps (apply to each of Tasks 4–13):**

- [ ] **Step 1: Draw.** Write `icons/<name>.svg` for every icon in the batch. Use the exact root element from Global Constraints and the construction notes in the table, reusing the shared parts verbatim where named. Construction notes give intent and the key coordinates. You may adjust any coordinate that isn't specified, as long as the rules hold and the result reads well at 16px.
- [ ] **Step 2: Metadata.** Write `icons/<name>.json` as `{"category":"<batch category>","tags":[…],"aliases":[…]}` with the tags and aliases from the table.
- [ ] **Step 3: Look at it.** Run `npm run lint:icons` (it must pass), then `npm run sheet -- <category>`, then open `sheets/<category>.png` with the Read tool. Check every icon against the Drawing guidance:
  - interior gaps ≥ 1px clear
  - marks readable at 16
  - nothing heavier or lighter than `calendar`, `search` and `user`
  
  Fix and re-render until you would sign it off yourself. In the report, list what you changed after looking.
- [ ] **Step 4: Verify.** `npm run coverage -- <category>` prints `0 missing`. `npm run build`, `npm run typecheck` and `npm test` all pass.
- [ ] **Step 5: Commit.** `git add icons && git commit -m "feat: <category> icons" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`
- [ ] **Step 6: Review gate (Lucas).** Lucas filters `/lab` to the category and marks each icon. The batch is done when every icon in it is `ok` in `icons/_review.json`.
- [ ] **Step 7: Apply notes.** For every `needs-work` entry in this category, change the SVG as the note asks, re-run Steps 3–4, and commit `fix: <category> review notes`. Repeat Steps 6–7 until the batch is all `ok`, then commit `icons/_review.json` with `chore: <category> signed off`.

---

### Task 4: navigation (17)

| icon | construction | tags · aliases |
|---|---|---|
| menu | three lines `M2.75 4h10.5M2.75 8h10.5M2.75 12h10.5` | hamburger, navigation · hamburger |
| sidebar | square frame + vertical divider `M6.25 2.25v11.5`; the left panel as a solid band (`fill` between x 2.25–6.25, rounded outer corners) like calendar's header | panel, layout · panel-left |
| layout-grid | four rounded squares 4.75 × 4.75 rx 1.25 at (2.25,2.25), (9,2.25), (2.25,9), (9,9) | grid, tiles, apps · apps |
| layout-list | three rows: small rounded square 2.5 × 2.5 rx .75 at x 2.25 + line `h7` from x 7.25, at y 3, 8, 13 (centers) | list, rows · rows |
| chevron-up/down/left/right | the chevron part, turned | caret, expand, collapse · caret-* |
| chevrons-up-down | two small chevrons `M5 6.25 8 3.25l3 3M5 9.75l3 3 3-3` | select, sort, combobox · selector |
| arrow-up/down/left/right | the arrow part, turned | direction · move-* |
| arrow-up-right | `M4.5 11.5 11.5 4.5M5.5 4.5h6v6` | external, open, link-out · external-link |
| arrow-left-right | upper arrow pointing right `M2.75 5.25h10.5M10.5 2.5l2.75 2.75L10.5 8` and lower arrow pointing left `M13.25 10.75H2.75M5.5 8l-2.75 2.75L5.5 13.5` | swap, transfer, transactions · swap |
| more-horizontal | three solid dots `<circle r="1.25" fill="currentColor" stroke="none"/>` at x 3.5, 8, 12.5 on y 8 | ellipsis, options, overflow · ellipsis |
| more-vertical | same dots on x 8 at y 3.5, 8, 12.5 | kebab, options · kebab |

### Task 5: actions (22)

| icon | construction | tags · aliases |
|---|---|---|
| plus | plus part | add, new, create · add |
| minus | `M3 8h10` | remove, subtract · subtract |
| x | x part | close, cancel, dismiss · close |
| check | check part | done, confirm, ok · tick |
| pencil | 45° pencil: a 2.5-wide band from the tip near (2.75,13.25) to a rounded cap near (12.5,3.5) (cap arcs r 1.75), plus a short ferrule line across the band near the cap. Tip joins round | edit, write · edit |
| square-pen | square frame opened at the top right (`M7.5 2.25H4.25a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h7.5a2 2 0 0 0 2-2V8.5`) + a smaller pencil reaching into the gap | compose, new, edit · compose |
| copy | back rounded square (top-left, 8.5 × 8.5) drawn only where it isn't covered, front rounded square 8.5 × 8.5 rx 1.5 at (5.25,5.25) | duplicate, clone · duplicate |
| undo | arrow head `M5.25 3 2.75 5.5 5.25 8` + path `M2.75 5.5h6.5a3.75 3.75 0 0 1 0 7.5H6.5` | revert, back · revert |
| redo | mirror of undo | forward · repeat |
| refresh | two arcs of a circle r 5.25 with small heads at the ends (sync-style), gaps at 1 and 7 o'clock | reload, sync · sync |
| download | arrow down `M8 2.25v8M4.75 7 8 10.25 11.25 7` + tray `M2.75 10.5v1.75a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5V10.5` | save, export · export |
| upload | arrow up from the same tray | import · import |
| share | square frame open at the top + arrow up out of it (iOS-share style) | send, export · export-share |
| filter | three centered lines of decreasing length `M2.75 4.25h10.5M4.75 8h6.5M6.75 11.75h2.5` | funnel, refine · refine |
| sort | two arrows: down at x 5 (`M5 3v10M2.75 10.75 5 13l2.25-2.25`), up at x 11 | order, arrange · arrange |
| expand | two diagonal corner arrows pointing out (top-right and bottom-left), heads 3 × 3 | maximize, fullscreen · maximize |
| collapse | the same corners pointing in | minimize · minimize |
| archive | box lid as a solid rounded band (2.25–13.75 × 2.5–5.5) + body outline below + slot line `M6.5 8.5h3` | box, store · store |
| pin | pushpin at 45°: head as a rounded diamond, needle to the bottom-left `M2.75 13.25 6 10` | pin, attach · pushpin |
| star | five-point star with rounded joins, outer radius 6, inner 2.75, centered at (8,8.25) | favorite, rate · favorite |
| bookmark | portrait rect with notch bottom `M4 2.75h8v10.75L8 10.75 4 13.5Z` (rounded top corners r 1) | save, saved · saved |
| send | paper plane: `M14 2 2 7l5 2 2 5Z` + inner fold `M7 9l7-7` | submit, paper-plane · paper-plane |

### Task 6: status (16)

| icon | construction | tags · aliases |
|---|---|---|
| circle-check | solid circle + rounded check cut-out (evenodd; rounded ends like circle-x) | done, complete, success · done |
| circle-alert | circle frame + `M8 4.75v3.75` + dot `<circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/>` | warning, error, attention · alert |
| triangle-alert | rounded triangle (apex (8,2.25), base y 13.5, x 1.75–14.25, joins round) + same bang, scaled | warning, caution · warning |
| info | circle frame + dot at (8,5) + stem `M8 7.5v3.75` | about, details · about |
| help | circle frame + question hook: arc r 2 from (6,6.25) over the top to about (9.5,7.5), curving back down to (8,9) and ending at (8,9.25) + solid dot r 1 at (8,11.5) | question, support · question |
| ban | circle frame + diagonal `M3.75 3.75l8.5 8.5` | blocked, cancelled, forbidden · cancelled |
| status-empty | `<circle cx="8" cy="8" r="5.5"/>` (matches status-dashed) | todo, open, unstarted · todo |
| status-half | status-empty + solid right half `M8 4.5a3.5 3.5 0 0 1 0 7Z` | in-progress, started · in-progress |
| loader | three-quarter arc `M8 2.25a5.75 5.75 0 1 1-5.75 5.75` | loading, spinner, progress · spinner |
| clock | circle frame + hands `M8 4.75V8l2.25 1.5` | time, schedule, due · time |
| history | clock with a gap at 8–9 o'clock + small arrow head on the gap end + hands | recent, revisions, version · recent |
| bell-off | bell + slash `M2.75 2.75l10.5 10.5` with the bell outline broken 1px around the slash | mute, silent · mute |
| eye | almond `M1.75 8s2.25-4.5 6.25-4.5 6.25 4.5 6.25 4.5-2.25 4.5-6.25 4.5S1.75 8 1.75 8Z` + pupil solid circle r 1.75 | view, visible, show · show |
| eye-off | eye with slash, almond broken 1px around the slash, pupil omitted | hide, hidden · hide |
| lock | body as a rounded rect 10 × 7 rx 1.5 at (3,7) + shackle `M5.25 7V5.25a2.75 2.75 0 0 1 5.5 0V7` + keyhole dot | secure, private, locked · secure |
| unlock | same with the shackle opened on the right (right leg ends at y 5) | open, unlocked · unlocked |

### Task 7: people (9)

| icon | construction | tags · aliases |
|---|---|---|
| users | the person scaled to x 1.75–10.75 + a second head and shoulder behind on the right (outline arc only, clear 1px from the first) | team, group, members · team |
| user-circle | circle frame + small solid head (r 2, cy 6.5) + shoulder arc clipped by the frame | profile, account, avatar · profile |
| user-plus | person shifted left (like user-arrow) + plus mark in the modifier zone (`M12 9.5v4.5M9.75 11.75h4.5`) | invite, add-user · invite |
| user-check | person shifted left + check mark in the modifier zone (`M9.5 11.75l1.5 1.5 3-3.25`) | verified, approved · verified |
| building | portrait tower 3–13 × 1.75–14.25 rx 1.25 + 2 × 3 grid of window dots (r .75 solid) + door `M7 14.25v-2.5h2v2.5` | company, organization, office · company |
| log-in | door frame on the right `M9.5 2.25h2.75a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H9.5` + arrow right into it `M2.25 8h7M7 5.25 9.75 8 7 10.75` | sign-in, enter · sign-in |
| log-out | door frame on the left + arrow right out of it | sign-out, exit · sign-out |
| shield | shield outline `M8 1.75 13 3.75v4c0 3.25-2.25 5.5-5 6.5-2.75-1-5-3.25-5-6.5v-4Z` | security, protection · security |
| key | ring solid with a cut-out (outer r 3.25 at (5,8), hole r 1) + shaft `M8 8h5.75` + teeth `M11.5 8v2.25M13.75 8v1.75` | password, access, api-key · password |

### Task 8: objects (13)

| icon | construction | tags · aliases |
|---|---|---|
| folder | landscape: tab on the top left + body, rounded r 1.5: `M1.75 4.25a1.5 1.5 0 0 1 1.5-1.5h3l1.5 1.75h5a1.5 1.5 0 0 1 1.5 1.5v6.25a1.5 1.5 0 0 1-1.5 1.5h-9.5a1.5 1.5 0 0 1-1.5-1.5Z` | directory · directory |
| folder-open | folder with the front flap tilted open (front face as a parallelogram offset 1.5 to the right) | directory-open · opened |
| file | document part | document, page · document |
| file-text | document + two lines `M5.5 8.75h5M5.5 11.25h3.5` | doc, note, text · document-text |
| file-plus | document with the bottom-right corner cut away for the modifier zone + plus mark | new-file, add-document · new-file |
| book | open book: two pages from a center spine `M8 4.25v9.5`, outer covers curving out | docs, guide, manual · docs |
| image | square frame + mountain `M2.25 11.5l3.5-3.5 3 3 2-2 3 3` + sun dot solid r 1.25 at (10.5,5.5) | photo, picture, media · photo |
| paperclip | clip as a single path of nested U-turns, inner width ≥ 2.5 between centerlines | attach, attachment · attachment |
| package | isometric cube at 30° (the one allowed 3D form): top face rhombus + two side faces, with the center seam | box, product, project · cube |
| layers | three stacked rhombi; the top one solid, the two below as offset chevron outlines | stack, views · stack |
| briefcase | landscape case 12.5 × 9 rx 1.5 at (1.75,4.25) + handle `M5.75 4.25V3a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1v1.25` + a seam line | work, job, portfolio · work |
| target | circle frame + inner ring r 3 + solid center dot r 1 | goal, aim, focus · goal |
| diamond | rotated rounded square (rhombus 2–14) with rounded joins, outline | milestone, gem · milestone |

### Task 9: data (12)

| icon | construction | tags · aliases |
|---|---|---|
| bar-chart | three outline bars (rounded, width 2.5) rising left to right + baseline `M2 14h12` | chart, analytics, stats · analytics |
| line-chart | axes `M2.25 2.25v11.5h11.5` + polyline `M4.5 10.5l3-3.25 2.5 2 3.75-4.5` | chart, trend · trend |
| pie-chart | circle frame + one solid wedge (top-right quarter) | chart, share, breakdown · breakdown |
| trending-up | `M2 11.5 6.25 7.25l3 3 4.75-4.75` + head `M10.25 5.5H14v3.75` | growth, increase · increase |
| trending-down | mirror vertically | decline, decrease · decrease |
| activity | pulse line `M1.75 8h2.75l2-4.75 3 9.5 2-4.75h2.75` | pulse, monitor, health · pulse |
| table | square frame + header band solid (like calendar) + one vertical divider at x 6.5 + one row line at y 10 | grid, spreadsheet, rows · spreadsheet |
| database | cylinder: top ellipse `<ellipse>` is not allowed, so draw it as a path with two arcs (rx 5.25, ry 2) + sides + one middle band arc | storage, data, db · storage |
| kanban | three columns of rounded rects at different heights (like board columns), outline | board, columns · board |
| gauge | 3/4 arc `M2.5 11.5a6.25 6.25 0 1 1 11 0` + needle `M8 9.5 10.75 6.25` + hub dot | speed, performance, meter · meter |
| priority-low | priority-high geometry with only the first bar (solid). The inactive bars are omitted (see the review question) | priority, low · low |
| priority-medium | the first two bars solid | priority, medium · medium |

**Review question for Lucas (data batch):** Linear dims the inactive priority bars. Our rules allow no opacity, so inactive bars are omitted. If that reads too sparse, the alternative is to allow `opacity` on a solid element, which would be a rule change.

### Task 10: communication (9)

| icon | construction | tags · aliases |
|---|---|---|
| mail | landscape envelope rect 12.5 × 9.5 rx 1.5 at (1.75,3.25) + flap `M2 4.5l6 4.5 6-4.5` | email, message, inbox · email |
| message | rounded speech bubble 12 × 9.5 rx 2 + tail at the bottom left | chat, comment · comment |
| messages | two bubbles: the back one offset up-right, drawn only where uncovered, clear 1px | conversation, threads · conversation |
| at-sign | `@`: inner circle r 2.5 + outer arc r 5.75 opening at the bottom right, connected by the stem | mention, email · mention |
| phone | handset outline at 45°, rounded ends | call, phone · call |
| video | landscape body rect 9 × 8 rx 1.5 at (1.75,4) + lens triangle `M10.75 7.25l3.5-2v5.5l-3.5-2` | camera, call, meeting · camera |
| megaphone | cone opening right + handle stub + two short sound lines (optional) | announce, broadcast, news · announce |
| smile | circle frame + eyes as solid dots r .9 at (6,6.5), (10,6.5) + mouth `M5.5 9.75a3 3 0 0 0 5 0` | emoji, reaction, happy · emoji |
| thumbs-up | thumb with cuff on the left; rounded | like, approve, upvote · like |

### Task 11: system (16)

| icon | construction | tags · aliases |
|---|---|---|
| toggle | pill frame 12.5 × 7 rx 3.5 at (1.75,4.5) + solid knob r 2.25 at (11.25,8) | switch, on · switch |
| palette | rounded palette blob with a thumb notch at the bottom right + three paint dots solid r 1 | color, theme, appearance · appearance |
| sun | solid center r 2.75 + 8 short rays (length 1.25) on a radius 5–6.25 | light, theme, day · light-mode |
| moon | crescent: outer arc r 5.75, inner arc r 4.5 offset up-right; outline | dark, theme, night · dark-mode |
| monitor | landscape screen rect 12.5 × 8.5 rx 1.5 at (1.75,2.25) + stand `M6 14h4M8 10.75V14` | desktop, screen, display · desktop |
| smartphone | portrait rect 8 × 12.5 rx 2 at (4,1.75) + speaker line `M7 3.75h2` | mobile, phone, device · mobile |
| globe | circle frame + meridian ellipse (two arcs) + equator line | world, web, language, domain · world |
| plug | plug body as a rounded U + two prongs `M6 1.75v3M10 1.75v3` + cable `M8 11.5v2.75` | integration, connect, power · integrations |
| zap | bolt `M9 1.75 3.5 9.25H8l-1 5 5.5-7.5H8Z` with rounded joins | automation, lightning, fast · lightning |
| workflow | two rounded squares (4 × 4) at the top left and bottom right, connected by an elbow line | automation, flow, pipeline · flow |
| command | ⌘ glyph: four loops r 1.75 at the corners of a 4.5 square | cmd, shortcut, mac · cmd |
| keyboard | landscape rect 12.5 × 9 rx 1.5 + key dots (solid r .6) in two rows + spacebar line | keys, shortcuts, input · shortcuts |
| sparkle | four-point star, concave sides (arcs), centered (8,8), radius 6. Optional small companion star | ai, magic, generate · ai |
| code | `M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5` | developer, html, embed · embed |
| terminal | square frame + prompt `M5 6l2 2-2 2` + cursor line `M8.75 10.5h2.5` | console, cli, shell · console |
| git-branch | two nodes (r 1.5) on a vertical line at x 4.5 + a branch node at (11.5,4.5) joined by a curve | branch, version, git · branch |

### Task 12: text (11)

| icon | construction | tags · aliases |
|---|---|---|
| type | T built from the square frame: solid frame with a T cut-out (like Linear's "content"), rounded cut-out ends | text, font, typography · text |
| bold | B outline: stem + two stacked bowls, heavier feel through larger counters | bold, strong · strong |
| italic | `M6.5 2.75h5M4.5 13.25h5M9.5 2.75 6.5 13.25` | italic, emphasis · emphasis |
| underline | `M4.5 2.75V7a3.5 3.5 0 0 0 7 0V2.75M3.5 13.25h9` | underline · underline |
| strikethrough | S-curve + strike line `M2.75 8h10.5` | strike, delete-text · strike |
| list-bullet | three solid dots r 1 at x 3.25 + lines from x 6.5 to 13.25 at y 4, 8, 12 | list, bullets, unordered · unordered-list |
| list-ordered | "1 2 3" built from short strokes at x 2.5–4.5 + the same lines | numbered, ordered · numbered-list |
| square-check | square frame + check inside (scaled check part) | checkbox, task, todo · checkbox |
| quote | two solid quote marks (rounded comma shapes) | blockquote, citation · blockquote |
| hash | `#`: two verticals slanted 10° + two horizontals | channel, number, tag · channel |
| align-left | four lines, left-aligned, lengths 10.5 / 7 / 10.5 / 7 | text-align, paragraph · paragraph |

### Task 13: billing (4)

| icon | construction | tags · aliases |
|---|---|---|
| credit-card | landscape rect 12.5 × 9 rx 1.5 at (1.75,3.5) + solid magnetic band (y 5.75–7.5) + short line `M4.5 10.75h2.5` | payment, card, billing · payment |
| receipt | portrait with a zigzag bottom edge + three lines | invoice, bill · invoice |
| wallet | landscape body + a flap pocket on the right with a solid dot | balance, money · balance |
| circle-dollar | solid circle + `$` cut-out (S path widened into an outline cut, rounded ends) + its vertical bar | price, money, revenue, currency · money |

---

### Task 14: Close out the set

**Files:** `docs/plans/2026-10-10-merki-foundation-followups.md`, `icons/_review.json`

- [ ] **Step 1:** Run `npm run coverage`. Expected: `145/145 drawn, 0 missing`.
- [ ] **Step 2:** Check `icons/_review.json`. Every one of the 145 names is `ok`.
- [ ] **Step 3:** Run `npm run sheet -- navigation`, then the same for each category, and read each sheet once more side by side. Look for set-wide drift: weights, sizes, arrowhead sizes. Note anything off as a fix commit, and run that through the batch review steps again.
- [ ] **Step 4:** Remove the "Before batch 2" section from the follow-ups doc (done by Task 1 and Task 3). Commit `docs: the set is complete`.

## After this plan

- **Site:** home, icon panel, craft cards, guide (spec §6).
- **Package polish + Figma + 1.0:** LICENSE in the package, types field, README, Figma sync, `RELEASE.md`, publish (spec §7–9).
