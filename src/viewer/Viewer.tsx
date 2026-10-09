import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import type { CameraPreset } from "./presets";
import { markSceneReady } from "./ready";

/** Footprint of the villa in metres (1055 x 724 cm), used to size the ground. */
const FOOTPRINT = { x: 10.55, z: 7.24 };

function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    // Two frames so that controls and lights have settled before a screenshot.
    frames.current += 1;
    if (frames.current === 2) markSceneReady();
  });
  return null;
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOOTPRINT.x / 2, -0.001, FOOTPRINT.z / 2]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#5f6b5a" />
      </mesh>
      <Grid
        position={[FOOTPRINT.x / 2, 0, FOOTPRINT.z / 2]}
        args={[40, 40]}
        cellSize={1}
        sectionSize={5}
        cellColor="#8a9a86"
        sectionColor="#d8e3d2"
        fadeDistance={60}
        infiniteGrid={false}
      />
      {/* Villa footprint, so the empty scene already shows the house extents. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FOOTPRINT.x / 2, 0.002, FOOTPRINT.z / 2]}>
        <planeGeometry args={[FOOTPRINT.x, FOOTPRINT.z]} />
        <meshStandardMaterial color="#c9c2b4" />
      </mesh>
    </group>
  );
}

export interface ViewerProps {
  preset: CameraPreset;
}

export function Viewer({ preset }: ViewerProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: preset.position, fov: 50, near: 0.05, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#202830"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 5]} intensity={1.6} castShadow />
      <Ground />
      <OrbitControls makeDefault target={preset.target} />
      <ReadySignal />
    </Canvas>
  );
}
