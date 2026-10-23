import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuraLogo } from '../components/brand/AuraLogo';
import { AuraThreeCanvas } from '../components/three/AuraThreeCanvas';
import { useAura } from '../context/AuraContext';
import { AuraMode } from '../shared/types';
import {
  useScrollReveal,
  usePrefersReducedMotion,
  StaggerReveal,
} from '../components/landing/useScrollReveal';
import { AuraGallerySection } from '../components/landing/AuraGallerySection';
import { PromptToProductDemo } from '../components/landing/PromptToProductDemo';

import fashionModelImg from '../assets/images/yourbrand_fashion_model_1791684477799.jpg';
import avatarWoman1 from '../assets/images/avatar_user_woman_1_1791684488026.jpg';
import avatarWoman2 from '../assets/images/avatar_user_woman_2_1791684499576.jpg';
import avatarRosaire1 from '../assets/images/avatar_rosaire_1791622864516.jpg';
import avatarRosaire2 from '../assets/images/avatar_rosaire_1791622876221.jpg';

gsap.registerPlugin(ScrollTrigger);

type CapabilityTab = 'chat' | 'explore' | 'studio' | 'missions';
type LegalSheet = 'conditions' | 'confidentialite' | 'support' | 'tarifs' | 'apropos' | null;

const CAPABILITY_ORDER: CapabilityTab[] = ['chat', 'explore', 'studio', 'missions'];

const IDEA_FLOW_BEATS = [
  { id: 1, label: '1. Demande utilisateur' },
  { id: 2, label: '2. Mission structurée' },
  { id: 3, label: '3. Étapes en progression' },
  { id: 4, label: '4. Ouverture Aura Studio' },
  { id: 5, label: '5. Livrable final prêt' },
] as const;

