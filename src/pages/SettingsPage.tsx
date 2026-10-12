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
                <option value="image">Mode 5 — Génération d’Image HD</option>
                <option value="video">Mode 6 — Génération Vidéo & Motion</option>
                <option value="slides">Mode 7 — Présentations Slides 16:9</option>
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

        {/* Supabase PostgreSQL Persistence & Vercel Cloud Sync Panel */}
        <SupabasePersistencePanel description={persistenceInfo.description} />

        {/* Transparent Functional Matrix & Documentation */}
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
                  <strong>5 Modèles Natifs Aura + Multimédia</strong> côté serveur (Chat,
                  Recherche Web sourcée, Code Web, Image HD, Vidéo Veo/Motion, Slides 16:9).
                </li>
                <li>
                  <strong>Persistance hybride Supabase PostgreSQL + Serveur</strong> des
                  conversations, projets, réponses sauvegardées et fichiers joints ({persistenceInfo.description}).
                </li>
                <li>
                  <strong>Contrôle serveur des quotas</strong> et estimation des tokens consommés.
                </li>
                <li>
                  <strong>Authentification sécurisée</strong> avec hachage cryptographique{' '}
                  <code>scrypt</code> et jetons signés HMAC compatibles Vercel Serverless.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] space-y-2">
              <div className="font-semibold text-[#FF790D] flex items-center gap-2">
                <i className="fa-solid fa-sliders" />
                <span>Variables d’environnement (Local & Vercel)</span>
              </div>
              <ul className="space-y-1.5 text-[#77817F] list-disc pl-4">
                <li>
                  <code>SUPABASE_URL</code> & <code>SUPABASE_SERVICE_ROLE_KEY</code> (ou{' '}
                  <code>SUPABASE_ANON_KEY</code>) : active la synchronisation PostgreSQL Supabase.
                </li>
                <li>
                  <code>OPENAI_API_KEY</code> / <code>OPENROUTER_API_KEY</code> : active GPT-4o mini
                  et o3-mini en appel direct.
                </li>
                <li>
                  <code>ANTHROPIC_API_KEY</code> : active Claude 3.5 Haiku et Claude 3.7 Sonnet.
                </li>
                <li>
                  <code>AURA_DAILY_QUOTA</code> : définit le plafond quotidien par défaut.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
};

const SUPABASE_SQL_SCHEMA = `-- AURA WORKSPACE — SCHÉMA POSTGRESQL SUPABASE
CREATE TABLE IF NOT EXISTS public.aura_state_snapshots (
  id TEXT PRIMARY KEY DEFAULT 'global_workspace_v2',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aura_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Membre Aura',
  organization TEXT DEFAULT '',
  location TEXT DEFAULT '',
  plan TEXT DEFAULT 'free',
  auth_provider TEXT DEFAULT 'email',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aura_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#078348',
  icon TEXT DEFAULT 'fa-regular fa-folder-open',
  system_context TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.aura_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

const SupabasePersistencePanel: React.FC<{ description: string }> = ({ description }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const token = localStorage.getItem('aura_session_token_v2');
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus('Synchronisation Supabase PostgreSQL réussie.');
      } else {
        setSyncStatus(
          data.health?.message ||
            data.error ||
            'Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans vos variables d’environnement.'
        );
      }
    } catch {
      setSyncStatus('Impossible de contacter le serveur pour le test Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#FFFDF8] dark:bg-[#152023] border border-[#E8E6DE] dark:border-[#243337] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] flex items-center justify-center">
            <i className="fa-solid fa-database text-sm" />
          </span>
          <div>
            <h3 className="font-display font-bold text-base text-[#14282D] dark:text-[#F3F2EC]">
              Persistance Cloud Supabase PostgreSQL
            </h3>
            <p className="text-xs text-[#77817F]">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FBFAF5] dark:bg-[#1B292D] border border-[#E8E6DE] dark:border-[#243337] hover:border-[#078348] text-xs font-semibold text-[#14282D] dark:text-[#F3F2EC] transition-colors cursor-pointer"
          >
            <i
              className={`fa-solid ${
                copiedSql ? 'fa-check text-[#078348]' : 'fa-copy text-[#77817F]'
              }`}
            />
            <span>
              {copiedSql ? 'Script SQL copié !' : 'Copier le script SQL Supabase'}
            </span>
          </button>

          <button
            type="button"
            disabled={syncing}
            onClick={handleTestSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAF1E8] dark:bg-[#182E24] text-[#078348] dark:text-[#8CCB4A] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid ${syncing ? 'fa-spinner fa-spin' : 'fa-rotate'}`} />
            <span>Tester & Synchroniser Supabase</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[#FBFAF5] dark:bg-[#111B1E] border border-[#E8E6DE] dark:border-[#243337] text-xs text-[#14282D] dark:text-[#F3F2EC]">
          {syncStatus}
        </div>
      )}
    </div>
  );
};

