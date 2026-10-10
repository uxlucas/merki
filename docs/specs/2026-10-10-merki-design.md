# Merki — design spec

*2026-10-10 · status: approved in conversation, awaiting written review*

Merki is an open-source icon library for SaaS products, dashboards, productivity tools, settings, forms and interactive applications. It is drawn on a 16px grid, in one style, inspired by Linear's icons and never copied from them.

## 1. Goals

- **Primary: craft showcase.** Three months after launch, people who see Merki should conclude the author has taste. The 16px polish and the site carry this.
- **Secondary: adoption.** Downloads and stars are a bonus. We deal with them if they come; nothing in v1 is built for scale we don't have.
- **v1 is small and polished:** 145 icons, one style, three outputs (SVG, React, Figma) and a site.

### Decisions

| topic | decision |
|---|---|
| name | **Merki**, Icelandic for "sign, mark, emblem". Renamed from Keyline on 2026-10-10: npm blocked `keyline` as too similar to `byline`, and Cambridge Intelligence sells a JS SDK called KeyLines. npm `merki` was free on 2026-10-10. If npm's similarity check blocks it at publish, the fallback is `merki-icons`. Trademark/domain check pending (Lucas). |
| license | **MIT** for icons and code |
| style | one style: outline with selective solid accents. No solid/duotone variant planned. |
| grid | 16px master. Tuned for 16 and 20, supported at 24. 32+ works but isn't promised. |
| outputs | raw SVG, React package, Figma community file, showcase site |
| source of truth | SVG files in the repo. Figma is generated from them, one way. |
| copying | never trace or reuse Linear's (or anyone's) paths. Inspiration only. |
| roles | Claude draws and builds. Lucas sets art direction and does the optical review in `/lab`. |

## 2. Icon rules

⚙️ = enforced by the linter. Everything else is checked by eye in `/lab`.

**Canvas**
- ⚙️ `viewBox="0 0 16 16"`. Nothing drawn outside 1–15 (1px padding), stroke width included. Stroke centerlines stay within 1.75–14.25.
- ⚙️ Every anchor snaps to a **0.25** grid: path endpoints, arc radii, cx/cy/r, x/y/width/height/rx, line ends.
- ⚙️ Bézier handles (curve control points) use at most 2 decimals. Smooth curves need finer handles than the anchor grid allows.

