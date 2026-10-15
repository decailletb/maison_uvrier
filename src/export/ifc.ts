/**
 * IFC4 export of the house data for Archicad (or any BIM tool): storeys, walls with
 * their openings, doors and windows, floor and roof slabs, stairs, shell elements
 * (terrasse, couvert, balcon, acrotère) and one IfcSpace per room, which Archicad turns
 * into zones. Pure: returns the STEP text. Plan cm in, IFC millimetres out; plan x and
 * y map to IFC x and y (north = top of the plan sheet, see DECISIONS.md).
 */
import { polygonAreaM2, polylineLength } from "@/data/geometry";
import type { House, Level, Opening, Point, Wall } from "@/data/schema";
import { layoutLevels } from "@/scene/layout";
import { etageShell, LEVELS, rezShell, roofShell, type Shell, type ShellBox, type ShellSlab } from "@/scene/shell";
import { stairSteps } from "@/scene/stairs";

const MM_PER_CM = 10;
const mm = (cm: number) => cm * MM_PER_CM;

export interface IfcExportOptions {
  /** File name written in the STEP header. */
  fileName?: string;
  /** ISO timestamp of the header; defaults to now. */
  timestamp?: string;
}

type Ref = `#${number}`;

// ---------------------------------------------------------------- STEP encoding

/** STEP string literal: quotes doubled, backslashes escaped, non-ASCII as \X2\ hex. */
export function stepString(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (ch === "'") out += "''";
    else if (ch === "\\") out += "\\\\";
    else if (code >= 0x20 && code < 0x7f) out += ch;
    else if (code <= 0xffff) out += `\\X2\\${code.toString(16).toUpperCase().padStart(4, "0")}\\X0\\`;
    else out += `\\X4\\${code.toString(16).toUpperCase().padStart(8, "0")}\\X0\\`;
  }
  return `'${out}'`;
}

/** STEP real: always carries a decimal point, rounded to 1e-4. */
export function stepReal(n: number): string {
  const r = Math.round(n * 1e4) / 1e4;
  if (Object.is(r, -0) || r === 0) return "0.";
  return Number.isInteger(r) ? `${r}.` : String(r);
}

const IFC_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";

/** 128-bit non-cryptographic hash (cyrb128), enough to give every key a distinct id. */
function hash128(key: string): bigint {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < key.length; i++) {
    const k = key.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1, h2, h3, h4].reduce((acc, h) => (acc << 32n) | BigInt(h >>> 0), 0n);
}

/** Deterministic 22-character IFC GlobalId from a stable key, so re-exports keep ids. */
export function ifcGuid(key: string): string {
  let n = hash128(key);
  const chars: string[] = [];
  for (let i = 0; i < 22; i++) {
    chars.unshift(IFC_CHARS[Number(n & 63n)]);
    n >>= 6n;
  }
  return chars.join("");
}

const str = (s: string | undefined) => (s === undefined ? "$" : stepString(s));
const list = (items: readonly string[]) => `(${items.join(",")})`;

class StepWriter {
  private readonly lines: string[] = [];

  add(entity: string): Ref {
    this.lines.push(entity);
    const ref: Ref = `#${this.lines.length}`;
    return ref;
  }

  data(): string {
    return this.lines.map((l, i) => `#${i + 1}=${l};`).join("\n");
  }
}

// ---------------------------------------------------------------- model writer

const OPENING_NAMES: Record<Opening["kind"], string> = {
  door: "Porte",
  window: "Fenêtre",
  slidingDoor: "Porte coulissante",
  frenchWindow: "Porte-fenêtre",
  passage: "Passage",
};

const LEVEL_CODES: Record<Level["id"], string> = { "sous-sol": "SS", rez: "R", etage: "E" };

type PropValue = { type: "label" | "text" | "identifier"; value: string } | { type: "bool"; value: boolean } | { type: "area" | "length" | "real"; value: number } | { type: "integer"; value: number };

class IfcModel {
  readonly w = new StepWriter();
  private ownerHistory!: Ref;
  private bodyCtx!: Ref;
  private axisCtx!: Ref;
  private readonly origin: Ref;
  private readonly zAxis: Ref;
  private readonly materials = new Map<string, Ref[]>();

