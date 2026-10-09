/**
 * Downloads every entry of assets/manifest.json that is missing on disk.
 * Binary assets are git-ignored; this script makes `assets/` reproducible.
 * Usage: npm run assets:fetch [-- <id> ...]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

interface ManifestEntry {
  id: string;
  file: string;
  /** Every file of a multi-file glTF, relative to assets/. */
  files?: string[];
  url: string;
  license: string;
  source: string;
}

/** Relative path of a file inside its asset folder (`models/<id>/textures/x.jpg` -> `textures/x.jpg`). */
function relativeInAsset(file: string): string {
  const parts = file.split("/");
  return parts.slice(2).join("/");
}

/**
 * URLs of every file of a Poly Haven glTF, from the API include map of the
 * resolution named in the entry URL (`.../gltf/1k/<id>/<id>_1k.gltf`).
 */
async function polyhavenFileUrls(entry: ManifestEntry): Promise<Map<string, string>> {
  const m = entry.url.match(/\/gltf\/(\w+)\/([^/]+)\//);
  const urls = new Map<string, string>();
  if (!m) return urls;
  const [, res, id] = m;
  const api = (await (await fetch(`https://api.polyhaven.com/files/${id}`)).json()) as {
    gltf?: Record<string, { gltf?: { url: string; include?: Record<string, { url: string }> } }>;
  };
  const gltf = api.gltf?.[res]?.gltf;
  if (!gltf) return urls;
  urls.set(entry.file, gltf.url);
  for (const [rel, info] of Object.entries(gltf.include ?? {})) urls.set(rel, info.url);
  return urls;
}

async function fileUrl(entry: ManifestEntry, file: string, cache: Map<string, Map<string, string>>): Promise<string> {
  if (file === entry.file) return entry.url;
  if (entry.source === "polyhaven") {
    if (!cache.has(entry.id)) cache.set(entry.id, await polyhavenFileUrls(entry));
    const url = cache.get(entry.id)!.get(relativeInAsset(file));
    if (url) return url;
  }
  const base = entry.url.slice(0, entry.url.lastIndexOf("/") + 1);
  return base + relativeInAsset(file);
}

interface Manifest {
  assets: ManifestEntry[];
}

async function main() {
  const manifestPath = resolve("assets/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  const wanted = new Set(process.argv.slice(2));
  const entries = manifest.assets.filter((a) => !wanted.size || wanted.has(a.id));

  let fetched = 0;
  const cache = new Map<string, Map<string, string>>();
  for (const entry of entries) {
    for (const file of entry.files ?? [entry.file]) {
      const target = resolve("assets", file);
      if (existsSync(target)) continue;
      const url = await fileUrl(entry, file, cache);
      console.log(`fetching ${entry.id}: ${file} from ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${entry.id}: HTTP ${res.status} for ${url}`);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      fetched++;
    }
  }
  console.log(`${fetched} asset(s) fetched, ${entries.length - fetched} already present`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
