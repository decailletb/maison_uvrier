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
import { layoutRoom, type LayoutItem, type Occupied } from "../src/deco/layout";
import { decorType, matchFurniture, matchSurface } from "../src/deco/match";
import { parseProposal, type Proposal, type ProposalFurniture } from "../src/deco/proposal";
import { assetById, type Category } from "../src/catalogue/manifest";
import { proceduralParts, type ProceduralKind } from "../src/catalogue/procedural";
import { parseScene, type Scene, type SceneItem } from "../src/scene/sceneFile";

const BEDROOM = new Set(["bed", "nightstand", "wardrobe", "dresser", "desk", "lamp", "rug", "shelf", "chair", "decor", "plant"]);
const LIVING = new Set(["sofa", "armchair", "coffeeTable", "table", "chair", "shelf", "lamp", "rug", "kitchen", "decor", "plant"]);

/** Height of the bottom edge of frames and other wall decor above the floor, cm. */
const WALL_DECOR_BOTTOM = 115;

/**
 * Functional furniture of the base scene kept in the room unless the proposal brings
 * its own (an inspiration image of a salon says nothing about the kitchen or the
 * dining table); decorative pieces are always replaced.
 */
const KEEP_UNLESS_PROPOSED = new Set<string>(["kitchen", "appliance", "bathroomFixture", "table", "chair", "desk", "wardrobe"]);

const KIND_CATEGORY: Partial<Record<ProceduralKind, Category>> = { kitchenBlock: "kitchen", pouf: "decor" };

function categoryOf(item: SceneItem): Category | undefined {
  if (typeof item.asset === "string") return assetById(item.asset)?.category;
  return KIND_CATEGORY[item.asset.procedural] ?? (item.asset.procedural as Category);
}

function footprintOf(item: SceneItem): Occupied {
  const size =
    typeof item.asset === "string"
      ? (assetById(item.asset)?.dimensionsCm ?? { w: 100, d: 100 })
      : proceduralParts(item.asset.procedural, { ...item.asset.params, ...item.materialOverrides }).size;
  return { position: [item.position[0], item.position[1]], w: size.w, d: size.d, rotationDeg: item.rotationY };
}

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
  // Item ids must be kebab-case (scene schema) and unique when a category repeats;
  // decor is named after its type (pouf, cadre).
  const slugOf = (f: ProposalFurniture) => decorType(f) ?? f.category.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const perSlug = new Map<string, number>();
  for (const f of entries) perSlug.set(slugOf(f), (perSlug.get(slugOf(f)) ?? 0) + f.count);
  const seen = new Map<string, number>();
  const elevation = new Map<string, number>();
  for (const f of entries) {
    for (let n = 0; n < f.count; n++) {
      const slug = slugOf(f);
      const index = (seen.get(slug) ?? 0) + 1;
      seen.set(slug, index);
      const key = `${slug}${perSlug.get(slug)! > 1 ? `-${index}` : ""}`;
      if (f.category === "lamp" && /ceiling|plafond|suspension|pendant|pendentif/i.test(`${f.placementHint} ${f.material}`)) {
        log.push(`- ${roomId} : suspension ignorée (luminaires de plafond non modélisés)`);
        continue;
      }
      const match = matchFurniture(f, n);
      if (match.kind === "none") {
        log.push(`- ${roomId} : ${f.category} ignoré (${match.reason})`);
        continue;
      }
      let w: number;
      let d: number;
      let h: number;
      let asset: SceneItem["asset"];
      if (match.kind === "asset") {
        w = match.entry.dimensionsCm?.w ?? 100;
        d = match.entry.dimensionsCm?.d ?? 100;
        h = match.entry.dimensionsCm?.h ?? 100;
        asset = match.entry.id;
        log.push(`- ${roomId} : ${f.category} → modèle ${match.entry.id}`);
      } else {
        const size = proceduralParts(match.procedural, match.params).size;
        w = size.w;
        d = size.d;
        h = size.h;
        asset = { procedural: match.procedural, params: match.params };
        log.push(`- ${roomId} : ${f.category} → forme paramétrique ${match.procedural} (${match.params.material})`);
      }
      const wall = decorType(f) === "cadre";
      if (wall) elevation.set(key, WALL_DECOR_BOTTOM);
      layoutItems.push({ key, category: f.category, w, d, h, hint: f.placementHint, wall });
      pending.push({
        key,
        item: { id: `${roomId}-${key}`, asset, levelId: level.id, roomId, position: [0, 0, 0], rotationY: 0, scale: 1 },
      });
    }
  }
  const proposed = new Set<string>(entries.map((f) => f.category));
  const kept = scene.items.filter((it) => {
    if (it.roomId !== roomId) return false;
    const category = categoryOf(it);
    return category !== undefined && KEEP_UNLESS_PROPOSED.has(category) && !proposed.has(category);
  });
  if (kept.length) log.push(`- ${roomId} : conservés de la base : ${kept.map((it) => it.id).join(", ")}`);
  const { placed, unplaced } = layoutRoom(layoutItems, room, level, kept.map(footprintOf));
  for (const u of unplaced) log.push(`- ${roomId} : ${u.key} non placé (${u.reason})`);
  const items = pending
    .map(({ key, item }) => {
      const p = placed.find((x) => x.key === key);
      if (!p) return null;
      return { ...item, position: [Math.round(p.position[0]), Math.round(p.position[1]), elevation.get(key) ?? 0] as [number, number, number], rotationY: p.rotationDeg };
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
    items: [...scene.items.filter((it) => it.roomId !== roomId), ...kept, ...items],
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
  // Validate before writing: the viewer refuses an invalid scene without a visible error.
  scene = parseScene({ ...scene, name });
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
