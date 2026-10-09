---
name: deco
description: Apply a decoration inspiration image (or a folder of images as a theme) to one room or every bedroom and living room of the 3D villa - interpret the image through the deco-interpreter agent, match the catalogue, write a new scene file with `npm run deco:apply`, take before / after screenshots, check them with visual-check and report in French. Usage: /deco <room-id|all> <image-or-folder>.
user-invocable: true
---

# /deco <room> <image-or-folder>

Arguments: `<room>` is a room id from `src/data/house/*.json` (`sejour-cuisine`,
`chambre-parents`, `chambre-2`, ...) or `all` (theme mode: every `chambre*` and
`sejour*` room, furniture filtered per room type). `<image-or-folder>` is a path under
`inspiration/` (or `photos/` as a stand-in). The theme name is the folder name (or the
image file name without extension).

1. Never open the image in the main thread. For each image, call the
   `deco-interpreter` agent with the image path and the target room; it returns the
   proposal JSON (schema `src/deco/proposal.ts`, vocabularies in the `scene-format`
   skill). Write it to `inspiration/<theme>/proposal.json` (`proposal-<n>.json` for
   several images, plus a merged `proposal.json`: union of furniture, palette and
   surfaces of the first image).
2. Print a 5-line French summary (style, palette, pièces proposées).
3. Apply: `npm run deco:apply -- inspiration/<theme>/proposal.json <room|all> <theme>`
   (`--base scenes/<other>.json` to start from another scene). It matches each piece to
   a catalogue model (same category, shared style tag) or a procedural kind with the
   nearest library materials, lays the room out from the placement hints
   (`src/deco/layout.ts`: walls, window, centre, corner, beside / in front of), keeps
   doors clear, writes `scenes/<room>-<theme>.json`, prints the French report and
   appends it to `docs/deco-log.md`. Pieces it could not place are listed as such.
4. Screenshots before and after for the room presets, then `visual-check`:
   `VIEWER_SCENE=base npm run screenshots -- <room> <room>-3 <level>-top` (copy the PNGs
   aside), `VIEWER_SCENE=<room>-<theme> npm run screenshots -- <room> <room>-3 <level>-top`,
   and hand both sets plus the proposal summary to `visual-check`. Apply at most two
   rounds of corrections (edit the scene file directly, or the proposal and re-apply).
5. Report in the console (French, under 15 lines): pièces placées et substitutions
   (modèle / forme paramétrique), finitions, verdict de `visual-check`, chemin de la
   scène. `docs/deco-log.md` already holds the apply report; append the verdict line.
