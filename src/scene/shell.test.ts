import { describe, expect, it } from "vitest";
import { polygonAreaM2 } from "@/data/geometry";
import { house, levelById } from "@/data/house";
import { LEVELS, etageShell, rezShell, roofShell } from "./shell";

describe("shell", () => {
  it("builds the terrasse and the couvert with its roof on three posts", () => {
    const shell = rezShell(levelById("rez"));
    const ids = shell.slabs.map((s) => s.id);
    expect(ids).toEqual(["terrasse-slab", "couvert-slab", "couvert-roof"]);
    expect(shell.boxes.filter((b) => b.id.startsWith("couvert-post"))).toHaveLength(3);
    const roof = shell.slabs.find((s) => s.id === "couvert-roof")!;
    expect(roof.top - roof.bottom).toBeCloseTo(34.5);
    expect(polygonAreaM2(roof.polygon)).toBeCloseTo(22.5, 1);
  });

  it("builds the balcon with a 100 cm balustrade and a 120 cm cover", () => {
    const shell = etageShell(levelById("etage"));
    const west = shell.boxes.find((b) => b.id === "balustrade-west")!;
    expect(west.top - west.bottom).toBe(100);
    const cover = shell.slabs.find((s) => s.id === "balcon-cover")!;
    const xs = cover.polygon.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(LEVELS.balconCoverDepth);
    expect(Math.max(...xs)).toBe(0);
  });

  it("tops the house with the roof slab and the acrotère at +6.06", () => {
    const shell = roofShell();
    expect(shell.slabs[0].bottom).toBe(house.levels[2].floorLevel + house.levels[2].clearHeight);
    for (const box of shell.boxes) expect(box.top).toBe(606);
  });
});
