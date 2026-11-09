/**
 * Export PDF d'une création — sans dépendance.
 *
 * On écrit un PDF 1.4 simple mais complet : polices standard (Helvetica,
 * Helvetica-Bold, Courier), mise en page A4, titres hiérarchisés, listes,
 * citations et blocs de code, pagination avec pied de page. Les accents
 * passent par l'encodage WinAnsi (CP1252), celui que comprennent les polices
 * standard — pas de fichier de police à embarquer, donc pas de poids ajouté
 * à la fonction serverless.
 *
 * Limite assumée : pas d'italique (les polices standard n'en fournissent pas
 * sans fichier externe) ; les citations sont donc rendues en gris.
 */
import type { Bloc, DocumentLisible } from './blocs.js';

/* ── Format A4 et marges ── */

const LARGEUR_PAGE = 595.28;
const HAUTEUR_PAGE = 841.89;
const MARGE = 56.69; // 2 cm
const LARGEUR_UTILE = LARGEUR_PAGE - 2 * MARGE;
const HAUT = HAUTEUR_PAGE - MARGE;
const BAS = MARGE;

/* ── Encodage WinAnsi (CP1252) ── */

const CP1252: Record<string, number> = {
  '\u20ac': 0x80,
  '\u201a': 0x82,
  '\u0192': 0x83,
  '\u201e': 0x84,
  '\u2026': 0x85,
  '\u2020': 0x86,
  '\u2021': 0x87,
  '\u02c6': 0x88,
  '\u2030': 0x89,
  '\u0160': 0x8a,
  '\u2039': 0x8b,
  '\u0152': 0x8c,
  '\u017d': 0x8e,
  '\u2018': 0x91,
  '\u2019': 0x92,
  '\u201c': 0x93,
  '\u201d': 0x94,
  '\u2022': 0x95,
  '\u2013': 0x96,
  '\u2014': 0x97,
  '\u02dc': 0x98,
  '\u2122': 0x99,
  '\u0161': 0x9a,
  '\u203a': 0x9b,
  '\u0153': 0x9c,
  '\u017e': 0x9e,
  '\u0178': 0x9f,
};

/** Caractère → octet WinAnsi (0x3f « ? » si le caractère n'existe pas). */
export function versWinAnsi(texte: string): string {
  let sortie = '';
  for (const caractere of texte) {
    const code = caractere.codePointAt(0) ?? 0x3f;
    if (code <= 0xff) {
      sortie += caractere;
      continue;
    }
    const remplace = CP1252[caractere];
    sortie += remplace !== undefined ? String.fromCharCode(remplace) : '?';
  }
  return sortie;
}

/** Échappement d'une chaîne PDF : parenthèses, barre oblique, octets non ASCII. */
export function chainePdf(texte: string): string {
  let sortie = '';
  for (const caractere of versWinAnsi(texte)) {
    const code = caractere.charCodeAt(0);
    if (caractere === '(' || caractere === ')' || caractere === '\\') {
      sortie += '\\' + caractere;
    } else if (code < 32 || code > 126) {
      sortie += '\\' + code.toString(8).padStart(3, '0');
    } else {
      sortie += caractere;
    }
  }
  return sortie;
}

/* ── Largeurs Helvetica (unités /1000), assez justes pour couper les lignes ── */

const LARGEURS_HELVETICA: number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // 32-47
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, // 48-57
  278, 278, 584, 584, 584, 556, 1015, // 58-64
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, // 65-77
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, // 78-90
  278, 278, 278, 469, 556, 333, // 91-96
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, // 97-109
  556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, // 110-122
  334, 260, 334, 584, // 123-126
];

/** Largeur approchée d'un caractère accentué (on retire le diacritique). */
function baseLargeur(caractere: string): number {
  const decompose = caractere.normalize('NFD')[0] ?? caractere;
  const code = decompose.charCodeAt(0);
  if (code >= 32 && code <= 126) return LARGEURS_HELVETICA[code - 32];
  if (caractere === '\u2014' || caractere === '\u2026') return 1000;
  if (caractere === '\u2013' || caractere === '\u00ab' || caractere === '\u00bb') return 556;
  if (caractere === '\u2022') return 350;
  return 556;
}

export type Police = 'F1' | 'F2' | 'F3';

export function largeurTexte(texte: string, taille: number, police: Police = 'F1'): number {
  let total = 0;
  for (const caractere of texte) {
    if (police === 'F3') {
      total += 600;
      continue;
    }
    const l = baseLargeur(caractere);
    total += police === 'F2' ? l * 1.06 : l;
  }
  return (total / 1000) * taille;
}

