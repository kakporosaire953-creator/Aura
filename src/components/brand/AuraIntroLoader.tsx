/**
 * Aura Intro — page de chargement cinématique (GSAP).
 *
 * Séquence « Aura Light » : anneaux fins qui se tracent, halo qui respire,
 * révélation du logo officiel (jamais modifié — seule la lumière autour
 * bouge), balayage lumineux sur le mot-signe, puis le rideau s'ouvre sur le
 * site. Une seule fois par session, skippable, désactivée en mouvement réduit.
 */
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { AuraLogo } from './AuraLogo';

const INTRO_SESSION_KEY = 'aura_intro_v1';

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(INTRO_SESSION_KEY) !== 'seen';
  } catch {
    return false;
  }
}

export const AuraIntroLoader: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, 'seen');
    } catch {
      // stockage indisponible : l'intro reste simplement non mémorisée
    }

    const logoWrap = root.querySelector<HTMLElement>('[data-intro-logo]');
    const halo = root.querySelector<HTMLElement>('[data-intro-halo]');
    const rings = root.querySelectorAll<SVGCircleElement>('[data-intro-ring]');
    const shine = root.querySelector<HTMLElement>('[data-intro-shine]');
    const tagline = root.querySelectorAll<HTMLElement>('[data-intro-tag] > span');
    const line = root.querySelector<HTMLElement>('[data-intro-line]');
    const curtain = root.querySelector<HTMLElement>('[data-intro-curtain]');

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => setVisible(false),
    });
    timelineRef.current = tl;

    tl.fromTo(
      rings,
      { strokeDashoffset: 640, opacity: 0, rotate: -18 },
      {
        strokeDashoffset: 0,
        opacity: 0.5,
        rotate: 0,
        duration: 1.15,
        stagger: 0.14,
        ease: 'power2.inOut',
        transformOrigin: '50% 50%',
      },
      0
    )
      .fromTo(
        halo,
        { scale: 0.55, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.3, ease: 'power2.out' },
        0.15
      )
      .fromTo(
        logoWrap,
        { clipPath: 'inset(0 0 100% 0)', y: 26, scale: 0.96 },
        {
          clipPath: 'inset(0 0 0% 0)',
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: 'expo.out',
        },
        0.35
      )
      .fromTo(
        shine,
        { xPercent: -130, opacity: 0 },
        {
          xPercent: 130,
          opacity: 1,
          duration: 1.05,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(shine, { opacity: 0 }),
        },
        0.85
      )
      .fromTo(
        tagline,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.07 },
        1.15
      )
      .fromTo(
        line,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.8, ease: 'power2.inOut' },
        1.25
      )
      // Respiration finale puis ouverture du rideau
      .to(
        [logoWrap, halo],
        { scale: 1.045, duration: 0.55, ease: 'sine.inOut' },
        2.05
      )
      .to(
        curtain,
        {
          yPercent: -101,
          duration: 0.85,
          ease: 'power4.inOut',
        },
        2.25
      )
      .to(
        root,
        { opacity: 0, duration: 0.35, ease: 'power1.out' },
        2.75
      );

    const skip = () => {
      if (timelineRef.current) {
        timelineRef.current.progress(1);
      }
    };
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });

    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      tl.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden"
    >
      {/* Rideau animé (la couche qui glisse vers le haut) */}
      <div
        data-intro-curtain
        className="absolute inset-0 bg-[#0B1416]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 90% 70% at 50% 42%, rgba(23,50,56,0.9) 0%, rgba(11,20,22,1) 72%)',
        }}
      />

      {/* Halo Aura Light */}
      <div
        data-intro-halo
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[520px] sm:w-[520px]"
        style={{
          background:
            'radial-gradient(circle, rgba(139,203,74,0.22) 0%, rgba(234,203,55,0.14) 36%, rgba(255,121,13,0.1) 58%, transparent 74%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Anneaux fins tracés */}
      <svg
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 sm:h-[560px] sm:w-[560px]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          data-intro-ring
          cx="100"
          cy="100"
          r="88"
          stroke="#8CCB4A"
          strokeOpacity="0.5"
          strokeWidth="0.7"
          strokeDasharray="640"
          strokeDashoffset="640"
          transform="rotate(-90 100 100)"
        />
        <circle
          data-intro-ring
          cx="100"
          cy="100"
          r="72"
          stroke="#EACB37"
          strokeOpacity="0.42"
          strokeWidth="0.55"
          strokeDasharray="640"
          strokeDashoffset="640"
          transform="rotate(20 100 100)"
        />
        <circle
          data-intro-ring
          cx="100"
          cy="100"
          r="56"
          stroke="#FF790D"
          strokeOpacity="0.38"
          strokeWidth="0.5"
          strokeDasharray="640"
          strokeDashoffset="640"
          transform="rotate(120 100 100)"
        />
      </svg>

      {/* Logo officiel + balayage lumineux */}
      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative">
          <div data-intro-logo>
            <AuraLogo size="xl" variant="full" glow />
          </div>
          {/* Reflet lumineux qui traverse le logo (n'affecte pas l'asset) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
            <div
              data-intro-shine
              className="absolute inset-y-0 w-1/3 -skew-x-12"
              style={{
                background:
                  'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.0) 80%, transparent 100%)',
                mixBlendMode: 'screen',
              }}
            />
          </div>
        </div>

        <p
          data-intro-tag
          className="mt-7 overflow-hidden text-[13px] font-medium tracking-[0.22em] text-[#EAE5D9]/85 sm:text-[15px]"
        >
          <span className="inline-block">De&nbsp;</span>
          <span className="inline-block">l’idée&nbsp;</span>
          <span className="inline-block">au&nbsp;</span>
          <span className="inline-block bg-gradient-to-r from-[#8CCB4A] via-[#EACB37] to-[#FF790D] bg-clip-text font-semibold text-transparent">
            résultat.
          </span>
        </p>
      </div>

      {/* Ligne de progression discrète */}
      <div className="absolute bottom-12 left-1/2 h-[2px] w-[128px] -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div data-intro-line className="h-full w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-[#078348] via-[#EACB37] to-[#FF790D]" />
      </div>
    </div>
  );
};