  constructor() {
    this.origin = this.point([0, 0, 0]);
    this.zAxis = this.dir([0, 0, 1]);
  }

  // Geometry primitives ---------------------------------------------------------

  point(p: readonly number[]): Ref {
    return this.w.add(`IFCCARTESIANPOINT(${list(p.map(stepReal))})`);
  }

  dir(d: readonly number[]): Ref {
    return this.w.add(`IFCDIRECTION(${list(d.map(stepReal))})`);
  }

  placement3d(at: readonly [number, number, number], xDir?: readonly [number, number]): Ref {
    const loc = at[0] === 0 && at[1] === 0 && at[2] === 0 ? this.origin : this.point(at);
    const ref = xDir ? this.dir([xDir[0], xDir[1], 0]) : "$";
    return this.w.add(`IFCAXIS2PLACEMENT3D(${loc},${xDir ? this.zAxis : "$"},${ref})`);
  }

  local(relTo: Ref | undefined, at: readonly [number, number, number], xDir?: readonly [number, number]): Ref {
    return this.w.add(`IFCLOCALPLACEMENT(${relTo ?? "$"},${this.placement3d(at, xDir)})`);
  }

  polyline(points: readonly Point[], closed: boolean): Ref {
    const pts = points.map((p) => this.point([mm(p[0]), mm(p[1])]));
    if (closed) pts.push(pts[0]);
    return this.w.add(`IFCPOLYLINE(${list(pts)})`);
  }

