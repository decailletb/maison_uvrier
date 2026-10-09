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
  url: string;
  license: string;
  source: string;
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
  for (const entry of entries) {
    const target = resolve("assets", entry.file);
    if (existsSync(target)) continue;
    console.log(`fetching ${entry.id} from ${entry.url}`);
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error(`${entry.id}: HTTP ${res.status}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    fetched++;
  }
  console.log(`${fetched} asset(s) fetched, ${entries.length - fetched} already present`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
