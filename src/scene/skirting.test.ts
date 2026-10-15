import { describe, expect, it } from "vitest";
import { levelById } from "@/data/house";
import { levelSkirting } from "./skirting";

describe("skirting", () => {
  it("runs around interior rooms only", () => {
    const runs = levelSkirting(levelById("rez"));
    expect(runs.length).toBeGreaterThan(10);
    expect(runs.some((r) => r.roomId === "terrasse" || r.roomId === "couvert")).toBe(false);
  });

  it("stops at the WC door", () => {
    const rez = levelById("rez");
    const door = rez.openings.find((o) => o.id === "door-wc")!;
    const wall = rez.walls.find((w) => w.id === door.wallId)!;
    const x0 = wall.points[0][0] + door.offset;
    const x1 = x0 + door.width;
    const wcRuns = levelSkirting(rez).filter((r) => r.roomId === "wc");
    const crossing = wcRuns.filter((r) => {
      const lo = Math.min(r.start[0], r.end[0]);
      const hi = Math.max(r.start[0], r.end[0]);
      return Math.abs(r.start[1] - r.end[1]) < 1 && r.start[1] > 200 && lo < x0 + door.width / 2 && hi > x0 + door.width / 2;
    });
    expect(crossing).toHaveLength(0);
    expect(x1).toBeGreaterThan(x0);
  });
});
