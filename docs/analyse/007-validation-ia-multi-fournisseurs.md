# 007 — Validation réelle et mise en service du système IA multi-fournisseurs

Date : 2026-11-06 · Branche : `arena/be1c6bed-aura` · Base : `0fda66c` (main après PR #21)

Mission 02 : valider réellement les trois intégrations (Gemini, Groq,
OpenRouter), le routeur, le fallback, le streaming, l'intégration dans
AURA, la sécurité et l'observabilité — sans inventer de résultat.

> **Limite d'exécution — lue avant tout le reste.** L'environnement de
> travail (bac à sable) ne dispose d'**aucun accès sortant** vers
> `generativelanguage.googleapis.com`, `api.groq.com` ou `openrouter.ai`
> (vérifié à chaque étape : connexion refusée, aucun proxy). **Aucun appel
> réel aux API publiques n'a donc pu être exécuté depuis cet environnement
> et aucun résultat « Réussi » n'est revendiqué pour les appels réels.**
> Le diagnostic livré (`scripts/verifier-cles.cjs`) produit le tableau
> réel en une commande depuis une machine avec accès Internet — c'est la
> procédure de validation finale (§H).

## A. État général

| Élément | État |
|---|---|
| Système IA multi-fournisseurs | Opérationnel (architecture, routeur, fallback, streaming, observabilité validés) |
| Clés API | **3/3 présentes** localement (`.env`, hors Git, jamais affichées) |
| Fournisseurs authentifiés (appel réel réussi) | **0/3 — non vérifiable depuis ce bac à sable** (réseau sortant bloqué) |
| Configuration détectée par l'application | 3/3 (`assistant.ok`, `recherche.ok`, `studio.ok` = true) |
| Encore à configurer | Rien côté dépôt ; variables Vercel si pas encore faites (§H) |

## B. Résultats des tests réels

### B1. Appels réels aux API publiques — résultat du diagnostic exécuté ici

```
AURA AI PROVIDERS HEALTH CHECK
==============================

Gemini
------
  Configuration    : OK
  Authentification : NON TESTÉE (réseau)
  Génération       : ÉCHEC (réseau injoignable)

Groq
----
  Configuration    : OK
  Authentification : NON TESTÉE (réseau)
  Génération       : ÉCHEC (réseau injoignable)

OpenRouter
----------
  Configuration    : OK
  Authentification : NON TESTÉE (réseau)
  Génération       : ÉCHEC (réseau injoignable)

Bilan : 0/3 fournisseur(s) opérationnel(s) — durée totale 59 ms
```

| Test | Gemini | Groq | OpenRouter |
|---|---|---|---|
| Configuration (clé lue, jamais affichée) | Réussi | Réussi | Réussi |
| Authentification (appel réel) | **Non testé** | **Non testé** | **Non testé** |
| Génération (appel réel) | **Non testé** | **Non testé** | **Non testé** |
| Conversations (appel réel) | **Non testé** | **Non testé** | **Non testé** |
| Streaming (appel réel) | **Non testé** | **Non testé** | **Non testé** |
| Gestion des erreurs (appel réel) | **Non testé** | **Non testé** | **Non testé** |

Le script `node scripts/verifier-cles.cjs` (voir §H) exécute pour chaque
fournisseur : génération, conversations multi-messages + message système,
streaming (fragments + durée), modèle invalide (erreur structurée), timeout
normalisé — avec classification des erreurs (configuration /
authentification / quota / modèle / réseau / délai) et durées mesurées.

### B2. Ce qui a été validé contre des fournisseurs simulés AU FORMAT D'API RÉEL

Seul le point d'entrée réseau est simulé (stubs HTTP locaux émettant les
formats SSE exacts de Gemini et compatibles-OpenAI) ; toute la chaîne
applicative est réelle. Conformément à la mission, les erreurs sont
provoquées par mocks/stubs — jamais sur les comptes réels.

| Comportement | Gemini (stub) | Groq (stub) | OpenRouter (stub) |
|---|---|---|---|
| Génération de texte | Réussi | Réussi | Réussi |
| Conversations multi-messages + système | Réussi | Réussi | Réussi |
| Streaming (fragments, ordre, fin) | Réussi | Réussi | Réussi |
| Erreurs normalisées (401/429/400/5xx) | Réussi | Réussi | Réussi |
| Timeout client | Réussi | Réussi | Réussi |
| Sortie structurée / grounding sources | Réussi (grounding) | Réussi (json_schema) | Réussi (json_object) |