/** Coupe un texte en lignes qui tiennent dans `largeur`. */
export function couperEnLignes(
  texte: string,
  largeur: number,
  taille: number,
  police: Police = 'F1',
): string[] {
  const lignes: string[] = [];
  for (const paragraphe of texte.split('\n')) {
    if (!paragraphe) {
      lignes.push('');
      continue;
    }
    let courante = '';
    for (const mot of paragraphe.split(/\s+/).filter(Boolean)) {
      const essai = courante ? `${courante} ${mot}` : mot;
      if (largeurTexte(essai, taille, police) <= largeur) {
        courante = essai;
        continue;
      }
      if (courante) {
        lignes.push(courante);
        courante = '';
      }
      // Mot plus long que la ligne : on le coupe caractère par caractère.
      if (largeurTexte(mot, taille, police) <= largeur) {
        courante = mot;
        continue;
      }
      let morceau = '';
      for (const caractere of mot) {
        if (largeurTexte(morceau + caractere, taille, police) > largeur && morceau) {
          lignes.push(morceau);
          morceau = '';
        }
        morceau += caractere;
      }
      courante = morceau;
    }
    lignes.push(courante);
  }
  return lignes;
}

/* ── Mise en page ── */

type Element =
  | {
      texte: string;
      police: Police;
      taille: number;
      retrait: number;
      avant: number;
      gris?: boolean;
      monospace?: boolean;
    }
  | { regle: true; avant: number };

const GRIS = '0.42 0.42 0.42 rg';
const NOIR = '0.11 0.11 0.11 rg';

function elementsDepuis(doc: DocumentLisible): Element[] {
  const elements: Element[] = [];
  const pousserTexte = (
    texte: string,
    police: Police,
    taille: number,
    retrait: number,
    avant: number,
    gris?: boolean,
    monospace?: boolean,
  ) => {
    for (const ligne of couperEnLignes(texte, LARGEUR_UTILE - retrait, taille, police)) {
      elements.push({ texte: ligne, police, taille, retrait, avant, gris, monospace });
    }
  };

  for (const ligne of couperEnLignes(doc.titre, LARGEUR_UTILE, 19, 'F2')) {
    elements.push({ texte: ligne, police: 'F2', taille: 19, retrait: 0, avant: 0 });
  }
  pousserTexte(doc.sousTitre, 'F1', 9.5, 0, 6, true);
  elements.push({ regle: true, avant: 10 });

  const rendre = (bloc: Bloc) => {
    switch (bloc.type) {
      case 'titre':
        pousserTexte(
          bloc.texte,
          'F2',
          bloc.niveau === 1 ? 15 : bloc.niveau === 2 ? 13 : 11.5,
          0,
          bloc.niveau === 1 ? 18 : 14,
        );
        break;
      case 'paragraphe':
        pousserTexte(bloc.texte, 'F1', 10.5, 0, 7);
        break;
      case 'puce':
        pousserTexte(`\u2022  ${bloc.texte}`, 'F1', 10.5, 14, 4);
        break;
      case 'numerote':
        pousserTexte(bloc.texte, 'F1', 10.5, 14, 4);
        break;
      case 'citation':
        pousserTexte(bloc.texte, 'F1', 10.5, 18, 8, true);
        break;
      case 'code': {
        const lignes = bloc.texte.split('\n');
        lignes.forEach((ligne, index) => {
          pousserTexte(
            ligne.length ? ligne : ' ',
            'F3',
            8.6,
            12,
            index === 0 ? 8 : 0,
            false,
            true,
          );
        });
        // Un peu d'air après le bloc de code.
        elements.push({ texte: '', police: 'F1', taille: 5, retrait: 0, avant: 4 });
        break;
      }
      case 'espace':
        elements.push({ texte: '', police: 'F1', taille: 6, retrait: 0, avant: 6 });
        break;
      default:
        break;
    }
  };

  doc.blocs.forEach(rendre);
  return elements;
}

function dessinerTexte(texte: string, taille: number, police: Police, x: number, y: number, gris?: boolean): string {
  return `BT ${gris ? GRIS : NOIR} /${police} ${taille} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${chainePdf(texte)}) Tj ET`;
}

