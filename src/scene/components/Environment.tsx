/**
 * Sky, sun and shadows. Uses the CC0 HDRI from assets/hdri when it is on disk
 * (served at the site root by Vite's publicDir), otherwise drei's procedural Sky.
 */
import { Environment as DreiEnvironment, Sky } from "@react-three/drei";
import { useEffect, useState } from "react";
import { sunDirection, sunPosition } from "../sun";

export const DEFAULT_HDRI = "/hdri/kloofendal_48d_partly_cloudy_puresky.hdr";

function useFileExists(url: string): boolean | undefined {
  const [exists, setExists] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => !cancelled && setExists(r.ok && !(r.headers.get("content-type") ?? "").includes("text/html")))
      .catch(() => !cancelled && setExists(false));
    return () => {
      cancelled = true;
    };
  }, [url]);
  return exists;
}

export interface SunSettings {
  month: number;
  hour: number;
}

export function SceneEnvironment({ sun, hdri = DEFAULT_HDRI }: { sun: SunSettings; hdri?: string }) {
  const hasHdri = useFileExists(hdri);
  const position = sunPosition(sun.month, 15, sun.hour);
  const dir = sunDirection(position);
  const daylight = Math.max(0, Math.min(1, position.elevation / 20));
  const lightPos: [number, number, number] = [dir[0] * 60 + 5, Math.max(dir[1], 0.05) * 60, dir[2] * 60 - 3.5];
  return (
    <>
      {hasHdri ? (
        <DreiEnvironment files={hdri} background environmentIntensity={0.6} backgroundBlurriness={0} />
      ) : (
        <>
          <Sky sunPosition={lightPos} turbidity={6} rayleigh={1.5} />
          <hemisphereLight args={["#cfe0f5", "#6e6a5e", 0.9]} />
        </>
      )}
      <ambientLight intensity={hasHdri ? 0.15 : 0.3} />
      <directionalLight
        position={lightPos}
        intensity={3.2 * daylight}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
    </>
  );
}
