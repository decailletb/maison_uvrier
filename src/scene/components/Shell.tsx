import { useMemo } from "react";
import type { Shell as ShellData, ShellMaterial } from "../shell";
import { slabGeometry } from "../shapes";
import { CM } from "../units";

const MATERIALS: Record<ShellMaterial, { color: string; roughness: number; metalness?: number; glass?: boolean }> = {
  concrete: { color: "#b8b5ae", roughness: 0.9 },
  gravel: { color: "#9d9a93", roughness: 1 },
  asphalt: { color: "#4b4b4a", roughness: 0.95 },
  glass: { color: "#cfe3ee", roughness: 0.05, glass: true },
  metal: { color: "#3a3a3a", roughness: 0.4, metalness: 0.8 },
  render: { color: "#d8d5ce", roughness: 0.9 },
};

function ShellMaterialNode({ material }: { material: ShellMaterial }) {
  const m = MATERIALS[material];
  if (m.glass) return <meshPhysicalMaterial color={m.color} transmission={0.8} roughness={m.roughness} transparent opacity={0.45} />;
  return <meshStandardMaterial color={m.color} roughness={m.roughness} metalness={m.metalness ?? 0} />;
}

/** Renders shell data; heights are absolute cm, polygons and centres in plan cm. */
export function Shell({ data }: { data: ShellData }) {
  const slabs = useMemo(() => data.slabs.map((s) => ({ ...s, geometry: slabGeometry(s.polygon, s.bottom, s.top) })), [data]);
  return (
    <group name="shell">
      {slabs.map((s) => (
        <mesh key={s.id} geometry={s.geometry} castShadow receiveShadow>
          <ShellMaterialNode material={s.material} />
        </mesh>
      ))}
      {data.boxes.map((b) => (
        <mesh
          key={b.id}
          position={[b.centre[0] * CM, ((b.bottom + b.top) / 2) * CM, -b.centre[1] * CM]}
          castShadow={b.material !== "glass"}
          receiveShadow
        >
          <boxGeometry args={[b.size[0] * CM, (b.top - b.bottom) * CM, b.size[1] * CM]} />
          <ShellMaterialNode material={b.material} />
        </mesh>
      ))}
    </group>
  );
}
