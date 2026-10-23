import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { useAuraMarketingMotion } from '../../components/landing/useAuraMarketingMotion';
import imgSculpture from '../../assets/images/aura_hero_sculpture_1791622844309.jpg';
import imgAbstract from '../../assets/images/create_preview_abstract_1791622857564.jpg';
import imgWorkspace from '../../assets/images/onboarding_step3_creator_1791685470170.jpg';
import imgLandscape from '../../assets/images/aura_showcase_landscape_1791622884265.jpg';
import imgFashion from '../../assets/images/yourbrand_fashion_model_1791684477799.jpg';

const MODULES = [
  {
    key: 'chat',
    to: '/features/chat',
    name: 'Aura Chat',
    tagline: 'Réfléchir à voix haute avec une IA qui comprend le contexte.',
    benefit: 'Conversations, analyse de documents, rédaction, code et synthèses — avec historique persistant et modèles configurés uniquement.',
    icon: 'fa-regular fa-comments',
    accent: '#078348',
    surface: 'from-[#EAF1E8] to-[#EEF5E4]',
    image: imgWorkspace,
    imageAlt: 'Créateur travaillant avec Aura sur son ordinateur portable',
  },
  {
    key: 'explore',
    to: '/features/explore',
    name: 'Aura Explore',
    tagline: 'Rechercher avec des sources réelles, jamais inventées.',
    benefit: 'Investigations structurées, liste de sources vérifiées avec liens vers les pages d’origine, export et sauvegarde dans vos projets.',
    icon: 'fa-solid fa-magnifying-glass-chart',
    accent: '#EACB37',
    surface: 'from-[#FBF3D9] to-[#F7EFD8]',
    image: imgLandscape,
    imageAlt: 'Paysage de montagne au coucher du soleil, exemple de création Studio',
  },
  {
    key: 'studio',
    to: '/features/studio',
    name: 'Aura Studio',
    tagline: 'De l’idée à un vrai site web modifiable et exportable.',
    benefit: 'Génération de projets HTML/CSS/JS réels, aperçu immersif plein écran, Developer Mode avec fichiers éditables, versions et export ZIP.',
    icon: 'fa-solid fa-wand-magic-sparkles',
    accent: '#FF790D',
    surface: 'from-[#FCEBDD] to-[#F7E4CE]',
    image: imgFashion,
    imageAlt: 'Portrait de mode éditorial, exemple de site e-commerce créé avec Studio',
  },
  {
    key: 'projects',
    to: '/features/projects',
    name: 'Aura Projets & Missions',
    tagline: 'Organiser le travail qui compte.',
    benefit: 'Projets pour regrouper conversations, créations et recherches. Missions pour structurer vos objectifs en étapes suivies.',
    icon: 'fa-regular fa-folder-open',
    accent: '#39B969',
    surface: 'from-[#E4F2E8] to-[#EAF1E8]',
    image: imgAbstract,
    imageAlt: 'Rubans verts et orange en mouvement, métaphore du flux de travail',
  },
];

const JOURNEY = [
  { step: '1', title: 'Une idée.', desc: 'Tout commence par une intention, même floue.' },
  { step: '2', title: 'Une conversation.', desc: 'Aura clarifie, structure et propose.' },
  { step: '3', title: 'Une recherche ou une génération.', desc: 'Des sources vérifiées ou un premier jet concret.' },
  { step: '4', title: 'Une création modifiable.', desc: 'Chaque fichier reste accessible, éditable, versionné.' },
  { step: '5', title: 'Un résultat concret.', desc: 'Un site exportable, un rapport sourcé, un projet suivi.' },
];