**Stroke**
- ⚙️ `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. No other weights.
- ⚙️ Only `currentColor` or `none` for fill and stroke. No other color values.

**Keylines** (centerline dimensions)
- circle: diameter 12
- square: 11.5 × 11.5, radius 2
- portrait: 10 × 12.5 · landscape: 12.5 × 10
- Circles are deliberately larger than squares so they look the same size.

**Corners and spacing**
- Outer radius 2 on full-size shapes, 1 on small parts, never below 0.75.
- At least 1px of clear space between separate shapes.

**Solid accents**
- At most one solid element per icon, used for a reason: people's heads, header bands (calendar), markers (flag), solid states (circle-x style knockouts), data bars (priority).
- ⚙️ Knockouts are built as compound paths (`fill-rule="evenodd"`), **never `<mask>` or `<clipPath>`**. Masks need IDs, and IDs collide when an icon appears twice on a page.

**Modifier marks** (user-plus, user-arrow, file-plus…)
- The mark lives in the bottom-right 6×6 zone (9–15 on both axes). The base glyph is cut back to leave 1px of clear space around it.

**Drawing**
- Flat and front-facing. Prefer 0/45/90° angles. The only 3D allowed is a 30° isometric cube (`package`).
- One metaphor per icon. No letters except text icons (`type`, `bold`, `italic`…).
- ⚙️ No `transform`, `<g>`, `id`, `class`, `style`, `<mask>`, `<clipPath>`, `<defs>`, `<use>`. Allowed elements: `path`, `circle`, `rect`, `line`.
- ⚙️ Allowed attributes. path: `d fill stroke fill-rule`. circle: `cx cy r fill stroke stroke-dasharray stroke-dashoffset` (dashes are for `status-dashed`). rect: `x y width height rx fill stroke`. line: `x1 y1 x2 y2`. Root `<svg>`: `xmlns` plus the required `viewBox fill stroke stroke-width stroke-linecap stroke-linejoin`.

**Naming and metadata**
- ⚙️ kebab-case. Object first, then modifier: `user-plus`, `calendar-check`, `arrow-up-right`.
- ⚙️ Every `name.svg` has a `name.json`: `{ "category": "...", "tags": [...], "aliases": [...] }`. Category must be one of the ten in §3.

**Lessons from the spike** (15 icons, 2026-10-10)
- Outline-only people read too thin next to Linear-weight icons. People get a **solid head**.
- A gear at 16px needs few, wide teeth and a larger hole. Six thin teeth looked busy.
- Solid icons (circle-x, calendar) read heavier than open ones (search, link). Compare-mode review exists to catch this.
- With the stroke scaled up, 24px reads a bit heavy and 32px reads chunky. Hence `absoluteStrokeWidth` and the "tuned for 16/20" promise.

## 3. Icon set: 145 icons

Checked against ~28 screens from 14 SaaS products on Mobbin (Linear, Notion, Stripe, Attio, Vercel, v0, Replit, Plain, Unify, Calendly, Square, DoorDash Merchant, Mintlify, AirOps). Items marked † came from that check.

| category | # | icons |
|---|---|---|
| navigation | 20 | home, inbox, search, menu, sidebar, layout-grid, layout-list, chevron-up, chevron-down, chevron-left, chevron-right, chevrons-up-down, arrow-up, arrow-down, arrow-left, arrow-right, arrow-up-right, arrow-left-right†, more-horizontal, more-vertical |
| actions | 24 | plus, minus, x, check, pencil, square-pen†, trash, copy, undo, redo, refresh, download, upload, share, link, filter, sort, expand, collapse, archive, pin, star, bookmark, send |
| status | 19 | circle-check, circle-x, circle-alert, triangle-alert, info, help, ban†, status-dashed, status-empty, status-half, loader, clock, history†, bell, bell-off, eye, eye-off, lock, unlock |
| people | 11 | user, users, user-circle†, user-plus, user-check, user-arrow, building, log-in, log-out, shield, key |
| objects | 16 | calendar, tag, flag, folder, folder-open, file, file-text, file-plus, book†, image, paperclip, package, layers, briefcase, target, diamond |
| data | 13 | bar-chart, line-chart, pie-chart, trending-up, trending-down, activity, table, database, kanban, gauge, priority-low, priority-medium, priority-high |
| communication | 9 | mail, message, messages, at-sign, phone, video, megaphone, smile, thumbs-up |
| system | 18 | settings, sliders, toggle, palette†, sun, moon, monitor, smartphone, globe, plug, zap, workflow†, command, keyboard, sparkle, code, terminal, git-branch |
| text | 11 | type, bold, italic, underline, strikethrough, list-bullet, list-ordered, square-check, quote, hash, align-left |
| billing | 4 | credit-card, receipt, wallet, circle-dollar |

Out of v1: brand/logo icons (trademark risk), niche domains (medical, maps, weather), more than one AI icon (`sparkle` only).

## 4. Repo and build

```
merki/
  icons/                 masters: name.svg + name.json
  scripts/
    lint.ts              rules from §2
    build.ts             optimize → package → site data
  packages/merki/      the npm package
  site/                  Vite + React: showcase, craft, guide, /lab
  figma/                 sync script (repo → Figma)
  docs/specs/
```

**Build pipeline**
1. **Lint:** parse every SVG and check every ⚙️ rule. Bounds include the stroke: each element's geometric bounding box, expanded by 0.75 if the element is stroked. A failure stops the build and prints `icon-name: rule: detail`.
2. **Optimize:** SVGO with a locked config. Keep round caps and joins, don't merge paths across elements, don't convert shapes in ways that break the 0.25 grid. A test checks that every optimized SVG still passes lint.
3. **Generate:** optimized SVGs (`packages/merki/svg/`), one React component per icon, and `site/src/data/icons.json` (name, category, tags, aliases, svg markup).
4. **Test (vitest):** linter fixtures (must-pass and must-fail SVGs per rule), snapshots of the generated components, and a check that metadata and SVG files pair up 1:1.

**Tooling:** npm workspaces (pnpm isn't installed, and npm keeps setup to zero steps), TypeScript, tsx for scripts, tsup for the package, vitest. GitHub Actions runs lint + build + test on every PR and on pushes to `main`.

**`/lab`** is the review tool, a hidden route on the site that reloads live from `icons/`:
- every icon at 16/20/24, light and dark
- the 8× grid overlay with keylines and the 1px padding
- a menu-row mock (icons doing their real job)
- **compare mode:** pick an icon and see it beside its category neighbours and a fixed set of reference icons (search, calendar, user, circle-x) to judge weight
- review notes: Lucas marks icons as needing work and adds a short note. Stored as `icons/_review.json` through a dev-only endpoint, so Claude can read them.

## 5. Package and React API

One package, **`merki-icons`** (npm blocked plain `merki` as too similar to `merge`/`mri`):
- main export: React components. ESM-only, `sideEffects: false`, tree-shakeable. Peer dependency `react >= 18`.
- `merki/svg/<name>.svg`: raw optimized SVGs, for non-React users.
- Each GitHub release also attaches a zip of the SVGs.

```tsx
import { CalendarIcon } from 'merki-icons'

