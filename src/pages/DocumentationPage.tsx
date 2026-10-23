import React from 'react';
import { Link } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { useRevealAll } from '../components/motion/useReveal';

const DOCS = [
  {
    num: '01',
    icone: 'fa-rocket',
    titre: 'Démarrage',
    texte:
      "Créer son espace, comprendre le fil et poser sa première intention. Les premiers gestes, pas à pas, sans jargon.",
    etat: 'redaction',
    label: 'En rédaction',
  },
  {
    num: '02',
    icone: 'fa-film',
    titre: 'Le fil Aura',
    texte:
      "Conversation, contexte, mémoire de projet : bien penser avec Aura, garder le fil du début à la fin.",
    etat: 'redaction',
    label: 'En rédaction',
  },
  {
    num: '03',
    icone: 'fa-magnifying-glass',
    titre: 'Recherche sourcée',
    texte:
      "Interroger le web, lire les citations, vérifier, comparer, citer. La confiance naît de la preuve.",
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '04',
    icone: 'fa-wand-magic-sparkles',
    titre: 'Studio & créations',
    texte:
      "Générer, itérer, versionner, prévisualiser et exporter proprement — du prompt au livrable.",
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '05',
    icone: 'fa-users',
    titre: 'Comptes & équipes',
    texte:
      "Profils, espaces partagés, rôles et tranquillité des données. Travailler ensemble, sereinement.",
    etat: 'planifie',
    label: 'À venir',
  },
  {
    num: '06',
    icone: 'fa-code',
    titre: 'API & développeurs',
    texte:
      "Brancher Aura dans vos outils — avec des limites claires et une documentation honnête.",
    etat: 'planifie',
    label: 'À venir',
  },
];

export const DocumentationPage: React.FC = () => {
  const reveal = useRevealAll<HTMLDivElement>();

  return (
    <>
      <SiteNav />

      <main>
        <section className="section docs-page-hero">
          <div className="wrap">
            <span className="kicker" data-reveal>
              Documentation
            </span>
            <h1 className="display-xl" data-reveal>
              Tout au même endroit,{' '}
              <em className="italique-vif">écrit au fil du chantier</em>.
            </h1>
            <p className="sous-titre" data-reveal>
              Guides, réflexes, références : la documentation d'Aura grandit en
              même temps que le produit — avec la même honnêteté. Les chapitres
              s'ouvrent au fur et à mesure de leur rédaction.
            </p>
          </div>
        </section>

        <section className="section docs" style={{ paddingTop: 0, border: 'none' }}>
          <div className="wrap">
            <div className="docs-grille" ref={reveal}>
              {DOCS.map((d) => (
                <article className="doc-carte" key={d.num} data-reveal>
                  <div className="doc-carte-haut">
                    <span className="doc-icone" aria-hidden>
                      <i className={`fa-solid ${d.icone}`} />
                    </span>
                    <span className="doc-num">§ {d.num}</span>
                  </div>
                  <h3>{d.titre}</h3>
                  <p>{d.texte}</p>
                  <span className="doc-statut" data-etat={d.etat}>
                    {d.label}
                  </span>
                </article>
              ))}
            </div>

            <div className="docs-appel" data-reveal>
              <div>
                <h2 className="display-md">Un chapitre manque ?</h2>
                <p className="corps">
                  La documentation se construit avec les vraies questions du
                  chantier. Le fil continue — les réponses suivront ici.
                </p>
              </div>
              <Link to="/" className="btn btn-encre">
                <span>Revenir à l'accueil</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
};