  /** Rectangle profile of size x × y (mm) centred on `centre` (mm), rotated to `xDir`. */
  rectProfile(centre: readonly [number, number], x: number, y: number, xDir?: readonly [number, number]): Ref {
    const pos = this.w.add(`IFCAXIS2PLACEMENT2D(${this.point(centre)},${xDir ? this.dir(xDir) : "$"})`);
    return this.w.add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${pos},${stepReal(x)},${stepReal(y)})`);
  }

  polygonProfile(outer: readonly Point[], holes: readonly Point[][] = []): Ref {
    const o = this.polyline(outer, true);
    if (!holes.length) return this.w.add(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,${o})`);
    const inner = holes.map((h) => this.polyline(h, true));
    return this.w.add(`IFCARBITRARYPROFILEDEFWITHVOIDS(.AREA.,$,${o},${list(inner)})`);
  }

  /** Vertical extrusion of a profile from height `z` (mm) over `depth` (mm). */
  extrude(profile: Ref, z: number, depth: number): Ref {
    const pos = z === 0 ? this.w.add(`IFCAXIS2PLACEMENT3D(${this.origin},$,$)`) : this.placement3d([0, 0, z]);
    return this.w.add(`IFCEXTRUDEDAREASOLID(${profile},${pos},${this.zAxis},${stepReal(depth)})`);
  }

  shape(bodyItems: readonly Ref[], axis?: Ref): Ref {
    // Body first: some importers take the first representation as the 3D shape.
    const reps: Ref[] = [this.w.add(`IFCSHAPEREPRESENTATION(${this.bodyCtx},'Body','SweptSolid',${list(bodyItems)})`)];
    if (axis) reps.push(this.w.add(`IFCSHAPEREPRESENTATION(${this.axisCtx},'Axis','Curve2D',(${axis}))`));
    return this.w.add(`IFCPRODUCTDEFINITIONSHAPE($,$,${list(reps)})`);
  }

  // Root entities -----------------------------------------------------------------

  /** GlobalId and owner history, the first two attributes of every IfcRoot. */
  root(key: string): string {
    return `'${ifcGuid(key)}',${this.ownerHistory}`;
  }

  header(timestamp: string): { project: Ref } {
    const w = this.w;
    const org = w.add(`IFCORGANIZATION($,'Maison Uvrier',$,$,$)`);
    const person = w.add(`IFCPERSON($,'Maison Uvrier',$,$,$,$,$,$)`);
    const pao = w.add(`IFCPERSONANDORGANIZATION(${person},${org},$)`);
    const app = w.add(`IFCAPPLICATION(${org},'0.1.0','maison-uvrier export-ifc','maison-uvrier')`);
    const created = Math.floor(Date.parse(timestamp) / 1000);
    this.ownerHistory = w.add(`IFCOWNERHISTORY(${pao},${app},$,.NOCHANGE.,$,$,$,${created})`);

    const units = [
      w.add(`IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)`),
      w.add(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`),
      w.add(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`),
      w.add(`IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`),
    ];
    const unitAssignment = w.add(`IFCUNITASSIGNMENT(${list(units)})`);
    // North assumed at the top of the plan sheet (DECISIONS.md).
    const north = this.w.add(`IFCDIRECTION((0.,1.))`);
    const world = w.add(`IFCAXIS2PLACEMENT3D(${this.origin},$,$)`);
    const ctx = w.add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${world},${north})`);
    this.bodyCtx = w.add(`IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${ctx},$,.MODEL_VIEW.,$)`);
    this.axisCtx = w.add(`IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Axis','Model',*,*,*,*,${ctx},$,.GRAPH_VIEW.,$)`);
    const project = w.add(
      `IFCPROJECT(${this.root("project")},'Maison Uvrier',${str("Modèle établi d'après les plans scannés (Plans.pdf) ; cotes estimées signalées dans le jeu de propriétés LACAPELA.")},$,$,$,(${ctx}),${unitAssignment})`,
    );
    return { project };
  }

  aggregate(key: string, parent: Ref, children: readonly Ref[]) {
    if (children.length) this.w.add(`IFCRELAGGREGATES(${this.root(`agg:${key}`)},$,$,${parent},${list(children)})`);
  }

  contain(key: string, storey: Ref, elements: readonly Ref[]) {
    if (elements.length) this.w.add(`IFCRELCONTAINEDINSPATIALSTRUCTURE(${this.root(`contain:${key}`)},$,$,${list(elements)},${storey})`);
  }

  propertySet(key: string, name: string, objects: readonly Ref[], props: Record<string, PropValue | undefined>) {
    const refs: Ref[] = [];
    for (const [prop, v] of Object.entries(props)) {
      if (!v) continue;
      let value: string;
      switch (v.type) {
        case "label":
          value = `IFCLABEL(${str(v.value)})`;
          break;
        case "text":
          value = `IFCTEXT(${str(v.value)})`;
          break;
        case "identifier":
          value = `IFCIDENTIFIER(${str(v.value)})`;
          break;
        case "bool":
          value = `IFCBOOLEAN(${v.value ? ".T." : ".F."})`;
          break;
        case "area":
          value = `IFCAREAMEASURE(${stepReal(v.value)})`;
          break;
        case "length":
          value = `IFCLENGTHMEASURE(${stepReal(v.value)})`;
          break;
        case "real":
          value = `IFCREAL(${stepReal(v.value)})`;
          break;
        case "integer":
          value = `IFCINTEGER(${Math.round(v.value)})`;
          break;
      }
      refs.push(this.w.add(`IFCPROPERTYSINGLEVALUE(${str(prop)},$,${value},$)`));
    }
    if (!refs.length) return;
    const pset = this.w.add(`IFCPROPERTYSET(${this.root(`pset:${name}:${key}`)},${str(name)},$,${list(refs)})`);
    this.w.add(`IFCRELDEFINESBYPROPERTIES(${this.root(`defpset:${name}:${key}`)},$,$,${list(objects)},${pset})`);
  }

  /** Records a material assignment, written once per material at the end. */
  material(name: string, element: Ref) {
    const refs = this.materials.get(name) ?? [];
    refs.push(element);
    this.materials.set(name, refs);
  }

  writeMaterials() {
    for (const [name, elements] of this.materials) {
      const mat = this.w.add(`IFCMATERIAL(${str(name)},$,$)`);
      this.w.add(`IFCRELASSOCIATESMATERIAL(${this.root(`mat:${name}`)},$,$,${list(elements)},${mat})`);
    }
  }
}

// ---------------------------------------------------------------- house elements

const SOURCE_PSET = "LACAPELA";

function sourceProps(item: { estimated?: boolean; note?: string }, planPage?: number): Record<string, PropValue | undefined> {
  return {
    "Page du plan": planPage ? { type: "integer", value: planPage } : undefined,
    "Cote estimée": { type: "bool", value: item.estimated ?? false },
    Note: item.note ? { type: "text", value: item.note } : undefined,
  };
}

