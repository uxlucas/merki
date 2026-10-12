# Merki: Site Iteration 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Lucas's first review of Site 1: new headline and type, a mono glitch logo, brand logos and a live star count in the hero, big icon cards with a back-to-top button, a tabbed drawer with a colour/size preview that copies what you see, and motion reworked to the emil-animations rules.

**Architecture:** All changes live in the existing `site/` workspace (branch `site-1`). No new architecture: new small components (`Logo`, `BrandLogos`, `BackToTop`, `StarCount`), new small libs (`stars.ts`, `presence.ts`), and edits to `Hero`, `Browser`, `Drawer`, `Home`, `CopyButton`, `theme.ts`, `copy.ts` and the CSS. Motion is plain CSS transitions plus one presence hook that keeps the drawer mounted while it animates out.

**Tech Stack:** As Site 1 (Vite 7, React 19, vitest 3 + Testing Library + jsdom), plus two font packages: `@fontsource-variable/host-grotesk` and `@fontsource-variable/jetbrains-mono` (both 5.3.0, SIL OFL 1.1).

**Spec:** `docs/specs/2026-10-10-merki-design.md` §6 (revised 2026-10-12 — the revised lines say so). The approved mockups are the companion screen `iter-v2.html` (git-ignored, under `.superpowers/brainstorm/`); the choices were: glitch **A without colour**, cards **2 (big cards, 4 across)**, drawer **3 (Tabs)**.

## Global Constraints

- Everything in the Site 1 plan's Global Constraints still holds (`docs/plans/2026-10-12-merki-site-1.md`): no Python; gate on real exit codes; `npm run build:icons` before tests; CSS imported only from `site/src/entry-client.tsx`; no `window`/`document`/storage during render; storage only via `site/src/lib/storage.ts`; blue (`--blue`) means "how it's built"; copy is verbatim; phone below 768px; commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **New dependencies allowed:** only `@fontsource-variable/host-grotesk` and `@fontsource-variable/jetbrains-mono`. No animation library.
- **Font families:** text `'Inter Variable'`; headings `'Host Grotesk Variable'`; mono `'JetBrains Mono Variable'`.
- **Motion rules** (spec §6 Behaviour, emil-animations): transform and opacity only; open/close uses interruptible CSS **transitions**, not keyframes; enter easing `cubic-bezier(0.32, 0.72, 0, 1)` (token `--ease-out`), exits `cubic-bezier(0.4, 0, 1, 1)` (token `--ease-in`), ~25% faster than enters; never animate arrow-key moves, tab switches, first page load or theme switches; hover motion only inside `@media (hover: hover) and (pointer: fine)`; the existing global `prefers-reduced-motion` rule stays and covers everything.
- **Stable strings for tests:** the hero `<h1>` text is `An icon library that obsesses over details` (the `<br>` sits after "that"; a trailing space before it keeps the words apart on phones); the home `<title>` is `Merki · An icon library that obsesses over details`; the drawer is `<aside aria-label="<name> icon">` with an `<h2>` holding the name; the top-nav logo link's accessible name is `merki-icons home`.
- The site stays in noindex until launch (`vercel.json`); don't touch that.

## Review Focus

1. **The star count when GitHub says no** (repo private → 404, rate-limited → 403, offline → fetch throws, odd JSON): the chip never appears with a wrong or `NaN` number and the link still reads "GitHub". Test: Task 2.
2. **Copy what you see, exactly**: after changing colour and size, the copied SVG has that width/height and every `currentColor` replaced (strokes and solid accents), and the JSX carries `size` and `color`; with nothing changed, the copy is still byte-identical to the package file. Test: Task 4.
3. **Closing the drawer mid-way or twice**: Esc during the exit animation, or Back then Esc, never leaves the site and never leaves a half-faded drawer behind; under reduced motion it unmounts immediately. Test: Task 5.
4. **Keyboard users**: tabs follow the WAI-ARIA tabs pattern (arrow keys between tabs, one tab stop), swatches are a radio group, the back-to-top button isn't focusable while hidden. Tests: Tasks 3 and 4.
5. **No hydration mismatches** from anything new (star count, presence state, back-to-top visibility, tabs). Test: the existing `site/src/hydration.test.tsx` must keep passing unchanged.

---

### Task 1: Type and the glitch logo

**Files:**
- Modify: `site/package.json` (deps), `site/src/entry-client.tsx`, `site/src/styles/tokens.css`, `site/src/styles/base.css`, `site/src/styles/layout.css`, `site/src/styles/hero.css`, `site/src/styles/guide.css`, `site/src/styles/browser.css`, `site/src/components/TopNav.tsx`
- Create: `site/src/components/Logo.tsx`, `site/src/components/Logo.test.tsx`

**Interfaces:**
- Produces: `Logo()` (a `Link` to `/` with class `logo`, accessible name `merki-icons home`); CSS tokens `--font-head`, `--mono` (now JetBrains Mono), `--ease-out`, `--ease-in`.

- [ ] **Step 1: Install the fonts**

Run: `npm i -w site @fontsource-variable/host-grotesk@5.3.0 @fontsource-variable/jetbrains-mono@5.3.0`

In `site/src/entry-client.tsx`, below `import '@fontsource-variable/inter';` add:
```tsx
import '@fontsource-variable/host-grotesk';
import '@fontsource-variable/jetbrains-mono';
```

- [ ] **Step 2: Tokens and where each face applies**

`site/src/styles/tokens.css`, in the `:root, [data-theme='light']` block, replace the `--mono` line and add the new tokens next to `--font`:
```css
  --font-head: 'Host Grotesk Variable', 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --mono: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --ease-out: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
```

Headings use `--font-head`. Add `font-family: var(--font-head);` to: `.hero h1` (hero.css), `.sec-title` (layout.css), `.cat-h` (browser.css), `.prose h1, .prose h2` (guide.css). (The drawer name gets it in Task 4.)

- [ ] **Step 3: Write the failing logo test** `site/src/components/Logo.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RouterProvider } from '../lib/router';
import { Logo } from './Logo';

afterEach(cleanup);

describe('Logo', () => {
  it('links home with the mono wordmark', () => {
    render(<RouterProvider initialPath="/guide/react"><Logo /></RouterProvider>);
    const link = screen.getByRole('link', { name: 'merki-icons home' });
    expect(link.getAttribute('href')).toBe('/');
    const word = link.querySelector('.logo-word')!;
    expect(word.textContent).toBe('merki-icons');
    // The glitch slices copy the wordmark through attr(data-text).
    expect(word.getAttribute('data-text')).toBe('merki-icons');
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
```

