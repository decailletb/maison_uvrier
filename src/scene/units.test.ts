import { describe, expect, it } from "vitest";
import { cmToM, planDirToSceneYaw, planToScene, sceneToPlan } from "./units";

describe("units", () => {
  it("converts cm to m", () => {
    expect(cmToM(1055)).toBeCloseTo(10.55);
  });

  it("maps plan y to scene -z and height to +y", () => {
    expect(planToScene([100, 200], 50, 285)).toEqual([1, 3.35, -2]);
    expect(sceneToPlan([1, 3.35, -2])).toEqual([100, 200]);
  });

  it("round-trips a point", () => {
    const p: [number, number] = [123.4, 567.8];
    const back = sceneToPlan(planToScene(p));
    expect(back[0]).toBeCloseTo(p[0]);
    expect(back[1]).toBeCloseTo(p[1]);
  });

  it("gives a yaw of 0 for plan +x and pi/2 for plan +y", () => {
    expect(planDirToSceneYaw([1, 0])).toBe(0);
    expect(planDirToSceneYaw([0, 1])).toBeCloseTo(Math.PI / 2);
  });
});
