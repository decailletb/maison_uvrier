/** Downloads the current canvas as a PNG (the canvas keeps its drawing buffer). */
export function exportPng(name: string): void {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${name}.png`;
  a.click();
}