Run: `npx vitest run site/src/components/Logo.test.tsx` → FAIL (no module).

- [ ] **Step 4: Write `site/src/components/Logo.tsx`**

```tsx
import { Link } from '../lib/router';
import { LucasMark } from './LucasMark';

/** Lucas's mark + the mono wordmark. CSS (layout.css) glitches it once on hover. */
export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="merki-icons home">
      <span className="logo-mark"><LucasMark size={16} /></span>
      <span className="logo-word" data-text="merki-icons">merki-icons</span>
    </Link>
  );
}
```

In `site/src/components/TopNav.tsx`, replace the existing logo `<Link …>…</Link>` with `<Logo />` (import it; drop the now-unused `DiamondIcon` import).

- [ ] **Step 5: The glitch CSS** (layout.css, replacing the `.logo` rule)

```css
.logo { display: flex; gap: 9px; align-items: center; color: var(--fg); }
.logo-word { position: relative; font: 500 15px/1 var(--mono); letter-spacing: -0.01em; }
.logo-word::before, .logo-word::after { content: attr(data-text); position: absolute; inset: 0; opacity: 0; pointer-events: none; }
@media (hover: hover) and (pointer: fine) {
  .logo:hover .logo-word::before { clip-path: inset(0 0 55% 0); animation: glitch-top 320ms steps(2, end) 1; }
  .logo:hover .logo-word::after { clip-path: inset(45% 0 0 0); animation: glitch-bottom 320ms steps(2, end) 1; }
  .logo:hover .logo-mark { animation: glitch-mark 320ms steps(3, end) 1; }
}
@keyframes glitch-top { 0% { opacity: 1; transform: translateX(-2px); } 50% { opacity: 1; transform: translate(2px, -1px); } 100% { opacity: 0; transform: none; } }
@keyframes glitch-bottom { 0% { opacity: 1; transform: translateX(2px); } 50% { opacity: 1; transform: translate(-2px, 1px); } 100% { opacity: 0; transform: none; } }
@keyframes glitch-mark { 0% { transform: translateX(-1px); } 50% { transform: translateX(1px); } 100% { transform: none; } }
```
The slices use the wordmark's own colour (no colour change, per Lucas). It's a one-shot effect, so keyframes are right here. The global reduced-motion rule zeroes the durations and the slices end at opacity 0.

- [ ] **Step 6: Test, build, commit**

Run: `npx vitest run site/src/components/Logo.test.tsx` → PASS. Then `npm test`, `npm run typecheck`, `npm run build:site` (exit 0, `Prerendered 164 pages.`).

```bash
git add -A site package-lock.json
git commit -m "feat(site): Host Grotesk headings, JetBrains Mono, glitch logo"
```

---

### Task 2: Hero headline, brand logos and the star count

**Files:**
- Create: `site/src/components/BrandLogos.tsx`, `site/src/lib/stars.ts`, `site/src/lib/stars.test.ts`
- Modify: `site/src/test-setup.ts`, `site/src/config.ts`, `site/src/lib/storage.ts`, `site/src/components/Hero.tsx`, `site/src/components/Hero.test.tsx`, `site/src/lib/routes.ts`, `site/src/lib/routes.test.ts`, `site/src/entry-server.test.tsx`, `site/src/styles/hero.css`

**Interfaces:**
- Produces: `FigmaLogo()`, `GitHubMark()`; `formatStars(n: number): string`; `fetchStars(repo, fetchImpl?): Promise<number | null>`; `useStars(repo, fetchImpl?): number | null`; `safeSessionGet`, `safeSessionSet`; `LINKS.githubRepo`.

- [ ] **Step 1: Config and session storage**

`site/src/config.ts`: add `githubRepo: string;` to the `LINKS` type and `githubRepo: 'uxlucas/merki',` to the value.

`site/src/lib/storage.ts`, append:
```ts
function session(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function safeSessionGet(key: string): string | null {
  try {
    return session()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSessionSet(key: string, value: string): void {
  try {
    session()?.setItem(key, value);
  } catch {
    // Storage is blocked: fetch again next time.
  }
}
```

- [ ] **Step 1b: No test may reach the network**

The hero now fetches from GitHub on mount, and many tests render it (Home, hydration). Append to `site/src/test-setup.ts` (shared by every test):
```ts
// No test talks to the network: fetch rejects unless a test stubs it (vi.stubGlobal('fetch', …)).
// Plain assignment, not vi.stubGlobal, so a test's vi.unstubAllGlobals() can't bring the real fetch back.
globalThis.fetch = (async () => {
  throw new Error('network is disabled in tests');
}) as typeof fetch;
```

- [ ] **Step 2: Write the failing stars test** `site/src/lib/stars.test.ts`

```ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchStars, formatStars, useStars } from './stars';

const reply = (status: number, body: unknown) =>
  vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response);

afterEach(() => window.sessionStorage.clear());

describe('formatStars', () => {
  it('shortens thousands', () => {
    expect(formatStars(7)).toBe('7');
    expect(formatStars(999)).toBe('999');
    expect(formatStars(1000)).toBe('1k');
    expect(formatStars(1234)).toBe('1.2k');
    expect(formatStars(25_600)).toBe('25.6k');
  });
});

describe('fetchStars', () => {
  it('reads stargazers_count from the repo endpoint', async () => {
    const f = reply(200, { stargazers_count: 128 });
    expect(await fetchStars('uxlucas/merki', f)).toBe(128);
    expect(f).toHaveBeenCalledWith('https://api.github.com/repos/uxlucas/merki', expect.objectContaining({ headers: { Accept: 'application/vnd.github+json' } }));
  });

  it('gives null when GitHub says no or the reply is odd', async () => {
    expect(await fetchStars('uxlucas/merki', reply(404, { message: 'Not Found' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(403, { message: 'rate limited' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(200, { stargazers_count: 'lots' }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', reply(200, { stargazers_count: -1 }))).toBeNull();
    expect(await fetchStars('uxlucas/merki', vi.fn(async () => { throw new Error('offline'); }))).toBeNull();
  });
});

describe('useStars', () => {
  it('starts empty, then shows the count and caches it for the session', async () => {
    const f = reply(200, { stargazers_count: 42 });
    const { result } = renderHook(() => useStars('uxlucas/merki', f));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(42));
    const again = reply(200, { stargazers_count: 99 });
    const second = renderHook(() => useStars('uxlucas/merki', again));
    await waitFor(() => expect(second.result.current).toBe(42));
    expect(again).not.toHaveBeenCalled();
  });

  it('stays empty when the fetch fails', async () => {
    const { result } = renderHook(() => useStars('uxlucas/merki', reply(404, {})));
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current).toBeNull();
  });
});
```

