/**
 * Glass panes and frames in glazed openings, and a leaf in exterior doors.
 * Interior doors stay open (no leaf) so the walk camera can pass.
 */
import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import { pointAlong } from "@/data/geometry";
import type { Level } from "@/data/schema";
import { CM, planToScene } from "../units";

const GLAZED = new Set(["window", "frenchWindow", "slidingDoor"]);
const PANE = 3;
const FRAME = 6;

export function Glazing({ level }: { level: Level }) {
  const items = useMemo(() => {
    return level.openings.flatMap((o) => {
      const wall = level.walls.find((w) => w.id === o.wallId);
      if (!wall) return [];
      const isDoorLeaf = o.kind === "door" && wall.exterior;
      if (!GLAZED.has(o.kind) && !isDoorLeaf) return [];
      const { point, dir } = pointAlong(wall.points, o.offset + o.width / 2);
      return [{ id: o.id, point, yaw: Math.atan2(dir[1], dir[0]), width: o.width, height: o.height, sill: o.sill, leaf: isDoorLeaf }];
    });
  }, [level]);

  return (
    <group>
      {items.map((it) => (
        <group key={it.id} position={planToScene(it.point, it.sill + it.height / 2, level.floorLevel)} rotation={[0, it.yaw, 0]}>
          {it.leaf ? (
            <mesh castShadow receiveShadow>
              <boxGeometry args={[it.width * CM, it.height * CM, 5 * CM]} />
              <meshStandardMaterial color="#f4f4f2" roughness={0.6} />
              <Edges color="#777" />
            </mesh>
          ) : (
            <>
              <mesh>
                <boxGeometry args={[(it.width - 2 * FRAME) * CM, (it.height - 2 * FRAME) * CM, PANE * CM]} />
                <meshPhysicalMaterial color="#cfe3ee" transmission={0.85} roughness={0.05} thickness={0.01} transparent opacity={0.5} />
              </mesh>
              <mesh castShadow>
                <boxGeometry args={[it.width * CM, it.height * CM, (PANE + 1) * CM]} />
                <meshStandardMaterial color="#e9e9e6" roughness={0.5} transparent opacity={0} depthWrite={false} />
                <Edges color="#5c5c58" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}
