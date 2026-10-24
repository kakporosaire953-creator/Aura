import React, { useMemo, useState } from 'react';
import { useT } from '../app/prefs';
import { RESULTATS_EXPLORE, simulationActivee } from '../app/simulation';

/**
 * Explore — recherche sourcée. Interface de démonstration : les
 * résultats sont des contenus de démo clairement badgés ; la vraie
 * recherche sourcée arrivera avec l'API dédiée.
 */
export const ExplorePage: React.FC = () => {
  const t = useT();
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<string | null>(null);
  const sim = simulationActivee();

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return RESULTATS_EXPLORE.filter((r) => {
      const okFiltre = !filtre || r.motCle === filtre;
      const okTexte =
        !q ||
        r.titre.toLowerCase().includes(q) ||
        r.extrait.toLowerCase().includes(q) ||
        r.motCle.includes(q);
      return okFiltre && okTexte;
    });
  }, [recherche, filtre]);

  return (
    <div className="module-page">
      <section className="module wrap">
        <header className="module-entete">
          <span className="kicker">{t.explore.kicker}</span>
          <h1 className="display-xl">
            {t.explore.titre1} <em className="italique-vif">{t.explore.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.explore.sous}</p>
        </header>

        <form
          className="explore-barre"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            type="search"
            className="form-champ"
            placeholder={t.explore.placeholder}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label={t.explore.placeholder}
          />
          <button type="submit" className="btn btn-ruban">
            <i className="fa-solid fa-magnifying-glass" aria-hidden />
            <span>{t.explore.rechercher}</span>
          </button>
        </form>

        <div className="explore-filtres" role="group" aria-label={t.explore.filtreLabel}>
          <button
            type="button"
            className={filtre === null ? 'actif' : ''}
            onClick={() => setFiltre(null)}
          >
            {t.explore.tous}
          </button>
          {t.explore.filtres.map((f, i) => (
            <button
              type="button"
              key={f}
              className={filtre === RESULTATS_EXPLORE[i]?.motCle ? 'actif' : ''}
              onClick={() => setFiltre(RESULTATS_EXPLORE[i]?.motCle ?? null)}
            >
              {f}
            </button>
          ))}
        </div>

        <section className="explore-resultats" aria-label={t.explore.rechercher}>
          {sim && <span className="badge-sim">{t.simulation.badge}</span>}
          {resultats.length === 0 ? (
            <p className="corps explore-vide">{t.explore.vide}</p>
          ) : (
            resultats.map((r) => (
              <article className="explore-carte" key={r.titre}>
                <div className="explore-carte-haut">
                  <span className="explore-source">{r.source}</span>
                  <span className="explore-date">{r.date}</span>
                </div>
                <h2 className="display-md">{r.titre}</h2>
                <p className="corps">{r.extrait}</p>
                <div className="explore-pied">
                  <span className="explore-pastille">{r.motCle}</span>
                  <a href="#explore" className="explore-lien" aria-disabled="true">
                    {t.explore.ouvrir} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
                  </a>
                </div>
              </article>
            ))
          )}
        </section>

        <p className="module-note">{t.explore.note}</p>
      </section>

    </div>
  );
};
