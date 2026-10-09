/**
 * Exterior shell as pure data (plan cm, heights absolute): terrasse and couvert slabs,
 * couvert roof on posts, balcon slab with glass balustrade and its cover, roof slab
 * with acrotère. Levels read from elevations p. 6-8 and section p. 9 (DECISIONS.md).
 */
import { FOOTPRINT_CM } from "@/data/house";
import type { Level, Point } from "@/data/schema";

/** Rooms outside the heated footprint: their slabs come from the shell, not from room floors. */
export const EXTERIOR_ROOMS = new Set(["terrasse", "couvert", "balcon"]);

export type ShellMaterial = "concrete" | "gravel" | "asphalt" | "glass" | "metal" | "render";

export interface ShellSlab {
  id: string;
  polygon: Point[];
  /** Absolute heights in cm. */
  bottom: number;
  top: number;
  material: ShellMaterial;
}

export interface ShellBox {
  id: string;
  centre: Point;
  /** Plan size along x and y. */
  size: [number, number];
  bottom: number;
  top: number;
  material: ShellMaterial;
}

export interface Shell {
  slabs: ShellSlab[];
  boxes: ShellBox[];
}

const W = FOOTPRINT_CM.width;
const D = FOOTPRINT_CM.depth;

export const LEVELS = {
  terrasseTop: -17,
  couvertTop: -14,
  slabUnder: 20,
  couvertRoofBottom: 251,
  couvertRoofTop: 285.5,
  balconBottom: 251,
  balconTop: 280,
  balustradeTop: 380,
  balconCoverBottom: 536,
  balconCoverTop: 565.5,
  balconCoverDepth: 120,
  roofBottom: 535,
  roofTop: 560,
  acrotereTop: 606,
  acrotereThickness: 15,
} as const;

function rect(x0: number, y0: number, x1: number, y1: number): Point[] {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

function roomPolygon(level: Level, id: string): Point[] | undefined {
  return level.rooms.find((r) => r.id === id)?.polygon;
}

function bounds(polygon: Point[]): { x0: number; y0: number; x1: number; y1: number } {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Shell elements attached to the rez: terrasse (west) and couvert (east) with its roof on posts. */
export function rezShell(rez: Level): Shell {
  const L = LEVELS;
  const slabs: ShellSlab[] = [];
  const boxes: ShellBox[] = [];
  const terrasse = roomPolygon(rez, "terrasse");
  if (terrasse) slabs.push({ id: "terrasse-slab", polygon: terrasse, bottom: L.terrasseTop - L.slabUnder, top: L.terrasseTop, material: "concrete" });
  const couvert = roomPolygon(rez, "couvert");
  if (couvert) {
    slabs.push({ id: "couvert-slab", polygon: couvert, bottom: L.couvertTop - L.slabUnder, top: L.couvertTop, material: "asphalt" });
    slabs.push({ id: "couvert-roof", polygon: couvert, bottom: L.couvertRoofBottom, top: L.couvertRoofTop, material: "concrete" });
    const b = bounds(couvert);
    const post = 20;
    const ys = [b.y0 + post / 2, (b.y0 + b.y1) / 2, b.y1 - post / 2];
    ys.forEach((y, i) =>
      boxes.push({ id: `couvert-post-${i}`, centre: [b.x1 - post / 2, y], size: [post, post], bottom: L.couvertTop, top: L.couvertRoofBottom, material: "concrete" }),
    );
  }
  return { slabs, boxes };
}

/** Shell elements attached to the étage: balcon slab, glass balustrade, balcon cover. */
export function etageShell(etage: Level): Shell {
  const L = LEVELS;
  const slabs: ShellSlab[] = [];
  const boxes: ShellBox[] = [];
  const balcon = roomPolygon(etage, "balcon");
  if (balcon) {
    slabs.push({ id: "balcon-slab", polygon: balcon, bottom: L.balconBottom, top: L.balconTop, material: "concrete" });
    const b = bounds(balcon);
    const glass = 2;
    // West long edge and both short edges carry a 100 cm glass balustrade.
    boxes.push({ id: "balustrade-west", centre: [b.x0 + glass / 2, (b.y0 + b.y1) / 2], size: [glass, b.y1 - b.y0], bottom: L.balconTop, top: L.balustradeTop, material: "glass" });
    boxes.push({ id: "balustrade-south", centre: [(b.x0 + b.x1) / 2, b.y0 + glass / 2], size: [b.x1 - b.x0, glass], bottom: L.balconTop, top: L.balustradeTop, material: "glass" });
    boxes.push({ id: "balustrade-north", centre: [(b.x0 + b.x1) / 2, b.y1 - glass / 2], size: [b.x1 - b.x0, glass], bottom: L.balconTop, top: L.balustradeTop, material: "glass" });
    boxes.push({ id: "handrail-west", centre: [b.x0 + 2, (b.y0 + b.y1) / 2], size: [4, b.y1 - b.y0], bottom: L.balustradeTop - 3, top: L.balustradeTop, material: "metal" });
    // Cover: 120 cm deep over the full length, from the façade outward.
    slabs.push({ id: "balcon-cover", polygon: rect(b.x1 - L.balconCoverDepth, b.y0, b.x1, b.y1), bottom: L.balconCoverBottom, top: L.balconCoverTop, material: "concrete" });
  }
  return { slabs, boxes };
}

/** Flat roof with gravel and the acrotère parapet around the footprint. */
export function roofShell(): Shell {
  const L = LEVELS;
  const t = L.acrotereThickness;
  const slabs: ShellSlab[] = [
    { id: "roof-slab", polygon: rect(0, 0, W, D), bottom: L.roofBottom, top: L.roofTop, material: "gravel" },
  ];
  const boxes: ShellBox[] = [
    { id: "acrotere-south", centre: [W / 2, t / 2], size: [W, t], bottom: L.roofTop, top: L.acrotereTop, material: "render" },
    { id: "acrotere-north", centre: [W / 2, D - t / 2], size: [W, t], bottom: L.roofTop, top: L.acrotereTop, material: "render" },
    { id: "acrotere-west", centre: [t / 2, D / 2], size: [t, D], bottom: L.roofTop, top: L.acrotereTop, material: "render" },
    { id: "acrotere-east", centre: [W - t / 2, D / 2], size: [t, D], bottom: L.roofTop, top: L.acrotereTop, material: "render" },
  ];
  return { slabs, boxes };
}
