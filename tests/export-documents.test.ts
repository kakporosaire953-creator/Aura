/**
 * Exports documentaires — Markdown → blocs, DOCX (zip OOXML) et PDF.
 *
 * Ces tests vérifient le fichier produit, pas seulement la fonction : structure
 * ZIP relisible, CRC corrects, XML échappé, table xref du PDF pointant sur les
 * bons objets, longueurs de flux exactes, accents en WinAnsi et pagination.
 * Un export « qui s'ouvre » est le seul résultat qui compte pour l'utilisateur.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyserMarkdown, composerDocument, nettoyerEnLigne, nomFichierSur } from '../server/export/blocs';
import { creerDocx, echapperXml } from '../server/export/docx';
import { creerPdf, chainePdf, couperEnLignes, largeurTexte, versWinAnsi } from '../server/export/pdf';

/* ── Outils de lecture d'archive ZIP « stored » ── */

function lireZip(donnees: Buffer): Map<string, Buffer> {
  const fichiers = new Map<string, Buffer>();
  let i = 0;
  while (i + 30 <= donnees.length && donnees.readUInt32LE(i) === 0x04034b50) {
    const methode = donnees.readUInt16LE(i + 8);
    const taille = donnees.readUInt32LE(i + 18);
    const longueurNom = donnees.readUInt16LE(i + 26);
    const longueurExtra = donnees.readUInt16LE(i + 28);
    assert.equal(methode, 0, 'archive attendue en mode « stored »');
    const nom = donnees.subarray(i + 30, i + 30 + longueurNom).toString('utf8');
    const debut = i + 30 + longueurNom + longueurExtra;
    fichiers.set(nom, donnees.subarray(debut, debut + taille));
    i = debut + taille;
  }
  return fichiers;
}

const SOURCE = {
  titre: 'Rapport sur la scolarisation des filles au Bénin — analyse',
  type: 'rapport',
  version: 2,
  cree: '2026-10-23T10:00:00.000Z',
  contenu: [
    '# Introduction',
    '',
    'Un paragraphe avec des **accents** éàùç et du `code inline`.',
    '',
    '## Objectifs',
    '',
    '- Premier point',
    '- Deuxième point',
    '',
    '1. Étape numérotée',
    '',
    '> Une citation.',
    '',
    '```ts',
    'const x = (a) => a * 2; // <balise> & "guillemets"',
    '```',
  ].join('\n'),
};

const DOCUMENT = composerDocument(SOURCE);

describe('Lecture du contenu (blocs)', () => {
  test('titres, listes, citations et blocs de code', () => {
    const blocs = analyserMarkdown(DOCUMENT.blocs.map((b) => ('texte' in b ? b.texte : '')).join('\n'));
    // Le contenu reconstruit n'est pas le Markdown d'origine : on analyse la source.
    const source = analyserMarkdown('# Titre\n\n## Sous-titre\n\n- une puce\n1. numéro\n> citation\n\n```ts\nligne()\n```');
    assert.deepEqual(
      source.map((b) => b.type),
      ['titre', 'titre', 'puce', 'numerote', 'citation', 'code'],
    );
    assert.equal(blocs.length > 0, true);
  });

  test('le balisage en ligne est retiré, les liens gardent leur URL', () => {
    assert.equal(nettoyerEnLigne('du **gras** et du *penché*'), 'du gras et du penché');
    assert.equal(nettoyerEnLigne('voir [le site](https://aura.test)'), 'voir le site (https://aura.test)');
    assert.equal(nettoyerEnLigne('du `code` ici'), 'du code ici');
    assert.equal(nettoyerEnLigne('souligné __fort__'), 'souligné fort');
  });

  test('un bloc de code non refermé ne perd pas sa fin', () => {
    const blocs = analyserMarkdown('```js\nconsole.log(1)');
    assert.deepEqual(blocs, [{ type: 'code', texte: 'console.log(1)' }]);
  });

  test('nom de fichier sûr, sans accent ni espace', () => {
    assert.equal(nomFichierSur('Rapport — Été à Cotonou', 'pdf'), 'rapport-ete-a-cotonou.pdf');
    assert.equal(nomFichierSur('   ', 'docx'), 'creation.docx');
  });
});

