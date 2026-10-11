import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AuraMode } from '../../shared/types';
import { useScrollReveal, StaggerReveal } from './useScrollReveal';

import imgYourBrand from '../../assets/images/yourbrand_fashion_model_1791684477799.jpg';
import imgNature from '../../assets/images/create_preview_nature_1791622867676.jpg';
import imgProduct from '../../assets/images/aura_showcase_product_1791622893523.jpg';
import imgSculpture from '../../assets/images/aura_hero_sculpture_1791622844309.jpg';
import imgLandscape from '../../assets/images/aura_showcase_landscape_1791622884265.jpg';
import imgAbstract from '../../assets/images/create_preview_abstract_1791622857564.jpg';
import imgWorkspace from '../../assets/images/auth_hero_workspace_1791685458368.jpg';
import imgCreative from '../../assets/images/aura_creative_abstract_1791622874003.jpg';

export interface GalleryCreationItem {
  id: string;
  indexLabel: string;
  title: string;
  category: string;
  pillar: 'Aura Studio' | 'Aura Missions' | 'Aura Explore' | 'Aura Chat';
  mode: AuraMode;
  image: string;
  summary: string;
  promptExample: string;
  accentColor: string;
}

export const AURA_GALLERY_ITEMS: GalleryCreationItem[] = [
  {
    id: 'gal-1',
    indexLabel: '01',
    title: 'YourBrand — Flagship E-Commerce',
    category: 'Design & Code Web',
    pillar: 'Aura Studio',
    mode: 'code',
    image: imgYourBrand,
    summary:
      'Vitrine mode responsive conçue avec système typographique éditorial et aperçu en direct.',
    promptExample:
      'Crée un site vitrine moderne YourBrand pour une boutique de vêtements avec un design premium et responsive.',
    accentColor: '#2E8B47',
  },
  {
    id: 'gal-2',
    indexLabel: '02',
    title: 'Pavillon Botanique Horizon',
    category: 'Architecture & Concept',
    pillar: 'Aura Studio',
    mode: 'create',
    image: imgNature,
    summary:
      'Direction artistique et dossier de présentation pour un éco-domaine contemporain.',
    promptExample:
      'Conçois la direction artistique, le manifeste architectural et la page de présentation d’un pavillon écologique en pleine nature.',
    accentColor: '#4CB648',
  },
  {
    id: 'gal-3',
    indexLabel: '03',
    title: 'Lancement Solis Botanica',
    category: 'Campagne & Go-to-Market',
    pillar: 'Aura Missions',
    mode: 'create',
    image: imgProduct,
    summary:
      'Feuille de route produit en 4 jalons : identité packaging, récit de marque et calendrier de lancement.',
    promptExample:
      'Organise une mission de lancement sur 30 jours pour une nouvelle gamme de soins naturels haut de gamme.',
    accentColor: '#FF790D',
  },
  {
    id: 'gal-4',
    indexLabel: '04',
    title: 'Exposition Lumière Organique',
    category: 'Direction Artistique 3D',
    pillar: 'Aura Studio',
    mode: 'create',
    image: imgSculpture,
    summary:
      'Exploration des volumes, de la réfraction chaude et des courbes organiques signature.',
    promptExample:
      'Élabore le concept visuel et la scénographie digitale d’une exposition dédiée au design organique contemporain.',
    accentColor: '#EACB37',
  },
  {
    id: 'gal-5',
    indexLabel: '05',
    title: 'Atlas des Territoires Durables',
    category: 'Recherche & Synthèse',
    pillar: 'Aura Explore',
    mode: 'search',
    image: imgLandscape,
    summary:
      'Étude documentée avec sources vérifiées sur les nouvelles routes du tourisme régénératif.',
    promptExample:
      'Recherche et synthétise avec sources vérifiées les meilleures initiatives d’écotourisme et d’architecture durable.',
    accentColor: '#2E8B47',
  },
  {
    id: 'gal-6',
    indexLabel: '06',
    title: 'Identité Chromatique Prisme',
    category: 'Charte & Design Système',
    pillar: 'Aura Studio',
    mode: 'code',
    image: imgAbstract,
    summary:
      'Tokens de couleurs, dégradés fluides et guide de style interactif générés sur mesure.',
    promptExample:
      'Génère un guide de style interactif en HTML/CSS présentant une palette lumineuse vert-or-ambre et ses composants UI.',
    accentColor: '#8CCB4A',
  },
  {
    id: 'gal-7',
    indexLabel: '07',
    title: 'Studio Créatif Golden Hour',
    category: 'Stratégie Éditoriale',
    pillar: 'Aura Chat',
    mode: 'chat',
    image: imgWorkspace,
    summary:
      'Positionnement éditorial, storytelling fondateur et calendrier de publication multi-format.',
    promptExample:
      'Aide-moi à structurer la stratégie éditoriale et le storytelling d’un collectif de créateurs digitaux.',
    accentColor: '#F0A818',
  },
  {
    id: 'gal-8',
    indexLabel: '08',
    title: 'Système Visuel Flux & Mouvement',
    category: 'Motion & Expérience Web',
    pillar: 'Aura Studio',
    mode: 'code',
    image: imgCreative,
    summary:
      'Chorégraphie d’interface et transitions fluides pensées pour une expérience de marque mémorable.',
    promptExample:
      'Crée une galerie web interactive en HTML/CSS/JS avec transitions fluides et mise en page éditoriale.',
    accentColor: '#FF790D',
  },
];

