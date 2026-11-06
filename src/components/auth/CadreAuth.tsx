import React from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';

/**
 * Cadre commun des pages de compte hors espace connecté
 * (mot de passe oublié, réinitialisation, confirmation d'adresse).
 *
 * Même langage visuel que l'authentification — ivoire, titres éditoriaux,
 * accent lime — sans le film animé : ces pages doivent rester sobres,
 * lisibles et rapides, y compris sur un lien ouvert depuis une boîte mail.
 */
export const CadreAuth: React.FC<{
  titre1: string;
  titre2: string;
  sous: string;
  children: React.ReactNode;
  pied?: React.ReactNode;
}> = ({ titre1, titre2, sous, children, pied }) => (
  <div className="compte-page">
    <main className="compte-boite" id="contenu">
      <Link to="/" aria-label="AURA" className="compte-logo">
        <AuraLogo taille="sm" />
      </Link>
      <h1 className="display-lg">
        {titre1} <em className="italique-vif">{titre2}</em>.
      </h1>
      <p className="sous-titre">{sous}</p>
      {children}
      {pied && <div className="compte-pied">{pied}</div>}
    </main>
  </div>
);
