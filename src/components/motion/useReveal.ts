import { useEffect, useRef } from 'react';

// Système de révélations initialisé : le masquage CSS (« .js [data-reveal] »)
// peut s'appliquer. Sans cette marque (script non chargé), un minuteur
// bascule en « reveal-off » et le contenu reste visible.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('reveal-on');
}

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

/**
 * Observateur global : garantit que TOUT élément [data-reveal] finit par
 * apparaître, y compris ceux qui ne sont pas dans un conteneur géré par
 * useRevealAll (en-têtes de sections, pages d'articles…). Corrige un défaut
 * réel : ces blocs restaient invisibles (opacité 0) hors conteneur observé.
 */
export function useRevealGlobal(): void {
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tous = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));

    if (reduit) {
      tous().forEach((el) => {
        el.classList.add('is-in');
        el.setAttribute('data-reveal', 'in');
      });
      return;
    }

    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            e.target.setAttribute('data-reveal', 'in');
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );

    const observes = new WeakSet<Element>();
    const analyser = () => {
      tous().forEach((el) => {
        if (observes.has(el)) return;
        observes.add(el);
        obs.observe(el);
      });
    };

    analyser();
    const mo = new MutationObserver(analyser);
    mo.observe(document.body, { childList: true, subtree: true });

    // Filet de sécurité : après chargement complet, tout élément encore hors
    // écran mais présent dans le document est rendu visible.
    const secours = window.setTimeout(() => {
      tous().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0) {
          el.classList.add('is-in');
          el.setAttribute('data-reveal', 'in');
        }
      });
    }, 4000);

    return () => {
      obs.disconnect();
      mo.disconnect();
      window.clearTimeout(secours);
    };
  }, []);
}

