/** Pure placement helpers for the editor: room lookup, grid and wall snapping. Plan cm. */
import { distanceToSegment, pointInPolygon } from "@/data/geometry";
import type { Level, Point, Room, Wall } from "@/data/schema";

export function roomAt(level: Level, point: Point): Room | undefined {
  return level.rooms.find((r) => pointInPolygon(point, r.polygon));
}

export function snapGrid(value: number, step = 5): number {
  return Math.round(value / step) * step;
}

/** Nearest wall segment to a point, with the distance to its centreline. */
export function nearestWall(walls: readonly Wall[], point: Point): { wall: Wall; a: Point; b: Point; distance: number } | undefined {
  let best: { wall: Wall; a: Point; b: Point; distance: number } | undefined;
  for (const wall of walls) {
    for (let i = 1; i < wall.points.length; i++) {
      const a = wall.points[i - 1];
      const b = wall.points[i];
      const distance = distanceToSegment(point, a, b);
      if (!best || distance < best.distance) best = { wall, a, b, distance };
    }
  }
  return best;
}

/**
 * When the item centre is within `reach` of a wall face, push it against the wall
 * (back of the item on the wall) and turn its back to it. Returns the input unchanged
 * otherwise. `depth` is the item size along its own front-back axis.
 */
export function snapToWall(
  point: Point,
  rotationDeg: number,
  depth: number,
  walls: readonly Wall[],
  reach = 40,
): { point: Point; rotationDeg: number; snapped: boolean } {
  const near = nearestWall(walls, point);
  if (!near) return { point, rotationDeg, snapped: false };
  const half = near.wall.thickness / 2;
  if (near.distance - half > reach) return { point, rotationDeg, snapped: false };
  const dx = near.b[0] - near.a[0];
  const dy = near.b[1] - near.a[1];
  const len = Math.hypot(dx, dy) || 1;
  // Normal pointing from the wall toward the item side.
  let nx = -dy / len;
  let ny = dx / len;
  const side = (point[0] - near.a[0]) * nx + (point[1] - near.a[1]) * ny;
  if (side < 0) {
    nx = -nx;
    ny = -ny;
  }
  // Foot of the perpendicular on the centreline, then offset by half wall + half depth.
  const t = Math.max(0, Math.min(1, ((point[0] - near.a[0]) * dx + (point[1] - near.a[1]) * dy) / (len * len)));
  const foot: Point = [near.a[0] + dx * t, near.a[1] + dy * t];
  const offset = half + depth / 2;
  const snappedPoint: Point = [foot[0] + nx * offset, foot[1] + ny * offset];
  // Front faces away from the wall: rotation 0 means front toward -y, so the front
  // direction is (sin r, -cos r); we want it equal to the normal.
  const rotation = (Math.atan2(nx, -ny) * 180) / Math.PI;
  return { point: snappedPoint, rotationDeg: Math.round(rotation), snapped: true };
}

/** Axis-aligned footprint of an item (w across, d deep) rotated by `rotationDeg`. */
export function itemFootprint(centre: Point, w: number, d: number, rotationDeg: number): Point[] {
  const r = (rotationDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const corners: Point[] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ];
  return corners.map(([x, y]) => [centre[0] + x * c - y * s, centre[1] + x * s + y * c]);
}
