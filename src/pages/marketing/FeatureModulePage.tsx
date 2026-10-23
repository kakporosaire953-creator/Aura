import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarketingLayout } from '../../components/layout/MarketingLayout';

interface ModuleContent {
  name: string;
  kicker: string;
  headline: string;
  intro: string;
  icon: string;
  accent: string;
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
      {/* Hero du module */}
      <section className="border-b border-[#E8E6DE]/70 dark:border-[#243337]">
        <div className="mx-auto max-w-[1160px] px-4 pb-14 pt-16 sm:px-8 sm:pt-20">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#77817F] transition-colors hover:text-[#078348]"
          >
            <i className="fa-solid fa-arrow-left text-[10px]" />
            Toutes les fonctionnalités
          </Link>
          <div
            className="mt-6 inline-flex h-12 w-12 items-center justify-center rounded-[15px]"
            style={{ backgroundColor: `${mod.accent}18`, color: mod.accent }}
          >
            <i className={`${mod.icon} text-[19px]`} />
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: mod.accent }}>
            {mod.name} · {mod.kicker}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-[#14282D] sm:text-[46px] dark:text-[#F3F2EC]">
            {mod.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-[1.7] text-[#77817F]">{mod.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
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
      </section>

      {/* Capacités — liste éditoriale numérotée */}
      <section className="mx-auto max-w-[1160px] px-4 py-16 sm:px-8">
        <h2 className="font-display text-[24px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
          Ce que {mod.name} fait réellement
        </h2>
        <div className="mt-9 grid gap-x-14 gap-y-9 lg:grid-cols-2">
          {mod.capabilities.map((cap, i) => (
            <div key={cap.title} className="flex gap-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px]"
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

      {/* Engagement d’honnêteté */}
      <section className="bg-[#EEF5E4] py-12 dark:bg-[#182E24]">
        <div className="mx-auto flex max-w-[1160px] items-start gap-4 px-4 sm:px-8">
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
      <section className="py-16 text-center">
        <h2 className="font-display text-[26px] font-bold text-[#14282D] dark:text-[#F3F2EC]">
          Essayez {mod.name} dans votre espace Aura.
        </h2>
        <Link
          to="/register"
          className="aura-btn-gradient mt-7 inline-block rounded-full px-7 py-3 text-[13.5px] font-semibold text-white shadow-[0_12px_32px_rgba(7,131,72,0.22)] transition-transform hover:-translate-y-[2px]"
        >
          Commencer gratuitement
        </Link>
      </section>
    </MarketingLayout>
  );
};
