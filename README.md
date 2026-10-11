# Maison Uvrier

Maquette 3D interactive de la villa F « LACAPELA » à Uvrier, construite à partir des
plans scannés (`Plans.pdf`) et des photos (`photos/`) : visite, ameublement et
décoration dans le navigateur.

- **Version en ligne** : <https://decailletb.github.io/maison_uvrier/> (mise à jour à
  chaque push sur `master`, voir [Publication](#publication-sur-github-pages)).
- **Fichier pour l'architecte (Archicad)** : [`archicad/villa-lacapela.ifc`](archicad/villa-lacapela.ifc),
  mode d'emploi dans [`archicad/README.md`](archicad/README.md).
- **Guide d'utilisation** (navigation, meubler, décorer) : [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md).

## Installation sur un PC Windows

Prérequis : Git est installé (`git --version` répond dans un terminal).

### 1. Installer Node.js

1. Télécharger la version **LTS** (22 ou plus récente, 24 recommandée) sur
   <https://nodejs.org/fr/download> et lancer l'installateur avec les options par défaut.
2. Fermer puis rouvrir le terminal (PowerShell ou Git Bash), puis vérifier :

   ```text
   node --version     # v22.12 ou plus
   npm --version
   ```

### 2. Récupérer le projet

Dans le dossier où ranger le projet (par exemple `C:\repo`) :

```text
git clone https://github.com/decailletb/maison_uvrier.git
cd maison_uvrier
```

### 3. Installer les dépendances

```text
npm ci
```

`npm ci` installe exactement les versions de `package-lock.json` (quelques minutes la
première fois). Les avertissements `npm warn` peuvent être ignorés.

### 4. Télécharger les modèles 3D et le ciel

Les meubles, textures et le ciel HDRI (licence CC0) ne sont pas dans git. Les
télécharger une fois :

```text
npm run assets:fetch
```

Sans cette étape, le site fonctionne quand même, avec un ciel uni et des cubes roses à
la place des meubles du catalogue.

### 5. Lancer la maquette

```text
npm run dev
```

puis ouvrir <http://localhost:5173> dans Chrome ou Edge. `Ctrl+C` dans le terminal
arrête le serveur. En local, le bouton **Enregistrer** écrit directement dans
`scenes/<nom>.json`.

### Mettre à jour plus tard

```text
git pull
npm ci
npm run assets:fetch
npm run dev
```

### Facultatif : tests et captures

```text
npx playwright install chromium     # une fois, navigateur des tests et captures
npm test                            # tests unitaires
npm run test:e2e                    # test de bout en bout
npm run screenshots -- rez-top      # captures dans playwright/screenshots/
```

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement sur <http://localhost:5173> |
| `npm run build` | Version statique dans `dist/` |
| `npm run preview` | Sert `dist/` pour la vérifier |
| `npm run assets:fetch` | Télécharge les modèles, textures et HDRI manquants |
| `npm run export:ifc` | Régénère `archicad/villa-lacapela.ifc` depuis les données des plans |
| `npm run deco:apply -- <proposition> <pièce\|all> <thème>` | Applique une proposition de décoration |
| `npm test` / `npm run test:e2e` | Tests unitaires / de bout en bout |

## Publication sur GitHub Pages

Le workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) construit le
site (dépendances, assets CC0, `npm run build`) et le publie à chaque push sur `master`.

Réglage à faire une seule fois sur GitHub : **Settings → Pages → Build and deployment →
Source : GitHub Actions**. Le premier déploiement part au push suivant sur `master`, ou
à la main depuis l'onglet **Actions → pages → Run workflow**.

Différences avec la version locale :

- Le site est **public** : toute personne qui a l'adresse voit la maquette, comme le
  dépôt lui-même (déjà public, plans et photos compris).
- Les scènes de `scenes/` sont en lecture seule. **Enregistrer** télécharge le fichier
  `<nom>.json` ; pour le garder, le copier dans `scenes/` puis commit et push.

## Organisation

```text
src/        code de la maquette (données des plans, géométrie, interface)
scenes/     scènes meublées (JSON)
assets/     manifeste des modèles CC0 (fichiers téléchargés par assets:fetch)
archicad/   export IFC pour Archicad
docs/       guide d'utilisation, état du projet, décisions
```