Run it → FAIL (no module).

- [ ] **Step 3: Write `site/src/lib/stars.ts`**

```ts
import { useEffect, useState } from 'react';
import { safeSessionGet, safeSessionSet } from './storage';

const CACHE_KEY = 'merki-stars';

export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = Math.round(n / 100) / 10;
  return `${Number.isInteger(k) ? k.toFixed(0) : k}k`;
}

/** The repo's star count, or null when GitHub won't say (private, rate-limited, offline, odd reply). */
export async function fetchStars(repo: string, fetchImpl: typeof fetch = globalThis.fetch): Promise<number | null> {
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const count = (await res.json() as { stargazers_count?: unknown }).stargazers_count;
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}

/** Null on the server and on first render (no hydration mismatch); fills in after the fetch. */
export function useStars(repo: string, fetchImpl?: typeof fetch): number | null {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    const cached = Number(safeSessionGet(CACHE_KEY));
    if (safeSessionGet(CACHE_KEY) !== null && Number.isInteger(cached) && cached >= 0) {
      setStars(cached);
      return;
    }
    let live = true;
    void fetchStars(repo, fetchImpl).then((count) => {
      if (!live || count === null) return;
      safeSessionSet(CACHE_KEY, String(count));
      setStars(count);
    });
    return () => {
      live = false;
    };
  }, [repo, fetchImpl]);
  return stars;
}
```

Run: `npx vitest run site/src/lib/stars.test.ts` → PASS.

- [ ] **Step 4: Brand logos** `site/src/components/BrandLogos.tsx`

```tsx
/** The full-colour Figma logo (Figma's brand colours), for the hero link. */
export function FigmaLogo() {
  return (
    <svg width="11" height="16" viewBox="0 0 38 57" aria-hidden="true" focusable="false" className="lead">
      <path fill="#F24E1E" d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19V0z" />
      <path fill="#FF7262" d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19V0z" />
      <path fill="#A259FF" d="M19 19H9.5a9.5 9.5 0 0 0 0 19H19V19z" />
      <circle fill="#1ABCFE" cx="28.5" cy="28.5" r="9.5" />
      <path fill="#0ACF83" d="M9.5 38a9.5 9.5 0 1 0 9.5 9.5V38H9.5z" />
    </svg>
  );
}

/** GitHub's mark, in the text colour. */
export function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" className="lead">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
```

- [ ] **Step 5: Hero, title and tests**

In `site/src/components/Hero.tsx`:
- Replace the `<h1>` content with:
```tsx
        {/* The trailing space keeps the words apart on phones, where the <br> is hidden. */}
        {'An icon library that '}
        <br />
        obsesses over details
```
  and remove the now-unused `icons` import.
- In `FigmaLink`, replace `<PaletteIcon className="lead" />` with `<FigmaLogo />`.
- Replace the GitHub `<a>` body with the mark, the label and the star chip:
```tsx
function GitHubLink() {
  const stars = useStars(LINKS.githubRepo);
  return (
    <a className="hero-link" href={LINKS.github} target="_blank" rel="noreferrer">
      <GitHubMark />
      <span className="label">GitHub</span>
      {stars !== null && (
        <span className="stars" aria-label={`${stars} stars`}>
          <StarIcon size={12} />
          {formatStars(stars)}
        </span>
      )}
      <ArrowUpRightIcon size={14} className="trail" />
    </a>
  );
}
```
  and render `<GitHubLink />` in place of the old GitHub anchor. Drop the unused `CodeIcon`/`PaletteIcon` imports; import `StarIcon` from `merki-icons`, `FigmaLogo`/`GitHubMark` from `./BrandLogos`, `formatStars`/`useStars` from `../lib/stars`.

`site/src/styles/hero.css`, add:
```css
.stars { display: inline-flex; gap: 4px; align-items: center; font-size: 12px; color: var(--fg2); background: var(--hov); border-radius: 999px; padding: 1px 8px; font-variant-numeric: tabular-nums; animation: stars-in 200ms var(--ease-out); }
@keyframes stars-in { from { opacity: 0; } }
```
(A one-shot fade when the count arrives; never present on first paint.)

