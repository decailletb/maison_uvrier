/**
 * One stair: concrete step bodies with wood-look treads and risers (photo IMG_5506),
 * and its guards as a white stringer wall under a black bar balustrade (photo IMG_5501).
 * Each part is merged into a single geometry: five draw calls per stair.
 */
import { useEffect, useMemo } from "react";
import { BoxGeometry, type BufferGeometry, Euler, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MaterialNode } from "@/catalogue/components/MaterialNode";
import type { Point, Stair } from "@/data/schema";
import { slabGeometry } from "../shapes";
import { guardSamples, stairSteps } from "../stairs";
import { CM } from "../units";
import { metricUVs } from "../uv";

/** Wood cladding thickness on top of each concrete step, so the riser face is wood too. */
const CLAD = 2;
const GUARD_HEIGHT = 90;
const BAR = 1.4;
const RAIL = [4, 1.5] as const;
const STRINGER = 20;

function box(size: [number, number, number], centre: [number, number, number], yaw = 0, pitch = 0): BufferGeometry {
  const g = new BoxGeometry(size[0] * CM, size[1] * CM, size[2] * CM);
  const m = new Matrix4().compose(
    new Vector3(centre[0] * CM, centre[1] * CM, -centre[2] * CM),
    new Quaternion().setFromEuler(new Euler(0, yaw, pitch, "YZX")),
    new Vector3(1, 1, 1),
  );
  return g.applyMatrix4(m);
}

function merged(parts: BufferGeometry[]): BufferGeometry | null {
  if (!parts.length) return null;
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  parts.forEach((p) => p.dispose());
  return g ? metricUVs(g) : null;
}

export function StairMesh({ stair, floorLevel, rise }: { stair: Stair; floorLevel: number; rise: number }) {
  const parts = useMemo(() => {
    const steps = stairSteps(stair, rise);
    const riser = steps.length ? steps[0].top : rise;
    const wood: BufferGeometry[] = [];
    const body: BufferGeometry[] = [];
    for (const s of steps) {
      const cladBottom = Math.max(s.bottom, s.top - riser - CLAD);
      wood.push(slabGeometry(s.polygon, floorLevel + cladBottom, floorLevel + s.top));
      if (cladBottom > s.bottom + 0.5) body.push(slabGeometry(s.polygon, floorLevel + s.bottom, floorLevel + cladBottom));
    }
    const stringer: BufferGeometry[] = [];
    const bars: BufferGeometry[] = [];
    const rails: BufferGeometry[] = [];
    for (const line of stair.guards ?? []) {
      const samples = guardSamples(stair, steps, line as Point[]);
      for (let i = 0; i < samples.length; i++) {
        const { point, base } = samples[i];
        bars.push(box([BAR, GUARD_HEIGHT, BAR], [point[0], floorLevel + base + GUARD_HEIGHT / 2, point[1]]));
        const next = samples[i + 1];
        if (!next) continue;
        const dx = next.point[0] - point[0];
        const dy = next.point[1] - point[1];
        const len = Math.hypot(dx, dy);
        const yaw = Math.atan2(dy, dx);
        const mid: Point = [(point[0] + next.point[0]) / 2, (point[1] + next.point[1]) / 2];
        stringer.push(box([len + 0.2, base, STRINGER], [mid[0], floorLevel + base / 2, mid[1]], yaw));
        const dz = next.base - base;
        rails.push(
          box([Math.hypot(len, dz) + RAIL[0], RAIL[1], RAIL[0]], [mid[0], floorLevel + (base + next.base) / 2 + GUARD_HEIGHT, mid[1]], yaw, Math.atan2(dz, len)),
        );
      }
    }
    return { wood: merged(wood), body: merged(body), stringer: merged(stringer), metal: merged([...bars, ...rails]) };
  }, [stair, floorLevel, rise]);

  useEffect(
    () => () => {
      Object.values(parts).forEach((g) => g?.dispose());
    },
    [parts],
  );

  return (
    <group name={`stair-${stair.id}`}>
      {parts.wood && (
        <mesh geometry={parts.wood} castShadow receiveShadow>
          <MaterialNode id="wood-walnut" />
        </mesh>
      )}
      {parts.body && (
        <mesh geometry={parts.body} castShadow receiveShadow>
          <MaterialNode id="paint-white" />
        </mesh>
      )}
      {parts.stringer && (
        <mesh geometry={parts.stringer} castShadow receiveShadow>
          <MaterialNode id="paint-white" />
        </mesh>
      )}
      {parts.metal && (
        <mesh geometry={parts.metal} castShadow>
          <meshStandardMaterial color="#1f1f1f" roughness={0.45} metalness={0.6} />
        </mesh>
      )}
    </group>
  );
}
