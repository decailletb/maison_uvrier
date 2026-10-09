# État du projet — mis à jour 2026-10-09T15:05+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 et 1 fusionnées (PR #1, #2).

## Phase en cours
Phase 2 — Géométrie intérieure (`feat/interior-geometry`). Plan : `docs/plan/02-interior-geometry.md`.

## Fait (dernières étapes, 5 max)
- Murs découpés autour des ouvertures, sols par pièce, dalles percées par les escaliers, volées droites.
- Étiquettes de pièces en sprites (drei `Html` perdait un portail sous StrictMode).
- Sélecteur de niveau, caméra orbite + marche (WASD), presets générés par niveau et par pièce.
- Script screenshots lit les presets depuis l'app ; 43 tests unitaires et 2 tests e2e verts.

## En cours (étape exacte, fichier, ce qui reste)
Vérification visuelle : `visual-check` sur `sous-sol-top`, `rez-top`, `etage-top` (vs index house-plans)
et `sejour-cuisine`, `chambre-parents`, `salle-de-bains`, `chambre-2` (vs IMG_5500, 5508, 5504, 5505).
Corrections éventuelles, puis PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lancer `visual-check` sur les sept presets ci-dessus ; corriger ; `build-check` ; PR `feat/interior-geometry`.

## Bloqué / questions pour Benjamin
Aucune. Escaliers = volées droites vers +y (approximation, DECISIONS.md).

## Branche active, dernier commit, PR ouverte
Branche `feat/interior-geometry`, pas de PR ouverte.
