# 006 — Reconstruction du système IA multi-fournisseurs

Date : 2026-11-06 · Branche : `arena/ed84318b-aura` · Base : `0873aa7` (main après PR #19)

Mission : audit de l'intégration Gemini existante, suppression de
l'ancienne implémentation dispersée, reconstruction d'une architecture
centralisée multi-fournisseurs (**Google Gemini, Groq, OpenRouter**) :
interface commune, routeur déterministe, fallback intelligent, variables
d'environnement prêtes pour les clés (ajoutées manuellement après la
mission), sécurité, tests et documentation.

> **Rappel de gestion** : la plateforme impose la branche fixe
> `arena/ed84318b-aura` par session — le travail y est réalisé en lieu et
> place de la branche `feat/ai-multi-provider-architecture` demandée.

## 1. Résumé des modifications

- **Ancienne intégration supprimée** : appels Gemini directs de
  `server/chat.ts` (`appelerGemini`, `ErreurModele`), registre mono-
  fournisseur couplé Gemini (`ai/registre.ts` v1), ancien adaptateur
  `ai/gemini.ts` et `ai/mock.ts` (reconstruits sous `ai/providers/`),
  configurations couplées, noms de fournisseur exposés dans l'UI et
  l'API (`config.modele` de `/status`, `connecteur: 'gemini-grounding'`
  de `/capabilities`, libellés dictionnaires « moteur Gemini »).
- **Nouvelle architecture** : `server/ai/` = contrats (`types.ts`),
  erreurs normalisées (`errors.ts`), configuration centralisée
  (`config.ts`), transport HTTP/SSE (`transport.ts`), adaptateurs
  `providers/{gemini,groq,openrouter,mock}.ts` (+ `openai-compat.ts`
  partagé), routeur déterministe (`router.ts`), fallback non aveugle
  (`fallback.ts`), registre (`registre.ts`), suivi de consommation
  (`usage.ts`), service central (`service.ts`).
- **Intégration AURA** : toutes les routes IA (chat SSE + une passe,
  régénération, missions, studio, recherche Explorer, `/api/chat`
  historique) passent par `service.ts` — fonctionnalités inchangées.
- **Zéro dépendance ajoutée** : les trois API sont appelées en HTTP
  documenté (aucun SDK tiers) — décision justifiée §6.

## 2. Architecture IA mise en place

Voir `docs/architecture/AI-MULTI-PROVIDER.md` (schéma, contrat commun,
routage, fallback, configuration, sécurité). Points clés :

- interface `FournisseurAi` unique (génération, conversations, messages
  système, streaming annulable, paramètres de génération, erreurs
  normalisées, identification interne, capacités multimodales déclarées) ;
- routeur déterministe : tâche déclarée par la route (`conversation`,
  `code`, `structure`, `creation`, `recherche`, `image`,
  `raisonnement`) → capacités requises → ordre `AI_FALLBACK_ORDER` avec
  `AI_DEFAULT_PROVIDER` épinglé ;
- fallback : classification des erreurs, plafond `AI_MAX_RETRIES`, pas de
  réessai sur requête invalide/contenu refusé, désactivation du fautif sur
  erreur d'authentification (bascule autorisée vers le suivant — lecture
  documentée de la règle « pas de réessai automatique »), **jamais de
  bascule silencieuse après un premier fragment streamé** ;
- usage : événements par compte et par fournisseur (`usage.ts`, méta
  technique sans contenu ni clé) ;
- sans clé : aucun appel simulé, erreur structurée 503
  (`code: 'aucun-fournisseur'`), logs serveur nommant le fournisseur
  manquant, API/UI sans aucun nom interne.

## 3. Anciennes configurations supprimées

