import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT, usePrefs } from '../app/prefs';
import { simulationActivee, FILS_DEMO } from '../app/simulation';
import { listerFils, supprimerFil, ilYATexte, type FilLocal } from '../app/historique';

/**
 * Historique — vrais fils stockés sur l'appareil, plus les
 * conversations de démonstration badgées en simulation.
 * Aucun envoi réseau : tout est local, et l'interface le dit.
 */
export const HistoriquePage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const navigate = useNavigate();
  const sim = simulationActivee();
  const [fils, setFils] = useState<FilLocal[]>([]);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    setFils(listerFils());
  }, []);

  const filtres = fils.filter((f) =>
    f.titre.toLowerCase().includes(recherche.trim().toLowerCase()),
  );
  const demos = FILS_DEMO.filter((f) =>
    (lang === 'en' ? f.titreEn : f.titre).toLowerCase().includes(recherche.trim().toLowerCase()),
  );

  const supprimer = (id: string) => {
    supprimerFil(id);
    setFils(listerFils());
  };

  return (
    <div className="module-page-historique module">
      <header className="module-entete">
        <p className="kicker">{t.historique.kicker}</p>
        <h1 className="titre-section">
          {t.historique.titre1} <em className="italique-vif">{t.historique.titre2}</em>
        </h1>
        <p className="sous-titre">{t.historique.sous}</p>
      </header>

      <div className="explore-barre">
        <input
          type="search"
          className="champ"
          placeholder={t.historique.recherchePlaceholder}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label={t.historique.recherchePlaceholder}
        />
      </div>

      {sim && (
        <section className="historique-section">
          <h2 className="historique-section-titre">
            {t.historique.sectionDemo} <span className="badge-sim">{t.simulation.badge}</span>
          </h2>
          <div className="historique-liste">
            {demos.map((f) => (
              <div key={f.id} className="historique-carte demo">
                <div className="historique-carte-texte">
                  <strong>{lang === 'en' ? f.titreEn : f.titre}</strong>
                  <em>{lang === 'en' ? f.apercuEn : f.apercu}</em>
                </div>
                <span className="historique-quand">{lang === 'en' ? f.quandEn : f.quandFr}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="historique-section">
        <h2 className="historique-section-titre">{t.historique.sectionLocal}</h2>
        {filtres.length === 0 ? (
          <p className="explore-vide">{t.historique.vide}</p>
        ) : (
          <div className="historique-liste">
            {filtres.map((f) => (
              <div key={f.id} className="historique-carte">
                <button
                  type="button"
                  className="historique-carte-texte"
                  onClick={() => navigate('/chat', { state: { fil: f } })}
                >
                  <strong>{f.titre}</strong>
                  <em>
                    {f.messages.length} {t.historique.messages} · {ilYATexte(f.date, lang)}
                  </em>
                </button>
                <div className="historique-actions">
                  <button
                    type="button"
                    className="historique-ouvrir"
                    onClick={() => navigate('/chat', { state: { fil: f } })}
                  >
                    {t.historique.ouvrir}
                  </button>
                  <button
                    type="button"
                    className="historique-supprimer"
                    aria-label={t.historique.supprimer}
                    onClick={() => supprimer(f.id)}
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="module-note">{t.historique.note}</p>
      </section>

      <p className="module-note">
        <Link to="/chat" className="btn-ligne">
          {t.workspace.nouveauChat} <i className="fa-solid fa-arrow-right" />
        </Link>
      </p>
    </div>
  );
};
