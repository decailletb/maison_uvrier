# État du projet — mis à jour 2026-10-09T16:25+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 4a fusionnées (PR #1 à #5).

## Phase en cours
Phase 4b — Édition de scène (`feat/scene-editing`), en fin de phase. Plan : `docs/plan/05-scene-editing.md`.

## Fait (dernières étapes, 5 max)
- Éditeur complet : sélection, glisser, aimantation, finitions par pièce, annuler/rétablir, enregistrement dans `scenes/`.
- `scenes/base.json` : séjour-cuisine et chambre parents meublés ; `visual-check` : tous les objets reconnaissables, aucun ne flotte ni ne traverse un mur.
- `?ui=0` masque les panneaux ; les captures l'utilisent. Preset `<pièce>-3` (diagonale retour).
- 67 tests unitaires, 4 e2e (fumée + édition : placer, déplacer, enregistrer, charger).

## En cours (étape exacte, fichier, ce qui reste)
`build-check` (toutes les portes) en cours ; puis PR `feat/scene-editing`, squash-merge.

## Prochaine étape (une ligne : la première action de la prochaine session)
Si la PR n'est pas fusionnée : `gh pr list`, `build-check`, merge ; puis `feat/deco-workflow` et `docs/plan/06-deco-workflow.md`.

## Bloqué / questions pour Benjamin
Aucune. À polir en phase 6 : cadrage des presets de pièce (trop serrés dans les petites pièces), teinte du parquet.

## Branche active, dernier commit, PR ouverte
Branche `feat/scene-editing`, pas encore de PR.
