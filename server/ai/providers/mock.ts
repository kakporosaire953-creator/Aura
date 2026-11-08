/**
 * Fournisseur simulé — réservé aux tests automatisés
 * (AI_DEFAULT_PROVIDER=mock ou alias AURA_AI_PROVIDER=mock).
 * Il n'est jamais sélectionné par défaut et n'apparaît jamais dans
 * l'interface produit. Aucun appel réseau, aucun coût.
 *
 * L'injection de pannes (`echec`) permet de tester le routeur et le
 * fallback sans réseau : les tests simulent les fournisseurs, jamais
 * l'application.
 */
import type {
  CapacitesAi,
  FournisseurAi,
  RequeteAi,
  RequeteStructuree,
  ReponseAi,
  ResultatGrounding,
} from '../types.js';
import { CODES_AI, ErreurAi } from '../errors.js';

export type EchecSimule = 'quota' | 'auth' | 'reseau' | 'timeout' | 'vide' | 'contenu' | 'sortie';

export class FournisseurMock implements FournisseurAi {
  readonly id: string;
  readonly modele: string;

  private readonly capacites: CapacitesAi;
  private readonly echec: EchecSimule | null;
  /** Appels réellement reçus (vérifications de tests). */
  private compteur = 0;

  constructor(
    opts: {
      id?: string;
      capacites?: Partial<CapacitesAi>;
      echec?: EchecSimule;
    } = {},
  ) {
    this.id = opts.id ?? 'mock';
    this.modele = 'mock-1';
    this.echec = opts.echec ?? null;
    this.capacites = {
      texte: true,
      streaming: true,
      imagesEntree: true,
      generationImages: false,
      sortieStructuree: true,
      outils: false,
      audio: false,
      embeddings: false,
      code: true,
      sources: false,
      ...opts.capacites,
    };
  }

  get nombreAppels(): number {
    return this.compteur;
  }

  getCapabilities(): CapacitesAi {
    return this.capacites;
  }

  async checkAvailability(): Promise<{ ok: boolean; raison?: string }> {
    return { ok: true };
  }

  private echouer(): void {
    this.compteur++;
    if (!this.echec) return;
    switch (this.echec) {
      case 'quota':
        throw new ErreurAi('Quota simulé.', CODES_AI.limite, 429, 'quota');
      case 'auth':
        throw new ErreurAi('Auth simulée.', CODES_AI.auth, 502, 'auth');
      case 'reseau':
        throw new ErreurAi('Réseau simulé.', CODES_AI.reseau, 502, 'reseau');
      case 'timeout':
        throw new ErreurAi('Timeout simulé.', CODES_AI.timeout, 504, 'timeout');
      case 'vide':
        throw new ErreurAi('Réponse vide simulée.', CODES_AI.vide, 502, 'contenu');
      case 'contenu':
        throw new ErreurAi('Blocage simulé.', CODES_AI.bloque, 422, 'contenu');
      case 'sortie':
        throw new ErreurAi('Sortie invalide simulée.', CODES_AI.sortieInvalide, 502, 'sortie');
    }
  }

  private synthese(req: RequeteAi): string {
    const dernier = [...req.messages].reverse().find((m) => m.role === 'user');
    const images = dernier?.images?.length ?? 0;
    const noteImages = images
      ? ` (${images} image${images > 1 ? 's' : ''} reçue${images > 1 ? 's' : ''})`
      : '';
    return `[mock] Réponse à : ${(dernier?.content ?? '').slice(0, 120)}${noteImages}`;
  }

  async generateResponse(req: RequeteAi): Promise<ReponseAi> {
    this.echouer();
    return { texte: this.synthese(req), modele: this.modele, fournisseur: this.id };
  }

  async streamResponse(req: RequeteAi, onChunk: (t: string) => void): Promise<ReponseAi> {
    this.echouer();
    const texte = this.synthese(req);
    for (const mot of texte.split(' ')) onChunk(mot + ' ');
    return { texte, modele: this.modele, fournisseur: this.id };
  }

  async generateStructuredOutput<T>(req: RequeteStructuree): Promise<T> {
    this.echouer();
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

  /** Recherche sourcée simulée — tests uniquement (capacité `sources`). */
  async rechercherAvecSources(question: string): Promise<ResultatGrounding> {
    this.echouer();
    return {
      texte: `[mock] Synthèse pour : ${question.slice(0, 80)}`,
      sources: [{ titre: 'Exemple (test)', url: 'https://example.org/test', extrait: '' }],
    };
  }
}
