import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const AcceptableUsePage: React.FC = () => {
  const toc = [
    { id: 'principes', label: '1. Principes fondamentaux' },
    { id: 'interdictions', label: '2. Usages formellement interdits' },
    { id: 'securite-systemes', label: '3. Sécurité des systèmes et intégrité' },
    { id: 'garde-fous', label: '4. Garde-fous et modération de l’IA' },
    { id: 'sanctions', label: '5. Signalement et mesures applicables' },
  ];

  return (
    <LegalLayout
      title="Politique d’Utilisation Acceptable"
      subtitle="Règles déontologiques, garde-fous éthiques et interdictions applicables à l'utilisation des outils d'IA d'Aura."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="principes" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Principes fondamentaux
        </h2>
        <p>
          Aura est conçue pour stimuler la créativité, l'apprentissage, le développement logiciel et la productivité professionnelle. L’utilisation de nos outils d'intelligence artificielle doit être conforme aux lois applicables, respecter les droits d'autrui et préserver l'intégrité de nos infrastructures.
        </p>
      </section>

      <section id="interdictions" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Usages formellement interdits
        </h2>
        <p>Il est strictement interdit d'utiliser Aura pour générer, inciter, assister ou faciliter :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Activités illégales ou criminelles</strong> : terrorisme, blanchiment, trafic, fraude financière ou usurpation d'identité.</li>
          <li><strong>Violences, incitation à la haine et discriminations</strong> : propos discriminatoires fondés sur l'origine, la religion, le genre, l'orientation sexuelle ou le handicap.</li>
          <li><strong>Exploitation et atteintes aux mineurs</strong> : tout contenu d'exploitation sexuelle d'enfants (CSAM) ou d'atteinte physique ou psychologique aux mineurs fait l'objet d'un signalement immédiat aux autorités judiciaires compétentes.</li>
          <li><strong>Désinformation et manipulations</strong> : génération à grande échelle de fausses informations, de deepfakes non déclarés ou d'attaques d'ingénierie sociale.</li>
          <li><strong>Cyberattaques et logiciels malveillants</strong> : conception de virus, malwares, rançongiciels, exploits zero-day ou scanners automatisés de vulnérabilités non autorisés.</li>
          <li><strong>Pratiques médicales, juridiques ou financières non supervisées</strong> : fourniture de diagnostics médicaux critiques, de conseils de prescription ou de conseils d'investissement financiers sans supervision d'un professionnel habilité.</li>
        </ul>
      </section>

      <section id="securite-systemes" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Sécurité des systèmes et intégrité de la plateforme
        </h2>
        <p>L’Utilisateur s'interdit formellement :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Toute attaque par déni de service (DoS/DDoS) ou envoi massif de requêtes abusives (spam d'API).</li>
          <li>Le contournement des systèmes de quotas mensuels mis en place côté serveur.</li>
          <li>La création de comptes multiples automatisés afin de contourner les limites d'unités gratuites.</li>
          <li>L'injection de prompts adverses (jailbreaking) visant à désactiver les filtres de sécurité des modèles d'IA.</li>
        </ul>
      </section>

      <section id="garde-fous" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Garde-fous et modération de l’IA
        </h2>
        <p>
          Les modèles d'intelligence artificielle intégrés à Aura disposent de filtres de sécurité intégrés bloquant automatiquement la génération de contenus toxiques ou dangereux. Lorsqu'une requête est refusée par les garde-fous de sécurité, aucun débit injustifié n'est appliqué à vos unités de quota.
        </p>
      </section>

      <section id="sanctions" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Signalement et mesures applicables
        </h2>
        <p>
          En cas de manquement avéré à la présente politique, l'éditeur se réserve le droit de :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Émettre un avertissement formel à l'Utilisateur.</li>
          <li>Suspendre temporairement l'accès aux générations d'IA.</li>
          <li>Clôturer définitivement le compte de l'Utilisateur sans indemnité.</li>
          <li>Informer les autorités compétentes en cas d'infraction pénale.</li>
        </ul>
      </section>
    </LegalLayout>
  );
};
