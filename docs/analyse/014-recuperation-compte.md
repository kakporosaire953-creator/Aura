# 014 — Récupération de compte (vérification d'e-mail, mot de passe, sessions)

**Mission 08** · branche `arena/a5ec05d0-aura` · base `main` = `e962345`
(PR #27 fusionnée). Aucune fusion, aucun déploiement de production, aucune
variable de production modifiée.

Ce rapport ne décrit que ce qui a été **exécuté**. Quand quelque chose n'a pas
pu être fait (nom de branche imposé, test de navigateur réel), c'est écrit
comme tel, avec la raison.

---

## 1. Objectif et périmètre

Un compte AURA perdu l'était définitivement : ni vérification d'adresse, ni
mot de passe oublié, ni changement de mot de passe, ni visibilité sur les
sessions ouvertes. La mission ajoute ces quatre capacités en prolongeant
l'architecture existante (KV, sessions hachées, cookies, limitation, i18n) —
sans nouvelle base, sans nouveau cadre, sans secret côté navigateur.

Décisions produit validées avant de coder :

| Sujet | Décision |
|---|---|
| Vérification d'e-mail | **non bloquante** : bandeau + renvoi, jamais de fermeture d'accès |
| Sessions actives | **complètes** : création, appareil (agent), dernière activité |
| Fournisseur d'e-mail | **Resend en REST via `fetch`**, abstraction serveur, aucun paquet ajouté |

## 2. Architecture retenue

```
server/mail/adaptateur.ts   configuration + POST HTTP + garde-fous + délais
server/mail/gabarits.ts     modèles FR/EN (HTML + texte), échappement
server/mail/service.ts      construction des liens + envois
server/auth/recuperation.ts routes publiques (/api/auth/*)
server/v1/routesCompte.ts   routes privées (mot de passe, sessions, renvoi)
server/db/base.ts           + ecrireTtl(), + reserver() (SET … NX EX)
server/db/entrepots.ts      + EntrepotJetons, révocation de sessions, activité
```

Tout passe par le `BaseDeDonnees` existant : pilote KV en production, pilote
fichier en développement. Aucun ORM, aucun service externe comme source de
vérité.

## 3. Fichiers

**Créés (12)**

| Fichier | Lignes | Rôle |
|---|---:|---|
| `server/auth/recuperation.ts` | 365 | 4 routes publiques + émission des jetons |
| `server/mail/adaptateur.ts` | 167 | configuration, envoi, refus honnêtes |
| `server/mail/gabarits.ts` | 171 | modèles FR/EN |
| `server/mail/service.ts` | 63 | liens + envois typés |
| `server/v1/routesCompte.ts` | 232 | mot de passe, sessions, renvoi |
| `src/components/auth/CadreAuth.tsx` | 33 | cadre commun des écrans |
| `src/components/auth/SecuriteCompte.tsx` | 280 | bloc sécurité des paramètres |
| `src/pages/MotDePasseOubliePage.tsx` | 102 | demande de lien |
| `src/pages/ReinitialiserPage.tsx` | 131 | nouveau mot de passe |
| `src/pages/VerifierEmailPage.tsx` | 96 | confirmation d'adresse |
| `docs/security/RECUPERATION-COMPTE.md` | 123 | modèle de sécurité |
| `docs/architecture/EMAIL-TRANSACTIONNEL.md` | 121 | transport et configuration |

**Tests créés** : `tests/jetons.test.ts` (170), `tests/mail.test.ts` (284),
`tests/recuperation.test.ts` (586), `tests/pages-compte.test.ts` (140).

**Modifiés (21)** : `server/accounts.ts` (durées, `creerJeton`, `creerSession(agent)`,
`emailValide`), `server/api.ts` (montage `/auth`, agent de session, envoi
d'inscription), `server/db/base.ts`, `server/db/entrepots.ts`,
`server/db/types.ts`, `server/v1/middlewares.ts` (portées + `session`),
`server/v1/routes.ts`, `src/App.tsx`, `src/app/dictionaries.ts`,
`src/app/session.tsx`, `src/components/layout/WorkspaceLayout.tsx`,
`src/index.css`, `src/pages/AuthPage.tsx`, `src/pages/ParametresPage.tsx`,
`src/services/api.ts`, `src/services/types.ts`,
`tests/auth-durcissement.test.ts` (base factice complétée),
`.env.example`, `README.md`, `docs/api/README.md`, `docs/database/README.md`.

## 4. Routes

| Méthode | Route | Auth | Réponse |
|---|---|---|---|
| POST | `/api/auth/forgot-password` | publique | `202 { ok }` **identique** dans tous les cas ; `503 mail-indisponible` |
| POST | `/api/auth/reset-password` | jeton | `200 { ok, sessionsFermees }` ; `400 jeton-invalide` / `jeton-expire` |
| POST | `/api/auth/verify-email` | jeton | `200 { compte }` ; `400` si invalide/expiré/déjà utilisé |
| POST | `/api/auth/resend-verification` | publique | `202 { ok }` identique ; `503` sans fournisseur |
| POST | `/api/v1/me/password` | session | `200 { ok, sessionsFermees }` ; `401 mot-de-passe` ; `400 identique` |
| GET | `/api/v1/me/sessions` | session | `200 { sessions[] }` |
| DELETE | `/api/v1/me/sessions/:id` | session | `200` ; `400 session-courante` ; `404` |
| POST | `/api/v1/me/sessions/revoquer-autrui` | session | `200 { sessionsFermees }` |
| POST | `/api/v1/me/email/renvoyer` | session | `202` ; `409 deja-verifie` ; `503` |

**Écarts assumés par rapport aux noms suggérés** : `POST /api/v1/me/password`
au lieu de `change-password`, `revoquer-autrui` au lieu de `revoke-others`
(le reste de l'API est en français et en kebab-case ; la cohérence interne
prime). Les anciennes routes (`/api/auth/login`, `/register`, `/logout`,
`/api/me`) sont **inchangées**.

Écrans : `/mot-de-passe-oublie`, `/reinitialiser`, `/verifier-email`
(publiques), plus les blocs sécurité de `/parametres` et un bandeau
non bloquant dans l'espace de travail.

## 5. Modèle de données

```ts
Compte   += emailVerifie?: boolean; emailVerifieLe?: string;
Session  += agent?: string; derniereActivite?: number;   // écriture ≤ 1×/5 min
Jeton     = { id /* sha256 */, type, userId, cree, expire, utiliseLe, empreinteEmail }
TypeJeton = 'verification' | 'reinitialisation'
```

Clés KV (toutes nouvelles, aucun conflit avec l'existant) :

| Clé | Contenu |
|---|---|
| `aurav1:jeton:<sha256>` | enregistrement du jeton (TTL = durée de vie) |
| `aurav1:jeton-actif:<userId>:<type>` | dernier jeton émis (TTL identique) |
| `aurav1:jeton-verrou:<sha256>` | verrou d'usage unique (`SET NX EX 120`) |

Le **jeton brut n'est jamais stocké** : la clé est son empreinte SHA-256, et
un test lit le fichier de stockage pour le prouver. Les champs ajoutés sont
**optionnels** : les comptes et sessions existants restent lisibles, sans
migration ni invalidation (test « Comptes existants »).

## 6. Sécurité

| Garantie | Mise en œuvre | Test |
|---|---|---|
| 256 bits d'entropie | `randomBytes(32).toString('base64url')` | `jetons.test.ts` |
| Aucun jeton en clair | clé = sha256 ; e-mail seul porteur | `jetons.test.ts`, `recuperation.test.ts` |
| Usage unique atomique | `SET … NX EX 120` avant écriture | `jetons.test.ts` (6 concurrents → 1), `recuperation.test.ts` (2 simultanés → 200/400) |
| Expiration double | TTL à l'écriture + contrôle à la lecture | `jetons.test.ts`, `recuperation.test.ts` |
| Anti-énumération | 202 identique + plancher de 350 ms + 503 avant recherche | `recuperation.test.ts` |
| Pas de tromperie | sans fournisseur : 503, aucun jeton créé, aucun e-mail | `recuperation.test.ts` |
| Réinitialisation = expulsion | toutes les sessions supprimées | `recuperation.test.ts` |
| Cloisonnement des comptes | révocation croisée → 404 | `recuperation.test.ts` |
| Liens non détournables | `AURA_PUBLIC_ORIGIN` déclarée, jamais `Host` | `mail.test.ts` |
| Injection HTML dans l'e-mail | nom échappé | `mail.test.ts` |
| Limitation par portée | 6 nouvelles portées, compteurs séparés | `recuperation.test.ts` (429 à la 4ᵉ demande) |

Limites : oubli 10 / 15 min (IP) et 3 / heure (adresse) ; renvoi 5 / 15 min et
3 / heure ; vérification 30 / 10 min ; réinitialisation 20 / 10 min ;
changement de mot de passe 5 / 15 min par compte.

## 7. Tests exactement exécutés

```bash
npm test                 # node --import tsx --test tests/*.test.ts
```

**156 tests, 156 réussis, 0 échec** (97 avant la mission, +59).

| Fichier | Tests | Contenu |
|---|---:|---|
| `tests/jetons.test.ts` | 11 | génération 32 octets, empreinte seule, expiration, révocation, usage unique concurrent |
| `tests/mail.test.ts` | 18 | configuration, refus honnêtes, contrat HTTP (fetch bouchonné), délai, modèles FR/EN |
| `tests/recuperation.test.ts` | 23 | parcours complets : oubli, réinitialisation, vérification, mot de passe, sessions, compatibilité |
| `tests/pages-compte.test.ts` | 7 | rendu des trois écrans, liens, parité FR/EN |
| existants | 97 | inchangés, toujours verts |

Aucun test ne touche un service externe : base temporaire par fichier, `fetch`
sortant bouchonné.

## 8. Build

```bash
npm run build   # vite build
```

```
dist/assets/index-*.css    117.95 kB │ gzip:  22.32 kB
dist/assets/index-*.js     688.03 kB │ gzip: 211.97 kB
✓ built in ~700 ms
```

`./node_modules/.bin/tsc --noEmit` : **0 erreur**.

## 9. `verif:prod`

```bash
npm run verif:prod
```

```
✓ Production : le mode simulation ne peut pas être activé.
✓ CSP : 6 références du document contrôlées, fonts.googleapis.com, fonts.gstatic.com.
✓ Cohérence : 13 directives identiques dans vercel.json et le serveur.
  1 paquet(s) vérifié(s), 671 ko lus.
```

Aucune directive CSP n'a été ajoutée ni retirée : les nouvelles pages ne
chargent **aucune ressource distante** (pas d'image, pas de police, pas de
script tiers).

## 10. Tests navigateur — ce qui a réellement été exécuté

**Aucun navigateur réel n'a été lancé** : `puppeteer-core` et Chromium sont
absents de l'environnement (déjà constaté en mission 07). Je ne prétends donc
pas avoir testé le rendu visuel, le focus ou les animations.

Ce qui a été exécuté à la place, et qui reste une preuve réelle :

- **rendu serveur** (`react-dom/server`) des trois écrans avec un `window`
  minimal : ils s'exécutent sans erreur, affichent les bons libellés, les bons
  liens, et n'émettent aucune requête au rendu (`tests/pages-compte.test.ts`) ;
- **parcours HTTP complets** sur un vrai serveur Express (port éphémère,
  cookies réels) pour chaque flux, y compris les cas limites
  (`tests/recuperation.test.ts`) ;
- **absences vérifiées** : pas de jeton stocké, pas d'e-mail capturé sans
  fournisseur, pas de session survivante après réinitialisation.

Risque résiduel assumé : un défaut purement visuel (alignement, contraste)
sur ces trois pages ne serait pas détecté automatiquement.

## 11. Variables d'environnement

Ajoutées à `.env.example` (aucune valeur réelle, aucun secret) :

| Variable | Rôle | Défaut |
|---|---|---|
| `AURA_MAIL_PROVIDER` | fournisseur (`resend`) | — obligatoire |
| `AURA_MAIL_API_KEY` | clé serveur | — obligatoire |
| `AURA_MAIL_FROM` | expéditeur vérifié | — obligatoire |
| `AURA_MAIL_REPLY_TO` | adresse de réponse | absente |
| `AURA_PUBLIC_ORIGIN` | origine des liens | — obligatoire |
| `AURA_MAIL_API_URL` | point d'entrée | `https://api.resend.com` |
| `AURA_MAIL_TIMEOUT_MS` | délai d'un envoi | `8000` (1 000–20 000) |
| `AURA_JETON_VERIFICATION_HEURES` | durée de vie du lien d'adresse | `24` (1–168) |
| `AURA_JETON_REINITIALISATION_MINUTES` | durée de vie du lien de réinitialisation | `30` (5–120) |

Les durées sont **centralisées côté serveur** (`server/accounts.ts`) et
bornées : une valeur absurde est ramenée dans l'intervalle, jamais acceptée
telle quelle.

## 12. Fournisseur d'e-mail : état réel de la configuration

- Fournisseur retenu : **Resend**, appelé en REST (`POST /emails`), sans
  dépendance npm.
- **Aucune clé n'a été demandée, créée ou utilisée.** L'environnement de
  développement de cette mission n'a pas de fournisseur configuré.
- Comportement vérifié dans cet état : `503 { code: "mail-indisponible" }`,
  **aucun jeton créé**, **aucun e-mail annoncé comme parti**, rien dans les
  journaux au-delà du statut HTTP.
- **Aucun e-mail réel n'a donc été envoyé.** Les tests utilisent un `fetch`
  bouchonné qui capture la requête, sans sortie réseau.
- Pour activer en production (hors périmètre de cette mission) : renseigner
  les sept variables, vérifier le domaine expéditeur chez le fournisseur,
  puis rejouer `npm run verif:prod`.

## 13. Risques résiduels et écarts

| Sujet | État |
|---|---|
| Nom de branche `feat/aura-account-recovery` | **non créé** : la session est liée à `arena/a5ec05d0-aura`. Écart sur le nom uniquement, signalé à l'avance. |
| Noms de routes `change-password` / `revoke-others` | remplacés par `me/password` / `revoquer-autrui`, cohérents avec le reste de l'API |
| Test navigateur | non exécuté (pas de Chromium) ; rendu serveur + parcours HTTP à la place |
| Boîte mail compromise | inhérent ; mitigé par la fermeture de toutes les sessions |
| Coût d'envoi abusif | limité par IP et par adresse |
| Vérification d'adresse | non bloquante par décision produit ; les comptes antérieurs sont traités comme non vérifiés |
| Envoi depuis l'inscription | en tâche de fond, best-effort : un échec d'e-mail ne fait **jamais** échouer l'inscription |

## 14. État Git et PR

| Élément | Valeur |
|---|---|
| Branche de session | `arena/a5ec05d0-aura` |
| Base | `main` = `e96234507b42f1b46339c9770a967427e905083a` |
| Commit de la mission | _(voir le message de clôture — SHA consigné après le commit)_ |
| Pull request | _(ouverte vers `main`, **non fusionnée** — URL consignée après création)_ |
| Déploiement | **aucun** : pas de fusion, pas de promotion en production |
| Variables de production | **aucune modification** |
