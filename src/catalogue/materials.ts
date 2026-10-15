/**
 * Material library: ids shared by scene files, the procedural furniture and the
 * `/deco` proposals. Colour and roughness always; a PBR texture set from the manifest
 * when `pbr` is set (the flat colour stays the fallback while it loads or if it is
 * missing).
 */
/** `exterior`: site surfaces around the house (lawn, asphalt, decking...), never offered for rooms. */
export type MaterialKind = "floor" | "wall" | "ceiling" | "fabric" | "wood" | "metal" | "stone" | "glass" | "exterior";

/**
 * Texture set of the manifest. `full`: colour map multiplied by `tint` (white when
 * omitted) plus normal and roughness maps. `relief`: normal and roughness maps only, on
 * the material colour (paints, dyed fabrics, tiles in any colour).
 */
export interface PbrRef {
  asset: string;
  mode: "full" | "relief";
  tint?: string;
  /** Texture repeat as a multiple of the set's physical size (coarser weave above 1). */
  scale?: number;
  /** Normal map strength, 1 by default. */
  relief?: number;
}

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
  pbr?: PbrRef;
}

const LAMINATE = "laminate-floor-02";
const PLASTER: PbrRef = { asset: "white-plaster-02", mode: "relief", relief: 2 };
const TILES: PbrRef = { asset: "floor-tiles-08", mode: "relief" };
const LINEN: PbrRef = { asset: "rough-linen", mode: "relief", scale: 2, relief: 1.5 };
const OAK = "oak-veneer-01";