<CalendarIcon />                               // 16px, currentColor
<CalendarIcon size={20} />
<CalendarIcon size={24} absoluteStrokeWidth />
<CalendarIcon title="Due date" />
<CalendarIcon className="text-muted" />
```

**Props**
- `size?: number | string`, default `16`. Sets width and height.
- `color?: string`, default `'currentColor'`. Set as the SVG `color` attribute, so solid accents (`fill="currentColor"`) follow it as well as strokes.
- `absoluteStrokeWidth?: boolean`, default `false`. Adds `vector-effect="non-scaling-stroke"` to every shape, so the stroke renders at 1.5 screen px at any size, including CSS sizes like `"2rem"`. Documented: solid accents still scale.
- `title?: string`, see accessibility.
- All other `SVGProps<SVGSVGElement>` go onto the `<svg>`. Refs are forwarded with `forwardRef` (React 18 compatible).

**Deliberately absent:** `strokeWidth` (one weight is the identity of the set), dynamic `<Icon name>` (breaks tree-shaking; a possible opt-in subpath later), a context provider (would force `'use client'`).

**Accessibility**
- Default: `aria-hidden="true"`, `focusable="false"`.
- With `title`: `role="img"`, `aria-label={title}`, and a `<title>` child. No generated IDs, so no hooks.
- Components use no hooks or context, so they work as React Server Components.

**Names**
- Every export ends in `Icon`: `CalendarIcon`, `XIcon`, `ArrowUpRightIcon`. This avoids collisions with `Link`, `Image`, `Table`, `File`.
- Aliases exist only for site search. Not exported.
- After 1.0, a rename keeps the old export with `@deprecated` for one major version.

**Rendered output**
```html
<svg class="merki merki-calendar" width="16" height="16" viewBox="0 0 16 16"
     fill="none" stroke="currentColor" stroke-width="1.5"
     stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true" focusable="false">…</svg>
