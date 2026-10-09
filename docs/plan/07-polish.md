# Phase 6 — Polish (`feat/render-quality`, `docs/user-guide`)

Goal: interiors read as bright, warm rooms; the viewer stays fluid on an Intel Iris Xe;
Benjamin has a French guide.

- [ ] Lighting pass: ACES tone mapping, interior fill from the HDRI, whiter paint, softer sun shadows; `visual-check` on `chambre-2-2` (scene chambre-2-enfant) and `sejour-cuisine-3` (scene base) comparing wall brightness with IMG_5505 / IMG_5500
- [x] Performance: on-demand frame loop in orbit mode (continuous in walk mode), shadow map 1536, `?stats=1` FPS overlay, draw-call count printed in the console once
- [x] Room preset framing in small rooms: camera pulled to the corner, FOV 60 for rooms under 12 m²
- [x] `docs/USER-GUIDE.md` (French): installation, lancement, navigation, niveaux, presets, édition, enregistrement, `/deco`, dépannage
- [ ] Gates green, PR, squash-merge, STATE.md, CLAUDE.md
