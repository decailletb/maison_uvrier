import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import { DoubleSide } from "three";
import { polygonCentroid } from "@/data/geometry";
import { FOOTPRINT_CM } from "@/data/house";
import type { Level, Point } from "@/data/schema";
import { DEFAULT_CEILING, DEFAULT_FLOOR, DEFAULT_WALL, EXTERIOR_WALL, SLAB, STAIR, finishMaterial } from "../materials";
import { flatGeometry, slabGeometry } from "../shapes";
import { stairSteps } from "../stairs";
import { tileTexture } from "../textures";
import { CM, planToScene } from "../units";
import { levelWallPieces, pieceFrame } from "../walls";
import { EXTERIOR_ROOMS, etageShell, rezShell } from "../shell";
import { Glazing } from "./Glazing";
import { Shell } from "./Shell";
import { RoomLabel } from "./RoomLabel";

export interface LevelGroupProps {
  level: Level;
  /** Thickness of the slab under this level's floor, cm. */
  slabBelow: number;
  /** Floor-to-floor height to the level above, cm (for the stair rise). */
  riseAbove: number;
  /** Stair polygons of the level below that pierce this slab. */
  stairHoles: readonly (readonly Point[])[];
  showLabels: boolean;
  /** When set, only this room gets a label. */
  labelRoomId?: string;
  /** Draw each room's ceiling at the clear height (off for cut-away top views). */
  showCeilings: boolean;
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
            <Edges color="#6a6a66" threshold={30} />
          </mesh>
        );
      })}
    </group>
  );
}

function Floors({ level, showLabels, labelRoomId }: { level: Level; showLabels: boolean; labelRoomId?: string }) {
  return (
    <group>
      {level.rooms.map((room) => {
        if (EXTERIOR_ROOMS.has(room.id)) {
          return showLabels && (!labelRoomId || labelRoomId === room.id) ? (
            <RoomLabel key={room.id} text={room.name} position={planToScene(polygonCentroid(room.polygon), 120, level.floorLevel)} />
          ) : null;
        }
        const mat = finishMaterial(room.floorFinish, DEFAULT_FLOOR);
        const geometry = flatGeometry(room.polygon);
        const centroid = polygonCentroid(room.polygon);
        const tiled = (room.floorFinish ?? "").toLowerCase().includes("carrelage");
        return (
          <group key={room.id}>
            <mesh geometry={geometry} position={[0, (level.floorLevel + 0.6) * CM, 0]} receiveShadow>
              {tiled ? (
                <meshStandardMaterial map={tileTexture(mat.color, "#b9b3a8")} roughness={mat.roughness} />
              ) : (
                <meshStandardMaterial color={mat.color} roughness={mat.roughness} />
              )}
            </mesh>
            {showLabels && (!labelRoomId || labelRoomId === room.id) && <RoomLabel text={room.name} position={planToScene(centroid, 120, level.floorLevel)} />}
          </group>
        );
      })}
    </group>
  );
}

function Ceilings({ level }: { level: Level }) {
  return (
    <group>
      {level.rooms
        .filter((room) => !EXTERIOR_ROOMS.has(room.id))
        .map((room) => {
          const mat = finishMaterial(room.ceilingFinish, DEFAULT_CEILING);
          return (
            <mesh key={room.id} geometry={flatGeometry(room.polygon)} position={[0, (level.floorLevel + level.clearHeight) * CM, 0]}>
              <meshStandardMaterial color={mat.color} roughness={mat.roughness} side={DoubleSide} />
            </mesh>
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

export function LevelGroup({ level, slabBelow, riseAbove, stairHoles, showLabels, labelRoomId, showCeilings }: LevelGroupProps) {
  const shell = useMemo(() => (level.id === "rez" ? rezShell(level) : level.id === "etage" ? etageShell(level) : null), [level]);
  const slab = useMemo(
    () => slabGeometry(FOOTPRINT_POLYGON, level.floorLevel - slabBelow, level.floorLevel, stairHoles),
    [level.floorLevel, slabBelow, stairHoles],
  );
  return (
    <group name={`level-${level.id}`}>
      <mesh geometry={slab} receiveShadow castShadow>
        <meshStandardMaterial color={SLAB.color} roughness={SLAB.roughness} />
      </mesh>
      <Floors level={level} showLabels={showLabels} labelRoomId={labelRoomId} />
      <Walls level={level} />
      <Glazing level={level} />
      {shell && <Shell data={shell} />}
      <Stairs level={level} riseAbove={riseAbove} />
      {showCeilings && <Ceilings level={level} />}
    </group>
  );
}
