/**
 * Splits a wall polyline into solid boxes around its openings. Pure, plan cm.
 * Each piece is a segment of the centreline with a vertical extent; the renderer
 * turns it into a box of the wall thickness.
 */
import type { Level, Opening, Point, Wall } from "@/data/schema";

export interface WallPiece {
  wallId: string;
  start: Point;
  end: Point;
  /** cm above the level floor */
  bottom: number;
  top: number;
  thickness: number;
}

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function wallPieces(wall: Wall, openings: readonly Opening[], clearHeight: number): WallPiece[] {
  const height = wall.height ?? clearHeight;
  const mine = openings
    .filter((o) => o.wallId === wall.id)
    .map((o) => ({ start: o.offset, end: o.offset + o.width, sill: o.sill, top: o.sill + o.height }))
    .sort((a, b) => a.start - b.start);

  const pieces: WallPiece[] = [];
  let segStart = 0;
  for (let i = 1; i < wall.points.length; i++) {
    const a = wall.points[i - 1];
    const b = wall.points[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len === 0) continue;
    const segEnd = segStart + len;
    const push = (from: number, to: number, bottom: number, top: number) => {
      if (to - from < 0.5 || top - bottom < 0.5) return;
      pieces.push({
        wallId: wall.id,
        start: lerp(a, b, (from - segStart) / len),
        end: lerp(a, b, (to - segStart) / len),
        bottom,
        top,
        thickness: wall.thickness,
      });
    };

    let cursor = segStart;
    for (const o of mine) {
      const os = Math.max(o.start, segStart);
      const oe = Math.min(o.end, segEnd);
      if (oe <= os) continue;
      if (os > cursor) push(cursor, os, 0, height);
      if (o.sill > 0) push(os, oe, 0, Math.min(o.sill, height));
      if (o.top < height) push(os, oe, o.top, height);
      cursor = Math.max(cursor, oe);
    }
    if (cursor < segEnd) push(cursor, segEnd, 0, height);
    segStart = segEnd;
  }
  return pieces;
}

export function levelWallPieces(level: Level): WallPiece[] {
  return level.walls.flatMap((w) => wallPieces(w, level.openings, level.clearHeight));
}

/** Centre, length and yaw (radians, plan frame) of a piece, for box placement. */
export function pieceFrame(piece: WallPiece): { centre: Point; length: number; yaw: number } {
  const dx = piece.end[0] - piece.start[0];
  const dy = piece.end[1] - piece.start[1];
  return {
    centre: [(piece.start[0] + piece.end[0]) / 2, (piece.start[1] + piece.end[1]) / 2],
    length: Math.hypot(dx, dy),
    yaw: Math.atan2(dy, dx),
  };
}
