import { useEffect, useRef } from 'react';

/**
 * Révélation soie : observe l'élément et ajoute `.is-in`
 * quand il entre dans la fenêtre. Respecte prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit) {
      el.classList.add('is-in');
      el.setAttribute('data-reveal', 'in');
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            entry.target.setAttribute('data-reveal', 'in');
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}

/** Révèle tous les [data-reveal] d'un conteneur, avec décalage en cascade. */
export function useRevealAll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cibles = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit) {
      cibles.forEach((c) => {
        c.classList.add('is-in');
        c.setAttribute('data-reveal', 'in');
      });
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = cibles.indexOf(entry.target as HTMLElement);
            (entry.target as HTMLElement).style.setProperty('--delai', `${Math.max(0, i % 4) * 110}ms`);
            entry.target.classList.add('is-in');
            entry.target.setAttribute('data-reveal', 'in');
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -5% 0px' },
    );

    cibles.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  return ref;
}