## C. Routage et fallback

Tous les scénarios testés par stubs HTTP / mocks (`tests/ai.test.ts`, 61 tests) :

| Scénario | Résultat |
|---|---|
| Requête normale → fournisseur principal configuré (ordre `AI_FALLBACK_ORDER`, défaut épinglé) | ✅ |
| Capacité particulière (image, sources, code, structurée) → fournisseur compatible uniquement | ✅ |
| Fournisseur non configuré jamais sélectionné (même en tête d'ordre) | ✅ |
| Fournisseur temporairement indisponible écarté de la chaîne | ✅ |
| Alternative compatible sélectionnée automatiquement | ✅ |
| Quota épuisé connu → aucune nouvelle requête au fautif (fenêtre de 5 min) | ✅ |
| Politiques de priorité respectées (déterministes, configurées) | ✅ |
| Fallback : Gemini ↓ → Groq sert | ✅ |
| Fallback : Groq ↓ → OpenRouter sert | ✅ |
| Fallback : OpenRouter ↓ → Gemini sert | ✅ |
| Deux fournisseurs ↓ → le troisième sert (1 appel chacun, zéro boucle) | ✅ |
| Tous ↓ → erreur structurée unique (502) | ✅ |
| Erreur de quota → bascule + état mémorisé | ✅ |
| Timeout → bascule | ✅ |
| Erreur d'authentification → jamais de réessai du fautif (désactivé), bascule vers le suivant | ✅ |
| Modèle incompatible (capacité absente) → refus explicite, pas de sélection aveugle | ✅ |
| Succès immédiat → 0 bascule, 0 appel facturable supplémentaire | ✅ |
| Streaming : **jamais de bascule silencieuse après un fragment émis** (erreur remontée, fragment conservé) | ✅ |
| Streaming : bascule permise tant qu'aucun fragment n'est émis | ✅ |
| Annulation utilisateur en cours de flux → texte partiel conservé | ✅ |

## D. Sécurité

| Vérification | Résultat |
|---|---|
| Clés dans le bundle frontend (`dist/`) | **0 occurrence** (grep `gsk_`, `sk-or-v1-`, `AQ.`) |
| Clés dans les réponses HTTP (status, capabilities, auth, messages) | **0 occurrence** |
| Clés dans les logs serveur | **0 occurrence** |
| Clés dans Git | `.env` confirmé ignoré (`git check-ignore`) ; diff de la mission : 0 secret |
| Authentification des routes IA | Requise (`authRequise`) — couverte par la suite (401 vérifiés) |
| Limites par utilisateur | Rate limiting par compte sur messages, missions, studio, suppression (suite) |
| Taille maximale des requêtes | `LIMITE_CONTENU`, `chaine({max})`, corps JSON limités (suite) |
| Timeouts | `AI_REQUEST_TIMEOUT_MS` par appel fournisseur + annulation utilisateur |
| Isolation inter-comptes | Vérifiée (suite : 404/401 cross-compte) |
| Données transmises aux fournisseurs | Contenus des prompts uniquement (transparence documentée) ; aucune collecte de diagnostic ajoutée |
| Tableau de bord de consommation | Par compte, sans secret ni contenu (`GET /api/v1/ai/usage`) |

## E. Régressions

**Non-régression exécutée** : `npm test` **61/61** · `tsc --noEmit` ✓ ·
`vite build` ✓ · parcours d'acceptation navigateur **13/13** (auth,
projets, conversations, missions validées, studio, persistance, reprise) ·
parcours IA **15/15** (streaming progressif, arrêt, régénération, contexte,
actualisation, nouvelle conversation). Auth, inscription/connexion,
assistant, historique, projets, missions, Explorer, studio, paramètres,
navigation : tous vérifiés, aucune régression subsistante.

**Anomalies trouvées et corrigées pendant la mission :**
1. **Suivi d'usage perdu** : l'écriture de l'événement de consommation
   n'était pas attendue et entrait en concurrence avec les écritures de
   messages du même agrégat (mise à jour perdue). Corrigé : écritures
   `await`ées (`service.ts`, `fallback.ts`) + test de non-régression.
2. **Alias historique écrasé** : avec un `.env` chargé, le nom canonique
   `AI_DEFAULT_PROVIDER` prévaut sur l'alias `AURA_AI_PROVIDER` (priorité
   documentée — comportement voulu). Scripts de test alignés sur les noms
   canoniques.

