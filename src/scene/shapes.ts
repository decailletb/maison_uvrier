/** Plan polygons (cm) to Three.js geometry (m). */
import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from "three";
import type { Point } from "@/data/schema";
import { CM } from "./units";

/** Shape in the XZ plane expressed as (x, -y) so that a -90° X rotation maps it to plan coordinates. */
function toShapePoints(polygon: readonly Point[]): [number, number][] {
  return polygon.map(([x, y]) => [x * CM, y * CM]);
}

export function polygonShape(polygon: readonly Point[], holes: readonly (readonly Point[])[] = []): Shape {
  const shape = new Shape();
  const pts = toShapePoints(polygon);
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  for (const hole of holes) {
    const hp = toShapePoints(hole);
    const path = new Path();
    path.moveTo(hp[0][0], hp[0][1]);
    for (let i = 1; i < hp.length; i++) path.lineTo(hp[i][0], hp[i][1]);
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

/**
 * Flat polygon lying in the scene XZ plane. The geometry is built in XY and rotated
 * by -90° around X, which maps shape y to scene -z, i.e. plan y to scene -z.
 */
export function flatGeometry(polygon: readonly Point[], holes?: readonly (readonly Point[])[]): ShapeGeometry {
  const geom = new ShapeGeometry(polygonShape(polygon, holes));
  geom.rotateX(-Math.PI / 2);
  return geom;
}

/** Vertical extrusion of a polygon between two heights (cm above the level floor). */
export function slabGeometry(
  polygon: readonly Point[],
  bottomCm: number,
  topCm: number,
  holes?: readonly (readonly Point[])[],
): ExtrudeGeometry {
  const depth = (topCm - bottomCm) * CM;
  const geom = new ExtrudeGeometry(polygonShape(polygon, holes), { depth, bevelEnabled: false });
  // Extrusion goes along +z of the shape; rotate so it goes along scene +y, then lift.
  geom.rotateX(-Math.PI / 2);
  geom.translate(0, bottomCm * CM, 0);
  return geom;
}
