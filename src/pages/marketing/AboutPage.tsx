import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { useAuraMarketingMotion } from '../../components/landing/useAuraMarketingMotion';
import { AuraLogo } from '../../components/brand/AuraLogo';
import imgSculpture from '../../assets/images/aura_hero_sculpture_1791622844309.jpg';
import imgAbstract from '../../assets/images/create_preview_abstract_1791622857564.jpg';
import imgCreator from '../../assets/images/onboarding_step3_creator_1791685470170.jpg';
import imgFashion from '../../assets/images/yourbrand_fashion_model_1791684477799.jpg';

const VALUES = [
  {
    title: 'L’utilité avant le spectacle',
    desc: 'Chaque fonctionnalité doit faire un vrai travail : persister, calculer, générer ou organiser. Ce qui ne fonctionne pas est annoncé comme non configuré — jamais simulé.',
    icon: 'fa-solid fa-bullseye',
  },
  {
    title: 'Une identité chaleureuse',
    desc: 'L’ivoire chaud, le vert et les accents orange-jaune d’Aura créent un espace premium et humain, loin des dashboards génériques.',
    icon: 'fa-solid fa-palette',
  },
  {
    title: 'La maîtrise des coûts',
    desc: 'Chaque appel IA est réservé, comptabilisé et plafonné. Les quotas sont configurables et l’architecture protège la soutenabilité financière.',
    icon: 'fa-solid fa-scale-balanced',
  },
  {
    title: 'L’Afrique francophone d’abord',
    desc: 'Conçu pour les étudiants, créateurs et entrepreneurs d’Afrique francophone, avec une architecture et une localisation prêtes pour l’international.',
    icon: 'fa-solid fa-earth-africa',
  },
];

