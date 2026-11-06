# Proposition d'architecture technique — Workspace AURA

> Livrable préalable de la mission « AURA WORKSPACE ». Ce document guide
> l'implémentation ; il est mis à jour si le code réel diverge. Le rapport
> d'implémentation final se trouve dans `docs/analyse/`.

## 1. Architecture actuelle (vérifiée dans le code, commit `c8069b7`)

| Couche | État réel |
|---|---|
| Frontend | React 19 + React Router 7 + Vite 8 + TS. Pages dans `src/pages/`, coque `WorkspaceLayout` (rail + topbar + contenu), dictionnaires FR/EN, thème clair/sombre, identité « Rubans & sculpture ». |
| Backend | Express (`server.ts` dev avec middleware Vite, `api/index.ts` serverless Vercel qui réécrit `__path`). API unique `server/api.ts`. |
| Auth | Réelle : scrypt (node:crypto), jetons opaques empreintés (sha256) côté serveur, cookie HttpOnly SameSite=Lax, rate limiting mémoire. |
| Stockage | Interface `Magasin` : fichier JSON (dev, `data/comptes.json`) ou Vercel KV REST (prod). Un seul document `aura:comptes` {utilisateurs, sessions}. 503 honnête si non configuré sur Vercel. |
| IA | `server/chat.ts` : Gemini REST `generateContent` (modèle `gemini-3.8-flash`), sans streaming, sans persistance serveur. Histoire de chat = localStorage. |
| Données navigateur | Historique de chat (`aura_historique`), missions (`aura_missions_v1`), simulation (`aura_sim_*`) — localStorage uniquement. |
| Déploiement | Vercel (`vercel.json`), fonction unique `api/index.ts` maxDuration 30s. |

**Fonctionnel aujourd'hui** : site public, auth réelle (avec KV), chat Gemini non
streamé (si `GEMINI_API_KEY`), historique local, missions locales, simulation
clairement étiquetée (dev par défaut, entrée volontaire en prod).
**Partiel** : dashboard (données locales), Studio/Explore (coquilles honnêtes).
**Simulé (badgé)** : mode démonstration uniquement.

## 2. Problèmes structurels

