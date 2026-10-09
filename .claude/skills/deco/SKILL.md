---
name: deco
description: Apply a decoration inspiration image (or a folder of images as a theme) to one room or several rooms of the 3D villa - interpret the image through the deco-interpreter agent, match the catalogue, write a new scene file, take before/after screenshots, check them with visual-check and report in French. Usage: /deco <room-id|all> <image-or-folder>.
user-invocable: true
---

# /deco <room> <image-or-folder>

Phase 5 workflow. Until phase 4 (catalogue and scene editing) is merged, this skill
can only produce the proposal (steps 1 to 3); say so and stop after step 3.

Arguments: `<room>` is a room id from `src/data/house/*.json` (`sejour-cuisine`,
`chambre-parents`, ...) or `all` for theme mode. `<image-or-folder>` is a path under
`inspiration/` (or `photos/` as a stand-in).

1. Read `.claude/skills/scene-format/SKILL.md` (Proposal, Scene file, Catalogue).
   Never open the image in the main thread.
2. For each image, call `deco-interpreter` with the image path and the target room
   (one agent per image, in parallel when several). Write each result to
   `inspiration/<folder>/proposal.json` (or `proposal-<n>.json` for several images,
   plus a merged `proposal.json` in theme mode: union of furniture, palette of the
   first image).
3. Print a 5-line French summary of the proposal (style, palette, pièces proposées).
4. Match: for each proposal furniture entry, pick the catalogue asset whose `category`
   matches and shares the most style tags; if none, use the procedural kind of the
   same category with the proposal colour. Surfaces: material asset by category
   `material-*` and nearest tag, else flat colour.
5. Place: one item per entry, inside the room polygon, respecting `placementHint`
   (against the wall opposite the door, under the window, ...), no overlap with
   openings or other items; use `src/scene/placement.ts` helpers.
6. Write `scenes/<room>-<theme>.json` (theme = folder name), `base` = the scene it
   started from (`scenes/base.json` by default). In theme mode one file
   `scenes/all-<theme>.json` covering every room, each adapted to its size and use.
7. Screenshots before (base scene) and after (new scene) for the room presets:
   `npm run screenshots -- <room-id> <room-id>-2` with `VIEWER_SCENE=<file>`.
   Hand both sets to `visual-check` with the proposal summary; apply at most two
   rounds of corrections from its verdict.
8. Append to `docs/deco-log.md` (French): date, room, image, scene file, verdict, what
   was substituted by a procedural fallback. Print the same block in the console.