export const LandingPage: React.FC = () => {
  const { isAuthenticated, theme, toggleTheme, setActiveMode, sendMessage } = useAura();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeCapability, setActiveCapability] = useState<CapabilityTab>('chat');
  const [composerDemoInput, setComposerDemoInput] = useState('');
  const [legalSheet, setLegalSheet] = useState<LegalSheet>(null);

  // Narrative stage (1..5) for Section "Comment ça marche ? — Idea Flow"
  const [ideaStage, setIdeaStage] = useState<number>(5);
  const [ideaProgress, setIdeaProgress] = useState<number>(1);

  // Refs for Hero — Aura Light parallax & Idea Flow ScrollTrigger
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroHaloRef = useRef<HTMLDivElement | null>(null);
  const heroOrbitRef = useRef<SVGSVGElement | null>(null);
  const heroSymbolWrapRef = useRef<HTMLDivElement | null>(null);
  const ideaFlowSectionRef = useRef<HTMLElement | null>(null);
  const tabButtonRefs = useRef<Record<CapabilityTab, HTMLButtonElement | null>>({
    chat: null,
    explore: null,
    studio: null,
    missions: null,
  });

  // Scroll Reveal hooks for sections
  const { ref: ideaHeaderRef, isVisible: ideaHeaderVisible } =
    useScrollReveal<HTMLDivElement>(0.12);
  const { ref: capSectionRef, isVisible: capVisible } =
    useScrollReveal<HTMLElement>(0.1);
  const { ref: ctaWrapperRef, isVisible: ctaVisible } =
    useScrollReveal<HTMLDivElement>(0.12);

  // GSAP + ScrollTrigger Choreography (Hero subtle parallax + Idea Flow 5-stage narrative)
  useEffect(() => {
    if (reducedMotion) {
      setIdeaStage(5);
      setIdeaProgress(1);
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Hero — Aura Light subtle scroll-linked parallax
      if (
        heroSectionRef.current &&
        heroHaloRef.current &&
        heroOrbitRef.current &&
        heroSymbolWrapRef.current
      ) {
        gsap.to(heroHaloRef.current, {
          y: -24,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        gsap.to(heroOrbitRef.current, {
          y: -14,
          rotation: 4,
          transformOrigin: '50% 50%',
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        });

        gsap.to(heroSymbolWrapRef.current, {
          y: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }

      // 2. Démonstration — Idea Flow 5-beat scroll progression (natural scroll, no hijacking)
      if (ideaFlowSectionRef.current) {
        ScrollTrigger.create({
          trigger: ideaFlowSectionRef.current,
          start: 'top 76%',
          end: 'bottom 32%',
          scrub: 0.35,
          onUpdate: (self) => {
            const p = self.progress;
            setIdeaProgress(p);
            if (p < 0.18) setIdeaStage(1);
            else if (p < 0.38) setIdeaStage(2);
            else if (p < 0.62) setIdeaStage(3);
            else if (p < 0.82) setIdeaStage(4);
            else setIdeaStage(5);
          },
        });
      }
    });

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  const handleLaunchWithPrompt = async (mode: AuraMode, promptText: string) => {
    setActiveMode(mode);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await sendMessage({
      message: promptText,
      mode,
      onConversationReady: (readyId) => {
        navigate(`/app/chat/${readyId}`);
      },
    });
  };

  const handleMiniChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptToRun =
      composerDemoInput.trim() ||
      "Peux-tu m'aider à créer une stratégie de contenu pour ma marque sur les réseaux sociaux ?";
    setComposerDemoInput('');
    await handleLaunchWithPrompt('chat', promptToRun);
  };

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Keyboard navigation for Living Interface capability tabs
  const handleCapabilityTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: CapabilityTab
  ) => {
    const idx = CAPABILITY_ORDER.indexOf(currentTab);
    let nextTab: CapabilityTab | null = null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextTab = CAPABILITY_ORDER[(idx + 1) % CAPABILITY_ORDER.length];
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextTab =
        CAPABILITY_ORDER[(idx - 1 + CAPABILITY_ORDER.length) % CAPABILITY_ORDER.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextTab = CAPABILITY_ORDER[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      nextTab = CAPABILITY_ORDER[CAPABILITY_ORDER.length - 1];
    }

    if (nextTab) {
      setActiveCapability(nextTab);
      tabButtonRefs.current[nextTab]?.focus();
    }
  };

  const capabilityData: Record<
    CapabilityTab,
    {
      id: CapabilityTab;
      tabLabel: string;
      mode: AuraMode;
      transitionClass: string;
      statusBadge: string;
      prompt: string;
      userBubble: string;
      assistantIntro: string;
      mobileSummaryTitle: string;
      mobileSummarySubtitle: string;
      mobileSummaryDesc: string;
      mobileChecklist: string[];
      cards: {
        title: string;
        meta: string;
        accentBg: string;
        accentColor: string;
        icon: string;
      }[];
    }
  > = {
    chat: {
      id: 'chat',
      tabLabel: 'Aura Chat',
      mode: 'chat',
      transitionClass: 'aura-cap-panel-chat',
      statusBadge: 'Dialogue & Stratégie',
      prompt:
        "Peux-tu m'aider à créer une stratégie de contenu pour ma marque sur les réseaux sociaux ?",
      userBubble:
        "Peux-tu m'aider à créer une stratégie de contenu pour ma marque sur les réseaux sociaux ?",
      assistantIntro:
        'Voici une stratégie de contenu complète pour ta marque, avec un plan par plateforme, des idées de posts et un calendrier éditorial sur 4 semaines.',
      mobileSummaryTitle: 'Aura Chat',
      mobileSummarySubtitle: 'Discutez, réfléchissez, analysez.',
      mobileSummaryDesc:
        'Obtenez des réponses claires, pertinentes et personnalisées à vos questions.',
      mobileChecklist: ['Idées de posts', 'Calendrier éditorial', 'Conseils de création'],
      cards: [
        {
          title: 'Plan stratégique',
          meta: 'PDF • 12 pages',
          accentBg: 'bg-[#FDE68A]',
          accentColor: '#D97706',
          icon: 'fa-solid fa-file-pdf',
        },
        {
          title: 'Calendrier éditorial',
          meta: 'XLS • 4 semaines',
          accentBg: 'bg-[#D9F99D]',
          accentColor: '#15803D',
          icon: 'fa-solid fa-table',
        },
        {
          title: 'Idées de visuels',
          meta: 'PNG • 10 idées',
          accentBg: 'bg-[#E5E7EB]',
          accentColor: '#374151',
          icon: 'fa-regular fa-images',
        },
      ],
    },
    explore: {
      id: 'explore',
      tabLabel: 'Aura Explore',
      mode: 'search',
      transitionClass: 'aura-cap-panel-explore',
      statusBadge: 'Sources Web Vérifiées',
      prompt:
        'Quelles sont les tendances e-commerce et paiement mobile les plus porteuses en 2026 ?',
      userBubble:
        'Quelles sont les tendances e-commerce et paiement mobile les plus porteuses en 2026 ?',
      assistantIntro:
        'Voici une synthèse sourcée des tendances majeures du commerce digital et du paiement instantané, accompagnée des références vérifiées.',
      mobileSummaryTitle: 'Aura Explore',
      mobileSummarySubtitle: 'Recherchez, vérifiez, synthétisez.',
      mobileSummaryDesc:
        'Accédez à des sources fiables et des informations à jour pour aller plus loin.',
      mobileChecklist: ['Sources web vérifiées', 'Synthèse structurée', 'Chiffres clés à jour'],
      cards: [
        {
          title: 'Rapport Tendances',
          meta: 'Web • 8 sources',
          accentBg: 'bg-[#FEF08A]',
          accentColor: '#B45309',
          icon: 'fa-solid fa-globe',
        },
        {
          title: 'Comparatif Marché',
          meta: 'DATA • Synthèse',
          accentBg: 'bg-[#BBF7D0]',
          accentColor: '#047857',
          icon: 'fa-solid fa-chart-column',
        },
        {
          title: 'Sources Vérifiées',
          meta: 'Citations • Directes',
          accentBg: 'bg-[#E0E7FF]',
          accentColor: '#1D4ED8',
          icon: 'fa-solid fa-circle-check',
        },
      ],
    },
    studio: {
      id: 'studio',
      tabLabel: 'Aura Studio',
      mode: 'code',
      transitionClass: 'aura-cap-panel-studio',
      statusBadge: 'Code & Aperçu Direct',
      prompt:
        'Crée un site vitrine moderne pour une boutique de vêtements avec un design premium et responsive.',
      userBubble:
        'Crée un site vitrine moderne pour une boutique de vêtements avec un design premium et responsive.',
      assistantIntro:
        'Ton site vitrine YourBrand est prêt dans Aura Studio avec aperçu interactif en direct, grille produits et adaptation mobile.',
      mobileSummaryTitle: 'Aura Studio',
      mobileSummarySubtitle: 'Créez, codez et prévisualisez en direct.',
      mobileSummaryDesc:
        'Générez des contenus, du code et des interfaces web avec aperçu interactif immédiat.',
      mobileChecklist: ['Aperçu HTML/CSS en direct', 'Design responsive', 'Export en un clic'],
      cards: [
        {
          title: 'index.html',
          meta: 'HTML5 • Responsive',
          accentBg: 'bg-[#BBF7D0]',
          accentColor: '#15803D',
          icon: 'fa-solid fa-code',
        },
        {
          title: 'Charte & Couleurs',
          meta: 'UI • Système',
          accentBg: 'bg-[#FDE68A]',
          accentColor: '#D97706',
          icon: 'fa-solid fa-palette',
        },
        {
          title: 'Aperçu Mobile',
          meta: 'Live • Sandbox',
          accentBg: 'bg-[#FFEDD5]',
          accentColor: '#EA580C',
          icon: 'fa-solid fa-mobile-screen-button',
        },
      ],
    },
    missions: {
      id: 'missions',
      tabLabel: 'Aura Missions',
      mode: 'create',
      transitionClass: 'aura-cap-panel-missions',
      statusBadge: 'Planification en 4 jalons',
      prompt:
        "Organise le plan de lancement complet sur 30 jours d'une nouvelle application mobile.",
      userBubble:
        "Organise le plan de lancement complet sur 30 jours d'une nouvelle application mobile.",
      assistantIntro:
        'J’ai structuré ta mission en 4 étapes clés avec suivi d’avancement, jalons techniques et livrables prêts à exécuter.',
      mobileSummaryTitle: 'Aura Missions',
      mobileSummarySubtitle: 'Planifiez et suivez vos objectifs.',
      mobileSummaryDesc:
        'Transformez vos idées ambitieuses en missions structurées étape par étape.',
      mobileChecklist: ['Découpage en étapes', 'Suivi en temps réel', 'Livrables concrets'],
      cards: [
        {
          title: 'Feuille de route',
          meta: 'Mission • 4 étapes',
          accentBg: 'bg-[#FFEDD5]',
          accentColor: '#EA580C',
          icon: 'fa-solid fa-bullseye',
        },
        {
          title: 'Architecture App',
          meta: 'Tech • Spécifications',
          accentBg: 'bg-[#D9F99D]',
          accentColor: '#15803D',
          icon: 'fa-solid fa-layer-group',
        },
        {
          title: 'Kit de lancement',
          meta: 'Go-to-market',
          accentBg: 'bg-[#FDE68A]',
          accentColor: '#B45309',
          icon: 'fa-solid fa-rocket',
        },
      ],
    },
  };

  const activeCapData = capabilityData[activeCapability];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F1] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] selection:bg-[#078348]/15 selection:text-[#078348] overflow-x-hidden">
      {/* =====================================================================
          1. NAVIGATION BAR (Exact match to Image 1 Mobile & Image 2 Desktop)
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF8F1]/90 dark:bg-[#0E1618]/90 backdrop-blur-md border-b border-transparent">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-6">
          {/* Left: Official Brand Logo + Desktop Nav Links */}
          <div className="flex items-center gap-10 lg:gap-12">
            <Link to="/" className="shrink-0 focus:outline-none">
              <AuraLogo size="md" withWordmark />
            </Link>

            <nav
              aria-label="Navigation principale"
              className="hidden lg:flex items-center gap-8 text-[14.5px] font-medium text-[#3D4A47] dark:text-[#D0D8D6]"
            >
              <button
                type="button"
                onClick={() => scrollToSection('fonctionnement')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Fonctionnement
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('capacites')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Capacités
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('galerie')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Galerie
              </button>
              <Link
                to="/pricing"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Tarifs & Quotas
              </Link>
            </nav>
          </div>

          {/* Right Desktop: "Se connecter" pill + "Essayer Aura gratuitement ->" orange pill */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full bg-[#FFFDF9] dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] hover:bg-[#F3F0E6] text-[13.5px] font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-all shadow-[0_2px_8px_rgba(20,40,45,0.03)]"
            >
              Se connecter
            </Link>

            <Link
              to="/app"
              className="group px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF790D] via-[#FF8B1A] to-[#FFA428] hover:brightness-105 text-[13.5px] font-semibold text-white inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(255,121,13,0.28)] transition-all"
            >
              <span>Essayer Aura gratuitement</span>
              <i className="fa-solid fa-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Right Mobile / Tablet: "Se connecter" pill + Hamburger Menu (Exact match to Image 1) */}
          <div className="flex lg:hidden items-center gap-3">
            <Link
              to="/login"
              className="px-4 sm:px-5 py-2 rounded-full bg-[#FFFDF9] dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] text-xs sm:text-sm font-semibold text-[#14282D] dark:text-[#F3F2EC] shadow-2xs"
            >
              Se connecter
            </Link>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] cursor-pointer"
              aria-label="Menu principal"
            >
              <i className={`fa-solid ${mobileNavOpen ? 'fa-xmark' : 'fa-bars'} text-lg`} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#E6E2D6] dark:border-[#243337] bg-[#FFFDF9] dark:bg-[#152023] px-5 py-4 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <button
                type="button"
                onClick={() => scrollToSection('fonctionnement')}
                className="py-2 text-left text-[#14282D] dark:text-[#F3F2EC]"
              >
                Fonctionnement
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('capacites')}
                className="py-2 text-left text-[#14282D] dark:text-[#F3F2EC]"
              >
                Capacités
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('galerie')}
                className="py-2 text-left text-[#14282D] dark:text-[#F3F2EC]"
              >
                Galerie
              </button>
              <Link
                to="/pricing"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 text-left text-[#14282D] dark:text-[#F3F2EC]"
              >
                Tarifs & Quotas
              </Link>
            </div>
            <div className="pt-2 border-t border-[#E6E2D6] dark:border-[#243337]">
              <Link
                to="/app"
                onClick={() => setMobileNavOpen(false)}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF790D] via-[#FF8B1A] to-[#FFA428] text-center text-sm font-semibold text-white inline-flex items-center justify-center gap-2 shadow-md"
              >
                <span>Essayer Aura gratuitement</span>
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. HERO SECTION — AURA LIGHT
          Progressive word-group reveal, soft halo, SVG traces & subtle parallax
      ===================================================================== */}
      <section
        ref={heroSectionRef}
        className="relative pt-4 sm:pt-8 lg:pt-10 pb-16 sm:pb-24 border-b border-[#EAE5D9]/80 dark:border-[#243337] overflow-hidden"
      >
        {/* Decorative Flowing Organic Ribbons in Hero Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
        >
          {/* Soft Warm Radial Glow behind the 3D Aura Symbol */}
          <div
            ref={heroHaloRef}
            className="absolute right-[4%] top-[8%] w-[360px] sm:w-[540px] h-[360px] sm:h-[540px] rounded-full opacity-90 dark:opacity-45"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 200, 75, 0.34) 0%, rgba(140, 203, 74, 0.22) 38%, rgba(255, 121, 13, 0.14) 64%, transparent 78%)',
              filter: 'blur(32px)',
            }}
          />

          {/* Sculpture Three.js — rubans Aura vivants derrière le visuel principal */}
          <div className="absolute right-[2%] top-[6%] h-[320px] w-[320px] sm:right-[3%] sm:top-[4%] sm:h-[520px] sm:w-[520px] opacity-80 dark:opacity-50">
            <AuraThreeCanvas
              className="h-full w-full"
              opacity={0.85}
              interactive
              hideOnMobile
            />
          </div>

          {/* Bottom-Left Sweeping Ribbon Wave */}
          <svg
            viewBox="0 0 500 320"
            fill="none"
            className="absolute -left-16 -bottom-10 w-[280px] sm:w-[420px] h-auto opacity-85 dark:opacity-35"
          >
            <defs>
              <linearGradient id="hero-left-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#65C454" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#D7E655" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FF9424" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M-40 90 C 60 150, 150 240, 340 310 L -40 320 Z"
              fill="url(#hero-left-ribbon)"
              style={{ filter: 'blur(4px)' }}
            />
            <path
              d="M-30 115 C 70 175, 165 255, 310 315"
              stroke="#FFFDF9"
              strokeWidth="2"
              strokeOpacity="0.7"
              className="aura-svg-trace-hero"
            />
          </svg>

          {/* Right Sweeping Golden-Green Ribbon Wave */}
          <svg
            viewBox="0 0 700 450"
            fill="none"
            className="absolute -right-12 bottom-[-30px] w-[360px] sm:w-[620px] h-auto opacity-90 dark:opacity-40"
          >
            <defs>
              <linearGradient id="hero-right-ribbon" x1="0%" y1="60%" x2="100%" y2="10%">
                <stop offset="0%" stopColor="#8CCB4A" stopOpacity="0" />
                <stop offset="45%" stopColor="#F4C430" stopOpacity="0.38" />
                <stop offset="80%" stopColor="#FF790D" stopOpacity="0.52" />
                <stop offset="100%" stopColor="#8CCB4A" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <path
              d="M80 390 C 260 360, 440 280, 720 120 L 720 420 L 80 420 Z"
              fill="url(#hero-right-ribbon)"
              style={{ filter: 'blur(6px)' }}
            />
            <path
              d="M40 380 C 250 350, 460 270, 710 150"
              stroke="#FF9E2C"
              strokeOpacity="0.45"
              strokeWidth="3"
              className="aura-svg-trace-hero"
            />
          </svg>
        </div>

        <div className="max-w-[1260px] mx-auto px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Column: Badge + Word-Group Headline + Subtitle + CTAs + Social Proof */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Badge: "IA polyvalente" */}
              <div className="aura-bloom-item-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2DF] dark:bg-[#182E24] border border-[#DCE8CC] dark:border-[#244233] text-xs font-bold text-[#1E3B2B] dark:text-[#8CCB4A] mb-5">
                <i className="fa-solid fa-sun text-[#FF790D] text-xs" />
                <span>IA polyvalente</span>
              </div>

              {/* Headline: "De l'idée / au résultat." revealed progressively by word groups */}
              <h1
                aria-label="De l’idée au résultat."
                className="font-display font-extrabold text-[46px] sm:text-[60px] xl:text-[68px] leading-[1.03] tracking-tight text-[#14282D] dark:text-[#F3F2EC]"
              >
                <span className="block">
                  <span className="aura-word-mask">
                    <span className="aura-word-group-1">De l’idée</span>
                  </span>
                </span>
                <span className="block mt-1">
                  <span className="aura-word-mask mr-2.5">
                    <span className="aura-word-group-2">au</span>
                  </span>
                  <span className="aura-word-mask">
                    <span className="aura-word-group-3 bg-gradient-to-r from-[#4CB648] via-[#B4CC38] to-[#FF790D] bg-clip-text text-transparent">
                      résultat.
                    </span>
                  </span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="aura-bloom-item-2 mt-5 text-[15.5px] sm:text-[17px] text-[#55605E] dark:text-[#94A09E] max-w-[490px] leading-relaxed">
                Aura est votre assistant IA tout-en-un. Il vous aide à réfléchir,
                rechercher, créer, coder et bien plus encore.
              </p>

              {/* CTA Buttons: Stacked on Mobile (Image 1), Side-by-side on Desktop (Image 2) */}
              <div className="aura-bloom-item-3 mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                <Link
                  to="/app"
                  className="group px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF790D] via-[#FF8C1B] to-[#FFA629] hover:brightness-105 text-[15px] font-semibold text-white inline-flex items-center justify-center gap-2.5 shadow-[0_10px_26px_rgba(255,121,13,0.34)] transition-all whitespace-nowrap"
                >
                  <span>Essayer Aura gratuitement</span>
                  <i className="fa-solid fa-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('fonctionnement')}
                  className="group px-6 py-3.5 rounded-full bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F3F0E6] dark:hover:bg-[#1B292D] border border-[#E5E0D2] dark:border-[#243337] text-[15px] font-semibold text-[#14282D] dark:text-[#F3F2EC] inline-flex items-center justify-center gap-2.5 shadow-[0_2px_10px_rgba(20,40,45,0.03)] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="w-5 h-5 rounded-full border-[1.75px] border-[#14282D] dark:border-[#F3F2EC] group-hover:border-[#078348] group-hover:text-[#078348] transition-colors flex items-center justify-center">
                    <i className="fa-solid fa-play text-[8px] ml-0.5" />
                  </span>
                  <span>Voir la démo</span>
                </button>
              </div>

              {/* Social Proof Row: 4 Overlapping Avatars + "+ 50 000 utilisateurs déjà conquis" */}
              <div className="aura-bloom-item-4 mt-7 flex items-center gap-3.5">
                <div className="flex items-center -space-x-2.5">
                  <img
                    src={avatarWoman1}
                    alt="Utilisatrice Aura"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FAF8F1] dark:ring-[#0E1618]"
                  />
                  <img
                    src={avatarRosaire1}
                    alt="Utilisateur Aura"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FAF8F1] dark:ring-[#0E1618]"
                  />
                  <img
                    src={avatarRosaire2}
                    alt="Utilisateur Aura"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FAF8F1] dark:ring-[#0E1618]"
                  />
                  <img
                    src={avatarWoman2}
                    alt="Utilisatrice Aura"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FAF8F1] dark:ring-[#0E1618]"
                  />
                </div>
                <div className="text-xs sm:text-[13px] leading-snug">
                  <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block sm:inline">
                    + 50 000 utilisateurs
                  </span>{' '}
                  <span className="text-[#6E7775] dark:text-[#94A09E] block sm:inline">
                    déjà conquis
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Giant Luminous 3D Official Aura Symbol + Orbital Rings + Handwritten Note */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[300px] sm:min-h-[420px] aura-bloom-preview">
              {/* Handwritten Annotation on Desktop (Image 2) */}
              <div
                aria-hidden="true"
                className="hidden xl:flex flex-col items-start absolute top-2 right-4 z-20 select-none"
              >
                <div className="italic font-medium text-[14px] leading-snug text-[#4A5552] dark:text-[#94A09E] -rotate-6">
                  <p>Plus qu’un outil,</p>
                  <p>un partenaire</p>
                  <p>dans vos projets.</p>
                </div>
                <svg
                  viewBox="0 0 60 42"
                  fill="none"
                  className="w-11 h-8 -mt-1 -ml-5 text-[#5A6562]"
                >
                  <path
                    d="M48 6 C 34 6, 26 18, 12 32 M12 32 L 22 31 M12 32 L 15 22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="aura-svg-trace-hero"
                  />
                </svg>
              </div>

              {/* Orbital Elliptical Light Rings */}
              <svg
                ref={heroOrbitRef}
                aria-hidden="true"
                viewBox="0 0 520 440"
                fill="none"
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
              >
                {/* Tilted orbital loop */}
                <ellipse
                  cx="260"
                  cy="210"
                  rx="210"
                  ry="95"
                  transform="rotate(-18 260 210)"
                  stroke="url(#hero-orbit-grad)"
                  strokeWidth="1.5"
                  strokeOpacity="0.65"
                  className="aura-svg-trace-hero"
                />
                {/* Luminous floor ripples under the symbol */}
                <ellipse
                  cx="260"
                  cy="372"
                  rx="135"
                  ry="22"
                  stroke="#FFFDF8"
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
                <ellipse
                  cx="260"
                  cy="372"
                  rx="195"
                  ry="32"
                  stroke="#F7D36A"
                  strokeWidth="1.2"
                  strokeOpacity="0.55"
                />
                <defs>
                  <linearGradient id="hero-orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8CCB4A" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FF790D" stopOpacity="0.65" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Soft Breathing Halo behind Official Symbol */}
              <div
                aria-hidden="true"
                className="aura-hero-halo w-64 h-64 sm:w-80 sm:h-80"
              />

              {/* Floor Golden Glow */}
              <div
                aria-hidden="true"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-56 h-10 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(255, 165, 30, 0.55) 0%, rgba(234, 203, 55, 0.28) 52%, transparent 80%)',
                  filter: 'blur(10px)',
                }}
              />

              {/* Giant Official 3D Aura Symbol (strictly untouched geometry) */}
              <div ref={heroSymbolWrapRef} className="relative z-10 aura-symbol-levitate">
                <img
                  src="/assets/aura-symbol.png"
                  alt="Symbole officiel Aura"
                  referrerPolicy="no-referrer"
                  className="w-[230px] sm:w-[310px] lg:w-[340px] h-auto object-contain drop-shadow-[0_24px_48px_rgba(255,140,20,0.22)] select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SECTION "COMMENT ÇA MARCHE ?" — IDEA FLOW ("Une idée, un vrai résultat")
          Scroll-driven 5-stage narrative choreography + interactive beat controls
      ===================================================================== */}
      <section
        id="fonctionnement"
        ref={ideaFlowSectionRef}
        className="py-16 sm:py-24 border-b border-[#EAE5D9]/80 dark:border-[#243337] relative"
      >
        <div className="max-w-[1260px] mx-auto px-5 sm:px-8">
          {/* Section Header + Narrative Stage Bar */}
          <div
            ref={ideaHeaderRef}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12"
          >
            <StaggerReveal isVisible={ideaHeaderVisible} staggerIndex={0} className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2E8B47] dark:text-[#8CCB4A]">
                COMMENT ÇA MARCHE ?
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-[40px] text-[#14282D] dark:text-[#F3F2EC] tracking-tight mt-1.5">
                Une idée, un vrai résultat
              </h2>
              <p className="mt-2 text-sm sm:text-[16px] text-[#5C6664] dark:text-[#94A09E]">
                <span className="hidden lg:inline">
                  De votre demande à un livrable concret, en quelques étapes.
                </span>
                <span className="lg:hidden">
                  En quelques étapes, transformez vos idées en projets concrets.
                </span>
              </p>
            </StaggerReveal>

            {/* Interactive 5-Stage Narrative Scrubber (Accessible & Clickable) */}
            <StaggerReveal
              isVisible={ideaHeaderVisible}
              staggerIndex={1}
              className="flex flex-wrap items-center gap-1.5"
            >
              {IDEA_FLOW_BEATS.map((beat) => {
                const isBeatActive = ideaStage === beat.id;
                const isBeatPassed = ideaStage > beat.id;
                return (
                  <button
                    key={beat.id}
                    type="button"
                    onClick={() => setIdeaStage(beat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                      isBeatActive
                        ? 'bg-[#EAF3DF] dark:bg-[#182E24] border-[#8CCB4A] text-[#14282D] dark:text-[#8CCB4A] shadow-2xs'
                        : isBeatPassed
                        ? 'bg-[#FFFDF9] dark:bg-[#152023] border-[#DCE8CC] dark:border-[#244233] text-[#2E8B47] dark:text-[#8CCB4A]'
                        : 'bg-[#FFFDF9]/70 dark:bg-[#152023]/60 border-[#EAE5D8] dark:border-[#243337] text-[#6E7775]'
                    }`}
                  >
                    {beat.label}
                  </button>
                );
              })}
            </StaggerReveal>
          </div>

          {/* Continuous Narrative Progress Line on Desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block w-full h-1 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] mb-8 overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(20, Math.min(100, (ideaStage / 5) * 100))}%`,
                background: 'linear-gradient(90deg, #4CB648 0%, #F0A818 55%, #FF790D 100%)',
              }}
            />
          </div>

          {/* -----------------------------------------------------------------
              DESKTOP 3-COLUMN HORIZONTAL FLOW (Image 2 + Scroll Storytelling)
          ----------------------------------------------------------------- */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: Prompt Card + Step 1 */}
            <div className="col-span-4 flex flex-col">
              <div
                onClick={() => setIdeaStage(1)}
                className={`relative rounded-[26px] bg-[#FFFDF9] dark:bg-[#152023] border p-5 min-h-[236px] flex flex-col justify-between transition-all duration-500 cursor-pointer ${
                  ideaStage === 1
                    ? 'border-[#4CB648] shadow-[0_18px_44px_rgba(76,182,72,0.12)] -translate-y-1'
                    : 'border-[#EAE5D8] dark:border-[#243337] shadow-[0_14px_38px_rgba(20,40,45,0.045)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={avatarRosaire1}
                      alt="Utilisateur"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-[#E5E0D2]"
                    />
                    <span className="text-[11px] font-medium text-[#77817F]">
                      Demande initiale
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#2E8B47] dark:text-[#8CCB4A] bg-[#EAF5E4] dark:bg-[#182E24] px-2 py-0.5 rounded-full">
                    Exemple
                  </span>
                </div>

                <div className="rounded-2xl bg-[#F4F8F7] dark:bg-[#1B292D] border border-[#E2ECE9] dark:border-[#243337] p-4 space-y-4">
                  <p className="text-[13.5px] leading-relaxed text-[#14282D] dark:text-[#F3F2EC]">
                    <span className="underline decoration-[#078348] decoration-2 underline-offset-4 font-medium">
                      Crée un
                    </span>{' '}
                    site vitrine moderne pour une boutique de vêtements avec un design
                    premium et responsive.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5 text-xs text-[#6E7775]">
                      <i className="fa-solid fa-paperclip" />
                      <i className="fa-solid fa-link" />
                      <i className="fa-regular fa-image" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchWithPrompt(
                          'code',
                          'Crée un site vitrine moderne pour une boutique de vêtements avec un design premium et responsive.'
                        );
                      }}
                      aria-label="Tester ce prompt"
                      className={`w-8 h-8 rounded-full bg-[#4CB648] hover:bg-[#3FA33B] text-white flex items-center justify-center shadow-xs transition-transform duration-300 cursor-pointer ${
                        ideaStage === 1 ? 'scale-110 ring-4 ring-[#4CB648]/20' : ''
                      }`}
                    >
                      <i className="fa-solid fa-arrow-right text-xs" />
                    </button>
                  </div>
                </div>

                {/* Animated Connector Arrow to Card 2 */}
                <span
                  aria-hidden="true"
                  className={`absolute -right-5 top-1/2 -translate-y-1/2 text-sm font-bold z-20 transition-all duration-300 ${
                    ideaStage >= 2
                      ? 'text-[#4CB648] translate-x-0.5 scale-110'
                      : 'text-[#8CCB4A]/60'
                  }`}
                >
                  <i className="fa-solid fa-arrow-right" />
                </span>
              </div>

              {/* Step 1 Description below Card 1 */}
              <div className="mt-6 flex items-start gap-3.5 px-1">
                <span
                  className={`w-8 h-8 rounded-full text-white font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 ${
                    ideaStage === 1 ? 'bg-[#4CB648] scale-110' : 'bg-[#4CB648]'
                  }`}
                >
                  1
                </span>
                <div>
                  <h3 className="font-display font-bold text-[16px] text-[#14282D] dark:text-[#F3F2EC]">
                    Vous exprimez votre idée
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1">
                    Décrivez simplement votre besoin, en langage naturel.
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Mission Card + Step 2 (Builds steps progressively in stages 2 & 3) */}
            <div className="col-span-4 flex flex-col">
              <div
                onClick={() => setIdeaStage(3)}
                className={`relative rounded-[26px] bg-[#FFFDF9] dark:bg-[#152023] border p-5 min-h-[236px] flex flex-col justify-between transition-all duration-500 cursor-pointer ${
                  ideaStage === 2 || ideaStage === 3
                    ? 'border-[#F0A818] shadow-[0_18px_44px_rgba(240,168,24,0.12)] -translate-y-1'
                    : 'border-[#EAE5D8] dark:border-[#243337] shadow-[0_14px_38px_rgba(20,40,45,0.045)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFECE2] dark:border-[#243337]">
                  <span className="font-display font-bold text-[13px] text-[#14282D] dark:text-[#F3F2EC] truncate">
                    Mission • Site vitrine e-commerce
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF5E4] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A] text-[10.5px] font-bold shrink-0">
                    <i className="fa-solid fa-arrows-rotate text-[9px]" />
                    <span>{ideaStage >= 5 ? 'Prêt' : 'En cours'}</span>
                  </span>
                </div>

                {/* 4 Mission Steps with Progressive Checkmarks */}
                <div className="relative pl-1 py-2 space-y-3">
                  {/* Step 2.1 */}
                  <div className="flex items-center gap-3 text-xs transition-all duration-300">
                    <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-check text-[9px]" />
                    </span>
                    <span className="text-[#5C6664] dark:text-[#94A09E]">Analyse du besoin</span>
                  </div>

                  {/* Step 2.2 */}
                  <div
                    className={`flex items-center gap-3 text-xs px-2.5 py-1.5 -mx-2.5 rounded-xl transition-all duration-300 ${
                      ideaStage >= 2
                        ? 'bg-[#F4F8F2] dark:bg-[#182E24]/60'
                        : 'bg-transparent'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-check text-[9px]" />
                    </span>
                    <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">
                      Conception du design
                    </span>
                  </div>

                  {/* Step 2.3: Activates at Stage 3+ */}
                  <div className="flex items-center gap-3 text-xs transition-all duration-300">
                    {ideaStage >= 3 ? (
                      <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-check text-[9px]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-[#D5D1C4] dark:border-[#34464B] bg-[#FAF8F1] dark:bg-[#1B292D] text-[#9A9E98] flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4C0B3]" />
                      </span>
                    )}
                    <span
                      className={
                        ideaStage >= 3
                          ? 'font-semibold text-[#14282D] dark:text-[#F3F2EC]'
                          : 'text-[#6E7775] dark:text-[#94A09E]'
                      }
                    >
                      Développement
                    </span>
                  </div>

                  {/* Step 2.4: Activates at Stage 4+ */}
                  <div className="flex items-center gap-3 text-xs transition-all duration-300">
                    {ideaStage >= 4 ? (
                      <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-check text-[9px]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-[#D5D1C4] dark:border-[#34464B] bg-[#FAF8F1] dark:bg-[#1B292D] text-[#9A9E98] flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4C0B3]" />
                      </span>
                    )}
                    <span
                      className={
                        ideaStage >= 4
                          ? 'font-semibold text-[#14282D] dark:text-[#F3F2EC]'
                          : 'text-[#6E7775] dark:text-[#94A09E]'
                      }
                    >
                      Tests et livraison
                    </span>
                  </div>
                </div>

                {/* Animated Connector Arrow to Card 3 */}
                <span
                  aria-hidden="true"
                  className={`absolute -right-5 top-1/2 -translate-y-1/2 text-sm font-bold z-20 transition-all duration-300 ${
                    ideaStage >= 4
                      ? 'text-[#FF790D] translate-x-0.5 scale-110'
                      : 'text-[#8CCB4A]/60'
                  }`}
                >
                  <i className="fa-solid fa-arrow-right" />
                </span>
              </div>

              {/* Step 2 Description below Card 2 */}
              <div className="mt-6 flex items-start gap-3.5 px-1">
                <span
                  className={`w-8 h-8 rounded-full bg-[#F0A818] text-white font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 ${
                    ideaStage === 2 || ideaStage === 3 ? 'scale-110' : ''
                  }`}
                >
                  2
                </span>
                <div>
                  <h3 className="font-display font-bold text-[16px] text-[#14282D] dark:text-[#F3F2EC]">
                    Aura organise votre mission
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1">
                    Votre demande devient une mission avec des étapes claires et un suivi en
                    temps réel.
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 3: YourBrand Live Preview Card + Mobile Phone Overlay + Step 3 */}
            <div className="col-span-4 flex flex-col">
              <div
                onClick={() => setIdeaStage(5)}
                className="relative cursor-pointer"
              >
                {/* Floating "Aperçu en temps réel" badge */}
                <div
                  className={`absolute -top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5E4] border border-[#CBE6BA] text-[#2E8B47] text-[10.5px] font-bold shadow-xs transition-transform duration-300 ${
                    ideaStage >= 4 ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#4CB648]" />
                  <span>Aperçu en temps réel</span>
                </div>

                {/* Browser Window Mockup */}
                <div
                  className={`rounded-[26px] bg-[#FFFDF9] dark:bg-[#152023] border overflow-hidden min-h-[236px] flex flex-col transition-all duration-500 ${
                    ideaStage >= 4
                      ? 'border-[#FF790D]/65 shadow-[0_20px_48px_rgba(255,121,13,0.12)] -translate-y-1'
                      : 'border-[#EAE5D8] dark:border-[#243337] shadow-[0_14px_38px_rgba(20,40,45,0.055)]'
                  }`}
                >
                  {/* Browser Top Chrome */}
                  <div className="px-4 py-2.5 bg-[#F6F3EA] dark:bg-[#1B292D] border-b border-[#EAE5D8] dark:border-[#243337] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4CB648]" />
                    </div>
                    <span className="text-[9.5px] font-mono text-[#77817F]">
                      Aura Studio · Live
                    </span>
                  </div>

                  {/* Mini Site Header */}
                  <div className="px-5 py-2.5 flex items-center justify-between border-b border-[#F2EFE6] dark:border-[#243337] text-[11px]">
                    <span className="font-display font-extrabold text-[#14282D] dark:text-white">
                      YourBrand
                    </span>
                    <div className="flex items-center gap-4 text-[10px] text-[#6E7775]">
                      <span>Accueil</span>
                      <span>Boutique</span>
                      <span>À propos</span>
                    </div>
                  </div>

                  {/* Mini Site Hero Body */}
                  <div className="grid grid-cols-12 items-center flex-1 bg-gradient-to-r from-[#FAF8F2] via-[#F7F3E6] to-[#F3E9D2] dark:from-[#152023] dark:to-[#1B292D] pl-5 pr-2 py-3">
                    <div className="col-span-7 space-y-1.5 pr-1">
                      <h4 className="font-display font-extrabold text-[15px] leading-tight text-[#14282D] dark:text-white">
                        Style moderne.
                        <br />
                        Confiance éternelle.
                      </h4>
                      <p className="text-[9.5px] text-[#6E7775] dark:text-[#94A09E]">
                        Des vêtements qui vous ressemblent.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchWithPrompt(
                            'code',
                            'Crée un site vitrine moderne YourBrand pour une boutique de vêtements avec un design premium et responsive.'
                          );
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3B9B43] hover:bg-[#2E8B47] text-white text-[9px] font-semibold transition-colors cursor-pointer"
                      >
                        <span>Découvrir la collection</span>
                        <i className="fa-solid fa-arrow-right text-[7px]" />
                      </button>
                    </div>
                    <div className="col-span-5 flex justify-end">
                      <img
                        src={fashionModelImg}
                        alt="Modèle YourBrand"
                        referrerPolicy="no-referrer"
                        className="w-28 h-32 object-cover rounded-xl shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Overlapping Mobile Phone Preview on Bottom-Right */}
                <div
                  className={`absolute -bottom-5 -right-3 w-[88px] rounded-[18px] bg-[#FFFDF9] border-[2.5px] border-[#14282D] p-2 shadow-xl z-20 transition-transform duration-500 ${
                    ideaStage >= 5 ? 'translate-y-0 scale-105' : 'translate-y-1 scale-100'
                  }`}
                >
                  <div className="w-6 h-1 rounded-full bg-[#14282D]/20 mx-auto mb-1.5" />
                  <p className="font-display font-extrabold text-[7.5px] leading-tight text-[#14282D]">
                    Style moderne.
                    <br />
                    Confiance éternelle.
                  </p>
                  <p className="text-[6px] text-[#77817F] mt-0.5 leading-tight">
                    Des vêtements qui vous ressemblent.
                  </p>
                  <div className="mt-1.5 py-0.5 px-1.5 rounded-full bg-[#3B9B43] text-white text-[5.5px] font-semibold text-center">
                    Découvrir →
                  </div>
                </div>
              </div>

              {/* Step 3 Description below Card 3 */}
              <div className="mt-6 flex items-start gap-3.5 px-1">
                <span
                  className={`w-8 h-8 rounded-full bg-[#FF790D] text-white font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 ${
                    ideaStage >= 4 ? 'scale-110' : ''
                  }`}
                >
                  3
                </span>
                <div>
                  <h3 className="font-display font-bold text-[16px] text-[#14282D] dark:text-[#F3F2EC]">
                    Vous obtenez votre résultat
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1">
                    Prévisualisez, modifiez et exportez votre création depuis Aura Studio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              MOBILE & TABLET VERTICAL STEP-BY-STEP LAYOUT (Image 1)
          ----------------------------------------------------------------- */}
          <div className="lg:hidden space-y-5">
            {/* ROW 1: Step 1 Left + Prompt Card Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              <div className="md:col-span-5 rounded-[24px] bg-[#FBF9F3] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 flex items-start gap-3.5 relative">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-8 h-8 rounded-full bg-[#4CB648] text-white font-display font-bold text-sm flex items-center justify-center">
                    1
                  </span>
                  <span className="w-[1.5px] h-16 border-l border-dashed border-[#B7C9B0] mt-2 hidden md:block" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    Vous exprimez votre idée
                  </h3>
                  <p className="text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1.5">
                    Décrivez simplement votre besoin, en langage naturel.
                  </p>
                </div>
              </div>

              <div className="md:col-span-7 rounded-[24px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 shadow-[0_10px_28px_rgba(20,40,45,0.04)] flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <AuraLogo size="xs" withWordmark />
                  <span className="text-[10px] font-mono text-[#77817F]">Exemple</span>
                </div>
                <div className="rounded-2xl bg-[#F2F7F6] dark:bg-[#1B292D] border border-[#E0EAE7] dark:border-[#243337] p-3.5 flex items-end justify-between gap-3">
                  <p className="text-xs sm:text-[13px] text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                    <span className="underline decoration-[#078348] font-medium">Crée un</span>{' '}
                    site vitrine moderne pour une boutique de vêtements avec un design
                    premium et responsive.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleLaunchWithPrompt(
                        'code',
                        'Crée un site vitrine moderne pour une boutique de vêtements avec un design premium et responsive.'
                      )
                    }
                    aria-label="Lancer ce prompt"
                    className="w-8 h-8 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 2: Step 2 Left + Mission Card Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              <div className="md:col-span-5 rounded-[24px] bg-[#FBF9F3] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 flex items-start gap-3.5">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-8 h-8 rounded-full bg-[#F0A818] text-white font-display font-bold text-sm flex items-center justify-center">
                    2
                  </span>
                  <span className="w-[1.5px] h-16 border-l border-dashed border-[#E2C785] mt-2 hidden md:block" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    Aura organise votre mission
                  </h3>
                  <p className="text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1.5">
                    Votre demande devient une mission avec des étapes claires et un suivi en
                    temps réel.
                  </p>
                </div>
              </div>

              <div className="md:col-span-7 rounded-[24px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 shadow-[0_10px_28px_rgba(20,40,45,0.04)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                    Mission en cours
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF5E4] text-[#2E8B47] text-[10.5px] font-bold">
                    <i className="fa-regular fa-clock text-[9px]" />
                    <span>En cours</span>
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center">
                      <i className="fa-solid fa-check text-[9px]" />
                    </span>
                    <span className="text-[#5C6664] dark:text-[#94A09E]">Analyse du besoin</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#4CB648] text-white flex items-center justify-center">
                      <i className="fa-solid fa-check text-[9px]" />
                    </span>
                    <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">
                      Conception du design
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full border border-[#D5D1C4] bg-[#FAF8F1] flex items-center justify-center" />
                    <span className="text-[#6E7775]">Développement</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full border border-[#D5D1C4] bg-[#FAF8F1] flex items-center justify-center" />
                    <span className="text-[#6E7775]">Tests et livraison</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: Step 3 Left + YourBrand Result Card Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              <div className="md:col-span-5 rounded-[24px] bg-[#FBF9F3] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-[#FF790D] text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    Vous obtenez votre résultat
                  </h3>
                  <p className="text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1.5">
                    Prévisualisez, modifiez et exportez votre création depuis Aura Studio.
                  </p>
                </div>
              </div>

              <div className="md:col-span-7 relative rounded-[24px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] overflow-hidden shadow-[0_10px_28px_rgba(20,40,45,0.04)]">
                <div className="px-4 py-2.5 border-b border-[#EFECE2] dark:border-[#243337] flex items-center justify-between text-[11px]">
                  <span className="font-display font-extrabold text-[#14282D] dark:text-white">
                    YourBrand
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-[#6E7775]">
                    <span>Accueil</span>
                    <span>Boutique</span>
                    <span>À propos</span>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center p-4 bg-gradient-to-r from-[#FAF8F2] to-[#F3E9D2] dark:from-[#152023] dark:to-[#1B292D]">
                  <div className="col-span-7 space-y-2">
                    <h4 className="font-display font-extrabold text-sm sm:text-base leading-tight text-[#14282D] dark:text-white">
                      Style moderne.
                      <br />
                      Confiance éternelle.
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handleLaunchWithPrompt(
                          'code',
                          'Crée un site vitrine moderne YourBrand pour une boutique de vêtements.'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#3B9B43] text-white text-[10px] font-semibold cursor-pointer"
                    >
                      <span>Découvrir la collection</span>
                      <i className="fa-solid fa-arrow-right text-[8px]" />
                    </button>
                  </div>
                  <div className="col-span-5 flex justify-end">
                    <img
                      src={fashionModelImg}
                      alt="YourBrand"
                      referrerPolicy="no-referrer"
                      className="w-28 h-28 object-cover rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SECTION CAPACITÉS — LIVING INTERFACE
          Distinct directional tab transitions, persistent shell & keyboard navigation
      ===================================================================== */}
      <section
        id="capacites"
        ref={capSectionRef}
        className="py-16 sm:py-24 border-b border-[#EAE5D9]/80 dark:border-[#243337] relative"
      >
        <div className="max-w-[1260px] mx-auto px-5 sm:px-8">
          {/* Header */}
          <StaggerReveal isVisible={capVisible} staggerIndex={0} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2E8B47] dark:text-[#8CCB4A]">
              <span className="hidden lg:inline">TOUT CE DONT VOUS AVEZ BESOIN</span>
              <span className="lg:hidden">NOS CAPACITÉS</span>
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-[40px] text-[#14282D] dark:text-[#F3F2EC] tracking-tight mt-1.5 leading-tight">
              <span className="hidden lg:inline">Explorez les capacités d’Aura</span>
              <span className="lg:hidden">
                Tout ce dont vous avez besoin,
                <br />
                au même endroit.
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-[16px] text-[#5C6664] dark:text-[#94A09E]">
              Une seule plateforme. Quatre expériences complémentaires.
            </p>
          </StaggerReveal>

          {/* 4 Interactive Capability Pill Tabs with Keyboard Navigation */}
          <StaggerReveal
            isVisible={capVisible}
            staggerIndex={1}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-start lg:justify-center gap-2.5 sm:gap-3"
          >
            <div
              role="tablist"
              aria-label="Modes et capacités d'Aura"
              className="flex flex-wrap items-center gap-2.5 sm:gap-3"
            >
              {(
                [
                  {
                    id: 'chat',
                    label: 'Aura Chat',
                    icon: 'fa-solid fa-comment-dots',
                  },
                  {
                    id: 'explore',
                    label: 'Aura Explore',
                    icon: 'fa-solid fa-magnifying-glass',
                  },
                  {
                    id: 'studio',
                    label: 'Aura Studio',
                    icon: 'fa-solid fa-code',
                  },
                  {
                    id: 'missions',
                    label: 'Aura Missions',
                    icon: 'fa-solid fa-bullseye',
                  },
                ] as const
              ).map((tab) => {
                const isSelected = activeCapability === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabButtonRefs.current[tab.id] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`cap-panel-${tab.id}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setActiveCapability(tab.id)}
                    onKeyDown={(e) => handleCapabilityTabKeyDown(e, tab.id)}
                    className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-[13.5px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF3DF] dark:bg-[#182E24] border border-[#9FD16B] text-[#14282D] dark:text-[#8CCB4A] shadow-[0_4px_14px_rgba(76,182,72,0.12)]'
                        : 'bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F3F0E6] dark:hover:bg-[#1B292D] border border-[#EAE5D8] dark:border-[#243337] text-[#3D4A47] dark:text-[#94A09E]'
                    }`}
                  >
                    <i
                      className={`${tab.icon} text-xs transition-transform duration-200 ${
                        isSelected
                          ? 'text-[#2E8B47] dark:text-[#8CCB4A] scale-110'
                          : 'text-[#3D4A47]'
                      }`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </StaggerReveal>

          {/* -----------------------------------------------------------------
              DESKTOP SHOWCASE: 4 Left Feature Cards + Right Persistent Workspace Window
          ----------------------------------------------------------------- */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-center mt-12">
            {/* Left Column: 4 Feature Cards */}
            <div className="col-span-5 space-y-3.5">
              {(
                [
                  {
                    tab: 'chat' as CapabilityTab,
                    title: 'Conversation intelligente',
                    desc: 'Posez vos questions, obtenez des réponses claires et précises, et explorez de nouvelles idées.',
                    icon: 'fa-solid fa-comment-dots',
                    badgeBg: 'from-[#65C454] to-[#2E8B47]',
                  },
                  {
                    tab: 'explore' as CapabilityTab,
                    title: 'Recherche avancée',
                    desc: 'Accédez à des sources fiables et des informations à jour pour aller plus loin.',
                    icon: 'fa-solid fa-magnifying-glass',
                    badgeBg: 'from-[#FACC15] to-[#EA8010]',
                  },
                  {
                    tab: 'studio' as CapabilityTab,
                    title: 'Création & édition',
                    desc: 'Générez des contenus, du code et des visuels avec une qualité professionnelle.',
                    icon: 'fa-solid fa-code',
                    badgeBg: 'from-[#A3E635] to-[#4CB648]',
                  },
                  {
                    tab: 'missions' as CapabilityTab,
                    title: 'Suivi de vos objectifs',
                    desc: 'Organisez vos projets et suivez vos missions étape par étape.',
                    icon: 'fa-solid fa-bullseye',
                    badgeBg: 'from-[#FB923C] to-[#EA580C]',
                  },
                ] as const
              ).map((item) => {
                const isActive = activeCapability === item.tab;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => setActiveCapability(item.tab)}
                    className={`w-full text-left rounded-[22px] p-4 transition-all duration-300 flex items-start gap-4 cursor-pointer border ${
                      isActive
                        ? 'bg-[#FFFDF9] dark:bg-[#152023] border-[#9FD16B] dark:border-[#2E8B47] shadow-[0_12px_30px_rgba(20,40,45,0.055)] translate-x-1'
                        : 'bg-[#FAF8F1]/60 dark:bg-[#152023]/50 hover:bg-[#FFFDF9] border-[#EAE5D8]/80 dark:border-[#243337]'
                    }`}
                  >
                    <span
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${item.badgeBg} text-white flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 ${
                        isActive ? 'scale-105' : ''
                      }`}
                    >
                      <i className={`${item.icon} text-sm`} />
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-[15px] text-[#14282D] dark:text-[#F3F2EC]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6E7775] dark:text-[#94A09E] leading-relaxed mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Persistent Workspace Window Mockup with Distinct Tab Transitions */}
            <div className="col-span-7 relative">
              {/* Decorative Golden Orbital Curve behind the Window */}
              <svg
                aria-hidden="true"
                viewBox="0 0 680 480"
                fill="none"
                className="pointer-events-none absolute -inset-6 w-[108%] h-[108%] z-0"
              >
                <ellipse
                  cx="340"
                  cy="240"
                  rx="310"
                  ry="175"
                  transform="rotate(-22 340 240)"
                  stroke="#F0A818"
                  strokeWidth="1.25"
                  strokeOpacity="0.55"
                  className={`aura-svg-trace-scroll ${capVisible ? 'is-drawn' : ''}`}
                />
              </svg>

              <div className="relative z-10 rounded-[28px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] shadow-[0_24px_60px_rgba(20,40,45,0.075)] overflow-hidden">
                {/* Persistent Window Chrome */}
                <div className="px-5 py-3 bg-[#F6F3EA] dark:bg-[#1B292D] border-b border-[#EAE5D8] dark:border-[#243337] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4CB648]" />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#77817F]">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A] font-semibold text-[10px]">
                      {activeCapData.statusBadge}
                    </span>
                    <span className="font-mono">&lt;&gt;</span>
                    <i className="fa-regular fa-sun" />
                    <i className="fa-regular fa-bell" />
                    <i className="fa-regular fa-user" />
                  </div>
                </div>

                {/* Window Body: Left Persistent Mini Sidebar + Right Animated Mode Canvas */}
                <div className="grid grid-cols-12 min-h-[370px]">
                  {/* Left Mini Sidebar (Interactive & Persistent) */}
                  <div className="col-span-3 border-r border-[#EFECE2] dark:border-[#243337] bg-[#FAF8F2] dark:bg-[#111B1E] p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#5C6664]">
                      <i className="fa-solid fa-house text-[11px]" />
                      <span>Accueil</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCapability('chat')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                        activeCapability === 'chat'
                          ? 'bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A]'
                          : 'text-[#5C6664] hover:text-[#14282D]'
                      }`}
                    >
                      <i className="fa-solid fa-comment-dots text-[11px]" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCapability('explore')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                        activeCapability === 'explore'
                          ? 'bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A]'
                          : 'text-[#5C6664] hover:text-[#14282D]'
                      }`}
                    >
                      <i className="fa-regular fa-compass text-[11px]" />
                      <span>Explore</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCapability('studio')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                        activeCapability === 'studio'
                          ? 'bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A]'
                          : 'text-[#5C6664] hover:text-[#14282D]'
                      }`}
                    >
                      <i className="fa-solid fa-table-cells-large text-[11px]" />
                      <span>Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCapability('missions')}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                        activeCapability === 'missions'
                          ? 'bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A]'
                          : 'text-[#5C6664] hover:text-[#14282D]'
                      }`}
                    >
                      <i className="fa-solid fa-bullseye text-[11px]" />
                      <span>Missions</span>
                    </button>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#5C6664]">
                      <i className="fa-regular fa-folder text-[11px]" />
                      <span>Projets</span>
                    </div>
                  </div>

                  {/* Right Main Workspace Area: Keyed only on the inner content for smooth directional transitions */}
                  <div className="col-span-9 p-5 flex flex-col justify-between bg-[#FFFDF9] dark:bg-[#152023] overflow-hidden">
                    <div
                      key={activeCapability}
                      id={`cap-panel-${activeCapability}`}
                      role="tabpanel"
                      className={`space-y-4 ${activeCapData.transitionClass}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <AuraLogo size="xs" withWordmark />
                        <span className="text-[10.5px] font-medium text-[#77817F]">
                          {activeCapData.tabLabel}
                        </span>
                      </div>

                      {/* User Prompt Bubble */}
                      <div className="ml-auto max-w-[82%] rounded-2xl bg-[#F3F6F5] dark:bg-[#1B292D] px-4 py-2.5 text-xs text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                        {activeCapData.userBubble}
                      </div>

                      {/* Assistant Response + 3 Deliverable Cards */}
                      <div className="flex items-start gap-2.5">
                        <img
                          src={avatarRosaire1}
                          alt="Aura"
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover mt-1 shrink-0"
                        />
                        <div className="flex-1 rounded-2xl bg-[#FAF8F2] dark:bg-[#1B292D] border border-[#EFECE2] dark:border-[#243337] p-3.5 space-y-3">
                          <p className="text-xs text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                            {activeCapData.assistantIntro}
                          </p>

                          {/* 3 Deliverable Cards Row */}
                          <div className="grid grid-cols-3 gap-2.5">
                            {activeCapData.cards.map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  handleLaunchWithPrompt(activeCapData.mode, activeCapData.prompt)
                                }
                                className="rounded-xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] hover:border-[#078348]/45 hover:-translate-y-0.5 p-2.5 text-left transition-all cursor-pointer"
                              >
                                <div
                                  className={`w-9 h-9 rounded-lg ${c.accentBg} flex items-center justify-center mb-2`}
                                  style={{ color: c.accentColor }}
                                >
                                  <i className={`${c.icon} text-sm`} />
                                </div>
                                <p className="font-display font-bold text-[11px] text-[#14282D] dark:text-[#F3F2EC] truncate">
                                  {c.title}
                                </p>
                                <p className="text-[9.5px] text-[#77817F] truncate mt-0.5">
                                  {c.meta}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Persistent Mini Input Bar at Bottom */}
                    <form
                      onSubmit={handleMiniChatSubmit}
                      className="mt-4 pt-2 flex items-center gap-2 rounded-full bg-[#FAF8F2] dark:bg-[#111B1E] border border-[#EAE5D8] dark:border-[#243337] px-3.5 py-1.5"
                    >
                      <i className="fa-solid fa-paperclip text-xs text-[#77817F]" />
                      <input
                        type="text"
                        value={composerDemoInput}
                        onChange={(e) => setComposerDemoInput(e.target.value)}
                        placeholder="Écris ton message..."
                        className="flex-1 bg-transparent text-xs text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#8B9390] focus:outline-none"
                      />
                      <button
                        type="submit"
                        aria-label="Envoyer"
                        className="w-7 h-7 rounded-full bg-[#4CB648] hover:bg-[#3FA33B] text-white flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-right text-[10px]" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              MOBILE & TABLET CAPABILITY CARD + DESCRIPTION (Exact match to Image 1)
          ----------------------------------------------------------------- */}
          <div
            key={`mobile-cap-${activeCapability}`}
            className={`lg:hidden mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${activeCapData.transitionClass}`}
          >
            {/* Compact Conversation Preview Card */}
            <div className="md:col-span-7 rounded-[26px] bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-5 shadow-[0_12px_32px_rgba(20,40,45,0.045)] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <AuraLogo size="xs" withWordmark />
                <div className="max-w-[72%] rounded-2xl bg-[#F2F7F6] dark:bg-[#1B292D] border border-[#E0EAE7] dark:border-[#243337] p-3 text-xs text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                  {activeCapData.userBubble}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FAF8F2] dark:bg-[#1B292D] border border-[#EFECE2] dark:border-[#243337] p-4 flex items-start gap-3">
                <img
                  src={avatarRosaire1}
                  alt="Utilisateur"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="space-y-2 text-xs">
                  <p className="font-medium text-[#14282D] dark:text-[#F3F2EC]">
                    {activeCapData.assistantIntro}
                  </p>
                  <ul className="space-y-1.5 text-[#5C6664] dark:text-[#94A09E]">
                    {activeCapData.mobileChecklist.map((chk, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <i className="fa-solid fa-check text-[#4CB648] text-[10px]" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <form
                onSubmit={handleMiniChatSubmit}
                className="flex items-center gap-2 rounded-full bg-[#FAF8F2] dark:bg-[#111B1E] border border-[#EAE5D8] dark:border-[#243337] px-3.5 py-2"
              >
                <i className="fa-solid fa-paperclip text-xs text-[#77817F]" />
                <input
                  type="text"
                  value={composerDemoInput}
                  onChange={(e) => setComposerDemoInput(e.target.value)}
                  placeholder="Écris ton message..."
                  className="flex-1 bg-transparent text-xs text-[#14282D] dark:text-[#F3F2EC] placeholder:text-[#8B9390] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Envoyer"
                  className="w-7 h-7 rounded-full bg-[#4CB648] text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </button>
              </form>
            </div>

            {/* Right Description Column matching Image 1 */}
            <div className="md:col-span-5 space-y-3 px-1">
              <span className="w-10 h-10 rounded-full bg-[#EAF3DF] dark:bg-[#182E24] text-[#2E8B47] dark:text-[#8CCB4A] flex items-center justify-center">
                <i className="fa-regular fa-comment-dots text-base" />
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
                {activeCapData.mobileSummaryTitle}
              </h3>
              <p className="font-medium text-sm text-[#3D4A47] dark:text-[#D0D8D6]">
                {activeCapData.mobileSummarySubtitle}
              </p>
              <p className="text-xs sm:text-sm text-[#6E7775] dark:text-[#94A09E] leading-relaxed">
                {activeCapData.mobileSummaryDesc}
              </p>
              <div className="pt-1">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2E8B47] dark:text-[#8CCB4A] hover:underline"
                >
                  <span>En savoir plus</span>
                  <i className="fa-solid fa-arrow-right text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PROMPT-TO-PRODUCT — DÉMO CINÉMATIQUE (séquence GSAP « comme une vidéo »)
      ===================================================================== */}
      <PromptToProductDemo
        onTryInWorkspace={(prompt) => handleLaunchWithPrompt('code', prompt)}
      />

      {/* =====================================================================
          6. AURA GALLERY — LES 8 CRÉATIONS (Placed right before the Final CTA)
      ===================================================================== */}
      <AuraGallerySection onSelectCreation={handleLaunchWithPrompt} />

      {/* =====================================================================
          6. FINAL CTA & FOOTER (Progressive SVG Ribbon Draw & Soft Reveal)
      ===================================================================== */}
      <div ref={ctaWrapperRef} className="relative overflow-hidden">
        {/* Left & Right Sweeping Organic Ribbons Framing the Footer CTA */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden z-0"
        >
          {/* Bottom-Left Ribbon */}
          <svg
            viewBox="0 0 520 340"
            fill="none"
            className="absolute -left-16 bottom-0 w-[260px] sm:w-[440px] h-auto opacity-90 dark:opacity-35"
          >
            <defs>
              <linearGradient id="cta-left-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4CB648" stopOpacity="0.65" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#FAF8F1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M-30 40 C 90 120, 210 210, 420 340 L -30 340 Z"
              fill="url(#cta-left-ribbon)"
              style={{ filter: 'blur(4px)' }}
            />
            <path
              d="M-20 80 C 110 155, 225 235, 390 340"
              stroke="#FFFDF9"
              strokeWidth="2"
              strokeOpacity="0.75"
              className={`aura-svg-trace-scroll ${ctaVisible ? 'is-drawn' : ''}`}
            />
          </svg>

          {/* Bottom-Right Ribbon */}
          <svg
            viewBox="0 0 520 340"
            fill="none"
            className="absolute -right-16 bottom-0 w-[260px] sm:w-[440px] h-auto opacity-90 dark:opacity-35"
          >
            <defs>
              <linearGradient id="cta-right-ribbon" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF790D" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#A3E635" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#FAF8F1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M550 40 C 430 120, 310 210, 100 340 L 550 340 Z"
              fill="url(#cta-right-ribbon)"
              style={{ filter: 'blur(4px)' }}
            />
            <path
              d="M540 80 C 410 155, 295 235, 130 340"
              stroke="#FFFDF9"
              strokeWidth="2"
              strokeOpacity="0.75"
              className={`aura-svg-trace-scroll ${ctaVisible ? 'is-drawn' : ''}`}
            />
          </svg>
        </div>

        {/* Final Call to Action Block */}
        <section className="relative z-10 py-16 sm:py-24 text-center px-5 sm:px-8">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <StaggerReveal isVisible={ctaVisible} staggerIndex={0}>
              <p className="hidden lg:block text-xs font-bold uppercase tracking-[0.14em] text-[#2E8B47] dark:text-[#8CCB4A] mb-2">
                PRÊT À COMMENCER ?
              </p>

              <h2 className="font-display font-extrabold text-3xl sm:text-[40px] text-[#14282D] dark:text-[#F3F2EC] tracking-tight leading-tight">
                <span className="hidden lg:inline">
                  Ton avenir créatif commence maintenant.
                </span>
                <span className="lg:hidden">Prêt à donner vie à vos idées ?</span>
              </h2>

              <p className="mt-2.5 text-sm sm:text-[16px] text-[#5C6664] dark:text-[#94A09E]">
                <span className="hidden lg:inline">
                  Rejoins des milliers d’utilisateurs et donne vie à tes idées avec Aura.
                </span>
                <span className="lg:hidden">
                  Rejoignez des milliers d’utilisateurs qui créent déjà avec Aura.
                </span>
              </p>
            </StaggerReveal>

            <StaggerReveal isVisible={ctaVisible} staggerIndex={1} className="mt-7">
              <Link
                to="/app"
                className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF790D] via-[#FF8C1B] to-[#FFA629] hover:brightness-105 text-[15px] font-semibold text-white inline-flex items-center justify-center gap-2.5 shadow-[0_10px_26px_rgba(255,121,13,0.34)] transition-all"
              >
                <span>Essayer Aura gratuitement</span>
                <i className="fa-solid fa-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </StaggerReveal>

            {/* "— ou —" + Google & GitHub Buttons (Exact match to Image 2) */}
            <StaggerReveal
              isVisible={ctaVisible}
              staggerIndex={2}
              className="mt-6 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-3 text-xs text-[#8B9390]">
                <span className="w-8 h-[1px] bg-[#DEDAD0] dark:bg-[#243337]" />
                <span>ou</span>
                <span className="w-8 h-[1px] bg-[#DEDAD0] dark:bg-[#243337]" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F3F0E6] hover:-translate-y-0.5 border border-[#E5E0D2] dark:border-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] shadow-2xs transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FFFDF9] dark:bg-[#152023] hover:bg-[#F3F0E6] hover:-translate-y-0.5 border border-[#E5E0D2] dark:border-[#243337] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] shadow-2xs transition-all"
                >
                  <i className="fa-brands fa-github text-sm" />
                  <span>Continuer avec GitHub</span>
                </Link>
              </div>
            </StaggerReveal>
          </div>
        </section>

        {/* Minimalist Footer Bar (Exact match to Image 1 & Image 2) */}
        <footer className="relative z-10 border-t border-[#EAE5D9]/80 dark:border-[#243337] bg-[#FAF8F1]/85 dark:bg-[#0E1618]/90 backdrop-blur-xs">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-5 text-xs text-[#6E7775] dark:text-[#94A09E]">
            {/* Left: Brand + Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link to="/" className="focus:outline-none">
                <AuraLogo size="sm" withWordmark />
              </Link>
              <span className="hidden lg:inline text-[11px] text-[#8B9390]">
                © 2026 Aura. Tous droits réservés.
              </span>
            </div>

            {/* Center Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => scrollToSection('fonctionnement')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Fonctionnement
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('capacites')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Capacités
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('galerie')}
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Galerie
              </button>
              <Link
                to="/pricing"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Tarifs &amp; Quotas
              </Link>
              <Link
                to="/help"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Centre d’aide
              </Link>
            </div>

            {/* Right Legal Links + Theme Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              <Link
                to="/legal/terms"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Conditions
              </Link>
              <Link
                to="/legal/privacy"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                to="/legal/notice"
                className="aura-nav-link hidden sm:inline hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                to="/legal/contact"
                className="aura-nav-link hover:text-[#14282D] dark:hover:text-white transition-colors"
              >
                Contact
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Changer le thème"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] text-[#4A5552] dark:text-[#F3F2EC] cursor-pointer"
              >
                <i
                  className={`fa-regular ${
                    theme === 'light' ? 'fa-sun text-[#D97706]' : 'fa-moon text-[#8CCB4A]'
                  } text-xs`}
                />
              </button>
            </div>

            {/* Mobile Copyright */}
            <div className="lg:hidden text-[11px] text-[#8B9390]">
              © 2026 Aura. Tous droits réservés.
            </div>
          </div>
        </footer>
      </div>

      {/* =====================================================================
          MODAL SHEETS FOR TARIFS / À PROPOS / LEGAL LINKS
      ===================================================================== */}
      {legalSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14282D]/50 backdrop-blur-xs"
          onClick={() => setLegalSheet(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE5D8] dark:border-[#243337] p-6 sm:p-8 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AuraLogo size="sm" variant="symbol" />
                <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                  {legalSheet === 'tarifs' && 'Tarifs Aura'}
                  {legalSheet === 'apropos' && 'À propos d’Aura'}
                  {legalSheet === 'conditions' && 'Conditions d’utilisation'}
                  {legalSheet === 'confidentialite' && 'Politique de confidentialité'}
                  {legalSheet === 'support' && 'Support & Assistance'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalSheet(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F4F2EA] flex items-center justify-center text-[#77817F]"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-[#5C6664] dark:text-[#94A09E] space-y-3 leading-relaxed">
              {legalSheet === 'tarifs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-[#FAF8F1] dark:bg-[#1B292D] border border-[#EAE5D8] dark:border-[#243337]">
                    <p className="font-display font-bold text-sm text-[#14282D] dark:text-white">
                      Plan Gratuit
                    </p>
                    <p className="font-display font-extrabold text-2xl text-[#078348] mt-1">
                      0 € <span className="text-xs font-normal text-[#77817F]">/ mois</span>
                    </p>
                    <p className="text-xs mt-2">
                      Accès immédiat à Aura Chat, Explore, Studio et Missions avec quota quotidien.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF8F1] dark:bg-[#1B292D] border border-[#FF790D]/40">
                    <p className="font-display font-bold text-sm text-[#14282D] dark:text-white">
                      Aura Plus
                    </p>
                    <p className="font-display font-extrabold text-2xl text-[#FF790D] mt-1">
                      15 € <span className="text-xs font-normal text-[#77817F]">/ mois</span>
                    </p>
                    <p className="text-xs mt-2">
                      Quotas étendus (1 000 requêtes/jour), modèles avancés et projets illimités.
                    </p>
                  </div>
                </div>
              )}
              {legalSheet === 'apropos' && (
                <p>
                  Aura est votre assistant IA polyvalent conçu pour transformer chaque idée en
                  résultat concret : conversation intelligente, recherche web vérifiée, création
                  dans Aura Studio et suivi de missions.
                </p>
              )}
              {legalSheet === 'conditions' && (
                <p>
                  Vous conservez l’entière propriété intellectuelle des textes, du code et des
                  livrables générés avec Aura. L’accès gratuit inclut un quota quotidien renouvelé
                  automatiquement.
                </p>
              )}
              {legalSheet === 'confidentialite' && (
                <p>
                  Vos conversations, projets et créations restent privés dans votre espace de
                  travail. Les clés API des modèles sont protégées exclusivement côté serveur.
                </p>
              )}
              {legalSheet === 'support' && (
                <p>
                  Notre équipe est disponible pour vous accompagner :{' '}
                  <strong className="text-[#14282D] dark:text-white">support@aura.ai</strong>
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLegalSheet(null)}
                className="px-4 py-2 rounded-full border border-[#EAE5D8] text-xs font-medium text-[#77817F]"
              >
                Fermer
              </button>
              <Link
                to="/app"
                onClick={() => setLegalSheet(null)}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#FF790D] to-[#FFA428] text-xs font-semibold text-white"
              >
                Essayer Aura gratuitement
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
