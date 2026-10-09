/**
 * Dev-only API so the viewer reads and writes `scenes/<name>.json` directly:
 *   GET /api/scenes            -> ["base", ...]
 *   GET /api/scenes/<name>     -> scene JSON
 *   PUT /api/scenes/<name>     -> writes the body (validated as JSON) to scenes/<name>.json
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

const DIR = resolve("scenes");
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function scenesPlugin(): Plugin {
  return {
    name: "maison-uvrier-scenes",
    configureServer(server) {
      server.middlewares.use("/api/scenes", (req, res) => {
        const name = (req.url ?? "/").replace(/^\//, "").split("?")[0];
        res.setHeader("Content-Type", "application/json");
        if (!name) {
          mkdirSync(DIR, { recursive: true });
          const names = readdirSync(DIR)
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(/\.json$/, ""));
          res.end(JSON.stringify(names));
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
