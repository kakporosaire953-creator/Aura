import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { AuraMode } from '../../shared/types';
import { usePrefersReducedMotion, useScrollReveal } from './useScrollReveal';

interface LivingModesSectionProps {
  onLaunchModeWithPrompt: (mode: AuraMode, promptText: string) => void;
}

/**
 * ANIMATION 03 (LIVING MODES) + ANIMATION 04 (RESEARCH FLOW)
 * Conserve la section #demonstrations existante et l'enrichit avec :
 * - Chat : révélation progressive de la réponse
 * - Recherche : séquence Question -> Résultats -> Sources (Exemples) -> Synthèse
 * - Code : coloration syntaxique propre + bascule Aperçu / Code
 * - Créer : composition créative propriétaire utilisant le symbole Aura et sa palette
 */
export const LivingModesSection: React.FC<LivingModesSectionProps> = ({
  onLaunchModeWithPrompt,
}) => {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLDivElement>(0.15);
  const reducedMotion = usePrefersReducedMotion();

  // --- 1. État de la carte Chat (2 étapes : question puis réponse structurée) ---
  const [chatStep, setChatStep] = useState<1 | 2>(reducedMotion ? 2 : 1);

  // --- 2. État de la carte Recherche (Animation 04 — Research Flow : 1. Question -> 2. Résultats -> 3. Sources -> 4. Synthèse) ---
  const [researchStep, setResearchStep] = useState<1 | 2 | 3 | 4>(reducedMotion ? 4 : 1);

  // --- 3. État de la carte Code (Lignes révélées + bascule Aperçu/Code) ---
  const [codeLinesVisible, setCodeLinesVisible] = useState<number>(reducedMotion ? 6 : 2);
  const [showCodePreview, setShowCodePreview] = useState<boolean>(false);

  // --- 4. État de la carte Créer (Bascule Affiche de marque / Système chromatique Aura) ---
  const [creativeVariant, setCreativeVariant] = useState<'poster' | 'system'>('poster');

  const timersRef = useRef<number[]>([]);
  const hasPlayedInitialRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  const runInitialGentleSequence = useCallback(() => {
    clearTimers();
    if (reducedMotion) {
      setChatStep(2);
      setResearchStep(4);
      setCodeLinesVisible(6);
      return;
    }

    // Décalage séquentiel entre les cartes pour ne jamais lancer 4 animations lourdes simultanément
    setChatStep(1);
    setResearchStep(1);
    setCodeLinesVisible(2);

    // 1. Chat révèle sa réponse
    schedule(() => setChatStep(2), 450);

    // 2. Research Flow (Question -> Résultats -> Sources -> Synthèse)
    schedule(() => setResearchStep(2), 850);
    schedule(() => setResearchStep(3), 1450);
    schedule(() => setResearchStep(4), 2050);

    // 3. Code révèle ses lignes finales
    schedule(() => setCodeLinesVisible(4), 1200);
    schedule(() => setCodeLinesVisible(6), 1750);
  }, [clearTimers, reducedMotion, schedule]);

  const replayResearchFlow = () => {
    clearTimers();
    if (reducedMotion) {
      setResearchStep(4);
      return;
    }
    setResearchStep(1);
    schedule(() => setResearchStep(2), 420);
    schedule(() => setResearchStep(3), 980);
    schedule(() => setResearchStep(4), 1550);
  };

  useEffect(() => {
    if (isVisible && !hasPlayedInitialRef.current) {
      hasPlayedInitialRef.current = true;
      runInitialGentleSequence();
    }
  }, [isVisible, runInitialGentleSequence]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <section
      id="demonstrations"
      ref={sectionRef}
      className="py-16 sm:py-24 border-t border-[#E8E6DE]/80 dark:border-[#243337]"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Colonne éditoriale d'introduction (Conserve exactement le texte validé) */}
          <div
            className={`xl:col-span-3 space-y-4 text-center xl:text-left aura-reveal ${
              isVisible ? 'is-visible' : ''
            }`}
          >
            <div className="inline-flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-[#078348] dark:text-[#8CCB4A]">
              <span className="w-6 h-[1.5px] bg-[#078348]" />
              <span>Démonstrations</span>
              <span className="w-6 h-[1.5px] bg-[#078348]" />
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight text-[#14282D] dark:text-[#F3F2EC]">
              Tout ce qu’il te faut,
              <br />
              <span className="text-[#078348] dark:text-[#8CCB4A]">au même </span>
              <span className="text-[#FF790D]">endroit.</span>
            </h2>

            <p className="text-sm sm:text-[15px] text-[#77817F] leading-relaxed max-w-md mx-auto xl:mx-0">
              Pose une question, génère du code, analyse un document ou crée un projet. Tout est
              là, dans une seule interface.
            </p>

            <div className="pt-2">
              <Link
                to="/app/explore"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#078348] dark:text-[#8CCB4A] hover:underline"
              >
                <span>Explorer tous les modèles de tâches</span>
                <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
          </div>

          {/* Grille des 4 Modes Vivants */}
          <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* ===============================================================
                CARTE 1 : CHAT (Échange court + révélation fluide)
            =============================================================== */}
            <div
              className={`aura-living-card aura-reveal aura-reveal-delay-1 ${
                isVisible ? 'is-visible' : ''
              } rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between shadow-[0_6px_24px_rgba(20,40,45,0.03)]`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#078348] text-white flex items-center justify-center shrink-0">
                      <i className="fa-regular fa-comment-dots text-sm" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                      Chat
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setChatStep(1);
                      schedule(() => setChatStep(2), 380);
                    }}
                    aria-label="Rejouer l'animation du mode Chat"
                    className="w-7 h-7 rounded-full text-[#77817F] hover:text-[#078348] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] flex items-center justify-center transition-colors cursor-pointer"
                    title="Rejouer l’échange"
                  >
                    <i className="fa-solid fa-rotate-right text-[10px]" />
                  </button>
                </div>

                <p className="text-xs text-[#77817F] leading-relaxed mb-4">
                  Pose tes questions, obtiens des réponses claires et utiles.
                </p>
              </div>

              {/* Aperçu vivant Chat */}
              <div className="aura-living-preview rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] p-3 space-y-2.5 text-[11px] transition-colors">
                <div className="ml-auto max-w-[90%] rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] px-3 py-2 text-[#14282D] dark:text-[#F3F2EC] font-medium">
                  Peux-tu m’expliquer la différence entre React et Next.js ?
                </div>

                <div
                  className={`flex items-start gap-2 transition-all duration-400 ${
                    chatStep >= 2
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-40 translate-y-1'
                  }`}
                >
                  <AuraLogo size="xs" withWordmark={false} className="mt-0.5" />
                  <div className="rounded-xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-2.5 text-[#14282D]/90 dark:text-[#F3F2EC]/90 leading-snug space-y-1.5">
                    <p>
                      <strong>React</strong> construit l’interface en composants réactifs.
                    </p>
                    <p className="text-[10.5px] text-[#77817F]">
                      <strong>Next.js</strong> y ajoute le routage complet, le rendu serveur (SSR)
                      et l’optimisation SEO.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onLaunchModeWithPrompt(
                      'chat',
                      "Peux-tu m'expliquer la différence entre React et Next.js ?"
                    )
                  }
                  className="w-full pt-1 flex items-center justify-between px-2.5 py-1.5 rounded-full bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] text-[#77817F] hover:text-[#14282D] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span>Essayer en mode Chat...</span>
                  <span className="w-5 h-5 rounded-full bg-[#078348] text-white flex items-center justify-center">
                    <i className="fa-solid fa-arrow-right text-[9px]" />
                  </span>
                </button>
              </div>
            </div>

            {/* ===============================================================
                CARTE 2 : RECHERCHE (ANIMATION 04 — RESEARCH FLOW :
                Question -> Résultats -> Sources illustratives -> Synthèse)
            =============================================================== */}
            <div
              className={`aura-living-card aura-reveal aura-reveal-delay-2 ${
                isVisible ? 'is-visible' : ''
              } rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between shadow-[0_6px_24px_rgba(20,40,45,0.03)]`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-magnifying-glass text-sm" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                      Recherche
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={replayResearchFlow}
                    aria-label="Rejouer la séquence Research Flow"
                    className="w-7 h-7 rounded-full text-[#77817F] hover:text-[#078348] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] flex items-center justify-center transition-colors cursor-pointer"
                    title="Rejouer le parcours Recherche"
                  >
                    <i className="fa-solid fa-rotate-right text-[10px]" />
                  </button>
                </div>

                <p className="text-xs text-[#77817F] leading-relaxed mb-4">
                  Accède à des informations fiables avec un parcours clair de la question à la
                  synthèse.
                </p>
              </div>

              {/* Aperçu Research Flow : Question -> Résultats -> Sources -> Synthèse */}
              <div className="aura-living-preview rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] p-3 space-y-2 text-[11px] transition-colors">
                {/* 1. Question */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-full bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337]">
                  <span className="truncate font-medium text-[#14282D] dark:text-[#F3F2EC]">
                    Meilleures pratiques SEO en 2026
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#078348] text-white flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-magnifying-glass text-[9px]" />
                  </span>
                </div>

                {/* Indicateur d'étapes Question -> Résultats -> Sources -> Synthèse */}
                <div className="flex items-center justify-between px-1 text-[10px] text-[#77817F] border-b border-[#E8E6DE] dark:border-[#243337] pb-1.5">
                  <span
                    className={
                      researchStep >= 2 ? 'font-semibold text-[#078348] dark:text-[#8CCB4A]' : ''
                    }
                  >
                    1. Résultats
                  </span>
                  <span aria-hidden="true">→</span>
                  <span
                    className={
                      researchStep >= 3 ? 'font-semibold text-[#FF790D]' : ''
                    }
                  >
                    2. Sources
                  </span>
                  <span aria-hidden="true">→</span>
                  <span
                    className={
                      researchStep >= 4 ? 'font-semibold text-[#078348] dark:text-[#8CCB4A]' : ''
                    }
                  >
                    3. Synthèse
                  </span>
                </div>

                {/* 2 & 3. Résultats et Sources (clairement identifiées comme exemples illustratifs) */}
                <div className="space-y-1.5">
                  <div
                    className={`p-2 rounded-lg bg-[#FFFDF8] dark:bg-[#152023] border transition-all duration-300 ${
                      researchStep >= 3
                        ? 'border-[#078348]/45 dark:border-[#8CCB4A]/40'
                        : 'border-[#E8E6DE]/80 dark:border-[#243337]'
                    } ${
                      researchStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-35 translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-[#078348] dark:text-[#8CCB4A] truncate">
                        1. Core Web Vitals & Indexation
                      </p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] shrink-0">
                        Exemple source
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 rounded-lg bg-[#FFFDF8] dark:bg-[#152023] border transition-all duration-300 ${
                      researchStep >= 3
                        ? 'border-[#078348]/45 dark:border-[#8CCB4A]/40'
                        : 'border-[#E8E6DE]/80 dark:border-[#243337]'
                    } ${
                      researchStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-25 translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-[#078348] dark:text-[#8CCB4A] truncate">
                        2. Données structurées Schema.org
                      </p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] shrink-0">
                        Exemple source
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Synthèse finale */}
                <div
                  className={`p-2 rounded-lg bg-[#EAF1E8]/65 dark:bg-[#182E24]/70 border border-[#078348]/25 text-[10.5px] text-[#14282D] dark:text-[#F3F2EC] leading-snug transition-all duration-300 ${
                    researchStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-1'
                  }`}
                >
                  <strong className="text-[#078348] dark:text-[#8CCB4A]">Synthèse :</strong> Prioriser
                  la vitesse mobile (INP), le balisage sémantique et la fiabilité éditoriale.
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onLaunchModeWithPrompt(
                      'search',
                      'Quelles sont les meilleures pratiques SEO et performance web actuelles ?'
                    )
                  }
                  className="w-full flex items-center justify-between pt-0.5 text-[11px] font-medium text-[#078348] dark:text-[#8CCB4A] hover:underline cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <i className="fa-solid fa-magnifying-glass" />
                    <span>Tester en mode Recherche</span>
                  </span>
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </button>
              </div>
            </div>

            {/* ===============================================================
                CARTE 3 : CODE (Coloration syntaxique propre + bascule Aperçu)
            =============================================================== */}
            <div
              className={`aura-living-card aura-reveal aura-reveal-delay-3 ${
                isVisible ? 'is-visible' : ''
              } rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between shadow-[0_6px_24px_rgba(20,40,45,0.03)]`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#078348] text-white flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-code text-sm" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                      Code
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCodePreview((prev) => !prev)}
                    className="px-2.5 py-1 rounded-full bg-[#F4F2EA] dark:bg-[#1B292D] text-[10px] font-semibold text-[#14282D] dark:text-[#F3F2EC] hover:border-[#078348] transition-colors cursor-pointer"
                  >
                    {showCodePreview ? 'Voir Code' : 'Voir Rendu'}
                  </button>
                </div>

                <p className="text-xs text-[#77817F] leading-relaxed mb-4">
                  Génère, débogue et crée des projets web avec un aperçu en temps réel.
                </p>
              </div>

              {/* Panneau sombre élégant avec coloration syntaxique ou mini-rendu */}
              <div className="rounded-2xl bg-[#101B1E] text-[#E6ECEA] border border-[#223236] overflow-hidden text-[11px]">
                <div className="flex items-center justify-between px-3 py-2 bg-[#162428] border-b border-[#223236]">
                  <span className="font-mono text-[10px] text-[#8CCB4A]">index.html</span>
                  <button
                    type="button"
                    onClick={() => setShowCodePreview((prev) => !prev)}
                    className="text-[10px] text-[#94A09E] hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    <i className={`fa-regular ${showCodePreview ? 'fa-file-code' : 'fa-eye'}`} />
                    <span>{showCodePreview ? 'Code' : 'Aperçu'}</span>
                  </button>
                </div>

                {showCodePreview ? (
                  <div className="p-3.5 bg-[#FBFAF5] text-[#14282D] space-y-2 min-h-[146px] flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#EAF1E8] text-[#078348] text-[9px] font-bold uppercase">
                        Aperçu direct HTML
                      </span>
                      <h4 className="font-display font-bold text-sm mt-1.5 text-[#14282D]">
                        Aura Studio
                      </h4>
                      <p className="text-[11px] text-[#77817F]">
                        Construis plus loin avec un rendu instantané.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#078348]">
                      <i className="fa-solid fa-circle-check" />
                      <span>Composant interactif validé</span>
                    </span>
                  </div>
                ) : (
                  <div className="p-3 font-mono text-[10px] leading-relaxed space-y-1 min-h-[146px]">
                    <div className="text-[#7CC5F8]">
                      &lt;!DOCTYPE <span className="text-[#EACB37]">html</span>&gt;
                    </div>
                    <div className="text-[#7CC5F8]">
                      &lt;header <span className="text-[#8CCB4A]">class</span>=
                      <span className="text-[#FF9E5E]">&quot;aura-card&quot;</span>&gt;
                    </div>
                    <div
                      className={`pl-3 transition-opacity duration-300 ${
                        codeLinesVisible >= 3 ? 'opacity-100' : 'opacity-25'
                      }`}
                    >
                      &lt;h1&gt;<span className="text-white font-semibold">Aura Studio</span>
                      &lt;/h1&gt;
                    </div>
                    <div
                      className={`pl-3 transition-opacity duration-300 ${
                        codeLinesVisible >= 4 ? 'opacity-100' : 'opacity-25'
                      }`}
                    >
                      &lt;p&gt;<span className="text-[#D4E2DF]">Construis plus loin.</span>&lt;/p&gt;
                    </div>
                    <div
                      className={`pl-3 transition-opacity duration-300 ${
                        codeLinesVisible >= 5 ? 'opacity-100' : 'opacity-25'
                      }`}
                    >
                      &lt;button <span className="text-[#8CCB4A]">class</span>=
                      <span className="text-[#EACB37]">&quot;cta&quot;</span>&gt;Explorer&lt;/button&gt;
                    </div>
                    <div
                      className={`text-[#7CC5F8] transition-opacity duration-300 ${
                        codeLinesVisible >= 6 ? 'opacity-100' : 'opacity-25'
                      }`}
                    >
                      &lt;/header&gt;
                    </div>
                  </div>
                )}

                <div className="px-3 py-2 bg-[#162428] border-t border-[#223236] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onLaunchModeWithPrompt(
                        'code',
                        'Crée une landing page moderne complète en HTML/CSS avec aperçu interactif pour une startup.'
                      )
                    }
                    className="text-[11px] font-medium text-[#8CCB4A] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-play text-[9px]" />
                    <span>Exécuter dans l’éditeur</span>
                  </button>
                  <i className="fa-solid fa-up-right-from-square text-[10px] text-[#94A09E]" />
                </div>
              </div>
            </div>

            {/* ===============================================================
                CARTE 4 : CRÉER (Composition visuelle propriétaire avec le
                symbole officiel Aura et les couleurs de marque — sans banque d'images)
            =============================================================== */}
            <div
              className={`aura-living-card aura-reveal aura-reveal-delay-4 ${
                isVisible ? 'is-visible' : ''
              } rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-5 flex flex-col justify-between shadow-[0_6px_24px_rgba(20,40,45,0.03)]`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#FF790D] text-white flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-wand-magic-sparkles text-sm" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                      Créer
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCreativeVariant((v) => (v === 'poster' ? 'system' : 'poster'))
                    }
                    className="px-2.5 py-1 rounded-full bg-[#F4F2EA] dark:bg-[#1B292D] text-[10px] font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-colors cursor-pointer"
                  >
                    {creativeVariant === 'poster' ? 'Voir Charte' : 'Voir Affiche'}
                  </button>
                </div>

                <p className="text-xs text-[#77817F] leading-relaxed mb-4">
                  Imagine des contenus, des concepts de marque et des directions artistiques.
                </p>
              </div>

              {/* Démonstration de création propriétaire avec le symbole Aura et sa palette */}
              <div className="space-y-2.5">
                {creativeVariant === 'poster' ? (
                  <div
                    className="relative rounded-2xl overflow-hidden h-36 border border-[#E8E6DE] dark:border-[#243337] p-3.5 flex flex-col justify-between"
                    style={{
                      background:
                        'radial-gradient(circle at 82% 28%, rgba(255, 121, 13, 0.24) 0%, rgba(234, 203, 55, 0.22) 38%, rgba(7, 131, 72, 0.16) 72%, #FBFAF5 100%)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#078348] bg-white/85 px-2.5 py-0.5 rounded-full border border-[#E8E6DE]">
                        <span>Aura Studio</span>
                      </span>
                      <AuraLogo size="sm" variant="symbol" glow="subtle" />
                    </div>

                    <div>
                      <p className="font-display font-extrabold text-base leading-tight text-[#14282D]">
                        Des idées
                        <br />
                        <span className="aura-text-gradient">en projets.</span>
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onLaunchModeWithPrompt(
                            'create',
                            'Aide-moi à concevoir une campagne créative complète (concept, storytelling et direction visuelle).'
                          )
                        }
                        className="mt-2 px-3 py-1 rounded-full bg-[#14282D] text-white text-[10px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Découvrir</span>
                        <i className="fa-solid fa-arrow-right text-[8px]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl h-36 bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] p-3.5 flex flex-col justify-between text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs text-[#14282D] dark:text-[#F3F2EC]">
                        Identité & Système Aura
                      </span>
                      <AuraLogo size="xs" variant="symbol" />
                    </div>
                    <p className="text-[10.5px] text-[#77817F] leading-snug">
                      Typographie <strong>Manrope</strong> + gamme solaire vert émeraude, jaune doré
                      et orange.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#77817F]">
                        #078348 → #FF790D
                      </span>
                      <span className="text-[10px] font-semibold text-[#078348]">Prêt à exporter</span>
                    </div>
                  </div>
                )}

                {/* 3 vignettes de système de marque Aura (sans banque d'images générique) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreativeVariant('poster')}
                    className="h-14 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348]/50 p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Symbole & Identité"
                  >
                    <AuraLogo size="xs" variant="symbol" />
                    <span className="text-[9px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Symbole
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreativeVariant('system')}
                    className="h-14 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348]/50 p-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    title="Palette chromatique Aura"
                  >
                    <div className="flex items-center -space-x-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#078348] border border-white" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#8CCB4A] border border-white" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#EACB37] border border-white" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FF790D] border border-white" />
                    </div>
                    <span className="text-[9px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Palette
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onLaunchModeWithPrompt(
                        'create',
                        'Conçois l’identité éditoriale et le plan de lancement d’une marque africaine contemporaine.'
                      )
                    }
                    className="h-14 rounded-xl bg-[#EAF1E8]/70 dark:bg-[#182E24] border border-[#078348]/25 hover:border-[#078348] p-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Créer un brief dans Aura"
                  >
                    <i className="fa-solid fa-compass-drafting text-xs text-[#078348] dark:text-[#8CCB4A]" />
                    <span className="text-[9px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                      Brief IA
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
