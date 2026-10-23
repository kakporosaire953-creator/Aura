import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { AuraLogo } from '../../components/brand/AuraLogo';

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
  return (
    <MarketingLayout>
      <section className="border-b border-[#E8E6DE]/70 dark:border-[#243337]">
        <div className="mx-auto max-w-[1160px] px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
          <div className="flex items-center gap-4">
            <AuraLogo size="md" variant="symbol" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#078348]">
                À propos d’Aura
              </p>
              <p className="mt-1 text-[13px] text-[#77817F]">De l’idée au résultat.</p>
            </div>
          </div>
          <h1 className="mt-8 max-w-3xl font-display text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-[#14282D] sm:text-[50px] dark:text-[#F3F2EC]">
            Un espace de travail IA conçu pour{' '}
            <span className="aura-text-gradient">vraiment produire.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15.5px] leading-[1.75] text-[#77817F]">
            Aura réunit conversation, recherche, création et organisation dans une
            seule plateforme cohérente. Notre mission : aider les étudiants,
            développeurs, entrepreneurs et créateurs — en Afrique francophone et au-delà
            — à transformer leurs idées en réalisations concrètes qu’ils peuvent
            inspecter, améliorer, sauvegarder et utiliser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-4 py-16 sm:px-8">
        <h2 className="font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
          Ce qui guide le produit
        </h2>
        <div className="mt-9 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-[18px] border border-[#E8E6DE] bg-[#FFFDF8] p-6 dark:border-[#243337] dark:bg-[#152023]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAF1E8] text-[#078348] dark:bg-[#182E24] dark:text-[#8CCB4A]">
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

      <section className="bg-[#FFFDF8] py-14 dark:bg-[#152023]">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-8">
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
      </section>

      <section className="py-16 text-center">
        <h2 className="font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
          Rejoignez l’aventure Aura.
        </h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
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
    </MarketingLayout>
  );
};
