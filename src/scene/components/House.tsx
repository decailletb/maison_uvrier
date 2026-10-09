import { useMemo } from "react";
import { house } from "@/data/house";
import type { LevelMode } from "@/viewer/presets";
import { layoutLevels } from "../layout";
import { roofShell } from "../shell";
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
  // The roof closes the house in the full view and in the étage view with ceilings on.
  const showRoof = mode === "all" || (mode === "etage" && showCeilings);
  return (
    <group name="house">
      {showRoof && <Shell data={roof} />}
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
        />
      ))}
    </group>
  );
}
