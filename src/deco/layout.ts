/**
 * Places proposal furniture in a room from placement hints, without overlaps and
 * without blocking doors. Pure, plan cm. Items are tried in order; each gets its
 * first free candidate position, else it is reported as unplaced.
 */
import { boundingBox, pointAlong, pointInPolygon, polygonCentroid } from "@/data/geometry";
import type { Level, Point, Room } from "@/data/schema";
import { itemFootprint, snapToWall } from "@/scene/placement";
import { roomEntrance, roomGlazing } from "@/viewer/presets";

export interface LayoutItem {
  key: string;
  category: string;
  w: number;
  d: number;
  hint: string;
}

export interface Placed {
  key: string;
  position: Point;
  rotationDeg: number;
}

interface Box {
  min: Point;
  max: Point;
}

function bbox(points: readonly Point[]): Box {
  const { min, max } = boundingBox(points);
  return { min, max };
}

function overlaps(a: Box, b: Box, gap = 5): boolean {
  return a.min[0] < b.max[0] + gap && a.max[0] > b.min[0] - gap && a.min[1] < b.max[1] + gap && a.max[1] > b.min[1] - gap;
}

/** Squares of 90 cm inside the room in front of each door, kept free. */
function doorZones(room: Room, level: Level): Box[] {
  const zones: Box[] = [];
  const centroid = polygonCentroid(room.polygon);
  for (const o of level.openings) {
    if (o.kind !== "door" && o.kind !== "passage" && o.kind !== "frenchWindow") continue;
    const wall = level.walls.find((w) => w.id === o.wallId);
    if (!wall) continue;
    const mid = pointAlong(wall.points, o.offset + o.width / 2).point;
    const inside: Point = [mid[0] + (centroid[0] - mid[0]) * 0.001, mid[1] + (centroid[1] - mid[1]) * 0.001];
    if (!pointInPolygon(inside, room.polygon, wall.thickness / 2 + 6)) continue;
    const dir = [centroid[0] - mid[0], centroid[1] - mid[1]];
    const len = Math.hypot(dir[0], dir[1]) || 1;
    const c: Point = [mid[0] + (dir[0] / len) * 50, mid[1] + (dir[1] / len) * 50];
    zones.push({ min: [c[0] - 50, c[1] - 50], max: [c[0] + 50, c[1] + 50] });
  }
  return zones;
}

function fits(candidate: Placed, item: LayoutItem, room: Room, taken: Box[], doors: Box[]): Box | null {
  const fp = itemFootprint(candidate.position, item.w, item.d, candidate.rotationDeg);
  for (const p of fp) if (!pointInPolygon(p, room.polygon, 1)) return null;
  const box = bbox(fp);
  if (taken.some((t) => overlaps(box, t))) return null;
  if (doors.some((z) => overlaps(box, z, 0))) return null;
  return box;
}

/** Candidate centres along the room perimeter, every 30 cm, snapped against walls. */
function perimeterCandidates(room: Room, level: Level, item: LayoutItem): Placed[] {
  const out: Placed[] = [];
  const n = room.polygon.length;
  for (let i = 0; i < n; i++) {
    const a = room.polygon[i];
    const b = room.polygon[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = item.w / 2; t <= len - item.w / 2; t += 30) {
      const p: Point = [a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len];
      // Pull 10 cm inside, then let the wall snap set the rotation and distance.
      const c = polygonCentroid(room.polygon);
      const inward: Point = [p[0] + (c[0] - p[0]) * 0.02, p[1] + (c[1] - p[1]) * 0.02];
      const s = snapToWall(inward, 0, item.d, level.walls, 60);
      out.push({ key: item.key, position: s.snapped ? s.point : inward, rotationDeg: s.rotationDeg });
    }
  }
  return out;
}

