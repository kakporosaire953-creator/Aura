import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const TermsPage: React.FC = () => {
  const toc = [
    { id: 'preambule', label: '1. Préambule et objet' },
    { id: 'acces', label: '2. Accès au service et éligibilité' },
    { id: 'compte', label: '3. Création et sécurité du compte' },
    { id: 'services-ia', label: '4. Fonctionnalités et services d’IA' },
    { id: 'quotas-usage', label: '5. Quotas freemium et utilisation équitable' },
    { id: 'engagements', label: '6. Engagements de l’utilisateur' },
    { id: 'disponibilite', label: '7. Disponibilité et maintenance' },
    { id: 'responsabilite', label: '8. Limitation de responsabilité' },
    { id: 'resiliation', label: '9. Suspension et résiliation' },
    { id: 'loi', label: '10. Droit applicable et juridiction' },
  ];

  return (
    <LegalLayout
      title="Conditions Générales d’Utilisation"
      subtitle="Modalités d’accès et d’exploitation des services de la plateforme Aura (Aura Chat, Aura Explore, Aura Studio, Aura Projects)."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="preambule" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Préambule et objet
        </h2>
        <p>
          Les présentes Conditions Générales d’Utilisation (ci-après les « <strong>CGU</strong> ») définissent les règles et conditions dans lesquelles l’éditeur [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Raison sociale ou Nom de l'éditeur, forme juridique, immatriculation au RCCM / Registre du Commerce] met à disposition des utilisateurs (ci-après « <strong>l’Utilisateur</strong> ») la plateforme <strong>Aura</strong>, accessible à l’adresse [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : URL officielle du site].
        </p>
        <p>
          En créant un compte ou en accédant aux services d’Aura, l’Utilisateur reconnaît avoir pris connaissance des présentes CGU et de la Politique de Confidentialité, et s'engage à les respecter sans réserve.
        </p>
      </section>

      <section id="acces" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Accès au service et éligibilité
        </h2>
        <p>
          La plateforme Aura est accessible à toute personne physique disposant de la pleine capacité juridique, ou à toute entité morale dûment représentée par une personne habilitée.
        </p>
        <p>
          L’utilisation d’Aura requiert un équipement informatique compatible (ordinateur, tablette ou smartphone) ainsi qu’une connexion Internet stable. Les frais liés aux équipements et aux télécommunications demeurent à la charge exclusive de l’Utilisateur.
        </p>
      </section>

      <section id="compte" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Création et sécurité du compte
        </h2>
        <p>
          Pour bénéficier des fonctionnalités interactives et de la sauvegarde de ses travaux, l’Utilisateur doit s’inscrire en fournissant des informations sincères et exactes. L’identifiant et le mot de passe sont strictement personnels et confidentiels.
        </p>
        <p>
          L’Utilisateur est seul responsable des activités intervenant sur son compte. Toute connexion ou transmission de données effectuée à partir de son compte est présumée émaner de lui. En cas de perte, vol ou utilisation non autorisée de ses identifiants, l’Utilisateur s’engage à en avertir sans délai l’éditeur via [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Adresse e-mail de sécurité, ex. security@aura-platform.com].
        </p>
      </section>

      <section id="services-ia" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Fonctionnalités et services d’IA
        </h2>
        <p>
          Aura met à disposition une suite d’outils d’intelligence artificielle, notamment :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Aura Chat</strong> : dialogue, raisonnement et assistance textuelle.</li>
          <li><strong>Aura Explore</strong> : recherche web augmentée et synthèses sourcées.</li>
          <li><strong>Aura Studio & Code</strong> : génération et modification interactive de code web (HTML/CSS/JS/React).</li>
          <li><strong>Aura Projects & Missions</strong> : organisation par contextes de travail et bibliothèques de documents.</li>
          <li><strong>Multimédia & Slides</strong> : création d’illustrations vectorielles, animations et présentations 16:9.</li>
        </ul>
        <p>
          Les résultats générés par les modèles d’intelligence artificielle constituent une aide à la création et ne sauraient en aucun cas se substituer au jugement critique de l’Utilisateur ou à des conseils professionnels (juridiques, médicaux, comptables ou financiers).
        </p>
      </section>

      <section id="quotas-usage" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Quotas freemium et utilisation équitable
        </h2>
        <p>
          Aura applique un modèle freemium contrôlé côté serveur :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Chaque compte dispose de quotas mensuels prédéfinis d’unités IA, de recherches sourcées, de créations de sites et d’itérations de code.</li>
          <li>Les quotas sont réinitialisés automatiquement chaque mois civil.</li>
          <li>Lorsque le quota mensuel est atteint, les générations d’IA sont temporairement suspendues jusqu’au prochain cycle ou jusqu’à la souscription d’un plan étendu.</li>
          <li>L’atteinte d’un quota ne restreint en aucun cas l’accès en lecture, l’export ou la consultation des projets, discussions et fichiers déjà sauvegardés.</li>
        </ul>
      </section>

      <section id="engagements" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Engagements de l’utilisateur
        </h2>
        <p>
          L’Utilisateur s’interdit d’utiliser Aura pour générer, transmettre ou diffuser des contenus illicites, haineux, diffamatoires, trompeurs ou contraires à la Politique d’Utilisation Acceptable. Il s'interdit formellement toute tentative d'ingénierie inverse des modèles, d'extraction automatisée massive de données (scraping) ou de contournement des mécanismes de quotas serveur.
        </p>
      </section>

      <section id="disponibilite" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          7. Disponibilité et maintenance
        </h2>
        <p>
          L’éditeur s’efforce de maintenir un accès continu 24h/24 et 7j/7, sous réserve des opérations de maintenance programmée, de mises à jour de sécurité et des contraintes techniques inhérentes aux réseaux et aux fournisseurs d’infrastructure tiers (Vercel, Supabase, Google Cloud). Aucune garantie d’un taux de disponibilité absolu (100 %) n'est accordée au titre de l'offre gratuite.
        </p>
      </section>

      <section id="responsabilite" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          8. Limitation de responsabilité
        </h2>
        <p>
          L’éditeur ne saurait être tenu responsable des dommages indirects, pertes de profits, pertes de données ou interruptions d’activité découlant de l’utilisation ou de l’impossibilité d’utiliser les services ou des résultats produits par l’IA.
        </p>
      </section>

      <section id="resiliation" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          9. Suspension et résiliation
        </h2>
        <p>
          L’Utilisateur peut supprimer son compte à tout moment depuis la rubrique <em>Paramètres &gt; Confidentialité &amp; Données</em>. L’éditeur se réserve le droit de suspendre ou résilier sans préavis tout compte en infraction caractérisée avec les présentes CGU ou la Politique d'Utilisation Acceptable.
        </p>
      </section>

      <section id="loi" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          10. Droit applicable et juridiction compétente
        </h2>
        <p>
          Les présentes CGU sont régies par le droit en vigueur applicable à l’éditeur [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Droit de la République du Bénin / Droit applicable défini par l'éditeur]. En cas de litige, les parties s'engagent à rechercher préalablement une solution amiable avant de saisir les juridictions compétentes de [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Ville du tribunal compétent, ex. Cotonou].
        </p>
      </section>
    </LegalLayout>
  );
};
