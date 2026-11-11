/**
 * Moteur de recherche documentaire — hybride, mais honnête sur ses moyens.
 *
 * Classement lexical BM25 sur les segments, corrigé par :
 *  - la correspondance au niveau de la ressource (titre, description) ;
 *  - le niveau d'autorité (A officiel > B spécialisé > C complémentaire) ;
 *  - la fraîcheur du domaine (une source hors fenêtre est pénalisée et
 *    signalée, jamais silencieusement écartée) ;
 *  - la similarité sémantique **si** un encodeur est branché.
 *
 * Le score mesure la **pertinence documentaire**, pas la vérité. Deux
 * passages quasi identiques sont fusionnés (Jaccard) et une même ressource
 * ne peut pas monopoliser la sélection (deux passages maximum).
 */
import { estPerimee, seuilFraicheur } from './domaines.js';
import { plonger } from './plongement.js';
import type { Encodeur } from './plongement.js';
import { listerRessources, lireIndex } from './stockage.js';
import { mots } from './texte.js';
import type { IndexRessource, NiveauAutorite, Ressource } from './types.js';
import { estUtilisable } from './types.js';
import { cosinus, dequantifier } from './vecteurs.js';

export type Passage = {
  ressourceId: string;
  titre: string;
  organisme: string;
  url: string | null;
  niveau: NiveauAutorite;
  domaine: string;
  pays: string;
  publication: string | null;
  verification: string | null;
  ordre: number;
  texte: string;
  score: number;
  alertes: string[];
};

export type OptionsRecherche = {
  question: string;
  /** Restriction explicite (détection automatique sinon). */
  domaines?: string[];
  pays?: string[];
  limite?: number;
  /** Encodeur injecté (tests ou fournisseur futur). */
  encodeur?: Encodeur | null;
  maintenant?: number;
};

export type ResultatRecherche = {
  passages: Passage[];
  ressources: number;
  mode: 'lexical' | 'hybride';
  avertissements: string[];
  couverture: number;
};

const POIDS_AUTORITE: Record<NiveauAutorite, number> = { A: 1, B: 0.82, C: 0.6 };
const PENALITE_ANCIENNE = 0.85;
const K1 = 1.2;
const B = 0.75;

type CacheIndex = { maj: string; segments: { ordre: number; tokens: string[]; longueur: number }[] };
const cache = new Map<string, CacheIndex>();
const CACHE_MAX = 400;

function tokensIndex(r: Ressource, index: IndexRessource): CacheIndex {
  const existant = cache.get(r.id);
  if (existant && existant.maj === r.maj) return existant;
  const calcul: CacheIndex = {
    maj: r.maj,
    segments: index.segments.map((s) => {
      const t = mots(s.texte);
      return { ordre: s.ordre, tokens: t, longueur: t.length };
    }),
  };
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(r.id, calcul);
  return calcul;
}

export function viderCacheRecherche(): void {
  cache.clear();
}

