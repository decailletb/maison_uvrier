/**
 * Renders the site data of `site.ts`: static parts merged into one mesh per material,
 * repeated parts (sleepers, solar panels, vents) instanced, so the whole site costs a
 * few dozen draw calls. Textures come from the material library with flat-colour
 * fallback when assets are missing.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, BufferGeometry, CylinderGeometry, Euler, ExtrudeGeometry, InstancedMesh, Matrix4, Quaternion, Shape, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { LevelMode } from "@/viewer/presets";
import { MaterialNode } from "@/catalogue/components/MaterialNode";
import { buildSite, type SiteBox, type SiteInstances, type SiteMaterial, type SitePrism, type SiteSet, type SiteSurface } from "../site";
import { flatGeometry, slabGeometry } from "../shapes";
import { CM } from "../units";
import { metricUVs } from "../uv";

/** Excavation floor shown alone in the sous-sol view, as the former ground did. */
const EXCAVATION_CM = -311;

function SiteMaterialNode({ material }: { material: SiteMaterial }) {
  switch (material) {
    case "window":
      return <meshStandardMaterial color="#262c33" roughness={0.12} metalness={0.5} />;
    case "glass":
      return <meshStandardMaterial color="#cfe3ee" roughness={0.05} transparent opacity={0.3} depthWrite={false} />;
    case "steel":
      return <meshStandardMaterial color="#8e9195" roughness={0.35} metalness={0.8} />;
    case "sleeper":
      return <meshStandardMaterial color="#8c8782" roughness={0.9} />;
    case "solar":
      return (
        <>
          <meshStandardMaterial attach="material-0" color="#c4c8cc" roughness={0.3} metalness={0.85} />
          <meshStandardMaterial attach="material-1" color="#1f2d4f" roughness={0.18} metalness={0.35} />
        </>
      );
    default:
      return <MaterialNode id={material} />;
  }
}

/** Keep only position / normal / uv, non-indexed, so that any mix of geometries merges. */
function normalise(g: BufferGeometry): BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(out.attributes)) if (!["position", "normal", "uv"].includes(name)) out.deleteAttribute(name);
  out.clearGroups();
  return out;
}

function swapUv(g: BufferGeometry): BufferGeometry {
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    uv.setXY(i, uv.getY(i), u);
  }
  uv.needsUpdate = true;
  return g;
}

function surfaceGeometry(s: SiteSurface): BufferGeometry {
  const g =
    s.bottom === undefined ? flatGeometry(s.polygon, s.holes).translate(0, s.top * CM, 0) : slabGeometry(s.polygon, s.bottom, s.top, s.holes);
  metricUVs(g);
  return s.rotateUv ? swapUv(g) : g;
}

function boxGeometry(b: SiteBox): BufferGeometry {
  const g = new BoxGeometry((b.x1 - b.x0) * CM, (b.top - b.bottom) * CM, (b.y1 - b.y0) * CM);
  g.translate(((b.x0 + b.x1) / 2) * CM, ((b.bottom + b.top) / 2) * CM, (-(b.y0 + b.y1) / 2) * CM);
  return metricUVs(g);
}

/** Profile (plan y, height) extruded along plan x. */
function prismGeometry(p: SitePrism): BufferGeometry {
  const shape = new Shape();
  p.profile.forEach(([y, h], i) => (i === 0 ? shape.moveTo(y * CM, h * CM) : shape.lineTo(y * CM, h * CM)));
  shape.closePath();
  const g = new ExtrudeGeometry(shape, { depth: (p.x1 - p.x0) * CM, bevelEnabled: false });
  // Local (s, h, t) -> scene (t, h, -s): a quarter turn around +Y, then slide to x0.
  g.rotateY(Math.PI / 2);
  g.translate(p.x0 * CM, 0, 0);
  return metricUVs(g);
}

interface MergedPart {
  key: string;
  material: SiteMaterial;
  geometry: BufferGeometry;
  cast: boolean;
}

