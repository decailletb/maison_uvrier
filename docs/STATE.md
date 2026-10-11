# État du projet — mis à jour 2026-10-11T13:26+02:00

Phases 0 à 6 fusionnées (PR #1 à #8). Cycle d'améliorations en cours.

## Phase en cours
Hors phases : README d'installation, publication GitHub Pages, export IFC pour Archicad
(branche `feat/readme-pages-ifc`).

## Fait (dernières étapes, 5 max)
- `README.md` en français : installation pas à pas (Git présent → Node.js LTS → `git clone` → `npm ci` → `npm run assets:fetch` → `npm run dev`), commandes, publication.
- GitHub Pages : `.github/workflows/pages.yml` (Node 24, `assets:fetch`, build avec `BASE_PATH=/maison_uvrier/`), `base` configurable dans `vite.config.ts`, URLs d'assets via `src/baseUrl.ts`, scènes copiées dans `dist/scenes/` + `index.json` ; en ligne, « Enregistrer » télécharge le JSON.
- Export IFC4 : `src/export/ifc.ts` + `npm run export:ifc` → `archicad/villa-lacapela.ifc` (4 étages dont TOITURE, 35 murs dont acrotère, 22 ouvertures, 13 portes, 9 fenêtres, 9 dalles, 2 escaliers, 17 zones aux noms imprimés, jeu de propriétés LACAPELA). Validé IfcOpenShell 0.9 : 0 erreur de schéma, 92/92 géométries. Mode d'emploi : `archicad/README.md`.
- Toutes portes vertes : typecheck, lint (0 avertissement), 82 tests unitaires, build, 4 e2e.
- Phases 0 à 6 : maquette, catalogue, éditeur, `/deco`, rendu (voir DECISIONS.md).

## En cours (étape exacte, fichier, ce qui reste)
Rien en cours. Reste : ouvrir la PR de `feat/readme-pages-ifc` (gh absent sur ce PC : par le site GitHub), la fusionner, activer Pages.

## Prochaine étape (une ligne : la première action de la prochaine session)
Vérifier que Benjamin a réglé Settings → Pages → Source = GitHub Actions, puis ouvrir l'onglet Actions et contrôler le déploiement de https://decailletb.github.io/maison_uvrier/.

## Bloqué / questions pour Benjamin
- Activer Pages (Settings → Pages → Source : GitHub Actions) : réglage manuel une fois.
- Export IFC non testé dans Archicad lui-même (pas d'Archicad ici) : retour de l'architecte bienvenu.
- `inspiration/sejour/` non suivi par git : à committer par Benjamin s'il le souhaite (lancer `/deco sejour-cuisine inspiration/sejour`).
- Performance Iris Xe toujours à mesurer avec `?stats=1`.

## Branche active, dernier commit, PR ouverte
`feat/readme-pages-ifc`, voir `git log -1`, PR à ouvrir.
