# État du projet — mis à jour 2026-10-09T14:40+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phase 0 fusionnée (PR #1).

## Phase en cours
Phase 1 — Plan data (`feat/plan-data`). Plan : `docs/plan/01-plan-data.md`.

## Fait (dernières étapes, 5 max)
- Schéma zod, helpers géométriques, loader, conversion cm → m (`src/scene/units.ts`).
- Trois niveaux extraits (pages 3, 4, 5) dans `src/data/house/*.json`, validés.
- Cartouche 3.35 m² identifiée comme appartenant à la villa voisine ; index house-plans corrigé.
- Orientation fixée (nord = haut de feuille, mur mitoyen ; ouest = terrasse/balcon ; est = entrée/couvert).
- 31 tests unitaires verts (surfaces ±5 %, CHAMBRE 2 ±10 % documenté).

## En cours (étape exacte, fichier, ce qui reste)
Portes complètes via `build-check`, puis PR `feat/plan-data` et squash-merge.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lancer `build-check` (all gates) ; si vert, `gh pr create` pour `feat/plan-data`, merge, puis créer `feat/interior-geometry` et `docs/plan/02-interior-geometry.md`.

## Bloqué / questions pour Benjamin
Aucune question bloquante. Hypothèses notées dans DECISIONS.md : épaisseurs de murs extérieurs différentes par niveau, nook de CHAMBRE 2, positions de portes intérieures mesurées (non cotées).

## Branche active, dernier commit, PR ouverte
Branche `feat/plan-data`, pas de PR ouverte.