const defs: MaterialDef[] = [
  // Floors
  { id: "tile-light", kind: "floor", label: "Carrelage clair", color: "#d9d4cc", roughness: 0.35, tile: 0.6, grout: "#b9b3a8", pbr: TILES },
  { id: "tile-grey", kind: "floor", label: "Carrelage gris pierre", color: "#9c9a95", roughness: 0.4, tile: 0.6, grout: "#7f7d78", pbr: TILES },
  { id: "tile-white", kind: "floor", label: "Carrelage blanc", color: "#ebe9e4", roughness: 0.3, tile: 0.6, grout: "#cfccc5", pbr: TILES },
  { id: "parquet-oak", kind: "floor", label: "Parquet chêne clair", color: "#ad9270", roughness: 0.6, tile: [1.2, 0.18], grout: "#90785a", pbr: { asset: LAMINATE, mode: "full" } },
  { id: "parquet-walnut", kind: "floor", label: "Parquet noyer foncé", color: "#6f4a30", roughness: 0.55, tile: [1.2, 0.18], grout: "#4e3320", pbr: { asset: LAMINATE, mode: "full", tint: "#8a6650" } },
  { id: "laminate-grey", kind: "floor", label: "Stratifié gris-brun", color: "#9a8a7a", roughness: 0.5, tile: [1.3, 0.2], grout: "#7e6f5f", pbr: { asset: LAMINATE, mode: "full", tint: "#c2b6aa" } },
  { id: "concrete-raw", kind: "floor", label: "Béton brut", color: "#a8a6a1", roughness: 0.9 },
  { id: "rubber-black", kind: "floor", label: "Tapis de sport noir", color: "#2a2a2a", roughness: 0.95 },
  // Walls and ceilings
  { id: "paint-white", kind: "wall", label: "Peinture blanche", color: "#fbfaf7", roughness: 0.9, pbr: PLASTER },
  { id: "paint-warm-grey", kind: "wall", label: "Peinture gris chaud", color: "#d8d2c8", roughness: 0.85, pbr: PLASTER },
  { id: "paint-sage", kind: "wall", label: "Peinture vert sauge", color: "#b7c2ad", roughness: 0.85, pbr: PLASTER },
  { id: "paint-navy", kind: "wall", label: "Peinture bleu nuit", color: "#2f3a52", roughness: 0.8, pbr: PLASTER },
  { id: "paint-sand-pink", kind: "wall", label: "Peinture beige rosé", color: "#e8d3be", roughness: 0.85, pbr: PLASTER },
  { id: "paint-terracotta", kind: "wall", label: "Peinture terre cuite", color: "#c57a5a", roughness: 0.85, pbr: PLASTER },
  { id: "tile-wall-white", kind: "wall", label: "Faïence blanche grand format", color: "#ece9e3", roughness: 0.25, tile: 0.6, grout: "#d0cdc6" },
  { id: "tile-wall-grey", kind: "wall", label: "Faïence gris pierre", color: "#9c9a95", roughness: 0.3, tile: 0.6, grout: "#7f7d78" },
  { id: "concrete-block", kind: "wall", label: "Parpaings bruts", color: "#b3b0aa", roughness: 0.95, tile: 0.4, grout: "#9a9791" },
  { id: "ceiling-white", kind: "ceiling", label: "Plafond blanc", color: "#fbf7f0", roughness: 0.8, pbr: PLASTER },
  // Fabrics
  { id: "fabric-navy", kind: "fabric", label: "Tissu bleu nuit", color: "#2b3a5c", roughness: 0.95, pbr: LINEN },
  { id: "fabric-grey", kind: "fabric", label: "Tissu gris", color: "#8c8c8a", roughness: 0.95, pbr: LINEN },
  { id: "fabric-beige", kind: "fabric", label: "Tissu beige", color: "#cfc2ad", roughness: 0.95, pbr: LINEN },
  { id: "fabric-white", kind: "fabric", label: "Tissu blanc", color: "#f1efe9", roughness: 0.95, pbr: LINEN },
  { id: "fabric-cream", kind: "fabric", label: "Lin crème", color: "#e9dfcf", roughness: 0.95, pbr: LINEN },
  { id: "fabric-pink", kind: "fabric", label: "Tissu rose poudré", color: "#e8b4b8", roughness: 0.95, pbr: LINEN },
  { id: "fabric-green", kind: "fabric", label: "Tissu vert", color: "#6b8f6a", roughness: 0.95, pbr: LINEN },
  { id: "fabric-jute", kind: "fabric", label: "Jute naturelle", color: "#d6c6aa", roughness: 0.95, pbr: { asset: "hessian-380", mode: "relief", scale: 3, relief: 2 } },
  // Wood
  { id: "wood-oak", kind: "wood", label: "Chêne clair", color: "#c8a478", roughness: 0.5, pbr: { asset: OAK, mode: "full" } },
  { id: "wood-walnut", kind: "wood", label: "Noyer", color: "#6a4630", roughness: 0.5, pbr: { asset: OAK, mode: "full", tint: "#7a5238" } },
  { id: "wood-white", kind: "wood", label: "Laqué blanc", color: "#f2f1ee", roughness: 0.35 },
  { id: "wood-black", kind: "wood", label: "Laqué noir", color: "#232323", roughness: 0.35 },
  { id: "wood-grey", kind: "wood", label: "Bois gris", color: "#8f8a82", roughness: 0.55, pbr: { asset: OAK, mode: "full", tint: "#a8a29a" } },
  // Metal, stone, glass
  { id: "metal-black", kind: "metal", label: "Métal noir", color: "#2a2a2a", roughness: 0.4, metalness: 0.8 },
  { id: "metal-steel", kind: "metal", label: "Acier brossé", color: "#b8babd", roughness: 0.35, metalness: 0.9 },
  { id: "metal-brass", kind: "metal", label: "Laiton", color: "#c9a955", roughness: 0.35, metalness: 0.9 },
  { id: "stone-black", kind: "stone", label: "Plan noir", color: "#232427", roughness: 0.5 },
  { id: "stone-terracotta", kind: "stone", label: "Terre cuite", color: "#b8683f", roughness: 0.8 },
  { id: "stone-white", kind: "stone", label: "Plan blanc", color: "#e9e7e2", roughness: 0.3 },
  { id: "glass-clear", kind: "glass", label: "Verre", color: "#cfe3ee", roughness: 0.05, opacity: 0.35 },
  // Exterior (site around the house)
  { id: "grass", kind: "exterior", label: "Gazon", color: "#527f33", roughness: 1, pbr: { asset: "leafy-grass", mode: "relief", relief: 1.5 } },
  { id: "field", kind: "exterior", label: "Prairie", color: "#4a6f2e", roughness: 1 },
  { id: "asphalt", kind: "exterior", label: "Enrobé", color: "#6a6865", roughness: 0.95, pbr: { asset: "asphalt-02", mode: "relief" } },
  { id: "decking", kind: "exterior", label: "Platelage bois", color: "#9c6c45", roughness: 0.7, pbr: { asset: "wood-floor-deck", mode: "relief", relief: 2 } },
  { id: "gravel", kind: "exterior", label: "Gravier", color: "#9d9a93", roughness: 1, pbr: { asset: "gravel", mode: "relief", relief: 2 } },
  { id: "ballast", kind: "exterior", label: "Ballast", color: "#857a6e", roughness: 1, pbr: { asset: "gravel", mode: "full", tint: "#a9a49d", scale: 0.6 } },
  { id: "render-white", kind: "exterior", label: "Crépi blanc", color: "#efede8", roughness: 0.9, pbr: PLASTER },
  { id: "metal-anthracite", kind: "exterior", label: "Métal anthracite", color: "#33363a", roughness: 0.5, metalness: 0.5 },
  { id: "fence-anthracite", kind: "exterior", label: "Palissade gris foncé", color: "#3e4348", roughness: 0.6, metalness: 0.3 },
  { id: "hedge-green", kind: "exterior", label: "Haie verte", color: "#3f5f2c", roughness: 1, pbr: { asset: "leafy-grass", mode: "relief", scale: 0.5, relief: 3 } },
  { id: "hedge-red", kind: "exterior", label: "Haie pourpre", color: "#6b4a3c", roughness: 1, pbr: { asset: "leafy-grass", mode: "relief", scale: 0.5, relief: 3 } },
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
