import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { usePrefs } from '../../app/prefs';
import { useSession } from '../../app/session';

/** Navigation légère partagée — jamais surchargée. */
export const SiteNav: React.FC = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const { pathname } = useLocation();
  const { t, theme, toggleTheme, lang, setLang } = usePrefs();
  const { statut } = useSession();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const accueil = pathname === '/';

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} aria-label={t.nav.documentation}>
      <div className="wrap nav-interieur">
        <Link to="/" aria-label="AURA — accueil">
          <AuraLogo taille="sm" />
        </Link>
        <ul className="nav-liens">
          <li>
            <Link to="/chat">{t.nav.chat}</Link>
          </li>
          <li>
            {accueil ? <a href="#galerie">{t.nav.galerie}</a> : <Link to="/#galerie">{t.nav.galerie}</Link>}
          </li>
          <li>
            <Link to="/documentation">{t.nav.documentation}</Link>
          </li>
          <li>
            {accueil ? <a href="#tarifs">{t.nav.tarifs}</a> : <Link to="/#tarifs">{t.nav.tarifs}</Link>}
          </li>
        </ul>
        <div className="nav-cta">
          <div className="nav-outils">
            <div className="bascule-langue" role="group" aria-label="Langue / Language">
              <button
                type="button"
                className={lang === 'fr' ? 'actif' : ''}
                aria-pressed={lang === 'fr'}
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                type="button"
                className={lang === 'en' ? 'actif' : ''}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              className="bascule-theme"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.nav.themeClair : t.nav.themeSombre}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden />
            </button>
          </div>
          {statut === 'connecte' ? (
            <Link to="/app" className="btn btn-encre">
              <i className="fa-solid fa-user" aria-hidden />
              <span>{t.espace.kicker}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ligne">
                {t.nav.connexion}
              </Link>
              <Link to="/register" className="btn btn-encre">
                <span>{t.nav.commencer}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

/** Pied de page partagé. */
export const SiteFooter: React.FC = () => {
  const { t } = usePrefs();
  const { statut } = useSession();
  return (
    <footer className="pied">
      <div className="wrap">
        <div className="pied-haut">
          <div className="pied-marque">
            <img src="/assets/aura-symbol.svg" alt="" aria-hidden />
            <div>
              <div className="display-md" style={{ fontSize: '1.5rem' }}>
                Aura
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                {t.intro.tagline.charAt(0) + t.intro.tagline.slice(1).toLowerCase()}.
              </div>
            </div>
          </div>
          <ul className="pied-liens">
            <li>
              <Link to="/#galerie">{t.nav.galerie}</Link>
            </li>
            <li>
              <Link to="/documentation">{t.nav.documentation}</Link>
            </li>
            <li>
              <Link to="/#tarifs">{t.nav.tarifs}</Link>
            </li>
            <li>
              {statut === 'connecte' ? (
                <Link to="/app">{t.espace.kicker}</Link>
              ) : (
                <Link to="/login">{t.nav.connexion}</Link>
              )}
            </li>
          </ul>
        </div>
        <div className="pied-bas">
          <span>
            © {new Date().getFullYear()} Aura — {t.pied.droits}
          </span>
          <span>{t.pied.credits}</span>
        </div>
      </div>
    </footer>
  );
};
