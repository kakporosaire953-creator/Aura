import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';
import { AuraLanguage, AuraMode, AuraTheme } from '../shared/types';
import { AURA_PLANS } from '../shared/plans';

type SettingsTab =
  | 'account'
  | 'preferences'
  | 'personalization'
  | 'privacy'
  | 'security'
  | 'billing'
  | 'notifications'
  | 'integrations';

export const SettingsPage: React.FC = () => {
  const {
    user,
    theme,
    language,
    updateProfile,
    persistenceInfo,
    usage,
    subscription,
    reducedMotion,
    toggleReducedMotion,
    exportUserData,
    clearUserHistory,
    deleteUserAccount,
    updateCustomInstructions,
    logout,
  } = useAura();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account Form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [organization, setOrganization] = useState(user.organization || '');
  const [location, setLocation] = useState(user.location || '');

  // Preferences state
  const [prefLang, setPrefLang] = useState<AuraLanguage>(language);
  const [prefTheme, setPrefTheme] = useState<AuraTheme>(theme);
  const [defaultMode, setDefaultMode] = useState<AuraMode>(
    user.preferences.defaultMode || 'chat'
  );

  // Custom instructions / Memory state
  const [customInstructions, setCustomInstructions] = useState(
    user.preferences.customInstructions || ''
  );
  const [savingInstructions, setSavingInstructions] = useState(false);

  // Notifications state
  const [secAlerts] = useState(true); // Mandatory security alerts
  const [prodUpdates, setProdUpdates] = useState(
    user.preferences.notifications?.productUpdates ?? true
  );
  const [weeklyDigest, setWeeklyDigest] = useState(
    user.preferences.notifications?.weeklyDigest ?? false
  );

  // Modals & Banners
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        email,
        role,
        organization,
        location,
        preferences: {
          ...user.preferences,
          language: prefLang,
          theme: prefTheme,
          defaultMode,
          reducedMotion,
          notifications: {
            securityAlerts: secAlerts,
            productUpdates: prodUpdates,
            weeklyDigest,
          },
        },
      });
      showFeedback('success', 'Vos informations et préférences ont été enregistrées.');
    } catch {
      showFeedback('error', 'Erreur lors de la mise à jour du profil.');
    }
  };

  const handleSaveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInstructions(true);
    const ok = await updateCustomInstructions(customInstructions);
    setSavingInstructions(false);
    if (ok) {
      showFeedback('success', 'Directives de personnalisation et mémoire mises à jour.');
    } else {
      showFeedback('error', 'Impossible d’enregistrer vos directives.');
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    const result = await clearUserHistory();
    setClearingHistory(false);
    setClearHistoryModalOpen(false);
    if (result.ok) {
      showFeedback('success', result.message || 'Historique de chat effacé avec succès.');
    } else {
      showFeedback('error', 'Erreur lors de la suppression de l’historique.');
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      await exportUserData();
      showFeedback('success', 'Téléchargement de vos données personnelles au format JSON terminé.');
    } catch {
      showFeedback('error', 'Impossible de préparer l’archive de vos données.');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      showFeedback('error', 'L’adresse e-mail saisie ne correspond pas à votre compte.');
      return;
    }
    setDeletingAccount(true);
    const result = await deleteUserAccount(deleteConfirmEmail.trim());
    setDeletingAccount(false);
    if (result.ok) {
      setDeleteAccountModalOpen(false);
      navigate('/login?deleted=1', { replace: true });
    } else {
      showFeedback('error', result.error || 'Impossible de supprimer le compte.');
    }
  };

  const planId = subscription?.planId || user.plan || 'free';
  const plan = AURA_PLANS[planId] || AURA_PLANS.free;

  const renewalDate = usage?.periodRenewalDate
    ? new Date(usage.periodRenewalDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '1er du mois prochain';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Récemment';

  return (
    <WorkspaceLayout
      headerTitle={language === 'en' ? 'Settings & Preferences' : 'Paramètres & Préférences'}
    >
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Page Title & Intro */}
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#14282D] dark:text-[#F3F2EC]">
            Paramètres du compte & Plateforme
          </h1>
          <p className="text-xs sm:text-sm text-[#77817F] mt-1">
            Gérez vos informations personnelles, votre mémoire IA, la confidentialité de vos données et vos préférences d’interface.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
              feedback.type === 'success'
                ? 'bg-[#EAF2E2] dark:bg-[#182E24] border-[#078348]/30 text-[#078348] dark:text-[#8CCB4A]'
                : 'bg-[#FEF2F2] dark:bg-[#2C1517] border-[#FECACA] dark:border-[#5C2327] text-[#991B1B] dark:text-[#FCA5A5]'
            }`}
          >
            <i
              className={`fa-solid ${
                feedback.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'
              }`}
            />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Layout: Sidebar Tabs + Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Settings Sidebar Navigation */}
          <nav
            aria-label="Sections des paramètres"
            className="md:col-span-1 rounded-2xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-2 space-y-1 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-regular fa-user w-4 text-center text-xs" />
              <span>Compte</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-sliders w-4 text-center text-xs" />
              <span>Préférences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('personalization')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'personalization'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-brain w-4 text-center text-xs" />
              <span>Personnalisation & Mémoire</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-shield-halved w-4 text-center text-xs" />
              <span>Confidentialité & Données</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-lock w-4 text-center text-xs" />
              <span>Sécurité & Sessions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-crown w-4 text-center text-xs text-[#EACB37]" />
              <span>Abonnement & Quotas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-regular fa-bell w-4 text-center text-xs" />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeTab === 'integrations'
                  ? 'bg-[#14282D] text-white dark:bg-[#F3F2EC] dark:text-[#14282D]'
                  : 'text-[#5A6562] dark:text-[#94A09E] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D] hover:text-[#14282D]'
              }`}
            >
              <i className="fa-solid fa-network-wired w-4 text-center text-xs" />
              <span>Applications connectées</span>
            </button>

            <div className="pt-2 border-t border-[#EAE6DC]/60 dark:border-[#243337] mt-2 space-y-0.5">
              <Link
                to="/help"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]"
              >
                <i className="fa-solid fa-circle-question w-4 text-center text-xs text-[#078348] dark:text-[#8CCB4A]" />
                <span>Centre d’aide Aura</span>
              </Link>
              <Link
                to="/legal/privacy"
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]"
              >
                <i className="fa-solid fa-shield-halved w-4 text-center text-xs text-[#77817F]" />
                <span>Confidentialité &amp; RGPD</span>
              </Link>
              <Link
                to="/legal/terms"
                className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#77817F] hover:text-[#14282D] dark:hover:text-[#F3F2EC] hover:bg-[#F4F2EA] dark:hover:bg-[#1B292D]"
              >
                <i className="fa-solid fa-file-contract w-4 text-center text-xs text-[#77817F]" />
                <span>Conditions d’utilisation</span>
              </Link>
            </div>
          </nav>

          {/* Tab Content Panel */}
          <div className="md:col-span-3">
            {/* 1. COMPTE */}
            {activeTab === 'account' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6"
              >
                <div className="flex items-center gap-4 pb-5 border-b border-[#EAE6DC] dark:border-[#243337]">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border border-[#EAE6DC] dark:border-[#243337]"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2E8B47] to-[#8CCB4A] text-white font-display font-bold text-xl flex items-center justify-center shrink-0">
                      {(user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || 'A').toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h2 className="font-display font-bold text-xl text-[#14282D] dark:text-[#F3F2EC]">
                      {user.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-[#77817F] mt-0.5">
                      <span className="font-mono">{user.email}</span>
                      <span>·</span>
                      <span className="capitalize">{user.authProvider || 'Email'}</span>
                      <span>·</span>
                      <span>Membre depuis : {memberSince}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] focus:outline-none focus:border-[#078348]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Adresse e-mail du compte
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] focus:outline-none focus:border-[#078348]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Rôle / Activité principale
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Ex : Développeur, Chercheur, Créateur"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] focus:outline-none focus:border-[#078348]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Organisation ou Studio
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Nom de votre entreprise ou université"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] focus:outline-none focus:border-[#078348]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Localisation (Pays / Ville)
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex : Cotonou, Bénin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] focus:outline-none focus:border-[#078348]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DC]/60 dark:border-[#243337] flex items-center justify-between">
                  <span className="text-[11px] text-[#77817F]">
                    Données protégées et isolées pour votre identifiant unique ({user.id})
                  </span>
                  <button
                    type="submit"
                    className="aura-btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            )}

            {/* 2. PRÉFÉRENCES */}
            {activeTab === 'preferences' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Préférences d’interface & Comportement
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5">
                    Personnalisez votre expérience visuelle et la langue par défaut d’Aura.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Langue de l’interface
                    </label>
                    <select
                      value={prefLang}
                      onChange={(e) => setPrefLang(e.target.value as AuraLanguage)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337]"
                    >
                      <option value="fr">Français (Langue principale)</option>
                      <option value="en">English (International)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Thème visuel officiel
                    </label>
                    <select
                      value={prefTheme}
                      onChange={(e) => setPrefTheme(e.target.value as AuraTheme)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337]"
                    >
                      <option value="light">Ivoire chaud (Fond officiel clair)</option>
                      <option value="dark">Obsidienne émeraude (Fond sombre)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1.5">
                      Mode Aura par défaut à l’ouverture du Workspace
                    </label>
                    <select
                      value={defaultMode}
                      onChange={(e) => setDefaultMode(e.target.value as AuraMode)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337]"
                    >
                      <option value="chat">Aura Chat (Général & Raisonnement)</option>
                      <option value="search">Aura Explore (Recherche web sourcée)</option>
                      <option value="code">Aura Code (Éditeur & Aperçu web)</option>
                      <option value="create">Aura Studio (Création complète de sites)</option>
                      <option value="image">Aura Image (Génération visuelle HD)</option>
                      <option value="video">Aura Video (Clips Veo & Motion)</option>
                      <option value="slides">Aura Slides (Présentations 16:9)</option>
                    </select>
                  </div>

                  {/* Switch Animations Réduites (Accessibility) */}
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/70 dark:border-[#243337] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                        Animations réduites (Accessibilité)
                      </span>
                      <p className="text-[11px] text-[#77817F] mt-0.5">
                        Désactive les transitions animées lourdes pour soulager les appareils modestes et améliorer le confort visuel.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={toggleReducedMotion}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E0D2] dark:bg-[#243337] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E0D2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#078348]" />
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DC]/60 dark:border-[#243337] flex justify-end">
                  <button
                    type="submit"
                    className="aura-btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  >
                    Enregistrer les préférences
                  </button>
                </div>
              </form>
            )}

            {/* 3. PERSONNALISATION ET MÉMOIRE */}
            {activeTab === 'personalization' && (
              <form
                onSubmit={handleSaveInstructions}
                className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#078348]" />
                    <span className="text-xs font-bold uppercase text-[#078348] dark:text-[#8CCB4A]">
                      Mémoire Active & Directives Persistantes
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Directives personnalisées pour Aura
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5 leading-relaxed">
                    Indiquez à Aura comment vous souhaitez qu'il vous réponde à chaque nouvelle session (ton, langage de programmation favori, contexte métier). Ces directives sont stockées de façon sécurisée et injectées côté serveur dans le contexte de raisonnement.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                    Mes instructions système personnalisées
                  </label>
                  <textarea
                    rows={6}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Exemple : 'Je développe principalement en React, TypeScript et Tailwind CSS. Réponds de façon concise, en français, avec du code directement exécutable sans commentaires superflus.'"
                    className="w-full p-3.5 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] text-xs leading-relaxed focus:outline-none focus:border-[#078348]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#77817F]">
                    <span>{customInstructions.length} caractères</span>
                    <button
                      type="button"
                      onClick={() => setCustomInstructions('')}
                      className="hover:underline text-[#DC2626]"
                    >
                      Effacer les directives
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337] text-xs space-y-1.5">
                  <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] flex items-center gap-1.5">
                    <i className="fa-solid fa-lock text-[10px] text-[#078348]" />
                    Contrôle éthique de la mémoire
                  </span>
                  <p className="text-[11px] text-[#77817F] leading-snug">
                    Aura n'utilise jamais vos directives ou vos conversations privées pour entraîner de futurs modèles tiers. Vous pouvez modifier ou réinitialiser ces instructions à tout moment.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAE6DC]/60 dark:border-[#243337] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingInstructions}
                    className="aura-btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer disabled:opacity-60"
                  >
                    {savingInstructions ? 'Enregistrement...' : 'Sauvegarder les directives'}
                  </button>
                </div>
              </form>
            )}

            {/* 4. CONFIDENTIALITÉ ET DONNÉES */}
            {activeTab === 'privacy' && (
              <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Confidentialité, Portabilité & Droit à l’effacement
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5">
                    Téléchargez l'intégralité de vos données ou supprimez définitivement vos contenus.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Action 1: Export Data */}
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-[#14282D] dark:text-[#F3F2EC] block">
                        Exporter l'intégralité de mes données (Portabilité)
                      </span>
                      <p className="text-[11px] text-[#77817F] max-w-md leading-relaxed">
                        Génère une archive JSON structurée contenant votre profil, toutes vos conversations, le code généré dans Studio, vos projets et votre historique d’usage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={exportingData}
                      className="px-4 py-2 rounded-xl bg-[#14282D] hover:bg-[#233F46] dark:bg-[#F3F2EC] dark:hover:bg-white text-white dark:text-[#14282D] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <i className="fa-solid fa-download mr-1.5" />
                      {exportingData ? 'Préparation...' : 'Exporter en JSON'}
                    </button>
                  </div>

                  {/* Action 2: Clear Chat History */}
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-[#14282D] dark:text-[#F3F2EC] block">
                        Vider l'historique des conversations
                      </span>
                      <p className="text-[11px] text-[#77817F] max-w-md leading-relaxed">
                        Supprime toutes vos discussions et réponses de chat enregistrées. Vos projets créés dans Aura Projects ne sont pas affectés.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClearHistoryModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#FFF0F0] dark:bg-[#2C1517] border border-[#FECACA] dark:border-[#5C2327] text-[#DC2626] text-xs font-semibold whitespace-nowrap hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    >
                      <i className="fa-regular fa-trash-can mr-1.5" />
                      Vider l'historique
                    </button>
                  </div>

                  {/* Action 3: Delete Account Permanently */}
                  <div className="p-4 rounded-2xl bg-[#FEF2F2] dark:bg-[#2C1517] border border-[#FECACA] dark:border-[#5C2327] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-[#991B1B] dark:text-[#FCA5A5] block">
                        Zone de danger — Suppression définitive du compte
                      </span>
                      <p className="text-[11px] text-[#7F1D1D] dark:text-[#F87171] max-w-md leading-relaxed">
                        Efface de façon irréversible votre compte, vos sessions, projets, fichiers et quotas. Cette action ne peut pas être annulée.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmEmail('');
                        setDeleteAccountModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shadow-sm"
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#77817F] flex items-center gap-2">
                  <i className="fa-solid fa-file-contract text-xs text-[#078348]" />
                  <span>
                    Consultez notre{' '}
                    <Link to="/legal/privacy" className="underline font-medium text-[#078348]">
                      Politique de confidentialité
                    </Link>{' '}
                    pour connaître les règles de conservation et de sécurité appliquées.
                  </span>
                </div>
              </div>
            )}

            {/* 5. SÉCURITÉ ET SESSIONS */}
            {activeTab === 'security' && (
              <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Sécurité, Authentification & Sessions Actives
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5">
                    Vérifiez comment vos identifiants sont protégés et gérez votre session active.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                        Méthode de connexion actuelle
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2E2] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] font-bold text-[11px] capitalize">
                        {user.authProvider === 'google'
                          ? 'Compte Google'
                          : user.authProvider === 'github'
                          ? 'Compte GitHub'
                          : 'Adresse e-mail & Mot de passe'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#77817F] leading-relaxed">
                      {user.authProvider === 'email'
                        ? 'Votre mot de passe est sécurisé côté serveur avec un hachage cryptographique scrypt et un sel unique par utilisateur. Il n’est jamais stocké en clair.'
                        : 'Authentification déléguée gérée en toute sécurité via le fournisseur tiers.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                        Protection des sessions (Stateless HMAC & Vercel)
                      </span>
                      <span className="font-mono text-[11px] text-[#078348]">Actif</span>
                    </div>
                    <p className="text-[11px] text-[#77817F] leading-relaxed">
                      Votre session utilise des jetons cryptographiques signés HMAC avec secret serveur pour fonctionner sans perte de données sur les conteneurs et fonctions Serverless.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC]/70 dark:border-[#243337] space-y-1.5">
                    <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-xs text-[#FF790D]" />
                      Authentification à deux facteurs (2FA)
                    </span>
                    <p className="text-[11px] text-[#77817F] leading-snug">
                      La double authentification (TOTP / SMS) n'est pas encore déployée en production sur le backend Aura. Aucune simulation fictive n'est affichée.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DC]/60 dark:border-[#243337] flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate('/login', { replace: true });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#FEF2F2] dark:bg-[#2C1517] text-[#DC2626] border border-[#FECACA] text-xs font-semibold hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket mr-1.5" />
                    Déconnecter cette session
                  </button>
                </div>
              </div>
            )}

            {/* 6. ABONNEMENT ET UTILISATION */}
            {activeTab === 'billing' && (
              <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                      Formule d'abonnement & Quotas
                    </h3>
                    <p className="text-xs text-[#77817F] mt-0.5">
                      Contrôlé en direct depuis le serveur Aura.
                    </p>
                  </div>
                  <Link
                    to="/settings/usage"
                    className="aura-btn-gradient px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                  >
                    Tableau de bord complet
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8F2] dark:bg-[#182427] border border-[#EAE6DC] dark:border-[#243337] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-xl text-[#14282D] dark:text-[#F3F2EC]">
                        {plan.name}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF2E2] text-[#078348]">
                        {plan.badgeFr}
                      </span>
                    </div>
                    <p className="text-xs text-[#77817F]">{plan.tagline}</p>
                    <p className="text-[11px] text-[#77817F] mt-1">
                      Prochain renouvellement des quotas : <strong>{renewalDate}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-extrabold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
                      {plan.priceDisplayFr}
                    </span>
                    <span className="text-xs text-[#77817F] block">/ {plan.pricePeriodFr}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/70 dark:border-[#243337]">
                    <span className="text-[#77817F] block">Unités IA</span>
                    <span className="font-bold text-base text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                      {usage?.monthlyUnitsUsed ?? 0} / {plan.limits.monthlyAIUnits}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/70 dark:border-[#243337]">
                    <span className="text-[#77817F] block">Recherches</span>
                    <span className="font-bold text-base text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                      {usage?.webSearchesUsed ?? 0} / {plan.limits.monthlyWebSearches}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/70 dark:border-[#243337]">
                    <span className="text-[#77817F] block">Créations Studio</span>
                    <span className="font-bold text-base text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                      {usage?.siteCreationsUsed ?? 0} / {plan.limits.monthlySiteCreations}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC]/70 dark:border-[#243337]">
                    <span className="text-[#77817F] block">Projets max</span>
                    <span className="font-bold text-base text-[#14282D] dark:text-[#F3F2EC] tabular-nums">
                      {usage?.activeProjectsCount ?? 0} / {plan.limits.maxProjects}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <Link to="/pricing" className="font-semibold text-[#078348] underline">
                    Comparer avec Aura Plus et Aura Pro
                  </Link>
                  <Link
                    to="/settings/usage"
                    className="text-[#5A6562] dark:text-[#94A09E] hover:underline"
                  >
                    Voir le registre d’audit des unités →
                  </Link>
                </div>
              </div>
            )}

            {/* 7. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Gestion des alertes & Communications
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5">
                    Distinguez les alertes opérationnelles indispensables des messages facultatifs.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC]">
                          Alertes de sécurité & Notifications de compte
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF2E2] text-[#078348]">
                          Obligatoire
                        </span>
                      </div>
                      <p className="text-[11px] text-[#77817F] mt-0.5">
                        Alertes en cas de connexion suspecte, réinitialisation de mot de passe ou avis de sécurité important.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#078348]">Toujours actif</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                        Nouveautés produits et mises à jour Aura
                      </span>
                      <p className="text-[11px] text-[#77817F] mt-0.5">
                        Informations sur les nouveaux modèles IA, les capacités multimédias et les tutoriels.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodUpdates}
                        onChange={(e) => setProdUpdates(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E0D2] dark:bg-[#243337] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E0D2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#078348]" />
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                        Récapitulatif hebdomadaire de consommation
                      </span>
                      <p className="text-[11px] text-[#77817F] mt-0.5">
                        Synthèse de votre activité et du solde de vos quotas IA par e-mail.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyDigest}
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E0D2] dark:bg-[#243337] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5E0D2] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#078348]" />
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE6DC]/60 dark:border-[#243337] flex justify-end">
                  <button
                    type="submit"
                    className="aura-btn-gradient px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  >
                    Enregistrer les préférences de notification
                  </button>
                </div>
              </form>
            )}

            {/* 8. APPLICATIONS CONNECTÉES */}
            {activeTab === 'integrations' && (
              <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 sm:p-7 shadow-sm space-y-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                    Applications connectées & Intégrations réelles
                  </h3>
                  <p className="text-xs text-[#77817F] mt-0.5">
                    État des services connectés à votre compte et à la plateforme Aura.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Google Gemini AI */}
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#EAF2E2] text-[#078348] flex items-center justify-center font-bold text-xs">
                        <i className="fa-solid fa-brain" />
                      </span>
                      <div>
                        <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                          Google Gemini AI SDK (@google/genai)
                        </span>
                        <p className="text-[11px] text-[#77817F]">
                          Fournisseur natif pour les modèles Flash, Pro, Explore et Studio.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF2E2] text-[#078348] font-bold text-[11px]">
                      Connecté côté serveur
                    </span>
                  </div>

                  {/* Supabase PostgreSQL & Auth */}
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#E2F1F8] text-[#0284C7] flex items-center justify-center font-bold text-xs">
                        <i className="fa-solid fa-database" />
                      </span>
                      <div>
                        <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                          Base de données Supabase PostgreSQL
                        </span>
                        <p className="text-[11px] text-[#77817F]">
                          {persistenceInfo.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        persistenceInfo.supabaseConfigured
                          ? 'bg-[#EAF2E2] text-[#078348]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}
                    >
                      {persistenceInfo.supabaseConfigured ? 'Synchronisé' : 'Mode local'}
                    </span>
                  </div>

                  {/* West Africa Payment Gateways */}
                  <div className="p-4 rounded-2xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#EAE6DC] dark:border-[#243337] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#FFF0D6] text-[#FF790D] flex items-center justify-center font-bold text-xs">
                        <i className="fa-solid fa-money-bill-wave" />
                      </span>
                      <div>
                        <span className="font-semibold text-[#14282D] dark:text-[#F3F2EC] block">
                          Passerelles Mobile Money (FedaPay & Kkiapay Bénin)
                        </span>
                        <p className="text-[11px] text-[#77817F]">
                          Adaptateur cryptographique HMAC prêt pour MTN MoMo et Moov Money.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE2] text-[#77817F] font-bold text-[11px]">
                      Prêt pour déploiement
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Clear Chat History */}
      {clearHistoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs"
          onClick={() => setClearHistoryModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#EAE6DC] dark:border-[#243337] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#FFF0F0] text-[#DC2626] flex items-center justify-center shrink-0">
                <i className="fa-regular fa-trash-can text-lg" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
                  Vider l'historique de chat ?
                </h3>
                <p className="text-xs text-[#77817F]">
                  Cette action supprimera toutes vos conversations enregistrées.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
              Vos projets créés dans <strong>Aura Projects</strong> et vos fichiers dans la bibliothèque restent sauvegardés. Seul l'historique des discussions sera vidé.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClearHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A6562] hover:bg-[#EFECE2] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearingHistory}
                className="px-5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {clearingHistory ? 'Suppression...' : 'Confirmer le vidage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account Permanently */}
      {deleteAccountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setDeleteAccountModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#FFFDF9] dark:bg-[#152023] border border-[#FECACA] dark:border-[#5C2327] p-6 sm:p-7 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-lg" />
              </span>
              <div>
                <h3 className="font-display font-bold text-base text-[#991B1B] dark:text-[#FCA5A5]">
                  Suppression irréversible du compte
                </h3>
                <p className="text-xs text-[#77817F]">
                  Cette opération efface immédiatement toutes vos données.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5A6562] dark:text-[#94A09E] leading-relaxed">
              Pour confirmer la suppression définitive de votre compte et de l'ensemble de vos conversations, projets et quotas, veuillez saisir votre adresse e-mail exacte (<strong>{user.email}</strong>) :
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 pt-1">
              <input
                type="email"
                required
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#FECACA] dark:border-[#5C2327] text-xs focus:outline-none focus:border-[#DC2626]"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A6562] hover:bg-[#EFECE2] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    deletingAccount ||
                    deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  {deletingAccount ? 'Suppression en cours...' : 'Supprimer définitivement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
};
