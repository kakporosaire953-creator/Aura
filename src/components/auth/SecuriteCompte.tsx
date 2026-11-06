import React, { useCallback, useEffect, useState } from 'react';
import { usePrefs, useT } from '../../app/prefs';
import { useSession } from '../../app/session';
import { simulationActivee } from '../../app/simulation';
import { Icone } from '../ui/Icone';
import * as api from '../../services/api';
import type { SessionActive } from '../../services/types';

/** Date lisible et stable (pas de fuseau implicite dans l'affichage). */
function dateLisible(iso: string, lang: 'fr' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Sécurité du compte : état de l'adresse, changement de mot de passe,
 * sessions actives. Rien n'est simulé : en mode démonstration, ces blocs
 * sont absents (aucun compte réel derrière).
 */
export const SecuriteCompte: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const { statut, compte } = useSession();
  const sim = simulationActivee();

  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [etatMdp, setEtatMdp] = useState<'idle' | 'envoi' | 'fait'>('idle');
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionActive[] | null>(null);
  const [erreurSessions, setErreurSessions] = useState<string | null>(null);
  const [etatRenvoyer, setEtatRenvoyer] = useState<'idle' | 'envoi' | 'fait'>('idle');
  const [messageMail, setMessageMail] = useState<string | null>(null);

  const connecte = statut === 'connecte' && !sim;

  const chargerSessions = useCallback(async () => {
    const r = await api.listerSessions();
    if (r.ok) {
      setSessions(r.donnees.sessions);
      setErreurSessions(null);
    } else {
      setErreurSessions(r.code === 'reseau' ? t.securite.erreur : r.erreur);
    }
  }, [t]);

  useEffect(() => {
    if (connecte) void chargerSessions();
  }, [connecte, chargerSessions]);

  if (!connecte) return null;

  const changerMdp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurMdp(null);
    if (nouveau.length < 8) {
      setErreurMdp(t.securite.mdpCourt);
      return;
    }
    if (nouveau !== confirmation) {
      setErreurMdp(t.securite.mdpDifferents);
      return;
    }
    setEtatMdp('envoi');
    const r = await api.changerMotDePasse(actuel, nouveau);
    if (r.ok) {
      setEtatMdp('fait');
      setActuel('');
      setNouveau('');
      setConfirmation('');
      await chargerSessions();
      setTimeout(() => setEtatMdp('idle'), 4000);
      return;
    }
    setEtatMdp('idle');
    setErreurMdp(
      r.code === 'mot-de-passe'
        ? t.securite.mdpIncorrect
        : r.code === 'identique'
          ? t.securite.mdpIdentique
          : r.code === 'limite'
            ? t.securite.limite
            : r.code === 'validation'
              ? t.securite.mdpCourt
              : t.securite.erreur,
    );
  };

  const revoquer = async (id: string) => {
    const r = await api.revoquerSession(id);
    if (r.ok) await chargerSessions();
    else setErreurSessions(r.code === 'reseau' ? t.securite.erreur : r.erreur);
  };

  const revoquerAutres = async () => {
    const r = await api.revoquerAutresSessions();
    if (r.ok) await chargerSessions();
    else setErreurSessions(r.code === 'reseau' ? t.securite.erreur : r.erreur);
  };

  const renvoyer = async () => {
    setEtatRenvoyer('envoi');
    setMessageMail(null);
    const r = await api.renvoyerVerification(lang);
    if (r.ok) {
      setEtatRenvoyer('fait');
      setMessageMail(t.securite.emailEnvoye);
      return;
    }
    setEtatRenvoyer('idle');
    setMessageMail(
      r.code === 'mail-indisponible'
        ? t.securite.mailIndisponible
        : r.code === 'deja-verifie'
          ? t.securite.emailDejaVerifie
          : r.code === 'limite'
            ? t.securite.limite
            : t.securite.erreur,
    );
  };

  const verifie = compte?.emailVerifie === true;
  const autres = (sessions ?? []).filter((s) => !s.courante);

  return (
    <>
      {/* — Adresse e-mail — */}
      <section className="param-section">
        <h2>
          <Icone nom="paper-plane" /> {t.auth.email}
        </h2>
        <div className="param-ligne">
          <span className="param-label">{compte?.email ?? '—'}</span>
          <strong className={verifie ? 'etat-ok' : 'etat-attente'}>
            {verifie ? t.securite.emailVerifie : t.securite.emailNonVerifie}
          </strong>
        </div>
        {!verifie && (
          <>
            <p className="corps">{t.securite.emailBandeau}</p>
            <button
              type="button"
              className="btn-ligne"
              onClick={() => void renvoyer()}
              disabled={etatRenvoyer === 'envoi'}
            >
              <Icone nom="paper-plane" /> {t.securite.emailRenvoyer}
            </button>
          </>
        )}
        {messageMail && (
          <p className="form-note form-info" role="status">
            {messageMail}
          </p>
        )}
      </section>

      {/* — Mot de passe — */}
      <section className="param-section">
        <h2>
          <Icone nom="shield-halved" /> {t.securite.mdpTitre}
        </h2>
        <p className="corps">{t.securite.mdpSous}</p>
        <form className="formulaire" onSubmit={changerMdp} noValidate>
          <div className="form-groupe">
            <label htmlFor="param-actuel">{t.securite.mdpActuel}</label>
            <input
              id="param-actuel"
              type="password"
              className="form-champ"
              autoComplete="current-password"
              required
              value={actuel}
              onChange={(e) => setActuel(e.target.value)}
            />
          </div>
          <div className="champs-ligne">
            <div className="form-groupe">
              <label htmlFor="param-nouveau">{t.securite.mdpNouveau}</label>
              <input
                id="param-nouveau"
                type="password"
                className="form-champ"
                autoComplete="new-password"
                minLength={8}
                required
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
              />
            </div>
            <div className="form-groupe">
              <label htmlFor="param-confirmation">{t.securite.mdpConfirmer}</label>
              <input
                id="param-confirmation"
                type="password"
                className="form-champ"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
          </div>

          {erreurMdp && (
            <p className="form-erreur" role="alert">
              <Icone nom="circle-exclamation" /> {erreurMdp}
            </p>
          )}
          {etatMdp === 'fait' && (
            <p className="form-note form-info" role="status">
              <Icone nom="shield-check" /> {t.securite.mdpFait}
            </p>
          )}

          <button type="submit" className="btn btn-ruban" disabled={etatMdp === 'envoi'}>
            <span>{etatMdp === 'envoi' ? t.securite.mdpEnvoi : t.securite.mdpBouton}</span>
          </button>
        </form>
      </section>

      {/* — Sessions actives — */}
      <section className="param-section">
        <h2>
          <Icone nom="clock-rotate-left" /> {t.securite.sessionsTitre}
        </h2>
        <p className="corps">{t.securite.sessionsSous}</p>

        {erreurSessions && (
          <p className="form-erreur" role="alert">
            <Icone nom="circle-exclamation" /> {erreurSessions}
          </p>
        )}

        {sessions === null ? (
          <p className="corps">{t.securite.chargement}</p>
        ) : sessions.length === 0 ? (
          <p className="corps">{t.securite.sessionsVide}</p>
        ) : (
          <ul className="sessions-liste">
            {sessions.map((s) => (
              <li key={s.id} className="session-ligne">
                <div>
                  <strong>{s.libelle}</strong>
                  {s.courante && <span className="session-badge">{t.securite.sessionCourante}</span>}
                  <span className="session-date">
                    {t.securite.sessionDerniereActivite} · {dateLisible(s.derniereActivite, lang)}
                  </span>
                </div>
                {!s.courante && (
                  <button type="button" className="btn-ligne" onClick={() => void revoquer(s.id)}>
                    {t.securite.sessionRevoquer}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {autres.length > 0 && (
          <button
            type="button"
            className="btn-ligne"
            style={{ marginTop: '0.9rem' }}
            onClick={() => void revoquerAutres()}
          >
            <Icone nom="arrow-right-from-bracket" /> {t.securite.sessionsRevoquerAutres}
          </button>
        )}
      </section>
    </>
  );
};
