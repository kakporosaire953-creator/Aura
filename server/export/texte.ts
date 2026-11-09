/**
 * Exports texte : CSV, TXT et HTML autonome.
 *
 * Ces trois formats n'ont aucune structure à réinventer ; ils servent surtout
 * à ce qu'un livrable sorte du site sans passer par Word ou Excel. L'HTML est
 * volontairement autonome (styles en ligne, aucune ressource distante) : il
 * s'ouvre hors ligne et s'imprime proprement.
 */
import { echapperXml } from './docx.js';
import { extraireTableaux, type DocumentLisible } from './blocs.js';

/* ── CSV ── */

export function valeurCsv(valeur: string): string {
  const propre = (valeur ?? '').replace(/\r?\n/g, ' ');
  return /[";\n]/.test(propre) ? `"${propre.replace(/"/g, '""')}"` : propre;
}

/**
 * CSV pour tableur : point-virgule (Excel en français), BOM UTF-8 pour que
 * les accents s'affichent correctement au double-clic sous Windows.
 */
export function creerCsv(doc: DocumentLisible): Buffer {
  const sections = extraireTableaux(doc.markdown);
  const lignes: string[][] =
    sections.length > 0
      ? sections.flatMap((s, i) => (i === 0 ? s.lignes : [[], [s.titre], ...s.lignes]))
      : doc.blocs
          .filter((b) => 'texte' in b && b.texte.trim())
          .map((b) => [('texte' in b ? b.texte : '').trim()]);

  const contenu = lignes.map((l) => l.map(valeurCsv).join(';')).join('\r\n');
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${contenu}\r\n`, 'utf8')]);
}

/* ── TXT ── */

export function creerTxt(doc: DocumentLisible): Buffer {
  const morceaux: string[] = [doc.titre, doc.sousTitre, ''];
  for (const bloc of doc.blocs) {
    switch (bloc.type) {
      case 'titre':
        morceaux.push('', bloc.texte.toUpperCase(), '-'.repeat(Math.min(60, bloc.texte.length)));
        break;
      case 'puce':
        morceaux.push(`  - ${bloc.texte}`);
        break;
      case 'numerote':
        morceaux.push(`  ${bloc.texte}`);
        break;
      case 'citation':
        morceaux.push(`  | ${bloc.texte}`);
        break;
      case 'code':
        morceaux.push('', ...bloc.texte.split('\n').map((l) => `    ${l}`));
        break;
      case 'tableau':
        morceaux.push('', bloc.entetes.filter(Boolean).join(' | '));
        for (const ligne of bloc.lignes) morceaux.push(ligne.filter(Boolean).join(' | '));
        break;
      case 'espace':
        morceaux.push('');
        break;
      default:
        if ('texte' in bloc && bloc.texte.trim()) morceaux.push('', bloc.texte.trim());
        break;
    }
  }
  return Buffer.from(`${morceaux.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`, 'utf8');
}

/* ── HTML autonome ── */

export function creerHtml(doc: DocumentLisible): Buffer {
  const corps: string[] = [];
  for (const bloc of doc.blocs) {
    switch (bloc.type) {
      case 'titre':
        corps.push(`<h${bloc.niveau + 1}>${echapperXml(bloc.texte)}</h${bloc.niveau + 1}>`);
        break;
      case 'puce':
        corps.push(`<li>${echapperXml(bloc.texte)}</li>`);
        break;
      case 'numerote':
        corps.push(`<li class="num">${echapperXml(bloc.texte)}</li>`);
        break;
      case 'citation':
        corps.push(`<blockquote>${echapperXml(bloc.texte)}</blockquote>`);
        break;
      case 'code':
        corps.push(`<pre><code>${echapperXml(bloc.texte)}</code></pre>`);
        break;
      case 'tableau':
        corps.push(
          `<table><thead><tr>${bloc.entetes
            .map((c) => `<th>${echapperXml(c)}</th>`)
            .join('')}</tr></thead><tbody>${bloc.lignes
            .map((l) => `<tr>${l.map((c) => `<td>${echapperXml(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`,
        );
        break;
      case 'espace':
        corps.push('<hr/>');
        break;
      default:
        if ('texte' in bloc && bloc.texte.trim()) corps.push(`<p>${echapperXml(bloc.texte)}</p>`);
        break;
    }
  }

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${echapperXml(doc.titre)}</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0 auto; max-width: 44rem; padding: 3rem 1.5rem 5rem; font: 16px/1.65 Georgia, "Times New Roman", serif; color: #1b1b1b; background: #fff; }
  h1 { font-size: 1.9rem; line-height: 1.2; margin: 0 0 .4rem; }
  .sous { color: #6a6a6a; font-family: system-ui, sans-serif; font-size: .85rem; margin-bottom: 2.5rem; border-bottom: 1px solid #e2e2e2; padding-bottom: 1.2rem; }
  h2 { font-size: 1.25rem; margin-top: 2.2rem; }
  h3 { font-size: 1.05rem; margin-top: 1.8rem; }
  h4 { font-size: .98rem; margin-top: 1.4rem; }
  p { margin: .8rem 0; }
  ul { padding-left: 1.4rem; }
  li { margin: .35rem 0; }
  blockquote { margin: 1.2rem 0; padding-left: 1rem; border-left: 3px solid #d8d8d8; color: #555; font-style: italic; }
  pre { background: #f5f5f3; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: .85rem; }
  code { font-family: ui-monospace, "SF Mono", Consolas, monospace; }
  hr { border: 0; border-top: 1px solid #e2e2e2; margin: 2rem 0; }
  table { border-collapse: collapse; width: 100%; margin: 1.2rem 0; font-size: .92rem; }
  th, td { border: 1px solid #dedede; padding: .45rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f3; font-family: system-ui, sans-serif; font-size: .82rem; text-transform: uppercase; letter-spacing: .03em; }
  footer { margin-top: 3rem; color: #8a8a8a; font-family: system-ui, sans-serif; font-size: .75rem; }
  @media print { body { padding: 0; max-width: none; } footer { display: none; } }
</style>
</head>
<body>
<h1>${echapperXml(doc.titre)}</h1>
<p class="sous">${echapperXml(doc.sousTitre)}</p>
${corps.join('\n')}
<footer>Aura — document exporté</footer>
</body>
</html>
`;
  return Buffer.from(html, 'utf8');
}
