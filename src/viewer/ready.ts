/**
 * Readiness flag for Playwright: set once the first frames of the full scene have
 * been drawn. Screenshot scripts wait on `window.__sceneReady === true`.
 */
declare global {
  interface Window {
    __sceneReady?: boolean;
  }
}

export function markSceneReady(): void {
  window.__sceneReady = true;
}

export function resetSceneReady(): void {
  window.__sceneReady = false;
}
