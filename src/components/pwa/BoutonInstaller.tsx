/**
 * Bouton « Installer Aura » — visible seulement quand le navigateur a
 * réellement émis son invite (`beforeinstallprompt`). Ailleurs, on ne fait
 * pas semblant : les instructions se trouvent dans les paramètres.
 */
import React from 'react';
import { useT } from '../../app/prefs';
import { useInstallation } from '../../app/pwa';
import { Icone } from '../ui/Icone';

export const BoutonInstaller: React.FC = () => {
  const t = useT();
  const { etat, installer } = useInstallation();

  if (etat !== 'installable') return null;

  return (
    <button
      type="button"
      className="ws-installer"
      onClick={() => void installer()}
      title={t.pwa.installerTexte}
    >
      <Icone nom="download" /> <span>{t.pwa.installer}</span>
    </button>
  );
};
