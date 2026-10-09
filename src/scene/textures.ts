/**
 * Procedural canvas textures used until the catalogue (phase 4) brings PBR sets.
 * Cached per key so that every room shares one texture object.
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const cache = new Map<string, CanvasTexture>();

/**
 * Tiles with a grout line. `tile` is the tile size in metres: a number for squares,
 * [length, width] for planks (staggered by half a length on every other row).
 */
export function tileTexture(color: string, grout: string, tile: number | [number, number] = 0.6): CanvasTexture {
  const [lenM, widM] = typeof tile === "number" ? [tile, tile] : tile;
  const key = `tile:${color}:${grout}:${lenM}:${widM}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const plank = lenM !== widM;
  const w = 512;
  const h = plank ? 128 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  const g = plank ? 2 : 4;
  if (plank) {
    // Two rows of planks, the second offset by half a length.
    ctx.fillRect(g, g, w - 2 * g, h / 2 - 2 * g);
    ctx.fillRect(g, h / 2 + g, w / 2 - 2 * g, h / 2 - 2 * g);
    ctx.fillRect(w / 2 + g, h / 2 + g, w / 2 - 2 * g, h / 2 - 2 * g);
  } else {
    ctx.fillRect(g, g, w - 2 * g, h - 2 * g);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  // ShapeGeometry UVs are the shape's own units (metres): one repeat per tile (two plank rows per repeat).
  texture.repeat.set(1 / lenM, 1 / (plank ? 2 * widM : widM));
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
