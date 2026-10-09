/**
 * Named camera presets. Positions and targets in metres (scene units).
 * Playwright selects one with `?preset=<name>`; the viewer UI lists them.
 */
export interface CameraPreset {
  name: string;
  /** French label shown in the UI. */
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  { name: "overview", label: "Vue d'ensemble", position: [14, 10, 14], target: [5.3, 1.5, 3.6] },
  { name: "top", label: "Vue de dessus", position: [5.3, 25, 3.7], target: [5.3, 0, 3.6] },
];

export const DEFAULT_PRESET = CAMERA_PRESETS[0];

export function findPreset(name: string | null | undefined): CameraPreset | undefined {
  if (!name) return undefined;
  return CAMERA_PRESETS.find((p) => p.name === name);
}

/** Reads `?preset=<name>` from a query string; falls back to the default preset. */
export function presetFromSearch(search: string): CameraPreset {
  const name = new URLSearchParams(search).get("preset");
  return findPreset(name) ?? DEFAULT_PRESET;
}
