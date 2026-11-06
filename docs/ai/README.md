# Couche IA — AURA

> Depuis la reconstruction multi-fournisseurs, la documentation complète de
> l'architecture (adaptateurs Gemini / Groq / OpenRouter, routeur, fallback,
> configuration, sécurité, tests) se trouve dans
> [`docs/architecture/AI-MULTI-PROVIDER.md`](../architecture/AI-MULTI-PROVIDER.md).
> Ce fichier en résume les points essentiels.

## 1. Interface commune (`server/ai/types.ts`)

```ts
interface FournisseurAi {
  id: string; modele: string;
  getCapabilities(): CapacitesAi;        // texte, streaming, sortieStructuree, code, sources, …
  checkAvailability(): Promise<{ ok, raison? }>;
  generateResponse(req): Promise<ReponseAi>;
  streamResponse(req, onChunk, signal?): Promise<ReponseAi>;
  generateStructuredOutput<T>(req): Promise<T>;
  rechercherAvecSources?(question, system): Promise<ResultatGrounding>;
}
```

L'application (routes, services) **ne parle jamais aux API des fournisseurs** ;
elle passe par le service central (`server/ai/service.ts`).

## 2. Fournisseurs (`server/ai/providers/`)

| Adaptateur | API | Points forts |
|---|---|---|
| `gemini.ts` | REST `v1beta` | streaming SSE, `responseSchema`, grounding (sources réelles), images en entrée |
| `groq.ts` | compatible OpenAI | vitesse, `json_schema` |
| `openrouter.ts` | compatible OpenAI | catalogue de modèles configurable (`OPENROUTER_MODEL`) |
| `mock.ts` | — | **tests uniquement** (injection de pannes) |

## 3. Routage et repli

- Routeur déterministe (`router.ts`) : tâche → capacités → ordre
  configuré (`AI_DEFAULT_PROVIDER`, `AI_FALLBACK_ORDER`) ;
- Repli non aveugle (`fallback.ts`) : quota/timeout/réseau/serveur →
  bascule plafonnée (`AI_MAX_RETRIES`) ; requête invalide ou contenu refusé →
  aucun repli ; auth refusée → désactivation du fautif ; streaming → jamais
  de bascule après un premier fragment émis ;
- Suivi de consommation par compte et par fournisseur (`usage.ts`) ;
- Erreurs normalisées (`errors.ts`), jamais de clé ni de nom interne dans
  les réponses utilisateur.

## 4. Configuration

Voir `.env.example` : `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`AI_DEFAULT_PROVIDER`, `AI_FALLBACK_ORDER`, `AI_MAX_RETRIES`,
`AI_REQUEST_TIMEOUT_MS`, modèles `*_MODEL`. Sans clé, l'IA déclare son
indisponibilité (erreur structurée 503) — aucune réponse simulée.
