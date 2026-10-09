# État du projet — mis à jour 2026-10-09T15:50+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 3 fusionnées (PR #1 à #4).

## Phase en cours
Phase 4a — Catalogue (`feat/furniture-catalogue`), PR en cours de fusion. Plan : `docs/plan/04-catalogue.md`.

## Fait (dernières étapes, 5 max)
- Schéma du manifeste, bibliothèque de matériaux (ids stables), 13 meubles procéduraux, chargeur glTF normalisé en cm.
- 4 modèles CC0 Poly Haven (2 canapés, fauteuil, table) ; `npm run assets:fetch` restaure les glTF multi-fichiers.
- Preset `catalogue` vérifié par `visual-check` (pièces reconnaissables, modèles texturés, rien ne flotte).
- 58 tests unitaires, 2 e2e, portes vertes.

## En cours (étape exacte, fichier, ce qui reste)
Fusion de la PR, puis phase 4b `feat/scene-editing` (plan `docs/plan/05-scene-editing.md`).

## Prochaine étape (une ligne : la première action de la prochaine session)
`gh pr list` ; si `feat/furniture-catalogue` est fusionnée, créer `feat/scene-editing` et écrire `docs/plan/05-scene-editing.md`.

## Bloqué / questions pour Benjamin
Aucune. Les canapés Poly Haven sont de style ancien (cuir capitonné) ; le canapé moderne reste procédural tant qu'aucun modèle CC0 moderne n'est trouvé.

## Branche active, dernier commit, PR ouverte
Branche `feat/furniture-catalogue`.
