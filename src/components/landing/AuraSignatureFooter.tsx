import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuraLogo } from '../brand/AuraLogo';
import { useAura } from '../../context/AuraContext';
import { AuraMode } from '../../shared/types';
import { useScrollReveal, usePrefersReducedMotion } from './useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

type FooterInfoSheet = 'aide' | 'contact' | 'confidentialite' | 'conditions' | null;

export const AuraSignatureFooter: React.FC = () => {
  const { language, setLanguage, setActiveMode } = useAura();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollReveal<HTMLDivElement>(0.12);
  const { ref: footerRef, isVisible: footerVisible } = useScrollReveal<HTMLElement>(0.12);
  const ctaGlowRef = useRef<HTMLDivElement | null>(null);

  const [activeSheet, setActiveSheet] = useState<FooterInfoSheet>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (reducedMotion || !ctaRef.current || !ctaGlowRef.current) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.to(ctaGlowRef.current, {
        y: -16,
        ease: 'none',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, [reducedMotion, ctaRef]);

  const handleOpenMode = (mode: AuraMode) => {
    setActiveMode(mode);
    navigate(`/app?mode=${mode}`);
  };

  return (
    <>
      {/* =====================================================================
          CTA FINAL AVANT LE FOOTER (Section 9)
          « Tes idées méritent de prendre forme. »
      ===================================================================== */}
      <section
        ref={ctaRef}
        className="py-16 sm:py-24 border-t border-[#E8E6DE]/80 dark:border-[#243337] relative overflow-hidden"
      >
        <div className="max-w-[1080px] mx-auto px-4 sm:px-8">
          <div
            className={`aura-reveal ${
              ctaVisible ? 'is-visible' : ''
            } relative rounded-[32px] bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-[0_20px_50px_rgba(20,40,45,0.05)] overflow-hidden`}
          >
            {/* Lueur radiale subtile derrière le CTA final avec léger parallax décoratif */}
            <div
              ref={ctaGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full blur-3xl opacity-70"
              style={{
                background:
                  'radial-gradient(circle, rgba(140, 203, 74, 0.20) 0%, rgba(234, 203, 55, 0.16) 45%, rgba(255, 121, 13, 0.12) 75%, transparent 100%)',
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <AuraLogo size="md" variant="symbol" glow="subtle" className="mb-4" />

              <h2 className="font-display font-extrabold text-3xl sm:text-[42px] leading-tight tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
                Tes idées méritent de{' '}
                <span className="aura-text-gradient">prendre forme.</span>
              </h2>

              <p className="mt-3.5 text-base sm:text-lg text-[#77817F] dark:text-[#94A09E] max-w-xl">
                Réfléchis, recherche, construis et crée dans un seul espace.
              </p>

              <div className="mt-8">
                <Link
                  to="/app"
                  className="aura-btn-gradient px-8 py-4 rounded-full text-[15px] font-semibold text-white inline-flex items-center justify-center gap-2.5 shadow-sm whitespace-nowrap"
                >
                  <span>Commencer gratuitement</span>
                  <i className="fa-solid fa-arrow-right text-xs aura-cta-arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER PREMIUM — AURA SIGNATURE (Section 9)
      ===================================================================== */}
      <footer
        ref={footerRef}
        className={`mt-auto bg-[#FFFDF8] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] relative ${
          footerVisible ? 'aura-footer-curve-visible' : ''
        }`}
      >
        {/* Transition visuelle : Fine courbe SVG organique inspirée du flux d'énergie Aura */}
        <div
          aria-hidden="true"
          className="w-full overflow-hidden leading-none pointer-events-none select-none -mt-[1px]"
        >
          <svg
            viewBox="0 0 1440 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-7 sm:h-10"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="aura-footer-signature-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#E8E6DE" stopOpacity="0.35" />
                <stop offset="22%" stopColor="#078348" stopOpacity="0.65" />
                <stop offset="48%" stopColor="#8CCB4A" stopOpacity="0.75" />
                <stop offset="72%" stopColor="#EACB37" stopOpacity="0.75" />
                <stop offset="88%" stopColor="#FF790D" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#E8E6DE" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <path
              d="M0 32 C 320 6, 620 42, 960 16 C 1180 2, 1320 20, 1440 26"
              stroke="url(#aura-footer-signature-gradient)"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="aura-footer-curve-path"
            />
          </svg>
        </div>

        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 pt-12 pb-10">
          {/* Architecture du footer : Colonne Marque + 4 Colonnes de Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#E8E6DE] dark:border-[#243337]">
            {/* Colonne Marque (4 cols sur desktop) */}
            <div className="lg:col-span-4 space-y-4">
              <Link to="/" className="inline-block focus:outline-none">
                <AuraLogo size="md" withWordmark />
              </Link>
              <p className="text-sm text-[#77817F] dark:text-[#94A09E] max-w-xs leading-relaxed">
                Votre espace d’intelligence pour discuter, rechercher, coder et créer.
              </p>
            </div>

            {/* Colonne 1 : Produit */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#14282D] dark:text-[#F3F2EC]">
                Produit
              </h3>
              <ul className="space-y-2.5 text-sm text-[#77817F] dark:text-[#94A09E]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenMode('chat')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Discuter
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenMode('search')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Rechercher
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenMode('code')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Coder
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenMode('create')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Créer
                  </button>
                </li>
              </ul>
            </div>

            {/* Colonne 2 : Plateforme */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#14282D] dark:text-[#F3F2EC]">
                Plateforme
              </h3>
              <ul className="space-y-2.5 text-sm text-[#77817F] dark:text-[#94A09E]">
                <li>
                  <a
                    href="#demonstrations"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a
                    href="#tarifs"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Tarifs
                  </a>
                </li>
                <li>
                  <Link
                    to="/app/explore"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Explorer
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/projects"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Projets
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/library"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Bibliothèque
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Ressources */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#14282D] dark:text-[#F3F2EC]">
                Ressources
              </h3>
              <ul className="space-y-2.5 text-sm text-[#77817F] dark:text-[#94A09E]">
                <li>
                  <a
                    href="#prompt-to-product"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Démonstrations
                  </a>
                </li>
                <li>
                  <Link
                    to="/app/explore"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Cas d’usage
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveSheet('aide')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Aide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveSheet('contact')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Compte */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#14282D] dark:text-[#F3F2EC]">
                Compte
              </h3>
              <ul className="space-y-2.5 text-sm text-[#77817F] dark:text-[#94A09E]">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Se connecter
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors"
                  >
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveSheet('confidentialite')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Confidentialité
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveSheet('conditions')}
                    className="hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors cursor-pointer"
                  >
                    Conditions
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Barre inférieure du footer : Copyright + Langue FR / EN + Mentions */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77817F] dark:text-[#94A09E]">
            <div>© {currentYear} Aura. Tous droits réservés.</div>

            <div className="flex flex-wrap items-center justify-center gap-5">
              {/* Sélecteur de langue FR / EN */}
              <div className="inline-flex items-center gap-1.5 font-medium">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    language === 'fr'
                      ? 'text-[#078348] dark:text-[#8CCB4A] font-bold'
                      : 'hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
                  }`}
                >
                  FR
                </button>
                <span aria-hidden="true">/</span>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'text-[#078348] dark:text-[#8CCB4A] font-bold'
                      : 'hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
                  }`}
                >
                  EN
                </button>
              </div>

              <span aria-hidden="true">·</span>

              <button
                type="button"
                onClick={() => setActiveSheet('confidentialite')}
                className="hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors cursor-pointer"
              >
                Confidentialité
              </button>

              <span aria-hidden="true">·</span>

              <button
                type="button"
                onClick={() => setActiveSheet('conditions')}
                className="hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors cursor-pointer"
              >
                Conditions d’utilisation
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Fiche d'information sobre pour Aide / Contact / Confidentialité / Conditions */}
      {activeSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14282D]/50 backdrop-blur-xs"
          onClick={() => setActiveSheet(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-3xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 sm:p-8 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AuraLogo size="sm" variant="symbol" />
                <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                  {activeSheet === 'aide' && 'Centre d’aide Aura'}
                  {activeSheet === 'contact' && 'Contacter l’équipe Aura'}
                  {activeSheet === 'confidentialite' && 'Politique de confidentialité'}
                  {activeSheet === 'conditions' && 'Conditions d’utilisation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] flex items-center justify-center text-[#77817F]"
                aria-label="Fermer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-[#77817F] dark:text-[#94A09E] space-y-3 leading-relaxed">
              {activeSheet === 'aide' && (
                <>
                  <p>
                    Aura réunit quatre modes complémentaires dans une seule interface :
                    <strong> Discuter</strong>, <strong>Rechercher</strong>,{' '}
                    <strong>Coder</strong> et <strong>Créer</strong>.
                  </p>
                  <p>
                    Vous pouvez basculer d’un mode à l’autre à tout moment depuis le
                    compositeur de messages ou organiser vos travaux par dossier dans
                    l’onglet <strong>Projets</strong>.
                  </p>
                </>
              )}
              {activeSheet === 'contact' && (
                <>
                  <p>
                    Une question sur l’intégration d’Aura pour votre équipe, votre
                    université ou votre studio ?
                  </p>
                  <p className="font-medium text-[#14282D] dark:text-[#F3F2EC]">
                    contact@aura-studio.africa · Cotonou · Dakar · Paris
                  </p>
                </>
              )}
              {activeSheet === 'confidentialite' && (
                <>
                  <p>
                    Vos conversations, projets et éléments sauvegardés dans la
                    Bibliothèque restent privés dans votre espace de travail.
                  </p>
                  <p>
                    Toutes les clés API des fournisseurs d’intelligence artificielle
                    sont exécutées exclusivement côté serveur.
                  </p>
                </>
              )}
              {activeSheet === 'conditions' && (
                <>
                  <p>
                    L’accès gratuit inclut un quota quotidien renouvelé automatiquement
                    chaque jour afin de garantir une expérience rapide et équitable.
                  </p>
                  <p>
                    Vous conservez l’entière propriété intellectuelle du code, des textes
                    et des concepts créés avec Aura.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="px-5 py-2 rounded-full bg-[#14282D] dark:bg-[#F3F2EC] text-[#FBFAF5] dark:text-[#14282D] text-xs font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
