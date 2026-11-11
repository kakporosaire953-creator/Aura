/**
 * Domaines du référentiel et politique de fraîcheur.
 *
 * La fraîcheur n'est pas la même pour une procédure administrative (qui
 * change) et pour un fait historique (qui ne change pas). Chaque domaine
 * déclare donc son seuil, en jours, au-delà duquel une ressource est
 * signalée « à vérifier » — signalée, jamais silencieusement écartée.
 */
import type { DomaineId } from './types.js';

export type Domaine = {
  id: DomaineId;
  libelle: { fr: string; en: string };
  /** Au-delà de ce nombre de jours sans vérification, la source est signalée. */
  fraicheurJours: number;
  /** Mots-clés servant à détecter le domaine d'une question. */
  motsCles: string[];
};

export const DOMAINES: Domaine[] = [
  {
    id: 'administration',
    libelle: { fr: 'Administration et citoyenneté', en: 'Administration and citizenship' },
    fraicheurJours: 180,
    motsCles: [
      'acte', 'naissance', 'mariage', 'décès', 'casier', 'certificat', 'légalisation',
      'passeport', 'carte', 'identité', 'résidence', 'domicile', 'apostille',
      'démarche', 'formalité', 'guichet', 'service-public', 'citoyen', 'administration',
      'impôt', 'taxe', 'permis', 'vignette', 'douane',
    ],
  },
  {
    id: 'culture',
    libelle: { fr: 'Culture et patrimoine', en: 'Culture and heritage' },
    fraicheurJours: 1825,
    motsCles: [
      'culture', 'patrimoine', 'histoire', 'historique', 'royaume', 'abomey', 'danxomè',
      'vodun', 'fête', 'musique', 'temple', 'palais', 'musée', 'tata', 'somba',
      'ouidah', 'ganvié', 'artisanat', 'masque', 'tradition', 'langue', 'fon', 'yoruba',
    ],
  },
  {
    id: 'geographie',
    libelle: { fr: 'Géographie et territoires', en: 'Geography and territories' },
    fraicheurJours: 1095,
    motsCles: [
      'commune', 'département', 'arrondissement', 'village', 'canton', 'région',
      'carte', 'frontière', 'fleuve', 'lagune', 'population', 'territoire', 'ville',
      'cotonou', 'porto-novo', 'parakou', 'abomey-calavi', 'natitingou', 'djougou',
      'bohicon', 'ouidah', 'kandi', 'malanville', 'lokossa', 'savalou', 'nikki',
      'atlantique', 'zou', 'collines', 'borgou', 'alibori', 'atacora', 'couffo', 'plateau', 'ouémé', 'mono',
    ],
  },
  {
    id: 'education',
    libelle: { fr: 'Éducation et formation', en: 'Education and training' },
    fraicheurJours: 365,
    motsCles: [
      'école', 'université', 'faculté', 'formation', 'diplôme', 'baccalauréat', 'bac',
      'concours', 'inscription', 'scolarité', 'bourse', 'établissement', 'collège',
      'lycée', 'master', 'licence', 'doctorat', 'unb', 'eneam', 'eneam', 'esgis',
      'uac', 'parcours', 'crédit', 'lmd', 'orientation',
    ],
  },
  {
    id: 'entrepreneuriat',
    libelle: { fr: 'Entrepreneuriat et économie', en: 'Entrepreneurship and economy' },
    fraicheurJours: 180,
    motsCles: [
      'entreprise', 'création', 'ifu', 'rccm', 'statut', 'sarl', 'sas', 'sae', 'gérant',
      'capital', 'greffe', 'immatriculation', 'business', 'startup', 'pme', 'artisan',
      'commerce', 'marché', 'prix', 'coût', 'tarif', 'financement', 'microfinance',
      'subvention', 'fiscalité', 'tva', 'dgi', 'investissement', 'export',
    ],
  },
  {
    id: 'institutions',
    libelle: { fr: 'Institutions et services publics', en: 'Institutions and public services' },
    fraicheurJours: 365,
    motsCles: [
      'institution', 'assemblée', 'gouvernement', 'ministère', 'ministre', 'présidence',
      'cour', 'conseil', 'constitution', 'loi', 'décret', 'arrêté', 'code', 'justice',
      'tribunal', 'anip', 'dgi', 'cnss', 'instad', 'sgg', 'journal officiel',
      'décentralisation', 'maire', 'préfet', 'préfecture', 'assemblée nationale',
    ],
  },
  {
    id: 'statistiques',
    libelle: { fr: 'Statistiques nationales', en: 'National statistics' },
    fraicheurJours: 400,
    motsCles: [
      'statistique', 'donnée', 'chiffre', 'recensement', 'croissance', 'pib', 'inflation',
      'taux', 'indice', 'population', 'emploi', 'chômage', 'pauvreté', 'ids', 'instad',
      'année', 'recensement', 'enquête', 'indicateur', 'ménage',
    ],
  },
  {
    id: 'numerique',
    libelle: { fr: 'Numérique et innovation', en: 'Digital and innovation' },
    fraicheurJours: 180,
    motsCles: [
      'numérique', 'digital', 'internet', 'télécom', 'mobile', 'fibre', 'startup',
      'innovation', 'technologie', 'données', 'cyber', 'e-gouvernement', 'plateforme',
      'application', 'logiciel', 'paiement', 'mobile money', 'fintech', 'incubateur',
      'hackathon', 'sobebra', 'bénin numérique',
    ],
  },
];

export const DOMAINE_PAR_ID = new Map<DomaineId, Domaine>(DOMAINES.map((d) => [d.id, d]));

export function domaineValide(valeur: unknown): DomaineId | null {
  return DOMAINES.some((d) => d.id === valeur) ? (valeur as DomaineId) : null;
}

/** Nombre de jours avant qu'une ressource soit considérée comme à revérifier. */
export function seuilFraicheur(domaine: DomaineId): number {
  return DOMAINE_PAR_ID.get(domaine)?.fraicheurJours ?? 365;
}

/**
 * Âge en jours d'une ressource : dernière vérification si elle existe,
 * sinon date de publication, sinon date de collecte.
 */
export function ageJours(
  r: {
    verification: string | null;
    publication: string | null;
    collecte: string;
  },
  maintenant: number = Date.now(),
): number {
  const reference = r.verification ?? r.publication ?? r.collecte;
  const t = Date.parse(reference);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((maintenant - t) / 86_400_000));
}

/** La ressource dépasse-t-elle la fenêtre de fraîcheur de son domaine ? */
export function estPerimee(
  r: Parameters<typeof ageJours>[0] & { domaine: DomaineId },
  maintenant: number = Date.now(),
): boolean {
  return ageJours(r, maintenant) > seuilFraicheur(r.domaine);
}
