# Architecture cible — AURA Workspace

> **Note (2026-11-06)** : la couche IA décrite ici (fournisseur Gemini
> unique) a été reconstruite en architecture multi-fournisseurs — voir
> [`AI-MULTI-PROVIDER.md`](./AI-MULTI-PROVIDER.md). Le reste du document
> reste valide (persistance, routes, frontend).

> Suite à la [proposition technique](000-proposition-technique.md). État
> implémenté sur la branche `arena/3bf5199b-aura`.

## 1. Vue d'ensemble

```mermaid
flowchart TB
    subgraph Navigateur["Navigateur (React 19 + Vite)"]
        UI["Pages : Vue d'ensemble, Assistant, Projets, Explorer, Missions, Studio, Mémoire, Historique, Paramètres"]
        SVC["src/services — client API typé (api.ts) + miroir simulation (local.ts)"]
        MD["Rendu Markdown sûr (aucun HTML injecté)"]
        UI --> SVC
    end

    subgraph API["Serveur Express (server.ts dev / api/index.ts Vercel)"]
        V1["/api/v1 — middlewares : session, auth obligatoire, validation, rate-limit"]
        MET["/api — routes historiques : status, auth, me, chat (compatibilité)"]
        SRV["Services métier : contexte (profil + mémoire + projet)"]
        IA["Couche IA : registre + routage + repli unique"]
        RECH["Connecteurs de recherche (grounding sourcé)"]
        DB["server/db — entrepôts (isolation par compte, migrations)"]
    end

    subgraph Stockage["Stockage"]
        KV["Vercel KV (prod) — clés aurav1:*"]
        FIC["Fichier JSON atomique (dev) — data/auradb.json"]
    end

    subgraph Fournisseurs["Fournisseurs IA (côté serveur uniquement)"]
        GEM["Gemini REST (generateContent, SSE, responseSchema, grounding)"]
        MOCK["Mock (tests uniquement)"]
    end

    SVC -->|cookies HttpOnly| V1
    SVC -->|compat| MET
    V1 --> SRV --> IA
    V1 --> RECH
    V1 --> DB
    MET --> DB
    IA --> GEM
    IA --> MOCK
    DB --> KV
    DB --> FIC
    RECH --> GEM
```

## 2. Assistant : contexte et flux

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend (services)
    participant A as API /v1
    participant S as Service contexte
    participant I as Registre IA
    participant G as Gemini

    U->>F: message (saisie / voix)
    F->>A: POST /conversations/:id/messages (SSE)
    A->>A: session + propriété de la conversation
    A->>S: construireContexte(profil, préférences, projet, mémoires actives)
    S-->>A: system prompt + ids de mémoires utilisées
    A->>I: streamResponse(capacités requises)
    I->>G: streamGenerateContent (clé serveur)
    G-->>I: chunks SSE
    I-->>A: chunks
    A-->>F: events chunk / done / error
    A->>A: persistance user + assistant (statut, meta.memoiresUtilisees)
    F-->>U: rendu Markdown progressif + arrêt possible
```

## 3. Modules et dépendances

| Module | Route | Service | Entités | Capacité déclarée |
|---|---|---|---|---|
| Vue d'ensemble | `/app` | agrégation services | conversations, projets, missions, créations | toujours |
| Assistant | `/chat`, `/chat/:id` | conversations + ai | conversations, messages | `assistant.ok` |
| Projets | `/projets`, `/projets/:id` | projets | projets (+ éléments rattachés) | `comptes` |
| Explorer | `/explore` | search | recherches, sources | `recherche.ok` |
| Missions | `/missions` | missions (+ `aide` structuré) | missions, sous-tâches | `comptes` (+ IA pour l'aide) |
| Studio | `/studio` | studio | créations, versions | `studio.ok` |
| Mémoire | `/memoire` | mémoire | mémoires | `comptes` |
| Historique | `/historique` | conversations | conversations | `comptes` |
| Paramètres / AURA Local | `/parametres` | compte + préférences | profil, préférences | `comptes` |

**Règle d'interface (système de capacités)** : le backend expose l'état réel
via `GET /api/v1/capabilities` ; chaque écran affiche les états honnêtes
(indisponible, non configuré) et n'annonce jamais une fonction inexistante.

## 4. Frontend — structure

Migration progressive (décision d'architecture) : les pages restent dans
`src/pages/` (organisation existante conservée), la logique d'accès aux
données a été extraite vers `src/services/` (`api.ts` = client HTTP typé +
`local.ts` = miroir du mode simulation), les briques UI vers
`src/components/ui/` (Markdown sûr, Dialogue accessible, états communs).
Toute la logique métier est hors composants (serveur ou services).

## 5. Décisions justifiées

| Décision | Justification |
|---|---|
| Agrégat JSON par utilisateur + index globaux (plutôt qu'une vraie BDD) | Contrainte Vercel réelle : pas de base SQL disponible sans provisionnement ; le contrat `BaseDeDonnees` est isolé, un pilote SQL peut être branché sans toucher au métier. Tailles plafonnées (3000 messages/compte, 300/fil). |
| Sessions opaques empreintées (sha256), pas de JWT | Révocation immédiate (déconnexion), pas de secret longue durée côté client. |
| Streaming SSE plutôt que WebSocket | Compatible serverless Vercel (30 s), suffisant pour du texte ; l'arrêt utilisateur passe par `AbortController` des deux côtés. |
| Markdown rendu en éléments React (parseur restreint) | Zéro surface XSS par conception, contrairement à `dangerouslySetInnerHTML`. |
| Recherche : connecteur grounding | Sources réelles extraites des métadonnées ; sans moteur, UI indisponible — jamais de liens inventés. |
| Régénération côté serveur (`regenerer: true`) | Pas de faux message utilisateur ; la réponse précédente est remplacée dans l'historique. |
| Un seul répertoire `server/` par couche (db, ai, search, services, v1) | « Proportionné » : pas de couches vides ; l'extension se fait par fichier. |
