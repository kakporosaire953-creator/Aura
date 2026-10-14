import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const BillingTermsPage: React.FC = () => {
  const toc = [
    { id: 'modele-freemium', label: '1. Modèle freemium et offre gratuite' },
    { id: 'offres-futures', label: '2. Offres payantes Aura Plus & Pro en évaluation' },
    { id: 'passerelles-paiement', label: '3. Moyens de paiement et passerelles locales' },
    { id: 'debits-idempotence', label: '4. Règles de décompte équitable et idempotence' },
    { id: 'remboursement', label: '5. Politique de rétractation et remboursements' },
    { id: 'modifications-prix', label: '6. Évolution des quotas et révisions tarifaires' },
  ];

  return (
    <LegalLayout
      title="Abonnements, Quotas, Paiements & Remboursements"
      subtitle="Modalités de tarification, décompte équitable des unités IA et cadre des futures transactions payantes."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="modele-freemium" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Modèle freemium et offre gratuite (Aura Free)
        </h2>
        <p>
          L’offre <strong>Aura Free</strong> est accessible gratuitement dès la création de compte, sans obligation de renseigner une carte bancaire ou un moyen de paiement.
        </p>
        <p>
          Elle confère chaque mois à l'Utilisateur :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>30 unités d’usage IA</strong> par mois calendaire.</li>
          <li><strong>10 recherches web sourcées</strong> via Aura Explore.</li>
          <li><strong>3 créations complètes de sites web</strong> dans Aura Studio.</li>
          <li><strong>10 itérations et modifications de code</strong>.</li>
          <li><strong>3 projets enregistrés simultanément</strong> dans Aura Projects.</li>
          <li><strong>30 jours de rétention</strong> pour l'historique des discussions.</li>
        </ul>
        <p>
          Lorsque le quota mensuel est atteint, les requêtes d'IA générative sont temporairement interrompues jusqu'au prochain renouvellement (1er du mois). L'accès aux projets sauvegardés et l'exportation des fichiers restent entièrement libres et sans frais.
        </p>
      </section>

      <section id="offres-futures" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Offres payantes Aura Plus &amp; Pro en cours d'évaluation
        </h2>
        <p>
          Les offres payantes (Aura Plus et Aura Pro) sont actuellement en phase d’évaluation d'infrastructure afin de déterminer les coûts d'inférence exacts et d'offrir la tarification la plus juste.
        </p>
        <p>
          Tant que l’intégration définitive des paiements réels n'est pas officialisée par l'éditeur, <strong>aucun débit bancaire ou Mobile Money n'est effectué</strong>. Les inscriptions s'effectuent sous forme de liste d'attente prioritaire gratuite.
        </p>
      </section>

      <section id="passerelles-paiement" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Moyens de paiement prévus et passerelles locales
        </h2>
        <p>
          Pour permettre un accès fluide et inclusif, notamment pour les utilisateurs opérant depuis le Bénin et l’Afrique de l’Ouest, Aura prépare l’activation de passerelles agréées :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Mobile Money</strong> : MTN Mobile Money (MoMo), Moov Money et Celtiis Cash via les agrégateurs régionaux <strong>FedaPay</strong> et <strong>Kkiapay</strong>.</li>
          <li><strong>Cartes Bancaires</strong> : Visa et Mastercard via passerelles sécurisées certifiées PCI-DSS.</li>
        </ul>
        <p>
          Aura ne stocke sur ses propres serveurs aucune donnée confidentielle de carte bancaire, code secret ou numéro de compte bancaire.
        </p>
      </section>

      <section id="debits-idempotence" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Règles de décompte équitable et idempotence
        </h2>
        <div className="p-4 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/30 text-xs text-[#14282D] dark:text-[#F3F2EC] space-y-1">
          <span className="font-bold text-[#078348] dark:text-[#8CCB4A] block">
            Principe de réservation à double phase (Two-Phase Commit) :
          </span>
          <p className="leading-relaxed">
            Pour protéger votre budget, une opération ne débite vos unités qu’en cas de réponse IA réussie. Si une coupure réseau, une panne de fournisseur ou un blocage technique survient, les unités pré-réservées sont <strong>automatiquement libérées</strong> sans pénalité. Les tentatives répétées utilisent un identifiant d'opération idempotent pour empêcher tout double débit.
          </p>
        </div>
      </section>

      <section id="remboursement" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Politique de rétractation et remboursements
        </h2>
        <p>
          Dès l'ouverture des souscriptions payantes, l’Utilisateur consommateur disposera d'un droit de rétractation légal de quatorze (14) jours, sous réserve que l’utilisation du service n’ait pas commencé avec son accord exprès avant la fin de ce délai.
        </p>
        <p>
          En cas d'incident technique majeur de nos serveurs empêchant l'accès au service de manière prolongée et avérée, l'Utilisateur pourra solliciter une prolongation de son cycle d'abonnement ou un remboursement prorata temporis en s'adressant au support officiel.
        </p>
      </section>

      <section id="modifications-prix" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Évolution des quotas et révisions tarifaires
        </h2>
        <p>
          L’éditeur se réserve la faculté d'ajuster les volumes d'unités ou les caractéristiques des plans freemium pour s'adapter à l'évolution des coûts des modèles d'IA fournisseurs. Toute révision affectant un abonnement payant fera l'objet d'une notification préalable par e-mail au moins 30 jours avant son entrée en vigueur.
        </p>
      </section>
    </LegalLayout>
  );
};
