/**
 * Stair steps as plan polygons with their heights. Pure, cm, heights above the level floor.
 *
 * Straight stairs fill the polygon with equal rectangles along the ascent vector.
 * Half-turn stairs (plans p. 3-5, 9) have two parallel flights separated by a central
 * wall and a fan of winders around the wall end: flight A climbs along the ascent from
 * the polygon's near edge, the winders turn 180° in the far band (as deep as a flight is
 * wide), flight B comes back on the other side and arrives on the near edge.
 */
import { boundingBox } from "@/data/geometry";
import type { Point, Stair } from "@/data/schema";

export interface Step {
  /** Tread outline in the plan frame. */
  polygon: Point[];
  /** Top of the tread above the level floor. */
  top: number;
  /** Bottom of the step body: a sloping slab, not a solid block, so the flight below keeps its headroom. */
  bottom: number;
  part: "flight" | "winder";
}

/** Concrete under the tread nosing, cm (section p. 9: about 30 cm across the step). */
const WAIST = 18;

export function stairAscent(stair: Stair): Point {
  if (stair.ascent) {
    const len = Math.hypot(stair.ascent[0], stair.ascent[1]) || 1;
    return [stair.ascent[0] / len, stair.ascent[1] / len];
  }
  const { min, max } = boundingBox(stair.polygon);
  return max[0] - min[0] >= max[1] - min[1] ? [1, 0] : [0, 1];
}

/** Local frame of a stair: `a` along the ascent, `s` across it (to the walker's left). */
export interface StairFrame {
  dir: Point;
  across: Point;
  a0: number;
  a1: number;
  s0: number;
  s1: number;
}

export function stairFrame(stair: Stair): StairFrame {
  const dir = stairAscent(stair);
  const across: Point = [-dir[1], dir[0]];
  const along = stair.polygon.map((p) => p[0] * dir[0] + p[1] * dir[1]);
  const side = stair.polygon.map((p) => p[0] * across[0] + p[1] * across[1]);
  return { dir, across, a0: Math.min(...along), a1: Math.max(...along), s0: Math.min(...side), s1: Math.max(...side) };
}

function toPlan(f: StairFrame, a: number, s: number): Point {
  return [f.dir[0] * a + f.across[0] * s, f.dir[1] * a + f.across[1] * s];
}

function rectSteps(f: StairFrame, a0: number, a1: number, s0: number, s1: number): Point[] {
  return [toPlan(f, a0, s0), toPlan(f, a1, s0), toPlan(f, a1, s1), toPlan(f, a0, s1)];
}

/** Number of risers: half-turn stairs have one more riser than treads. */
export function stairRisers(stair: Stair, defaultRisers = 16): number {
  if (stair.halfTurn) return stair.halfTurn.treads.reduce((n, t) => n + t, 0) + 1;
  return stair.risers ?? defaultRisers;
}

