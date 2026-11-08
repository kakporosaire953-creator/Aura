/**
 * Routeur IA — politique de routage déterministe et centralisée.
 *
 * Le type de tâche est déclaré par la route appelante ; la politique
 * ci-dessous traduit chaque tâche en capacités requises/preferables, et
 * l'ordre de priorité vient de la configuration (AI_DEFAULT_PROVIDER +
 * AI_FALLBACK_ORDER). Aucun routage « à l'appréciation d'un modèle ».
 *
 * Changer les priorités = changer la configuration, pas le backend.
 */
import type { CapacitesAi, FournisseurAi, TacheAi } from './types.js';

export type PolitiqueTache = {
  capacitesRequises: (keyof CapacitesAi)[];
  capacitesPreferables: (keyof CapacitesAi)[];
};

/**
 * Table de routage (Phase 4 de la mission) :
 *   conversation  → fournisseur principal disponible (texte)
 *   code          → modèle déclaré compatible code
 *   image         → analyse d'image : fournisseur acceptant les images
 *   raisonnement  → texte (capacité de raisonnement du modèle configuré)
 *   structure     → sortie structurée (JSON)
 *   recherche     → capacité sources (URLs réelles)
 */
export const POLITIQUE_ROUTAGE: Record<TacheAi, PolitiqueTache> = {
  conversation: { capacitesRequises: ['texte'], capacitesPreferables: ['streaming'] },
  code: { capacitesRequises: ['texte', 'code'], capacitesPreferables: [] },
  structure: { capacitesRequises: ['texte', 'sortieStructuree'], capacitesPreferables: [] },
  creation: { capacitesRequises: ['texte'], capacitesPreferables: ['sortieStructuree'] },
  recherche: { capacitesRequises: ['sources'], capacitesPreferables: [] },
  image: { capacitesRequises: ['imagesEntree'], capacitesPreferables: [] },
  raisonnement: { capacitesRequises: ['texte'], capacitesPreferables: [] },
};

export function politique(tache: TacheAi): PolitiqueTache {
  return POLITIQUE_ROUTAGE[tache] ?? POLITIQUE_ROUTAGE.conversation;
}

/** Capacités requises pour un mode d'appel concret (ex. streaming). */
export function capacitesPour(
  tache: TacheAi,
  opts: { streaming?: boolean; structuree?: boolean } = {},
): (keyof CapacitesAi)[] {
  const p = politique(tache);
  const req = new Set(p.capacitesRequises);
  if (opts.streaming) req.add('streaming');
  if (opts.structuree) req.add('sortieStructuree');
  return [...req];
}

/** Un fournisseur couvre-t-il toutes les capacités requises ? */
export function couvre(f: FournisseurAi, requises: (keyof CapacitesAi)[]): boolean {
  const caps = f.getCapabilities();
  return requises.every((c) => caps[c]);
}

/**
 * Ordonne les candidats pour une tâche : dans l'ordre déterministe du
 * registre (configuré), en ne gardant que les fournisseurs capables.
 */
export function ordonnerCandidats(
  fournisseurs: FournisseurAi[],
  requises: (keyof CapacitesAi)[],
): FournisseurAi[] {
  return fournisseurs.filter((f) => couvre(f, requises));
}
