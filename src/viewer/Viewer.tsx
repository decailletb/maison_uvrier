import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { NeutralToneMapping } from "three";
import { useEffect, useRef } from "react";
import { levelById } from "@/data/house";
import { SceneEnvironment, type SunSettings } from "@/scene/components/Environment";
import { Showcase } from "@/catalogue/components/Showcase";
import { House } from "@/scene/components/House";
import { Site } from "@/scene/components/Site";
import { CM } from "@/scene/units";
import type { CameraPreset, LevelMode } from "./presets";
import { markSceneReady, resetSceneReady } from "./ready";
import { WalkControls } from "./WalkControls";
import { Effects } from "./Effects";

export type CameraMode = "orbit" | "walk";

const EYE_HEIGHT_CM = 160;

function ReadySignal() {
  const frames = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    resetSceneReady();
    return () => resetSceneReady();
  }, []);
  useFrame((state) => {
    // A few frames so that controls, lights and labels have settled before a screenshot.
    frames.current += 1;
    if (frames.current < 8) invalidate();
    if (frames.current === 5) {
      markSceneReady();
      const info = state.gl.info.render;
      console.info(`[viewer] draw calls ${info.calls}, triangles ${info.triangles}`);
    }
  });
  return null;
}

export interface ViewerProps {
  preset: CameraPreset;
  levelMode: LevelMode;
  cameraMode: CameraMode;
  showLabels: boolean;
  showCeilings: boolean;
  sun: SunSettings;
  showStats?: boolean;
}

export function Viewer({ preset, levelMode, cameraMode, showLabels, showCeilings, sun, showStats = false }: ViewerProps) {
  const walkLevel = levelMode === "all" ? "rez" : levelMode;
  const eyeHeight = (levelById(walkLevel).floorLevel + EYE_HEIGHT_CM) * CM;
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.5]}
      // Orbit mode renders only when something changes; walking needs every frame.
      frameloop={cameraMode === "walk" ? "always" : "demand"}
      camera={{ position: preset.position, fov: preset.fov ?? 55, near: 0.05, far: 300 }}
      gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.0 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#9fb7cf"]} />
      <SceneEnvironment sun={sun} />
      {preset.showcase ? (
        <Showcase />
      ) : (
        <>
          <Site levelMode={levelMode} showRoof={levelMode === "all"} />
          <House mode={levelMode} showLabels={showLabels} labelRoomId={showCeilings ? preset.roomId : undefined} showCeilings={showCeilings} />
        </>
      )}
      {cameraMode === "orbit" ? <OrbitControls makeDefault target={preset.target} /> : <WalkControls eyeHeight={eyeHeight} />}
      <Effects />
      <ReadySignal />
      {showStats && <Stats />}
    </Canvas>
  );
}
