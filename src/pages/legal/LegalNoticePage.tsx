import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const LegalNoticePage: React.FC = () => {
  const toc = [
    { id: 'editeur', label: '1. Éditeur de la plateforme Aura' },
    { id: 'directeur-publication', label: '2. Direction de la publication' },
    { id: 'hebergement', label: '3. Hébergement et infrastructure' },
    { id: 'donnees-personnelles', label: '4. Délégué à la Protection des Données (DPO)' },
    { id: 'propriete-intellectuelle', label: '5. Marques et propriété intellectuelle' },
    { id: 'responsabilite', label: '6. Limitation de responsabilité technique' },
    { id: 'contact', label: '7. Coordonnées officielles' },
  ];

  return (
    <LegalLayout
      title="Mentions Légales & Informations de l’Éditeur"
      subtitle="Informations d'identification juridique de l'éditeur du site, de l'hébergeur et des responsables de publication."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="editeur" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Éditeur de la plateforme Aura
        </h2>
        <p>
          Conformément aux dispositions législatives relatives à la confiance dans l'économie numérique, la plateforme logicielle et le site web <strong>Aura</strong> sont édités par :
        </p>

        <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-2 text-xs sm:text-sm font-mono leading-relaxed">
          <div>
            <strong>Raison sociale :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Dénomination sociale ou Nom du propriétaire]
          </div>
          <div>
            <strong>Forme juridique :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : SARL / SAS / Entreprise Individuelle / Autre]
          </div>
          <div>
            <strong>Capital social :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Montant du capital en euros ou devise locale]
          </div>
          <div>
            <strong>Numéro d'immatriculation :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Numéro RCCM / SIREN / RCS / Identifiant fiscal unique]
          </div>
          <div>
            <strong>Numéro de TVA intracommunautaire :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Numéro d'assujettissement ou mention d'exonération]
          </div>
          <div>
            <strong>Siège social :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Adresse postale complète, Code postal, Ville, Pays]
          </div>
          <div>
            <strong>Adresse e-mail générale :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : contact@aura-platform.com]
          </div>
          <div>
            <strong>Téléphone professionnel :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Numéro avec indicatif international]
          </div>
        </div>

        <p className="text-xs text-[#77817F]">
          <em>Note aux administrateurs : Ces informations doivent être obligatoirement renseignées avec les données réelles et vérifiables avant tout lancement commercial ou mise en production publique.</em>
        </p>
      </section>

      <section id="directeur-publication" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Direction de la publication
        </h2>
        <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] space-y-1 text-xs sm:text-sm font-mono">
          <div><strong>Directeur de la publication :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Nom et prénom du représentant légal ou du responsable éditorial]</div>
          <div><strong>Qualité :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Président / Gérant / Fondateur]</div>
          <div><strong>Contact éditorial :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : editorial@aura-platform.com]</div>
        </div>
      </section>

      <section id="hebergement" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Hébergement & Infrastructure technique
        </h2>
        <p>
          L'infrastructure technique de la plateforme Aura est déployée et hébergée auprès des prestataires d'infrastructure cloud suivants :
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1">
            <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block">Hébergement Frontend & Serverless Functions :</span>
            <div><strong>Prestataire :</strong> Vercel Inc.</div>
            <div><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</div>
            <div><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-[#078348] dark:text-[#8CCB4A] underline">vercel.com</a></div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1">
            <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block">Stockage de données & Authentification gérée :</span>
            <div><strong>Prestataire :</strong> Supabase Inc. / Infrastructure Postgres managée</div>
            <div><strong>Adresse :</strong> 970 Toa Payoh North #07-04, Singapore 318992</div>
            <div><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#078348] dark:text-[#8CCB4A] underline">supabase.com</a></div>
          </div>
        </div>
      </section>

      <section id="donnees-personnelles" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Délégué à la Protection des Données (DPO)
        </h2>
        <p>
          Pour toute question relative à la protection de vos données à caractère personnel, à l'exercice de vos droits d'accès, de rectification, de portabilité ou d'effacement, vous pouvez contacter notre référent données :
        </p>
        <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1 font-mono text-xs">
          <div>DPO / Référent Données : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Nom du DPO ou cabinet externe]</div>
          <div>E-mail dédié : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : dpo@aura-platform.com ou privacy@aura-platform.com]</div>
          <div>Délai de traitement légal : sous un mois maximum à compter de la réception de la demande justificative.</div>
        </div>
      </section>

      <section id="propriete-intellectuelle" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Marques et propriété intellectuelle
        </h2>
        <p>
          « Aura », le logo symbolique Aura (ellipse dynamique verte, jaune et orange), ainsi que les éléments d'identité graphique constituent des signes distinctifs protégés. Toute utilisation sans l'accord exprès de l'éditeur constitue une contrefaçon passible de poursuites judiciaires.
        </p>
      </section>

      <section id="responsabilite" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Limitation de responsabilité technique
        </h2>
        <p>
          L'éditeur met en œuvre tous les moyens raisonnables pour assurer la disponibilité continue et la sécurité des données hébergées. Toutefois, l'éditeur ne saurait être tenu pour responsable d'interruptions de service résultant de cas de force majeure, de pannes de réseaux tiers, d'attaques distribuées ou d'actes malveillants indépendants de sa volonté raisonnable.
        </p>
      </section>

      <section id="contact" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          7. Coordonnées officielles
        </h2>
        <p>
          Pour toute réclamation légale, assignation ou notification officielle :
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Courrier électronique :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : legal@aura-platform.com]</li>
          <li><strong>Adresse postale légale :</strong> [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Service Juridique Aura, Adresse, Code Postal, Ville, Pays]</li>
        </ul>
      </section>
    </LegalLayout>
  );
};
