# Guide d'utilisation — Villa F « LACAPELA » en 3D

Visite virtuelle de la villa, ameublement et décoration à partir des plans. Tout tourne
en local, dans Chrome.

## Installation (une fois)

```
npm install
npx playwright install chromium     # seulement pour les captures et les tests
npm run assets:fetch                # modèles et ciel CC0 (git-ignorés)
```

## Lancer

```
npm run dev
```

puis ouvrir http://localhost:5173. Options d'URL utiles :

| URL | Effet |
|---|---|
| `?preset=sejour-cuisine` | Caméra dans une pièce (noms dans le menu « Vue ») |
| `?preset=rez-top` | Vue de dessus d'un niveau, plafonds coupés |
| `?preset=sud` / `ouest` / `est` / `aerial` | Façades et vue aérienne |
| `&scene=base` | Charge `scenes/base.json` au démarrage |
| `&ui=0` | Masque les panneaux (captures) |
| `&labels=0` | Masque les noms de pièces |
| `&stats=1` | Compteur d'images par seconde |

## Naviguer

- **Orbite** (par défaut) : clic gauche pour tourner, molette pour zoomer, clic droit
  pour déplacer. Le rendu ne se rafraîchit que quand quelque chose change, pour
  ménager la carte graphique.
- **Marche** : choisir « Marche » dans « Caméra », cliquer dans la vue, puis WASD ou
  flèches ; la souris oriente le regard ; Échap pour sortir. Hauteur d'œil 1,60 m,
  pas de collision pour l'instant.
- **Niveau** : sous-sol, rez-de-chaussée, étage ou tous. En vue d'une pièce les
  plafonds sont dessinés ; décocher « Plafonds » pour regarder d'en haut.
- **Soleil** : curseurs mois et heure. Orientation réelle (nord = haut des plans,
  terrasse et balcon à l'ouest, entrée et couvert à l'est).

## Meubler

Le panneau de droite édite la scène courante.

1. **Ajouter** : choisir la pièce, une forme paramétrique (lit, table, canapé…) ou un
   modèle du catalogue, puis « Ajouter ». Le meuble apparaît au centre de la pièce.
2. **Déplacer** : cliquer un meuble pour le sélectionner (cadre orange), le glisser
   sur le sol. Il s'aimante à la grille de 5 cm et se colle dos au mur quand il en est
   proche. Les champs x / y / rot du panneau donnent une position exacte (cm, degrés).
3. **Tourner** : touche `R` (+15°), `Maj+R` (−15°), ou les boutons ±15°.
4. **Dupliquer / Supprimer** : boutons du panneau ou touche `Suppr`.
5. **Matières** : pour une forme paramétrique, « matière » et « accent » ; pour une
   pièce, sol / murs / plafond dans « Finitions de la pièce ».
6. **Annuler / Rétablir** : `Ctrl+Z` / `Ctrl+Y`.

## Enregistrer

- **Enregistrer** (`Ctrl+S`) écrit la scène dans `scenes/<nom>.json`, fichier versionné
  avec git. « Enregistrer sous » crée un nouveau fichier ; « Charger… » en ouvre un.
- **Exporter PNG** télécharge l'image affichée.
- `scenes/base.json` est la scène de référence (séjour-cuisine et chambre parents
  meublés). Les scènes produites par `/deco` s'appellent `scenes/<pièce>-<thème>.json`.

## Décorer à partir d'une image (`/deco`)

1. Déposer une ou plusieurs images dans `inspiration/<thème>/` (par exemple
   `inspiration/scandinave/salon.jpg`).
2. Dans Claude Code : `/deco chambre-2 inspiration/scandinave` (ou `/deco all
   inspiration/scandinave` pour appliquer le thème à toutes les chambres et au séjour).
3. Claude lit l'image, écrit `inspiration/<thème>/proposal.json` (palette, matières,
   meubles, indications de placement), puis lance `npm run deco:apply` qui crée
   `scenes/<pièce>-<thème>.json`, prend des captures avant / après, les vérifie et
   résume en français. Le journal est dans `docs/deco-log.md`.
4. Ouvrir le résultat : `http://localhost:5173/?preset=chambre-2-3&scene=chambre-2-scandinave`,
   puis retoucher à la main et enregistrer.

La proposition est un simple JSON : on peut la corriger (dimensions, couleur, indication
de placement comme « under the window » ou « against the west wall ») et relancer
`npm run deco:apply -- inspiration/<thème>/proposal.json <pièce> <thème>`.

## Captures et vérifications

```
npm run screenshots -- sejour-cuisine-2 rez-top      # PNG dans playwright/screenshots/
VIEWER_SCENE=base npm run screenshots -- chambre-parents-3
npm run test:e2e                                     # tests Playwright
```

Chaque capture prend environ une minute sans carte graphique (SwiftShader).

## Dépannage

- **Ciel gris uni, pas de nuages** : le fichier HDRI manque ; `npm run assets:fetch`.
- **Modèle du catalogue absent (cube rose)** : asset non téléchargé ; même commande.
- **« Enregistrement impossible »** : le serveur de développement n'est pas lancé
  (`npm run dev`) ; en version construite (`npm run build`), seul l'export PNG existe.
- **Rendu saccadé** : rester sur un seul niveau, désactiver les étiquettes, vérifier
  avec `&stats=1`.
