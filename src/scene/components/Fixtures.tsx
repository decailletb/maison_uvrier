/**
 * Ceiling lamps of a level (see `fixtures.ts`): the fixture bodies hang under the
 * ceilings (drawn only with them), and when the lights are on each fixture group adds a
 * warm point light without shadows and an emissive glow that the bloom pass picks up.
 */
import { useMemo } from "react";
import { DoubleSide } from "three";
import type { Level, Point } from "@/data/schema";
import { useDisplay } from "@/viewer/display";
import { fixtureIntensity, levelFixtures, type Fixture } from "../fixtures";
import { CM, planToScene } from "../units";

const WARM = "#ffdcb0";

function Glow({ on, strength = 2.5, color = "#fff1dc" }: { on: boolean; strength?: number; color?: string }) {
  return <meshStandardMaterial color="#f7f5f0" roughness={0.6} emissive={color} emissiveIntensity={on ? strength : 0.05} />;
}

function FixtureBody({ f, ceiling, on }: { f: Fixture; ceiling: number; on: boolean }) {
  const r = (f.size / 2) * CM;
  switch (f.kind) {
    case "disc":
      return (
        <mesh position={planToScene(f.at, ceiling - 3)}>
          <cylinderGeometry args={[r, r * 0.92, 6 * CM, 40]} />
          <Glow on={on} />
        </mesh>
      );
    case "spot":
      return (
        <mesh position={planToScene(f.at, ceiling - 0.5)}>
          <cylinderGeometry args={[r, r, 1 * CM, 20]} />
          <Glow on={on} strength={4} />
        </mesh>
      );
    case "skylight":
      return (
        <group position={planToScene(f.at, ceiling)}>
          {/* Coupole 60 × 60: a lit square recess in the ceiling. */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[f.size * CM, 4 * CM, f.size * CM]} />
            <meshStandardMaterial color="#ffffff" emissive="#eef3ff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
    case "pendantWoven":
      return (
        <group position={planToScene(f.at, ceiling)}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.6, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <cylinderGeometry args={[r * 0.75, r, 0.24, 24, 1, true]} />
            <meshStandardMaterial color="#2b2a28" roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <sphereGeometry args={[0.04, 12, 8]} />
            <Glow on={on} strength={6} color={WARM} />
          </mesh>
        </group>
      );
    case "pendantFeather":
      return (
        <group position={planToScene(f.at, ceiling)}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <mesh position={[0, -0.5 - r, 0]}>
            <sphereGeometry args={[r, 24, 16]} />
            <meshStandardMaterial color="#f2ead8" roughness={1} emissive={WARM} emissiveIntensity={on ? 0.6 : 0} />
          </mesh>
        </group>
      );
  }
}

/** Light position: under the fixture, or the centre of a group of spots. */
function lightPoint(f: Fixture, all: readonly Fixture[]): Point {
  if (f.kind !== "spot") return f.at;
  const group = all.filter((g) => g.roomId === f.roomId && g.kind === "spot");
  return [group.reduce((s, g) => s + g.at[0], 0) / group.length, group.reduce((s, g) => s + g.at[1], 0) / group.length];
}

export function Fixtures({ level, showBodies }: { level: Level; showBodies: boolean }) {
  const fixtures = useMemo(() => levelFixtures(level), [level]);
  const on = useDisplay((s) => s.lightsOn);
  const ceiling = level.floorLevel + level.clearHeight;
  return (
    <group name={`fixtures-${level.id}`}>
      {showBodies && (
        <group position={[0, level.floorLevel * CM, 0]}>
          {fixtures.map((f) => (
            <FixtureBody key={f.id} f={f} ceiling={level.clearHeight} on={on} />
          ))}
        </group>
      )}
      {on &&
        fixtures
          .filter((f) => f.light)
          .map((f) => {
            const drop = f.kind === "pendantWoven" || f.kind === "pendantFeather" ? 80 : 30;
            return (
              <pointLight
                key={`light-${f.id}`}
                position={planToScene(lightPoint(f, fixtures), -drop, ceiling)}
                color={WARM}
                intensity={fixtureIntensity(f.kind)}
                distance={0}
                decay={2}
              />
            );
          })}
    </group>
  );
}
