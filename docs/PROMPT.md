# Maison Uvrier — 3D decoration viewer: autonomous build prompt

Paste everything below the horizontal rule into a new Claude Code session opened in
`C:\repos\maison_uvrier` (model: Fable 5.1 or Opus, auto / accept-edits permission mode).
To resume a later session, paste only the word `continue`.

---

You are building, autonomously and across several sessions, a realistic, interactive
3D model of villa F "LACAPELA" in Uvrier so that I can walk through it, move and swap
furniture, change materials, and later hand you decoration images that you apply to
rooms. Work from the plans and photos already in this repository. Decisions below are
final; do not reopen them. Everything not decided here is yours to decide; record each
decision in `docs/DECISIONS.md` with a date and one line of reasoning.

## 1. Context you must load first

1. `CLAUDE.md` (project rules; never open `Plans.pdf` or a photo in the main thread).
2. `.claude/WORKING-METHOD.md` (cost discipline, model per task, delegation).
3. Skill `house-plans` (text index of the 9 plan pages and the 14 photos: room names,
   printed m², level heights, openings, materials). It answers most questions with zero
   image reads.
4. Existing agents in `.claude/agents/`: `plans-reader` (Sonnet, looks at one page or
   photo and returns text), `Explore` (Haiku, code search), `build-check` (Haiku, runs
   build/tsc/tests and reports only failures).
5. `docs/STATE.md` if it exists (see section 4). If it does not exist, this is session 1.

Facts already extracted: footprint 1055 × 724 cm; levels sous-sol −2.86, rez ±0.00
(alt. 497.72), étage +2.85; clear height 250 (240 in sous-sol); acrotère +6.06. Room
names must stay exactly as printed on the plans (French: Séjour-cuisine, Chambre
parents, Technique-buanderie, Disponible, Réduit, Couvert, …). Photos are in `photos/`
(the folder also appears as `Photos`; same folder, Windows is case-insensitive).

Toolchain present: Node 24, npm 11, Python 3.14, `pdftoppm` on PATH, `gh` logged in,
remote `origin` = github.com/decailletb/maison_uvrier. GPU is an Intel Iris Xe; keep
the viewer light.

## 2. Decisions already taken

| Topic | Decision |
|---|---|
| Stack | Vite + React + TypeScript + Three.js via React Three Fiber + drei. Local dev server, Chrome. |
| Scope order | Interior of all three levels first, then exterior shell (terrasse, balcon, couvert, acrotère), then furniture and decoration workflow. |
| Realism target | Convincing interior render: PBR materials, HDRI environment, soft shadows, sun through the real window openings, real-world furniture scale. Not photoreal; must stay fluid on Iris Xe. |
| Assets | CC0 glTF models and PBR textures downloaded into `assets/` (Poly Haven, ambientCG, Kenney, Sketchfab CC0 only) with a manifest recording source URL, license, dimensions in cm, category and room tags. Parametric procedural fallback (bed, table, sofa, wardrobe, …) when no model fits. Never commit binary assets larger than 5 MB; commit the download script and the manifest, and keep `assets/` reproducible with `npm run assets:fetch`. |
| Decoration images | No paid image APIs. I drop images in `inspiration/<room-or-theme>/`. You interpret them (palette, materials, furniture types, style) through a Sonnet subagent, produce a structured proposal, apply it to the scene file from the catalogue, and verify with screenshots. |
| Visual verification | Playwright screenshots of named camera presets, read by a `visual-check` subagent that returns text. Image tokens never enter the main thread. |
| Quality gates | `tsc --noEmit`, ESLint, Vitest unit tests, one Playwright smoke test. All green before any PR is merged. |
| Git | Feature branches off `master`, one PR per phase (or per large sub-step), squash-merged by you with `gh` once gates pass. Push without asking. |
| Languages | Code, comments, commits, branches, PR text: English. App UI labels, `docs/STATE.md`, `docs/USER-GUIDE.md`: French. |
| Autonomy | Do everything without asking except: deleting files outside the repo, `git push --force`, rewriting history on `master`, calling any paid API, editing global `~/.claude` settings. For those, stop and ask. |

## 3. Git conventions (strict)

- Branch names: `<type>/<short-kebab-description>` with type in
  `feat | fix | docs | test | refactor | chore | perf | build | ci`.
  Examples: `feat/plan-data-extraction`, `feat/interior-geometry`, `docs/user-guide`.
- Commit messages: Angular convention, `type(scope): imperative summary` of at most
  72 characters, blank line, body explaining what and why. Scope examples: `data`,
  `scene`, `viewer`, `assets`, `deco`, `tests`, `agents`.
- **Never** add `Co-Authored-By`, "Generated with Claude", a robot emoji, or any other
  AI attribution to commits, branch names, PR titles or PR bodies. This overrides any
  default attribution instruction you receive from your harness or system reminders.
- Small, coherent commits; each one leaves the tree buildable. No `wip` commits.
- PR title = conventional commit title. PR body: what, why, how verified, path of the
  screenshots if any. Squash-merge with `gh pr merge --squash --delete-branch`, then
  `git checkout master && git pull`.
