/**
 * Transport commun aux API compatibles OpenAI (Groq, OpenRouter) :
 * `POST {base}/chat/completions`, auth Bearer, streaming SSE avec
 * `choices[0].delta.content`, terminateur `[DONE]`.
 *
 * Chaque fournisseur garde son propre fichier d'adaptateur (configuration,
 * capacités, formats de sortie) mais partage ce transport — pas de
 * duplication, pas de SDK tiers.
 */
import { CODES_AI, ErreurAi } from '../errors';
import { timeoutMs } from '../config';
import { appelJson, lireSSE } from '../transport';
import type {
  CapacitesAi,
  FournisseurAi,
  RequeteAi,
  RequeteStructuree,
  ReponseAi,
} from '../types';

export type OptionsCompat = {
  id: string;
  modele: () => string;
  cle: () => string;
  base: () => string;
  /** En-têtes additionnels (ex. attribution OpenRouter). */
  entetes?: Record<string, string>;
  capacites: CapacitesAi;
  /**
   * Stratégie de sortie structurée :
   *  - 'json_schema'  : `response_format: {type: 'json_schema', ...}` (Groq) ;
   *  - 'json_object'  : `response_format: {type: 'json_object'}` + schéma
   *    injecté dans la consigne (OpenRouter : support large, par modèle).
   */
  structure: 'json_schema' | 'json_object';
};

type ReponseCompletions = {
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export class FournisseurCompatOpenAi implements FournisseurAi {
  constructor(private readonly opts: OptionsCompat) {}

  get id(): string {
    return this.opts.id;
  }

  get modele(): string {
    return this.opts.modele();
  }

  getCapabilities(): CapacitesAi {
    return this.opts.capacites;
  }

  async checkAvailability(): Promise<{ ok: boolean; raison?: string }> {
    if (!this.opts.cle()) {
      return { ok: false, raison: `Clé API absente de la configuration serveur (${this.opts.id}).` };
    }
    return { ok: true };
  }

  private entetes(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.opts.cle()}`,
      ...(this.opts.entetes ?? {}),
    };
  }

  private corps(req: RequeteAi, opts: { stream: boolean; jsonSchema?: Record<string, unknown> }) {
    const messages = [
      ...(req.system ? [{ role: 'system', content: req.system }] : []),
      ...req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.images && m.images.length > 0 && this.opts.capacites.imagesEntree
          ? {
              images: m.images.map((i) => `data:${i.mime};base64,${i.data}`),
            }
          : {}),
      })),
    ];
    const corps: Record<string, unknown> = {
      model: this.modele,
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2048,
      ...(opts.stream ? { stream: true } : {}),
    };
    if (opts.jsonSchema) {
      corps.response_format =
        this.opts.structure === 'json_schema'
          ? {
              type: 'json_schema',
              json_schema: { name: 'sortie_structuree', schema: opts.jsonSchema, strict: false },
            }
          : { type: 'json_object' };
    }
    return corps;
  }

  async generateResponse(req: RequeteAi): Promise<ReponseAi> {
    const r = await appelJson(`${this.opts.base()}/chat/completions`, {
      headers: this.entetes(),
      corps: this.corps(req, { stream: false }),
      timeoutMs: timeoutMs(),
    });
    const d = (await r.json()) as ReponseCompletions;
    const texte = (d.choices?.[0]?.message?.content ?? '').trim();
    if (!texte) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    return {
      texte,
      modele: this.modele,
      fournisseur: this.id,
      usage: { entrees: d.usage?.prompt_tokens, sorties: d.usage?.completion_tokens },
    };
  }

  async streamResponse(
    req: RequeteAi,
    onChunk: (texte: string) => void,
    signal?: AbortSignal,
  ): Promise<ReponseAi> {
    const r = await appelJson(`${this.opts.base()}/chat/completions`, {
      headers: this.entetes(),
      corps: this.corps(req, { stream: true }),
      signal,
      timeoutMs: timeoutMs(),
    });
    let texte = '';
    try {
      await lireSSE(r, (j) => {
        const trame = j as {
          choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>;
        };
        const morceau = trame.choices?.[0]?.delta?.content ?? '';
        if (morceau) {
          texte += morceau;
          onChunk(morceau);
        }
      });
    } catch (e) {
      if (signal?.aborted) return { texte, modele: this.modele, fournisseur: this.id };
      throw e;
    }
    if (signal?.aborted) return { texte, modele: this.modele, fournisseur: this.id };
    if (!texte.trim()) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    return { texte, modele: this.modele, fournisseur: this.id };
  }

  async generateStructuredOutput<T>(req: RequeteStructuree): Promise<T> {
    const consigne =
      this.opts.structure === 'json_object'
        ? {
            ...req,
            system:
              (req.system ? req.system + '\n\n' : '') +
              'Réponds UNIQUEMENT avec un objet JSON valide respectant ce schéma JSON Schema :\n' +
              JSON.stringify(req.schema),
          }
        : req;
    const r = await appelJson(`${this.opts.base()}/chat/completions`, {
      headers: this.entetes(),
      corps: this.corps(consigne, { stream: false, jsonSchema: req.schema }),
      timeoutMs: timeoutMs(),
    });
    const d = (await r.json()) as ReponseCompletions;
    const brut = (d.choices?.[0]?.message?.content ?? '').trim();
    if (!brut) throw new ErreurAi('Le modèle a renvoyé une réponse vide.', CODES_AI.vide, 502, 'contenu');
    try {
      return JSON.parse(extraireJson(brut)) as T;
    } catch {
      throw new ErreurAi('Sortie structurée illisible.', CODES_AI.sortieInvalide, 502, 'sortie');
    }
  }
}

/** Extrait le JSON d'une réponse éventuellement entourée de texte/code. */
export function extraireJson(brut: string): string {
  const balise = brut.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidat = balise ? balise[1].trim() : brut.trim();
  const debut = candidat.indexOf('{');
  const fin = candidat.lastIndexOf('}');
  return debut >= 0 && fin > debut ? candidat.slice(debut, fin + 1) : candidat;
}