interface WallSegment {
  id: string;
  a: Point;
  b: Point;
  /** Distance of `a` along the whole polyline, cm. */
  start: number;
  length: number;
}

function wallSegments(wall: Wall): WallSegment[] {
  const segs: WallSegment[] = [];
  let start = 0;
  for (let i = 0; i < wall.points.length - 1; i++) {
    const a = wall.points[i];
    const b = wall.points[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ id: wall.points.length > 2 ? `${wall.id}-${i + 1}` : wall.id, a, b, start, length });
    start += length;
  }
  return segs;
}

function writeWall(m: IfcModel, level: Level, storeyPlacement: Ref, wall: Wall): Ref[] {
  const elements: Ref[] = [];
  const height = mm(wall.height ?? level.clearHeight);
  const t = mm(wall.thickness);
  const total = polylineLength(wall.points);
  for (const seg of wallSegments(wall)) {
    const L = mm(seg.length);
    const dx = (seg.b[0] - seg.a[0]) / seg.length;
    const dy = (seg.b[1] - seg.a[1]) / seg.length;
    const key = `${level.id}:${seg.id}`;
    const placement = m.local(storeyPlacement, [mm(seg.a[0]), mm(seg.a[1]), 0], [dx, dy]);
    const axis = m.w.add(`IFCPOLYLINE((${m.point([0, 0])},${m.point([L, 0])}))`);
    const body = m.extrude(m.rectProfile([L / 2, 0], L, t), 0, height);
    const type = wall.structural ? ".SOLIDWALL." : ".PARTITIONING.";
    const ifcWall = m.w.add(`IFCWALL(${m.root(`wall:${key}`)},${str(seg.id)},${str(wall.note)},$,${placement},${m.shape([body], axis)},${str(seg.id)},${type})`);
    elements.push(ifcWall);
    m.propertySet(key, "Pset_WallCommon", [ifcWall], {
      IsExternal: { type: "bool", value: wall.exterior },
      LoadBearing: { type: "bool", value: wall.structural },
    });
    m.propertySet(key, SOURCE_PSET, [ifcWall], { ...sourceProps(wall, level.planPage), "Épaisseur": { type: "length", value: t } });
    m.material(wall.exterior ? "Béton armé (façade)" : wall.structural ? "Béton armé" : "Cloison maçonnée", ifcWall);

    const isLast = seg.start + seg.length >= total - 1e-6;
    for (const op of level.openings) {
      if (op.wallId !== wall.id) continue;
      const inSeg = op.offset >= seg.start && (op.offset < seg.start + seg.length || isLast);
      if (inSeg) elements.push(...writeOpening(m, level, ifcWall, placement, op, op.offset - seg.start, t, wall.exterior));
    }
  }
  return elements;
}

