import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { FOOTPRINT_CM, levelById } from "@/data/house";
import { flatGeometry } from "@/scene/shapes";
import { EXTERIOR_ROOMS } from "@/scene/shell";
import { useMemo } from "react";
import { SceneEnvironment, type SunSettings } from "@/scene/components/Environment";
import { House } from "@/scene/components/House";
import { CM } from "@/scene/units";
import type { CameraPreset, LevelMode } from "./presets";
import { markSceneReady, resetSceneReady } from "./ready";
import { WalkControls } from "./WalkControls";

export type CameraMode = "orbit" | "walk";

const EYE_HEIGHT_CM = 160;

function ReadySignal() {
  const frames = useRef(0);
  useEffect(() => {
    resetSceneReady();
    return () => resetSceneReady();
  }, []);
  useFrame(() => {
    // A few frames so that controls, lights and labels have settled before a screenshot.
    frames.current += 1;
    if (frames.current === 5) markSceneReady();
  });
  return null;
}

/**
 * Terrain aménagé at −0.10 with holes for the house footprint, the terrasse (−0.17) and
 * the couvert (−0.14); lowered to the excavation floor when the sous-sol is viewed alone.
 */
function Ground({ levelMode }: { levelMode: LevelMode }) {
  const y = levelMode === "sous-sol" ? -3.11 : -0.1;
  const geometry = useMemo(() => {
    const half = 20000;
    const cx = FOOTPRINT_CM.width / 2;
    const cy = FOOTPRINT_CM.depth / 2;
    const outer: [number, number][] = [
      [cx - half, cy - half],
      [cx + half, cy - half],
      [cx + half, cy + half],
      [cx - half, cy + half],
    ];
    const holes = [
      [
        [0, 0],
        [FOOTPRINT_CM.width, 0],
        [FOOTPRINT_CM.width, FOOTPRINT_CM.depth],
        [0, FOOTPRINT_CM.depth],
      ] as [number, number][],
      ...levelById("rez").rooms.filter((r) => EXTERIOR_ROOMS.has(r.id)).map((r) => r.polygon),
    ];
    return flatGeometry(outer, levelMode === "sous-sol" ? [] : holes);
  }, [levelMode]);
  return (
    <group>
      <mesh geometry={geometry} position={[0, y, 0]} receiveShadow>
        <meshStandardMaterial color="#6f8a5c" roughness={1} />
      </mesh>
    </group>
  );
}

export interface ViewerProps {
  preset: CameraPreset;
  levelMode: LevelMode;
  cameraMode: CameraMode;
  showLabels: boolean;
  showCeilings: boolean;
  sun: SunSettings;
}

export function Viewer({ preset, levelMode, cameraMode, showLabels, showCeilings, sun }: ViewerProps) {
  const walkLevel = levelMode === "all" ? "rez" : levelMode;
  const eyeHeight = (levelById(walkLevel).floorLevel + EYE_HEIGHT_CM) * CM;
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: preset.position, fov: 55, near: 0.05, far: 300 }}
      gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#9fb7cf"]} />
      <SceneEnvironment sun={sun} />
      <Ground levelMode={levelMode} />
      <House mode={levelMode} showLabels={showLabels} labelRoomId={showCeilings ? preset.roomId : undefined} showCeilings={showCeilings} />
      {cameraMode === "orbit" ? <OrbitControls makeDefault target={preset.target} /> : <WalkControls eyeHeight={eyeHeight} />}
      <ReadySignal />
    </Canvas>
  );
}
