/**
 * Aura Motion — utilitaires GSAP partagés pour les pages marketing.
 *
 * Langage : « Aura Light » et « Idea Flow » — mouvements sobres, orientés
 * lisibilité. Tout est scopé au conteneur via useGSAP (cleanup automatique)
 * et désactivé sous prefers-reduced-motion.
 *
 * Attributs reconnus dans le scope :
 * - [data-hero-item]   → entrée échelonnée du hero (opacité + translation Y)
 * - [data-reveal]      → révélation au scroll (une seule fois, sans masquer
 *                        le contenu si le JS échoue)
 * - [data-stagger]     → révélation échelonnée des enfants directs
 * - [data-parallax]    → léger déplacement vertical lié au scroll (scrub)
 * - [data-float]       → respiration lente en continu (hero / accents)
 */
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useAuraMarketingMotion<
  T extends HTMLElement = HTMLDivElement,
>() {
  const scope = useRef<T | null>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // --- Entrée hero ---
        const heroItems = root.querySelectorAll<HTMLElement>('[data-hero-item]');
        if (heroItems.length > 0) {
          gsap.from(heroItems, {
            y: 26,
            opacity: 0,
            duration: 0.75,
            stagger: 0.09,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          });
        }

        // --- Révélations au scroll ---
        root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: el, start: 'top 87%', once: true },
          });
        });

        // --- Groupes échelonnés ---
        root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
          const children = Array.from(group.children);
          if (children.length === 0) return;
          gsap.from(children, {
            y: 26,
            opacity: 0,
            duration: 0.62,
            stagger: 0.085,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: group, start: 'top 86%', once: true },
          });
        });

        // --- Parallax léger sur les images ---
        root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6,
              },
            }
          );
        });

        // --- Respiration continue (éléments de marque) ---
        root.querySelectorAll<HTMLElement>('[data-float]').forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 === 0 ? -10 : -14,
            duration: 3.2 + (i % 3) * 0.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        });

        // --- Halo lumineux du hero (Aura Light) ---
        const halo = root.querySelector<HTMLElement>('[data-aura-halo]');
        if (halo) {
          gsap.to(halo, {
            scale: 1.08,
            opacity: 0.85,
            duration: 4.5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        }
      });

      return () => mm.revert();
    },
    { scope }
  );

  return scope;
}
