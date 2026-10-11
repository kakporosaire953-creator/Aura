import React, { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Hook d'observation d'entrée dans le viewport :
 * - Déclenchement lorsque le haut de l'élément entre vers 80-85% de la hauteur du viewport
 * - Une seule révélation par élément pendant une visite (reste visible à la remontée)
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.08
) {
  const ref = useRef<T | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState<boolean>(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -16% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, reducedMotion]);

  return { ref, isVisible, reducedMotion };
}

interface StaggerRevealProps {
  children: React.ReactNode;
  /** Index dans le groupe (décalage de 85ms par élément, conforme à la plage 70-110ms) */
  staggerIndex?: number;
  isVisible: boolean;
  className?: string;
}

/**
 * Composant réutilisable StaggerReveal :
 * - Opacité 0 -> 1, Translation verticale 16px -> 0
 * - Durée 520ms (plage 400-650ms)
 * - Décalage 85ms par élément (plage 70-110ms)
 */
export const StaggerReveal: React.FC<StaggerRevealProps> = ({
  children,
  staggerIndex = 0,
  isVisible,
  className = '',
}) => {
  const delayMs = Math.min(staggerIndex * 85, 425);
  return React.createElement(
    'div',
    {
      style: { transitionDelay: isVisible ? `${delayMs}ms` : '0ms' },
      className: `aura-reveal ${isVisible ? 'is-visible' : ''} ${className}`,
    },
    children
  );
};
