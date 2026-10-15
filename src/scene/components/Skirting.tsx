/** Skirting boards of a level (see `skirting.ts`), merged into one mesh: dark wood tone of the photos. */
import { useEffect, useMemo } from "react";
import { BoxGeometry, Euler, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { signedArea } from "@/data/geometry";
import type { Level } from "@/data/schema";
import { levelSkirting } from "../skirting";
import { CM } from "../units";

const HEIGHT = 7;
const DEPTH = 1.2;

export function Skirting({ level }: { level: Level }) {
  const geometry = useMemo(() => {
    const orientation = new Map(level.rooms.map((r) => [r.id, Math.sign(signedArea(r.polygon)) || 1]));
    const parts = levelSkirting(level).map((run) => {
      const dx = run.end[0] - run.start[0];
      const dy = run.end[1] - run.start[1];
      const len = Math.hypot(dx, dy);
      // Inward normal: left of the edge for a counter-clockwise outline.
      const s = orientation.get(run.roomId) ?? 1;
      const n = [(-dy / len) * s, (dx / len) * s];
      const cx = (run.start[0] + run.end[0]) / 2 + n[0] * (DEPTH / 2);
      const cy = (run.start[1] + run.end[1]) / 2 + n[1] * (DEPTH / 2);
      const g = new BoxGeometry(len * CM, HEIGHT * CM, DEPTH * CM);
      g.applyMatrix4(
        new Matrix4().compose(
          new Vector3(cx * CM, (level.floorLevel + HEIGHT / 2 + 0.6) * CM, -cy * CM),
          new Quaternion().setFromEuler(new Euler(0, Math.atan2(dy, dx), 0)),
          new Vector3(1, 1, 1),
        ),
      );
      return g;
    });
    const merged = parts.length ? mergeGeometries(parts) : null;
    parts.forEach((p) => p.dispose());
    return merged;
  }, [level]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#5b4a3d" roughness={0.55} />
    </mesh>
  );
}
