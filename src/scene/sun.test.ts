import { describe, expect, it } from "vitest";
import { sunDirection, sunPosition } from "./sun";

describe("sun", () => {
  it("peaks near 67° at the summer solstice around solar noon (13:30 CEST)", () => {
    const noon = sunPosition(6, 21, 13.5);
    expect(noon.elevation).toBeGreaterThan(66);
    expect(noon.elevation).toBeLessThan(68);
    expect(Math.abs(noon.azimuth - 180)).toBeLessThan(3);
  });

  it("peaks near 20° at the winter solstice around solar noon (12:30 CET)", () => {
    const noon = sunPosition(12, 21, 12.5);
    expect(noon.elevation).toBeGreaterThan(19);
    expect(noon.elevation).toBeLessThan(22);
  });

  it("rises in the east and sets in the west", () => {
    const morning = sunPosition(6, 21, 7);
    const evening = sunPosition(6, 21, 19);
    expect(morning.azimuth).toBeGreaterThan(50);
    expect(morning.azimuth).toBeLessThan(90);
    expect(evening.azimuth).toBeGreaterThan(270);
    expect(evening.azimuth).toBeLessThan(310);
    expect(sunPosition(6, 21, 1).elevation).toBeLessThan(0);
  });

  it("maps azimuth to scene axes: south is +z, east is +x", () => {
    const south = sunDirection({ elevation: 0, azimuth: 180 });
    expect(south[2]).toBeCloseTo(1);
    const east = sunDirection({ elevation: 0, azimuth: 90 });
    expect(east[0]).toBeCloseTo(1);
    const up = sunDirection({ elevation: 90, azimuth: 0 });
    expect(up[1]).toBeCloseTo(1);
  });
});
