/**
 * House data schema. All lengths in centimetres, plan coordinates (see the
 * `scene-format` skill): origin at the bottom-left outside corner of the villa on the
 * plan sheet, x to the right (0..1055), y toward the top of the sheet (0..724).
 */
import { z } from "zod";

export const LevelId = z.enum(["sous-sol", "rez", "etage"]);
export type LevelId = z.infer<typeof LevelId>;

export const Point = z.tuple([z.number(), z.number()]);
export type Point = z.infer<typeof Point>;

const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case ascii id");

export const Wall = z.object({
  id: Id,
  /** Centreline polyline, at least two points. */
  points: z.array(Point).min(2),
  thickness: z.number().positive(),
  structural: z.boolean(),
  exterior: z.boolean(),
  /** Height above the finished floor; defaults to the level clear height. */
  height: z.number().positive().optional(),
  estimated: z.boolean().optional(),
  note: z.string().optional(),
});
export type Wall = z.infer<typeof Wall>;

export const Room = z.object({
  id: Id,
  /** Exactly as printed on the plan, accents included. */
  name: z.string().min(1),
  /** Finished interior polygon, counter-clockwise or clockwise, not closed (no repeated last point). */
  polygon: z.array(Point).min(3),
  /** m² printed in the cartouche; absent when the cartouche is cut off. */
  printedArea: z.number().positive().optional(),
  floorFinish: z.string().optional(),
  wallFinish: z.string().optional(),
  ceilingFinish: z.string().optional(),
  estimated: z.boolean().optional(),
  note: z.string().optional(),
});
export type Room = z.infer<typeof Room>;

export const OpeningKind = z.enum(["door", "window", "slidingDoor", "frenchWindow", "passage"]);
export type OpeningKind = z.infer<typeof OpeningKind>;

export const Opening = z.object({
  id: Id,
  kind: OpeningKind,
  wallId: Id,
  /** Distance along the wall polyline from its first point to the near edge of the opening. */
  offset: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  /** Height of the bottom edge above the finished floor; 0 for doors. */
  sill: z.number().min(0).default(0),
  swing: z.enum(["left", "right", "sliding", "none"]).optional(),
  /** Joinery reference printed on the plan or elevation (001..012). */
  ref: z.string().optional(),
  estimated: z.boolean().optional(),
  note: z.string().optional(),
});
export type Opening = z.infer<typeof Opening>;

export const Stair = z.object({
  id: Id,
  polygon: z.array(Point).min(3),
  risers: z.number().int().positive().optional(),
  direction: z.enum(["up", "down"]),
  toLevel: LevelId,
  estimated: z.boolean().optional(),
  note: z.string().optional(),
});
export type Stair = z.infer<typeof Stair>;

export const Level = z.object({
  id: LevelId,
  /** As printed: "SOUS-SOL", "REZ DE CHAUSSEE", "ETAGE". */
  name: z.string().min(1),
  /** Finished floor level in cm, absolute (rez = 0). */
  floorLevel: z.number(),
  /** Finished floor to finished ceiling, cm. */
  clearHeight: z.number().positive(),
  /** Slab above this level, cm. */
  slabThickness: z.number().positive().default(22),
  planPage: z.number().int().positive(),
  walls: z.array(Wall),
  rooms: z.array(Room),
  openings: z.array(Opening),
  stairs: z.array(Stair).default([]),
});
export type Level = z.infer<typeof Level>;

export const House = z.object({
  name: z.string(),
  footprint: z.object({ width: z.number().positive(), depth: z.number().positive() }),
  levels: z.array(Level).min(1),
});
export type House = z.infer<typeof House>;