const RELATIVE =
  /(beside|next to|à côté d[eu]|près d[eu]|devant|in front of|facing|face au|face à|autour d[eu]|around|sous|under|centr[ée]e? sur|cent(?:er|r)ed on)\s+(?:the |le |la |l'|les |de la |du )?([^,.;]+)/g;

/** Words naming a piece in a hint, most specific first, mapped to its layout key prefix. */
const REFERENCES: [RegExp, string][] = [
  [/^(table basse|coffee ?table)/, "coffee-table"],
  [/^(canapé|canape|sofa|couch)/, "sofa"],
  [/^(fauteuil|armchair)/, "armchair"],
  [/^(lit|bed)\b/, "bed"],
  [/^(table de nuit|nightstand)/, "nightstand"],
  [/^(bureau|desk)/, "desk"],
  [/^(table|dining table)/, "table"],
];

function hintCandidates(item: LayoutItem, room: Room, level: Level, placed: Map<string, Placed & { w: number; d: number }>): Placed[] {
  const hint = item.hint.toLowerCase();
  const centroid = polygonCentroid(room.polygon);
  const out: Placed[] = [];
  const entrance = roomEntrance(room, level).point;

  // Relative hints ("devant le canapé", "beside the bed"): the first phrase naming an
  // already placed piece wins.
  for (const relative of hint.matchAll(RELATIVE)) {
    const prefix = REFERENCES.find(([re]) => re.test(relative[2]))?.[1] ?? relative[2].match(/^[a-z-]+/)?.[0];
    const ref = prefix ? [...placed.values()].find((p) => p.key.startsWith(prefix)) : undefined;
    if (!ref) continue;
    const r = (ref.rotationDeg * Math.PI) / 180;
    const front: Point = [Math.sin(r), -Math.cos(r)];
    const side: Point = [Math.cos(r), Math.sin(r)];
    const mode = /devant|in front|facing|face/.test(relative[1]) ? "front" : /sous|under|centr/.test(relative[1]) ? "under" : /autour|around/.test(relative[1]) ? "around" : "beside";
    if (mode === "under") {
      // Centred on the piece, else slid along its width (near a wall), else turned a quarter.
      for (const rot of [ref.rotationDeg, (ref.rotationDeg + 90) % 360]) {
        for (const shift of [0, 20, -20, 40, -40, 60, -60, 80, -80, 100, -100]) {
          out.push({ key: item.key, position: [ref.position[0] + side[0] * shift, ref.position[1] + side[1] * shift], rotationDeg: rot });
        }
      }
    }
    if (mode === "front" || mode === "around") {
      const dist = ref.d / 2 + item.d / 2 + 40;
      for (const sign of [1, -1]) out.push({ key: item.key, position: [ref.position[0] + front[0] * dist * sign, ref.position[1] + front[1] * dist * sign], rotationDeg: (ref.rotationDeg + 180) % 360 });
    }
    if (mode === "beside" || mode === "around") {
      const dist = ref.w / 2 + item.w / 2 + (mode === "around" ? 25 : 10);
      for (const sign of [1, -1]) out.push({ key: item.key, position: [ref.position[0] + side[0] * dist * sign, ref.position[1] + side[1] * dist * sign], rotationDeg: ref.rotationDeg });
    }
    break;
  }
  if (/window|fenêtre|baie/.test(hint)) {
    const [g] = roomGlazing(room, level);
    if (g) {
      const s = snapToWall([g.mid[0] + (centroid[0] - g.mid[0]) * 0.1, g.mid[1] + (centroid[1] - g.mid[1]) * 0.1], 0, item.d, level.walls, 80);
      out.push({ key: item.key, position: s.point, rotationDeg: s.rotationDeg });
    }
  }
  // Cardinal walls: candidates snapped against the wall facing that direction. The
  // back of an item on the west wall faces west, so its front (rotation) faces east.
  const cardinal = hint.match(/(?:^|[^a-z])(north|nord|south|sud|east|est|west|ouest)(?:$|[^a-z])/);
  if (cardinal) {
    const wanted: Record<string, number> = { north: 0, nord: 0, south: 180, sud: 180, east: 270, est: 270, west: 90, ouest: 90 };
    const rot = wanted[cardinal[1]];
    out.push(...perimeterCandidates(room, level, item).filter((p) => Math.abs((((p.rotationDeg - rot) % 360) + 540) % 360 - 180) < 5));
  }
  if (/opposite|opposé|en face de la porte|headboard|tête de lit|far wall|mur du fond/.test(hint)) {
    // Wall farthest from the entrance: pick the perimeter candidate farthest from it.
    const far = perimeterCandidates(room, level, item).sort(
      (p, q) => Math.hypot(q.position[0] - entrance[0], q.position[1] - entrance[1]) - Math.hypot(p.position[0] - entrance[0], p.position[1] - entrance[1]),
    );
    out.push(...far.slice(0, 12));
  }
  if (/centr|center|milieu|middle|under the table|sous la table/.test(hint)) {
    out.push({ key: item.key, position: centroid, rotationDeg: 0 });
    for (const dx of [-60, 60]) for (const dy of [-60, 60]) out.push({ key: item.key, position: [centroid[0] + dx, centroid[1] + dy], rotationDeg: 0 });
  }
  if (/corner|coin|angle/.test(hint)) {
    // Convex corners only (the inner corner of an L-shaped room is open floor), the item
    // pushed in along both walls of the corner.
    const poly = room.polygon;
    const n = poly.length;
    const orientation = Math.sign(poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * p[1], 0));
    const off = Math.max(item.w, item.d) / 2 + 12;
    for (let i = 0; i < n; i++) {
      const [a, b, c] = [poly[(i + n - 1) % n], poly[i], poly[(i + 1) % n]];
      const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.sign(turn) !== orientation) continue;
      const la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      const lc = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
      const inward: Point = [(a[0] - b[0]) / la + (c[0] - b[0]) / lc, (a[1] - b[1]) / la + (c[1] - b[1]) / lc];
      out.push({ key: item.key, position: [b[0] + inward[0] * off, b[1] + inward[1] * off], rotationDeg: 0 });
    }
  }
  return out;
}

export function layoutRoom(items: LayoutItem[], room: Room, level: Level): { placed: Placed[]; unplaced: { key: string; reason: string }[] } {
  const taken: Box[] = [];
  const doors = doorZones(room, level);
  const placed: Placed[] = [];
  const unplaced: { key: string; reason: string }[] = [];
  const byKey = new Map<string, Placed & { w: number; d: number }>();
  for (const item of items) {
    const candidates = [...hintCandidates(item, room, level, byKey), ...perimeterCandidates(room, level, item)];
    // Rugs lie under other furniture: no overlap check for them.
    const isRug = item.category === "rug";
    let done = false;
    for (const c of candidates) {
      const box = isRug
        ? (() => {
            const fp = itemFootprint(c.position, item.w, item.d, c.rotationDeg);
            return fp.every((p) => pointInPolygon(p, room.polygon, 1)) ? bbox(fp) : null;
          })()
        : fits(c, item, room, taken, doors);
      if (!box) continue;
      if (!isRug) taken.push(box);
      placed.push(c);
      byKey.set(item.key, { ...c, w: item.w, d: item.d });
      done = true;
      break;
    }
    if (!done) unplaced.push({ key: item.key, reason: "aucune position libre" });
  }
  return { placed, unplaced };
}
