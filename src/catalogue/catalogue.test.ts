import { describe, expect, it } from "vitest";
import { Manifest, findAssets, manifest } from "./manifest";
import { MATERIALS, materialForFinish, materialsOfKind } from "./materials";
import { PROCEDURAL_KINDS, proceduralParts } from "./procedural";

describe("manifest", () => {
  it("validates and has unique ids", () => {
    expect(() => Manifest.parse(manifest)).not.toThrow();
    const ids = manifest.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists the sky HDRI", () => {
    expect(findAssets("hdri")[0]?.id).toBe("kloofendal-puresky");
  });
});

describe("materials", () => {
  it("cover every kind", () => {
    for (const kind of ["floor", "wall", "ceiling", "fabric", "wood", "metal"] as const) {
      expect(materialsOfKind(kind).length).toBeGreaterThan(0);
    }
    expect(MATERIALS.size).toBeGreaterThan(20);
  });

  it("map plan finishes to materials", () => {
    expect(materialForFinish("carrelage", "floor")).toBe("tile-light");
    expect(materialForFinish("dalle brute", "floor")).toBe("concrete-raw");
    expect(materialForFinish("murs bruts", "wall")).toBe("concrete-block");
    expect(materialForFinish("crépis", "wall")).toBe("paint-white");
  });
});

describe("procedural furniture", () => {
  it("builds every kind within its declared dimensions", () => {
    for (const kind of PROCEDURAL_KINDS) {
      const { parts, size } = proceduralParts(kind, {});
      expect(parts.length, kind).toBeGreaterThan(0);
      for (const p of parts) {
        expect(p.pos[0] - p.size[0] / 2, `${kind} x`).toBeGreaterThanOrEqual(-size.w / 2 - 0.01);
        expect(p.pos[0] + p.size[0] / 2, `${kind} x`).toBeLessThanOrEqual(size.w / 2 + 0.01);
        expect(p.pos[1] - p.size[1] / 2, `${kind} y`).toBeGreaterThanOrEqual(-0.01);
        expect(p.pos[1] + p.size[1] / 2, `${kind} y`).toBeLessThanOrEqual(size.h + 0.01);
        expect(p.pos[2] - p.size[2] / 2, `${kind} z`).toBeGreaterThanOrEqual(-size.d / 2 - 0.01);
        expect(p.pos[2] + p.size[2] / 2, `${kind} z`).toBeLessThanOrEqual(size.d / 2 + 0.01);
        expect(MATERIALS.has(p.material), `${kind} material ${p.material}`).toBe(true);
      }
    }
  });

  it("accepts size overrides", () => {
    const { size } = proceduralParts("bed", { w: 180, d: 210 });
    expect(size.w).toBe(180);
    expect(size.d).toBe(210);
  });
});