function paginer(doc: DocumentLisible): string[][] {
  const pages: string[][] = [];
  let operations: string[] = [];
  let y = HAUT;

  const nouvellePage = () => {
    pages.push(operations);
    operations = [];
    y = HAUT;
  };

  for (const element of elementsDepuis(doc)) {
    if ('regle' in element) {
      if (y - element.avant - 6 < BAS) nouvellePage();
      y -= element.avant;
      operations.push(
        `0.82 0.82 0.82 RG 0.6 w ${MARGE.toFixed(2)} ${y.toFixed(2)} m ${(LARGEUR_PAGE - MARGE).toFixed(2)} ${y.toFixed(2)} l S`,
      );
      y -= 8;
      continue;
    }

    const interligne = element.taille * (element.monospace ? 1.26 : 1.36);
    if (y - element.avant - interligne < BAS) nouvellePage();
    y -= element.avant;
    if (element.texte) {
      operations.push(
        dessinerTexte(element.texte, element.taille, element.police, MARGE + element.retrait, y - element.taille, element.gris),
      );
    }
    y -= interligne;
  }

  pages.push(operations);

  // Pied de page : la pagination n'est connue qu'une fois tout mis en page.
  const total = pages.length;
  return pages.map((ops, index) => {
    const pied = dessinerTexte(
      `Aura \u00b7 page ${index + 1}/${total}`,
      8,
      'F1',
      MARGE,
      28,
      true,
    );
    return [pied, ...ops];
  });
}

/* ── Assemblage du fichier ── */

function assembler(contenus: Map<number, Buffer>, totalObjets: number, racine: number, info: number): Buffer {
  const morceaux: Buffer[] = [];
  let taille = 0;
  const pousser = (b: Buffer) => {
    morceaux.push(b);
    taille += b.length;
  };
  const offsets = new Array<number>(totalObjets + 1).fill(0);

  pousser(Buffer.from('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n', 'latin1'));

  for (let n = 1; n <= totalObjets; n += 1) {
    const contenu = contenus.get(n);
    if (!contenu) continue;
    offsets[n] = taille;
    pousser(Buffer.from(`${n} 0 obj\n`, 'latin1'));
    pousser(contenu);
    pousser(Buffer.from('\nendobj\n', 'latin1'));
  }

  const debutXref = taille;
  const lignes: string[] = [`xref\n0 ${totalObjets + 1}\n`, '0000000000 65535 f \n'];
  for (let n = 1; n <= totalObjets; n += 1) {
    lignes.push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  }
  pousser(Buffer.from(lignes.join(''), 'latin1'));
  pousser(
    Buffer.from(
      `trailer\n<< /Size ${totalObjets + 1} /Root ${racine} 0 R /Info ${info} 0 R >>\nstartxref\n${debutXref}\n%%EOF\n`,
      'latin1',
    ),
  );

  return Buffer.concat(morceaux);
}

/** Construit le PDF complet d'une création. */
export function creerPdf(doc: DocumentLisible): Buffer {
  const pages = paginer(doc);
  const nbPages = pages.length;

  const premierContenu = 3;
  const numeroPage = (index: number) => premierContenu + index * 2;
  const numeroFlux = (index: number) => premierContenu + index * 2 + 1;
  const f1 = premierContenu + nbPages * 2;
  const f2 = f1 + 1;
  const f3 = f2 + 1;
  const info = f3 + 1;
  const totalObjets = info;

  const contenus = new Map<number, Buffer>();
  contenus.set(1, Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'latin1'));

  const enfants = pages.map((_p, i) => `${numeroPage(i)} 0 R`).join(' ');
  contenus.set(2, Buffer.from(`<< /Type /Pages /Kids [${enfants}] /Count ${nbPages} >>`, 'latin1'));

  pages.forEach((ops, index) => {
    const flux = Buffer.from(ops.join('\n'), 'latin1');
    contenus.set(
      numeroPage(index),
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGEUR_PAGE.toFixed(2)} ${HAUTEUR_PAGE.toFixed(2)}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${numeroFlux(index)} 0 R >>`,
        'latin1',
      ),
    );
    contenus.set(
      numeroFlux(index),
      Buffer.concat([
        Buffer.from(`<< /Length ${flux.length} >>\nstream\n`, 'latin1'),
        flux,
        Buffer.from('\nendstream', 'latin1'),
      ]),
    );
  });

  contenus.set(f1, Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', 'latin1'));
  contenus.set(f2, Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>', 'latin1'));
  contenus.set(f3, Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>', 'latin1'));
  contenus.set(info, Buffer.from('<< /Producer (Aura) /Creator (Aura Studio) >>', 'latin1'));

  return assembler(contenus, totalObjets, 1, info);
}
