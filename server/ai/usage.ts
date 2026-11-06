/**
 * Suivi de consommation IA — par utilisateur (agrégat `evenements`,
 * isolé par compte) et par fournisseur (identifiant interne en méta).
 *
 * Aucun contenu utilisateur n'est stocké ici : uniquement des compteurs
 * et identifiants techniques. Les clés API ne figurent jamais dans les
 * événements.
 */
import { nouvelId, type EntrepotDonnees } from '../db/entrepots';

export type TraceUsage = {
  fournisseur: string;
  modele: string;
  mode: 'generation' | 'stream' | 'structure' | 'recherche' | 'repli';
  caracteres?: number;
  tokensEntree?: number;
  tokensSortie?: number;
  /** Code d'erreur normalisé pour les événements `repli`. */
  erreur?: string;
};

export async function enregistrerUsage(
  donnees: EntrepotDonnees | undefined,
  trace: TraceUsage,
): Promise<void> {
  if (!donnees) return;
  try {
    await donnees.enregistrerEvenement({
      id: nouvelId('evt'),
      genre: 'ia',
      cree: new Date().toISOString(),
      meta: {
        fournisseur: trace.fournisseur,
        modele: trace.modele,
        mode: trace.mode,
        ...(trace.caracteres !== undefined ? { caracteres: trace.caracteres } : {}),
        ...(trace.tokensEntree !== undefined ? { tokensEntree: trace.tokensEntree } : {}),
        ...(trace.tokensSortie !== undefined ? { tokensSortie: trace.tokensSortie } : {}),
        ...(trace.erreur ? { erreur: trace.erreur } : {}),
      },
    });
  } catch {
    /* le suivi d'usage ne doit jamais faire échouer une génération */
  }
}

/**
 * Consommation agrégée par fournisseur pour un compte (lecture des
 * événements déjà enregistrés — destinée aux futurs écrans de suivi).
 */
export async function consommationParFournisseur(
  donnees: EntrepotDonnees,
): Promise<Record<string, { appels: number; caracteres: number }>> {
  const evenements = await donnees.evenements();
  const par: Record<string, { appels: number; caracteres: number }> = {};
  for (const e of evenements) {
    if (e.genre !== 'ia') continue;
    const f = String((e.meta as Record<string, unknown>)?.fournisseur ?? 'inconnu');
    const c = Number((e.meta as Record<string, unknown>)?.caracteres ?? 0);
    par[f] ??= { appels: 0, caracteres: 0 };
    par[f].appels += 1;
    par[f].caracteres += Number.isFinite(c) ? c : 0;
  }
  return par;
}