export const AboutPage: React.FC = () => {
  const scope = useAuraMarketingMotion<HTMLDivElement>();

  return (
    <MarketingLayout>
      <div ref={scope}>
        {/* Hero — identité de marque + sculpture */}
        <section className="relative overflow-hidden border-b border-[#E8E6DE]/70 dark:border-[#243337]">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute -left-20 top-6 h-[380px] w-[380px] rounded-full bg-gradient-to-br from-[#8CCB4A]/22 via-[#EACB37]/14 to-[#FF790D]/18 blur-3xl"
          />
          <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-4 pb-14 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <div data-hero-item className="flex items-center gap-4">
                <AuraLogo size="md" variant="symbol" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#078348]">
                    À propos d’Aura
                  </p>
                  <p className="mt-1 text-[13px] text-[#77817F]">De l’idée au résultat.</p>
                </div>
              </div>
              <h1
                data-hero-item
                className="mt-8 max-w-3xl font-display text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-[#14282D] sm:text-[50px] dark:text-[#F3F2EC]"
              >
                Un espace de travail IA conçu pour{' '}
                <span className="aura-text-gradient">vraiment produire.</span>
              </h1>
              <p data-hero-item className="mt-6 max-w-2xl text-[15.5px] leading-[1.75] text-[#77817F]">
                Aura réunit conversation, recherche, création et organisation dans une
                seule plateforme cohérente. Notre mission : aider les étudiants,
                développeurs, entrepreneurs et créateurs — en Afrique francophone et au-delà
                — à transformer leurs idées en réalisations concrètes qu’ils peuvent
                inspecter, améliorer, sauvegarder et utiliser.
              </p>
            </div>

            {/* Duo visuel : sculpture + portrait */}
            <div data-hero-item className="relative mx-auto w-full max-w-[400px]">
              <div className="overflow-hidden rounded-[24px] border border-[#E8E6DE] shadow-[0_28px_64px_rgba(20,40,45,0.14)] dark:border-[#243337]">
                <img
                  src={imgSculpture}
                  alt="Sculpture de rubans Aura"
                  className="h-[300px] w-full object-cover"
                  loading="eager"
                />
              </div>
              <div
                data-float
                className="absolute -bottom-8 -right-4 w-[168px] overflow-hidden rounded-[16px] border-[3px] border-[#FFFDF8] shadow-[0_16px_40px_rgba(20,40,45,0.16)] dark:border-[#152023]"
              >
                <img
                  src={imgFashion}
                  alt="Créateur de la communauté Aura"
                  className="h-[150px] w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bande manifeste */}
        <section data-reveal className="relative h-[200px] overflow-hidden sm:h-[240px]">
          <img
            src={imgAbstract}
            alt=""
            aria-hidden
            data-parallax
            className="h-[120%] w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#14282D]/55 via-[#14282D]/25 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex items-center">
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
              <p className="max-w-md font-display text-[19px] font-bold leading-snug text-white drop-shadow-[0_2px_12px_rgba(20,40,45,0.4)] sm:text-[24px]">
                « Les idées méritent de prendre forme — inspectables, améliorables,
                réellement utiles. »
              </p>
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="mx-auto max-w-[1160px] px-4 py-16 sm:px-8">
          <h2 data-reveal className="font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
            Ce qui guide le produit
          </h2>
          <div data-stagger className="mt-9 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group rounded-[18px] border border-[#E8E6DE] bg-[#FFFDF8] p-6 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_46px_rgba(20,40,45,0.09)] dark:border-[#243337] dark:bg-[#152023]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAF1E8] text-[#078348] transition-transform duration-300 group-hover:-translate-y-1 dark:bg-[#182E24] dark:text-[#8CCB4A]">
                  <i className={`${v.icon} text-[15px]`} />
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
                  {v.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-[#77817F]">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Transparence + visuel */}
        <section className="bg-[#FFFDF8] py-14 dark:bg-[#152023]">
          <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <h2 className="font-display text-[24px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
                Une transparence assumée
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-[13.5px] leading-[1.8] text-[#77817F]">
                <p>
                  <strong className="text-[#14282D] dark:text-[#F3F2EC]">
                    Pas de fausses intégrations.
                  </strong>{' '}
                  Les services externes (IA, paiement, recherche) n’apparaissent comme
                  actifs que lorsqu’ils sont réellement configurés. Les boutons de
                  connexion OAuth nécessitent des identifiants réels.
                </p>
                <p>
                  <strong className="text-[#14282D] dark:text-[#F3F2EC]">
                    Pas de données fabriquées.
                  </strong>{' '}
                  Un nouveau compte commence avec des espaces vides et utiles. Aucun
                  témoignage, chiffre d’affaires ou client fictif n’est affiché.
                </p>
                <p>
                  <strong className="text-[#14282D] dark:text-[#F3F2EC]">
                    Des limites claires.
                  </strong>{' '}
                  L’IA peut se tromper : les pages de transparence IA, les mentions
                  légales et le centre d’aide documentent honnêtement les limites du
                  produit.
                </p>
              </div>
            </div>
            <div data-reveal className="relative">
              <div className="overflow-hidden rounded-[22px] border border-[#E8E6DE] shadow-[0_22px_54px_rgba(20,40,45,0.12)] dark:border-[#243337]">
                <img
                  src={imgCreator}
                  alt="Développeur utilisant Aura dans un espace de travail lumineux"
                  data-parallax
                  className="h-[340px] w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden py-16 text-center">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#8CCB4A]/16 via-[#EACB37]/12 to-[#FF790D]/16 blur-3xl"
          />
          <h2
            data-reveal
            className="relative font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]"
          >
            Rejoignez l’aventure Aura.
          </h2>
          <div data-stagger className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="aura-btn-gradient rounded-full px-7 py-3 text-[13.5px] font-semibold text-white shadow-[0_12px_32px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
            >
              Commencer gratuitement
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-[#E8E6DE] px-7 py-3 text-[13.5px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
            >
              Nous contacter
            </Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};
