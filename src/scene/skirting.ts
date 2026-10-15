/**
 * Skirting boards along interior room outlines, interrupted at doors, passages and
 * floor-level glazing. Pure, plan cm.
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

export function levelSkirting(level: Level): SkirtingRun[] {
  const openings = floorOpenings(level);
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
      // Parameter intervals [t0, t1] (cm along the edge) covered by an opening on a parallel wall nearby.
      const cuts: [number, number][] = [];
      for (const o of openings) {
        const ol = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
        if (ol < 1) continue;
        const ou: Point = [(o.b[0] - o.a[0]) / ol, (o.b[1] - o.a[1]) / ol];
        if (Math.abs(u[0] * ou[0] + u[1] * ou[1]) < 0.98) continue;
        // Perpendicular distance from the opening's centreline to the edge line.
        const dist = Math.abs((o.a[0] - p[0]) * -u[1] + (o.a[1] - p[1]) * u[0]);
        if (dist > o.halfThickness + 8) continue;
        const ta = (o.a[0] - p[0]) * u[0] + (o.a[1] - p[1]) * u[1];
        const tb = (o.b[0] - p[0]) * u[0] + (o.b[1] - p[1]) * u[1];
        const t0 = Math.max(0, Math.min(ta, tb));
        const t1 = Math.min(len, Math.max(ta, tb));
        if (t1 > t0) cuts.push([t0, t1]);
      }
      cuts.sort((x, y) => x[0] - y[0]);
      let cursor = 0;
      const push = (t0: number, t1: number) => {
        if (t1 - t0 < MIN_RUN) return;
        runs.push({ roomId: room.id, start: [p[0] + u[0] * t0, p[1] + u[1] * t0], end: [p[0] + u[0] * t1, p[1] + u[1] * t1] });
      };
      for (const [t0, t1] of cuts) {
        if (t0 > cursor) push(cursor, t0);
        cursor = Math.max(cursor, t1);
      }
      push(cursor, len);
    }
  }
  return runs;
}
