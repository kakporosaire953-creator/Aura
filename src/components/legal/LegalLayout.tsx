import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuraLogo } from '../brand/AuraLogo';
import { useAura } from '../../context/AuraContext';

export interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  version: string;
  toc?: { id: string; label: string }[];
  children: React.ReactNode;
}

export const LEGAL_PAGES_LIST = [
  {
    path: '/legal/terms',
    label: 'Conditions d’utilisation',
    icon: 'fa-solid fa-file-contract',
    summary: 'Règles d’accès, engagements réciproques et responsabilités.',
  },
  {
    path: '/legal/privacy',
    label: 'Politique de confidentialité',
    icon: 'fa-solid fa-shield-halved',
    summary: 'Traitement des données personnelles, droits d’accès et sécurité.',
  },
  {
    path: '/legal/acceptable-use',
    label: 'Politique d’utilisation acceptable',
    icon: 'fa-solid fa-handshake-angle',
    summary: 'Règles déontologiques, interdictions et garde-fous IA.',
  },
  {
    path: '/legal/cookies',
    label: 'Politique relative aux cookies',
    icon: 'fa-solid fa-cookie-bite',
    summary: 'Stockage local, sessions d’authentification et traceurs.',
  },
  {
    path: '/legal/ai-transparency',
    label: 'Transparence & Limites de l’IA',
    icon: 'fa-solid fa-brain',
    summary: 'Nature générative, risque d’hallucinations et vérification.',
  },
  {
    path: '/legal/billing-terms',
    label: 'Abonnements & Remboursements',
    icon: 'fa-solid fa-credit-card',
    summary: 'Quotas freemium, renouvellement et politique tarifaire.',
  },
  {
    path: '/legal/ip-policy',
    label: 'Propriété intellectuelle & Contenus',
    icon: 'fa-solid fa-copyright',
    summary: 'Droits sur le code produit, les textes, images et présentations.',
  },
  {
    path: '/legal/notice',
    label: 'Mentions légales & Éditeur',
    icon: 'fa-solid fa-building-columns',
    summary: 'Informations de l’éditeur, hébergement et directeur de publication.',
  },
  {
    path: '/legal/contact',
    label: 'Contact juridique & Signalements',
    icon: 'fa-solid fa-envelope-open-text',
    summary: 'Canaux officiels pour demandes DPO, réclamations et abus.',
  },
];

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  subtitle,
  lastUpdated,
  version,
  toc,
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAura();

  return (
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] flex flex-col font-sans transition-colors selection:bg-[#8CCB4A]/30">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF8F2]/90 dark:bg-[#0E1618]/90 border-b border-[#EAE6DC] dark:border-[#243337]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <AuraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
                Aura
              </span>
              <span className="text-xs font-semibold text-[#77817F] uppercase tracking-wider">
                Juridique
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <Link
              to="/"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors"
            >
              Accueil
            </Link>
            <Link
              to="/pricing"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors"
            >
              Tarifs
            </Link>
            <Link
              to="/help"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors"
            >
              Centre d’aide
            </Link>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="aura-btn-gradient px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm"
              >
                Mon Espace Aura
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full border border-[#EAE6DC] dark:border-[#243337] text-xs font-semibold hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors"
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Navigation: Legal Hub Links */}
          <aside
            aria-label="Documents juridiques"
            className="lg:col-span-1 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-3 space-y-1 shadow-sm sticky top-24"
          >
            <div className="px-3 py-2 border-b border-[#EAE6DC]/70 dark:border-[#243337] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
                Espace Légal & Conformité
              </span>
            </div>

            {LEGAL_PAGES_LIST.map((page) => {
              const isActive = location.pathname === page.path;
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D] font-semibold'
                      : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
                  }`}
                >
                  <i className={`${page.icon} text-xs mt-0.5 shrink-0 opacity-80`} />
                  <span className="leading-tight">{page.label}</span>
                </Link>
              );
            })}

            {/* In-page Table of Contents if available */}
            {toc && toc.length > 0 && (
              <div className="pt-3 mt-3 border-t border-[#EAE6DC]/70 dark:border-[#243337] px-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#77817F] block">
                  Sommaire de cette page
                </span>
                <ul className="space-y-1 text-[11px]">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#078348] dark:hover:text-[#8CCB4A] transition-colors block truncate"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Right Content Area */}
          <article className="lg:col-span-3 rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-10 shadow-sm space-y-8">
            {/* Document Header */}
            <div className="border-b border-[#EAE6DC] dark:border-[#243337] pb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-[11px] font-bold uppercase tracking-wider">
                  Document Officiel Aura
                </span>
                <span className="text-xs text-[#77817F]">·</span>
                <span className="text-xs text-[#77817F]">Version : {version}</span>
                <span className="text-xs text-[#77817F]">·</span>
                <span className="text-xs text-[#77817F]">Dernière mise à jour : {lastUpdated}</span>
              </div>

              <h1 className="font-display font-black text-2xl sm:text-4xl text-[#14282D] dark:text-[#F3F2EC] tracking-tight">
                {title}
              </h1>

              <p className="text-sm sm:text-base text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
                {subtitle}
              </p>

              {/* Publisher Placeholder Notice */}
              <div className="p-3.5 rounded-xl bg-[#FFFBEB] dark:bg-[#2D2111] border border-[#FDE68A] dark:border-[#533816] text-[11px] text-[#92400E] dark:text-[#FCD34D] flex items-start gap-2.5">
                <i className="fa-solid fa-triangle-exclamation text-xs mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold">Avis de conformité et de transparence :</span>
                  <p className="leading-snug">
                    Les champs surlignés sous la forme <code>[À COMPLÉTER PAR L'ÉDITEUR AVANT PUBLICATION]</code> doivent être renseignés avec les coordonnées juridiques réelles de votre entité légale avant toute exploitation commerciale définitive.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Text / Sections */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-[#3D4A47] dark:text-[#C5CECB] space-y-6 leading-relaxed">
              {children}
            </div>

            {/* Document Footer */}
            <div className="border-t border-[#EAE6DC] dark:border-[#243337] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77817F]">
              <span>Aura Platform · Direction Juridique & Conformité</span>
              <div className="flex items-center gap-4">
                <Link to="/legal/contact" className="hover:underline text-[#078348]">
                  Contacter le service juridique
                </Link>
                <Link to="/help" className="hover:underline">
                  Centre d’aide
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-[#EAE6DC] dark:border-[#243337] text-xs text-[#77817F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AuraLogo className="w-5 h-5" />
            <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">Aura Platform</span>
            <span>· Tous droits réservés</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/legal/terms" className="hover:underline">
              Conditions
            </Link>
            <Link to="/legal/privacy" className="hover:underline">
              Confidentialité
            </Link>
            <Link to="/legal/acceptable-use" className="hover:underline">
              Utilisation acceptable
            </Link>
            <Link to="/legal/cookies" className="hover:underline">
              Cookies
            </Link>
            <Link to="/legal/notice" className="hover:underline">
              Mentions légales
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
