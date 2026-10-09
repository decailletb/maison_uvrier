/**
 * Catalogue preview: every procedural kind in a row, then every model of the
 * manifest, on a neutral ground. Shown by the `catalogue` preset.
 */
import { Suspense } from "react";
import { manifest } from "../manifest";
import { PROCEDURAL_KINDS } from "../procedural";
import { Model } from "./Model";
import { Procedural } from "./Procedural";

const STEP = 2.8;

export function Showcase() {
  const models = manifest.assets.filter((a) => a.category !== "hdri" && !a.category.startsWith("material"));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(PROCEDURAL_KINDS.length * STEP) / 2, -0.001, 0]} receiveShadow>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial color="#d9d4cc" roughness={0.6} />
      </mesh>
      {PROCEDURAL_KINDS.map((kind, i) => (
        <group key={kind} position={[i * STEP, 0, 0]}>
          <Procedural kind={kind} />
        </group>
      ))}
      {models.map((entry, i) => (
        <group key={entry.id} position={[i * STEP, 0, -4]}>
          <Suspense fallback={null}>
            <Model entry={entry} />
          </Suspense>
        </group>
      ))}
    </group>
  );
}
