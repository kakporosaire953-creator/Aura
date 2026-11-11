import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BandeauSimulation } from './SiteChrome';
import { useT, usePrefs } from '../../app/prefs';
import { useSession } from '../../app/session';
import { simulationActivee, simulationDisponible, definirSimulation } from '../../app/simulation';
import { Icone } from '../ui/Icone';
import { useAdmin } from '../../app/admin';

/**
 * Coque du workspace — sidebar structurée (sections évolutives), barre
 * haute (fil d'Ariane, création rapide, profil) et zone de contenu.
 * Responsive : rail réductible (desktop), tiroir (tablette/mobile), barre
 * d'onglets basse (téléphone). La navigation est décrite par des données :
 * ajouter un module n'exige pas de modifier la structure du dashboard.
 */

type EntreeNav = { to: string; icone: string; label: string; fin?: boolean };

export const WorkspaceLayout: React.FC = () => {
  const t = useT();
  const { theme, toggleTheme, lang, setLang } = usePrefs();
  const { statut, compte, deconnecter } = useSession();
  const admin = useAdmin();
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
  const [menuCreation, setMenuCreation] = useState(false);
  // Bandeau de vérification d'adresse : informatif, refermable, jamais bloquant.
  const [masqueVerif, setMasqueVerif] = useState(false);
  const profilRef = useRef<HTMLDivElement | null>(null);
  const creationRef = useRef<HTMLDivElement | null>(null);
  const sim = simulationActivee();
  const simReglable = simulationDisponible();

  // Fermer les menus au changement de page.
  useEffect(() => {
    setTiroir(false);
    setMenuProfil(false);
    setMenuCreation(false);
  }, [location.pathname]);

  // Fermer au clic extérieur.
  useEffect(() => {
    const auClic = (e: MouseEvent) => {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) {
        setMenuProfil(false);
      }
      if (creationRef.current && !creationRef.current.contains(e.target as Node)) {
        setMenuCreation(false);
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

  // Navigation principale — données : ajouter une entrée suffit.
  const groupes: Array<{ titre: string; entrees: EntreeNav[] }> = [
    {
      titre: t.ws.navPrincipal,
      entrees: [
        { to: '/app', icone: 'house', label: t.ws.vueEnsemble, fin: true },
        { to: '/chat', icone: 'comment-dots', label: t.ws.assistant },
        { to: '/projets', icone: 'folder-open', label: t.ws.projetsNav },
        { to: '/explore', icone: 'compass', label: t.ws.explorerNav },
        { to: '/missions', icone: 'list-check', label: t.ws.missionsNav },
        { to: '/studio', icone: 'wand-magic-sparkles', label: t.ws.studioNav },
        { to: '/historique', icone: 'clock-rotate-left', label: t.ws.historiqueNav },
      ],
    },
    {
      titre: t.ws.navPersonnel,
      entrees: [
        { to: '/memoire', icone: 'brain', label: t.ws.memoireNav },
        { to: '/parametres', icone: 'sliders', label: t.ws.parametresNav },
        // Visible seulement si le serveur reconnaît un administrateur.
        ...(admin ? [{ to: '/admin', icone: 'shield-halved', label: t.admin.titre }] : []),
      ],
    },
  ];

  const tousLesLiens = groupes.flatMap((g) => g.entrees);
  const entreeActive =
    tousLesLiens.find((e) =>
      e.fin ? location.pathname === e.to : location.pathname.startsWith(e.to),
    ) ?? tousLesLiens[0];
  const section = entreeActive.label;

  // Fil d'Ariane léger : section > détail (projets/:id, chat/:id).
  const segments = location.pathname.split('/').filter(Boolean);
  const filAriane: Array<{ label: string; to?: string }> = [{ label: t.ws.vueEnsemble, to: '/app' }];
  if (entreeActive.to !== '/app') {
    filAriane.push({ label: section, to: entreeActive.to });
  }
  if (segments.length > 2 && location.pathname.startsWith('/projets/')) {
    filAriane.push({ label: segments[2] });
  }

  const prenom = (compte?.nom ?? '').trim().split(' ')[0];

  return (
    <div className={`ws${repliee ? ' ws-repliee' : ''}`}>
      <a href="#contenu" className="lien-evitement">
        {t.nav.contenu}
      </a>
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
            <Icone nom="bars" />
          </button>
          <button
            type="button"
            className="ws-replier"
            aria-label={t.workspace.replier}
            onClick={basculerRail}
          >
            <Icone nom="bars-staggered" />
          </button>
          <nav className="ws-fil" aria-label="Fil d’Ariane">
            {filAriane.map((f, i) => (
              <React.Fragment key={`${f.label}-${i}`}>
                {i > 0 && <span className="ws-fil-sep" aria-hidden="true">/</span>}
                {f.to && i < filAriane.length - 1 ? (
                  <Link to={f.to}>{f.label}</Link>
                ) : (
                  <span aria-current="page">{f.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="ws-topbar-droite">
          <div className="ws-menu-wrap" ref={creationRef}>
            <button
              type="button"
              className="ws-creation"
              aria-expanded={menuCreation}
              aria-label={t.ws.actionsRapides}
              onClick={() => setMenuCreation((v) => !v)}
            >
              <Icone nom="plus" />
              <span className="ws-creation-label">{t.ws.nouvelleConv}</span>
            </button>
            {menuCreation && (
              <div className="ws-panneau ws-panneau-creation">
                <button type="button" onClick={() => navigate('/chat', { state: { nouveau: true } })}>
                  <Icone nom="comment-dots" /> {t.ws.nouvelleConv}
                </button>
                <button type="button" onClick={() => navigate('/projets', { state: { creer: true } })}>
                  <Icone nom="folder-plus" /> {t.ws.nouveauProjet}
                </button>
                <button type="button" onClick={() => navigate('/missions', { state: { creer: true } })}>
                  <Icone nom="list-check" /> {t.ws.nouvelleMission}
                </button>
              </div>
            )}
          </div>
          {simReglable && (
            <button
              type="button"
              className={`bascule-sim${sim ? ' actif' : ''}`}
              title={sim ? t.simulation.quitter : t.simulation.reprendre}
              onClick={() => definirSimulation(!sim)}
            >
              <Icone nom="flask" />
            </button>
          )}
          <button
            type="button"
            className="bascule-theme ws-cercle"
            aria-label={theme === 'dark' ? t.workspace.modeClair : t.workspace.modeSombre}
            onClick={toggleTheme}
          >
            <Icone nom={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
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
              <Icone nom="chevron-down" className="ws-profil-fleche" />
            </button>
            {menuProfil && (
              <div className="ws-panneau ws-panneau-profil">
                <div className="ws-panneau-identite">
                  <strong>{compte?.nom ?? t.workspace.nonConnecte}</strong>
                  <span>{compte?.email ?? ''}</span>
                </div>
                <Link to="/parametres" className="ws-panneau-lien">
                  <Icone nom="gear" /> {t.workspace.parametres}
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
                    <Icone nom="arrow-right-from-bracket" />{' '}
                    {t.workspace.deconnexion}
                  </button>
                ) : (
                  <Link to="/login" className="ws-panneau-lien">
                    <Icone nom="arrow-right-to-bracket" />{' '}
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
            <Icone nom="xmark" />
          </button>
        </div>

        <nav className="ws-nav-side" aria-label={t.workspace.menu}>
          {groupes.map((g) => (
            <div className="ws-nav-groupe" key={g.titre}>
              <p className="ws-nav-groupe-titre">{g.titre}</p>
              {g.entrees.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.fin}
                  className={({ isActive }) => (isActive ? 'actif' : undefined)}
                >
                  <Icone nom={item.icone} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="ws-sidebar-bas">
          <Link to="/memoire" className={`ws-lien-simple${location.pathname === '/memoire' ? ' actif' : ''}`}>
            <Icone nom="brain" /> <span>{t.ws.memoireNav}</span>
          </Link>
          <Link to="/parametres" className="ws-user">
            <span className="ws-avatar" aria-hidden="true">
              {(prenom || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="ws-user-texte">
              <strong>{compte?.nom ?? t.workspace.nonConnecte}</strong>
              <em>{compte?.email ?? t.workspace.seConnecter}</em>
            </span>
            <Icone nom="chevron-right" />
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
      <main className="ws-main" id="contenu">
        {statut === 'connecte' && !sim && compte?.emailVerifie !== true && !masqueVerif && (
          <div className="bandeau-verif" role="status">
            <span>
              <Icone nom="paper-plane" /> {t.securite.emailBandeau}
            </span>
            <span className="bandeau-verif-actions">
              <Link to="/parametres">{t.securite.emailRenvoyer}</Link>
              <button
                type="button"
                onClick={() => setMasqueVerif(true)}
                aria-label={t.workspace.fermer}
              >
                ×
              </button>
            </span>
          </div>
        )}
        <Outlet />
      </main>

      {/* — Barre d'onglets basse (téléphone) — */}
      <nav className="ws-bottom" aria-label={t.workspace.menu}>
        {groupes[0].entrees.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.fin}
            title={item.label}
            className={({ isActive }) => (isActive ? 'actif' : undefined)}
          >
            <span className="ws-bottom-icone">
              <Icone nom={item.icone} />
            </span>
            {/* Icônes seules à l'écran ; le libellé reste lisible par les
                lecteurs d'écran (nom accessible du lien). */}
            <span className="ws-bottom-libelle">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