1. **Persistance utilisateur absente côté serveur** — conversations, missions,
   projets vivent dans le navigateur ; impossible de retravailler depuis un autre
   appareil (critère d'acceptation §23 non satisfait).
2. **Aucun modèle de données** au-delà de {utilisateurs, sessions} : pas de
   conversations/messages/projets/missions/mémoire.
3. **IA monolithique** : un seul appel Gemini non typé par capacité, pas de
   streaming, pas d'abstraction fournisseur, pas de sortie structurée.
4. **API non versionnée**, routes mélangées, pas de couche service.
5. **Frontend** : logique métier dispersée dans les pages, pas de couche
   services, pas de lazy-loading de routes.
6. **Pas de tests automatisés** dans le dépôt (uniquement des scripts de
   vérification externes lors des missions précédentes).
7. La cloche « notifications » de la topbar n'a aucune réalité fonctionnelle.

## 3. Architecture cible

Principe : **évolution progressive**, le backend devient le centre de contrôle,
le frontend consomme une API versionnée via une couche services. Aucune
réécriture brutale — les pages existantes restent en place et sont migrées
module par module.

```
Navigateur (React 19)
  ├─ app/ (prefs, session, simulation)      — conservé
  ├─ services/ (client API typé)            — nouveau
  ├─ features/ (modules fonctionnels)       — nouveau (migration progressive)
  └─ components/ (ui, layout, motion)       — conservé
        │  fetch /api/v1/* (cookies HttpOnly)
        ▼
API Express (server/api.ts → monte server/v1/)
  ├─ middlewares : session, rate-limit, validation
  ├─ v1/ : contrôleurs HTTP fins
  ├─ services/ : métier (conversations, projets, missions, mémoire, studio, recherche)
  ├─ ai/ : registre + routage + adaptateurs (gemini, mock)
  ├─ search/ : connecteurs de recherche (gemini-grounding)
  └─ db/ : interface de persistance + pilotes (json-dev, kv-vercel, indisponible)
        │
        ▼
Stockage : Vercel KV (prod) / fichier JSON atomique (dev) — schéma versionné
```

Organisation backend : **routes (validation, statuts) → services (règles métier)
→ db/ai (infrastructure)**. Pas de couches supplémentaires sans utilité.

## 4. Modules à développer et interactions

| Module | Route frontend | Service | Données |
|---|---|---|---|
| Vue d'ensemble | `/app` | agrégation temps réel | conversations, projets, missions, studio |
| Assistant | `/chat`, `/chat/:id` | conversations + ai | conversations, messages |
| Projets | `/projets`, `/projets/:id` | projets | projects, instructions |
| Explorer | `/explore` | search | searchSessions, searchSources |
| Missions | `/missions` | missions (+IA structurée) | missions, sousTâches |
| Studio | `/studio` | studio (jobs + versions) | studioJobs |
| Mémoire | `/memoire` | memoire (contrôle utilisateur) | memories |
| Historique | `/historique` | conversations | conversations |
| Paramètres / AURA Local | `/parametres` | profil & préférences | userProfil, preferences |
| Capacités | — | capabilities | lecture env + providers |

Interactions clés : un projet agrège conversations + missions + recherches +
créations ; la mémoire et le profil contextuel alimentent le **contexte envoyé
au modèle** (sélection explicite, jamais tout l'historique) ; l'assistant peut
proposer des missions (sortie structurée) que **l'utilisateur valide avant
enregistrement** ; une recherche peut devenir document (Studio) ou mission.

## 5. Modèle de données (logique — voir `docs/database/`)

`users`, `user_profiles`, `user_preferences`, `sessions`, `conversations`,
`messages`, `projects`, `missions`(+`mission_subtasks`), `memories`,
`search_sessions`, `search_sources`, `studio_jobs`, `studio_versions`,
`usage_events`, `feedback` — tous rattachés à un propriétaire, indexés par
utilisateur + date, suppression en cascade côté propriétaire uniquement.

Implémentation physique : agrégat JSON par utilisateur (`aurav1:data:<userId>`)
+ index globaux d'auth (`aurav1:email:<email>`, `aurav1:session:<empreinte>`).
Schéma versionné (`schemaVersion`) avec migrations à la lecture. Pilotes
interchangeables derrière l'interface `BaseDeDonnees` (un futur pilote SQL
implémente la même interface).

## 6. API (proposition adaptée à l'existant — voir `docs/api/`)

`/api/status`, `/api/auth/*`, `/api/me`, `/api/chat` **conservés** (compat).
Nouveau `/api/v1/` : `me`, `preferences`, `capabilities`, `conversations`
(CRUD + `POST :id/messages` avec streaming SSE optionnel), `projects`,
`missions` (+ `POST /missions/aide` = proposition IA), `memories`, `search`,
`studio/jobs`, `studio/artifacts`. Contrats : JSON, validation serveur, codes
HTTP explicites, `{ error, code }` uniforme, auth obligatoire sur toutes les
routes privées + vérification de propriété systématique.

## 7. Architecture IA (voir `docs/ai/`)

Interface `AiProvider` (`generateResponse`, `streamResponse`,
`generateStructuredOutput`, `checkAvailability`, `getCapabilities`) +
**registre** (enregistrement, sélection, désactivation) + **routage** par
capacité requise avec repli unique et maîtrisé. Adaptateurs : `gemini`
(existant, enrichi streaming + JSON structuré + grounding), `mock` (tests,
aucun appel payant). Secrets serveur uniquement. Aucune mention publique de la
politique de choix de modèles. Capacités réelles exposées via
`/api/v1/capabilities` ; l'UI n'affiche que ce qui fonctionne.

## 8. Risques techniques

| Risque | Mitigation |
|---|---|
| KV Vercel : taille de valeur limitée | agrégat par utilisateur + pagination des messages ; documenté |
| Serverless : 30 s max, pas de tâches longues | streaming SSE, jobs Studio synchrones courts ; jobs longs documentés comme limite |
| Pas de stockage objet disponible | pièces jointes = capacité `fichiers: false` honnête (architecture prête) |
| Recherche sans moteur dédié | connecteur grounding Gemini (sources réelles extraites des métadonnées), sinon UI indisponible |
| Injection de prompt / données utilisateur dans le contexte | séparation instruction système / contenu, sélection explicite, limites de taille, validation des sorties structurées |
| Régressions visuelles | identité conservée, tokens CSS existants, vérifications headless responsive + parcours |

## 9. Ordre de réalisation (aligné §20)

1. **Fondations** : db + services + API v1 + auth/profil/préférences + dashboard
   réel + capacités. → l'utilisateur se connecte et retrouve ses données.
2. **Cœur conversationnel** : conversations persistées, streaming, arrêt,
   régénération, historique serveur, contexte.
3. **Projets & Missions** : CRUD complet, isolation, IA structurée validée par
   l'utilisateur.
4. **Mémoire & contexte local** : mémoire contrôlée, profil contextuel injecté.
5. **Explorer & Studio** : recherche sourcée réelle, créations avec versions.
6. **Multimodalité** : voix (navigateur, capacité réelle), confort, docs, tests.

Chaque étape livrée testée ; aucune simulation présentée comme réelle.