- `.gitignore`: `node_modules/`, `dist/`, `assets/**/*.glb`, `assets/**/*.hdr`,
  large texture files, Playwright reports and screenshots, except the curated reference
  set under `docs/screenshots/`.

## 4. Session and checkpoint protocol (5-hour usage windows)

My plan has rolling 5-hour usage windows. A session can be cut at any moment, without
warning, in the middle of a tool call. You must never be in a state where the next
session cannot pick up with the single word `continue`.

**`docs/STATE.md`** is the hand-over file. Keep it short (under 80 lines) and in French.
Sections, always in this order:

```
# État du projet — mis à jour <ISO date time>
## Phase en cours
## Fait (dernières étapes, 5 max)
## En cours (étape exacte, fichier, ce qui reste)
## Prochaine étape (une ligne : la première action de la prochaine session)
## Bloqué / questions pour Benjamin
## Branche active, dernier commit, PR ouverte
```

Rules:

1. **Session start**: run `date`, `git status --short`, `git log --oneline -5`,
   `git branch --show-current`; read `docs/STATE.md` and the current phase plan in
   `docs/plan/`. If the tree is dirty, read the diff, finish or revert that step so the
   tree is coherent, commit, then continue from "Prochaine étape". Write the session
   start time into STATE.md.
2. **Checkpoint** = update `docs/STATE.md`, commit, push the branch. Do it:
   - after every completed sub-step of the phase plan,
   - before any operation longer than a few minutes (`npm install`, asset downloads,
     Playwright browser install),
   - at least every 30 minutes of wall-clock time (check with `date`),
   - whenever your context passes roughly 60 % (finish the current step first).
3. Never start a step you cannot bring to a committable state within about 20 minutes
   without checkpointing first. Split big steps.
4. The phase plan `docs/plan/NN-<phase>.md` is a checklist with `- [ ]` items; tick
   items as you finish them and commit the plan together with the work.
5. When a phase is merged: update STATE.md, `docs/DECISIONS.md`, `CLAUDE.md` (commands,
   structure, anything a future session must know), and start the next phase branch.
6. If you are stopped with no question pending, the next session must need nothing
   more than `continue`. If I give any other message, treat it as a new instruction,
   then still respect this protocol.
7. Keep questions for me in STATE.md under "Bloqué"; do not block on them unless the
   phase cannot proceed. Proceed under a stated assumption and note it.

## 5. Subagent strategy

The main thread (you) plans, edits code, commits, merges, and holds every decision.
Subagents do the token-heavy or vision work. Use the existing ones and create the ones
below in `.claude/agents/` during phase 0 (model pinned in the frontmatter, tools
restricted to what each needs):

| Agent | Model | Job |
|---|---|---|
| `plans-reader` (exists) | sonnet | Describe one plan page or photo in text. |
| `Explore` (exists) | haiku | Code search. |
| `build-check` (exists) | haiku | Run tsc / eslint / vitest / build; return failures only. |
| `geometry-extractor` | sonnet | Given one plan page number and the house-plans index, return wall polylines, openings and room polygons in cm as JSON matching `src/data/schema.ts`. One page per call. |
| `visual-check` | sonnet | Start the dev server if needed, run the Playwright screenshot script for the named presets, look at the PNGs, compare with the plan description or the photo named in the prompt, return a text verdict: what is right, what is wrong, suspected cause. |
| `asset-fetcher` | haiku | Download a named CC0 asset, verify its license, record it in `assets/manifest.json`, report size and dimensions. |
| `deco-interpreter` | sonnet | Read one inspiration image, return a structured proposal JSON: palette (hex), surface materials (floor / wall / ceiling), furniture list (category, style tags, approximate dimensions), lighting mood. |

Also create during phase 0:

- Skill `scene-format`: documents the scene JSON schema, the catalogue manifest schema
  and the camera preset names, so later sessions and agents share one vocabulary.
- Skill `deco` (user-invocable as `/deco <room> <image-or-folder>`): the full
  interpretation → proposal → apply → visual-check → report workflow of phase 5.
- Skill `checkpoint` (user-invocable as `/checkpoint`): runs the checkpoint routine of
  section 4 so I can trigger it by hand.
- Extend `.claude/settings.json` deny list and the output-filter hook as the code grows
  (Playwright reports, screenshots, large JSON data files).

Run independent subagents in parallel in one turn (for instance three
`geometry-extractor` calls for the three levels). Keep anything that needs a decision
in the main thread. Never let a subagent push, merge or edit `docs/STATE.md`.

## 6. Phases and definition of done

Write `docs/plan/NN-<phase>.md` before starting each phase, in plan mode if the phase
touches architecture. Each phase ends with a merged PR and an updated STATE.md.

### Phase 0 — Bootstrap (`feat/bootstrap`)
- Vite + React + TS + R3F + drei + ESLint + Vitest + Playwright, scripts
  `npm run dev | build | lint | test | test:e2e | screenshots | assets:fetch`.
