/**
 * Catalogue manifest (`assets/manifest.json`): CC0 assets with their source, license,
 * dimensions and tags. See the `scene-format` skill for the vocabularies.
 */
import { z } from "zod";
import manifestJson from "../../assets/manifest.json";

export const Category = z.enum([
  "sofa",
  "armchair",
  "chair",
  "table",
  "coffeeTable",
  "bed",
  "nightstand",
  "wardrobe",
  "dresser",
  "shelf",
  "desk",
  "kitchen",
  "appliance",
  "bathroomFixture",
  "lamp",
  "rug",
  "plant",
  "decor",
  "material-floor",
  "material-wall",
  "material-fabric",
  "material-wood",
  "material-metal",
  "hdri",
]);
export type Category = z.infer<typeof Category>;

export const AssetEntry = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  category: Category,
  /** Main file, relative to assets/. */
  file: z.string(),
  /** Every file to restore for multi-file glTF, relative to assets/. */
  files: z.array(z.string()).optional(),
  url: z.string().url(),
  source: z.enum(["polyhaven", "ambientcg", "kenney", "sketchfab"]),
  license: z.literal("CC0-1.0"),
  dimensionsCm: z.object({ w: z.number().positive(), d: z.number().positive(), h: z.number().positive() }).optional(),
  tags: z.array(z.string()).default([]),
  fetchedAt: z.string(),
});
export type AssetEntry = z.infer<typeof AssetEntry>;

export const Manifest = z.object({ assets: z.array(AssetEntry) });
export type Manifest = z.infer<typeof Manifest>;

export const manifest: Manifest = Manifest.parse(manifestJson);

export function assetById(id: string): AssetEntry | undefined {
  return manifest.assets.find((a) => a.id === id);
}

/** Assets of a category, best tag overlap first. */
export function findAssets(category: Category, tags: readonly string[] = []): AssetEntry[] {
  const score = (a: AssetEntry) => a.tags.filter((t) => tags.includes(t)).length;
  return manifest.assets.filter((a) => a.category === category).sort((a, b) => score(b) - score(a));
}

/** URL the dev server and the build serve the asset at (Vite publicDir = assets/). */
export function assetUrl(entry: AssetEntry): string {
  return `/${entry.file}`;
}
