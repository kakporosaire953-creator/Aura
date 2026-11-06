import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT, usePrefs } from '../app/prefs';
import { useSession } from '../app/session';
import { simulationActivee, simulationDisponible, definirSimulation } from '../app/simulation';
import { Dialogue } from '../components/ui/Primitives';
import * as api from '../services/api';
import type { CompteV1 } from '../services/types';
import { Icone } from '../components/ui/Icone';
import { SecuriteCompte } from '../components/auth/SecuriteCompte';

/**
 * Paramètres — réglages réels uniquement : compte, profil contextuel
 * (AURA Local), préférences de réponse, apparence, simulation, session.
 * Les formulaires écrivent via l'API v1 (persistance serveur) ; en mode
 * simulation, dans le stockage local étiqueté.
 */
export const ParametresPage: React.FC = () => {
  const t = useT();
  const { lang, setLang, theme, setTheme } = usePrefs();
  const { statut, compte, deconnecter, rafraichir } = useSession();
  const navigate = useNavigate();
  const sim = simulationActivee();
  const simDisponible = simulationDisponible();

  const [profil, setProfil] = useState<CompteV1['profil'] | null>(null);
  const [prefs, setPrefs] = useState<CompteV1['preferences'] | null>(null);
  const [etatSauvegarde, setEtatSauvegarde] = useState<'idle' | 'envoi' | 'fait' | 'erreur'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);
  const [dialogueSuppression, setDialogueSuppression] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [etatSuppression, setEtatSuppression] = useState<'idle' | 'envoi' | 'erreur'>('idle');
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await api.lireCompte();
      if (r.ok) {
        setProfil(r.donnees.compte.profil);
        setPrefs(r.donnees.compte.preferences);
      }
    })();
  }, []);

  const enregistrer = async () => {
    if (!profil || !prefs) return;
    setEtatSauvegarde('envoi');
    setErreur(null);
    const [r1, r2] = await Promise.all([api.majCompte({ profil }), api.majPreferences(prefs)]);
    if (r1.ok && r2.ok) {
      setEtatSauvegarde('fait');
      await rafraichir();
      setTimeout(() => setEtatSauvegarde('idle'), 2000);
    } else {
      setEtatSauvegarde('erreur');
      setErreur((!r1.ok && r1.erreur) || (!r2.ok && r2.erreur) || t.accueil.erreurGenerique);
    }
  };

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

      {/* — Sécurité : adresse, mot de passe, sessions actives — */}
      <SecuriteCompte />

      {/* — Profil contextuel (AURA Local) — */}
      {profil && (
        <section className="param-section">
          <h2>
            <Icone nom="earth-africa" /> {t.ws.profilContextuel}
          </h2>
          <p className="corps">{t.ws.profilSous}</p>
          <div className="formulaire">
            <div className="champs-ligne">
              <label className="champ">
                <span>{t.ws.paysLabel}</span>
                <input
                  type="text"
                  maxLength={60}
                  value={profil.pays ?? ''}
                  onChange={(e) => setProfil({ ...profil, pays: e.target.value || null })}
                  placeholder="Bénin, France…"
                />
              </label>
              <label className="champ">
                <span>{t.ws.villeLabel}</span>
                <input
                  type="text"
                  maxLength={80}
                  value={profil.region ?? ''}
                  onChange={(e) => setProfil({ ...profil, region: e.target.value || null })}
                  placeholder="Cotonou…"
                />
              </label>
            </div>
            <div className="champs-ligne">
              <label className="champ">
                <span>{t.ws.deviseLabel}</span>
                <input
                  type="text"
                  maxLength={10}
                  value={profil.devise ?? ''}
                  onChange={(e) => setProfil({ ...profil, devise: e.target.value.toUpperCase() || null })}
                  placeholder="XOF"
                />
              </label>
              <label className="champ">
                <span>{t.ws.fuseauLabel}</span>
                <input
                  type="text"
                  maxLength={60}
                  value={profil.fuseau ?? ''}
                  onChange={(e) => setProfil({ ...profil, fuseau: e.target.value || null })}
                  placeholder="Africa/Porto-Novo"
                />
              </label>
            </div>
            <div className="champs-ligne">
              <label className="champ">
                <span>{t.ws.languePrincipaleLabel}</span>
                <select
                  value={profil.languePrincipale}
                  onChange={(e) =>
                    setProfil({ ...profil, languePrincipale: e.target.value as 'fr' | 'en' })
                  }
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="champ">
                <span>{t.ws.languesSecondairesLabel}</span>
                <input
                  type="text"
                  maxLength={120}
                  value={profil.languesSecondaires.join(', ')}
                  onChange={(e) =>
                    setProfil({
                      ...profil,
                      languesSecondaires: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 6),
                    })
                  }
                  placeholder="fon, anglais…"
                />
              </label>
            </div>
            <div className="champs-ligne">
              <label className="champ">
                <span>{t.ws.unitesLabel}</span>
                <select
                  value={profil.unites}
                  onChange={(e) =>
                    setProfil({ ...profil, unites: e.target.value as 'metriques' | 'imperiales' })
                  }
                >
                  <option value="metriques">{t.ws.metriques}</option>
                  <option value="imperiales">{t.ws.imperiales}</option>
                </select>
              </label>
              <label className="champ">
                <span>{t.ws.domaineLabel}</span>
                <input
                  type="text"
                  maxLength={120}
                  value={profil.domaine ?? ''}
                  onChange={(e) => setProfil({ ...profil, domaine: e.target.value || null })}
                  placeholder="Éducation, commerce…"
                />
              </label>
            </div>
          </div>
          <p className="module-note">
            <Icone nom="circle-info" /> {t.ws.localNote}
          </p>
        </section>
      )}

      {/* — Préférences de réponse — */}
      {prefs && (
        <section className="param-section">
          <h2>{t.ws.preferencesTitre}</h2>
          <div className="param-ligne">
            <span className="param-label">{t.ws.tonLabel}</span>
            <div className="param-choix" role="group" aria-label={t.ws.tonLabel}>
              {(['concis', 'detaille', 'pedagogique'] as const).map((ton) => (
                <button
                  key={ton}
                  type="button"
                  className={prefs.tonReponse === ton ? 'actif' : ''}
                  onClick={() => setPrefs({ ...prefs, tonReponse: ton })}
                >
                  {ton === 'concis' ? t.ws.tonConcis : ton === 'detaille' ? t.ws.tonDetaille : t.ws.tonPedagogique}
                </button>
              ))}
            </div>
          </div>
          <div className="param-ligne">
            <span className="param-label">{t.ws.langueReponseLabel}</span>
            <div className="param-choix" role="group" aria-label={t.ws.langueReponseLabel}>
              {(['auto', 'fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={prefs.langueReponse === l ? 'actif' : ''}
                  onClick={() => setPrefs({ ...prefs, langueReponse: l })}
                >
                  {l === 'auto' ? t.ws.langueAuto : l === 'fr' ? 'Français' : 'English'}
                </button>
              ))}
            </div>
          </div>
          <div className="param-ligne">
            <span className="param-label">{t.ws.utiliserMemoireLabel}</span>
            <div className="param-choix">
              <button
                type="button"
                className={prefs.utiliserMemoire ? 'actif' : ''}
                onClick={() => setPrefs({ ...prefs, utiliserMemoire: true })}
              >
                <Icone nom="toggle-on" /> {t.ws.memoireActive}
              </button>
              <button
                type="button"
                className={!prefs.utiliserMemoire ? 'actif' : ''}
                onClick={() => setPrefs({ ...prefs, utiliserMemoire: false })}
              >
                <Icone nom="toggle-off" /> {t.ws.memoireInactive}
              </button>
            </div>
          </div>
          <div className="param-actions">
            <button type="button" className="btn-primaire" onClick={() => void enregistrer()} disabled={etatSauvegarde === 'envoi'}>
              {etatSauvegarde === 'fait' ? (
                <>
                  <Icone nom="check" /> {t.ws.enregistre}
                </>
              ) : (
                <>
                  <Icone nom="floppy-disk" /> {t.ws.enregistrer}
                </>
              )}
            </button>
            {erreur && <p className="form-erreur">{erreur}</p>}
          </div>
        </section>
      )}

      <section className="param-section">
        <h2>{t.parametres.apparence}</h2>
        <div className="param-ligne">
          <span className="param-label">{t.parametres.themeLabel}</span>
          <div className="param-choix" role="group" aria-label={t.parametres.themeLabel}>
            <button type="button" className={theme === 'light' ? 'actif' : ''} onClick={() => setTheme('light')}>
              <Icone nom="sun" /> {t.parametres.themeClair}
            </button>
            <button type="button" className={theme === 'dark' ? 'actif' : ''} onClick={() => setTheme('dark')}>
              <Icone nom="moon" /> {t.parametres.themeSombre}
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

      {simDisponible && (
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
      )}

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
            <Icone nom="arrow-right-from-bracket" /> {t.parametres.deconnexion}
          </button>
        ) : (
          <Link to="/login" className="btn-primaire">
            {t.workspace.seConnecter}
          </Link>
        )}
      </section>

      {/* — Zone sensible : suppression de compte — */}
      {statut === 'connecte' && !sim && (
        <section className="param-section param-danger">
          <h2>
            <Icone nom="triangle-exclamation" /> {t.ws.dangerZone}
          </h2>
          <p className="corps">{t.ws.dangerSous}</p>
          <button type="button" className="btn-danger-simple" onClick={() => setDialogueSuppression(true)}>
            <Icone nom="user-slash" /> {t.ws.supprimerCompte}
          </button>
        </section>
      )}

      <section className="param-section">
        <h2>{t.parametres.aPropos}</h2>
        <p className="corps">{t.parametres.aProposTexte}</p>
        <div className="param-liens">
          <Link to="/documentation" className="btn-ligne">
            {t.parametres.docs}
          </Link>
          <Link to="/#tarifs" className="btn-ligne">
            {t.parametres.tarifs}
          </Link>
        </div>
      </section>

      {/* — Confirmation de suppression de compte — */}
      <Dialogue
        ouvert={dialogueSuppression}
        onFermer={() => {
          setDialogueSuppression(false);
          setErreurSuppression(null);
        }}
        titre={t.ws.supprimerCompte}
        pied={
          <>
            <button
              type="button"
              className="btn-simple"
              onClick={() => {
                setDialogueSuppression(false);
                setErreurSuppression(null);
              }}
            >
              {t.ws.annuler}
            </button>
            <button
              type="button"
              className="btn-danger-simple"
              disabled={
                etatSuppression === 'envoi' ||
                !motDePasse ||
                confirmation !== t.ws.supprimerCompteConfirmeValeur
              }
              onClick={async () => {
                setEtatSuppression('envoi');
                setErreurSuppression(null);
                const r = await api.supprimerCompte(motDePasse);
                if (r.ok) {
                  await rafraichir();
                  navigate('/login', { state: { info: t.ws.compteSupprime } });
                } else {
                  setEtatSuppression('erreur');
                  setErreurSuppression(r.erreur);
                }
              }}
            >
              {etatSuppression === 'envoi' ? t.chat.envoi : t.ws.supprimerCompte}
            </button>
          </>
        }
      >
        <div className="formulaire">
          <p className="corps param-danger-texte">
            <Icone nom="triangle-exclamation" />{' '}
            {t.ws.supprimerCompteAvertissement}
          </p>
          <label className="champ">
            <span>{t.ws.motDePasseLabel}</span>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="champ">
            <span>
              {t.ws.supprimerCompteConfirmeLabel} <strong>{t.ws.supprimerCompteConfirmeValeur}</strong>
            </span>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </label>
          {erreurSuppression && <p className="form-erreur">{erreurSuppression}</p>}
        </div>
      </Dialogue>
    </div>
  );
};
