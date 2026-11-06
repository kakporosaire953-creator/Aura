import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useT } from '../app/prefs';
import { CadreAuth } from '../components/auth/CadreAuth';
import { Icone } from '../components/ui/Icone';
import * as api from '../services/api';

/**
 * Réinitialisation du mot de passe depuis le lien reçu par e-mail.
 *
 * Le jeton vit uniquement dans l'URL de cette page : il n'est jamais stocké
 * (ni cookie, ni localStorage) et disparaît de l'historique dès l'envoi.
 * Un lien invalide ou expiré est annoncé tel quel, sans faux succès.
 */
export const ReinitialiserPage: React.FC = () => {
  const t = useT();
  const [params] = useSearchParams();
  const jeton = (params.get('jeton') ?? '').trim();

  const [mdp, setMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'fait'>('idle');
  const [erreur, setErreur] = useState<string | null>(
    jeton.length < 20 ? t.securite.lienInvalide : null,
  );

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (mdp.length < 8) {
      setErreur(t.securite.resetCourt);
      return;
    }
    if (mdp !== confirmation) {
      setErreur(t.securite.resetDifferents);
      return;
    }
    setEtat('envoi');
    const r = await api.reinitialiserMotDePasse(jeton, mdp);
    if (r.ok) {
      setEtat('fait');
      // Le jeton ne doit pas rester dans la barre d'adresse.
      window.history.replaceState(null, '', '/reinitialiser');
      return;
    }
    setEtat('idle');
    setErreur(
      r.code === 'jeton-expire'
        ? t.securite.resetExpire
        : r.code === 'jeton-invalide'
          ? t.securite.resetInvalide
          : r.code === 'validation'
            ? t.securite.resetCourt
            : r.code === 'limite'
              ? t.securite.limite
              : t.securite.erreur,
    );
  };

  return (
    <CadreAuth
      titre1={t.securite.resetTitre1}
      titre2={t.securite.resetTitre2}
      sous={t.securite.resetSous}
      pied={
        <Link to="/mot-de-passe-oublie" className="auth-retour">
          ← {t.securite.oubliSubmit}
        </Link>
      }
    >
      {etat === 'fait' ? (
        <>
          <p className="form-note form-info" role="status">
            <Icone nom="shield-check" /> {t.securite.resetFait}
          </p>
          <Link to="/login" className="btn btn-ruban" style={{ width: '100%', marginTop: '1.2rem' }}>
            <span>{t.securite.resetAllerConnexion}</span>
          </Link>
        </>
      ) : (
        <form onSubmit={soumettre} noValidate>
          <div className="form-groupe">
            <label htmlFor="reset-mdp">{t.securite.resetNouveau}</label>
            <input
              id="reset-mdp"
              type="password"
              className="form-champ"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              disabled={jeton.length < 20}
            />
          </div>
          <div className="form-groupe">
            <label htmlFor="reset-confirmation">{t.securite.resetConfirmer}</label>
            <input
              id="reset-confirmation"
              type="password"
              className="form-champ"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={jeton.length < 20}
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
            disabled={etat === 'envoi' || jeton.length < 20}
            style={{ width: '100%', marginTop: '1.6rem' }}
          >
            <span>{etat === 'envoi' ? t.securite.resetEnvoi : t.securite.resetSubmit}</span>
          </button>
        </form>
      )}
    </CadreAuth>
  );
};
