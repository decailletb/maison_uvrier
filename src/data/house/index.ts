/**
 * Validated house data. Each level JSON is parsed through the zod schema at import
 * time, so a malformed file fails fast in dev, tests and build alike.
 */
import { House, Level, type LevelId } from "../schema";
import sousSol from "./sous-sol.json";
import rez from "./rez.json";
import etage from "./etage.json";

export const FOOTPRINT_CM = { width: 1055, depth: 724 } as const;

export const house = House.parse({
  name: 'Villa F "LACAPELA"',
  footprint: FOOTPRINT_CM,
  levels: [Level.parse(sousSol), Level.parse(rez), Level.parse(etage)],
});

export function levelById(id: LevelId): Level {
  const level = house.levels.find((l) => l.id === id);
  if (!level) throw new Error(`unknown level ${id}`);
  return level;
}
