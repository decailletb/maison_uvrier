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
}

const EYE = 155;
const LOOK = 120;
const DOOR_KINDS = new Set(["door", "passage", "slidingDoor", "frenchWindow"]);
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
    if (!wall) continue;
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

function roomPresets(room: Room, level: Level): CameraPreset[] {
  const centroid = polygonCentroid(room.polygon);
  const { point } = roomEntrance(room, level);
  const presets: CameraPreset[] = [
    {
      name: room.id,
      label: `${room.name} (${level.name})`,
      position: planToScene(point, EYE, level.floorLevel),
      target: planToScene(farPoint(point, centroid, room.polygon), LOOK, level.floorLevel),
      level: level.id,
    },
  ];
  const [glazing] = roomGlazing(room, level);
  if (glazing) {
    // Second angle: from the far side of the room toward its widest window or bay.
    const far = room.polygon.reduce((best, p) =>
      Math.hypot(p[0] - glazing.mid[0], p[1] - glazing.mid[1]) > Math.hypot(best[0] - glazing.mid[0], best[1] - glazing.mid[1])
        ? p
        : best,
    );
    const dir = unit(far, glazing.mid);
    const lookHeight = Math.min(LOOK + 20, glazing.opening.sill + glazing.opening.height / 2);
    presets.push({
      name: `${room.id}-2`,
      label: `${room.name} — vers la fenêtre`,
      position: planToScene([far[0] + dir[0] * 50, far[1] + dir[1] * 50], EYE, level.floorLevel),
      target: planToScene(glazing.mid, lookHeight, level.floorLevel),
      level: level.id,
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
  const presets: CameraPreset[] = [
    { name: "overview", label: "Vue d'ensemble", position: [20, 12, 16], target: [5.3, 2, -3.6], level: "all" },
    { name: "top", label: "Vue de dessus", position: [5.3, 28, -3.1], target: [5.3, 0, -3.6], level: "all" },
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
