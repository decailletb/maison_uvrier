# État du projet — mis à jour 2026-10-09T15:12+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0, 1, 2 fusionnées (PR #1, #2, #3).

## Phase en cours
Phase 3 — Enveloppe extérieure et lumière (`feat/exterior-shell`). Plan : `docs/plan/03-exterior-shell.md`.

## Fait (dernières étapes, 5 max)
- Modèle solaire Uvrier (`src/scene/sun.ts`) + tests ; curseurs mois / heure dans l'UI.
- Enveloppe : terrasse, couvert et son toit sur poteaux, balcon + balustrade vitrée + couvert balcon, toiture + acrotère (`src/scene/shell.ts`).
- Vitrages et cadres dans les ouvertures, vantail de la porte d'entrée.
- HDRI CC0 Poly Haven dans `assets/hdri/` (manifeste), servi via `publicDir`, repli `Sky`.
- Presets `sud`, `ouest`, `est`, `aerial` ; 52 tests unitaires, 2 e2e verts.

## En cours (étape exacte, fichier, ce qui reste)
`visual-check` des presets extérieurs contre les élévations et IMG_5497 / IMG_5510 ; corrections ; portes ; PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Relancer `visual-check` sur `sud ouest est aerial` si son verdict n'est pas dans le log ; corriger ; `build-check` ; PR `feat/exterior-shell`.

## Bloqué / questions pour Benjamin
Aucune. Estimations : nombre de poteaux du couvert, hauteur de l'acrotère (DECISIONS.md).

## Branche active, dernier commit, PR ouverte
Branche `feat/exterior-shell`, pas de PR.
