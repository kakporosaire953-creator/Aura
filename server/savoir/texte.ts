/**
 * Extraction, nettoyage et découpage — aucun service externe.
 *
 * HTML : retrait des scripts/styles puis conversion des blocs en paragraphes.
 * PDF  : extraction des flux texte compressés (FlateDecode), sans dépendance.
 *        C'est volontairement limité et **annoncé** : un PDF scanné ou
 *        encodé en CID ne donne aucun texte, et la ressource est alors
 *        marquée avec un avertissement plutôt que d'inventer un contenu.
 */
import { inflateSync } from 'node:zlib';

/* ───────────────────────── HTML ───────────────────────── */

const ENTITES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ecirc: 'ê',
  ocirc: 'ô',
  icirc: 'î',
  ucirc: 'û',
  uuml: 'ü',
  ouml: 'ö',
  auml: 'ä',
  laquo: '«',
  raquo: '»',
  deg: '°',
  euro: '€',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
};

export function decoderEntites(texte: string): string {
  return texte.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (tout, code: string) => {
    if (code.startsWith('#')) {
      const numero = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(numero) && numero > 0 && numero < 0x110000 ? String.fromCodePoint(numero) : tout;
    }
    return ENTITES[code.toLowerCase()] ?? tout;
  });
}

export function titreDeHtml(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return null;
  const titre = decoderEntites(m[1]).replace(/\s+/g, ' ').trim();
  return titre.length ? titre.slice(0, 300) : null;
}

export function texteDeHtml(html: string): string {
  let t = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ');
  // Frontières de blocs : paragraphes, titres, listes, cellules.
  t = t
    .replace(/<\/(p|div|section|article|header|footer|li|tr|h[1-6]|blockquote|pre|table|ul|ol)>/gi, '\n\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ');
  return nettoyer(decoderEntites(t));
}

/* ───────────────────────── Nettoyage ───────────────────────── */

export function nettoyer(texte: string): string {
  return texte
    // Caractères de contrôle hors saut de ligne/onglet.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\u00a0/g, ' ')
    // Espaces horizontaux multiples.
    .replace(/[ \t\f\v]+/g, ' ')
    // Plus de deux sauts de ligne consécutifs.
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ───────────────────────── PDF ───────────────────────── */

function decoderChainePdf(brut: string): string {
  let sortie = '';
  for (let i = 0; i < brut.length; i++) {
    const c = brut[i];
    if (c !== '\\') {
      sortie += c;
      continue;
    }
    const suivant = brut[++i];
    if (suivant === undefined) break;
    if (suivant === 'n') sortie += '\n';
    else if (suivant === 'r') sortie += '\r';
    else if (suivant === 't') sortie += '\t';
    else if (suivant === 'b' || suivant === 'f') sortie += ' ';
    else if (suivant >= '0' && suivant <= '7') {
      let octal = suivant;
      while (octal.length < 3 && brut[i + 1] >= '0' && brut[i + 1] <= '7') octal += brut[++i];
      sortie += String.fromCharCode(parseInt(octal, 8));
    } else if (suivant === '\n') {
      /* continuation de ligne : rien */
    } else sortie += suivant;
  }
  return sortie;
}

function decoderChaineHex(brut: string): string {
  const propre = brut.replace(/[^0-9a-f]/gi, '');
  const octets: number[] = [];
  for (let i = 0; i + 1 < propre.length; i += 2) octets.push(parseInt(propre.slice(i, i + 2), 16));
  if (octets.length >= 2 && octets[0] === 0xfe && octets[1] === 0xff) {
    let s = '';
    for (let i = 2; i + 1 < octets.length; i += 2) s += String.fromCharCode((octets[i] << 8) | octets[i + 1]);
    return s;
  }
  return Buffer.from(octets).toString('latin1');
}

/** Extrait le texte des opérateurs Tj / TJ / ' / " d'un flux décodé. */
function texteDeFlux(flux: string): string {
  const morceaux: string[] = [];
  const motif = /\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]+>|\bT[dD]\b|\bT\*|\bTj\b|\bTJ\b|\b'\b|"/g;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(flux)) !== null) {
    const jeton = m[0];
    if (jeton.startsWith('(')) {
      morceaux.push(decoderChainePdf(jeton.slice(1, -1)));
    } else if (jeton.startsWith('<')) {
      morceaux.push(decoderChaineHex(jeton.slice(1, -1)));
    } else if (jeton === 'Td' || jeton === 'TD' || jeton === 'T*') {
      morceaux.push('\n');
    } else if (jeton === 'TJ' || jeton === 'Tj' || jeton === "'" || jeton === '"') {
      morceaux.push(' ');
    }
  }
  return morceaux.join('');
}

export type ResultatPdf = { texte: string; avertissements: string[] };

