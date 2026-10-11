import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import creatorImg from '../assets/images/onboarding_step3_creator_1791685470170.jpg';
import miniLandscapeImg from '../assets/images/create_preview_nature_1791622867676.jpg';

type GoalId =
  | 'developpement'
  | 'apprentissage'
  | 'entrepreneuriat'
  | 'creation'
  | 'recherche'
  | 'polyvalent';

type ExperienceLevel = 'debutant' | 'autonome' | 'avance';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAura();

  // Active step for mobile/tablet wizard & desktop focus
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 state: matches exact default checked items in mockup (Développement, Entrepreneuriat, Usage polyvalent)
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([
    'developpement',
    'entrepreneuriat',
    'polyvalent',
  ]);

  // Step 2 state: matches exact default selected item in mockup (Débutant)
  const [experience, setExperience] = useState<ExperienceLevel>('debutant');

  // Step 3 state: matches exact default values in mockup (Français, Bénin)
  const [language, setLanguage] = useState('Français');
  const [country, setCountry] = useState('Bénin');

  const toggleGoal = (id: GoalId) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinishOnboarding = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await completeOnboarding({
        goals: selectedGoals,
        experienceLevel: experience,
        language,
        country,
      });
      navigate('/app', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const goalsList: {
    id: GoalId;
    title: string;
    subtitle: string;
    iconType: 'code' | 'grad' | 'rocket' | 'video' | 'search' | 'sparkles';
  }[] = [
    {
      id: 'developpement',
      title: 'Développement',
      subtitle: 'Coder, créer, construire',
      iconType: 'code',
    },
    {
      id: 'apprentissage',
      title: 'Apprentissage',
      subtitle: 'Apprendre, progresser',
      iconType: 'grad',
    },
    {
      id: 'entrepreneuriat',
      title: 'Entrepreneuriat',
      subtitle: 'Lancer, développer, innover',
      iconType: 'rocket',
    },
    {
      id: 'creation',
      title: 'Création de contenu',
      subtitle: 'Partager, inspirer, créer',
      iconType: 'video',
    },
    {
      id: 'recherche',
      title: 'Recherche / Analyse',
      subtitle: 'Explorer, comprendre',
      iconType: 'search',
    },
    {
      id: 'polyvalent',
      title: 'Usage polyvalent',
      subtitle: 'Tout simplement utile',
      iconType: 'sparkles',
    },
  ];

  const renderGoalIcon = (
    type: 'code' | 'grad' | 'rocket' | 'video' | 'search' | 'sparkles'
  ) => {
    switch (type) {
      case 'code':
        return (
          <div className="w-9 h-9 rounded-full bg-[#E3F2DE] text-[#1E7A36] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            &lt;/&gt;
          </div>
        );
      case 'grad':
        return (
          <div className="w-9 h-9 rounded-full bg-[#EFF2EE] text-[#1E3B2B] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-graduation-cap text-sm" />
          </div>
        );
      case 'rocket':
        return (
          <div className="w-9 h-9 rounded-full bg-[#E3F2DE] text-[#1E7A36] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-rocket text-sm" />
          </div>
        );
      case 'video':
        return (
          <div className="w-9 h-9 rounded-full bg-[#FFF0E0] text-[#EA580C] flex items-center justify-center shrink-0">
            <i className="fa-regular fa-square-caret-right text-sm" />
          </div>
        );
      case 'search':
        return (
          <div className="w-9 h-9 rounded-full bg-[#F5F2EB] text-[#14282D] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-magnifying-glass text-sm" />
          </div>
        );
      case 'sparkles':
        return (
          <div className="w-9 h-9 rounded-full bg-[#FEF6D8] text-[#EAB308] flex items-center justify-center shrink-0">
            <i className="fa-solid fa-wand-magic-sparkles text-sm" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative bg-[#F5F3EB] dark:bg-[#0D1517] text-[#14282D] dark:text-[#F3F2EC] flex flex-col justify-between py-6 sm:py-10 px-4 sm:px-6 xl:px-10 overflow-hidden select-none">
      {/* =====================================================================
          DECORATIVE CORNER RIBBONS (Exact match to Image 1 Corners)
      ===================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        {/* Top-Left Golden-Green Ribbon Wave */}
        <svg
          viewBox="0 0 420 260"
          fill="none"
          className="absolute -top-8 -left-10 w-[260px] sm:w-[380px] h-auto opacity-85 dark:opacity-35"
        >
          <defs>
            <linearGradient id="onb-tl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9BD662" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#F5C742" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F5F3EB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-20 220 C 60 150, 150 60, 290 -20 L -20 -20 Z"
            fill="url(#onb-tl-grad)"
          />
          <path
            d="M-10 185 C 65 130, 140 55, 220 -15"
            stroke="#F2A922"
            strokeWidth="1.5"
            strokeOpacity="0.55"
          />
        </svg>

        {/* Top-Right Vibrant Green-Gold Ribbon Wave */}
        <svg
          viewBox="0 0 420 280"
          fill="none"
          className="absolute -top-10 -right-10 w-[260px] sm:w-[390px] h-auto opacity-90 dark:opacity-35"
        >
          <defs>
            <linearGradient id="onb-tr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4CB648" stopOpacity="0.7" />
              <stop offset="55%" stopColor="#C7E04D" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FF981A" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d="M140 -20 C 230 50, 320 120, 440 190 L 440 -20 Z"
            fill="url(#onb-tr-grad)"
          />
          <path
            d="M115 -10 C 210 65, 305 140, 430 215"
            stroke="#8CCB4A"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
        </svg>

        {/* Bottom-Left Vibrant Green-Orange Ribbon Wave */}
        <svg
          viewBox="0 0 460 320"
          fill="none"
          className="absolute -bottom-12 -left-12 w-[280px] sm:w-[420px] h-auto opacity-95 dark:opacity-35"
        >
          <defs>
            <linearGradient id="onb-bl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4CB648" stopOpacity="0.72" />
              <stop offset="50%" stopColor="#EBC034" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#FF790D" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <path
            d="M-30 70 C 60 160, 160 250, 310 340 L -30 340 Z"
            fill="url(#onb-bl-grad)"
          />
          <path
            d="M-20 40 C 70 135, 175 235, 335 330"
            stroke="#5BB949"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        </svg>

        {/* Bottom-Right Subtle Golden-Green Ribbon Wave */}
        <svg
          viewBox="0 0 500 260"
          fill="none"
          className="absolute -bottom-10 right-[8%] w-[320px] sm:w-[480px] h-auto opacity-85 dark:opacity-35"
        >
          <defs>
            <linearGradient id="onb-br-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5BB949" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#F3C130" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FF851B" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M40 160 C 120 200, 210 245, 340 270 L 60 270 Z"
            fill="url(#onb-br-grad)"
          />
          <path
            d="M280 265 C 350 225, 420 190, 510 170"
            stroke="#F3B32A"
            strokeWidth="1.5"
            strokeOpacity="0.55"
          />
        </svg>
      </div>

      {/* =====================================================================
          MOBILE / TABLET STEP SELECTOR PILLS (<lg)
      ===================================================================== */}
      <div className="lg:hidden relative z-20 max-w-[440px] w-full mx-auto mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          {([1, 2, 3] as const).map((stepNumber) => (
            <button
              key={stepNumber}
              type="button"
              onClick={() => setActiveStep(stepNumber)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeStep === stepNumber
                  ? 'bg-[#2E8B47] text-white shadow-xs'
                  : 'bg-[#FFFDF9]/80 text-[#5C6664] border border-[#E6E2D6]'
              }`}
            >
              Étape {stepNumber}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleFinishOnboarding}
          className="text-xs font-semibold text-[#5C6664] hover:text-[#14282D] cursor-pointer"
        >
          Accéder au dashboard →
        </button>
      </div>

      {/* =====================================================================
          MAIN 3-CARD ONBOARDING PRESENTATION & INTERACTIVE FLOW
          - Desktop (lg+): Displays all 3 step cards side-by-side exactly as in Image 1
          - Mobile (<lg): Displays the active step card with full wizard navigation
      ===================================================================== */}
      <div className="relative z-10 my-auto max-w-[1320px] w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
        {/* ===================================================================
            CARD 1: ÉTAPE 1 — "Que veux-tu accomplir avec Aura ?"
        =================================================================== */}
        <div
          onClick={() => setActiveStep(1)}
          className={`${
            activeStep === 1 ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between rounded-[28px] bg-[#FAF8F2] dark:bg-[#141F22] border transition-all p-6 sm:p-7 xl:p-8 shadow-[0_20px_50px_rgba(20,40,45,0.06)] min-h-[690px] ${
            activeStep === 1
              ? 'border-[#DCE8CC] dark:border-[#2A4A39] ring-1 ring-[#8CCB4A]/25'
              : 'border-[#EAE6DA] dark:border-[#223135]'
          }`}
        >
          {/* Top Section */}
          <div>
            {/* Card Header: Aura Logo + 1/3 Progress */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <Link to="/" className="focus:outline-none">
                <AuraLogo size="sm" withWordmark />
              </Link>

              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-[#5A6562] dark:text-[#94A09E] mb-1.5">
                  1 / 3
                </span>
                <div className="w-20 h-1 rounded-full bg-[#E6E2D5] dark:bg-[#243337] overflow-hidden flex">
                  <div className="w-1/3 h-full bg-[#479E44] rounded-full" />
                </div>
              </div>
            </div>

            {/* Badge "Étape 1" */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#E3F1DC] dark:bg-[#1B3326] text-[#1D6832] dark:text-[#8CCB4A] text-xs font-bold mb-3.5">
              Étape 1
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-[27px] sm:text-[30px] leading-[1.14] tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
              <span className="block">Que veux-tu accomplir</span>
              <span className="block mt-0.5">
                avec{' '}
                <span className="bg-gradient-to-r from-[#5BB949] via-[#E5AA24] to-[#FF790D] bg-clip-text text-transparent">
                  Aura ?
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-[13px] leading-relaxed text-[#626C6A] dark:text-[#94A09E]">
              Choisis une ou plusieurs options qui te ressemblent.
              <br className="hidden sm:inline" /> Cela nous aidera à mieux personnaliser ton
              espace.
            </p>

            {/* 2x3 Grid of 6 Goal Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goalsList.map((goal) => {
                const isChecked = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStep(1);
                      toggleGoal(goal.id);
                    }}
                    className={`relative rounded-[18px] p-3.5 text-left transition-all flex items-center gap-3 border cursor-pointer ${
                      isChecked
                        ? 'bg-[#F2F8EE] dark:bg-[#182E24]/80 border-[#7CC66B] dark:border-[#4CB648] shadow-[0_4px_14px_rgba(76,182,72,0.08)]'
                        : 'bg-[#FDFCF7] dark:bg-[#182529] hover:bg-[#F7F5EC] border-[#EAE5D8] dark:border-[#243337]'
                    }`}
                  >
                    {/* Top-right Check Circle */}
                    <span
                      className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-[#2E8B47] text-white'
                          : 'border border-[#DCD7C8] dark:border-[#34464B] bg-transparent'
                      }`}
                    >
                      {isChecked && <i className="fa-solid fa-check text-[8px]" />}
                    </span>

                    {renderGoalIcon(goal.iconType)}

                    <div className="pr-3 min-w-0">
                      <p className="font-display font-bold text-[12.5px] text-[#14282D] dark:text-[#F3F2EC] truncate">
                        {goal.title}
                      </p>
                      <p className="text-[10.5px] text-[#6E7775] dark:text-[#94A09E] truncate mt-0.5">
                        {goal.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Handwritten Note + Footer Actions */}
          <div className="mt-6 pt-2 flex flex-col justify-between gap-4">
            {/* Handwritten Note: "Ton potentiel commence ici." */}
            <div className="pl-2">
              <div className="-rotate-6 inline-block">
                <p
                  className="text-[16px] leading-tight text-[#3E5E4B] dark:text-[#8CCB4A]"
                  style={{ fontFamily: 'cursive, "Comic Sans MS", sans-serif', fontStyle: 'italic' }}
                >
                  Ton potentiel
                  <br />
                  commence ici.
                </p>
                <svg viewBox="0 0 90 12" fill="none" className="w-20 h-3 mt-0.5">
                  <path
                    d="M4 9 C 30 5, 60 3, 86 2"
                    stroke="#FF851B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Buttons: Passer + Suivant -> */}
            <div className="flex items-center justify-end gap-5 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(2);
                }}
                className="text-xs font-semibold text-[#3D4A47] dark:text-[#94A09E] hover:text-[#14282D] cursor-pointer"
              >
                Passer
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(2);
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF8216] to-[#FFA12C] hover:brightness-105 text-white text-xs sm:text-[13px] font-semibold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(255,121,13,0.3)] transition-all cursor-pointer"
              >
                <span>Suivant</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CARD 2: ÉTAPE 2 — "Quel est ton niveau d'expérience ?"
        =================================================================== */}
        <div
          onClick={() => setActiveStep(2)}
          className={`${
            activeStep === 2 ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between rounded-[28px] bg-[#FAF8F2] dark:bg-[#141F22] border transition-all p-6 sm:p-7 xl:p-8 shadow-[0_20px_50px_rgba(20,40,45,0.06)] min-h-[690px] ${
            activeStep === 2
              ? 'border-[#DCE8CC] dark:border-[#2A4A39] ring-1 ring-[#8CCB4A]/25'
              : 'border-[#EAE6DA] dark:border-[#223135]'
          }`}
        >
          {/* Top Section */}
          <div>
            {/* Card Header: Aura Logo + 2/3 Progress */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <Link to="/" className="focus:outline-none">
                <AuraLogo size="sm" withWordmark />
              </Link>

              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-[#5A6562] dark:text-[#94A09E] mb-1.5">
                  2 / 3
                </span>
                <div className="w-20 h-1 rounded-full bg-[#E6E2D5] dark:bg-[#243337] overflow-hidden flex">
                  <div className="w-1/3 h-full bg-[#2E8B47]" />
                  <div className="w-1/3 h-full bg-[#9CD66C]" />
                </div>
              </div>
            </div>

            {/* Badge "Étape 2" */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#E3F1DC] dark:bg-[#1B3326] text-[#1D6832] dark:text-[#8CCB4A] text-xs font-bold mb-3.5">
              Étape 2
            </div>

            {/* Title */}
            <h2 className="font-display font-extrabold text-[27px] sm:text-[30px] leading-[1.14] tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
              <span className="block">Quel est ton niveau</span>
              <span className="block mt-0.5">
                d’
                <span className="bg-gradient-to-r from-[#4CB648] via-[#DFB224] to-[#FF790D] bg-clip-text text-transparent">
                  expérience
                </span>{' '}
                ?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-[13px] leading-relaxed text-[#626C6A] dark:text-[#94A09E]">
              Cette information nous permet d’adapter
              <br className="hidden sm:inline" /> nos réponses à ton niveau et à tes besoins.
            </p>

            {/* 3 Vertical Experience Radio Cards */}
            <div className="mt-6 space-y-3">
              {/* Option 1: Débutant */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(2);
                  setExperience('debutant');
                }}
                className={`relative w-full rounded-[20px] p-4 text-left transition-all flex items-center gap-3.5 border cursor-pointer ${
                  experience === 'debutant'
                    ? 'bg-[#F2F8EE] dark:bg-[#182E24]/80 border-[#68B858] shadow-[0_6px_18px_rgba(76,182,72,0.08)]'
                    : 'bg-[#FDFCF7] dark:bg-[#182529] hover:bg-[#F7F5EC] border-[#EAE5D8] dark:border-[#243337]'
                }`}
              >
                {/* Left Radio Indicator */}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    experience === 'debutant'
                      ? 'bg-[#2E8B47]'
                      : 'border border-[#B8B4A6] bg-transparent'
                  }`}
                >
                  {experience === 'debutant' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>

                {/* Icon Circle: Seedling */}
                <div className="w-11 h-11 rounded-full bg-[#E5F2DF] dark:bg-[#1F3A2C] text-[#2E8B47] flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-seedling text-lg text-[#4CB648]" />
                </div>

                {/* Text */}
                <div className="pr-5">
                  <p className="font-display font-bold text-[14px] text-[#14282D] dark:text-[#F3F2EC]">
                    Débutant
                  </p>
                  <p className="text-[11.5px] text-[#6E7775] dark:text-[#94A09E] leading-snug mt-0.5">
                    Je découvre et je veux apprendre
                    <br />à mon rythme.
                  </p>
                </div>

                {/* Top-right Green Ring when selected */}
                {experience === 'debutant' && (
                  <span className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full border-2 border-[#68B858]" />
                )}
              </button>

              {/* Option 2: Autonome */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(2);
                  setExperience('autonome');
                }}
                className={`relative w-full rounded-[20px] p-4 text-left transition-all flex items-center gap-3.5 border cursor-pointer ${
                  experience === 'autonome'
                    ? 'bg-[#F2F8EE] dark:bg-[#182E24]/80 border-[#68B858] shadow-[0_6px_18px_rgba(76,182,72,0.08)]'
                    : 'bg-[#FDFCF7] dark:bg-[#182529] hover:bg-[#F7F5EC] border-[#EAE5D8] dark:border-[#243337]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    experience === 'autonome'
                      ? 'bg-[#2E8B47]'
                      : 'border border-[#B8B4A6] bg-transparent'
                  }`}
                >
                  {experience === 'autonome' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>

                <div className="w-11 h-11 rounded-full bg-[#F4F2EA] dark:bg-[#1F2D31] text-[#14282D] dark:text-[#8CCB4A] flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-laptop text-lg text-[#1E3B2B] dark:text-[#8CCB4A]" />
                </div>

                <div className="pr-5">
                  <p className="font-display font-bold text-[14px] text-[#14282D] dark:text-[#F3F2EC]">
                    Autonome
                  </p>
                  <p className="text-[11.5px] text-[#6E7775] dark:text-[#94A09E] leading-snug mt-0.5">
                    J’ai déjà des bases et je me débrouille seul(e).
                  </p>
                </div>

                {experience === 'autonome' && (
                  <span className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full border-2 border-[#68B858]" />
                )}
              </button>

              {/* Option 3: Avancé */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(2);
                  setExperience('avance');
                }}
                className={`relative w-full rounded-[20px] p-4 text-left transition-all flex items-center gap-3.5 border cursor-pointer ${
                  experience === 'avance'
                    ? 'bg-[#F2F8EE] dark:bg-[#182E24]/80 border-[#68B858] shadow-[0_6px_18px_rgba(76,182,72,0.08)]'
                    : 'bg-[#FDFCF7] dark:bg-[#182529] hover:bg-[#F7F5EC] border-[#EAE5D8] dark:border-[#243337]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    experience === 'avance'
                      ? 'bg-[#2E8B47]'
                      : 'border border-[#B8B4A6] bg-transparent'
                  }`}
                >
                  {experience === 'avance' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </span>

                <div className="w-11 h-11 rounded-full bg-[#FEF6DF] dark:bg-[#2B2618] text-[#F59E0B] flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-crown text-lg text-[#F59E0B]" />
                </div>

                <div className="pr-5">
                  <p className="font-display font-bold text-[14px] text-[#14282D] dark:text-[#F3F2EC]">
                    Avancé
                  </p>
                  <p className="text-[11.5px] text-[#6E7775] dark:text-[#94A09E] leading-snug mt-0.5">
                    J’ai une bonne expérience et je veux aller plus loin.
                  </p>
                </div>

                {experience === 'avance' && (
                  <span className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full border-2 border-[#68B858]" />
                )}
              </button>
            </div>

            {/* Centered "Passer cette étape ->" */}
            <div className="mt-4 pt-3 border-t border-[#EFECE2] dark:border-[#243337] text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(3);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] cursor-pointer"
              >
                <span>Passer cette étape</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          </div>

          {/* Bottom Section: Handwritten Note + Retour / Suivant */}
          <div className="mt-4 flex flex-col justify-between gap-3">
            {/* Handwritten Note: "Chaque niveau compte !" */}
            <div className="pl-2">
              <div className="-rotate-6 inline-block">
                <p
                  className="text-[15.5px] leading-tight text-[#3E5E4B] dark:text-[#8CCB4A]"
                  style={{ fontFamily: 'cursive, "Comic Sans MS", sans-serif', fontStyle: 'italic' }}
                >
                  Chaque niveau
                  <br />
                  compte !
                </p>
                <svg viewBox="0 0 84 12" fill="none" className="w-18 h-3 mt-0.5">
                  <path
                    d="M4 9 C 28 5, 56 3, 80 2"
                    stroke="#F5B82E"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Buttons: <- Retour + Suivant -> */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(1);
                }}
                className="px-5 py-2.5 rounded-full bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#EFECE2] border border-[#E2DDD0] dark:border-[#2B3D42] text-xs font-semibold text-[#3D4A47] dark:text-[#D0D8D6] inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left text-[10px]" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStep(3);
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF8216] to-[#FFA12C] hover:brightness-105 text-white text-xs sm:text-[13px] font-semibold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(255,121,13,0.3)] transition-all cursor-pointer"
              >
                <span>Suivant</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            CARD 3: ÉTAPE 3 — "Personnalisons ton espace."
        =================================================================== */}
        <div
          onClick={() => setActiveStep(3)}
          className={`${
            activeStep === 3 ? 'flex' : 'hidden lg:flex'
          } flex-col justify-between rounded-[28px] bg-[#FAF8F2] dark:bg-[#141F22] border transition-all p-6 sm:p-7 xl:p-8 shadow-[0_20px_50px_rgba(20,40,45,0.06)] min-h-[690px] ${
            activeStep === 3
              ? 'border-[#DCE8CC] dark:border-[#2A4A39] ring-1 ring-[#8CCB4A]/25'
              : 'border-[#EAE6DA] dark:border-[#223135]'
          }`}
        >
          {/* Top Section */}
          <div>
            {/* Card Header: Aura Logo + 3/3 Progress */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <Link to="/" className="focus:outline-none">
                <AuraLogo size="sm" withWordmark />
              </Link>

              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-[#5A6562] dark:text-[#94A09E] mb-1.5">
                  3 / 3
                </span>
                <div className="w-20 h-1 rounded-full bg-[#E6E2D5] dark:bg-[#243337] overflow-hidden flex">
                  <div className="w-2/3 h-full bg-[#2E8B47]" />
                  <div className="w-1/3 h-full bg-[#9CD66C]" />
                </div>
              </div>
            </div>

            {/* Badge "Étape 3" */}
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#E3F1DC] dark:bg-[#1B3326] text-[#1D6832] dark:text-[#8CCB4A] text-xs font-bold mb-3.5">
              Étape 3
            </div>

            {/* Title */}
            <h2 className="font-display font-extrabold text-[27px] sm:text-[30px] leading-[1.14] tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
              <span className="block">Personnalisons</span>
              <span className="block mt-0.5 bg-gradient-to-r from-[#389E41] via-[#C3C633] to-[#FF790D] bg-clip-text text-transparent">
                ton espace.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-3 text-[13px] leading-relaxed text-[#626C6A] dark:text-[#94A09E]">
              Quelques préférences pour une expérience encore
              <br className="hidden sm:inline" /> plus adaptée à toi.
            </p>

            {/* Dropdowns: Langue de préférence & Pays / Région */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Langue de préférence
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5552] dark:text-[#94A09E]">
                    <i className="fa-solid fa-globe text-xs" />
                  </span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full appearance-none rounded-2xl bg-[#FDFCF7] dark:bg-[#182529] border border-[#E5E0D2] dark:border-[#2B3D42] pl-9 pr-9 py-2.5 text-xs sm:text-[13px] font-medium text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#4CB648] cursor-pointer"
                  >
                    <option value="Français">Français</option>
                    <option value="English">English</option>
                    <option value="Español">Español</option>
                    <option value="Português">Português</option>
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6562]">
                    <i className="fa-solid fa-chevron-down text-[10px]" />
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                  Pays / Région{' '}
                  <span className="font-normal text-[#77817F]">(optionnel)</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5552] dark:text-[#94A09E]">
                    <i className="fa-solid fa-location-dot text-xs" />
                  </span>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full appearance-none rounded-2xl bg-[#FDFCF7] dark:bg-[#182529] border border-[#E5E0D2] dark:border-[#2B3D42] pl-9 pr-9 py-2.5 text-xs sm:text-[13px] font-medium text-[#14282D] dark:text-[#F3F2EC] focus:outline-none focus:border-[#4CB648] cursor-pointer"
                  >
                    <option value="Bénin">Bénin</option>
                    <option value="France">France</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Côte d’Ivoire">Côte d’Ivoire</option>
                    <option value="Togo">Togo</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Maroc">Maroc</option>
                    <option value="Canada">Canada</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6562]">
                    <i className="fa-solid fa-chevron-down text-[10px]" />
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 Creator Scene with Floating UI Cards (Exact match to Image 1 Card 3) */}
            <div className="relative mt-5 h-[225px] rounded-2xl overflow-hidden flex items-end justify-center">
              {/* Main Creator Image */}
              <img
                src={creatorImg}
                alt="Créateur Aura"
                referrerPolicy="no-referrer"
                className="w-[82%] h-[205px] object-cover object-top rounded-2xl shadow-xs"
              />

              {/* Top-Left Handwritten Note: "Prêt ? C'est parti !" + Arrow */}
              <div className="absolute top-1 left-2 z-20 flex items-center gap-1">
                <p
                  className="-rotate-8 text-[14px] leading-tight text-[#3E6B48] dark:text-[#8CCB4A] font-medium"
                  style={{ fontFamily: 'cursive, "Comic Sans MS", sans-serif', fontStyle: 'italic' }}
                >
                  Prêt ?
                  <br />
                  C’est parti !
                </p>
                <svg viewBox="0 0 36 28" fill="none" className="w-7 h-6 text-[#4A7853] mt-1">
                  <path
                    d="M2 6 C 14 4, 24 10, 30 22 M30 22 L 23 20 M30 22 L 32 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Left Floating Card: Aura Badge */}
              <div className="absolute left-1.5 bottom-12 z-20 rounded-xl bg-[#FFFDF9]/95 dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] px-3 py-2 shadow-md flex items-center gap-1.5">
                <AuraLogo size="xs" withWordmark />
              </div>

              {/* Top-Right Floating Mini Landscape Picture Card */}
              <div className="absolute top-1.5 right-2 z-20 rounded-xl bg-[#FFFDF9] p-1.5 border border-[#E6E2D6] shadow-md">
                <img
                  src={miniLandscapeImg}
                  alt="Aperçu visuel"
                  referrerPolicy="no-referrer"
                  className="w-14 h-9 rounded-lg object-cover"
                />
              </div>

              {/* Right Floating Checklist Card: Créer, Explorer, Apprendre, Réaliser */}
              <div className="absolute right-1 bottom-11 z-20 rounded-xl bg-[#FFFDF9]/95 dark:bg-[#152023] border border-[#E6E2D6] dark:border-[#243337] px-3 py-2 shadow-md space-y-1 text-[10px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4CB648]" />
                  <span>Créer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                  <span>Explorer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span>Apprendre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF790D]" />
                  <span>Réaliser</span>
                </div>
              </div>

              {/* Bottom-Right Mini Bar Chart Card */}
              <div className="absolute right-10 bottom-2 z-20 rounded-lg bg-[#FFFDF9] border border-[#E6E2D6] px-2 py-1.5 shadow-sm flex items-end gap-1">
                <span className="w-1.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                <span className="w-1.5 h-3.5 rounded-xs bg-[#A3E635]" />
                <span className="w-1.5 h-4 rounded-xs bg-[#4CB648]" />
              </div>
            </div>
          </div>

          {/* Bottom Buttons: <- Retour + Terminer -> */}
          <div className="mt-4 flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveStep(2);
              }}
              className="px-5 py-2.5 rounded-full bg-[#FAF8F2] dark:bg-[#1B292D] hover:bg-[#EFECE2] border border-[#E2DDD0] dark:border-[#2B3D42] text-xs font-semibold text-[#3D4A47] dark:text-[#D0D8D6] inline-flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-[10px]" />
              <span>Retour</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFinishOnboarding();
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF6B00] via-[#FF8216] to-[#FFA12C] hover:brightness-105 text-white text-xs sm:text-[13px] font-semibold inline-flex items-center gap-2 shadow-[0_8px_20px_rgba(255,121,13,0.3)] transition-all cursor-pointer"
            >
              <span>Terminer</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
