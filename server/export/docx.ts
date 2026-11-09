/**
 * Export DOCX (Word) d'une création — sans dépendance.
 *
 * Un .docx minimal mais valide : `[Content_Types].xml`, `_rels/.rels` et
 * `word/document.xml`, empaquetés par notre écriture ZIP. La mise en forme
 * reste volontairement sobre (titres hiérarchisés, paragraphes, listes,
 * citations, code) : c'est un document lisible et modifiable dans Word,
 * LibreOffice ou Google Docs, pas une reproduction de la page web.
 */
import { creerZip } from './zip.js';
import type { Bloc, DocumentLisible } from './blocs.js';

const POLICE_TEXTE = 'Calibri';
const POLICE_CODE = 'Consolas';

/** Échappement XML : les créations contiennent souvent `<`, `&`, `«`… */
export function echapperXml(texte: string): string {
  return texte
    // Caractères de contrôle interdits en XML 1.0.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

type MiseEnForme = {
  gras?: boolean;
  italique?: boolean;
  taille: number; // demi-points
  police?: string;
  couleur?: string;
  /** Espace après le paragraphe, en vingtièmes de point. */
  apres?: number;
  /** Retrait à gauche, en vingtièmes de point. */
  retrait?: number;
  /** Retrait négatif de première ligne (listes), en vingtièmes de point. */
  suspendu?: number;
};

function executer(texte: string, m: MiseEnForme): string {
  const proprietes = [
    m.police
      ? `<w:rFonts w:ascii="${m.police}" w:hAnsi="${m.police}" w:cs="${m.police}"/>`
      : `<w:rFonts w:ascii="${POLICE_TEXTE}" w:hAnsi="${POLICE_TEXTE}"/>`,
    m.gras ? '<w:b/>' : '',
    m.italique ? '<w:i/>' : '',
    m.couleur ? `<w:color w:val="${m.couleur}"/>` : '',
    `<w:sz w:val="${m.taille}"/><w:szCs w:val="${m.taille}"/>`,
  ].join('');
  // `xml:space="preserve"` : les espaces du code et des listes comptent.
  return `<w:r><w:rPr>${proprietes}</w:rPr><w:t xml:space="preserve">${echapperXml(texte)}</w:t></w:r>`;
}

function paragraphe(texte: string, m: MiseEnForme): string {
  const pPr = [
    m.apres !== undefined || m.retrait !== undefined || m.suspendu !== undefined
      ? `<w:spacing w:after="${m.apres ?? 0}" w:line="276" w:lineRule="auto"/>`
      : '',
    m.retrait !== undefined || m.suspendu !== undefined
      ? `<w:ind w:left="${m.retrait ?? 0}"${
          m.suspendu !== undefined ? ` w:hanging="${m.suspendu}"` : ''
        }/>`
      : '',
  ].join('');
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${executer(texte, m)}</w:p>`;
}

/** Un bloc de code : une ligne = un paragraphe, interligne serré. */
function blocCode(texte: string): string {
  const lignes = texte.split('\n');
  return lignes
    .map((ligne) =>
      paragraphe(ligne.length ? ligne : ' ', {
        taille: 18,
        police: POLICE_CODE,
        apres: 0,
        retrait: 240,
      }),
    )
    .join('');
}

function rendreBloc(bloc: Bloc): string {
  switch (bloc.type) {
    case 'titre':
      return paragraphe(bloc.texte, {
        gras: true,
        taille: bloc.niveau === 1 ? 30 : bloc.niveau === 2 ? 26 : 23,
        apres: bloc.niveau === 1 ? 200 : 140,
      });
    case 'paragraphe':
      return paragraphe(bloc.texte, { taille: 22, apres: 160 });
    case 'puce':
      return paragraphe(`• ${bloc.texte}`, { taille: 22, apres: 80, retrait: 360, suspendu: 180 });
    case 'numerote':
      return paragraphe(bloc.texte, { taille: 22, apres: 80, retrait: 360 });
    case 'citation':
      return paragraphe(bloc.texte, {
        italique: true,
        taille: 21,
        couleur: '444444',
        apres: 140,
        retrait: 360,
      });
    case 'code':
      return blocCode(bloc.texte);
    case 'espace':
      return paragraphe('', { taille: 22, apres: 160 });
    default:
      return '';
  }
}

function partieDocument(doc: DocumentLisible): string {
  const corps = [
    paragraphe(doc.titre, { gras: true, taille: 36, apres: 120 }),
    paragraphe(doc.sousTitre, { taille: 19, couleur: '666666', apres: 280 }),
    ...doc.blocs.map(rendreBloc),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${corps}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;
}

const TYPES_CONTENU = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELATIONS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

export function creerDocx(doc: DocumentLisible): Buffer {
  return creerZip([
    { nom: '[Content_Types].xml', donnees: Buffer.from(TYPES_CONTENU, 'utf8') },
    { nom: '_rels/.rels', donnees: Buffer.from(RELATIONS, 'utf8') },
    { nom: 'word/document.xml', donnees: Buffer.from(partieDocument(doc), 'utf8') },
  ]);
}
