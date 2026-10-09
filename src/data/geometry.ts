/** 2D helpers on plan coordinates (cm). Pure functions, no Three.js. */
import type { Point } from "./schema";

/** Signed area by the shoelace formula; positive when counter-clockwise. */
export function signedArea(polygon: readonly Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Area in cm². */
export function polygonArea(polygon: readonly Point[]): number {
  return Math.abs(signedArea(polygon));
}

/** Area in m² from a polygon in cm. */
export function polygonAreaM2(polygon: readonly Point[]): number {
  return polygonArea(polygon) / 10_000;
}

export function polylineLength(points: readonly Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/**
 * Point at `distance` along a polyline, with the unit direction of the segment it
 * lies on. Clamped to the polyline ends.
 */
export function pointAlong(points: readonly Point[], distance: number): { point: Point; dir: Point } {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const seg = Math.hypot(bx - ax, by - ay);
    const dir: Point = seg === 0 ? [1, 0] : [(bx - ax) / seg, (by - ay) / seg];
    if (remaining <= seg || i === points.length - 1) {
      const t = seg === 0 ? 0 : Math.min(remaining, seg) / seg;
      return { point: [ax + (bx - ax) * t, ay + (by - ay) * t], dir };
    }
    remaining -= seg;
  }
  return { point: points[0], dir: [1, 0] };
}

/** Even-odd rule; points on the boundary count as inside within `eps`. */
export function pointInPolygon(p: Point, polygon: readonly Point[], eps = 1e-6): boolean {
  const [x, y] = p;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (distanceToSegment(p, polygon[i], polygon[j]) <= eps) return true;
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function polygonCentroid(polygon: readonly Point[]): Point {
  const a = signedArea(polygon);
  if (a === 0) {
    const n = polygon.length;
    return [polygon.reduce((s, p) => s + p[0], 0) / n, polygon.reduce((s, p) => s + p[1], 0) / n];
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    const cross = x1 * y2 - x2 * y1;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  return [cx / (6 * a), cy / (6 * a)];
}

export function boundingBox(points: readonly Point[]): { min: Point; max: Point } {
  const min: Point = [Infinity, Infinity];
  const max: Point = [-Infinity, -Infinity];
  for (const [x, y] of points) {
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
  }
  return { min, max };
}
