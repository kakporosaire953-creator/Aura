-- =============================================================================
-- AURA WORKSPACE — SCHÉMA POSTGRESQL SUPABASE COMPLET
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase (SQL Editor)
-- =============================================================================

-- 1. Table principale de synchronisation rapide (State & Cold-Start Serverless Vercel)
CREATE TABLE IF NOT EXISTS public.aura_state_snapshots (
  id TEXT PRIMARY KEY DEFAULT 'global_workspace_v2',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table des profils utilisateurs Aura
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

-- 3. Table des projets Aura
CREATE TABLE IF NOT EXISTS public.aura_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#078348',
  icon TEXT DEFAULT 'fa-regular fa-folder-open',
  system_context TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_projects_user_id ON public.aura_projects(user_id);

-- 4. Table des conversations et livrables Aura Studio (Code, Images, Vidéos, Slides)
CREATE TABLE IF NOT EXISTS public.aura_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  project_id TEXT,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_conversations_user_id ON public.aura_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_conversations_updated_at ON public.aura_conversations(updated_at DESC);

-- 5. Table des missions Aura
CREATE TABLE IF NOT EXISTS public.aura_missions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT DEFAULT '',
  status TEXT DEFAULT 'in_progress',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_missions_user_id ON public.aura_missions(user_id);

-- 6. Table de la bibliothèque (Livrables & extraits sauvegardés)
CREATE TABLE IF NOT EXISTS public.aura_library (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  conversation_id TEXT,
  message_id TEXT,
  type TEXT NOT NULL DEFAULT 'saved_response',
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'chat',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_library_user_id ON public.aura_library(user_id);

-- 7. Table des quotas et métriques d'usage par utilisateur
CREATE TABLE IF NOT EXISTS public.aura_usage (
  user_id TEXT PRIMARY KEY REFERENCES public.aura_users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  requests_used INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 50,
  estimated_input_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_output_tokens INTEGER NOT NULL DEFAULT 0,
  by_mode JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  recent_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
