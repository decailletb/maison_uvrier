/// <reference types="vite/client" />
/**
 * Site root the app is served from: "/" in dev, "/maison_uvrier/" on GitHub Pages
 * (`BASE_PATH` at build time, see vite.config.ts). Falls back to "/" outside Vite
 * (tsx scripts import the catalogue too, hence the explicit Vite types).
 */
export const BASE_URL: string = import.meta.env?.BASE_URL ?? "/";

/** Absolute URL of a file served from the site root (`hdri/x.hdr` -> `/maison_uvrier/hdri/x.hdr`). */
export function siteUrl(path: string): string {
  return BASE_URL + path.replace(/^\//, "");
}
