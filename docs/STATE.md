# État du projet — mis à jour 2026-10-09T14:16+01:00

Session 1 démarrée le 2026-10-09 à 13:54. Phase 0 fusionnée (PR #1).

## Phase en cours
Phase 1 — Plan data (`feat/plan-data`). Plan : `docs/plan/01-plan-data.md`.

## Fait (dernières étapes, 5 max)
- Phase 0 fusionnée : scène vide, portes vertes, agents, skills, CLAUDE.md.
- `src/data/schema.ts` (zod), `src/data/geometry.ts` + tests, loader `src/data/house/index.ts`.
- Tests de cohérence `src/data/house.test.ts` écrits (surfaces ±5 %, murs extérieurs fermés, ouvertures dans leur mur, SIA).

## En cours (étape exacte, fichier, ce qui reste)
Extraction des trois niveaux par trois agents Sonnet en parallèle (pages 3, 4, 5) vers
`src/data/house/{sous-sol,rez,etage}.json`. Les fichiers contiennent `{}` tant que
l'extraction n'est pas écrite. Reste : réconcilier les contours extérieurs entre niveaux,
lancer `npm test`, documenter les écarts dans DECISIONS.md.

## Prochaine étape (une ligne : la première action de la prochaine session)
Si les JSON de niveau valent encore `{}` : relancer l'extraction (prompt dans `.claude/agents/geometry-extractor.md`, un agent par page 3/4/5) ; sinon `npm test` et corriger.

## Bloqué / questions pour Benjamin
Aucune. Hypothèse : élévation « SUD » = façade du balcon/terrasse (côté x = 0 ou 1055 à confirmer après extraction).

## Branche active, dernier commit, PR ouverte
Branche `feat/plan-data`, pas de PR ouverte.
