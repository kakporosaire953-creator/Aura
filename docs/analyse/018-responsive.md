# 018 — Responsive : contrat de mise en page 320 px → 1600 px

**Date** : 2026-10-23 · **Branche** : `arena/3630913f-aura`

## Demande

« Le site a un problème de responsive. Fais bien la responsive sur tous les
formats possibles. »

## Ce qui a été trouvé

Le balayage du CSS (`src/index.css`, ~7 600 lignes) a relevé quatre familles
de défauts, toutes corrigées ici :

| Défaut | Où | Conséquence réelle |
|---|---|---|
| `repeat(auto-fill, minmax(290px, 1fr))` | `.memoire-liste` (et 5 autres grilles) | à 320 px, la colonne disponible (~275 px) est plus étroite que la piste : 15 px de débordement |
| `min-height: 100vh` | `.chat-page`, `.module-page` | la barre d'URL mobile mange la hauteur : le composeur passe sous le bord |
| `max-height: 86vh` | `.dlg` | un dialogue long dépasse sous la barre du navigateur mobile |
| `display: flex` sans `flex-wrap` | `.dlg-pied`, `.page-module-actions`, `.studio-revision`, `.session-ligne`, `.echeance-ligne` | avec un libellé long (ou une police agrandie), les boutons sortent de l'écran |

Deux manques d'ergonomie tactile ont aussi été corrigés : les actions d'une
conversation (renommer, supprimer) n'apparaissaient qu'au survol — donc
jamais sur téléphone ; et le sélecteur d'export à huit formats pouvait
pousser son bouton hors de la page à 320 px.

## Le contrat posé

Les règles vivent dans la section finale de `src/index.css`
(« RESPONSIVE — contrat de mise en page »). Elles sont numérotées :

1. **Grilles** — toute piste `auto-fill` / `auto-fit` est écrite
   `minmax(min(100%, Npx), 1fr)` : une piste ne peut jamais être plus large
   que son conteneur.
2. **Hauteurs** — `100dvh` (avec repli `100vh`) partout où la page doit
   occuper l'écran ; `svh` pour les bannières.
3. **Contenus extensibles** — `overflow-wrap` sur les textes venus de
   l'utilisateur (titres de missions, de conversations, adresses e-mail,
   URLs) et `min-width: 0` sur les parents flex/grid.
4. **Barres d'actions** — `flex-wrap: wrap` ; en dessous de 420 px, les
   boutons passent en pleine largeur.
5. **Tableaux** — défilement dans leur propre cadre (`.doc-tableau-defile`,
   `.md-tableau-wrap`), jamais la page.
6. **Tactile** — cibles ≥ 44 px, champs à 16 px minimum sur pointeur grossier
   (évite le zoom iOS), actions de liste visibles sans survol.

Points de rupture couverts et ce qu'ils changent :

| Largeur | Changement principal |
|---|---|
| ≥ 1440 px | mesure de lecture bornée (1 200 px de contenu, 76 caractères de texte) |
| 1 100–1 439 px | gabarit nominal, barre latérale complète |
| 900–1 099 px | barre latérale en rail d'icônes (84 px) |
| ≤ 899 px | barre latérale en tiroir, barre d'onglets basse |
| ≤ 1 020 px | atelier sur une colonne, historique horizontal, kanban sur 2 colonnes |
| ≤ 900 px | documentation : sommaire au-dessus de l'article |
| ≤ 720 px | discussion sur une colonne, kanban sur 1 colonne, dialogues et listes empilés |
| ≤ 640 px | tableaux de bord sur une colonne |
| ≤ 560 px | pagination de documentation sur toute la largeur |
| ≤ 420 px | boutons pleine largeur, dialogue resserré, export pleine largeur |
| ≤ 360 px | échelle typographique réduite, barre haute compacte (couvre 320 px) |
| paysage ≤ 520 px de haut | bannière sans hauteur plein écran, menu plus court |

## Vérification — ce qui est prouvé, et ce qui ne l'est pas

`tests/responsive.test.ts` (34 assertions) verrouille le contrat ci-dessus en
lisant le CSS : absence de `100vw`, `overflow-x: clip` sur `html`/`body`,
repli `dvh`, pistes bornées à 100 %, repli de chaque gabarit au bon point de
rupture, présence de chaque point de rupture, réservation des zones sûres
(`env(safe-area-inset-bottom)`), cibles tactiles.

**Ce test ne dessine pas la page.** Aucun navigateur n'est disponible dans
l'environnement de développement (les bibliothèques système de Chromium sont
absentes et l'installation n'est pas autorisée). Les positions exactes, les
débordements de texte et les animations n'ont donc pas été observés à
l'écran ; ils ont été déduits des règles. La vérification à l'œil reste à
faire dans le navigateur, aux largeurs listées ci-dessus.

## Ce qui reste ouvert

- La barre d'onglets basse et le composeur du chat réservent la zone sûre des
  iPhone ; sur Android avec clavier virtuel ouvert, le comportement dépend du
  navigateur (`dvh` suit le clavier sur Chrome, pas sur tous les moteurs).
- La galerie de la page d'accueil conserve son défilement horizontal : c'est
  un choix, pas un défaut.
