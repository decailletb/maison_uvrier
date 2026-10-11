/**
 * Parametric furniture as lists of boxes, in cm, centred on the floor: x across
 * (width), y up (height), z front-to-back (depth, +z toward the front). Pure data; the
 * `Procedural` component renders it with the material library.
 */
export const PROCEDURAL_KINDS = [
  "bed",
  "nightstand",
  "wardrobe",
  "dresser",
  "table",
  "chair",
  "sofa",
  "coffeeTable",
  "shelf",
  "desk",
  "kitchenBlock",
  "rug",
  "lamp",
  "pouf",
  "plant",
] as const;
export type ProceduralKind = (typeof PROCEDURAL_KINDS)[number];

export interface Part {
  /** Centre position in cm. */
  pos: [number, number, number];
  /** Size in cm (w, h, d). */
  size: [number, number, number];
  material: string;
  /** Rounded edges for upholstery, cylinder for round pieces; box by default. */
  shape?: "rounded" | "cylinder";
}

export interface ProceduralParams {
  w?: number;
  d?: number;
  h?: number;
  /** Main material id (fabric, wood, ...). */
  material?: string;
  /** Secondary material id (legs, frame, top). */
  accent?: string;
}

export interface ProceduralResult {
  size: { w: number; d: number; h: number };
  parts: Part[];
}

export const PROCEDURAL_DEFAULTS: Record<ProceduralKind, { w: number; d: number; h: number; material: string; accent: string }> = {
  bed: { w: 160, d: 200, h: 95, material: "fabric-white", accent: "wood-oak" },
  nightstand: { w: 45, d: 40, h: 50, material: "wood-oak", accent: "metal-black" },
  wardrobe: { w: 200, d: 60, h: 220, material: "wood-white", accent: "metal-steel" },
  dresser: { w: 120, d: 45, h: 85, material: "wood-white", accent: "metal-steel" },
  table: { w: 180, d: 90, h: 75, material: "wood-oak", accent: "wood-oak" },
  chair: { w: 45, d: 50, h: 85, material: "wood-white", accent: "metal-black" },
  sofa: { w: 220, d: 95, h: 85, material: "fabric-navy", accent: "metal-black" },
  coffeeTable: { w: 90, d: 90, h: 40, material: "wood-white", accent: "metal-black" },
  shelf: { w: 120, d: 35, h: 180, material: "wood-white", accent: "wood-white" },
  desk: { w: 140, d: 70, h: 75, material: "wood-oak", accent: "metal-black" },
  kitchenBlock: { w: 300, d: 62, h: 90, material: "wood-white", accent: "stone-black" },
  rug: { w: 200, d: 150, h: 1.5, material: "fabric-grey", accent: "fabric-grey" },
  lamp: { w: 40, d: 40, h: 150, material: "fabric-beige", accent: "metal-black" },
  pouf: { w: 55, d: 55, h: 40, material: "fabric-beige", accent: "fabric-beige" },
  plant: { w: 60, d: 60, h: 150, material: "fabric-green", accent: "stone-terracotta" },
};

function box(x: number, y: number, z: number, w: number, h: number, d: number, material: string): Part {
  return { pos: [x, y, z], size: [w, h, d], material };
}

function soft(x: number, y: number, z: number, w: number, h: number, d: number, material: string): Part {
  return { ...box(x, y, z, w, h, d, material), shape: "rounded" };
}

function legs(w: number, d: number, h: number, t: number, material: string, inset = 4): Part[] {
  const x = w / 2 - inset - t / 2;
  const z = d / 2 - inset - t / 2;
  return [
    box(-x, h / 2, -z, t, h, t, material),
    box(x, h / 2, -z, t, h, t, material),
    box(-x, h / 2, z, t, h, t, material),
    box(x, h / 2, z, t, h, t, material),
  ];
}

