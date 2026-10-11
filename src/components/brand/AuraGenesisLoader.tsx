import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AURA_OFFICIAL_SYMBOL_PATH } from './AuraLogo';

const GENESIS_SESSION_KEY = 'aura_genesis_seen_v1';
let genesisSeenInMemory = false;

export interface AuraGenesisLoaderProps {
  /** Permet de forcer l'aperçu de l'intro Genesis si souhaité */
  forceReplay?: boolean;
  onComplete?: () => void;
}

/**
 * ANIMATION A — AURA GENESIS
 * Écran d'éveil cinématique au lancement initial de la plateforme :
 * - Fond sombre profond #081B19 mettant en valeur la lumière émanant du symbole
 * - Rubans organiques SVG et halo diffus (#078348 -> #39B969 -> #CBE65C -> #EACB37 -> #FF790D)
 * - Symbole officiel Aura ('/assets/aura-symbol.png') intact avec reflet fin
 * - Exécuté une seule fois par session avec fallback timer garanti pour ne jamais bloquer le rendu
 */
export const AuraGenesisLoader: React.FC<AuraGenesisLoaderProps> = ({
  forceReplay = false,
  onComplete,
}) => {
  const [shouldRender, setShouldRender] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return false;
      }
    } catch {
      // ignore matchMedia errors
    }
    if (forceReplay) return true;
    if (genesisSeenInMemory) return false;
    try {
      return sessionStorage.getItem(GENESIS_SESSION_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const dismissGenesis = () => {
    genesisSeenInMemory = true;
    try {
      sessionStorage.setItem(GENESIS_SESSION_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    setIsFadingOut(true);
    setShouldRender(false);
    onComplete?.();
  };

  useEffect(() => {
    if (!shouldRender) return;

    genesisSeenInMemory = true;
    try {
      sessionStorage.setItem(GENESIS_SESSION_KEY, 'true');
    } catch {
      // ignore storage errors
    }

    // Fallback timers garantis même si requestAnimationFrame est ralenti dans un iframe en arrière-plan
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 1150);

    const hardUnmountTimer = window.setTimeout(() => {
      setShouldRender(false);
      onComplete?.();
    }, 1550);

    const overlayEl = overlayRef.current;
    const contentEl = contentRef.current;
    let tl: gsap.core.Timeline | null = null;

    if (overlayEl && contentEl) {
      try {
        tl = gsap.timeline({
          onComplete: () => {
            setShouldRender(false);
            onComplete?.();
          },
        });

        tl.to(
          contentEl,
          {
            y: -8,
            scale: 1.015,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.inOut',
          },
          1.1
        ).to(
          overlayEl,
          {
            opacity: 0,
            duration: 0.38,
            ease: 'power2.inOut',
          },
          1.15
        );
      } catch {
        // Fallback timers handle dismissal if GSAP fails
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        tl?.kill();
        dismissGenesis();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hardUnmountTimer);
      window.removeEventListener('keydown', handleKeyDown);
      tl?.kill();
    };
  }, [shouldRender, onComplete]);

  if (!shouldRender) return null;

  return (
    <div
      ref={overlayRef}
      onClick={dismissGenesis}
      role="status"
      aria-live="polite"
      aria-label="Initialisation d'Aura"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#081B19] text-[#FBFAF5] select-none overflow-hidden cursor-pointer transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Conteneur central de la séquence Genesis */}
      <div
        ref={contentRef}
        className="relative flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Scène lumineuse autour du symbole officiel */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* Halo diffus émanant du symbole Aura */}
          <div
            aria-hidden="true"
            className="aura-genesis-halo absolute inset-[-28%] rounded-full pointer-events-none"
          />

          {/* Rubans organiques SVG en arrière-plan */}
          <svg
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="absolute inset-[-12%] w-[124%] h-[124%] pointer-events-none"
          >
            <defs>
              <linearGradient
                id="aura-genesis-ribbon-grad-1"
                x1="15%"
                y1="85%"
                x2="85%"
                y2="15%"
              >
                <stop offset="0%" stopColor="#078348" stopOpacity="0" />
                <stop offset="28%" stopColor="#078348" stopOpacity="0.85" />
                <stop offset="56%" stopColor="#39B969" stopOpacity="0.95" />
                <stop offset="80%" stopColor="#CBE65C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EACB37" stopOpacity="0" />
              </linearGradient>

              <linearGradient
                id="aura-genesis-ribbon-grad-2"
                x1="20%"
                y1="20%"
                x2="85%"
                y2="85%"
              >
                <stop offset="0%" stopColor="#39B969" stopOpacity="0" />
                <stop offset="35%" stopColor="#CBE65C" stopOpacity="0.75" />
                <stop offset="68%" stopColor="#EACB37" stopOpacity="0.95" />
                <stop offset="92%" stopColor="#FF790D" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#FF790D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Premier ruban organique ascendant */}
            <path
              d="M 38 156 C 52 92, 98 44, 168 54 C 194 58, 196 112, 148 154 C 110 186, 60 184, 38 156 Z"
              stroke="url(#aura-genesis-ribbon-grad-1)"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="aura-genesis-ribbon-1"
            />

            {/* Second ruban organique complémentaire */}
            <path
              d="M 54 66 C 106 34, 174 62, 180 124 C 184 168, 128 192, 74 166 C 36 148, 28 84, 54 66 Z"
              stroke="url(#aura-genesis-ribbon-grad-2)"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="aura-genesis-ribbon-2"
            />
          </svg>

          {/* Symbole officiel d'Aura (source unique de vérité intacte) */}
          <div className="aura-genesis-symbol relative z-10 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <img
              src={AURA_OFFICIAL_SYMBOL_PATH}
              alt="Symbole officiel Aura"
              width={112}
              height={112}
              referrerPolicy="no-referrer"
              draggable={false}
              className="w-full h-full object-contain drop-shadow-[0_14px_34px_rgba(255,121,13,0.22)]"
            />
            <div aria-hidden="true" className="aura-genesis-shimmer" />
          </div>
        </div>

        {/* Mot-symbole Aura */}
        <div className="aura-genesis-brand mt-3">
          <span className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-[#FBFAF5]">
            Aura
          </span>
        </div>

        {/* Signature éditoriale sobre */}
        <p className="aura-genesis-signature mt-2 text-xs sm:text-sm font-medium tracking-wide text-[#FBFAF5]/70">
          Conversation · Recherche · Code · Création
        </p>

        {/* Fine ligne lumineuse en dégradé signature vert-jaune-orange */}
        <div
          aria-hidden="true"
          className="aura-genesis-line mt-5 w-36 sm:w-44 h-[2px] rounded-full overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, rgba(7,131,72,0) 0%, #078348 18%, #39B969 40%, #CBE65C 60%, #EACB37 78%, #FF790D 92%, rgba(255,121,13,0) 100%)',
          }}
        />
      </div>
    </div>
  );
};
