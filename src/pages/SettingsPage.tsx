import React, { useState } from 'react';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { useAura } from '../context/AuraContext';
import { AuraLanguage, AuraMode, AuraTheme } from '../shared/types';

export const SettingsPage: React.FC = () => {
  const {
    user,
    theme,
    language,
    updateProfile,
    persistenceInfo,
  } = useAura();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [organization, setOrganization] = useState(user.organization || '');
  const [location, setLocation] = useState(user.location || '');
  const [prefLang, setPrefLang] = useState<AuraLanguage>(language);
  const [prefTheme, setPrefTheme] = useState<AuraTheme>(theme);
  const [defaultMode, setDefaultMode] = useState<AuraMode>(
    user.preferences.defaultMode || 'chat'
  );
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      },
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <WorkspaceLayout
      headerTitle={language === 'en' ? 'Settings & Profile' : 'Paramètres & Compte'}
    >
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#14282D] dark:text-[#F3F2EC]">
            {language === 'en'
              ? 'Account, Preferences & System Architecture'
              : 'Profil, Préférences & Architecture'}
          </h2>
          <p className="text-sm text-[#77817F] mt-1">
            {language === 'en'
              ? 'Manage your personal profile, interface language, and inspect operational capabilities.'
              : 'Gérez votre profil personnel, vos préférences d’interface et consultez l’état opérationnel de la plateforme.'}
          </p>
        </div>

        {savedBanner && (
          <div className="px-4 py-3 rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] border border-[#078348]/30 text-xs font-semibold text-[#078348] dark:text-[#8CCB4A] flex items-center gap-2">
            <i className="fa-solid fa-circle-check" />
            <span>Vos préférences ont été sauvegardées avec succès.</span>
          </div>
        )}

        {/* Profile & Preferences Form */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 space-y-6"
        >
          <div className="flex items-center gap-4 pb-4 border-b border-[#E8E6DE] dark:border-[#243337]">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border border-[#E8E6DE] dark:border-[#243337]"
              />
            ) : (
              <span className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2E8B47] to-[#8CCB4A] text-white font-display font-bold text-lg flex items-center justify-center shrink-0">
                {(user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || 'A').toUpperCase()}
              </span>
            )}
            <div>
              <h3 className="font-display font-bold text-lg text-[#14282D] dark:text-[#F3F2EC]">
                {user.name}
              </h3>
              <p className="text-xs text-[#77817F]">{user.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Rôle / Activité
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Organisation / Université / Studio
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Langue de l’interface
              </label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as AuraLanguage)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              >
                <option value="fr">Français (Langue initiale)</option>
                <option value="en">English (International)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Apparence visuelle
              </label>
              <select
                value={prefTheme}
                onChange={(e) => setPrefTheme(e.target.value as AuraTheme)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              >
                <option value="light">Ivoire chaud (Clair)</option>
                <option value="dark">Obsidienne émeraude (Sombre)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Mode Aura par défaut
              </label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value as AuraMode)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              >
                <option value="chat">Mode 1 — Chat (Général)</option>
                <option value="search">Mode 2 — Recherche Web sourcée</option>
                <option value="code">Mode 3 — Code & Aperçu Web</option>
                <option value="create">Mode 4 — Aura Studio (Création & Idéation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="aura-btn-gradient px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white cursor-pointer"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>

        {/* Transparent Functional Matrix & Documentation (Section 14 & 16) */}
        <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
            État des fonctionnalités & Architecture Technique
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] space-y-2">
              <div className="font-semibold text-[#078348] dark:text-[#8CCB4A] flex items-center gap-2">
                <i className="fa-solid fa-circle-check" />
                <span>Fonctionnalités 100% opérationnelles</span>
              </div>
              <ul className="space-y-1.5 text-[#77817F] list-disc pl-4">
                <li>
                  <strong>4 Modes IA via Google Gemini 3.8 Flash</strong> côté serveur (Chat,
                  Recherche Web avec Google Search Grounding et citations réelles, Code avec aperçu
                  HTML/CSS/JS en direct, Aura Studio).
                </li>
                <li>
                  <strong>Persistance serveur automatique</strong> des conversations, projets,
                  réponses sauvegardées et fichiers joints ({persistenceInfo.description}).
                </li>
                <li>
                  <strong>Contrôle serveur des quotas</strong> et estimation des tokens consommés.
                </li>
                <li>
                  <strong>Authentification locale sécurisée</strong> avec hachage cryptographique{' '}
                  <code>scrypt</code> côté serveur.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] space-y-2">
              <div className="font-semibold text-[#FF790D] flex items-center gap-2">
                <i className="fa-solid fa-sliders" />
                <span>Extensions configurables via variables d’environnement</span>
              </div>
              <ul className="space-y-1.5 text-[#77817F] list-disc pl-4">
                <li>
                  <code>OPENAI_API_KEY</code> : active l’adaptateur serveur OpenAI (GPT-4o) dans le
                  registre multi-fournisseurs.
                </li>
                <li>
                  <code>ANTHROPIC_API_KEY</code> : active l’adaptateur serveur Anthropic Claude.
                </li>
                <li>
                  <code>SUPABASE_URL</code> & <code>SUPABASE_ANON_KEY</code> : bascule la
                  persistance JSON locale vers une base PostgreSQL Supabase externe.
                </li>
                <li>
                  <code>AURA_DAILY_QUOTA</code> : définit le plafond quotidien par défaut au
                  démarrage du serveur.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};