export const FeaturesPage: React.FC = () => {
  const scope = useAuraMarketingMotion<HTMLDivElement>();

  return (
    <MarketingLayout>
      <div ref={scope}>
        {/* Hero éditorial — sculpture de marque + Aura Light */}
        <section className="relative overflow-hidden border-b border-[#E8E6DE]/70 dark:border-[#243337]">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#8CCB4A]/25 via-[#EACB37]/18 to-[#FF790D]/22 blur-3xl"
          />
          <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-4 pb-14 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <span
                data-hero-item
                className="inline-flex items-center gap-2 rounded-full border border-[#E8E6DE] bg-[#FFFDF8] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#77817F] dark:border-[#243337] dark:bg-[#152023]"
              >
                <i className="fa-solid fa-layer-group text-[#078348]" />
                Fonctionnalités
              </span>
              <h1
                data-hero-item
                className="mt-5 max-w-3xl font-display text-[38px] font-bold leading-[1.08] tracking-[-0.02em] text-[#14282D] sm:text-[52px] dark:text-[#F3F2EC]"
              >
                Quatre modules,{' '}
                <span className="aura-text-gradient">un seul espace de travail.</span>
              </h1>
              <p
                data-hero-item
                className="mt-5 max-w-2xl text-[15.5px] leading-[1.7] text-[#77817F]"
              >
                Chat, recherche, création et organisation partagent le même système de
                design, la même authentification et les mêmes quotas honnêtes. Vous ne
                sautez plus d’outil en outre : vous avancez d’une idée à un résultat.
              </p>
              <div data-hero-item className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="aura-btn-gradient rounded-full px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_32px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
                >
                  Commencer gratuitement
                </Link>
                <Link
                  to="/features/studio"
                  className="rounded-full border border-[#E8E6DE] px-6 py-2.5 text-[13px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Découvrir Aura Studio
                </Link>
              </div>
            </div>

            {/* Sculpture de marque animée */}
            <div data-hero-item className="relative mx-auto w-full max-w-[380px]">
              <div className="overflow-hidden rounded-[26px] border border-[#E8E6DE] bg-[#FFFDF8] shadow-[0_30px_70px_rgba(20,40,45,0.12)] dark:border-[#243337] dark:bg-[#152023]">
                <img
                  src={imgSculpture}
                  alt="Sculpture de rubans Aura, vert jaune orange"
                  className="h-[330px] w-full object-cover"
                  loading="eager"
                />
              </div>
              <div
                data-float
                className="absolute -left-5 bottom-6 rounded-[14px] border border-[#E8E6DE] bg-[#FFFDF8]/95 px-4 py-2.5 shadow-[0_12px_30px_rgba(20,40,45,0.1)] backdrop-blur dark:border-[#243337] dark:bg-[#152023]/95"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77817F]">
                  Promesse Aura
                </p>
                <p className="text-[12.5px] font-semibold text-[#078348]">
                  De l’idée au résultat.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modules — compositions alternées illustrées */}
        <section className="mx-auto max-w-[1160px] px-4 sm:px-8">
          {MODULES.map((m, idx) => (
            <div
              key={m.key}
              className={`grid items-center gap-8 border-b border-[#E8E6DE]/70 py-14 lg:grid-cols-2 lg:gap-16 dark:border-[#243337] ${
                idx % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div data-reveal>
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: `${m.accent}18`, color: m.accent }}
                >
                  <i className={`${m.icon} text-[17px]`} />
                </div>
                <h2 className="font-display text-[26px] font-bold leading-tight text-[#14282D] sm:text-[30px] dark:text-[#F3F2EC]">
                  {m.name}
                </h2>
                <p className="mt-2 text-[15px] font-medium leading-relaxed" style={{ color: m.accent }}>
                  {m.tagline}
                </p>
                <p className="mt-3 max-w-xl text-[14px] leading-[1.75] text-[#77817F]">{m.benefit}</p>
                <Link
                  to={m.to}
                  className="group mt-6 inline-flex items-center gap-2 rounded-full border border-[#E8E6DE] px-5 py-2.5 text-[12.5px] font-semibold text-[#14282D] transition-all hover:-translate-y-[2px] hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Découvrir {m.name}
                  <i className="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Visuel réel avec parallax et carte flottante */}
              <div data-reveal className={`relative overflow-hidden rounded-[22px] border border-[#E8E6DE] bg-gradient-to-br ${m.surface} dark:border-[#243337]`}>
                <div className="h-[300px] overflow-hidden sm:h-[340px]">
                  <img
                    src={m.image}
                    alt={m.imageAlt}
                    data-parallax
                    className="h-[112%] w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#14282D]/55 to-transparent p-5 pt-14">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold text-white shadow-[0_8px_22px_rgba(20,40,45,0.18)]"
                    style={{ backgroundColor: m.accent }}
                  >
                    <i className={m.icon} />
                    {m.name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Parcours narratif — bande visuelle + étapes échelonnées */}
        <section className="relative overflow-hidden bg-[#FFFDF8] py-16 dark:bg-[#152023]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] overflow-hidden opacity-[0.16] dark:opacity-[0.12]">
            <img
              src={imgAbstract}
              alt=""
              aria-hidden
              data-parallax
              className="h-[130%] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative mx-auto max-w-[1160px] px-4 sm:px-8">
            <h2
              data-reveal
              className="max-w-2xl font-display text-[28px] font-bold leading-tight text-[#14282D] sm:text-[34px] dark:text-[#F3F2EC]"
            >
              Le parcours Aura, de l’idée au résultat.
            </h2>
            <div data-stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {JOURNEY.map((j) => (
                <div key={j.step} className="group relative border-l-2 border-[#E8E6DE] pl-5 transition-colors duration-300 hover:border-[#8CCB4A] dark:border-[#243337]">
                  <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full bg-[#078348] text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(7,131,72,0.3)]">
                    {j.step}
                  </span>
                  <h3 className="text-[14.5px] font-bold text-[#14282D] dark:text-[#F3F2EC]">{j.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#77817F]">{j.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA avec Aura Light */}
        <section className="relative overflow-hidden py-16">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#8CCB4A]/16 via-[#EACB37]/12 to-[#FF790D]/16 blur-3xl"
          />
          <div className="relative mx-auto max-w-[1160px] px-4 text-center sm:px-8">
            <h2
              data-reveal
              className="font-display text-[26px] font-bold text-[#14282D] sm:text-[32px] dark:text-[#F3F2EC]"
            >
              Prêt à transformer une idée en résultat ?
            </h2>
            <div data-stagger className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="aura-btn-gradient rounded-full px-7 py-3 text-[13.5px] font-semibold text-white shadow-[0_12px_32px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
              >
                Commencer gratuitement
              </Link>
              <Link
                to="/pricing"
                className="rounded-full border border-[#E8E6DE] px-7 py-3 text-[13.5px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
              >
                Voir les offres
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};
