/**
 * Persistance du référentiel — **le stockage existant**, pas un second.
 *
 * Réutilise `baseDeDonnees()` (Vercel KV en production, JSON atomique en
 * développement). Aucune base supplémentaire n'est introduite : le
 * référentiel est un ensemble de clés préfixées, comme les comptes.
 *
 * Clés :
 *   aurav1:savoir:r:<id>   métadonnées de la ressource
 *   aurav1:savoir:c:<id>   texte extrait et nettoyé
 *   aurav1:savoir:i:<id>   index (segments, vecteurs éventuels)
 *   aurav1:savoir:s:<id>   entrée du catalogue de sources
 *   aurav1:savoir:j        journal d'ingestion et d'administration
 */
import { baseDeDonnees } from '../db/entrepots.js';
import type { BaseDeDonnees } from '../db/base.js';
import type {
  IndexRessource,
  JournalSavoir,
  Ressource,
  SourceCatalogue,
} from './types.js';

export class ErreurSavoir extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statut = 400,
  ) {
    super(message);
    this.name = 'ErreurSavoir';
  }
}

export const CLE_SAVOIR = {
  ressource: (id: string) => `aurav1:savoir:r:${id}`,
  contenu: (id: string) => `aurav1:savoir:c:${id}`,
  index: (id: string) => `aurav1:savoir:i:${id}`,
  source: (id: string) => `aurav1:savoir:s:${id}`,
  journal: 'aurav1:savoir:j',
} as const;

const PREFIXE_RESSOURCE = 'aurav1:savoir:r:';
const PREFIXE_SOURCE = 'aurav1:savoir:s:';
const JOURNAL_MAX = 200;

function base(): BaseDeDonnees {
  const b = baseDeDonnees();
  if (b.mode === 'indisponible') {
    throw new ErreurSavoir(
      b.raison ?? 'Stockage indisponible : le référentiel ne peut pas être lu.',
      'stockage-indisponible',
      503,
    );
  }
  return b;
}

/* ───────────────────────── Ressources ───────────────────────── */

export async function ecrireRessource(r: Ressource): Promise<void> {
  await base().ecrire(CLE_SAVOIR.ressource(r.id), r);
}

export async function lireRessource(id: string): Promise<Ressource | null> {
  return base().lire<Ressource>(CLE_SAVOIR.ressource(id));
}

export async function listerRessources(): Promise<Ressource[]> {
  const b = base();
  const cles = await b.lister(PREFIXE_RESSOURCE);
  const ressources: Ressource[] = [];
  for (const cle of cles) {
    const r = await b.lire<Ressource>(cle);
    if (r) ressources.push(r);
  }
  return ressources.sort((a, b2) => (a.cree < b2.cree ? 1 : -1));
}

export async function ecrireContenu(id: string, texte: string): Promise<void> {
  await base().ecrire(CLE_SAVOIR.contenu(id), { texte });
}

export async function lireContenu(id: string): Promise<string | null> {
  const d = await base().lire<{ texte: string }>(CLE_SAVOIR.contenu(id));
  return d?.texte ?? null;
}

export async function ecrireIndex(index: IndexRessource): Promise<void> {
  await base().ecrire(CLE_SAVOIR.index(index.ressourceId), index);
}

export async function lireIndex(ressourceId: string): Promise<IndexRessource | null> {
  return base().lire<IndexRessource>(CLE_SAVOIR.index(ressourceId));
}

/** Suppression complète : métadonnées, contenu et index. */
export async function supprimerRessource(id: string): Promise<void> {
  const b = base();
  await b.supprimer(CLE_SAVOIR.index(id));
  await b.supprimer(CLE_SAVOIR.contenu(id));
  await b.supprimer(CLE_SAVOIR.ressource(id));
}

/* ───────────────────────── Catalogue de sources ───────────────────────── */

export async function ecrireSource(s: SourceCatalogue): Promise<void> {
  await base().ecrire(CLE_SAVOIR.source(s.id), s);
}

export async function lireSource(id: string): Promise<SourceCatalogue | null> {
  return base().lire<SourceCatalogue>(CLE_SAVOIR.source(id));
}

export async function listerSources(): Promise<SourceCatalogue[]> {
  const b = base();
  const cles = await b.lister(PREFIXE_SOURCE);
  const sources: SourceCatalogue[] = [];
  for (const cle of cles) {
    const s = await b.lire<SourceCatalogue>(cle);
    if (s) sources.push(s);
  }
  return sources.sort((a, b2) => a.nom.localeCompare(b2.nom));
}

export async function supprimerSource(id: string): Promise<void> {
  await base().supprimer(CLE_SAVOIR.source(id));
}

/* ───────────────────────── Journal ───────────────────────── */

export async function journalAjouter(entree: JournalSavoir): Promise<void> {
  const b = base();
  const existant = (await b.lire<JournalSavoir[]>(CLE_SAVOIR.journal)) ?? [];
  const suivant = [entree, ...existant].slice(0, JOURNAL_MAX);
  await b.ecrire(CLE_SAVOIR.journal, suivant);
}

export async function journalLire(): Promise<JournalSavoir[]> {
  return (await base().lire<JournalSavoir[]>(CLE_SAVOIR.journal)) ?? [];
}

/* ───────────────────────── Synthèse ───────────────────────── */

export type StatistiquesSavoir = {
  ressources: number;
  actives: number;
  aVerifier: number;
  archivees: number;
  segments: number;
  sources: number;
  sourcesActives: number;
  pays: string[];
  domaines: Record<string, number>;
};

export async function statistiquesSavoir(): Promise<StatistiquesSavoir> {
  const [ressources, sources] = await Promise.all([listerRessources(), listerSources()]);
  const domaines: Record<string, number> = {};
  for (const r of ressources) domaines[r.domaine] = (domaines[r.domaine] ?? 0) + 1;
  return {
    ressources: ressources.length,
    actives: ressources.filter((r) => r.statut === 'actif').length,
    aVerifier: ressources.filter((r) => r.statut === 'a-verifier').length,
    archivees: ressources.filter((r) => r.statut === 'archive').length,
    segments: ressources.reduce((n, r) => n + r.segments, 0),
    sources: sources.length,
    sourcesActives: sources.filter((s) => s.statut === 'actif').length,
    pays: [...new Set(ressources.map((r) => r.pays))].sort(),
    domaines,
  };
}
