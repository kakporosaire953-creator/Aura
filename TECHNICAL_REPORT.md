# Aura — Rapport technique d'implémentation

**Branche :** `arena/617d6b30-aura` · **Date :** 2026-10-23

Ce rapport décrit l'état réel de l'implémentation après audit du dépôt existant et
construction incrémentale de **Aura Studio comme produit de première classe**, des
routes marketing manquantes et des API honnêtes de persistance.

---

## 1. Domaines produit implémentés

### Existant audité et conservé (≈28 000 lignes)
Landing page cinématique (GSAP + ScrollTrigger), authentification (e-mail/mot de passe
haché scrypt + OAuth configurable), onboarding en 3 étapes, espace de travail 4 modes
(Chat / Recherche / Code / Créer) avec persistance des conversations, bibliothèque,
projets, missions, explore, quotas d'usage (réserve → engagement → libération),
paramètres, tarifs, centre d'aide, 8 pages légales, thème sombre, bilingue FR/EN,
abstraction multi-fournisseurs IA (Gemini actif, OpenAI/Anthropic relais).

### Nouveau dans cette session

**Aura Studio — produit créatif complet**
| Route | Fonction |
| --- | --- |
| `/app/studio` | Galerie des créations réelles : recherche, filtres type/statut, tri, grille/liste, miniatures d'aperçu isolées, actions (aperçu, code, dupliquer, supprimer avec confirmation) |
| `/app/studio/new` | Workflow de création : idée en langage naturel + type + options avancées (nom, sections, direction artistique), progrès de génération honnête, récupération d'échec |
| `/app/studio/:id/preview` | Aperçu immersif plein écran : barre flottante minimale, viewports **réels** 1280/768/390 px, rafraîchir, ouvrir dans un onglet (fichier isolé), historique des versions, export ZIP, bascule Developer Mode, édition IA |
| `/app/studio/:id/develop` | Developer Mode 3 panneaux : explorateur de fichiers (recherche, création, renommage, suppression), éditeur CodeMirror 6 (coloration HTML/CSS/JS/JSON/MD, numéros de ligne, Ctrl+S, état sale), aperçu en direct avec viewports, compilation, édition IA contextualisée. **Mobile : onglets Fichiers / Code / Aperçu** |

**API Studio persistées (11 routes, isolation par utilisateur)** — voir README §2.1 :
CRUD projets, sauvegarde de fichiers avec **vraie création de version**, itération IA
ciblée (fusion par chemin — les fichiers non renvoyés sont préservés), restauration de
version, export ZIP réel (générateur ZIP maison, sans dépendance), validation de
compilation structurelle persistée, quotas serveur.

**Routes publiques manquantes** : `/features` (présentation éditoriale des 4 modules),
`/features/chat|explore|studio|projects`, `/about`, `/contact` (formulaire persisté),
404 réel (fini le « tout redirige vers / »), alias `/signup`, `/reset-password`,
`/auth/callback`, sous-routes `/app/settings/:tab`, alias légaux
`/legal/notices`, `/legal/content-and-ip`.

**Correction d'honnêteté** : `/api/waitlist` et `/api/contact` affirmaient un succès
sans rien persister → messages réellement enregistrés (`aura_contact_messages`).

---

## 2. Fonctionnalités vérifiées (tests réellement exécutés)

API E2E sur serveur live (`curl`, sessions authentifiées) :
- ✅ Inscription / connexion / onboarding d'un compte test
- ✅ Galerie vide honnête pour un nouveau compte (0 projet, quota affiché 0/3)
- ✅ Génération sans `GEMINI_API_KEY` → **503 `PROVIDER_NOT_CONFIGURED`**, message de
  configuration exact, run `failed` persisté, **aucune unité débitée** (réservation libérée)
- ✅ Sauvegarde de fichiers → version 1 réelle, compilation `ok`, statut `ready`
- ✅ 2ᵉ sauvegarde → historique 2 versions ; **restauration de la v1** (contenu réellement
  rétrogradé, version `restore` ajoutée)
