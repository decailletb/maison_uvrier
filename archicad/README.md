# Villa F « LACAPELA » — maquette pour Archicad

`villa-lacapela.ifc` est la maquette BIM de la villa au format **IFC4**, le format
d'échange ouvert qu'Archicad ouvre nativement. Archicad n'a pas de format natif
(`.pln`) que d'autres logiciels puissent écrire ; on ouvre donc l'IFC puis on
l'enregistre en `.pln`.

## Ouvrir dans Archicad

1. **Fichier → Ouvrir…**, choisir `villa-lacapela.ifc` (« Ouvrir comme nouveau projet »).
2. Garder le traducteur IFC par défaut (« General Translator »). L'unité du fichier est
   le millimètre ; Archicad la lit seule.
3. **Fichier → Enregistrer sous… → Fichier de projet Archicad (.pln)**.

Pour l'ajouter à un projet existant : **Fichier → Interopérabilité → Fusionner**.

## Contenu

| Élément IFC | Contenu | Dans Archicad |
| --- | --- | --- |
| Étages | SOUS-SOL −2.86, REZ DE CHAUSSEE ±0.00 (alt. 497.72), ETAGE +2.85, TOITURE +5.35 | Étages |
| `IfcWall` | 31 murs extérieurs et intérieurs, acrotère (h. +6.06) | Murs |
| `IfcOpeningElement` + `IfcDoor` / `IfcWindow` | 22 ouvertures, références de menuiserie 001 à 012 | Portes, fenêtres |
| `IfcSlab` | Radier, dalles d'étage avec trémies d'escalier, toiture, terrasse, couvert, balcon | Dalles |
| `IfcStair` | Volées droites (marches pleines) | Escaliers |
| `IfcColumn`, `IfcRailing` | Poteaux du couvert, garde-corps vitré du balcon | Poteaux, garde-corps |
| `IfcSpace` | 17 pièces, noms tels qu'imprimés sur les plans | Zones (numéro SS.01, R.01, E.01…) |

Chaque élément porte un jeu de propriétés **LACAPELA** : page du plan d'origine,
indicateur « Cote estimée », note de relevé, et pour les pièces la surface imprimée sur
le plan et la surface du modèle.

## Précision

La maquette est relevée sur des plans **scannés** (pas de fichier DAO d'origine). Les
cotes imprimées sont respectées ; les épaisseurs de murs, les escaliers et certaines
ouvertures sont estimés et marqués « Cote estimée = vrai ». Hypothèses : nord en haut
des plans, escaliers en volées droites. À vérifier sur place avant tout usage
d'exécution.

## Régénérer le fichier

Les données viennent de `src/data/house/*.json` (les mêmes que la maquette 3D web).
Après une correction des données :

```text
npm run export:ifc
```
