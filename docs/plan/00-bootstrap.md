# Phase 0 — Bootstrap (`feat/bootstrap`)

Goal: an empty scene (ground plane, orbit controls) with every quality gate green and
the agents, skills and docs that later phases rely on.

- [x] Branch `feat/bootstrap`, `docs/STATE.md`, `docs/DECISIONS.md`, this plan
- [x] `package.json`, `tsconfig`, `vite.config.ts`, `eslint.config.js`, `.gitignore`,
      scripts `dev | build | lint | test | test:e2e | screenshots | assets:fetch`
- [x] Folders `src/data src/scene src/viewer src/catalogue assets scenes inspiration scripts`
- [x] Empty scene: `Canvas`, ground plane, `OrbitControls`, camera presets via `?preset=`
- [x] Vitest unit test (presets), Playwright smoke test (canvas renders)
- [x] `scripts/screenshots.ts` → `playwright/screenshots/<preset>.png`
- [x] `scripts/fetch-assets.ts` stub reading `assets/manifest.json`
- [x] Agents `geometry-extractor`, `visual-check`, `asset-fetcher`, `deco-interpreter`
- [x] Skills `scene-format`, `deco`, `checkpoint`
- [x] `.claude/settings.json` deny list + hook extended (playwright reports, screenshots, data JSON)
- [x] `CLAUDE.md` updated: commands, structure, git conventions
- [ ] Gates green via `build-check`; `visual-check` confirms a screenshot renders
- [ ] PR opened, squash-merged, STATE.md updated, phase 1 branch started
