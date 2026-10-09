import { describe, expect, it } from "vitest";
import {
  boundingBox,
  distanceToSegment,
  pointAlong,
  pointInPolygon,
  polygonArea,
  polygonAreaM2,
  polygonCentroid,
  polylineLength,
  signedArea,
} from "./geometry";
import type { Point } from "./schema";

const square: Point[] = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

describe("geometry", () => {
  it("computes areas", () => {
    expect(polygonArea(square)).toBe(10_000);
    expect(polygonAreaM2(square)).toBe(1);
    expect(signedArea(square)).toBeGreaterThan(0);
    expect(signedArea([...square].reverse())).toBeLessThan(0);
    // L-shape: 10 x 10 minus 5 x 5
    const l: Point[] = [
      [0, 0],
      [10, 0],
      [10, 5],
      [5, 5],
      [5, 10],
      [0, 10],
    ];
    expect(polygonArea(l)).toBe(75);
  });

  it("measures polylines and walks along them", () => {
    const line: Point[] = [
      [0, 0],
      [30, 0],
      [30, 40],
    ];
    expect(polylineLength(line)).toBe(70);
    expect(pointAlong(line, 0).point).toEqual([0, 0]);
    expect(pointAlong(line, 30).point).toEqual([30, 0]);
    expect(pointAlong(line, 50).point).toEqual([30, 20]);
    expect(pointAlong(line, 50).dir).toEqual([0, 1]);
    expect(pointAlong(line, 500).point).toEqual([30, 40]);
  });

  it("tests point in polygon including the boundary", () => {
    expect(pointInPolygon([50, 50], square)).toBe(true);
    expect(pointInPolygon([150, 50], square)).toBe(false);
    expect(pointInPolygon([100, 50], square)).toBe(true);
    expect(pointInPolygon([0, 0], square)).toBe(true);
  });

  it("computes distances, centroid and bounds", () => {
    expect(distanceToSegment([5, 5], [0, 0], [10, 0])).toBe(5);
    expect(distanceToSegment([20, 0], [0, 0], [10, 0])).toBe(10);
    expect(polygonCentroid(square)).toEqual([50, 50]);
    expect(boundingBox(square)).toEqual({ min: [0, 0], max: [100, 100] });
  });
});
