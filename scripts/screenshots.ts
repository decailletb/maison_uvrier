/**
 * Writes one PNG per camera preset to playwright/screenshots/<preset>.png.
 * Usage: npm run screenshots [-- overview rez-top sejour-cuisine]   (no args = all presets)
 * Preset names come from the running app (`window.__presets`). Set VIEWER_SCENE=<name>
 * to load scenes/<name>.json in every shot, VIEWER_LABELS=0 to hide room labels.
 * Requires the dev server on http://localhost:5173 (started automatically if absent).
 */
import { chromium } from "@playwright/test";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

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

/** Kills the whole dev-server tree (shell + node) on both Windows and POSIX. */
function stopServer(child: ChildProcess | null): void {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    execSync(`taskkill /PID ${child.pid} /F /T`, { stdio: "ignore" });
  } else {
    child.kill();
  }
}

async function main() {
  const wanted = process.argv.slice(2);

  mkdirSync(OUT, { recursive: true });
  const ownServer = (await serverUp()) ? null : await startServer();
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(`${BASE}/`);
    await page.waitForFunction(() => (window as Window & { __presets?: string[] }).__presets !== undefined, null, { timeout: 30_000 });
    const available = (await page.evaluate(() => (window as Window & { __presets?: string[] }).__presets)) ?? [];
    const presets = wanted.length ? available.filter((n) => wanted.includes(n)) : available;
    if (!presets.length) throw new Error(`no preset matches ${wanted.join(", ")}; available: ${available.join(", ")}`);
    for (const name of presets) {
      const scene = process.env.VIEWER_SCENE ? `&scene=${process.env.VIEWER_SCENE}` : "";
      const labels = process.env.VIEWER_LABELS === "0" ? "&labels=0" : "";
      await page.goto(`${BASE}/?preset=${name}${scene}${labels}&ui=0`);
      await page.waitForFunction(() => (window as Window & { __sceneReady?: boolean }).__sceneReady === true, null, { timeout: 90_000 });
      await page.waitForTimeout(500);
      const file = resolve(OUT, `${name}.png`);
      await page.screenshot({ path: file, timeout: 90_000 });
      console.log(`${name} -> ${file}`);
    }
  } finally {
    await browser.close();
    stopServer(ownServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
