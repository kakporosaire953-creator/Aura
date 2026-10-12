import React, { useEffect, useState } from 'react';
import { AURA_OFFICIAL_SYMBOL_PATH } from './AuraLogo';
import { AuraMode } from '../../shared/types';

export interface AuraIntelligenceCoreProps {
  /** Mode IA actif pour adapter les étapes de réflexion */
  mode?: AuraMode;
  /** Variante d'affichage : 'message' (dans le fil de discussion IA), 'workspace' (centré), 'compact' (inline) */
  variant?: 'message' | 'workspace' | 'compact';
  /** Langue de l'interface */
  language?: 'fr' | 'en';
  /** Texte personnalisé optionnel */
  customLabel?: string;
  /** Sous-titre personnalisé optionnel */
  customSublabel?: string;
  /** Classes additionnelles */
  className?: string;
}

const MODE_PHASES: Record<
  AuraMode,
  { fr: string[]; en: string[]; accent: string; badgeFr: string; badgeEn: string }
> = {
  chat: {
    badgeFr: 'Dialogue & Synthèse',
    badgeEn: 'Dialogue & Synthesis',
    accent: '#078348',
    fr: [
      'Analyse du contexte et de l’intention...',
      'Structuration du raisonnement...',
      'Rédaction d’une réponse claire et nuancée...',
    ],
    en: [
      'Analyzing context and intent...',
      'Structuring reasoning...',
      'Drafting a clear, nuanced response...',
    ],
  },
  search: {
    badgeFr: 'Recherche & Vérification',
    badgeEn: 'Search & Verification',
    accent: '#39B969',
    fr: [
      'Exploration des sources pertinentes...',
      'Croisement et vérification des informations...',
      'Synthèse structurée avec citations...',
    ],
    en: [
      'Exploring relevant sources...',
      'Cross-checking and verifying facts...',
      'Structured synthesis with citations...',
    ],
  },
  code: {
    badgeFr: 'Ingénierie & Code',
    badgeEn: 'Engineering & Code',
    accent: '#EACB37',
    fr: [
      'Conception de l’architecture technique...',
      'Écriture du code propre et modulaire...',
      'Préparation de l’aperçu interactif...',
    ],
    en: [
      'Designing technical architecture...',
      'Writing clean, modular code...',
      'Preparing interactive preview...',
    ],
  },
  create: {
    badgeFr: 'Direction Créative',
    badgeEn: 'Creative Direction',
    accent: '#FF790D',
    fr: [
      'Exploration de la direction artistique...',
      'Composition de la structure éditoriale et visuelle...',
      'Finalisation du concept créatif...',
    ],
    en: [
      'Exploring art direction...',
      'Composing editorial and visual structure...',
      'Finalizing creative concept...',
    ],
  },
  image: {
    badgeFr: 'Génération d’Image IA',
    badgeEn: 'AI Image Generation',
    accent: '#FF790D',
    fr: [
      'Analyse de la composition visuelle et des couleurs...',
      'Rendu haute définition du visuel dans Aura Studio...',
      'Finalisation de l’image et de la palette...',
    ],
    en: [
      'Analyzing visual composition and color palette...',
      'Rendering high-definition visual in Aura Studio...',
      'Finalizing image and art direction...',
    ],
  },
  video: {
    badgeFr: 'Réalisation Vidéo & Motion',
    badgeEn: 'Video & Motion Direction',
    accent: '#FF790D',
    fr: [
      'Découpage du storyboard scène par scène...',
      'Génération de la séquence animée et du flux vidéo...',
      'Synchronisation avec le lecteur Aura Studio...',
    ],
    en: [
      'Structuring scene-by-scene storyboard...',
      'Generating animated sequence and video stream...',
      'Synchronizing with Aura Studio video player...',
    ],
  },
  slides: {
    badgeFr: 'Aura Slides Studio (16:9)',
    badgeEn: 'Aura Slides Studio (16:9)',
    accent: '#078348',
    fr: [
      'Structuration narrative du pitch deck...',
      'Conception des diapositives, métriques et visuels...',
      'Assemblage de la présentation interactive 16:9...',
    ],
    en: [
      'Structuring presentation narrative...',
      'Designing slides, key metrics, and layouts...',
      'Assembling interactive 16:9 slide deck...',
    ],
  },
};

/**
 * ANIMATION B — AURA INTELLIGENCE CORE
 * Système de chargement IA officiel d'Aura :
 * - Symbole officiel '/assets/aura-symbol.png' intact au cœur
 * - Arcs SVG organiques asymétriques coordonnés en dégradé vert-jaune-orange (#078348 -> #39B969 -> #CBE65C -> #EACB37 -> #FF790D)
 * - Halo diffus respirant émanant du symbole lui-même
 * - Étapes cognitives dynamiques selon le mode (Discuter, Rechercher, Coder, Créer)
 */
