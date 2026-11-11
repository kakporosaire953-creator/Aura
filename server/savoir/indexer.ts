/**
 * Pipeline d'ingestion documentaire.
 *
 * collecte → extraction → nettoyage → découpage → indexation → journal.
 * Chaque étape est journalisée avec son résultat, y compris les échecs :
 * une ressource dont l'extraction a échoué n'est **jamais** enregistrée
 * comme si elle contenait du texte.
 *
 * Une ressource importée arrive au statut `a-verifier`. Seule une action
 * d'administration explicite (`validerRessource`) la rend utilisable par le
 * moteur conversationnel.
 */
import { nouvelId } from '../db/entrepots.js';
import { seuilFraicheur } from './domaines.js';
import { encodeurDisponible, plonger } from './plongement.js';
import type { Encodeur } from './plongement.js';
import { ErreurCollecte, telecharger } from './securite.js';
import {
  ecrireContenu,
  ecrireIndex,
  ecrireRessource,
  journalAjouter,
  lireContenu,
  lireRessource,
  listerSources,
  supprimerRessource,
} from './stockage.js';
import { ErreurSavoir } from './stockage.js';
import { decouper, nettoyer, texteDeHtml, texteDePdf, titreDeHtml } from './texte.js';
import type {
  DomaineId,
  EtapeIngestion,
  LangueRessource,
  NiveauAutorite,
  Ressource,
  Segment,
  TypeRessource,
} from './types.js';
import { quantifier } from './vecteurs.js';

export type DemandeIngestion = {
  /** URL à collecter — l'hôte doit figurer dans le catalogue actif. */
  url?: string;
  /** Texte fourni par l'administrateur (copier-coller, publication officielle). */
  texte?: string;
  titre?: string;
  description?: string;
  domaine: DomaineId;
  pays?: string;
  organisme?: string;
  niveau: NiveauAutorite;
  type?: TypeRessource;
  langue?: LangueRessource;
  sousDomaine?: string | null;
  publication?: string | null;
  /** Identifiant de l'administrateur qui importe (journal). */
  par: string;
  fetchImpl?: typeof fetch;
  resoudre?: (hote: string) => Promise<string[]>;
  encodeur?: Encodeur | null;
};

export type ResultatIngestion = {
  ok: boolean;
  ressource: Ressource | null;
  etapes: EtapeIngestion[];
  erreur: string | null;
};

const TEXTE_MINIMUM = 200;

function etape(
  etapes: EtapeIngestion[],
  nom: EtapeIngestion['etape'],
  ok: boolean,
  detail: string,
): void {
  etapes.push({ le: new Date().toISOString(), etape: nom, ok, detail });
}

/** Hôtes autorisés = sources actives du catalogue. */
async function hotesActifs(): Promise<string[]> {
  const sources = await listerSources();
  return sources.filter((s) => s.statut === 'actif').map((s) => s.hote);
}

async function collecter(demande: DemandeIngestion, etapes: EtapeIngestion[]): Promise<{
  texte: string;
  titre: string | null;
  urlFinale: string | null;
  type: TypeRessource;
  avertissements: string[];
}> {
  if (demande.texte && demande.texte.trim().length > 0) {
    etape(etapes, 'collecte', true, 'texte fourni par l’administrateur');
    return {
      texte: demande.texte,
      titre: demande.titre ?? null,
      urlFinale: null,
      type: demande.type ?? 'texte',
      avertissements: [],
    };
  }
  if (!demande.url) {
    throw new ErreurSavoir('Indiquez une URL à collecter ou un texte à indexer.', 'source-absente');
  }

  const hotes = await hotesActifs();
  if (hotes.length === 0) {
    throw new ErreurSavoir(
      'Aucune source active dans le catalogue : ajoutez d’abord le domaine officiel, puis relancez.',
      'catalogue-vide',
    );
  }
  const telecharge = await telecharger(demande.url, { hotes, fetchImpl: demande.fetchImpl, resoudre: demande.resoudre });
  etape(
    etapes,
    'collecte',
    true,
    `${telecharge.donnees.length} octets — ${telecharge.typeContenu}${telecharge.redirections ? ` (${telecharge.redirections} redirection(s) contrôlée(s))` : ''}`,
  );

  const avertissements: string[] = [];
  let texte: string;
  let titre: string | null = null;
  let type: TypeRessource;

  if (telecharge.typeContenu === 'application/pdf') {
    const pdf = texteDePdf(telecharge.donnees);
    texte = pdf.texte;
    titre = demande.titre ?? null;
    type = 'pdf';
    avertissements.push(...pdf.avertissements);
    etape(
      etapes,
      'extraction',
      texte.length > 0,
      texte.length > 0 ? `${texte.length} caractères extraits du PDF` : 'aucun texte extractible',
    );
  } else if (telecharge.typeContenu.startsWith('text/html')) {
    const html = telecharge.donnees.toString('utf8');
    texte = texteDeHtml(html);
    titre = demande.titre ?? titreDeHtml(html) ?? null;
    type = 'web';
    etape(etapes, 'extraction', texte.length > 0, `${texte.length} caractères extraits du HTML`);
  } else {
    texte = nettoyer(telecharge.donnees.toString('utf8'));
    titre = demande.titre ?? null;
    type = telecharge.typeContenu === 'text/markdown' ? 'publication' : 'texte';
    etape(etapes, 'extraction', true, `${texte.length} caractères de texte brut`);
  }

  return { texte, titre, urlFinale: telecharge.urlFinale, type, avertissements };
}

