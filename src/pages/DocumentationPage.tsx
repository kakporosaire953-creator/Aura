import React from 'react';
import { Link } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { useRevealAll } from '../components/motion/useReveal';
import { useT } from '../app/prefs';

export const DocumentationPage: React.FC = () => {
  const t = useT();
  const reveal = useRevealAll<HTMLDivElement>();

  return (
    <>
      <SiteNav />

      <main>
        <section className="section docs-page-hero">
          <div className="wrap">
            <span className="kicker" data-reveal>
              {t.docs.kicker}
            </span>
            <h1 className="display-xl" data-reveal>
              {t.docs.titre1} <em className="italique-vif">{t.docs.titre2}</em>.
            </h1>
            <p className="sous-titre" data-reveal>
              {t.docs.sous}
            </p>
          </div>
        </section>

        <section className="section docs" style={{ paddingTop: 0, border: 'none' }}>
          <div className="wrap">
            <div className="docs-grille" ref={reveal}>
              {t.docs.items.map((d) => (
                <article className="doc-carte" key={d.num} data-reveal>
                  <div className="doc-carte-haut">
                    <span className="doc-icone" aria-hidden>
                      <i className={`fa-solid ${d.icone}`} />
                    </span>
                    <span className="doc-num">§ {d.num}</span>
                  </div>
                  <h3>{d.titre}</h3>
                  <p>{d.texte}</p>
                  <span className="doc-statut">{d.label}</span>
                </article>
              ))}
            </div>

            <div className="docs-appel" data-reveal>
              <div>
                <h2 className="display-md">{t.docs.appel.titre}</h2>
                <p className="corps">{t.docs.appel.texte}</p>
              </div>
              <Link to="/" className="btn btn-encre">
                <span>{t.docs.appel.btn}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
};
