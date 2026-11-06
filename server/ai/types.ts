/**
 * Contrat commun de la couche IA multi-fournisseurs.
 *
 * L'application ne parle jamais directement aux API des fournisseurs :
 * chaque adaptateur (Gemini, Groq, OpenRouter, mock de test) implémente
 * `FournisseurAi`, le service central route, et les secrets restent
 * strictement côté serveur.
 */

export type RoleAi = 'user' | 'assistant' | 'system';

export type ImageAi = {
  mime: string;
  /** Données base64 (sans le préfixe data:). */
  data: string;
};

export type MessageAi = {
  role: RoleAi;
  content: string;
  /** Entrées multimodales (uniquement si le fournisseur les accepte). */
  images?: ImageAi[];
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
  /** Génération de code (politique de routage « code »). */
  code: boolean;
  /** Recherche sourcée réelle (URLs issues d'un moteur, jamais inventées). */
  sources: boolean;
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
  /** Identifiant interne du fournisseur — jamais affiché à l'utilisateur. */
  fournisseur: string;
  usage?: { entrees?: number; sorties?: number };
};

export type RequeteStructuree = RequeteAi & {
  /** Schéma JSON Schema de la sortie attendue. */
  schema: Record<string, unknown>;
};

export type ResultatGrounding = {
  texte: string;
  sources: Array<{ titre: string; url: string; extrait: string }>;
};

/** Type de tâche déclaré par les routes (routage déterministe). */
export type TacheAi =
  | 'conversation'
  | 'code'
  | 'structure'
  | 'creation'
  | 'recherche'
  | 'image'
  | 'raisonnement';

export interface FournisseurAi {
  /** Identifiant interne (journalisation, métriques) — jamais dans l'UI. */
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
  /** Recherche sourcée — capacité `sources` (actuellement : grounding web). */
  rechercherAvecSources?(question: string, system: string): Promise<ResultatGrounding>;
}