/** Opening element voiding the wall, plus its door or window (fillers are returned for containment). */
function writeOpening(m: IfcModel, level: Level, wall: Ref, wallPlacement: Ref, op: Opening, offset: number, t: number, exterior: boolean): Ref[] {
  const key = `${level.id}:${op.id}`;
  const w = mm(op.width);
  const h = mm(op.height);
  const name = `${OPENING_NAMES[op.kind]}${op.ref ? ` ${op.ref}` : ""}`;
  const placement = m.local(wallPlacement, [mm(offset), 0, mm(op.sill ?? 0)]);
  const voidBody = m.extrude(m.rectProfile([w / 2, 0], w, t + 200), 0, h);
  const opening = m.w.add(`IFCOPENINGELEMENT(${m.root(`opening:${key}`)},${str(`Ouverture ${op.id}`)},$,$,${placement},${m.shape([voidBody])},$,.OPENING.)`);
  m.w.add(`IFCRELVOIDSELEMENT(${m.root(`voids:${key}`)},$,$,${wall},${opening})`);
  if (op.kind === "passage") return [];

  const isDoor = op.kind === "door" || op.kind === "slidingDoor";
  const panel = isDoor ? 50 : 80;
  const fillerPlacement = m.local(placement, [0, 0, 0]);
  const fillerBody = m.extrude(m.rectProfile([w / 2, 0], w, panel), 0, h);
  const shape = m.shape([fillerBody]);
  let filler: Ref;
  if (isDoor) {
    const operation =
      op.kind === "slidingDoor" || op.swing === "sliding" ? ".SLIDING_TO_LEFT." : op.swing === "left" ? ".SINGLE_SWING_LEFT." : op.swing === "right" ? ".SINGLE_SWING_RIGHT." : ".NOTDEFINED.";
    filler = m.w.add(`IFCDOOR(${m.root(`filler:${key}`)},${str(name)},${str(op.note)},$,${fillerPlacement},${shape},${str(op.ref ?? op.id)},${stepReal(h)},${stepReal(w)},.DOOR.,${operation},$)`);
    m.propertySet(key, "Pset_DoorCommon", [filler], { IsExternal: { type: "bool", value: exterior }, Reference: op.ref ? { type: "identifier", value: op.ref } : undefined });
  } else {
    filler = m.w.add(`IFCWINDOW(${m.root(`filler:${key}`)},${str(name)},${str(op.note)},$,${fillerPlacement},${shape},${str(op.ref ?? op.id)},${stepReal(h)},${stepReal(w)},.WINDOW.,.SINGLE_PANEL.,$)`);
    m.propertySet(key, "Pset_WindowCommon", [filler], { IsExternal: { type: "bool", value: exterior }, Reference: op.ref ? { type: "identifier", value: op.ref } : undefined });
  }
  m.w.add(`IFCRELFILLSELEMENT(${m.root(`fills:${key}`)},$,$,${opening},${filler})`);
  m.propertySet(key, SOURCE_PSET, [filler], {
    ...sourceProps(op, level.planPage),
    "Allège": { type: "length", value: mm(op.sill ?? 0) },
  });
  m.material(isDoor ? "Menuiserie bois" : "Menuiserie métal-verre", filler);
  return [filler];
}

function writeSlab(m: IfcModel, storeyPlacement: Ref, storeyElevation: number, s: ShellSlab, type: string, name: string, holes: Point[][] = []): Ref {
  const placement = m.local(storeyPlacement, [0, 0, 0]);
  const body = m.extrude(m.polygonProfile(s.polygon, holes), mm(s.bottom - storeyElevation), mm(s.top - s.bottom));
  const slab = m.w.add(`IFCSLAB(${m.root(`slab:${s.id}`)},${str(name)},$,$,${placement},${m.shape([body])},${str(s.id)},${type})`);
  m.propertySet(s.id, "Pset_SlabCommon", [slab], {
    IsExternal: { type: "bool", value: type === ".ROOF." || s.id.startsWith("terrasse") || s.id.startsWith("couvert") || s.id.startsWith("balcon") },
  });
  m.material(s.material === "gravel" ? "Béton armé (toiture gravier)" : s.material === "asphalt" ? "Enrobé" : "Béton armé", slab);
  return slab;
}

const SHELL_SLAB_NAMES: Record<string, [string, string]> = {
  "terrasse-slab": [".FLOOR.", "Dalle terrasse"],
  "couvert-slab": [".FLOOR.", "Dalle couvert"],
  "couvert-roof": [".ROOF.", "Toiture couvert"],
  "balcon-slab": [".FLOOR.", "Dalle balcon"],
  "balcon-cover": [".ROOF.", "Avant-toit balcon"],
  "roof-slab": [".ROOF.", "Toiture plate"],
};

function writeBox(m: IfcModel, storeyPlacement: Ref, storeyElevation: number, b: ShellBox): Ref {
  const placement = m.local(storeyPlacement, [0, 0, 0]);
  const body = m.extrude(m.rectProfile([mm(b.centre[0]), mm(b.centre[1])], mm(b.size[0]), mm(b.size[1])), mm(b.bottom - storeyElevation), mm(b.top - b.bottom));
  const shape = m.shape([body]);
  const head = `${m.root(`box:${b.id}`)},${str(b.id)},$,$,${placement},${shape},${str(b.id)}`;
  let el: Ref;
  if (b.id.startsWith("acrotere")) el = m.w.add(`IFCWALL(${head},.PARAPET.)`);
  else if (b.id.startsWith("couvert-post")) el = m.w.add(`IFCCOLUMN(${head},.COLUMN.)`);
  else if (b.id.startsWith("handrail")) el = m.w.add(`IFCRAILING(${head},.HANDRAIL.)`);
  else el = m.w.add(`IFCRAILING(${head},.GUARDRAIL.)`);
  m.material(b.material === "glass" ? "Verre" : b.material === "metal" ? "Métal" : b.material === "render" ? "Béton armé (façade)" : "Béton armé", el);
  return el;
}

