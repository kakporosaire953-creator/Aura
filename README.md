# AURA — De l'idée au résultat.

AURA réunit conversation, recherche sourcée, création de documents et
exécution de missions dans un seul fil de pensée — du prompt au livrable.

Ce dépôt contient **l'application entière** : le front (React) et l'API
(Express, servie en local ou en fonction serverless sur Vercel). Un seul
principe gouverne le produit : **ce qui est annoncé comme vivant fonctionne
réellement** ; ce qui n'existe pas est dit, jamais simulé en silence.

> Dernière mise à jour de ce README : **2026-11-11** (commit `c28dd48`).

---

## 1. État réel du produit

| Brique | État | Ce qu'il faut pour l'activer |
|---|---|---|
| Comptes (inscription, connexion, sessions) | **Live** | un stockage (`KV_*`) — sinon l'API répond 503 honnêtement |
| Chat / Explore / Studio / Missions | **Live** | au moins une clé de moteur IA |
| Connexion Google | **Live** (code) | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` côté Vercel |
| E-mails transactionnels | **Live** (code) | un fournisseur (`brevo` ou `resend`) + `AURA_PUBLIC_ORIGIN` |
| Confirmation d'adresse **bloquante** | **Désactivée par défaut** | `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1` |
| Application installable (PWA) | **Live** | rien à configurer — HTTPS suffit (section 10) |
| Panneau d'administration | **Live** (code) | `AURA_ADMIN_EMAILS` côté Vercel (section 4.6) |
| Génération d'images, pièces jointes | **Non livré** | — (aucune fausse promesse dans l'interface) |

---

## 2. Démarrage rapide (clone → ça tourne)

```bash
git clone <votre-dépôt> Aura
cd Aura
npm install --legacy-peer-deps     # les peer deps de Vite 8 sont strictes
cp .env.example .env               # puis renseignez au minimum les clés IA
npm run dev                        # http://localhost:3000
```

Sans aucune variable, l'application **démarre quand même** : les comptes sont
alors stockés dans un fichier local (`AURA_DATA_DIR`), et les briques non
configurées répondent un `503` explicite plutôt que de faire semblant.

Vérifications de base :

```bash
npm run lint        # TypeScript (tsc --noEmit)
npm test            # 292 tests (node:test + jsdom pour l'interface)
npm run build       # build de production (vite)
```

---

## 3. Variables d'environnement — référence complète

Toutes les variables sont **côté serveur**. Aucun secret ne doit être préfixé
`VITE_` : tout ce qui commence par `VITE_` finit dans le bundle du navigateur.

### 3.1 Stockage (obligatoire en production)

| Variable | Rôle | Défaut |
|---|---|---|
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Base KV (Vercel KV / Upstash) : comptes, sessions, jetons, données du workspace | — |
| `AURA_KV_URL` / `AURA_KV_TOKEN` | Alias acceptés pour un hébergement hors Vercel | — |
| `AURA_DATA_DIR` | Pilote fichier (développement, tests, auto-hébergement) | `./data` hors Vercel |

Sur Vercel, sans KV **ni** `AURA_DATA_DIR`, le stockage se déclare
indisponible (le disque serverless est éphémère : prétendre persister serait
mentir) — `/api/status` affiche alors `accounts: "setup-required"` et les
routes concernées répondent `503`. En local, un fichier dans `./data` suffit.

### 3.2 Moteurs IA (obligatoire pour le chat)

| Variable | Rôle | Défaut |
|---|---|---|
| `GEMINI_API_KEY` (alias `AURA_GEMINI_API_KEY`) | Clé Google AI Studio | — |
| `GEMINI_MODEL` (alias `AURA_MODELE`) | Identifiant exact du modèle | `gemini-3.8-flash` |
| `GEMINI_API_BASE` (alias `AURA_MODELE_URL`) | Base HTTP Gemini | `https://generativelanguage.googleapis.com` |
| `GEMINI_SEARCH_MODEL` (alias `AURA_MODELE_RECHERCHE`) | Modèle de recherche sourcée | celui du chat |
| `GROQ_API_KEY` / `GROQ_MODEL` | Fournisseur de secours (gratuit) | — / `llama-3.3-70b-versatile` |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | Second secours | — / `openai/gpt-4o-mini` |
| `AI_DEFAULT_PROVIDER` (alias `AURA_AI_PROVIDER`) | `auto`, `gemini`, `groq`, `openrouter` | `auto` |
| `AI_FALLBACK_ORDER` | Ordre de repli | `gemini,groq,openrouter` |
| `AI_MAX_RETRIES` | Tentatives supplémentaires (0–5) | `2` |
| `AI_REQUEST_TIMEOUT_MS` | Délai par appel fournisseur (plafonné à 50 000) | `45000` |

