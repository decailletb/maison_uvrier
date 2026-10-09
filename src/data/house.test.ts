/**
 * Consistency checks of the extracted plan data against the printed figures.
 * Known deviations are listed in docs/DECISIONS.md and tolerated here by id.
 */
import { describe, expect, it } from "vitest";
import { pointAlong, pointInPolygon, polygonAreaM2, polylineLength } from "./geometry";
import { FOOTPRINT_CM, house } from "./house";
import type { Level, Point } from "./schema";

/** Rooms whose polygon area is allowed to deviate more than 5 % (see DECISIONS.md). */
const AREA_EXCEPTIONS: Record<string, number> = {};
const AREA_TOLERANCE = 0.05;
/** Half a wall thickness: how far a wall centreline may sit outside the footprint. */
const EDGE_SLACK = 30;

const levels = house.levels;

function wallById(level: Level, id: string) {
  const wall = level.walls.find((w) => w.id === id);
  if (!wall) throw new Error(`${level.id}: wall ${id} not found`);
  return wall;
}

function closeEnough(a: Point, b: Point, eps = 1) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) <= eps;
}

describe("house data", () => {
  it("has the three levels in order with the printed finished floor levels", () => {
    expect(levels.map((l) => l.id)).toEqual(["sous-sol", "rez", "etage"]);
    expect(levels.map((l) => l.floorLevel)).toEqual([-286, 0, 285]);
    expect(levels.map((l) => l.clearHeight)).toEqual([240, 250, 250]);
  });

  it("matches the SIA 416 figures of pages 1 and 2", () => {
    // 6 x 76.48 m² per level on page 1; 1055 x 724 cm = 76.38 m²: within 0.2 %.
    const footprintM2 = (FOOTPRINT_CM.width * FOOTPRINT_CM.depth) / 10_000;
    expect(Math.abs(footprintM2 - 76.48) / 76.48).toBeLessThan(0.005);
    // Page 2: building height 9.14 m for three levels. Section p.9: sous-sol floor
    // -2.86, acrotère +6.06 = 8.92 m above the sous-sol floor; the 9.14 includes the
    // 20 cm sous-sol slab and 2 cm of lean concrete.
    const top = 606;
    const bottom = levels[0].floorLevel - 22;
    expect(Math.abs(top - bottom - 914)).toBeLessThanOrEqual(2);
  });

  describe.each(levels.map((l) => [l.id, l] as const))("%s", (_id, level) => {
    it("keeps every wall within the footprint plus half a wall", () => {
      for (const wall of level.walls) {
        for (const [x, y] of wall.points) {
          expect(x, `${wall.id} x`).toBeGreaterThanOrEqual(-EDGE_SLACK);
          expect(x, `${wall.id} x`).toBeLessThanOrEqual(FOOTPRINT_CM.width + EDGE_SLACK);
          expect(y, `${wall.id} y`).toBeGreaterThanOrEqual(-EDGE_SLACK);
          expect(y, `${wall.id} y`).toBeLessThanOrEqual(FOOTPRINT_CM.depth + EDGE_SLACK);
        }
      }
    });

    it("closes the exterior walls into one loop", () => {
      const exterior = level.walls.filter((w) => w.exterior);
      expect(exterior.length).toBeGreaterThanOrEqual(4);
      const ends: Point[] = exterior.flatMap((w) => [w.points[0], w.points[w.points.length - 1]]);
      for (const wall of exterior) {
        for (const end of [wall.points[0], wall.points[wall.points.length - 1]]) {
          const shared = ends.filter((e) => closeEnough(e, end)).length;
          expect(shared, `${level.id}: ${wall.id} end ${end} must meet another exterior wall`).toBe(2);
        }
      }
    });

    it("has unique ids", () => {
      const ids = [
        ...level.walls.map((w) => w.id),
        ...level.rooms.map((r) => r.id),
        ...level.openings.map((o) => o.id),
        ...level.stairs.map((s) => s.id),
      ];
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("places every opening inside its wall", () => {
      for (const opening of level.openings) {
        const wall = wallById(level, opening.wallId);
        const length = polylineLength(wall.points);
        expect(opening.offset + opening.width, `${opening.id} overruns ${wall.id}`).toBeLessThanOrEqual(length + 1);
        expect(opening.sill + opening.height, `${opening.id} taller than the level`).toBeLessThanOrEqual(
          (wall.height ?? level.clearHeight) + 1,
        );
        // The opening midpoint lies on the wall polyline by construction.
        const mid = pointAlong(wall.points, opening.offset + opening.width / 2).point;
        expect(mid[0]).toBeGreaterThanOrEqual(-EDGE_SLACK);
      }
    });

    it("keeps interior room polygons inside the footprint", () => {
      for (const room of level.rooms) {
        if (["terrasse", "couvert", "balcon"].includes(room.id)) continue;
        for (const p of room.polygon) {
          expect(
            pointInPolygon(p, [
              [0, 0],
              [FOOTPRINT_CM.width, 0],
              [FOOTPRINT_CM.width, FOOTPRINT_CM.depth],
              [0, FOOTPRINT_CM.depth],
            ]),
            `${level.id}/${room.id} point ${p} outside footprint`,
          ).toBe(true);
        }
      }
    });

    it("has room polygon areas within 5 % of the printed m²", () => {
      const failures: string[] = [];
      for (const room of level.rooms) {
        if (room.printedArea === undefined) continue;
        const area = polygonAreaM2(room.polygon);
        const tolerance = AREA_EXCEPTIONS[`${level.id}/${room.id}`] ?? AREA_TOLERANCE;
        const deviation = Math.abs(area - room.printedArea) / room.printedArea;
        if (deviation > tolerance) {
          failures.push(`${level.id}/${room.id}: ${area.toFixed(2)} m² vs ${room.printedArea} printed (${(deviation * 100).toFixed(1)} %)`);
        }
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  });
});
