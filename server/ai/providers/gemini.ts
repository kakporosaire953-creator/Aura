/**
 * Adaptateur Google Gemini (API REST `v1beta`) — reconstruit dans
 * l'architecture multi-fournisseurs. Appelé uniquement côté serveur.
 *
 * - Génération (`:generateContent`) et streaming SSE (`:streamGenerateContent?alt=sse`) ;
 * - Sortie structurée via `responseSchema` ;
 * - Entrées multimodales (images en `inlineData`) ;
 * - Recherche sourcée via grounding Google Search (les URLs proviennent
 *   des métadonnées de grounding — jamais inventées par le modèle).
 */
import { configGemini, configRechercheGemini, timeoutMs } from '../config';
import { CODES_AI, ErreurAi } from '../errors';
import { appelJson, erreurDepuisStatut, lireSSE } from '../transport';
import type {
  CapacitesAi,
  FournisseurAi,
  MessageAi,
  RequeteAi,
  RequeteStructuree,
  ReponseAi,
  ResultatGrounding,
} from '../types';

const CAPACITES: CapacitesAi = {
  texte: true,
  streaming: true,
  imagesEntree: true,
  generationImages: false,
  sortieStructuree: true,
  outils: true,
  audio: false,
  embeddings: false,
  code: true,
  sources: true,
};

function corpsGemini(
  messages: MessageAi[],
  system?: string,
  opts: { maxTokens?: number; temperature?: number; schema?: Record<string, unknown> } = {},
): Record<string, unknown> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'system' : 'user',
    parts: [
      { text: m.content },
      ...(m.images ?? []).map((img) => ({
        inlineData: { mimeType: img.mime, data: img.data },
      })),
    ],
  }));
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxTokens ?? 2048,
  };
  if (opts.schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = opts.schema;
  }
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    generationConfig,
  };
}

function extraireTexte(d: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}): string {
  if (d.promptFeedback?.blockReason) {
    throw new ErreurAi('Requête refusée par le modèle.', CODES_AI.bloque, 422, 'contenu');
  }
  return (d.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

export class FournisseurGemini implements FournisseurAi {
  readonly id = 'gemini';

  get modele(): string {
    return configGemini().modele;
  }

  getCapabilities(): CapacitesAi {
    return CAPACITES;
  }

  async checkAvailability(): Promise<{ ok: boolean; raison?: string }> {
    if (!configGemini().cle) {
      return { ok: false, raison: 'GEMINI_API_KEY absente de la configuration serveur.' };
    }
    return { ok: true };
  }

  private entetes() {
    return { 'Content-Type': 'application/json', 'x-goog-api-key': configGemini().cle };
  }

  async generateResponse(req: RequeteAi): Promise<ReponseAi> {
    const { base, modele } = configGemini();
    const r = await appelJson(`${base}/v1beta/models/${modele}:generateContent`, {
      headers: this.entetes(),
      corps: corpsGemini(req.messages, req.system, {
        maxTokens: req.maxTokens,
        temperature: req.temperature,
      }),
      timeoutMs: timeoutMs(),
    });
    const texte = extraireTexte((await r.json()) as Parameters<typeof extraireTexte>[0]);
    if (!texte) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    return { texte, modele, fournisseur: this.id };
  }

  async streamResponse(
    req: RequeteAi,
    onChunk: (texte: string) => void,
    signal?: AbortSignal,
  ): Promise<ReponseAi> {
    const { base, modele } = configGemini();
    // Le délai couvre l'obtention de la réponse ; le flux lui-même n'est
    // borné que par le signal d'interruption utilisateur.
    const r = await appelJson(`${base}/v1beta/models/${modele}:streamGenerateContent?alt=sse`, {
      headers: this.entetes(),
      corps: corpsGemini(req.messages, req.system, {
        maxTokens: req.maxTokens,
        temperature: req.temperature,
      }),
      signal,
      timeoutMs: timeoutMs(),
    });

    let texte = '';
    let bloque: string | null = null;
    try {
      await lireSSE(r, (j) => {
        const trame = j as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          promptFeedback?: { blockReason?: string };
        };
        if (trame.promptFeedback?.blockReason) bloque = trame.promptFeedback.blockReason;
        const morceau = (trame.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text ?? '')
          .join('');
        if (morceau) {
          texte += morceau;
          onChunk(morceau);
        }
      });
    } catch (e) {
      if (e instanceof ErreurAi && e.code === CODES_AI.annule) {
        // Interruption utilisateur : le texte partiel est déjà côté client.
        return { texte, modele, fournisseur: this.id };
      }
      if (signal?.aborted) {
        return { texte, modele, fournisseur: this.id };
      }
      throw e;
    }

    if (bloque) throw new ErreurAi('Requête refusée par le modèle.', CODES_AI.bloque, 422, 'contenu');
    if (!texte.trim()) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    return { texte, modele, fournisseur: this.id };
  }

  async generateStructuredOutput<T>(req: RequeteStructuree): Promise<T> {
    const { base, modele } = configGemini();
    const r = await appelJson(`${base}/v1beta/models/${modele}:generateContent`, {
      headers: this.entetes(),
      corps: corpsGemini(req.messages, req.system, {
        maxTokens: req.maxTokens,
        temperature: req.temperature ?? 0.3,
        schema: req.schema,
      }),
      timeoutMs: timeoutMs(),
    });
    const texte = extraireTexte((await r.json()) as Parameters<typeof extraireTexte>[0]);
    if (!texte) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    try {
      return JSON.parse(texte) as T;
    } catch {
      throw new ErreurAi('Sortie structurée illisible.', CODES_AI.sortieInvalide, 502, 'sortie');
    }
  }

  /**
   * Recherche sourcée (grounding Google Search) : la synthèse vient du
   * modèle, mais les sources sont extraites des métadonnées de grounding.
   */
  async rechercherAvecSources(question: string, system: string): Promise<ResultatGrounding> {
    const { base, cle } = configGemini();
    const { modele } = configRechercheGemini();
    const r = await appelJson(`${base}/v1beta/models/${modele}:generateContent`, {
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      corps: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      },
      timeoutMs: timeoutMs(),
    });
    const d = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        };
      }>;
      promptFeedback?: { blockReason?: string };
    };
    const texte = extraireTexte(d);
    const chunks = d.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: ResultatGrounding['sources'] = [];
    const vus = new Set<string>();
    for (const c of chunks) {
      const url = c.web?.uri;
      if (!url || vus.has(url)) continue;
      vus.add(url);
      sources.push({ titre: c.web?.title ?? url, url, extrait: '' });
    }
    return { texte: texte || 'Aucune synthèse disponible.', sources };
  }
}

// (ré-export silencieuse pour les tests qui vérifient les statuts HTTP)
export { erreurDepuisStatut };
