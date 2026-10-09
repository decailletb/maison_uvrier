/**
 * Named camera presets, generated from the house data. Positions and targets in
 * metres (scene units). Playwright selects one with `?preset=<name>`; the UI lists
 * them. Names: `overview`, `top`, `<level>-top`, `<room-id>`, `<room-id>-2`.
 */
import { distanceToSegment, pointAlong, pointInPolygon, polygonCentroid } from "@/data/geometry";
import { FOOTPRINT_CM, house } from "@/data/house";
import type { Level, LevelId, Opening, Point, Room } from "@/data/schema";
import { planToScene } from "@/scene/units";

export type LevelMode = LevelId | "all";

export interface CameraPreset {
  name: string;
  /** French label shown in the UI. */
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  /** Level mode to show; `all` for exterior views. */
  level: LevelMode;
  /** Room the preset stands in; its label is the only one drawn. */
  roomId?: string;
}

const EYE = 155;
const LOOK = 120;
const DOOR_KINDS = new Set(["door", "passage"]);
const GLAZED_KINDS = new Set(["window", "frenchWindow", "slidingDoor"]);

function unit(from: Point, to: Point): Point {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

function onBoundary(p: Point, polygon: readonly Point[], tolerance: number): boolean {
  for (let i = 0; i < polygon.length; i++) {
    if (distanceToSegment(p, polygon[i], polygon[(i + 1) % polygon.length]) <= tolerance) return true;
  }
  return false;
}

/** Plan point just inside the room at its first door, or at its farthest corner. */
export function roomEntrance(room: Room, level: Level): { point: Point; fromDoor: boolean } {
  const centroid = polygonCentroid(room.polygon);
  for (const opening of level.openings) {
    if (!DOOR_KINDS.has(opening.kind)) continue;
    const wall = level.walls.find((w) => w.id === opening.wallId);
    // Interior doors only: a bay or porte-fenêtre leads outside, not into the room.
    if (!wall || wall.exterior) continue;
    const mid = pointAlong(wall.points, opening.offset + opening.width / 2).point;
    if (!onBoundary(mid, room.polygon, wall.thickness / 2 + 6)) continue;
    const dir = unit(mid, centroid);
    return { point: [mid[0] + dir[0] * 70, mid[1] + dir[1] * 70], fromDoor: true };
  }
  const far = room.polygon.reduce((best, p) =>
    Math.hypot(p[0] - centroid[0], p[1] - centroid[1]) > Math.hypot(best[0] - centroid[0], best[1] - centroid[1]) ? p : best,
  );
  const dir = unit(far, centroid);
  return { point: [far[0] + dir[0] * 60, far[1] + dir[1] * 60], fromDoor: false };
}

/** Walks from `from` through `through` until the polygon edge; the point 30 cm before it. */
function farPoint(from: Point, through: Point, polygon: readonly Point[]): Point {
  const dir = unit(from, through);
  let p: Point = through;
  for (let d = 0; d < 2000; d += 5) {
    const next: Point = [through[0] + dir[0] * d, through[1] + dir[1] * d];
    if (!pointInPolygon(next, polygon)) break;
    p = next;
  }
  return [p[0] - dir[0] * 30, p[1] - dir[1] * 30];
}

/** Glazed exterior openings on the room boundary, widest first, with their plan midpoint. */
export function roomGlazing(room: Room, level: Level): { opening: Opening; mid: Point }[] {
  const found: { opening: Opening; mid: Point }[] = [];
  for (const opening of level.openings) {
    if (!GLAZED_KINDS.has(opening.kind)) continue;
    const wall = level.walls.find((w) => w.id === opening.wallId);
    if (!wall?.exterior) continue;
    const mid = pointAlong(wall.points, opening.offset + opening.width / 2).point;
    if (onBoundary(mid, room.polygon, wall.thickness / 2 + 6)) found.push({ opening, mid });
  }
  return found.sort((a, b) => b.opening.width - a.opening.width);
}

function farthest(points: readonly Point[], from: Point): Point {
  return points.reduce((best, p) => (Math.hypot(p[0] - from[0], p[1] - from[1]) > Math.hypot(best[0] - from[0], best[1] - from[1]) ? p : best));
}

/** True when the segment a-b stays inside the polygon (sampled every 10 cm). */
function clearLine(a: Point, b: Point, polygon: readonly Point[]): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(len / 10));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (!pointInPolygon([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], polygon, 0.5)) return false;
  }
  return true;
}

/**
 * Diagonal view: from a corner near the entrance toward the opposite corner, choosing
 * the first corner (nearest the entrance first) whose diagonal is not blocked by a
 * concave part of the room.
 */
