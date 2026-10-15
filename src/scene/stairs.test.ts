import { describe, expect, it } from "vitest";
import type { Stair } from "@/data/schema";
import { levelById } from "@/data/house";
import { guardSamples, stairAscent, stairCentralWall, stairRisers, stairSteps } from "./stairs";

const stair: Stair = {
  id: "s",
  polygon: [
    [100, 0],
    [200, 0],
    [200, 400],
    [100, 400],
  ],
  risers: 4,
  direction: "up",
  toLevel: "rez",
};

function area(poly: readonly [number, number][]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
}

describe("straight stairs", () => {
  it("defaults the ascent to the long axis", () => {
    expect(stairAscent(stair)).toEqual([0, 1]);
    expect(stairAscent({ ...stair, ascent: [-3, 0] })).toEqual([-1, 0]);
  });

  it("fills the polygon with equal steps up to the next floor", () => {
    const steps = stairSteps(stair, 280);
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.top)).toEqual([70, 140, 210, 280]);
    expect(steps[0].polygon).toEqual([
      [200, 0],
      [200, 100],
      [100, 100],
      [100, 0],
    ]);
    expect(steps.every((s) => area(s.polygon) === 100 * 100)).toBe(true);
  });

  it("reverses with a negative ascent", () => {
    const steps = stairSteps({ ...stair, ascent: [0, -1] }, 280);
    expect(Math.max(...steps[0].polygon.map((p) => p[1]))).toBe(400);
    expect(Math.min(...steps[3].polygon.map((p) => p[1]))).toBe(0);
  });
});

describe("half-turn stairs", () => {
  const rez = levelById("rez").stairs[0];

  it("uses 4 + 6 + 4 treads and 15 risers from the rez to the étage", () => {
    expect(stairRisers(rez)).toBe(15);
    const steps = stairSteps(rez, 285);
    expect(steps.map((s) => s.part)).toEqual([...Array(4).fill("flight"), ...Array(6).fill("winder"), ...Array(4).fill("flight")]);
    expect(steps.at(-1)!.top).toBeCloseTo(285 - 19);
  });

  it("tiles the stairwell except the central wall", () => {
    const steps = stairSteps(rez, 285);
    const total = steps.reduce((sum, s) => sum + area(s.polygon), 0);
    const wall = stairCentralWall(rez)!;
    const wallArea = wall.thickness * Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
    expect(total + wallArea).toBeCloseTo(200 * 228, 0);
  });

  it("starts on the west side climbing south and arrives on the east side climbing north", () => {
    const steps = stairSteps(rez, 285);
    const cx = (p: [number, number][]) => p.reduce((s, q) => s + q[0], 0) / p.length;
    const cy = (p: [number, number][]) => p.reduce((s, q) => s + q[1], 0) / p.length;
    expect(cx(steps[0].polygon)).toBeLessThan(530);
    expect(cy(steps[0].polygon)).toBeGreaterThan(cy(steps[3].polygon));
    expect(cx(steps.at(-1)!.polygon)).toBeGreaterThan(550);
    expect(cy(steps.at(-1)!.polygon)).toBeGreaterThan(cy(steps[10].polygon));
  });

  it("lifts the séjour balustrade with the first flight", () => {
    const steps = stairSteps(rez, 285);
    const samples = guardSamples(rez, steps, rez.guards![0]);
    expect(samples.length).toBeGreaterThan(8);
    // Guard runs from y 100 (higher, near the winders) to y 205 (lower, near the foot).
    expect(samples[0].base).toBeGreaterThan(samples.at(-1)!.base);
  });
});
