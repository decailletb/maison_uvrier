/** Vertical stacking of the levels: slab thicknesses, rises and stairwell holes. */
import type { Level, Point } from "@/data/schema";

/** Slab thickness under the lowest level (dalle béton 20 cm, section p. 9). */
const BOTTOM_SLAB = 20;
/** Fallback floor-to-floor height above the top level until the roof exists (phase 3). */
const TOP_RISE = 285;

export interface LevelLayout {
  level: Level;
  slabBelow: number;
  riseAbove: number;
  stairHoles: Point[][];
}

export function layoutLevels(levels: readonly Level[]): LevelLayout[] {
  return levels.map((level, i) => {
    const below = levels[i - 1];
    const above = levels[i + 1];
    return {
      level,
      slabBelow: below ? level.floorLevel - (below.floorLevel + below.clearHeight) : BOTTOM_SLAB,
      riseAbove: above ? above.floorLevel - level.floorLevel : TOP_RISE,
      stairHoles: below ? below.stairs.filter((s) => s.direction === "up").map((s) => s.polygon) : [],
    };
  });
}
