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
  monthly_units_used INTEGER NOT NULL DEFAULT 0,
  monthly_units_limit INTEGER NOT NULL DEFAULT 30,
  web_searches_used INTEGER NOT NULL DEFAULT 0,
  web_searches_limit INTEGER NOT NULL DEFAULT 10,
  site_creations_used INTEGER NOT NULL DEFAULT 0,
  site_creations_limit INTEGER NOT NULL DEFAULT 3,
  site_modifications_used INTEGER NOT NULL DEFAULT 0,
  site_modifications_limit INTEGER NOT NULL DEFAULT 10,
  estimated_input_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_output_tokens INTEGER NOT NULL DEFAULT 0,
  by_mode JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_category JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  recent_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table des abonnements (Aura Free, Plus, Pro)
CREATE TABLE IF NOT EXISTS public.aura_subscriptions (
  user_id TEXT PRIMARY KEY REFERENCES public.aura_users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  payment_provider TEXT DEFAULT 'none',
  external_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_subscriptions_plan ON public.aura_subscriptions(plan_id);

-- 9. Table du registre d'audit de consommation IA (Usage Ledger)
CREATE TABLE IF NOT EXISTS public.aura_usage_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  operation_id TEXT NOT NULL,
  category TEXT NOT NULL,
  units_deducted INTEGER NOT NULL DEFAULT 0,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'committed',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_ledger_user ON public.aura_usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_ledger_created ON public.aura_usage_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aura_ledger_operation ON public.aura_usage_ledger(operation_id);

-- 10. Table des événements de facturation et webhooks idempotents
CREATE TABLE IF NOT EXISTS public.aura_billing_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Table des projets Aura Studio (fichiers, versions, exécutions de génération)
-- Chaque projet appartient strictement à un utilisateur (owner checks côté serveur + RLS).
CREATE TABLE IF NOT EXISTS public.aura_studio_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.aura_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT 'site-web',
  status TEXT NOT NULL DEFAULT 'draft',
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_build_status TEXT NOT NULL DEFAULT 'unknown',
  last_build_error TEXT,
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  generation_runs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_studio_projects_user ON public.aura_studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_aura_studio_projects_updated ON public.aura_studio_projects(updated_at DESC);

-- 12. Messages de contact / liste d'attente (persistance réelle des formulaires publics)
CREATE TABLE IF NOT EXISTS public.aura_contact_messages (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'contact',
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aura_contact_created ON public.aura_contact_messages(created_at DESC);

-- Politiques RLS : accès strictement personnel pour les projets Studio.
ALTER TABLE public.aura_studio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_projects_select_own" ON public.aura_studio_projects
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "studio_projects_insert_own" ON public.aura_studio_projects
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "studio_projects_update_own" ON public.aura_studio_projects
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "studio_projects_delete_own" ON public.aura_studio_projects
  FOR DELETE USING (auth.uid()::text = user_id);
