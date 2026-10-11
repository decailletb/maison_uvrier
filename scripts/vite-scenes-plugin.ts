/**
 * Dev-only API so the viewer reads and writes `scenes/<name>.json` directly:
 *   GET /api/scenes            -> ["base", ...]
 *   GET /api/scenes/<name>     -> scene JSON
 *   PUT /api/scenes/<name>     -> writes the body (validated as JSON) to scenes/<name>.json
 * The build copies scenes/*.json to dist/scenes/ with an index.json listing them, so the
 * static site (GitHub Pages) loads the same scenes read-only.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const DIR = resolve("scenes");
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function sceneNames(): string[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function scenesPlugin(): Plugin {
  return {
    name: "maison-uvrier-scenes",
    generateBundle() {
      const names = sceneNames();
      for (const name of names) {
        this.emitFile({ type: "asset", fileName: `scenes/${name}.json`, source: readFileSync(resolve(DIR, `${name}.json`), "utf8") });
      }
      this.emitFile({ type: "asset", fileName: "scenes/index.json", source: JSON.stringify(names) });
    },
    configureServer(server) {
      server.middlewares.use("/api/scenes", (req, res) => {
        const name = (req.url ?? "/").replace(/^\//, "").split("?")[0];
        res.setHeader("Content-Type", "application/json");
        if (!name) {
          res.end(JSON.stringify(sceneNames()));
          return;
        }
        if (!NAME.test(name)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "invalid scene name" }));
          return;
        }
        const file = resolve(DIR, `${name}.json`);
        if (req.method === "GET") {
          if (!existsSync(file)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "not found" }));
            return;
          }
          res.end(readFileSync(file, "utf8"));
          return;
        }
        if (req.method === "PUT") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const json = JSON.parse(body);
              mkdirSync(DIR, { recursive: true });
              writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
              res.end(JSON.stringify({ ok: true, file: `scenes/${name}.json` }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end(JSON.stringify({ error: "method not allowed" }));
      });
    },
  };
}
