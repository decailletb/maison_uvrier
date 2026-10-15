/**
 * Site around villa F as pure data (plan cm, heights absolute cm): parcel 17030 with
 * lawns, timber terrace, asphalt access, fences and hedges, the five attached villas
 * A..E to the north as light massing, the road (parcel 7664) and the railway to the
 * south, and the solar panels on every roof. Sources: RDPPF extract, Maps screenshot,
 * site photos (DECISIONS.md). The house's own shell (terrasse and couvert slabs, roof)
 * stays in shell.ts; this module only fills what is around it.
 */
import { FOOTPRINT_CM, levelById } from "@/data/house";
import type { Point } from "@/data/schema";
import { EXTERIOR_ROOMS, LEVELS } from "./shell";

/** Library material ids (src/catalogue/materials.ts) or site-only finishes rendered locally. */
export type SiteMaterial =
  | "grass"
  | "field"
  | "asphalt"
  | "decking"
  | "gravel"
  | "ballast"
  | "render-white"
  | "metal-anthracite"
  | "fence-anthracite"
  | "hedge-green"
  | "hedge-red"
  | "concrete-raw"
  | "window"
  | "glass"
  | "steel"
  | "sleeper"
  | "solar";

/** Flat polygon at `top`, or a slab from `bottom` to `top`. */
export interface SiteSurface {
  id: string;
  polygon: Point[];
  holes?: Point[][];
  top: number;
  bottom?: number;
  material: SiteMaterial;
  /** Swap texture axes (decking boards along plan y, parallel to the west façade). */
  rotateUv?: boolean;
}

/** Axis-aligned box in plan cm. */
export interface SiteBox {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  bottom: number;
  top: number;
  material: SiteMaterial;
}

/** Cross-section (plan y, height) swept along plan x from `x0` to `x1`. */
export interface SitePrism {
  id: string;
  x0: number;
  x1: number;
  profile: Point[];
  material: SiteMaterial;
}

export interface SiteInstance {
  at: Point;
  bottom: number;
  /** Tilt around the plan x axis, raising the north edge (degrees). */
  tiltDeg?: number;
}

/** Many copies of one shape: one instanced draw call per material. */
export interface SiteInstances {
  id: string;
  shape: "box" | "cylinder" | "panel";
  /** Plan size along x and y, then height. */
  size: [number, number, number];
  material: SiteMaterial;
  items: SiteInstance[];
}

export interface SiteSet {
  surfaces: SiteSurface[];
  boxes: SiteBox[];
  prisms: SitePrism[];
  instances: SiteInstances[];
}

export interface Site {
  /** Darker field to the horizon, with a hole for the detailed site rectangle. */
  far: SiteSurface;
  /** Everything always shown above ground (hidden only in the sous-sol view). */
  ground: SiteSet;
  /** Solar panels and vents on villa F's own roof: shown with the roof only. */
  ownRoof: SiteSet;
}

const W = FOOTPRINT_CM.width;
const D = FOOTPRINT_CM.depth;

export const VILLA_COUNT = 6;

/** Parcel 17030 (villa F): ~700 west and south of the house, ~1100 east, party wall north. */
export const PARCEL = { x0: -700, y0: -700, x1: W + 1100, y1: D } as const;

/** Detailed site area; the far field covers everything outside it. */
export const SITE_RECT = { x0: -1600, y0: PARCEL.y0, x1: PARCEL.x1 + 900, y1: VILLA_COUNT * D + 400 } as const;

export const HEIGHTS = {
  far: -12,
  lawn: -10,
  overlay: -8,
  deckingOwnTop: LEVELS.terrasseTop + 3,
  deckingNeighbourTop: -7,
  fence: 170,
  hedge: 150,
  southWall: 60,
  ballastTop: 40,
  railTop: 65,
} as const;

/** Road and railway run across the whole far field. */
const FAR_X = { x0: W / 2 - 20000, x1: W / 2 + 20000 } as const;
export const ROAD = { y0: -1300, y1: PARCEL.y0, ...FAR_X } as const;
export const RAILWAY = { y0: -2450, y1: -1450, tracks: [-1725, -2175], ...FAR_X } as const;

