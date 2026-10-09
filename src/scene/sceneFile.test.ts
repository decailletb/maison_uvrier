import { describe, expect, it } from "vitest";
import { assetById } from "@/catalogue/manifest";
import { MATERIALS } from "@/catalogue/materials";
import { pointInPolygon } from "@/data/geometry";
import { levelById } from "@/data/house";
import { parseScene } from "./sceneFile";
import baseJson from "../../scenes/base.json";

describe("scenes/base.json", () => {
  const scene = parseScene(baseJson);

  it("validates with unique ids", () => {
    const ids = scene.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(scene.items.length).toBeGreaterThan(10);
  });

  it("places every item inside its room and references known assets and materials", () => {
    for (const item of scene.items) {
      const level = levelById(item.levelId);
      const room = level.rooms.find((r) => r.id === item.roomId);
      expect(room, item.id).toBeDefined();
      expect(pointInPolygon([item.position[0], item.position[1]], room!.polygon), `${item.id} outside ${item.roomId}`).toBe(true);
      if (typeof item.asset === "string") expect(assetById(item.asset), item.asset).toBeDefined();
      else for (const m of [item.asset.params.material, item.asset.params.accent]) if (m) expect(MATERIALS.has(m), m).toBe(true);
    }
    for (const finish of Object.values(scene.roomFinishes)) {
      for (const m of [finish.floor, finish.wall, finish.ceiling]) if (m) expect(MATERIALS.has(m), m).toBe(true);
    }
  });
});
