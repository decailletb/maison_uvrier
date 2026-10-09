import { describe, expect, it } from "vitest";
import { pointInPolygon } from "@/data/geometry";
import { levelById } from "@/data/house";
import { itemFootprint } from "@/scene/placement";
import { layoutRoom, type LayoutItem } from "./layout";
import { colourDistance, matchFurniture, matchSurface, nearestMaterial } from "./match";
import { parseProposal } from "./proposal";
import fixture from "./fixtures/proposal-chambre-enfant.json";

describe("proposal", () => {
  it("parses the fixture", () => {
    const p = parseProposal(fixture);
    expect(p.furniture.length).toBeGreaterThan(3);
    expect(p.palette[0].hex).toMatch(/^#/);
  });
});

describe("match", () => {
  it("picks the nearest material by colour", () => {
    expect(colourDistance("#000000", "#000000")).toBe(0);
    expect(nearestMaterial("fabric", "#2b3a5c").id).toBe("fabric-navy");
    expect(nearestMaterial("fabric", "#e8b4b8").id).toBe("fabric-pink");
    expect(nearestMaterial("wood", "#f0f0f0").id).toBe("wood-white");
  });

  it("uses a catalogue model when a tag matches, else a procedural kind", () => {
    const armchair = matchFurniture({ category: "armchair", styleTags: ["moderne"], material: "", placementHint: "", count: 1 });
    expect(armchair.kind).toBe("asset");
    const bed = matchFurniture({ category: "bed", styleTags: ["enfant"], colour: "#f3e9ec", material: "", placementHint: "", count: 1, approxDimensionsCm: { w: 90, d: 200, h: 120 } });
    expect(bed).toMatchObject({ kind: "procedural", procedural: "bed", params: { w: 90, material: "fabric-white" } });
    expect(matchFurniture({ category: "plant", styleTags: [], material: "", placementHint: "", count: 1 }).kind).toBe("none");
  });

  it("maps surfaces to library materials", () => {
    expect(matchSurface({ description: "parquet bois clair", colour: "#c8a478" }, "floor")).toBe("parquet-oak");
    expect(matchSurface({ description: "carrelage gris grand format", colour: "#9c9a95" }, "floor")).toBe("tile-grey");
    expect(matchSurface({ material: "paint-sage", description: "", colour: "#b7c2ad" }, "wall")).toBe("paint-sage");
    expect(matchSurface({ description: "peinture", colour: "#2f3a52" }, "wall")).toBe("paint-navy");
  });
});

describe("layout", () => {
  const etage = levelById("etage");
  const room = etage.rooms.find((r) => r.id === "chambre-2")!;
  const items: LayoutItem[] = [
    { key: "bed", category: "bed", w: 90, d: 200, hint: "headboard against the wall opposite the door" },
    { key: "nightstand", category: "nightstand", w: 45, d: 40, hint: "beside the bed" },
    { key: "wardrobe", category: "wardrobe", w: 120, d: 60, hint: "against a wall" },
    { key: "desk", category: "desk", w: 110, d: 60, hint: "under the window" },
    { key: "rug", category: "rug", w: 140, d: 100, hint: "centre" },
    { key: "lamp", category: "lamp", w: 30, d: 30, hint: "corner" },
  ];

  it("places every item inside the room without overlaps", () => {
    const { placed, unplaced } = layoutRoom(items, room, etage);
    expect(unplaced).toEqual([]);
    expect(placed).toHaveLength(items.length);
    const boxes = placed
      .filter((p) => p.key !== "rug")
      .map((p) => {
        const it = items.find((i) => i.key === p.key)!;
        const fp = itemFootprint(p.position, it.w, it.d, p.rotationDeg);
        for (const c of fp) expect(pointInPolygon(c, room.polygon, 1), `${p.key} corner ${c}`).toBe(true);
        const xs = fp.map((c) => c[0]);
        const ys = fp.map((c) => c[1]);
        return { key: p.key, min: [Math.min(...xs), Math.min(...ys)], max: [Math.max(...xs), Math.max(...ys)] };
      });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.min[0] < b.max[0] && a.max[0] > b.min[0] && a.min[1] < b.max[1] && a.max[1] > b.min[1];
        expect(overlap, `${a.key} overlaps ${b.key}`).toBe(false);
      }
    }
  });

  it("puts the desk under the window and the nightstand beside the bed", () => {
    const { placed } = layoutRoom(items, room, etage);
    const desk = placed.find((p) => p.key === "desk")!;
    // Window 009 is on the east wall (x = 1006 interior face): the desk sits against it.
    expect(desk.position[0]).toBeGreaterThan(900);
    const bed = placed.find((p) => p.key === "bed")!;
    const ns = placed.find((p) => p.key === "nightstand")!;
    expect(Math.hypot(ns.position[0] - bed.position[0], ns.position[1] - bed.position[1])).toBeLessThan(120);
  });
});
