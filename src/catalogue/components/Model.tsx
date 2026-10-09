/**
 * glTF asset from the manifest, normalised so that its bounding box matches
 * `dimensionsCm` (uniform scale on the height) and sits on the floor, centred.
 */
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { assetUrl, type AssetEntry } from "../manifest";
import { normaliseTransform } from "../normalise";

export function Model({ entry }: { entry: AssetEntry }) {
  const gltf = useGLTF(assetUrl(entry));
  const { scale, offset } = useMemo(() => normaliseTransform(gltf.scene, entry.dimensionsCm), [gltf.scene, entry.dimensionsCm]);
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
    });
    return clone;
  }, [gltf.scene]);
  return (
    <group position={offset} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}
