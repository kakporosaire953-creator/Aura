import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BandeauSimulation } from './SiteChrome';
import { useT, usePrefs } from '../../app/prefs';
import { useSession } from '../../app/session';
import { simulationActivee, definirSimulation } from '../../app/simulation';

/**
 * Coque du workspace — sidebar persistante + barre haute + contenu.
 * Responsive : rail réductible (desktop), tiroir (tablette/mobile),
 * barre d'onglets basse (téléphone). Respecte la règle d'honnêteté :
 * le bandeau simulation reste visible en haut de chaque écran.
 */
export const WorkspaceLayout: React.FC = () => {
  const t = useT();
  const { theme, toggleTheme, lang, setLang } = usePrefs();
  const { statut, compte, deconnecter } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [repliee, setRepliee] = useState(() => {
    try {
      return localStorage.getItem('workspace_sidebar') === 'repliee';
    } catch {
      return false;
    }
  });
  const [tiroir, setTiroir] = useState(false);
  const [menuProfil, setMenuProfil] = useState(false);
  const [cloche, setCloche] = useState(false);
  const profilRef = useRef<HTMLDivElement | null>(null);
  const sim = simulationActivee();

  // Fermer les menus au changement de page.
  useEffect(() => {
    setTiroir(false);
    setMenuProfil(false);
    setCloche(false);
  }, [location.pathname]);

  // Fermer au clic extérieur (menu profil).
  useEffect(() => {
    const auClic = (e: MouseEvent) => {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) {
        setMenuProfil(false);
      }
    };
    document.addEventListener('mousedown', auClic);
    return () => document.removeEventListener('mousedown', auClic);
  }, []);

  const basculerRail = () => {
    setRepliee((v) => {
      const suivant = !v;
      try {
        localStorage.setItem('workspace_sidebar', suivant ? 'repliee' : 'deployee');
      } catch {
        /* ignoré */
      }
      return suivant;
    });
  };

  const principaux = [
    { to: '/app', icone: 'fa-house', label: t.workspace.accueil, fin: true },
    { to: '/chat', icone: 'fa-comment-dots', label: t.workspace.nouveauChat },
    { to: '/historique', icone: 'fa-clock-rotate-left', label: t.workspace.historique },
    { to: '/missions', icone: 'fa-list-check', label: t.workspace.missions },
    { to: '/studio', icone: 'fa-wand-magic-sparkles', label: t.workspace.studio },
    { to: '/explore', icone: 'fa-compass', label: t.workspace.explore },
  ];

  const sections: Record<string, string> = {
    '/app': t.workspace.accueil,
    '/chat': t.workspace.chat,
    '/historique': t.workspace.historique,
    '/missions': t.workspace.missions,
    '/studio': t.workspace.studio,
    '/explore': t.workspace.explore,
    '/parametres': t.workspace.parametres,
  };
  const section = sections[location.pathname] ?? t.workspace.accueil;

  const prenom = (compte?.nom ?? '').trim().split(' ')[0];

  return (
    <div className={`ws${repliee ? ' ws-repliee' : ''}`}>
      <BandeauSimulation />

      {/* — Barre haute — */}
      <header className="ws-topbar">
        <div className="ws-topbar-gauche">
          <button
            type="button"
            className="ws-burger"
            aria-label={t.workspace.menu}
            onClick={() => setTiroir(true)}
          >
            <i className="fa-solid fa-bars" />
          </button>
          <button
            type="button"
            className="ws-replier"
            aria-label={t.workspace.replier}
            onClick={basculerRail}
          >
            <i className="fa-solid fa-bars-staggered" />
          </button>
          <span className="ws-fil">{section}</span>
        </div>
        <div className="ws-topbar-droite">
          <button
            type="button"
            className={`bascule-sim${sim ? ' actif' : ''}`}
            title={sim ? t.simulation.quitter : t.simulation.reprendre}
            onClick={() => definirSimulation(!sim)}
          >
            <i className="fa-solid fa-flask" />
          </button>
          <button
            type="button"
            className="bascule-theme ws-cercle"
            aria-label={theme === 'dark' ? t.workspace.modeClair : t.workspace.modeSombre}
            onClick={toggleTheme}
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
          </button>
          <span className="ws-plan">
            <span className="ws-plan-point" />
            {t.workspace.planGratuit}
          </span>
          <div className="ws-menu-wrap">
            <button
              type="button"
              className="ws-cercle ws-cloche"
              aria-label={t.workspace.notifications}
              onClick={() => setCloche((v) => !v)}
            >
              <i className="fa-solid fa-bell" />
            </button>
            {cloche && (
              <div className="ws-panneau" role="status">
                {t.workspace.aucuneNotif}
              </div>
            )}
          </div>
          <div className="ws-menu-wrap" ref={profilRef}>
            <button
              type="button"
              className="ws-profil"
              onClick={() => setMenuProfil((v) => !v)}
              aria-expanded={menuProfil}
            >
              <span className="ws-avatar" aria-hidden="true">
                {(prenom || '?').slice(0, 1).toUpperCase()}
              </span>
              <i className="fa-solid fa-chevron-down ws-profil-fleche" />
            </button>
            {menuProfil && (
              <div className="ws-panneau ws-panneau-profil">
                <div className="ws-panneau-identite">
                  <strong>{compte?.nom ?? t.workspace.nonConnecte}</strong>
                  <span>{compte?.email ?? ''}</span>
                </div>
                <Link to="/parametres" className="ws-panneau-lien">
                  <i className="fa-solid fa-gear" /> {t.workspace.parametres}
                </Link>
                <div className="ws-panneau-langues" role="group" aria-label="Langue">
                  <button
                    type="button"
                    className={lang === 'fr' ? 'actif' : ''}
                    onClick={() => setLang('fr')}
                  >
                    FR
                  </button>
                  <button
                    type="button"
                    className={lang === 'en' ? 'actif' : ''}
                    onClick={() => setLang('en')}
                  >
                    EN
                  </button>
                </div>
                {statut === 'connecte' ? (
                  <button
                    type="button"
                    className="ws-panneau-lien"
                    onClick={async () => {
                      await deconnecter();
                      navigate('/login');
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket" />{' '}
                    {t.workspace.deconnexion}
                  </button>
                ) : (
                  <Link to="/login" className="ws-panneau-lien">
                    <i className="fa-solid fa-arrow-right-to-bracket" />{' '}
                    {t.workspace.seConnecter}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* — Sidebar — */}
      <aside className={`ws-sidebar${tiroir ? ' ws-tiroir-ouvert' : ''}`}>
        <div className="ws-sidebar-haut">
          <Link to="/app" className="ws-logo">
            <img src="/assets/aura-symbol.png" alt="" width={36} height={36} />
            <span>Aura</span>
          </Link>
          <button
            type="button"
            className="ws-fermer-tiroir"
            aria-label={t.workspace.fermer}
            onClick={() => setTiroir(false)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav className="ws-nav-side" aria-label={t.workspace.menu}>
          {principaux.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fin}
              className={({ isActive }) => (isActive ? 'actif' : undefined)}
            >
              <i className={`fa-solid ${item.icone}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ws-sidebar-bas">
          <Link to="/tarifs" className="ws-plus">
            <i className="fa-solid fa-crown" />
            <strong>{t.workspace.plus}</strong>
            <span>{t.workspace.plusSous}</span>
            <em>{t.workspace.plusBtn} →</em>
          </Link>
          <NavLink
            to="/parametres"
            className={({ isActive }) => `ws-lien-simple${isActive ? ' actif' : ''}`}
          >
            <i className="fa-solid fa-gear" /> <span>{t.workspace.parametres}</span>
          </NavLink>
          <Link to="/parametres" className="ws-user">
            <span className="ws-avatar" aria-hidden="true">
              {(prenom || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="ws-user-texte">
              <strong>{compte?.nom ?? t.workspace.nonConnecte}</strong>
              <em>{compte?.email ?? t.workspace.seConnecter}</em>
            </span>
            <i className="fa-solid fa-chevron-right" />
          </Link>
        </div>
      </aside>

      {/* — Voile du tiroir mobile — */}
      {tiroir && (
        <button
          type="button"
          className="ws-voile"
          aria-label={t.workspace.fermer}
          onClick={() => setTiroir(false)}
        />
      )}

      {/* — Contenu — */}
      <main className="ws-main">
        <Outlet />
      </main>

      {/* — Barre d'onglets basse (téléphone) — */}
      <nav className="ws-bottom" aria-label={t.workspace.menu}>
        {principaux.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.fin}
            className={({ isActive }) => (isActive ? 'actif' : undefined)}
          >
            <i className={`fa-solid ${item.icone}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
