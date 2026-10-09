/**
 * Room name as a sprite with a canvas texture: no DOM portal, no font download, so
 * it renders identically in Chrome and in headless Playwright.
 */
import { useMemo } from "react";
import { CanvasTexture, LinearFilter } from "three";

const HEIGHT_PX = 48;
const PAD = 14;

function textTexture(text: string): { texture: CanvasTexture; aspect: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${HEIGHT_PX - 2 * 10}px system-ui, sans-serif`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + 2 * PAD;
  canvas.width = width;
  canvas.height = HEIGHT_PX;
  ctx.font = font;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath();
  ctx.roundRect(0, 0, width, HEIGHT_PX, 8);
  ctx.fill();
  ctx.fillStyle = "#1d2024";
  ctx.textBaseline = "middle";
  ctx.fillText(text, PAD, HEIGHT_PX / 2 + 1);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  return { texture, aspect: width / HEIGHT_PX };
}

export function RoomLabel({ text, position }: { text: string; position: [number, number, number] }) {
  const { texture, aspect } = useMemo(() => textTexture(text), [text]);
  // Constant screen size: with sizeAttenuation off, a scale of 1 spans the frustum height at distance 1.
  const height = 0.045;
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthTest={false} sizeAttenuation={false} />
    </sprite>
  );
}
