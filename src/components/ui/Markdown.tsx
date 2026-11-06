/**
 * Rendu Markdown sûr — parsing restreint (titres, listes, code, tableaux,
 * citations, gras/italique, liens http(s)) construit en éléments React,
 * sans jamais injecter de HTML : aucune surface XSS par conception.
 */
import React, { useState } from 'react';

type Bloc =
  | { genre: 'para'; lignes: string[] }
  | { genre: 'titre'; niveau: number; texte: string }
  | { genre: 'code'; langue: string; contenu: string }
  | { genre: 'liste'; ordonnee: boolean; items: string[] }
  | { genre: 'citation'; lignes: string[] }
  | { genre: 'tableau'; entetes: string[]; lignes: string[][] }
  | { genre: 'separateur' };

function analyser(texte: string): Bloc[] {
  const lignes = texte.replace(/\r\n/g, '\n').split('\n');
  const blocs: Bloc[] = [];
  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];

    if (ligne.trim() === '') {
      i++;
      continue;
    }

    // Bloc de code
    const ouvertureCode = ligne.match(/^```(\w*)\s*$/);
    if (ouvertureCode) {
      const langue = ouvertureCode[1] ?? '';
      const contenu: string[] = [];
      i++;
      while (i < lignes.length && !/^```\s*$/.test(lignes[i])) {
        contenu.push(lignes[i]);
        i++;
      }
      i++; // fermeture
      blocs.push({ genre: 'code', langue, contenu: contenu.join('\n') });
      continue;
    }

    // Titre
    const titre = ligne.match(/^(#{1,6})\s+(.*)$/);
    if (titre) {
      blocs.push({ genre: 'titre', niveau: titre[1].length, texte: titre[2] });
      i++;
      continue;
    }

    // Séparateur
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(ligne)) {
      blocs.push({ genre: 'separateur' });
      i++;
      continue;
    }

    // Tableau
    if (ligne.trim().startsWith('|') && i + 1 < lignes.length && /^\s*\|[\s:|-]+\|\s*$/.test(lignes[i + 1])) {
      const entetes = decouperLigneTableau(ligne);
      i += 2;
      const corps: string[][] = [];
      while (i < lignes.length && lignes[i].trim().startsWith('|')) {
        corps.push(decouperLigneTableau(lignes[i]));
        i++;
      }
      blocs.push({ genre: 'tableau', entetes, lignes: corps });
      continue;
    }

    // Citation
    if (ligne.trim().startsWith('>')) {
      const contenu: string[] = [];
      while (i < lignes.length && lignes[i].trim().startsWith('>')) {
        contenu.push(lignes[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocs.push({ genre: 'citation', lignes: contenu });
      continue;
    }

    // Listes
    const puce = ligne.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (puce) {
      const ordonnee = /\d/.test(puce[2]);
      const items: string[] = [];
      while (i < lignes.length) {
        const m = lignes[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (!m) break;
        items.push(m[3]);
        i++;
      }
      blocs.push({ genre: 'liste', ordonnee, items });
      continue;
    }

    // Paragraphe
    const para: string[] = [];
    while (
      i < lignes.length &&
      lignes[i].trim() !== '' &&
      !/^```/.test(lignes[i]) &&
      !/^#{1,6}\s/.test(lignes[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lignes[i]) &&
      !/^\s*>/.test(lignes[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lignes[i])
    ) {
      para.push(lignes[i]);
      i++;
    }
    blocs.push({ genre: 'para', lignes: para });
  }

  return blocs;
}

function decouperLigneTableau(ligne: string): string[] {
  return ligne
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
}

/* ── Texte enrichi (inline) ── */

const URL_SURE = /^https?:\/\//i;

function enrichi(texte: string, cle: string): React.ReactNode[] {
  const noeuds: React.ReactNode[] = [];
  // Gras, italique, code inline, liens — découpage itératif.
  const motif = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = motif.exec(texte)) !== null) {
    if (m.index > dernier) noeuds.push(texte.slice(dernier, m.index));
    const t = m[0];
    const k = `${cle}-${n++}`;
    if (t.startsWith('**') || t.startsWith('__')) {
      noeuds.push(<strong key={k}>{enrichi(t.slice(2, -2), k)}</strong>);
    } else if (t.startsWith('*') || t.startsWith('_')) {
      noeuds.push(<em key={k}>{enrichi(t.slice(1, -1), k)}</em>);
    } else if (t.startsWith('`')) {
      noeuds.push(
        <code key={k} className="md-code-inline">
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith('[')) {
      const mm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (mm && URL_SURE.test(mm[2])) {
        noeuds.push(
          <a key={k} href={mm[2]} target="_blank" rel="noopener noreferrer">
            {mm[1]}
          </a>,
        );
      } else {
        noeuds.push(t);
      }
    }
    dernier = m.index + t.length;
  }
  if (dernier < texte.length) noeuds.push(texte.slice(dernier));
  return noeuds;
}

/* ── Composant ── */

const BlocCode: React.FC<{ contenu: string; langue: string }> = ({ contenu, langue }) => {
  const [copie, setCopie] = useState(false);
  return (
    <div className="md-bloc-code">
      <div className="md-bloc-code-barre">
        <span>{langue || 'code'}</span>
        <button
          type="button"
          className="md-copier"
          onClick={() => {
            void navigator.clipboard?.writeText(contenu);
            setCopie(true);
            setTimeout(() => setCopie(false), 1500);
          }}
        >
          <i className={`fa-solid ${copie ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" />{' '}
          {copie ? '✓' : '⧉'}
        </button>
      </div>
      <pre>
        <code>{contenu}</code>
      </pre>
    </div>
  );
};

export const Markdown: React.FC<{ texte: string }> = ({ texte }) => {
  const blocs = analyser(texte);
  return (
    <div className="md">
      {blocs.map((b, i) => {
        const k = `b${i}`;
        switch (b.genre) {
          case 'titre': {
            const Tag = (`h${Math.min(b.niveau + 2, 6)}`) as 'h3' | 'h4' | 'h5' | 'h6';
            return <Tag key={k}>{enrichi(b.texte, k)}</Tag>;
          }
          case 'code':
            return <BlocCode key={k} contenu={b.contenu} langue={b.langue} />;
          case 'liste':
            return b.ordonnee ? (
              <ol key={k}>
                {b.items.map((it, j) => (
                  <li key={`${k}-${j}`}>{enrichi(it, `${k}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={k}>
                {b.items.map((it, j) => (
                  <li key={`${k}-${j}`}>{enrichi(it, `${k}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'citation':
            return (
              <blockquote key={k}>
                {b.lignes.map((l, j) => (
                  <p key={`${k}-${j}`}>{enrichi(l, `${k}-${j}`)}</p>
                ))}
              </blockquote>
            );
          case 'tableau':
            return (
              <div key={k} className="md-tableau-wrap">
                <table className="md-tableau">
                  <thead>
                    <tr>
                      {b.entetes.map((e, j) => (
                        <th key={`${k}-h${j}`}>{enrichi(e, `${k}-h${j}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.lignes.map((l, j) => (
                      <tr key={`${k}-l${j}`}>
                        {l.map((c, x) => (
                          <td key={`${k}-l${j}c${x}`}>{enrichi(c, `${k}-l${j}c${x}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'separateur':
            return <hr key={k} />;
          default:
            return (
              <p key={k}>
                {b.lignes.map((l, j) => (
                  <React.Fragment key={`${k}-${j}`}>
                    {j > 0 && ' '}
                    {enrichi(l, `${k}-${j}`)}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
};
