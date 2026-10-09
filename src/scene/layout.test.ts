import { describe, expect, it } from "vitest";
import { house } from "@/data/house";
import { layoutLevels } from "./layout";

describe("layoutLevels", () => {
  it("derives slab thicknesses and rises from the level heights", () => {
    const layouts = layoutLevels(house.levels);
    expect(layouts.map((l) => l.slabBelow)).toEqual([20, 46, 35]);
    expect(layouts.map((l) => l.riseAbove)).toEqual([286, 285, 285]);
  });

  it("pierces each slab with the stairs of the level below", () => {
    const layouts = layoutLevels(house.levels);
    expect(layouts[0].stairHoles).toEqual([]);
    expect(layouts[1].stairHoles).toHaveLength(1);
    expect(layouts[2].stairHoles).toHaveLength(1);
  });
});
