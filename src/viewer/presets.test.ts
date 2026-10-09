import { describe, expect, it } from "vitest";
import { pointInPolygon } from "@/data/geometry";
import { house } from "@/data/house";
import { CAMERA_PRESETS, DEFAULT_PRESET, findPreset, presetFromSearch, roomEntrance, roomGlazing } from "./presets";

describe("camera presets", () => {
  it("have unique names", () => {
    const names = CAMERA_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("cover every level and every room", () => {
    for (const level of house.levels) {
      expect(findPreset(`${level.id}-top`)?.level).toBe(level.id);
      for (const room of level.rooms) {
        expect(findPreset(room.id)?.level, room.id).toBe(level.id);
      }
    }
    expect(findPreset("sejour-cuisine-2")).toBeDefined();
    expect(findPreset("chambre-parents-2")).toBeDefined();
    expect(findPreset("salle-de-bains-2")).toBeUndefined();
  });

  it("find the widest glazed exterior opening of a room", () => {
    const rez = house.levels[1];
    const sejour = rez.rooms.find((r) => r.id === "sejour-cuisine")!;
    expect(roomGlazing(sejour, rez)[0].opening.ref).toBe("006");
    const etage = house.levels[2];
    const parents = etage.rooms.find((r) => r.id === "chambre-parents")!;
    expect(roomGlazing(parents, etage)[0].opening.ref).toBe("012");
  });

  it("start room views inside the room, at eye height", () => {
    for (const level of house.levels) {
      for (const room of level.rooms) {
        const { point } = roomEntrance(room, level);
        expect(pointInPolygon(point, room.polygon), `${room.id} entrance ${point}`).toBe(true);
        const preset = findPreset(room.id)!;
        expect(preset.position[1]).toBeCloseTo((level.floorLevel + 155) / 100, 5);
      }
    }
  });

  it("find doors for the rooms that have one", () => {
    const etage = house.levels[2];
    const parents = etage.rooms.find((r) => r.id === "chambre-parents")!;
    expect(roomEntrance(parents, etage).fromDoor).toBe(true);
  });

  it("resolve by name and fall back from a query string", () => {
    expect(findPreset("top")?.label).toBe("Vue de dessus");
    expect(findPreset("nope")).toBeUndefined();
    expect(findPreset(null)).toBeUndefined();
    expect(presetFromSearch("?preset=rez-top").name).toBe("rez-top");
    expect(presetFromSearch("?preset=unknown")).toBe(DEFAULT_PRESET);
    expect(presetFromSearch("")).toBe(DEFAULT_PRESET);
  });
});