Un seul fournisseur suffit pour démarrer. Les suivants servent de repli
automatique : si Gemini échoue, l'appel bascule sur Groq, puis OpenRouter.

### 3.3 E-mails transactionnels

| Variable | Rôle | Défaut |
|---|---|---|
| `AURA_MAIL_PROVIDER` | `brevo` ou `resend` | — |
| `AURA_MAIL_API_KEY` | Clé API du fournisseur | — |
| `AURA_MAIL_FROM` | Expéditeur, ex. `AURA <adresse@domaine>` | — |
| `AURA_MAIL_REPLY_TO` | Adresse de réponse (optionnelle) | — |
| `AURA_PUBLIC_ORIGIN` | Origine utilisée pour construire les liens | — |
| `AURA_MAIL_API_URL` | **À laisser vide** sauf relais interne | selon le fournisseur |
| `AURA_MAIL_TIMEOUT_MS` | Délai d'envoi (1000–20000) | `8000` |

`AURA_PUBLIC_ORIGIN` est **indispensable** : les liens des e-mails ne sont
jamais construits depuis l'en-tête `Host` d'une requête (usurpable).

### 3.4 Confirmation d'adresse

| Variable | Effet |
|---|---|
| *(absente)* | **Aucune confirmation exigée** (défaut actuel). Le lien part si un fournisseur existe, mais ne bloque rien. Sans fournisseur, l'état est dit « impossible ». |
| `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=0` | Identique, figé explicitement. |
| `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1` | Confirmation **bloquante** : `403 email-non-verifie` sur le workspace tant que l'adresse n'est pas prouvée. Sans fournisseur, l'inscription répond `503` plutôt que de créer un compte inconsultable. |

### 3.5 Connexion Google

| Variable | Rôle |
|---|---|
| `GOOGLE_CLIENT_ID` | ID client OAuth « Application Web » |
| `GOOGLE_CLIENT_SECRET` | Code secret (serveur uniquement) |
| `GOOGLE_REDIRECT_URI` | Facultative. Par défaut : `<AURA_PUBLIC_ORIGIN>/api/auth/google/retour` |

### 3.6 Jetons et divers

| Variable | Rôle | Défaut / bornes |
|---|---|---|
| `AURA_JETON_VERIFICATION_HEURES` | Durée du lien de confirmation | 24 h (1–168) |
| `AURA_JETON_REINITIALISATION_MINUTES` | Durée du lien de réinitialisation | 30 min (5–120) |
| `PORT` | Port du serveur local | `3000` |
| `AURA_TRUST_PROXY=1` | Derrière un proxy de confiance (Vercel le règle seul) | désactivé |
| `AURA_ADMIN_EMAILS` | Adresses autorisées à ouvrir `/admin` (séparateur virgule, point-virgule ou espace) | **aucune** → panneau fermé |

### 3.7 Administration

Le panneau `/admin` n'existe pour personne tant que `AURA_ADMIN_EMAILS` est
absente : `/api/v1/admin/*` répond alors `503 admin-non-configure`. Ce n'est
pas un bouton caché dans l'interface — c'est le serveur qui refuse.

| Situation | Réponse |
|---|---|
| Variable absente | `503 admin-non-configure` |
| Visiteur non connecté | `401 anonyme` |
| Compte ordinaire | `403 admin-refuse` |
| Adresse listée et connectée | les données |

Le rôle est **relu à chaque requête** depuis la variable : retirer une adresse
puis redéployer suffit à retirer le pouvoir, sans toucher au compte.

---

## 4. Configuration pas à pas

### 4.1 Stockage KV (5 min)

1. Vercel → votre projet → **Storage → Create Database → KV**.
2. **Connect to project** → environnement *Production* (et *Preview* si vous voulez).
3. Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées
   automatiquement. Il reste à **redeploy**.

Vérification : `/api/status` → `features.accounts: "live"`.

### 4.2 Moteur IA (5 min, gratuit)

