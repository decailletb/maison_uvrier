import { useEffect, useMemo, useState } from "react";
import { house } from "@/data/house";
import { CAMERA_PRESETS, findPreset, presetFromSearch, type CameraPreset, type LevelMode } from "./presets";
import { publishPresets } from "./ready";
import { Viewer, type CameraMode } from "./Viewer";

const LEVEL_LABELS: Record<LevelMode, string> = {
  "sous-sol": "Sous-sol",
  rez: "Rez-de-chaussée",
  etage: "Étage",
  all: "Tous les niveaux",
};

const panel: React.CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  background: "rgba(20, 24, 28, 0.82)",
  color: "#eee",
  padding: "10px 12px",
  borderRadius: 6,
  fontSize: 13,
  display: "grid",
  gap: 6,
  minWidth: 240,
};

export function App() {
  const initial = useMemo(() => presetFromSearch(window.location.search), []);
  const [preset, setPreset] = useState<CameraPreset>(initial);
  const [levelMode, setLevelMode] = useState<LevelMode>(initial.level);
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [showLabels, setShowLabels] = useState(true);
  // Remount the canvas when the camera must jump.
  const [epoch, setEpoch] = useState(0);

  useEffect(() => publishPresets(CAMERA_PRESETS.map((p) => p.name)), []);

  const choosePreset = (name: string) => {
    const next = findPreset(name);
    if (!next) return;
    setPreset(next);
    setLevelMode(next.level);
    setCameraMode("orbit");
    setEpoch((e) => e + 1);
  };

  const presetsByLevel = useMemo(() => {
    const groups: { label: string; presets: CameraPreset[] }[] = [
      { label: "Général", presets: CAMERA_PRESETS.filter((p) => p.level === "all") },
    ];
    for (const level of house.levels) {
      groups.push({ label: LEVEL_LABELS[level.id], presets: CAMERA_PRESETS.filter((p) => p.level === level.id) });
    }
    return groups;
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Viewer key={`${preset.name}-${cameraMode}-${epoch}`} preset={preset} levelMode={levelMode} cameraMode={cameraMode} showLabels={showLabels} />
      <div style={panel}>
        <div style={{ fontWeight: 600 }}>Villa F « LACAPELA »</div>
        <label>
          Vue{" "}
          <select value={preset.name} onChange={(e) => choosePreset(e.target.value)} data-testid="preset-select">
            {presetsByLevel.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.presets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Niveau{" "}
          <select value={levelMode} onChange={(e) => setLevelMode(e.target.value as LevelMode)} data-testid="level-select">
            {(Object.keys(LEVEL_LABELS) as LevelMode[]).map((id) => (
              <option key={id} value={id}>
                {LEVEL_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Caméra{" "}
          <select
            value={cameraMode}
            onChange={(e) => {
              setCameraMode(e.target.value as CameraMode);
              setEpoch((n) => n + 1);
            }}
            data-testid="camera-select"
          >
            <option value="orbit">Orbite (souris)</option>
            <option value="walk">Marche (clic, puis WASD / flèches, Échap pour sortir)</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} /> Noms des pièces
        </label>
      </div>
    </div>
  );
}
