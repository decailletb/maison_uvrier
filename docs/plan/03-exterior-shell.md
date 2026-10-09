# Phase 3 — Exterior shell and light (`feat/exterior-shell`)

Goal: the villa seen from outside matches the three elevations, with sky, sun and
shadows at the real orientation (north = top of the plan sheet, DECISIONS.md).

- [ ] `src/scene/sun.ts`: solar position for Uvrier (46.24° N, 7.41° E) from date and hour, unit tests on solstice noon elevations and azimuths
- [ ] `src/scene/shell.ts`: exterior elements as pure data: terrasse slab (−17), couvert slab (−14) and its roof, balcon slab (+280) with glass balustrade, balcon cover, roof slab (+535 → +565.5) with acrotère to +606
- [ ] `src/scene/components/Shell.tsx` (shown in level mode `all`), glazing panes and frames in every window / frenchWindow / slidingDoor, leaf for the entry door
- [ ] Ground at −10 (terrain aménagé), lowered under the sous-sol in sous-sol mode
- [ ] Sky and light: HDRI from Poly Haven via `asset-fetcher` (`assets/hdri/`, served through Vite `publicDir`), fallback to drei `Sky` when the file is missing; directional sun from `sun.ts`, soft shadows; UI: month and hour sliders
- [ ] Exterior presets `sud`, `ouest`, `est`, `aerial` (level `all`, no ceilings)
- [ ] `visual-check`: `sud` / `ouest` / `est` against the house-plans elevation descriptions (pages 6-8), `aerial` and `est` against IMG_5497 and IMG_5510
- [ ] Gates green, PR, squash-merge, STATE.md, next phase branch
