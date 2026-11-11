/**
 * Décide **si** le référentiel doit être consulté.
 *
 * Le RAG ne se déclenche pas à chaque message : une question de conversation
 * ordinaire, une demande de rédaction, un calcul ou une traduction n'ont pas
 * besoin de documents. Ce détecteur est volontairement conservateur —
 * rater un déclenchement coûte moins cher qu'injecter des extraits hors
 * sujet dans une réponse créative.
 *
 * Règles : il faut (a) une intention informationnelle, (b) un ancrage
 * local/sectoriel (mot-clé de domaine ou mention d'un pays), et (c) aucune
 * intention incompatible (création, code, traduction, données personnelles).
 */
import { DOMAINES, DOMAINE_PAR_ID } from './domaines.js';
import type { DomaineId } from './types.js';
import { normaliser } from './texte.js';

export type DetectionSavoir = {
  declenche: boolean;
  domaines: DomaineId[];
  pays: string[];
  raisons: string[];
  /** Nombre de mots-clés de domaine reconnus. */
  indices: number;
};

const INTENTION = [
  'comment',
  'pourquoi',
  'quel',
  'quelle',
  'quels',
  'quelles',
  'quand',
  'combien',
  'qui',
  'ou ',
  'est-ce',
  'est ce',
  'puis-je',
  'peut-on',
  'peut on',
  'faut-il',
  'faut il',
  'dois-je',
  'doit-on',
  'c est quoi',
  'qu est-ce',
  'explique',
  'expliquer',
  'definition',
  'definis',
  'renseigne',
  'informe',
  'je veux savoir',
  'je voudrais savoir',
  'j ai besoin de savoir',
  'difference entre',
  'parle-moi',
  'parle moi',
  'dis-moi',
  'dis moi',
  'presente-moi',
  'presente moi',
  'informations sur',
  'info sur',
  'conditions',
  'procedure',
  'demarche',
  'etapes',
  'how',
  'what',
  'why',
  'when',
  'where',
  'which',
];

const EXCLUSIONS: { motif: RegExp; raison: string }[] = [
  { motif: /\b(ecris|ecrire|redige|rediger|compose|poeme|chanson|histoire|scenario|slogan|blague)\b/, raison: 'demande de création' },
  { motif: /\b(code|fonction|algorithme|bug|javascript|python|typescript|sql|api|docker|git)\b/, raison: 'demande technique' },
  { motif: /\b(traduis|traduire|translation|translate)\b/, raison: 'traduction' },
  { motif: /\b(resume|resumer|corrige|corriger|reformule|ameliorer ce texte)\b/, raison: 'réécriture de texte fourni' },
  { motif: /\b(mon|ma|mes|notre|nos)\s+(compte|conversation|projet|document|message|historique|abonnement)\b/, raison: 'question sur les données de l’utilisateur' },
  { motif: /\b(bonjour|salut|bonsoir|merci|ca va|coucou|hello|hi)\b/, raison: 'salutation' },
  { motif: /\b(qui es-tu|qui es tu|tu es qui|ton nom|presente-toi)\b/, raison: 'question sur l’assistant' },
];

/** Indices géographiques : élargissent la recherche, ne la déclenchent pas seuls. */
const MARQUEURS_PAYS: { motif: RegExp; pays: string }[] = [
  { motif: /\b(benin|beninois|beninoise|cotonou|porto-novo|porto novo|abomey|parakou|ouidah|ganvie|natitingou|djougou|bohicon|kandi|malanville|lokossa|nikki|savalou|abomey-calavi)\b/, pays: 'BJ' },
  { motif: /\b(togo|togolais|lome)\b/, pays: 'TG' },
  { motif: /\b(cote d ivoire|ivoirien|abidjan|yamoussoukro)\b/, pays: 'CI' },
  { motif: /\b(senegal|senegalais|dakar)\b/, pays: 'SN' },
  { motif: /\b(niger|nigerien|niamey)\b/, pays: 'NE' },
  { motif: /\b(burkina|burkinabe|ouagadougou)\b/, pays: 'BF' },
  { motif: /\b(nigeria|nigerian|lagos|abuja)\b/, pays: 'NG' },
  { motif: /\b(ghana|ghaneen|accra)\b/, pays: 'GH' },
  { motif: /\b(cameroun|camerounais|yaounde|douala)\b/, pays: 'CM' },
];

export function detecter(question: string): DetectionSavoir {
  const q = normaliser(question);
  const raisons: string[] = [];

  if (q.length < 8) {
    return { declenche: false, domaines: [], pays: [], raisons: ['message trop court'], indices: 0 };
  }

  for (const exclusion of EXCLUSIONS) {
    if (exclusion.motif.test(q)) {
      return { declenche: false, domaines: [], pays: [], raisons: [exclusion.raison], indices: 0 };
    }
  }

  const interrogatif = q.includes('?') || INTENTION.some((m) => q.includes(m));
  if (!interrogatif) {
    return { declenche: false, domaines: [], pays: [], raisons: ['pas d’intention informationnelle'], indices: 0 };
  }
  raisons.push('intention informationnelle');

  const domaines: DomaineId[] = [];
  let indices = 0;
  for (const domaine of DOMAINES) {
    const trouves = domaine.motsCles.filter((mot) => {
      const m = normaliser(mot);
      // Mot entier (ou locution), pluriel toléré (« départements »), pour
      // éviter « bac » dans « bac à sable ».
      return new RegExp(
        `(^|[^a-z0-9])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es)?([^a-z0-9]|$)`,
      ).test(q);
    });
    if (trouves.length > 0) {
      domaines.push(domaine.id);
      indices += trouves.length;
    }
  }

  const pays = new Set<string>();
  for (const marqueur of MARQUEURS_PAYS) {
    if (marqueur.motif.test(q)) pays.add(marqueur.pays);
  }
  if (pays.size > 0) raisons.push('ancrage géographique');
  if (domaines.length > 0) raisons.push(`domaine(s) : ${domaines.map((d) => DOMAINE_PAR_ID.get(d)?.libelle.fr ?? d).join(', ')}`);

  // Un mot-clé de domaine suffit s'il y a une intention ; une mention de pays
  // seule ne suffit pas (ex. « raconte-moi un souvenir du Bénin »).
  const declenche = indices >= 1 && (domaines.length > 0 || pays.size > 0);

  return {
    declenche,
    domaines,
    pays: [...pays],
    raisons: declenche ? raisons : [...raisons, 'aucun ancrage documentaire'],
    indices,
  };
}
