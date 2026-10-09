# Phase 4b — Scene editing (`feat/scene-editing`)

Goal: `scenes/<name>.json` is the single source of truth for furniture and finishes;
the viewer loads, edits and saves it; `/deco` will write the same format.

Design: zod `Scene` schema (`src/scene/sceneFile.ts`, format in the `scene-format`
skill); zustand store with undo/redo snapshots (`src/viewer/store.ts`); a Vite dev
middleware (`scripts/vite-scenes-plugin.ts`) serving `GET/PUT /api/scenes/:name` so
the browser writes straight into `scenes/`; pure placement helpers
(`src/scene/placement.ts`: room lookup, wall snapping, grid snapping) with unit tests.

- [ ] `src/scene/sceneFile.ts`: Scene, SceneItem, RoomFinishes schemas + `scenes/base.json` validated in a unit test
- [ ] `src/scene/placement.ts`: `roomAt(level, point)`, `snapToWall`, `snapGrid`, `itemFootprint` + tests
- [ ] `src/viewer/store.ts` (zustand): scene, selection, undo/redo, dirty flag, load/save through `/api/scenes`
- [ ] `scripts/vite-scenes-plugin.ts`: list / read / write `scenes/*.json` in dev; `?scene=<name>` loads on start
- [ ] `src/scene/components/SceneItems.tsx`: items rendered from the catalogue (model or procedural) with material overrides, click to select, drag on the floor plane, selection outline
- [ ] Room finishes applied: floor, ceiling and bordering walls take `roomFinishes[room]` materials
- [ ] Editor panel (French): scene select / save / save as / export PNG, add item (kind or model), selected item (position, rotation ±15°, duplicate, delete, material), room finishes, undo / redo, keyboard shortcuts (Suppr, Ctrl+Z, Ctrl+Y, R)
- [ ] `scenes/base.json`: furnished SEJOUR - CUISINE and CHAMBRE PARENTS; `visual-check` on `sejour-cuisine-2`, `chambre-parents-2`
- [ ] e2e: place, move (panel inputs), save to a temporary scene, file content asserted
- [ ] Gates green, PR, squash-merge, STATE.md, CLAUDE.md, next phase branch
