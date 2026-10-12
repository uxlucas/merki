# Merki foundation: follow-ups

Items the task and final reviews deferred. Each later plan picks up the ones in its area.

## Linter hardening
- Use `Object.hasOwn` for the allow-list lookups (`ALLOWED_ATTRS[tag]`, `in REQUIRED_ROOT`).
- Test gaps: rect/line cases, upper bounds, geometry error paths, optimizer survival of `fill-rule`/`stroke-dasharray`, stale entries in `index.ts`/`icons.json`.
- `buildAll` wipes outputs before the post-optimize lint check. Compute everything in memory first.
- Replace literal U+FEFF characters in `optimize.ts`, `parse.ts`, `lab-plugin.ts` and their tests with `﻿` escapes.

## Package polish (spec §9 step 3)
- Ship `LICENSE` inside `packages/merki`. Add a top-level `types` field and a `default` export condition.
- Snapshot the generated icon modules so geometry changes show up in review.
- Pin `displayName === componentName(name)` with a test (two separate `toPascal` copies).
- README: ESM-only, the `title`/`aria-label` precedence, `absoluteStrokeWidth`.
- CI: `permissions: contents: read`, a `concurrency` group, an `npm pack --dry-run` smoke test.
- Dev dependencies: `npm audit` flags vitest 3 (tinypool) and tsup's esbuild. Dev-only. Upgrade to vitest 4 when convenient.

## Lab polish
- `aria-pressed` on the selected cell, a text alternative for the needs-work dot, better contrast for the orange badge, `color-scheme: dark`.
- Error-copy edge cases: the "Couldn't save: save failed: 500" double prefix, a GET that never resolves staying on "Loading notes…".
- Atomic `_review.json` writes; a body size cap; watcher reloads only for `.svg`/`.json`.