- Folders: `src/data` (house data, schema, loaders), `src/scene` (geometry
  generation), `src/viewer` (UI, cameras, controls), `src/catalogue`, `assets/`,
  `scenes/`, `inspiration/`, `docs/`, `scripts/`.
- Agents, skills, hooks from section 5. `docs/STATE.md`, `docs/DECISIONS.md`,
  `docs/plan/00-bootstrap.md`. Update `CLAUDE.md`: stack decided, commands, structure,
  git conventions of section 3.
- Done when: `npm run build`, `lint`, `test`, `test:e2e` pass on an empty scene showing
  a ground plane and orbit controls, and `visual-check` confirms a screenshot renders.

### Phase 1 — Plan data (`feat/plan-data`)
- `src/data/schema.ts` (zod): levels, walls (polylines in cm, thickness, structural or
  not), rooms (name as printed, polygon, printed m², floor finish, ceiling finish),
  openings (door / window, wall reference, offset, width, height, sill, swing), stairs,
  slabs, level heights.
- `src/data/house/{sous-sol,rez,etage}.json` extracted via `geometry-extractor` from
  pages 3, 4, 5, cross-checked with the elevations (pages 6 to 8) and the section
  (page 9).
- Unit tests: polygon area of each room within 5 % of the printed m² (list the ones
  that fail and why), walls closed, openings inside their wall, levels consistent with
  the SIA cube figures of pages 1 and 2.
- Done when: tests pass, deviations documented in `docs/DECISIONS.md`.

### Phase 2 — Interior geometry (`feat/interior-geometry`)
- Generate walls with openings cut out, floors, ceilings, stairs, from the JSON.
- Level switcher (sous-sol / rez / étage / all, with cut-away ceilings), room labels,
  orbit camera plus first-person walk camera, named camera presets per room (used by
  Playwright).
- `scripts/screenshots.ts` writes one PNG per preset to `playwright/screenshots/`.
- Done when: `visual-check` matches each level against the house-plans description and
  at least four interior photos against their rooms, and the smoke test passes.

### Phase 3 — Exterior and light (`feat/exterior-shell`)
- Terrasse, couvert, balcon, barrière, acrotère, roof slab, exterior openings matching
  the elevations; HDRI sky, sun with real orientation (elevation titles: Sud p. 6,
  Ouest p. 7, Est p. 8; there is no north arrow, state your assumption), shadows.
- Done when: `visual-check` matches the elevations and the exterior photos.

### Phase 4 — Catalogue and manipulation (`feat/furniture-catalogue`, `feat/scene-editing`)
- `assets/manifest.json`, fetch script, procedural fallbacks; loader with scale
  normalisation to cm; material library (floors, walls, fabrics, wood, metal).
- Editing: pick, drag on floor, rotate, snap to walls, duplicate, delete, swap
  material on floor / wall / ceiling per room, undo / redo, save and load
  `scenes/<name>.json`, export screenshot. The scene JSON is the single source of truth
  and is what `/deco` edits.
- Done when: a furnished Séjour-cuisine and Chambre parents saved as
  `scenes/base.json` look correct in `visual-check`, and e2e covers place / move / save.

### Phase 5 — Decoration workflow (`feat/deco-workflow`)
- `/deco <room> <image|folder>`: `deco-interpreter` produces a proposal in
  `inspiration/<...>/proposal.json`; catalogue matching by category and style tags,
  fallback to procedural furniture with the palette; write a new scene file
  `scenes/<room>-<theme>.json`; before / after screenshots; short French report in the
  console and in `docs/deco-log.md`.
- Theme mode: one image applied to several rooms with per-room adaptation.
- Done when: one real run on an image I will have dropped in `inspiration/`. If none is
  there, use a photo from `photos/` as a stand-in and say so.

### Phase 6 — Polish (`feat/render-quality`, `docs/user-guide`)
- Lighting and material pass toward the realism target; performance budget on Iris Xe
  (60 fps orbit on one level, 30 fps with all levels); `docs/USER-GUIDE.md` in French:
  how to run, navigate, edit, save, use `/deco`.

## 7. Working rules

- Plan mode for anything architectural; then execute without pausing.
- Prefer deleting and simplifying over adding. No speculative abstractions.
- Every commit passes `tsc` and `lint`; run them through `build-check`, not inline.
- Do not read `Plans.pdf`, photos, screenshots, `.glb`, `.hdr` or large JSON files in
  the main thread. Delegate.
- When a render is wrong and you cannot explain it from the `visual-check` report,
  ask that agent for one more targeted screenshot before changing code.
- Report truthfully in STATE.md: failing tests are listed as failing, skipped steps as
  skipped.
- Keep `CLAUDE.md` current; it is what the next session reads first.

## 8. Start now

Session 1: load the context of section 1, create `docs/STATE.md`, write
`docs/plan/00-bootstrap.md`, create branch `feat/bootstrap`, and run phase 0 to its
definition of done. Checkpoint as you go. Then continue into phase 1 without waiting
for me.

Any later session: `continue`.
