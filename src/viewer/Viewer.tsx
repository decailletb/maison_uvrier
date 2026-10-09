import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { FOOTPRINT_CM, levelById } from "@/data/house";
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

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOOTPRINT.x / 2, -3.1, -FOOTPRINT.z / 2]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#5f6b5a" />
      </mesh>
      <Grid
        position={[FOOTPRINT.x / 2, -3.09, -FOOTPRINT.z / 2]}
        args={[60, 60]}
        cellSize={1}
        sectionSize={5}
        cellColor="#8a9a86"
        sectionColor="#d8e3d2"
        fadeDistance={80}
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
}

export function Viewer({ preset, levelMode, cameraMode, showLabels }: ViewerProps) {
  const walkLevel = levelMode === "all" ? "rez" : levelMode;
  const eyeHeight = (levelById(walkLevel).floorLevel + EYE_HEIGHT_CM) * CM;
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: preset.position, fov: 60, near: 0.05, far: 300 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#202830"]} />
      <hemisphereLight args={["#dfe8f5", "#5a5243", 0.7]} />
      <directionalLight
        position={[6, 18, 12]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0004}
      />
      <Ground />
      <House mode={levelMode} showLabels={showLabels} />
      {cameraMode === "orbit" ? <OrbitControls makeDefault target={preset.target} /> : <WalkControls eyeHeight={eyeHeight} />}
      <ReadySignal />
    </Canvas>
  );
}
