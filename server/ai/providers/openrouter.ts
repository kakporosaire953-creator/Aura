/**
 * Adaptateur OpenRouter — API compatible OpenAI (`openrouter.ai/api/v1`).
 *
 * - Accès à un catalogue de modèles : la sélection se configure par
 *   `OPENROUTER_MODEL` sans toucher aux composants métier ;
 * - Streaming SSE (`data: {...}`, terminateur `[DONE]`, commentaires
 *   ignorés par le transport commun) ;
 * - Sortie structurée via `json_object` + schéma en consigne : support
 *   large à travers le catalogue (les capacités varient par modèle) ;
 * - En-têtes d'attribution optionnels (`HTTP-Referer`, `X-OpenRouter-Title`).
 */
import { configOpenRouter } from '../config.js';
import type { CapacitesAi } from '../types.js';
import { FournisseurCompatOpenAi } from './openai-compat.js';

const CAPACITES: CapacitesAi = {
  texte: true,
  streaming: true,
  // Entrée image : conservée à `false` par défaut car elle dépend du
  // modèle sélectionné dans le catalogue — activable dans cette constante
  // lorsque le modèle configuré est réellement multimodal.
  imagesEntree: false,
  generationImages: false,
  sortieStructuree: true,
  outils: true,
  audio: false,
  embeddings: false,
  code: true,
  sources: false,
};

export class FournisseurOpenRouter extends FournisseurCompatOpenAi {
  constructor() {
    super({
      id: 'openrouter',
      modele: () => configOpenRouter().modele,
      cle: () => configOpenRouter().cle,
      base: () => configOpenRouter().base,
      entetes: {
        'HTTP-Referer': 'https://aura.africa',
        'X-OpenRouter-Title': 'AURA',
      },
      capacites: CAPACITES,
      structure: 'json_object',
    });
  }
}