## F. Performance (mesures réelles uniquement)

| Mesure | Valeur |
|---|---|
| Diagnostic réseau (3 fournisseurs injoignables) | 59 ms au total |
| Streaming simulé (5 fragments × 250 ms) | affichage progressif observé fragment par fragment dans l'interface |
| Génération mock via l'application (message + persistance + usage) | < 100 ms de bout en bout |
| Latences réelles Gemini / Groq / OpenRouter | **non mesurables depuis ce bac à sable** — le script de diagnostic affiche les durées réelles par vérification quand il tourne sur un réseau ouvert |

## G. Modifications

| Fichier | Changement |
|---|---|
| `server/ai/registre.ts` | État de quota connu (`signalerQuota`, fenêtre 5 min) — le routeur écarte le fautif |
| `server/ai/fallback.ts` | Callback `onQuota` ; `onEchec` awaité (persistance fiable) |
| `server/ai/service.ts` | Durées, nombre de bascules, logs d'observabilité `[ia]`, écritures d'usage attendues |
| `server/ai/usage.ts` | Traces enrichies (`dureeMs`, `bascules`) ; agrégats (durée moyenne, bascules) |
| `server/v1/routes.ts` | `GET /api/v1/ai/usage` — tableau de bord technique par compte (sans secret) |
| `scripts/verifier-cles.cjs` | Diagnostic complet (§H) : auth/génération/conversations/streaming/erreurs/timeout par fournisseur, durées, classification |
| `tests/ai.test.ts` | +12 scénarios routeur/fallback/streaming/observabilité (61 tests au total avec la suite) |
| `tests/api.test.ts` | +2 tests observabilité (persistance + absence de secrets) |
| `tests/parcours-ia.cjs` | **Nouveau** — parcours d'intégration IA de bout en bout (15 vérifications) |
| `tests/parcours-acceptation.cjs` | Commentaire aligné sur les noms canoniques |

Dépendances ajoutées : **aucune**.

## H. État final — distinctions demandées

**Ce qui fonctionne réellement (démontré dans cet environnement) :**
architecture multi-fournisseurs complète, routeur déterministe, fallback
(sans boucle, sans bascule silencieuse en streaming), streaming progressif
de bout en bout dans l'interface, arrêt, régénération, conservation du
contexte, persistance, suivi de consommation, sécurité (0 clé exposée),
61 tests automatisés + 28 vérifications navigateur.

**Ce qui a été testé avec de vraies clés :** uniquement leur **lecture et
prise en compte par le système** (configuration 3/3). Aucun appel réel aux
API n'a abouti — le réseau sortant du bac à sable est bloqué ; conformément
aux contraintes, aucun résultat d'appel réel n'est inventé.

**Ce qui a seulement été testé avec mocks/stubs :** tous les appels
fournisseurs (formats d'API réels Gemini et OpenAI-compatible simulés au
plus près), les scénarios d'erreur (quota, auth, timeout, réseau), les
scénarios de fallback.

**Ce qui reste à configurer :** rien dans le dépôt. Côté Vercel, si ce
n'est pas déjà fait — variables par environnement (**valeurs jamais
affichées**) :
- `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` (Production **et**
  Preview ; Development = `.env` local) ;
- recommandé : `AI_REQUEST_TIMEOUT_MS=15000` (la fonction Vercel a une
  limite de 30 s) ;
- optionnel : `AI_DEFAULT_PROVIDER`, `AI_FALLBACK_ORDER`, `AI_MAX_RETRIES`,
  `GEMINI_MODEL`, `GROQ_MODEL`, `OPENROUTER_MODEL`, `GEMINI_SEARCH_MODEL`.

**Ce qui reste à valider sur Vercel (après votre autorisation) :**
1. depuis une machine avec accès Internet : `node scripts/verifier-cles.cjs`
   → le tableau réel des 3 fournisseurs (auth, génération, conversations,
   streaming, erreurs — avec durées) ;
2. vérifier `GET /api/v1/capabilities` → `assistant.ok: true` sur la
   production ;
3. un message assistant, une aide-mission, une création studio et une
   recherche Explorer en conditions réelles ;
4. consulter `GET /api/v1/ai/usage` pour la consommation par fournisseur.

**Aucun déploiement ni fusion n'a été déclenché** (contrainte maintenue).
