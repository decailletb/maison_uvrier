/**
 * Skirting boards along interior room outlines where a wall stands, interrupted at
 * doors, passages and floor-level glazing; open boundaries between rooms (séjour /
 * entrée) and furniture edges get none. Pure, plan cm.
 */
import { pointAlong } from "@/data/geometry";
import type { Level, Point } from "@/data/schema";
import { EXTERIOR_ROOMS } from "./shell";

export interface SkirtingRun {
  roomId: string;
  start: Point;
  end: Point;
}

const MIN_RUN = 4;

/** Openings reaching the floor, as plan segments on their wall centreline. */
function floorOpenings(level: Level): { a: Point; b: Point; halfThickness: number }[] {
  return level.openings
    .filter((o) => o.sill < 1)
    .flatMap((o) => {
      const wall = level.walls.find((w) => w.id === o.wallId);
      if (!wall) return [];
      const a = pointAlong(wall.points, o.offset).point;
      const b = pointAlong(wall.points, o.offset + o.width).point;
      return [{ a, b, halfThickness: wall.thickness / 2 }];
    });
}

/** Wall centreline segments with their half thickness. */
function wallSegments(level: Level): { a: Point; b: Point; halfThickness: number }[] {
  return level.walls
    .filter((w) => (w.height ?? level.clearHeight) > 20)
    .flatMap((w) => w.points.slice(1).map((b, i) => ({ a: w.points[i], b, halfThickness: w.thickness / 2 })));
}

/** Intervals along the edge p→u (length len) covered by parallel segments within reach. */
function coverage(p: Point, u: Point, len: number, segs: { a: Point; b: Point; halfThickness: number }[]): [number, number][] {
  const out: [number, number][] = [];
  for (const o of segs) {
    const ol = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
    if (ol < 1) continue;
    const ou: Point = [(o.b[0] - o.a[0]) / ol, (o.b[1] - o.a[1]) / ol];
    if (Math.abs(u[0] * ou[0] + u[1] * ou[1]) < 0.98) continue;
    // Perpendicular distance from the segment's line to the edge line.
    const dist = Math.abs((o.a[0] - p[0]) * -u[1] + (o.a[1] - p[1]) * u[0]);
    if (dist > o.halfThickness + 8) continue;
    const ta = (o.a[0] - p[0]) * u[0] + (o.a[1] - p[1]) * u[1];
    const tb = (o.b[0] - p[0]) * u[0] + (o.b[1] - p[1]) * u[1];
    const t0 = Math.max(0, Math.min(ta, tb));
    const t1 = Math.min(len, Math.max(ta, tb));
    if (t1 > t0) out.push([t0, t1]);
  }
  return out.sort((x, y) => x[0] - y[0]);
}

/** Union of sorted intervals minus another set of intervals. */
function subtract(keep: [number, number][], cut: [number, number][]): [number, number][] {
  const merged: [number, number][] = [];
  for (const [a, b] of keep) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  const out: [number, number][] = [];
  for (const [a, b] of merged) {
    let cursor = a;
    for (const [c0, c1] of cut) {
      if (c1 <= cursor || c0 >= b) continue;
      if (c0 > cursor) out.push([cursor, c0]);
      cursor = Math.max(cursor, c1);
    }
    if (cursor < b) out.push([cursor, b]);
  }
  return out;
}

export function levelSkirting(level: Level): SkirtingRun[] {
  const openings = floorOpenings(level);
  const walls = wallSegments(level);
  const runs: SkirtingRun[] = [];
  for (const room of level.rooms) {
    if (EXTERIOR_ROOMS.has(room.id)) continue;
    const poly = room.polygon;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < MIN_RUN) continue;
      const u: Point = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
      for (const [t0, t1] of subtract(coverage(p, u, len, walls), coverage(p, u, len, openings))) {
        if (t1 - t0 < MIN_RUN) continue;
        runs.push({ roomId: room.id, start: [p[0] + u[0] * t0, p[1] + u[1] * t0], end: [p[0] + u[0] * t1, p[1] + u[1] * t1] });
      }
    }
  }
  return runs;
}
