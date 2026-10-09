# Phase 4a — Furniture catalogue (`feat/furniture-catalogue`)

Goal: a catalogue the scene editor and `/deco` can draw from: CC0 glTF models with
scale normalisation, procedural fallbacks for every category, and a material library.

- [ ] `src/catalogue/manifest.ts`: zod schema of `assets/manifest.json`, loader, `findAssets(category, tags)`
- [ ] `src/catalogue/materials.ts`: material library (ids, colour / roughness / procedural texture) for floors, walls, ceilings, fabrics, wood, metal
- [ ] `src/catalogue/procedural.tsx`: parametric bed, table, chair, sofa, wardrobe, shelf, desk, kitchenBlock, rug, lamp, nightstand, dresser (boxes, cm params, material ids)
- [ ] `src/catalogue/Model.tsx`: glTF loader (drei `useGLTF`) with bounding-box scale to `dimensionsCm`, centred on the floor
- [ ] `asset-fetcher` × 3: CC0 glTF sofa, dining table, bed from Poly Haven into `assets/models/`, manifest entries with dimensions
- [ ] `scripts/fetch-assets.ts` handles multi-file glTF (gltf + bin + textures) from manifest `files[]`
- [ ] Catalogue preview preset `catalogue` showing every procedural kind in a row, `visual-check` on it
- [ ] Unit tests: manifest validation, procedural dimensions, material ids unique
- [ ] Gates green, PR, squash-merge, STATE.md, then `feat/scene-editing` (plan `05-scene-editing.md`)
