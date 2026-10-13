# The Merki Figma file

The file is built from the repo, one way: repo → Figma. Nobody edits it by hand.

- File: see `file.json` (Lucas Lima Design team, Professional).
- Spec: `docs/specs/2026-10-10-merki-design.md` §7.

## Running a sync

Claude runs it through the Figma connection (MCP `use_figma`). Steps:

1. `npm run figma:scripts` — builds the icons and writes the scripts to `figma/out/` (git-ignored), in order, with `manifest.json`. There are 16 scripts. The manifest lists `{ file, purpose, chars, fingerprint }` for each.
2. Load the `figma:figma-use` skill. Then run each script in `manifest.json` order through `use_figma` with the `fileKey` from `file.json`, passing the file's content as `code` and `skillNames: "figma-use"`. Stay under 15 calls a minute. Run them in manifest order: each component section is placed below the previous one.
   - `00-setup` — pages and the `icon` variable.
   - `10-components-<category>` — one script per category, in `_set.json` order; updates sets in place.
   - `20-deprecated` — moves sets the repo no longer has to "Deprecated".
   - `30-icons`, `40-cover`, `50-construction`, `60-changelog` — presentation pages, rebuilt from the data.
3. Compare fingerprints. Every script except `00-setup` returns a `fingerprint` of the data it received, and it must equal the one in the manifest. A mismatch means the script text was mis-copied into the call: run that file again. This is safe, because components update in place and the pages rebuild.
4. Check: the Components page has one set per icon and three variants each (sets = icons, variants = icons × 3), no unbound paints, and screenshots of each page.
5. Lucas publishes the team library and the Community update.

Claude may hand the verbatim runs to a helper agent. The fingerprints are what make that safe; Claude then does the checks in step 4 itself.

## What a re-sync keeps

A re-sync keeps every component set's and variant's node id. Checked on 2026-10-13: 157 sets and 471 variants, ids unchanged after a full re-sync. Instances in other files keep working.

Component set descriptions read `React: CalendarIcon`, with no angle brackets: Figma stores them escaped.

Never delete a component set or variant by hand: other files' instances point at them.