- `server/chat.ts` : implémentation Gemini complète (appel REST, gestion
  d'erreurs dupliquée) — remplacée par le service central ;
- ancien `ai/gemini.ts` + `ai/mock.ts` (emplacements historiques) ;
- exposition `config.modele` dans `GET /status` (jamais lue par le
  frontend — supprimée) ;
- exposition `connecteur: 'gemini-grounding'` dans `/capabilities` ;
- libellés UI nommant Gemini (dictionnaires FR/EN, mode simulation) ;
- variable `AURA_MODELE_FAMILLE` (artefact de stub) ;
- réponse `/api/chat` exposant `modele` au client.

## 4. Nouveaux fichiers créés

`server/ai/{errors,config,transport,router,fallback,usage,service}.ts`,
`server/ai/providers/{gemini,groq,openrouter,openai-compat,mock}.ts`,
`docs/architecture/AI-MULTI-PROVIDER.md`, `tests/ai.test.ts`, ce rapport.

## 5. Fichiers modifiés

`server/ai/types.ts` (contrat étendu : images, capacité code/sources,
`rechercherAvecSources`), `server/ai/registre.ts` (reconstruit),
`server/search/connecteurs.ts` (via service, id neutre `recherche-web`),
`server/chat.ts` (validation seule), `server/api.ts` (`/api/chat` +
`/status` rewirés), `server/v1/{routes,routesTravail,routesCreation}.ts`
(service central + usage), `server/db/{types,entrepots}.ts` (genre `ia`,
lecture `evenements()`), `src/app/{dictionaries,simulation}.ts`,
`src/services/types.ts`, `README.md`,
`docs/architecture/001-architecture-cible.md` (note de mise à jour),
`docs/ai/README.md`, `.env.example`.

## 6. Dépendances

- **Ajoutées : aucune.** Décision d'architecture (traçable) : les
  adaptateurs utilisent le transport HTTP documenté des API (REST Gemini
  `v1beta`, chat/completions compatible OpenAI pour Groq et OpenRouter)
  plutôt que trois SDK tiers — zéro poids supplémentaire, contrats
  uniformes, testabilité par stubs HTTP, cohérent avec la directive
  « pas un simple ajout de trois SDK ».
- **Supprimées : aucune** (aucune dépendance Gemini n'existait déjà).

## 7. Variables d'environnement à renseigner

`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` (clés, ajoutées
après la mission) ; optionnelles : `AI_DEFAULT_PROVIDER`,
`AI_FALLBACK_ORDER`, `AI_MAX_RETRIES`, `AI_REQUEST_TIMEOUT_MS`,
`GEMINI_MODEL`, `GROQ_MODEL`, `OPENROUTER_MODEL`, `GEMINI_SEARCH_MODEL`,
points d'entrée `*_API_BASE`. Voir `.env.example`. Alias historiques
acceptés : `AURA_GEMINI_API_KEY`, `AURA_MODELE`, `AURA_MODELE_URL`,
`AURA_AI_PROVIDER`, `AURA_MODELE_RECHERCHE`.

## 8. Tests exécutés et résultats exacts (2026-11-06)

| Exécution | Résultat |
|---|---|
| `npm test` (node:test + tsx) | **49/49** — 23 non-régression + 26 nouveaux (interface commune ×4, clés absentes, routage déterministe, fallback quota/auth/timeout/réseau/validation/streaming, stubs Groq/OpenAI-compat + Gemini + grounding, statuts normalisés, clés jamais exposées, timeout, bascule de bout en bout, désactivation circuit, usage) |
| `npx tsc --noEmit` | ✅ |
| `npm run build` (vite) | ✅ (685 ms) |
| `tests/parcours-acceptation.cjs` (navigateur headless) | **13/13** — inscription, vue d'ensemble, projet, conversation rattachée, réponse assistant, aide IA validée, création studio, persistance, reprise, 0 erreur JS console |

**Non testé faute de clés** (documenté honnêtement) : appels réels aux
trois fournisseurs, choix des modèles par défaut en conditions réelles,
quotas réels, grounding Google réel.

## 9. Fonctionnalités préservées

Authentification, conversations (streaming, arrêt, régénération, copie),
historique, projets, missions (proposition IA → validation utilisateur),
mémoire, studio (versions, export Markdown/PDF), recherche Explorer
(sources réelles honnêtes), préférences/AURA Local, suppression de compte,
mode simulation étiqueté, design « Rubans & sculpture » intact.

## 10. Problèmes rencontrés

- règle « pas de réessai sur erreur d'authentification » : interprétée
  comme « jamais de nouvelle tentative sur le fautif » (désactivation
  durable) + bascule vers le fournisseur suivant — lecture documentée
  dans `errors.ts` et AI-MULTI-PROVIDER.md §4, à confirmer si vous
  souhaitiez un arrêt total de la chaîne ;
- stubs de test : coupure socket trop brutale pour le test de streaming
  interrompu (délai ajouté) ;
- l'alias `AURA_AI_PROVIDER=mock` a été conservé volontairement (les
  tests et l'environnement existants l'utilisent).

## 11. Nécessitant encore les clés API

Tout appel réel de génération : assistant, missions, studio, régénération,
recherche sourcée (clé Gemini requise pour le grounding), analyse d'image
(si modèle multimodal configuré).

## 12. Procédure de configuration des clés

1. Créer les clés : Google AI Studio (`GEMINI_API_KEY`), console Groq
   (`GROQ_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`) ;
2. local : les inscrire dans `.env` (copie de `.env.example`) ;
3. Vercel : Settings → Environment Variables (mêmes noms, sans préfixe
   `VITE_`), puis redéployer ;
4. vérifier `GET /api/v1/capabilities` → `assistant.ok: true` ;
5. tester assistant, aide-mission, studio, Explorer ;
6. ajuster les modèles si besoin : `GEMINI_MODEL`, `GROQ_MODEL`,
   `OPENROUTER_MODEL`, priorités `AI_DEFAULT_PROVIDER`/`AI_FALLBACK_ORDER`.
   Aucune modification de code.

## 13. État Git

Branche `arena/ed84318b-aura` (branche imposée par la plateforme,
équivalent de `feat/ai-multi-provider-architecture`), base `0873aa7`,
PR ouverte vers `main`. **Non fusionnée, non déployée** — validation
explicite requise.
