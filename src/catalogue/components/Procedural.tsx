import { useMemo } from "react";
import { MetricGeometry } from "@/scene/components/MetricGeometry";
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
          <MetricGeometry size={[p.size[0] * CM, p.size[1] * CM, p.size[2] * CM]} shape={p.shape} />
          <MaterialNode id={p.material} fallback="wood-oak" />
        </mesh>
      ))}
    </group>
  );
}
