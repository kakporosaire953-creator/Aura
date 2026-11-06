import React from 'react';
import { Link } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { useRevealAll } from '../components/motion/useReveal';
import { usePrefs } from '../app/prefs';
import { DOCS } from '../app/docs';
import { Icone } from '../components/ui/Icone';

/** Hub de la documentation : guides réellement rédigés. */
export const DocumentationPage: React.FC = () => {
  const { lang } = usePrefs();
  const d = DOCS[lang];
  const reveal = useRevealAll<HTMLDivElement>();

  return (
    <>
      <SiteNav />

      <main id="contenu">
        <div ref={reveal}>
          <section className="section docs-page-hero">
            <div className="wrap">
              <span className="kicker" data-reveal>
                {d.hub.kicker}
              </span>
              <h1 className="display-xl" data-reveal>
                {d.hub.titre1} <em className="italique-vif">{d.hub.titre2}</em>.
              </h1>
              <p className="sous-titre" data-reveal>
                {d.hub.sous}
              </p>
            </div>
          </section>

          <section className="section docs-page-liste" aria-labelledby="docs-titre-liste">
            <div className="wrap">
              <h2 id="docs-titre-liste" className="sr-only">
                {d.hub.sommaireLabel}
              </h2>
              <nav className="docs-sommaire" aria-label={d.hub.sommaireLabel} data-reveal>
                <ul>
                  {d.articles.map((a) => (
                    <li key={a.slug}>
                      <Link to={`/documentation/${a.slug}`}>
                        <Icone nom={a.icone} /> {a.titre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="docs-grille">
                {d.articles.map((a) => (
                  <article className="doc-carte" key={a.slug} data-reveal>
                    <div className="doc-carte-haut">
                      <span className="doc-icone" aria-hidden>
                        <Icone nom={a.icone} />
                      </span>
                      <span className="doc-num">
                        {d.article.duree} : {a.duree}
                      </span>
                    </div>
                    <h3>
                      <Link to={`/documentation/${a.slug}`}>{a.titre}</Link>
                    </h3>
                    <p>{a.resume}</p>
                    <Link to={`/documentation/${a.slug}`} className="doc-lire">
                      {d.hub.lire} <Icone nom="arrow-right" />
                    </Link>
                  </article>
                ))}
              </div>

              <p className="docs-note">{d.hub.note}</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
};