In `site/src/lib/routes.ts`, the home title becomes `Merki · An icon library that obsesses over details` (keep the `count` parameter; other pages don't change).

Update the tests to the new copy:
- `site/src/components/Hero.test.tsx`: the heading assertion becomes `.toBe('An icon library that obsesses over details')`. Add `vi.unstubAllGlobals(); window.sessionStorage.clear();` to its `afterEach`, and these two tests:
```tsx
  it('shows the star count once GitHub answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ stargazers_count: 1234 }) })));
    render(<Hero />);
    expect(await screen.findByText('1.2k')).toBeTruthy();
  });

  it('reads just "GitHub" when the repo is private', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    render(<Hero />);
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByRole('link', { name: /GitHub/ }).textContent).toBe('GitHub');
  });
```
- `site/src/lib/routes.test.ts`: the home title expectation becomes `'Merki · An icon library that obsesses over details'`.
- `site/src/entry-server.test.tsx`: home contains `An icon library that` and the head contains `<title>Merki · An icon library that obsesses over details</title>`.
- Search the repo for any other `157 icons for software` assertion (`grep -rn "icons for software" site/src`) and update it the same way.

- [ ] **Step 6: Test, build, commit**

Run: `npm test`, `npm run typecheck`, `npm run build:site` (exit 0, `Prerendered 164 pages.`). The hydration test must pass unchanged (the star chip is absent on the server and on first render).

```bash
git add -A site
git commit -m "feat(site): new headline, Figma and GitHub logos, live star count"
```

---

### Task 3: Big icon cards and back to top

**Files:**
- Create: `site/src/components/BackToTop.tsx`, `site/src/components/BackToTop.test.tsx`
- Modify: `site/src/components/Browser.tsx`, `site/src/components/Browser.test.tsx`, `site/src/pages/Home.tsx`, `site/src/styles/browser.css`, `site/src/styles/layout.css`

**Interfaces:**
- Consumes: `Browser` (Task 5 of Site 1), `usePrefs`.
- Produces: icon cards are still `button.cell[data-name]` (Home and the grid-nav rely on that); `BackToTop({ watch: string })` where `watch` is a CSS selector for the element whose disappearance shows the button.

- [ ] **Step 1: Cards in the browser**

In `site/src/components/Browser.tsx`, the cell button keeps its class, `data-name`, `aria-current`, roving `tabIndex`, `onFocus` and `onClick`, but drops `aria-label` (its visible name now names it) and renders the icon plus the name:
```tsx
                  <button
                    key={icon.name}
                    type="button"
                    className="cell"
                    data-name={icon.name}
                    aria-current={selected === icon.name ? 'true' : undefined}
                    tabIndex={icon.name === tabStop ? 0 : -1}
                    onFocus={() => setActive(icon.name)}
                    onClick={() => onOpen(icon.name)}
                  >
                    <Icon component={icon.component} size={size} />
                    <span className="cell-name">{icon.name}</span>
                  </button>
```

`site/src/styles/browser.css`: the category wrapper stops being a card (the cards are the cards now), and the grid becomes 4 big cards across (2 on phones). Replace the `.cat`, `.cat-h`, `.grid`, `.cell*` rules with:
```css
.cat { margin-bottom: 28px; scroll-margin-top: 72px; }
.cat-h { display: flex; gap: 8px; align-items: baseline; font-size: 14px; font-weight: 500; margin: 0 2px 10px; }
.cat-h span { color: var(--fg3); font-weight: 400; font-variant-numeric: tabular-nums; }
.grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.cell { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; height: 150px; border-radius: 18px; background: var(--card); border: 1px solid var(--line); color: var(--fg); }
.cell-name { font: 12.5px/1.2 var(--mono); color: var(--fg-nav); max-width: 100%; padding: 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell[aria-current='true'] { border-color: var(--fg); box-shadow: 0 0 0 1px var(--fg); }
```
and in the phone block replace the `.grid` line with:
```css
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .cell { height: 120px; }
```
(Hover and press motion for `.cell` come in Task 5.)

Update `site/src/components/Browser.test.tsx`: the 157-cells assertion becomes `expect(document.querySelectorAll('.cell')).toHaveLength(157)`, and add `expect(screen.getByRole('button', { name: 'calendar' }).textContent).toBe('calendar')`. Keep every other test (they find cells by name, which now comes from the visible text).

- [ ] **Step 2: Write the failing back-to-top test** `site/src/components/BackToTop.test.tsx`

```tsx
// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackToTop } from './BackToTop';

let fire: (visible: boolean) => void = () => {};
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) {
      fire = (visible) => cb([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {}
    disconnect() {}
  });
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const setup = () =>
  render(
    <>
      <a className="logo" href="/">logo</a>
      <section className="hero">hero</section>
      <BackToTop watch=".hero" />
    </>,
  );

describe('BackToTop', () => {
  it('stays hidden and unfocusable while the hero is in view', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Back to top', hidden: true });
    expect(button.getAttribute('data-visible')).toBe('false');
    expect(button.getAttribute('tabindex')).toBe('-1');
    expect(button.getAttribute('aria-hidden')).toBe('true');
  });

  it('appears once the hero leaves, and goes back up', () => {
    setup();
    act(() => fire(false));
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button.getAttribute('data-visible')).toBe('true');
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(document.activeElement?.className).toBe('logo');
  });
});
```

Run it → FAIL (no module).

- [ ] **Step 3: Write `site/src/components/BackToTop.tsx`**

```tsx
import { ArrowUpIcon } from 'merki-icons';
import { useEffect, useState } from 'react';

/** Shows once `watch` scrolls out of view; scrolls to the top and puts focus back on the logo. */
export function BackToTop({ watch }: { watch: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(watch);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  const toTop = () => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.logo')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className="to-top"
      aria-label="Back to top"
      data-visible={visible}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={toTop}
    >
      <ArrowUpIcon size={16} />
    </button>
  );
}
```

In `site/src/pages/Home.tsx`, render `<BackToTop watch=".hero" />` right after `<CraftCards />`'s section (inside the Layout children, at the end).

`site/src/styles/layout.css`, add:
```css
.to-top { position: fixed; right: 24px; bottom: 24px; z-index: 15; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); color: var(--fg2); box-shadow: 0 4px 14px var(--shadow); opacity: 0; transform: translateY(8px); pointer-events: none; transition: opacity 150ms var(--ease-in), transform 150ms var(--ease-in); }
.to-top[data-visible='true'] { opacity: 1; transform: none; pointer-events: auto; transition-duration: 200ms; transition-timing-function: var(--ease-out); }
@media (max-width: 767px) { .to-top { right: 16px; bottom: 16px; } }
```
(When the drawer is open on desktop it covers the right edge; the button sits under it, which is fine — `z-index` 15 < drawer 20.)

- [ ] **Step 4: Test, build, commit**

Run: `npx vitest run site/src/components/BackToTop.test.tsx site/src/components/Browser.test.tsx` → PASS. Then `npm test`, `npm run typecheck`, `npm run build:site`.

```bash
git add -A site
git commit -m "feat(site): big icon cards and a back-to-top button"
```

---

### Task 4: The tabbed drawer and copy-what-you-see

**Files:**
- Modify: `site/src/lib/copy.ts`, `site/src/lib/copy.test.ts`, `site/src/components/Drawer.tsx`, `site/src/pages/Home.tsx`, `site/src/pages/Home.test.tsx`, `site/src/styles/drawer.css`
- Create: `site/src/components/Drawer.test.tsx`

**Interfaces:**
- Consumes: `Construction`, `CopyButton`, `Icon`, `categoryLabel`, `iconByName`.
- Produces: `interface Look { color: string | null; size: number }`, `DEFAULT_LOOK`, `isDefaultLook(look)`, `customSvg(svg, look)`, `jsxSnippet(component, look?)`; `Drawer({ icon, onClose })` (the `compact` prop and the phone "All details" expansion go away).

- [ ] **Step 1: Write the failing copy tests** (append to `site/src/lib/copy.test.ts`)

```ts
describe('copy what you see', () => {
  const calendar = icons.find((i) => i.name === 'calendar')!;

  it('is the package file when nothing changed', () => {
    expect(customSvg(calendar.svg, DEFAULT_LOOK)).toBe(pkgSvg('calendar'));
    expect(jsxSnippet('CalendarIcon', DEFAULT_LOOK)).toBe('<CalendarIcon />');
  });

  it('carries the size and colour, including solid accents', () => {
    const out = customSvg(calendar.svg, { color: '#2563eb', size: 24 });
    expect(out.startsWith('<svg width="24" height="24" ')).toBe(true);
    expect(out).not.toContain('currentColor');
    expect(out.match(/#2563eb/g)!.length).toBe(calendar.svg.match(/currentColor/g)!.length);
    expect(out.endsWith('\n')).toBe(true);
  });

  it('can change only one of them', () => {
    expect(customSvg(calendar.svg, { color: null, size: 32 })).toContain('currentColor');
    expect(customSvg(calendar.svg, { color: null, size: 32 }).startsWith('<svg width="32" height="32" ')).toBe(true);
    expect(jsxSnippet('CalendarIcon', { color: null, size: 32 })).toBe('<CalendarIcon size={32} />');
    expect(jsxSnippet('CalendarIcon', { color: '#16a34a', size: 16 })).toBe('<CalendarIcon color="#16a34a" />');
    expect(jsxSnippet('CalendarIcon', { color: '#16a34a', size: 40 })).toBe('<CalendarIcon size={40} color="#16a34a" />');
  });

  it('knows the default look', () => {
    expect(isDefaultLook(DEFAULT_LOOK)).toBe(true);
    expect(isDefaultLook({ color: null, size: 20 })).toBe(false);
    expect(isDefaultLook({ color: '#e11d48', size: 16 })).toBe(false);
  });
});
```
(Import `customSvg`, `DEFAULT_LOOK`, `isDefaultLook` alongside the existing imports.)

Run: `npx vitest run site/src/lib/copy.test.ts` → FAIL.

- [ ] **Step 2: Extend `site/src/lib/copy.ts`**

Replace `jsxSnippet` and add the look helpers:
```ts
/** What the drawer's Preview tab has set. `color: null` means currentColor. */
export interface Look {
  color: string | null;
  size: number;
}

export const DEFAULT_LOOK: Look = { color: null, size: 16 };

export const isDefaultLook = (look: Look): boolean => look.color === null && look.size === DEFAULT_LOOK.size;

/** The SVG as shown: the package file when untouched, otherwise with the chosen size and colour baked in. */
export function customSvg(svg: string, look: Look): string {
  const sized = `${svg.replace(/^<svg\b/, `<svg width="${look.size}" height="${look.size}"`)}\n`;
  return look.color ? sized.replace(/currentColor/g, look.color) : sized;
}

export function jsxSnippet(component: string, look: Look = DEFAULT_LOOK): string {
  const props = [look.size !== DEFAULT_LOOK.size ? `size={${look.size}}` : null, look.color ? `color="${look.color}"` : null].filter(Boolean);
  return props.length ? `<${component} ${props.join(' ')} />` : `<${component} />`;
}
```
(`packageSvg` and `clipboardSvg` stay as they are; `customSvg(svg, DEFAULT_LOOK)` equals `packageSvg(svg)`, which the test pins.)

Run the copy tests → PASS.

- [ ] **Step 3: Write the failing drawer test** `site/src/components/Drawer.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iconByName } from '../data/icons';
import { Drawer } from './Drawer';

afterEach(cleanup);
const calendar = iconByName.get('calendar')!;
const setup = () => render(<Drawer icon={calendar} onClose={vi.fn()} />);

describe('Drawer', () => {
  it('leads with the crumb, the name and the tags', () => {
    setup();
    const aside = screen.getByRole('complementary', { name: 'calendar icon' });
    expect(within(aside).getByRole('heading', { level: 2 }).textContent).toBe('calendar');
    expect(within(aside).getByText(calendar.tags[0])).toBeTruthy();
    expect(aside.querySelector('.drawer-crumb')?.textContent).toContain('Objects');
  });

  it('switches tabs with clicks and arrow keys, one tab stop', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Preview', 'Construction', 'In context']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(tabs[0].id);
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
    expect(screen.getAllByRole('tab')[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: 'Keylines' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('tab')[2]);
    expect(screen.getByRole('tabpanel').textContent).toContain('Inbox');
  });

  it('previews a colour and a size, copies them, and resets', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Size' }), { target: { value: '32' } });
    const preview = document.querySelector('.preview svg')!;
    expect(preview.getAttribute('width')).toBe('32');
    expect(preview.getAttribute('color')).toBe('#2563eb');
    expect(screen.getByText('#2563EB')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(document.querySelector('.preview svg')!.getAttribute('width')).toBe('16');
    expect(screen.getByRole('radio', { name: 'Default' }).getAttribute('aria-checked')).toBe('true');
  });
});
```

Run it → FAIL.

- [ ] **Step 4: Rewrite `site/src/components/Drawer.tsx`**

```tsx
import { CodeIcon, CopyIcon, DownloadIcon, InboxIcon, RefreshIcon, TagIcon, XIcon } from 'merki-icons';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { categoryLabel, type SiteIcon } from '../data/icons';
import { DEFAULT_LOOK, customSvg, downloadSvg, isDefaultLook, jsxSnippet, type Look } from '../lib/copy';
import { Construction } from './Construction';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

const SWATCHES: Array<{ label: string; value: string | null }> = [
  { label: 'Default', value: null },
  { label: 'Grey', value: '#71717a' },
  { label: 'Red', value: '#e11d48' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Violet', value: '#7c3aed' },
];
const TABS = ['Preview', 'Construction', 'In context'] as const;
type Tab = (typeof TABS)[number];

export function Drawer({ icon, onClose }: { icon: SiteIcon; onClose: () => void }) {
  const id = useId();
  const [tab, setTab] = useState<Tab>('Preview');
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [keylines, setKeylines] = useState(true);
  const [points, setPoints] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // WAI-ARIA tabs: arrows move and select, Home/End jump. No animation on switch.
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + TABS.length) % TABS.length;
    setTab(TABS[wrapped]);
    tabRefs.current[wrapped]?.focus();
  };

  const swatchKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const nextIndex = (index + step + SWATCHES.length) % SWATCHES.length;
    setLook((l) => ({ ...l, color: SWATCHES[nextIndex].value }));
    (event.currentTarget.parentElement?.children[nextIndex] as HTMLElement | undefined)?.focus();
  };

  return (
    <>
      <div className="scrim" aria-hidden="true" onClick={onClose} />
      <aside className="drawer" aria-label={`${icon.name} icon`}>
        <header className="drawer-head">
          <div>
            <p className="drawer-crumb">{categoryLabel(icon.category)}</p>
            <h2 className="drawer-name">{icon.name}</h2>
            <ul className="drawer-tags" aria-label="Tags">
              {icon.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </header>

        <div className="stage">
          {tab === 'Preview' && (
            <div className="preview">
              <Icon component={icon.component} size={look.size} color={look.color ?? undefined} />
            </div>
          )}
          {tab === 'Construction' && (
            <>
              <Construction svg={icon.svg} size={196} keylines={keylines} points={points} handles={points} />
              <div className="stage-toggles">
                <button type="button" className="pill" aria-pressed={keylines} onClick={() => setKeylines((on) => !on)}>Keylines</button>
                <button type="button" className="pill" aria-pressed={points} onClick={() => setPoints((on) => !on)}>Points</button>
              </div>
            </>
          )}
          {tab === 'In context' && (
            <div className="context">
              <div className="menu">
                <div className="menu-item"><InboxIcon /><span>Inbox</span></div>
                <div className="menu-item hover"><Icon component={icon.component} /><span>{icon.name}</span></div>
                <div className="menu-item"><TagIcon /><span>Labels</span></div>
              </div>
              <div className="context-col">
                <span className="ctx-btn"><Icon component={icon.component} />Action</span>
                <span className="ctx-input"><Icon component={icon.component} /><span>Search or type…</span></span>
              </div>
            </div>
          )}
        </div>

        <div className="tabs" role="tablist" aria-label="View">
          {TABS.map((name, index) => (
            <button
              key={name}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={tab === name}
              aria-controls={`${id}-panel`}
              tabIndex={tab === name ? 0 : -1}
              onClick={() => setTab(name)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="tab-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${TABS.indexOf(tab)}`}>
          {tab === 'Preview' && (
            <div className="look">
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {SWATCHES.map((swatch, index) => (
                  <button
                    key={swatch.label}
                    type="button"
                    role="radio"
                    aria-label={swatch.label}
                    aria-checked={look.color === swatch.value}
                    tabIndex={look.color === swatch.value ? 0 : -1}
                    className="swatch-dot"
                    style={{ ['--c' as string]: swatch.value ?? 'var(--fg)' }}
                    onClick={() => setLook((l) => ({ ...l, color: swatch.value }))}
                    onKeyDown={(event) => swatchKey(event, index)}
                  />
                ))}
                <span className="hex">{look.color ? look.color.toUpperCase() : 'currentColor'}</span>
              </div>
              <label className="size-row">
                <span>Size</span>
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={1}
                  value={look.size}
                  aria-label="Size"
                  onChange={(event) => setLook((l) => ({ ...l, size: Number(event.target.value) }))}
                />
                <b>{look.size}px</b>
              </label>
            </div>
          )}
          {tab === 'Construction' && <p className="tab-note">The 16px grid and the four keylines every icon is drawn on.</p>}
          {tab === 'In context' && <p className="tab-note">At 16px, where it will live: a menu row, a button, an input.</p>}
        </div>

        <div className="actions">
          <CopyButton className="action primary" text={customSvg(icon.svg, look).trimEnd()} label="Copy SVG" icon={CopyIcon} />
          <CopyButton text={jsxSnippet(icon.component, look)} label="Copy JSX" icon={CodeIcon} />
          <button type="button" className="action square" aria-label="Download" onClick={() => downloadSvg(icon.name, customSvg(icon.svg, look))}>
            <DownloadIcon size={14} />
          </button>
          {!isDefaultLook(look) && (
            <button type="button" className="action square" aria-label="Reset" onClick={() => setLook(DEFAULT_LOOK)}>
              <RefreshIcon size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
```

Note on Copy SVG: with the default look, `customSvg(svg, DEFAULT_LOOK).trimEnd()` equals the old `clipboardSvg(svg)`, so the existing byte-for-byte copy test still holds. `clipboardSvg` can stay exported (other code/tests may use it).

In `site/src/pages/Home.tsx`: remove the `compact` state and everything that sets it, and render `<Drawer icon={icon} onClose={close} />`. Keep every other behaviour (open/move/close, the closing ref, Esc, focus return).

`site/src/pages/Home.test.tsx`: the "Download" button is now an icon button named "Download" (still `getByRole('button', { name: /Download/ })`); no other change expected. Fix any test that referenced `All details`.

- [ ] **Step 5: Drawer CSS** — replace `site/src/styles/drawer.css` with:

```css
.drawer { position: fixed; top: 12px; right: 12px; bottom: 12px; width: 430px; z-index: 20; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; background: var(--card); border: 1px solid var(--line); border-radius: 20px; box-shadow: 0 12px 40px var(--shadow); padding: 20px; }
.scrim { display: none; }
.drawer-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.drawer-crumb { margin: 0; font-size: 12px; color: var(--fg-nav); }
.drawer-name { margin: 2px 0 8px; font: 500 22px/1.2 var(--font-head); letter-spacing: -0.02em; }
.drawer-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.drawer-tags li { font: 11.5px/1.6 var(--mono); color: var(--fg-nav); background: var(--hov); border-radius: 6px; padding: 0 7px; }
.stage { position: relative; display: grid; place-items: center; height: 220px; border-radius: 14px; border: 1px solid var(--line2); background-color: var(--stage); }
.preview { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 13px; color: var(--fg); background-image: linear-gradient(45deg, var(--hov) 25%, transparent 25%), linear-gradient(-45deg, var(--hov) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--hov) 75%), linear-gradient(-45deg, transparent 75%, var(--hov) 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0; }
.stage-toggles { position: absolute; left: 12px; bottom: 10px; display: flex; gap: 6px; }
.pill { font-size: 12px; border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; color: var(--fg-nav); background: var(--card); }
.pill[aria-pressed='true'] { color: var(--blue); border-color: color-mix(in srgb, var(--blue) 35%, transparent); background: color-mix(in srgb, var(--blue) 8%, transparent); }
.tabs { display: flex; gap: 4px; padding: 3px; border-radius: 10px; background: var(--hov); font-size: 12.5px; }
.tabs [role='tab'] { flex: 1; padding: 4px 0; border-radius: 7px; color: var(--fg-nav); }
.tabs [role='tab'][aria-selected='true'] { background: var(--card); color: var(--fg); font-weight: 500; box-shadow: 0 1px 2px var(--shadow); }
.tab-panel { min-height: 64px; }
.tab-note { margin: 0; font-size: 12.5px; color: var(--fg-nav); }
.look { display: flex; flex-direction: column; gap: 12px; }
.swatches { display: flex; gap: 8px; align-items: center; }
.swatch-dot { width: 22px; height: 22px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
.swatch-dot[aria-checked='true'] { box-shadow: 0 0 0 2px var(--card), 0 0 0 3.5px var(--c); }
.hex { margin-left: auto; font: 12px var(--mono); color: var(--fg-nav); }
.size-row { display: flex; gap: 12px; align-items: center; font-size: 12.5px; color: var(--fg-nav); }
.size-row input { flex: 1; accent-color: var(--fg); }
.size-row b { width: 40px; text-align: right; font: 500 12px var(--mono); color: var(--fg); }
.context { display: flex; gap: 12px; align-items: center; }
.context .menu { width: 160px; }
.context-col { display: flex; flex-direction: column; gap: 8px; }
.ctx-btn, .ctx-input { display: inline-flex; gap: 8px; align-items: center; border: 1px solid var(--line); border-radius: 9px; padding: 6px 11px; font-size: 12.5px; background: var(--card); }
.ctx-input { color: var(--fg3); min-width: 150px; }
.actions { display: flex; gap: 8px; margin-top: auto; padding-top: 14px; border-top: 1px solid var(--line2); }
.action { flex: 1; display: inline-flex; gap: 7px; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 10px; padding: 8px 0; font-size: 13px; background: var(--card); }
.action.square { flex: 0 0 40px; }
.action.primary { background: var(--inv); color: var(--inv-fg); border-color: var(--inv); }

@media (max-width: 767px) {
  .scrim { display: block; position: fixed; inset: 0; z-index: 19; background: rgba(0, 0, 0, 0.25); }
  .drawer { top: auto; left: 0; right: 0; bottom: 0; width: auto; max-height: 88vh; border-radius: 22px 22px 0 0; border-width: 1px 0 0; padding: 10px 16px 20px; }
  .drawer::before { content: ''; flex: none; width: 36px; height: 4px; border-radius: 2px; background: var(--line); align-self: center; }
  .stage { height: 170px; }
  .context { flex-wrap: wrap; }
}
```
(Enter/exit motion for the drawer, scrim and sheet arrives in Task 5; until then they appear and disappear without animation. The swatch colours are user choices, not the construction blue, so the blue-means-construction rule isn't affected; the swatch ring and dot use `--c`.)

- [ ] **Step 6: Test, build, commit**

Run: `npx vitest run site/src/lib/copy.test.ts site/src/components/Drawer.test.tsx site/src/pages/Home.test.tsx` → PASS. Then `npm test`, `npm run typecheck`, `npm run build:site`.

```bash
git add -A site
git commit -m "feat(site): tabbed drawer with a colour and size preview that copies what you see"
```

---

### Task 5: Motion

**Files:**
- Create: `site/src/lib/presence.ts`, `site/src/lib/presence.test.tsx`
- Modify: `site/src/pages/Home.tsx`, `site/src/pages/Home.test.tsx`, `site/src/components/Drawer.tsx`, `site/src/components/CopyButton.tsx`, `site/src/components/Hero.tsx` (npm button icon swap), `site/src/lib/theme.ts`, `site/src/lib/theme.test.ts`, `site/src/styles/drawer.css`, `site/src/styles/browser.css`, `site/src/styles/base.css`, `site/src/styles/layout.css`

**Interfaces:**
- Produces: `usePresence<T>(value: T | null, exitMs: number): { current: T | null; state: 'open' | 'closing' }`; `Drawer` gains `state: 'open' | 'closing'` (rendered as `data-state`); `toggleTheme` pauses transitions during the switch.

- [ ] **Step 1: Write the failing presence test** `site/src/lib/presence.test.tsx`

```tsx
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePresence } from './presence';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('usePresence', () => {
  it('keeps the last value while it animates out, then drops it', () => {
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    expect(result.current).toEqual({ current: 'calendar', state: 'open' });
    rerender({ v: null });
    expect(result.current).toEqual({ current: 'calendar', state: 'closing' });
    act(() => vi.advanceTimersByTime(179));
    expect(result.current.current).toBe('calendar');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual({ current: null, state: 'open' });
  });

  it('follows a new value at once and cancels a pending exit', () => {
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    rerender({ v: null });
    rerender({ v: 'bell' });
    expect(result.current).toEqual({ current: 'bell', state: 'open' });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toEqual({ current: 'bell', state: 'open' });
  });

  it('drops at once under reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { result, rerender } = renderHook(({ v }) => usePresence(v, 180), { initialProps: { v: 'calendar' as string | null } });
    rerender({ v: null });
    expect(result.current).toEqual({ current: null, state: 'open' });
    // @ts-expect-error cleanup of the stub
    delete window.matchMedia;
  });
});
```

Run it → FAIL.

- [ ] **Step 2: Write `site/src/lib/presence.ts`**

```ts
import { useEffect, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps the last non-null value mounted for `exitMs` after `value` turns null, so CSS can animate it out.
 * A new value replaces it immediately (switching icons never animates). Under reduced motion it drops at once.
 */
export function usePresence<T>(value: T | null, exitMs: number): { current: T | null; state: 'open' | 'closing' } {
  const [shown, setShown] = useState<{ current: T | null; state: 'open' | 'closing' }>({ current: value, state: 'open' });

  if (value !== null && (shown.current !== value || shown.state !== 'open')) {
    setShown({ current: value, state: 'open' });
  } else if (value === null && shown.current !== null && shown.state === 'open') {
    setShown(reducedMotion() ? { current: null, state: 'open' } : { current: shown.current, state: 'closing' });
  }

  useEffect(() => {
    if (shown.state !== 'closing') return;
    const timer = setTimeout(() => setShown({ current: null, state: 'open' }), exitMs);
    return () => clearTimeout(timer);
  }, [shown.state, exitMs]);

  return shown;
}
```
(Reading `matchMedia` here only happens on a client-side change from an icon to none, never on the server or the first render, so hydration is unaffected. The adjust-state-during-render pattern is React's documented way to derive state from a prop change; it keeps server and first client render identical.)

Run the presence test → PASS.

- [ ] **Step 3: Drawer enter/exit**

In `site/src/pages/Home.tsx`:
```tsx
  const presence = usePresence(icon, 180);
  // …
        {presence.current && <Drawer icon={presence.current} state={presence.state} onClose={close} />}
```

In `site/src/components/Drawer.tsx`: accept `state: 'open' | 'closing'` (default `'open'`), put `data-state={state}` on both the scrim and the `<aside>`, and while closing make the aside inert to people and assistive tech: `aria-hidden={state === 'closing' || undefined}` and `inert={state === 'closing' || undefined}` (React 19 supports the boolean `inert` prop).

`site/src/styles/drawer.css` — the panel enters on mount with a one-shot keyframe (it has no prior state to transition from), and leaves with a transition, so a close can't restart the enter:
```css
.drawer { animation: drawer-in 240ms var(--ease-out); transition: opacity 180ms var(--ease-in), transform 180ms var(--ease-in); will-change: transform; }
.drawer[data-state='closing'] { opacity: 0; transform: translateX(8px); pointer-events: none; }
@keyframes drawer-in { from { opacity: 0; transform: translateX(16px); } }
@media (max-width: 767px) {
  .scrim { animation: scrim-in 280ms var(--ease-out); transition: opacity 200ms var(--ease-in); }
  .scrim[data-state='closing'] { opacity: 0; pointer-events: none; }
  .drawer { animation: sheet-in 280ms var(--ease-out); transition-duration: 200ms; }
  .drawer[data-state='closing'] { transform: translateY(24px); }
}
@keyframes scrim-in { from { opacity: 0; } }
@keyframes sheet-in { from { opacity: 0; transform: translateY(24px); } }
```
Rule check: switching icons with arrow keys only changes the `icon` prop of a mounted drawer, so nothing replays (no remount: render the Drawer without a `key` tied to the icon).

`site/src/pages/Home.test.tsx`: the existing "drawer is gone" assertions use `waitFor`, which outlasts the 180ms exit; while closing the aside is `aria-hidden`, so `queryByRole('complementary', …)` already returns null. Add one test: after Escape, the aside element still exists with `data-state="closing"` immediately, and is removed from the DOM after `waitFor`.

- [ ] **Step 4: Small motions**

`site/src/components/CopyButton.tsx` — cross-fade the icon instead of swapping it:
```tsx
    <button type="button" className={className} onClick={() => copy(text)}>
      <span className="swap" data-state={state === 'copied' ? 'copied' : 'idle'} aria-hidden="true">
        <Glyph size={14} className="swap-a" />
        <CheckIcon size={14} className="swap-b" />
      </span>
      <span>{state === 'failed' ? "Couldn't copy" : label}</span>
      <span className="sr-only" aria-live="polite">{state === 'copied' ? 'Copied' : ''}</span>
    </button>
```
Do the same for the npm button's trailing icon in `Hero.tsx` (`<span className="trail swap" data-state=…>` with `CopyIcon` + `CheckIcon`).

`site/src/styles/base.css`, add:
```css
.swap { display: grid; }
.swap > * { grid-area: 1 / 1; transition: opacity 150ms var(--ease-out), scale 150ms var(--ease-out); }
.swap .swap-b, .swap[data-state='copied'] .swap-a { opacity: 0; scale: 0.6; }
.swap[data-state='copied'] .swap-b { opacity: 1; scale: 1; }
.action, .hero-link { transition: scale 150ms var(--ease-out); }
.cell:active, .action:active, button.hero-link:active, .to-top:active { scale: 0.97; }
.theme-switching, .theme-switching * { transition: none !important; }
```
(For the npm button in Hero, give the swap span both `trail` and `swap` classes and its icons `swap-a`/`swap-b`.)

`site/src/styles/browser.css`, add (hover only on real pointers):
```css
.cell { transition: scale 150ms var(--ease-out), border-color 150ms ease; }
@media (hover: hover) and (pointer: fine) { .cell:hover { border-color: var(--fg3); } }
```

`site/src/styles/layout.css`, the phone menu fades in (one-shot enter; closing is instant, which is the quieter exit):
```css
@media (max-width: 767px) { .sidebar.open { animation: menu-in 200ms var(--ease-out); } }
@keyframes menu-in { from { opacity: 0; transform: translateY(-6px); } }
```

Keep the `.to-top` transitions from Task 3 (they already follow the rules). Remove any leftover `drawer-in 0.22s var(--ease)` from Site 1 if it survived Task 4's CSS rewrite.

- [ ] **Step 5: Pause transitions during theme switches**

`site/src/lib/theme.ts` — `toggleTheme` adds a class for two frames so colours don't all animate:
```ts
export function toggleTheme(root: HTMLElement = document.documentElement): Theme {
  const next: Theme = currentTheme(root) === 'dark' ? 'light' : 'dark';
  root.classList.add('theme-switching');
  applyTheme(next, root);
  safeSet(THEME_KEY, next);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  return next;
}
```
Add to `site/src/lib/theme.test.ts`:
```ts
  it('pauses transitions while the theme flips', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    document.documentElement.dataset.theme = 'light';
    toggleTheme();
    expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
    frames.shift()!(0);
    frames.shift()!(0);
    expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
    vi.unstubAllGlobals();
  });
```

- [ ] **Step 6: Test, build, commit**

Run: `npx vitest run site/src/lib/presence.test.tsx site/src/pages/Home.test.tsx site/src/lib/theme.test.ts` → PASS. Then `npm test` (the hydration test must pass unchanged), `npm run typecheck`, `npm run build:site`.

```bash
git add -A site
git commit -m "feat(site): motion — drawer and sheet exits, copy cross-fade, press and hover, calm theme switch"
```

---

### Task 6: Browser check (controller)

Done by the controller in the browser pane, not a subagent.

- [ ] **Step 1:** `npm run build:site`, then serve `site/dist` with `vite preview` (port 5292).
- [ ] **Step 2:** Walk the changes at 1280px and 375px, light and dark:
  - the logo glitch on hover
  - the headline in Host Grotesk
  - the Figma logo and the GitHub link (no star chip while the repo is private)
  - the big cards and the back-to-top button
  - the drawer tabs, swatches, size slider, copy and reset
  - the drawer and sheet enter/exit, including Esc mid-exit
  - the theme switch without a colour sweep
  - reduced motion (emulate it; nothing should animate)
- [ ] **Step 3:** Fix what's off at the source, re-run tests and the build, and commit each fix as `fix(site): …`.
- [ ] **Step 4:** Hand over to Lucas for his review.