- ✅ Composition d'aperçu : CSS/JS locaux correctement inlinés dans `index.html`
- ✅ Export ZIP : `python3 zipfile.testzip()` valide, entrées `index.html`, `styles.css`, `app.js`
- ✅ Itération IA sans provider → erreur honnête, usage non débité
- ✅ **Isolation inter-comptes** : l'utilisateur B obtient 404 sur le projet de A
- ✅ Limite de stockage serveur : 4ᵉ projet refusé (`429 STORAGE_LIMIT`, 3/3 Free)
- ✅ Suppression de compte : projets Studio et données supprimés
- ✅ Formulaire contact → persistance confirmée
- ✅ Compilation de tous les nouveaux modules via Vite (15 modules, 200 sans erreur)

Builds : `tsc --noEmit` **0 erreur**, `vite build` **succès** (bundle principal
1,34 MB gzip 349 kB ; CodeMirror isolé en chunk lazy 563 kB chargé uniquement en
Developer Mode).

Non vérifié faute de navigateur dans le sandbox : rendu visuel pixel-perfect, tests
utilisateur au clavier/lecteur d'écran, tests Playwright. Les tests E2E couvrent la
couche API et la compilation UI.

---

## 3. Fichiers et architecture créés

```
src/shared/studio.ts                  # helpers purs partagés (preview, extraction, validation)
src/shared/types.ts                   # + types StudioProject/Version/Run + schémas Zod
src/server/ai/studioGenerator.ts      # prompts génération/itération (agnostique fournisseur)
src/server/zip.ts                     # générateur ZIP (méthode STORE + CRC32)
src/server/dataStore.ts               # + persistance studio, versions, runs, contact
src/server/apiApp.ts                  # + 11 routes Studio + /api/contact, waitlist persistant
src/services/studioService.ts         # client API Studio (Bearer, timeouts, erreurs typées)
src/components/studio/
  StudioPreviewFrame.tsx              # iframe sandboxée SANS allow-same-origin
  StudioFileExplorer.tsx              # arborescence, recherche, CRUD fichiers
  StudioCodeEditor.tsx                # CodeMirror 6 + thèmes Aura clair/sombre
  StudioProjectCard.tsx               # carte galerie avec miniature live
  StudioIterateBar.tsx                # saisie de modification IA
src/pages/studio/                     # Gallery / New / Preview / Develop
src/pages/marketing/                  # Features / FeatureModule / About / Contact / 404
src/components/layout/MarketingLayout.tsx  # header public + footer existant
supabase/schema.sql                   # + aura_studio_projects (RLS) + aura_contact_messages
```

Modifications : `App.tsx` (routes + lazy Developer Mode), `WorkspaceLayout.tsx`
(liens Studio → `/app/studio`, Historique), `vite.config.ts` (allowedHosts preview),
`README.md` (doc API Studio).

---

## 4. Base de données & configuration

- **Défaut** : persistance locale `.data/aura-store.json` (JSON atomique), mots de
  passe scrypt, jetons de session HMAC — fonctionne **sans aucune variable d'env**.
- **Supabase/PostgreSQL** : `supabase/schema.sql` étendu (12 tables), RLS activée sur
  `aura_studio_projects` (politiques select/insert/update/delete par `user_id`).
  Exécuter le SQL dans l'éditeur Supabase puis renseigner les variables ci-dessous.

**Variables d'environnement** (`.env.example`) :
`GEMINI_API_KEY` (principal), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`AURA_SESSION_SECRET`, `APP_URL`, `AURA_DAILY_QUOTA`, clés `FEDAPAY_*`, `KKIAPAY_*`,
`STRIPE_*`. **Aucun secret n'est exposé au bundle client** (les clés ne vivent que dans
le registre serveur).

---

## 5. Intégrations non configurées (affichées honnêtement dans l'UI)

