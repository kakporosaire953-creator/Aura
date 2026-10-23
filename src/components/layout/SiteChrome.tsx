import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';

/** Navigation légère partagée — jamais surchargée. */
export const SiteNav: React.FC = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const { pathname } = useLocation();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const accueil = pathname === '/';

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} aria-label="Navigation principale">
      <div className="wrap nav-interieur">
        <Link to="/" aria-label="AURA — accueil">
          <AuraLogo taille="sm" />
        </Link>
        <ul className="nav-liens">
          <li>
            {accueil ? <a href="#galerie">Galerie</a> : <Link to="/#galerie">Galerie</Link>}
          </li>
          <li>
            <Link to="/documentation">Documentation</Link>
          </li>
          <li>
            {accueil ? <a href="#tarifs">Tarifs</a> : <Link to="/#tarifs">Tarifs</Link>}
          </li>
        </ul>
        <div className="nav-cta">
          <Link to="/login" className="btn btn-ligne">
            Connexion
          </Link>
          <Link to="/register" className="btn btn-encre">
            <span>Commencer</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

/** Pied de page partagé. */
export const SiteFooter: React.FC = () => (
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
              De l'idée au résultat.
            </div>
          </div>
        </div>
        <ul className="pied-liens">
          <li>
            <Link to="/#galerie">Galerie</Link>
          </li>
          <li>
            <Link to="/documentation">Documentation</Link>
          </li>
          <li>
            <Link to="/#tarifs">Tarifs</Link>
          </li>
          <li>
            <Link to="/login">Connexion</Link>
          </li>
        </ul>
      </div>
      <div className="pied-bas">
        <span>© {new Date().getFullYear()} Aura — tous droits réservés.</span>
        <span>Conçu autour d'une sculpture : trois rubans, une flamme.</span>
      </div>
    </div>
  </footer>
);
