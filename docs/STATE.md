# État du projet — mis à jour 2026-10-15T17:30+02:00

Phases 0 à 6 fusionnées. Cycle d'améliorations : réalisme, site, escalier (branche `feat/realism-site-stairs`).

## Phase en cours
Hors phases : rendu réaliste, parcelle et voisinage, escalier en U, cloison entrée / cuisine.

## Fait (dernières étapes, 5 max)
- GitHub Pages activé par l'API (source GitHub Actions) : https://decailletb.github.io/maison_uvrier/ en ligne, assets servis.
- Escalier en U à 6 marches balancées et mur central (p. 3-5, 9), garde-corps à barreaux noirs côté séjour, garde-corps plein à l'étage ; cloison plâtre entrée / cuisine, entrée en L, cuisine en U avec péninsule et îlot.
- Site d'après le RDPPF (parcelle 17030, 419 m²) et Google Maps : 5 villas voisines, jardins, terrasse bois, enrobé, cabanon, route, voie ferrée, panneaux solaires.
- Réalisme : occlusion ambiante N8AO, bloom, SMAA, ombres douces ; menuiseries blanc / anthracite, seuils granit, portes ouvertes, plinthes ; luminaires des photos et « Lampes allumées » ; ciel qui s'assombrit le soir ; scène `base` chargée par défaut.
- Toutes portes vertes : typecheck, lint, 102 tests unitaires, build, 4 e2e.

## En cours (étape exacte, fichier, ce qui reste)
Rien en cours.

## Prochaine étape (une ligne : la première action de la prochaine session)
Mesurer les performances sur l'ordinateur de Benjamin (`?stats=1`, rendu « Réaliste » vs « Rapide ») ; fusionner les menuiseries en une géométrie si les draw calls dépassent ~400.

## Bloqué / questions pour Benjamin
- Les cotes de l'escalier diffèrent de ~10 cm entre niveaux dans les données extraites ; vérifier sur place si besoin.
- Position exacte des villas voisines (décalage en escalier p. 1) inconnue : alignées dans le modèle.
- Export IFC non testé dans Archicad.

## Branche active, dernier commit, PR ouverte
`feat/realism-site-stairs`, voir `git log -1`, PR à fusionner.
