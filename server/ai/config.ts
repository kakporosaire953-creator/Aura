/**
 * Configuration du système IA multi-fournisseurs.
 *
 * Toutes les lectures d'environnement sont centralisées ici. Les valeurs
 * sont lues à chaque appel (jamais mises en module) pour permettre les
 * tests et les rechargements de configuration.
 *
 * Noms canoniques (mission) + alias historiques conservés pour la
 * migration progressive (environnements existants, Vercel) :
 *   AURA_GEMINI_API_KEY → GEMINI_API_KEY
 *   AURA_MODELE         → GEMINI_MODEL
 *   AURA_MODELE_URL     → GEMINI_API_BASE
 *   AURA_AI_PROVIDER    → AI_DEFAULT_PROVIDER
 *   AURA_MODELE_RECHERCHE → GEMINI_SEARCH_MODEL
 */

export type IdFournisseur = 'gemini' | 'groq' | 'openrouter' | 'mock';

export type ConfigFournisseur = {
  id: IdFournisseur;
  /** Clé API (vide si non configuré) — jamais journalisée ni exposée. */
  cle: string;
  base: string;
  modele: string;
};

function env(primaire: string, alias?: string): string {
  return (process.env[primaire] ?? (alias ? process.env[alias] ?? '' : '')).trim();
}

export function configGemini(): ConfigFournisseur {
  return {
    id: 'gemini',
    cle: env('GEMINI_API_KEY', 'AURA_GEMINI_API_KEY'),
    base: env('GEMINI_API_BASE', 'AURA_MODELE_URL') || 'https://generativelanguage.googleapis.com',
    modele: env('GEMINI_MODEL', 'AURA_MODELE') || 'gemini-3.8-flash',
  };
}

export function configGroq(): ConfigFournisseur {
  return {
    id: 'groq',
    cle: env('GROQ_API_KEY'),
    base: env('GROQ_API_BASE') || 'https://api.groq.com/openai/v1',
    modele: env('GROQ_MODEL') || 'llama-3.3-70b-versatile',
  };
}

export function configOpenRouter(): ConfigFournisseur {
  return {
    id: 'openrouter',
    cle: env('OPENROUTER_API_KEY'),
    base: env('OPENROUTER_API_BASE') || 'https://openrouter.ai/api/v1',
    modele: env('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
  };
}

/** Modèle de recherche sourcée (grounding) — Gemini uniquement. */
export function configRechercheGemini(): { modele: string } {
  return { modele: env('GEMINI_SEARCH_MODEL', 'AURA_MODELE_RECHERCHE') || configGemini().modele };
}

/**
 * Fournisseur par défaut : `auto` (défaut), ou `gemini` / `groq` /
 * `openrouter` / `mock` (mock = tests uniquement).
 */
export function fournisseurParDefaut(): string {
  return (env('AI_DEFAULT_PROVIDER', 'AURA_AI_PROVIDER') || 'auto').toLowerCase();
}

/** Le mode mock (tests) est-il explicitement demandé ? */
export function modeMock(): boolean {
  return fournisseurParDefaut() === 'mock';
}

/**
 * Ordre de repli — liste de priorité déterministe.
 * Défaut : gemini, groq, openrouter. Le fournisseur par défaut explicite
 * (hors `auto`) est épinglé en tête.
 */
export function ordreFournisseurs(): IdFournisseur[] {
  const parDefaut = fournisseurParDefaut();
  const brut = (env('AI_FALLBACK_ORDER') || 'gemini,groq,openrouter')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is IdFournisseur =>
      s === 'gemini' || s === 'groq' || s === 'openrouter' || s === 'mock',
    );
  const ordre = brut.length > 0 ? brut : (['gemini', 'groq', 'openrouter'] as IdFournisseur[]);
  if (parDefaut !== 'auto' && ordre.includes(parDefaut as IdFournisseur)) {
    return [parDefaut as IdFournisseur, ...ordre.filter((f) => f !== parDefaut)];
  }
  return ordre;
}

/**
 * Nombre maximal de TENTATIVES SUPPLÉMENTAIRES après la première
 * (AI_MAX_RETRIES, défaut 2 → jusqu'à 3 fournisseurs essayés au total,
 * dans la limite des candidats disponibles).
 */
export function maxReplis(): number {
  const n = Number.parseInt(env('AI_MAX_RETRIES') || '2', 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 5) : 2;
}

/** Délai maximal d'une requête fournisseur (ms). */
export function timeoutMs(): number {
  const n = Number.parseInt(env('AI_REQUEST_TIMEOUT_MS') || '60000', 10);
  return Number.isFinite(n) && n > 0 ? n : 60000;
}