/** Chevauchement lexical (Jaccard) entre deux sacs de mots. */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const m of sa) if (sb.has(m)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function alertesDe(r: Ressource, maintenant: number): string[] {
  const alertes: string[] = [];
  if (r.statut === 'a-verifier') alertes.push('source non vérifiée');
  if (r.statut === 'archive') alertes.push('source archivée');
  if (estPerimee(r, maintenant)) {
    alertes.push(`à revérifier (fenêtre de ${seuilFraicheur(r.domaine)} jours dépassée)`);
  }
  if (r.niveau === 'C') alertes.push('source complémentaire (niveau C)');
  if (r.avertissements.length > 0) alertes.push(...r.avertissements);
  return alertes;
}

/**
 * Recherche les passages les plus proches de la question.
 * Ne lève jamais d'exception pour un corpus vide : renvoie une liste vide.
 */
export async function rechercher(opts: OptionsRecherche): Promise<ResultatRecherche> {
  const maintenant = opts.maintenant ?? Date.now();
  const termesQuestion = [...new Set(mots(opts.question))];
  const limite = Math.max(1, Math.min(opts.limite ?? 6, 12));
  const avertissements: string[] = [];

  if (termesQuestion.length === 0) {
    return { passages: [], ressources: 0, mode: 'lexical', avertissements, couverture: 0 };
  }

  const toutes = await listerRessources();
  const ressources = toutes.filter((r) => {
    if (!estUtilisable(r)) return false;
    if (opts.domaines?.length && !opts.domaines.includes(r.domaine)) return false;
    if (opts.pays?.length && !opts.pays.includes(r.pays)) return false;
    return true;
  });
  if (ressources.length === 0) {
    return { passages: [], ressources: 0, mode: 'lexical', avertissements, couverture: 0 };
  }

  const indexes = new Map<string, IndexRessource>();
  for (const r of ressources) {
    const index = await lireIndex(r.id);
    if (index && index.segments.length > 0) indexes.set(r.id, index);
  }
  if (indexes.size === 0) {
    return { passages: [], ressources: 0, mode: 'lexical', avertissements, couverture: 0 };
  }

  // Statistiques globales (df, longueur moyenne).
  const df = new Map<string, number>();
  let totalSegments = 0;
  let totalLongueur = 0;
  const parRessource = new Map<string, CacheIndex>();
  for (const r of ressources) {
    const index = indexes.get(r.id);
    if (!index) continue;
    const c = tokensIndex(r, index);
    parRessource.set(r.id, c);
    for (const s of c.segments) {
      totalSegments++;
      totalLongueur += s.longueur;
      for (const t of new Set(s.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
    }
  }
  const longueurMoyenne = totalSegments > 0 ? totalLongueur / totalSegments : 1;
  const idf = (terme: string): number => {
    const n = df.get(terme) ?? 0;
    return Math.log(1 + (totalSegments - n + 0.5) / (n + 0.5));
  };
  const idfQuestion = new Map(termesQuestion.map((t) => [t, idf(t)]));
  const poidsTotal = [...idfQuestion.values()].reduce((a, b) => a + b, 0) || 1;

  // Encodeur : seulement si demandé/injecté et si l'index contient des vecteurs.
  const encodeur = opts.encodeur === null ? null : (opts.encodeur ?? null);
  let vecteurQuestion: number[] | null = null;
  if (encodeur && [...indexes.values()].some((i) => i.segments.some((s) => s.vecteur))) {
    const v = await plonger([opts.question], encodeur);
    vecteurQuestion = v ? v[0] : null;
  }
  const mode: 'lexical' | 'hybride' = vecteurQuestion ? 'hybride' : 'lexical';

  const candidats: (Passage & { tokens: string[] })[] = [];
  for (const r of ressources) {
    const index = indexes.get(r.id);
    const cacheR = parRessource.get(r.id);
    if (!index || !cacheR) continue;

    const tokensRessource = new Set(mots(`${r.titre} ${r.description} ${r.sousDomaine ?? ''}`));
    const correspondanceRessource =
      termesQuestion.filter((t) => tokensRessource.has(t)).length / termesQuestion.length;

    const alertes = alertesDe(r, maintenant);
    const facteurFraicheur = estPerimee(r, maintenant) ? PENALITE_ANCIENNE : 1;
    const facteurAutorite = POIDS_AUTORITE[r.niveau];

    const statsParOrdre = new Map(cacheR.segments.map((x) => [x.ordre, x]));
    for (const s of index.segments) {
      const stats = statsParOrdre.get(s.ordre);
      if (!stats || stats.tokens.length === 0) continue;
      const frequences = new Map<string, number>();
      for (const t of stats.tokens) frequences.set(t, (frequences.get(t) ?? 0) + 1);

      let bm25 = 0;
      let couverts = 0;
      for (const terme of termesQuestion) {
        const f = frequences.get(terme) ?? 0;
        if (f === 0) continue;
        couverts++;
        const denominateur = f + K1 * (1 - B + (B * stats.longueur) / longueurMoyenne);
        bm25 += (idfQuestion.get(terme) ?? 1) * ((f * (K1 + 1)) / denominateur);
      }
      if (bm25 === 0) continue;

      // Normalisation par le poids maximal possible de la question.
      let score = bm25 / (K1 + 1) / poidsTotal;
      score += 0.25 * correspondanceRessource;
      score *= facteurAutorite * facteurFraicheur;

      if (vecteurQuestion && s.vecteur) {
        const v = dequantifier({
          base64: s.vecteur,
          echelle: index.vecteurEchelle ?? 1,
          dimension: index.vecteurDim ?? 0,
        });
        score += 0.5 * ((cosinus(vecteurQuestion, v) + 1) / 2);
      }

      candidats.push({
        ressourceId: r.id,
        titre: r.titre,
        organisme: r.organisme,
        url: r.url,
        niveau: r.niveau,
        domaine: r.domaine,
        pays: r.pays,
        publication: r.publication,
        verification: r.verification,
        ordre: s.ordre,
        texte: s.texte,
        score,
        alertes,
        tokens: stats.tokens,
      });
    }
  }

  if (candidats.length === 0) {
    return { passages: [], ressources: ressources.length, mode, avertissements, couverture: 0 };
  }

  candidats.sort((a, b) => b.score - a.score);
  const meilleur = candidats[0].score;
  const seuil = Math.max(0.02, meilleur * 0.25);

  const retenus: Passage[] = [];
  const parRessourceCompte = new Map<string, number>();
  for (const candidat of candidats) {
    if (retenus.length >= limite) break;
    if (candidat.score < seuil) break;
    const dejaLa = parRessourceCompte.get(candidat.ressourceId) ?? 0;
    if (dejaLa >= 2) continue;
    const tropProche = retenus.some((p) => {
      const tokensP = mots(p.texte);
      return jaccard(tokensP, candidat.tokens) > 0.7;
    });
    if (tropProche) continue;
    const { tokens: _tokens, ...passage } = candidat;
    void _tokens;
    retenus.push(passage);
    parRessourceCompte.set(candidat.ressourceId, dejaLa + 1);
  }

  const couverture =
    retenus.length === 0
      ? 0
      : Math.min(
          1,
          termesQuestion.filter((t) => retenus.some((p) => mots(p.texte).includes(t))).length /
            termesQuestion.length,
        );

  const niveauxC = retenus.filter((p) => p.niveau === 'C').length;
  const anciennes = retenus.filter((p) => p.alertes.some((a) => a.startsWith('à revérifier'))).length;
  if (anciennes > 0) {
    avertissements.push(
      `${anciennes} passage(s) proviennent de sources dont la fenêtre de fraîcheur est dépassée : à vérifier avant d’agir.`,
    );
  }
  if (niveauxC > 0 && retenus.every((p) => p.niveau === 'C')) {
    avertissements.push('Ces passages ne viennent que de sources complémentaires (niveau C), pas de sources officielles.');
  }
  if (mode === 'lexical' && retenus.length > 0) {
    avertissements.push('Recherche lexicale uniquement : la similarité sémantique n’est pas active.');
  }

  return { passages: retenus, ressources: ressources.length, mode, avertissements, couverture };
}
