# Release checklist

A release ships only when every box below is ticked. Copy this list into the release's tracking note and tick it there.

## Quality review

For any release that adds or redraws icons. Lucas does this pass in `/lab` (`npm run dev:lab`).

- [ ] All icons reviewed at 16, 20 and 24 px.
- [ ] Optical sizing consistent across different silhouettes.
- [ ] Related families checked together, including statuses, arrows and user modifiers.
- [ ] Light and dark appearances validated.
- [ ] No SVG clipping, malformed paths or unexpected rendering differences.
- [ ] Consistent naming, viewBox, colour inheritance and React component behaviour.
- [ ] Accessible names documented for icon-only controls.

## Release steps

- [ ] `npm run lint:icons`, `npm run build`, `npm run typecheck` and `npm test` all pass.
- [ ] Version bumped in `packages/merki/package.json`, `CHANGELOG.md` updated, tag `vX.Y.Z` created.
- [ ] Lucas runs `npm publish` from `packages/merki` (his account, 2FA). It runs `prepack`: a fresh build, with the root `README.md` and `LICENSE` copied in.
- [ ] GitHub release created with the SVG zip attached: run `npm run zip` and attach `release/merki-icons-svg-<version>.zip`.
- [ ] Figma sync run by Claude (see figma/README.md) and checked; Lucas publishes the team library and the Community update.
- [ ] The site deploys from `main`. At the 1.0 launch only: remove the `X-Robots-Tag: noindex` header from `vercel.json`.
