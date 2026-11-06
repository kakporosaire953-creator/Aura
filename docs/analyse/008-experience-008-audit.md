# 008 — Refonte d'expérience AURA — Rapport d'audit initial (Phase A)

Date : 2026-11-06 · Branche de travail : `arena/1010a3ec-aura` (imposée par la
plateforme ; la branche `feat/aura-experience-responsive-redesign` demandée
n'est pas disponible ici — tout le travail est porté par la session et une
PR unique sera ouverte depuis cette branche).

## 1. Routes examinées (16)

| Route | Page | Type | Audit |
|---|---|---|---|
| `/` | LandingPage | publique | ✅ examinée (hero, fil, capacités, galerie, tarifs, CTA) |
| `/documentation` | DocumentationPage | publique | ✅ examinée |
| `/login`, `/register` | AuthPage | publique | ✅ examinées |
| `/app` | EspacePage | applicative | ✅ (parcours 007) |
| `/chat`, `/chat/:id` | ChatPage | applicative | ✅ (parcours 007) |
| `/historique` | HistoriquePage | applicative | ✅ |
| `/projets`, `/projets/:id` | ProjetsPage | applicative | ✅ |
| `/missions` | MissionsPage | applicative | ✅ |
| `/explore` | ExplorePage | applicative | ✅ |
| `/studio` | StudioPage | applicative | ✅ |
| `/memoire` | MemoirePage | applicative | ✅ |
| `/parametres` | ParametresPage | applicative | ✅ |
| `*` | NotFoundPage | publique | ✅ |

## 2. Composants réutilisables identifiés

- `components/brand/AuraLogo` — logo (identité, **intouchable**).
- `components/layout/SiteChrome` — `SiteNav` (burger + menu mobile + FR/EN +
  thème + bascule simulation) et `SiteFooter`.
- `components/motion` — `Tilt`, `useReveal`, `LottieVisuel`.
- `components/ui` — `Primitives` (boutons, champs), `Markdown`.
- `src/app/dictionaries.ts` — tout le contenu FR/EN (1 995 lignes).
- `src/index.css` — feuille unique (5 868 lignes), quelques doublons
  (`.nav-burger` défini 2×, media queries dispersées).

## 3. Problèmes identifiés (preuves : captures `/home/user/audit-captures/experience-008/avant/`)

### Critiques (mission « non terminée » si non corrigés)
1. **Sélecteur FR/EN absent du menu mobile** — dans la barre du haut seulement
   (test `parcours-experience.cjs` : ❌), entassé avec thème + CTA coupé au
   bord droit (capture `navbar-mobile-ouverte.png`).
2. **Préférence de langue non conservée** après rechargement (❌ testé).
3. **Tarifs** : aucun montant FCFA (« Gratu it / Bientôt annoncé »), quotas
   **inventés** (« 30 unités IA par mois », « 10 recherches sourcées »…) et
   boutons « Être prévenu » sans destination réelle (❌×4 testés).
4. **Documentation** : 6 fiches toutes « En rédaction » / « À venir » — aucune
   page d'article réelle, contenus vagues (❌×2 testés). Sujet « Comptes &
   équipes » alors que les équipes n'existent pas (présentation trompeuse).
5. **Galerie mobile** : le défilement existe (`snap: x mandatory`) mais
   l'intention de l'animation desktop (piste épinglée GSAP + carte active en
   perspective + indices) est perdue ; `scroll-snap-type: x mandatory`
   risque de piéger le défilement vertical ; cartes disproportionnées
   (capture `galerie-mobile.png`).
6. **Bouton « Connexion » du menu mobile sans libellé visible** (fond encre
   sur encre — capture `navbar-mobile-ouverte.png`).

### Direction artistique
7. **Petits traits décoratifs** : `.kicker::before` (34×2 px) devant tous les
   kickers de section + variante galerie — à supprimer (règle explicite §3 de
   la mission). Les rubans SVG du hero (`hero-traits`) appartiennent à
   l'identité « trois rubans, une flamme » : **conservés**.
8. Hero : promesse correcte mais composition mobile à resserrer (scène
   réduite, titre OK dans la capture).
9. Section « fil » : grands vides sur mobile (SVG non adapté), à densifier.

### Divers
10. `.nav-burger` dupliqué dans le CSS (lignes 354 et 5085) ; media queries
    dispersées (14 blocs `@media`).
11. `BandeauLogos` présente des logos d'écosystème — à vérifier qu'aucun
    n'est présenté comme partenaire (conformité « pas de faux partenariats »).

### Vérifié comme SAIN (aucune action)
- **Aucun débordement horizontal** sur les 4 routes publiques × 12 largeurs
  (320→1920 px) — la base responsive est saine (✅ matrice).
- Menu : ouverture au clic, fermeture Escape, fermeture après navigation ✅.
- FR/EN : traduction fonctionnelle, page courante préservée ✅.
- 0 erreur JS sur les pages publiques ✅.
- Hero : titre non coupé sur mobile, CTAs accessibles ✅ (capture).

## 4. Fonctionnalités réellement opérationnelles (à présenter telles quelles)

Assistant conversationnel (streaming, arrêt, régénération), historique,
projets, missions (validation), Explorer (recherche sourcée), studio
(générations textuelles), mémoire/paramètres, thème clair/sombre, FR/EN,
API v1 (documentée), export PDF + suppression de compte (005).
**En développement / à venir** : langues locales, voix, compréhension
contextuelle béninoise, génération d'images, pièces jointes, paiement en
ligne, espaces équipes.

## 5. Plan d'exécution (phases B→I)

- **B — DA** : supprimer les traits décoratifs ; consolider boutons/états.
- **C — Accueil** : hero + fonctionnalités honnêtes + galerie mobile
  réellement pensée tactile + **section vision locale** (axes présentés
  comme évolutions, jamais comme disponibles).
- **D — Navigation** : barre mobile allégée, menu reconstruit (FR/EN + thème
  + actions dans le menu, libellés visibles, focus, scroll lock, aria).
- **E — Tarifs** : montants FCFA exacts (1 500/mois, 21 500/mois,
  20 000/an), suppression des quotas inventés, CTA honnêtes.
- **F — Documentation** : vraies pages d'articles FR/EN, ancrées dans
  l'interface réelle, sans placeholders.
- **G — Responsive** : corrections ciblées suite à la matrice.
- **H — Composants** : inventaire boutons, harmonisation états.
- **I — QA** : `parcours-experience.cjs` (avant/après), suites 007, captures.

Captures « avant » : `/home/user/audit-captures/experience-008/avant/`
(11 PNG + `resultats.json`).
