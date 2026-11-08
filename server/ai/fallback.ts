/**
 * Gestionnaire de repli (Phase 5) — jamais aveugle.
 *
 * Règles :
 *  - la chaîne ne parcourt que des fournisseurs CAPABLES (routeur) et
 *    CONFIGURÉS (clé présente) ;
 *  - une erreur de validation, de contenu ou de configuration interrompt
 *    immédiatement la chaîne (aucun repli) ;
 *  - une erreur d'authentification désactive le fautif (jamais de nouvelle
 *    tentative sur lui) et laisse la chaîne basculer sur le suivant ;
 *  - quota / timeout / réseau / serveur : bascule légitime sur le suivant ;
 *  - au plus `maxTentatives` fournisseurs sont essayés (1 + AI_MAX_RETRIES,
 *    dans la limite des candidats) ;
 *  - chaque bascule est journalisée par la couche usage (événement).
 */
import { estRecuperable, ErreurAi, natureDe } from './errors.js';
import type { FournisseurAi } from './types.js';

export type OptionsRepli = {
  maxTentatives: number;
  /** Appelé à chaque échec avant bascule (journalisation). */
  onEchec?: (fournisseur: FournisseurAi, erreur: unknown, tentative: number) => void | Promise<void>;
  /** Désactive durablement un fournisseur (ex. erreur d'authentification). */
  onDesactiver?: (fournisseur: FournisseurAi) => void;
  /** État de quota connu : le fournisseur est écarté des requêtes suivantes. */
  onQuota?: (fournisseur: FournisseurAi) => void;
  /**
   * Règle streaming : si une réponse a déjà été émise vers le client,
   * aucune bascule silencieuse vers un autre fournisseur.
   */
  peutBasculer?: () => boolean;
};

export async function executerAvecRepli<T>(
  candidats: FournisseurAi[],
  action: (f: FournisseurAi) => Promise<T>,
  opts: OptionsRepli,
): Promise<T> {
  const tentatives = candidats.slice(0, Math.max(1, opts.maxTentatives));
  if (tentatives.length === 0) {
    throw new ErreurAi(
      'Aucun moteur IA n’est configuré sur cet environnement (clés serveur manquantes).',
      'aucun-fournisseur',
      503,
      'config',
    );
  }
  let derniere: unknown = null;
  for (const [i, f] of tentatives.entries()) {
    if (i > 0 && opts.peutBasculer && !opts.peutBasculer()) {
      // Première réponse déjà émise côté client : l'erreur est remontée.
      if (derniere instanceof Error) throw derniere;
      throw new ErreurAi('Le moteur IA est indisponible.', 'modele-indisponible', 502, 'serveur');
    }
    try {
      return await action(f);
    } catch (e) {
      derniere = e;
      const nature = natureDe(e);
      if (nature === 'auth') opts.onDesactiver?.(f);
      if (nature === 'quota') opts.onQuota?.(f);
      if (!estRecuperable(e)) throw e;
      await opts.onEchec?.(f, e, i + 1);
    }
  }
  if (derniere instanceof ErreurAi) throw derniere;
  if (derniere instanceof Error) throw derniere;
  throw new ErreurAi('Le moteur IA est indisponible.', 'modele-indisponible', 502, 'serveur');
}
