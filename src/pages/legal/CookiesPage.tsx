import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const CookiesPage: React.FC = () => {
  const toc = [
    { id: 'definition', label: '1. Qu’est-ce qu’un cookie ou traceur ?' },
    { id: 'technologies', label: '2. Technologies utilisées sur Aura' },
    { id: 'finalites', label: '3. Détail des clés de stockage' },
    { id: 'tiers', label: '4. Cookies tiers et publicité' },
    { id: 'gestion', label: '5. Comment gérer votre stockage local ?' },
  ];

  return (
    <LegalLayout
      title="Politique relative aux Cookies & Stockage Local"
      subtitle="Explications claires sur l’utilisation du stockage local navigateur (LocalStorage) et l’absence de traceurs publicitaires intrusifs."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="definition" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Qu’est-ce qu’un cookie ou traceur ?
        </h2>
        <p>
          Un cookie ou traceur est un petit fichier texte ou une clé de stockage déposé par un site web sur votre navigateur. Il permet de mémoriser vos paramètres de navigation ou de maintenir votre session ouverte sans avoir à vous reconnecter à chaque changement de page.
        </p>
      </section>

      <section id="technologies" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Technologies utilisées sur Aura
        </h2>
        <p>
          Aura privilégie l’utilisation du <strong>LocalStorage HTML5</strong> pour son fonctionnement technique direct. Nous n'utilisons aucun traceur publicitaire ou outil de profilage commercial invasif.
        </p>
      </section>

      <section id="finalites" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Détail des clés de stockage indispensables au fonctionnement
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#EAE6DC] dark:border-[#243337] rounded-xl overflow-hidden">
            <thead className="bg-[#FAF8F2] dark:bg-[#182427] text-[#14282D] dark:text-[#F3F2EC] font-semibold border-b border-[#EAE6DC] dark:border-[#243337]">
              <tr>
                <th className="py-2.5 px-3">Clé de stockage</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Finalité</th>
                <th className="py-2.5 px-3">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DC]/60 dark:divide-[#243337]/60 text-[#3D4A47] dark:text-[#C5CECB]">
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold">aura_session_token</td>
                <td className="py-2.5 px-3">LocalStorage</td>
                <td className="py-2.5 px-3">Jeton de session chiffré/signé maintenant votre authentification sécurisée.</td>
                <td className="py-2.5 px-3">Jusqu'à déconnexion</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold">aura_theme</td>
                <td className="py-2.5 px-3">LocalStorage</td>
                <td className="py-2.5 px-3">Mémorise votre choix de thème d'affichage (ivoire clair ou obsidienne sombre).</td>
                <td className="py-2.5 px-3">Persistant</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold">aura_lang</td>
                <td className="py-2.5 px-3">LocalStorage</td>
                <td className="py-2.5 px-3">Mémorise votre langue d'interface préférée (français ou anglais).</td>
                <td className="py-2.5 px-3">Persistant</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold">aura_reduced_motion</td>
                <td className="py-2.5 px-3">LocalStorage</td>
                <td className="py-2.5 px-3">Préférence d'accessibilité pour désactiver les animations visuelles lourdes.</td>
                <td className="py-2.5 px-3">Persistant</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="tiers" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Cookies tiers et publicité
        </h2>
        <p>
          Aura n'intègre <strong>aucun cookie tiers publicitaire</strong> (comme Google AdSense, Facebook Pixel ou régies publicitaires externes). Vos données de navigation ne sont jamais revendues ou partagées avec des courtiers en données (data brokers).
        </p>
      </section>

      <section id="gestion" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Comment gérer votre stockage local ?
        </h2>
        <p>
          Vous pouvez à tout moment vider le stockage local et le cache de votre navigateur via les paramètres de votre navigateur web (Chrome, Firefox, Safari, Edge). Veuillez noter que la suppression de la clé <code>aura_session_token</code> aura pour effet immédiat de fermer votre session active sur Aura.
        </p>
      </section>
    </LegalLayout>
  );
};
