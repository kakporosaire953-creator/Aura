import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT, usePrefs } from '../app/prefs';
import { useSession } from '../app/session';
import { simulationActivee, definirSimulation } from '../app/simulation';

/**
 * Paramètres — uniquement des réglages réels : langue, thème,
 * simulation, session, liens. Aucun faux réglage.
 */
export const ParametresPage: React.FC = () => {
  const t = useT();
  const { lang, setLang, theme, setTheme } = usePrefs();
  const { statut, compte, deconnecter } = useSession();
  const navigate = useNavigate();
  const sim = simulationActivee();

  return (
    <div className="module-page-parametres module">
      <header className="module-entete">
        <p className="kicker">{t.parametres.kicker}</p>
        <h1 className="titre-section">
          {t.parametres.titre1} <em className="italique-vif">{t.parametres.titre2}</em>
        </h1>
        <p className="sous-titre">{t.parametres.sous}</p>
      </header>

      <section className="param-section">
        <h2>{t.parametres.compte}</h2>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.compteNom}</span>
          <strong>{compte?.nom ?? '—'}</strong>
        </div>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.compteEmail}</span>
          <strong>{compte?.email ?? '—'}</strong>
        </div>
      </section>

      <section className="param-section">
        <h2>{t.parametres.apparence}</h2>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.themeLabel}</span>
          <div className="param-choix" role="group" aria-label={t.parametres.themeLabel}>
            <button
              type="button"
              className={theme === 'light' ? 'actif' : ''}
              onClick={() => setTheme('light')}
            >
              <i className="fa-solid fa-sun" /> {t.parametres.themeClair}
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'actif' : ''}
              onClick={() => setTheme('dark')}
            >
              <i className="fa-solid fa-moon" /> {t.parametres.themeSombre}
            </button>
          </div>
        </div>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.langue}</span>
          <div className="param-choix" role="group" aria-label={t.parametres.langue}>
            <button type="button" className={lang === 'fr' ? 'actif' : ''} onClick={() => setLang('fr')}>
              Français
            </button>
            <button type="button" className={lang === 'en' ? 'actif' : ''} onClick={() => setLang('en')}>
              English
            </button>
          </div>
        </div>
      </section>

      <section className="param-section">
        <h2>{t.parametres.simulation}</h2>
        <p className="corps">{t.parametres.simulationSous}</p>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.simulationEtat}</span>
          <div className="param-choix">
            <button
              type="button"
              className={sim ? 'actif' : ''}
              onClick={() => {
                if (!sim) definirSimulation(true);
              }}
            >
              {t.parametres.simActive}
            </button>
            <button
              type="button"
              className={!sim ? 'actif' : ''}
              onClick={() => {
                if (sim) definirSimulation(false);
              }}
            >
              {t.parametres.simInactive}
            </button>
          </div>
        </div>
      </section>

      <section className="param-section">
        <h2>{t.parametres.session}</h2>
        {statut === 'connecte' ? (
          <button
            type="button"
            className="btn-ligne"
            onClick={async () => {
              await deconnecter();
              navigate('/login');
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket" /> {t.parametres.deconnexion}
          </button>
        ) : (
          <Link to="/login" className="btn-primaire">
            {t.workspace.seConnecter}
          </Link>
        )}
      </section>

      <section className="param-section">
        <h2>{t.parametres.aPropos}</h2>
        <p className="corps">{t.parametres.aProposTexte}</p>
        <div className="param-liens">
          <Link to="/documentation" className="btn-ligne">
            {t.parametres.docs}
          </Link>
          <Link to="/tarifs" className="btn-ligne">
            {t.parametres.tarifs}
          </Link>
        </div>
      </section>
    </div>
  );
};
