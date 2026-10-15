/**
 * Joinery in the openings, after the listing photos: PVC frames white inside and
 * anthracite outside (IMG_5505, IMG_5510), granite sills outside (elevations p. 7-8),
 * the entrance door 002 with three narrow glazings (IMG_5498), and white interior doors
 * standing open against the wall with their casing so the walk camera can pass.
 */
import { useMemo } from "react";
import { FOOTPRINT_CM } from "@/data/house";
import { pointAlong } from "@/data/geometry";
import type { Level, Opening, Point } from "@/data/schema";
import { CM, planToScene } from "../units";

const FRAME = 7;
const FRAME_DEPTH = 7;
const ANTHRACITE = "#2b2d30";
const WHITE = "#f1f0ec";
const GRANITE = "#6f6c68";

interface Item {
  o: Opening;
  point: Point;
  yaw: number;
  thickness: number;
  exterior: boolean;
  /** +1 when the local +z axis (plan right of the wall direction) points outside. */
  out: number;
}

type Size = [number, number, number];

/** Box in the opening frame: x along the wall, y up from the opening centre, z across. Sizes and positions in cm. */
function Box({ size, at, color, roughness = 0.5, metalness = 0 }: { size: Size; at: Size; color: string; roughness?: number; metalness?: number }) {
  return (
    <mesh position={[at[0] * CM, at[1] * CM, at[2] * CM]} castShadow receiveShadow>
      <boxGeometry args={[size[0] * CM, size[1] * CM, size[2] * CM]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function Pane({ w, h, at = [0, 0, 0] }: { w: number; h: number; at?: Size }) {
  return (
    <mesh position={[at[0] * CM, at[1] * CM, at[2] * CM]}>
      <boxGeometry args={[w * CM, h * CM, 2.4 * CM]} />
      <meshStandardMaterial color="#a9c3cf" roughness={0.03} metalness={0.25} transparent opacity={0.22} depthWrite={false} envMapIntensity={1.6} />
    </mesh>
  );
}

/** Frame bars in two colours: the inside half white, the outside half anthracite. */
function TwoTone({ size, at, out }: { size: [number, number]; at: [number, number]; out: number }) {
  const half = FRAME_DEPTH / 2;
  return (
    <>
      <Box size={[size[0], size[1], half]} at={[at[0], at[1], (-out * half) / 2]} color={WHITE} />
      <Box size={[size[0], size[1], half]} at={[at[0], at[1], (out * half) / 2]} color={ANTHRACITE} roughness={0.4} />
    </>
  );
}

function Window({ it }: { it: Item }) {
  const { o, out, thickness } = it;
  const w = o.width;
  const h = o.height;
  const bars: { size: [number, number]; at: [number, number] }[] = [
    { size: [w, FRAME], at: [0, h / 2 - FRAME / 2] },
    { size: [w, FRAME], at: [0, -h / 2 + FRAME / 2] },
    { size: [FRAME, h - 2 * FRAME], at: [-w / 2 + FRAME / 2, 0] },
    { size: [FRAME, h - 2 * FRAME], at: [w / 2 - FRAME / 2, 0] },
  ];
  // Two sashes on wide windows and on the sliding door; the fixed light 005 stays one pane.
  const split = o.kind === "slidingDoor" || o.kind === "frenchWindow" || (o.kind === "window" && w >= 100 && o.sill > 0);
  if (split) bars.push({ size: [FRAME * 0.8, h - 2 * FRAME], at: [0, 0] });
  return (
    <>
      <Pane w={w - 2 * FRAME} h={h - 2 * FRAME} />
      {bars.map((b, i) => (
        <TwoTone key={i} size={b.size} at={b.at} out={out} />
      ))}
      {it.exterior && (
        // Granite sill (tablette) or threshold (seuil) on the outside face.
        <Box size={[w + 6, 3, thickness / 2 + 4]} at={[0, -h / 2 - 1.5, out * (thickness / 4 + 2)]} color={GRANITE} roughness={0.35} />
      )}
    </>
  );
}

function EntranceDoor({ it }: { it: Item }) {
  const { o, out } = it;
  const w = o.width;
  const h = o.height;
  const leafW = w - 2 * FRAME;
  const leafH = h - FRAME;
  return (
    <>
      <TwoTone size={[w, FRAME]} at={[0, h / 2 - FRAME / 2]} out={out} />
      <TwoTone size={[FRAME, h]} at={[-w / 2 + FRAME / 2, 0]} out={out} />
      <TwoTone size={[FRAME, h]} at={[w / 2 - FRAME / 2, 0]} out={out} />
      <Box size={[leafW, leafH, 6]} at={[0, -FRAME / 2, 0]} color={WHITE} roughness={0.45} />
      {[-1, 0, 1].map((k) => (
        <Box key={k} size={[9, leafH - 50, 6.4]} at={[k * 18, -FRAME / 2, 0]} color="#3b4650" roughness={0.1} metalness={0.3} />
      ))}
      <Box size={[3, 30, 10]} at={[leafW / 2 - 10, 0, 0]} color="#b8babd" roughness={0.3} metalness={0.9} />
      <Box size={[w + 6, 3, it.thickness / 2 + 4]} at={[0, -h / 2 - 1.5, out * (it.thickness / 4 + 2)]} color={GRANITE} roughness={0.35} />
    </>
  );
}

function InteriorDoor({ it }: { it: Item }) {
  const { o, thickness } = it;
  const w = o.width;
  const h = o.height;
  const casing = 6;
  const depth = thickness + 2;
  const leafW = w - 4;
  // Hinge on the left jamb; the leaf stands open at 90° on the +z side of the wall.
  const hingeX = -w / 2 + 2;
  return (
    <>
      <Box size={[casing, h + casing, depth]} at={[-w / 2 - casing / 2 + 1, casing / 2, 0]} color={WHITE} />
      <Box size={[casing, h + casing, depth]} at={[w / 2 + casing / 2 - 1, casing / 2, 0]} color={WHITE} />
      <Box size={[w + 2 * casing - 2, casing, depth]} at={[0, h / 2 + casing / 2, 0]} color={WHITE} />
      {o.kind === "door" && (
        <Box size={[4, h - 2, leafW]} at={[hingeX + 2, -1, thickness / 2 + leafW / 2]} color="#f6f5f1" roughness={0.45} />
      )}
    </>
  );
}

export function Glazing({ level }: { level: Level }) {
  const items = useMemo<Item[]>(() => {
    const centre: Point = [FOOTPRINT_CM.width / 2, FOOTPRINT_CM.depth / 2];
    return level.openings.flatMap((o) => {
      const wall = level.walls.find((w) => w.id === o.wallId);
      if (!wall) return [];
      const { point, dir } = pointAlong(wall.points, o.offset + o.width / 2);
      // Local +z in plan is the right normal of the wall direction: (dy, -dx).
      const right: Point = [dir[1], -dir[0]];
      const away = (point[0] - centre[0]) * right[0] + (point[1] - centre[1]) * right[1];
      return [{ o, point, yaw: Math.atan2(dir[1], dir[0]), thickness: wall.thickness, exterior: wall.exterior, out: away >= 0 ? 1 : -1 }];
    });
  }, [level]);

  return (
    <group>
      {items.map((it) => {
        const { o } = it;
        let body: React.ReactNode = null;
        if (o.kind === "window" || o.kind === "frenchWindow" || o.kind === "slidingDoor") body = <Window it={it} />;
        else if (o.kind === "door" && it.exterior) body = <EntranceDoor it={it} />;
        else if (o.kind === "door") body = <InteriorDoor it={it} />;
        if (!body) return null;
        return (
          <group key={o.id} position={planToScene(it.point, o.sill + o.height / 2, level.floorLevel)} rotation={[0, it.yaw, 0]}>
            {body}
          </group>
        );
      })}
    </group>
  );
}
