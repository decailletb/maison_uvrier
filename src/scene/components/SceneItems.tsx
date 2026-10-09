/**
 * Furniture items of the current scene: catalogue model or procedural kind, placed in
 * plan coordinates, selectable by click and draggable on the floor of their level.
 */
import { Edges } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import { Plane, Vector3 } from "three";
import { Model } from "@/catalogue/components/Model";
import { Procedural } from "@/catalogue/components/Procedural";
import { assetById } from "@/catalogue/manifest";
import { proceduralParts } from "@/catalogue/procedural";
import { levelById } from "@/data/house";
import type { LevelId, Point } from "@/data/schema";
import { roomAt, snapGrid, snapToWall } from "@/scene/placement";
import type { SceneItem } from "@/scene/sceneFile";
import { CM, planToScene, sceneToPlan } from "@/scene/units";
import { useEditor } from "@/viewer/store";

function itemSize(item: SceneItem): { w: number; d: number; h: number } {
  if (typeof item.asset === "string") {
    const entry = assetById(item.asset);
    return entry?.dimensionsCm ?? { w: 100, d: 100, h: 100 };
  }
  const params = { ...item.asset.params, ...item.materialOverrides };
  return proceduralParts(item.asset.procedural, params).size;
}

function ItemBody({ item }: { item: SceneItem }) {
  if (typeof item.asset === "string") {
    const entry = assetById(item.asset);
    if (!entry) return <Procedural kind="shelf" params={{ w: 60, d: 60, h: 60, material: "fabric-pink" }} />;
    return (
      <Suspense fallback={null}>
        <Model entry={entry} />
      </Suspense>
    );
  }
  return <Procedural kind={item.asset.procedural} params={{ ...item.asset.params, ...item.materialOverrides }} />;
}

function Item({ item, selected }: { item: SceneItem; selected: boolean }) {
  const select = useEditor((s) => s.select);
  const updateItem = useEditor((s) => s.updateItem);
  const get = useThree((s) => s.get);
  const level = levelById(item.levelId);
  const floorY = level.floorLevel * CM;
  const [dragPos, setDragPos] = useState<Point | null>(null);
  const dragging = useRef(false);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), -floorY), [floorY]);
  const hit = useMemo(() => new Vector3(), []);
  const size = useMemo(() => itemSize(item), [item]);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      select(item.id);
      dragging.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
      const controls = get().controls as { enabled?: boolean } | null;
      if (controls) controls.enabled = false;
    },
    [get, item.id, select],
  );

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!dragging.current) return;
      e.stopPropagation();
      if (e.ray.intersectPlane(plane, hit)) setDragPos(sceneToPlan([hit.x, hit.y, hit.z]));
    },
    [hit, plane],
  );

  const onPointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!dragging.current) return;
      dragging.current = false;
      (e.target as Element).releasePointerCapture(e.pointerId);
      const controls = get().controls as { enabled?: boolean } | null;
      if (controls) controls.enabled = true;
      if (!dragPos) return;
      const snappedGrid: Point = [snapGrid(dragPos[0]), snapGrid(dragPos[1])];
      const snap = snapToWall(snappedGrid, item.rotationY, size.d, level.walls, 25);
      const point = snap.snapped ? snap.point : snappedGrid;
      const room = roomAt(level, point);
      updateItem(item.id, {
        position: [Math.round(point[0]), Math.round(point[1]), item.position[2]],
        rotationY: snap.snapped ? snap.rotationDeg : item.rotationY,
        roomId: room?.id ?? item.roomId,
      });
      setDragPos(null);
    },
    [dragPos, get, item, level, size.d, updateItem],
  );

  const plan: Point = dragPos ?? [item.position[0], item.position[1]];
  return (
    <group
      position={planToScene(plan, item.position[2], level.floorLevel)}
      rotation={[0, (item.rotationY * Math.PI) / 180, 0]}
      scale={item.scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <ItemBody item={item} />
      {selected && (
        <mesh position={[0, (size.h * CM) / 2, 0]}>
          <boxGeometry args={[size.w * CM + 0.04, size.h * CM + 0.04, size.d * CM + 0.04]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          <Edges color="#ff9f1c" lineWidth={2} />
        </mesh>
      )}
    </group>
  );
}

export function SceneItems({ levels }: { levels: readonly LevelId[] }) {
  const items = useEditor((s) => s.scene.items);
  const selectedId = useEditor((s) => s.selectedId);
  return (
    <group name="scene-items">
      {items
        .filter((it) => levels.includes(it.levelId))
        .map((it) => (
          <Item key={it.id} item={it} selected={it.id === selectedId} />
        ))}
    </group>
  );
}