export function texteDePdf(donnees: Buffer): ResultatPdf {
  const avertissements: string[] = [];
  const brut = donnees.toString('latin1');
  const morceaux: string[] = [];

  const motifFlux = /stream\r?\n?([\s\S]*?)endstream/g;
  let m: RegExpExecArray | null;
  let fluxTotal = 0;
  while ((m = motifFlux.exec(brut)) !== null) {
    fluxTotal++;
    const contenu = m[1];
    let decode = contenu;
    // Les flux compressés commencent par 0x78 (en-tête zlib).
    const debut = Buffer.from(contenu.slice(0, 2), 'latin1');
    if (debut.length === 2 && debut[0] === 0x78) {
      try {
        decode = inflateSync(Buffer.from(contenu, 'latin1')).toString('latin1');
      } catch {
        continue; // flux illisible : ignoré, signalé plus bas
      }
    }
    if (!/BT|Tj|TJ/.test(decode)) continue;
    const texte = texteDeFlux(decode);
    if (texte.trim()) morceaux.push(texte);
  }

  const texte = nettoyer(morceaux.join('\n'));
  if (fluxTotal === 0) {
    avertissements.push("Aucun flux de texte trouvé : ce PDF n'a pas de texte extractible.");
  } else if (texte.length < 200) {
    avertissements.push(
      'Extraction PDF très partielle : document scanné, protégé ou encodé en CID. Le texte visible n’est pas exploitable en l’état.',
    );
  }
  return { texte, avertissements };
}

/* ───────────────────────── Découpage ───────────────────────── */

export type Decoupage = { segments: string[]; avertissements: string[] };

export function decouper(
  texte: string,
  opts: { maxCaracteres?: number; chevauchement?: number; maxSegments?: number } = {},
): Decoupage {
  const max = opts.maxCaracteres ?? 1200;
  const chevauchement = Math.min(opts.chevauchement ?? 180, Math.floor(max / 4));
  const maxSegments = opts.maxSegments ?? 400;

  const paragraphes = texte
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);

  const segments: string[] = [];
  let courant = '';

  const pousser = () => {
    if (courant.trim()) segments.push(courant.trim());
    courant = '';
  };

  for (const paragraphe of paragraphes) {
    if (paragraphe.length > max) {
      // Long paragraphe : coupe aux phrases, puis brut si nécessaire.
      pousser();
      const phrases = paragraphe.split(/(?<=[.!?…])\s+/);
      for (const phrase of phrases) {
        if (phrase.length > max) {
          for (let i = 0; i < phrase.length; i += max) segments.push(phrase.slice(i, i + max));
          continue;
        }
        if ((courant + ' ' + phrase).trim().length > max) pousser();
        courant = courant ? `${courant} ${phrase}` : phrase;
      }
      pousser();
      continue;
    }
    if ((courant + '\n\n' + paragraphe).trim().length > max) {
      pousser();
      // Le chevauchement est appliqué après coup, sur le segment précédent.
      courant = paragraphe;
    } else {
      courant = courant ? `${courant}\n\n${paragraphe}` : paragraphe;
    }
  }
  pousser();

  // Chevauchement : on préfixe chaque segment du talon du précédent.
  const avecChevauchement: string[] = [];
  for (const [i, segment] of segments.entries()) {
    if (i === 0 || chevauchement === 0) {
      avecChevauchement.push(segment);
      continue;
    }
    const precedent = segments[i - 1];
    const talon = precedent.slice(-chevauchement);
    avecChevauchement.push(`${talon} ${segment}`.trim());
  }

  const avertissements: string[] = [];
  let retenus = avecChevauchement;
  if (avecChevauchement.length > maxSegments) {
    retenus = avecChevauchement.slice(0, maxSegments);
    avertissements.push(
      `Document tronqué à ${maxSegments} segments : le reste n’est pas indexé (découper la ressource).`,
    );
  }
  return { segments: retenus, avertissements };
}

/* ───────────────────────── Analyse lexicale ───────────────────────── */

const MOTS_VIDES = new Set(
  (
    'le la les un une des du de d au aux et ou mais donc or ni car que qui quoi dont ou ' +
    'a à en dans par pour sur sous avec sans chez vers entre est sont etre être ete été ' +
    'ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs ' +
    'je tu il elle on nous vous ils elles se s y ne pas plus moins tres très tout tous ' +
    'comme si lors aussi autre autres quel quelle quels quelles the a an of to in on for ' +
    'and or is are be been with without from by at as it this that these those'
  ).split(/\s+/),
);

/** Minuscules, sans accents, tokens de 2 lettres et plus. */
export function mots(texte: string): string[] {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/[\s'-]+/)
    .map((m) => m.trim())
    .filter((m) => m.length >= 2 && !MOTS_VIDES.has(m));
}

/** Forme normalisée d'un mot, pour comparer des tokens sans accents. */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
