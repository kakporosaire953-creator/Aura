import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { usePrefs } from '../app/prefs';
import { DOCS, type BlocDoc } from '../app/docs';
import { Icone } from '../components/ui/Icone';

const Bloc: React.FC<{ bloc: BlocDoc }> = ({ bloc }) => {
  switch (bloc.type) {
    case 'para':
      return <p className="corps">{bloc.texte}</p>;
    case 'liste':
      return (
        <ul className="doc-liste">
          {bloc.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case 'etapes':
      return (
        <ol className="doc-etapes">
          {bloc.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      );
    case 'code':
      return (
        <pre className="doc-code" aria-label={`${bloc.langage} — exemple`}>
          <code>{bloc.code}</code>
        </pre>
      );
    case 'note':
      return (
        <p className={`doc-note doc-note-${bloc.ton}`}>
          <Icone nom={bloc.ton === 'limite' ? 'circle-exclamation' : 'circle-info'} />
          <span>{bloc.texte}</span>
        </p>
      );
    case 'tableau':
      return (
        <div className="doc-tableau-defile">
          <table className="doc-tableau">
            <thead>
              <tr>
                {bloc.entetes.map((e) => (
                  <th key={e} scope="col">
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloc.lignes.map((ligne, i) => (
                <tr key={i}>
                  {ligne.map((cellule, j) => (
                    <td key={j}>{cellule}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
};

/** Page d'article : sommaire ancré, navigation entre guides. */
export const DocumentationArticlePage: React.FC = () => {
  const { slug } = useParams();
  const { lang } = usePrefs();
  const d = DOCS[lang];
  const index = d.articles.findIndex((a) => a.slug === slug);
  const article = index >= 0 ? d.articles[index] : null;

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  if (!article) {
    return (
      <>
        <SiteNav />
        <main id="contenu" className="section">
          <div className="wrap doc-introuvable">
            <h1 className="display-lg">404</h1>
            <p className="corps">
              {lang === 'fr'
                ? 'Ce guide n’existe pas ou a été déplacé.'
                : 'This guide does not exist or has moved.'}
            </p>
            <Link to="/documentation" className="btn btn-encre">
              <span>{d.article.retour}</span>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const precedent = index > 0 ? d.articles[index - 1] : null;
  const suivant = index < d.articles.length - 1 ? d.articles[index + 1] : null;
  const associes = article.associes
    .map((s) => d.articles.find((a) => a.slug === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <>
      <SiteNav />

      <main id="contenu">
        <section className="section doc-hero">
          <div className="wrap">
            <nav className="doc-fil" aria-label={d.article.retour}>
              <Link to="/documentation">
                <Icone nom="arrow-left" /> {d.article.retour}
              </Link>
            </nav>
            <span className="kicker">{article.titre}</span>
            <h1 className="display-lg">{article.titre}</h1>
            <p className="sous-titre">{article.resume}</p>
            <p className="doc-meta">
              {d.article.duree} : {article.duree}
            </p>
          </div>
        </section>

        <section className="section doc-corps-section">
          <div className="wrap doc-mise-en-page">
            <aside className="doc-sommaire" aria-label={d.article.surCettePage}>
              <p className="doc-sommaire-titre">{d.article.sommaire}</p>
              <ul>
                {article.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.titre}</a>
                  </li>
                ))}
              </ul>
            </aside>

            <article className="doc-corps">
              {article.sections.map((s) => (
                <section key={s.id} id={s.id} className="doc-section">
                  <h2 className="display-md">{s.titre}</h2>
                  {s.blocs.map((b, i) => (
                    <Bloc key={i} bloc={b} />
                  ))}
                </section>
              ))}

              {associes.length > 0 && (
                <section className="doc-associes" aria-label={d.article.associes}>
                  <h2 className="display-md">{d.article.associes}</h2>
                  <ul>
                    {associes.map((a) => (
                      <li key={a.slug}>
                        <Link to={`/documentation/${a.slug}`}>
                          <Icone nom={a.icone} /> {a.titre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <nav className="doc-pagination" aria-label={d.article.retour}>
                {precedent ? (
                  <Link to={`/documentation/${precedent.slug}`} className="doc-page-lien">
                    <span>{d.article.precedent}</span>
                    <strong>{precedent.titre}</strong>
                  </Link>
                ) : (
                  <span />
                )}
                {suivant && (
                  <Link to={`/documentation/${suivant.slug}`} className="doc-page-lien doc-page-suivant">
                    <span>{d.article.suivant}</span>
                    <strong>{suivant.titre}</strong>
                  </Link>
                )}
              </nav>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
};
