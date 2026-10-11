import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';
import { AuraMode } from '../shared/types';
import { MODE_DEFINITIONS } from '../components/workspace/PromptComposer';

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  mode: AuraMode;
  audience: string;
  prompt: string;
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Landing Page E-Commerce avec Aperçu Direct',
    description:
      'Génère une boutique en ligne responsive complète en un seul fichier HTML/CSS avec aperçu interactif immédiat.',
    mode: 'code',
    audience: 'Développeurs & Entrepreneurs',
    prompt:
      'Crée une page e-commerce moderne et responsive en HTML/CSS/JS autonome (dans un bloc ```html) pour une marque africaine de produits électroniques et accessoires, avec panier interactif.',
  },
  {
    id: 'tpl-2',
    title: 'Veille Stratégique & Recherche Web Sourcée',
    description:
      'Interroge le web en temps réel via Google Search Grounding et synthétise les sources vérifiées.',
    mode: 'search',
    audience: 'Analystes & Étudiants',
    prompt:
      'Recherche et synthétise avec sources vérifiées les principales innovations dans le paiement mobile et la fintech en Afrique de l’Ouest et Centrale.',
  },
  {
    id: 'tpl-3',
    title: 'Plan d’Affaires & Modèle Économique Structuré',
    description:
      'Structure une proposition de valeur, les segments clients, les coûts et les canaux d’acquisition.',
    mode: 'chat',
    audience: 'Entrepreneurs & PME',
    prompt:
      'Aide-moi à construire un modèle stratégique complet et un plan de lancement sur 60 jours pour une plateforme de formation professionnelle en ligne.',
  },
  {
    id: 'tpl-4',
    title: 'Direction Artistique & Campagne de Marque',
    description:
      'Conçoit l’identité narrative, le calendrier éditorial et les prompts visuels détaillés.',
    mode: 'create',
    audience: 'Créateurs & Studios',
    prompt:
      'Conçois le manifeste de marque, la stratégie de contenu sur 4 semaines et 3 prompts visuels détaillés pour une marque d’artisanat contemporain.',
  },
  {
    id: 'tpl-5',
    title: 'Explication Pédagogique & Fiche de Révision',
    description:
      'Transforme un sujet complexe d’informatique, de sciences ou d’économie en fiche claire avec quiz.',
    mode: 'chat',
    audience: 'Étudiants',
    prompt:
      'Explique-moi le fonctionnement des bases de données relationnelles (SQL), des index et des transactions ACID avec des exemples concrets et 3 exercices corrigés.',
  },
  {
    id: 'tpl-6',
    title: 'Audit, Refactoring & Débogage TypeScript',
    description:
      'Analyse un composant ou une API pour améliorer sa sécurité, sa lisibilité et ses performances.',
    mode: 'code',
    audience: 'Développeurs',
    prompt:
      'Montre-moi comment structurer une API REST Express + TypeScript robuste avec validation Zod, gestion centralisée des erreurs et protection des routes.',
  },
  {
    id: 'tpl-7',
    title: 'Étude Comparative d’Outils & Frameworks',
    description:
      'Compare objectivement des technologies récentes avec sources vérifiées à l’appui.',
    mode: 'search',
    audience: 'Architectes & Développeurs',
    prompt:
      'Compare les performances, l’écosystème et les cas d’usage de Vite, Next.js et Astro en 2026 avec des références vérifiées.',
  },
  {
    id: 'tpl-8',
    title: 'Script Vidéo Éducatif & Storytelling',
    description:
      'Rédige un script rythmé (accroche, développement, appel à l’action) pour format court ou long.',
    mode: 'create',
    audience: 'Créateurs de contenu',
    prompt:
      'Rédige un script vidéo captivant de 90 secondes expliquant comment l’intelligence artificielle peut aider les étudiants et entrepreneurs au quotidien.',
  },
];

export const ExplorePage: React.FC = () => {
  const { setActiveMode, sendMessage, language } = useAura();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<AuraMode | 'all'>('all');

  const filteredTemplates =
    selectedMode === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.mode === selectedMode);

  const handleRunTemplate = async (tpl: PromptTemplate) => {
    setActiveMode(tpl.mode);
    await sendMessage({
      message: tpl.prompt,
      mode: tpl.mode,
      onConversationReady: (readyId) => {
        navigate(`/app/chat/${readyId}`);
      },
    });
  };

  const handlePrepareInComposer = (tpl: PromptTemplate) => {
    setActiveMode(tpl.mode);
    navigate(`/app?mode=${tpl.mode}&prompt=${encodeURIComponent(tpl.prompt)}`);
  };

  return (
    <WorkspaceLayout headerTitle={language === 'en' ? 'Explore' : 'Explorer'}>
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
            {language === 'en'
              ? 'Explore Verified Task Templates'
              : 'Explorer les modèles de tâches Aura'}
          </h2>
          <p className="text-sm text-[#77817F] mt-1">
            {language === 'en'
              ? 'Ready-to-use workflows across Chat, Web Search, Code, and Create.'
              : 'Des points de départ concrets et immédiatement exécutables dans les quatre modes d’Aura.'}
          </p>
        </div>

        {/* Mode Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8E6DE] dark:border-[#243337]">
          {(
            [
              { id: 'all', label: language === 'en' ? 'All templates' : 'Tous les modèles' },
              { id: 'chat', label: 'Chat' },
              { id: 'search', label: language === 'en' ? 'Search' : 'Recherche' },
              { id: 'code', label: 'Code' },
              { id: 'create', label: language === 'en' ? 'Create' : 'Créer' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedMode(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === f.id
                  ? 'bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold'
                  : 'bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] text-[#77817F] hover:text-[#14282D]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const modeDef = MODE_DEFINITIONS[tpl.mode];
            return (
              <div
                key={tpl.id}
                className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between hover:border-[#078348]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#77817F] mb-2">
                    <i className={modeDef.icon} style={{ color: modeDef.accentColor }} />
                    <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      {language === 'en' ? modeDef.labelEn : modeDef.labelFr}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{tpl.audience}</span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-[#77817F] leading-relaxed mt-1.5">
                    {tpl.description}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE]/80 dark:border-[#243337] text-xs text-[#14282D]/85 dark:text-[#F3F2EC]/85 italic">
                    « {tpl.prompt} »
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E6DE]/60 dark:border-[#243337] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrepareInComposer(tpl)}
                    className="text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-white cursor-pointer"
                  >
                    Personnaliser la demande
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunTemplate(tpl)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline cursor-pointer"
                  >
                    <span>Exécuter maintenant</span>
                    <i className="fa-solid fa-arrow-right text-[10px]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WorkspaceLayout>
  );
};
