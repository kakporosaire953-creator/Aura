/**
 * Adaptateur Groq — API compatible OpenAI (`api.groq.com/openai/v1`).
 *
 * - Conversations, streaming SSE, sorties structurées (`json_schema`,
 *   supporté par les modèles Groq) ;
 * - Pas d'entrée image par défaut (les modèles Groq référencés sont
 *   texte) — déclaré honnêtement dans les capacités ;
 * - Erreurs et quotas normalisés par le transport commun.
 */
import { configGroq } from '../config';
import type { CapacitesAi } from '../types';
import { FournisseurCompatOpenAi } from './openai-compat';

const CAPACITES: CapacitesAi = {
  texte: true,
  streaming: true,
  imagesEntree: false,
  generationImages: false,
  sortieStructuree: true,
  outils: true,
  audio: false,
  embeddings: false,
  code: true,
  sources: false,
};

export class FournisseurGroq extends FournisseurCompatOpenAi {
  constructor() {
    super({
      id: 'groq',
      modele: () => configGroq().modele,
      cle: () => configGroq().cle,
      base: () => configGroq().base,
      capacites: CAPACITES,
      structure: 'json_schema',
    });
  }
}
