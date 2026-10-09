import { describe, expect, it } from "vitest";
import type { Opening, Wall } from "@/data/schema";
import { pieceFrame, wallPieces } from "./walls";

const wall: Wall = {
  id: "w",
  points: [
    [0, 0],
    [400, 0],
  ],
  thickness: 20,
  structural: false,
  exterior: false,
};

const door: Opening = { id: "d", kind: "door", wallId: "w", offset: 100, width: 90, height: 210, sill: 0 };
const window: Opening = { id: "win", kind: "window", wallId: "w", offset: 250, width: 100, height: 110, sill: 100 };

describe("wallPieces", () => {
  it("returns one full-height box for a wall without openings", () => {
    const pieces = wallPieces(wall, [], 250);
    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ start: [0, 0], end: [400, 0], bottom: 0, top: 250 });
  });

  it("cuts a door with a lintel and a window with sill and lintel", () => {
    const pieces = wallPieces(wall, [door, window], 250);
    const spans = pieces.map((p) => [p.start[0], p.end[0], p.bottom, p.top]);
    expect(spans).toEqual([
      [0, 100, 0, 250],
      [100, 190, 210, 250],
      [190, 250, 0, 250],
      [250, 350, 0, 100],
      [250, 350, 210, 250],
      [350, 400, 0, 250],
    ]);
  });

  it("ignores openings of other walls and openings reaching the ceiling", () => {
    const tall: Opening = { ...door, id: "t", height: 250, offset: 0, width: 400 };
    expect(wallPieces(wall, [{ ...door, wallId: "other" }], 250)).toHaveLength(1);
    expect(wallPieces(wall, [tall], 250)).toHaveLength(0);
  });

  it("follows polylines across corners", () => {
    const l: Wall = { ...wall, points: [[0, 0], [100, 0], [100, 100]] };
    const d: Opening = { ...door, offset: 120, width: 50 };
    const pieces = wallPieces(l, [d], 250);
    expect(pieces.map((p) => [p.start, p.end, p.bottom])).toEqual([
      [[0, 0], [100, 0], 0],
      [[100, 0], [100, 20], 0],
      [[100, 20], [100, 70], 210],
      [[100, 70], [100, 100], 0],
    ]);
  });

  it("computes the frame of a piece", () => {
    const [p] = wallPieces({ ...wall, points: [[0, 0], [0, 300]] }, [], 250);
    const f = pieceFrame(p);
    expect(f.centre).toEqual([0, 150]);
    expect(f.length).toBe(300);
    expect(f.yaw).toBeCloseTo(Math.PI / 2);
  });
});
