import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { usePrefs } from '../../app/prefs';
import { useSession } from '../../app/session';
import { simulationActivee, definirSimulation } from '../../app/simulation';
import { Icone } from '../ui/Icone';

/** Bannière permanente du mode simulation — jamais de contenu simulé sans étiquette. */
export const BandeauSimulation: React.FC = () => {
  const { t } = usePrefs();
  const [active] = React.useState(() => simulationActivee());
  if (!active) return null;
  return (
    <div className="bandeau-sim" role="status">
      <Icone nom="flask" />
      <span>{t.simulation.banniere}</span>
      <button type="button" onClick={() => definirSimulation(false)}>
        {t.simulation.quitter}
      </button>
    </div>
  );
};

/** Navigation légère partagée — jamais surchargée. */
export const SiteNav: React.FC = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOuvert, setMenuOuvert] = React.useState(false);
  const burgerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const { t, theme, toggleTheme, lang, setLang } = usePrefs();
  const { statut } = useSession();
  const sim = React.useState(() => simulationActivee())[0];

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menu mobile : Échap referme et rend le focus ; piège à focus dans le
  // panneau ; verrouillage du défilement d'arrière-plan ; fermeture après
  // sélection ; fermeture au second clic du burger (bascule).
  React.useEffect(() => {
    if (!menuOuvert) return;
    const precedent = document.activeElement as HTMLElement | null;
    const onTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOuvert(false);
        burgerRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && menuRef.current) {
        const elements = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        );
        if (!elements.length) return;
        const premier = elements[0];
        const dernier = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault();
          dernier.focus();
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault();
          premier.focus();
        }
      }
    };
    document.addEventListener('keydown', onTouche);
    const verrou = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onTouche);
      document.body.style.overflow = verrou;
      precedent?.focus?.();
    };
  }, [menuOuvert]);

  React.useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  const basculeLangue = (
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
  );
  const basculeTheme = (
    <button
      type="button"
      className="nav-icone"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? t.nav.themeClair : t.nav.themeSombre}
    >
      <Icone nom={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} aria-label={t.nav.ariaLabel}>
      <a href="#contenu" className="lien-evitement">
        {t.nav.contenu}
      </a>
      <BandeauSimulation />
      <div className="wrap nav-interieur">
        <Link to="/" aria-label="AURA — accueil">
          <AuraLogo taille="sm" />
        </Link>

        <ul className="nav-liens">
          <li>
            <Link to="/chat">{t.nav.chat}</Link>
          </li>
          <li>
            <Link to="/#galerie">{t.nav.galerie}</Link>
          </li>
          <li>
            <Link to="/documentation">{t.nav.documentation}</Link>
          </li>
          <li>
            <Link to="/#tarifs">{t.nav.tarifs}</Link>
          </li>
        </ul>

        <div className="nav-cta">
          <div className="nav-outils">
            {basculeLangue}
            {basculeTheme}
            <button
              type="button"
              className={`bascule-sim${sim ? ' actif' : ''}`}
              onClick={() => definirSimulation(!sim)}
              aria-pressed={sim}
              title={sim ? t.simulation.quitter : t.simulation.reprendre}
            >
              <Icone nom="flask" />
            </button>
          </div>
          {statut === 'connecte' ? (
            <Link to="/app" className="btn btn-encre">
              <Icone nom="user" />
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

        {/* Burger mobile : bascule ouverture/fermeture (second clic = ferme). */}
        <button
          type="button"
          ref={burgerRef}
          className={`nav-burger${menuOuvert ? ' actif' : ''}`}
          aria-expanded={menuOuvert}
          aria-controls="nav-menu-mobile"
          aria-label={menuOuvert ? t.nav.menuFermer : t.nav.menuOuvrir}
          onClick={() => setMenuOuvert((o) => !o)}
        >
          <Icone nom={menuOuvert ? 'xmark' : 'bars'} />
        </button>
      </div>

      {/* Menu mobile plein écran : navigation, langue, thème, actions. */}
      {menuOuvert && (
        <div
          className="nav-mobile-fond visible"
          aria-hidden
          onMouseDown={() => setMenuOuvert(false)}
        />
      )}
      <div
        id="nav-menu-mobile"
        ref={menuRef}
        className={`nav-mobile${menuOuvert ? ' ouvert' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.nav.menuOuvrir}
      >
        <ul className="nav-mobile-liens">
          <li>
            <Link to="/chat" onClick={() => setMenuOuvert(false)}>
              {t.nav.chat}
            </Link>
          </li>
          <li>
            <Link to="/#galerie" onClick={() => setMenuOuvert(false)}>
              {t.nav.galerie}
            </Link>
          </li>
          <li>
            <Link to="/documentation" onClick={() => setMenuOuvert(false)}>
              {t.nav.documentation}
            </Link>
          </li>
          <li>
            <Link to="/#tarifs" onClick={() => setMenuOuvert(false)}>
              {t.nav.tarifs}
            </Link>
          </li>
        </ul>

        <div className="nav-mobile-outils">
          {basculeLangue}
          {basculeTheme}
        </div>

        <div className="nav-mobile-actions">
          {statut === 'connecte' ? (
            <Link to="/app" className="btn btn-encre" onClick={() => setMenuOuvert(false)}>
              <Icone nom="user" />
              <span>{t.espace.kicker}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ligne" onClick={() => setMenuOuvert(false)}>
                {t.nav.connexion}
              </Link>
              <Link to="/register" className="btn btn-encre" onClick={() => setMenuOuvert(false)}>
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
