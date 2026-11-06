/**
 * Fournisseur simulé — réservé aux tests automatisés (AURA_AI_PROVIDER=mock).
 * Il n'est jamais sélectionné par défaut et n'apparaît jamais dans
 * l'interface produit. Aucun appel réseau, aucun coût.
 */
import type { CapacitesAi, FournisseurAi, RequeteAi, RequeteStructuree, ReponseAi } from './types';

export class FournisseurMock implements FournisseurAi {
  readonly id = 'mock';
  readonly modele = 'mock-1';

  private readonly capacites: CapacitesAi;

  constructor(capacites: Partial<CapacitesAi> = {}) {
    this.capacites = {
      texte: true,
      streaming: true,
      imagesEntree: false,
      generationImages: false,
      sortieStructuree: true,
      outils: false,
      audio: false,
      embeddings: false,
      ...capacites,
    };
  }

  getCapabilities(): CapacitesAi {
    return this.capacites;
  }

  async checkAvailability(): Promise<{ ok: boolean; raison?: string }> {
    return { ok: true };
  }

  private synthese(req: RequeteAi): string {
    const dernier = [...req.messages].reverse().find((m) => m.role === 'user');
    return `[mock] Réponse à : ${(dernier?.content ?? '').slice(0, 120)}`;
  }

  async generateResponse(req: RequeteAi): Promise<ReponseAi> {
    return { texte: this.synthese(req), modele: this.modele, fournisseur: this.id };
  }

  async streamResponse(req: RequeteAi, onChunk: (t: string) => void): Promise<ReponseAi> {
    const texte = this.synthese(req);
    for (const mot of texte.split(' ')) onChunk(mot + ' ');
    return { texte, modele: this.modele, fournisseur: this.id };
  }

  async generateStructuredOutput<T>(req: RequeteStructuree): Promise<T> {
    // Valeur explicite fournie par le test via schema.mock.
    const mock = (req.schema as { mock?: unknown }).mock;
    if (mock !== undefined) return mock as T;
    // Sinon : structure minimaliste du genre attendu (jamais utilisée en
    // production — le fournisseur mock est réservé aux tests).
    const schema = req.schema as {
      properties?: Record<string, { type?: string; items?: { properties?: Record<string, unknown> } }>;
    };
    const dernier = [...req.messages].reverse().find((m) => m.role === 'user');
    const sujet = (dernier?.content ?? '').slice(0, 80);
    const out: Record<string, unknown> = {};
    for (const [cle, def] of Object.entries(schema.properties ?? {})) {
      if (def?.type === 'array') out[cle] = [
        {
          titre: `[mock] Étape 1 pour « ${sujet} »`,
          description: 'Proposition simulée (fournisseur de test).',
          priorite: 'haute',
          echeance: null,
          sousTaches: ['Préparer', 'Réaliser', 'Vérifier'],
        },
        {
          titre: `[mock] Étape 2 pour « ${sujet} »`,
          description: 'Proposition simulée (fournisseur de test).',
          priorite: 'moyenne',
          echeance: null,
          sousTaches: ['Réaliser'],
        },
      ];
      else if (def?.type === 'string') out[cle] = `[mock] ${sujet}`;
      else out[cle] = null;
    }
    return out as T;
  }
}
