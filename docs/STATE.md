# État du projet — mis à jour 2026-10-09T17:10+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 6 : toutes fusionnées (PR #1 à #8).

## Phase en cours
Aucune phase ouverte : les six phases du brief sont livrées. Prochain cycle = améliorations.

## Fait (dernières étapes, 5 max)
- Phase 6 fusionnée : tone mapping ACES, remplissage intérieur neutre (murs ombrés 205+, sans dominante bleue), rendu à la demande, objectif large dans les petites pièces, `docs/USER-GUIDE.md`.
- Phase 5 : `/deco` complet (agent → proposition → `deco:apply` → scène → captures → verdict), exécution réelle sur IMG_5505 → `scenes/chambre-2-enfant.json`.
- Phase 4 : catalogue (4 modèles CC0, 13 formes paramétriques, matériaux) et éditeur (sélection, glisser, aimantation, finitions, annuler/rétablir, enregistrement dans `scenes/`).
- Phases 0 à 3 : scaffold, données des plans, intérieur, enveloppe, ciel et soleil.
- 74 tests unitaires, 4 e2e, toutes portes vertes sur `master`.

## En cours (étape exacte, fichier, ce qui reste)
Rien en cours. Pistes pour la suite (par ordre d'intérêt) :
1. Mesurer les FPS sur l'Iris Xe (`?stats=1`, un niveau puis tous) et ajuster (ombres, arêtes de murs).
2. Modèles CC0 modernes (canapé, lit) : chercher sur Sketchfab CC0 via `asset-fetcher`.
3. Textures PBR ambientCG pour `parquet-oak`, `tile-light`, `paint-white` (mêmes ids).
4. Escaliers en vrai tracé (volées + paliers) à partir d'une lecture ciblée des pages 3-5.
5. Collisions en mode marche ; portes intérieures avec vantail ouvert.

## Prochaine étape (une ligne : la première action de la prochaine session)
Si Benjamin n'a rien demandé d'autre : créer `feat/perf-iris-xe`, ouvrir `http://localhost:5173/?preset=rez-top&stats=1` sur sa machine (ou lui demander les FPS) et traiter la piste 1.

## Bloqué / questions pour Benjamin
- Aucune image dans `inspiration/` : la photo IMG_5505 a servi de substitut pour `/deco`. Déposer une vraie image et lancer `/deco <pièce> inspiration/<thème>`.
- Performance Iris Xe non mesurable depuis cette session (rendu logiciel) : vérifier avec `?stats=1`.
- Hypothèses à confirmer si besoin : orientation (nord = haut des plans), escaliers en volées droites, photos possiblement d'une autre villa (voir DECISIONS.md).

## Branche active, dernier commit, PR ouverte
`master`, aucune PR ouverte.