export function proceduralParts(kind: ProceduralKind, params: ProceduralParams): ProceduralResult {
  const def = PROCEDURAL_DEFAULTS[kind];
  const w = params.w ?? def.w;
  const d = params.d ?? def.d;
  const h = params.h ?? def.h;
  const m = params.material ?? def.material;
  const a = params.accent ?? def.accent;
  const parts: Part[] = [];
  switch (kind) {
    case "bed": {
      const frameH = 25;
      parts.push(box(0, frameH / 2, 0, w, frameH, d, a));
      parts.push(soft(0, frameH + 11, 0, w - 8, 22, d - 8, m));
      parts.push(box(0, h / 2, -d / 2 + 3, w, h, 6, a)); // headboard at the back
      parts.push(soft(-w / 4, frameH + 26, -d / 2 + 35, w / 2 - 12, 10, 40, "fabric-white"));
      parts.push(soft(w / 4, frameH + 26, -d / 2 + 35, w / 2 - 12, 10, 40, "fabric-white"));
      break;
    }
    case "nightstand":
    case "dresser":
      parts.push(box(0, (h + 4) / 2, 0, w, h - 4, d - 1, m));
      parts.push(...legs(w, d, 4, 3, a, 2));
      parts.push(box(0, h * 0.7, d / 2 - 0.5, w * 0.3, 1.5, 1, a));
      break;
    case "wardrobe":
      parts.push(box(0, h / 2, 0, w, h, d - 1, m));
      parts.push(box(-6, h * 0.5, d / 2 - 0.5, 1.2, 25, 1, a));
      parts.push(box(6, h * 0.5, d / 2 - 0.5, 1.2, 25, 1, a));
      break;
    case "table":
    case "desk":
      parts.push(box(0, h - 2, 0, w, 4, d, m));
      parts.push(...legs(w, d, h - 4, 5, a));
      break;
    case "coffeeTable":
      parts.push(box(0, h - 1.5, 0, w, 3, d, m));
      parts.push(...legs(w, d, h - 3, 3, a));
      break;
    case "chair": {
      const seatH = 45;
      parts.push(box(0, seatH - 2, 0, w, 4, d, m));
      parts.push(...legs(w, d, seatH - 4, 3, a, 2));
      parts.push(box(0, seatH + (h - seatH) / 2, -d / 2 + 2, w, h - seatH, 4, m));
      break;
    }
    case "sofa": {
      // Short legs, upholstered base, rounded arms and back, loose seat and back cushions.
      const legH = 10;
      const baseH = 20;
      const cushionH = 14;
      const armW = 18;
      const backD = 20;
      const seatTop = legH + baseH + cushionH;
      const armTop = Math.min(h - 8, seatTop + 20);
      const inner = w - 2 * armW;
      const n = inner > 150 ? 3 : 2;
      const cw = inner / n;
      parts.push(...legs(w, d, legH, 4, a, 8));
      parts.push(soft(0, legH + baseH / 2, 0, w, baseH, d, m));
      parts.push(soft(-w / 2 + armW / 2, legH + (armTop - legH) / 2, 0, armW, armTop - legH, d, m));
      parts.push(soft(w / 2 - armW / 2, legH + (armTop - legH) / 2, 0, armW, armTop - legH, d, m));
      parts.push(soft(0, legH + (h - 6 - legH) / 2, -d / 2 + backD / 2, inner, h - 6 - legH, backD, m));
      for (let i = 0; i < n; i++) {
        const x = -inner / 2 + cw * (i + 0.5);
        parts.push(soft(x, legH + baseH + cushionH / 2, backD / 2 + 1, cw - 1.5, cushionH, d - backD - 2, m));
        parts.push(soft(x, seatTop + (h - seatTop) / 2, -d / 2 + backD + 8, cw - 3, h - seatTop, 16, m));
      }
      break;
    }
    case "shelf": {
      const t = 2.5;
      parts.push(box(-w / 2 + t / 2, h / 2, 0, t, h, d, m));
      parts.push(box(w / 2 - t / 2, h / 2, 0, t, h, d, m));
      parts.push(box(0, h / 2, -d / 2 + 0.5, w, h, 1, m));
      const n = Math.max(2, Math.round(h / 40));
      for (let i = 0; i <= n; i++) parts.push(box(0, Math.min(h - t / 2, (i * (h - t)) / n + t / 2), 0, w, t, d, m));
      break;
    }
    case "kitchenBlock": {
      parts.push(box(0, (h - 4) / 2, 0, w, h - 4, d - 2, m));
      parts.push(box(0, h - 2, 0, w, 4, d, a));
      parts.push(box(w / 4, h - 0.4, -5, 60, 0.8, 50, "metal-steel")); // hob
      parts.push(box(-w / 4, h - 0.4, -5, 50, 0.8, 40, "metal-steel")); // sink
      break;
    }
    case "rug":
      parts.push(box(0, h / 2, 0, w, h, d, m));
      break;
    case "lamp": {
      parts.push(box(0, 1, 0, w * 0.7, 2, d * 0.7, a));
      parts.push(box(0, (h - 30) / 2, 0, 3, h - 30, 3, a));
      parts.push(box(0, h - 15, 0, w, 30, d, m));
      break;
    }
    case "pouf":
      parts.push({ ...box(0, (h - 4) / 2, 0, w, h - 4, d, m), shape: "cylinder" });
      parts.push({ ...box(0, h - 2, 0, w - 4, 4, d - 4, a), shape: "cylinder" }); // cushion top
      break;
    case "plant": {
      // Terracotta pot, short trunk, two stacked foliage blocks.
      const potH = Math.min(40, h * 0.28);
      const crown = h - potH;
      parts.push(box(0, potH / 2, 0, w * 0.5, potH, d * 0.5, a));
      parts.push(box(0, potH + crown * 0.2, 0, 3, crown * 0.4, 3, "wood-walnut"));
      parts.push(box(0, potH + crown * 0.55, 0, w, crown * 0.5, d, m));
      parts.push(box(0, potH + crown * 0.87, 0, w * 0.6, crown * 0.26, d * 0.6, m));
      break;
    }
  }
  return { size: { w, d, h }, parts };
}
