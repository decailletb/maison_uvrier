# Maison Uvrier

Plans and decoration ideas for the house in Uvrier. Goal: a 3D viewer to visualise
decoration ideas on top of the plans and photos. No code exists yet (as of 2026-10-09).

## What is in the repo

- `Plans.pdf` — 9 scanned pages, no text layer. Do not open it blind. Invoke the
  `house-plans` skill first: it holds the page index, room names, dimensions and photo
  captions. Open a single page only when the index is not enough, and do it through the
  `plans-reader` agent so the image tokens stay out of this thread.
- `photos/IMG_5497.JPG` … `IMG_5510.JPG` — 14 site photos, 640×360 or 360×640.
  Captions live in the `house-plans` skill. Open one photo at a time, never all 14.
- `README.md` — one French line. Nothing else to discover.
- `pdftoppm` (poppler 26.09.0, `C:\repos\pdftoppm`) is on the user PATH, so `Read` with
  `pages` works on the PDF. PyMuPDF is installed globally as a fallback for `plans-reader`.

## When code arrives

- Stack not decided. Do not assume a framework or 3D library; check `package.json` or ask.
- `.claude/settings.json` already denies reads of `node_modules/`, `dist/`, lockfiles and
  3D asset files, and a hook tails `npm run build` / `npm test` / `tsc` output.
- Delegate builds and test runs to the `build-check` agent and code search to `Explore`.

## Conventions

- Plan vocabulary is French (sous-sol, rez, étage, combles). Keep room names exactly as
  printed on the plans.
- Volume figure printed on plan page 2: `4282.16 m³ / 6 = 713.69 m³ par villa`.

# Compact instructions

When compacting this project, preserve:

- room names, dimensions and plan page numbers already extracted
- which photo was identified as which room or area
- any decision taken about the 3D viewer stack or data format

Drop: image contents already summarised in text, directory listings, successful build
logs.
