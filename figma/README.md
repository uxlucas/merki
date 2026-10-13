# The Merki Figma file

The file is built from the repo, one way: repo → Figma. Nobody edits it by hand.

- File: see `file.json` (Lucas Lima Design team, Professional).
- Spec: `docs/specs/2026-10-10-merki-design.md` §7.

## Running a sync

Claude runs it through the Figma connection (MCP `use_figma`). Steps:

1. `npm run figma:scripts` builds the icons and writes the scripts to `figma/out/` (git-ignored): one per category plus setup, deprecations, four pages and a check. `manifest.json` lists them in order, with `{ file, purpose, chars, fingerprint }` for each.
2. Load the `figma:figma-use` skill. Then run each script in `manifest.json` order through `use_figma` with the `fileKey` from `file.json`, passing the file's content as `code` and `skillNames: "figma-use"`. Stay under 15 calls a minute. Run them in manifest order: each component section is placed below the previous one.
   - `00-setup`: pages and the `icon` variable.
   - `10-components-<category>`: one script per category, in `_set.json` order. Updates sets in place and redraws only the variants whose SVG changed; it returns `redrawn` and `unchanged` variant counts.
   - `20-deprecated`: moves sets the repo no longer has to "Deprecated".
   - `30-icons`, `40-cover`, `50-construction`, `60-changelog`: presentation pages, rebuilt from the data. Each returns the `fonts` it used, so a fallback to Inter shows.
   - `90-check`: read-only, see step 4.
3. Fingerprints. Every script that carries data checks its own data fingerprint before it changes anything, and throws `Merki: data fingerprint mismatch` if the script text was mis-copied into the call. Nothing was changed: re-copy the file and run it again. The scripts also return the `fingerprint`; it must equal the one in the manifest.
4. Check. Run `90-check` and compare with the previous release's numbers: `sets` = icons plus deprecated sets, `variants` = sets × 3, `unbound`, `emptyVariants` and `looseComponents` all 0, `sections` in category order (then Deprecated), and `idsFingerprint` unchanged unless icons were added, removed or moved. A re-sync of unchanged icons reports `redrawn: 0`. Take screenshots of each page.
5. Lucas publishes the team library and the Community update.

Claude may hand the verbatim runs to a helper agent, because each script refuses mis-copied data. Lucas can say if he prefers Claude to run them itself. Claude does the checks in step 4 itself.

### When a script errors

Follow the error's `safeToRetryWithoutCanvasRead`. If it is `true`, run the same script again. If it is `false`, run `90-check` first to see what the file holds, then re-run the failed script. Sets are matched by name, so a half-done set is found and repaired; a new set is named before its variants are drawn for that reason.

## What a re-sync keeps

A re-sync keeps every component set's and variant's node id, and leaves the drawing of an unchanged icon alone: each variant stores the fingerprint of the SVG it was drawn from (shared plugin data `merki`/`svg`). Checked on 2026-10-13: 157 sets and 471 variants, ids unchanged after a full re-sync. Instances in other files keep working.

Component set descriptions read `React: CalendarIcon`, with no angle brackets: Figma stores them escaped.

Never delete a component set or variant by hand: other files' instances point at them.

## Breaking changes for Figma users

- Moving an icon to another category renames its set (`category/name`). The sync makes a new set and moves the old one to Deprecated, so instances in other files stay on the old set. Treat a category move as a breaking change for Figma users.
- A renamed or removed category leaves an empty section behind. Delete it by hand.
