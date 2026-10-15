import { describe, expect, it } from "vitest";
import { FOOTPRINT_CM } from "@/data/house";
import { LEVELS } from "./shell";
import { PARCEL, SITE_RECT, VILLA_COUNT, buildSite, elementBounds } from "./site";

const W = FOOTPRINT_CM.width;
const D = FOOTPRINT_CM.depth;
const site = buildSite();

function overlapsHouse(b: { x0: number; y0: number; x1: number; y1: number }): boolean {
  return b.x0 < W && b.x1 > 0 && b.y0 < D && b.y1 > 0;
}

describe("site", () => {
  it("keeps every box and prism out of villa F's footprint", () => {
    const offenders = [...site.ground.boxes, ...site.ground.prisms].filter((e) => overlapsHouse(elementBounds(e))).map((e) => e.id);
    expect(offenders).toEqual([]);
  });

  it("leaves the house footprint open in the lawn", () => {
    const lawn = site.ground.surfaces.find((s) => s.id === "lawn")!;
    const holes = (lawn.holes ?? []).map((h) => elementBounds({ id: "h", polygon: h, top: 0, material: "grass" }));
    expect(holes).toContainEqual({ x0: 0, y0: 0, x1: W, y1: D });
    const solidOverHouse = site.ground.surfaces.filter((s) => s.id !== "lawn" && overlapsHouse(elementBounds(s)));
    expect(solidOverHouse.map((s) => s.id)).toEqual([]);
  });

  it("models five neighbour villas north of villa F", () => {
    expect(VILLA_COUNT - 1).toBe(5);
    const carports = site.ground.boxes.filter((b) => /^villa-\d-carport$/.test(b.id));
    expect(carports).toHaveLength(5);
    expect(Math.min(...carports.map((b) => b.y0))).toBeGreaterThanOrEqual(D);
    const body = site.ground.boxes.find((b) => b.id === "row-body")!;
    expect([body.y0, body.y1]).toEqual([D, VILLA_COUNT * D]);
  });

  it("matches the parcel extract (≈ 2950 × 1430 cm, ~419 m²)", () => {
    const w = PARCEL.x1 - PARCEL.x0;
    const d = PARCEL.y1 - PARCEL.y0;
    expect(w).toBeGreaterThan(2700);
    expect(w).toBeLessThan(3100);
    expect(d).toBeGreaterThan(1350);
    expect(d).toBeLessThan(1500);
    expect((w * d) / 1e4).toBeGreaterThan(380);
    expect((w * d) / 1e4).toBeLessThan(460);
    expect(SITE_RECT.x0).toBeLessThan(PARCEL.x0);
    expect(SITE_RECT.x1).toBeGreaterThan(PARCEL.x1);
  });

  it("puts six solar panels on every roof, above the roof slab", () => {
    const panels = [...site.ground.instances, ...site.ownRoof.instances].filter((i) => i.shape === "panel").flatMap((i) => i.items);
    expect(panels).toHaveLength(6 * VILLA_COUNT);
    for (const it of panels) expect(it.bottom).toBeGreaterThan(LEVELS.roofTop);
    const own = site.ownRoof.instances.filter((i) => i.shape === "panel").flatMap((i) => i.items);
    expect(own).toHaveLength(6);
    for (const it of own) expect(overlapsHouse({ x0: it.at[0], y0: it.at[1], x1: it.at[0], y1: it.at[1] })).toBe(true);
  });
});