function writeShell(m: IfcModel, storeyPlacement: Ref, elevation: number, shell: Shell): Ref[] {
  return [
    ...shell.slabs.map((s) => {
      const [type, name] = SHELL_SLAB_NAMES[s.id] ?? [".FLOOR.", s.id];
      return writeSlab(m, storeyPlacement, elevation, s, type, name);
    }),
    ...shell.boxes.map((b) => writeBox(m, storeyPlacement, elevation, b)),
  ];
}

function writeSpaces(m: IfcModel, level: Level, storeyPlacement: Ref): Ref[] {
  return level.rooms.map((room, i) => {
    const key = `${level.id}:${room.id}`;
    const exterior = ["terrasse", "couvert", "balcon"].includes(room.id);
    const placement = m.local(storeyPlacement, [0, 0, 0]);
    const body = m.extrude(m.polygonProfile(room.polygon), 0, mm(level.clearHeight));
    const number = `${LEVEL_CODES[level.id]}.${String(i + 1).padStart(2, "0")}`;
    const space = m.w.add(
      `IFCSPACE(${m.root(`space:${key}`)},${str(number)},${str(room.note)},$,${placement},${m.shape([body])},${str(room.name)},.ELEMENT.,${exterior ? ".EXTERNAL." : ".INTERNAL."},$)`,
    );
    m.propertySet(key, "Pset_SpaceCommon", [space], { IsExternal: { type: "bool", value: exterior }, Reference: { type: "identifier", value: room.id } });
    const area = polygonAreaM2(room.polygon);
    const qArea = m.w.add(`IFCQUANTITYAREA('NetFloorArea',$,$,${stepReal(area)},$)`);
    const qHeight = m.w.add(`IFCQUANTITYLENGTH('Height',$,$,${stepReal(mm(level.clearHeight))},$)`);
    const qto = m.w.add(`IFCELEMENTQUANTITY(${m.root(`qto:${key}`)},'Qto_SpaceBaseQuantities',$,$,(${qArea},${qHeight}))`);
    m.w.add(`IFCRELDEFINESBYPROPERTIES(${m.root(`defqto:${key}`)},$,$,(${space}),${qto})`);
    m.propertySet(key, SOURCE_PSET, [space], {
      ...sourceProps(room, level.planPage),
      "Surface imprimée (m²)": room.printedArea ? { type: "area", value: room.printedArea } : undefined,
      "Surface du modèle (m²)": { type: "area", value: Math.round(area * 100) / 100 },
      "Revêtement sol": room.floorFinish ? { type: "label", value: room.floorFinish } : undefined,
      "Revêtement murs": room.wallFinish ? { type: "label", value: room.wallFinish } : undefined,
      "Revêtement plafond": room.ceilingFinish ? { type: "label", value: room.ceilingFinish } : undefined,
    });
    return space;
  });
}

function writeStairs(m: IfcModel, level: Level, storeyPlacement: Ref, rise: number): Ref[] {
  return level.stairs
    .filter((s) => s.direction === "up")
    .map((stair) => {
      const key = `${level.id}:${stair.id}`;
      const placement = m.local(storeyPlacement, [0, 0, 0]);
      const steps = stairSteps(stair, rise).map((step) => m.extrude(m.polygonProfile(step.polygon), mm(step.bottom), mm(step.top - step.bottom)));
      const type = stair.halfTurn ? ".HALF_TURN_STAIR." : ".STRAIGHT_RUN_STAIR.";
      const el = m.w.add(`IFCSTAIR(${m.root(`stair:${key}`)},${str(`Escalier vers ${stair.toLevel}`)},${str(stair.note)},$,${placement},${m.shape(steps)},${str(stair.id)},${type})`);
      m.propertySet(key, SOURCE_PSET, [el], { ...sourceProps(stair, level.planPage), Marches: { type: "integer", value: steps.length } });
      m.material("Béton armé", el);
      return el;
    });
}

