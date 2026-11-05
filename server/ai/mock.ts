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
    // Le mock renvoie une structure vide du bon genre : les tests fournissent
    // leurs propres valeurs via req.schema.mock.
    const mock = (req.schema as { mock?: unknown }).mock;
    return (mock ?? {}) as T;
  }
}
