import { useTexture } from "@react-three/drei";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import { DoubleSide, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { tileTexture } from "@/scene/textures";
import { assetById, textureMapUrls, type TextureMapUrls } from "../manifest";
import { materialById, type MaterialDef } from "../materials";

type Side = "double" | undefined;

/** Flat colour (tile grid when defined): the fallback while textures load or when they are missing. */
function FlatMaterial({ def, side }: { def: MaterialDef; side: Side }) {
  const map = useMemo(() => (def.tile ? tileTexture(def.color, def.grout ?? "#999", def.tile) : null), [def]);
  return (
    <meshStandardMaterial
      color={map ? "#ffffff" : def.color}
      map={map ?? undefined}
      roughness={def.roughness}
      metalness={def.metalness ?? 0}
      transparent={def.opacity !== undefined}
      opacity={def.opacity ?? 1}
      depthWrite={def.opacity === undefined}
      side={side === "double" ? DoubleSide : undefined}
    />
  );
}

/** Repeat in metres (geometry UVs are metric, see `metricUVs`); colour maps in sRGB, data maps linear. */
function prepare(sizeM: number) {
  return (loaded: Record<string, Texture>) => {
    for (const [key, t] of Object.entries(loaded)) {
      const src = (t.image as { src?: string } | undefined)?.src ?? "";
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.repeat.set(1 / sizeM, 1 / sizeM);
      t.anisotropy = 8;
      t.colorSpace = key === "map" || /_diff_|_Color\./.test(src) ? SRGBColorSpace : NoColorSpace;
      t.needsUpdate = true;
    }
  };
}

function PbrMaterial({ def, urls, sizeM, side }: { def: MaterialDef; urls: TextureMapUrls; sizeM: number; side: Side }) {
  const pbr = def.pbr!;
  const wanted: Record<string, string> = {};
  if (pbr.mode === "full" && urls.map) wanted.map = urls.map;
  if (urls.normalMap) wanted.normalMap = urls.normalMap;
  if (urls.roughnessMap) wanted.roughnessMap = urls.roughnessMap;
  const shared = useTexture(wanted, prepare(sizeM)) as Record<string, Texture>;
  // A material that rescales the set gets its own copies (same image, other repeat).
  const scale = pbr.scale ?? 1;
  const maps = useMemo(() => {
    if (scale === 1) return shared;
    const out: Record<string, Texture> = {};
    for (const [key, t] of Object.entries(shared)) {
      // Cloned during render, before `prepare` runs on the shared set: set everything here.
      const copy = t.clone();
      copy.wrapS = RepeatWrapping;
      copy.wrapT = RepeatWrapping;
      copy.anisotropy = 8;
      copy.colorSpace = key === "map" ? SRGBColorSpace : NoColorSpace;
      copy.repeat.set(1 / (sizeM * scale), 1 / (sizeM * scale));
      copy.needsUpdate = true;
      out[key] = copy;
    }
    return out;
  }, [shared, scale, sizeM]);
  const relief = pbr.relief ?? 1;
  return (
    <meshStandardMaterial
      color={pbr.mode === "full" ? (pbr.tint ?? "#ffffff") : def.color}
      map={maps.map}
      normalMap={maps.normalMap}
      normalScale={[relief, relief]}
      roughnessMap={maps.roughnessMap}
      roughness={maps.roughnessMap ? 1 : def.roughness}
      metalness={def.metalness ?? 0}
      side={side === "double" ? DoubleSide : undefined}
    />
  );
}

/** Missing texture files (assets not fetched) fall back to the flat material instead of breaking the scene. */
class TextureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** meshStandardMaterial for a material id of the library: PBR texture set when available, else flat colour. */
export function MaterialNode({ id, fallback = "paint-white", side }: { id?: string; fallback?: string; side?: "double" }) {
  const def: MaterialDef = materialById(id, fallback);
  const entry = def.pbr ? assetById(def.pbr.asset) : undefined;
  const flat = <FlatMaterial def={def} side={side} />;
  if (!entry?.sizeM) return flat;
  return (
    <TextureBoundary fallback={flat}>
      <Suspense fallback={flat}>
        <PbrMaterial def={def} urls={textureMapUrls(entry)} sizeM={entry.sizeM} side={side} />
      </Suspense>
    </TextureBoundary>
  );
}
