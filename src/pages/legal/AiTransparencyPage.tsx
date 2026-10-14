import React from 'react';
import { LegalLayout } from '../../components/legal/LegalLayout';

export const AiTransparencyPage: React.FC = () => {
  const toc = [
    { id: 'nature-ia', label: '1. Nature probabiliste de l’IA' },
    { id: 'hallucinations', label: '2. Risque d’inexactitude et hallucinations' },
    { id: 'explore-sources', label: '3. Recherche web et sources vérifiées' },
    { id: 'code-studio', label: '4. Génération de code et sécurité' },
    { id: 'supervision', label: '5. Obligation de supervision humaine' },
    { id: 'impact-environnemental', label: '6. Sobriété numérique et coûts d’inférence' },
  ];

  return (
    <LegalLayout
      title="Transparence, Limites & Responsabilité de l’IA"
      subtitle="Comprendre le fonctionnement des modèles génératifs, les sources vérifiées et l'importance de la supervision humaine."
      lastUpdated="14 octobre 2026"
      version="2026-v1.0"
      toc={toc}
    >
      <section id="nature-ia" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          1. Nature probabiliste des modèles génératifs
        </h2>
        <p>
          Les fonctionnalités d’Aura reposent sur des modèles d'intelligence artificielle fondés sur l'architecture Transformer (notamment la famille de modèles Google Gemini). Ces modèles génèrent des réponses par calcul probabiliste de la suite de mots ou de tokens la plus pertinente compte tenu du prompt de l'Utilisateur et du contexte fourni.
        </p>
        <p>
          Bien que hautement performants, ces modèles ne possèdent ni conscience, ni volonté propre, ni compréhension subjective de la réalité factuelle.
        </p>
      </section>

      <section id="hallucinations" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          2. Risque d’inexactitude (« Hallucinations »)
        </h2>
        <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-[#2D2111] border border-[#FDE68A] dark:border-[#533816] text-xs text-[#92400E] dark:text-[#FCD34D] space-y-1">
          <span className="font-bold block">Avertissement factuel :</span>
          <p className="leading-relaxed">
            Les modèles de langage peuvent occasionnellement produire des affirmations plausibles en apparence mais matériellement inexactes, incomplètes ou obsolètes (phénomène connu sous le nom d’« hallucination »).
          </p>
        </div>
        <p>
          L’Utilisateur demeure seul responsable de la vérification des faits, calculs critiques, dates et citations fournis par l’IA avant toute prise de décision opérationnelle, académique ou commerciale.
        </p>
      </section>

      <section id="explore-sources" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          3. Recherche web et sources vérifiées (Aura Explore)
        </h2>
        <p>
          Pour limiter le risque d'inexactitude sur les sujets récents ou nécessitant des données vérifiées, Aura intègre <strong>Aura Explore</strong>, qui connecte le modèle au moteur de recherche Google via Google Grounding :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Chaque affirmation est reliée à des sources web accessibles avec leur titre et leur URL d'origine.</li>
          <li>L’Utilisateur est invité à cliquer sur les sources fournies pour vérifier la teneur des documents primaires.</li>
        </ul>
      </section>

      <section id="code-studio" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          4. Génération de code et sécurité applicative (Aura Studio)
        </h2>
        <p>
          Le code HTML, CSS, JavaScript et React généré par <strong>Aura Studio</strong> est exécuté dans un environnement bac à sable (sandbox) isolé dans votre navigateur.
        </p>
        <p>
          Avant de déployer tout code généré dans un environnement de production réel ou de le connecter à des bases de données sensibles, l’Utilisateur doit impérativement procéder à une revue de code rigoureuse (audit des vulnérabilités, validation des entrées et respect des bonnes pratiques de sécurité informatique).
        </p>
      </section>

      <section id="supervision" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          5. Principe de supervision humaine obligatoire
        </h2>
        <p>
          L’IA d’Aura est conçue pour assister l’humain, et non pour se substituer à la responsabilité d'un professionnel qualifié :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Domaine juridique</strong> : ne remplace pas l'avis d'un avocat ou conseiller juridique.</li>
          <li><strong>Domaine médical</strong> : ne remplace pas une consultation ou prescription médicale.</li>
          <li><strong>Domaine comptable &amp; fiscal</strong> : ne remplace pas la certification d'un expert-comptable.</li>
        </ul>
      </section>

      <section id="impact-environnemental" className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-[#14282D] dark:text-[#F3F2EC]">
          6. Sobriété numérique et coûts d’inférence
        </h2>
        <p>
          L’inférence des grands modèles de langage requiert une puissance de calcul importante sur serveurs spécialisés (GPU / TPU). Le système de quotas freemium d’Aura (30 unités/mois) a été conçu dans un souci d’équilibre économique et de responsabilité environnementale, en favorisant l’utilisation de modèles optimisés à faible consommation énergétique (comme Gemini 3.8 Flash).
        </p>
      </section>
    </LegalLayout>
  );
};
