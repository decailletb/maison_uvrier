# État du projet — mis à jour 2026-10-09T15:35+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0, 1, 2 fusionnées (PR #1, #2, #3).

## Phase en cours
Phase 3 — Enveloppe extérieure et lumière (`feat/exterior-shell`), en fin de phase.

## Fait (dernières étapes, 5 max)
- Enveloppe complète (terrasse, couvert sur poteaux, balcon + balustrade + couvert balcon, toiture + acrotère), vitrages, porte d'entrée.
- Ciel HDRI CC0 + repli `Sky`, soleil réel (modèle NOAA, curseurs mois/heure), ombres.
- Presets extérieurs `sud ouest est aerial` ; `visual-check` PASS sur les quatre (massing, ouvertures, balcon, couvert, ciel, ombres).
- Captures headless fiabilisées (`preserveDrawingBuffer`), verre simple, sol 400 m sans grille.

## En cours (étape exacte, fichier, ce qui reste)
`build-check` (toutes les portes) en cours ; puis PR `feat/exterior-shell` et squash-merge.

## Prochaine étape (une ligne : la première action de la prochaine session)
Si la PR n'est pas fusionnée : `gh pr list`, `build-check`, merge ; puis `feat/furniture-catalogue` et `docs/plan/04-catalogue.md`.

## Bloqué / questions pour Benjamin
Aucune. Note : façade ouest sombre à 15 h en juin (soleil au sud-ouest, incidence rasante) ; à revoir en phase 6.

## Branche active, dernier commit, PR ouverte
Branche `feat/exterior-shell`, pas encore de PR.
