# État du projet — mis à jour 2026-10-09T16:15+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 4a fusionnées (PR #1 à #5).

## Phase en cours
Phase 4b — Édition de scène (`feat/scene-editing`). Plan : `docs/plan/05-scene-editing.md`.

## Fait (dernières étapes, 5 max)
- Schéma `Scene` (zod), helpers de placement (pièce, grille, aimantation aux murs), store zustand avec annuler/rétablir.
- API dev `GET/PUT /api/scenes/:name` (plugin Vite) : le navigateur écrit `scenes/<nom>.json` ; `?scene=<nom>` charge au démarrage.
- Meubles de la scène rendus (modèle ou paramétrique), sélection, glisser sur le sol, finitions par pièce (sol, murs, plafond).
- Panneau éditeur en français ; raccourcis Suppr / Ctrl+Z / Ctrl+Y / Ctrl+S / R.
- `scenes/base.json` (séjour-cuisine + chambre parents meublés) ; 67 tests unitaires, 4 e2e verts.

## En cours (étape exacte, fichier, ce qui reste)
`visual-check` de `scenes/base.json` (séjour, chambre parents, vues de dessus) ; corrections de placement ; portes ; PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lire le verdict `visual-check` (ou relancer `VIEWER_SCENE=base npm run screenshots -- sejour-cuisine-2 chambre-parents-2`), corriger `scenes/base.json`, `build-check`, PR `feat/scene-editing`.

## Bloqué / questions pour Benjamin
Aucune.

## Branche active, dernier commit, PR ouverte
Branche `feat/scene-editing`, pas de PR.