export function cornerView(room: Room, level: Level): { position: Point; target: Point } {
  const entrance = roomEntrance(room, level).point;
  const corners = [...room.polygon].sort(
    (a, b) => Math.hypot(a[0] - entrance[0], a[1] - entrance[1]) - Math.hypot(b[0] - entrance[0], b[1] - entrance[1]),
  );
  for (const corner of corners) {
    const opposite = farthest(room.polygon, corner);
    const dir = unit(corner, opposite);
    const position: Point = [corner[0] + dir[0] * 55, corner[1] + dir[1] * 55];
    const target: Point = [opposite[0] - dir[0] * 30, opposite[1] - dir[1] * 30];
    if (pointInPolygon(position, room.polygon) && clearLine(position, target, room.polygon)) return { position, target };
  }
  const centroid = polygonCentroid(room.polygon);
  return { position: entrance, target: farPoint(entrance, centroid, room.polygon) };
}

function roomPresets(room: Room, level: Level): CameraPreset[] {
  const centroid = polygonCentroid(room.polygon);
  const corner = cornerView(room, level);
  // Pitch down about 14° so that small rooms show their floor; never below 60 cm.
  const diagonal = Math.hypot(corner.target[0] - corner.position[0], corner.target[1] - corner.position[1]);
  const cornerLook = Math.max(60, Math.min(LOOK, EYE - 0.25 * diagonal));
  const presets: CameraPreset[] = [
    {
      name: room.id,
      label: `${room.name} (${level.name})`,
      position: planToScene(corner.position, EYE, level.floorLevel),
      target: planToScene(corner.target, cornerLook, level.floorLevel),
      level: level.id,
      roomId: room.id,
    },
  ];
  const [glazing] = roomGlazing(room, level);
  if (glazing) {
    // Second angle: from the far side of the room toward its widest window or bay,
    // stepping away from the wall and slightly toward the centre to avoid near walls.
    const far = farthest(room.polygon, glazing.mid);
    const dir = unit(far, glazing.mid);
    const position: Point = [
      far[0] + dir[0] * 70 + (centroid[0] - far[0]) * 0.15,
      far[1] + dir[1] * 70 + (centroid[1] - far[1]) * 0.15,
    ];
    const lookHeight = Math.min(LOOK + 20, glazing.opening.sill + glazing.opening.height / 2);
    presets.push({
      name: `${room.id}-2`,
      label: `${room.name} — vers la fenêtre`,
      position: planToScene(pointInPolygon(position, room.polygon) ? position : corner.position, EYE, level.floorLevel),
      target: planToScene(glazing.mid, lookHeight, level.floorLevel),
      level: level.id,
      roomId: room.id,
    });
  }
  return presets;
}

function levelTop(level: Level): CameraPreset {
  const centre: Point = [FOOTPRINT_CM.width / 2, FOOTPRINT_CM.depth / 2];
  const target = planToScene(centre, 0, level.floorLevel);
  return {
    name: `${level.id}-top`,
    label: `${level.name} — dessus`,
    position: [target[0], target[1] + 16, target[2] + 0.5],
    target,
    level: level.id,
  };
}

export function buildPresets(): CameraPreset[] {
  const cx = (FOOTPRINT_CM.width / 2) * 0.01;
  const cz = -(FOOTPRINT_CM.depth / 2) * 0.01;
  const presets: CameraPreset[] = [
    { name: "overview", label: "Vue d'ensemble", position: [20, 12, 16], target: [cx, 2, cz], level: "all" },
    { name: "top", label: "Vue de dessus", position: [cx, 28, cz + 0.5], target: [cx, 0, cz], level: "all" },
    // Elevations: the camera stands 22 m out from the façade it names, at eye level + 2 m.
    { name: "sud", label: "Façade sud", position: [cx + 2, 3.5, 22], target: [cx, 2.5, cz], level: "all" },
    { name: "ouest", label: "Façade ouest", position: [-20, 3.5, cz], target: [0, 2.5, cz], level: "all" },
    { name: "est", label: "Façade est", position: [FOOTPRINT_CM.width * 0.01 + 22, 3.5, cz + 1], target: [FOOTPRINT_CM.width * 0.01, 2.5, cz], level: "all" },
    { name: "aerial", label: "Vue aérienne", position: [-14, 22, 16], target: [cx, 1, cz], level: "all" },
  ];
  for (const level of house.levels) {
    presets.push(levelTop(level));
    for (const room of level.rooms) presets.push(...roomPresets(room, level));
  }
  return presets;
}

export const CAMERA_PRESETS: readonly CameraPreset[] = buildPresets();

export const DEFAULT_PRESET = CAMERA_PRESETS[0];

export function findPreset(name: string | null | undefined): CameraPreset | undefined {
  if (!name) return undefined;
  return CAMERA_PRESETS.find((p) => p.name === name);
}

/** Reads `?preset=<name>` from a query string; falls back to the default preset. */
export function presetFromSearch(search: string): CameraPreset {
  const name = new URLSearchParams(search).get("preset");
  return findPreset(name) ?? DEFAULT_PRESET;
}
