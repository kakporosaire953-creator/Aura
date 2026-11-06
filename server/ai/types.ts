/**
 * Couche d'abstraction IA — l'application ne parle jamais directement
 * aux SDK des fournisseurs. Un fournisseur expose ce qu'il sait réellement
 * faire (capacités) ; le routeur sélectionne, avec un repli unique et
 * maîtrisé. Secrets strictement côté serveur.
 */

export type RoleAi = 'user' | 'assistant' | 'system';

export type MessageAi = {
  role: RoleAi;
  content: string;
};

export type CapacitesAi = {
  texte: boolean;
  streaming: boolean;
  imagesEntree: boolean;
  generationImages: boolean;
  sortieStructuree: boolean;
  outils: boolean;
  audio: boolean;
  embeddings: boolean;
};

export type RequeteAi = {
  messages: MessageAi[];
  system?: string;
  langue?: 'fr' | 'en';
  maxTokens?: number;
  temperature?: number;
};

export type ReponseAi = {
  texte: string;
  modele: string;
  fournisseur: string;
};

export type RequeteStructuree = RequeteAi & {
  /** Schéma JSON Schema de la sortie attendue. */
  schema: Record<string, unknown>;
};

export interface FournisseurAi {
  readonly id: string;
  readonly modele: string;
  getCapabilities(): CapacitesAi;
  checkAvailability(): Promise<{ ok: boolean; raison?: string }>;
  generateResponse(req: RequeteAi): Promise<ReponseAi>;
  streamResponse(
    req: RequeteAi,
    onChunk: (texte: string) => void,
    signal?: AbortSignal,
  ): Promise<ReponseAi>;
  generateStructuredOutput<T>(req: RequeteStructuree): Promise<T>;
}

export class ErreurAi extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statut: number,
  ) {
    super(message);
  }
}

/** Erreurs typées transportées telles quelles jusqu'au client. */
export const CODES_AI = {
  cleManquante: 'cle-manquante',
  indisponible: 'modele-indisponible',
  limite: 'limite-modele',
  bloque: 'bloque',
  vide: 'vide',
  annule: 'annule',
  timeout: 'timeout',
  sortieInvalide: 'sortie-invalide',
} as const;
