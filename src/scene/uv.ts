/**
 * Box-projected UVs in metres: each vertex takes the two local coordinates across its
 * dominant normal axis, so a PBR texture with `repeat = 1 / sizeM` keeps its physical
 * size on any geometry (wall boxes, rounded cushions, cylinders).
 */
import { BufferAttribute, type BufferGeometry } from "three";

export function metricUVs<T extends BufferGeometry>(geometry: T): T {
  const pos = geometry.getAttribute("position");
  const nor = geometry.getAttribute("normal");
  if (!pos || !nor) return geometry;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const [ax, ay, az] = [Math.abs(nor.getX(i)), Math.abs(nor.getY(i)), Math.abs(nor.getZ(i))];
    // Side faces run u along the face, v up; top and bottom faces use plan x / z.
    const [u, v] = ax >= ay && ax >= az ? [z, y] : ay >= az ? [x, z] : [x, y];
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  return geometry;
}