function construireRessource(
  demande: DemandeIngestion,
  champs: {
    titre: string | null;
    url: string | null;
    texte: string;
    type: TypeRessource;
    avertissements: string[];
    segments: number;
  },
): Ressource {
  const maintenant = new Date().toISOString();
  const collecte = maintenant;
  const jours = seuilFraicheur(demande.domaine);
  return {
    id: nouvelId('sav'),
    titre: (champs.titre ?? demande.titre ?? 'Document sans titre').slice(0, 300),
    description: (demande.description ?? '').slice(0, 800),
    domaine: demande.domaine,
    sousDomaine: demande.sousDomaine ?? null,
    pays: (demande.pays ?? 'BJ').toUpperCase().slice(0, 2),
    organisme: demande.organisme ?? 'Organisme non précisé',
    url: champs.url,
    type: champs.type,
    publication: demande.publication ?? null,
    collecte,
    verification: null,
    niveau: demande.niveau,
    langue: demande.langue ?? 'fr',
    statut: 'a-verifier',
    caracteres: champs.texte.length,
    segments: champs.segments,
    prochaineRevision: new Date(Date.now() + jours * 86_400_000).toISOString(),
    note: null,
    avertissements: champs.avertissements,
    cree: maintenant,
    maj: maintenant,
  };
}

/** Ingère une source et enregistre le résultat. Ne lève pas : renvoie `ok: false`. */
export async function ingerer(demande: DemandeIngestion): Promise<ResultatIngestion> {
  const etapes: EtapeIngestion[] = [];
  try {
    const collecte = await collecter(demande, etapes);

    const texte = nettoyer(collecte.texte);
    etape(etapes, 'nettoyage', true, `${texte.length} caractères après nettoyage`);
    if (texte.length < TEXTE_MINIMUM) {
      etape(etapes, 'nettoyage', false, `texte insuffisant (${texte.length} < ${TEXTE_MINIMUM})`);
      throw new ErreurSavoir(
        'Le document ne contient pas assez de texte exploitable (moins de 200 caractères). ' +
          'Pour un PDF scanné, aucune extraction n’est possible sans OCR : saisissez le texte manuellement.',
        'texte-insuffisant',
      );
    }

    const decoupe = decouper(texte);
    if (decoupe.segments.length === 0) {
      throw new ErreurSavoir('Le découpage n’a produit aucun segment.', 'decoupage-vide');
    }
    etape(etapes, 'decoupage', true, `${decoupe.segments.length} segment(s)`);

    const encodeur = demande.encodeur === undefined ? encodeurDisponible() : demande.encodeur;
    const index: Segment[] = decoupe.segments.map((t, i) => ({
      id: `seg-${i + 1}`,
      ressourceId: '',
      ordre: i,
      texte: t,
    }));
    let vecteurDim: number | undefined;
    let vecteurEchelle: number | undefined;
    if (encodeur) {
      const vecteurs = await plonger(decoupe.segments, encodeur);
      if (vecteurs) {
        vecteurDim = vecteurs[0]?.length;
        const quantifies = vecteurs.map((v) => quantifier(v));
        vecteurEchelle = quantifies[0]?.echelle;
        quantifies.forEach((q, i) => {
          index[i].vecteur = q.base64;
        });
      }
    }
    etape(
      etapes,
      'indexation',
      true,
      encodeur
        ? `vecteurs ${vecteurDim ?? 0} dimensions + index lexical`
        : 'index lexical (aucun fournisseur d’embeddings configuré)',
    );

    const ressource = construireRessource(demande, {
      titre: collecte.titre,
      url: collecte.urlFinale,
      texte,
      type: collecte.type,
      avertissements: [...collecte.avertissements, ...decoupe.avertissements],
      segments: index.length,
    });
    for (const segment of index) segment.ressourceId = ressource.id;

    await ecrireContenu(ressource.id, texte);
    await ecrireIndex({ ressourceId: ressource.id, version: 1, segments: index, vecteurDim, vecteurEchelle });
    await ecrireRessource(ressource);
    await journalAjouter({
      id: nouvelId('j'),
      le: ressource.cree,
      action: 'importer',
      ressourceId: ressource.id,
      par: demande.par,
      detail: `${ressource.titre} — ${ressource.segments} segments, statut a-verifier`,
    });
    etape(etapes, 'fin', true, 'ressource enregistrée au statut « à vérifier »');

    return { ok: true, ressource, etapes, erreur: null };
  } catch (e) {
    const message =
      e instanceof ErreurSavoir || e instanceof ErreurCollecte
        ? e.message
        : e instanceof Error
          ? `Échec inattendu : ${e.message}`
          : 'Échec inattendu.';
    etape(etapes, 'fin', false, message);
    return { ok: false, ressource: null, etapes, erreur: message };
  }
}

