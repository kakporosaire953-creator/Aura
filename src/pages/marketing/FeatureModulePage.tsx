import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';
import { useAuraMarketingMotion } from '../../components/landing/useAuraMarketingMotion';
import imgSculpture from '../../assets/images/aura_hero_sculpture_1791622844309.jpg';
import imgAbstract from '../../assets/images/create_preview_abstract_1791622857564.jpg';
import imgWorkspace from '../../assets/images/onboarding_step3_creator_1791685470170.jpg';
import imgLandscape from '../../assets/images/aura_showcase_landscape_1791622884265.jpg';
import imgFashion from '../../assets/images/yourbrand_fashion_model_1791684477799.jpg';
import imgProduct from '../../assets/images/aura_showcase_product_1791622893523.jpg';
import imgAuthHero from '../../assets/images/auth_hero_workspace_1791685458368.jpg';

interface ModuleContent {
  name: string;
  kicker: string;
  headline: string;
  intro: string;
  icon: string;
  accent: string;
  heroImage: string;
  heroAlt: string;
  bandImage: string;
  bandAlt: string;
  capabilities: { title: string; desc: string; icon: string }[];
  honesty: string;
  ctaLabel: string;
  ctaTo: string;
}

const MODULES: Record<string, ModuleContent> = {
  chat: {
    name: 'Aura Chat',
    kicker: 'Conversation & réflexion',
    headline: 'Une conversation qui produit du travail réel.',
    intro:
      'Aura Chat n’est pas une boîte de dialogue isolée : vos conversations sont persistées, liées à vos projets, et chaque réponse peut devenir un point de départ pour une création Studio ou une recherche Explore.',
    icon: 'fa-regular fa-comments',
    accent: '#078348',
    heroImage: imgAuthHero,
    heroAlt: 'Espace de travail Aura sur un bureau lumineux',
    bandImage: imgWorkspace,
    bandAlt: 'Créateur souriant travaillant avec son ordinateur',
    capabilities: [
      {
        title: 'Modèles réellement configurés',
        desc: 'Le sélecteur de modèles n’affiche que les fournisseurs réellement configurés côté serveur. Aucun modèle fantôme.',
        icon: 'fa-solid fa-microchip',
      },
      {
        title: 'Markdown, code et tableaux',
        desc: 'Réponses structurées, blocs de code colorés, copies instantanées, régénération et feedback par message.',
        icon: 'fa-solid fa-code',
      },
      {
        title: 'Historique persistant',
        desc: 'Renommez, recherchez, supprimez vos conversations. Chaque compte est strictement isolé.',
        icon: 'fa-solid fa-clock-rotate-left',
      },
      {
        title: 'Pièces jointes & contexte',
        desc: 'Analysez documents et images quand le fournisseur configuré le supporte, avec limites de taille par offre.',
        icon: 'fa-solid fa-paperclip',
      },
    ],
    honesty:
      'Si aucun fournisseur IA n’est configuré, Aura affiche clairement l’état de configuration requise — jamais de réponse simulée.',
    ctaLabel: 'Ouvrir Aura Chat',
    ctaTo: '/app/chat',
  },
  explore: {
    name: 'Aura Explore',
    kicker: 'Recherche sourcée',
    headline: 'Des recherches structurées, avec des sources que vous pouvez vérifier.',
    intro:
      'Explore interroge les services de recherche configurés et structure les résultats : synthèse, points clés, et liste de sources avec titres, domaines et liens vers les pages d’origine.',
    icon: 'fa-solid fa-magnifying-glass-chart',
    accent: '#EACB37',
    heroImage: imgLandscape,
    heroAlt: 'Route sinueuse dans les montagnes au coucher du soleil',
    bandImage: imgAbstract,
    bandAlt: 'Rubans de soie verts et orange en mouvement',
    capabilities: [
      {
        title: 'Sources réelles uniquement',
        desc: 'Les citations proviennent des données retournées par le fournisseur de recherche. Aucun domaine, article ou extrait n’est inventé.',
        icon: 'fa-solid fa-link',
      },
      {
        title: 'Modes de recherche',
        desc: 'Recherche rapide ou investigation approfondie selon les capacités du service connecté.',
        icon: 'fa-solid fa-sliders',
      },
      {
        title: 'Sauvegarde & export',
        desc: 'Enregistrez une recherche dans un projet, copiez la synthèse ou exportez les résultats structurés.',
        icon: 'fa-solid fa-file-export',
      },
      {
        title: 'Historique de recherche',
        desc: 'Retrouvez vos investigations passées, avec leurs sources, dans votre espace personnel.',
        icon: 'fa-solid fa-clock-rotate-left',
      },
    ],
    honesty:
      'Sans fournisseur de recherche configuré, Explore explique que l’intégration nécessite une configuration — il n’invente jamais de résultats web.',
    ctaLabel: 'Lancer une recherche',
    ctaTo: '/app/explore',
  },
  studio: {
    name: 'Aura Studio',
    kicker: 'Création & développement',
    headline: 'Des créations que vous pouvez ouvrir, modifier et exporter.',
    intro:
      'Studio génère de vrais projets HTML/CSS/JS : un site web, un dashboard, un portfolio. Chaque projet possède des fichiers réels, une galerie, un aperçu immersif, un Developer Mode et un historique de versions.',
    icon: 'fa-solid fa-wand-magic-sparkles',
    accent: '#FF790D',
    heroImage: imgFashion,
    heroAlt: 'Portrait de mode éditorial — exemple de site e-commerce créé avec Studio',
    bandImage: imgProduct,
    bandAlt: 'Photo produit minimaliste — exemple de vitrine e-commerce',
    capabilities: [
      {
        title: 'Galerie de créations',
        desc: 'Vos projets réellement persistés, avec miniatures d’aperçu, filtres par type et statut, et actions contextuelles.',
        icon: 'fa-solid fa-table-cells-large',
      },
      {
        title: 'Aperçu immersif',
        desc: 'Plein écran, barre d’outils minimale, et commutateurs ordinateur / tablette / mobile qui changent réellement le viewport.',
        icon: 'fa-solid fa-desktop',
      },
      {
        title: 'Developer Mode',
        desc: 'Explorateur de fichiers, éditeur de code coloré, aperçu en direct, sauvegarde réelle et diagnostics de compilation.',
        icon: 'fa-solid fa-code',
      },
      {
        title: 'Versions & export ZIP',
        desc: 'Chaque génération ou sauvegarde crée une version restaurable. L’export fournit l’archive réelle des fichiers du projet.',
        icon: 'fa-solid fa-clock-rotate-left',
      },
    ],
    honesty:
      'Les projets de la galerie sont les vôtres — jamais remplis d’exemples fictifs. En cas d’échec du fournisseur IA, la dernière version fonctionnelle est conservée et l’erreur est affichée.',
    ctaLabel: 'Créer avec Studio',
    ctaTo: '/app/studio',
  },
  projects: {
    name: 'Aura Projets & Missions',
    kicker: 'Organisation',
    headline: 'Un cadre pour le travail qui s’étale dans le temps.',
    intro:
      'Les projets regroupent vos conversations et créations par thème. Les missions découpent vos objectifs en étapes suivies — avec un statut reflétant le travail réellement accompli.',
    icon: 'fa-regular fa-folder-open',
    accent: '#39B969',
    heroImage: imgWorkspace,
    heroAlt: 'Créateur organisant son travail devant son ordinateur',
    bandImage: imgSculpture,
    bandAlt: 'Sculpture de rubans Aura vert jaune orange',
    capabilities: [
      {
        title: 'Projets organisateurs',
        desc: 'Description, couleur, contexte système pour l’IA, conversations liées et créations associées.',
        icon: 'fa-regular fa-folder',
      },
      {
        title: 'Missions par étapes',
        desc: 'Objectif, description, étapes à faire / en cours / terminées, progression et activités.',
        icon: 'fa-solid fa-list-check',
      },
      {
        title: 'Statuts honnêtes',
        desc: 'Les statuts reflètent l’état réel des ressources, pas des barres de progression décoratives.',
        icon: 'fa-solid fa-signal',
      },
      {
        title: 'Recherche & filtres',
        desc: 'Retrouvez vite un projet ou une mission, archivez ou supprimez avec confirmation.',
        icon: 'fa-solid fa-magnifying-glass',
      },
    ],
    honesty:
      'Aucun projet, aucune mission et aucun historique pré-remplis : un nouveau compte commence avec des états vides utiles, pas avec des données d’exemple.',
    ctaLabel: 'Organiser mon travail',
    ctaTo: '/app/projects',
  },
};

