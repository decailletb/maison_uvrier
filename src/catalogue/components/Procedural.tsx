import { useMemo } from "react";
import { CM } from "@/scene/units";
import { proceduralParts, type ProceduralKind, type ProceduralParams } from "../procedural";
import { MaterialNode } from "./MaterialNode";

/** Parametric furniture; origin on the floor at the centre of the footprint, front toward +z. */
export function Procedural({ kind, params = {} }: { kind: ProceduralKind; params?: ProceduralParams }) {
  const { parts } = useMemo(() => proceduralParts(kind, params), [kind, params]);
  return (
    <group>
      {parts.map((p, i) => (
        <mesh key={i} position={[p.pos[0] * CM, p.pos[1] * CM, p.pos[2] * CM]} castShadow receiveShadow>
          <boxGeometry args={[p.size[0] * CM, p.size[1] * CM, p.size[2] * CM]} />
          <MaterialNode id={p.material} fallback="wood-oak" />
        </mesh>
      ))}
    </group>
  );
}
