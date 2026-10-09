# Phase 2 — Interior geometry (`feat/interior-geometry`)

Goal: walk through the three levels generated from `src/data/house/*.json`, with
level switcher, room labels, orbit and first-person cameras, and one screenshot preset
per room and per level for `visual-check`.

Design (see DECISIONS.md): walls are boxes split around openings (no CSG); floors,
ceilings and slabs are extruded polygons with stairwell holes; stairs are straight
flights of boxes along an `ascent` vector; everything is computed by pure functions in
`src/scene/*.ts` (unit-tested) and rendered by thin R3F components in
`src/scene/components/`.

- [x] Schema: `Stair.ascent` (plan unit vector); risers fixed (sous-sol → rez 16, rez → étage 14, section p. 9 "marches 12 à 30")
- [x] `src/scene/walls.ts`: wall pieces around openings (sill, lintel, piers) + tests
- [x] `src/scene/stairs.ts`: steps from polygon, risers and ascent + tests
- [x] `src/scene/shapes.ts`: polygon → Three Shape / extrude with holes
- [x] `src/scene/materials.ts`: finish string → colour / roughness (flat PBR for now)
- [x] Components: `LevelGroup` (slab with stair holes, room floors, walls, stairs, labels), `House`
- [x] Viewer: level mode (sous-sol / rez / etage / all), orbit + walk camera (`WalkControls`, WASD, eye 160 cm), French UI
- [x] Presets generated from the data: `<level>-top`, `<room-id>` from the doorway, `<room-id>-2` for large rooms; `?preset=` sets the level mode
- [x] Screenshot script and smoke test updated (one room preset must render)
- [x] `visual-check`: each `<level>-top` against the house-plans description; `sejour-cuisine`, `chambre-parents`, `salle-de-bains`, `chambre-2` against IMG_5500, IMG_5508, IMG_5504, IMG_5505
- [ ] Gates green, PR, squash-merge, STATE.md, next phase branch