export const FeatureModulePage: React.FC = () => {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const mod = MODULES[moduleKey || ''];
  const scope = useAuraMarketingMotion<HTMLDivElement>();

  if (!mod) {
    return (
      <MarketingLayout>
        <div className="mx-auto max-w-[720px] px-4 py-24 text-center">
          <h1 className="font-display text-[28px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
            Module introuvable
          </h1>
          <Link to="/features" className="mt-6 inline-block rounded-full bg-[#078348] px-6 py-2.5 text-[13px] font-semibold text-white">
            Voir toutes les fonctionnalités
          </Link>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div ref={scope}>
        {/* Hero du module — texte + visuel */}
        <section className="relative overflow-hidden border-b border-[#E8E6DE]/70 dark:border-[#243337]">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute -left-32 top-8 h-[380px] w-[380px] rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${mod.accent}2B 0%, transparent 70%)` }}
          />
          <div className="mx-auto grid max-w-[1160px] items-center gap-12 px-4 pb-14 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Link
                to="/features"
                data-hero-item
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#77817F] transition-colors hover:text-[#078348]"
              >
                <i className="fa-solid fa-arrow-left text-[10px]" />
                Toutes les fonctionnalités
              </Link>
              <div
                data-hero-item
                className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-[15px]"
                style={{ backgroundColor: `${mod.accent}18`, color: mod.accent }}
              >
                <i className={`${mod.icon} text-[19px]`} />
              </div>
              <p
                data-hero-item
                className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: mod.accent }}
              >
                {mod.name} · {mod.kicker}
              </p>
              <h1
                data-hero-item
                className="mt-3 max-w-3xl font-display text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-[#14282D] sm:text-[46px] dark:text-[#F3F2EC]"
              >
                {mod.headline}
              </h1>
              <p data-hero-item className="mt-5 max-w-2xl text-[15.5px] leading-[1.7] text-[#77817F]">
                {mod.intro}
              </p>
              <div data-hero-item className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={mod.ctaTo}
                  className="rounded-full px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(7,131,72,0.2)] transition-transform hover:-translate-y-[2px]"
                  style={{ backgroundColor: mod.accent }}
                >
                  {mod.ctaLabel}
                </Link>
                <Link
                  to="/pricing"
                  className="rounded-full border border-[#E8E6DE] px-6 py-2.5 text-[13px] font-semibold text-[#14282D] transition-colors hover:border-[#078348] hover:text-[#078348] dark:border-[#243337] dark:text-[#D8D9D2]"
                >
                  Consulter les quotas
                </Link>
              </div>
            </div>

            {/* Visuel du module */}
            <div data-hero-item className="relative">
              <div className="overflow-hidden rounded-[24px] border border-[#E8E6DE] shadow-[0_28px_64px_rgba(20,40,45,0.14)] dark:border-[#243337]">
                <img
                  src={mod.heroImage}
                  alt={mod.heroAlt}
                  className="h-[380px] w-full object-cover"
                  loading="eager"
                />
              </div>
              <div
                data-float
                className="absolute -bottom-5 -left-4 rounded-[14px] border border-[#E8E6DE] bg-[#FFFDF8]/95 px-4 py-2.5 shadow-[0_12px_30px_rgba(20,40,45,0.12)] backdrop-blur dark:border-[#243337] dark:bg-[#152023]/95"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                  <i className={`${mod.icon} text-[10px]`} style={{ color: mod.accent }} />
                  {mod.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capacités — liste éditoriale numérotée avec entrée échelonnée */}
        <section className="mx-auto max-w-[1160px] px-4 py-16 sm:px-8">
          <h2 data-reveal className="font-display text-[24px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
            Ce que {mod.name} fait réellement
          </h2>
          <div data-stagger className="mt-9 grid gap-x-14 gap-y-9 lg:grid-cols-2">
            {mod.capabilities.map((cap, i) => (
              <div key={cap.title} className="group flex gap-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] transition-transform duration-300 group-hover:-translate-y-1"
                  style={{ backgroundColor: `${mod.accent}14`, color: mod.accent }}
                >
                  <i className={cap.icon} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-[#B4BCBA]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-[15px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-[1.7] text-[#77817F]">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bande visuelle pleine largeur */}
        <section data-reveal className="relative h-[260px] overflow-hidden sm:h-[320px]">
          <img
            src={mod.bandImage}
            alt={mod.bandAlt}
            data-parallax
            className="h-[118%] w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14282D]/42 via-transparent to-[#14282D]/12" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1160px] px-4 pb-7 sm:px-8">
            <p
              className="max-w-xl font-display text-[18px] font-bold leading-snug text-white drop-shadow-[0_2px_12px_rgba(20,40,45,0.35)] sm:text-[22px]"
            >
              « De l’idée au résultat. »
            </p>
          </div>
        </section>

        {/* Engagement d’honnêteté */}
        <section className="bg-[#EEF5E4] py-12 dark:bg-[#182E24]">
          <div data-reveal className="mx-auto flex max-w-[1160px] items-start gap-4 px-4 sm:px-8">
            <i className="fa-solid fa-shield-heart mt-1 text-[19px] text-[#078348] dark:text-[#8CCB4A]" />
            <div>
              <h3 className="font-display text-[16px] font-bold text-[#078348] dark:text-[#8CCB4A]">
                Engagement de transparence
              </h3>
              <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.75] text-[#3E5350] dark:text-[#B7C9BC]">
                {mod.honesty}
              </p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden py-16 text-center">
          <div
            data-aura-halo
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${mod.accent}22 0%, transparent 70%)` }}
          />
          <h2
            data-reveal
            className="relative font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]"
          >
            Essayez {mod.name} dans votre espace Aura.
          </h2>
          <Link
            to="/register"
            data-reveal
            className="aura-btn-gradient relative mt-7 inline-block rounded-full px-7 py-3 text-[13.5px] font-semibold text-white shadow-[0_12px_32px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
          >
            Commencer gratuitement
          </Link>
        </section>
      </div>
    </MarketingLayout>
  );
};
