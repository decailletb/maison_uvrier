/**
 * Straight flight of steps filling a stair polygon along its ascent vector. Pure, cm.
 * Each step is a box: footprint rectangle in the plan frame, from the level floor up
 * to its tread height (solid steps, no visible underside).
 */
import { boundingBox } from "@/data/geometry";
import type { Point, Stair } from "@/data/schema";

export interface Step {
  /** Centre of the tread in the plan frame. */
  centre: Point;
  /** Size along the ascent and across it. */
  run: number;
  width: number;
  /** Top of the tread above the level floor; the box spans 0..top. */
  top: number;
  yaw: number;
}

export function stairAscent(stair: Stair): Point {
  if (stair.ascent) {
    const len = Math.hypot(stair.ascent[0], stair.ascent[1]) || 1;
    return [stair.ascent[0] / len, stair.ascent[1] / len];
  }
  const { min, max } = boundingBox(stair.polygon);
  return max[0] - min[0] >= max[1] - min[1] ? [1, 0] : [0, 1];
}

/** `rise` is the floor-to-floor height in cm. */
export function stairSteps(stair: Stair, rise: number, defaultRisers = 16): Step[] {
  const risers = stair.risers ?? defaultRisers;
  const dir = stairAscent(stair);
  const across: Point = [-dir[1], dir[0]];
  // Extent of the polygon along the ascent and across it.
  const along = stair.polygon.map((p) => p[0] * dir[0] + p[1] * dir[1]);
  const side = stair.polygon.map((p) => p[0] * across[0] + p[1] * across[1]);
  const a0 = Math.min(...along);
  const a1 = Math.max(...along);
  const s0 = Math.min(...side);
  const s1 = Math.max(...side);
  const run = (a1 - a0) / risers;
  const width = s1 - s0;
  const sideMid = (s0 + s1) / 2;
  const riser = rise / risers;
  const yaw = Math.atan2(dir[1], dir[0]);
  const steps: Step[] = [];
  for (let i = 0; i < risers; i++) {
    const alongMid = a0 + run * (i + 0.5);
    steps.push({
      centre: [dir[0] * alongMid + across[0] * sideMid, dir[1] * alongMid + across[1] * sideMid],
      run,
      width,
      top: riser * (i + 1),
      yaw,
    });
  }
  return steps;
}
