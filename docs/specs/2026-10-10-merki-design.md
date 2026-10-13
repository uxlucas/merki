# Merki — design spec

*2026-10-10 · status: approved in conversation, awaiting written review*

Merki is an open-source icon library for SaaS products, dashboards, productivity tools, settings, forms and interactive applications. It is drawn on a 16px grid, in one style, inspired by Linear's icons and never copied from them.

## 1. Goals

- **Primary: craft showcase.** Three months after launch, people who see Merki should conclude the author has taste. The 16px polish and the site carry this.
- **Secondary: adoption.** Downloads and stars are a bonus. We deal with them if they come; nothing in v1 is built for scale we don't have.
- **v1 is small and polished:** 157 icons, one style, three outputs (SVG, React, Figma) and a site.

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
- ⚙️ `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. No other weights, except the 1.25 interior optical weight below.
- ⚙️ Only `currentColor` or `none` for fill and stroke. No other color values.
- ⚙️ Interior detail lines (inside an enclosing shape) and small glyph details (numerals, letterforms) may use `stroke-width="1.25"` as an optical correction; outer silhouettes stay 1.5 (decided 2026-10-12; used by globe, list-ordered and receipt).

**Keylines** (centerline dimensions)
- circle: diameter 12
- square: 11.5 × 11.5, radius 2
- portrait: 10 × 12.5 · landscape: 12.5 × 10
- Circles are deliberately larger than squares so they look the same size.

**Corners and spacing**
- Outer radius 2 on full-size shapes, 1 on small parts, never below 0.75.
- At least 1px of clear space between separate shapes.

**Solid accents**
- At most one solid *role* per icon (repeated markers, dots and bars count as one), used for a reason: people's heads, header bands (calendar), markers (flag), solid states (circle-x style knockouts), data bars (priority).
- ⚙️ Knockouts are built as compound paths (`fill-rule="evenodd"`), **never `<mask>` or `<clipPath>`**. Masks need IDs, and IDs collide when an icon appears twice on a page.

**Modifier marks** (user-plus, user-arrow, file-plus…)
- The mark lives in the bottom-right 6×6 zone (9–15 on both axes). The base glyph is cut back to leave 1px of clear space around it.

**Drawing**
- Flat and front-facing. Prefer 0/45/90° angles. The only 3D allowed is a 30° isometric cube (`package`).
- One metaphor per icon. No letters except text icons (`type`, `bold`, `italic`…).
- ⚙️ No `transform`, `<g>`, `id`, `class`, `style`, `<mask>`, `<clipPath>`, `<defs>`, `<use>`. Allowed elements: `path`, `circle`, `rect`, `line`.
- ⚙️ Allowed attributes. path: `d fill stroke fill-rule stroke-width (1.25 only) opacity`. circle: `cx cy r fill stroke stroke-dasharray stroke-dashoffset stroke-width (1.25 only) opacity` (dashes are for `status-dashed`). rect: `x y width height rx fill stroke stroke-width (1.25 only) opacity`. line: `x1 y1 x2 y2 stroke-width (1.25 only)`. Root `<svg>`: `xmlns` plus the required `viewBox fill stroke stroke-width stroke-linecap stroke-linejoin`. `opacity="0.3"` is allowed only on solid shapes, for inactive states such as priority bars (decided 2026-10-11).

**Naming and metadata**
- ⚙️ kebab-case. Object first, then modifier: `user-plus`, `calendar-check`, `arrow-up-right`.
- ⚙️ Every `name.svg` has a `name.json`: `{ "category": "...", "tags": [...], "aliases": [...] }`. Category must be one of the ten in §3.

**Lessons from the spike** (15 icons, 2026-10-10)
- Outline-only people read too thin next to Linear-weight icons. People get a **solid head**.
- A gear at 16px needs few, wide teeth and a larger hole. Six thin teeth looked busy.
- Solid icons (circle-x, calendar) read heavier than open ones (search, link). Compare-mode review exists to catch this.
- With the stroke scaled up, 24px reads a bit heavy and 32px reads chunky. Hence `absoluteStrokeWidth` and the "tuned for 16/20" promise.

## 3. Icon set: 157 icons

Checked against ~28 screens from 14 SaaS products on Mobbin (Linear, Notion, Stripe, Attio, Vercel, v0, Replit, Plain, Unify, Calendly, Square, DoorDash Merchant, Mintlify, AirOps). Items marked † came from that check.

| category | # | icons |
|---|---|---|
| navigation | 22 | home, inbox, search, menu, sidebar, layout-grid, layout-list, chevron-up, chevron-down, chevron-left, chevron-right, chevrons-up-down, arrow-up, arrow-down, arrow-left, arrow-right, arrow-up-right, arrow-left-right†, more-horizontal, more-vertical, external-link, dashboard |
| actions | 32 | plus, minus, x, check, pencil, square-pen†, trash, copy, undo, redo, refresh, sync†, download, upload, share, link, filter, sort, expand, collapse, archive, pin, star, bookmark, send, grip-vertical, heart, save, circle-plus, funnel, zoom-in, zoom-out |
| status | 19 | circle-check, circle-x, circle-alert, triangle-alert, info, help, ban†, status-dashed, status-empty, status-half, loader, clock, history†, bell, bell-off, eye, eye-off, lock, unlock |
| people | 11 | user, users, user-circle†, user-plus, user-check, user-arrow, building, log-in, log-out, shield, key |
| objects | 18 | calendar, tag, flag, folder, folder-open, file, file-text, file-plus, book†, image, paperclip, package, layers, briefcase, target, diamond, map-pin, clipboard |
| data | 13 | bar-chart, line-chart, pie-chart, trending-up, trending-down, activity, table, database, kanban, gauge, priority-low, priority-medium, priority-high |
| communication | 9 | mail, message, messages, at-sign, phone, video, megaphone, smile, thumbs-up |
| system | 18 | settings, sliders, toggle, palette†, sun, moon, monitor, smartphone, globe, plug, zap, workflow†, command, keyboard, sparkle, code, terminal, git-branch |
| text | 11 | type, bold, italic, underline, strikethrough, list-bullet, list-ordered, square-check, quote, hash, align-left |
| billing | 4 | credit-card, receipt, wallet, circle-dollar |

`sync` was split from `refresh` at Lucas's review on 2026-10-10: refresh became a single clockwise arrow, and the two-arrow form moved to its own icon. Its † marks it as an addition after the first list, not a Mobbin find.

Out of v1: brand/logo icons (trademark risk), niche domains (medical, mapping/navigation sets, weather; `map-pin` is in for addresses and locations), more than one AI icon (`sparkle` only).

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
- `merki-icons/svg/<name>.svg`: raw optimized SVGs, for non-React users.
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

**Purpose:** a showcase landing page first, a library second. It carries the craft story, and the icons are the hero. It is designed from Lucas's references and was settled screen by screen in the visual companion on 2026-10-12. The mocks live in `.superpowers/brainstorm/` (git-ignored); this section is the record.

**Address:** `merki.lucaslima.design`, on Vercel, deployed from `main`.

**Two stages**
- **Site 1** (this plan): home, the icon drawer and per-icon pages, the guide, and the six craft cards as live demos.
- **Site 2** (later plan): the six craft articles. Until they ship, each card shows an "Article soon" pill and doesn't link anywhere.

**Launch gate:** the site goes public only after the Figma Community file is published (§7). It is built and reviewed before that, but not announced.

**References and what we take from each**
- **Linear:** density, how type is used, the sidebar, dark mode greys.
- **craft.gustavofior.com:** the index layout (sidebar with 12px items on 28px rows, colored section glyphs), minimal interactive cards, the optical-alignment toggle demo.
- **interior.dev:** big tight headline, generous whitespace, double-border cards that present things live.
- **foglamp.dev:** clear, objective language. Real product UI as illustration.
- **lineicons.com:** the *idea* of presenting care (grid & keyline / stroke & corners / points). Not its visuals.
- **runeicons.com:** the construction view (grid, keylines, anchor points, `16 × 16` header). Made much quieter.
- **tenor.design:** secondary reference.

**Avoid:** bubbly color badges and heavy shadows (lineicons), clutter like isometric 3D, many styles and color dials (runeicons), big image heroes, anything that animates on scroll. A page that reads as a cold library (Lucas rejected that direction outright).

### Home (`/`), top to bottom

1. **Top nav.** The logo on the left: Lucas's mark + "merki-icons" set in JetBrains Mono. On hover it glitches once (~300ms): two same-ink slices of the wordmark jitter sideways and the mark twitches with them; no colour; off under reduced motion. Icons, Craft, Guide and the theme toggle (sun/moon) on the right.
2. **Hero, centered.**
   - Byline: "Brought to you by" + Lucas's mark (`mark-ink.svg` from his brand kit, filled with `currentColor` so it follows the theme) + "Lucas Lima", linking to `https://lucaslima.design`.
   - Headline: **"An icon library that obsesses over details"**, set in Host Grotesk, about 58px, weight 500, tracking −0.04em, broken after "that". (Revised 2026-10-12 from "157 icons for software people use all day.")
   - Two paragraphs, centered, max ~560px, verbatim:
     > I wanted a set of icons that felt familiar, but had a little more personality. So I started drawing my own.
     >
     > **merki-icons** is a growing collection of bold, rounded icons for Figma and code. Open source and free to use under the MIT License.
   - Three equal links in a row: `npm i merki-icons` with a copy button · the full-colour Figma logo + "Figma community file" ↗ · the GitHub mark + "GitHub" + a star-count chip ↗. The star count is fetched in the browser from the GitHub API (cached for the session, faded in once loaded); nothing renders on the server. While the repo is private, or if the request fails, the chip is absent and the link reads "GitHub".
