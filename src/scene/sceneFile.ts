/**
 * Scene file schema (`scenes/<name>.json`): furniture items and room finishes.
 * Positions are plan cm (x, y) plus height above the level floor; rotation in
 * degrees around the vertical axis, 0 = front toward plan −y (south).
 */
import { z } from "zod";
import { PROCEDURAL_KINDS } from "@/catalogue/procedural";

const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const ProceduralAsset = z.object({
  procedural: z.enum(PROCEDURAL_KINDS),
  params: z
    .object({
      w: z.number().positive().optional(),
      d: z.number().positive().optional(),
      h: z.number().positive().optional(),
      material: z.string().optional(),
      accent: z.string().optional(),
    })
    .default({}),
});
export type ProceduralAsset = z.infer<typeof ProceduralAsset>;

export const SceneItem = z.object({
  id: Id,
  /** Catalogue asset id, or a procedural kind with parameters. */
  asset: z.union([Id, ProceduralAsset]),
  levelId: z.enum(["sous-sol", "rez", "etage"]),
  roomId: z.string(),
  /** Plan x, plan y, height above the level floor, cm. */
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotationY: z.number().default(0),
  scale: z.number().positive().default(1),
  materialOverrides: z.record(z.string(), z.string()).optional(),
});
export type SceneItem = z.infer<typeof SceneItem>;

export const RoomFinish = z.object({
  floor: z.string().optional(),
  wall: z.string().optional(),
  ceiling: z.string().optional(),
});
export type RoomFinish = z.infer<typeof RoomFinish>;

export const Scene = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  base: z.string().optional(),
  roomFinishes: z.record(z.string(), RoomFinish).default({}),
  items: z.array(SceneItem).default([]),
});
export type Scene = z.infer<typeof Scene>;

export const EMPTY_SCENE: Scene = { version: 1, name: "vide", roomFinishes: {}, items: [] };

export function parseScene(json: unknown): Scene {
  return Scene.parse(json);
}

let counter = 0;
export function newItemId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter}`;
}