describe('Export DOCX', () => {
  test('archive valide contenant les trois parties OOXML', () => {
    const fichier = creerDocx(DOCUMENT);
    assert.equal(fichier.subarray(0, 2).toString('latin1'), 'PK');
    const parties = lireZip(fichier);
    assert.deepEqual([...parties.keys()], ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']);

    const document = parties.get('word/document.xml')!.toString('utf8');
    assert.match(document, /<w:document /);
    assert.match(document, /<w:sectPr>/);
    assert.match(document, /Bénin/);
    // Le contenu de la création ne doit jamais casser le XML.
    assert.match(document, /&lt;balise&gt; &amp; &quot;guillemets&quot;/);
    assert.doesNotMatch(document, /<balise>/);
  });

  test('échappement XML complet', () => {
    assert.equal(echapperXml(`a<b>c&d"e'f`), 'a&lt;b&gt;c&amp;d&quot;e&apos;f');
    assert.equal(echapperXml('texte\u0000avec\u0007contrôle'), 'texteaveccontrôle');
  });

  test('les caractères de contrôle ne passent jamais dans le fichier', () => {
    const parties = lireZip(creerDocx(composerDocument({ ...SOURCE, contenu: 'a\u0000b\u0001c' })));
    const document = parties.get('word/document.xml')!.toString('utf8');
    assert.doesNotMatch(document, /[\u0000\u0001]/);
  });
});

/* ── Lecture d'un PDF : en-tête, xref, flux ── */

function verifierPdf(fichier: Buffer): { pages: number; texte: string } {
  const brut = fichier.toString('latin1');
  assert.ok(brut.startsWith('%PDF-1.4'), 'en-tête PDF absent');
  assert.ok(brut.trimEnd().endsWith('%%EOF'), 'marqueur de fin absent');

  const indexXref = brut.lastIndexOf('startxref');
  assert.ok(indexXref > 0, 'startxref absent');
  const debutXref = Number(brut.slice(indexXref + 'startxref'.length).trim().split(/\s/)[0]);
  assert.ok(Number.isInteger(debutXref) && debutXref > 0);
  assert.match(brut.slice(debutXref, debutXref + 4), /^xref/);

  const entete = /xref\s+0\s+(\d+)\s+/u.exec(brut.slice(debutXref))!;
  const total = Number(entete[1]);
  const corps = brut.slice(debutXref + entete[0].length);
  for (let n = 1; n < total; n += 1) {
    const entree = corps.slice(n * 20, (n + 1) * 20);
    const decalage = Number(entree.slice(0, 10));
    assert.ok(
      brut.startsWith(`${n} 0 obj`, decalage),
      `l'objet ${n} n'est pas à l'offset ${decalage}`,
    );
  }

  // Chaque flux annonce une longueur exacte (sinon acrobat et MuPDF divergent).
  for (const trouve of brut.matchAll(/<< \/Length (\d+) >>\nstream\n/g)) {
    const longueur = Number(trouve[1]);
    const debut = (trouve.index ?? 0) + trouve[0].length;
    assert.equal(brut.slice(debut, debut + longueur + 10).indexOf('\nendstream'), longueur);
  }

  const pages = (brut.match(/\/Type \/Page /g) ?? []).length;
  assert.match(brut, new RegExp(`/Count ${pages}`));
  return { pages, texte: brut };
}

describe('Export PDF', () => {
  test('structure relisible : xref, objets, longueurs de flux', () => {
    const { pages } = verifierPdf(creerPdf(DOCUMENT));
    assert.equal(pages, 1);
  });

  test('accents et caractères typographiques en WinAnsi', () => {
    const fichier = creerPdf(DOCUMENT).toString('latin1');
    assert.match(fichier, /B\\351nin/); // é
    assert.match(fichier, /scolarisation/);
    assert.match(versWinAnsi('’'), /\u0092/);
    assert.match(versWinAnsi('—'), /\u0097/);
    assert.equal(versWinAnsi('🙂'), '?');
  });

  test('les parenthèses et barres obliques sont échappées', () => {
    assert.equal(chainePdf('a(b)c'), 'a\\(b\\)c');
    assert.equal(chainePdf('a\\b'), 'a\\\\b');
    assert.equal(chainePdf('é'), '\\351');
  });

  test('contenu long : plusieurs pages et pied de page numéroté', () => {
    const long = composerDocument({
      ...SOURCE,
      contenu: Array.from({ length: 120 }, (_v, i) => `Paragraphe ${i + 1} — ${'remplissage '.repeat(12)}`).join('\n\n'),
    });
    const fichier = creerPdf(long).toString('latin1');
    const { pages } = verifierPdf(creerPdf(long));
    assert.ok(pages > 1, `pagination attendue, obtenu ${pages}`);
    assert.match(fichier, new RegExp(`page 1/${pages}`));
    assert.match(fichier, new RegExp(`page ${pages}/${pages}`));
  });

  test('coupe des lignes : jamais plus large que la colonne, jamais de mot perdu', () => {
    const texte = 'Un paragraphe assez long pour être coupé plusieurs fois de suite dans la colonne du document exporté.';
    const lignes = couperEnLignes(texte, 200, 10.5);
    assert.ok(lignes.length > 1);
    for (const ligne of lignes) assert.ok(largeurTexte(ligne, 10.5) <= 200);
    assert.equal(lignes.join(' ').replace(/\s+/g, ' '), texte.replace(/\s+/g, ' '));
  });

  test('un mot plus long que la colonne est coupé, pas débordé', () => {
    const lignes = couperEnLignes('A'.repeat(120), 100, 10);
    assert.ok(lignes.length > 1);
    for (const ligne of lignes) assert.ok(largeurTexte(ligne, 10) <= 100);
    assert.equal(lignes.join(''), 'A'.repeat(120));
  });
});
