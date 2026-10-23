/**
 * Auth Motion Film — boucle cinématique de 8 secondes (GSAP) pour le panneau
 * gauche de la page d'authentification, dans l'esprit des panneaux vidéo des
 * pages de connexion premium.
 *
 * Composé de : balayage lumineux, mini-cartes UI qui dérivent, sous-titres
 * cycliques (« Réfléchir… » → « Rechercher… » → « Créer… » → « Développer… »)
 * et micro-particules. Boucle continue, nettoyage automatique, désactivée en
 * prefers-reduced-motion (affichage statique).
 */
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CAPTIONS = [
  { verb: 'Réfléchir', hint: 'avec une IA qui comprend le contexte' },
  { verb: 'Rechercher', hint: 'avec des sources réelles et vérifiées' },
  { verb: 'Créer', hint: 'des sites web modifiables et exportables' },
  { verb: 'Développer', hint: 'fichier par fichier, en Developer Mode' },
];

const FLOAT_CARDS = [
  { label: 'Site généré', detail: 'index.html · styles.css · app.js', icon: 'fa-solid fa-wand-magic-sparkles', tint: '#FF790D' },
  { label: '3 sources vérifiées', detail: 'liens vers les pages d’origine', icon: 'fa-solid fa-link', tint: '#078348' },
  { label: 'Version restaurée', detail: 'historique réel du projet', icon: 'fa-solid fa-clock-rotate-left', tint: '#A16207' },
];

export const AuthMotionFilm: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      // État statique : première carte + premier sous-titre visibles
      gsap.set(root.querySelectorAll('[data-film-card]'), { opacity: 1, y: 0 });
      gsap.set(root.querySelector('[data-film-caption]'), { opacity: 1, y: 0 });
      return;
    }

    const sweep = root.querySelector<HTMLElement>('[data-film-sweep]');
    const captionWrap = root.querySelector<HTMLElement>('[data-film-captions]');
    const captionItems = root.querySelectorAll<HTMLElement>('[data-film-caption]');
    const cards = root.querySelectorAll<HTMLElement>('[data-film-card]');
    const sparks = root.querySelectorAll<HTMLElement>('[data-film-spark]');

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });

    // --- Balayage lumineux continu (2 passages par boucle) ---
    tl.fromTo(
      sweep,
      { xPercent: -140, opacity: 0 },
      { xPercent: 140, opacity: 1, duration: 2.2, ease: 'power1.inOut' },
      0
    ).fromTo(
      sweep,
      { xPercent: -140, opacity: 0 },
      { xPercent: 140, opacity: 1, duration: 2.2, ease: 'power1.inOut' },
      5.2
    );

    // --- Sous-titres cycliques (4 × 2 s) ---
    captionItems.forEach((item, i) => {
      const at = i * 2;
      tl.fromTo(
        item,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
        at
      ).to(item, { y: -14, opacity: 0, duration: 0.5, ease: 'power2.in' }, at + 1.55);
    });

    // --- Mini-cartes UI en dérive (entrée/sortie décalées) ---
    cards.forEach((card, i) => {
      const at = 0.8 + i * 2.1;
      tl.fromTo(
        card,
        { y: 30, opacity: 0, rotate: i % 2 === 0 ? -2.5 : 2.5 },
        { y: 0, opacity: 1, rotate: 0, duration: 0.75, ease: 'power3.out' },
        at
      ).to(
        card,
        { y: -22, opacity: 0, duration: 0.65, ease: 'power2.in' },
        at + 3.1
      );
    });

    // --- Micro-particules (respiration) ---
    sparks.forEach((spark, i) => {
      tl.fromTo(
        spark,
        { y: 0, opacity: 0.15, scale: 0.85 },
        {
          y: -26 - i * 8,
          opacity: 0.85,
          scale: 1.1,
          duration: 3.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: 1,
        },
        i * 0.45
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Balayage lumineux (Aura Light) */}
      <div
        data-film-sweep
        className="absolute inset-y-0 w-[38%] -skew-x-12"
        style={{
          background:
            'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.0) 25%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.0) 78%, transparent 100%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Micro-particules */}
      <div className="absolute right-[12%] top-[34%] h-1.5 w-1.5 rounded-full bg-[#EACB37]" data-film-spark />
      <div className="absolute right-[22%] top-[48%] h-1 w-1 rounded-full bg-[#8CCB4A]" data-film-spark />
      <div className="absolute right-[16%] top-[58%] h-2 w-2 rounded-full bg-[#FF790D]/80" data-film-spark />
      <div className="absolute left-[18%] top-[42%] h-1.5 w-1.5 rounded-full bg-white/70" data-film-spark />

      {/* Mini-cartes UI flottantes */}
      <div className="absolute right-5 top-[26%] hidden w-[210px] space-y-3 sm:right-8 sm:block sm:w-[236px]">
        {FLOAT_CARDS.map((card) => (
          <div
            key={card.label}
            data-film-card
            className="rounded-[13px] border border-white/25 bg-[#FFFDF8]/12 px-3.5 py-2.5 opacity-0 shadow-[0_14px_36px_rgba(10,20,18,0.22)] backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: `${card.tint}30` }}
              >
                <i className={`${card.icon} text-[9px]`} style={{ color: card.tint === '#A16207' ? '#F3D52E' : '#fff' }} />
              </span>
              <p className="text-[10.5px] font-bold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)]">
                {card.label}
              </p>
            </div>
            <p className="mt-1 text-[9px] text-white/80 drop-shadow-[0_1px_5px_rgba(0,0,0,0.3)]">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Sous-titres cycliques façon vidéo */}
      <div
        data-film-captions
        className="absolute bottom-[32%] left-0 right-0 px-6 sm:bottom-[26%] sm:px-10 lg:bottom-[16%] lg:px-14 xl:px-20"
      >
        {CAPTIONS.map((caption, i) => (
          <div
            key={caption.verb}
            data-film-caption
            className={`absolute inset-x-6 opacity-0 sm:inset-x-10 lg:inset-x-14 xl:inset-x-20 ${i === 0 ? '' : ''}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#EACB37]">
              {caption.verb}…
            </p>
            <p className="mt-1.5 max-w-[320px] text-[13px] leading-relaxed text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              {caption.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
