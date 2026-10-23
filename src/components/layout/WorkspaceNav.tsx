import React from 'react';
import { NavLink } from 'react-router-dom';
import { useT } from '../../app/prefs';

/**
 * Navigation entre les interfaces de l'espace de travail —
 * onglets horizontaux partagés par les pages du moteur.
 */
export const WorkspaceNav: React.FC = () => {
  const t = useT();
  const onglets: Array<[string, string]> = [
    ['/app', t.workspace.espace],
    ['/chat', t.workspace.chat],
    ['/explore', t.workspace.explore],
    ['/studio', t.workspace.studio],
    ['/missions', t.workspace.missions],
  ];
  return (
    <nav className="ws-nav" aria-label={t.workspace.espace}>
      {onglets.map(([href, label]) => (
        <NavLink key={href} to={href} end={href === '/app'}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
};
