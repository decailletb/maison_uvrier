/**
 * Material library: ids shared by scene files, the procedural furniture and the
 * `/deco` proposals. Procedural (colour + roughness, optional tile grid) until PBR
 * texture sets from ambientCG are added with the same ids.
 */
export type MaterialKind = "floor" | "wall" | "ceiling" | "fabric" | "wood" | "metal" | "stone" | "glass";

export interface MaterialDef {
  id: string;
  kind: MaterialKind;
  /** French label for the UI. */
  label: string;
  color: string;
  roughness: number;
  metalness?: number;
  /** Tile grid in metres for floors and wall tiles: square size, or [length, width] for planks. */
  tile?: number | [number, number];
  grout?: string;
  opacity?: number;
}

const defs: MaterialDef[] = [
  // Floors
  { id: "tile-light", kind: "floor", label: "Carrelage clair", color: "#d9d4cc", roughness: 0.35, tile: 0.6, grout: "#b9b3a8" },
  { id: "tile-grey", kind: "floor", label: "Carrelage gris pierre", color: "#9c9a95", roughness: 0.4, tile: 0.6, grout: "#7f7d78" },
  { id: "tile-white", kind: "floor", label: "Carrelage blanc", color: "#ebe9e4", roughness: 0.3, tile: 0.6, grout: "#cfccc5" },
  { id: "parquet-oak", kind: "floor", label: "Parquet chêne clair", color: "#b9a080", roughness: 0.6, tile: [1.2, 0.18], grout: "#9c8668" },
  { id: "parquet-walnut", kind: "floor", label: "Parquet noyer foncé", color: "#6f4a30", roughness: 0.55, tile: [1.2, 0.18], grout: "#4e3320" },
  { id: "laminate-grey", kind: "floor", label: "Stratifié gris-brun", color: "#9a8a7a", roughness: 0.5, tile: [1.3, 0.2], grout: "#7e6f5f" },
  { id: "concrete-raw", kind: "floor", label: "Béton brut", color: "#a8a6a1", roughness: 0.9 },
  { id: "rubber-black", kind: "floor", label: "Tapis de sport noir", color: "#2a2a2a", roughness: 0.95 },
  // Walls and ceilings
  { id: "paint-white", kind: "wall", label: "Peinture blanche", color: "#f4f2ee", roughness: 0.85 },
  { id: "paint-warm-grey", kind: "wall", label: "Peinture gris chaud", color: "#d8d2c8", roughness: 0.85 },
  { id: "paint-sage", kind: "wall", label: "Peinture vert sauge", color: "#b7c2ad", roughness: 0.85 },
  { id: "paint-navy", kind: "wall", label: "Peinture bleu nuit", color: "#2f3a52", roughness: 0.8 },
  { id: "paint-terracotta", kind: "wall", label: "Peinture terre cuite", color: "#c57a5a", roughness: 0.85 },
  { id: "tile-wall-white", kind: "wall", label: "Faïence blanche grand format", color: "#ece9e3", roughness: 0.25, tile: 0.6, grout: "#d0cdc6" },
  { id: "tile-wall-grey", kind: "wall", label: "Faïence gris pierre", color: "#9c9a95", roughness: 0.3, tile: 0.6, grout: "#7f7d78" },
  { id: "concrete-block", kind: "wall", label: "Parpaings bruts", color: "#b3b0aa", roughness: 0.95, tile: 0.4, grout: "#9a9791" },
  { id: "ceiling-white", kind: "ceiling", label: "Plafond blanc", color: "#f8f7f3", roughness: 0.7 },
  // Fabrics
  { id: "fabric-navy", kind: "fabric", label: "Tissu bleu nuit", color: "#2b3a5c", roughness: 0.95 },
  { id: "fabric-grey", kind: "fabric", label: "Tissu gris", color: "#8c8c8a", roughness: 0.95 },
  { id: "fabric-beige", kind: "fabric", label: "Tissu beige", color: "#cfc2ad", roughness: 0.95 },
  { id: "fabric-white", kind: "fabric", label: "Tissu blanc", color: "#f1efe9", roughness: 0.95 },
  { id: "fabric-pink", kind: "fabric", label: "Tissu rose poudré", color: "#e8b4b8", roughness: 0.95 },
  { id: "fabric-green", kind: "fabric", label: "Tissu vert", color: "#6b8f6a", roughness: 0.95 },
  // Wood
  { id: "wood-oak", kind: "wood", label: "Chêne clair", color: "#c8a478", roughness: 0.5 },
  { id: "wood-walnut", kind: "wood", label: "Noyer", color: "#6a4630", roughness: 0.5 },
  { id: "wood-white", kind: "wood", label: "Laqué blanc", color: "#f2f1ee", roughness: 0.35 },
  { id: "wood-black", kind: "wood", label: "Laqué noir", color: "#232323", roughness: 0.35 },
  { id: "wood-grey", kind: "wood", label: "Bois gris", color: "#8f8a82", roughness: 0.55 },
  // Metal, stone, glass
  { id: "metal-black", kind: "metal", label: "Métal noir", color: "#2a2a2a", roughness: 0.4, metalness: 0.8 },
  { id: "metal-steel", kind: "metal", label: "Acier brossé", color: "#b8babd", roughness: 0.35, metalness: 0.9 },
  { id: "metal-brass", kind: "metal", label: "Laiton", color: "#c9a955", roughness: 0.35, metalness: 0.9 },
  { id: "stone-black", kind: "stone", label: "Plan noir", color: "#1f1f1f", roughness: 0.3 },
  { id: "stone-white", kind: "stone", label: "Plan blanc", color: "#e9e7e2", roughness: 0.3 },
  { id: "glass-clear", kind: "glass", label: "Verre", color: "#cfe3ee", roughness: 0.05, opacity: 0.35 },
];

export const MATERIALS: ReadonlyMap<string, MaterialDef> = new Map(defs.map((d) => [d.id, d]));

export function materialById(id: string | undefined, fallback: string): MaterialDef {
  return (id && MATERIALS.get(id)) || MATERIALS.get(fallback)!;
}

export function materialsOfKind(kind: MaterialKind): MaterialDef[] {
  return defs.filter((d) => d.kind === kind);
}

/** Material id matching a finish printed on the plans. */
export function materialForFinish(finish: string | undefined, kind: "floor" | "wall" | "ceiling"): string {
  const f = (finish ?? "").toLowerCase();
  if (kind === "floor") {
    if (f.includes("carrelage")) return "tile-light";
    if (f.includes("brut") || f.includes("béton") || f.includes("goudron")) return "concrete-raw";
    return "tile-light";
  }
  if (kind === "wall") {
    if (f.includes("carrelage")) return "tile-wall-white";
    if (f.includes("brut")) return "concrete-block";
    return "paint-white";
  }
  return "ceiling-white";
}
