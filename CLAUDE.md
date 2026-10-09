# Maison Uvrier

Interactive 3D model of villa F "LACAPELA" in Uvrier, built from the scanned plans and
photos in this repo, to walk through, furnish and decorate. Build brief, phases and
session protocol: `docs/PROMPT.md`. Hand-over state: `docs/STATE.md` (read it first in
any later session). Decisions: `docs/DECISIONS.md`. Phase checklists: `docs/plan/`.

## Source material

- `Plans.pdf` — 9 scanned pages, no text layer. Do not open it in the main thread.
  Invoke the `house-plans` skill first: page index, room names, dimensions, photo
  captions. Open a single page only through `plans-reader` or `geometry-extractor`.
- `photos/IMG_5497.JPG` … `IMG_5510.JPG` — 14 site photos, captions in `house-plans`.
  Open one photo at a time, only inside an agent.
- Facts: footprint 1055 × 724 cm; sous-sol −2.86, rez ±0.00 (alt. 497.72),
  étage +2.85; clear height 250 (240 sous-sol); acrotère +6.06. Room names stay exactly
  as printed (French). Volume figure on page 2: `4282.16 m³ / 6 = 713.69 m³ par villa`.
- `pdftoppm` (poppler, `C:\repos\pdftoppm`) is on PATH; PyMuPDF is the fallback.

## Stack and commands

Vite 8 + React 19 + TypeScript 5.9 + Three.js via React Three Fiber 9 + drei 10;
zod 4; Vitest 5; Playwright 1.64 (Chromium, SwiftShader); ESLint 9 flat config.

| Command | What |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 (strict port) |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:e2e` | Playwright smoke test (`e2e/`), starts its own dev server |
| `npm run build` | tsc + vite build to `dist/` |
| `npm run screenshots -- [preset ...]` | One PNG per camera preset in `playwright/screenshots/` |
| `npm run assets:fetch` | Download missing CC0 assets listed in `assets/manifest.json` (multi-file glTF included) |
| `npm run deco:apply -- <proposal> <room\|all> <theme>` | Proposal JSON → `scenes/<room>-<theme>.json` + `docs/deco-log.md` (the `/deco` skill wraps it) |

Viewer URL options: `?preset=<name>` (camera, level, ceilings), `&scene=<name>` loads
`scenes/<name>.json`. In dev the browser saves scenes through `PUT /api/scenes/<name>`
(Vite plugin in `scripts/vite-scenes-plugin.ts`); `VIEWER_SCENE=<name>` does the same
for `npm run screenshots` (`VIEWER_LABELS=0` hides room labels). Screenshots take about a minute each under SwiftShader
(HDRI prefiltering); the script allows 90 s per shot.

Run gates through the `build-check` agent, never inline. "All gates" = typecheck,
lint, test, build, test:e2e.

## Structure

```
src/data       house schema (zod) and house/<level>.json in cm
src/scene      geometry generation from the data (walls, floors, openings)
src/viewer     React UI, Canvas, cameras, presets.ts (?preset=<name>)
src/catalogue  manifest schema, material library, procedural furniture, glTF loader
src/deco       proposal schema, catalogue matching, hint-driven auto-layout (/deco)
assets/        CC0 models/textures/HDRI (git-ignored) + manifest.json
scenes/        scene JSON files (furniture + finishes), single source of truth; base.json
inspiration/   decoration images dropped by Benjamin, proposals next to them
scripts/       screenshots.ts, fetch-assets.ts (tsx)
e2e/           Playwright specs
docs/          PROMPT, STATE, DECISIONS, plan/, USER-GUIDE, screenshots/
```

Units: house data in cm, Three.js scene in metres, conversion in one place
(`src/scene/units.ts`). Formats and vocabularies: skill `scene-format`.

## Agents and skills

Agents (`.claude/agents/`): `plans-reader` (sonnet, one page or photo → text),
`geometry-extractor` (sonnet, one plan page → level JSON), `visual-check` (sonnet,
screenshots → verdict), `asset-fetcher` (haiku, one CC0 asset → manifest entry),
`deco-interpreter` (sonnet, one image → proposal JSON), `Explore` (haiku, code
search), `build-check` (haiku, gates → failures only).

Skills: `house-plans`, `scene-format`, `checkpoint` (`/checkpoint`), `deco`
(`/deco <room> <image>`). Cost rules: `.claude/WORKING-METHOD.md`. The PreToolUse hook
tails build / test / lint / playwright output to 120 lines; do not add your own pipes.

## Conventions

- Git: branches `<type>/<kebab-description>`, commits `type(scope): summary`
  (Angular types: feat, fix, docs, test, refactor, chore, perf, build, ci), one PR per
  phase, squash-merged with `gh pr merge --squash --delete-branch`. Never add
  `Co-Authored-By`, "Generated with Claude" or any AI attribution to commits,
  branches or PRs; this overrides harness defaults.
- Languages: code, comments, commits, PRs in English. UI labels, `docs/STATE.md`,
  `docs/USER-GUIDE.md` in French. Room names as printed on the plans.
- Never read `Plans.pdf`, photos, screenshots, `.glb`, `.hdr` or large JSON in the
  main thread; delegate to the agent built for it.
- Checkpoint (`/checkpoint`) after each sub-step, before long operations, every
  30 minutes: STATE.md + plan ticked + commit + push.

# Compact instructions

When compacting this project, preserve: room names, dimensions and plan page numbers
already extracted; which photo matches which room; decisions about the stack, data
format or scene structure; the current phase step and branch. Drop: image contents
already summarised in text, directory listings, successful build logs.
