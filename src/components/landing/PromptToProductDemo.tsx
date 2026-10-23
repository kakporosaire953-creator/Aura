import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuraLogo } from '../brand/AuraLogo';
import { usePrefersReducedMotion, useScrollReveal, StaggerReveal } from './useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

export type DemoStage = 1 | 2 | 3 | 4 | 5 | 6;

interface PromptToProductDemoProps {
  onTryInWorkspace: (prompt: string) => void;
}

const DEMO_PROMPT =
  'Crée un site e-commerce premium pour une boutique de téléphones au Bénin, avec des prix en FCFA et une interface mobile élégante.';

const PROJECT_FILES = [
  { name: 'index.html', status: 'Structure & Catalogue', minStage: 2 },
  { name: 'styles.css', status: 'Grille & Mobile UI', minStage: 3 },
  { name: 'catalogue-fcfa.js', status: 'Panier & Filtres FCFA', minStage: 3 },
];

const CODE_LINES = [
  { num: 1, text: '<header class="koratech-nav">', type: 'tag', group: 1 },
  { num: 2, text: '  <span class="brand">KoraTech · Cotonou</span>', type: 'markup', group: 1 },
  { num: 3, text: '  <span class="badge">Livraison 24h Bénin</span>', type: 'markup', group: 1 },
  { num: 4, text: '</header>', type: 'tag', group: 1 },
  { num: 5, text: '<section class="hero-banner">', type: 'tag', group: 2 },
  { num: 6, text: '  <h1>Smartphones Certifiés & Garantie 12 Mois</h1>', type: 'title', group: 2 },
  { num: 7, text: '  <p>Paiement Mobile Money (MTN / Moov) & espèces</p>', type: 'markup', group: 2 },
  { num: 8, text: '</section>', type: 'tag', group: 2 },
  { num: 9, text: '<div class="catalog-grid">', type: 'tag', group: 3 },
  { num: 10, text: '  <ProductCard name="iPhone 16 Pro" price="785 000 FCFA" />', type: 'component', group: 3 },
  { num: 11, text: '  <ProductCard name="Galaxy S24 Ultra" price="690 000 FCFA" />', type: 'component', group: 3 },
  { num: 12, text: '  <ProductCard name="Redmi Note 14 Pro" price="195 000 FCFA" />', type: 'component', group: 3 },
  { num: 13, text: '</div>', type: 'tag', group: 3 },
];

const PRODUCTS = [
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro · 256 Go',
    tag: 'Titane Naturel · 5G',
    price: '785 000 FCFA',
    badge: 'En stock Cotonou',
    accent: '#078348',
    icon: 'fa-solid fa-mobile-screen-button',
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    tag: '256 Go · Stylet S-Pen inclus',
    price: '690 000 FCFA',
    badge: 'Garantie 12 mois',
    accent: '#FF790D',
    icon: 'fa-solid fa-mobile-screen',
  },
  {
    id: 'redmi-note-14',
    name: 'Xiaomi Redmi Note 14 Pro',
    tag: '256 Go · Charge rapide 67W',
    price: '195 000 FCFA',
    badge: 'Meilleure vente',
    accent: '#078348',
    icon: 'fa-solid fa-mobile-retro',
  },
];

