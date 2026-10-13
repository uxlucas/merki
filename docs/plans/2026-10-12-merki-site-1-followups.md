# Merki Site 1: follow-ups

Deferred findings from the Site 1 build reviews (2026-10-12). None block merge (final review triage). One-liners from the review ledger; items fixed later in the branch are removed.

## Still open

- notfound head keeps a canonical to the bogus path and has no noindex (routes.ts headFor)
- categories throws opaque TypeError if _set.json lacks a category key (data/icons.ts)
- icons.json double cast, no runtime shape check
- icon route regex [a-z0-9-]+ (fine for current kebab-case set)
- dev:lab script duplicates new dev script
- dev-only empty <title> until first effect (/lab title stays empty)
- domain hardcoded in robots.txt and config.ts
- prerender isMain realpathSync(argv[1]) throws ENOENT on nonexistent argv[1]; comment's casing claim unverified
- Link treats download={false} as a download
- jsdom "Not implemented: navigation" stderr noise from the modified-click router tests
- mobile menu has no Escape-to-close, no scroll lock, no aria-controls; overlay inset 64px hard-coded
- Icon.tsx namespace import pulls all icons into one chunk; throws on unknown name (plan-mandated)
- watchSystemTheme untested; no test where the window.localStorage getter itself throws
- TopNav hard-codes /guide/install
- Layout remounts per page type (sidebar scroll/open state reset)
- jsdom "Not implemented: navigation" noise predates Task 3 (from Task 2 router tests)
- hidden sidebar scrollbar gives no cue of overflow on short viewports — check in Task 10
- aria-live span nested inside the button; visible "Couldn't copy" possibly double-announced
- copyText fallback setup (createElement/append/select) outside try → unhandled rejection if it throws
- hero copy test uses partial regexes; clipboard defineProperty not restored; repeated click doesn't extend the timer
- disabled Figma link has no visual dimming (spec: visible, goes nowhere)
- no component tests for ArrowUp/Down, Home/End, roving tabindex count; blocked-storage test doesn't throw from the localStorage getter itself
- filter results / empty state not announced (no role=status); "/" kbd hint shown on touch; search focus only a border change
- generic global class names (.grid, .cell, .seg, .toolbar, .search, .empty, .cat)
- trailing-"icon" strip trims words like "silicon"; stale search test title
- hyphen-only query returns full list; "-up" widens like "up"
- compact arc flags (a2 2 0 018 0) and e+ exponents would misparse silently (none in the set; svgo config doesn't compact paths)
- iconPoints attr() turns missing/bad attributes into 0/NaN without throwing
- parser tests don't cover Q, truncated input, S without prior curve, rounded-rect positions; no Construction render test
- iconPoints runs even with points/handles off (memoized)
- focus doesn't return to the cell when the drawer closes via browser Back; document Esc listener ignores defaultPrevented
- sheet uses 85vh (dvh better on iOS); no body scroll lock behind scrim
- drawer toggles persist across arrow-key icon changes (probably desirable); "Couldn't copy" may shift button width — check in Task 10
- revoke deferred 0ms — a longer delay may be safer in some browsers
- document.execCommand overwritten by plain assignment in tests (file-scoped leak)
- "Hover to see them" has no touch route on iOS (no tap focus); Safari may not animate CSS r
- thin tests (keylines swap only checks aria-pressed; no Home-renders-cards test; unused screen import); titles duplicated from topics.ts
- markdown link pattern's optional ")" swallows a closing paren after a safe link "(see [docs](/guide))"; SAFE_HREF accepts "//evil.com"
Task 10: fix wave 656b1af; minor (deferred): above ~1068px wide the theme toggle sits 16px right of the main column's right edge (index grid 1004px inside a 1020px box)
- sidebar can still clip below ~600px window height with no scroll affordance
- Back-to-home scroll restoration (needs a real browser check); icon cells as links (bigger change); informational --fg3 text (.soon, .crafted, readouts) is Lucas's call.
- craft toggle labels "Absolute stroke"/"Solid accents" don't contain the visible text (WCAG 2.5.3 nit)

## From iteration 1 (2026-10-12)

Before the GitHub repo goes public: nothing extra (the star chip's name and layout were fixed). Still open:

- glitch only on hover, not focus-visible (decorative, as specified)
- steps(2,end) gives stepped intermediate frames — check in the visual pass
- empty-string cache reads as 0 (near-unreachable); cache tests don't seed garbage values; private-repo test asserts absence after a fixed sleep
- .grid data-size now dead markup; selected+focused card gets border+shadow+outline (visual check); focused back-to-top can become aria-hidden if scrolled back to hero
- theme-switch class removal can race on double toggle; watchSystemTheme flips without pausing transitions; test gaps (inert/aria-hidden while closing, Esc/Back/reopen during exit at Home level, stub cleanup on failure); .to-top :active scale snaps; .hero-link hover border instant; permanent will-change on drawer
- hovered cell that loses selection fades its border (it's a hover-in); client-side nav straight into /icons/x has no enter (like a direct load)
- Fonts aren't preloaded, so Host Grotesk may swap in on the headline (consider a preload before launch).
