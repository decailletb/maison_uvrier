# Phase 5 — Decoration workflow (`feat/deco-workflow`)

Goal: `/deco <room|all> <image|folder>` turns an inspiration image into a new scene
file, verified by screenshots, with a French report.

Design: the vision step is the `deco-interpreter` agent (writes `proposal.json`);
everything after it is deterministic code: `src/deco/proposal.ts` (zod schema),
`src/deco/match.ts` (proposal furniture → catalogue asset by category and tags, else
procedural kind with the nearest library material to the proposal colour),
`src/deco/layout.ts` (placement from hints: against the wall opposite the door, under
the window, centre, corner, beside / in front of another item; greedy perimeter
fallback; no overlap, doors kept clear), `scripts/deco-apply.ts` CLI that writes
`scenes/<room>-<theme>.json` from `scenes/base.json` and appends `docs/deco-log.md`.
Theme mode (`all`) filters the furniture list per room type (chambre / séjour / other).

- [ ] `src/deco/proposal.ts` schema + example fixture
- [ ] `src/deco/match.ts` + tests (category and tag scoring, colour distance, procedural fallback)
- [ ] `src/deco/layout.ts` + tests (inside room, no overlaps, doors clear, hints honoured)
- [ ] `scripts/deco-apply.ts` (`npm run deco:apply -- <proposal> <room|all> <theme>`), French console report, `docs/deco-log.md`
- [ ] `/deco` skill updated to the real commands; `deco-interpreter` agent checked against the schema
- [ ] Real run on a stand-in photo (no image in `inspiration/` yet): IMG_5505 → `chambre-2`, before / after screenshots, `visual-check`
- [ ] Gates green, PR, squash-merge, STATE.md, CLAUDE.md