export const PromptToProductDemo: React.FC<PromptToProductDemoProps> = ({
  onTryInWorkspace,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const { ref: headerRevealRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>(0.12);
  const { ref: mobileStep1Ref, isVisible: mobileStep1Visible } = useScrollReveal<HTMLDivElement>(0.12);
  const { ref: mobileStep2Ref, isVisible: mobileStep2Visible } = useScrollReveal<HTMLDivElement>(0.12);
  const { ref: mobileStep3Ref, isVisible: mobileStep3Visible } = useScrollReveal<HTMLDivElement>(0.12);

  const pinSectionRef = useRef<HTMLDivElement | null>(null);
  const pinWorkspaceRef = useRef<HTMLDivElement | null>(null);

  const [stage, setStage] = useState<DemoStage>(reducedMotion ? 6 : 1);
  const [typedChars, setTypedChars] = useState<number>(
    reducedMotion ? DEMO_PROMPT.length : 28
  );
  const [visibleCodeLines, setVisibleCodeLines] = useState<number>(
    reducedMotion ? CODE_LINES.length : 0
  );
  const [scrollProgress, setScrollProgress] = useState<number>(reducedMotion ? 1 : 0);
  const [isManualPlaying, setIsManualPlaying] = useState<boolean>(false);
  const [expandedPreview, setExpandedPreview] = useState<boolean>(false);
  const [selectedCartCount, setSelectedCartCount] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'premium' | 'accessible'>('all');

  const manualModeRef = useRef<boolean>(false);
  const runIdRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  /**
   * Synchronise l'état visuel (Prompt -> Génération -> Résultat) à partir d'une progression [0..1]
   */
  const applyProgressState = useCallback((progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    setScrollProgress(clamped);

    if (clamped < 0.28) {
      // Étape A — Le prompt se remplit progressivement
      const ratio = Math.min(1, Math.max(0.18, clamped / 0.26));
      setStage(1);
      setTypedChars(Math.round(ratio * DEMO_PROMPT.length));
      setVisibleCodeLines(0);
    } else if (clamped < 0.42) {
      // Étape B (Début) — Message envoyé + statut « Préparation du projet »
      setStage(2);
      setTypedChars(DEMO_PROMPT.length);
      setVisibleCodeLines(4);
    } else if (clamped < 0.64) {
      // Étape B (Suite) — Révélation par petits groupes de lignes HTML/CSS
      const codeRatio = (clamped - 0.42) / 0.22;
      const lines = codeRatio < 0.45 ? 8 : CODE_LINES.length;
      setStage(3);
      setTypedChars(DEMO_PROMPT.length);
      setVisibleCodeLines(lines);
    } else if (clamped < 0.78) {
      // Étape C (Début) — L'aperçu du site apparaît (Navigation + Titre)
      setStage(4);
      setTypedChars(DEMO_PROMPT.length);
      setVisibleCodeLines(CODE_LINES.length);
    } else if (clamped < 0.92) {
      // Étape C (Suite) — Produits avec prix en FCFA révélés
      setStage(5);
      setTypedChars(DEMO_PROMPT.length);
      setVisibleCodeLines(CODE_LINES.length);
    } else {
      // Étape C (Fin) — Résultat final stabilisé
      setStage(6);
      setTypedChars(DEMO_PROMPT.length);
      setVisibleCodeLines(CODE_LINES.length);
    }
  }, []);

  /**
   * Coordination GSAP ScrollTrigger sur Desktop uniquement (sans bloquer le scroll, sans snap forcé)
   */
  useEffect(() => {
    if (reducedMotion) {
      applyProgressState(1);
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(
      '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)',
      () => {
        if (!pinSectionRef.current || !pinWorkspaceRef.current) return;

        const st = ScrollTrigger.create({
          trigger: pinSectionRef.current,
          pin: pinWorkspaceRef.current,
          start: 'top 88px',
          end: '+=155%',
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!manualModeRef.current) {
              applyProgressState(self.progress);
            }
          },
        });

        return () => {
          st.kill();
        };
      }
    );

    return () => {
      mm.revert();
    };
  }, [applyProgressState, reducedMotion]);

  /**
   * Lecture cinématique GSAP (« façon vidéo ») : une master timeline de ~9 s
   * pilote la progression du prompt → génération → résultat avec des courbes
   * organiques. Lecture auto à l'entrée dans le viewport, pause/reprise et
   * rejeu possibles. Aucun setTimeout : nettoyage propre via GSAP.
   */
  const cinematicTweenRef = useRef<gsap.core.Tween | null>(null);
  const hasAutoplayedRef = useRef<boolean>(false);

  const stopCinematic = useCallback(() => {
    if (cinematicTweenRef.current) {
      cinematicTweenRef.current.kill();
      cinematicTweenRef.current = null;
    }
    setIsManualPlaying(false);
    manualModeRef.current = false;
  }, []);

  const startCinematic = useCallback(
    (fromProgress = 0) => {
      clearAllTimers();
      stopCinematic();
      runIdRef.current++;

      if (reducedMotion) {
        applyProgressState(1);
        return;
      }

      manualModeRef.current = true;
      setIsManualPlaying(true);
      setExpandedPreview(false);

      const proxy = { p: fromProgress };
      applyProgressState(fromProgress);

      cinematicTweenRef.current = gsap.to(proxy, {
        p: 1,
        duration: Math.max(2.2, 9 * (1 - fromProgress)),
        ease: 'power1.inOut',
        onUpdate: () => applyProgressState(proxy.p),
        onComplete: () => {
          applyProgressState(1);
          setIsManualPlaying(false);
          manualModeRef.current = false;
          cinematicTweenRef.current = null;
        },
      });
    },
    [applyProgressState, clearAllTimers, reducedMotion, stopCinematic]
  );

  const handleManualReplay = useCallback(() => {
    startCinematic(0.02);
  }, [startCinematic]);

  const toggleCinematicPause = useCallback(() => {
    const tween = cinematicTweenRef.current;
    if (!tween) {
      startCinematic(scrollProgress >= 0.99 ? 0.02 : scrollProgress);
      return;
    }
    if (tween.paused()) {
      tween.resume();
      setIsManualPlaying(true);
      manualModeRef.current = true;
    } else {
      tween.pause();
      setIsManualPlaying(false);
    }
  }, [scrollProgress, startCinematic]);

  // --- Lecture auto une fois la séquence visible (comme une vidéo qui démarre) ---
  useEffect(() => {
    if (reducedMotion) return;
    const node = pinWorkspaceRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasAutoplayedRef.current && !manualModeRef.current) {
            hasAutoplayedRef.current = true;
            startCinematic(0.02);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, startCinematic]);

  // Stop propre si le composant est démonté en pleine lecture
  useEffect(() => {
    return () => {
      stopCinematic();
    };
  }, [stopCinematic]);

  const handleSelectStep = (targetMacroStep: 'A' | 'B' | 'C') => {
    clearAllTimers();
    runIdRef.current++;
    setIsManualPlaying(false);
    manualModeRef.current = true;

    if (targetMacroStep === 'A') {
      applyProgressState(0.24);
    } else if (targetMacroStep === 'B') {
      applyProgressState(0.56);
    } else {
      applyProgressState(1);
    }

    schedule(() => {
      manualModeRef.current = false;
    }, 1200);
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const activeMacroStep: 'A' | 'B' | 'C' =
    stage === 1 ? 'A' : stage === 2 || stage === 3 ? 'B' : 'C';

  const displayedPrompt = DEMO_PROMPT.slice(0, typedChars);

  const filteredProducts =
    selectedCategory === 'all'
      ? PRODUCTS
      : selectedCategory === 'premium'
      ? PRODUCTS.filter((p) => p.id !== 'redmi-note-14')
      : PRODUCTS.filter((p) => p.id === 'redmi-note-14');

  return (
    <section
      id="prompt-to-product"
      className="py-16 sm:py-24 border-t border-[#E8E6DE]/80 dark:border-[#243337] bg-[#FFFDF8]/65 dark:bg-[#111B1E]/55"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8">
        {/* En-tête de section avec StaggerReveal */}
        <div ref={headerRevealRef} className="mb-10 sm:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <StaggerReveal isVisible={headerVisible} staggerIndex={0} className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 text-xs font-bold tracking-widest uppercase text-[#078348] dark:text-[#8CCB4A] mb-3">
                <span className="w-5 h-[1.5px] bg-[#078348]" />
                <span>Du prompt au résultat concret</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-4xl leading-tight text-[#14282D] dark:text-[#F3F2EC]">
                Une demande en français.{' '}
                <span className="aura-text-gradient">Un projet prêt à explorer.</span>
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-[#77817F] leading-relaxed">
                Faites défiler ou lancez la séquence pour observer comment Aura prépare le projet,
                structure le code HTML/CSS et assemble une boutique mobile en FCFA.
              </p>
            </StaggerReveal>

            {/* Contrôles accessibles au clavier */}
            <StaggerReveal
              isVisible={headerVisible}
              staggerIndex={1}
              className="flex flex-wrap items-center gap-2.5 shrink-0"
            >
              <span className="text-[11px] font-medium text-[#77817F] px-3 py-1.5 rounded-full bg-[#F4F2EA] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337]">
                Démonstration illustrative
              </span>

              <button
                type="button"
                onClick={toggleCinematicPause}
                aria-label={isManualPlaying ? 'Mettre la séquence en pause' : 'Lire la séquence'}
                className="px-4 py-2 rounded-full bg-[#FFFDF8] dark:bg-[#152023] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i
                  className={`fa-solid ${
                    isManualPlaying ? 'fa-pause text-[#FF790D]' : 'fa-play text-[#078348]'
                  } text-[11px]`}
                />
                <span>{isManualPlaying ? 'Pause' : 'Lire la séquence'}</span>
              </button>
              <button
                type="button"
                onClick={handleManualReplay}
                aria-label="Rejouer la démonstration Prompt to Product depuis le début"
                className="px-4 py-2 rounded-full bg-[#FFFDF8] dark:bg-[#152023] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-rotate-right text-[#078348] text-[11px]" />
                <span>Rejouer</span>
              </button>
            </StaggerReveal>
          </div>
        </div>

        {/* ===================================================================
            SCÈNE DESKTOP SCROLLYTELLING (Pin ScrollTrigger maîtrisé sur lg+)
        =================================================================== */}
        <div ref={pinSectionRef} className="hidden lg:block">
          <div
            ref={pinWorkspaceRef}
            className="grid grid-cols-12 gap-8 items-start py-2"
          >
            {/* Colonne narrative gauche : Étapes A, B et C */}
            <div className="col-span-4 space-y-4">
              {(
                [
                  {
                    id: 'A' as const,
                    badge: 'Étape A — Le prompt',
                    title: 'Exprimer l’idée simplement',
                    desc: 'Vous décrivez votre besoin en français naturel : contexte local au Bénin, affichage des prix en FCFA et ergonomie mobile.',
                    accent: '#078348',
                  },
                  {
                    id: 'B' as const,
                    badge: 'Étape B — La génération',
                    title: 'Préparation du projet & Code',
                    desc: 'Le message est envoyé, le statut « Préparation du projet » s’active, les fichiers apparaissent et le code HTML/CSS se révèle par blocs.',
                    accent: '#EACB37',
                  },
                  {
                    id: 'C' as const,
                    badge: 'Étape C — Le résultat',
                    title: 'Boutique interactive en FCFA',
                    desc: 'L’aperçu se stabilise avec la barre de navigation KoraTech, le catalogue de smartphones et les tarifs en FCFA.',
                    accent: '#FF790D',
                  },
                ] as const
              ).map((stepItem) => {
                const isActive = activeMacroStep === stepItem.id;
                const isPassed =
                  (stepItem.id === 'A' && activeMacroStep !== 'A') ||
                  (stepItem.id === 'B' && activeMacroStep === 'C');

                return (
                  <button
                    key={stepItem.id}
                    type="button"
                    onClick={() => handleSelectStep(stepItem.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-[#FFFDF8] dark:bg-[#152023] border-[#078348]/45 shadow-[0_12px_30px_rgba(20,40,45,0.05)]'
                        : 'bg-[#FBFAF5]/70 dark:bg-[#111B1E]/60 border-[#E8E6DE] dark:border-[#243337] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: isActive ? '#078348' : '#77817F' }}
                      >
                        {stepItem.badge}
                      </span>
                      {isPassed ? (
                        <span className="w-5 h-5 rounded-full bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center text-[10px]">
                          <i className="fa-solid fa-check" />
                        </span>
                      ) : isActive ? (
                        <span className="w-2 h-2 rounded-full bg-[#FF790D]" />
                      ) : null}
                    </div>
                    <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                      {stepItem.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#77817F] leading-relaxed">
                      {stepItem.desc}
                    </p>
                  </button>
                );
              })}

              {/* Barre de progression liée au défilement */}
              <div className="px-2 pt-2">
                <div className="flex items-center justify-between text-[11px] text-[#77817F] mb-1.5 tabular-nums">
                  <span>Progression de la scène</span>
                  <span>{Math.round(scrollProgress * 100)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E8E6DE] dark:bg-[#243337] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.max(8, Math.round(scrollProgress * 100))}%`,
                      background: 'linear-gradient(90deg, #078348, #8CCB4A, #EACB37, #FF790D)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Colonne droite : Fenêtre de démonstration épinglée */}
            <div className="col-span-8 rounded-[28px] bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] shadow-[0_22px_58px_rgba(20,40,45,0.07)] overflow-hidden">
              {/* Barre supérieure de la fenêtre */}
              <div className="px-5 py-3.5 bg-[#FBFAF5] dark:bg-[#111B1E] border-b border-[#E8E6DE] dark:border-[#243337] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AuraLogo
                    size="sm"
                    withWordmark
                    animated={stage >= 2 && stage <= 4}
                    glow={stage >= 2 && stage <= 4 ? 'active' : false}
                    activityState={stage >= 2 && stage <= 4 ? 'generating' : 'idle'}
                  />
                  <span aria-hidden="true" className="text-[#E8E6DE] dark:text-[#243337]">
                    |
                  </span>
                  <span className="text-xs font-medium text-[#77817F]">
                    {stage === 1
                      ? 'Saisie de la demande'
                      : stage === 2 || stage === 3
                      ? 'Préparation du projet'
                      : 'Aperçu KoraTech Bénin (FCFA)'}
                  </span>
                </div>

                {/* Fichiers générés visibles dès l'Étape B */}
                <div className="flex items-center gap-1.5">
                  {PROJECT_FILES.map((file) => {
                    const active = stage >= file.minStage;
                    return (
                      <span
                        key={file.name}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-opacity duration-300 ${
                          active
                            ? 'opacity-100 bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]'
                            : 'opacity-30 bg-[#F4F2EA] dark:bg-[#1B292D] text-[#77817F]'
                        }`}
                      >
                        {file.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Zone du prompt (Étape A & statut Étape B) */}
              <div className="p-5 border-b border-[#E8E6DE]/80 dark:border-[#243337]">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-terminal text-xs" />
                    </span>
                    <p className="text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                      {displayedPrompt}
                      {stage === 1 && (
                        <span
                          aria-hidden="true"
                          className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#078348] animate-pulse"
                        />
                      )}
                    </p>
                  </div>

                  {/* Badge de statut exigé : « Préparation du projet » à l'Étape B */}
                  <div className="shrink-0">
                    {stage === 1 ? (
                      <span className="px-3 py-1.5 rounded-full bg-[#14282D] text-white text-xs font-semibold inline-flex items-center gap-1.5">
                        <span>Saisie...</span>
                      </span>
                    ) : stage === 2 || stage === 3 ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-[#FFF3E6] text-[#FF790D] border border-[#FF790D]/30 text-xs font-semibold inline-flex items-center gap-2">
                        <i className="fa-solid fa-circle-notch fa-spin text-[10px]" />
                        <span>Préparation du projet</span>
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-check text-[10px]" />
                        <span> Envoyé & Généré</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Corps de la fenêtre : Code (Gauche) + Aperçu Boutique FCFA (Droite) */}
              <div className="grid grid-cols-12 min-h-[360px]">
                {!expandedPreview && (
                  <div className="col-span-5 bg-[#101B1E] text-[#E6ECEA] border-r border-[#223236] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#223236] text-xs">
                        <span className="font-mono text-[#8CCB4A]">index.html</span>
                        <span className="text-[11px] font-mono text-[#94A09E] tabular-nums">
                          {visibleCodeLines}/{CODE_LINES.length} lignes
                        </span>
                      </div>

                      <div className="font-mono text-[11px] space-y-1.5 leading-relaxed overflow-x-auto">
                        {CODE_LINES.map((line, index) => {
                          const isShown = index < visibleCodeLines || stage >= 4;
                          return (
                            <div
                              key={line.num}
                              className={`flex items-start gap-2.5 transition-all duration-300 ${
                                isShown
                                  ? 'opacity-100 translate-y-0'
                                  : 'opacity-15 translate-y-1 select-none'
                              }`}
                            >
                              <span className="w-4 text-right text-[#5B7075] select-none tabular-nums shrink-0">
                                {line.num}
                              </span>
                              <span
                                className={`whitespace-pre ${
                                  line.type === 'component'
                                    ? 'text-[#EACB37]'
                                    : line.type === 'title'
                                    ? 'text-[#8CCB4A] font-semibold'
                                    : line.type === 'tag'
                                    ? 'text-[#7CC5F8]'
                                    : 'text-[#D4E2DF]'
                                }`}
                              >
                                {line.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#223236] flex items-center justify-between text-[11px] text-[#94A09E]">
                      <span>HTML5 · Tailwind · FCFA</span>
                      <button
                        type="button"
                        onClick={() => onTryInWorkspace(DEMO_PROMPT)}
                        className="text-[#8CCB4A] hover:underline font-medium cursor-pointer"
                      >
                        Ouvrir dans Aura →
                      </button>
                    </div>
                  </div>
                )}

                {/* Panneau d'aperçu du site Web */}
                <div
                  className={`${
                    expandedPreview ? 'col-span-12' : 'col-span-7'
                  } p-5 bg-[#FBFAF5] dark:bg-[#111B1E] flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#E8E6DE] dark:border-[#243337]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#078348]/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EACB37]/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF790D]/70" />
                      <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] text-[11px] text-[#77817F] font-mono">
                        koratech-cotonou.bj
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (stage < 5) handleSelectStep('C');
                        setExpandedPreview((prev) => !prev);
                      }}
                      className="px-3 py-1 rounded-full bg-[#FFFDF8] dark:bg-[#152023] hover:bg-[#F4F2EA] border border-[#E8E6DE] dark:border-[#243337] text-[11px] font-semibold text-[#14282D] dark:text-[#F3F2EC] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <i
                        className={`fa-solid ${
                          expandedPreview ? 'fa-compress' : 'fa-expand'
                        } text-[10px] text-[#078348]`}
                      />
                      <span>{expandedPreview ? 'Afficher code + aperçu' : 'Voir l’aperçu'}</span>
                    </button>
                  </div>

                  {stage <= 3 ? (
                    <div className="flex-1 rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-dashed border-[#E8E6DE] dark:border-[#243337] p-6 flex flex-col items-center justify-center text-center">
                      <AuraLogo
                        size="md"
                        variant="symbol"
                        animated
                        glow="subtle"
                        activityState="generating"
                      />
                      <p className="mt-3 font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                        {stage === 1
                          ? 'En attente de la validation du prompt...'
                          : 'Préparation du projet KoraTech Bénin...'}
                      </p>
                      <p className="mt-1 text-xs text-[#77817F] max-w-xs">
                        Génération de la navigation, des fiches smartphones et des prix en FCFA.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-4 space-y-3.5">
                      {/* Navigation & Titre de boutique */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E8E6DE]/80 dark:border-[#243337]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#078348] text-white font-display font-bold text-xs flex items-center justify-center">
                            KT
                          </span>
                          <div>
                            <p className="font-display font-bold text-xs sm:text-sm text-[#14282D] dark:text-[#F3F2EC] leading-none">
                              KoraTech Bénin
                            </p>
                            <p className="text-[10px] text-[#77817F] mt-0.5">
                              Cotonou · Livraison 24h
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px]">
                          {(
                            [
                              { id: 'all', label: 'Tous' },
                              { id: 'premium', label: 'Pro' },
                              { id: 'accessible', label: '< 200k' },
                            ] as const
                          ).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                                selectedCategory === cat.id
                                  ? 'bg-[#14282D] text-white dark:bg-[#8CCB4A] dark:text-[#14282D]'
                                  : 'bg-[#FBFAF5] dark:bg-[#111B1E] text-[#77817F]'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                          <span className="px-2 py-0.5 rounded-full bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold tabular-nums">
                            Panier ({selectedCartCount})
                          </span>
                        </div>
                      </div>

                      {/* Catalogue smartphones avec prix en FCFA */}
                      <div
                        className={`grid grid-cols-3 gap-2.5 transition-opacity duration-300 ${
                          stage >= 5 ? 'opacity-100' : 'opacity-65'
                        }`}
                      >
                        {filteredProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] p-3 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px]"
                                  style={{ backgroundColor: prod.accent }}
                                >
                                  <i className={prod.icon} />
                                </span>
                                <span className="text-[9px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                                  {prod.badge}
                                </span>
                              </div>
                              <h4 className="font-display font-bold text-xs text-[#14282D] dark:text-[#F3F2EC]">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-[#77817F] mt-0.5">{prod.tag}</p>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-[#E8E6DE]/70 dark:border-[#243337] flex items-center justify-between gap-1">
                              <span className="font-display font-extrabold text-[11px] text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                                {prod.price}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedCartCount((c) => c + 1)}
                                className="px-2 py-0.5 rounded-md bg-[#078348] text-white text-[10px] font-semibold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pied d'aperçu */}
                  <div className="mt-3 pt-2.5 border-t border-[#E8E6DE]/80 dark:border-[#243337] flex items-center justify-between text-xs">
                    <span className="text-[#77817F]">
                      {stage >= 5
                        ? 'Résultat stabilisé — Prêt à personnaliser'
                        : 'Faites défiler pour révéler l’aperçu complet'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onTryInWorkspace(DEMO_PROMPT)}
                      className="font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Générer en réel dans Aura</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            PRÉSENTATION VERTICALE MOBILE & TABLETTE (Pin désactivé — 3 étapes)
            1. Prompt -> 2. Code -> 3. Résultat
        =================================================================== */}
        <div className="lg:hidden space-y-5">
          {/* 1. Étape 1 — Le Prompt */}
          <div
            ref={mobileStep1Ref}
            className={`aura-reveal ${
              mobileStep1Visible ? 'is-visible' : ''
            } rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-4 space-y-2.5`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
                1. Le Prompt
              </span>
              <span className="text-[11px] text-[#77817F]">Français naturel</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#14282D] dark:text-[#F3F2EC] bg-[#FBFAF5] dark:bg-[#111B1E] p-3 rounded-xl border border-[#E8E6DE] dark:border-[#243337]">
              « {DEMO_PROMPT} »
            </p>
          </div>

          {/* 2. Étape 2 — Préparation du projet & Code */}
          <div
            ref={mobileStep2Ref}
            className={`aura-reveal ${
              mobileStep2Visible ? 'is-visible' : ''
            } rounded-2xl bg-[#101B1E] text-[#E6ECEA] border border-[#223236] p-4 space-y-3`}
          >
            <div className="flex items-center justify-between text-xs border-b border-[#223236] pb-2.5">
              <span className="font-bold uppercase tracking-wider text-[#8CCB4A]">
                2. Code & Préparation du projet
              </span>
              <span className="font-mono text-[11px] text-[#EACB37]">index.html</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto text-[#D4E2DF]">
              <code>{`<header class="koratech-nav">
  <span class="brand">KoraTech · Cotonou</span>
</header>
<div class="catalog-grid">
  <ProductCard name="iPhone 16 Pro" price="785 000 FCFA" />
  <ProductCard name="Galaxy S24 Ultra" price="690 000 FCFA" />
  <ProductCard name="Redmi Note 14 Pro" price="195 000 FCFA" />
</div>`}</code>
            </pre>
          </div>

          {/* 3. Étape 3 — Le Résultat (Boutique en FCFA) */}
          <div
            ref={mobileStep3Ref}
            className={`aura-reveal ${
              mobileStep3Visible ? 'is-visible' : ''
            } rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-4 space-y-3.5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF790D]">
                  3. Le Résultat
                </span>
                <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                  KoraTech Bénin · Boutique Mobile
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-[11px] font-semibold">
                Prix en FCFA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-display font-bold text-xs text-[#14282D] dark:text-[#F3F2EC]">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-[#77817F]">{prod.tag}</p>
                  </div>
                  <span className="font-display font-extrabold text-xs text-[#078348] dark:text-[#8CCB4A] tabular-nums shrink-0">
                    {prod.price}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onTryInWorkspace(DEMO_PROMPT)}
              className="aura-btn-gradient w-full py-3 rounded-full text-xs font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ouvrir ce projet dans l’éditeur Aura</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
