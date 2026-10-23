import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SiteNav, SiteFooter } from '../components/layout/SiteChrome';
import { WorkspaceNav } from '../components/layout/WorkspaceNav';
import { useSession, appelerAuth } from '../app/session';
import { useT } from '../app/prefs';
import { simulationActivee } from '../app/simulation';

/**
 * Espace personnel — accessible uniquement avec une session réelle.
 * Le premier lancement guidé (onboarding) enregistre un objectif
 * sur le compte. Les modules du moteur en reconstruction sont
 * annoncés comme tels, jamais simulés.
 */
export const EspacePage: React.FC = () => {
  const t = useT();
  const { statut, compte, rafraichir, deconnecter } = useSession();
  const [objectif, setObjectif] = useState('');
  const [sauvegarde, setSauvegarde] = useState<'idle' | 'envoi' | 'fait' | 'erreur'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, string>>({});

  // État réel des modules (jamais supposé).
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d: { features?: Record<string, string> }) => {
        if (d.features) setModules(d.features);
      })
      .catch(() => setModules({}));
  }, []);

  if (statut === 'chargement') {
    return (
      <div className="espace">
        <SiteNav />
        <main className="section">
          <div className="wrap">
            <p className="corps" role="status">
              {t.espace.chargement}
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (statut === 'anonyme' || !compte) {
    return <Navigate to="/login" replace />;
  }

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSauvegarde('envoi');
    setErreur(null);
    const res = await appelerAuth(
      '/me/onboarding',
      { fait: true, objectif: objectif || compte.onboarding.objectif || '' },
      'PATCH',
    );
    if (res.ok && res.compte) {
      setSauvegarde('fait');
      await rafraichir();
    } else {
      setSauvegarde('erreur');
      setErreur(res.erreur ?? t.auth.errServeur);
    }
  };

  return (
    <div className="espace">
      <SiteNav />
      <WorkspaceNav />

      <header className="section espace-entete">
        <div className="wrap">
          <span className="kicker">{t.espace.kicker}</span>
          <h1 className="display-xl">
            {t.espace.titre1} <em className="italique-vif">{t.espace.titre2}</em>.
          </h1>
          <p className="sous-titre">{t.espace.sous}</p>
        </div>
      </header>

      <main className="section espace-grille-section">
        <div className="wrap espace-grille">
          {/* ── Compte ── */}
          <section className="espace-carte" aria-labelledby="espace-compte">
            <h2 id="espace-compte" className="display-md">
              {t.espace.carteCompte}
            </h2>
            <dl className="espace-liste">
              <div>
                <dt>{t.auth.email}</dt>
                <dd>{compte.email}</dd>
              </div>
              <div>
                <dt>{t.auth.nom}</dt>
                <dd>{compte.nom || '—'}</dd>
              </div>
              <div>
                <dt>{t.espace.membre}</dt>
                <dd>{new Date(compte.cree).toLocaleDateString()}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn-ligne"
              onClick={() => void deconnecter()}
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden />
              <span>{t.espace.deconnecter}</span>
            </button>
          </section>

          {/* ── Onboarding ── */}
          <section className="espace-carte espace-onboarding" aria-labelledby="espace-onb">
            <h2 id="espace-onb" className="display-md">
              {compte.onboarding.fait ? t.espace.onbFaitTitre : t.espace.onbTitre}
            </h2>
            {compte.onboarding.fait ? (
              <>
                <p className="corps">
                  {t.espace.onbObjectif} : <strong>{compte.onboarding.objectif || '—'}</strong>
                </p>
                <button
                  type="button"
                  className="btn btn-ligne"
                  onClick={() => {
                    setObjectif(compte.onboarding.objectif ?? '');
                    void rafraichir();
                    // repli du panneau vers le formulaire
                    document.getElementById('onb-form')?.classList.remove('invisible');
                    setSauvegarde('idle');
                  }}
                >
                  <span>{t.espace.onbModifier}</span>
                </button>
                <form id="onb-form" className="invisible" onSubmit={enregistrer}>
                  <ChampObjectif t={t} objectif={objectif} setObjectif={setObjectif} />
                  <BoutonEnvoi t={t} etat={sauvegarde} />
                </form>
              </>
            ) : (
              <form id="onb-form" onSubmit={enregistrer}>
                <p className="corps">{t.espace.onbSous}</p>
                <ChampObjectif t={t} objectif={objectif} setObjectif={setObjectif} />
                <BoutonEnvoi t={t} etat={sauvegarde} />
              </form>
            )}
            {erreur && (
              <p className="form-erreur" role="alert">
                {erreur}
              </p>
            )}
            {sauvegarde === 'fait' && !erreur && (
              <p className="form-note" role="status">
                {t.espace.onbEnregistre}
              </p>
            )}
          </section>

          {/* ── Les modules de l'espace de travail ── */}
          <section className="espace-carte espace-modules" aria-labelledby="espace-modules">
            <h2 id="espace-modules" className="display-md">
              {t.espace.modulesTitre}
            </h2>
            <div className="modules-grille">
              {t.modulesCartes.map((m, i) => {
                const idModule = ['chat', 'explore', 'studio', 'missions'][i];
                const href = ['/chat', '/explore', '/studio', '/missions'][i];
                const etatModule = simulationActivee() ? 'demo' : (modules[idModule] ?? 'rebuilding');
                const ouvrable = etatModule === 'demo' || etatModule === 'live';
                return (
                  <Link
                    to={ouvrable ? href : '#'}
                    className={`module-carte${ouvrable ? '' : ' inactif'}`}
                    key={m.nom}
                    aria-disabled={!ouvrable}
                  >
                    <i className={`fa-solid ${m.icone}`} aria-hidden />
                    <span className="module-carte-nom">{m.nom}</span>
                    <span className="module-carte-sous">{m.sous}</span>
                    <span className="module-carte-etat">
                      {etatModule === 'demo' ? (
                        <>
                          <i className="fa-solid fa-flask" aria-hidden /> {t.simulation.badge}
                        </>
                      ) : etatModule === 'live' ? (
                        <>
                          <i className="fa-solid fa-circle-check" aria-hidden /> {t.espace.dispo}
                        </>
                      ) : etatModule === 'setup-required' ? (
                        <>
                          <i className="fa-solid fa-screwdriver-wrench" aria-hidden />{' '}
                          {t.espace.aConfigurer}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-hammer" aria-hidden /> {t.espace.attente}
                        </>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
            <ul className="espace-modules-liste">
              <li>
                <span className="etat-live">
                  <i className="fa-solid fa-circle-check" aria-hidden /> {t.espace.dispo}
                </span>
                <Link to="/documentation">{t.espace.lienDocs}</Link>
              </li>
              <li>
                <span className="etat-live">
                  <i className="fa-solid fa-circle-check" aria-hidden /> {t.espace.dispo}
                </span>
                <Link to="/">{t.espace.sitePublic}</Link>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

const ChampObjectif: React.FC<{
  t: ReturnType<typeof useT>;
  objectif: string;
  setObjectif: (v: string) => void;
}> = ({ t, objectif, setObjectif }) => (
  <fieldset className="espace-objectifs">
    <legend className="form-groupe" style={{ border: 0, padding: 0 }}>
      {t.espace.objectifLabel}
    </legend>
    <div className="espace-objectifs-liste">
      {t.espace.objectifs.map((o) => (
        <label key={o} className={objectif === o ? 'choisi' : ''}>
          <input
            type="radio"
            name="objectif"
            value={o}
            checked={objectif === o}
            onChange={() => setObjectif(o)}
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

const BoutonEnvoi: React.FC<{ t: ReturnType<typeof useT>; etat: string }> = ({ t, etat }) => (
  <button
    type="submit"
    className="btn btn-ruban"
    disabled={etat === 'envoi'}
    style={{ marginTop: '1.2rem' }}
  >
    <span>{etat === 'envoi' ? t.espace.onbEnvoi : t.espace.onbEnregistrer}</span>
  </button>
);
