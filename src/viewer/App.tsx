import { useMemo, useState } from "react";
import { CAMERA_PRESETS, findPreset, presetFromSearch, type CameraPreset } from "./presets";
import { Viewer } from "./Viewer";

export function App() {
  const initial = useMemo(() => presetFromSearch(window.location.search), []);
  const [preset, setPreset] = useState<CameraPreset>(initial);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* key forces a fresh camera when the preset changes */}
      <Viewer key={preset.name} preset={preset} />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(20, 24, 28, 0.8)",
          color: "#eee",
          padding: "8px 10px",
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Villa F « LACAPELA »</div>
        <label>
          Vue{" "}
          <select
            value={preset.name}
            onChange={(e) => setPreset(findPreset(e.target.value) ?? preset)}
            data-testid="preset-select"
          >
            {CAMERA_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
