---
name: scene-format
description: Shared vocabulary for the 3D viewer data files - house geometry JSON (src/data/house/*.json, schema src/data/schema.ts), scene files (scenes/*.json), the catalogue manifest (assets/manifest.json), decoration proposals (inspiration/**/proposal.json) and the camera preset names. Read before writing or editing any of those files or any agent that produces them.
---

# Scene format

Single reference for every JSON the viewer reads or writes. The zod schemas in
`src/data/schema.ts` are authoritative for the house data; this file explains the
conventions and lists the vocabularies the agents share.

## Units and axes

- **House data is in centimetres**; the viewer converts to metres (Three.js units) when
  building the scene. Heights are also in cm, relative to the finished floor of the
  level (`levels[].floorLevel` carries the absolute level in cm, e.g. rez `0`,
  étage `285`, sous-sol `-286`).
- Plan coordinates: origin at the outside corner of the villa that is **bottom-left on
  the plan sheet**. `x` grows to the right of the sheet (0 to 1055), `y` grows toward
  the top of the sheet (0 to 724). Three.js mapping: plan `x` → scene `+X`, plan `y` →
  scene `−Z`, height → `+Y`. The mapping lives in one function
  (`src/scene/units.ts`) and nowhere else.
- Orientation assumption (no north arrow on the plans): the elevation titled "SUD" is
  the long façade with the balcony and terrasse; see `docs/DECISIONS.md`.

## House data (`src/data/house/<level>.json`)

One file per level: `sous-sol.json`, `rez.json`, `etage.json`. Shape (zod in
`src/data/schema.ts`):

```
Level {
  id: "sous-sol" | "rez" | "etage"
  name: string                 // as printed: "SOUS-SOL", "REZ DE CHAUSSEE", "ETAGE"
  floorLevel: number           // cm, finished floor, absolute (rez = 0)
  clearHeight: number          // cm, 250 (240 in sous-sol)
  slabThickness: number        // cm, 22 default
  planPage: number             // 3, 4 or 5
  walls: Wall[]
  rooms: Room[]
  openings: Opening[]
  stairs: Stair[]
}
Wall     { id, points: [x,y][], thickness, structural: boolean, exterior: boolean, estimated? }
Room     { id, name (exactly as printed), polygon: [x,y][], printedArea (m²),
           floorFinish, ceilingFinish, wallFinish, estimated? }
Opening  { id, kind: door|window|slidingDoor|frenchWindow|passage, wallId, offset, width,
           height, sill, swing?: left|right|sliding|none, ref?: "001".."012", estimated? }
Stair    { id, polygon: [x,y][], risers?, direction: "up"|"down", toLevel }
```

`id`s are kebab-case ASCII (`sejour-cuisine`, `chambre-parents`); `name` keeps the
accents and spelling of the plan. `offset` is measured along the wall polyline from
its first point to the opening's near edge.

## Scene file (`scenes/<name>.json`)

The single source of truth for furniture and finishes; `/deco` edits it and the viewer
loads it.

```
Scene {
  version: 1
  name: string
  base?: string                            // another scene this one started from
  roomFinishes: { [roomId]: { floor?: MaterialId, wall?: MaterialId, ceiling?: MaterialId } }
  items: SceneItem[]
}
SceneItem {
  id: string                               // unique in the scene
  asset: AssetId | { procedural: ProceduralKind, params: {...} }
  roomId: string
  position: [x, y, z]                      // cm, plan coordinates, y = height above floor
  rotationY: number                        // degrees, 0 = asset front facing plan −y
  scale?: number                           // uniform, default 1
  materialOverrides?: { [slot]: MaterialId }
}
```

Procedural kinds (phase 4): `bed`, `table`, `chair`, `sofa`, `wardrobe`, `shelf`,
`desk`, `kitchenBlock`, `rug`, `lamp`.

## Catalogue manifest (`assets/manifest.json`)

```
{ "assets": AssetEntry[] }
AssetEntry {
  id: string                 // kebab-case, unique, e.g. "sofa-modern-3seat"
  category: Category
  file: string               // relative to assets/, e.g. "models/sofa-modern-3seat/model.glb"
  url: string                // direct download URL used by scripts/fetch-assets.ts
  source: "polyhaven" | "ambientcg" | "kenney" | "sketchfab"
  license: "CC0-1.0"
  dimensionsCm?: { w, d, h } // models only, after unit normalisation
  tags: string[]             // style + room tags from the vocabulary below
  fetchedAt: string          // ISO date
}
```

`Category`: `sofa | armchair | chair | table | coffeeTable | bed | nightstand | wardrobe
| dresser | shelf | desk | kitchen | appliance | bathroomFixture | lamp | rug | plant |
decor | material-floor | material-wall | material-fabric | material-wood |
material-metal | hdri`.

Style tags: `scandinave | moderne | contemporain | industriel | minimaliste | rustique |
boheme | classique | enfant | bois-clair | bois-fonce | blanc | noir | gris | colore`.
Room tags: `sejour | cuisine | chambre | chambre-enfant | dressing | salle-de-bains |
wc | entree | hall | bureau | sous-sol | exterieur`.

## Decoration proposal (`inspiration/<...>/proposal.json`)

Produced by `deco-interpreter`, consumed by `/deco`:

```
Proposal {
  source: string                           // image path
  targetRoom?: string                      // room id
  palette: { hex: string, role: string }[] // 5-7 entries, dominant first
  surfaces: { floor: Surface, wall: Surface, ceiling: Surface }
  furniture: { category: Category, styleTags: string[], approxDimensionsCm: {w,d,h},
               colour: string, material: string, placementHint: string }[]
  lighting: { mood: string, colourTemperatureK: number, sources: string[] }
  styleSummary: string                     // one French sentence
}
Surface { material?: AssetId, description: string, colour: string }
```

## Camera presets

Defined in `src/viewer/presets.ts`, selected with `?preset=<name>`, one PNG each from
`npm run screenshots -- <name>`. Names are kebab-case ASCII:

- Global: `overview`, `top`.
- Per level (phase 2): `<level>-top` (cut-away ceiling, from above), e.g. `rez-top`.
- Per room (phase 2): `<room-id>` from the doorway, `<room-id>-2` for a second angle
  when a photo exists from a different viewpoint.
- Exterior (phase 3): `sud`, `ouest`, `est`, `aerial`.

Keep this list in sync when adding presets.