/**
 * Reconstruit l'index d'une ressource existante (après changement d'encodeur
 * ou correction du découpage), sans recollecter l'URL.
 */
export async function reindexer(
  id: string,
  par: string,
  opts: { encodeur?: Encodeur | null } = {},
): Promise<ResultatIngestion> {
  const etapes: EtapeIngestion[] = [];
  const ressource = await lireRessource(id);
  if (!ressource) {
    return { ok: false, ressource: null, etapes, erreur: 'Ressource introuvable.' };
  }
  const contenu = await lireContenu(id);
  if (!contenu) {
    return { ok: false, ressource, etapes, erreur: 'Contenu introuvable : réimporter le document.' };
  }
  const decoupe = decouper(contenu);
  etape(etapes, 'decoupage', true, `${decoupe.segments.length} segment(s)`);

  const encodeur = opts.encodeur === undefined ? encodeurDisponible() : opts.encodeur;
  const segments: Segment[] = decoupe.segments.map((t, i) => ({
    id: `seg-${i + 1}`,
    ressourceId: id,
    ordre: i,
    texte: t,
  }));
  let vecteurDim: number | undefined;
  let vecteurEchelle: number | undefined;
  if (encodeur) {
    const vecteurs = await plonger(decoupe.segments, encodeur);
    if (vecteurs) {
      vecteurDim = vecteurs[0]?.length;
      const quantifies = vecteurs.map((v) => quantifier(v));
      vecteurEchelle = quantifies[0]?.echelle;
      quantifies.forEach((q, i) => {
        segments[i].vecteur = q.base64;
      });
    }
  }
  await ecrireIndex({ ressourceId: id, version: 2, segments, vecteurDim, vecteurEchelle });
  const maj = { ...ressource, segments: segments.length, maj: new Date().toISOString() };
  await ecrireRessource(maj);
  await journalAjouter({
    id: nouvelId('j'),
    le: maj.maj,
    action: 'reindexer',
    ressourceId: id,
    par,
    detail: `${segments.length} segment(s)`,
  });
  etape(etapes, 'indexation', true, `${segments.length} segment(s) réindexés`);
  return { ok: true, ressource: maj, etapes, erreur: null };
}

/** Change le statut d'une ressource (validation humaine, archivage). */
export async function changerStatut(
  id: string,
  statut: Ressource['statut'],
  par: string,
  detail = '',
): Promise<Ressource> {
  const ressource = await lireRessource(id);
  if (!ressource) throw new ErreurSavoir('Ressource introuvable.', 'introuvable', 404);
  const maintenant = new Date().toISOString();
  const maj: Ressource = {
    ...ressource,
    statut,
    verification: statut === 'actif' ? maintenant : ressource.verification,
    prochaineRevision:
      statut === 'actif'
        ? new Date(Date.now() + seuilFraicheur(ressource.domaine) * 86_400_000).toISOString()
        : ressource.prochaineRevision,
    maj: maintenant,
  };
  await ecrireRessource(maj);
  await journalAjouter({
    id: nouvelId('j'),
    le: maintenant,
    action: statut === 'actif' ? 'valider' : statut === 'archive' ? 'archiver' : 'suspendre',
    ressourceId: id,
    par,
    detail: detail || `statut → ${statut}`,
  });
  return maj;
}

export async function supprimer(id: string, par: string): Promise<void> {
  const ressource = await lireRessource(id);
  if (!ressource) throw new ErreurSavoir('Ressource introuvable.', 'introuvable', 404);
  await supprimerRessource(id);
  await journalAjouter({
    id: nouvelId('j'),
    le: new Date().toISOString(),
    action: 'supprimer',
    ressourceId: id,
    par,
    detail: ressource.titre,
  });
}
