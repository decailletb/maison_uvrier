/**
 * Flat PBR look-up for the finish strings printed on the plans. Phase 4 replaces
 * these with textured materials from the catalogue; the keys stay.
 */
export interface FlatMaterial {
  color: string;
  roughness: number;
  metalness?: number;
}

const FINISHES: Record<string, FlatMaterial> = {
  carrelage: { color: "#d9d4cc", roughness: 0.35 },
  "dalle brute": { color: "#9a9a96", roughness: 0.95 },
  "béton brut": { color: "#a8a6a1", roughness: 0.9 },
  goudron: { color: "#4a4a4a", roughness: 0.95 },
  "murs bruts": { color: "#b3b0aa", roughness: 0.95 },
  "béton + dispersion": { color: "#e8e6e1", roughness: 0.8 },
  crépis: { color: "#f1efe9", roughness: 0.85 },
  dispersion: { color: "#f7f6f2", roughness: 0.7 },
  schichtex: { color: "#e3e2de", roughness: 0.9 },
};

export const DEFAULT_FLOOR: FlatMaterial = { color: "#cfc8bc", roughness: 0.5 };
export const DEFAULT_WALL: FlatMaterial = { color: "#efede8", roughness: 0.85 };
export const DEFAULT_CEILING: FlatMaterial = { color: "#f7f6f2", roughness: 0.7 };
export const SLAB: FlatMaterial = { color: "#8e8c88", roughness: 0.9 };
export const STAIR: FlatMaterial = { color: "#b08a5a", roughness: 0.6 };
export const EXTERIOR_WALL: FlatMaterial = { color: "#d8d5ce", roughness: 0.9 };

export function finishMaterial(finish: string | undefined, fallback: FlatMaterial): FlatMaterial {
  if (!finish) return fallback;
  const key = finish.trim().toLowerCase();
  if (FINISHES[key]) return FINISHES[key];
  const partial = Object.keys(FINISHES).find((k) => key.includes(k));
  return partial ? FINISHES[partial] : fallback;
}