3. **Wall band.** A wide grid of the set at 24px with a few icons in the accent blue, fading out at the bottom. It's decoration with a purpose: the set, seen at once.
4. **The index** (gustavo layout), which starts right under the wall band:
   - **Sidebar** (no logo, since the top nav carries it): Index, Changelog; **Icons** (blue `layout-grid` glyph): All 157 + the ten categories; **Craft** (orange `pencil` glyph): the six cards; **Guide** (pink `book` glyph): Install, React, SVG, Accessibility. Inactive items light grey, the active one near-black. The sidebar is sticky and its links scroll to their sections.
   - **Icons section:** a toolbar with search ("Search 157 icons", `/` hint) and a 16/20/24 segmented size switch. Below it, each category gets a heading with its count and a grid of **compact square icon cards**, 7 across (3 on phones; revised 2026-10-13 from 4 big cards across): the icon centred at the chosen size and its name in JetBrains Mono underneath, truncated with the full name on hover. The open icon's card is outlined in ink. Clicking a card opens the drawer.
   - **Back to top:** a small round button, bottom right, shown once the hero is out of view; it scrolls to the top (instantly under reduced motion).
   - **Craft section:** the six live demo cards in a 2-column grid (below).

### Icon drawer and per-icon pages

- **Desktop:** a floating rounded panel on the right (~430px wide, 12px off the viewport edges, radius ~20). The grid stays visible behind it. Opening it pushes `/icons/<name>` onto history; Esc or the close button returns to `/` at the same scroll position. Arrow keys keep moving through icons while it's open, and the drawer follows.
- **Contents, top to bottom** (revised 2026-10-12, "Tabs" layout):
  - header: a small category crumb, the name in Host Grotesk, the tags right under it (mono chips), and the close button
  - one stage shared by three tabs:
    - **Preview** (default): the icon on a faint checker, with 8 colour swatches + the hex value and a 16–64px size slider
    - **Construction:** the icon over the 16px grid and the four keylines from §2, with Keylines and Points toggles (anchors and curve handles parsed from the icon's own SVG)
    - **In context:** the icon in a menu row, a button and an input
  - actions pinned at the bottom: **Copy SVG** (primary), **Copy JSX**, **Download**, plus a reset button that appears once the colour or size has changed
- **Mobile (< 768px):** the drawer becomes a bottom sheet with the header, the stage, the tabs and the actions.
- **Per-icon pages:** every `/icons/<name>` is prerendered as the home page with that icon's drawer open, with its own `<title>` and description, so it can be shared and indexed. On mobile it opens as the same bottom sheet over the home page (revised 2026-10-12: the sheet now holds the full tabbed drawer, so there is no separate full-page view).
- **Copy output:** with the Preview untouched, Copy SVG gives the exact optimized SVG the package ships, Copy JSX gives `<NameIcon />` with the package's export name, and Download saves `<name>.svg`. Once the colour or size has changed, all three use them: the SVG gets that width/height and its `currentColor` replaced by the hex; the JSX gets `size={…}` and `color="#…"` props.

### Craft cards (live demos)

Six cards, each with a stage on top (interactive, controls as small pills at the bottom of the stage) and a title, a line and an "Article soon" pill below. Approved as built in the companion:

1. **Keylines:** "Four shapes under every icon. Hover to see them." Hovering the stage fades the keylines in. Chips switch between calendar, settings, bell, user and inbox.
2. **One stroke:** "Tuned for 16 and 20. Bigger, the stroke scales with the icon, or you pin it at 1.5." A 16–64px slider over the bell, a readout of size and rendered stroke, and a toggle that starts on **scaled** and flips to **absolute** (`absoluteStrokeWidth`). It must never claim 1.5 holds up at every size: scaled reads heavy past 24, absolute reads thin.
3. **Looks right:** "A circle drawn the same size as a square reads smaller." A square (11.5) and a circle with dashed guides. "On paper" makes the circle 11.5; "By eye" grows it to 12, animated.
4. **Solid accents:** "One solid part per icon gives it weight at 16px." Eight icons with solid parts (user, calendar, flag, tag, priority-high, circle-check, lock, thumbs-up) at 28px, and an "Accents on/off" toggle that turns the solid shapes into outlines.
5. **In context:** "Made for menus, not posters." A Linear-like menu (Inbox, Assign to…, Due date, Labels, Archive, with shortcut hints) with hover rows and a Light/Dark switch.
6. **Points:** "Every anchor on a quarter-pixel grid. 9 on heart." The heart as a construction view: pale 1.5 stroke, thin centreline, anchor squares; hover or "Show handles" reveals the curve handles. The count comes from the parser.

### Guide

- **Install:** npm, pnpm, yarn and bun one-liners.
- **React:** the props (`size`, `color`, `absoluteStrokeWidth`, `title`, `className`) with live examples rendered by the real package.
- **SVG:** using Merki without React: copy or download, the `merki-icons/svg/<name>.svg` path, and the fact that the files are plain `currentColor` SVGs.
- **Accessibility:** decorative by default (`aria-hidden`), `title` to name an icon, and icon-only buttons still need a label on the button.
- **Changelog:** rendered from `CHANGELOG.md` at the repo root. This plan creates it with the 0.x history so far; the release checklist (§8) keeps it current.

Routes: `/guide/install`, `/guide/react`, `/guide/svg`, `/guide/accessibility`, `/changelog`. They use the same top nav and sidebar as home.

### Behaviour

- Search covers name, tags and aliases, and filters as you type. `/` or ⌘K focuses it. Empty results say so plainly and offer to clear the search.
- Arrow keys move through the grid, Enter opens the drawer, Esc closes it.
- Copy confirms inside the button: it shows ✓ for ~1.2s. No toasts.
- Size and theme preferences are kept in `localStorage`, wrapped in try/catch, with sensible defaults when storage isn't available.
- **Motion** (revised 2026-10-12, following Emil Kowalski's interface-animation rules): only where something changes place or confirms an action. Transform and opacity only; interruptible CSS transitions for anything that opens and closes; exits ~25% faster and quieter than enters; enter easing `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Drawer: enters from 16px right with a fade over 240ms; closes with an 8px slide and fade over 180ms, then unmounts. Phone sheet: rises over 280ms, leaves over 200ms. The scrim shares the panel's timing.
  - Cards: border change on hover (real hover devices only), 0.97 press scale. Copy: the icon cross-fades to ✓. Back-to-top: 200ms fade and rise in, 150ms out. Mobile menu: fades in.
  - Never animated: arrow-key moves, tab switches, the first page load, theme switches (transitions are paused while the theme flips).
  - `prefers-reduced-motion` turns all of it off. Nothing animates on scroll.

### Visual rules

- Off-white page (`#fafafa`), white cards with a hairline border (`#ececef`) and barely any shadow, radius ~16–18. Demo cards use the double border: a 6px-padded outer card around an inner stage.
- **Type** (revised 2026-10-12): Inter for text (16px body in the hero, 14–15px in the index); **Host Grotesk** for headings (hero headline, section titles, the drawer name, guide headings); **JetBrains Mono** for the wordmark, icon names, tags and code. All three self-hosted from npm (`@fontsource-variable/*`, SIL OFL 1.1, which allows use in a logo). Hierarchy comes from weight and grey level. The hero headline is the one big size jump.
- **Blue means "how it's built":** construction overlays, keylines, points, and the highlighted icons in the wall band. Section glyphs in the sidebar are the only other color (blue, orange, pink).
- **Themes:** light, and dark in **cool slate** (background `#0e0f13`, cards `#16181d`, borders `#25272e`, text `#e6e7eb`). Both designed through CSS variables, not inverted. The site follows the system theme by default; the toggle overrides it and remembers.
- **Mobile:** the hero stacks and the three links go full width. The sidebar folds into a sticky bar with search and a row of category chips. Phone width has a 16px side gutter and no horizontal scroll.

### Stack and build

- Vite + React 19 in the existing `site/` workspace. The site imports the real components from the `merki-icons` workspace package, so it doubles as a test of the package.
- **Prerender:** a small build step renders each route to static HTML with React's server renderer, and the client hydrates it. No framework added. Routes: `/`, 157 × `/icons/<name>`, the four guide pages and `/changelog`.
- **Icon data:** read at build time from `icons/*.svg` and each icon's `.json` (category, tags, aliases), plus `icons/_set.json` for category order.
- **One config module** holds the outside links: npm, GitHub, Figma (`null` until the Community file is published; the link renders but goes nowhere) and the portfolio URL.
- `/lab` stays a dev-only page and is not in the production build.
- **Tests:** Vitest component tests for search, keyboard navigation, copy output (it must match the package's SVG and export name exactly), drawer routing and the theme logic, plus a build test that every route is emitted as HTML. Before review, the built site is checked in a real browser at desktop and phone widths.

## 7. Figma file

- Generated by `figma/sync` through the Figma connection, one way only: repo → Figma. Never edited by hand.
- One component per icon, 16×16, named `category/name`. The component description holds tags and aliases.
- Strokes stay strokes, not outlined. Color comes from one `icon` color variable.
- Pages: **Cover · Icons** (sections per category) **· Construction** (the 16px grid + keyline template as a component) **· Changelog**.
- **Re-sync updates components in place, matched by name, and never deletes and recreates them.** This keeps component keys stable, so instances in other people's files keep working.
- Published as a Community file under the "Lucas Lima Design" team. Lucas publishes it.

## 8. Versioning and release

- `0.x` while building, `1.0.0` at launch. SemVer: added icon → minor; redrawn icon → minor, with a changelog line saying it looks different; renamed or removed icon → major.
- `RELEASE.md` at the repo root holds both checklists below (added 2026-10-13). A release doesn't ship until every box in both is ticked.
- **Quality review** (Lucas, before every release that adds or redraws icons):
  - All icons reviewed at 16, 20 and 24 px.
  - Optical sizing consistent across different silhouettes.
  - Related families checked together, including statuses, arrows and user modifiers.
  - Light and dark appearances validated.
  - No SVG clipping, malformed paths or unexpected rendering differences.
  - Consistent naming, viewBox, colour inheritance and React component behaviour.
  - Accessible names documented for icon-only controls.
- **Release steps:**
  1. lint + build + test pass
  2. bump version and `CHANGELOG.md`, tag `vX.Y.Z`
  3. Lucas runs `npm publish` (his account, 2FA)
  4. GitHub release with the SVG zip
  5. run the Figma sync; Lucas publishes the Community update
  6. the site deploys from `main`; at the 1.0 launch, remove the `X-Robots-Tag: noindex` header from `vercel.json` (it keeps the site out of search until then)

## 9. Build order

1. **Foundation:** repo, linter with fixtures, build script, the React package runtime and generator, `/lab`. Redraw the spike icons to these rules as the first real batch (16 icons).
2. **The set:** draw the remaining icons in category batches. Each batch is reviewed in `/lab` before the next starts.
3. **Package polish:** README, docs comments, package checks before publishing.
4. **Site 1:** home, icon drawer and per-icon pages, guide, craft cards as live demos. Built and reviewed, not announced.
5. **Figma:** sync script and file. Lucas publishes the Community file.
6. **Site 2:** the six craft articles (can run alongside Figma).
7. **1.0:** release checklist, then launch: package, Figma file and site go public together. The site never launches before the Figma file is out.

## 10. Out of scope for v1

Other framework packages (see §12), icon font, solid or duotone variants, a `strokeWidth` prop, dynamic `<Icon name>`, brand logos, an icon editor in the browser, automated releases, Code Connect.

## 11. Open items (Lucas)

- Trademark check for "Merki". The site lives at `merki.lucaslima.design` (decided 2026-10-12); Lucas adds the DNS record in Vercel.
- npm: `merki-icons` is claimed (done 2026-10-10).
- Rename the folder `~/Desktop/arkan-icons` → `~/Desktop/merki` (between sessions, since this one runs inside it).
- GitHub repo `uxlucas/merki` exists (done 2026-10-10). It stays private until launch, so the site's GitHub link only works once it goes public.

## 12. Roadmap after 1.0 (added 2026-10-13)

**More frameworks.** Every target is generated from the same framework-neutral icon data the React package uses; each one is a small runtime plus a generator template. Order by cost:
1. **The web group, together:** Vue, Svelte, plain JS / Web Components, and possibly Solid and Astro. Same SVG, same props (size, color, absoluteStrokeWidth, title). The site gets a framework picker, and "Copy JSX" becomes "Copy for <framework>".
2. **An MCP server** so AI agents can search and fetch Merki icons, built on the same data.
3. **VS Code** (snippets or an icon picker) and **Angular**, which needs its own build tooling.
4. **Native, only if people ask:** React Native (via react-native-svg; absoluteStrokeWidth computed by hand), Flutter and Jetpack Compose (shapes converted to Dart / Kotlin drawing code, separate publishing pipelines).

The cost to weigh is maintenance: each target is another package to publish every release, with its own docs and issues.

**More icons, as new categories.** Each is drawn, reviewed and released like the set (the §8 quality review applies):
- **Media & playback**
- **Commerce & logistics**
- **Connectivity & infrastructure**
- **Advanced text editing**
