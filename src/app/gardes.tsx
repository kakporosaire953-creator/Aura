import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession, type VerificationEmail } from './session';
import { useT } from './prefs';
import { decisionGarde } from './garde-etat';
import { renvoyerVerification } from '../services/api';
import { usePrefs } from './prefs';

/**
 * Garde des routes privées — un seul endroit, pas une copie par page.
 *
 * Elle ne remplace jamais `authRequise` côté serveur : elle évite
 * seulement d'afficher un espace vide à quelqu'un qui n'a pas de session.
 * Chaque état est traité pour ce qu'il est :
 * - vérification en cours → attente visible ;
 * - anonyme → redirection vers la connexion, destination conservée ;
 * - service indisponible → message explicite, jamais une redirection :
 *   une panne de stockage n'est pas une déconnexion.
 */
/**
 * La règle de confirmation, isolée en fonction pure : elle se vérifie sans
 * navigateur. L'espace ne s'ouvre qu'à une adresse confirmée, et seulement
 * si l'environnement peut réellement envoyer des e-mails (`obligatoire`).
 * Sinon (`facultative`, `impossible`), exiger la confirmation enfermerait
 * des utilisateurs qui n'ont aucun moyen de la donner.
 */
export function confirmationRequise(
  compte: { emailVerifie?: boolean } | null,
  verificationEmail: VerificationEmail,
): boolean {
  return verificationEmail === 'obligatoire' && compte?.emailVerifie !== true;
}

/**
 * Écran d'attente de confirmation — l'espace reste fermé, mais l'utilisateur
 * peut renvoyer le lien ou se déconnecter : jamais enfermé sans issue.
 */
const AttenteConfirmation: React.FC<{ email: string }> = ({ email }) => {
  const t = useT();
  const { lang } = usePrefs();
  const { deconnecter } = useSession();
  const location = useLocation();
  // Résultat de l'envoi transmis par l'inscription : si le lien n'est pas
  // parti, on le dit immédiatement.
  const premierEnvoi = (
    location.state as { envoiMail?: { ok: boolean; code?: string } } | null
  )?.envoiMail;
  const [etat, setEtat] = React.useState<'repos' | 'envoi' | 'envoye' | 'echec'>(
    premierEnvoi && !premierEnvoi.ok ? 'echec' : 'repos',
  );
  // Le message suit la **cause réelle** renvoyée par le serveur : dire
  // « pas configuré » alors que le fournisseur a refusé l'envoi (domaine non
  // vérifié, quota, clé) envoyait l'utilisateur — et l'exploitant — sur une
  // fausse piste.
  const texteEchec = (code: string | undefined): string => {
    if (code === 'mail-indisponible') return t.auth.confirmerIndisponible;
    if (code === 'limite' || code === '429') return t.auth.confirmerLimite;
    if (code === 'deja-verifie') return t.auth.confirmerEnvoye;
    return t.auth.confirmerRefus;
  };

  const [message, setMessage] = React.useState<string | null>(
    premierEnvoi && !premierEnvoi.ok ? texteEchec(premierEnvoi.code) : null,
  );

  return (
    <div className="page-chargement page-confirmation">
      <div className="page-indisponible-boite">
        <h1 className="display-md">{t.auth.confirmerTitre}</h1>
        <p className="corps">{t.auth.confirmerSous}</p>
        <p className="corps page-confirmation-email">{email}</p>
        <p className="corps" role="status" aria-live="polite">
          {etat === 'envoye'
            ? t.auth.confirmerEnvoye
            : etat === 'echec'
              ? (message ?? t.auth.confirmerRefus)
              : t.auth.confirmerAide}
        </p>
        <div className="page-confirmation-actions">
          <button
            type="button"
            className="btn btn-principal"
            disabled={etat === 'envoi' || etat === 'envoye'}
            onClick={async () => {
              setEtat('envoi');
              setMessage(null);
              const r = await renvoyerVerification(lang);
              if (r.ok) {
                setEtat('envoye');
                return;
              }
              setEtat('echec');
              setMessage(texteEchec(r.code));
            }}
          >
            {etat === 'envoi' ? t.auth.submitEnvoi : t.auth.confirmerRenvoyer}
          </button>
          <button type="button" className="btn btn-ligne" onClick={() => void deconnecter()}>
            {t.auth.confirmerDeconnexion}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RoutePrivee: React.FC = () => {
  const { statut, motif, expiree, rafraichir, compte, verificationEmail } = useSession();
  const location = useLocation();
  const t = useT();
  const [relance, setRelance] = React.useState(false);

  const decision = decisionGarde(statut);

  if (decision === 'attente') {
    return (
      <div className="page-chargement" role="status" aria-live="polite">
        <span className="etat-spinner" aria-hidden />
        <span className="sr-only">{t.espace.chargement}</span>
      </div>
    );
  }

  if (decision === 'panne') {
    return (
      <div className="page-chargement page-indisponible">
        <div className="page-indisponible-boite">
          <h1 className="display-md">{t.auth.indispoTitre}</h1>
          <p className="corps" role="status" aria-live="polite">
            {motif === 'stockage' ? t.auth.indispoStockage : t.auth.indispoReseau}
          </p>
          <button
            type="button"
            className="btn btn-ligne"
            disabled={relance}
            onClick={() => {
              setRelance(true);
              void rafraichir().finally(() => setRelance(false));
            }}
          >
            {relance ? t.auth.submitEnvoi : t.auth.reessayer}
          </button>
        </div>
      </div>
    );
  }

  if (decision === 'rediriger') {
    const depuis = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ depuis, expiree }} />;
  }

  // Adresse non confirmée alors que la règle l'exige : l'espace reste fermé.
  if (compte && confirmationRequise(compte, verificationEmail)) {
    return <AttenteConfirmation email={compte.email} />;
  }

  return <Outlet />;
};
