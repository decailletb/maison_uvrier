import { useMemo } from "react";
import { DoubleSide } from "three";
import { tileTexture } from "@/scene/textures";
import { materialById, type MaterialDef } from "../materials";

/** meshStandardMaterial for a material id of the library (tile grid when defined). */
export function MaterialNode({ id, fallback = "paint-white", side }: { id?: string; fallback?: string; side?: "double" }) {
  const def: MaterialDef = materialById(id, fallback);
  const map = useMemo(() => (def.tile ? tileTexture(def.color, def.grout ?? "#999", def.tile) : null), [def]);
  return (
    <meshStandardMaterial
      color={map ? "#ffffff" : def.color}
      map={map ?? undefined}
      roughness={def.roughness}
      metalness={def.metalness ?? 0}
      transparent={def.opacity !== undefined}
      opacity={def.opacity ?? 1}
      depthWrite={def.opacity === undefined}
      side={side === "double" ? DoubleSide : undefined}
    />
  );
}