/** One merged geometry per material; flat ground surfaces only receive shadows. */
function mergeSet(set: SiteSet): MergedPart[] {
  const buckets = new Map<string, { material: SiteMaterial; cast: boolean; parts: BufferGeometry[] }>();
  const add = (material: SiteMaterial, cast: boolean, g: BufferGeometry) => {
    const key = `${material}:${cast ? "solid" : "flat"}`;
    const b = buckets.get(key) ?? { material, cast, parts: [] };
    b.parts.push(normalise(g));
    buckets.set(key, b);
  };
  set.surfaces.forEach((s) => add(s.material, s.bottom !== undefined, surfaceGeometry(s)));
  set.boxes.forEach((b) => add(b.material, b.material !== "glass", boxGeometry(b)));
  set.prisms.forEach((p) => add(p.material, false, prismGeometry(p)));
  return [...buckets.entries()].map(([key, b]) => {
    const geometry = mergeGeometries(b.parts, false) ?? b.parts[0];
    b.parts.forEach((g) => g !== geometry && g.dispose());
    return { key, material: b.material, geometry, cast: b.cast };
  });
}

function instanceGeometry(data: SiteInstances): BufferGeometry {
  const [sx, sy, h] = data.size.map((v) => v * CM);
  if (data.shape === "cylinder") return new CylinderGeometry(sx / 2, sx / 2, h, 16);
  const frame = new BoxGeometry(sx, h, sy);
  if (data.shape === "box") return metricUVs(frame);
  // Solar panel: aluminium frame (group 0) and a slightly inset cell sheet on top (group 1).
  const cell = new BoxGeometry(sx - 6 * CM, 1 * CM, sy - 6 * CM).translate(0, h / 2, 0);
  return mergeGeometries([frame, cell], true) ?? frame;
}

function InstancedSet({ data }: { data: SiteInstances }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => instanceGeometry(data), [data]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const one = new Vector3(1, 1, 1);
    const h = data.size[2];
    data.items.forEach((it, i) => {
      q.setFromEuler(new Euler(((it.tiltDeg ?? 0) * Math.PI) / 180, 0, 0));
      m.compose(new Vector3(it.at[0] * CM, (it.bottom + h / 2) * CM, -it.at[1] * CM), q, one);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, data.items.length]} castShadow receiveShadow name={data.id}>
      <SiteMaterialNode material={data.material} />
    </instancedMesh>
  );
}

function SiteSetMeshes({ set, name }: { set: SiteSet; name: string }) {
  const parts = useMemo(() => mergeSet(set), [set]);
  useEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);
  return (
    <group name={name}>
      {parts.map((p) => (
        <mesh key={p.key} geometry={p.geometry} castShadow={p.cast} receiveShadow>
          <SiteMaterialNode material={p.material} />
        </mesh>
      ))}
      {set.instances.map((d) => (
        <InstancedSet key={d.id} data={d} />
      ))}
    </group>
  );
}

function FlatField({ surface }: { surface: SiteSurface }) {
  const geometry = useMemo(() => surfaceGeometry(surface), [surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <SiteMaterialNode material={surface.material} />
    </mesh>
  );
}

/**
 * Site around the house. `showRoof` follows the house roof (villa F's solar panels sit
 * on it); in the sous-sol view only a plain excavation floor remains so the basement
 * stays visible.
 */
export function Site({ levelMode, showRoof }: { levelMode: LevelMode; showRoof: boolean }) {
  const site = useMemo(() => buildSite(), []);
  const excavation = useMemo<SiteSurface>(() => ({ ...site.far, id: "excavation", holes: [], top: EXCAVATION_CM }), [site]);
  if (levelMode === "sous-sol") return <FlatField surface={excavation} />;
  return (
    <group name="site">
      <FlatField surface={site.far} />
      <SiteSetMeshes set={site.ground} name="site-ground" />
      {showRoof && <SiteSetMeshes set={site.ownRoof} name="site-own-roof" />}
    </group>
  );
}
