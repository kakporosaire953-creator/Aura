/**
 * Chargement paresseux de la scène Three.js Aura (chunk séparé).
 * Le bundle initial reste léger : three n'est téléchargé que si la scène est
 * réellement montée (desktop + mouvement autorisé).
 */
import React, { Suspense, lazy, useMemo } from 'react';

const AuraThreeRibbons = lazy(() =>
  import('./AuraThreeRibbons.tsx').then((m) => ({ default: m.AuraThreeRibbons }))
);

interface AuraThreeCanvasProps {
  className?: string;
  phase?: number;
  opacity?: number;
  interactive?: boolean;
  /** Masque la scène sur les petits écrans (perf mobile) */
  hideOnMobile?: boolean;
}

export const AuraThreeCanvas: React.FC<AuraThreeCanvasProps> = ({
  className = '',
  hideOnMobile = true,
  ...props
}) => {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }, []);

  if (hideOnMobile && isMobile) return null;

  return (
    <Suspense fallback={null}>
      <AuraThreeRibbons className={className} {...props} />
    </Suspense>
  );
};
