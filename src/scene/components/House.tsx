import { useMemo } from "react";
import { house } from "@/data/house";
import type { LevelMode } from "@/viewer/presets";
import { layoutLevels } from "../layout";
import { LevelGroup } from "./LevelGroup";

export function House({ mode, showLabels = true, showCeilings = false }: { mode: LevelMode; showLabels?: boolean; showCeilings?: boolean }) {
  const layouts = useMemo(() => layoutLevels(house.levels), []);
  const visible = mode === "all" ? layouts : layouts.filter((l) => l.level.id === mode);
  return (
    <group name="house">
      {visible.map((l) => (
        <LevelGroup
          key={l.level.id}
          level={l.level}
          slabBelow={l.slabBelow}
          riseAbove={l.riseAbove}
          stairHoles={l.stairHoles}
          showLabels={showLabels}
          showCeilings={showCeilings}
        />
      ))}
    </group>
  );
}
