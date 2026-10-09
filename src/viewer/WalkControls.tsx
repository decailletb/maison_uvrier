/**
 * First-person walk: pointer lock for the look direction, WASD / arrows to move in
 * the horizontal plane at a fixed eye height. No collision yet.
 */
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

const SPEED = 2.2; // m/s
const FORWARD = new Set(["KeyW", "ArrowUp"]);
const BACK = new Set(["KeyS", "ArrowDown"]);
const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);

export function WalkControls({ eyeHeight }: { eyeHeight: number }) {
  const keys = useRef(new Set<string>());
  const get = useThree((s) => s.get);
  const forward = useRef(new Vector3());
  const side = useRef(new Vector3());

  useEffect(() => {
    get().camera.position.y = eyeHeight;
    const down = (e: KeyboardEvent) => keys.current.add(e.code);
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [get, eyeHeight]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const k = keys.current;
    let dz = 0;
    let dx = 0;
    for (const code of k) {
      if (FORWARD.has(code)) dz += 1;
      if (BACK.has(code)) dz -= 1;
      if (RIGHT.has(code)) dx += 1;
      if (LEFT.has(code)) dx -= 1;
    }
    if (!dz && !dx) return;
    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    side.current.crossVectors(forward.current, camera.up).normalize();
    const step = SPEED * delta;
    camera.position.addScaledVector(forward.current, dz * step);
    camera.position.addScaledVector(side.current, dx * step);
    camera.position.y = eyeHeight;
  });

  return <PointerLockControls makeDefault />;
}
