/**
 * Catalogue de sources — l'autorisation **a priori** de la collecte.
 *
 * Une URL n'est téléchargée que si son hôte figure ici avec le statut
 * `actif`. Le catalogue distingue trois niveaux :
 *   A — officiel (gouvernement, institution publique) ;
 *   B — spécialisé (agence, université, organisation reconnue) ;
 *   C — complémentaire (presse, ONG, documentation tierce).
 *
 * Les huit domaines béninois proposés par l'utilisateur sont fournis comme
 * **candidats** : ils sont créés au statut `a-verifier` et ne permettent donc
 * aucune collecte tant qu'un administrateur ne les a pas validés après avoir
 * constaté leur accessibilité. Rien n'est supposé officiel par défaut.
 */
import { nouvelId } from '../db/entrepots.js';
import {
  ecrireSource,
  journalAjouter,
  lireSource,
  listerSources,
  supprimerSource,
} from './stockage.js';
import { ErreurSavoir } from './stockage.js';
import type { DomaineId, NiveauAutorite, SourceCatalogue } from './types.js';

export type CandidatSource = {
  id: string;
  nom: string;
  organisme: string;
  hote: string;
  url: string;
  niveau: NiveauAutorite;
  domaines: DomaineId[];
};

/** Candidats béninois : **non vérifiés**, donc non actifs par défaut. */
export const CANDIDATS_BENIN: CandidatSource[] = [
  {
    id: 'src-service-public',
    nom: 'Service Public Bénin',
    organisme: 'Gouvernement du Bénin',
    hote: 'service-public.bj',
    url: 'https://service-public.bj',
    niveau: 'A',
    domaines: ['administration'],
  },
  {
    id: 'src-presidence',
    nom: 'Présidence de la République du Bénin',
    organisme: 'Présidence de la République',
    hote: 'presidence.bj',
    url: 'https://presidence.bj',
    niveau: 'A',
    domaines: ['institutions'],
  },
  {
    id: 'src-gouv',
    nom: 'Portail officiel du Gouvernement',
    organisme: 'Gouvernement du Bénin',
    hote: 'gouv.bj',
    url: 'https://gouv.bj',
    niveau: 'A',
    domaines: ['institutions', 'administration'],
  },
  {
    id: 'src-sgg',
    nom: 'Secrétariat général du Gouvernement',
    organisme: 'SGG',
    hote: 'sgg.gouv.bj',
    url: 'https://sgg.gouv.bj',
    niveau: 'A',
    domaines: ['institutions'],
  },
  {
    id: 'src-instad',
    nom: 'Institut national de la statistique et de la démographie',
    organisme: 'INStaD',
    hote: 'instad.bj',
    url: 'https://instad.bj',
    niveau: 'A',
    domaines: ['statistiques'],
  },
  {
    id: 'src-enseignement-superieur',
    nom: 'Ministère de l’Enseignement supérieur',
    organisme: 'MESRS',
    hote: 'enseignement-superieur.gouv.bj',
    url: 'https://enseignement-superieur.gouv.bj',
    niveau: 'A',
    domaines: ['education'],
  },
  {
    id: 'src-culture',
    nom: 'Ministère du Tourisme, de la Culture et des Arts',
    organisme: 'MTCA',
    hote: 'culture.gouv.bj',
    url: 'https://culture.gouv.bj',
    niveau: 'A',
    domaines: ['culture'],
  },
  {
    id: 'src-numerique',
    nom: 'Ministère du Numérique et de la Digitalisation',
    organisme: 'MND',
    hote: 'numerique.gouv.bj',
    url: 'https://numerique.gouv.bj',
    niveau: 'A',
    domaines: ['numerique'],
  },
];

