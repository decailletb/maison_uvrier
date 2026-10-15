/**
 * Ceiling light fixtures per room, as seen on the listing photos (IMG_5498-5509):
 * opal flush discs in most rooms, recessed spots in the kitchen and the sous-sol,
 * pendants in the bedrooms, the 60 × 60 coupole in the salle de bains. Pure, plan cm.
 */
import { polygonCentroid } from "@/data/geometry";
import type { Level, LevelId, Point } from "@/data/schema";
import { EXTERIOR_ROOMS } from "./shell";

export type FixtureKind = "disc" | "spot" | "pendantWoven" | "pendantFeather" | "skylight";

export interface Fixture {
  id: string;
  roomId: string;
  kind: FixtureKind;
  at: Point;
  /** Diameter (or side for the skylight), cm. */
  size: number;
  /** Carries the room's point light (one per room keeps the GPU budget). */
  light: boolean;
}

type RoomPlan = { kind: FixtureKind; size: number; at?: Point[] };

/** Explicit plans; every other interior room gets one 32 cm disc at its centroid. */
const PLANS: Partial<Record<LevelId, Record<string, RoomPlan[]>>> = {
  rez: {
    "sejour-cuisine": [
      { kind: "disc", size: 38, at: [[560, 540]] },
      { kind: "disc", size: 38, at: [[230, 300]] },
      {
        kind: "spot",
        size: 9,
        at: [
          [800, 520],
          [880, 520],
          [960, 520],
          [800, 610],
          [880, 610],
          [960, 610],
        ],
      },
    ],
    entree: [{ kind: "disc", size: 30, at: [[900, 353]] }],
  },
  etage: {
    "chambre-parents": [{ kind: "pendantWoven", size: 32 }],
    "chambre-2": [{ kind: "pendantFeather", size: 48, at: [[840, 523]] }],
    "salle-de-bains": [
      { kind: "skylight", size: 60, at: [[544, 600]] },
      { kind: "disc", size: 30, at: [[480, 500]] },
    ],
  },
  "sous-sol": {
    disponible: [
      {
        kind: "spot",
        size: 10,
        at: [
          [150, 150],
          [300, 150],
          [150, 400],
          [300, 400],
          [150, 600],
          [300, 600],
          [500, 400],
          [500, 600],
        ],
      },
    ],
  },
};

export function levelFixtures(level: Level): Fixture[] {
  const out: Fixture[] = [];
  for (const room of level.rooms) {
    if (EXTERIOR_ROOMS.has(room.id)) continue;
    const plans = PLANS[level.id]?.[room.id] ?? [{ kind: "disc" as const, size: 32 }];
    for (const plan of plans) {
      const points = plan.at ?? [polygonCentroid(room.polygon)];
      points.forEach((at, i) => {
        // One light per group of fixtures: the first lamp carries it, spots share it.
        const light = plan.kind !== "skylight" && i === 0;
        out.push({ id: `${room.id}-${plan.kind}-${i}`, roomId: room.id, kind: plan.kind, at, size: plan.size, light });
      });
    }
  }
  return out;
}

/**
 * Point-light intensity by fixture kind, on the scene's light scale (the sun is 3.2), not
 * in physical candela: a ceiling lamp lights the floor below at about the level of an
 * overcast day indoors. Spots stand for a whole group of spots.
 */
export function fixtureIntensity(kind: FixtureKind): number {
  return kind === "spot" ? 5 : kind === "pendantFeather" || kind === "pendantWoven" ? 3.5 : 4;
}
