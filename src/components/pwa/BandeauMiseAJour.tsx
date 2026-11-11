/**
 * Bandeau de mise à jour : une nouvelle version est prête, la personne
 * décide quand recharger. Aucun rechargement automatique.
 */
import React from 'react';
import { useT } from '../../app/prefs';
import { useMiseAJour } from '../../app/pwa';
import { Icone } from '../ui/Icone';

export const BandeauMiseAJour: React.FC = () => {
  const t = useT();
  const { disponible, appliquer } = useMiseAJour();

  if (!disponible) return null;

  return (
    <div className="pwa-maj" role="status" aria-live="polite">
      <Icone nom="circle-info" />
      <span>{t.pwa.miseAJour}</span>
      <button type="button" className="btn-ligne" onClick={appliquer}>
        {t.pwa.recharger}
      </button>
    </div>
  );
};
