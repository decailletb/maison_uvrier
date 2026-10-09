/** Uniform scale and offset that fit a loaded object to its manifest dimensions, on the floor, centred. */
import { Box3, Vector3, type Object3D } from "three";
import { CM } from "@/scene/units";

export function normaliseTransform(scene: Object3D, dimensionsCm?: { w: number; d: number; h: number }) {
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  const targetH = dimensionsCm ? dimensionsCm.h * CM : size.y;
  const scale = size.y > 0 ? targetH / size.y : 1;
  return { scale, offset: [-centre.x * scale, -box.min.y * scale, -centre.z * scale] as [number, number, number] };
}
