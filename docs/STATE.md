# État du projet — mis à jour 2026-10-09T16:40+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 4 fusionnées (PR #1 à #6).

## Phase en cours
Phase 5 — Workflow décoration (`feat/deco-workflow`). Plan : `docs/plan/06-deco-workflow.md`.

## Fait (dernières étapes, 5 max)
- `src/deco/` : schéma de proposition, appariement catalogue (catégorie + tags, matériaux par couleur), mise en place automatique (indices, périmètre, portes libres) ; 12 tests.
- `npm run deco:apply -- <proposal> <pièce|all> <thème>` écrit `scenes/<pièce>-<thème>.json` et `docs/deco-log.md`.
- Première exécution réelle : IMG_5505 (chambre d'enfant, photo de substitution) → `inspiration/chambre-enfant/proposal.json` → `scenes/chambre-2-enfant.json` (6 pièces placées).
- Mode thème (`all`) testé à sec. Skill `/deco` réécrit avec les vraies commandes.

## En cours (étape exacte, fichier, ce qui reste)
`visual-check` avant / après sur `chambre-2`, `chambre-2-3`, `etage-top` ; corrections ; portes ; PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lire le verdict `visual-check` (ou relancer `VIEWER_SCENE=chambre-2-enfant npm run screenshots -- chambre-2 chambre-2-3 etage-top`), corriger, `build-check`, PR `feat/deco-workflow`.

## Bloqué / questions pour Benjamin
Aucune. Aucune image dans `inspiration/` : la photo IMG_5505 a servi de substitut (le brief le prévoit).

## Branche active, dernier commit, PR ouverte
Branche `feat/deco-workflow`, pas de PR.
