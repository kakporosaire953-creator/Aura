/**
 * Registre et routage IA.
 *
 * - Enregistrement de plusieurs fournisseurs ; sélection par capacité
 *   requise, disponibilité et ordre de préférence.
 * - Repli unique : si le fournisseur principal échoue (hors erreurs de
 *   saisie/blocage), un second fournisseur compatible peut prendre la
 *   relance — une seule fois, jamais de boucle de tentatives.
 * - Journalisation technique sans contenu privé ni clés.
 */
import { FournisseurGemini } from './gemini';
import { FournisseurMock } from './mock';
import {
  CODES_AI,
  ErreurAi,
  type CapacitesAi,
  type FournisseurAi,
  type RequeteAi,
  type RequeteStructuree,
  type ReponseAi,
} from './types';

export type BesoinAi = {
  capacites?: (keyof CapacitesAi)[];
  usage?: 'chat' | 'structure' | 'recherche' | 'creation';
};

let fournisseurs: FournisseurAi[] | null = null;

export function registreFournisseurs(): FournisseurAi[] {
  if (fournisseurs) return fournisseurs;
  const liste: FournisseurAi[] = [];
  const choix = (process.env.AURA_AI_PROVIDER ?? 'auto').toLowerCase();
  if (choix === 'mock') {
    liste.push(new FournisseurMock());
    fournisseurs = liste;
    return liste;
  }
  // Par défaut : gemini, puis replis futurs enregistrés ici.
  liste.push(new FournisseurGemini());
  fournisseurs = liste;
  return liste;
}

/** Réinitialisation (tests uniquement). */
export function reinitialiserRegistre(): void {
  fournisseurs = null;
}

function disponible(f: FournisseurAi): Promise<{ ok: boolean; raison?: string }> {
  return f.checkAvailability();
}

/** Premier fournisseur disponible couvrant le besoin. */
export async function selectionner(besoin: BesoinAi = {}): Promise<FournisseurAi | null> {
  for (const f of registreFournisseurs()) {
    const caps = f.getCapabilities();
    const couvert = (besoin.capacites ?? []).every((c) => caps[c]);
    if (!couvert) continue;
    const dispo = await disponible(f);
    if (dispo.ok) return f;
  }
  return null;
}

/**
 * Exécute avec repli unique : le premier fournisseur disponible est essayé ;
 * en cas d'erreur technique (5xx, réseau), le suivant compatible l'est une
 * fois. Les erreurs de saisie ou de blocage ne déclenchent pas de repli.
 */
export async function executerAvecRepli(
  besoin: BesoinAi,
  action: (f: FournisseurAi) => Promise<ReponseAi>,
): Promise<ReponseAi> {
  const candidats: FournisseurAi[] = [];
  for (const f of registreFournisseurs()) {
    const caps = f.getCapabilities();
    if ((besoin.capacites ?? []).every((c) => caps[c]) && (await disponible(f)).ok) {
      candidats.push(f);
    }
  }
  if (candidats.length === 0) {
    throw new ErreurAi(
      'Aucun moteur IA n’est configuré sur cet environnement (GEMINI_API_KEY manquante).',
      CODES_AI.cleManquante,
      503,
    );
  }
  let derniere: unknown = null;
  for (const f of candidats.slice(0, 2)) {
    try {
      return await action(f);
    } catch (e) {
      derniere = e;
      const statut = e instanceof ErreurAi ? e.statut : 502;
      // Erreurs définitives : pas de repli.
      if (e instanceof ErreurAi && [422, 400, 503].includes(e.statut)) throw e;
      if (statut < 500 && statut !== 429) throw e;
    }
  }
  if (derniere instanceof Error) throw derniere;
  throw new ErreurAi('Le moteur IA est indisponible.', CODES_AI.indisponible, 502);
}

export async function generateResponse(besoin: BesoinAi, req: RequeteAi): Promise<ReponseAi> {
  return executerAvecRepli({ capacites: ['texte'], ...besoin }, (f) => f.generateResponse(req));
}

export async function streamResponse(
  besoin: BesoinAi,
  req: RequeteAi,
  onChunk: (t: string) => void,
  signal?: AbortSignal,
): Promise<ReponseAi> {
  return executerAvecRepli({ capacites: ['texte', 'streaming'], ...besoin }, (f) =>
    f.streamResponse(req, onChunk, signal),
  );
}

export async function generateStructuredOutput<T>(
  besoin: BesoinAi,
  req: RequeteStructuree,
): Promise<T> {
  const f = await selectionner({ capacites: ['texte', 'sortieStructuree'], ...besoin });
  if (!f) {
    throw new ErreurAi(
      'Aucun moteur IA n’est configuré sur cet environnement (GEMINI_API_KEY manquante).',
      CODES_AI.cleManquante,
      503,
    );
  }
  return f.generateStructuredOutput<T>(req);
}

/** État réel des fournisseurs (pour /api/v1/capabilities — sans secrets). */
export async function etatFournisseurs(): Promise<{
  fournisseur: string | null;
  modele: string | null;
  capacites: CapacitesAi | null;
  raison: string | null;
}> {
  const f = await selectionner({ capacites: ['texte'] });
  if (!f) {
    return { fournisseur: null, modele: null, capacites: null, raison: 'Aucun moteur IA configuré (clé serveur manquante).' };
  }
  return {
    fournisseur: f.id,
    modele: f.modele,
    capacites: f.getCapabilities(),
    raison: null,
  };
}
