/**
 * Erreurs IA normalisées — tous les fournisseurs lèvent les mêmes codes,
 * le reste de l'application ne connaît que cette taxonomie.
 *
 * Classification (`nature`) :
 *  - config   : clé absente / fournisseur non configuré → pas de repli sur
 *    cette instance (elle n'est même pas candidate) ;
 *  - auth     : clé rejetée par le fournisseur (permanente tant que la clé
 *    n'est pas corrigée) → jamais de nouvelle tentative sur CE fournisseur,
 *    la chaîne peut basculer sur le suivant (repli, pas « réessai ») ;
 *  - validation : requête invalide → aucun repli (aucun fournisseur ne
 *    réussira une requête malformée) ;
 *  - contenu  : refus/blocage ou réponse vide → aucun repli (spécifique à la
 *    demande) ;
 *  - quota / timeout / reseau / serveur → récupérables : la chaîne peut
 *    basculer sur le fournisseur suivant compatible ;
 *  - sortie   : sortie structurée illisible → récupérable (un autre modèle
 *    peut produire un JSON valide).
 */

export class ErreurAi extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statut: number,
    readonly nature: NatureErreur = classerStatut(statut),
  ) {
    super(message);
    this.name = 'ErreurAi';
  }
}

export const CODES_AI = {
  cleManquante: 'cle-manquante',
  indisponible: 'modele-indisponible',
  modeleIntrouvable: 'modele-introuvable',
  erreurFournisseur: 'erreur-fournisseur',
  limite: 'limite-modele',
  bloque: 'bloque',
  vide: 'vide',
  annule: 'annule',
  timeout: 'timeout',
  sortieInvalide: 'sortie-invalide',
  auth: 'auth-fournisseur',
  invalide: 'requete-invalide',
  reseau: 'reseau',
  aucunFournisseur: 'aucun-fournisseur',
} as const;

export type NatureErreur =
  | 'config'
  | 'auth'
  | 'validation'
  | 'contenu'
  | 'quota'
  | 'timeout'
  | 'reseau'
  | 'serveur'
  | 'sortie';

/** Classification d'un statut HTTP fournisseur. */
export function classerStatut(statut: number): NatureErreur {
  if (statut === 401 || statut === 403) return 'auth';
  if (statut === 402) return 'quota'; // crédits épuisés (ex. OpenRouter)
  if (statut === 429) return 'quota';
  if (statut === 408 || statut === 504) return 'timeout';
  if (statut === 400 || statut === 422) return 'validation';
  return 'serveur';
}

/** Nature d'une erreur quelconque rencontrée pendant un appel. */
export function natureDe(erreur: unknown): NatureErreur {
  if (erreur instanceof ErreurAi) return erreur.nature;
  if (erreur instanceof Error && erreur.name === 'AbortError') return 'timeout';
  if (erreur instanceof Error && erreur.name === 'TimeoutError') return 'timeout';
  return 'reseau';
}

/**
 * Le repli vers un AUTRE fournisseur est-il légitime ?
 * (jamais de repli pour une requête invalide, un refus de contenu ou une
 * erreur de configuration ; l'authentification refusée autorise la bascule
 * mais désactive durablement le fautif — jamais de réessai sur lui)
 */
export function estRecuperable(erreur: unknown): boolean {
  const n = natureDe(erreur);
  return (
    n === 'quota' || n === 'timeout' || n === 'reseau' || n === 'serveur' || n === 'sortie' || n === 'auth'
  );
}

/** Erreur attendue quand aucun fournisseur n'est utilisable. */
export function erreurAucunFournisseur(raison: string): ErreurAi {
  return new ErreurAi(raison, CODES_AI.aucunFournisseur, 503, 'config');
}
