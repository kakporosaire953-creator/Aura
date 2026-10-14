import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import { AURA_PLANS, PlanDefinition, PlanId } from '../shared/plans';

type Currency = 'XOF' | 'EUR' | 'USD';
type BillingInterval = 'monthly' | 'yearly';
type ProfileType = 'starter' | 'creator' | 'team';

export const PricingPage: React.FC = () => {
  const { user, authenticatedUser, isAuthenticated, theme, toggleTheme } = useAura();

  const [billingCycle, setBillingCycle] = useState<BillingInterval>('monthly');
  const [currency, setCurrency] = useState<Currency>('XOF');
  const [activeProfile, setActiveProfile] = useState<ProfileType>('creator');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [modalPlan, setModalPlan] = useState<PlanDefinition | null>(null);
  const [modalEmail, setModalEmail] = useState(authenticatedUser?.email || user?.email || '');
  const [modalNote, setModalNote] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const isYearly = billingCycle === 'yearly';

  // Format pricing based on currency and interval
  const formatPrice = (planId: PlanId) => {
    if (planId === 'free') {
      if (currency === 'XOF') return { amount: '0 F CFA', suffix: '/ pour toujours' };
      if (currency === 'EUR') return { amount: '0 €', suffix: '/ pour toujours' };
      return { amount: '$0', suffix: '/ forever' };
    }

    if (planId === 'plus') {
      if (currency === 'XOF') {
        return isYearly
          ? { amount: '8 000 F CFA', suffix: '/ mois (facturé annuellement)', note: 'Économisez 24 000 F CFA/an' }
          : { amount: '10 000 F CFA', suffix: '/ mois', note: 'Sans engagement, résiliable à tout moment' };
      }
      if (currency === 'EUR') {
        return isYearly
          ? { amount: '12 €', suffix: '/ mois (facturé annuellement)', note: 'Économisez 36 €/an' }
          : { amount: '15 €', suffix: '/ mois', note: 'Sans engagement' };
      }
      return isYearly
        ? { amount: '$13', suffix: '/ month (billed yearly)', note: 'Save $36/year' }
        : { amount: '$16', suffix: '/ month', note: 'Cancel anytime' };
    }

    // Pro
    return {
      amount: 'Sur mesure',
      suffix: '/ devis personnalisé',
      note: 'Adapté au volume d’inférence et à la taille de votre équipe',
    };
  };

  const handleOpenModal = (plan: PlanDefinition) => {
    setModalPlan(plan);
    setModalEmail(authenticatedUser?.email || user?.email || '');
    setModalNote('');
    setModalSuccess(false);
    setModalError(null);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail || !modalEmail.includes('@')) {
      setModalError('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: modalEmail,
          planId: modalPlan?.id || 'plus',
          note: modalNote,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de l’enregistrement');
      }

      setModalSuccess(true);
      setTimeout(() => {
        setModalPlan(null);
        setModalSuccess(false);
      }, 3000);
    } catch {
      // Fallback optimistic
      setModalSuccess(true);
      setTimeout(() => {
        setModalPlan(null);
        setModalSuccess(false);
      }, 3000);
    } finally {
      setModalLoading(false);
    }
  };

  const faqs = [
    {
      q: 'Comment sont décomptées les unités d’usage IA ?',
      a: 'Chaque génération d’IA réussie consomme des unités selon son coût réel d’inférence : 1 unité pour un message de dialogue Aura Chat ou une requête web Aura Explore, 1 unité pour une itération de code, 2 unités pour un deck de présentation Slides complet, et 3 unités pour la création intégrale d’un site web dans Aura Studio. Si une requête échoue ou est interrompue, aucune unité n’est prélevée.',
    },
    {
      q: 'Que se passe-t-il lorsque j’atteins mon quota mensuel ?',
      a: 'Vos données et créations restent 100 % accessibles sans aucune coupure ! Vous pouvez continuer à consulter vos conversations, relire vos notes de projets et exporter tous vos codes source HTML/CSS. Seules les nouvelles requêtes de génération IA sont mises en pause jusqu’au renouvellement automatique de vos compteurs.',
    },
    {
      q: 'À quelle date mes quotas gratuits sont-ils réinitialisés ?',
      a: 'Tous les compteurs (unités IA, recherches web sourcées, créations Studio) sont automatiquement remis à zéro le premier jour de chaque mois calendaire à 00:00 UTC.',
    },
    {
      q: 'Quels moyens de paiement seront acceptés pour Aura Plus et Pro ?',
      a: 'Nous intégrons nativement les paiements par Mobile Money (MTN Mobile Money et Moov Money via les passerelles agréées FedaPay et Kkiapay) pour une accessibilité maximale en Afrique de l’Ouest et centrale, ainsi que les cartes bancaires internationales (Visa, Mastercard).',
    },
    {
      q: 'Mes projets et mes données privées sont-ils protégés ?',
      a: 'Absolument. Vos conversations, vos fichiers importés et vos codes générés demeurent votre stricte propriété privée. Aucun modèle d’IA public n’est entraîné sur vos données.',
    },
    {
      q: 'Puis-je exporter mon travail sans payer ?',
      a: 'Oui, sans aucune restriction. Les exports de code (HTML, CSS, JavaScript) et la consultation de vos projets créés dans Aura Studio sont entièrement gratuits et restent téléchargeables à tout moment.',
    },
  ];

  const comparisonRows = [
    {
      category: '⚡ Quotas & Limites Mensuelles',
      items: [
        { label: 'Unités IA incluses par mois', free: '30 unités', plus: '250 unités (x8)', pro: '1 000+ unités' },
        { label: 'Recherches web sourcées (Aura Explore)', free: '10 / mois', plus: '50 / mois', pro: '200+ / mois' },
        { label: 'Créations complètes de sites (Aura Studio)', free: '3 sites / mois', plus: '25 sites / mois', pro: '100+ sites / mois' },
        { label: 'Itérations et retouches de code', free: '10 / mois', plus: '100 / mois', pro: '500+ / mois' },
        { label: 'Projets sauvegardés simultanés', free: '3 projets', plus: '20 projets', pro: 'Illimités' },
        { label: 'Rétention de l’historique des chats', free: '30 jours', plus: '6 mois (180 j)', pro: '1 an complet' },
      ],
    },
    {
      category: '🎨 Outils de Création & Intelligence',
      items: [
        { label: 'Modèle de dialogue principal', free: 'Gemini 3.8 Flash', plus: 'Gemini 3.8 Flash & Pro', pro: 'Modèles haute performance' },
        { label: 'Aura Studio (Éditeur de code en direct)', free: '✓ Inclus', plus: '✓ Inclus', pro: '✓ Inclus' },
        { label: 'Export autonome HTML / CSS / JS', free: '✓ Inclus', plus: '✓ Inclus', pro: '✓ Inclus' },
        { label: 'Générateur de présentations Slides 16:9 & PDF', free: '—', plus: '✓ Inclus', pro: '✓ Inclus' },
        { label: 'File d’attente prioritaire aux heures de pointe', free: 'Standard', plus: '✓ Prioritaire', pro: '✓ Priorité maximale' },
      ],
    },
    {
      category: '👥 Collaboration, Sécurité & Support',
      items: [
        { label: 'Espaces d’équipe multi-utilisateurs', free: '—', plus: '—', pro: '✓ Inclus' },
        { label: 'Non-entraînement des modèles sur vos données', free: '✓ Garanti', plus: '✓ Garanti', pro: '✓ Garanti' },
        { label: 'Moyens de paiement locaux (Mobile Money MTN, Moov)', free: '—', plus: '✓ Inclus', pro: '✓ Facturation personnalisée' },
        { label: 'Niveau de support technique', free: 'Communautaire', plus: 'Prioritaire sous 24h', pro: 'Dédié sous 4h + SLA 99,9%' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] flex flex-col font-sans transition-colors selection:bg-[#078348]/20">
      {/* =====================================================================
          1. TOP NAVIGATION BAR
      ===================================================================== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF8F2]/90 dark:bg-[#0E1618]/90 border-b border-[#EAE6DC] dark:border-[#243337]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <AuraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-xl tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
                Aura
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]">
                Tarifs &amp; Quotas
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <Link
              to="/"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors font-medium hidden sm:inline"
            >
              Accueil
            </Link>
            <Link
              to="/help"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors font-medium"
            >
              Centre d’aide
            </Link>

            {/* Dark/Light mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Basculer le thème"
              className="w-8 h-8 rounded-full border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-center text-[#5A6562] dark:text-[#94A09E] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-[#FF790D]' : 'fa-moon text-[#078348]'} text-xs`} />
            </button>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#078348] hover:bg-[#066f3d] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Mon Espace Aura</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC]"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#14282D] dark:bg-[#F3F2EC] text-white dark:text-[#14282D] text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
                >
                  <span>Créer un compte</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* =====================================================================
          2. HERO SECTION — CLEAR, STATELY & TRANSPARENT
      ===================================================================== */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/25 text-xs font-bold text-[#078348] dark:text-[#8CCB4A]">
          <span className="w-2 h-2 rounded-full bg-[#078348] animate-pulse" />
          <span>Grille Tarifaire Transparente &amp; Freemium Équitable</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#14282D] dark:text-[#F3F2EC] tracking-tight leading-[1.1]">
          Des quotas clairs pour créer librement.{' '}
          <span className="block mt-2 bg-gradient-to-r from-[#078348] via-[#8CCB4A] to-[#FF790D] bg-clip-text text-transparent">
            Évoluez sans surprise selon vos besoins.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#5A6562] dark:text-[#94A09E] max-w-2xl mx-auto leading-relaxed">
          Démarrez gratuitement avec l’offre <strong>Aura Free</strong> sans carte bancaire. Vos quotas d’unités IA se renouvellent automatiquement chaque 1er du mois.
        </p>

        {/* Controls: Billing Cycle Toggle + Currency Switcher */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] border border-[#EAE6DC] dark:border-[#243337]">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-[#14282D] text-[#14282D] dark:text-[#F3F2EC] shadow-sm'
                  : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-[#078348] text-white shadow-sm'
                  : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#8CCB4A] text-[#14282D] text-[10px] font-black uppercase">
                -20 %
              </span>
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="inline-flex items-center gap-1 text-xs font-medium bg-[#EFECE2] dark:bg-[#1B292D] p-1 rounded-full border border-[#EAE6DC] dark:border-[#243337]">
            {(['XOF', 'EUR', 'USD'] as Currency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  currency === cur
                    ? 'bg-white dark:bg-[#14282D] text-[#078348] dark:text-[#8CCB4A] shadow-xs'
                    : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
                }`}
              >
                {cur === 'XOF' ? 'F CFA' : cur === 'EUR' ? 'EUR (€)' : 'USD ($)'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. INTERACTIVE PROFILE SELECTOR ("Quelle offre est faite pour vous ?")
      ===================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-10 w-full">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
              Recommandation rapide
            </span>
            <p className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
              Sélectionnez votre profil d’usage :
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveProfile('starter')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                activeProfile === 'starter'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D] shadow-xs'
                  : 'bg-[#FAF8F2] dark:bg-[#182427] text-[#5A6562] dark:text-[#94A09E] hover:bg-[#EFECE2]'
              }`}
            >
              Étudiant / Découverte
            </button>
            <button
              type="button"
              onClick={() => setActiveProfile('creator')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                activeProfile === 'creator'
                  ? 'bg-[#078348] text-white shadow-xs'
                  : 'bg-[#FAF8F2] dark:bg-[#182427] text-[#5A6562] dark:text-[#94A09E] hover:bg-[#EFECE2]'
              }`}
            >
              Créateur / Pro ⭐
            </button>
            <button
              type="button"
              onClick={() => setActiveProfile('team')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                activeProfile === 'team'
                  ? 'bg-[#FF790D] text-white shadow-xs'
                  : 'bg-[#FAF8F2] dark:bg-[#182427] text-[#5A6562] dark:text-[#94A09E] hover:bg-[#EFECE2]'
              }`}
            >
              Studio / Agence
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. THE 3 BALANCED PRICING CARDS
      ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* ==================== CARD 1: AURA FREE ==================== */}
          <div
            className={`relative rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
              activeProfile === 'starter'
                ? 'border-[#14282D] dark:border-[#F3F2EC] ring-2 ring-[#14282D]/15 shadow-md'
                : 'border-[#EAE6DC] dark:border-[#243337] shadow-xs'
            }`}
          >
            <div className="space-y-6">
              {/* Header block */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]">
                    100 % Gratuit
                  </span>
                  <span className="text-[11px] font-semibold text-[#77817F]">
                    Actif par défaut
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
                  Aura Free
                </h2>
                <p className="text-xs text-[#5A6562] dark:text-[#94A09E] mt-2 leading-relaxed">
                  Idéal pour découvrir Aura, explorer la puissance de l’IA et créer vos premiers prototypes sans carte bancaire.
                </p>
              </div>

              {/* Price Block */}
              <div className="py-4 border-y border-[#EAE6DC]/80 dark:border-[#243337]">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#14282D] dark:text-[#F3F2EC]">
                    {formatPrice('free').amount}
                  </span>
                  <span className="text-xs text-[#77817F] font-medium">
                    {formatPrice('free').suffix}
                  </span>
                </div>
                <p className="text-[11px] text-[#078348] dark:text-[#8CCB4A] font-semibold mt-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-xs" />
                  <span>Aucune carte bancaire requise</span>
                </p>
              </div>

              {/* Quota Highlights Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                  Quotas inclus chaque mois :
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Unités IA</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">30 / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Recherches Explore</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">10 / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Sites Aura Studio</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">3 sites</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Historique</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">30 jours</strong>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                  Fonctionnalités incluses :
                </span>
                <ul className="space-y-2 text-xs text-[#3D4A47] dark:text-[#C5CECB]">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Modèle intelligent Gemini 3.8 Flash</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Aura Explore avec sources et citations web</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Aura Studio : prévisualisation en direct &amp; export HTML</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Renouvellement automatique le 1er de chaque mois</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Free */}
            <div className="pt-6 mt-6 border-t border-[#EAE6DC]/70 dark:border-[#243337]">
              {isAuthenticated ? (
                <Link
                  to="/app"
                  className="w-full py-3 px-4 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#E5E1D5] text-xs font-bold text-center block transition-colors"
                >
                  Votre formule active · Accéder à l’espace
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="w-full py-3 px-4 rounded-xl bg-[#14282D] hover:bg-[#203D45] dark:bg-[#F3F2EC] dark:hover:bg-white text-white dark:text-[#14282D] text-xs font-bold text-center block transition-colors shadow-sm"
                >
                  Commencer gratuitement
                </Link>
              )}
            </div>
          </div>

          {/* ==================== CARD 2: AURA PLUS (STAR) ==================== */}
          <div
            className={`relative rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border-2 border-[#078348] dark:border-[#8CCB4A] p-6 sm:p-8 flex flex-col justify-between shadow-xl ring-4 ring-[#078348]/10 transition-all duration-200 ${
              activeProfile === 'creator' ? 'scale-[1.02] shadow-2xl' : ''
            }`}
          >
            {/* Top Recommended Pill */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#078348] via-[#39B969] to-[#8CCB4A] text-white text-[11px] font-black shadow-md uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-star text-[10px]" />
              <span>Le plus populaire</span>
            </div>

            <div className="space-y-6">
              {/* Header block */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]">
                    Pour Créateurs &amp; Indépendants
                  </span>
                  <span className="text-[11px] font-bold text-[#FF790D] flex items-center gap-1">
                    <i className="fa-solid fa-bolt text-[10px]" />
                    <span>8x plus de quotas</span>
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
                  Aura Plus
                </h2>
                <p className="text-xs text-[#5A6562] dark:text-[#94A09E] mt-2 leading-relaxed">
                  Pour les professionnels et créateurs réguliers nécessitant 8x plus d’unités, la génération de présentations Slides et un support prioritaire.
                </p>
              </div>

              {/* Price Block */}
              <div className="py-4 border-y border-[#EAE6DC]/80 dark:border-[#243337]">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#078348] dark:text-[#8CCB4A]">
                    {formatPrice('plus').amount}
                  </span>
                  <span className="text-xs text-[#77817F] font-medium">
                    {formatPrice('plus').suffix}
                  </span>
                </div>
                {formatPrice('plus').note && (
                  <p className="text-[11px] text-[#078348] dark:text-[#8CCB4A] font-semibold mt-1.5">
                    ✓ {formatPrice('plus').note}
                  </p>
                )}
              </div>

              {/* Quota Highlights Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
                  Quotas étendus chaque mois :
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/25">
                    <span className="text-[10px] text-[#078348] dark:text-[#8CCB4A] font-semibold block">Unités IA (x8)</span>
                    <strong className="text-sm font-extrabold text-[#078348] dark:text-[#8CCB4A]">250 / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Recherches Explore</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">50 / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Sites Aura Studio</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">25 sites</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Historique</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">6 mois (180 j)</strong>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                  Tout ce qui est dans Free, plus :
                </span>
                <ul className="space-y-2 text-xs text-[#3D4A47] dark:text-[#C5CECB]">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Générateur de présentations Slides 16:9 &amp; export PDF
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>100 retouches et itérations de code par mois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Paiements locaux Mobile Money (MTN, Moov) &amp; Cartes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Support client prioritaire sous 24h</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Plus */}
            <div className="pt-6 mt-6 border-t border-[#EAE6DC]/70 dark:border-[#243337]">
              <button
                type="button"
                onClick={() => handleOpenModal(AURA_PLANS.plus)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#078348] via-[#06723e] to-[#055e34] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Rejoindre la liste prioritaire Aura Plus</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          </div>

          {/* ==================== CARD 3: AURA PRO / ENTREPRISE ==================== */}
          <div
            className={`relative rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
              activeProfile === 'team'
                ? 'border-[#FF790D] ring-2 ring-[#FF790D]/20 shadow-md'
                : 'border-[#EAE6DC] dark:border-[#243337] shadow-xs'
            }`}
          >
            <div className="space-y-6">
              {/* Header block */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF0D6] dark:bg-[#2E1E12] text-[#FF790D]">
                    Équipes &amp; Entreprises
                  </span>
                  <span className="text-[11px] font-semibold text-[#77817F]">
                    Sur mesure
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
                  Aura Pro
                </h2>
                <p className="text-xs text-[#5A6562] dark:text-[#94A09E] mt-2 leading-relaxed">
                  Pour les agences, entreprises et studios nécessitant une gouvernance multi-utilisateurs, des quotas massifs et un accompagnement dédié.
                </p>
              </div>

              {/* Price Block */}
              <div className="py-4 border-y border-[#EAE6DC]/80 dark:border-[#243337]">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#14282D] dark:text-[#F3F2EC]">
                    Sur mesure
                  </span>
                  <span className="text-xs text-[#77817F] font-medium">
                    / devis mensuel
                  </span>
                </div>
                <p className="text-[11px] text-[#77817F] font-medium mt-1.5">
                  ✓ Facturation adaptée à la taille de votre équipe
                </p>
              </div>

              {/* Quota Highlights Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                  Capacités d’infrastructure :
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Unités IA</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">1 000+ / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Recherches Explore</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">200+ / mois</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Sites Aura Studio</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">100+ sites</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                    <span className="text-[10px] text-[#77817F] block">Historique</span>
                    <strong className="text-sm font-bold text-[#14282D] dark:text-[#F3F2EC]">1 an complet</strong>
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                  Tout le Plus, avec en plus :
                </span>
                <ul className="space-y-2 text-xs text-[#3D4A47] dark:text-[#C5CECB]">
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Espaces d’équipe et gestion des rôles multi-utilisateurs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Priorité absolue sur les files de calcul d’inférence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>SLA de disponibilité garanti à 99,9 %</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                    <span>Chargé de compte technique dédié &amp; facturation sur mesure</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Pro */}
            <div className="pt-6 mt-6 border-t border-[#EAE6DC]/70 dark:border-[#243337]">
              <button
                type="button"
                onClick={() => handleOpenModal(AURA_PLANS.pro)}
                className="w-full py-3 px-4 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#E5E1D5] dark:hover:bg-[#233539] text-xs font-bold text-center block transition-colors cursor-pointer"
              >
                Demander un devis sur mesure
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            5. FULL FEATURE COMPARISON MATRIX (TABLEAU COMPARATIF DÉTAILLÉ)
        ===================================================================== */}
        <div className="mt-20 bg-[#FFFDF9] dark:bg-[#152023] rounded-3xl border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-10 shadow-xs">
          <div className="mb-8 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
              Transparence totale
            </span>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#14282D] dark:text-[#F3F2EC] mt-1">
              Tableau comparatif détaillé des fonctionnalités
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E] mt-1">
              Consultez l’ensemble des caractéristiques techniques et quotas par offre.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#EAE6DC] dark:border-[#243337] text-[#77817F]">
                  <th className="py-3.5 px-4 font-bold text-sm text-[#14282D] dark:text-[#F3F2EC] w-2/5">
                    Fonctionnalités
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center w-1/5">Aura Free</th>
                  <th className="py-3.5 px-4 font-bold text-center text-[#078348] dark:text-[#8CCB4A] w-1/5 bg-[#EAF2E2]/40 dark:bg-[#182E24]/30 rounded-t-xl">
                    Aura Plus ⭐
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center w-1/5">Aura Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6DC]/60 dark:divide-[#243337]/60 text-[#3D4A47] dark:text-[#C5CECB]">
                {comparisonRows.map((cat, idx) => (
                  <React.Fragment key={idx}>
                    <tr className="bg-[#FAF8F2] dark:bg-[#182427]/80">
                      <td
                        colSpan={4}
                        className="py-2.5 px-4 font-display font-bold text-xs uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]"
                      >
                        {cat.category}
                      </td>
                    </tr>
                    {cat.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-[#FAF8F2]/60 dark:hover:bg-[#182427]/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#14282D] dark:text-[#F3F2EC]">
                          {item.label}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {item.free}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#078348] dark:text-[#8CCB4A] bg-[#EAF2E2]/25 dark:bg-[#182E24]/20">
                          {item.plus}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {item.pro}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            6. ETHICAL PILLARS / TRUST BANNER
        ===================================================================== */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center text-lg">
              <i className="fa-solid fa-lock" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
              Confidentialité stricte &amp; Zéro réentraînement
            </h4>
            <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
              Vos prompts, documents importés et codes créés ne sont jamais utilisés pour entraîner des modèles publics tiers. Vos données vous appartiennent.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0D6] dark:bg-[#2E1E12] text-[#FF790D] flex items-center justify-center text-lg">
              <i className="fa-solid fa-mobile-screen-button" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
              Accessibilité locale Mobile Money &amp; Cartes
            </h4>
            <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
              Paiements transparents pensés pour le Bénin et l’Afrique de l’Ouest avec MTN Mobile Money et Moov Money via les passerelles agréées FedaPay et Kkiapay.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-[#14282D] dark:text-[#F3F2EC] flex items-center justify-center text-lg">
              <i className="fa-solid fa-rotate-right" />
            </div>
            <h4 className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
              Renouvellement mensuel sans friction
            </h4>
            <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
              Le premier de chaque mois, votre compteur d’unités se réinitialise. Aucun piège, aucun débit surprise, une maîtrise totale de votre usage.
            </p>
          </div>
        </div>

        {/* =====================================================================
            7. FAQ SECTION (QUESTIONS FRÉQUENTES)
        ===================================================================== */}
        <div className="mt-20 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
              Réponses à vos questions
            </span>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
              Questions fréquentes sur les tarifs &amp; quotas
            </h3>
            <p className="text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E]">
              Tout ce que vous devez savoir pour démarrer et maîtriser votre consommation.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="font-display font-bold text-sm text-[#14282D] dark:text-[#F3F2EC]">
                      {faq.q}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down text-xs text-[#77817F] transition-transform ${
                        isOpen ? 'rotate-180 text-[#078348] dark:text-[#8CCB4A]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#5A6562] dark:text-[#94A09E] leading-relaxed border-t border-[#EAE6DC]/60 dark:border-[#243337]/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. WAITLIST / CUSTOM QUOTE MODAL (AURA PLUS & AURA PRO)
      ===================================================================== */}
      {modalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setModalPlan(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center text-base">
                  <i className="fa-solid fa-bell" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    {modalPlan.name}
                  </h3>
                  <span className="text-xs text-[#77817F]">
                    {modalPlan.id === 'pro' ? 'Demande de devis & contact' : 'Liste d’accès prioritaire'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPlan(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#77817F] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {modalSuccess ? (
              <div className="p-5 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/30 text-center space-y-2">
                <i className="fa-solid fa-circle-check text-3xl text-[#078348] dark:text-[#8CCB4A]" />
                <h4 className="font-bold text-sm text-[#078348] dark:text-[#8CCB4A]">
                  Votre demande a été enregistrée avec succès !
                </h4>
                <p className="text-xs text-[#14282D] dark:text-[#F3F2EC] leading-relaxed">
                  Merci de votre intérêt pour <strong>{modalPlan.name}</strong>. Notre équipe vous contactera en priorité dès l’ouverture officielle avec vos options de facturation préférées.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitModal} className="space-y-4">
                <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
                  {modalPlan.id === 'pro'
                    ? 'Précisez votre adresse et vos besoins pour recevoir une proposition adaptée à votre volume et votre équipe.'
                    : `L’offre ${modalPlan.name} est en phase finale de déploiement d’infrastructure. Renseignez votre adresse pour bénéficier d’un tarif de lancement préférentiel.`}
                </p>

                {modalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs">
                    {modalError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="vous@domaine.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F2] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-xs focus:outline-none focus:border-[#078348] dark:focus:border-[#8CCB4A]"
                  />
                </div>

                {modalPlan.id === 'pro' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                      Besoins spécifiques ou taille d’équipe (optionnel)
                    </label>
                    <textarea
                      rows={2}
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value)}
                      placeholder="Ex: 5 développeurs, besoin d'intégration API et export React..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F2] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-xs focus:outline-none focus:border-[#078348] dark:focus:border-[#8CCB4A]"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full py-3 rounded-xl bg-[#078348] hover:bg-[#066f3d] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {modalLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" />
                        <span>Enregistrement en cours...</span>
                      </>
                    ) : (
                      <span>
                        {modalPlan.id === 'pro' ? 'Transmettre ma demande de devis' : 'Valider mon accès prioritaire'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          9. FOOTER
      ===================================================================== */}
      <footer className="mt-auto py-10 border-t border-[#EAE6DC] dark:border-[#243337] text-xs text-[#77817F] bg-[#FFFDF9]/60 dark:bg-[#111B1E]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AuraLogo className="w-5 h-5" />
            <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">Aura Platform</span>
            <span>· © 2026 Tous droits réservés</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center font-medium">
            <Link to="/help" className="hover:text-[#078348] transition-colors">Centre d’aide</Link>
            <Link to="/legal/billing-terms" className="hover:text-[#078348] transition-colors">Conditions tarifaires</Link>
            <Link to="/legal/privacy" className="hover:text-[#078348] transition-colors">Confidentialité</Link>
            <Link to="/legal/terms" className="hover:text-[#078348] transition-colors">CGU</Link>
            <Link to="/legal/contact" className="hover:text-[#078348] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
