# État du projet — mis à jour 2026-10-09T16:55+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 4 fusionnées (PR #1 à #6).

## Phase en cours
Phase 5 — Workflow décoration (`feat/deco-workflow`). Plan : `docs/plan/06-deco-workflow.md`.

## Fait (dernières étapes, 5 max)
- `src/deco/` : proposition (zod), appariement, mise en place (indices fenêtre / points cardinaux / mur opposé / centre / coin / à côté de / devant), 13 tests.
- `npm run deco:apply` ; exécution réelle IMG_5505 → `scenes/chambre-2-enfant.json` : lit tête au mur ouest, bureau sous la fenêtre est, chaise devant, commode à côté du lit, tapis ; suspension ignorée (journalisé).
- Parquet en lames (texture), `VIEWER_LABELS=0` pour les captures.
- Mode thème `all` testé à sec (4 pièces).

## En cours (étape exacte, fichier, ce qui reste)
Deuxième `visual-check` avant / après sur chambre-2 ; puis portes, PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lire le verdict `visual-check` ; si PASS : `build-check`, PR `feat/deco-workflow`, merge, puis phase 6 (`feat/render-quality`, `docs/USER-GUIDE.md`).

## Bloqué / questions pour Benjamin
Aucune. Photo IMG_5505 utilisée comme image d'inspiration de substitution (aucune image dans `inspiration/`).

## Branche active, dernier commit, PR ouverte
Branche `feat/deco-workflow`, pas de PR.
