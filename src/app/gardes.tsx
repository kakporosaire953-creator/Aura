import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from './session';
import { useT } from './prefs';
import { decisionGarde } from './garde-etat';

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
export const RoutePrivee: React.FC = () => {
  const { statut, motif, expiree, rafraichir } = useSession();
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

  return <Outlet />;
};