interface AuraGallerySectionProps {
  onSelectCreation: (mode: AuraMode, promptText: string) => void;
}

export const AuraGallerySection: React.FC<AuraGallerySectionProps> = ({
  onSelectCreation,
}) => {
  const { ref: sectionRef, isVisible, reducedMotion } = useScrollReveal<HTMLElement>(0.1);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  // Desktop visible window allows sliding smoothly across the 8 cards
  const maxDesktopOffset = 5; // 8 items total, 3 visible at once on desktop
  const clampedDesktopOffset = Math.min(activeIndex, maxDesktopOffset);

  const scrollToIndex = useCallback((nextIdx: number) => {
    const bounded = Math.max(0, Math.min(AURA_GALLERY_ITEMS.length - 1, nextIdx));
    setActiveIndex(bounded);

    const track = mobileTrackRef.current;
    if (track) {
      const cardEls = track.querySelectorAll<HTMLElement>('[data-gallery-card]');
      const target = cardEls[bounded];
      if (target) {
        const left = target.offsetLeft - 20;
        track.scrollTo({ left, behavior: 'smooth' });
      }
    }
  }, []);

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(AURA_GALLERY_ITEMS.length - 1);
    }
  };

  // Sync activeIndex when user scrolls naturally on mobile/tablet touch track
  useEffect(() => {
    const track = mobileTrackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const scrollLeft = track.scrollLeft;
      const cardWidth = track.firstElementChild
        ? (track.firstElementChild as HTMLElement).offsetWidth + 16
        : 300;
      const approxIdx = Math.round(scrollLeft / cardWidth);
      const bounded = Math.max(0, Math.min(AURA_GALLERY_ITEMS.length - 1, approxIdx));
      setActiveIndex(bounded);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="galerie"
      ref={sectionRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Galerie des huit créations Aura"
      className="py-16 sm:py-24 border-b border-[#EAE5D9]/80 dark:border-[#243337] relative overflow-hidden focus:outline-none"
    >
      {/* Subtle Ambient Warm Glow Behind Gallery */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] sm:w-[820px] h-[320px] rounded-full opacity-55 dark:opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(140, 203, 74, 0.16) 0%, rgba(234, 203, 55, 0.12) 45%, transparent 75%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="max-w-[1260px] mx-auto px-5 sm:px-8 relative z-10">
        {/* Header Row + Desktop Carousel Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
          <StaggerReveal isVisible={isVisible} staggerIndex={0} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2E8B47] dark:text-[#8CCB4A]">
              GALERIE D’INSPIRATION · 8 CRÉATIONS
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-[40px] text-[#14282D] dark:text-[#F3F2EC] tracking-tight mt-1.5 leading-tight">
              Conçu et orchestré avec Aura
            </h2>
            <p className="mt-2 text-sm sm:text-[16px] text-[#5C6664] dark:text-[#94A09E]">
              Explorez huit exemples de réalisations combinant direction artistique, code
              interactif, recherche vérifiée et missions structurées.
            </p>
          </StaggerReveal>

          {/* Navigation Controls & Counter */}
          <StaggerReveal
            isVisible={isVisible}
            staggerIndex={1}
            className="flex items-center justify-between sm:justify-end gap-4"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-[#6E7775] dark:text-[#94A09E] tabular-nums">
              <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span>/</span>
              <span>08</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Création précédente"
                className="w-10 h-10 rounded-full bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] hover:border-[#078348]/50 disabled:opacity-40 disabled:pointer-events-none text-[#14282D] dark:text-[#F3F2EC] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left text-xs" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === AURA_GALLERY_ITEMS.length - 1}
                aria-label="Création suivante"
                className="w-10 h-10 rounded-full bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] hover:border-[#078348]/50 disabled:opacity-40 disabled:pointer-events-none text-[#14282D] dark:text-[#F3F2EC] flex items-center justify-center transition-all shadow-2xs cursor-pointer"
              >
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
          </StaggerReveal>
        </div>

        {/* =================================================================
            DESKTOP CONTROLLED HORIZONTAL CAROUSEL (lg+)
            Smooth translation, subtle depth variation, keyboard support
        ================================================================= */}
        <div className="hidden lg:block overflow-hidden py-3 -mx-3 px-3">
          <div
            className="flex gap-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: reducedMotion
                ? `translate3d(-${clampedDesktopOffset * 392}px, 0, 0)`
                : `translate3d(-${clampedDesktopOffset * 392}px, 0, 0)`,
            }}
          >
            {AURA_GALLERY_ITEMS.map((item, idx) => {
              const isFocused = idx === activeIndex;
              const depthOffsetClass =
                !reducedMotion && idx % 2 === 1 ? 'translate-y-2.5' : 'translate-y-0';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-[368px] shrink-0 transition-all duration-500 ${depthOffsetClass} ${
                    isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
                  }`}
                  style={{
                    transitionDelay: isVisible && !reducedMotion ? `${Math.min(idx * 65, 360)}ms` : '0ms',
                  }}
                >
                  <article
                    className={`aura-gallery-card h-full rounded-[26px] bg-[#FFFDF9] dark:bg-[#152023] border overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isFocused
                        ? 'border-[#8CCB4A] dark:border-[#4CB648] shadow-[0_18px_44px_rgba(20,40,45,0.075)]'
                        : 'border-[#EAE5D8] dark:border-[#243337] shadow-[0_10px_28px_rgba(20,40,45,0.04)]'
                    }`}
                  >
                    {/* Visual Image Frame */}
                    <div className="relative h-[228px] overflow-hidden bg-[#F3F0E6] dark:bg-[#1B292D]">
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="aura-gallery-img w-full h-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#14282D]/50 via-transparent to-transparent"
                      />

                      {/* Top Index & Pillar Indicator */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px]">
                        <span className="px-2.5 py-1 rounded-full bg-[#FFFDF9]/92 dark:bg-[#152023]/90 backdrop-blur-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] shadow-2xs">
                          {item.pillar}
                        </span>
                        <span className="font-mono font-bold text-white/90 bg-[#14282D]/45 backdrop-blur-xs px-2 py-0.5 rounded-full">
                          {item.indexLabel}
                        </span>
                      </div>

                      {/* Bottom Category Caption over Image */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#FAF8F1]/95 drop-shadow-xs">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Editorial Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-[16.5px] text-[#14282D] dark:text-[#F3F2EC] leading-snug">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#EFECE2] dark:border-[#243337] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#77817F] truncate">
                          Exemple scénarisé
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCreation(item.mode, item.promptExample);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E8B47] dark:text-[#8CCB4A] hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <span>Explorer ce cas</span>
                          <i className="fa-solid fa-arrow-right text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            MOBILE & TABLET NATURAL TOUCH CAROUSEL (<lg)
            Large cards, native touch scroll-snap without blocking vertical scroll
        ================================================================= */}
        <div
          ref={mobileTrackRef}
          className="lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth aura-no-scrollbar -mx-5 px-5 pb-3"
        >
          {AURA_GALLERY_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              data-gallery-card
              className="w-[82vw] sm:w-[340px] shrink-0 snap-start"
            >
              <article
                onClick={() => setActiveIndex(idx)}
                className="h-full rounded-[24px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] shadow-[0_10px_28px_rgba(20,40,45,0.045)] overflow-hidden flex flex-col justify-between"
              >
                <div className="relative h-[215px] sm:h-[230px] overflow-hidden bg-[#F3F0E6] dark:bg-[#1B292D]">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#14282D]/50 via-transparent to-transparent"
                  />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px]">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFFDF9]/92 dark:bg-[#152023]/90 font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      {item.pillar}
                    </span>
                    <span className="font-mono font-bold text-white bg-[#14282D]/45 px-2 py-0.5 rounded-full">
                      {item.indexLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3.5">
                    <span className="text-[11px] font-medium text-[#FAF8F1]">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#EFECE2] dark:border-[#243337] flex items-center justify-between">
                    <span className="text-[11px] text-[#77817F]">Exemple scénarisé</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCreation(item.mode, item.promptExample);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E8B47] dark:text-[#8CCB4A] cursor-pointer"
                    >
                      <span>Explorer</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </button>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        {/* Interactive Progress Bar & Step Indicators */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {AURA_GALLERY_ITEMS.map((item, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  aria-label={`Aller à la création ${idx + 1} : ${item.title}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'w-7 bg-gradient-to-r from-[#4CB648] via-[#B4CC38] to-[#FF790D]'
                      : 'w-2 bg-[#DEDAD0] dark:bg-[#243337] hover:bg-[#8CCB4A]'
                  }`}
                />
              );
            })}
          </div>

          <p className="hidden sm:block text-[11.5px] text-[#77817F]">
            Utilisez les flèches <kbd className="font-mono">←</kbd>{' '}
            <kbd className="font-mono">→</kbd> ou cliquez pour parcourir les 8 créations
          </p>
        </div>
      </div>
    </section>
  );
};
