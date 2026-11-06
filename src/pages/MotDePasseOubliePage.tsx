import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrefs, useT } from '../app/prefs';
import { CadreAuth } from '../components/auth/CadreAuth';
import { Icone } from '../components/ui/Icone';
import * as api from '../services/api';

/**
 * Mot de passe oublié — demande d'envoi d'un lien.
 *
 * Le message de confirmation est volontairement identique quelle que soit
 * l'adresse : l'écran ne doit jamais révéler l'existence d'un compte.
 * Si le service d'e-mail n'est pas configuré, le serveur répond 503 et
 * l'interface le dit franchement, sans prétendre qu'un message est parti.
 */
export const MotDePasseOubliePage: React.FC = () => {
  const t = useT();
  const { lang } = usePrefs();
  const [email, setEmail] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'envoye'>('idle');
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErreur(t.auth.errSaisie);
      return;
    }
    setEtat('envoi');
    const r = await api.demanderReinitialisation(email.trim().toLowerCase(), lang);
    if (r.ok) {
      setEtat('envoye');
      return;
    }
    setEtat('idle');
    setErreur(
      r.code === 'mail-indisponible'
        ? t.securite.mailIndisponible
        : r.code === 'limite'
          ? t.securite.limite
          : r.code === 'validation'
            ? t.auth.errSaisie
            : t.securite.erreur,
    );
  };

  return (
    <CadreAuth
      titre1={t.securite.oubliTitre1}
      titre2={t.securite.oubliTitre2}
      sous={t.securite.oubliSous}
      pied={
        <Link to="/login" className="auth-retour">
          ← {t.securite.retourConnexion}
        </Link>
      }
    >
      {etat === 'envoye' ? (
        <p className="form-note form-info" role="status">
          <Icone nom="paper-plane" /> {t.securite.oubliEnvoye}
        </p>
      ) : (
        <form onSubmit={soumettre} noValidate>
          <div className="form-groupe">
            <label htmlFor="email-oubli">{t.auth.email}</label>
            <input
              id="email-oubli"
              type="email"
              className="form-champ"
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={erreur ? true : undefined}
            />
          </div>

          {erreur && (
            <p className="form-erreur" role="alert">
              <Icone nom="circle-exclamation" /> {erreur}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-ruban"
            disabled={etat === 'envoi'}
            style={{ width: '100%', marginTop: '1.6rem' }}
          >
            <span>{etat === 'envoi' ? t.securite.oubliEnvoi : t.securite.oubliSubmit}</span>
          </button>
        </form>
      )}

      <p className="form-note" role="note">
        {t.securite.oubliNote}
      </p>
    </CadreAuth>
  );
};
