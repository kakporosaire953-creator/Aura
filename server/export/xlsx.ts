/**
 * Export XLSX (Excel) d'une création — sans dépendance.
 *
 * Un classeur minimal : `[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`,
 * ses relations et une feuille par section (`## …`) contenant un tableau.
 * Les cellules numériques sont écrites comme nombres, tout le reste comme
 * chaînes en ligne — Excel, LibreOffice et Google Sheets ouvrent le fichier
 * sans réparation.
 */
import { creerZip, type FichierZip } from './zip.js';
import { echapperXml } from './docx.js';
import { extraireTableaux, type DocumentLisible } from './blocs.js';

type Feuille = { nom: string; lignes: string[][] };

const NOM_FEUILLE_INTERDIT = /[[\]:*?/\\]/g;

function nomFeuille(brut: string, index: number): string {
  const net = brut.replace(NOM_FEUILLE_INTERDIT, ' ').trim().slice(0, 31);
  return net || `Feuille${index + 1}`;
}

function colonne(index: number): string {
  let n = index + 1;
  let nom = '';
  while (n > 0) {
    const reste = (n - 1) % 26;
    nom = String.fromCharCode(65 + reste) + nom;
    n = Math.floor((n - 1) / 26);
  }
  return nom;
}

const NOMBRE = /^-?\d+(?:[.,]\d+)?$/;

function cellule(valeur: string, ref: string): string {
  const texte = (valeur ?? '').trim();
  if (NOMBRE.test(texte)) {
    const nombre = texte.replace(',', '.');
    return `<c r="${ref}"><v>${nombre}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${echapperXml(texte)}</t></is></c>`;
}

function feuilleXml(lignes: string[][]): string {
  const corps = lignes
    .map((ligne, r) => {
      const cellules = ligne
        .map((valeur, c) => cellule(valeur, `${colonne(c)}${r + 1}`))
        .join('');
      return `<row r="${r + 1}">${cellules}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${corps}</sheetData></worksheet>`;
}

function feuillesDe(doc: DocumentLisible): Feuille[] {
  const sections = extraireTableaux(doc.markdown);
  if (sections.length === 0) {
    // Pas de tableau : on rend le document en lignes, une par paragraphe.
    const lignes = doc.blocs
      .filter((b) => 'texte' in b && b.texte.trim())
      .map((b) => [('texte' in b ? b.texte : '').trim()]);
    return [{ nom: nomFeuille(doc.titre, 0), lignes: [[doc.titre], [], ...lignes] }];
  }
  return sections.map((s, i) => ({ nom: nomFeuille(s.titre || doc.titre, i), lignes: s.lignes }));
}

export function creerXlsx(doc: DocumentLisible): Buffer {
  const feuilles = feuillesDe(doc);

  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${feuilles
  .map(
    (_f, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join('\n')}
</Types>`;

  const relations = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const classeur = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${feuilles
    .map(
      (f, i) =>
        `<sheet name="${echapperXml(f.nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('')}</sheets></workbook>`;

  const relationsClasseur = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${feuilles
  .map(
    (_f, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  )
  .join('\n')}
</Relationships>`;

  const fichiers: FichierZip[] = [
    { nom: '[Content_Types].xml', donnees: Buffer.from(types, 'utf8') },
    { nom: '_rels/.rels', donnees: Buffer.from(relations, 'utf8') },
    { nom: 'xl/workbook.xml', donnees: Buffer.from(classeur, 'utf8') },
    { nom: 'xl/_rels/workbook.xml.rels', donnees: Buffer.from(relationsClasseur, 'utf8') },
    ...feuilles.map((f, i) => ({
      nom: `xl/worksheets/sheet${i + 1}.xml`,
      donnees: Buffer.from(feuilleXml(f.lignes), 'utf8'),
    })),
  ];

  return creerZip(fichiers);
}
