import React from 'react';

export type AuraLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
export type AuraLogoVariant = 'full' | 'symbol' | 'compact';
export type AuraActivityState = 'idle' | 'activating' | 'generating';

export interface AuraLogoProps {
  /** Taille du logo : xs (22px), sm (28px), md (36px), lg (48px), xl (68px), hero (dashboard 180px-216px) */
  size?: AuraLogoSize;
  /** Variante d'affichage : 'full' (symbole + mot Aura), 'symbol' (symbole seul), 'compact' */
  variant?: AuraLogoVariant;
  /** Compatibilité ascendante avec les appels existants */
  withWordmark?: boolean;
  /** Active l'animation lumineuse (flottement subtil, respiration et reflet sur les rubans) */
  animated?: boolean;
  /** Active le halo lumineux derrière le symbole */
  glow?: boolean | 'subtle' | 'hero' | 'active';
  /** État d'interaction (repos, nouvelle conversation, génération IA en cours) */
  activityState?: AuraActivityState;
  /** Classes CSS additionnelles sur le conteneur */
  className?: string;
  /** Classes CSS additionnelles sur le texte 'Aura' */
  wordmarkClassName?: string;
}

/**
 * Source unique de vérité pour le symbole officiel d'Aura :
 * Utilise exclusivement '/assets/aura-symbol.png' (PNG transparent haute résolution
 * fidèle au symbole officiel de rubans organiques entrelacés vert-jaune-orange).
 */
export const AURA_OFFICIAL_SYMBOL_PATH = '/assets/aura-symbol.png';

export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 'md',
  variant,
  withWordmark,
  animated = false,
  glow = false,
  activityState = 'idle',
  className = '',
  wordmarkClassName = '',
}) => {
  // Résolution de la présence du mot "Aura" selon `variant` ou `withWordmark`
  const resolvedVariant: AuraLogoVariant =
    variant ?? (withWordmark === false || size === 'hero' ? 'symbol' : 'full');
  const showWordmark = resolvedVariant === 'full';

  // Dimensions en pixels pour les tailles standards
  const pixelMap: Record<Exclude<AuraLogoSize, 'hero'>, number> = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 52,
    xl: 72,
  };

  const stateClass =
    activityState === 'generating'
      ? 'aura-state-generating'
      : activityState === 'activating'
      ? 'aura-state-activating'
      : '';

  // ===========================================================================
  // AFFICHAGE HERO (Écran d'accueil du Dashboard IA — Point focal à 5 couches)
  // ===========================================================================
  if (size === 'hero') {
    const showHeroGlow = glow !== false;
    return (
      <div
        className={`aura-interactive-group relative inline-flex items-center justify-center select-none w-[156px] h-[172px] sm:w-[204px] sm:h-[224px] ${stateClass} ${className}`}
      >
        {/* Couche 1 & 2 : Halo lumineux progressif vert-jaune-orange + Respiration lente */}
        {showHeroGlow && <div aria-hidden="true" className="aura-hero-halo" />}

        {/* Ombre lumineuse douce projetée sous le symbole en suspension */}
        {showHeroGlow && <div aria-hidden="true" className="aura-ground-glow" />}

        {/* Conteneur de lévitation (Couche 4 : Flottement vertical subtil) */}
        <div
          className={`relative z-10 w-full h-full flex items-center justify-center ${
            animated ? 'aura-symbol-levitate' : ''
          }`}
        >
          {/* Image officielle unique de vérité */}
          <img
            src={AURA_OFFICIAL_SYMBOL_PATH}
            alt="Symbole officiel Aura"
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_12px_28px_rgba(255,121,13,0.12)]"
          />

          {/* Couche 3 : Reflet lumineux parcourant délicatement la silhouette des rubans */}
          {animated && <div aria-hidden="true" className="aura-ribbon-shimmer" />}
        </div>
      </div>
    );
  }

  // ===========================================================================
  // AFFICHAGE NAVIGATION, SIDEBAR, CARTES & ÉTATS DE GÉNÉRATION IA
  // ===========================================================================
  const px = pixelMap[size];
  const enableSubtleGlow =
    glow === true ||
    glow === 'subtle' ||
    glow === 'active' ||
    activityState === 'generating';

  const wordmarkTextSize =
    size === 'xs'
      ? 'text-base'
      : size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-2xl'
      : size === 'xl'
      ? 'text-3xl'
      : 'text-xl';

  return (
    <span
      className={`inline-flex items-center ${
        resolvedVariant === 'compact' ? 'gap-2' : 'gap-2.5'
      } shrink-0 select-none ${stateClass} ${className}`}
    >
      <span
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: px, height: px }}
      >
        {/* Halo discret uniquement si glow ou génération IA active */}
        {enableSubtleGlow && <span aria-hidden="true" className="aura-subtle-halo" />}

        <span
          className={`relative z-10 w-full h-full flex items-center justify-center ${
            animated ? 'aura-symbol-levitate' : ''
          }`}
        >
          <img
            src={AURA_OFFICIAL_SYMBOL_PATH}
            alt="Logo Aura"
            width={px}
            height={px}
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-contain"
          />

          {animated && <span aria-hidden="true" className="aura-ribbon-shimmer" />}
        </span>
      </span>

      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight text-[#14282D] dark:text-[#F3F2EC] whitespace-nowrap ${wordmarkTextSize} ${wordmarkClassName}`}
        >
          Aura
        </span>
      )}
    </span>
  );
};
