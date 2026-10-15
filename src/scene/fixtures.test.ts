import { describe, expect, it } from "vitest";
import { house } from "@/data/house";
import { levelFixtures } from "./fixtures";

describe("fixtures", () => {
  it("gives every interior room a lamp with unique ids", () => {
    for (const level of house.levels) {
      const fixtures = levelFixtures(level);
      expect(new Set(fixtures.map((f) => f.id)).size).toBe(fixtures.length);
      const lit = new Set(fixtures.filter((f) => f.light).map((f) => f.roomId));
      for (const room of level.rooms) {
        if (["terrasse", "couvert", "balcon"].includes(room.id)) continue;
        expect(lit.has(room.id), `${level.id}/${room.id}`).toBe(true);
      }
    }
  });

  it("keeps the light count affordable", () => {
    const lights = house.levels.flatMap(levelFixtures).filter((f) => f.light);
    expect(lights.length).toBeLessThanOrEqual(24);
  });
});