export function rect(x0: number, y0: number, x1: number, y1: number): Point[] {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

function box(id: string, x0: number, y0: number, x1: number, y1: number, bottom: number, top: number, material: SiteMaterial): SiteBox {
  return { id, x0: Math.min(x0, x1), y0: Math.min(y0, y1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), bottom, top, material };
}

function emptySet(): SiteSet {
  return { surfaces: [], boxes: [], prisms: [], instances: [] };
}

/** Fence panels with posts every 200 cm along a straight line (x or y constant). */
function fence(set: SiteSet, id: string, from: Point, to: Point): void {
  const t = 4;
  const post = 8;
  const top = HEIGHTS.fence;
  const along = from[0] === to[0] ? "y" : "x";
  const [a, b] = along === "y" ? [from[1], to[1]] : [from[0], to[0]];
  const c = along === "y" ? from[0] : from[1];
  set.boxes.push(
    along === "y"
      ? box(`${id}-panels`, c - t / 2, a, c + t / 2, b, HEIGHTS.lawn + 5, top, "fence-anthracite")
      : box(`${id}-panels`, a, c - t / 2, b, c + t / 2, HEIGHTS.lawn + 5, top, "fence-anthracite"),
  );
  const n = Math.max(1, Math.round(Math.abs(b - a) / 200));
  for (let i = 0; i <= n; i++) {
    const p = a + ((b - a) * i) / n;
    set.boxes.push(
      along === "y"
        ? box(`${id}-post-${i}`, c - post / 2, p - post / 2, c + post / 2, p + post / 2, HEIGHTS.lawn, top + 5, "fence-anthracite")
        : box(`${id}-post-${i}`, p - post / 2, c - post / 2, p + post / 2, c + post / 2, HEIGHTS.lawn, top + 5, "fence-anthracite"),
    );
  }
}

/** Hedge as a run of slightly uneven blocks so it does not read as one box. */
function hedge(set: SiteSet, id: string, x0: number, y0: number, x1: number, y1: number, height: number, material: SiteMaterial): void {
  const alongY = y1 - y0 > x1 - x0;
  const len = alongY ? y1 - y0 : x1 - x0;
  const n = Math.max(1, Math.round(len / 120));
  for (let i = 0; i < n; i++) {
    const a = (len * i) / n;
    const b = (len * (i + 1)) / n;
    const h = height + ((i * 37) % 5) * 6 - 12;
    const bulge = ((i * 53) % 3) * 4;
    set.boxes.push(
      alongY
        ? box(`${id}-${i}`, x0 - bulge, y0 + a, x1 + bulge, y0 + b, HEIGHTS.lawn, h, material)
        : box(`${id}-${i}`, x0 + a, y0 - bulge, x0 + b, y1 + bulge, HEIGHTS.lawn, h, material),
    );
  }
}

/**
 * Six panels 170 × 100 per roof in two rows of three, tilted 10° to the south, and two
 * vents; all villas of `villas` share one instanced set.
 */
function roofEquipment(set: SiteSet, villas: number[], idPrefix: string): void {
  const panels: SiteInstance[] = [];
  const vents: SiteInstance[] = [];
  for (const k of villas) {
    const y0 = k * D;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        panels.push({ at: [W / 2 + (c - 1) * 176, y0 + D / 2 + (r - 0.5) * 160], bottom: LEVELS.roofTop + 18, tiltDeg: 10 });
      }
    }
    vents.push({ at: [W * 0.18, y0 + 110], bottom: LEVELS.roofTop }, { at: [W * 0.84, y0 + D - 120], bottom: LEVELS.roofTop });
  }
  set.instances.push({ id: `${idPrefix}-solar`, shape: "panel", size: [170, 100, 4], material: "solar", items: panels });
  set.instances.push({ id: `${idPrefix}-vents`, shape: "cylinder", size: [30, 30, 45], material: "render-white", items: vents });
}

