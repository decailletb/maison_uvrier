import { describe, expect, it } from "vitest";
import { levelById } from "@/data/house";
import type { Wall } from "@/data/schema";
import { itemFootprint, roomAt, snapGrid, snapToWall } from "./placement";

const wall: Wall = { id: "w", points: [[0, 100], [400, 100]], thickness: 20, structural: false, exterior: false };

describe("placement", () => {
  it("finds the room under a point", () => {
    const rez = levelById("rez");
    expect(roomAt(rez, [300, 500])?.id).toBe("sejour-cuisine");
    expect(roomAt(rez, [900, 100])?.id).toBe("wc");
    expect(roomAt(rez, [-100, 300])?.id).toBe("terrasse");
  });

  it("snaps to a 5 cm grid", () => {
    expect(snapGrid(123)).toBe(125);
    expect(snapGrid(121)).toBe(120);
  });

  it("pushes an item against the nearest wall and turns its back to it", () => {
    // Item south of the wall (y < 100), 30 cm from the wall face.
    const r = snapToWall([200, 60], 37, 50, [wall]);
    expect(r.snapped).toBe(true);
    expect(r.point).toEqual([200, 100 - 10 - 25]);
    expect(r.rotationDeg).toBe(0); // front toward -y, away from the wall
    // Item north of the wall faces +y.
    const n = snapToWall([200, 140], 0, 50, [wall]);
    expect(n.point).toEqual([200, 100 + 10 + 25]);
    expect(Math.abs(n.rotationDeg)).toBe(180);
  });

  it("leaves items far from walls alone", () => {
    const r = snapToWall([200, 300], 37, 50, [wall]);
    expect(r.snapped).toBe(false);
    expect(r.rotationDeg).toBe(37);
  });

  it("rotates footprints", () => {
    const fp = itemFootprint([0, 0], 100, 50, 90);
    expect(fp[0][0]).toBeCloseTo(25);
    expect(fp[0][1]).toBeCloseTo(-50);
  });
});
