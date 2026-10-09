/** Right-hand editor panel (French): scene files, add items, selection, room finishes. */
import { useEffect, useMemo, useState } from "react";
import { findAssets, manifest } from "@/catalogue/manifest";
import { materialsOfKind } from "@/catalogue/materials";
import { PROCEDURAL_KINDS, type ProceduralKind } from "@/catalogue/procedural";
import { polygonCentroid } from "@/data/geometry";
import { house, levelById } from "@/data/house";
import type { LevelId } from "@/data/schema";
import type { LevelMode } from "./presets";
import { exportPng } from "./exportPng";
import { useEditor } from "./store";

const KIND_LABELS: Record<ProceduralKind, string> = {
  bed: "Lit",
  nightstand: "Table de nuit",
  wardrobe: "Armoire",
  dresser: "Commode",
  table: "Table",
  chair: "Chaise",
  sofa: "Canapé",
  coffeeTable: "Table basse",
  shelf: "Étagère",
  desk: "Bureau",
  kitchenBlock: "Bloc cuisine",
  rug: "Tapis",
  lamp: "Lampadaire",
};

const panel: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  width: 280,
  maxHeight: "calc(100% - 24px)",
  overflowY: "auto",
  background: "rgba(20, 24, 28, 0.86)",
  color: "#eee",
  padding: "10px 12px",
  borderRadius: 6,
  fontSize: 12,
  display: "grid",
  gap: 8,
};
const row: React.CSSProperties = { display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" };
const h: React.CSSProperties = { fontWeight: 600, marginTop: 4, borderTop: "1px solid #444", paddingTop: 6 };
const num: React.CSSProperties = { width: 56 };

export function EditorPanel({ levelMode, roomId }: { levelMode: LevelMode; roomId?: string }) {
  const s = useEditor();
  const [kind, setKind] = useState<string>("bed");
  const [saveAs, setSaveAs] = useState("");
  const level: LevelId = levelMode === "all" ? "rez" : levelMode;
  const [chosenRoom, setRoom] = useState<string | null>(null);
  const rooms = useMemo(() => levelById(level).rooms, [level]);
  // Preset room first, then the user's choice when it belongs to the level, else the first room.
  const room = chosenRoom && rooms.some((r) => r.id === chosenRoom) ? chosenRoom : (roomId ?? rooms[0].id);
  const selected = s.scene.items.find((it) => it.id === s.selectedId);

  useEffect(() => {
    void s.refreshScenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const models = manifest.assets.filter((a) => a.category !== "hdri" && !a.category.startsWith("material"));

  const add = () => {
    const target = rooms.find((r) => r.id === room) ?? rooms[0];
    const c = polygonCentroid(target.polygon);
    const isModel = kind.startsWith("model:");
    s.addItem({
      asset: isModel ? kind.slice(6) : { procedural: kind as ProceduralKind, params: {} },
      levelId: level,
      roomId: target.id,
      position: [Math.round(c[0]), Math.round(c[1]), 0],
      rotationY: 0,
      scale: 1,
    });
  };

  const setPos = (axis: 0 | 1, value: number) => {
    if (!selected) return;
    const position: [number, number, number] = [...selected.position];
    position[axis] = value;
    s.updateItem(selected.id, { position });
  };

  const procedural = selected && typeof selected.asset !== "string" ? selected.asset : null;
  const finishes = s.scene.roomFinishes[room] ?? {};

  return (
    <div style={panel} data-testid="editor-panel">
      <div style={{ fontWeight: 600 }}>
        Scène « {s.sceneName} »{s.dirty ? " *" : ""}
      </div>
      <div style={row}>
        <select data-testid="scene-select" value="" onChange={(e) => e.target.value && void s.loadScene(e.target.value)}>
          <option value="">Charger…</option>
          {s.availableScenes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button onClick={() => void s.saveScene()} data-testid="save">
          Enregistrer
        </button>
        <button onClick={() => exportPng(s.sceneName)}>Exporter PNG</button>
      </div>
      <div style={row}>
        <input placeholder="nouveau-nom" value={saveAs} onChange={(e) => setSaveAs(e.target.value)} data-testid="save-as-name" style={{ width: 120 }} />
        <button onClick={() => saveAs && void s.saveScene(saveAs)} data-testid="save-as">
          Enregistrer sous
        </button>
        <button onClick={() => s.newScene(saveAs || "nouvelle")}>Nouvelle</button>
      </div>
      <div style={row}>
        <button onClick={s.undo} disabled={!s.past.length}>
          Annuler
        </button>
        <button onClick={s.redo} disabled={!s.future.length}>
          Rétablir
        </button>
        <span style={{ opacity: 0.7 }}>{s.status}</span>
      </div>

      <div style={h}>Ajouter</div>
      <div style={row}>
        <select value={room} onChange={(e) => setRoom(e.target.value)} data-testid="room-select">
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div style={row}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} data-testid="kind-select">
          <optgroup label="Paramétrique">
            {PROCEDURAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Modèles (catalogue)">
            {models.map((m) => (
              <option key={m.id} value={`model:${m.id}`}>
                {m.id} ({m.category})
              </option>
            ))}
          </optgroup>
        </select>
        <button onClick={add} data-testid="add-item">
          Ajouter
        </button>
      </div>

      <div style={h}>Sélection</div>
      {selected ? (
        <>
          <div style={{ opacity: 0.8 }} data-testid="selected-id">
            {selected.id} · {selected.roomId}
          </div>
          <div style={row}>
            x <input type="number" style={num} value={selected.position[0]} onChange={(e) => setPos(0, Number(e.target.value))} data-testid="pos-x" />
            y <input type="number" style={num} value={selected.position[1]} onChange={(e) => setPos(1, Number(e.target.value))} data-testid="pos-y" />
            rot{" "}
            <input
              type="number"
              style={num}
              value={selected.rotationY}
              onChange={(e) => s.updateItem(selected.id, { rotationY: Number(e.target.value) })}
              data-testid="rot"
            />
          </div>
          <div style={row}>
            <button onClick={() => s.updateItem(selected.id, { rotationY: (selected.rotationY + 15) % 360 })}>+15°</button>
            <button onClick={() => s.updateItem(selected.id, { rotationY: (selected.rotationY - 15 + 360) % 360 })}>−15°</button>
            <button onClick={() => s.duplicateItem(selected.id)}>Dupliquer</button>
            <button onClick={() => s.removeItem(selected.id)} data-testid="delete-item">
              Supprimer
            </button>
          </div>
          {procedural && (
            <div style={row}>
              matière{" "}
              <select
                value={selected.materialOverrides?.material ?? procedural.params.material ?? ""}
                onChange={(e) => s.updateItem(selected.id, { materialOverrides: { ...selected.materialOverrides, material: e.target.value } })}
              >
                <option value="">(défaut)</option>
                {[...materialsOfKind("fabric"), ...materialsOfKind("wood"), ...materialsOfKind("stone")].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              accent{" "}
              <select
                value={selected.materialOverrides?.accent ?? procedural.params.accent ?? ""}
                onChange={(e) => s.updateItem(selected.id, { materialOverrides: { ...selected.materialOverrides, accent: e.target.value } })}
              >
                <option value="">(défaut)</option>
                {[...materialsOfKind("wood"), ...materialsOfKind("metal"), ...materialsOfKind("stone")].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {typeof selected.asset === "string" && (
            <div style={{ opacity: 0.7 }}>
              Modèle {selected.asset} ({findAssets(manifest.assets.find((a) => a.id === selected.asset)?.category ?? "decor").length} dans cette catégorie)
            </div>
          )}
        </>
      ) : (
        <div style={{ opacity: 0.6 }}>Cliquer un meuble pour le sélectionner, le glisser pour le déplacer. Suppr, Ctrl+Z, Ctrl+Y, R (rotation).</div>
      )}

      <div style={h}>Finitions de la pièce ({rooms.find((r) => r.id === room)?.name})</div>
      {(["floor", "wall", "ceiling"] as const).map((kindKey) => (
        <div style={row} key={kindKey}>
          {kindKey === "floor" ? "sol" : kindKey === "wall" ? "murs" : "plafond"}{" "}
          <select
            value={finishes[kindKey] ?? ""}
            onChange={(e) => s.setRoomFinish(room, kindKey, e.target.value || undefined)}
            data-testid={`finish-${kindKey}`}
          >
            <option value="">(plan)</option>
            {materialsOfKind(kindKey === "ceiling" ? "ceiling" : kindKey).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
            {kindKey === "ceiling" && materialsOfKind("wall").map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div style={{ opacity: 0.5 }}>{house.levels.length} niveaux · {s.scene.items.length} objets</div>
    </div>
  );
}
