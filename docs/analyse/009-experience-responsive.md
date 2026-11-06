# 009 — Refonte d'expérience AURA : accueil, navigation, tarifs, documentation, responsive

Date : 2026-11-06 · Branche : `arena/1010a3ec-aura` · Base : `b76073cb` (main après PR #22)

> Branche demandée : `feat/aura-experience-responsive-redesign`. Elle n'est pas
> disponible dans cet environnement : la plateforme impose la branche de session
> `arena/1010a3ec-aura`. Tout le travail y est commité et une PR unique en est
> ouverte. **Aucune fusion, aucun déploiement** n'a été déclenché.

## 1. Rapport d'audit initial

Voir `docs/analyse/008-experience-008-audit.md` : inventaire des 16 routes,
composants réutilisables, problèmes identifiés, fonctionnalités réellement
opérationnelles et plan par phases.

## 2. Routes examinées (17 après ajout des articles)

Publiques : `/`, `/documentation`, **`/documentation/:slug` (nouveau)**,
`/login`, `/register`, `*` (404).
Applicatives : `/app`, `/chat`, `/chat/:id`, `/projets`, `/projets/:id`,
`/missions`, `/historique`, `/explore`, `/studio`, `/memoire`, `/parametres`.

## 3. Problèmes identifiés → traitement

| # | Problème (preuve) | Traitement |
|---|---|---|
| 1 | Sélecteur FR/EN absent du menu mobile (test ❌, capture `avant/navbar-mobile-ouverte.png`) | Sélecteur intégré au panneau mobile (`nav-mobile-outils`) **et** conservé en barre desktop |
| 2 | Préférence de langue non conservée (❌) | Vérifié : persistance `localStorage.aura_lang` opérationnelle ; test corrigé (il réinitialisait la langue à chaque navigation) — ✅ |
| 3 | Tarifs sans FCFA, quotas inventés, CTA « Être prévenu » sans destination (❌×4) | Montants exacts du propriétaire, plus aucune limite inventée, CTA vers `/register` |
| 4 | Documentation entièrement « En rédaction » / « À venir » (❌×2) | 7 guides rédigés FR/EN (≈930 lignes de contenu), page d'article dédiée |
| 5 | Blocs `[data-reveal]` jamais observés → **contenus invisibles** (en-têtes de sections, héros de /documentation) | Observateur global `useRevealGlobal` (IntersectionObserver + MutationObserver + filet de sécurité) |
| 6 | `.btn-primaire` **sans aucun style** (EspacePage, ParametresPage) | Système de boutons consolidé (7 variantes, états hover/focus/active/disabled/loading) |
| 7 | Petits traits décoratifs devant les titres (`.kicker::before`, `.capacite-trait`) | **Supprimés** (règle §3) |
| 8 | Menu mobile : CTA coupé, « Connexion » illisible, pas de verrou de défilement, focus non piégé | Panneau plein écran, voile, scroll lock, piège à focus, libellés contrastés |
| 9 | « Aura » affiché deux fois dans la barre | Doublon retiré (le logo contient déjà le mot-symbole) |
| 10 | Hero : promesse et CTA lisibles seulement après ~2 s | Timeline resserrée : titre + texte + CTA lisibles en < 1 s |
| 11 | Galerie mobile : intention desktop perdue, `scroll-snap: mandatory` piégeant | Défilement tactile avec carte active, indices, `proximity`, `touch-action: pan-x pan-y` |
| 12 | Pas de lien d'évitement sur `/login`, `/register` ; page d'article vide au chargement du module | Lien d'évitement ajouté ; fallback de chargement visible |

## 4. Nouvelle structure de la page d'accueil

1. **Hero** — promesse « De l'idée au résultat. », sous-titre explicite (conversation, recherche sourcée, création, exécution), CTA principal *Commencer l'expérience* → `/register`, CTA secondaire *Voir la galerie* → `#galerie`, sculpture 3D + halo (identité conservée).
2. Bandeau des écosystèmes IA (logos génériques, aucune prétention de partenariat).
3. Bandeau de mots (identité).
4. **Le fil** — comment AURA enchaîne intention → contexte → livrable.
5. **Capacités** — 3 blocs : assistant, recherche sourcée, studio (sans trait décoratif).
6. **Vision locale (nouveau)** — 3 axes honnêtement étiquetés : *En préparation*, *Phase d'étude*, *À venir*.
7. **Galerie Studio** — piste animée desktop, défilement tactile pensé mobile, mention « rendus de démonstration ».
8. **Tarifs** — fonctionnalités incluses mutualisées + 3 cartes de prix.
9. **CTA final**, pied de page.

## 5-6. Contenus rédigés FR / EN

Tous les textes ajoutés ou réécrits existent dans les deux langues
(`src/app/dictionaries.ts` pour le site, `src/app/docs.ts` pour la
documentation) : hero, capacités, **vision locale (3 axes + note)**, tarifs
(3 formules, note de droits, note de paiement), hub de documentation,
7 guides complets, libellés du menu mobile.

## 7. Nouvelle navigation mobile

- Barre : logo, burger 48 px, plus de CTA compressé.
- Panneau sous la barre : 4 destinations (min 52 px de haut), bloc outils
  (FR/EN + thème), puis actions *Connexion* (contour) et *Commencer* (plein).
- Comportements vérifiés : ouverture au clic, **fermeture au second clic**,
  fermeture après sélection, **Escape** (retour du focus au burger), piège à
  focus (Tab/Maj+Tab), verrouillage du défilement d'arrière-plan, voile
  cliquable, `aria-expanded` / `aria-controls` / `role="dialog"` /
  `aria-modal`.

## 8. Corrections de la galerie

- Desktop : intention conservée (piste épinglée GSAP, carte active en perspective).
- Mobile : défilement horizontal natif **avec** synchronisation de la carte la
  plus centrée (`.active`, opacité + échelle), indices de position, `touch-action`
  autorisant le défilement vertical, `scroll-snap: proximity` (plus de piège),
  scrollbar masquée, `prefers-reduced-motion` respecté, écouteur `scroll`
  throttlé par `requestAnimationFrame` et nettoyé au démontage.

## 9. Présentation locale d'AURA

Section `#vision` : trois axes — compréhension du contexte béninois (sources
fiables, base de connaissances, incertitudes reconnues), langues locales (Fon
en priorité, aucune langue annoncée avant tests avec locuteurs), voix
(dictée → compréhension → réponse → lecture, avec consentement et
confidentialité). Chaque axe porte un statut explicite et la section se conclut
par : « ces axes ne sont pas encore des fonctionnalités disponibles ».

Aucun bouton microphone factice, aucune promesse de disponibilité.

## 10. Tarification actualisée

| Formule | Prix affiché | Périodicité |
|---|---|---|
| Mensuelle | 500 FCFA | par mois |
| Mensuelle | 1 500 FCFA | par mois |
| Annuelle | 20 000 FCFA | par an |

- Montants **exactement** ceux fournis par le propriétaire (le « 21 500 » du
  premier tableau a été corrigé en 500 + 1 500 sur sa précision explicite).
- « FCFA » écrit en toutes lettres, jamais « F ».
- **Aucun quota, volume, avantage ou réduction inventé** : les 5
  fonctionnalités incluses sont présentées une fois, valables pour toutes les
  formules, avec la mention que leurs droits respectifs resteront à préciser.
- Paiement en ligne non disponible → mention explicite ; CTA vers `/register`
  (destination réelle), aucune transaction simulée.
- Aucune comparaison de réduction annuelle affichée.

## 11. Documentation complète

Hub + 7 guides (`/documentation/:slug`) : Démarrage, Assistant et le fil,
Projets et missions, Explorer et recherche sourcée, Studio et créations,
Compte/données/sécurité, API développeurs.

Chaque guide : objectif, prérequis, étapes numérotées, exemple concret,
résultat attendu, limites connues, tableau symptôme → cause → solution, liens
associés, sommaire ancré, pagination précédent/suivant. Les exemples `curl`
correspondent aux routes réellement exposées (`/api/v1/...`), l'absence de clés
d'API publiques est signalée. Les textes juridiques ne sont pas inventés : la
nécessité d'une validation juridique est écrite noir sur blanc.

## 12. Boutons et composants harmonisés

Inventaire : `btn-encre`, `btn-ruban`, `btn-ligne`, `btn-fantome` (site) ;
`btn-principal`, `btn-primaire`, `btn-simple`, `btn-danger-simple` (espace).
Système consolidé : variantes principal / secondaire / contour / fantôme /
destructif / icône / lien, hauteur minimale 44 px, `focus-visible` (anneau or
3 px), états `:active`, `:disabled`, chargement (`data-chargement`), transitions
soie communes. Actions factices : aucune (« Être prévenu » supprimé, CTA
tarifs vers une destination réelle).

## 13. Matrice responsive (exécutée)

320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440, 1920 px ×
`/`, `/documentation`, `/login`, `/register` → **0 débordement horizontal**
(48 combinaisons). Pages applicatives mesurées à 390 px : `/app`, `/chat`,
`/projets`, `/missions`, `/explore`, `/studio`, `/historique`, `/parametres` →
**0 px de débordement**.

## 14. Captures comparatives

`/home/user/audit-captures/experience-008/avant/` (11 PNG + `resultats.json`) et
`/home/user/audit-captures/experience-008/apres/` (26 PNG + `resultats.json`) :
accueil desktop/mobile, navbar mobile ouverte, galerie desktop/mobile, tarifs
desktop/mobile, documentation, article de documentation, connexion/inscription,
vision desktop/mobile, workspace, assistant, projets, missions, explorer,
studio, historique, paramètres.

## 15. Résultats des tests

| Suite | Résultat |
|---|---|
| `npm test` (serveur, unitaire + intégration) | **61/61** |
| `tests/parcours-acceptation.cjs` (navigateur, 13 scénarios) | **13/13** |
| `tests/parcours-experience.cjs` (audit responsive, menu, FR/EN, tarifs, docs, pages applicatives) | **28/28** |
| QA accessibilité (h1 unique, alt, noms accessibles, lien d'évitement, premier focus clavier) | **6/6 pages** |
| `tsc --noEmit` | ✅ |
| `vite build` | ✅ |

## 16. Performance

| Mesure | Valeur |
|---|---|
| Bundle principal | 631 kB (≈194 kB gzip) |
| Module 3D (AuraSculpture, chargé avec l'accueil) | 541 kB (≈135 kB gzip) |
| Documentation (chargement à la demande) | 31 kB, chargée uniquement sur `/documentation` |
| DOMContentLoaded mesuré | accueil 966 ms (1<sup>er</sup> chargement à froid), articles et formulaires 135–165 ms |

Aucune dépendance ajoutée. La documentation est désormais un *chunk* séparé :
le poids initial du site ne l'inclut plus.

## 17. Régressions corrigées

- Contenus invisibles par révélations non observées (touchait plusieurs
  sections, dont le héros de `/documentation`).
- Boutons non stylés dans l'espace de travail.
- Doublon du nom de marque dans la barre.
- Hero trop lent à se composer.
- Page d'article vide pendant le chargement du module.
- Absence de lien d'évitement sur les pages d'authentification.

## 18. Limitations restantes (honnêtes)

1. **Aucun test sur appareil physique** : les tests utilisent un Chromium
   headless aux largeurs cibles (320→1920 px) ; le test tactile réel
   (inertie iOS, gestes) reste à faire sur téléphone.
2. **Vérification visuelle partielle** : les captures headless n'exécutent pas
   le rendu WebGL de la sculpture 3D (canvas absent des captures desktop) ; le
   rendu a été validé en développement, pas dans ce harnais.
3. Les logos d'écosystème du bandeau restent des marques tierces : aucune
   autorisation de partenariat n'est affichée, mais leur usage doit être
   confirmé par le propriétaire.
4. Les **droits des abonnements** restent à définir (aucune différence
   inventée) ; paiement en ligne non intégré.
5. Documentation : les textes juridiques (CGU, confidentialité) ne sont pas
   rédigés — validation juridique nécessaire.
6. Vision locale, langues (Fon) et voix : **non développées**, présentées
   comme axes d'étude.
7. Le sélecteur FR/EN traduit le site et la documentation ; la langue des
   contenus générés par l'IA dépend du moteur, pas d'un réglage séparé.

## 19. État Git et branche

- Branche : `arena/1010a3ec-aura` (imposée par la plateforme).
- Base : `b76073cb`.
- Fichiers modifiés : `src/App.tsx`, `src/app/dictionaries.ts`,
  `src/components/layout/SiteChrome.tsx`, `src/components/motion/useReveal.ts`,
  `src/index.css`, `src/pages/AuthPage.tsx`, `src/pages/DocumentationPage.tsx`,
  `src/pages/LandingPage.tsx`, `tests/parcours-acceptation.cjs`.
- Fichiers ajoutés : `src/app/docs.ts`, `src/pages/DocumentationArticlePage.tsx`,
  `tests/parcours-experience.cjs`, `docs/analyse/008-experience-008-audit.md`,
  ce rapport.
- Aucune dépendance ajoutée, aucun secret, aucun déploiement, aucune fusion.

## 20. Conditions de validation finale

| Critère de la mission | État |
|---|---|
| Pages internes utilisables sur mobile | ✅ (8 pages applicatives, 0 px de débordement) |
| Navbar mobile réellement repensée | ✅ (panneau, outils, actions, focus, Escape) |
| Sélecteur FR/EN accessible dans le menu mobile | ✅ (testé) |
| Galerie avec animation mobile adaptée | ✅ (carte active, indices, tactile) |
| Boutons au style cohérent | ✅ (système unifié, `.btn-primaire` corrigé) |
| Documentation complète | ✅ (7 guides FR/EN) |
| Prix exacts | ✅ (500 / 1 500 / 20 000 FCFA) |
| Aucune fonctionnalité présentée comme disponible à tort | ✅ (statuts explicites, notes de limite) |
| Rien de coupé sur mobile | ✅ (matrice 48 combinaisons) |
| Aucun lien/action factice | ✅ (CTA tarifs → `/register`, « Être prévenu » supprimé) |
| Tests exécutés | ✅ (61 + 13 + 28 + 6 QA) |
| Pas de fusion / déploiement sans autorisation | ✅ |
