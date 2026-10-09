import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { FOOTPRINT_CM, levelById } from "@/data/house";
import { SceneEnvironment, type SunSettings } from "@/scene/components/Environment";
import { House } from "@/scene/components/House";
import { CM } from "@/scene/units";
import type { CameraPreset, LevelMode } from "./presets";
import { markSceneReady } from "./ready";
import { WalkControls } from "./WalkControls";

export type CameraMode = "orbit" | "walk";

const FOOTPRINT = { x: FOOTPRINT_CM.width * CM, z: FOOTPRINT_CM.depth * CM };
const EYE_HEIGHT_CM = 160;

function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    // A few frames so that controls, lights and labels have settled before a screenshot.
    frames.current += 1;
    if (frames.current === 3) markSceneReady();
  });
  return null;
}

/** Terrain aménagé at −0.10; lowered to the excavation floor when the sous-sol is viewed alone. */
function Ground({ levelMode }: { levelMode: LevelMode }) {
  const y = levelMode === "sous-sol" ? -3.11 : -0.1;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOOTPRINT.x / 2, y, -FOOTPRINT.z / 2]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#6f8a5c" roughness={1} />
      </mesh>
      <Grid
        position={[FOOTPRINT.x / 2, y + 0.005, -FOOTPRINT.z / 2]}
        args={[80, 80]}
        cellSize={1}
        sectionSize={5}
        cellColor="#8aa07e"
        sectionColor="#c9d9bf"
        fadeDistance={60}
        infiniteGrid={false}
      />
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
      gl={{ antialias: true, powerPreference: "high-performance" }}
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