| Intégration | État | Comportement |
| --- | --- | --- |
| Gemini / OpenAI / Anthropic | ❌ aucune clé présente | 503 `PROVIDER_NOT_CONFIGURED` + message de configuration, usage non débité |
| Recherche web grounding | ❌ dépend GEMINI_API_KEY | Explore annonce la configuration requise |
| Supabase | ❌ | Repli local automatique |
| Paiements (FedaPay/Kkiapay/Stripe) | ❌ | Pas de checkout simulé ; parcours d'attente honnête |
| OAuth Google/GitHub | ❌ identifiants | Boutons pilotés par la configuration réelle |

---

## 6. Limites connues & sécurité

**Sécurité déjà en place** : isolation par utilisateur sur chaque route Studio
(vérifiée), iframe d'aperçu `sandbox="allow-scripts allow-forms allow-popups allow-modals"`
**sans `allow-same-origin`** → le code généré ne peut lire stockage, cookies ni jetons
de session ; validation Zod des chemins de fichiers (pas de `..`, pas de chemin absolu,
tailles bornées) ; quotas vérifiés côté serveur uniquement ; idempotence par
`X-Client-Request-Id` (une répétition ne débite pas deux fois) ; messages d'erreur
sans fuite de secrets.

**Limites assumées** :
- Éditeur CodeMirror plutôt que Monaco (choix validé : bundle lazy maîtrisé, pas de
  workers CDN) — remplacable sans refonte.
- « Compiler » = validation structurelle réelle (HTML/CSS) d'un projet statique ; il
  n'y a pas de vrai pipeline de build ni de terminal (volontaire : pas d'exécution de
  shell arbitraire).
- Pas de tests Playwright (aucun navigateur disponible dans l'environnement).
- Pas de streaming SSE sur `/api/ai/chat` (réponse complète ; l'architecture du
  fournisseur expose déjà `AIStreamChunk`).
- Offres tarifaires : prix non codés en dur (config centrale), pas de checkout actif.
- La génération IA réelle n'a pas pu être testée bout-en-bout (aucune clé API dans le
  sandbox) — le chemin de remplacement (échec honnête + récupération manuelle) a été
  testé en totalité.

---

## 7. Prochaine priorité recommandée

1. **Configurer `GEMINI_API_KEY`** et valider le chemin de génération réel
   (création → fichiers générés → aperçu → itération), y compris l'extraction
   multi-fichiers depuis la réponse du modèle.
2. Tests Playwright des parcours critiques (inscription → Studio → Developer Mode).
3. Streaming des réponses chat + persistance Supabase en production.
4. Vérification légale des pages (elles sont clairement non validées par un
   professionnel du droit) et mise en place du support (adresse réelle).

---

## 10. Motion system (GSAP + Three.js)

- **Intro (`AuraIntroLoader`)** — once per session (`sessionStorage: aura_intro_v1`), skippable on any interaction, disabled under `prefers-reduced-motion`. The official logo asset is never altered: the choreography (ring draw, halo expansion, clip-reveal, light sweep, staggered tagline) animates **around** `AuraLogo`.
- **Three.js (`AuraThreeRibbons`)** — lazy-loaded (550 kB chunk, never in the critical bundle), DPR capped at 2, paused via `IntersectionObserver`/`visibilitychange`, graceful no-op without WebGL, full buffer/material disposal on unmount, hidden < 768 px.
- **Landing demo (`PromptToProductDemo`)** — one GSAP master timeline drives the real `applyProgressState(0–1)` stage engine (no duplicated state), with play/pause/replay controls and auto-start once per page view when pinned.
- **Auth panel (`AuthMotionFilm`)** — infinite 8 s GSAP loop (light sweeps, value captions, floating UI cards, sparks); static fallback for reduced motion.
- All timelines use `useGSAP` scopes for automatic cleanup; every piece has a `prefers-reduced-motion` path. Verified by `tsc --noEmit`, production build, and dev-module smoke checks (no headless browser is available in this sandbox for pixel testing).
