/**
 * Matches proposal entries to the catalogue: a glTF asset of the same category with
 * the best tag overlap, else a procedural kind coloured with the nearest library
 * materials. Pure.
 */
import { findAssets, type AssetEntry, type Category } from "@/catalogue/manifest";
import { materialsOfKind, type MaterialDef, type MaterialKind } from "@/catalogue/materials";
import type { ProceduralKind } from "@/catalogue/procedural";
import type { ProposalFurniture, Surface } from "./proposal";

export const CATEGORY_TO_KIND: Partial<Record<Category, ProceduralKind>> = {
  sofa: "sofa",
  armchair: "chair",
  chair: "chair",
  table: "table",
  coffeeTable: "coffeeTable",
  bed: "bed",
  nightstand: "nightstand",
  wardrobe: "wardrobe",
  dresser: "dresser",
  shelf: "shelf",
  desk: "desk",
  kitchen: "kitchenBlock",
  lamp: "lamp",
  rug: "rug",
};

/** Material kinds a procedural kind takes for its main and accent materials. */
const KIND_MATERIALS: Record<ProceduralKind, { main: MaterialKind; accent: MaterialKind }> = {
  bed: { main: "fabric", accent: "wood" },
  nightstand: { main: "wood", accent: "metal" },
  wardrobe: { main: "wood", accent: "metal" },
  dresser: { main: "wood", accent: "metal" },
  table: { main: "wood", accent: "wood" },
  chair: { main: "wood", accent: "metal" },
  sofa: { main: "fabric", accent: "metal" },
  coffeeTable: { main: "wood", accent: "metal" },
  shelf: { main: "wood", accent: "wood" },
  desk: { main: "wood", accent: "metal" },
  kitchenBlock: { main: "wood", accent: "stone" },
  rug: { main: "fabric", accent: "fabric" },
  lamp: { main: "fabric", accent: "metal" },
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colourDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  // Weighted RGB distance, closer to perception than plain Euclid.
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
}

/** Library material of a kind nearest to a colour (or the kind's first entry). */
export function nearestMaterial(kind: MaterialKind, colour: string | undefined): MaterialDef {
  const list = materialsOfKind(kind);
  if (!colour) return list[0];
  return list.reduce((best, m) => (colourDistance(m.color, colour) < colourDistance(best.color, colour) ? m : best));
}

export type Match =
  | { kind: "asset"; entry: AssetEntry; score: number }
  | { kind: "procedural"; procedural: ProceduralKind; params: { w?: number; d?: number; h?: number; material: string; accent: string } }
  | { kind: "none"; reason: string };

export function matchFurniture(item: ProposalFurniture): Match {
  const [best] = findAssets(item.category, item.styleTags);
  if (best) {
    const score = best.tags.filter((t) => item.styleTags.includes(t)).length;
    if (score >= 1) return { kind: "asset", entry: best, score };
  }
  const procedural = CATEGORY_TO_KIND[item.category];
  if (!procedural) return { kind: "none", reason: `pas de modèle ni de forme paramétrique pour « ${item.category} »` };
  const kinds = KIND_MATERIALS[procedural];
  const dims = item.approxDimensionsCm;
  const scaled = item.category === "armchair" && dims ? { w: dims.w, d: dims.d, h: dims.h } : dims;
  return {
    kind: "procedural",
    procedural,
    params: {
      ...(scaled ? { w: scaled.w, d: scaled.d, h: scaled.h } : {}),
      material: nearestMaterial(kinds.main, item.colour).id,
      accent: nearestMaterial(kinds.accent, kinds.accent === "wood" ? item.colour : undefined).id,
    },
  };
}

export function matchSurface(surface: Surface, kind: "floor" | "wall" | "ceiling"): string {
  const list = materialsOfKind(kind);
  if (surface.material && list.some((m) => m.id === surface.material)) return surface.material;
  const d = surface.description.toLowerCase();
  const wood = /parquet|bois|wood|stratifi|laminate/.test(d);
  const tile = /carrelage|tile|pierre|stone|faïence|faience/.test(d);
  if (kind === "floor" && wood) return nearestAmong(["parquet-oak", "parquet-walnut", "laminate-grey"], surface.colour);
  if (kind === "floor" && tile) return nearestAmong(["tile-light", "tile-grey", "tile-white"], surface.colour);
  if (kind === "wall" && tile) return nearestAmong(["tile-wall-white", "tile-wall-grey"], surface.colour);
  return nearestMaterial(kind, surface.colour).id;
}

function nearestAmong(ids: string[], colour: string | undefined): string {
  const all = [...materialsOfKind("floor"), ...materialsOfKind("wall")];
  const list = ids.map((id) => all.find((m) => m.id === id)!);
  if (!colour) return ids[0];
  return list.reduce((best, m) => (colourDistance(m.color, colour) < colourDistance(best.color, colour) ? m : best)).id;
}