1. **aistudio.google.com** → *Get API key* → créer une clé.
2. Vercel → `GEMINI_API_KEY` = la clé.
3. **Vérifiez le nom du modèle** dans AI Studio → *Models* : si
   `gemini-3.8-flash` n'y figure pas, posez `GEMINI_MODEL` avec l'identifiant
   exact disponible. C'est la cause n°1 d'un chat qui échoue en 2 secondes.
4. Redeploy.

*Secours gratuit* : **console.groq.com** → clé → `GROQ_API_KEY`. Le chat
basculera automatiquement dessus si Gemini refuse.

### 4.3 E-mails — Brevo (recommandé, gratuit, sans domaine)

Brevo valide une **adresse d'expédition**, pas un domaine : c'est la seule
voie gratuite sans acheter de nom de domaine. Offre gratuite permanente :
**300 e-mails/jour**, sans carte bancaire.

1. Créer un compte sur **brevo.com**.
2. *Senders & IP → Senders → Add a sender* → votre adresse (un Gmail suffit).
   Ouvrir la boîte et **saisir le code / cliquer le lien reçu**. Tant que
   l'adresse n'est pas *Validated*, aucun envoi ne part.
3. *SMTP & API → API keys → Generate a new API key* (commence par `xkeysib-`).
4. Vercel (Production) :

   ```
   AURA_MAIL_PROVIDER=brevo
   AURA_MAIL_API_KEY=xkeysib-…
   AURA_MAIL_FROM=AURA <votre-adresse-validée>
   AURA_PUBLIC_ORIGIN=https://votre-domaine.vercel.app
   ```
5. **Supprimer `AURA_MAIL_API_URL`** si elle existait pour Resend : sinon
   l'application appellerait `api.resend.com/smtp/email` avec une clé Brevo.
6. Redeploy.

**Resend** fonctionne aussi, mais exige un **domaine vérifié** pour écrire à
d'autres adresses que celle du titulaire du compte.

*Limite honnête* : avec une adresse Gmail en expéditeur, Gmail n'autorise
personne à signer en son nom — une partie des messages atterrit en
**indésirables**. Ça part, ce n'est pas garanti.

### 4.4 Connexion Google (10 min, gratuit)

1. **console.cloud.google.com** → nouveau projet (`Aura`).
2. *API et services → Écran de consentement OAuth* → **Externe** → nom `Aura`,
   e-mails d'assistance et de développeur → enregistrer. Ajoutez votre adresse
   comme **utilisateur test** tant que l'app n'est pas publiée.
3. *API et services → Identifiants → Créer → ID client OAuth* →
   **Application Web**. URI de redirection autorisée, exactement :

   ```
   https://votre-domaine.vercel.app/api/auth/google/retour
   ```
4. Copier **ID client** et **Code secret**.
5. Vercel : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AURA_PUBLIC_ORIGIN`.
6. Redeploy.

Vérification : `/api/status` → `googleConfiguree: true`, et
`/api/auth/google/statut` → `{ "disponible": true, "uriRetour": "…" }`.
L'URI affichée est **exactement** celle à déclarer chez Google.

**Mode Test vs publié** : en mode Test, seuls les comptes ajoutés comme
utilisateurs test peuvent se connecter. Pour ouvrir à tous : Écran de
consentement → **Publier l'application** (gratuit ; les scopes
`openid email profile` ne déclenchent pas de vérification).

### 4.5 Déploiement Vercel

1. Importer le dépôt dans Vercel (framework **Vite**, détection automatique).
2. Poser les variables de la section 3, en **Production**.
3. Deploy. `vercel.json` déclare les en-têtes de sécurité et le routage SPA.
4. Contrôler : `https://votre-domaine/api/status`.

### 4.6 Ouvrir le panneau d'administration (5 min)

Aucune ligne de code à changer : une variable suffit.

1. **Vercel** → projet → *Settings* → *Environment Variables* → *Add New* :
   - Name : `AURA_ADMIN_EMAILS`
   - Value : `vous@exemple.com` (plusieurs adresses : séparées par des virgules)
   - Environments : **Production** (ajouter *Preview* si vous testez une branche).
2. **Deployments** → dernier déploiement → **⋯ → Redeploy**. Une variable
   ajoutée n'atteint pas un déploiement déjà construit : sans redéploiement,
   rien ne change.
