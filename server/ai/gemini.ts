/**
 * Adaptateur Gemini (REST generateContent / streamGenerateContent) —
 * appelé uniquement côté serveur. GEMINI_API_KEY ne quitte jamais le
 * serveur et n'est jamais journalisée.
 *
 * - Modèle par défaut : gemini-3.8-flash, surchargeable par AURA_MODELE ;
 * - Base URL surchargeable par AURA_MODELE_URL (tests / proxys) ;
 * - Streaming SSE réel (`?alt=sse`) ;
 * - Sortie structurée via responseSchema ;
 * - Recherche sourcée via grounding Google Search (les liens proviennent
 *   des métadonnées de grounding — jamais inventés par le modèle).
 */
import {
  CODES_AI,
  ErreurAi,
  type CapacitesAi,
  type FournisseurAi,
  type MessageAi,
  type RequeteAi,
  type RequeteStructuree,
  type ReponseAi,
} from './types';

const URL_DEFAUT = 'https://generativelanguage.googleapis.com';
const MODELE_DEFAUT = 'gemini-3.8-flash';

const CAPACITES: CapacitesAi = {
  texte: true,
  streaming: true,
  imagesEntree: false,
  generationImages: false,
  sortieStructuree: true,
  outils: true,
  audio: false,
  embeddings: false,
};

export type ResultatGrounding = {
  texte: string;
  sources: Array<{ titre: string; url: string; extrait: string }>;
};

function baseEtModele(): { base: string; modele: string; cle: string } {
  const cle = process.env.GEMINI_API_KEY ?? '';
  return {
    cle,
    base: process.env.AURA_MODELE_URL || URL_DEFAUT,
    modele: process.env.AURA_MODELE || MODELE_DEFAUT,
  };
}

function corpsGemini(
  messages: MessageAi[],
  system?: string,
  opts: { maxTokens?: number; temperature?: number; schema?: Record<string, unknown> } = {},
): Record<string, unknown> {
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'system' : 'user',
    parts: [{ text: m.content }],
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
    throw new ErreurAi('Requête refusée par le modèle.', CODES_AI.bloque, 422);
  }
  return (d.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

function erreurHttp(status: number): ErreurAi {
  if (status === 429) {
    return new ErreurAi('Le modèle est sollicité au-delà de ses limites (429).', CODES_AI.limite, 429);
  }
  return new ErreurAi(`Le modèle ne répond pas (${status}).`, CODES_AI.indisponible, 502);
}

export class FournisseurGemini implements FournisseurAi {
  readonly id = 'gemini';

  get modele(): string {
    return baseEtModele().modele;
  }

  getCapabilities(): CapacitesAi {
    return CAPACITES;
  }

  async checkAvailability(): Promise<{ ok: boolean; raison?: string }> {
    const { cle } = baseEtModele();
    if (!cle) {
      return { ok: false, raison: 'GEMINI_API_KEY absente de la configuration serveur.' };
    }
    return { ok: true };
  }

  async generateResponse(req: RequeteAi): Promise<ReponseAi> {
    const { cle, base, modele } = baseEtModele();
    if (!cle) {
      throw new ErreurAi('Clé API du modèle non configurée (GEMINI_API_KEY).', CODES_AI.cleManquante, 503);
    }
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify(
        corpsGemini(req.messages, req.system, {
          maxTokens: req.maxTokens,
          temperature: req.temperature,
        }),
      ),
    });
    if (!r.ok) throw erreurHttp(r.status);
    const texte = extraireTexte((await r.json()) as Parameters<typeof extraireTexte>[0]);
    if (!texte) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502);
    return { texte, modele, fournisseur: this.id };
  }

  async streamResponse(
    req: RequeteAi,
    onChunk: (texte: string) => void,
    signal?: AbortSignal,
  ): Promise<ReponseAi> {
    const { cle, base, modele } = baseEtModele();
    if (!cle) {
      throw new ErreurAi('Clé API du modèle non configurée (GEMINI_API_KEY).', CODES_AI.cleManquante, 503);
    }
    const r = await fetch(`${base}/v1beta/models/${modele}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify(
        corpsGemini(req.messages, req.system, {
          maxTokens: req.maxTokens,
          temperature: req.temperature,
        }),
      ),
      signal,
    });
    if (!r.ok) throw erreurHttp(r.status);
    if (!r.body) throw new ErreurAi('Flux de réponse absent.', CODES_AI.indisponible, 502);

    const lecteur = r.body.getReader();
    const decode = new TextDecoder();
    let tampon = '';
    let texte = '';
    let bloque: string | null = null;

    try {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        tampon += decode.decode(value, { stream: true });
        const lignes = tampon.split('\n');
        tampon = lignes.pop() ?? '';
        for (const ligne of lignes) {
          const donnee = ligne.startsWith('data:') ? ligne.slice(5).trim() : '';
          if (!donnee || donnee === '[DONE]') continue;
          try {
            const j = JSON.parse(donnee) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
              promptFeedback?: { blockReason?: string };
            };
            if (j.promptFeedback?.blockReason) bloque = j.promptFeedback.blockReason;
            const morceau = (j.candidates?.[0]?.content?.parts ?? [])
              .map((p) => p.text ?? '')
              .join('');
            if (morceau) {
              texte += morceau;
              onChunk(morceau);
            }
          } catch {
            /* trame partielle ou bruit : ignorée */
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Interruption utilisateur : le texte partiel est déjà côté client.
        return { texte, modele, fournisseur: this.id };
      }
      throw e;
    }

    if (bloque) throw new ErreurAi('Requête refusée par le modèle.', CODES_AI.bloque, 422);
    if (!texte.trim()) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502);
    return { texte, modele, fournisseur: this.id };
  }

  async generateStructuredOutput<T>(req: RequeteStructuree): Promise<T> {
    const { cle, base, modele } = baseEtModele();
    if (!cle) {
      throw new ErreurAi('Clé API du modèle non configurée (GEMINI_API_KEY).', CODES_AI.cleManquante, 503);
    }
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify(
        corpsGemini(req.messages, req.system, {
          maxTokens: req.maxTokens,
          temperature: req.temperature ?? 0.3,
          schema: req.schema,
        }),
      ),
    });
    if (!r.ok) throw erreurHttp(r.status);
    const texte = extraireTexte((await r.json()) as Parameters<typeof extraireTexte>[0]);
    if (!texte) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502);
    try {
      return JSON.parse(texte) as T;
    } catch {
      throw new ErreurAi('Sortie structurée illisible.', CODES_AI.sortieInvalide, 502);
    }
  }

  /**
   * Recherche sourcée (grounding Google Search) : la synthèse vient du
   * modèle, mais les sources sont extraites des métadonnées de grounding —
   * aucune URL n'est inventée.
   */
  async rechercherAvecSources(
    question: string,
    system: string,
  ): Promise<ResultatGrounding> {
    const { cle, base, modele } = baseEtModele();
    if (!cle) {
      throw new ErreurAi('Clé API du modèle non configurée (GEMINI_API_KEY).', CODES_AI.cleManquante, 503);
    }
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: question }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });
    if (!r.ok) throw erreurHttp(r.status);
    const d = (await r.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
          groundingSupports?: Array<{
            segment?: { text?: string };
            groundingChunkIndices?: number[];
          }>;
        };
      }>;
      promptFeedback?: { blockReason?: string };
    };
    const texte = extraireTexte(d);
    const meta = d.candidates?.[0]?.groundingMetadata;
    const chunks = meta?.groundingChunks ?? [];
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
