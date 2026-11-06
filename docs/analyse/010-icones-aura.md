# 010 — Jeu d'icônes AURA : remplacer Font Awesome par un langage de signes maison

Date : 2026-11-06 · Branche : `arena/5ed22794-aura` · Base : `ba5825e7` (main après PR #23)

> Branche imposée par la plateforme de session. Tout le travail y est commité et une
> PR unique en est ouverte. **Aucune fusion, aucun déploiement** n'a été déclenché.

## 1. Demande

> « Les icônes du site sont génériques. Je veux quelque chose qui appartienne à AURA. »

Concrètement : plus de Font Awesome, plus de pictogrammes « clichés d'IA » (la baguette
magique `wand-magic-sparkles`, utilisée 14 fois, en était le symbole le plus visible),
et un jeu de signes qui prolonge l'identité « rubans & sculpture ».

Deux décisions validées par le propriétaire :

1. **Périmètre** : les **113 usages** présents dans l'interface (pas seulement l'accueil).
2. **Trait** : **éditorial fin** — grille 24, trait 1,75 px, extrémités arrondies,
   couleur héritée (`currentColor`), aucune police d'icônes externe.

## 2. Inventaire de départ

| Mesure | Valeur |
|---|---|
| Usages d'icônes dans `src/` | **113** (balises `<i className="fa-solid …">`) |
| Noms distincts effectivement utilisés | **65** |
| Noms les plus fréquents | `wand-magic-sparkles` (14), `list-check` (12), `magnifying-glass` (9), `plus` (8), `trash` (6), `rocket` (6), `comments` / `comment-dots` / `code` (6) |
| Chargement | `@fortawesome/fontawesome-free` (paquet npm), CSS importé dans `src/main.tsx` |
| Cas particulier | `fa-brands fa-openai` dans le bandeau « écosystème » de l'accueil (seul logo en police) |

## 3. Langage de dessin

Une seule grammaire pour tout le jeu :

- **Grille** 24 × 24, **un seul trait** de 1,75 px, `stroke-linecap` et `stroke-linejoin`
  arrondis, `fill: none` par défaut (option `rempli` pour les formes pleines).
- **Couleur héritée** : `currentColor` — les icônes prennent l'encre, le vert, l'or ou le
  feu selon le contexte, sans variante de fichier.
- **Taille** en `em` : l'icône suit la typographie du bloc qui la porte.
- **Accessibilité** : `aria-hidden="true"` et `focusable="false"` par défaut, l'icône est
  décorative ; le sens est toujours porté par le texte ou le `aria-label` du contrôle.

### Signes dessinés spécifiquement (et non empruntés au répertoire commun)

| Signe | Dessin | Remplace |
|---|---|---|
| `studio` | **ruban qui se déplie en plume** (nib + encre) | `wand-magic-sparkles` — le cliché explicitement refusé |
| `creation` | cadre + arc de ruban | `wand-magic-sparkles` dans les états vides |
| `experimentation` | fiole avec ménisque | `flask` |
| `brain` | deux lobes symétriques | `brain` |
| `file-lines` | feuille à lignes + coin plié | `file-lines` |
| `earth-africa` | globe, méridiens décalés | `earth-africa` |
| `shield-check` | écu + coche | `shield-halved` |
| `spinner` | arc ouvert (rotation douce) | `circle-notch` + `fa-spin` |

Les 60 autres noms sont redessinés dans la même grille et le même trait ; aucun chemin
n'est copié d'une bibliothèque existante.

### Compatibilité du contenu

Les textes éditoriaux portaient des noms Font Awesome (`icone: 'fa-rocket'`). Deux
garanties :

1. le composant retire un éventuel préfixe `fa-solid ` ou `fa-` ;
2. une table `ALIAS` traduit les anciens noms vers les noms sémantiques.
Les valeurs de `src/app/dictionaries.ts` et `src/app/docs.ts` ont en plus été
normalisées (sans préfixe), et un contrôle automatique vérifie qu'**aucun nom utilisé
ne retombe sur le repli** (petit losange) : **65/65 résolus**.

## 4. Mise en œuvre

| Fichier | Changement |
|---|---|
| `src/components/ui/Icone.tsx` | **nouveau** — jeu complet (`DESSINS`), alias, dessins maison, composant `<Icone nom taille rempli tourne className />` |
| 17 fichiers `src/**/*.tsx` | 130 balises `<i className="fa-solid …">` → `<Icone … />`, y compris les cas dynamiques (`item.icone`, thème soleil/lune, `copie ? check : copy`, `icone ?? inbox`) |
| `src/main.tsx` | import du CSS Font Awesome supprimé |
| `package.json` | dépendance `@fortawesome/fontawesome-free` retirée (plus aucune référence) |
| `src/pages/LandingPage.tsx` | logo OpenAI en police → SVG simple-icons ; l'entrée qui n'avait pas de chemin SVG est retirée du bandeau (les 10 autres restent) |
| `src/index.css` | `.icone`, `.icone-tourne` (+ `prefers-reduced-motion`), et **23 règles qui ciblaient la balise `i`** étendues à `.icone` |
| `src/app/dictionaries.ts` | libellés des 9 types de création Studio (4 seulement existaient) |
| `tests/parcours-acceptation.cjs` | port serveur configurable (`AURA_BASE`), comme le harnais d'expérience |

