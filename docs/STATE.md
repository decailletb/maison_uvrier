# État du projet — mis à jour 2026-10-09T17:00+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phases 0 à 5 fusionnées (PR #1 à #7).

## Phase en cours
Phase 6 — Polish (`feat/render-quality`). Plan : `docs/plan/07-polish.md`.

## Fait (dernières étapes, 5 max)
- Tone mapping ACES, remplissage intérieur plus fort, peinture plus blanche, ombres douces, objectif plus large dans les petites pièces.
- Rendu à la demande en mode orbite (continu en marche), carte d'ombres 1536, `?stats=1`, journal des draw calls.
- `docs/USER-GUIDE.md` (français) : installation, navigation, édition, enregistrement, `/deco`, dépannage.
- 74 tests unitaires et 4 e2e verts après le passage au rendu à la demande.

## En cours (étape exacte, fichier, ce qui reste)
`visual-check` de l'éclairage (murs blancs ?) sur chambre-2-enfant et base ; ajustements ; portes ; PR.

## Prochaine étape (une ligne : la première action de la prochaine session)
Lire le verdict éclairage ; ajuster `src/scene/components/Environment.tsx` si besoin ; `build-check` ; PR `feat/render-quality` ; merge ; STATE final.

## Bloqué / questions pour Benjamin
Aucune. Budget de performance Iris Xe non mesurable ici (SwiftShader) : à vérifier sur la machine avec `?stats=1`.

## Branche active, dernier commit, PR ouverte
Branche `feat/render-quality`, pas de PR.
