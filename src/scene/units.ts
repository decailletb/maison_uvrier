/**
 * The one place where plan coordinates (cm, x right / y up the sheet) become Three.js
 * scene coordinates (metres, x right / y up / z toward the viewer).
 * Plan x -> scene +X, plan y -> scene -Z, height -> scene +Y.
 */
import type { Point } from "@/data/schema";

export const CM = 0.01;

export function cmToM(cm: number): number {
  return cm * CM;
}

/** Plan point plus a height above the level floor (cm) to a scene position (m). */
export function planToScene(p: Point, heightCm = 0, floorLevelCm = 0): [number, number, number] {
  return [p[0] * CM, (floorLevelCm + heightCm) * CM, -p[1] * CM];
}

/** Scene position (m) back to a plan point (cm), dropping the height. */
export function sceneToPlan(v: readonly [number, number, number]): Point {
  return [v[0] / CM, -v[2] / CM];
}

/** Rotation around +Y (radians) of a plan direction vector. */
export function planDirToSceneYaw(dir: Point): number {
  return Math.atan2(dir[1], dir[0]);
}
