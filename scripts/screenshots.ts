/**
 * Writes one PNG per camera preset to playwright/screenshots/<preset>.png.
 * Usage: npm run screenshots [-- overview top]   (no args = all presets)
 * Requires the dev server on http://localhost:5173 (started automatically if absent).
 */
import { chromium } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { CAMERA_PRESETS } from "../src/viewer/presets";

const BASE = process.env.VIEWER_URL ?? "http://localhost:5173";
const OUT = resolve("playwright/screenshots");

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE);
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<ChildProcess> {
  const child = spawn("npm run dev", { shell: true, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    if (await serverUp()) return child;
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`dev server did not answer on ${BASE}`);
}

async function main() {
  const wanted = process.argv.slice(2);
  const presets = wanted.length ? CAMERA_PRESETS.filter((p) => wanted.includes(p.name)) : CAMERA_PRESETS;
  if (!presets.length) throw new Error(`no preset matches ${wanted.join(", ")}`);

  mkdirSync(OUT, { recursive: true });
  const ownServer = (await serverUp()) ? null : await startServer();
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    for (const p of presets) {
      await page.goto(`${BASE}/?preset=${p.name}`);
      await page.waitForFunction(() => (window as Window & { __sceneReady?: boolean }).__sceneReady === true, null, { timeout: 30_000 });
      await page.waitForTimeout(300);
      const file = resolve(OUT, `${p.name}.png`);
      await page.screenshot({ path: file });
      console.log(`${p.name} -> ${file}`);
    }
  } finally {
    await browser.close();
    ownServer?.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
