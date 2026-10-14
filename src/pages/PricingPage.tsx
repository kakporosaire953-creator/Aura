import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuraLogo } from '../components/brand/AuraLogo';
import { useAura } from '../context/AuraContext';
import { AURA_PLANS, PlanDefinition, PlanId } from '../shared/plans';

export const PricingPage: React.FC = () => {
  const { user, isAuthenticated, language } = useAura();
  const [waitlistModalPlan, setWaitlistModalPlan] = useState<PlanDefinition | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');

  const plans = Object.values(AURA_PLANS);

  const handleJoinWaitlist = (plan: PlanDefinition) => {
    setWaitlistModalPlan(plan);
    setWaitlistSuccess(false);
    setWaitlistEmail(user?.email || '');
  };

  const submitWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistSuccess(true);
    setTimeout(() => {
      setWaitlistModalPlan(null);
      setWaitlistSuccess(false);
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] dark:bg-[#0E1618] text-[#14282D] dark:text-[#F3F2EC] flex flex-col font-sans transition-colors selection:bg-[#8CCB4A]/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF8F2]/90 dark:bg-[#0E1618]/90 border-b border-[#EAE6DC] dark:border-[#243337]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <AuraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-xl tracking-tight text-[#14282D] dark:text-[#F3F2EC]">
              Aura
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-sm">
            <Link
              to="/"
              className="text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] transition-colors"
            >
              Accueil
            </Link>
            <Link
              to="/pricing"
              className="font-semibold text-[#078348] dark:text-[#8CCB4A] transition-colors"
            >
              Tarifs & Quotas
            </Link>

            {isAuthenticated ? (
              <Link
                to="/app"
                className="aura-btn-gradient px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm hover:shadow transition-all"
              >
                Mon Espace Aura
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
                  className="aura-btn-gradient px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm hover:shadow transition-all"
                >
                  Essayer Gratuitement
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/20 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A]">
          <span className="w-2 h-2 rounded-full bg-[#078348] animate-pulse" />
          <span>Modèle Freemium Équitable & Transparent</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#14282D] dark:text-[#F3F2EC] tracking-tight leading-tight">
          Explorez Aura librement.{' '}
          <span className="bg-gradient-to-r from-[#078348] via-[#8CCB4A] to-[#FF790D] bg-clip-text text-transparent">
            Évoluez sans surprise.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#5A6562] dark:text-[#94A09E] max-w-2xl mx-auto leading-relaxed">
          Chaque compte dispose de quotas généreux gratuits renouvelés chaque mois pour utiliser Aura Chat,
          Aura Explore, Aura Studio et sauvegarder vos projets. Pas de carte requise à l’inscription.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isFree = plan.id === 'free';
            const isPlus = plan.id === 'plus';
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all border ${
                  isPlus
                    ? 'bg-[#FFFDF9] dark:bg-[#152023] border-[#078348]/40 dark:border-[#8CCB4A]/40 shadow-xl ring-2 ring-[#078348]/15'
                    : 'bg-[#FFFDF9]/80 dark:bg-[#152023]/80 border-[#EAE6DC] dark:border-[#243337] shadow-sm'
                }`}
              >
                {/* Popular / Recommended Pill */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#078348] to-[#8CCB4A] text-white text-xs font-bold shadow-md uppercase tracking-wider">
                    {language === 'en' ? 'Recommended' : 'Recommandé'}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Header of Card */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#078348] dark:text-[#8CCB4A]">
                        {plan.badgeFr}
                      </span>
                      {isFree && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A]">
                          Actif par défaut
                        </span>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
                      {plan.name}
                    </h2>
                    <p className="text-xs text-[#77817F] mt-1.5 min-h-[32px] leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 pb-4 border-b border-[#EAE6DC]/80 dark:border-[#243337]">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#14282D] dark:text-[#F3F2EC]">
                        {plan.priceDisplayFr}
                      </span>
                      <span className="text-xs text-[#77817F]">/ {plan.pricePeriodFr}</span>
                    </div>
                    <p className="text-[11px] text-[#77817F] mt-1.5 italic">
                      {plan.statusNoteFr}
                    </p>
                  </div>

                  {/* Key Quotas Summary */}
                  <div className="space-y-2.5 bg-[#FAF8F2] dark:bg-[#182427] p-4 rounded-2xl border border-[#EAE6DC]/60 dark:border-[#243337]/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Unités IA par mois</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.monthlyAIUnits} unités
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Recherches sourcées</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.monthlyWebSearches} / mois
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Créations de sites web</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.monthlySiteCreations} / mois
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Modifications de code</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.monthlySiteModifications} / mois
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Projets enregistrés</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.maxProjects} simultanés
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5A6562] dark:text-[#94A09E]">Rétention historique</span>
                      <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                        {plan.limits.historyRetentionDays} jours
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#77817F]">
                      Inclus dans cette offre :
                    </span>
                    <ul className="space-y-2 text-xs text-[#3D4A47] dark:text-[#C5CECB]">
                      {plan.featuresFr.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <i className="fa-solid fa-check text-[#078348] dark:text-[#8CCB4A] text-xs mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-8 mt-6 border-t border-[#EAE6DC]/60 dark:border-[#243337]/60">
                  {isFree ? (
                    <Link
                      to={isAuthenticated ? '/app' : '/register'}
                      className="w-full py-3 px-4 rounded-2xl bg-[#14282D] hover:bg-[#203D45] dark:bg-[#F3F2EC] dark:hover:bg-white text-white dark:text-[#14282D] text-xs font-bold text-center block transition-colors shadow-sm"
                    >
                      {isAuthenticated ? 'Accéder à mon espace' : 'Commencer gratuitement'}
                    </Link>
                  ) : isPlus ? (
                    <button
                      type="button"
                      onClick={() => handleJoinWaitlist(plan)}
                      className="w-full py-3 px-4 rounded-2xl aura-btn-gradient text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Rejoindre la liste d’attente Aura Plus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoinWaitlist(plan)}
                      className="w-full py-3 px-4 rounded-2xl bg-[#EFECE2] dark:bg-[#1B292D] text-[#5A6562] dark:text-[#94A09E] hover:text-[#14282D] dark:hover:text-[#F3F2EC] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Être notifié du lancement Aura Pro
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparency & Ethical AI Note */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-[#FAF8F2] dark:bg-[#131E21] border border-[#EAE6DC] dark:border-[#243337] max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#FFF0D6] dark:bg-[#3D2510] text-[#FF790D] flex items-center justify-center shrink-0">
              <i className="fa-solid fa-shield-halved text-base" />
            </span>
            <div>
              <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                Politique de transparence & Protection du budget
              </h3>
              <p className="text-xs text-[#77817F]">
                Comment fonctionne la gestion équitable des quotas sur Aura.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337]/70 space-y-1">
              <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block">
                1. Débit après succès
              </span>
              <span>
                Les unités d’usage ne sont confirmées que si la réponse IA est générée avec succès. En cas
                d’erreur fournisseur ou réseau, les unités réservées sont immédiatement libérées.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337]/70 space-y-1">
              <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block">
                2. Vos données restent accessibles
              </span>
              <span>
                Même si vous atteignez votre quota mensuel d’unités IA, vous pouvez continuer à consulter vos
                projets, exporter vos fichiers de code et relire votre historique sans blocage.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337]/70 space-y-1">
              <span className="font-bold text-[#14282D] dark:text-[#F3F2EC] block">
                3. Moyens de paiement locaux
              </span>
              <span>
                Pour la future offre Aura Plus, nous préparons l’intégration native des passerelles africaines
                (MTN Mobile Money, Moov Money via FedaPay / Kkiapay) en plus des cartes bancaires.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Modal */}
      {waitlistModalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          onClick={() => setWaitlistModalPlan(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#FFF0D6] text-[#FF790D] flex items-center justify-center">
                  <i className="fa-solid fa-bell text-sm" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    {waitlistModalPlan.name}
                  </h3>
                  <span className="text-xs text-[#77817F]">Liste d’attente officielle</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaitlistModalPlan(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#77817F] hover:bg-[#EFECE2] dark:hover:bg-[#1B292D] transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {waitlistSuccess ? (
              <div className="p-4 rounded-2xl bg-[#EAF2E2] dark:bg-[#182E24] border border-[#078348]/30 text-center space-y-2">
                <i className="fa-solid fa-circle-check text-2xl text-[#078348] dark:text-[#8CCB4A]" />
                <h4 className="font-bold text-sm text-[#078348] dark:text-[#8CCB4A]">
                  Inscription enregistrée !
                </h4>
                <p className="text-xs text-[#14282D] dark:text-[#F3F2EC]">
                  Merci de votre intérêt. Vous recevrez une notification prioritaire dès l’activation des
                  abonnements Aura Plus avec vos options de paiement préférées.
                </p>
              </div>
            ) : (
              <form onSubmit={submitWaitlist} className="space-y-4">
                <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
                  L’offre <strong>{waitlistModalPlan.name}</strong> est actuellement en cours de finalisation
                  pour garantir les coûts d’inférence les plus justes. Laissez votre adresse pour accéder au tarif
                  de lancement préférentiel.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Votre adresse e-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-xs focus:outline-none focus:border-[#078348]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl aura-btn-gradient text-white text-xs font-bold cursor-pointer"
                  >
                    Valider mon inscription prioritaire
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-[#EAE6DC] dark:border-[#243337] text-center text-xs text-[#77817F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AuraLogo className="w-5 h-5" />
            <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">Aura Platform</span>
            <span>· Tous droits réservés</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:underline">
              Accueil
            </Link>
            <Link to="/pricing" className="hover:underline">
              Tarifs
            </Link>
            <Link to="/app" className="hover:underline">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