/** Full IFC4 STEP file of the house. */
export function houseToIfc(house: House, options: IfcExportOptions = {}): string {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const fileName = options.fileName ?? "villa-lacapela.ifc";
  const m = new IfcModel();
  const { project } = m.header(timestamp);

  const sitePlacement = m.local(undefined, [0, 0, 0]);
  // Rez ±0.00 = 497.72 m above sea level (plans p. 6-9).
  const site = m.w.add(`IFCSITE(${m.root("site")},'Uvrier',$,$,${sitePlacement},$,$,.ELEMENT.,$,$,497720.,$,$)`);
  const buildingPlacement = m.local(sitePlacement, [0, 0, 0]);
  const building = m.w.add(`IFCBUILDING(${m.root("building")},${str(house.name)},${str("Villa jumelle, Uvrier (VS)")},$,${buildingPlacement},$,$,.ELEMENT.,0.,$,$)`);
  m.aggregate("project", project, [site]);
  m.aggregate("site", site, [building]);

  const storeys: Ref[] = [];
  const layouts = layoutLevels(house.levels);
  for (const { level, slabBelow, riseAbove, stairHoles } of layouts) {
    const elevation = level.floorLevel;
    const placement = m.local(buildingPlacement, [0, 0, mm(elevation)]);
    const storey = m.w.add(`IFCBUILDINGSTOREY(${m.root(`storey:${level.id}`)},${str(level.name)},$,$,${placement},$,$,.ELEMENT.,${stepReal(mm(elevation))})`);
    storeys.push(storey);

    const elements: Ref[] = [];
    const floor: ShellSlab = {
      id: `floor-${level.id}`,
      polygon: [
        [0, 0],
        [house.footprint.width, 0],
        [house.footprint.width, house.footprint.depth],
        [0, house.footprint.depth],
      ],
      bottom: elevation - slabBelow,
      top: elevation,
      material: "concrete",
    };
    const lowest = level === layouts[0].level;
    elements.push(writeSlab(m, placement, elevation, floor, lowest ? ".BASESLAB." : ".FLOOR.", lowest ? "Radier" : `Dalle ${level.name}`, stairHoles));
    for (const wall of level.walls) elements.push(...writeWall(m, level, placement, wall));
    elements.push(...writeStairs(m, level, placement, riseAbove));
    if (level.id === "rez") elements.push(...writeShell(m, placement, elevation, rezShell(level)));
    if (level.id === "etage") elements.push(...writeShell(m, placement, elevation, etageShell(level)));
    m.contain(level.id, storey, elements);
    m.aggregate(`storey:${level.id}`, storey, writeSpaces(m, level, placement));
  }

  const roofPlacement = m.local(buildingPlacement, [0, 0, mm(LEVELS.roofBottom)]);
  const roof = m.w.add(`IFCBUILDINGSTOREY(${m.root("storey:toiture")},'TOITURE',$,$,${roofPlacement},$,$,.ELEMENT.,${stepReal(mm(LEVELS.roofBottom))})`);
  storeys.push(roof);
  m.contain("toiture", roof, writeShell(m, roofPlacement, LEVELS.roofBottom, roofShell()));
  m.aggregate("building", building, storeys);
  m.writeMaterials();

  const header = [
    "ISO-10303-21;",
    "HEADER;",
    "FILE_DESCRIPTION(('ViewDefinition [DesignTransferView_V1.0]'),'2;1');",
    `FILE_NAME(${stepString(fileName)},'${timestamp.slice(0, 19)}',('Maison Uvrier'),('Maison Uvrier'),'maison-uvrier export-ifc','maison-uvrier','');`,
    "FILE_SCHEMA(('IFC4'));",
    "ENDSEC;",
    "DATA;",
  ];
  return [...header, m.w.data(), "ENDSEC;", "END-ISO-10303-21;", ""].join("\n");
}