```

## 6. Site

**Purpose:** carry the craft story. The icons are the hero. Claude designs the site from Lucas's references, and Lucas reviews it as it's built.

**References and what we take from each**
- **Linear:** density, how type is used, the sidebar.
- **craft.gustavofior.com:** minimal interactive cards, gray-level hierarchy in the sidebar, the optical-alignment toggle demo.
- **interior.dev:** minimal cards that present components live, short and pointed hero copy.
- **foglamp.dev:** clear, objective language. Real product UI as illustration.
- **lineicons.com:** the *idea* of presenting care (grid & keyline / stroke & corners / points). Not its visuals.
- **runeicons.com:** the construction view (grid, keylines, anchor points, `24 × 24` header). Made much quieter.
- **tenor.design:** secondary reference.

**Avoid:** bubbly color badges and heavy shadows (lineicons), clutter like isometric 3D, many styles and color dials (runeicons), big image heroes, anything that animates on scroll.

**Layout:** a left sidebar in the Linear/gustavo style:
- **Icons:** All, plus the ten categories with counts
- **Craft:** one short article per rule card
- **Guide:** Install, React, Accessibility, Changelog
- Inactive items in light gray, the active one near-black with a small dot.

**Home (`/`), top to bottom**
1. **Statement + install.** One plain sentence. Draft: *"145 icons for software people use all day."* plus *"16px grid. One stroke. MIT."* A copy button for `npm i merki-icons`, and GitHub with its star count.
2. **The set.** All icons at 16px, visible without scrolling. Search is focused on load. Category chips. A 16/20/24 size switch.
3. **Craft cards.** Six live mini-demos in the gustavo/interior style. Each has a title and one plain sentence, and links to its Craft article:
   1. **Keylines:** toggle the construction shapes over an icon
   2. **One stroke:** a size slider; the stroke stays consistent
   3. **Looks right vs measures right:** circle and square, mathematically equal vs optically equal
   4. **Solid accents:** outline-only vs accented, side by side
   5. **In context:** a Linear-like menu built entirely from Merki icons
   6. **Points:** hover to reveal anchor points

**Icon panel**
- Opens from the grid as a side panel. The URL becomes `/icons/<name>` (prerendered, shareable, indexable). Esc closes it and returns to `/`.
- Header: name + `16 × 16`.
- Construction view: icon over the 16px grid and its keylines. Toggle for anchor points.
- Previews at 16/20/24, light and dark. The icon in context: menu row, button, input.
- Copy SVG · Copy JSX · Download SVG. Tags and category.

**Behaviour**
- Search covers name, tags and aliases. `/` or ⌘K focuses it. Results update as you type.
- Arrow keys move through the grid, Enter opens the panel, Esc closes it.
- Copy confirms inline: the button shows ✓ for ~1.2s. No toasts.
- Size and theme preferences are kept in `localStorage`, wrapped in try/catch, with sensible defaults when it isn't available.
- Motion only where something changes place (the panel, card demos on interaction). Fast and ease-out. Respects `prefers-reduced-motion`. Nothing on scroll.

**Visual rules**
- Off-white page, white cards with a hairline border and barely any shadow, card radius ~16.
- Inter-class type at a 14px base. Hierarchy comes from weight and gray level, not size jumps.
- **One accent color (blue), used only for construction overlays.** Blue always means "how it's built".
- Light and dark themes, both designed, not inverted.

**Stack:** Vite + React, static output. Per-icon pages are prerendered at build time. Hosted on Vercel and deployed from `main`.

## 7. Figma file

- Generated by `figma/sync` through the Figma connection, one way only: repo → Figma. Never edited by hand.
- One component per icon, 16×16, named `category/name`. The component description holds tags and aliases.
- Strokes stay strokes, not outlined. Color comes from one `icon` color variable.
- Pages: **Cover · Icons** (sections per category) **· Construction** (the 16px grid + keyline template as a component) **· Changelog**.
- **Re-sync updates components in place, matched by name, and never deletes and recreates them.** This keeps component keys stable, so instances in other people's files keep working.
- Published as a Community file under the "Lucas Lima Design" team. Lucas publishes it.

## 8. Versioning and release

- `0.x` while building, `1.0.0` at launch. SemVer: added icon → minor; redrawn icon → minor, with a changelog line saying it looks different; renamed or removed icon → major.
- `RELEASE.md` checklist:
  1. lint + build + test pass
  2. bump version and `CHANGELOG.md`, tag `vX.Y.Z`
  3. Lucas runs `npm publish` (his account, 2FA)
  4. GitHub release with the SVG zip
  5. run the Figma sync; Lucas publishes the Community update
  6. the site deploys from `main`

## 9. Build order

1. **Foundation:** repo, linter with fixtures, build script, the React package runtime and generator, `/lab`. Redraw the spike icons to these rules as the first real batch (16 icons).
2. **The set:** draw the remaining icons in category batches. Each batch is reviewed in `/lab` before the next starts.
3. **Package polish:** README, docs comments, package checks before publishing.
4. **Site:** home, icon panel, craft cards and articles, guide.
5. **Figma:** sync script and file.
6. **1.0:** release checklist, launch.

## 10. Out of scope for v1

Vue/Svelte/other framework packages, icon font, solid or duotone variants, a `strokeWidth` prop, dynamic `<Icon name>`, brand logos, an icon editor in the browser, automated releases, Code Connect.

## 11. Open items (Lucas)

- Trademark and domain check for "Merki".
- Claim npm `merki` with a `0.0.1` placeholder (Claude can prepare it; Lucas publishes).
- Rename the folder `~/Desktop/arkan-icons` → `~/Desktop/merki` (between sessions, since this one runs inside it).
- Create the GitHub repo `uxlucas/merki` when ready to push. It stays private until launch.
