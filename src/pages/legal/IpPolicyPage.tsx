import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const IpPolicyPage: React.FC = () => {
  const toc = [
    { id: 'propriete-utilisateur', label: '1. Propriété des contenus et créations utilisateur' },
    { id: 'droits-aura', label: '2. Droits de propriété intellectuelle d’Aura' },
    { id: 'code-studio', label: '3. Code généré dans Aura Studio et licences open source' },
    { id: 'donnees-entrainement', label: '4. Non-appropriation et non-entraînement sur vos données' },
    { id: 'respect-tiers', label: '5. Respect des droits de tiers et interdiction du plagiat' },
    { id: 'signalement-infraction', label: '6. Procédure de signalement d’atteinte aux droits d’auteur' },
  ];

  return (
    <LegalLayout
      title="Propriété Intellectuelle & Contenus Générés"
      subtitle="Attribution des droits d'auteur, titularité du code généré dans Aura Studio et protection de vos créations."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="propriete-utilisateur" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Propriété des contenus et créations de l’Utilisateur
        </h2>
        <p>
          L’Utilisateur conserve l’entière et exclusive propriété de tous les éléments qu’il fournit à Aura, notamment ses requêtes (« <em>prompts</em> »), consignes de personnalisation, documents téléchargés dans la bibliothèque et directives de projet.
        </p>
        <p>
          Sous réserve du strict respect des lois applicables et des présentes conditions, <strong>l’Utilisateur détient tous les droits d’exploitation, d’utilisation commerciale, de modification et de distribution sur les résultats générés par Aura</strong> pour son compte (textes, synthèses, analyses de recherche, composants d’interface, fichiers de code source et maquettes web).
        </p>
        <div className="p-3.5 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/25 text-xs text-[#078348] dark:text-[#8CCB4A] space-y-1">
          <span className="font-bold block">Principe directeur :</span>
          <p className="leading-relaxed">
            Aura ne revendique aucun droit de propriété intellectuelle sur les livrables, applications web, sites ou codes conçus par ses utilisateurs au sein d’Aura Studio ou d’Aura Chat.
          </p>
        </div>
      </section>

      <section id="droits-aura" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Droits de propriété intellectuelle de la plateforme Aura
        </h2>
        <p>
          La plateforme Aura, comprenant son architecture logicielle, ses algorithmes d'orchestration, son design system (palette ivoire chaud, typographies, icônes, composants visuels), son logo officiel « Aura », ses marques déposées, interfaces utilisateur et documentations associées, sont et demeurent la propriété exclusive de [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Raison sociale de l'éditeur ou titulaire des droits de propriété intellectuelle].
        </p>
        <p>
          Toute reproduction, ingénierie inverse (<em>reverse engineering</em>), décompilation, extraction systématique ou réutilisation non autorisée du code source d’Aura ou de ses éléments graphiques distinctifs est formellement interdite sans accord écrit préalable.
        </p>
      </section>

      <section id="code-studio" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Code généré dans Aura Studio et licences open source
        </h2>
        <p>
          Lorsque l'Utilisateur génère ou modifie du code HTML, CSS, JavaScript ou TypeScript au moyen d’Aura Studio :
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
          <li>
            <strong>Liberté d’export et de déploiement</strong> : L’Utilisateur est libre de télécharger le code source produit, de l’héberger sur le prestataire de son choix (ex. Vercel, Netlify, serveurs privés) et de l’intégrer dans des projets commerciaux ou personnels.
          </li>
          <li>
            <strong>Composants et bibliothèques tiers</strong> : Les prototypes générés peuvent faire référence à des bibliothèques open source standard du Web (ex. Tailwind CSS, Lucide, FontAwesome). L'Utilisateur s’engage à respecter les termes des licences libres correspondantes (notamment licences MIT, Apache 2.0 ou SIL OFL).
          </li>
          <li>
            <strong>Absence de garantie d'antériorité</strong> : Les modèles d'intelligence artificielle produisant du code par association probabiliste, Aura ne peut garantir de manière absolue qu'une fonction ou un extrait algorithmique généré ne présente aucune similarité fortuite avec un logiciel existant sous licence restrictive. Il appartient à l'Utilisateur de procéder aux audits de conformité logicielle requis avant toute commercialisation critique.
          </li>
        </ul>
      </section>

      <section id="donnees-entrainement" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Non-appropriation et non-entraînement sur vos données
        </h2>
        <p>
          Conformément à nos engagements de confidentialité d'entreprise :
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>Vos prompts, conversations, bases de code privées et projets enregistrés ne sont pas utilisés pour réentraîner les modèles de fondation publics.</li>
          <li>Aura n’accorde à ses fournisseurs d’inférence d'IA aucun droit de réutilisation de vos données à des fins d'apprentissage de modèles tiers.</li>
          <li>La suppression de votre compte ou de vos conversations entraîne l'effacement définitif de vos contenus des bases opérationnelles actives.</li>
        </ul>
      </section>

      <section id="respect-tiers" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Respect des droits des tiers et interdiction du plagiat
        </h2>
        <p>
          L’Utilisateur garantit qu’il dispose de l’ensemble des droits nécessaires sur les textes, images, spécifications et données qu'il soumet à la plateforme.
        </p>
        <p>
          Il est formellement interdit d’utiliser Aura pour reproduire sciemment des œuvres protégées par le droit d'auteur sans autorisation du titulaire des droits, pour contourner des mesures de protection technique ou pour contrefaire des marques, brevets ou secrets d'affaires.
        </p>
      </section>

      <section id="signalement-infraction" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Procédure de signalement d’atteinte aux droits d’auteur (DMCA / Notification)
        </h2>
        <p>
          Si vous estimez qu'un contenu hébergé ou produit via Aura porte atteinte à vos droits de propriété intellectuelle, vous pouvez adresser une notification formelle comprenant :
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
          <li>L’identification précise de l'œuvre protégée revendiquée.</li>
          <li>La localisation exacte du contenu litigieux (URL, identifiant ou capture).</li>
          <li>Vos coordonnées complètes (nom, organisme, adresse, e-mail et numéro de téléphone).</li>
          <li>Une déclaration sur l’honneur attestant de votre intérêt légitime et de votre bonne foi.</li>
          <li>Votre signature physique ou électronique qualifiée.</li>
        </ol>
        <div className="p-3.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] space-y-1 font-mono text-xs">
          <div>Canal de signalement DMCA / Droit d'auteur :</div>
          <div>E-mail : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : legal@aura-platform.com ou copyright@aura-platform.com]</div>
          <div>Service juridique : [À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION : Adresse postale du service juridique]</div>
          <div>Délai de traitement indicatif : examen sous 48 heures ouvrées à réception du dossier complet.</div>
        </div>
      </section>
    </LegalLayout>
  );
};
