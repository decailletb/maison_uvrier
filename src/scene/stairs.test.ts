import { describe, expect, it } from "vitest";
import type { Stair } from "@/data/schema";
import { stairAscent, stairSteps } from "./stairs";

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

describe("stairs", () => {
  it("defaults the ascent to the long axis", () => {
    expect(stairAscent(stair)).toEqual([0, 1]);
    expect(stairAscent({ ...stair, ascent: [-3, 0] })).toEqual([-1, 0]);
  });

  it("fills the polygon with equal steps up to the next floor", () => {
    const steps = stairSteps(stair, 280);
    expect(steps).toHaveLength(4);
    expect(steps.map((s) => s.top)).toEqual([70, 140, 210, 280]);
    expect(steps.map((s) => s.centre)).toEqual([
      [150, 50],
      [150, 150],
      [150, 250],
      [150, 350],
    ]);
    expect(steps[0].run).toBe(100);
    expect(steps[0].width).toBe(100);
  });

  it("reverses with a negative ascent", () => {
    const steps = stairSteps({ ...stair, ascent: [0, -1] }, 280);
    expect(steps[0].centre).toEqual([150, 350]);
    expect(steps[3].centre).toEqual([150, 50]);
  });
});
