# Phase 1 — Plan data (`feat/plan-data`)

Goal: the three levels of villa F as validated JSON in centimetres, extracted from plan
pages 3, 4 and 5, cross-checked against the elevations (6 to 8) and the section (9).

- [x] `src/data/schema.ts` (zod): Level, Wall, Room, Opening, Stair, House
- [x] `src/data/geometry.ts`: polygon area, point-in-polygon, polyline length, point along polyline, with unit tests
- [x] `src/data/house/index.ts` loader validating the three JSON files
- [ ] `geometry-extractor` × 3 in parallel (pages 3, 4, 5) → `src/data/house/{sous-sol,rez,etage}.json`
- [ ] Cross-check openings with elevations p. 6-8 (refs 001-012, sizes) and heights with section p. 9
- [ ] Tests: room area within 5 % of printed m², exterior walls closed, openings inside their wall, levels consistent with SIA figures (p. 1-2)
- [ ] Deviations and assumptions in `docs/DECISIONS.md`; orientation assumption stated
- [ ] Gates green, PR, squash-merge, STATE.md, next phase branch
