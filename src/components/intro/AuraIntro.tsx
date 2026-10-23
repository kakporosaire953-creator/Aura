import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CLE = 'aura_intro_v1';

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(CLE) !== 'ok';
  } catch {
    return false;
  }
}

interface Props {
  onDone: () => void;
}

/**
 * Intro cinématique : anneaux de lumière, logo officiel révélé par
 * balayage, mot et slogan en cascade, puis le rideau se lève.
 * Le logo n'est jamais modifié — la lumière danse AUTOUR.
 */
export const AuraIntro: React.FC<Props> = ({ onDone }) => {
  const racine = useRef<HTMLDivElement | null>(null);
  const fini = useRef(false);

  const terminer = () => {
    if (fini.current) return;
    fini.current = true;
    onDone();
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(CLE, 'ok');
    } catch {
      /* stockage indisponible */
    }

    window.addEventListener('pointerdown', terminer);
    window.addEventListener('keydown', terminer);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '[data-intro-ring]',
        { strokeDashoffset: 980, opacity: 0, rotation: -28 },
        { strokeDashoffset: 0, opacity: 0.85, rotation: 0, duration: 1.25, stagger: 0.16 },
        0,
      )
        .fromTo(
          '[data-intro-logo]',
          { scale: 0.82, opacity: 0, y: 26 },
          { scale: 1, opacity: 1, y: 0, duration: 1.05, ease: 'power4.out' },
          0.35,
        )
        .fromTo(
          '[data-intro-sweep]',
          { xPercent: -130 },
          { xPercent: 130, duration: 1.15, ease: 'power2.inOut' },
          0.85,
        )
        .fromTo(
          '[data-intro-word] span',
          { yPercent: 118, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.07 },
          1.15,
        )
        .fromTo(
          '[data-intro-tag] span',
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.035 },
          1.55,
        )
        .to('[data-intro-scene]', { y: -36, opacity: 0, duration: 0.75, ease: 'power2.in' }, 2.6)
        .to(
          '[data-intro-curtain]',
          { yPercent: -101, duration: 1.05, ease: 'power4.inOut', onComplete: terminer },
          2.75,
        );
    }, racine);

    return () => {
      ctx.revert();
      window.removeEventListener('pointerdown', terminer);
      window.removeEventListener('keydown', terminer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={racine} className="intro" role="presentation">
      <div className="intro-rideau" data-intro-curtain />

      <svg className="intro-cercle" viewBox="0 0 200 200" fill="none" aria-hidden>
        <circle
          data-intro-ring
          cx="100"
          cy="100"
          r="92"
          stroke="url(#intro-grad)"
          strokeDasharray="980"
          transform="rotate(-90 100 100)"
        />
        <circle
          data-intro-ring
          cx="100"
          cy="100"
          r="76"
          stroke="url(#intro-grad)"
          strokeDasharray="820"
          transform="rotate(-90 100 100)"
          opacity="0.55"
        />
        <defs>
          <linearGradient id="intro-grad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A5E838" />
            <stop offset="0.5" stopColor="#EACB37" />
            <stop offset="1" stopColor="#FF790D" />
          </linearGradient>
        </defs>
      </svg>

      <div className="intro-scene" data-intro-scene>
        <div className="intro-logo-boite" data-intro-logo>
          <img src="/assets/aura-symbol-white.jpg" alt="" />
          <div className="intro-balayage" data-intro-sweep />
        </div>

        <div className="intro-mot" data-intro-word aria-label="Aura">
          {'Aura'.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>

        <div className="intro-tagline" data-intro-tag aria-label="De l'idée au résultat">
          {"DE L'IDÉE AU RÉSULTAT".split('').map((c, i) => (
            <span key={i} style={{ whiteSpace: 'pre' }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <button type="button" className="intro-skip" onClick={terminer}>
        Passer
      </button>
    </div>
  );
};
