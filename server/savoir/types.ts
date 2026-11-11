/**
 * Savoir local — modèle de données du référentiel documentaire.
 *
 * Un référentiel **par pays et par domaine**, pas un « mode Bénin » : les
 * mêmes structures servent au Bénin aujourd'hui et à un autre pays demain.
 *
 * Ce que ce module ne fait jamais : inventer une ressource, une date de
 * publication ou une validation institutionnelle. Une ressource importée
 * arrive au statut `a-verifier` ; seule une validation explicite (humaine,
 * via l'administration) la rend utilisable par le moteur conversationnel.
 */

export type DomaineId =
  | 'administration'
  | 'culture'
  | 'geographie'
  | 'education'
  | 'entrepreneuriat'
  | 'institutions'
  | 'statistiques'
  | 'numerique';

/** Niveau A = officiel, B = spécialisé, C = complémentaire (voir catalogue). */
export type NiveauAutorite = 'A' | 'B' | 'C';

export type StatutRessource = 'actif' | 'a-verifier' | 'expire' | 'archive';

export type TypeRessource = 'pdf' | 'web' | 'texte' | 'rapport' | 'publication';

export type LangueRessource = 'fr' | 'en' | 'autre';

export type Ressource = {
  id: string;
  titre: string;
  description: string;
  domaine: DomaineId;
  sousDomaine: string | null;
  /** ISO 3166-1 alpha-2 (« BJ »). Le référentiel accepte d'autres pays. */
  pays: string;
  organisme: string;
  url: string | null;
  type: TypeRessource;
  /** Date de publication déclarée — jamais devinée. */
  publication: string | null;
  /** Date de collecte effective (ISO). */
  collecte: string;
  /** Dernière vérification humaine (ISO) — null tant que personne n'a vérifié. */
  verification: string | null;
  niveau: NiveauAutorite;
  langue: LangueRessource;
  statut: StatutRessource;
  /** Nombre de caractères extraits (0 = extraction échouée ou vide). */
  caracteres: number;
  segments: number;
  prochaineRevision: string | null;
  note: string | null;
  /** Avertissements d'ingestion (texte partiel, PDF non extractible…). */
  avertissements: string[];
  cree: string;
  maj: string;
};

/** Un segment est l'unité réellement citée et indexée. */
export type Segment = {
  id: string;
  ressourceId: string;
  ordre: number;
  texte: string;
  /**
   * Vecteur quantifié (int8 → base64), présent uniquement si un encodeur
   * d'embeddings a été enregistré au démarrage (aucun ne l'est aujourd'hui).
   */
  vecteur?: string;
};

export type IndexRessource = {
  ressourceId: string;
  version: number;
  segments: Segment[];
  /** Dimension du vecteur et échelle de quantification, pour décoder. */
  vecteurDim?: number;
  vecteurEchelle?: number;
};

/** Entrée du catalogue de sources (autorisation a priori, jamais supposée). */
export type SourceCatalogue = {
  id: string;
  nom: string;
  organisme: string;
  /** Hôte autorisé pour l'ingestion par URL (sans schéma ni chemin). */
  hote: string;
  url: string;
  niveau: NiveauAutorite;
  domaines: DomaineId[];
  statut: 'actif' | 'a-verifier' | 'desactive';
  verifieLe: string | null;
  note: string | null;
  cree: string;
};

export type EtapeIngestion = {
  le: string;
  etape: 'collecte' | 'extraction' | 'nettoyage' | 'decoupage' | 'indexation' | 'fin';
  ok: boolean;
  detail: string;
};

export type JournalSavoir = {
  id: string;
  le: string;
  action: 'importer' | 'reindexer' | 'valider' | 'suspendre' | 'archiver' | 'supprimer' | 'source';
  ressourceId: string | null;
  par: string;
  detail: string;
};

/** Référence réellement transmise au modèle et donc citable. */
export type ReferenceUtilisee = {
  /** Étiquette de citation, ex. « S1 ». */
  etiquette: string;
  ressourceId: string;
  titre: string;
  organisme: string;
  domaine: DomaineId;
  niveau: NiveauAutorite;
  pays: string;
  url: string | null;
  publication: string | null;
  verification: string | null;
  /** « archive », « a-verifier », « ancienne »… signalé à l'utilisateur. */
  alertes: string[];
};

export const estUtilisable = (r: Ressource): boolean => r.statut === 'actif';