export async function ajouterSource(
  entree: {
    id?: string;
    nom: string;
    organisme: string;
    hote: string;
    url: string;
    niveau: NiveauAutorite;
    domaines: DomaineId[];
    statut?: SourceCatalogue['statut'];
    note?: string | null;
  },
  par: string,
): Promise<SourceCatalogue> {
  const hote = entree.hote.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hote)) {
    throw new ErreurSavoir('Hôte invalide (exemple : service-public.bj).', 'hote-invalide');
  }
  const existantes = await listerSources();
  if (existantes.some((s) => s.hote === hote)) {
    throw new ErreurSavoir(`L’hôte ${hote} est déjà dans le catalogue.`, 'doublon', 409);
  }
  const maintenant = new Date().toISOString();
  const source: SourceCatalogue = {
    id: entree.id ?? nouvelId('src'),
    nom: entree.nom,
    organisme: entree.organisme,
    hote,
    url: entree.url,
    niveau: entree.niveau,
    domaines: entree.domaines,
    statut: entree.statut ?? 'a-verifier',
    verifieLe: entree.statut === 'actif' ? maintenant : null,
    note: entree.note ?? null,
    cree: maintenant,
  };
  await ecrireSource(source);
  await journalAjouter({
    id: nouvelId('j'),
    le: maintenant,
    action: 'source',
    ressourceId: null,
    par,
    detail: `ajout ${source.nom} (${source.hote}) — ${source.statut}`,
  });
  return source;
}

/**
 * Crée les huit candidats béninois absents du catalogue, **au statut
 * `a-verifier`**. Idempotent : relancer ne crée pas de doublon.
 */
export async function semerCandidatsBenin(par: string): Promise<{ crees: SourceCatalogue[]; ignores: number }> {
  const existantes = await listerSources();
  const crees: SourceCatalogue[] = [];
  let ignores = 0;
  for (const candidat of CANDIDATS_BENIN) {
    if (existantes.some((s) => s.hote === candidat.hote)) {
      ignores++;
      continue;
    }
    const maintenant = new Date().toISOString();
    const source: SourceCatalogue = {
      ...candidat,
      statut: 'a-verifier',
      verifieLe: null,
      note: 'Candidat proposé : vérifier l’accessibilité et le caractère officiel avant activation.',
      cree: maintenant,
    };
    await ecrireSource(source);
    crees.push(source);
  }
  if (crees.length > 0) {
    await journalAjouter({
      id: nouvelId('j'),
      le: new Date().toISOString(),
      action: 'source',
      ressourceId: null,
      par,
      detail: `${crees.length} candidat(s) ajouté(s) au statut a-verifier`,
    });
  }
  return { crees, ignores };
}

export async function changerStatutSource(
  id: string,
  statut: SourceCatalogue['statut'],
  par: string,
): Promise<SourceCatalogue> {
  const source = await lireSource(id);
  if (!source) throw new ErreurSavoir('Source introuvable.', 'introuvable', 404);
  const maj: SourceCatalogue = {
    ...source,
    statut,
    verifieLe: statut === 'actif' ? new Date().toISOString() : source.verifieLe,
  };
  await ecrireSource(maj);
  await journalAjouter({
    id: nouvelId('j'),
    le: new Date().toISOString(),
    action: 'source',
    ressourceId: null,
    par,
    detail: `${source.nom} (${source.hote}) → ${statut}`,
  });
  return maj;
}

export async function retirerSource(id: string, par: string): Promise<void> {
  const source = await lireSource(id);
  if (!source) throw new ErreurSavoir('Source introuvable.', 'introuvable', 404);
  await supprimerSource(id);
  await journalAjouter({
    id: nouvelId('j'),
    le: new Date().toISOString(),
    action: 'source',
    ressourceId: null,
    par,
    detail: `retrait ${source.nom} (${source.hote})`,
  });
}

/** Hôtes actuellement autorisés à la collecte. */
export async function hotesAutorises(): Promise<string[]> {
  return (await listerSources()).filter((s) => s.statut === 'actif').map((s) => s.hote);
}