## 5. Défauts trouvés en chemin (et corrigés)

| # | Défaut | Preuve | Correction |
|---|---|---|---|
| 1 | `.etape-icone` appliquait un dégradé `background-clip: text` : un tracé SVG y devient **invisible** | lecture CSS | couleur pleine `--vert-profond` pour l'icône d'étape |
| 2 | `.etat .icone` héritait d'un `display: block` : l'icône d'état se collait au bord gauche, texte centré | capture `icons-010/studio.png` (avant correction) | `display: inline-block` + marge auto |
| 3 | **5 des 9 types de création** affichaient leur clé brute (`publication`, `presentation`, `code`, `plan`, `creatif`) faute de libellé | capture Studio | `styles` complétés en FR **et** EN (9/9) |
| 4 | Mot-symbole « Aura » codé en dur `#12211B` : **illisible en thème sombre** | capture `icons-010/sombre-accueil.png` | couleur liée à `var(--encre)`, donc au thème |
| 5 | `fa-spin` (classe Font Awesome) utilisée pour les rotations | `grep` | prop `tourne` → `.icone-tourne`, ralentie sous `prefers-reduced-motion` |

## 6. Poids transféré (mesuré, pas estimé)

Build de `HEAD` (avec Font Awesome) comparé au build de la branche, même machine :

| Ressource | Avant | Après | Écart |
|---|---|---|---|
| CSS | 190 kB | 107 kB | **−83 kB** |
| Polices d'icônes (`woff2`) | 4 fichiers, 253 kB | 0 | **−253 kB, 4 requêtes en moins** |
| JS principal | 646,0 kB (gzip 199,2) | 658,2 kB (gzip 204,0) | +12,2 kB (+4,8 gzip) |
| **Total transféré** | **≈ 1 089 kB** | **≈ 765 kB** | **≈ −324 kB** |

Le jeu d'icônes est du SVG en ligne : aucun téléchargement de police, aucun FOUT, et il
fonctionne hors ligne. C'est ce qui compte sur un réseau mobile contraint.

## 7. Vérifications réellement exécutées

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | 0 erreur |
| `npm test` (serveur, API, entrepôts, IA) | **61/61** |
| `tests/parcours-acceptation.cjs` | **13/13** |
| `tests/parcours-experience.cjs` | **28/28** |
| Contrôle « aucun nom d'icône sans dessin » | **65/65** |
| Débordement horizontal 320 px (public + 8 pages applicatives) | **0 px** |
| Erreurs JS console sur les pages publiques | **0** |
| Thème sombre (accueil, documentation, espace) | icônes lisibles, contraste du mot-symbole rétabli |

Captures : `/home/user/audit-captures/icons-010/` — `accueil`, `capacites`, `vision-mobile`,
`documentation`, `doc-studio`, `workspace`, `studio`, `missions`, `parametres`,
`assistant`, `sombre-accueil`, `sombre-documentation`, `mobile-320`, `mobile-320-menu`.

Note d'environnement : l'acceptation a été lancée avec le fournisseur `mock`
(`AI_DEFAULT_PROVIDER=mock`, réservé aux tests) car aucun `.env` n'est présent dans ce
bac à sable et les fournisseurs IA y sont injoignables. Sans ce mode, l'étape « réponse
de l'assistant » ne peut pas aboutir ici — ce n'est pas lié aux icônes.

## 8. Limites assumées

- **Pas de test sur appareil physique** : les captures sont produites en Chromium sans
  interface, à 320, 390, 1440 et 1920 px. Le rendu tactile réel reste à confirmer par le
  propriétaire.
- La sculpture WebGL n'apparaît pas dans les captures hors interface (pas de GPU).
- Le bandeau « écosystème » perd l'entrée OpenAI, faute de chemin vectoriel disponible
  dans `simple-icons` pour cette version ; les 10 autres marques restent affichées.
- Les icônes décoratives `<i>` des points colorés (héros, bandeau de mots) n'ont pas été
  remplacées : ce ne sont pas des pictogrammes mais des pastilles de couleur.

## 9. Reste ouvert (hors périmètre)

Droits d'usage des logos de tiers, textes légaux, droits d'abonnement, test tactile sur
appareil réel.
