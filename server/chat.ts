/**
 * Adaptateur Gemini (API REST generateContent) — appelé uniquement
 * côté serveur. La clé GEMINI_API_KEY ne quitte jamais le serveur.
 *
 * - Modèle par défaut : gemini-3.8-flash (stable), surchargeable par AURA_MODELE ;
 * - Point d'entrée surchargeable par AURA_MODELE_URL (tests / proxys) ;
 * - Réponses honnêtes : blocage, refus du modèle et pannes sont signalés tels quels.
 */
export type MessageChat = { role: 'user' | 'assistant'; content: string };

const URL_DEFAUT = 'https://generativelanguage.googleapis.com';
const MODELE_DEFAUT = 'gemini-3.8-flash';

export const LIMITE_MESSAGES = 40;
export const LIMITE_CARACTERES = 4000;

export function validerMessages(brut: unknown): { ok: true; messages: MessageChat[] } | { ok: false } {
  if (!Array.isArray(brut) || brut.length === 0 || brut.length > LIMITE_MESSAGES) {
    return { ok: false };
  }
  const messages: MessageChat[] = [];
  for (const m of brut) {
    if (typeof m !== 'object' || m === null) return { ok: false };
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') return { ok: false };
    if (typeof content !== 'string') return { ok: false };
    const texte = content.trim();
    if (!texte || texte.length > LIMITE_CARACTERES) return { ok: false };
    messages.push({ role, content: texte });
  }
  if (messages[messages.length - 1].role !== 'user') return { ok: false };
  return { ok: true, messages };
}

function systeme(langue: string): string {
  return langue === 'en'
    ? "You are Aura, the assistant of the Aura platform. Answer in the user's language, clearly and honestly. Never invent facts, sources, prices, or features. If you don't know, say so. Keep answers useful and concise."
    : "Tu es Aura, l'assistant de la plateforme Aura. Réponds dans la langue de l'utilisateur, clairement et honnêtement. N'invente jamais de faits, de sources, de prix ou de fonctionnalités. Si tu ne sais pas, dis-le. Des réponses utiles et concises.";
}

export type ResultatChat = { texte: string; modele: string };

export class ErreurModele extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

export async function appelerGemini(
  messages: MessageChat[],
  langue: string = 'fr',
): Promise<ResultatChat> {
  const cle = process.env.GEMINI_API_KEY;
  if (!cle) {
    throw new ErreurModele(
      'Clé API du modèle non configurée (GEMINI_API_KEY).',
      'cle-manquante',
      503,
    );
  }

  const base = process.env.AURA_MODELE_URL || URL_DEFAUT;
  const modele = process.env.AURA_MODELE || MODELE_DEFAUT;

  const corps = {
    systemInstruction: { parts: [{ text: systeme(langue) }] },
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  };

  const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': cle,
    },
    body: JSON.stringify(corps),
  });

  if (!r.ok) {
    const code = r.status === 429 ? 'limite-modele' : 'modele-indisponible';
    throw new ErreurModele(
      `Le modèle ne répond pas (${r.status}).`,
      code,
      r.status === 429 ? 429 : 502,
    );
  }

  const d = (await r.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  if (d.promptFeedback?.blockReason) {
    throw new ErreurModele('Requête refusée par le modèle.', 'bloque', 422);
  }

  const texte = (d.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();

  if (!texte) {
    throw new ErreurModele('Le modèle a renvoyé une réponse vide.', 'vide', 502);
  }

  return { texte, modele };
}
