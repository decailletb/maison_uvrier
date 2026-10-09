# État du projet — mis à jour 2026-10-09T15:10+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 et 1 fusionnées (PR #1, #2).

## Phase en cours
Phase 2 — Géométrie intérieure (`feat/interior-geometry`), en fin de phase. Plan : `docs/plan/02-interior-geometry.md`.

## Fait (dernières étapes, 5 max)
- Géométrie intérieure complète des trois niveaux (murs, sols, dalles, escaliers, plafonds).
- Niveau / caméra / étiquettes / plafonds dans l'UI ; marche WASD.
- Presets par niveau et par pièce ; 5 passes de `visual-check` : niveaux PASS, séjour, chambre parents, chambre 2, disponible PASS, salle de bains géométrie confirmée.
- Grille de carrelage procédurale et arêtes de murs pour la lisibilité.

## En cours (étape exacte, fichier, ce qui reste)
`build-check` (toutes les portes) lancé ; ensuite PR `feat/interior-geometry`, squash-merge.

## Prochaine étape (une ligne : la première action de la prochaine session)
Si la PR n'est pas fusionnée : `gh pr list`, relancer `build-check`, fusionner ; puis créer `feat/exterior-shell` et `docs/plan/03-exterior-shell.md`.

## Bloqué / questions pour Benjamin
Aucune. Escaliers = volées droites (DECISIONS.md) ; photos peut-être d'une autre villa (fenêtre chambre 2 paraît plus étroite sur IMG_5505 que le 180 x 110 du plan).

## Branche active, dernier commit, PR ouverte
Branche `feat/interior-geometry`, pas encore de PR.