/** Rez exterior rooms of villa F (terrasse, couvert): holes in the lawn, as the old ground had. */
function ownExteriorPolygons(): { terrasse: Point[]; couvert: Point[]; all: Point[][] } {
  const rooms = levelById("rez").rooms.filter((r) => EXTERIOR_ROOMS.has(r.id));
  const terrasse = rooms.find((r) => r.id === "terrasse")?.polygon ?? rect(-250, 0, 0, D);
  const couvert = rooms.find((r) => r.id === "couvert")?.polygon ?? rect(W, 270, W + 500, 720);
  return { terrasse, couvert, all: rooms.map((r) => r.polygon) };
}

function bounds(polygon: readonly Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Villas A..E north of villa F: same section, light massing. */
function neighbours(set: SiteSet): void {
  const L = LEVELS;
  const north = VILLA_COUNT * D;
  // One body for the five attached villas (party walls are internal).
  set.boxes.push(box("row-body", 0, D, W, north, -20, L.roofTop, "render-white"));
  for (let k = 1; k < VILLA_COUNT; k++) {
    const y0 = k * D;
    const y1 = y0 + D;
    const t = L.acrotereThickness;
    const id = `villa-${k}`;
    set.boxes.push(box(`${id}-roof-gravel`, t, y0 + t, W - t, y1 - t, L.roofTop, L.roofTop + 1, "gravel"));
    set.boxes.push(box(`${id}-acrotere-w`, 0, y0, t, y1, L.roofTop, L.acrotereTop, "render-white"));
    set.boxes.push(box(`${id}-acrotere-e`, W - t, y0, W, y1, L.roofTop, L.acrotereTop, "render-white"));
    set.boxes.push(box(`${id}-acrotere-s`, t, y0, W - t, y0 + t, L.roofTop, L.acrotereTop, "render-white"));
    if (k === VILLA_COUNT - 1) set.boxes.push(box(`${id}-acrotere-n`, t, y1 - t, W - t, y1, L.roofTop, L.acrotereTop, "render-white"));
    // West façade: rez glazing, étage balcony door and window.
    const westWindows: [number, number, number, number][] = [
      [100, 400, 0, 240],
      [480, 660, 0, 240],
      [140, 440, 285, 515],
      [520, 660, 375, 515],
    ];
    westWindows.forEach(([a, b, lo, hi], i) => set.boxes.push(box(`${id}-win-w${i}`, -3, y0 + a, 0, y0 + b, lo, hi, "window")));
    // East façade: entrance door, rez window, three étage windows.
    const eastWindows: [number, number, number, number][] = [
      [60, 160, 0, 215],
      [300, 420, 100, 220],
      [80, 200, 375, 495],
      [330, 450, 375, 495],
      [560, 680, 375, 495],
    ];
    eastWindows.forEach(([a, b, lo, hi], i) => set.boxes.push(box(`${id}-win-e${i}`, W, y0 + a, W + 3, y0 + b, lo, hi, "window")));
    // Balcony on the west with glass balustrade and its cover.
    set.boxes.push(box(`${id}-balcon`, -207, y0, 0, y1, L.balconBottom, L.balconTop, "concrete-raw"));
    set.boxes.push(box(`${id}-balustrade`, -207, y0 + 2, -205, y1 - 2, L.balconTop, L.balustradeTop, "glass"));
    set.boxes.push(box(`${id}-balustrade-s`, -207, y0, 0, y0 + 2, L.balconTop, L.balustradeTop, "glass"));
    set.boxes.push(box(`${id}-handrail`, -207, y0, -203, y1, L.balustradeTop - 3, L.balustradeTop, "steel"));
    set.boxes.push(box(`${id}-balcon-cover`, -L.balconCoverDepth, y0, 0, y1, L.balconCoverBottom, L.balconCoverTop, "concrete-raw"));
    // Carport on the east: roof slab on three posts.
    set.boxes.push(box(`${id}-carport`, W, y0 + 270, W + 500, y0 + 720, L.couvertRoofBottom, L.couvertRoofTop, "concrete-raw"));
    for (const [i, py] of [280, 495, 710].entries()) {
      set.boxes.push(box(`${id}-carport-post-${i}`, W + 480, y0 + py - 10, W + 500, y0 + py + 10, HEIGHTS.overlay, L.couvertRoofBottom, "concrete-raw"));
    }
    // Timber terrace on the lawn.
    set.surfaces.push({ id: `${id}-decking`, polygon: rect(-250, y0, 0, y1), bottom: HEIGHTS.lawn - 5, top: HEIGHTS.deckingNeighbourTop, material: "decking", rotateUv: true });
  }
  roofEquipment(
    set,
    Array.from({ length: VILLA_COUNT - 1 }, (_, i) => i + 1),
    "row",
  );
  // North gable of villa A: a few windows.
  [
    [150, 450, 0, 230],
    [650, 900, 100, 220],
    [200, 400, 375, 495],
    [650, 850, 375, 495],
  ].forEach(([a, b, lo, hi], i) => set.boxes.push(box(`villa-a-win-n${i}`, a, north, b, north + 3, lo, hi, "window")));
}

/** Road (parcel 7664) with kerbs, and the two-track railway beyond it. */
function roadAndRailway(set: SiteSet): void {
  const r = ROAD;
  set.surfaces.push({ id: "road", polygon: rect(r.x0, r.y0, r.x1, r.y1), top: HEIGHTS.overlay, material: "asphalt" });
  set.boxes.push(box("kerb-north", r.x0, r.y1 - 15, r.x1, r.y1, HEIGHTS.far, HEIGHTS.overlay + 12, "concrete-raw"));
  set.boxes.push(box("kerb-south", r.x0, r.y0, r.x1, r.y0 + 15, HEIGHTS.far, HEIGHTS.overlay + 12, "concrete-raw"));
  const rw = RAILWAY;
  set.prisms.push({
    id: "ballast",
    x0: rw.x0,
    x1: rw.x1,
    profile: [
      [rw.y0, HEIGHTS.far],
      [rw.y1, HEIGHTS.far],
      [rw.y1 - 120, HEIGHTS.ballastTop],
      [rw.y0 + 120, HEIGHTS.ballastTop],
    ].map(([y, h]) => [y, h] as Point),
    material: "ballast",
  });
  const sleepers: SiteInstance[] = [];
  for (const ty of rw.tracks) {
    for (let x = rw.x0 + 30; x < rw.x1; x += 60) sleepers.push({ at: [x, ty], bottom: HEIGHTS.ballastTop - 5 });
    for (const side of [-1, 1]) {
      const ry = ty + side * 75;
      set.boxes.push(box(`rail-${ty}-${side}`, rw.x0, ry - 3.5, rw.x1, ry + 3.5, HEIGHTS.railTop - 15, HEIGHTS.railTop, "steel"));
    }
    // Contact wire.
    set.boxes.push(box(`wire-${ty}`, rw.x0, ty - 1, rw.x1, ty + 1, 560, 562, "steel"));
  }
  set.instances.push({ id: "sleepers", shape: "box", size: [25, 260, 15], material: "sleeper", items: sleepers });
  // Catenary masts every 50 m on the road side, with an arm over both tracks.
  for (let x = rw.x0 + 3000; x < rw.x1; x += 5000) {
    set.boxes.push(box(`mast-${x}`, x - 12, rw.y1 - 60, x + 12, rw.y1 - 36, HEIGHTS.ballastTop - 40, 700, "steel"));
    set.boxes.push(box(`mast-arm-${x}`, x - 5, rw.tracks[1] - 40, x + 5, rw.y1 - 36, 640, 652, "steel"));
  }
}

export function buildSite(): Site {
  const own = ownExteriorPolygons();
  const S = SITE_RECT;
  const P = PARCEL;
  const ground = emptySet();

  // Lawn over the whole detailed area, open over villa F and its terrasse / couvert slabs.
  ground.surfaces.push({ id: "lawn", polygon: rect(S.x0, S.y0, S.x1, S.y1), holes: [rect(0, 0, W, D), ...own.all], top: HEIGHTS.lawn, material: "grass" });

  // Timber decking on villa F's terrasse slab.
  ground.surfaces.push({ id: "decking", polygon: own.terrasse, bottom: LEVELS.terrasseTop, top: HEIGHTS.deckingOwnTop, material: "decking", rotateUv: true });

  // East asphalt: parking up to the east limit, then the shared lane north along the row.
  const c = bounds(own.couvert);
  const asphalt: Point[][] = [
    rect(W, P.y0, P.x1, c.y0),
    rect(c.x1, c.y0, P.x1, D),
    rect(W, c.y1, c.x1, D),
    rect(W, D, P.x1, S.y1),
  ];
  asphalt.filter((p) => bounds(p).y1 > bounds(p).y0 && bounds(p).x1 > bounds(p).x0).forEach((polygon, i) => ground.surfaces.push({ id: `parking-${i}`, polygon, top: HEIGHTS.overlay, material: "asphalt" }));
  // West: neighbour lawn then an asphalt path.
  ground.surfaces.push({ id: "west-path", polygon: rect(-1400, S.y0, -1200, S.y1), top: HEIGHTS.overlay, material: "asphalt" });

  // South: low concrete wall 100 cm inside the parcel limit.
  ground.boxes.push(box("south-wall", P.x0, P.y0 + 80, P.x0 + 1700, P.y0 + 100, HEIGHTS.lawn - 10, HEIGHTS.southWall, "concrete-raw"));

  // Fences between gardens and along the west limit; hedges here and there.
  for (let k = 1; k < VILLA_COUNT; k++) {
    if (k === 2 || k === 4) hedge(ground, `hedge-garden-${k}`, P.x0, k * D - 30, -250, k * D + 30, 160, "hedge-green");
    else fence(ground, `fence-garden-${k}`, [P.x0, k * D], [-250, k * D]);
    // Privacy screen between terraces.
    fence(ground, `screen-terrace-${k}`, [-250, k * D], [-6, k * D]);
  }
  // Low hedge on villa F's own west limit keeps the garden open to the west view.
  hedge(ground, "hedge-west-own", P.x0 - 25, P.y0 + 100, P.x0 + 25, D - 10, 90, "hedge-green");
  fence(ground, "fence-west-south", [P.x0, D], [P.x0, 2 * D]);
  hedge(ground, "hedge-west", P.x0 - 30, 2 * D, P.x0 + 30, 4 * D, 170, "hedge-green");
  fence(ground, "fence-west-north", [P.x0, 4 * D], [P.x0, VILLA_COUNT * D]);

  // East: purple hedge along the limit, garden shed near the couvert, more hedge further north.
  hedge(ground, "hedge-east", P.x1 - 70, P.y0, P.x1, 400, HEIGHTS.hedge, "hedge-red");
  ground.boxes.push(box("shed", P.x1 - 275, 460, P.x1 - 25, 660, HEIGHTS.overlay, 212, "metal-anthracite"));
  ground.boxes.push(box("shed-roof", P.x1 - 285, 450, P.x1 - 15, 670, 212, 220, "metal-anthracite"));
  hedge(ground, "hedge-east-north", P.x1, 2 * D, P.x1 + 60, 3.5 * D, 160, "hedge-green");

  neighbours(ground);
  roadAndRailway(ground);

  const ownRoof = emptySet();
  roofEquipment(ownRoof, [0], "villa-f");

  const far: SiteSurface = {
    id: "far-field",
    polygon: rect(W / 2 - 20000, D / 2 - 20000, W / 2 + 20000, D / 2 + 20000),
    holes: [rect(S.x0, S.y0, S.x1, S.y1)],
    top: HEIGHTS.far,
    material: "field",
  };
  return { far, ground, ownRoof };
}

/** Plan bounding box of any site element. */
export function elementBounds(e: SiteSurface | SiteBox | SitePrism): { x0: number; y0: number; x1: number; y1: number } {
  if ("polygon" in e) return bounds(e.polygon);
  if ("profile" in e) {
    const b = bounds(e.profile);
    return { x0: e.x0, x1: e.x1, y0: b.x0, y1: b.x1 };
  }
  return { x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1 };
}
