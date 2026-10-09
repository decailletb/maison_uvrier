/**
 * Editor state: the scene (single source of truth, mirrored to scenes/<name>.json),
 * selection, undo / redo snapshots and persistence through the dev API.
 */
import { create } from "zustand";
import { EMPTY_SCENE, newItemId, parseScene, type Scene, type SceneItem } from "@/scene/sceneFile";

const HISTORY = 50;

interface EditorState {
  scene: Scene;
  sceneName: string;
  dirty: boolean;
  selectedId: string | null;
  past: Scene[];
  future: Scene[];
  availableScenes: string[];
  status: string;

  select: (id: string | null) => void;
  /** Applies a change to the scene with an undo snapshot. */
  commit: (update: (scene: Scene) => Scene) => void;
  updateItem: (id: string, patch: Partial<SceneItem>) => void;
  addItem: (item: Omit<SceneItem, "id">) => string;
  duplicateItem: (id: string) => void;
  removeItem: (id: string) => void;
  setRoomFinish: (roomId: string, kind: "floor" | "wall" | "ceiling", material: string | undefined) => void;
  undo: () => void;
  redo: () => void;
  loadScene: (name: string) => Promise<void>;
  saveScene: (name?: string) => Promise<void>;
  refreshScenes: () => Promise<void>;
  newScene: (name: string) => void;
}

export const useEditor = create<EditorState>((set, get) => ({
  scene: EMPTY_SCENE,
  sceneName: "vide",
  dirty: false,
  selectedId: null,
  past: [],
  future: [],
  availableScenes: [],
  status: "",

  select: (id) => set({ selectedId: id }),

  commit: (update) =>
    set((s) => ({
      scene: update(s.scene),
      past: [...s.past.slice(-HISTORY + 1), s.scene],
      future: [],
      dirty: true,
    })),

  updateItem: (id, patch) =>
    get().commit((scene) => ({ ...scene, items: scene.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),

  addItem: (item) => {
    const id = newItemId(typeof item.asset === "string" ? item.asset : item.asset.procedural);
    get().commit((scene) => ({ ...scene, items: [...scene.items, { ...item, id }] }));
    set({ selectedId: id });
    return id;
  },

  duplicateItem: (id) => {
    const src = get().scene.items.find((it) => it.id === id);
    if (!src) return;
    get().addItem({ ...src, position: [src.position[0] + 60, src.position[1], src.position[2]] });
  },

  removeItem: (id) => {
    get().commit((scene) => ({ ...scene, items: scene.items.filter((it) => it.id !== id) }));
    if (get().selectedId === id) set({ selectedId: null });
  },

  setRoomFinish: (roomId, kind, material) =>
    get().commit((scene) => ({
      ...scene,
      roomFinishes: { ...scene.roomFinishes, [roomId]: { ...scene.roomFinishes[roomId], [kind]: material } },
    })),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return { scene: prev, past: s.past.slice(0, -1), future: [s.scene, ...s.future], dirty: true };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return { scene: next, future: s.future.slice(1), past: [...s.past, s.scene], dirty: true };
    }),

  loadScene: async (name) => {
    try {
      const res = await fetch(`/api/scenes/${name}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const scene = parseScene(await res.json());
      set({ scene, sceneName: name, dirty: false, past: [], future: [], selectedId: null, status: `Scène « ${name} » chargée` });
    } catch (err) {
      set({ status: `Chargement impossible : ${String(err)}` });
    }
  },

  saveScene: async (name) => {
    const target = name ?? get().sceneName;
    const scene = { ...get().scene, name: target };
    try {
      const res = await fetch(`/api/scenes/${target}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scene) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set({ scene, sceneName: target, dirty: false, status: `Enregistré dans scenes/${target}.json` });
      await get().refreshScenes();
    } catch (err) {
      set({ status: `Enregistrement impossible : ${String(err)}` });
    }
  },

  refreshScenes: async () => {
    try {
      const res = await fetch("/api/scenes");
      if (res.ok) set({ availableScenes: (await res.json()) as string[] });
    } catch {
      // Production build: no dev API, saving is export-only.
    }
  },

  newScene: (name) => set({ scene: { ...EMPTY_SCENE, name }, sceneName: name, dirty: false, past: [], future: [], selectedId: null }),
}));
