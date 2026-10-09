/**
 * Applies a decoration proposal to one room (or every furnished room type in theme
 * mode) and writes a new scene file.
 *
 *   npm run deco:apply -- <proposal.json> <room-id|all> <theme> [--base scenes/base.json]
 *
 * Output: scenes/<room>-<theme>.json (or scenes/all-<theme>.json), a French report on
 * stdout and an entry appended to docs/deco-log.md.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { house } from "../src/data/house";
import type { Level, Room } from "../src/data/schema";
import { layoutRoom, type LayoutItem } from "../src/deco/layout";
import { matchFurniture, matchSurface } from "../src/deco/match";
import { parseProposal, type Proposal, type ProposalFurniture } from "../src/deco/proposal";
import { proceduralParts } from "../src/catalogue/procedural";
import { parseScene, type Scene, type SceneItem } from "../src/scene/sceneFile";

const BEDROOM = new Set(["bed", "nightstand", "wardrobe", "dresser", "desk", "lamp", "rug", "shelf", "chair", "decor", "plant"]);
const LIVING = new Set(["sofa", "armchair", "coffeeTable", "table", "chair", "shelf", "lamp", "rug", "kitchen", "decor", "plant"]);

function roomType(roomId: string): "chambre" | "sejour" | "other" {
  if (roomId.startsWith("chambre")) return "chambre";
  if (roomId.startsWith("sejour")) return "sejour";
  return "other";
}

function furnitureFor(proposal: Proposal, roomId: string): ProposalFurniture[] {
  const type = roomType(roomId);
  if (type === "chambre") return proposal.furniture.filter((f) => BEDROOM.has(f.category));
  if (type === "sejour") return proposal.furniture.filter((f) => LIVING.has(f.category));
  return [];
}

function findRoom(roomId: string): { level: Level; room: Room } {
  for (const level of house.levels) {
    const room = level.rooms.find((r) => r.id === roomId);
    if (room) return { level, room };
  }
  throw new Error(`pièce inconnue : ${roomId}`);
}

function applyToRoom(scene: Scene, proposal: Proposal, roomId: string, log: string[]): Scene {
  const { level, room } = findRoom(roomId);
  const entries = furnitureFor(proposal, roomId);
  const layoutItems: LayoutItem[] = [];
  const pending: { key: string; item: SceneItem }[] = [];
  for (const f of entries) {
    for (let n = 0; n < f.count; n++) {
      const match = matchFurniture(f);
      const key = `${f.category}${f.count > 1 ? `-${n + 1}` : ""}`;
      if (match.kind === "none") {
        log.push(`- ${roomId} : ${f.category} ignoré (${match.reason})`);
        continue;
      }
      let w: number;
      let d: number;
      let asset: SceneItem["asset"];
      if (match.kind === "asset") {
        w = match.entry.dimensionsCm?.w ?? 100;
        d = match.entry.dimensionsCm?.d ?? 100;
        asset = match.entry.id;
        log.push(`- ${roomId} : ${f.category} → modèle ${match.entry.id}`);
      } else {
        const size = proceduralParts(match.procedural, match.params).size;
        w = size.w;
        d = size.d;
        asset = { procedural: match.procedural, params: match.params };
        log.push(`- ${roomId} : ${f.category} → forme paramétrique ${match.procedural} (${match.params.material})`);
      }
      layoutItems.push({ key, category: f.category, w, d, hint: f.placementHint });
      pending.push({
        key,
        item: { id: `${roomId}-${key}`, asset, levelId: level.id, roomId, position: [0, 0, 0], rotationY: 0, scale: 1 },
      });
    }
  }
  const { placed, unplaced } = layoutRoom(layoutItems, room, level);
  for (const u of unplaced) log.push(`- ${roomId} : ${u.key} non placé (${u.reason})`);
  const items = pending
    .map(({ key, item }) => {
      const p = placed.find((x) => x.key === key);
      if (!p) return null;
      return { ...item, position: [Math.round(p.position[0]), Math.round(p.position[1]), 0] as [number, number, number], rotationY: p.rotationDeg };
    })
    .filter((x): x is SceneItem => x !== null);

  const finishes = {
    floor: matchSurface(proposal.surfaces.floor, "floor"),
    wall: matchSurface(proposal.surfaces.wall, "wall"),
    ceiling: matchSurface(proposal.surfaces.ceiling, "ceiling"),
  };
  log.push(`- ${roomId} : sol ${finishes.floor}, murs ${finishes.wall}, plafond ${finishes.ceiling}`);
  return {
    ...scene,
    roomFinishes: { ...scene.roomFinishes, [roomId]: finishes },
    items: [...scene.items.filter((it) => it.roomId !== roomId), ...items],
  };
}

function main() {
  const args = process.argv.slice(2);
  const baseFlag = args.indexOf("--base");
  const basePath = baseFlag >= 0 ? args.splice(baseFlag, 2)[1] : "scenes/base.json";
  const [proposalPath, target, theme] = args;
  if (!proposalPath || !target || !theme) {
    console.error("usage: npm run deco:apply -- <proposal.json> <room-id|all> <theme> [--base scenes/base.json]");
    process.exit(1);
  }
  const proposal = parseProposal(JSON.parse(readFileSync(resolve(proposalPath), "utf8")));
  const base = existsSync(resolve(basePath)) ? parseScene(JSON.parse(readFileSync(resolve(basePath), "utf8"))) : { version: 1 as const, name: "base", roomFinishes: {}, items: [] };
  const rooms =
    target === "all"
      ? house.levels.flatMap((l) => l.rooms.filter((r) => roomType(r.id) !== "other").map((r) => r.id))
      : [target];
  const log: string[] = [];
  let scene: Scene = { ...base, base: basePath.replace(/^scenes\//, "").replace(/\.json$/, "") };
  for (const roomId of rooms) scene = applyToRoom(scene, proposal, roomId, log);
  const name = `${target}-${theme}`;
  scene = { ...scene, name };
  mkdirSync(resolve("scenes"), { recursive: true });
  const outFile = resolve("scenes", `${name}.json`);
  writeFileSync(outFile, JSON.stringify(scene, null, 2) + "\n");

  const report = [
    `## ${new Date().toISOString().slice(0, 16).replace("T", " ")} — ${target} ← ${proposal.source} (thème « ${theme} »)`,
    "",
    `Style : ${proposal.styleSummary}`,
    `Palette : ${proposal.palette.map((p) => p.hex).join(", ")}`,
    `Scène écrite : scenes/${name}.json (base : ${scene.base})`,
    "",
    ...log,
    "",
  ].join("\n");
  console.log(report);
  appendFileSync(resolve("docs/deco-log.md"), (existsSync(resolve("docs/deco-log.md")) ? "" : "# Journal /deco\n\n") + report + "\n");
}

main();
