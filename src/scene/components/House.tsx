import { useMemo } from "react";
import { house } from "@/data/house";
import type { LevelMode } from "@/viewer/presets";
import { layoutLevels } from "../layout";
import { roofShell } from "../shell";
import { useEditor } from "@/viewer/store";
import { SceneItems } from "./SceneItems";
import { Shell } from "./Shell";
import { LevelGroup } from "./LevelGroup";

export function House({
  mode,
  showLabels = true,
  labelRoomId,
  showCeilings = false,
}: {
  mode: LevelMode;
  showLabels?: boolean;
  labelRoomId?: string;
  showCeilings?: boolean;
}) {
  const layouts = useMemo(() => layoutLevels(house.levels), []);
  const visible = mode === "all" ? layouts : layouts.filter((l) => l.level.id === mode);
  const roof = useMemo(() => roofShell(), []);
  const finishes = useEditor((s) => s.scene.roomFinishes);
  const select = useEditor((s) => s.select);
  // The roof closes the house in the full view and in the étage view with ceilings on.
  const showRoof = mode === "all" || (mode === "etage" && showCeilings);
  return (
    <group name="house" onPointerMissed={() => select(null)}>
      {showRoof && <Shell data={roof} />}
      <SceneItems levels={visible.map((l) => l.level.id)} />
      {visible.map((l) => (
        <LevelGroup
          key={l.level.id}
          level={l.level}
          slabBelow={l.slabBelow}
          riseAbove={l.riseAbove}
          stairHoles={l.stairHoles}
          showLabels={showLabels}
          labelRoomId={labelRoomId}
          showCeilings={showCeilings}
          finishes={finishes}
        />
      ))}
    </group>
  );
}
