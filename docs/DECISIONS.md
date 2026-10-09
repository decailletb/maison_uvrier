# Decisions

One line per decision, newest last. Decisions listed in `docs/PROMPT.md` are final and
not repeated here.

| Date | Decision | Reasoning |
|---|---|---|
| 2026-10-09 | Phase plans are written as checklists directly, without the interactive plan mode | Sessions run unattended; plan mode would block on approval nobody can give. |
| 2026-10-09 | TypeScript pinned to 5.9.x, ESLint 9.x | TypeScript 7 / ESLint 10 are too new for typescript-eslint and the React plugins. |
| 2026-10-09 | Camera presets selected through the URL query `?preset=<name>` | Lets Playwright screenshot a preset with no UI automation. |
| 2026-10-09 | Three.js units are metres; all house data is in centimetres and converted at scene build time | Three/R3F lighting and physics defaults assume metres; plans are dimensioned in cm. |
| 2026-10-09 | Orientation: plan sheet "up" = north. Party wall (isolation phonique) at y = 724; terrasse, balcon and openings 004/005/006/010/012 at x = 0 = west (élévation OUEST, width 724); entry door 002, couvert and 009 at x = 1055 = east (élévation EST); stair window 007 at y = 0 = south (élévation SUD, width 1055 + 500 couvert). Scene: +X east, −Z north, so the sun sits toward +Z. | The three elevation titles and widths fix all four sides without a north arrow. |
| 2026-10-09 | Twin villas are stacked along plan y; the neighbour starts above y = 724. The "3.35 m²" cartouche on page 4 is the neighbour's and is excluded from rez.json | Located by plans-reader at x ≈ 1470, y ≈ 745-800, beyond the party wall. |
| 2026-10-09 | geometry-extractor writes `src/data/house/<level>.json` itself and reports a summary | Keeps 100+ lines of JSON per level out of the main thread; the main thread still reviews and commits. |
| 2026-10-09 | Exterior wall thicknesses differ per level (sous-sol 18-20, rez 30-40, étage 24-49 cm, deduced from dimension chains) and are kept as extracted | Interior polygons match printed m² with these values; phase 2 will judge the façade alignment visually and may unify the thickness there, not in the data. |
| 2026-10-09 | Subagents render plan pages with PyMuPDF; `Read` with `pages` fails in their shell (pdftoppm not on the agent PATH) | Observed in all three extractions; the fallback is already documented in the agents. |
| 2026-10-09 | CHAMBRE 2 is modelled as an L-shape including its 47 × 102 cm entrance nook (12.17 m² vs 11.24 printed, 8.3 %); tolerance 10 % for that room only | The rectangle alone is already 11.69 m²; leaving the nook out of every room would leave a hole in the floor behind the hall door. |
| 2026-10-09 | Interior geometry: walls are boxes split around openings (piers, sill, lintel), floors and slabs are extruded polygons with stairwell holes, stairs are straight flights along a `Stair.ascent` vector; pure functions in `src/scene/*.ts`, thin R3F components | No CSG dependency, everything unit-testable, light on Iris Xe. |
| 2026-10-09 | Stairs: 16 risers sous-sol → rez, 14 rez → étage (section p. 9 numbers 12-30), straight flights ascending toward plan +y | The winder layout is not readable at this scale; a straight flight in the right stairwell is enough for navigation and will be refined if a photo check demands it. |