/** Tread outlines in walking order, without heights. */
export function stairTreads(stair: Stair, defaultRisers = 16): { polygon: Point[]; part: Step["part"] }[] {
  const f = stairFrame(stair);
  const ht = stair.halfTurn;
  if (!ht) {
    const n = stairRisers(stair, defaultRisers);
    const run = (f.a1 - f.a0) / n;
    return Array.from({ length: n }, (_, i) => ({ polygon: rectSteps(f, f.a0 + run * i, f.a0 + run * (i + 1), f.s0, f.s1), part: "flight" as const }));
  }
  const [nA, nW, nB] = ht.treads;
  const width = (f.s1 - f.s0 - ht.centralWall) / 2;
  // Flight A on the walker's right (low s) or left (high s).
  const aLow = ht.firstFlight === "right";
  const sideA: [number, number] = aLow ? [f.s0, f.s0 + width] : [f.s1 - width, f.s1];
  const sideB: [number, number] = aLow ? [f.s1 - width, f.s1] : [f.s0, f.s0 + width];
  const aTurn = f.a1 - width;
  const sMid = (f.s0 + f.s1) / 2;
  const treads: { polygon: Point[]; part: Step["part"] }[] = [];
  const pitchA = (aTurn - f.a0) / nA;
  for (let i = 0; i < nA; i++) treads.push({ polygon: rectSteps(f, f.a0 + pitchA * i, f.a0 + pitchA * (i + 1), ...sideA), part: "flight" });

  // Winders: equal angles around the central wall end, from the A side to the B side.
  const start = aLow ? -Math.PI / 2 : Math.PI / 2;
  const sweep = aLow ? Math.PI : -Math.PI;
  const hit = (theta: number): [number, number] => {
    const da = Math.cos(theta);
    const ds = Math.sin(theta);
    const ts: number[] = [];
    if (da > 1e-9) ts.push((f.a1 - aTurn) / da);
    if (ds > 1e-9) ts.push((f.s1 - sMid) / ds);
    if (ds < -1e-9) ts.push((f.s0 - sMid) / ds);
    const t = Math.min(...ts);
    return [aTurn + da * t, sMid + ds * t];
  };
  const corners: { theta: number; p: [number, number] }[] = [
    { theta: Math.atan2(f.s0 - sMid, f.a1 - aTurn), p: [f.a1, f.s0] },
    { theta: Math.atan2(f.s1 - sMid, f.a1 - aTurn), p: [f.a1, f.s1] },
  ];
  for (let j = 0; j < nW; j++) {
    const t0 = start + (sweep * j) / nW;
    const t1 = start + (sweep * (j + 1)) / nW;
    const lo = Math.min(t0, t1);
    const hi = Math.max(t0, t1);
    const inner = corners.filter((c) => c.theta > lo + 1e-9 && c.theta < hi - 1e-9).sort((x, y) => (aLow ? x.theta - y.theta : y.theta - x.theta));
    const local: [number, number][] = [[aTurn, sMid], hit(t0), ...inner.map((c) => c.p), hit(t1)];
    treads.push({ polygon: local.map(([a, s]) => toPlan(f, a, s)), part: "winder" });
  }

  const pitchB = (aTurn - f.a0) / nB;
  for (let k = 0; k < nB; k++) treads.push({ polygon: rectSteps(f, aTurn - pitchB * (k + 1), aTurn - pitchB * k, ...sideB), part: "flight" });
  return treads;
}

/** `rise` is the floor-to-floor height in cm. */
export function stairSteps(stair: Stair, rise: number, defaultRisers = 16): Step[] {
  const risers = stairRisers(stair, defaultRisers);
  const riser = rise / risers;
  return stairTreads(stair, defaultRisers).map((t, i) => {
    const top = riser * (i + 1);
    return { ...t, top, bottom: Math.max(0, top - riser - WAIST) };
  });
}

/** Central wall of a half-turn stair as a centreline segment, or null. */
export function stairCentralWall(stair: Stair): { start: Point; end: Point; thickness: number } | null {
  const ht = stair.halfTurn;
  if (!ht) return null;
  const f = stairFrame(stair);
  const width = (f.s1 - f.s0 - ht.centralWall) / 2;
  const sMid = (f.s0 + f.s1) / 2;
  return { start: toPlan(f, f.a0, sMid), end: toPlan(f, f.a1 - width, sMid), thickness: ht.centralWall };
}

function insidePolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Top of the tread under a plan point (nearest tread centre when outside every tread), cm. */
export function treadTopAt(steps: readonly Step[], p: Point): number {
  const hit = steps.find((s) => insidePolygon(p, s.polygon));
  if (hit) return hit.top;
  let best = steps[0];
  let bestD = Infinity;
  for (const s of steps) {
    const c = s.polygon.reduce<Point>((acc, q) => [acc[0] + q[0] / s.polygon.length, acc[1] + q[1] / s.polygon.length], [0, 0]);
    const d = Math.hypot(c[0] - p[0], c[1] - p[1]);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best?.top ?? 0;
}

/**
 * Guard posts along a polyline: plan point and tread height under it, every `spacing` cm.
 * The tread is probed `inset` cm toward the stair centre so a guard on the wall line
 * still reads the flight next to it.
 */
export function guardSamples(stair: Stair, steps: readonly Step[], line: readonly Point[], spacing = 11, inset = 15): { point: Point; base: number }[] {
  const { min, max } = boundingBox(stair.polygon);
  const centre: Point = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2];
  const out: { point: Point; base: number }[] = [];
  for (let i = 0; i + 1 < line.length; i++) {
    const [p, q] = [line[i], line[i + 1]];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const n = Math.max(1, Math.round(len / spacing));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const pt: Point = [p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n];
      const toC = [centre[0] - pt[0], centre[1] - pt[1]];
      const d = Math.hypot(toC[0], toC[1]) || 1;
      const probe: Point = [pt[0] + (toC[0] / d) * inset, pt[1] + (toC[1] / d) * inset];
      out.push({ point: pt, base: treadTopAt(steps, probe) });
    }
  }
  return out;
}
