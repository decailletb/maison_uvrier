/** Decoration proposal produced by the `deco-interpreter` agent from one image. */
import { z } from "zod";
import { Category } from "@/catalogue/manifest";

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const Surface = z.object({
  material: z.string().optional(),
  description: z.string().default(""),
  colour: Hex,
});
export type Surface = z.infer<typeof Surface>;

export const ProposalFurniture = z.object({
  category: Category,
  styleTags: z.array(z.string()).default([]),
  approxDimensionsCm: z.object({ w: z.number().positive(), d: z.number().positive(), h: z.number().positive() }).optional(),
  colour: Hex.optional(),
  material: z.string().default(""),
  placementHint: z.string().default(""),
  /** Several identical pieces (chairs, nightstands). */
  count: z.number().int().positive().default(1),
});
export type ProposalFurniture = z.infer<typeof ProposalFurniture>;

export const Proposal = z.object({
  source: z.string(),
  targetRoom: z.string().optional(),
  palette: z.array(z.object({ hex: Hex, role: z.string().default("") })).min(1),
  surfaces: z.object({ floor: Surface, wall: Surface, ceiling: Surface }),
  furniture: z.array(ProposalFurniture),
  lighting: z
    .object({ mood: z.string().default(""), colourTemperatureK: z.number().default(3000), sources: z.array(z.string()).default([]) })
    .default({ mood: "", colourTemperatureK: 3000, sources: [] }),
  styleSummary: z.string().default(""),
});
export type Proposal = z.infer<typeof Proposal>;

export function parseProposal(json: unknown): Proposal {
  return Proposal.parse(json);
}
