import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { polygonCentroid } from "@/data/geometry";
import { FOOTPRINT_CM } from "@/data/house";
import type { Level, Point } from "@/data/schema";
import { DEFAULT_FLOOR, DEFAULT_WALL, EXTERIOR_WALL, SLAB, STAIR, finishMaterial } from "../materials";
import { flatGeometry, slabGeometry } from "../shapes";
import { stairSteps } from "../stairs";
import { CM, planToScene } from "../units";
import { levelWallPieces, pieceFrame } from "../walls";

export interface LevelGroupProps {
  level: Level;
  /** Thickness of the slab under this level's floor, cm. */
  slabBelow: number;
  /** Floor-to-floor height to the level above, cm (for the stair rise). */
  riseAbove: number;
  /** Stair polygons of the level below that pierce this slab. */
  stairHoles: readonly (readonly Point[])[];
  showLabels: boolean;
}

const FOOTPRINT_POLYGON: Point[] = [
  [0, 0],
  [FOOTPRINT_CM.width, 0],
  [FOOTPRINT_CM.width, FOOTPRINT_CM.depth],
  [0, FOOTPRINT_CM.depth],
];

function Walls({ level }: { level: Level }) {
  const pieces = useMemo(() => levelWallPieces(level), [level]);
  const exteriorIds = useMemo(() => new Set(level.walls.filter((w) => w.exterior).map((w) => w.id)), [level]);
  return (
    <group>
      {pieces.map((piece, i) => {
        const { centre, length, yaw } = pieceFrame(piece);
        const mat = exteriorIds.has(piece.wallId) ? EXTERIOR_WALL : DEFAULT_WALL;
        const mid = (piece.bottom + piece.top) / 2;
        return (
          <mesh
            key={`${piece.wallId}-${i}`}
            position={planToScene(centre, mid, level.floorLevel)}
            rotation={[0, yaw, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[length * CM, (piece.top - piece.bottom) * CM, piece.thickness * CM]} />
            <meshStandardMaterial color={mat.color} roughness={mat.roughness} />
          </mesh>
        );
      })}
    </group>
  );
}

function Floors({ level, showLabels }: { level: Level; showLabels: boolean }) {
  return (
    <group>
      {level.rooms.map((room) => {
        const mat = finishMaterial(room.floorFinish, DEFAULT_FLOOR);
        const geometry = flatGeometry(room.polygon);
        const centroid = polygonCentroid(room.polygon);
        return (
          <group key={room.id}>
            <mesh geometry={geometry} position={[0, (level.floorLevel + 0.6) * CM, 0]} receiveShadow>
              <meshStandardMaterial color={mat.color} roughness={mat.roughness} />
            </mesh>
            {showLabels && (
              <Html position={planToScene(centroid, 2, level.floorLevel)} center zIndexRange={[10, 0]}>
                <div
                  data-room={room.id}
                  style={{
                    color: "#1d2024",
                    background: "rgba(255,255,255,0.7)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {room.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Stairs({ level, riseAbove }: { level: Level; riseAbove: number }) {
  return (
    <group>
      {level.stairs
        .filter((s) => s.direction === "up")
        .map((stair) => (
          <group key={stair.id}>
            {stairSteps(stair, riseAbove).map((step, i) => (
              <mesh
                key={i}
                position={planToScene(step.centre, step.top / 2, level.floorLevel)}
                rotation={[0, step.yaw, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[step.run * CM, step.top * CM, step.width * CM]} />
                <meshStandardMaterial color={STAIR.color} roughness={STAIR.roughness} />
              </mesh>
            ))}
          </group>
        ))}
    </group>
  );
}

export function LevelGroup({ level, slabBelow, riseAbove, stairHoles, showLabels }: LevelGroupProps) {
  const slab = useMemo(
    () => slabGeometry(FOOTPRINT_POLYGON, level.floorLevel - slabBelow, level.floorLevel, stairHoles),
    [level.floorLevel, slabBelow, stairHoles],
  );
  return (
    <group name={`level-${level.id}`}>
      <mesh geometry={slab} receiveShadow castShadow>
        <meshStandardMaterial color={SLAB.color} roughness={SLAB.roughness} />
      </mesh>
      <Floors level={level} showLabels={showLabels} />
      <Walls level={level} />
      <Stairs level={level} riseAbove={riseAbove} />
    </group>
  );
}