3. Se **connecter normalement** avec cette adresse (mot de passe ou Google).
   Le rôle ne s'applique qu'à une session ouverte avec l'adresse listée.
4. Dans le workspace, la section **Personnel** de la barre latérale affiche
   désormais **Administration** (`/admin`).

Contrôle sans navigateur :

```bash
curl -s https://votre-domaine/api/v1/admin/etat -H "Cookie: aura_session=…"
# {"admin":true,"configure":true}
```

(Le cookie reste dans votre navigateur ; l'appel se fait aussi très bien
depuis l'onglet *Network* une fois connecté.)

**Ce que le panneau montre et permet** — tout est lu sur le stockage réel,
rien n'est simulé :

| Écran | Contenu |
|---|---|
| Vue d'ensemble | comptes, adresses confirmées, comptes Google, suspendus, sessions actives, inscriptions 7 j, conversations, messages, créations |
| Comptes | recherche (adresse, nom, identifiant), pagination 25/page, état, nombre de sessions |
| Détail | sessions (appareil, dernière activité), volumes d'activité, suspension motivée, fermeture des sessions, suppression |
| Journal | 200 dernières actions : qui, quand, sur qui, motif |

Ce qu'il ne fait pas : changer un mot de passe à la place d'un utilisateur,
lire le contenu de ses conversations (seuls les compteurs sont exposés),
et un administrateur **ne peut ni se suspendre ni se supprimer** lui-même
(`400 soi-meme`) — pour ne pas se verrouiller dehors.

Une **suspension** conserve les données : le compte est fermé, ses sessions
sont révoquées, la connexion répond `403 compte-banni`, et son adresse reste
« déjà utilisée » (aucune fuite d'existence). Un **rétablissement** rouvre
l'accès sans rien perdre. La **suppression** est définitive et exige de
recopier l'adresse exacte du compte.

---

## 5. Vérifier une installation (sans navigateur)

| Commande | Ce qu'elle prouve |
|---|---|
| `npm test` | 328 tests : auth, e-mails, IA, Google, API v1, administration, PWA, responsive |
| `npm run verif:prod` | le build n'active aucune simulation en production |
| `npm run verif:mail -- adresse@exemple.tld` | envoi réel, cause exacte d'un refus (401/403/422/429/réseau) |
| `npm run diagnostic -- https://votre-site` | état public de l'API en ligne (lecture seule) |
| `GET /api/status` | configuration et fonctionnalités réelles |
| `GET /api/auth/google/statut` | disponibilité Google + URI de retour à déclarer |

`verif:mail` lit `.env`, **n'affiche jamais la clé** et masque le destinataire.

---

## 6. Architecture

```
server/                 API — source unique (dev et serverless)
  api.ts                application Express : /status, /auth/*, /me, /chat, /v1
  accounts.ts           scrypt, sessions, cookies, jetons
  auth/                 récupération de compte, vérification, Google OAuth
  ai/                   multi-fournisseurs, routage, repli, erreurs normalisées
  mail/                 adaptateur (brevo | resend), gabarits FR/EN
  db/                   entrepôts (KV ou fichier), modèle logique
  v1/                   API du workspace + middlewares (limites, auth)
  export/               documents Word / PDF / tableurs / présentations
api/index.ts            point d'entrée de la fonction serverless Vercel
src/                    front React (pages, composants, contexte de session)
tests/                  node:test (serveur) + jsdom (interface)
docs/                   analyse, architecture, API, opérations
scripts/                vérifications de build, de production, diagnostic
```

**Routes principales** : `GET /api/status`, `POST /api/auth/register`,
`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`,
`GET /api/auth/google/demarrer`, `GET /api/auth/google/retour`,
`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`,
`POST /api/auth/verify-email`, `POST /api/chat`, puis `/api/v1/*`
(conversations, projets, missions, mémoire, recherche, studio, exports,
`/me/password`, `/me/sessions`, `/me/email/renvoyer`).
Détail : `docs/api/README.md`.

---

## 7. Sécurité — ce qui est réellement en place

- Mots de passe **scrypt**, sel par utilisateur, comparaison à temps constant.
- Sessions : jeton opaque de 32 octets, **empreinte SHA-256** stockée côté
  serveur, cookie `HttpOnly` + `SameSite=Lax` (+ `Secure`, préfixe `__Host-`
  en production), durée 7 jours.
- Jetons à usage unique (vérification 24 h, réinitialisation 30 min) :
  jamais stockés en clair, consommés par réservation atomique.
- Aucune énumération de comptes : réponses et temps de réponse identiques.
- Google : `state` anti-CSRF, signature **RS256** de l'`id_token` vérifiée
  contre les clés publiées par Google, `iss`/`aud`/`exp`/`email_verified`
  contrôlés, destination de retour limitée à une page interne.
- Limitation de débit par IP **et** par identifiant (connexion, inscription,
  renvoi, réinitialisation, chat, changements sensibles).
- Aucun secret côté navigateur ; aucun jeton en clair dans les journaux.
- Administration : rôle décidé par `AURA_ADMIN_EMAILS`, relu à chaque requête
  côté serveur (le lien de l'interface n'est qu'un confort). Limite de
  120 requêtes / 5 min par compte admin. Auto-suspension et auto-suppression
  refusées (`400 soi-meme`). Chaque action est journalisée, et le journal ne
  contient ni mot de passe, ni jeton, ni empreinte de session.

---

## 8. Dépannage

### E-mails

| Symptôme | Cause | Correctif |
|---|---|---|
| « pas configuré » alors que les variables existent | configuration incomplète (`AURA_PUBLIC_ORIGIN` manquante) | reconstruire et regarder `/api/status` |
| `401` chez Brevo | clé invalide, ou adresse expéditrice non validée | *Senders* → valider l'adresse |
| `403` chez Resend | domaine non vérifié | passer à Brevo, ou vérifier un domaine |
| `429` | quota (Brevo 300/j, Resend 100/j) | attendre, ou changer de fournisseur |
| Rien n'arrive, aucun log | `AURA_MAIL_API_URL` pointe encore vers Resend | supprimer la variable, redeploy |

Journal : `[mail] envoi refusé (statut) — fournisseur=… — endpoint=… — domaine-expediteur=…`.

### IA

| Message affiché | Cause | Correctif |
|---|---|---|
| « Le modèle configuré n'existe pas ou n'est pas accessible avec cette clé » | **404** — nom de modèle erroné | corriger `GEMINI_MODEL` |
| « a renvoyé une erreur (HTTP 5xx) » | fournisseur en panne | attendre, ou configurer un secours |
| « a refusé l'authentification serveur » | clé invalide | remplacer la clé |
| « au-delà de ses limites » | quota | attendre / changer de fournisseur |
| « mis trop de temps à répondre » | délai dépassé | augmenter `AI_REQUEST_TIMEOUT_MS` |

Journal : `[ia] tentative N échouée (fournisseur, code)` puis
`[ia] generation(...) → fournisseur/modèle en N ms`.

### Google

| Symptôme | Cause | Correctif |
|---|---|---|
| Bouton absent | variables non lues | redeploy, puis `/api/status` |
| `redirect_uri_mismatch` | URI différente, même d'un `/` | recopier `uriRetour` de `/api/auth/google/statut` |
| `/login?google=refus` | code secret erroné, ou connexion annulée | vérifier `GOOGLE_CLIENT_SECRET` |
| `/login?google=etat` | redirection interrompue | réessayer depuis le bouton |
| `/login?google=conflit` | adresse déjà liée à un autre compte Google | cas volontairement bloqué |
| « application non vérifiée » | mode Test | publier l'application |

---

## 9. Modes : réel et démonstration

- En **développement**, la démonstration est accessible ; en **production**,
  elle exige une action volontaire (bouton « Voir la démonstration »).
- La démonstration ne stocke **aucun mot de passe** et ne donne aucun
  privilège réel : ses données vivent dans le navigateur, séparées des
  comptes serveur.
- Les données locales (historique, missions) restent dans le navigateur : ce
  n'est pas une synchronisation cloud.

---

## 10. Application installable (PWA)

Aura s'installe depuis le navigateur, **sans boutique, sans compte
supplémentaire et sans frais**. Ce n'est pas un portage : c'est le même site,
affiché en plein écran, qui s'ouvre plus vite et reste lisible quand le
réseau manque.

**Condition** : HTTPS (Vercel l'impose déjà) et le manifeste à la racine.

### Installer

| Appareil | Geste |
|---|---|
| Android (Chrome) | bandeau « Installer Aura », ou menu ⋮ → *Installer l'application* |
| Ordinateur (Chrome, Edge) | icône d'installation dans la barre d'adresse, ou le bouton dans la barre latérale |
| iPhone / iPad (Safari) | bouton **Partager** → *Sur l'écran d'accueil* |

Le bouton dans la barre latérale n'apparaît que si le navigateur a réellement
émis son invite (`beforeinstallprompt`) : il n'est jamais affiché « au cas
où ». Sur iOS, qui n'expose pas cette invite, le geste est expliqué dans
**Paramètres → Application**. Sans réseau, une page dédiée prend le relais et
dit franchement que la connexion manque.

### Ce qui fonctionne hors ligne — et ce qui ne peut pas

| Élément | Hors ligne |
|---|---|
| Coque de l'application (HTML, scripts, styles, icônes) | oui, en cache |
| Pages déjà consultées | oui |
| Conversations, recherche, créations, administration | **non** — le réseau est requis, et c'est voulu |
| Envoi de messages en attente | non : Aura ne fait pas semblant de mettre en file |

Règle tenue par le service worker : **aucune réponse `/api/*` n'est mise en
cache**. Un compte suspendu, une session fermée ou une conversation supprimée
doivent être vus immédiatement — jamais resservis depuis un cache.

### Mises à jour

Une nouvelle version est détectée en arrière-plan, puis **proposée** par un
bandeau « Une nouvelle version d'Aura est prête → Recharger ». Aucun
rechargement imposé : on ne coupe pas une phrase en cours. `/sw.js` et le
manifeste sont servis en `no-cache` (Vercel et serveur auto-hébergé), sinon un
navigateur pourrait garder une version des semaines.

### Fichiers

| Fichier | Rôle |
|---|---|
| `public/manifest.webmanifest` | nom, icônes, `start_url` (`/app`), raccourcis Conversation / Projets / Missions |
| `public/sw.js` | coque en cache, données jamais ; réseau d'abord pour la navigation |
| `public/hors-ligne.html` | page de secours autonome (aucune ressource distante) |
| `public/icones/` | 192, 512, maskable 512, icône Apple 180 |
| `src/app/pwa.ts` | enregistrement, invite d'installation, mise à jour |
| `src/components/pwa/` | bouton « Installer Aura », bandeau de mise à jour |

Le service worker n'est enregistré **qu'en production** (`main.tsx`) : en
développement, un cache fausserait le rechargement à chaud.

### Vérifier

- `npm test` — manifeste, tailles réelles des icônes (lues dans l'en-tête PNG),
  absence de cache sur `/api`, en-têtes `no-cache`, page hors ligne autonome,
  invite d'installation et mise à jour sur clic.
- Dans le navigateur : DevTools → *Application* → *Manifest* et *Service
  Workers*. L'installation réelle, l'écran d'accueil et le mode plein écran se
  vérifient **sur l'appareil**, pas en test automatisé.

---

## 11. Documentation

| Dossier | Contenu |
|---|---|
| `docs/analyse/` | comptes rendus numérotés (001 → 025) : chaque correctif, sa cause, sa preuve |
| `docs/architecture/` | vue d'ensemble, IA multi-fournisseurs, e-mails |
| `docs/api/` | contrat des routes |
| `docs/operations/` | activer comptes et e-mails, déploiement |
| `docs/security/` | durcissement, sessions, jetons |
| `docs/database/` | modèle logique |

Quelques lectures utiles :

- `docs/analyse/019-confirmation-email.md` — règle de confirmation et ses états ;
- `docs/analyse/022-mail-gratuit-sans-domaine.md` — Brevo sans domaine ;
- `docs/analyse/023-connexion-google.md` — OAuth, garde-fous, limites ;
- `docs/analyse/024-mode-connexion-compte.md` — comptes Google sans mot de passe ;
- `docs/analyse/025-chat-erreurs-ia-distinctes.md` — pourquoi le chat dit enfin la vraie cause.

---

## 12. Identité

- Logo officiel : `public/assets/` (ne jamais redessiner, recolorer ni déformer).
- Palette dérivée du logo : vert `#43BC2C`, lime `#A5E838`, or `#EACB37`, feu `#FF790D`.
- Typographie : Fraunces (titres) + Manrope (textes).
- Direction artistique : rubans fluides, lumière solaire, éditorial sculptural.
- Responsive exigé de **320 px à 1600 px** (couvert par `tests/responsive.test.ts`).