export const AuraIntelligenceCore: React.FC<AuraIntelligenceCoreProps> = ({
  mode = 'chat',
  variant = 'message',
  language = 'fr',
  customLabel,
  customSublabel,
  className = '',
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const uid = React.useId().replace(/:/g, '');

  const modeConfig = MODE_PHASES[mode] || MODE_PHASES.chat;
  const phases = language === 'en' ? modeConfig.en : modeConfig.fr;

  useEffect(() => {
    setPhaseIndex(0);
    const interval = window.setInterval(() => {
      setPhaseIndex((prev) => (prev < phases.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => window.clearInterval(interval);
  }, [mode, language, phases.length]);

  const activePhaseText = customLabel || phases[phaseIndex];
  const badgeText =
    customSublabel || (language === 'en' ? modeConfig.badgeEn : modeConfig.badgeFr);

  const coreSize =
    variant === 'workspace' ? 88 : variant === 'compact' ? 38 : 54;
  const symbolSize =
    variant === 'workspace' ? 48 : variant === 'compact' ? 22 : 30;

  const renderCoreEmblem = () => (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: coreSize, height: coreSize }}
    >
      {/* Halo lumineux diffus émanant du symbole */}
      <div
        aria-hidden="true"
        className="aura-core-halo absolute inset-[-22%] rounded-full pointer-events-none"
      />

      {/* Arcs SVG organiques asymétriques coordonnés (aucun spinner générique) */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient
            id={`aura-core-grad-primary-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#078348" stopOpacity="0.05" />
            <stop offset="35%" stopColor="#39B969" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#CBE65C" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EACB37" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient
            id={`aura-core-grad-secondary-${uid}`}
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FF790D" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#EACB37" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#39B969" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#078348" stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id={`aura-core-grad-inner-${uid}`}
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
          >
            <stop offset="0%" stopColor="#39B969" stopOpacity="0" />
            <stop offset="50%" stopColor="#CBE65C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FF790D" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arc extérieur principal : flux vert profond -> jaune solaire */}
        <g className="aura-core-arc-1">
          <path
            d="M 16 50 A 34 34 0 0 1 78 26"
            stroke={`url(#aura-core-grad-primary-${uid})`}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>

        {/* Arc intermédiaire opposé : flux ambre -> vert émeraude */}
        <g className="aura-core-arc-2">
          <path
            d="M 82 56 A 32 32 0 0 1 24 72"
            stroke={`url(#aura-core-grad-secondary-${uid})`}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Ruban orbital fin intérieur */}
        <g className="aura-core-arc-3">
          <circle
            cx="50"
            cy="50"
            r="26"
            stroke={`url(#aura-core-grad-inner-${uid})`}
            strokeWidth="1.2"
            strokeDasharray="42 120"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Symbole officiel Aura au centre avec lévitation subtile et reflet sur sa silhouette */}
      <div
        className="relative z-10 flex items-center justify-center aura-symbol-levitate"
        style={{ width: symbolSize, height: symbolSize }}
      >
        <img
          src={AURA_OFFICIAL_SYMBOL_PATH}
          alt="Aura Intelligence Core"
          width={symbolSize}
          height={symbolSize}
          referrerPolicy="no-referrer"
          draggable={false}
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(255,121,13,0.18)]"
        />
        <span aria-hidden="true" className="aura-ribbon-shimmer" />
      </div>
    </div>
  );

  // Variante centrée (chargement d'une conversation ou d'une vue du workspace)
  if (variant === 'workspace') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
      >
        {renderCoreEmblem()}
        <p className="mt-4 font-display font-semibold text-base text-[#14282D] dark:text-[#F3F2EC]">
          {activePhaseText}
        </p>
        <p className="mt-1 text-xs text-[#77817F] dark:text-[#94A09E]">
          {badgeText}
        </p>
      </div>
    );
  }

  // Variante compacte (inline)
  if (variant === 'compact') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2.5 ${className}`}
      >
        {renderCoreEmblem()}
        <span className="text-xs font-medium text-[#14282D] dark:text-[#F3F2EC]">
          {activePhaseText}
        </span>
      </div>
    );
  }

  // Variante message (dans le flux de conversation pendant la génération d'une réponse IA)
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 sm:p-6 shadow-[0_6px_24px_rgba(20,40,45,0.03)] ${className}`}
    >
      {/* Fine barre lumineuse supérieure en dégradé signature */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px] opacity-85"
        style={{
          background:
            'linear-gradient(90deg, #078348 0%, #39B969 28%, #CBE65C 55%, #EACB37 78%, #FF790D 100%)',
        }}
      />

      <div className="flex items-center gap-4">
        {renderCoreEmblem()}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-[#77817F] dark:text-[#94A09E] mb-1">
            <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
              Aura
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ color: modeConfig.accent }} className="font-medium">
              {badgeText}
            </span>
          </div>

          <p className="text-sm sm:text-[15px] font-medium text-[#14282D] dark:text-[#F3F2EC] transition-opacity duration-300">
            {activePhaseText}
          </p>

          {/* Indicateur de progression organique à 3 segments */}
          <div
            aria-hidden="true"
            className="mt-2.5 flex items-center gap-1.5 max-w-[180px]"
          >
            {phases.map((_, idx) => {
              const isCompletedOrActive = idx <= phaseIndex;
              return (
                <span
                  key={idx}
                  className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background: isCompletedOrActive
                      ? 'linear-gradient(90deg, #078348 0%, #39B969 45%, #EACB37 80%, #FF790D 100%)'
                      : 'rgba(119, 129, 127, 0.18)',
                    opacity: idx === phaseIndex ? 1 : isCompletedOrActive ? 0.65 : 0.35,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
