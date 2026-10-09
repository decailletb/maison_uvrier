/**
 * Globals for Playwright: `__sceneReady` is set once the first frames of the full
 * scene have been drawn; `__presets` lists the camera preset names so the screenshot
 * script does not have to import the app.
 */
declare global {
  interface Window {
    __sceneReady?: boolean;
    __presets?: string[];
  }
}

export function markSceneReady(): void {
  window.__sceneReady = true;
}

export function resetSceneReady(): void {
  window.__sceneReady = false;
}

export function publishPresets(names: string[]): void {
  window.__presets = names;
}
