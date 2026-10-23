import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { useAuraMarketingMotion } from '../../components/landing/useAuraMarketingMotion';
import { AuraLogo } from '../../components/brand/AuraLogo';
import imgSculpture from '../../assets/images/aura_hero_sculpture_1791622844309.jpg';

export const NotFoundPage: React.FC = () => {
  const scope = useAuraMarketingMotion<HTMLDivElement>();

  return (
    <MarketingLayout>
      <div ref={scope}>
        <section className="mx-auto flex max-w-[720px] flex-col items-center px-4 py-20 text-center sm:px-8">
          <div data-hero-item>
            <AuraLogo size="md" variant="symbol" />
          </div>
          <div
            data-hero-item
            data-float
            className="mt-8 w-[190px] overflow-hidden rounded-[20px] border border-[#E8E6DE] shadow-[0_20px_50px_rgba(20,40,45,0.12)] dark:border-[#243337]"
          >
            <img
              src={imgSculpture}
              alt="Sculpture de rubans Aura"
              className="h-[170px] w-full object-cover"
              loading="eager"
            />
          </div>
          <p
            data-hero-item
            className="mt-8 font-display text-[64px] font-bold leading-none tracking-[-0.03em] text-[#E8E6DE] dark:text-[#243337]"
          >
            404
          </p>
          <h1
            data-hero-item
            className="mt-4 font-display text-[26px] font-bold text-[#14282D] sm:text-[32px] dark:text-[#F3F2EC]"
          >
            Cette page n’existe pas.
          </h1>
          <p data-hero-item className="mt-4 max-w-md text-[14px] leading-[1.75] text-[#77817F]">
            Le lien est peut-être obsolète ou l’adresse contient une faute. Voici
            quelques pistes pour reprendre le fil.
          </p>
          <div data-stagger className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="aura-btn-gradient rounded-full px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
            >
              Retour à l’accueil
            </Link>
            <Link
              to="/features"
              className="rounded-full border border-[#E8E6DE] px-6 py-2.5 text-[13px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
            >
              Fonctionnalités
            </Link>
            <Link
              to="/help"
              className="rounded-full border border-[#E8E6DE] px-6 py-2.5 text-[13px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
            >
              Centre d’aide
            </Link>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};
