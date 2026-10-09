import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import { distanceToSegment, polygonCentroid } from "@/data/geometry";
import { MaterialNode } from "@/catalogue/components/MaterialNode";
import { materialForFinish } from "@/catalogue/materials";
import type { RoomFinish } from "../sceneFile";
import { FOOTPRINT_CM } from "@/data/house";
import type { Level, Point, Room } from "@/data/schema";
import { EXTERIOR_WALL, SLAB, STAIR } from "../materials";
import { flatGeometry, slabGeometry } from "../shapes";
import { stairSteps } from "../stairs";
import { CM, planToScene } from "../units";
import { levelWallPieces, pieceFrame, type WallPiece } from "../walls";
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
  /** Material overrides per room id from the scene file. */
  finishes?: Record<string, RoomFinish>;
}

const FOOTPRINT_POLYGON: Point[] = [
  [0, 0],
  [FOOTPRINT_CM.width, 0],
  [FOOTPRINT_CM.width, FOOTPRINT_CM.depth],
  [0, FOOTPRINT_CM.depth],
];

const FOOTPRINT_CENTRE: Point = [FOOTPRINT_CM.width / 2, FOOTPRINT_CM.depth / 2];

/** Room whose boundary carries the midpoint of a wall piece (first match). */
function roomOfPiece(level: Level, piece: WallPiece): Room | undefined {
  const mid: Point = [(piece.start[0] + piece.end[0]) / 2, (piece.start[1] + piece.end[1]) / 2];
  const tol = piece.thickness / 2 + 6;
  return level.rooms.find((room) => {
    for (let i = 0; i < room.polygon.length; i++) {
      if (distanceToSegment(mid, room.polygon[i], room.polygon[(i + 1) % room.polygon.length]) <= tol) return true;
    }
    return false;
  });
}

function Walls({ level, finishes }: { level: Level; finishes?: Record<string, RoomFinish> }) {
  const pieces = useMemo(() => levelWallPieces(level), [level]);
  const exteriorIds = useMemo(() => new Set(level.walls.filter((w) => w.exterior).map((w) => w.id)), [level]);
  const rooms = useMemo(() => pieces.map((p) => roomOfPiece(level, p)), [level, pieces]);
  return (
    <group>
      {pieces.map((piece, i) => {
        const { centre, length, yaw } = pieceFrame(piece);
        const exterior = exteriorIds.has(piece.wallId);
        const room = rooms[i];
        const wallMaterial = (room && finishes?.[room.id]?.wall) ?? materialForFinish(room?.wallFinish, "wall");
        const mid = (piece.bottom + piece.top) / 2;
        // Inner skin of an exterior wall: a 1 cm box on the side facing the footprint centre.
        const toCentre = [FOOTPRINT_CENTRE[0] - centre[0], FOOTPRINT_CENTRE[1] - centre[1]];
        const normal: Point = [-Math.sin(yaw), Math.cos(yaw)];
        const sign = normal[0] * toCentre[0] + normal[1] * toCentre[1] >= 0 ? 1 : -1;
        const skinOffset = (piece.thickness / 2 - 0.5) * sign;
        const skinCentre: Point = [centre[0] + normal[0] * skinOffset, centre[1] + normal[1] * skinOffset];
        return (
          <group key={`${piece.wallId}-${i}`}>
            <mesh position={planToScene(centre, mid, level.floorLevel)} rotation={[0, yaw, 0]} castShadow receiveShadow>
              <boxGeometry args={[length * CM, (piece.top - piece.bottom) * CM, piece.thickness * CM]} />
              {exterior ? (
                <meshStandardMaterial color={EXTERIOR_WALL.color} roughness={EXTERIOR_WALL.roughness} />
              ) : (
                <MaterialNode id={wallMaterial} fallback="paint-white" />
              )}
              <Edges color="#6a6a66" threshold={30} />
            </mesh>
            {exterior && room && (
              <mesh position={planToScene(skinCentre, mid, level.floorLevel)} rotation={[0, yaw, 0]} receiveShadow>
                <boxGeometry args={[length * CM, (piece.top - piece.bottom) * CM, 1.2 * CM]} />
                <MaterialNode id={wallMaterial} fallback="paint-white" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Floors({
  level,
  showLabels,
  labelRoomId,
  finishes,
}: {
  level: Level;
  showLabels: boolean;
  labelRoomId?: string;
  finishes?: Record<string, RoomFinish>;
}) {
  return (
    <group>
      {level.rooms.map((room) => {
        if (EXTERIOR_ROOMS.has(room.id)) {
          return showLabels && (!labelRoomId || labelRoomId === room.id) ? (
            <RoomLabel key={room.id} text={room.name} position={planToScene(polygonCentroid(room.polygon), 120, level.floorLevel)} />
          ) : null;
        }
        const geometry = flatGeometry(room.polygon);
        const centroid = polygonCentroid(room.polygon);
        const floorMaterial = finishes?.[room.id]?.floor ?? materialForFinish(room.floorFinish, "floor");
        return (
          <group key={room.id}>
            <mesh geometry={geometry} position={[0, (level.floorLevel + 0.6) * CM, 0]} receiveShadow>
              <MaterialNode id={floorMaterial} fallback="tile-light" />
            </mesh>
            {showLabels && (!labelRoomId || labelRoomId === room.id) && <RoomLabel text={room.name} position={planToScene(centroid, 120, level.floorLevel)} />}
          </group>
        );
      })}
    </group>
  );
}

function Ceilings({ level, finishes }: { level: Level; finishes?: Record<string, RoomFinish> }) {
  return (
    <group>
      {level.rooms
        .filter((room) => !EXTERIOR_ROOMS.has(room.id))
        .map((room) => {
          const ceilingMaterial = finishes?.[room.id]?.ceiling ?? materialForFinish(room.ceilingFinish, "ceiling");
          return (
            <mesh key={room.id} geometry={flatGeometry(room.polygon)} position={[0, (level.floorLevel + level.clearHeight) * CM, 0]}>
              <MaterialNode id={ceilingMaterial} fallback="ceiling-white" side="double" />
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

export function LevelGroup({ level, slabBelow, riseAbove, stairHoles, showLabels, labelRoomId, showCeilings, finishes }: LevelGroupProps) {
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
      <Floors level={level} showLabels={showLabels} labelRoomId={labelRoomId} finishes={finishes} />
      <Walls level={level} finishes={finishes} />
      <Glazing level={level} />
      {shell && <Shell data={shell} />}
      <Stairs level={level} riseAbove={riseAbove} />
      {showCeilings && <Ceilings level={level} finishes={finishes} />}
    </group>
  );
}
