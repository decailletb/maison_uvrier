/**
 * Procedural canvas textures used until the catalogue (phase 4) brings PBR sets.
 * Cached per key so that every room shares one texture object.
 */
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const cache = new Map<string, CanvasTexture>();

/** Square tiles with a grout line; `tileM` is the tile size in metres. */
export function tileTexture(color: string, grout: string, tileM = 0.6): CanvasTexture {
  const key = `tile:${color}:${grout}:${tileM}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = color;
  const g = 3;
  ctx.fillRect(g, g, size - 2 * g, size - 2 * g);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  // ShapeGeometry UVs are the shape's own units (metres): one repeat per tile.
  texture.repeat.set(1 / tileM, 1 / tileM);
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}
