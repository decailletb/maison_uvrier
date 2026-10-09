# Phase 0 — Bootstrap (`feat/bootstrap`)

Goal: an empty scene (ground plane, orbit controls) with every quality gate green and
the agents, skills and docs that later phases rely on.

- [x] Branch `feat/bootstrap`, `docs/STATE.md`, `docs/DECISIONS.md`, this plan
- [ ] `package.json`, `tsconfig`, `vite.config.ts`, `eslint.config.js`, `.gitignore`,
      scripts `dev | build | lint | test | test:e2e | screenshots | assets:fetch`
- [ ] Folders `src/data src/scene src/viewer src/catalogue assets scenes inspiration scripts`
- [ ] Empty scene: `Canvas`, ground plane, `OrbitControls`, camera presets via `?preset=`
- [ ] Vitest unit test (presets), Playwright smoke test (canvas renders)
- [ ] `scripts/screenshots.ts` → `playwright/screenshots/<preset>.png`
- [ ] `scripts/fetch-assets.ts` stub reading `assets/manifest.json`
- [ ] Agents `geometry-extractor`, `visual-check`, `asset-fetcher`, `deco-interpreter`
- [ ] Skills `scene-format`, `deco`, `checkpoint`
- [ ] `.claude/settings.json` deny list + hook extended (playwright reports, screenshots, data JSON)
- [ ] `CLAUDE.md` updated: commands, structure, git conventions
- [ ] Gates green via `build-check`; `visual-check` confirms a screenshot renders
- [ ] PR opened, squash-merged, STATE.md updated, phase 1 branch started
