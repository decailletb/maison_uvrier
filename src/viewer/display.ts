/**
 * Display settings shared by the panel and the 3D scene: interior lights and render
 * quality. `?lights=1` switches the lamps on, `?quality=low` drops the post-processing.
 */
import { create } from "zustand";

export type RenderQuality = "high" | "low";

interface DisplayState {
  lightsOn: boolean;
  quality: RenderQuality;
  setLightsOn: (on: boolean) => void;
  setQuality: (q: RenderQuality) => void;
}

function initial(): Pick<DisplayState, "lightsOn" | "quality"> {
  const q = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  return { lightsOn: q.get("lights") === "1", quality: q.get("quality") === "low" ? "low" : "high" };
}

export const useDisplay = create<DisplayState>((set) => ({
  ...initial(),
  setLightsOn: (lightsOn) => set({ lightsOn }),
  setQuality: (quality) => set({ quality }),
}));
