# 020 — Toute l'API v1 répondait 500 en production

**Date** : 2026-11-09 · **Branche** : `arena/68530d66-aura`

## Symptôme observé sur le site en production

Toutes les routes `/api/v1/*` répondaient :

```json
{"error":"Erreur interne du service.","code":"interne"}
```

alors que `/api/status` et `/api/me` répondaient normalement. Conséquence :
conversations, projets, missions, mémoire, studio, paramètres, sessions —
**tout le workspace** était inutilisable côté serveur, alors que l'interface
s'affichait.

Constat reproduit sur `https://aura-seven-mocha-51.vercel.app` :

| Requête | Attendu | Obtenu |
|---|---|---|
| `GET /api/status` | 200 | 200 |
| `GET /api/me` | 401 `anonyme` | 401 `anonyme` |
| `GET /api/v1/capabilities` | 200 | **500 `interne`** |
| `GET /api/v1/conversations` | 401 `anonyme` | **500 `interne`** |
| `GET /api/v1/route-inexistante` | 401/404 | **500 `interne`** |

## Cause

Deux faits qui, séparément, ne posent aucun problème :

1. `api/index.ts` (fonction serverless) chargeait `createApiApp()` — un
   **routeur** Express — et l'appelait directement : `app(req, res, next)`.
   Une application Express installe les accesseurs `req.path`, `res.json`,
   `res.status`… ; un routeur appelé « nu » ne les installe pas.
2. La garde de confirmation d'adresse, ajoutée le même jour, lisait
   `req.path.replace(...)` **avant** de tester les exceptions.

En développement comme en auto-hébergement, le routeur est monté dans une
application (`app.use('/api', …)`), donc tout fonctionnait. En production,
`req.path` n'existe pas : le `TypeError` partait dans le gestionnaire
d'erreurs, qui répondait `500 interne` pour chaque requête v1.

## Correctifs

- **`api/index.ts`** : le routeur est désormais monté dans une application
  Express (`const app = express(); app.use(createApiApp())`), exactement
  comme dans `server.ts`. Les accesseurs Express existent donc quel que soit
  l'appelant.
- **`server/v1/routes.ts`** : `cheminSousRouteur(req)` remplace `req.path`.
  La fonction ne peut pas lever : elle lit `url`, puis `originalUrl`, et
  normalise le chemin. Même si un futur hébergeur appelle le routeur
  autrement, la garde reste valable.
- **`tests/fonction-serverless.test.ts`** : le test appelle `api/index.ts`
  comme le fait Vercel (requête Node brute, réécriture `__path`). Il vérifie
  `/status`, `/v1/capabilities`, `/v1/conversations` (401), une route v1
  inconnue (jamais 500), et le parcours complet inscription → espace →
  création de conversation. Ce test aurait échoué avant le correctif.

## Ce que `/api/status` dit maintenant

Le statut public expose `config.mailConfiguree` et
`config.verificationEmail`, et ajoute une entrée `setup.mail` quand aucun
envoi n'est possible. Aucun nom de fournisseur, aucune variable, aucune clé
n'y figure : seulement l'état, pour que l'exploitant puisse lire sur le site
ce qui reste à configurer.

## Ce qui reste à configurer

| Élément | Impact tant qu'il manque | Où |
|---|---|---|
| Fournisseur d'e-mails (`AURA_MAIL_PROVIDER`, `AURA_MAIL_API_KEY`, `AURA_MAIL_FROM`, `AURA_PUBLIC_ORIGIN`, domaine vérifié) | confirmation d'adresse **et** mot de passe oublié indisponibles ; `verificationEmail = "impossible"` donc accès ouvert sans confirmation | Vercel → Settings → Environment Variables, puis **Redeploy** |
| `AURA_VERIFICATION_EMAIL_OBLIGATOIRE=1` (optionnel) | force la confirmation même sans fournisseur ; l'inscription répond alors 503 `mail-indisponible` | idem |
| Génération d'images | aucun adaptateur n'implémente `generationImages` : ce n'est pas un réglage mais du code à écrire, avec un coût par image | `server/ai/`, voir tarifs relevés en session |
| Pièces jointes | `fichiers.ok = false` : nécessite un stockage objet (S3/R2/Blob) en plus du code d'envoi | `server/v1/routes.ts` |
| Recherche sourcée | `recherche.ok = false` : nécessite un moteur qui renvoie des sources | `server/ai/` |
| Clés IA | sans elles `chat`, `explore`, `studio` passent en `setup-required` (production actuelle : `iaConfiguree = true`) | déjà configuré |

Rappel : une variable ajoutée dans Vercel **ne s'applique qu'après un
Redeploy** (Deployments → ⋯ → Redeploy → Ready).
