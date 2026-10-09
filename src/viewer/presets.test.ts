import { describe, expect, it } from "vitest";
import { CAMERA_PRESETS, DEFAULT_PRESET, findPreset, presetFromSearch } from "./presets";

describe("camera presets", () => {
  it("have unique names", () => {
    const names = CAMERA_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("resolve by name", () => {
    expect(findPreset("top")?.label).toBe("Vue de dessus");
    expect(findPreset("nope")).toBeUndefined();
    expect(findPreset(null)).toBeUndefined();
  });

  it("fall back to the default preset from a query string", () => {
    expect(presetFromSearch("?preset=top").name).toBe("top");
    expect(presetFromSearch("?preset=unknown")).toBe(DEFAULT_PRESET);
    expect(presetFromSearch("")).toBe(DEFAULT_PRESET);
  });
});
