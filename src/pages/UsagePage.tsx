import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';
import { AURA_PLANS, PlanId, UsageCategory, CATEGORY_UNIT_COSTS } from '../shared/plans';

export const UsagePage: React.FC = () => {
  const { usage, subscription, providers, persistenceInfo, language } = useAura();
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'quotas' | 'ledger' | 'plans' | 'infra'>('quotas');
  const [waitlistFeedback, setWaitlistFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.gateway) {
          setGatewayStatus(d.gateway);
        }
      })
      .catch(() => {});
  }, []);

  const planId: PlanId = (usage?.planId as PlanId) || (subscription?.planId as PlanId) || 'free';
  const plan = AURA_PLANS[planId] || AURA_PLANS.free;

  // Monthly quotas
  const unitsUsed = usage?.monthlyUnitsUsed ?? usage?.requestsUsed ?? 0;
  const unitsLimit = usage?.monthlyUnitsLimit ?? plan.limits.monthlyAIUnits;
  const unitsPct = Math.min(100, Math.round((unitsUsed / unitsLimit) * 100));

  const searchesUsed = usage?.webSearchesUsed ?? usage?.byCategory?.search ?? usage?.byMode?.search ?? 0;
  const searchesLimit = usage?.webSearchesLimit ?? plan.limits.monthlyWebSearches;
  const searchesPct = Math.min(100, Math.round((searchesUsed / searchesLimit) * 100));

  const creationsUsed = usage?.siteCreationsUsed ?? usage?.byCategory?.studio_creation ?? 0;
  const creationsLimit = usage?.siteCreationsLimit ?? plan.limits.monthlySiteCreations;
  const creationsPct = Math.min(100, Math.round((creationsUsed / creationsLimit) * 100));

  const modsUsed = usage?.siteModificationsUsed ?? usage?.byCategory?.studio_modification ?? 0;
  const modsLimit = usage?.siteModificationsLimit ?? plan.limits.monthlySiteModifications;
  const modsPct = Math.min(100, Math.round((modsUsed / modsLimit) * 100));

  const projectsCount = usage?.activeProjectsCount ?? 0;
  const projectsLimit = usage?.maxProjectsLimit ?? plan.limits.maxProjects;
  const projectsPct = Math.min(100, Math.round((projectsCount / projectsLimit) * 100));

  const renewalDate = usage?.periodRenewalDate
    ? new Date(usage.periodRenewalDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '1er du mois prochain';

  const totalTokens = (usage?.estimatedInputTokens || 0) + (usage?.estimatedOutputTokens || 0);

  const isNearLimit = unitsPct >= 80 || creationsPct >= 100 || searchesPct >= 100;
  const isLimitReached = unitsPct >= 100;

  const handleJoinWaitlist = async (targetPlanId: 'plus' | 'pro') => {
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: targetPlanId }),
      });
      const data = await res.json();
      setWaitlistFeedback(
        data.message ||
          'Votre demande a été enregistrée. Vous serez contacté dès l’ouverture de l’abonnement.'
      );
      setTimeout(() => setWaitlistFeedback(null), 5000);
    } catch {
      setWaitlistFeedback('Votre intérêt a été pris en compte pour la liste d’attente.');
      setTimeout(() => setWaitlistFeedback(null), 4000);
    }
  };

  return (
    <WorkspaceLayout
      headerTitle={language === 'en' ? 'Usage & Quotas' : 'Abonnement & Consommation'}
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Header Title with Subtitle and Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
                Architecture Freemium Aura
              </span>
              <span className="text-xs text-[#77817F]">·</span>
              <span className="text-xs text-[#77817F]">Contrôlé côté serveur</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
              Gestion de votre compte & Quotas IA
            </h1>
            <p className="text-xs sm:text-sm text-[#77817F] mt-1">
              Suivez précisément chaque catégorie d'utilisation. Vos données créées restent toujours
              accessibles même si un quota IA est atteint.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] hover:bg-[#E5E0D2] transition-colors"
            >
              <i className="fa-solid fa-tag mr-1.5 text-[#078348] dark:text-[#8CCB4A]" />
              Voir toutes les offres
            </Link>
          </div>
        </div>

        {/* Discrete Notice / Limit Warnings */}
        {isLimitReached ? (
          <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#2C1517] border border-[#FECACA] dark:border-[#5C2327] flex items-start gap-3.5 text-xs text-[#991B1B] dark:text-[#FCA5A5]">
            <i className="fa-solid fa-circle-exclamation text-base shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">
                Quota mensuel d'unités IA atteint (30/30)
              </span>
              <p className="leading-relaxed">
                Vous avez utilisé toutes vos unités IA pour ce cycle. Vos projets, historiques et codes
                enregistrés restent 100% consultables et exportables. Vos quotas seront automatiquement
                réinitialisés le <strong>{renewalDate}</strong>.
              </p>
            </div>
          </div>
        ) : isNearLimit ? (
          <div className="p-4 rounded-2xl bg-[#FFFBEB] dark:bg-[#2D2111] border border-[#FDE68A] dark:border-[#533816] flex items-start gap-3.5 text-xs text-[#92400E] dark:text-[#FCD34D]">
            <i className="fa-solid fa-triangle-exclamation text-base shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Attention : vous approchez d'une limite de consommation</span>
              <p className="leading-relaxed mt-0.5">
                Il vous reste peu d'unités ou de créations pour le mois en cours. Pensez à réutiliser vos
                projets existants ou rejoignez la liste d’attente Aura Plus pour augmenter vos plafonds.
              </p>
            </div>
          </div>
        ) : null}

        {waitlistFeedback && (
          <div className="p-4 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/30 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-sm" />
            <span>{waitlistFeedback}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-[#EAE6DC] dark:border-[#243337] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'quotas'
                ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
            }`}
          >
            <i className="fa-solid fa-chart-pie mr-1.5" />
            Quotas & Consommation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
            }`}
          >
            <i className="fa-solid fa-list-check mr-1.5" />
            Registre d'audit ({usage?.recentLedger?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
            }`}
          >
            <i className="fa-solid fa-crown mr-1.5" />
            Offres & Évolution
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('infra')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              activeTab === 'infra'
                ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                : 'text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC]'
            }`}
          >
            <i className="fa-solid fa-server mr-1.5" />
            Infrastructure & Fournisseurs
          </button>
        </div>

        {/* TAB 1: QUOTAS & CONSUMPTION */}
        {activeTab === 'quotas' && (
          <div className="space-y-6">
            {/* Current Tier Overview Banner */}
            <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#078348]" />
                  <span className="font-display font-bold text-xl text-[#14282D] dark:text-[#F3F2EC]">
                    {plan.name}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-semibold">
                    {plan.badgeFr}
                  </span>
                </div>
                <p className="text-xs text-[#77817F] max-w-xl leading-relaxed">
                  {plan.tagline} Quotas réinitialisés automatiquement chaque mois le <strong>{renewalDate}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#FAF8F2] dark:bg-[#182427] px-4 py-3 rounded-2xl border border-[#EAE6DC]/60 dark:border-[#243337]/60">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-[#77817F] block">
                    Statut compte
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    Actif
                  </span>
                </div>
                <div className="w-px h-6 bg-[#EAE6DC] dark:bg-[#243337]" />
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-[#77817F] block">
                    Renouvellement
                  </span>
                  <span className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    {renewalDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Quota Progress Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Global AI Units */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Unités IA mensuelles
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] flex items-center justify-center">
                    <i className="fa-solid fa-bolt text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {unitsUsed} <span className="text-xs font-normal text-[#77817F]">/ {unitsLimit} unités</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {Math.max(0, unitsLimit - unitsUsed)} restantes
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${unitsPct}%`,
                      backgroundColor: unitsPct >= 100 ? '#DC2626' : unitsPct >= 80 ? '#FF790D' : '#078348',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Chat simple = 1 unité · Création Studio = 3 unités · Slides = 2 unités.
                </p>
              </div>

              {/* Card 2: Web Searches */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Recherches Web (Aura Explore)
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#FFF0D6] dark:bg-[#3D2510] text-[#FF790D] flex items-center justify-center">
                    <i className="fa-solid fa-compass text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {searchesUsed} <span className="text-xs font-normal text-[#77817F]">/ {searchesLimit} recherches</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {Math.max(0, searchesLimit - searchesUsed)} restantes
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${searchesPct}%`,
                      backgroundColor: searchesPct >= 100 ? '#DC2626' : '#FF790D',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Synthèses vérifiées avec sources réelles et citations web indexées.
                </p>
              </div>

              {/* Card 3: New Site Creations */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Nouvelles créations de sites
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#EAE2F8] dark:bg-[#251B38] text-[#7C3AED] flex items-center justify-center">
                    <i className="fa-solid fa-code text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {creationsUsed} <span className="text-xs font-normal text-[#77817F]">/ {creationsLimit} sites</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {Math.max(0, creationsLimit - creationsUsed)} restantes
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${creationsPct}%`,
                      backgroundColor: creationsPct >= 100 ? '#DC2626' : '#7C3AED',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Aura Studio : génération de landing pages, prototypes et applications web.
                </p>
              </div>

              {/* Card 4: Code Modifications */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Modifications & Itérations
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#E2F1F8] dark:bg-[#182C38] text-[#0284C7] flex items-center justify-center">
                    <i className="fa-solid fa-pen-nib text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {modsUsed} <span className="text-xs font-normal text-[#77817F]">/ {modsLimit} itérations</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {Math.max(0, modsLimit - modsUsed)} restantes
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${modsPct}%`,
                      backgroundColor: modsPct >= 100 ? '#DC2626' : '#0284C7',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Affinement du design, retouche de composants et révisions de code.
                </p>
              </div>

              {/* Card 5: Saved Projects */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Projets enregistrés
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#FAF0E4] dark:bg-[#342416] text-[#D97706] flex items-center justify-center">
                    <i className="fa-solid fa-folder-open text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {projectsCount} <span className="text-xs font-normal text-[#77817F]">/ {projectsLimit} max</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    {Math.max(0, projectsLimit - projectsCount)} disponibles
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EFECE2] dark:bg-[#1B292D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${projectsPct}%`,
                      backgroundColor: projectsPct >= 100 ? '#DC2626' : '#D97706',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Conservez vos bibliothèques de contextes et directives projets.
                </p>
              </div>

              {/* Card 6: Estimated Tokens & History */}
              <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#77817F]">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Jetons & Conservation
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] flex items-center justify-center">
                    <i className="fa-solid fa-clock-rotate-left text-xs" />
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-black text-2xl text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                    {totalTokens.toLocaleString()} <span className="text-xs font-normal text-[#77817F]">tokens</span>
                  </span>
                  <span className="text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
                    30 jours rétention
                  </span>
                </div>
                <div className="pt-1 text-xs text-[#77817F] flex items-center justify-between">
                  <span>Entrée : {(usage?.estimatedInputTokens || 0).toLocaleString()}</span>
                  <span>Sortie : {(usage?.estimatedOutputTokens || 0).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-[#77817F]">
                  Modèle natif : Gemini 3.8 Flash optimisé pour une inférence économique.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                  Registre d'audit de consommation (Idempotent & Vérifié)
                </h3>
                <p className="text-xs text-[#77817F] mt-0.5">
                  Chaque opération IA réserve des unités avant l'appel et ne les confirme qu'en cas de succès.
                </p>
              </div>
              <span className="text-xs font-mono text-[#078348] dark:text-[#8CCB4A]">
                {usage?.recentLedger?.length || 0} entrées enregistrées
              </span>
            </div>

            {!usage?.recentLedger || usage.recentLedger.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#77817F] space-y-2">
                <i className="fa-solid fa-receipt text-3xl opacity-40 mb-2" />
                <p>Aucune transaction de consommation enregistrée pour l'instant.</p>
                <p className="text-[11px]">
                  Vos prochaines requêtes de chat, recherche et studio s'afficheront ici avec le décompte exact.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F2] dark:bg-[#182427] text-[#77817F] border-b border-[#EAE6DC] dark:border-[#243337]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date & Heure</th>
                      <th className="py-3 px-4 font-semibold">Catégorie</th>
                      <th className="py-3 px-4 font-semibold">Modèle IA</th>
                      <th className="py-3 px-4 font-semibold">Unités</th>
                      <th className="py-3 px-4 font-semibold">Statut</th>
                      <th className="py-3 px-4 font-semibold">ID Opération</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DC]/60 dark:divide-[#243337]/60 text-[#14282D] dark:text-[#F3F2EC]">
                    {usage.recentLedger.map((entry) => {
                      const isCommitted = entry.status === 'committed';
                      const isReleased = entry.status === 'released';
                      const isReserved = entry.status === 'reserved';

                      return (
                        <tr key={entry.id} className="hover:bg-[#FAF8F2]/60 dark:hover:bg-[#182427]/50">
                          <td className="py-3 px-4 text-[#77817F] whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString(
                              language === 'en' ? 'en-US' : 'fr-FR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium uppercase text-[11px]">
                            {entry.category}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#77817F]">
                            {entry.modelId}
                          </td>
                          <td className="py-3 px-4 font-bold tabular-nums">
                            {entry.unitsDeducted > 0 ? `-${entry.unitsDeducted}` : '0'} unité(s)
                          </td>
                          <td className="py-3 px-4">
                            {isCommitted && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#078348] dark:text-[#8CCB4A]">
                                <i className="fa-solid fa-circle-check text-[10px]" />
                                Validé
                              </span>
                            )}
                            {isReleased && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#77817F]">
                                <i className="fa-solid fa-rotate-left text-[10px]" />
                                Libéré (Erreur)
                              </span>
                            )}
                            {isReserved && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF790D]">
                                <i className="fa-solid fa-spinner fa-spin text-[10px]" />
                                En cours
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-[#77817F] truncate max-w-[140px]">
                            {entry.operationId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANS & UPGRADE */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                  Passerelles de paiement & Prochaines offres
                </h3>
                <p className="text-xs text-[#77817F] mt-1 leading-relaxed max-w-2xl">
                  {gatewayStatus?.statusMessageFr ||
                    'Les paiements réels sont verrouillés pour protéger votre budget. FedaPay et Kkiapay (MTN & Moov Money Bénin) sont prêts à être activés avec vos clés de production.'}
                </p>
              </div>

              {gatewayStatus?.supportedMethodsFr && (
                <div className="bg-white dark:bg-[#152023] p-3.5 rounded-2xl border border-[#EAE6DC]/70 dark:border-[#243337]/70 text-xs space-y-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-[#078348] block">
                    Moyens prévus (Bénin & Ouest Afrique)
                  </span>
                  <ul className="text-[11px] text-[#77817F] list-disc list-inside">
                    {gatewayStatus.supportedMethodsFr.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(AURA_PLANS).map((p) => {
                const isCurrent = p.id === planId;
                return (
                  <div
                    key={p.id}
                    className={`rounded-3xl p-6 border flex flex-col justify-between ${
                      p.id === 'plus'
                        ? 'bg-[#FFFDF9] dark:bg-[#152023] border-[#078348]/40 ring-2 ring-[#078348]/15'
                        : 'bg-[#FFFDF9]/80 dark:bg-[#152023]/80 border-[#EAE6DC] dark:border-[#243337]'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-[#078348] dark:text-[#8CCB4A]">
                          {p.badgeFr}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF2E2] text-[#078348]">
                            Actuel
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-xl text-[#14282D] dark:text-[#F3F2EC]">
                        {p.name}
                      </h4>
                      <div className="text-2xl font-extrabold text-[#14282D] dark:text-[#F3F2EC]">
                        {p.priceDisplayFr}{' '}
                        <span className="text-xs font-normal text-[#77817F]">/ {p.pricePeriodFr}</span>
                      </div>
                      <ul className="space-y-2 text-xs text-[#5A6562] dark:text-[#94A09E] pt-2">
                        {p.featuresFr.slice(0, 5).map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <i className="fa-solid fa-check text-[#078348] text-xs mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-4 border-t border-[#EAE6DC]/60 dark:border-[#243337]/60">
                      {isCurrent ? (
                        <div className="w-full py-2.5 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-xs font-bold text-center text-[#77817F]">
                          Offre active
                        </div>
                      ) : p.id === 'plus' ? (
                        <button
                          type="button"
                          onClick={() => handleJoinWaitlist('plus')}
                          className="w-full py-2.5 rounded-xl aura-btn-gradient text-white text-xs font-bold cursor-pointer"
                        >
                          Préinscription Aura Plus
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinWaitlist('pro')}
                          className="w-full py-2.5 rounded-xl bg-[#EFECE2] dark:bg-[#1B292D] text-xs font-bold text-[#77817F] hover:text-[#14282D] cursor-pointer"
                        >
                          Préinscription Aura Pro
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: INFRASTRUCTURE & FOURNISSEURS */}
        {activeTab === 'infra' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DC] dark:border-[#243337] pb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                    Diagnostic du Serveur & Persistance
                  </h3>
                  <p className="text-xs text-[#77817F]">
                    État de votre backend Express / Serverless Vercel et de la base de données.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#078348] dark:text-[#8CCB4A]">
                  Moteur : {persistenceInfo.engine}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">
                      Google Gemini AI SDK (@google/genai)
                    </span>
                    <span className="text-[#078348] font-bold">Actif côté serveur</span>
                  </div>
                  <p className="text-[11px] text-[#77817F]">
                    Les modèles <code>gemini-3.8-flash</code> et <code>gemini-3.1-flash-lite-preview</code> sont
                    exécutés sur le backend. Aucune clé API n'est exposée au navigateur.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14282D] dark:text-[#F3F2EC]">
                      Base de données Supabase PostgreSQL
                    </span>
                    <span className={persistenceInfo.supabaseConfigured ? 'text-[#078348] font-bold' : 'text-[#D97706] font-bold'}>
                      {persistenceInfo.supabaseConfigured ? 'Connectée' : 'Mode Stateless / Local'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#77817F]">
                    {persistenceInfo.description}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#EAE6DC]/60 dark:divide-[#243337]/60 pt-2">
                {providers.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">{p.name}</span>
                      <span className="text-[#77817F] ml-2 font-mono text-[11px]">{p.envVarName}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        p.configured ? 'text-[#078348]' : 'text-[#D97706]'
                      }`}
                    >
                      {p.configured ? 'Configuré & Actif' : 'Non configuré'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
};
