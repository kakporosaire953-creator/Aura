import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../app/prefs';
import { useSession } from '../app/session';
import { CadreAuth } from '../components/auth/CadreAuth';
import { Icone } from '../components/ui/Icone';
import * as api from '../services/api';

/**
 * Confirmation d'adresse depuis le lien reçu par e-mail.
 *
 * La vérification n'est pas bloquante : ce passage confirme seulement
 * l'adresse et rafraîchit l'état de session. Un lien mort est dit mort.
 */
export const VerifierEmailPage: React.FC = () => {
  const t = useT();
  const { statut, rafraichir } = useSession();
  const [etat, setEtat] = useState<'envoi' | 'fait' | 'echec'>('envoi');
  const [detail, setDetail] = useState<string | null>(null);
  // Un seul appel, même si React remonte le composant en développement.
  const lance = useRef(false);

  useEffect(() => {
    if (lance.current) return;
    lance.current = true;

    const jeton = new URLSearchParams(window.location.search).get('jeton') ?? '';
    if (jeton.trim().length < 20) {
      setEtat('echec');
      setDetail(t.securite.lienInvalide);
      return;
    }

    void (async () => {
      const r = await api.verifierEmail(jeton.trim());
      // Le jeton ne reste pas dans la barre d'adresse.
      window.history.replaceState(null, '', '/verifier-email');
      if (r.ok) {
        setEtat('fait');
        if (statut === 'connecte') await rafraichir();
        return;
      }
      setEtat('echec');
      setDetail(
        r.code === 'jeton-expire'
          ? t.securite.resetExpire
          : r.code === 'jeton-invalide'
            ? t.securite.resetInvalide
            : r.code === 'mail-indisponible'
              ? t.securite.mailIndisponible
              : t.securite.erreur,
      );
    })();
  }, [rafraichir, statut, t]);

  return (
    <CadreAuth
      titre1={etat === 'echec' ? t.securite.verifEchec : t.securite.verifTitre}
      titre2=""
      sous={etat === 'fait' ? t.securite.verifOkSous : t.securite.verifEchecSous}
      pied={
        <Link to={statut === 'connecte' ? '/app' : '/login'} className="auth-retour">
          ← {statut === 'connecte' ? t.securite.verifContinuer : t.securite.retourConnexion}
        </Link>
      }
    >
      {etat === 'envoi' && (
        <p className="form-note form-info" role="status">
          <span className="etat-spinner" aria-hidden /> {t.securite.verifEnCours}
        </p>
      )}
      {etat === 'fait' && (
        <p className="form-note form-info" role="status">
          <Icone nom="shield-check" /> {t.securite.verifOk}
        </p>
      )}
      {etat === 'echec' && (
        <p className="form-erreur" role="alert">
          <Icone nom="circle-exclamation" /> {detail ?? t.securite.verifEchecSous}
        </p>
      )}
      {etat !== 'envoi' && (
        <div style={{ marginTop: '1.4rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link to={statut === 'connecte' ? '/app' : '/login'} className="btn btn-ruban">
            <span>{statut === 'connecte' ? t.securite.verifContinuer : t.securite.resetAllerConnexion}</span>
          </Link>
          {statut === 'connecte' && (
            <Link to="/parametres" className="btn-ligne">
              <Icone nom="paper-plane" /> {t.securite.emailRenvoyer}
            </Link>
          )}
        </div>
      )}
    </CadreAuth>
  );
};
